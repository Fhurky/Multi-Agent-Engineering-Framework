# ADR-0014: Live-run control protocol and OS process-tree ownership

- Status: Accepted; superseded in part by [ADR-0019](0019-durable-intent-receipts-for-side-effects.md), which replaces the single opaque `AgentWorker.execute` call and the undischargeable `spawnOwned` pre-condition with a three-phase handshake behind a registration receipt, and by [ADR-0022](0022-unqualified-drain-closure.md), which removes the exception permitting a completed drain alongside a surviving `orphan_unresolved` descendant. Every other decision below stands as written.
- Date: 2026-08-05
- Deciders: Solution Architect under TASK-016
- Affects: TASK-007 owns live-run control; TASK-004 owns process-tree lifecycle; TASK-006 and TASK-008 consume both
- Supersedes in part: [ADR-0009](0009-graceful-pause-drain-and-crash-recovery.md) — its rule that in-flight work is never killed at the drain deadline, and its "Kill in-flight workers at the drain deadline" rejection. ADR-0009's one-drain-two-intents model, resume-through-recovery rule, and equivalence claim stand.

## Context

Finding A-003 in `reports/code-review/TASK-002-ARCHITECTURE-REVIEW.md`, rated high, recorded two unowned responsibilities. It is also the finding that made one TASK-002 acceptance criterion `not met`: both are required runtime responsibilities with no owning module or interface.

**Live-run control was named but not specified.** The lifecycle document said a second `pause` or `stop` "delivers a control request to a running foreground supervisor" and stopped there. It defined no transport, no request identity, no acknowledgement, no durable ordering, no ownership or authentication check, and no stale-request behavior. An implementer cannot build that, and two implementers would build two incompatible things.

**Nothing owned the OS process tree.** The drain deadline deliberately abandoned in-flight tasks, and the design's answer to a returning worker was fencing. Fencing is the right answer to a stale **write to run state** and no answer at all to a detached `claude`, `codex`, or `gemini` process that keeps consuming quota, editing a worktree, and performing external effects after the supervisor has exited. That process holds no lease, answers to no epoch, and appears in no record. The gap is widest exactly where the design claimed strength: `pause` returned reporting a clean, resumable run while its children were still writing files.

## Decision

### Live-run control — owned by TASK-007

**Transport: a durable file-based control inbox** at `<runDir>/control/`, with requests and acknowledgements written by tmp-write, fsync, atomic rename, and directory fsync — the same three filesystem primitives the checkpoint protocol already requires.

**Request identity** is `"ctl-" + first16HexOf(sha256(canonicalJson({runId, kind, requestedBy, requestedAtIso, clientNonce})))`, validated against a strict pattern before it is used in any path. `kind` is drawn from the closed set `pause | stop | status_probe`.

**Durable ordering is journal order.** The control directory is a transport, not a queue. The supervisor reads all pending requests once per loop iteration, sorts them by `(requestedAt, requestId)`, and appends `ControlRequestAccepted` before the run transition each implies. `stop` outranks `pause` within a pass regardless of timestamp, because escalation is legal and de-escalation is not, and resolving the pair by timestamp would make the outcome depend on clock skew between two CLI invocations.

**Exactly-once acceptance** follows from `ControlRequestAccepted` recording `requestId` durably; a duplicate is rejected by the transition function.

**Ownership check:** a request carries `runId` and the `targetWriterEpoch` its sender read from `writer.lock`. A mismatch is `rejected_stale`.

**The trust boundary is stated plainly.** The run directory's filesystem permissions are the authentication boundary; the runtime is a single-writer, single-machine process and does not implement a second scheme on top of the one the operating system enforces. What it does do is treat every request as untrusted input: a closed `kind` set, a pattern-validated identifier, a size bound, no request field ever used to construct a path or a command vector, and `requestedBy` recorded as an opaque label rather than an authorization claim.

**Stale requests are rejected and swept**, by the supervisor on each pass and by recovery on each attach, on four conditions: superseded epoch, age beyond `controlRequestTtlMs`, already-accepted identifier, and terminal run.

### OS process-tree ownership — owned by TASK-004

**Durable identity before the spawn.** `ProcessGroupRegistered` is appended and durable before any process exists; `ProcessGroupBound` records the pid, the group reference, and the process start time immediately after; `ProcessGroupClosed` records the outcome after a verified exit.

**An owned group per platform.** On Windows, a named Job Object created **before** the spawn with `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE`; the child is created suspended, assigned, then resumed, so no descendant can escape between creation and assignment. On POSIX, the child is spawned detached into a new process group whose pgid equals its pid, and signals are sent to the negated pgid.

The Windows choice carries a guarantee POSIX cannot match: when the supervisor dies, the last job handle closes and the kernel terminates the entire tree. A crash on Windows cannot leave a descendant behind.

**Bounded escalation with verified exit:** cooperative abort, then graceful termination of the whole group bounded by `gracefulCancelGraceMs`, then forced termination — `SIGKILL` to the group or `TerminateJobObject` — then verification by polling until `treeExitVerifyTimeoutMs`. `verifiedExit: false` is recorded as `orphan_unresolved`, never treated as success.

**Identity is verified by pid and process start time** before any signal, so a reused pid is never targeted.

**The outcome is persisted before the writer lock is released.** `releaseWriter` must not be called and `RunDrainCompleted` must not be emitted while any invocation of the current epoch lacks a durable `ProcessGroupClosed`.

**Pause may leave resumable task state and may not return while an unmanaged descendant remains.** This supersedes ADR-0009's rule that in-flight work is never killed at the drain deadline. Task-level treatment is unchanged — leases lapse, identifiers are recorded in `abandonedTaskIds`, the next attach reconciles them — but the process trees are terminated.

**Recovery fences unconditionally and terminates when it can.** Every orphan belonging to a recorded invocation is fenced by the superseded token and the advanced epoch, so it cannot mutate state. It is terminated when the invocation was bound and its identity verifies; otherwise the outcome is `orphan_unresolved` with a reason, and the case is reported rather than guessed at.

## Alternatives considered

### For the control transport

**A local socket or named pipe.** The conventional answer and lower latency. Rejected: naming, permissions, and lifetime diverge between Windows and POSIX; it adds a listening endpoint to the security review surface; and it vanishes when the supervisor dies, so a request sent during a crash window is simply lost with no record that it was ever made.

**Operating-system signals.** Zero new machinery. Rejected: a signal cannot carry a request identity, cannot be acknowledged, cannot be ordered, and has no cross-platform equivalent for a directed non-fatal signal on Windows. Every one of the five properties the finding required is impossible to express.

**A control table inside the journal itself, written by the CLI.** Attractive because ordering would be trivial. Rejected: it would require a second writer to the journal, and the whole durability model rests on there being exactly one. The CLI would have to take the writer lock, which the live supervisor holds.

**A polling interval on a plain unsynchronized file.** Simplest possible. Rejected: a partially written request is readable, which is the class of bug atomic rename exists to remove.

### For process ownership

**Rely on the abort signal and adapter cooperation.** What TASK-002 effectively assumed. Rejected: agent CLIs routinely trap interrupts to flush state, and a non-cooperating adapter is the case that matters. An unenforceable rule is not a contract.

**Kill only the direct child.** Simple and needs no group. Rejected: the finding's own scenario is a child that spawns a grandchild. Killing the child orphans the grandchild to init, which is the worst outcome — still running, no longer attributable to anything.

**Leave the tree alive, as ADR-0009 decided, and rely on fencing.** Its reasoning about the effect ledger was sound: killing an agent mid-effect manufactures indeterminate effects, and non-idempotent ones require a human. Rejected on new evidence. Fencing protects run state and nothing else. The alternative it was compared against was never "kill versus not kill" but "a bounded, recorded indeterminacy the ledger already models versus an unbounded, invisible one it cannot see". A detached agent editing a worktree after the supervisor exited corrupts work no fencing token guards.

**Terminate at the drain deadline but skip verification.** Cheaper, and usually right. Rejected: "we sent a signal" is not "the tree is gone", and the pause post-condition is worth nothing if it is not checked. Verification is a bounded poll of a syscall.

**A watchdog process that outlives the supervisor and cleans up.** Would cover the POSIX crash case that kill-on-close covers on Windows. Rejected for now: it adds a second long-lived process, its own lifecycle, and its own crash story, to close a window that is one append wide. Recorded as a possible future decision rather than as a rejected-forever alternative.

## Consequences

Positive:

- Both responsibilities have exactly one owner and an explicit interface, which is what the `not met` acceptance criterion required.
- `pause` and `stop` now mean what they say: when the command returns, nothing of the run is still running.
- The control protocol is durable and inspectable, so an unconsumed request is visible during a QA or security gate rather than being invisible in a socket that no longer exists.
- On Windows the strongest case is free: a supervisor crash cannot leave a descendant behind.
- Every orphan is either terminated or recorded with a reason, and in both cases fenced.

Negative:

- Terminating at the drain deadline will produce more `indeterminate_effect` escalations than the superseded design, and non-idempotent ones require a human. This is the cost ADR-0009 was trying to avoid; it is accepted because the alternative cost is unbounded and unrecorded. QA must exercise it.
- POSIX retains a residual: a crash in the one-append window between registration and binding leaves an orphan that recovery can fence but not identify. It is recorded as an accepted risk with an owner and a test.
- The runtime gains platform-specific process code — job objects on Windows, process groups and signals on POSIX — in a module that was otherwise portable. It is confined to one interface with two implementations.
- Drain gains a second bounded wait, so the worst-case `pause` latency is `drainTimeoutMs + processTreeCloseTimeoutMs` rather than `drainTimeoutMs`.
- The second-interrupt escape hatch now has a stated cost: it bypasses the tree-close wait, so on POSIX it can leave descendants that the next attach must handle. The operator is told this at the first interrupt rather than discovering it later.
