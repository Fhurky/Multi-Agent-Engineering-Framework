# ADR-0019: Durable-intent receipts for process and workspace side effects

- Status: Accepted
- Date: 2026-08-05
- Deciders: Solution Architect under TASK-024
- Affects: TASK-004 implements the three-phase worker handshake; TASK-017 implements the split-phase workspace operations; TASK-003 issues receipts from the append path; TASK-006 and TASK-008 drive both sequences
- Supersedes in part: [ADR-0014](0014-live-run-control-and-process-tree-ownership.md) — its durable-identity-before-the-spawn decision as expressed through a single `AgentWorker.execute` call and a `spawnOwned` pre-condition no caller could discharge. [ADR-0011](0011-agent-workspace-lifecycle-module.md) — its four single-call operations and the intent-then-commit pairing they promised. Everything else in both records stands: owned groups per platform, bounded escalation, verified exit, identity by pid and start time, the four structural prohibitions, the session-token rule, script delegation, and the failure-classification-by-artifact-observation rule.

## Context

Findings **A-102** and **A-103** in `reports/code-review/TASK-016-ARCHITECTURE-AMENDMENT-REVIEW.md`, both rated high, are the same defect at two boundaries: a document requires an intent to be durable before a side effect, and the interface offers no seam at which the intent could be made durable.

**A-102, the process boundary.** `ProcessTreeController.spawnOwned` states that its caller must have durably appended `ProcessGroupRegistered`. `AgentWorker.execute` is a single opaque call. Workers receive no append callback and no state-store authority, and the architecture says in several places that workers never write durable state. So TASK-004 cannot both own the spawn and guarantee that the invocation identity is durable before it. The TASK-016 sequence diagram resolved the gap by showing the worker appending directly, which violates the declared module boundary — and a diagram that contradicts a boundary is evidence that the boundary is unimplementable, not that the diagram is careless.

**A-103, the workspace boundary.** The workspace contract requires prepare, finalize, and abandon intent to be durable before scripts or Git mutate anything. The interface exposes each as one method that returns its events only *after* the operation, and the module is forbidden to append them itself. There is no callback and no split phase. A crash during a script or a Git operation can therefore leave a branch, worktree, lock, commit, or publication side effect with no durable intent for `reconcile` to discover through the promised state model. `abandon` was additionally missing an intent event entirely: the union held `WorkspaceAbandoned` and nothing that entered `abandoning`.

Both are the same shape, so they get the same mechanism. Two mechanisms for one property would be two things to review and two ways to be wrong.

## Decision

**Every mutating operation whose intent must be durable is split into a `plan` phase and an `execute` phase, and the `execute` phase takes a receipt.**

```text
1. supervisor:  plan    = module.planX(request)      pure; no process, no filesystem, no git
2. supervisor:  append(plan.intentEvent)             durable
3. supervisor:  receipt = appendResult.receipts[i]   issued only after the batch commit record
4. supervisor:  result  = await module.executeX(plan, receipt)
```

**A `DurableAppendReceipt` is evidence, not authority.** It is issued only by `StateStore.append`, only after the fsync that carries the batch commit record, and it carries the event type, the `stateVersion` the event produced, the writer epoch, and the `batchId`. It exposes no method that writes. A module holding one has proof that a named event is durable and has gained no ability to make one.

**Applied to the process boundary,** `AgentWorker` becomes three phases — `planInvocation`, `beginInvocation`, `completeInvocation` — and `ProcessTreeController.spawnOwned` takes a `ProcessGroupRegistrationReceipt` parameter. There is no overload without one, so a spawn before a durable registration is not expressible. The supervisor appends `ProcessGroupRegistered` between phases 1 and 2 and `ProcessGroupBound` immediately after phase 2 returns, so the unbound window stays exactly one append wide and no worker appends anything.

**Applied to the workspace boundary,** `WorkspaceLifecycle` becomes `planPrepare`/`executePrepare`, `planFinalize`/`executeFinalize`, and `planAbandon`/`executeAbandon`, plus the unchanged `reconcile`. Each `execute` refuses without a matching `WorkspaceIntentReceipt`, returning `failed` with code `INTENT_NOT_DURABLE` and invoking no script and no Git command.

**`WorkspaceAbandonIntended` is added and enters `abandoning`.** `WorkspaceAbandoned` leaves it. All four intent-bearing workspace states now have exactly one entering event.

**The repository access paths are stated once, normatively, in [WORKSPACE-LIFECYCLE.md](../architecture/runtime/WORKSPACE-LIFECYCLE.md#repository-access-paths).** The workspace module delegates every operation the human-controlled scripts define — hooks, worktree, branch, lock, scope validation — and performs `git add`, `git commit`, `git push` of one derived refspec, and pull-request look-up-then-create directly. Finding A-105 recorded that the component diagram claimed the module reaches the repository *only* through the scripts, which the contract and the finalize sequence both contradict. The contract is stated here and the diagram states the same thing.

## Alternatives considered

**Give the worker and the workspace module an append callback.** The supervisor passes `append(event): Promise<Receipt>`, and the module calls it at the right moment. Rejected: it inverts control into the module, so the module decides *when* durability happens and the supervisor can no longer read the sequence from its own code. It also hands the module a live function that writes durable state, which is the authority the boundary exists to withhold — the fact that the function came from the supervisor does not make it less of a write path once it is in the module's hands. The split-phase version puts the append in the supervisor's own body, where a reviewer reading `supervisor/` sees the whole ordering.

**Give the modules the `StateStore` and trust them to append only their own events.** Simplest possible, and the modules are written by the same team. Rejected: "only one module mutates durable state" is the rule every other guarantee in this architecture is built on. Weakening it for two callers weakens it for all of them, and the reviewer's check changes from "does `src/agents/` import the store" — a grep — to "does `src/agents/` use the store correctly" — a reading.

**Let the supervisor append the intent and then call the single-call operation, without a receipt.** Nearly free: the ordering would be correct in the supervisor's code, and the module would simply be called afterwards. Rejected: it makes the ordering a convention rather than a signature. A future caller — recovery, a retry path, a test harness — can call the operation without the append, and nothing detects it. The receipt parameter turns "the caller must have appended" from a comment into a type error, which is precisely what A-102 asked for.

**Return the intent event from a first call and have the module hold internal state until a second call.** Fewer types than a plan object. Rejected: it makes the module stateful across calls, so two concurrent dispatches for different tasks share mutable module state, and a crash between the calls leaves the module's memory as the only record of what was planned. A plan is inert data; holding one performs nothing and losing one costs nothing.

**Reuse the effect ledger for workspace intents instead of adding events.** The ledger already models intent-then-commit. Rejected: the ledger's states are about whether an *external effect* happened and whether it is safe to re-execute, and its consumers are the retry and recovery policies. Workspace states are about what `reconcile` should do to a worktree, a branch, and a lock. Overloading one mechanism with two vocabularies would make `intended` mean two different things depending on who read it.

**Leave `abandon` without an intent event and treat abandonment as best-effort.** Abandonment is cleanup; a partially cleaned workspace is not obviously worse than an uncleaned one. Rejected: it is exactly the case where the intent matters most. Abandonment releases locks and removes worktrees, so a crash inside it can leave a lock held by nobody or a worktree half-removed, and `reconcile` cannot distinguish "abandonment was in progress" from "nothing ever happened here" without a record. That distinction decides whether the conservative rules apply.

## Consequences

Positive:

- "The intent is durable before the side effect" is a property of the call signature at both boundaries, checkable by reading one interface rather than by auditing every call site.
- No worker and no workspace operation appends durable state, so the diagrams can show the real sequence without contradicting a module boundary — which removes the reason the TASK-016 diagram violated one.
- A crash anywhere inside an `execute` phase leaves a durable intent, so `reconcile` always has a record to act on. That is the guarantee A-103 said the interface could not deliver.
- A refusal in a `plan` phase costs nothing: no intent exists, so a refused dispatch leaves no workspace record and no invocation record to reconcile.
- `abandoning` is reachable, so the workspace state machine is total over its own events.
- One mechanism covers both boundaries, so a reviewer learns it once.

Negative:

- Two interfaces gain three methods each where they had one and four. TASK-004 and TASK-017 both have more surface to implement and more to test, and a caller must get a three-step sequence right rather than making one call.
- `AppendResult` grows a `receipts` array on every successful append, including the overwhelming majority of appends whose receipts nobody reads. It is small and it is discarded immediately, but it is allocation the previous shape did not do.
- The receipt is checked at run time, not by the type system: a caller can construct a structurally valid receipt object for the wrong invocation. The `execute` phases therefore verify the identifier and the writer epoch and refuse on a mismatch, which is a run-time check that a stronger nominal type system would not need.
- The plan objects duplicate some request data, so a reviewer reads the same field names in two shapes. The alternative was module-held state, which is worse in every failure mode.
- Splitting `abandon` means an abandonment that races a crash now leaves an `abandoning` record that `reconcile` must resolve, where previously it left nothing. That is more work for recovery and it is the entire point.
