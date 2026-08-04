# Run and Task State Machine

Normative deterministic state machine for the autonomous runtime. Produced under TASK-002. Related decision: [ADR-0003](../../adr/0003-deterministic-run-and-task-state-machine.md). Implemented by TASK-006.

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

### Completion predicates

Evaluated only while the run is `running`, after every applied event batch.

```text
nonTerminal   = tasks where state not in {succeeded, failed, cancelled}
inFlight      = tasks where state in {leased, running}
progressable  = tasks where state in {ready, awaiting_retry}
                 or (state == pending and every dependency is succeeded)

S (succeeded) : nonTerminal is empty and no task ended in failed
F (failed)    : (nonTerminal is empty and at least one task ended in failed)
                or (inFlight is empty and progressable is empty and nonTerminal is not empty)
```

The second clause of `F` is the no-progress condition. It fires when every remaining task is `blocked` or `pending` behind a dependency that can never be satisfied. `terminalReason` records `no_progress` and names the blocking tasks, so the operator receives an actionable report rather than a hang.

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
| `succeeded` | Work completed and its result was aggregated | yes | no |
| `failed` | Work cannot complete; `lastFailure` is recorded | yes | no |
| `cancelled` | The run was stopped before this task completed | yes | no |

`blocked` is deliberately non-terminal. Retry exhaustion on an escalating failure class produces `blocked`, not `failed`, because the work is still achievable once a human or another role acts. Retry exhaustion on a retryable class produces `failed`.

## Task transition table

`n` is `attempt` after increment; `N` is `maxAttempts`.

| From | Event | Guard | To |
|---|---|---|---|
| *(none)* | `TaskCreated` | admission guards hold (see below) | `pending` |
| `pending` | `TaskDependenciesSatisfied` | every dependency is `succeeded` | `ready` |
| `pending` | `RunCancelled` | — | `cancelled` |
| `ready` | `LeaseGranted` | no active lease; token strictly greater than every prior token for this task | `leased` |
| `ready` | `RunCancelled` | — | `cancelled` |
| `leased` | `DispatchStarted` | presented token equals the active lease token | `running` |
| `leased` | `LeaseExpired` | `occurredAt >= lease.expiresAt`, or lease epoch is stale | `ready` |
| `leased` | `LeaseReleased` | presented token equals the active lease token | `ready` |
| `leased` | `RunCancelled` | — | `cancelled` |
| `running` | `WorkerSucceeded` | presented token equals the active lease token | `succeeded` |
| `running` | `WorkerFailed` | disposition `retry` and `n < N` | `awaiting_retry` |
| `running` | `WorkerFailed` | disposition `retry` and `n >= N` | `failed` |
| `running` | `WorkerFailed` | disposition `fail` | `failed` |
| `running` | `WorkerFailed` | disposition `escalate` | `blocked` |
| `running` | `TaskTimedOut` | `n < N` | `awaiting_retry` |
| `running` | `TaskTimedOut` | `n >= N` | `failed` |
| `running` | `LeaseExpired` | `occurredAt >= lease.expiresAt`, or lease epoch is stale | `ready` |
| `running` | `TaskBlocked` | indeterminate effect detected during recovery | `blocked` |
| `running` | `RunCancelled` | — | `cancelled` |
| `awaiting_retry` | `BackoffElapsed` | `occurredAt >= notBefore` | `ready` |
| `awaiting_retry` | `RunCancelled` | — | `cancelled` |
| `blocked` | `TaskUnblocked` | an unblock record with a reason is present | `ready` |
| `blocked` | `RunCancelled` | — | `cancelled` |
| `succeeded`, `failed`, `cancelled` | any | — | **illegal** |

### Effects of each transition on the task record

| Transition | Record effects |
|---|---|
| `LeaseGranted` | Sets `lease`; does not change `attempt` |
| `DispatchStarted` | Increments `attempt`; records `idempotencyKey` for that attempt |
| `WorkerSucceeded` | Clears `lease`; sets `result`; clears `lastFailure` |
| `WorkerFailed`, `TaskTimedOut` | Clears `lease`; sets `lastFailure` |
| `LeaseExpired` | Clears `lease`; leaves `attempt` unchanged |
| `RetryScheduled` | Sets `notBefore` (emitted with the transition into `awaiting_retry`) |
| `BackoffElapsed` | Clears `notBefore` |
| `TaskBlocked` | Sets `blockedReason`; clears `lease` |
| Any transition | Sets `updatedAt` from `envelope.occurredAt` |

`attempt` is incremented at `DispatchStarted`, not at `LeaseGranted`. A lease that expires before dispatch therefore does not consume an attempt, which prevents scheduler churn from exhausting a task's retry budget.

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

## Dynamic task admission

The task graph is not fixed at bootstrap. A worker result may carry `proposedTasks`; the supervisor admits them by emitting `TaskCreated` for each. Admission guards, all enforced inside `applyEvent`:

1. `taskId` is unique within the run.
2. `ownerRole` exists in `config/agents/settings.yaml`, is enabled, and has a non-null `llm`.
3. `writeScope` is non-empty and is a subset of the owner role's configured write scope.
4. Every entry in `dependencies` refers to a task that already exists in the run.
5. Adding the task introduces no cycle in the dependency graph.
6. `createdSeq` is assigned by the supervisor from a per-run monotonic counter, giving every task a stable, deterministic admission order.

A proposal that violates any guard is rejected as `IllegalTransition`; the proposing task transitions to `blocked` with reason `invalid_task_proposal` rather than the run failing. This keeps an ill-formed Manager output from destroying an otherwise healthy run.

Write-scope overlap is **not** an admission guard. Two tasks with overlapping scopes may coexist in the graph; the scheduler simply never leases them concurrently. See [LEASES-AND-SCHEDULING.md](LEASES-AND-SCHEDULING.md).

## Observable pre- and post-conditions

| Operation | Pre-condition | Post-condition |
|---|---|---|
| `applyEvent` returns `ok` | `envelope.seq == run.stateVersion + 1`, run is non-terminal, guard holds | `run.stateVersion` incremented by exactly 1; exactly one task or the run changed state; `updatedAt` set from `occurredAt` |
| `applyEvent` returns `IllegalTransition` | Any guard fails | Input record is unmodified; `stateVersion` unchanged; the caller must not append |
| Batch append of `k` events | `expectedVersion == run.stateVersion` | Either all `k` are applied and `stateVersion` advances by `k`, or none are applied |

Batch atomicity matters for bootstrap and for recovery reconciliation, both of which must be all-or-nothing.

## Diagrams

- [Run state diagram](../../../diagrams/architecture/runtime-state-machine.md)
