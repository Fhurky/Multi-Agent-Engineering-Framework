# Run and Task State Machine

Normative deterministic state machine for the autonomous runtime. Produced under TASK-002, amended under TASK-016, amended again under TASK-024. Related decisions: [ADR-0003](../../adr/0003-deterministic-run-and-task-state-machine.md), as extended by [ADR-0013](../../adr/0013-single-decision-recovery-reconciliation.md) and [ADR-0015](../../adr/0015-typed-scheduling-gate-and-activation-contracts.md), and as further amended by [ADR-0017](../../adr/0017-durable-ingress-inbox-and-ingress-epochs.md), [ADR-0018](../../adr/0018-publication-classes-and-gate-lineages.md), [ADR-0020](../../adr/0020-durable-adoptable-results-for-recovery.md), and [ADR-0022](../../adr/0022-unqualified-drain-closure.md). Implemented by TASK-006.

## Amendment register — TASK-024

| Superseded claim (TASK-016) | Superseded by | Finding | Decision |
|---|---|---|---|
| `review_ready` satisfied by `local-only` when `limits.allowLocalOnlyPublication` is true | [Typed dependency edges](#typed-dependency-edges) — the target's declared `publicationClass` decides, with two disjoint conditions | A-101 | [ADR-0018](../../adr/0018-publication-classes-and-gate-lineages.md) |
| One `gate_passed` edge form, with no round | [Typed dependency edges](#typed-dependency-edges) — the target form and the lineage form; the owner form is withdrawn and rejected at load | A-101 | [ADR-0018](../../adr/0018-publication-classes-and-gate-lineages.md) |
| Admission guard 8, a singular `gateFor` agreeing on gate name and round | [Dynamic task admission](#dynamic-task-admission) guards 7 … 14 — plural relations agreeing on seven fields, and gate-lineage well-formedness | A-101 | [ADR-0018](../../adr/0018-publication-classes-and-gate-lineages.md) |
| The activation model over `run.activationEvents` and `pendingThroughSeq` | [Ingress model for event-triggered recurring work](#ingress-model-for-event-triggered-recurring-work) — the three surfaces, cursor-only consumption state | A-101, F-301 | [ADR-0017](../../adr/0017-durable-ingress-inbox-and-ingress-epochs.md) |
| Recovery row R1 emitting `WorkerSucceeded` from a `resultDigest` alone | [Recovery reconciliation](#recovery-reconciliation-decisions) rows R0, R1, and R1x — a durable `AdoptableResult`, and an explicit escalation when one is absent | A-104 | [ADR-0020](../../adr/0020-durable-adoptable-results-for-recovery.md) |
| `pausing -> paused` and `draining -> cancelled` reachable while an `orphan_unresolved` descendant survived | [Run transition table](#run-transition-table) — `RunDrainCompleted` requires verified closure; `RunDrainBlocked` is the non-success outcome | A-102 | [ADR-0022](../../adr/0022-unqualified-drain-closure.md) |
| `abandoning` reachable by no event | `WorkspaceAbandonIntended` enters it | A-103 | [ADR-0019](../../adr/0019-durable-intent-receipts-for-side-effects.md) |

## Amendment register — TASK-016

| Superseded claim (TASK-002) | Superseded by | Decision |
|---|---|---|
| `pending -> ready` guard "every dependency is `succeeded`" | [Typed dependency edges](#typed-dependency-edges) — an edge is satisfied by its own condition, and `succeeded` satisfies none of them by itself | [ADR-0015](../../adr/0015-typed-scheduling-gate-and-activation-contracts.md) |
| Nine task states | Ten task states; `quiescent` is added for event-triggered recurring work | [ADR-0015](../../adr/0015-typed-scheduling-gate-and-activation-contracts.md) |
| Completion predicates `S` and `F` over `nonTerminal` | Predicates over `settled`, which admits a quiescent task with no unconsumed activation event | [ADR-0015](../../adr/0015-typed-scheduling-gate-and-activation-contracts.md) |
| Admission guard 4, "every entry in `dependencies` refers to a task that already exists" | Extended: every edge is well-formed, its target exists, and the **expanded** precondition graph stays acyclic | [ADR-0015](../../adr/0015-typed-scheduling-gate-and-activation-contracts.md) |
| "Batch append of `k` events … Either all `k` are applied and `stateVersion` advances by `k`, or none are applied", where atomicity rested on a single fsync | Same post-condition, now established by the batch commit record in [DURABLE-STATE-AND-CHECKPOINTS.md](DURABLE-STATE-AND-CHECKPOINTS.md) | [ADR-0012](../../adr/0012-crash-atomic-journal-batches-with-commit-records.md) |
| Recovery emitting `LeaseExpired` in the same batch as `WorkerSucceeded`, `TaskBlocked`, or `TaskTimedOut` for the same task | [Recovery reconciliation](#recovery-reconciliation-decisions) — one decision per task expanding to one proven-legal event sequence | [ADR-0013](../../adr/0013-single-decision-recovery-reconciliation.md) |
| `RuntimeEvent` as a 25-member union | Extended in [INTERFACE-CONTRACTS.md](INTERFACE-CONTRACTS.md) section 3 with control, process-tree, workspace, gate, publication, integration, and activation events | ADR-0013, ADR-0014, ADR-0015, [ADR-0011](../../adr/0011-agent-workspace-lifecycle-module.md) |

## Determinism contract

State is advanced by exactly one pure function:

```ts
applyEvent(run: RunRecord, envelope: EventEnvelope): TransitionResult
```

Requirements:

1. **Total.** Every `(state, event)` pair either produces a new `RunRecord` or an `IllegalTransition` error. It never throws and never returns undefined.
2. **Pure.** No I/O, no wall-clock read, no unseeded randomness, no mutation of the input record. Time enters only as `envelope.occurredAt`, supplied by the caller and treated as data.
3. **Ordered.** Events are applied in strictly increasing `seq`. `seq` is the `stateVersion` produced by applying that event.
4. **Replayable.** For a fixed initial record and a fixed ordered event sequence, the final `RunRecord` is byte-identical under canonical JSON serialization. This is the property TASK-006 must test directly.
5. **Single authority.** Scheduling, recovery, and lifecycle propose events. Only `applyEvent` decides legality. No module applies a state change by writing a field.

## Run states

| State | Meaning | Terminal | Process required |
|---|---|---|---|
| `initializing` | Bootstrap accepted, initial Manager task not yet committed | no | yes |
| `running` | Normal dispatch is open | no | yes |
| `pausing` | Drain in progress with pause intent; the run will be resumable | no | yes |
| `paused` | Durable, no dispatch, no process attached | no | no |
| `draining` | Drain in progress with stop intent; the run will be cancelled | no | yes |
| `recovering` | Attaching to an existing run, reconciling leases and effects | no | yes |
| `succeeded` | Every task reached a satisfying terminal state | yes | no |
| `failed` | The run cannot reach success | yes | no |
| `cancelled` | The run was stopped by operator intent | yes | no |

`succeeded`, `failed`, and `cancelled` are terminal. A terminal run accepts no further events; every event addressed to it is rejected as `IllegalTransition`.

## Run transition table

| From | Event | Guard | To |
|---|---|---|---|
| *(none)* | `RunBootstrapped` | run record does not already exist | `initializing` |
| `initializing` | `TaskCreated` | initial Manager task, admitted in the same append as `RunBootstrapped` | `initializing` |
| `initializing` | `RunStarted` | at least one task exists and every task is `pending` or `ready` | `running` |
| `initializing` | `RunCompleted(failed)` | bootstrap could not produce a valid initial task | `failed` |
| `running` | `RunPauseRequested` | — | `pausing` |
| `running` | `RunStopRequested` | — | `draining` |
| `running` | `RunCompleted(succeeded)` | completion predicate `S` holds | `succeeded` |
| `running` | `RunCompleted(failed)` | completion predicate `F` holds | `failed` |
| `running` | `RunResumeRequested` | attaching process observed a stale writer epoch | `recovering` |
| `pausing` | `RunDrainCompleted(pause)` | no task is `running`, or the drain deadline elapsed; **and** every invocation of the current writer epoch has a durable `ProcessGroupClosed` with `verifiedExit: true` | `paused` |
| `pausing` | `RunDrainBlocked(pause)` | the drain deadline and the tree-close budget both elapsed with at least one invocation unverified | `pausing` |
| `pausing` | `RunStopRequested` | pause intent escalated to stop | `draining` |
| `paused` | `RunResumeRequested` | writer lock acquired with a strictly greater epoch | `recovering` |
| `draining` | `RunDrainCompleted(stop)` | no task is `running`, or the drain deadline elapsed; **and** every invocation of the current writer epoch has a durable `ProcessGroupClosed` with `verifiedExit: true` | `cancelled` |
| `draining` | `RunDrainBlocked(stop)` | the drain deadline and the tree-close budget both elapsed with at least one invocation unverified | `draining` |
| `recovering` | `RunRecoveryCompleted` | reconciliation finished and every reclaimable lease was released | `running` |
| `recovering` | `RunCompleted(failed)` | no valid checkpoint could be restored | `failed` |
| `succeeded`, `failed`, `cancelled` | any | — | **illegal** |

`RunResumeRequested` is legal from `running` because a crashed process leaves the persisted run in `running`. The attaching process detects the stale writer epoch and moves the run through `recovering` rather than resuming dispatch blindly. See [CRASH-RECOVERY.md](CRASH-RECOVERY.md).

**`RunDrainBlocked` and the unqualified drain post-condition.** Added under TASK-024 (ADR-0022) to resolve the second half of A-102. TASK-016 allowed `pause` to return with an `orphan_unresolved` descendant surviving on POSIX, which contradicts the unqualified criterion that no unmanaged descendant survives the command. The exception is removed rather than restated: `RunDrainCompleted` is now guarded on verified closure of **every** invocation of the current writer epoch, so the run cannot reach `paused` or `cancelled` while a descendant may be alive. When closure cannot be verified within `limits.processTreeCloseTotalBudgetMs`, the run stays in `pausing` or `draining`, `RunDrainBlocked` records the unresolved invocation identifiers, the process writes a checkpoint, releases the writer lock, and the command exits **5**. The next attach fences and terminates the orphans through Phase 5 of [CRASH-RECOVERY.md](CRASH-RECOVERY.md), after which the run can be paused or resumed normally.

This is a non-success outcome, not a permitted exception. There is no post-condition anywhere in this document set under which `pause` or `stop` returns a paused or cancelled run while an unmanaged descendant survives.

### Run-addressed events that do not change run state

Added under TASK-016. Each is legal from every non-terminal run state, records the effect named below, and leaves `RunState` unchanged. `stateVersion` still advances by one, because every applied event advances it.

| Event | Guard | Record effect |
|---|---|---|
| `ControlRequestAccepted` | `requestId` has not already been accepted in this run; `targetWriterEpoch === run.writerEpoch` | Appends the request to `run.acceptedControlRequests`, making consumption exactly-once and durably ordered |
| `HumanDecisionRecorded` | `decisionId` not already recorded | Appends to `run.humanDecisions` |
| `IngressHighWaterMarkObserved` | `epoch` is the active epoch; `ingressSeq >= run.ingressSeq` | Sets `run.ingressSeq`. TASK-024; the observer records what the inbox reports, it does not mint a position |
| `IngressEpochDeclared` | `epoch === last.epoch + 1`; `seqBase === run.ingressSeq`; the previous epoch is sealed by the same event | Appends an `IngressEpochRecord`, seals the previous one. TASK-024 |
| `GateLineageDeclared` | `lineage` not already declared; `cohort` non-empty; every member exists | Appends to `run.gateLineages`. TASK-024 |
| `GateLineageCohortExtended` | `lineage` declared; `task` exists and is not already a member | Appends one cohort member. A member is never removed. TASK-024 |
| `GateLineageRoundOpened` | `lineage` declared; `lineageRound === rounds.length + 1`; the preceding round, if any, has a recorded verdict; `gateTaskId` records no other round of this lineage | Appends a `GateLineageRoundRecord` with a null verdict. TASK-024 |
| `WorkerResultRecorded` | The task is `running`; the presented token equals the active lease token; no `pendingResults` entry exists for this `(taskId, attempt)` | Sets `run.pendingResults[taskId]`. TASK-024; recorded **before** the attempt's result effect is committed |

`ActivationEventAppended` is withdrawn under TASK-024. Its record effect assigned an ingress position from a per-run counter inside `applyEvent`, which is the internal-queue model A-101 rejected. Positions are assigned once by the ingress inbox at append time; the journal observes the high-water mark and never mints one.

`ControlRequestAccepted` is legal in `pausing`, `draining`, and `recovering` as well as `running`, because an operator may escalate a pause to a stop while the drain is in progress. What the accepted request is then permitted to do is decided by the run transition it proposes, not by the acceptance.

### Completion predicates

Evaluated only while the run is `running`, after every applied event batch.

```text
inFlight      = tasks where state in {leased, running}
activatable   = tasks where state == quiescent
                 and run.ingressSeq > task.activation.lastConsumedEventSeq
settled       = tasks where state in {succeeded, failed, cancelled}
                 or (state == quiescent and task is not activatable)
progressable  = tasks where state in {ready, awaiting_retry}
                 or (state == pending and every dependency edge is satisfiable)
                 or task is activatable

S (succeeded) : every task is settled, no task ended in failed, and activatable is empty
F (failed)    : (every task is settled and at least one task ended in failed)
                or (inFlight is empty and progressable is empty and some task is not settled)
```

Three changes from TASK-002, all consequences of the `quiescent` state:

1. `settled` replaces `nonTerminal is empty`. A control-plane task that is permanently quiescent — the runtime analogue of TASK-013 — would otherwise hold every run open forever, because it is non-terminal by design and never reaches `succeeded`.
2. `activatable is empty` is an explicit conjunct of `S`. A run does not report success while an unconsumed activation event exists, so the last lifecycle transition is never dropped on the floor at completion.
3. `progressable` includes activatable tasks, so a run whose only remaining work is a pending activation is not misreported as `no_progress`.

"Every dependency edge is satisfiable" means no edge in the task's `dependencies` is permanently unsatisfiable under [Typed dependency edges](#typed-dependency-edges): a `review_ready`, `integrated`, `gate_passed`, or `terminal` edge whose target reached `failed` or `cancelled` can never be satisfied, and a `gate_recorded` edge whose target reached `failed` without recording a verdict likewise. Such a task is not progressable and contributes to the no-progress condition, which is the TASK-002 behavior restated over typed edges.

The second clause of `F` is the no-progress condition. It fires when every remaining task is `blocked`, or `pending` behind an unsatisfiable edge. `terminalReason` records `no_progress` and names the blocking tasks, so the operator receives an actionable report rather than a hang.

Completion is detected exactly once: the predicate is evaluated only in `running`, and the resulting `RunCompleted` event moves the run out of `running` in the same compare-and-set append.

## Task states

| State | Meaning | Terminal | Dispatchable |
|---|---|---|---|
| `pending` | Created; at least one dependency is not satisfied | no | no |
| `ready` | Dependencies satisfied; eligible for a lease | no | yes |
| `leased` | Lease granted; the supervisor has not yet invoked the worker | no | no |
| `running` | Worker invocation is in flight | no | no |
| `awaiting_retry` | Failed with a retryable class; waiting for `notBefore` | no | after backoff |
| `blocked` | Requires an external decision; `blockedReason` and an exit condition are recorded | no | after unblock |
| `quiescent` | Event-triggered recurring work with no unconsumed activation event | no | no |
| `succeeded` | Work completed and its result was aggregated | yes | no |
| `failed` | Work cannot complete; `lastFailure` is recorded | yes | no |
| `cancelled` | The run was stopped before this task completed | yes | no |

`blocked` is deliberately non-terminal. Retry exhaustion on an escalating failure class produces `blocked`, not `failed`, because the work is still achievable once a human or another role acts. Retry exhaustion on a retryable class produces `failed`.

`quiescent` is added under TASK-016 and is distinct from `blocked`. `blocked` waits on a **decision** that a human or another role must make and carries a `blockedReason` an operator must read. `quiescent` waits on an **event** the runtime itself will append, and its exit condition is a comparison of two integers that the scheduler evaluates on every pass. Conflating them would make the exit-code-3 report — "this run is waiting on a human" — fire for a control-plane task that is merely idle, and would make `A run is waiting on nobody` indistinguishable from `A run needs adjudication`. Only tasks whose record carries an `activation` block may enter `quiescent`.

## Task transition table

`n` is `attempt` after increment; `N` is `maxAttempts`.

| From | Event | Guard | To |
|---|---|---|---|
| *(none)* | `TaskCreated` | admission guards hold (see below) | `pending` |
| `pending` | `TaskDependenciesSatisfied` | every edge in `dependencies` is satisfied under [Typed dependency edges](#typed-dependency-edges) | `ready` |
| `pending` | `RunCancelled` | — | `cancelled` |
| `ready` | `LeaseGranted` | no active lease; token strictly greater than every prior token for this task | `leased` |
| `ready` | `TaskQuiesced` | `activation != null` and `atSeq === activation.lastConsumedEventSeq === run.ingressSeq` | `quiescent` |
| `ready` | `RunCancelled` | — | `cancelled` |
| `leased` | `DispatchStarted` | presented token equals the active lease token | `running` |
| `leased` | `LeaseExpired` | `occurredAt >= lease.expiresAt`, or lease epoch is stale | `ready` |
| `leased` | `LeaseReleased` | presented token equals the active lease token | `ready` |
| `leased` | `RunCancelled` | — | `cancelled` |
| `running` | `WorkerSucceeded` | presented token equals the active lease token; `activation == null` | `succeeded` |
| `running` | `WorkerSucceeded` | presented token equals the active lease token; `activation != null`; `activation.lastConsumedEventSeq === run.ingressSeq` | `quiescent` |
| `running` | `WorkerSucceeded` | presented token equals the active lease token; `activation != null`; `activation.lastConsumedEventSeq < run.ingressSeq` | `ready` |
| `running` | `WorkerFailed` | disposition `retry` and `n < N` | `awaiting_retry` |
| `running` | `WorkerFailed` | disposition `retry` and `n >= N` | `failed` |
| `running` | `WorkerFailed` | disposition `fail` | `failed` |
| `running` | `WorkerFailed` | disposition `escalate` | `blocked` |
| `running` | `TaskTimedOut` | `n < N` | `awaiting_retry` |
| `running` | `TaskTimedOut` | `n >= N` | `failed` |
| `running` | `LeaseExpired` | `occurredAt >= lease.expiresAt`, or lease epoch is stale | `ready` |
| `running` | `TaskBlocked` | indeterminate effect, unresolvable workspace, or unreleasable task lock detected | `blocked` |
| `running` | `RunCancelled` | — | `cancelled` |
| `awaiting_retry` | `RetryScheduled` | `notBefore` is not yet set for this attempt | `awaiting_retry` |
| `awaiting_retry` | `BackoffElapsed` | `occurredAt >= notBefore` | `ready` |
| `awaiting_retry` | `RunCancelled` | — | `cancelled` |
| `blocked` | `TaskUnblocked` | an unblock record with a reason is present | `ready` |
| `blocked` | `RunCancelled` | — | `cancelled` |
| `quiescent` | `TaskActivated` | `activation != null` and `observedIngressSeq > activation.lastConsumedEventSeq` and `observedIngressSeq <= run.ingressSeq` | `ready` |
| `quiescent` | `RunCancelled` | — | `cancelled` |
| `succeeded`, `failed`, `cancelled` | any state-changing event | — | **illegal** |

`TaskActivated` no longer carries `throughSeq` and no longer reserves a range. It records the observation that raised the dispatch and nothing more, because consumption state is the cursor alone. The range an activation actually consumes is decided when it consumes it, by `IngressRangeConsumed`.

The final row is qualified under TASK-016: four evidence-recording events remain legal against a terminal task, and none of them changes its state. See [Evidence events and the terminal-task rule](#evidence-events-and-the-terminal-task-rule).

`RetryScheduled` was recorded in TASK-002 only as a record effect "emitted with the transition into `awaiting_retry`", with no row of its own. That left the transition function incomplete on a pair it must decide, because the function is required to be total. TASK-016 gives it an explicit non-transitioning row: it is legal exactly once per attempt in `awaiting_retry` and sets `notBefore`. This is a completeness correction, not a behavior change.

### Task-addressed events that do not change task state

Each is legal from the states named, records the effect, and leaves `TaskState` unchanged.

| Event | Legal from | Record effect |
|---|---|---|
| `LeaseRenewed` | `leased`, `running` | Extends `lease.expiresAt`; `fencingToken` unchanged |
| `EffectIntentRecorded` | `running` | Adds an `intended` ledger entry |
| `EffectCommitted` | `running` | Moves a ledger entry to `committed` |
| `ProcessGroupRegistered`, `ProcessGroupBound`, `ProcessGroupClosed` | `running` | Maintains `run.invocations`; see [PROVIDER-ADAPTERS.md](PROVIDER-ADAPTERS.md) |
| `WorkspacePrepareIntended`, `WorkspacePrepared` | `leased` | Maintains `run.workspaces`; `WorkspacePrepared` is a pre-condition of `DispatchStarted` |
| `WorkspaceFinalizeIntended`, `WorkspaceFinalized`, `WorkspaceAbandonIntended`, `WorkspaceAbandoned`, `WorkspaceReconciled` | `running`, `ready`, `blocked`, `awaiting_retry` | Maintains `run.workspaces` and `TaskRecord.publication`; see [WORKSPACE-LIFECYCLE.md](WORKSPACE-LIFECYCLE.md). TASK-024 adds `WorkspaceAbandonIntended`, which moves the **workspace** to `abandoning` while leaving the task's state unchanged |
| `WorkerResultRecorded` | `running` | TASK-024. Sets `run.pendingResults[taskId]` to the complete adoptable result. Appended before the attempt's result effect is committed |
| `ArtifactPublished` | `running`, `succeeded` | Sets `TaskRecord.publication`, which is what makes `review_ready` satisfiable |
| `GateVerdictRecorded` | **any** state of every target it names, terminal included | TASK-024. Appends one `GateVerdictRecord` to **each** relation's target and sets the verdict of each named lineage round. Never rewrites an existing round |
| `BranchIntegrated` | `succeeded` | Sets `TaskRecord.integration` |
| `DependencyUnsatisfiable` | `pending` | Sets `blockedReason` context consumed by the no-progress predicate |
| `RemediationCompleted` | `succeeded` | Records the remediation link for finding traceability |
| `IngressRangeConsumed` | `running` | TASK-024. Appends one `IngressConsumptionRow` per entry of `(fromSeq, throughSeq]` to `run.ingressConsumptionLedger` and advances that task's `activation.lastConsumedEventSeq` to `throughSeq`. It is the only event that advances a cursor |

### Evidence events and the terminal-task rule

The task transition table ends with "`succeeded`, `failed`, `cancelled` | any | **illegal**". That rule governs events that would **change** a task's state; a terminal outcome is already reported and must not be rewritten.

**Exactly four** of the events above are legal against a terminal task, and they are the only exceptions in the whole union: `ArtifactPublished`, `GateVerdictRecorded`, `BranchIntegrated`, and `RemediationCompleted`. Without the exception the model would be incoherent, because assembly gates run **after** their target succeeded and merged, by definition: a task's `gateTasks` are what block `done`, and a target that must be terminal before its gate task can even be dispatched could then never have that verdict recorded.

The exception is narrow and safe for three reasons: none of the four changes `TaskState`; none can rewrite a value, because `gateVerdicts` is append-only, `integration` may be set only once, and `publication` may only be superseded forward; and none applies to a terminal **run**, whose events remain illegal without exception.

The diagram in [`diagrams/architecture/runtime-state-machine.md`](../../../diagrams/architecture/runtime-state-machine.md) states this same list of four. A statement in that diagram that *every* event against a terminal task is illegal is the contradiction finding A-105 recorded, and it is corrected there rather than only here.

`GateVerdictRecorded` and `ArtifactPublished` are addressed to tasks that are not the task producing them: a gate task records a verdict against its targets. Under TASK-024 the event names `gateTaskId` once and carries a **plural** `relations` array, and its guard is evaluated against every target it names. This is the only event class in the union that mutates tasks other than the one whose worker produced it, and it is why gate verdicts are durable evidence rather than an in-memory scheduling artifact.

**One review, one verdict, applied atomically.** A gate task carries one or more `gateFor` relations and records exactly one verdict. `GateVerdictRecorded` applies that single verdict to every relation in one event, producing one durable gate-verdict fact per relation. Because the whole application is one event, all relations close together or all stay open together, and a split outcome is not representable: there is no event that records a verdict for a subset. TASK-020 recorded one verdict yielding the two facts `(TASK-016, review, round 1)` and `(TASK-002, review, round 2)`; TASK-025 carries three relations and will yield three facts from one verdict.

### Effects of each transition on the task record

| Transition | Record effects |
|---|---|
| `LeaseGranted` | Sets `lease`; does not change `attempt` |
| `DispatchStarted` | Increments `attempt`; records `idempotencyKey` for that attempt; sets `attemptStartedAt` from `envelope.occurredAt` |
| `WorkerSucceeded` | Clears `lease`; clears `attemptStartedAt`; sets `result`; clears `lastFailure`; clears `run.pendingResults[taskId]`. It does **not** touch the cursor — TASK-024 moves that to `IngressRangeConsumed` |
| `WorkerFailed`, `TaskTimedOut` | Clears `lease`; clears `attemptStartedAt`; sets `lastFailure`; leaves `activation.lastConsumedEventSeq` unchanged |
| `LeaseExpired` | Clears `lease`; clears `attemptStartedAt`; leaves `attempt` unchanged |
| `RetryScheduled` | Sets `notBefore` |
| `BackoffElapsed` | Clears `notBefore` |
| `TaskBlocked` | Sets `blockedReason`; clears `lease`; clears `attemptStartedAt` |
| `WorkerResultRecorded` | Sets `run.pendingResults[taskId]`; changes no task state field |
| `TaskActivated` | Sets `activation.state = 'consuming'`; leaves `lastConsumedEventSeq` unchanged. Reserves nothing |
| `IngressRangeConsumed` | Appends the ledger rows; sets `activation.lastConsumedEventSeq = throughSeq` |
| `TaskQuiesced` | Sets `activation.state = 'quiescent'` |
| Any transition | Sets `updatedAt` from `envelope.occurredAt` |

`attempt` is incremented at `DispatchStarted`, not at `LeaseGranted`. A lease that expires before dispatch therefore does not consume an attempt, which prevents scheduler churn from exhausting a task's retry budget.

`attemptStartedAt` is added under TASK-016. TASK-002 required the watchdog to time out "a task in `running` whose `attempt` started more than `taskTimeoutMs` ago" and required recovery to reconcile an elapsed deadline, but no field recorded when the attempt started; `updatedAt` is overwritten by every intervening lease renewal and effect event. Without it, neither the watchdog nor the recovery decision table below is a function of the record, which breaks both determinism and the A-002 requirement that every combination of lease state, ledger state, and elapsed deadline map to exactly one transition.

The cursor rule for activation tasks is the load-bearing half of exactly-once consumption, and TASK-024 tightens it so that consumption state lives in exactly one field. `TaskActivated` records an observation and reserves nothing. The cursor advances only in `IngressRangeConsumed`, which is appended in the **same batch** as the activation's effects and its `WorkerSucceeded`, in that order. A crash at any point before that batch commits leaves the cursor where it was and leaves no ledger row, so the same range is consumed again by the next activation with identical effects. There is no second field that could disagree with the cursor about what was consumed, which is what finding A-101 required.

## Illegal transitions

These are rejected explicitly, and TASK-006 must cover each in unit tests.

| Attempted transition | Why it is rejected |
|---|---|
| `pending -> leased` | Skips dependency gating; a task with unmet dependencies would run |
| `ready -> running` | Skips lease acquisition; concurrency limits and fencing would be bypassed |
| `leased -> succeeded` | A result without a dispatch; no attempt and no idempotency key exist |
| `succeeded -> running` | Terminal re-entry; would allow duplicate effects |
| `failed -> succeeded` | Terminal rewrite; would erase recorded failure evidence |
| `cancelled -> ready` | Terminal re-entry after operator cancellation |
| `running -> ready` other than by `LeaseExpired` | Would silently abandon an in-flight worker |
| `blocked -> succeeded` | An escalation resolved without re-executing the work |
| Any task event with a stale fencing token | A superseded holder writing over the current holder |
| Any event addressed to a terminal run | The run's outcome is already reported |
| `TaskCreated` for an existing `taskId` | Would overwrite a live task |
| `quiescent -> leased` | Skips `TaskActivated`; a quiescent task would be dispatched with no observation and would loop forever, which is exactly the control-plane starvation defect the state exists to prevent |
| `TaskActivated` with `observedIngressSeq <= activation.lastConsumedEventSeq` | The task is quiescent; dispatching it would be a redispatch with nothing to consume |
| `TaskActivated` with `observedIngressSeq > run.ingressSeq` | Would activate against a position the inbox has not reported |
| `TaskActivated` for a task with `activation == null` | Only declared recurring work has a cursor |
| `TaskQuiesced` while `run.ingressSeq > activation.lastConsumedEventSeq` | Would silently drop an unconsumed ingress fact |
| `IngressRangeConsumed` whose `fromSeq !== activation.lastConsumedEventSeq` | Consumption is contiguous from the cursor; a gap would skip a fact and an overlap would consume one twice |
| `IngressRangeConsumed` whose `throughSeq <= fromSeq` or `throughSeq > run.ingressSeq` | Would rewind the cursor or run it ahead of the observed facts |
| `IngressRangeConsumed` whose `rows` do not cover exactly `(fromSeq, throughSeq]` with strictly increasing `seq` | The ledger is the durable provenance of the consumed range; a partial ledger would make consumption unauditable |
| `IngressRangeConsumed` carrying a `factId` already present in `run.ingressConsumptionLedger` | A row is created already consumed and never re-created; a duplicate would mean a fact was consumed twice with effect |
| `IngressHighWaterMarkObserved` with `ingressSeq < run.ingressSeq` | `ingressSeq` is non-decreasing for the life of the run; a decrease would mean a position was derived from something that can shrink |
| A restored record in which any `activation.lastConsumedEventSeq > run.ingressSeq` | Rejected at load. This is the `Invalid` case of the cursor rule |
| `IngressEpochDeclared` whose `seqBase !== run.ingressSeq`, or that renumbers, reclassifies, or edits an entry of a sealed epoch | The epoch boundary exists to keep the cursor monotonic across a model correction; no event expresses touching a sealed epoch's entries |
| `GateVerdictRecorded` with an empty `relations` array | A review with no relation records nothing; the event exists to apply one verdict to at least one relation |
| `GateVerdictRecorded` whose `(gate, round)` already exists on any named target | A verdict is durable; a later round supersedes it and never rewrites it |
| `GateVerdictRecorded` whose `round` is not strictly greater than the highest recorded round for that gate on that target | Rounds are monotonic; an out-of-order round would make gate status ambiguous |
| `GateVerdictRecorded` whose `gateTaskId` appears among its own `relations[].task` | A task may not gate itself |
| `GateVerdictRecorded` naming a relation absent from the gate task's `gateFor` or from that target's `gateTasks` | The verdict must apply to declared relations only, or a gate task could record a verdict for a target that never declared it |
| `GateVerdictRecorded` whose relations do not all resolve to a lineage round already opened by `GateLineageRoundOpened` | Every pair belongs to exactly one lineage; an unregistered round would leave the authoritative-verdict rule undefined |
| `GateLineageRoundOpened` for round *n* > 1 while round *n* − 1 has a null verdict | A successor lineage round exists only after the preceding round recorded a verdict |
| `GateLineageRoundOpened` whose `gateTaskId` already records another round of the same lineage | Each lineage round is recorded by exactly one gate task, and a gate task is never re-entered |
| Any event removing a member of `gateLineages[l].cohort` | A cohort member is never removed, so an earlier round's coverage claim stays true of what it covered |
| `WorkerResultRecorded` for a `(taskId, attempt)` that already has a `pendingResults` entry | The adoptable result is recorded once per attempt; a second would make adoption ambiguous |
| `DispatchStarted` for a task whose workspace is not `prepared` | Would invoke a provider outside an isolated worktree, which is the failure the workspace module exists to prevent |
| `ArtifactPublished` replacing an existing `publication` with an earlier `publishedCommit` | Publication history is append-ordered; a later `finalize` supersedes an earlier one and both stay recorded |
| Two events addressed to the same task in one recovery batch | Recovery emits one decision per task; see [Recovery reconciliation](#recovery-reconciliation-decisions) |

## Dynamic task admission

The task graph is not fixed at bootstrap. A worker result may carry `proposedTasks`; the supervisor admits them by emitting `TaskCreated` for each. Admission guards, all enforced inside `applyEvent`:

1. `taskId` is unique within the run.
2. `ownerRole` exists in `config/agents/settings.yaml`, is enabled, and has a non-null `llm`.
3. `writeScope` is non-empty and is a subset of the owner role's configured write scope.
4. Every edge in `dependencies` is well-formed for its kind, and its target task or human decision already exists in the run.
5. Adding the task introduces no cycle in the **expanded precondition graph** defined in [LEASES-AND-SCHEDULING.md](LEASES-AND-SCHEDULING.md), not merely in the graph of scheduling edges.
6. `createdSeq` is assigned by the supervisor from a per-run monotonic counter, giving every task a stable, deterministic admission order.
7. Every gate named in `preMergeGates` also appears in `requiredGates`, and every entry in `gateTasks` names a task that exists, a gate in `requiredGates`, and a `round >= 1`.
8. Every entry of `gateFor` names an existing target task and agrees with that target's `gateTasks` entry on **all seven** fields: gate name, round, `gateClass`, `retrospective`, `gateLineage`, `lineageRound`, and the identity of the two tasks. A task whose `gateFor` names target X may hold a `review_ready(X)` edge and must hold no `gate_passed` edge naming X, no `integrated(X)`, and no `terminal(X)` edge — nor a lineage-form `gate_passed` edge naming a lineage of which it itself records a round.
9. No task owning a gate in X's `preMergeGates` holds an `integrated(X)` edge.
10. `activation`, when present, names a non-empty subset of `IngressEventType` and a `lastConsumedEventSeq >= 0` that does not exceed `run.ingressSeq`.
11. `resourceLock`, when present, is a non-empty machine-readable name.
12. **TASK-024.** `publicationClass` is declared and is one of `runtime` or `bootstrap`. It is never inferred from the task's role, its owner, or its dependencies; an omission is `GRAPH_PUBLICATION_CLASS_MISSING`.
13. **TASK-024.** Every `gate_passed` edge declares exactly one of `task` and `lineage`. With `task`, the named task declares the gate in its `requiredGates` — the target form. With `lineage`, the named lineage is present in `run.gateLineages` — the lineage form. An edge naming a task that declares the gate only in a `gateFor` entry is the **withdrawn owner form** and is rejected with `GRAPH_GATE_PASSED_OWNER_FORM`, whose message names the lineage that carries the relation and directs the edge to the lineage form.
14. **TASK-024.** Every `gateFor` / `gateTasks` pair declares a `gateLineage` present in `run.gateLineages` and a `lineageRound`. Within one lineage the gate name is constant, every declared `lineageRound` maps to exactly one gate task, the declared rounds are `1 … k` with no gap, every target named by a pair is a member of that lineage's cohort, and a round greater than 1 exists only after the preceding round recorded a verdict.

Guards 7 through 9 and 13 through 14 are the structural no-deadlock invariants stated in `tasks/TASK-001-DEPENDENCY-GRAPH.md` revision 5, enforced at admission rather than discovered at run time. A graph that violates one of them does not stall; it is rejected with a named diagnostic. The full eight-invariant statement, and the mapping from each invariant to its diagnostic code, is in [LEASES-AND-SCHEDULING.md](LEASES-AND-SCHEDULING.md#load-time-graph-validation).

A proposal that violates any guard is rejected as `IllegalTransition`; the proposing task transitions to `blocked` with reason `invalid_task_proposal` rather than the run failing. This keeps an ill-formed Manager output from destroying an otherwise healthy run.

Write-scope overlap is **not** an admission guard, and neither is a held resource lock. Two tasks with overlapping scopes or the same lock may coexist in the graph; the scheduler simply never leases them concurrently. See [LEASES-AND-SCHEDULING.md](LEASES-AND-SCHEDULING.md).

## Typed dependency edges

Added under TASK-016 to resolve A-004, amended under TASK-024 to resolve A-101. The vocabulary and the satisfying conditions are the ones recorded in `tasks/TASK-001-DEPENDENCY-GRAPH.md` **revision 5**, name for name, so a task record written against that document compiles against these contracts without restatement.

| Edge | Written as | Satisfied when |
|---|---|---|
| `review_ready` | `{ edge: 'review_ready', task: X }` | X has a durable `publication` whose `publishedCommit` is set and immutable and whose `publishedBranch` is X's derived task branch, **and** X's declared `publicationClass` is satisfied under [Publication classes](#publication-classes). X's own state is irrelevant; the edge says nothing about merge |
| `integrated` | `{ edge: 'integrated', task: X }` | `review_ready(X)` holds, **every** gate in X's `preMergeGates` is closed, and X's `integration` record names a merge into the configured integration branch |
| `gate_passed` — target form | `{ edge: 'gate_passed', task: X, gate: g, round: n }` where X declares `g` in `requiredGates` | `review_ready(X)` holds and the gate relation `(X, g)` is **closed** under the gate-round rule below, with the closing verdict at a round `>= n` |
| `gate_passed` — lineage form | `{ edge: 'gate_passed', lineage: L, gate: g, lineageRound: n }` where L is declared in `run.gateLineages` | L's **authoritative verdict** — the verdict at its highest recorded lineage round — is `approved`, `approved-with-findings` with zero open blocking findings, or `formally-accepted`, **and** that lineage round is `>= n` |
| ~~`gate_passed` — owner form~~ | ~~`{ edge: 'gate_passed', task: G, gate: g }` where G is a gate task~~ | **Withdrawn under TASK-024.** Rejected at load with `GRAPH_GATE_PASSED_OWNER_FORM`, naming the lineage that carries the relation |
| `gate_recorded` | `{ edge: 'gate_recorded', task: X }` | X's `gateFor` is non-empty and X has recorded a verdict, whatever that verdict is |
| `human_decision` | `{ edge: 'human_decision', decision: D }` | A `HumanDecisionRecorded` entry for D exists in the run |
| `terminal` | `{ edge: 'terminal', task: X }` | X is `succeeded`, `integrated(X)` holds, and every gate in X's `gateTasks` is closed. Reserved: the graph validator accepts the edge and expands it, and rejects it when the expansion produces a cycle. It exists so misuse is refused rather than silently deadlocking |

`round` and `lineageRound` default to 1 when a record omits them; the loader normalizes the omission once, at admission.

`gate_recorded` and the lineage form differ in exactly one way, and that difference is load-bearing: `gate_recorded` is satisfied by **any** verdict, including `changes-required`; the lineage form is satisfied only by a passing or formally accepted one. A task whose prerequisite is a working upstream baseline uses the lineage form. A task that is the remediation *for* a failing verdict uses `gate_recorded`, because a passing verdict will never exist at that round. TASK-024 itself holds `gate_recorded(TASK-020)` for exactly that reason.

Three properties follow directly and are why the runtime can execute the committed graph:

- A gate task is dispatchable while its target is unmerged, because `review_ready` is satisfiable from a published commit alone. That removes the pre-merge review deadlock.
- A consumer is released only when its dependency's own pre-merge gates have closed, because `integrated` expands to include them. That prevents releasing a consumer before its dependency's blocking gate passed.
- A consumer of a validated baseline never has to be retargeted when a `changes-required` verdict is superseded, because the lineage form names the durable relation rather than one of its rounds. That is the F-302 correction, and it is why the owner form is withdrawn rather than merely deprecated: the owner form asks whether one particular gate task passed, and a gate task that recorded `changes-required` never will, so every consumer of it would deadlock permanently.

### Publication classes

Added under TASK-024 (ADR-0018), superseding the run-global `limits.allowLocalOnlyPublication` flag. `publicationClass` is a **declared field** on every task record and task proposal, never an inference, and the two classes have disjoint satisfying conditions.

| `publicationClass` | Satisfying condition for `review_ready` | An unreachable remote is |
|---|---|---|
| `runtime` | An immutable `publishedCommit` **and** `publication === 'published'` with a `remote` and a `pullRequest` recorded | A `blocked` outcome. `publication: 'local-only'` **never** satisfies `review_ready` for a `runtime` task |
| `bootstrap` | An immutable `publishedCommit` readable from the shared Git common directory, plus remote publication and a pull request when the environment permits one | Recorded as `publication: 'local-only'` with a `reason`, which satisfies `review_ready` for that task only |

Three rules keep the classes from contaminating each other, and each is enforced rather than asserted:

1. A `bootstrap` task's `local-only` publication satisfies `review_ready` **for that task only**. It is a named, recorded limitation of the bootstrap phase, not a run-wide mode.
2. A `local-only` publication never satisfies `review_ready` for a `runtime` task. `WorkspaceLifecycle.executeFinalize` reads the class from the request and returns `blocked` rather than an `ok` outcome, so the runtime cannot produce the record in the first place.
3. The class is declared, not inferred. Admission guard 12 rejects a record that omits it.

The superseded flag was run-global, so setting it for one bootstrap task would have silently weakened `review_ready` for every runtime task in the same run. That is why it is removed rather than retained alongside the classes.

### Gate rounds and gate closure

`requiredGates` names every gate a task must pass before `done`. `preMergeGates` is the subset that must close before the task may be integrated; the remainder are **assembly gates**, which run after merge and block only `done`. A task with an empty `preMergeGates` is integrable as soon as it is `review_ready` and reached in merge order.

`gateTasks` is the target's view of who gates it. `gateFor` is the gate task's view of what it gates, and under TASK-024 it is **plural**: one gate task carries one or more relations. They are not scheduling edges, they point in opposite directions, and admission guard 8 requires them to agree pairwise on all seven fields. A `round` defaults to 1 when omitted; only a gate recorded more than once needs an explicit round on both sides.

Gate status is computed, never stored as a mutable field:

1. The status of a gate relation is the verdict recorded at its **highest** round.
2. A `changes-required` verdict at round *n* must name `remediatedBy` and `revalidatedBy`. The gate stays open.
3. The gate is **closed** when the highest round records `approved`, or `approved-with-findings` with `blockingFindingsOpen === 0`, or `formally-accepted` carrying a recorded human decision identifier.
4. A verdict is durable. A later round supersedes an earlier one; both stay recorded in `gateVerdicts`, which is append-only.
5. **One review produces exactly one verdict**, applied atomically to every relation the gate task carries. All of them close together or all stay open together; a split outcome is not representable.
6. **Every pair belongs to exactly one gate lineage.** Supersession across rounds is a property of the lineage, not of any one gate task.

Durability is structural, not procedural: `gateVerdicts` has no update or delete operation, `applyEvent` rejects a `GateVerdictRecorded` for an existing `(gate, round)` pair on any named target, and it rejects a round that is not strictly greater than the highest already recorded. A verdict cannot be rewritten by any code path, including recovery, because there is no event that expresses rewriting one.

A superseding round is performed by a **new gate task**, not by re-entering the recorded one. The runtime enforces this by rejecting a `GateVerdictRecorded` whose `gateTaskId` already recorded a verdict for the same `(target, gate)` at a lower round, and by rejecting a `GateLineageRoundOpened` whose `gateTaskId` already records another round of the same lineage.

### Gate lineages

Added under TASK-024 (ADR-0018) to resolve the F-302 half of A-101. A **gate lineage** is the durable relation between one gate name and one cohort of gated artifacts, held across every round and across every successive gate task that records a round of it.

- A lineage has a stable `GateLineageId`, one gate name, a cohort, and an ordered succession of `lineageRound` values. Each lineage round is recorded by exactly one gate task.
- A lineage's **authoritative verdict** is the verdict at its highest recorded lineage round. Every earlier round stays durably recorded and is superseded, never rewritten — clause 4 above is unchanged and unweakened. The lineage adds a name for "which round is currently authoritative"; it removes nothing from history.
- A successor lineage round is created only after the preceding round recorded a verdict, and only as a **new** gate task. A gate task is never re-entered.
- A lineage's cohort may **grow** when a new artifact joins the same gate, but a cohort member is never removed, so an earlier round's coverage claim stays true of what it covered.
- Every `gateFor` and `gateTasks` pair declares `gateLineage` and `lineageRound`. A pair whose lineage is not declared, or whose `lineageRound` collides with another task's round in the same lineage, is rejected at load.

A pair's `round` and its `lineageRound` answer different questions and are not interchangeable. `round` is "how many times has *this artifact's* gate been recorded". `lineageRound` is "how many times has *this relation* been validated". They diverge whenever a cohort grows: an artifact that joins at lineage round 2 carries `round: 1` and `lineageRound: 2`.

### The four gate-pair scheduling and lineage properties

Every `gateFor` / `gateTasks` pair declares `gateClass`, `retrospective`, `gateLineage`, and `lineageRound` on **both** sides, and they must agree.

| Property | Values | Meaning | How it is decided |
|---|---|---|---|
| `gateClass` | `point`, `aggregate` | Scheduling timeliness | `point` when the gate owner is dispatchable at the moment the artifact that this round reviews becomes `review_ready` — that is, when publication of the reviewed artifact is the last of the owner's dependencies to be satisfied. `aggregate` when the owner holds a further dependency satisfied later, so gating this target is deliberately batched |
| `retrospective` | `true`, `false` | Ordering against integration | `true` exactly when the gate is **not** in the target's `preMergeGates`, so the target is integrated before this gate closes. `false` when the gate blocks integration |
| `gateLineage` | a declared `GateLineageId` | Which durable relation this pair is a round of | Declared; must be present in `run.gateLineages` |
| `lineageRound` | `>= 1` | Which round of that relation | Declared; unique within the lineage and contiguous from 1 |

**Which artifact a round reviews.** At round 1 the reviewed artifact is the target itself, so the reference point for `gateClass` is `review_ready(target)`. At round *n* > 1 the reviewed artifact is the **remediation** named by round *n* − 1's `remediatedBy`, so the reference point is that remediation's publication. TASK-005 recomputes `gateClass` against that reference point and rejects a pair whose declared class disagrees.

These four values are normative in the pair's own declaration and in the registers referenced by `tasks/TASK-001-DEPENDENCY-GRAPH.md`, and nowhere else. No prose in this document set restates a specific pair's values, and none should be added: a restated value is a second source of truth that can disagree with the first, which is exactly what finding F-303 recorded.

## Ingress model for event-triggered recurring work

Added under TASK-024 (ADR-0017), superseding the TASK-016 activation model in which `run.activationEvents` was an internal queue and consumption state was split between the cursor and `pendingThroughSeq`. It is the runtime representation of the three-surface model in `tasks/TASK-001-DEPENDENCY-GRAPH.md` revision 5, and the contract is section 2b of [INTERFACE-CONTRACTS.md](INTERFACE-CONTRACTS.md).

**Three surfaces, disjoint writers.**

| Surface | Where it lives | Written by | Read by |
|---|---|---|---|
| Ingress inbox | `src/orchestrator/ingress/`, owned by TASK-026 | The ingress adapters, on behalf of the producing owners | The ingress observer in `src/orchestrator/scheduling/`, owned by TASK-005 |
| Ingress cursor | `TaskRecord.activation.lastConsumedEventSeq` | The consuming activation, in the batch that carries its effects | The ingress observer |
| Consumption ledger | `run.ingressConsumptionLedger` | The consuming activation, append-only, one row per consumed entry | Reviewers and operators, as durable provenance |

The inbox is a durable append-only state store, not a Git ref scan, not a commit count, and not a file under `tasks/`. **No write under `tasks/` is required or permitted to append an entry**, which is what makes the ownership rule survivable: an owner wakes the control plane by doing its own job in its own scope.

**Identity and position are different things.** An entry's identity is `factId`, a SHA-256 over the canonical identity tuple — epoch, event type, producer task, source commit, source path, and content hash. Its position is `seq`, assigned **once** at append and never recomputed. Identity is a function of the fact; position is a function of when the fact was appended. `sourceCommit` and `sourcePath` are provenance and never determine position.

**Deduplication is identity-keyed.** An entry is appended only if its `factId` is absent, so re-observing a fact is a no-op and a fact can never be counted twice.

**Positions are append-stable.** A fact discovered late — a backdated commit, a branch published after the fact, a historical commit nobody had scanned — receives the next free `seq`. Nothing is ever inserted before an existing entry, so `run.ingressSeq = max(seq)` is non-decreasing for the life of the run. A count over a scan of mutable refs cannot have this property, which is why the model is not that.

**Ordering is deterministic and never temporal.** Facts appended in one batch are ordered by ascending `sourceCommit` identifier — a total order independent of refs, of branch existence, and of clocks. Committer timestamps are never used, and `IngressFactCandidate` carries no timestamp field at all, so the rule cannot be violated by an implementation that means well.

**Retention is reference-independent.** An entry outlives the ref that carried its source commit. Deleting, rewriting, or garbage-collecting a branch cannot remove an entry and therefore cannot lower `ingressSeq`. `contentHash` lets a later reader detect that the artifact at `sourcePath` was rewritten since the append; that detection is a finding, never a silent renumbering.

**Class precedence yields at most one entry per source commit.** A commit matching several classes produces exactly one entry, typed by the highest-precedence class in `INGRESS_CLASS_PRECEDENCE`. Distinct commits are distinct facts even when they express one logical step.

**Self-exclusion is explicit.** A commit authored by the consuming activation on its own branch is **never** an ingress fact under any class. The adapter does not offer it and the inbox rejects it if offered. An activation's own effects commit therefore cannot raise `ingressSeq`, which is what makes quiescence after an activation demonstrable rather than assumed.

**The cursor is the whole of consumption state.** `run.ingressSeq = max(seq)`, or 0 when the inbox is empty. A task is **dispatchable** when `run.ingressSeq > activation.lastConsumedEventSeq`, **quiescent** when they are equal, and a record in which `lastConsumedEventSeq > run.ingressSeq` is **invalid** and rejected at load. There is no second field; `pendingThroughSeq` is withdrawn.

**Exactly-once consumption.** An activation consumes the contiguous range `(lastConsumedEventSeq, run.ingressSeq]`. `IngressRangeConsumed` appends one ledger row per consumed entry and advances the cursor, and it is applied in the **same batch** as the activation's effects and its `WorkerSucceeded`. If that batch does not commit, the cursor is unchanged, no ledger row exists, and the next activation consumes the identical range with identical effects, because every transition a control-plane activation performs is idempotent. No interleaving consumes an entry twice with effect, and none skips one.

**The ledger is a record of consumption, not a queue.** A row is created already consumed and already stamped with its consuming activation, so no row is ever edited and `consumedBy` is never mutated. Consumption state lives in exactly one place — the cursor — which is what finding F-201 required and what A-101 recorded as still unmet.

**Ingress epochs.** A new epoch is declared only by a numbered model correction. It takes `seqBase` from the previous epoch's high-water mark, so its first entry takes `seqBase + 1` and the cursor stays monotonic across the boundary and never runs ahead of the observed facts. **Entries of a previous epoch are never re-derived, renumbered, reclassified, or edited.** No operation on `IngressInbox` and no member of `RuntimeEvent` expresses any of those, so the rule is structural.

**Starvation bound.** Stated and enforced in [LEASES-AND-SCHEDULING.md](LEASES-AND-SCHEDULING.md).

## Recovery reconciliation decisions

Added under TASK-016 to resolve A-002. It supersedes the TASK-002 recovery sequence in which phase 4 emitted `LeaseExpired` for a task and phases 5 and 6 then emitted `WorkerSucceeded`, `TaskBlocked`, or `TaskTimedOut` for the same task in the same batch — events that are legal only from `running` and were being applied to a task the batch had already moved to `ready`.

**The invariant that makes every recovery batch legal by construction.**

> Recovery computes exactly one **reconciliation decision** per task from the task's restored pre-batch state, and each decision expands to one fixed event sequence whose legality from that pre-batch state is proven in the table below. No two decisions address the same task, and no decision reads a state that another decision in the same batch produced. Batch legality therefore reduces to per-decision legality, which the table establishes exhaustively.

The decision is a total function of four observable inputs, all present in the restored record:

- **Pre-batch task state** — `leased`, `running`, or any other state, which needs no reconciliation.
- **Lease state** — `none`, `superseded` (`lease.writerEpoch < run.writerEpoch`), or `current_epoch` (a defect after phase 1, because the attaching process took a strictly greater epoch and no other process may hold the writer lock).
- **Ledger state for the task's current attempt** — `none`, `intended_idempotent`, `intended_non_idempotent`, or `committed`. When a task's current attempt has several entries, the state is the most severe unresolved one: any `intended` and non-idempotent entry yields `intended_non_idempotent`; otherwise any `intended` entry yields `intended_idempotent`; otherwise `committed`.
- **Deadline** — `elapsed` when `now >= attemptStartedAt + limits.taskTimeoutMs`, otherwise `not_elapsed`. A task with no `attemptStartedAt` is `not_elapsed`.

| # | Pre-batch state | Ledger | Deadline | Decision | Emitted sequence | Resulting state |
|---|---|---|---|---|---|---|
| R0 | `running`, `activation != null` | any | any | `reclaim_activation` | `LeaseExpired` | `ready` |
| R1 | `running`, `activation == null` | `committed` **and** a matching `pendingResults` entry exists | any | `adopt` | `WorkerSucceeded{ result, proposedTasks }` built from `AdoptableResult` | `succeeded` |
| R1x | `running`, `activation == null` | `committed` **and no** matching `pendingResults` entry | any | `escalate` | `TaskBlocked{ reason: 'unreconstructable_result:<effectId>' }` | `blocked` |
| R2 | `running` | `intended_non_idempotent` | any | `escalate` | `TaskBlocked{ reason: 'indeterminate_effect:<effectId>' }` | `blocked` |
| R3 | `running` | `intended_idempotent` | `not_elapsed` | `reclaim` | `LeaseExpired` | `ready` |
| R4 | `running` | `intended_idempotent` | `elapsed`, `n < N` | `retry_timeout` | `TaskTimedOut{ kind: 'task' }`, `RetryScheduled` | `awaiting_retry` |
| R5 | `running` | `intended_idempotent` | `elapsed`, `n >= N` | `exhaust_timeout` | `TaskTimedOut{ kind: 'task' }` | `failed` |
| R6 | `running` | `none` | `not_elapsed` | `reclaim` | `LeaseExpired` | `ready` |
| R7 | `running` | `none` | `elapsed`, `n < N` | `retry_timeout` | `TaskTimedOut{ kind: 'task' }`, `RetryScheduled` | `awaiting_retry` |
| R8 | `running` | `none` | `elapsed`, `n >= N` | `exhaust_timeout` | `TaskTimedOut{ kind: 'task' }` | `failed` |
| R9 | `leased` | not applicable | not applicable | `reclaim` | `LeaseExpired` | `ready` |
| R10 | any other non-terminal state | any | any | `none` | *(no event)* | unchanged |
| R11 | terminal | any | any | `none` | *(no event)* | unchanged |

Every emitted event presents the task's **existing** `lease.fencingToken`, which is still present in the restored record because no earlier event in the batch cleared it. The store's fencing check therefore passes, and the single event both clears the lease and performs the transition, which is what removes the need for a separate `LeaseExpired`.

This does not weaken fencing. The fencing check compares the presented token with the active lease's token and says nothing about the lease's writer epoch, so the recovering process can present it. The **pre-crash worker** cannot: its envelope carries the superseded `writerEpoch`, and the append is rejected with `StaleWriterEpoch` before the fencing check is ever reached. The two levels do exactly what [LEASES-AND-SCHEDULING.md](LEASES-AND-SCHEDULING.md) says they do — the epoch fences whole processes, the token fences claims within a process — and recovery is the current process acting on a claim no live process holds.

Rows R9 and R10 are why a `leased` task never consults the ledger: `attempt` advances at `DispatchStarted`, so a task that was leased but never dispatched has no in-flight attempt and no entry for one. Its ledger entries, if any, belong to a completed earlier attempt and are not the current attempt's.

### R0, R1, and R1x — what TASK-024 changes and why

Finding A-104 established that TASK-016's R1 could not be executed: the committed ledger entry retained only `resultDigest`, and `WorkerSucceeded` requires a complete `TaskResultSummary` plus `proposedTasks`. Neither `RecoveryContext` nor `ReconciliationDecision` supplied the missing artifact paths, summary, completion timestamp, or task proposals. Recovery therefore could not construct the transition the table called legal, after exactly the crash window it exists to recover.

TASK-024 takes the first of the two remedies the finding named — durably record the complete adoptable result before commitment — because the second, a recovery-specific adoption event, would give the state machine two ways to reach `succeeded` and two sets of guards to review, which is what ADR-0013 rejected when it made one transition table the sole authority.

**The ordering that makes R1 executable.** For the effect that registers a task's own result, the supervisor appends, in this order:

```text
1. WorkerResultRecorded { taskId, attempt, adoptable }     durable; changes no state field
2. EffectIntentRecorded { effectId, isTaskResultEffect: true }
3. ... the effect is performed ...
4. EffectCommitted { effectId, resultDigest }
5. WorkerSucceeded { result, proposedTasks }               the transition
```

A `committed` result effect therefore always has a durable `AdoptableResult` behind it, because step 1 precedes step 4. Recovery reads `context.pendingResults[taskId]` and emits the same `WorkerSucceeded` an uninterrupted run would have emitted at step 5. `pendingResults[taskId]` is cleared by `WorkerSucceeded`, so an adopted result is not left behind for a later attempt to re-adopt.

**The fate of `proposedTasks`, stated explicitly.** They are recorded verbatim in `AdoptableResult.proposedTasks`, never digested and never truncated. When recovery adopts, they are carried into the emitted `WorkerSucceeded` and admitted by the same guards an uninterrupted run applies. Losing them can change the terminal task graph, so the design does not permit losing them.

**R1x is the honest residual.** If a result effect is `committed` and no matching `pendingResults` entry exists — a defect, or a record restored from a checkpoint written by a non-conforming implementation — recovery does **not** synthesize a partial `WorkerSucceeded`. It escalates to `blocked` with `unreconstructable_result`, naming the effect, and emits a `RunEvent` with code `RECOVERY_RESULT_UNRECONSTRUCTABLE`. A blocked task naming a defect is recoverable by a human; a terminal task graph silently missing a proposal is not.

**R0 is why an activation is never adopted.** A control-plane activation's consumption is `IngressRangeConsumed` plus its effects plus `WorkerSucceeded` in one batch. Either that batch committed — in which case the task is no longer `running` and R0 does not apply — or it did not, in which case the cursor is unchanged and no ledger row exists. Re-consuming the identical range with identical effects is the designed behavior, so the correct decision is always `reclaim`, and R0 states it as its own row rather than leaving it to be inferred from the ledger. R0 takes priority over R1 through R8.

**Priority order and why.** When several conditions hold, the table resolves them in the order activation > committed-with-adoptable > committed-without-adoptable > indeterminate-non-idempotent > deadline > reclaim.

- An activation outranks everything because its consumption is atomic with its result, so no other input can be more informative than the cursor already is.
- `committed` outranks an elapsed deadline because a committed effect is recorded fact. Timing out work that demonstrably finished would re-execute it and duplicate the effect, which is the exact outcome the ledger exists to prevent.
- `intended_non_idempotent` outranks an elapsed deadline because a timeout leads to a retry, and retrying an indeterminate non-idempotent effect is the one action the guarantee in [RETRIES-TIMEOUTS-AND-IDEMPOTENCY.md](RETRIES-TIMEOUTS-AND-IDEMPOTENCY.md) explicitly refuses to take.
- An elapsed deadline outranks reclaim so that a deadline that passed during the outage is honored rather than silently restarted, which was the purpose of the superseded phase 6.

**The `current_epoch` lease defect.** After phase 1 the attaching process holds a strictly greater writer epoch and no other process may hold the writer lock, so a lease recorded at the current epoch cannot exist. TASK-002 said this case is "reported"; that left the decision undefined, which is not compatible with a total table. TASK-016 defines it: the task is reconciled by the same row it would take with a `superseded` lease, because no live holder can exist, **and** a `RunEvent` with code `RECOVERY_LEASE_EPOCH_DEFECT` is emitted naming the task and both epochs. The run is not failed. The most likely cause is the backwards-clock-jump risk already recorded in [CRASH-RECOVERY.md](CRASH-RECOVERY.md), and refusing to recover the run over it would be a worse outcome than reconciling and reporting.

**Determinism.** Decisions are computed in `(createdSeq, taskId)` order and the resulting events are emitted in that order, followed by `RunRecoveryCompleted` last. Because no two decisions address the same task, any permutation of the task-addressed events yields the identical `RunRecord`; the fixed order exists so the journal is byte-reproducible, not because correctness depends on it.

### Test obligations for A-002

TASK-006 owns the transition-table tests; TASK-008 owns the batch-order and end-to-end recovery tests.

1. **Total decision table.** For the cross product of pre-batch task state ∈ {`pending`, `ready`, `leased`, `running`, `awaiting_retry`, `blocked`, `quiescent`, `succeeded`, `failed`, `cancelled`}, lease state ∈ {`none`, `superseded`, `current_epoch`}, ledger state ∈ {`none`, `intended_idempotent`, `intended_non_idempotent`, `committed`, `mixed`}, deadline ∈ {`elapsed`, `not_elapsed`}, **`activation` ∈ {null, present}**, and **`pendingResults` entry ∈ {absent, present}**, assert exactly one decision is produced and that its emitted sequence is legal from that pre-batch state. No combination may produce two decisions, zero decisions, or an `IllegalTransition`. The last two axes are added under TASK-024 for rows R0, R1, and R1x.
2. **Batch legality.** For each decision row, append the produced batch through the real transition function against the restored record and assert `AppendResult.ok`. This is the test the superseded design would have failed for rows R1, R2, R4, R5, R7, and R8.
3. **Batch order independence.** For a run with tasks in every reconcilable combination, assert that applying the batch under any permutation of its task-addressed events yields a byte-identical `RunRecord` under canonical JSON.
4. **`RunRecoveryCompleted` position.** Assert that a batch placing it anywhere but last is rejected, because a task-addressed event after it would be addressed to a run in `running` while recovery is still reconciling.
5. **One event per entity.** Assert that a batch containing two task-addressed events for the same task is rejected, except for the fixed `TaskTimedOut`/`RetryScheduled` pair of rows R4 and R7, whose legality is proven by the table.
6. **Crash during recovery.** Assert that a crash at each append boundary of the recovery batch leaves the run exactly as restored, and that the next attach computes the identical decision set from the identical inputs.
7. **Adoption beats timeout.** Assert that a task whose effect is `committed` and whose deadline elapsed reaches `succeeded`, not `awaiting_retry`, and that no second `EffectIntentRecorded` is produced for it.

### Test obligations added for A-101 … A-104 under TASK-024

TASK-006 owns 8 through 12; TASK-005 owns 13 and 14; TASK-008 owns 15.

8. **Adopted result is complete.** Crash between `EffectCommitted` and `WorkerSucceeded` for a task whose result carried three artifact paths and two `proposedTasks`. Assert recovery emits a `WorkerSucceeded` whose `result` and `proposedTasks` are byte-identical to the uninterrupted run's under canonical JSON, that the two proposals are admitted, and that the terminal task graph equals the uninterrupted run's.
9. **Unreconstructable result escalates.** With a `committed` result effect and no `pendingResults` entry, assert the decision is `escalate` with reason `unreconstructable_result`, that no `WorkerSucceeded` is emitted, and that `RECOVERY_RESULT_UNRECONSTRUCTABLE` is emitted.
10. **Activation is never adopted.** With an activation task in `running`, any ledger state, and any deadline, assert the decision is `reclaim_activation`, that the cursor is unchanged, that no consumption row was added, and that the next activation consumes the identical range.
11. **One verdict, every relation.** Record one `GateVerdictRecorded` carrying three relations. Assert three `GateVerdictRecord` entries appear, one per target; that all three relations close or all three stay open; that the three lineage rounds it names receive the same verdict; and that no event exists that could record a verdict for a subset.
12. **Terminal-task evidence exceptions.** Assert exactly four event types are legal against a terminal task — `ArtifactPublished`, `GateVerdictRecorded`, `BranchIntegrated`, `RemediationCompleted` — and that every other member of the union is rejected, so the diagram's list and this table's list are the same list.
13. **Owner form is rejected.** Load a graph holding `{ edge: 'gate_passed', task: <a gate task>, gate: 'qa' }`. Assert `GRAPH_GATE_PASSED_OWNER_FORM`, that the message names the lineage carrying the relation, and that the graph is refused rather than stalled.
14. **Publication class is declared.** Assert a record omitting `publicationClass` is rejected with `GRAPH_PUBLICATION_CLASS_MISSING`, that a `local-only` publication satisfies `review_ready` for a `bootstrap` task and not for a `runtime` one, and that no run-global flag can change either answer.
15. **Drain never returns with a live descendant.** With a tree that cannot be verified closed within the total budget, assert no `RunDrainCompleted` is appended, that `RunDrainBlocked` names the invocation, that the run is still `pausing`, and that the command exits 5.

## Observable pre- and post-conditions

| Operation | Pre-condition | Post-condition |
|---|---|---|
| `applyEvent` returns `ok` | `envelope.seq == run.stateVersion + 1`, run is non-terminal, guard holds | `run.stateVersion` incremented by exactly 1; at most one task or the run changed state; `updatedAt` set from `occurredAt` |
| `applyEvent` returns `IllegalTransition` | Any guard fails | Input record is unmodified; `stateVersion` unchanged; the caller must not append |
| Batch append of `k` events | `expectedVersion == run.stateVersion` | Either all `k` are applied and `stateVersion` advances by `k`, or none are applied. Durability of that post-condition across a crash is established by the batch commit record in [DURABLE-STATE-AND-CHECKPOINTS.md](DURABLE-STATE-AND-CHECKPOINTS.md), not by validation order alone |
| Recovery batch | Run is `recovering`; one decision per task | Every event in the batch is legal from the restored pre-batch state, by construction |

"At most one" replaces TASK-002's "exactly one" because the union now contains events that record durable facts without changing a state field — gate verdicts, publication records, control acceptances, workspace and process-group records. Each still advances `stateVersion` by exactly one, so replay determinism and the fencing derivation are unaffected.

Batch atomicity matters for bootstrap and for recovery reconciliation, both of which must be all-or-nothing.

## Diagrams

- [Run state diagram](../../../diagrams/architecture/runtime-state-machine.md)
