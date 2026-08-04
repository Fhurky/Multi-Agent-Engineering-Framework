# Runtime State Diagrams

Source diagrams for the run and task state machines. Produced under TASK-002.

- Specification: [STATE-MACHINE.md](../../docs/architecture/runtime/STATE-MACHINE.md)
- Decision: [ADR-0003](../../docs/adr/0003-deterministic-run-and-task-state-machine.md)

The transition tables in the specification are normative. These diagrams are a reading aid and omit the `RunCancelled` edge from every non-terminal task state for legibility.

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
  pending --> ready : TaskDependenciesSatisfied

  ready --> leased : LeaseGranted
  leased --> running : DispatchStarted
  leased --> ready : LeaseExpired / LeaseReleased

  running --> succeeded : WorkerSucceeded
  running --> awaiting_retry : WorkerFailed(retry, attempt < max)<br/>TaskTimedOut(attempt < max)
  running --> failed : WorkerFailed(retry, attempt = max)<br/>WorkerFailed(fail)<br/>TaskTimedOut(attempt = max)
  running --> blocked : WorkerFailed(escalate)<br/>TaskBlocked(indeterminate_effect)
  running --> ready : LeaseExpired

  awaiting_retry --> ready : BackoffElapsed
  blocked --> ready : TaskUnblocked

  succeeded --> [*]
  failed --> [*]
  cancelled --> [*]
```

Two details the diagram encodes deliberately:

- `attempt` increments at `DispatchStarted`, so the `leased --> ready` edge costs no retry budget. Scheduler churn cannot exhaust a task.
- `blocked` is not terminal. It is the resting place for work that a human or another role can still unblock, and it is why the CLI has a distinct exit code 3.

## Terminal states

| Level | Terminal states |
|---|---|
| Run | `succeeded`, `failed`, `cancelled` |
| Task | `succeeded`, `failed`, `cancelled` |

Every event addressed to a terminal run or a terminal task is rejected as `IllegalTransition`. The full illegal-transition list is in the specification.
