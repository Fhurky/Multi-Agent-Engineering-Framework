# Run and Task State Machine

Normative deterministic state machine for the autonomous runtime. Produced under TASK-002, amended under TASK-016. Related decisions: [ADR-0003](../../adr/0003-deterministic-run-and-task-state-machine.md), as extended by [ADR-0013](../../adr/0013-single-decision-recovery-reconciliation.md) and [ADR-0015](../../adr/0015-typed-scheduling-gate-and-activation-contracts.md). Implemented by TASK-006.

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
| `pausing` | `RunDrainCompleted(pause)` | no task is `running`, or the drain deadline elapsed | `paused` |
| `pausing` | `RunStopRequested` | pause intent escalated to stop | `draining` |
| `paused` | `RunResumeRequested` | writer lock acquired with a strictly greater epoch | `recovering` |
| `draining` | `RunDrainCompleted(stop)` | no task is `running`, or the drain deadline elapsed | `cancelled` |
| `recovering` | `RunRecoveryCompleted` | reconciliation finished and every reclaimable lease was released | `running` |
| `recovering` | `RunCompleted(failed)` | no valid checkpoint could be restored | `failed` |
| `succeeded`, `failed`, `cancelled` | any | — | **illegal** |

`RunResumeRequested` is legal from `running` because a crashed process leaves the persisted run in `running`. The attaching process detects the stale writer epoch and moves the run through `recovering` rather than resuming dispatch blindly. See [CRASH-RECOVERY.md](CRASH-RECOVERY.md).

### Run-addressed events that do not change run state

Added under TASK-016. Each is legal from every non-terminal run state, records the effect named below, and leaves `RunState` unchanged. `stateVersion` still advances by one, because every applied event advances it.

| Event | Guard | Record effect |
|---|---|---|
| `ControlRequestAccepted` | `requestId` has not already been accepted in this run; `targetWriterEpoch === run.writerEpoch` | Appends the request to `run.acceptedControlRequests`, making consumption exactly-once and durably ordered |
| `ActivationEventAppended` | `eventType` is in the closed `ActivationEventType` set | Appends an `ActivationEventRecord` with `seq = run.nextActivationSeq`, then increments `nextActivationSeq` |
| `HumanDecisionRecorded` | `decisionId` not already recorded | Appends to `run.humanDecisions` |

`ControlRequestAccepted` is legal in `pausing`, `draining`, and `recovering` as well as `running`, because an operator may escalate a pause to a stop while the drain is in progress. What the accepted request is then permitted to do is decided by the run transition it proposes, not by the acceptance.

### Completion predicates

Evaluated only while the run is `running`, after every applied event batch.

```text
inFlight      = tasks where state in {leased, running}
activatable   = tasks where state == quiescent
                 and maxSubscribedActivationSeq(task) > task.activation.lastConsumedEventSeq
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
| `ready` | `TaskQuiesced` | `activation != null` and no unconsumed subscribed activation event exists | `quiescent` |
| `ready` | `RunCancelled` | — | `cancelled` |
| `leased` | `DispatchStarted` | presented token equals the active lease token | `running` |
| `leased` | `LeaseExpired` | `occurredAt >= lease.expiresAt`, or lease epoch is stale | `ready` |
| `leased` | `LeaseReleased` | presented token equals the active lease token | `ready` |
| `leased` | `RunCancelled` | — | `cancelled` |
| `running` | `WorkerSucceeded` | presented token equals the active lease token; `activation == null` | `succeeded` |
| `running` | `WorkerSucceeded` | presented token equals the active lease token; `activation != null`; no unconsumed subscribed event remains after the cursor advance | `quiescent` |
| `running` | `WorkerSucceeded` | presented token equals the active lease token; `activation != null`; an unconsumed subscribed event remains after the cursor advance | `ready` |
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
| `quiescent` | `TaskActivated` | `throughSeq > activation.lastConsumedEventSeq` and `throughSeq` equals the highest subscribed activation `seq` | `ready` |
| `quiescent` | `RunCancelled` | — | `cancelled` |
| `succeeded`, `failed`, `cancelled` | any state-changing event | — | **illegal** |

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
| `WorkspaceFinalizeIntended`, `WorkspaceFinalized`, `WorkspaceAbandoned`, `WorkspaceReconciled` | `running`, `ready`, `blocked`, `awaiting_retry` | Maintains `run.workspaces` and `TaskRecord.publication`; see [WORKSPACE-LIFECYCLE.md](WORKSPACE-LIFECYCLE.md) |
| `ArtifactPublished` | `running`, `succeeded` | Sets `TaskRecord.publication`, which is what makes `review_ready` satisfiable |
| `GateVerdictRecorded` | **any** state of the target, terminal included | Appends to the target's `gateVerdicts`; never rewrites an existing round |
| `BranchIntegrated` | `succeeded` | Sets `TaskRecord.integration` |
| `DependencyUnsatisfiable` | `pending` | Sets `blockedReason` context consumed by the no-progress predicate |
| `RemediationCompleted` | `succeeded` | Records the remediation link for finding traceability |

### Evidence events and the terminal-task rule

The task transition table ends with "`succeeded`, `failed`, `cancelled` | any | **illegal**". That rule governs events that would **change** a task's state; a terminal outcome is already reported and must not be rewritten.

Four of the events above are legal against a terminal task and are the only exceptions: `ArtifactPublished`, `GateVerdictRecorded`, `BranchIntegrated`, and `RemediationCompleted`. Without the exception the model would be incoherent, because assembly gates run **after** their target succeeded and merged, by definition: a task's `gateTasks` are what block `done`, and a target that must be terminal before its gate task can even be dispatched could then never have that verdict recorded.

The exception is narrow and safe for three reasons: none of the four changes `TaskState`; none can rewrite a value, because `gateVerdicts` is append-only, `integration` may be set only once, and `publication` may only be superseded forward; and none applies to a terminal **run**, whose events remain illegal without exception.

`GateVerdictRecorded` and `ArtifactPublished` are addressed to a task that is not necessarily the task producing them: a gate task records a verdict against its target. The event therefore names both `gateTaskId` and `targetTaskId`, and its guard is evaluated against the target. This is the only event class in the union that mutates a task other than the one whose worker produced it, and it is why gate verdicts are durable evidence rather than an in-memory scheduling artifact.

### Effects of each transition on the task record

| Transition | Record effects |
|---|---|
| `LeaseGranted` | Sets `lease`; does not change `attempt` |
| `DispatchStarted` | Increments `attempt`; records `idempotencyKey` for that attempt; sets `attemptStartedAt` from `envelope.occurredAt` |
| `WorkerSucceeded` | Clears `lease`; clears `attemptStartedAt`; sets `result`; clears `lastFailure`; when `activation != null`, advances `activation.lastConsumedEventSeq` to `activation.pendingThroughSeq` and clears `pendingThroughSeq` |
| `WorkerFailed`, `TaskTimedOut` | Clears `lease`; clears `attemptStartedAt`; sets `lastFailure`; when `activation != null`, leaves `activation.lastConsumedEventSeq` unchanged |
| `LeaseExpired` | Clears `lease`; clears `attemptStartedAt`; leaves `attempt` unchanged |
| `RetryScheduled` | Sets `notBefore` |
| `BackoffElapsed` | Clears `notBefore` |
| `TaskBlocked` | Sets `blockedReason`; clears `lease`; clears `attemptStartedAt` |
| `TaskActivated` | Sets `activation.pendingThroughSeq = throughSeq`; leaves `lastConsumedEventSeq` unchanged |
| `TaskQuiesced` | Clears `activation.pendingThroughSeq`; sets `activation.state = 'quiescent'` |
| Any transition | Sets `updatedAt` from `envelope.occurredAt` |

`attempt` is incremented at `DispatchStarted`, not at `LeaseGranted`. A lease that expires before dispatch therefore does not consume an attempt, which prevents scheduler churn from exhausting a task's retry budget.

`attemptStartedAt` is added under TASK-016. TASK-002 required the watchdog to time out "a task in `running` whose `attempt` started more than `taskTimeoutMs` ago" and required recovery to reconcile an elapsed deadline, but no field recorded when the attempt started; `updatedAt` is overwritten by every intervening lease renewal and effect event. Without it, neither the watchdog nor the recovery decision table below is a function of the record, which breaks both determinism and the A-002 requirement that every combination of lease state, ledger state, and elapsed deadline map to exactly one transition.

The cursor rule for activation tasks is the load-bearing half of exactly-once consumption: `TaskActivated` records only the **intent** to consume through `throughSeq`, and the cursor advances only in the same append that records the successful result. A crash at any point between them leaves the cursor where it was, so the same range is consumed again by the next activation with identical effects.

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
| `quiescent -> leased` | Skips `TaskActivated`; a quiescent task would be dispatched with no consumed range and would loop forever, which is exactly the control-plane starvation defect the state exists to prevent |
| `TaskActivated` with `throughSeq <= activation.lastConsumedEventSeq` | Would re-consume an already-consumed range and break monotonicity |
| `TaskActivated` for a task with `activation == null` | Only declared recurring work has a cursor |
| `TaskQuiesced` while an unconsumed subscribed event exists | Would silently drop a lifecycle event |
| `GateVerdictRecorded` whose `(gate, round)` already exists on the target | A verdict is durable; a later round supersedes it and never rewrites it |
| `GateVerdictRecorded` whose `round` is not strictly greater than the highest recorded round for that gate | Rounds are monotonic; an out-of-order round would make gate status ambiguous |
| `GateVerdictRecorded` whose `gateTaskId` equals `targetTaskId` | A task may not gate itself |
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
8. `gateFor`, when present, names an existing target task and agrees with that target's `gateTasks` entry on gate name and round. A task whose `gateFor` names target X may hold a `review_ready(X)` edge and must hold no `gate_passed(X)`, `integrated(X)`, or `terminal(X)` edge.
9. No task owning a gate in X's `preMergeGates` holds an `integrated(X)` edge.
10. `activation`, when present, names a non-empty subset of `ActivationEventType`, a `lastConsumedEventSeq >= 0`, and no `pendingThroughSeq`.
11. `resourceLock`, when present, is a non-empty machine-readable name.

Guards 7 through 9 are the three structural no-deadlock invariants stated in `tasks/TASK-001-DEPENDENCY-GRAPH.md`, enforced at admission rather than discovered at run time. A graph that violates one of them does not stall; it is rejected with a named diagnostic.

A proposal that violates any guard is rejected as `IllegalTransition`; the proposing task transitions to `blocked` with reason `invalid_task_proposal` rather than the run failing. This keeps an ill-formed Manager output from destroying an otherwise healthy run.

Write-scope overlap is **not** an admission guard, and neither is a held resource lock. Two tasks with overlapping scopes or the same lock may coexist in the graph; the scheduler simply never leases them concurrently. See [LEASES-AND-SCHEDULING.md](LEASES-AND-SCHEDULING.md).

## Typed dependency edges

Added under TASK-016 to resolve A-004. The vocabulary and the satisfying conditions are the ones recorded in `tasks/TASK-001-DEPENDENCY-GRAPH.md`, name for name, so a task record written against that document compiles against these contracts without restatement.

| Edge | Written as | Satisfied when |
|---|---|---|
| `review_ready` | `{ edge: 'review_ready', task: X }` | X has a durable `publication` whose `publishedCommit` is set and immutable, whose `publishedBranch` is X's derived task branch, and whose `publication` field is `published`. `local-only` satisfies this edge only when `limits.allowLocalOnlyPublication` is true, which is an operator-recorded acceptance rather than a default. X's own state is irrelevant; the edge says nothing about merge |
| `integrated` | `{ edge: 'integrated', task: X }` | `review_ready(X)` holds, **every** gate in X's `preMergeGates` is closed, and X's `integration` record names a merge into the configured integration branch |
| `gate_passed` | `{ edge: 'gate_passed', task: X, gate: g }` | `review_ready(X)` holds and gate `g` of X is **closed** under the gate-round rule below |
| `gate_recorded` | `{ edge: 'gate_recorded', task: X }` | X's `gateFor` is set and X has recorded a verdict for it, whatever that verdict is |
| `human_decision` | `{ edge: 'human_decision', decision: D }` | A `HumanDecisionRecorded` entry for D exists in the run |
| `terminal` | `{ edge: 'terminal', task: X }` | X is `succeeded`, `integrated(X)` holds, and every gate in X's `gateTasks` is closed. Reserved: the graph validator accepts the edge and expands it, and rejects it when the expansion produces a cycle. It exists so misuse is refused rather than silently deadlocking |

Two properties follow directly and are why the runtime can now execute the committed graph:

- A gate task is dispatchable while its target is unmerged, because `review_ready` is satisfiable from a published commit alone. That removes the pre-merge review deadlock.
- A consumer is released only when its dependency's own pre-merge gates have closed, because `integrated` expands to include them. That prevents releasing a consumer before its dependency's blocking gate passed.

### Gate rounds and gate closure

`requiredGates` names every gate a task must pass before `done`. `preMergeGates` is the subset that must close before the task may be integrated; the remainder are **assembly gates**, which run after merge and block only `done`. A task with an empty `preMergeGates` is integrable as soon as it is `review_ready` and reached in merge order.

`gateTasks` is the target's view of who gates it. `gateFor` is the gate task's view of what it gates. They are not scheduling edges, they point in opposite directions, and admission guard 8 requires them to agree pairwise including on `round`. A `round` defaults to 1 when omitted; only a gate recorded more than once needs an explicit round on both sides.

Gate status is computed, never stored as a mutable field:

1. The status of a gate is the verdict recorded at its **highest** round.
2. A `changes-required` verdict at round *n* must name `remediatedBy` and `revalidatedBy`. The gate stays open.
3. The gate is **closed** when the highest round records `approved`, or `approved-with-findings` with `blockingFindingsOpen === 0`, or `formally-accepted` carrying a recorded human decision identifier.
4. A verdict is durable. A later round supersedes an earlier one; both stay recorded in `gateVerdicts`, which is append-only.

Durability is structural, not procedural: `gateVerdicts` has no update or delete operation, `applyEvent` rejects a `GateVerdictRecorded` for an existing `(gate, round)` pair, and it rejects a round that is not strictly greater than the highest already recorded. A verdict cannot be rewritten by any code path, including recovery, because there is no event that expresses rewriting one.

A superseding round is performed by a **new gate task**, not by re-entering the recorded one. The runtime enforces this by rejecting a `GateVerdictRecorded` whose `gateTaskId` already recorded a verdict for the same `(targetTaskId, gate)` at a lower round.

## Activation model for event-triggered recurring work

Added under TASK-016 to resolve the recurring-activation half of A-004. It is the runtime representation of the model specified in `tasks/blocked/TASK-013-task-record-lifecycle-and-gate-closure.md`.

**Event log.** `run.activationEvents` is append-only. Each record carries a strictly increasing integer `seq` assigned by `applyEvent` from `run.nextActivationSeq`, an `eventType` from the closed set, and the source reference it was read from. Records are never edited or removed; there is no event that expresses either.

```text
ActivationEventType =
  'gate_verdict_recorded' | 'artifact_published' | 'branch_integrated'
  | 'human_decision_recorded' | 'dependency_unsatisfiable' | 'remediation_completed'
```

The six names match `tasks/TASK-001-DEPENDENCY-GRAPH.md` exactly. The runtime appends an `ActivationEventAppended` alongside each of `GateVerdictRecorded`, `ArtifactPublished`, `BranchIntegrated`, `HumanDecisionRecorded`, `DependencyUnsatisfiable`, and `RemediationCompleted`, in the same batch, so the log cannot drift from the facts it indexes.

**Cursor.** A task's `activation.lastConsumedEventSeq` is monotonically non-decreasing. Nothing decreases it; `applyEvent` rejects any event that would.

**Dispatch condition.** A task is activatable when `max(seq of subscribed events) > lastConsumedEventSeq`. When they are equal the task is `quiescent` and the scheduler must not select it.

**Exactly-once consumption.** An activation consumes the contiguous range `(lastConsumedEventSeq, throughSeq]`. `TaskActivated` records `pendingThroughSeq` at the moment of activation; the cursor advances only in the append that carries `WorkerSucceeded`. Between them, a crash leaves the cursor unchanged, so the next activation consumes the same range, and the effects are identical because every effect a control-plane activation performs is idempotent. No interleaving consumes an event twice with effect, and none skips one.

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
| R1 | `running` | `committed` | any | `adopt` | `WorkerSucceeded` | `succeeded` |
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

**Priority order and why.** When several conditions hold, the table resolves them in the order committed > indeterminate-non-idempotent > deadline > reclaim.

- `committed` outranks an elapsed deadline because a committed effect is recorded fact. Timing out work that demonstrably finished would re-execute it and duplicate the effect, which is the exact outcome the ledger exists to prevent.
- `intended_non_idempotent` outranks an elapsed deadline because a timeout leads to a retry, and retrying an indeterminate non-idempotent effect is the one action the guarantee in [RETRIES-TIMEOUTS-AND-IDEMPOTENCY.md](RETRIES-TIMEOUTS-AND-IDEMPOTENCY.md) explicitly refuses to take.
- An elapsed deadline outranks reclaim so that a deadline that passed during the outage is honored rather than silently restarted, which was the purpose of the superseded phase 6.

**The `current_epoch` lease defect.** After phase 1 the attaching process holds a strictly greater writer epoch and no other process may hold the writer lock, so a lease recorded at the current epoch cannot exist. TASK-002 said this case is "reported"; that left the decision undefined, which is not compatible with a total table. TASK-016 defines it: the task is reconciled by the same row it would take with a `superseded` lease, because no live holder can exist, **and** a `RunEvent` with code `RECOVERY_LEASE_EPOCH_DEFECT` is emitted naming the task and both epochs. The run is not failed. The most likely cause is the backwards-clock-jump risk already recorded in [CRASH-RECOVERY.md](CRASH-RECOVERY.md), and refusing to recover the run over it would be a worse outcome than reconciling and reporting.

**Determinism.** Decisions are computed in `(createdSeq, taskId)` order and the resulting events are emitted in that order, followed by `RunRecoveryCompleted` last. Because no two decisions address the same task, any permutation of the task-addressed events yields the identical `RunRecord`; the fixed order exists so the journal is byte-reproducible, not because correctness depends on it.

### Test obligations for A-002

TASK-006 owns the transition-table tests; TASK-008 owns the batch-order and end-to-end recovery tests.

1. **Total decision table.** For the cross product of pre-batch task state ∈ {`pending`, `ready`, `leased`, `running`, `awaiting_retry`, `blocked`, `quiescent`, `succeeded`, `failed`, `cancelled`}, lease state ∈ {`none`, `superseded`, `current_epoch`}, ledger state ∈ {`none`, `intended_idempotent`, `intended_non_idempotent`, `committed`, `mixed`}, and deadline ∈ {`elapsed`, `not_elapsed`}, assert exactly one decision is produced and that its emitted sequence is legal from that pre-batch state. No combination may produce two decisions, zero decisions, or an `IllegalTransition`.
2. **Batch legality.** For each decision row, append the produced batch through the real transition function against the restored record and assert `AppendResult.ok`. This is the test the superseded design would have failed for rows R1, R2, R4, R5, R7, and R8.
3. **Batch order independence.** For a run with tasks in every reconcilable combination, assert that applying the batch under any permutation of its task-addressed events yields a byte-identical `RunRecord` under canonical JSON.
4. **`RunRecoveryCompleted` position.** Assert that a batch placing it anywhere but last is rejected, because a task-addressed event after it would be addressed to a run in `running` while recovery is still reconciling.
5. **One event per entity.** Assert that a batch containing two task-addressed events for the same task is rejected, except for the fixed `TaskTimedOut`/`RetryScheduled` pair of rows R4 and R7, whose legality is proven by the table.
6. **Crash during recovery.** Assert that a crash at each append boundary of the recovery batch leaves the run exactly as restored, and that the next attach computes the identical decision set from the identical inputs.
7. **Adoption beats timeout.** Assert that a task whose effect is `committed` and whose deadline elapsed reaches `succeeded`, not `awaiting_retry`, and that no second `EffectIntentRecorded` is produced for it.

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
