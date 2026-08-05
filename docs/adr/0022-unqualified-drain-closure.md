# ADR-0022: A drain that cannot return with a surviving descendant

- Status: Accepted; superseded in part by [ADR-0026](0026-blocked-drain-attach-and-unverified-closure-recovery.md), which makes both blocked-drain states attachable and changes recovery selection from absent closure to unverified closure. Every other decision below stands.
- Date: 2026-08-05
- Deciders: Solution Architect under TASK-024
- Affects: TASK-007 implements the drain and the exit codes; TASK-004 implements the re-escalation inside the total budget; TASK-006 owns the transition table; TASK-008 terminates the survivors on the next attach
- Supersedes in part: [ADR-0014](0014-live-run-control-and-process-tree-ownership.md) — its clause that "`verifiedExit: false` is recorded as `orphan_unresolved` and reported" as a terminal outcome compatible with a completed drain, and the qualification it added to the pause post-condition. ADR-0014's owned groups per platform, durable identity before the spawn, bounded escalation, verification by polling, identity by pid and start time, unconditional fencing at recovery, and the whole live-run control protocol stand unchanged.

## Context

Finding **A-102** in `reports/code-review/TASK-016-ARCHITECTURE-AMENDMENT-REVIEW.md` has two halves. The first — that no interface could persist process registration before the worker-owned spawn — is decided in [ADR-0019](0019-durable-intent-receipts-for-side-effects.md). This record decides the second.

TASK-016 stated the pause post-condition as: *no unmanaged descendant of any invocation of this writer epoch remains, **except** one recorded as `orphan_unresolved` with its reason.* The reviewer's requirement was unqualified: no unmanaged descendant survives the command. An exception that permits a surviving descendant is not a post-condition about descendants — it is a post-condition about record-keeping.

The gap matters because of what the descendant is. A detached `claude`, `codex`, or `gemini` process holds no lease, answers to no epoch, appears in no record, and keeps editing a worktree and consuming quota. ADR-0014 established all of that as its own motivation, then permitted the outcome anyway on the ground that POSIX offers no kill-on-close guarantee. The permission is what this record removes; the platform limitation is real and is handled rather than denied.

The residual is genuinely small — on Windows the job object's kill-on-close limit makes it unreachable, and on POSIX it requires a tree that survives forced termination and verification. But "small" is not "absent", and a post-condition that a reader must qualify is one a reviewer cannot check.

## Decision

**`RunDrainCompleted` requires verified closure of every invocation of the current writer epoch.** Its guard is that every such invocation has a durable `ProcessGroupClosed` with `verifiedExit: true`. The event additionally carries `treeClosure: 'all_verified'`, so the claim is in the record rather than only in the guard.

**Cancellation re-escalates inside a total budget.** `TreeCancelDeadlines` gains `treeCloseTotalBudgetMs`, and `cancelTree` repeats forced termination and verification until exit is verified or the budget is exhausted. A single verification timeout is no longer the end of the attempt; one timed-out poll is weak evidence that a tree is unkillable.

**An unverified tree is a failed drain, not a permitted exception.** When the budget is exhausted with any invocation unverified, the runtime appends `RunDrainBlocked { intent, reason: 'unverified_process_tree', unresolvedInvocationIds }`, writes a checkpoint, releases the writer lock, and the command exits **5**. The run stays in `pausing` or `draining`; it does **not** reach `paused` or `cancelled`.

**The post-condition becomes unqualified by making its antecedent unreachable.** `pause` returns a paused run only when every tree is verified closed. There is no outcome under which the command returns a paused or cancelled run with an unmanaged descendant, because in that case it does not return one.

**Exit code 5 is distinct from 4.** 4 means the run never started; 5 means the run is intact and durable but its process trees could not be verified closed, so an automation wrapper must resume rather than retry the pause. The Turkish operator message names the run, states that provider processes may still be running, and directs the operator to resume.

**The next attach terminates the survivors.** Phase 5 of [CRASH-RECOVERY.md](../architecture/runtime/CRASH-RECOVERY.md) fences unconditionally and terminates when the invocation was bound and its identity verifies, which is the path that already exists for a crashed run. A blocked drain is handled by the same code as a crash, which is the one-path principle ADR-0009 established.

## Alternatives considered

**Wait indefinitely until every tree is verified closed.** It makes the post-condition true by construction and needs no new event. Rejected: it makes `pause` unbounded, which contradicts the drain's own bounded-return guarantee and hands the operator a command that can hang forever on a process the kernel will not reap. A bounded failure is strictly better than an unbounded success.

**Keep the exception and strengthen the wording — "no unmanaged descendant except a recorded one, and the record is a blocking finding".** The smallest change, and it preserves every existing code path. Rejected: it relabels the problem. A reviewer checking the post-condition still has to read a qualification, and an operator still receives a run reported as paused while a process edits its worktree. The finding asked for the unqualified criterion, and reaffirming the exception with sharper prose is not that.

**Fail the run rather than blocking the drain — transition to `failed` with `terminalReason.code = 'drain_failed'`.** It is unambiguous and it needs no new run state semantics. Rejected: the run is not failed. Its state is durable, its checkpoint is valid, every completed task is recorded, and resuming it is both safe and the correct next action. Marking it failed would destroy resumability over a process-lifecycle problem the next attach resolves in seconds, which is a much worse outcome than the one it prevents.

**Escalate beyond `SIGKILL` — reparent, use `cgroups` on Linux, or `PROC_PDEATHSIG`.** It would close the POSIX gap on the platforms that offer the primitives. Rejected for now: each is platform-specific and none is portable across the POSIX systems this runtime targets, so the module would gain several conditional termination paths to close a residual that recovery already handles. Recorded as a possible future decision rather than a rejected-forever alternative, alongside ADR-0014's watchdog-process idea.

**Reuse exit code 4 for a blocked drain.** One fewer code, and both are "the command did not do what you asked". Rejected: 4 and 5 require opposite responses. 4 means fix the configuration and retry; 5 means resume the run, which will terminate the survivors. An automation wrapper that cannot distinguish them will retry a pause that cannot succeed until a resume happens.

**Emit `RunDrainCompleted` with `treeClosure: 'unresolved'` and let the caller decide.** It keeps one completion event and puts the judgment at the edge. Rejected: it leaves the run in `paused` while descendants may be alive, so the state itself becomes a lie regardless of what the caller does with the field. The state must not claim closure that did not happen.

## Consequences

Positive:

- The pause and stop post-condition is unqualified and checkable: no journal contains a `RunDrainCompleted` alongside an invocation of the same epoch whose `verifiedExit` is false. That is a static property a reviewer, a security reviewer, and QA can each check independently, recorded as invariant I23.
- `pause` and `stop` mean what they say. When the command returns a paused run, nothing of that run is still running.
- The POSIX residual is reported rather than absorbed. An operator learns that processes may survive, in Turkish, with the invocations named, instead of receiving a clean-looking result.
- Re-escalation inside a budget means a tree that merely needed a second forced signal is closed rather than reported, so the blocked outcome is rarer than a single-shot verification would make it.
- A blocked drain reaches recovery as an ordinary attach, so no new recovery path exists to test.

Negative:

- Worst-case `pause` latency grows from `drainTimeoutMs + processTreeCloseTimeoutMs` to `drainTimeoutMs + processTreeCloseTotalBudgetMs`, 60 s by default rather than 20 s. That is the price of not reporting an unverified tree as closed.
- A sixth exit code, and one more outcome an automation wrapper must handle. The alternative was an outcome it could not distinguish from success.
- A run can now be left in `pausing` with the writer lock released, which is a state that previously did not occur outside a crash. It is recovered by the same attach path as a crash, and the state is durable and checkpointed, but it is one more shape an operator may encounter.
- An operator who wanted the run paused now sometimes has to resume it first. That is a real inconvenience, and it is the honest report of a real condition: the run could not be safely quiesced.
