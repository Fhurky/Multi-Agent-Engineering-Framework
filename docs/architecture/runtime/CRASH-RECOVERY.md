# Crash Recovery

Normative recovery contract for the autonomous runtime. Produced under TASK-002 and amended under TASK-016, TASK-024, TASK-028, TASK-032, TASK-034, and TASK-036. Related decisions: [ADR-0009](../../adr/0009-graceful-pause-drain-and-crash-recovery.md) as superseded in part by [ADR-0013](../../adr/0013-single-decision-recovery-reconciliation.md) and [ADR-0014](../../adr/0014-live-run-control-and-process-tree-ownership.md), plus [ADR-0011](../../adr/0011-agent-workspace-lifecycle-module.md), [ADR-0012](../../adr/0012-crash-atomic-journal-batches-with-commit-records.md), [ADR-0019](../../adr/0019-durable-intent-receipts-for-side-effects.md), [ADR-0020](../../adr/0020-durable-adoptable-results-for-recovery.md), [ADR-0022](../../adr/0022-unqualified-drain-closure.md), TASK-028 ADRs [0026](../../adr/0026-blocked-drain-attach-and-unverified-closure-recovery.md) and [0030](../../adr/0030-one-canonical-recovery-decision-input-domain.md), [ADR-0033](../../adr/0033-unique-committed-result-effect-recovery.md), [ADR-0035](../../adr/0035-explicit-reconciliation-evidence-composition-boundary.md), and [ADR-0037](../../adr/0037-recovery-completion-evidence-and-decision-block-legality.md). Implemented by TASK-008, with workspace reconciliation delegated to the module TASK-017 owns.

## Amendment register - TASK-036

| Superseded claim (TASK-034) | Superseded by | Finding | Decision |
|---|---|---|---|
| Every event in a recovery batch was called legal from the restored state and no two events could address one task | One decision block per task; the first event is legal from restored state and later events are sequentially legal inside the fixed block | A-502 | [ADR-0037](../../adr/0037-recovery-completion-evidence-and-decision-block-legality.md) |
| Phase 8 required a five-array event literal that the public event union could not express | Exact `RunRecoveryCompletedEvent` shares `RecoveryCompletionEvidence` with successful `RecoveryOutcome` and records all five arrays durably | A-501 | [ADR-0037](../../adr/0037-recovery-completion-evidence-and-decision-block-legality.md) |

## Amendment register — TASK-034

| Superseded claim (TASK-032) | Superseded by | Finding | Decision |
|---|---|---|---|
| Recovery was said to construct the complete canonical input although its builder received neither current writer epoch nor pending-result evidence | The coordinator explicitly supplies both through `ReconciliationBuildEvidence`; the pure builder derives all six fields and may not read the restored run implicitly | A-401 (A-104 residue) | [ADR-0035](../../adr/0035-explicit-reconciliation-evidence-composition-boundary.md) |

## Amendment register — TASK-032

| Superseded claim (TASK-028) | Superseded by | Finding | Decision |
|---|---|---|---|
| Any committed current-attempt ledger entry could reduce to the adoption state | Adoption requires the exact unique flagged result effect to be committed; the builder carries its `effectId` and rejects duplicates rather than selecting one | A-203 (A-104 view) | [ADR-0033](../../adr/0033-unique-committed-result-effect-recovery.md) |

## Amendment register — TASK-028

| Superseded claim (TASK-024) | Superseded by | Finding | Decision |
|---|---|---|---|
| Recovery was described as a total function over four inputs while its rows and tests also branched on activation and adoptable-result presence | One canonical six-member `ReconciliationInput` used by the interface, decision table, and exhaustive test | A-208 | [ADR-0030](../../adr/0030-one-canonical-recovery-decision-input-domain.md) |
| A blocked drain was said to reach recovery as an ordinary attach, but `RunResumeRequested` was illegal from `pausing` and `draining` | Attach is legal from both blocked-drain states when their writer epoch is stale; the original drain intent is retained and reissued after recovery | A-204 | [ADR-0026](../../adr/0026-blocked-drain-attach-and-unverified-closure-recovery.md) |
| Phase 5 selected only registrations with no `ProcessGroupClosed` | Phase 5 selects every invocation whose latest closure is absent or has `verifiedExit: false`; a verified recovery closure supersedes the unverified one | A-204 | [ADR-0026](../../adr/0026-blocked-drain-attach-and-unverified-closure-recovery.md) |

## Amendment register — TASK-024

| Superseded claim (TASK-016) | Superseded by | Finding | Decision |
|---|---|---|---|
| Phase 4's `adopt` decision, which could not build `WorkerSucceeded` from a `resultDigest` alone | [Phase 4](#phase-4--reconcile-in-one-decision-per-task) reading a durable `AdoptableResult`, with an explicit escalation when one is absent | A-104 | [ADR-0020](../../adr/0020-durable-adoptable-results-for-recovery.md) |
| "Every workspace with a durable prepare or finalize intent" — abandonment had no intent to find | I15 restated over **prepare, finalize, and abandon** intents, all three of which are now durable before their side effects | A-103 | [ADR-0019](../../adr/0019-durable-intent-receipts-for-side-effects.md) |
| A drain that could complete with an unverified process tree, leaving recovery to discover it | A drain that cannot; the unverified case is `RunDrainBlocked` and reaches recovery as an ordinary attach | A-102 | [ADR-0022](../../adr/0022-unqualified-drain-closure.md) |
| The ingress model's crash story, expressed over `run.activationEvents` | [What a crash can leave behind](#what-a-crash-can-leave-behind) and I20 … I22, over the durable inbox, the cursor, and the consumption ledger | A-101, F-301 | [ADR-0017](../../adr/0017-durable-ingress-inbox-and-ingress-epochs.md) |

## Amendment register — TASK-016

| Superseded claim (TASK-002) | Superseded by | Decision |
|---|---|---|
| Journal post-crash state "Complete; or with one torn trailing line that was never acknowledged" | [What a crash can leave behind](#what-a-crash-can-leave-behind): an uncommitted trailing **batch** of any size, and a valid prefix of one | [ADR-0012](../../adr/0012-crash-atomic-journal-batches-with-commit-records.md) |
| I1, stated over "the last complete, checksum-valid line" | I1 restated over the last **committed batch boundary** | [ADR-0012](../../adr/0012-crash-atomic-journal-batches-with-commit-records.md) |
| Phases 4, 5, and 6 emitting separate events for the same task in one batch | [Phase 4 — reconcile](#phase-4--reconcile-in-one-decision-per-task), one decision per task | [ADR-0013](../../adr/0013-single-decision-recovery-reconciliation.md) |
| "Provider work: Completed and unreported, in flight, or never started", with no owner for a surviving OS process tree | [Phase 5 — fence or terminate orphan process trees](#phase-5--fence-or-terminate-orphan-process-trees) | [ADR-0014](../../adr/0014-live-run-control-and-process-tree-ownership.md) |
| No post-crash treatment of worktrees, task branches, task locks, or publication identity | [Phase 6 — reconcile workspaces](#phase-6--reconcile-workspaces) and invariants I13 through I18 | [ADR-0011](../../adr/0011-agent-workspace-lifecycle-module.md) |

## Failure model

The runtime assumes **fail-stop with no warning**: the process may be terminated at any instruction boundary, including between a filesystem write and its fsync, and including while a provider invocation is in flight. It does not assume a shutdown hook runs, and it does not assume the machine survives.

Out of scope: a corrupted or lying filesystem, a clock that moves backwards across a restart by more than one lease TTL, and byzantine agents. The first two are recorded as accepted risks; the third is governed by review gates rather than by the runtime.

## What a crash can leave behind

| Artifact | Possible post-crash states |
|---|---|
| Journal | Ending at a committed batch boundary; or followed by an uncommitted trailing batch, which may be a complete-looking prefix of event lines, a torn line, a line with a hole in it, or a torn commit record. None of it was ever acknowledged |
| Checkpoint | Valid; or a stray `.tmp`; or a new file that `LATEST` does not yet name |
| `LATEST` | Old value, new value, or unparsable |
| Leases in the record | Held by a process that no longer exists |
| Effects | None; intended but not committed; or committed |
| Provider work | Completed and unreported, in flight, or never started |
| Provider OS process tree | Fully exited; or alive, detached, and still holding a worktree — on Windows the job object's kill-on-close limit removes this case; on POSIX it does not |
| Control requests | An unconsumed request from a CLI that is gone, addressed to a writer epoch that no longer exists |
| Agent workspace | Prepare, finalize, or abandon intended but incomplete; prepared; finalized; abandoned; or an orphaned worktree, branch, or task lock with no owning session alive. Under TASK-024 every one of the three mutating operations has a durable intent, so there is no fourth column of "a side effect with no record" |
| Ingress inbox | Complete; or with an uncommitted trailing append that the inbox's own crash-safe append protocol discards. It never loses a committed entry and never renumbers one, so `max(seq)` after a crash is at least what it was before |
| Ingress cursor and consumption ledger | Both at the last committed batch boundary of the run journal, because both are advanced by one event in one batch. A crash between the observation and the consumption leaves the cursor where it was and the ledger without the range's rows |
| Adoptable result | Recorded for the current attempt whenever that attempt's result effect is `committed`, because `WorkerResultRecorded` precedes `EffectCommitted` |

Recovery must produce one consistent run from any combination of these.

## Recovery procedure

`RecoveryCoordinator.recover(runId, context)` runs on every attach — after a crash, after a pause, and after a drain deadline. There is one path, not three.

### Phase 1 — acquire the writer lock

Call `acquireWriter`. If it returns `WriterAlive`, abort with that error; a second supervisor must never attach to a live run. On success the writer epoch is strictly greater than the crashed process's epoch, so any append from a resurrected predecessor is rejected with `StaleWriterEpoch` from this moment on.

### Phase 2 — restore

Call `restore`. It resolves the newest checksum-valid checkpoint, replays the events of every committed batch after it through the transition function, discards the uncommitted trailing batch if one exists, and reports `fromCheckpoint`, `replayedEvents`, `discardedTrailingBytes`, `discardedUncommittedEvents`, and `lastCommittedBatchId`. If it returns `NoConsistentCheckpoint`, recovery fails and the run transitions to `failed` with `terminalReason.code = 'recovery_failed'`. It does not silently start over; destroying an operator's run state is worse than reporting that it cannot be read.

Immediately after a successful restore, and before any append, the writer truncates the journal at the end offset of `lastCommittedBatchId`, per [DURABLE-STATE-AND-CHECKPOINTS.md](DURABLE-STATE-AND-CHECKPOINTS.md). This is the only write recovery performs before Phase 3.

### Phase 3 — enter recovering

Append `RunResumeRequested{ writerEpoch }`. From `paused`, `running`, `pausing`, or `draining` this moves the run to `recovering` when the recorded writer epoch is stale. The latter two sources are legal only after `RunDrainBlocked`; the event retains that record's `intent` as the post-recovery drain intent. A run found in `running` with a stale writer epoch is by definition a crashed run.

### Phase 4 — reconcile in one decision per task

TASK-002 split this work into three phases — reclaim leases, reconcile effects, reconcile timeouts — that each emitted an event for the same task. Finding A-002 established that the combination is illegal: the lease-reclamation phase emitted `LeaseExpired`, moving a task to `ready`, and the two later phases then emitted `WorkerSucceeded`, `TaskBlocked`, or `TaskTimedOut`, which are legal only from `running`. The documented all-or-nothing batch therefore rejected ordinary crash cases instead of completing recovery. The phase numbers below are this document's current numbering and do not correspond to the superseded ones.

Recovery now computes **exactly one reconciliation decision block per task** from the restored record, and each decision expands to one fixed event sequence. The first event is legal from that task's restored pre-batch state; every later event is legal from the state produced by the preceding event in that same block. `ReconciliationInput` in [INTERFACE-CONTRACTS.md](INTERFACE-CONTRACTS.md) is the only decision-domain type; [ADR-0030](../../adr/0030-one-canonical-recovery-decision-input-domain.md) owns its cardinality, [ADR-0033](../../adr/0033-unique-committed-result-effect-recovery.md) owns the result-effect reduction, and [ADR-0035](../../adr/0035-explicit-reconciliation-evidence-composition-boundary.md) owns construction. For each task, the coordinator explicitly supplies `run.writerEpoch`, entries filtered to the exact task and attempt, the classified deadline, and `context.pendingResults[task.taskId] ?? null` to `ReconciliationInputBuilder.build`. The builder derives the remaining fields and returns `ReconciliationEvidence.resultEffectId`; it has no complete-run capability and performs no hidden read. That identity is context for constructing an adopted event, not a seventh decision axis. The table, priority order, `current_epoch` lease defect rule, and determinism rule are normative in [STATE-MACHINE.md](STATE-MACHINE.md#recovery-reconciliation-decisions).

The invariant that makes the batch legal by construction:

> No two decision blocks address the same task, every decision is computed from restored state, and no block is interleaved with another. Batch legality reduces to the fixed sequence's sequential legality inside each block and independence between blocks. Rows R4 and R7 therefore legally contain two task-addressed events: `TaskTimedOut` first reaches `awaiting_retry`, and `RetryScheduled` then records `notBefore` in that state.

Five consequences worth naming; the last two are added under TASK-024.

- **The separate lease-reclamation phase is gone.** A task whose decision is `adopt`, `escalate`, or a timeout keeps its lease record until the single emitted event clears it, so that event's fencing token check passes against the lease that is still there. Only the `reclaim` and `reclaim_activation` decisions emit `LeaseExpired`.
- **The separate timeout scan is gone.** `deadline` is one named member of `ReconciliationInput`, not a second pass. `TimeoutWatchdog.scan` is not run during recovery; it resumes its ordinary role in the run loop after Phase 8.
- **Only the unique committed result effect decides adoption.** `committed_result` means the one current-attempt entry marked `isTaskResultEffect` is committed, and its exact `effectId` is carried as recovery evidence. A committed unflagged effect is ignored for adoption, so an unrelated earlier effect can never imply `WorkerSucceeded`.
- **Adoption now has something to adopt through a declared boundary.** Finding A-104 established that the committed result-effect entry retained only `resultDigest`, while the `adopt` row emits `WorkerSucceeded`, which requires a complete `TaskResultSummary` and `proposedTasks`. `RecoveryContext.pendingResults` supplies the durable `AdoptableResult` recorded by `WorkerResultRecorded` before that exact flagged effect was committed; the coordinator passes the looked-up candidate to the public builder, and the `adopt` decision is possible only when task/attempt and `resultEffectId` evidence agree. When the committed result effect has no matching entry, the decision is `escalate` with reason `unreconstructable_result` rather than a synthesized partial event; `proposedTasks` are never silently dropped, because dropping them can change the terminal task graph.
- **An activation is never adopted.** A control-plane task carrying an `activation` block takes the `reclaim_activation` decision regardless of ledger state, because its consumption, its effects, and its result are one batch: either it landed and the task is not `running`, or it did not and the cursor is unchanged. Re-consuming the identical range is the designed behavior.

### Phase 5 — fence or terminate orphan process trees

For every invocation in `run.invocations` whose latest closure is absent **or** has `verifiedExit: false`, recovery acts through the `ProcessTreeController` that TASK-004 owns. This predicate is evaluated over the latest invocation-addressed closure, not over mere event existence. Fencing is unconditional and immediate: the invocation's fencing token is already superseded and the writer epoch already advanced, so nothing the orphan produces can mutate state. Termination is attempted according to what was recorded:

| Recorded state | Action | Outcome recorded |
|---|---|---|
| `bound`, group identity verified against the recorded start time | Graceful cancellation, bounded escalation, verified tree exit, per [PROVIDER-ADAPTERS.md](PROVIDER-ADAPTERS.md) | `ProcessGroupClosed{ outcome: 'terminated_by_recovery', verifiedExit: true }` |
| `bound`, no live process matches the recorded identity | None needed | `ProcessGroupClosed{ outcome: 'already_exited' }` |
| `bound`, a live process holds the recorded pid but its start time differs | None. The pid was reused; signalling it would kill an unrelated process | `ProcessGroupClosed{ outcome: 'orphan_unresolved', reason: 'pid_reuse' }` |
| `registered` but never `bound` — the crash landed between the pre-spawn append and the post-spawn append | None possible; no identity was ever recorded | `ProcessGroupClosed{ outcome: 'orphan_unresolved', reason: 'unbound' }` |
| latest closure has `verifiedExit: false`, and the recorded group identity still matches | Repeat bounded cancellation and verification | A second, verified `ProcessGroupClosed` for the same invocation, which supersedes the unverified closure |
| latest closure has `verifiedExit: false`, but identity no longer matches or still cannot be verified | Do not signal an unrelated process; report the residual | A recovery closure retaining `verifiedExit: false` plus `RECOVERY_ORPHAN_UNRESOLVED` |

On Windows the last two rows are largely theoretical: the job object is created before the spawn with `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE`, so the supervisor's death closes the last handle and the kernel terminates the whole tree. On POSIX there is no equivalent, and `orphan_unresolved` is a real residual recorded in the accepted-risk table.

An `orphan_unresolved` outcome emits a `RunEvent` with code `RECOVERY_ORPHAN_UNRESOLVED` naming the invocation, the task, and the reason. It does not block the task, because the orphan is fenced and cannot corrupt state; what it can cost is duplicated provider spend and, on POSIX, a worktree still being edited. The workspace reconciliation in Phase 6 is what detects the second case.

### Phase 6 — reconcile workspaces

Call `WorkspaceLifecycle.reconcile` for the run. It is the only component permitted to touch a worktree, a task branch, or a task lock, and its states, detection rules, and refusals are normative in [WORKSPACE-LIFECYCLE.md](WORKSPACE-LIFECYCLE.md). Recovery consumes its typed result and emits one `WorkspaceReconciled` event per workspace. A workspace whose outcome is `unresolved` — an unreleasable lock, an orphaned worktree with no owning record, or a live owning session — causes the owning task's decision from Phase 4 to be overridden to `escalate` when that decision would otherwise have dispatched the task again, because dispatching a second workspace for a task that already has one is the failure the module exists to prevent.

That override is computed **before** the batch is built, so it does not violate the one-decision-per-task invariant: Phase 6's findings are an input to Phase 4's decision function, not a second pass over the batch. Recovery therefore runs Phase 6's detection first and Phase 4's event construction second, even though the phases are numbered in the order a reader thinks about them.

### Phase 7 — sweep stale control requests

Every request in `control/` whose `targetWriterEpoch` is not the new epoch, whose `requestedAt` is older than `limits.controlRequestTtlMs`, or whose `requestId` already appears in `run.acceptedControlRequests`, is answered with a `rejected_stale` acknowledgement and moved to `control/consumed/`. This is what stops a request left by a CLI that died an hour ago from pausing a freshly resumed run.

### Phase 8 — complete

Construct the exact exported `RunRecoveryCompletedEvent` with `reclaimedTaskIds`, `adoptedTaskIds`, `blockedTaskIds`, `orphanOutcomes`, and `workspaceOutcomes`, then append it last. Task identifiers are unique and ordered by `(createdSeq, taskId)`; orphan outcomes are ordered by `invocationId`; workspace outcomes are ordered by `workspaceId`. The values must exactly match the decision blocks and Phase-5/Phase-6 results already represented earlier in the batch. A mismatch is `RecoveryInvariantViolation`. Applying the event moves the run to `running`; its payload remains durable in the journal and successful `RecoveryOutcome` returns the same five values byte-for-byte. When Phase 3 attached from `pausing` or `draining`, the lifecycle controller immediately reissues the retained pause or stop intent after this append; admission therefore does not reopen for a dispatch pass. Write a checkpoint immediately, so a crash during recovery does not force the same reconciliation work again.

Phases 4 through 6 are appended as a single compare-and-set batch, with `RunRecoveryCompleted` as its last event. Reconciliation is all-or-nothing: a crash during recovery leaves the run exactly as it was before recovery started, and the next attempt computes the identical decision set from the identical restored inputs. That the batch is genuinely all-or-nothing across a crash now rests on the batch commit record, not on a single fsync.

### Phase 6 and the abandonment intent

`reconcile` now discovers a durable intent for **every** mutating workspace operation, including abandonment. TASK-016's `abandon` was a single call whose pre-condition named a completion event as if it were an intent, and the state `abandoning` had no entering event at all, so a crash during a lock release or a worktree removal left a partially abandoned workspace with nothing to reconcile from. `WorkspaceAbandonIntended` closes that, and `reconcile` resolves an `abandoning` workspace idempotently under the same safety rules `executeAbandon` applies: never force-release a lock, never remove a worktree holding uncommitted changes, never delete a branch holding a commit.

## Post-crash invariants

These are the invariants a reviewer, a security reviewer, and QA can each check independently. TASK-008 must have a test per invariant. I1 through I19 were established under TASK-002 and TASK-016; I20 through I23 were added under TASK-024; I24 and I25 under TASK-028; I26 under TASK-034; I5a is corrected and I27 is added under TASK-036.

| # | Invariant |
|---|---|
| I1 | The journal exposes no partially acknowledged **batch**. The last committed batch boundary is the last state any caller was told was durable, and every event of a committed batch is exposed or none of it is. A valid prefix of an uncommitted batch is never exposed. |
| I2 | `restore` returns either the newest checksum-valid checkpoint plus the committed batches after it, or `NoConsistentCheckpoint`. It never returns a record derived from a checkpoint that failed validation, and never one derived from an uncommitted batch. |
| I3 | `result.version === fromCheckpoint + replayedEvents`. |
| I4 | After Phase 4, no task holds a lease from a superseded writer epoch or a lapsed deadline. Every such lease was cleared by exactly one event, which is the task's single reconciliation decision. |
| I5 | Every reclaimed task returns to `ready` exactly once. Between two `LeaseGranted` events for a task there is at most one `LeaseExpired`. |
| I5a | Exactly one decision block exists per task. The first event in a block is legal from restored state, each later event is legal from its predecessor in that block, and blocks are not interleaved. R4/R7 contain the required same-task `TaskTimedOut` then `RetryScheduled` sequence; two decision blocks for one task are illegal. |
| I6 | An effect whose ledger entry is `committed` is never re-executed. |
| I7 | An effect that is `intended` but not `committed` is either re-executed under the same idempotency key (when marked idempotent) or escalated to `blocked` with `indeterminate_effect`. |
| I8 | Recovery never rewrites a terminal task state or a terminal run state. |
| I9 | Monotonicity survives the crash: post-recovery `stateVersion`, `writerEpoch`, and every subsequently issued `FencingToken` are strictly greater than any value observed before the crash. |
| I10 | Recovery is idempotent: running it twice against the same run directory yields the same `RunRecord` and no additional effects. |
| I11 | No credential, token, or provider secret appears in the journal, any checkpoint, the ledger, or any run event. |
| I12 | A result produced by a pre-crash worker that returns after recovery is rejected by the fencing or writer-epoch check and changes nothing. |
| I13 | Every invocation whose latest closure was absent or unverified before recovery has a latest `ProcessGroupClosed` after recovery, recording `terminated_by_recovery`, `already_exited`, or `orphan_unresolved`. A verified recovery closure may supersede one earlier unverified closure; no invocation may have two verified closures. |
| I14 | No OS process belonging to a recorded invocation survives a completed recovery except one whose outcome is `orphan_unresolved`, and every such case emits `RECOVERY_ORPHAN_UNRESOLVED` naming the invocation and the reason. Every orphan, resolved or not, is fenced: its fencing token is superseded and its writer epoch is stale, so it cannot mutate state. |
| I15 | Every workspace with a durable prepare, finalize, or **abandon** intent and no completion record reaches exactly one of `prepared`, `finalized`, `abandoned`, or `unresolved` after `reconcile`. Amended under TASK-024: all three mutating operations now have a durable intent, so no side effect can exist without one for `reconcile` to act on. |
| I16 | Recovery never force-releases a task lock, never passes `-Force` to `release-task.ps1`, and never releases a lock whose recorded `lockSessionId` differs from the lock file's `session_id`. A lock it cannot release is left held and recorded for human attention, and its task is `blocked` with reason `workspace_lock_not_releasable`. |
| I17 | Recovery never republishes a branch and never opens a second pull request for a task whose `publication` record already exists. Publication identity after a crash is read from the durable record and from the remote, never recreated. |
| I18 | Workspace reconciliation is idempotent: running it twice against the same run directory and the same repository yields the same workspace records and performs no second git or filesystem mutation. |
| I19 | No control request accepted before the crash is accepted a second time, because `ControlRequestAccepted` records `requestId` durably and acceptance rejects a duplicate. No request addressed to a superseded writer epoch takes effect after recovery. |
| I20 | **TASK-024.** The ingress high-water mark never falls across a crash, a restore, a branch deletion, a force-push, or a rebase. `run.ingressSeq` after recovery is greater than or equal to its value before the crash, and every entry that was durable before the crash is durable after it with the same `seq`, `factId`, and `eventType`. |
| I21 | **TASK-024.** No ingress entry is consumed twice with effect and none is skipped. For every entry with `seq <= max(activation.lastConsumedEventSeq)` there is exactly one row in `run.ingressConsumptionLedger`, and for every entry with a greater `seq` there is none. A crash at any point of a consumption batch leaves the cursor and the ledger both unchanged. |
| I22 | **TASK-024.** Every task whose current attempt has a `committed` result effect either reaches `succeeded` carrying the complete `TaskResultSummary` and `proposedTasks` recorded before the commit, or reaches `blocked` with reason `unreconstructable_result` naming the effect. No path produces a `WorkerSucceeded` with a partial result or an empty proposal list that was not empty when recorded. |
| I23 | **TASK-024.** No completed drain leaves an unverified process tree. A journal containing `RunDrainCompleted` for a writer epoch contains, for every invocation registered under that epoch, a `ProcessGroupClosed` with `verifiedExit: true`. An unverifiable tree produces `RunDrainBlocked` and a run that is still `pausing` or `draining`. |
| I24 | **TASK-028.** A run left in `pausing` or `draining` by `RunDrainBlocked` has a legal attach path. Recovery selects every unverified closure, and after `RunRecoveryCompleted` the retained drain intent is reissued before any scheduling pass. |
| I25 | **TASK-028.** `ReconciliationDecider.decide` receives exactly one `ReconciliationInput`; exhaustive tests enumerate the complete domain whose cardinality ADR-0030 owns, and no recovery branch reads an undeclared axis. |
| I26 | **TASK-034.** Every decision-domain point reaches `ReconciliationDecider` through `ReconciliationInputBuilder.build(task, evidence)`. The evidence explicitly carries current writer epoch and pending-result candidate; no fixture constructs a direct input literal and no production branch reads hidden run state. |
| I27 | **TASK-036.** The final recovery event is an exact `RunRecoveryCompletedEvent`; all five canonical evidence arrays match the batch and the successful `RecoveryOutcome`, with no partial helper representation. |

### TASK-036 recovery fixtures

1. Build R4 and R7 through the public reconciliation builder, apply each fixed decision block through the real transition function, and assert `TaskTimedOut` followed immediately by `RetryScheduled` succeeds. Reverse, omit, duplicate, or interleave either event and assert rejection.
2. Build a recovery batch containing several decision blocks, a resolved and an unresolved orphan outcome, and several workspace outcomes. Construct the last event as `RunRecoveryCompletedEvent` rather than a widened literal. Assert every block permutation preserves its internal order and yields an identical record, and assert every single-event permutation of R4/R7 is refused as an invalid fixture or rejected by transition legality.
3. Mutate or omit each of the five completion arrays in turn and assert `RecoveryInvariantViolation`; append the exact event and assert successful `RecoveryOutcome` returns those five values byte-identically. Crash at every append boundary and assert no prefix becomes visible without the batch commit record.

## Equivalence claim

For the same project input, the same seeded randomness, and the same provider outcomes, a run interrupted by any number of crashes reaches the same terminal run state as an uninterrupted run.

This is the property TASK-008 and TASK-011 both validate. It follows from four facts already established:

1. State is a deterministic fold over an ordered journal (STATE-MACHINE, DURABLE-STATE).
2. The journal only ever loses an unacknowledged tail (DURABLE-STATE).
3. Work already done is recorded in the effect ledger and is adopted rather than repeated (RETRIES-TIMEOUTS-AND-IDEMPOTENCY).
4. Superseded actors cannot write, by writer epoch and fencing token (LEASES-AND-SCHEDULING).

The claim is about the terminal state and the set of committed effects. It is not a claim about dispatch interleaving, wall-clock duration, or the number of attempts consumed, all of which may legitimately differ across an interrupted run.

## Accepted risks

| Risk | Consequence | Mitigation and owner |
|---|---|---|
| A filesystem that acknowledges fsync without durability | I1 and I2 can be violated; the run may lose acknowledged events | Documented platform requirement; TASK-011 validates on the supported filesystems only |
| Backwards clock jump larger than one lease TTL across a restart | A lease may appear unexpired and Phase 4 reports a defect | Phase 4 treats a current-epoch lease as a defect and reports it rather than proceeding silently |
| Non-idempotent effects performed by an agent outside the ledger | The runtime cannot detect or reconcile them | Effects must be registered before they are performed; enforced by review on TASK-004 and TASK-008 |
| A long provider invocation outliving several lease TTLs | Duplicate provider work, wasted spend, no state corruption | Renew interval is one third of the TTL; duplicate results are rejected by fencing |
| A POSIX crash in the window between `ProcessGroupRegistered` and `ProcessGroupBound` | The child's process group was never recorded, so recovery cannot identify it. The orphan is fenced but not terminated; it may continue to consume resources and to edit its worktree | The window is one append wide and is bounded by the spawn call itself. Recovery records `orphan_unresolved` and emits `RECOVERY_ORPHAN_UNRESOLVED`. Workspace reconciliation independently refuses to reuse a worktree it cannot prove is idle. On Windows the case does not arise, because the job object is created before the spawn and its kill-on-close limit terminates the tree when the supervisor dies. Owner: TASK-004 for the mechanism, TASK-008 for the recording, TASK-011 for the platform matrix |
| Operating-system pid reuse between the crash and the attach | Recovery declines to signal a pid whose recorded start time no longer matches, so a genuine orphan may be left running | Identity is verified by pid **and** process start time before any signal. Declining is the safe outcome; signalling a reused pid would terminate an unrelated process. Recorded as `orphan_unresolved`, reason `pid_reuse` |
| A task lock held by a session that cannot be proven dead | The task stays blocked until a human adjudicates | The runtime never force-releases a lock. `AGENTS.md` reserves force release for a human who has verified the owning session and worktree are stale, and the runtime has no code path that expresses it |
