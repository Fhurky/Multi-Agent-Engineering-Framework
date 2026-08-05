# Runtime State Diagrams

Source diagrams for the run and task state machines. Produced under TASK-002, amended under TASK-016.

- Specification: [STATE-MACHINE.md](../../docs/architecture/runtime/STATE-MACHINE.md)
- Decisions: [ADR-0003](../../docs/adr/0003-deterministic-run-and-task-state-machine.md), extended by [ADR-0013](../../docs/adr/0013-single-decision-recovery-reconciliation.md) and [ADR-0015](../../docs/adr/0015-typed-scheduling-gate-and-activation-contracts.md)

Amended by TASK-016: the task diagram gains the `quiescent` state and its two edges, and the `pending -> ready` edge is relabelled, because dependency satisfaction is now per typed edge rather than "every dependency is `succeeded`".

The transition tables in the specification are normative. These diagrams are a reading aid and omit the `RunCancelled` edge from every non-terminal task state for legibility. They also omit the events that record a durable fact without changing a state — gate verdicts, publication, integration, control acceptance, process-group and workspace records — which are listed in the specification.

## Run states

```mermaid
stateDiagram-v2
  [*] --> initializing : RunBootstrapped
  initializing --> running : RunStarted
  initializing --> failed : RunCompleted(bootstrap_failed)

  running --> pausing : RunPauseRequested
  running --> draining : RunStopRequested
  running --> recovering : RunResumeRequested (stale writer epoch)
  running --> succeeded : RunCompleted(all_tasks_succeeded)
  running --> failed : RunCompleted(task_failed | no_progress)

  pausing --> paused : RunDrainCompleted(pause)
  pausing --> draining : RunStopRequested

  paused --> recovering : RunResumeRequested

  draining --> cancelled : RunDrainCompleted(stop)

  recovering --> running : RunRecoveryCompleted
  recovering --> failed : RunCompleted(recovery_failed)

  succeeded --> [*]
  failed --> [*]
  cancelled --> [*]
```

`running --> recovering` is what makes a crash detectable without a crash marker: a persisted run in `running` whose writer epoch is stale is by definition a run whose process died.

## Task states

```mermaid
stateDiagram-v2
  [*] --> pending : TaskCreated
  pending --> ready : TaskDependenciesSatisfied<br/>(every typed edge satisfied)

  ready --> leased : LeaseGranted
  ready --> quiescent : TaskQuiesced (activation task, cursor at max)
  leased --> running : DispatchStarted (workspace prepared)
  leased --> ready : LeaseExpired / LeaseReleased

  running --> succeeded : WorkerSucceeded (activation == null)
  running --> quiescent : WorkerSucceeded (activation task,<br/>no unconsumed event remains)
  running --> ready : WorkerSucceeded (activation task,<br/>unconsumed event remains)
  running --> awaiting_retry : WorkerFailed(retry, attempt < max)<br/>TaskTimedOut(attempt < max)
  running --> failed : WorkerFailed(retry, attempt = max)<br/>WorkerFailed(fail)<br/>TaskTimedOut(attempt = max)
  running --> blocked : WorkerFailed(escalate)<br/>TaskBlocked(indeterminate_effect |<br/>workspace_lock_not_releasable)
  running --> ready : LeaseExpired

  awaiting_retry --> awaiting_retry : RetryScheduled (sets notBefore)
  awaiting_retry --> ready : BackoffElapsed
  blocked --> ready : TaskUnblocked
  quiescent --> ready : TaskActivated(throughSeq > cursor)

  succeeded --> [*]
  failed --> [*]
  cancelled --> [*]
```

Details the diagram encodes deliberately:

- `attempt` increments at `DispatchStarted`, so the `leased --> ready` edge costs no retry budget. Scheduler churn cannot exhaust a task.
- `blocked` is not terminal. It is the resting place for work that a human or another role can still unblock, and it is why the CLI has a distinct exit code 3.
- `quiescent` is not terminal and is **not** `blocked`. It is the resting place for event-triggered recurring work whose cursor has caught up. It waits on an event the runtime will append, not on a decision a human must make, so it does not drive exit code 3 and it counts as settled for the completion predicate.
- There is no `quiescent --> leased` edge. A quiescent task must pass through `TaskActivated`, which records the range it will consume. Dispatching without one is the control-plane loop the state exists to prevent.
- The cursor advances only on `WorkerSucceeded`, never on `TaskActivated`, which is what makes an activation exactly-once across a crash.

## Recovery reconciliation

Recovery emits exactly one decision per task, and each decision expands to one event sequence already present in the diagram above. It introduces no new state and no new edge — that is the point of [ADR-0013](../../docs/adr/0013-single-decision-recovery-reconciliation.md). The superseded design emitted `LeaseExpired` and then a second event for the same task, which traverses `running --> ready` and then attempts an edge that exists only from `running`.

| Decision | Edge traversed |
|---|---|
| `adopt` | `running --> succeeded` by `WorkerSucceeded` |
| `escalate` | `running --> blocked` by `TaskBlocked` |
| `reclaim` | `running --> ready` or `leased --> ready` by `LeaseExpired` |
| `retry_timeout` | `running --> awaiting_retry` by `TaskTimedOut`, then `RetryScheduled` |
| `exhaust_timeout` | `running --> failed` by `TaskTimedOut` |

## Terminal states

| Level | Terminal states | Non-terminal resting states |
|---|---|---|
| Run | `succeeded`, `failed`, `cancelled` | `paused` |
| Task | `succeeded`, `failed`, `cancelled` | `blocked`, `quiescent`, `awaiting_retry` |

Every event addressed to a terminal run or a terminal task is rejected as `IllegalTransition`. The full illegal-transition list is in the specification.
