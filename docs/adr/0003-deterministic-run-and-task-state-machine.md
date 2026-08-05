# ADR-0003: Deterministic run and task state machine

- Status: Accepted; extended by [ADR-0013](0013-single-decision-recovery-reconciliation.md) and [ADR-0015](0015-typed-scheduling-gate-and-activation-contracts.md)
- Date: 2026-08-04
- Deciders: Solution Architect under TASK-002
- Affects: TASK-006 primarily; TASK-003, TASK-005, TASK-007, TASK-008, TASK-017 consume it
- Extended: the task state set gains `quiescent`, and the event union grows from 25 to 44 members, both under ADR-0015; recovery's use of the transition function is constrained by ADR-0013. The decision below — one pure, total transition function as the sole authority on legality — is unchanged, and the three named choices stand.

## Context

The runtime must drive a project run from a single input to a terminal state across pauses, crashes, retries, and provider failures, and it must be possible to state afterwards exactly why it ended where it did. Several independent modules want to change state: the scheduler grants and expires leases, the supervisor applies worker results, recovery reconciles after a crash, and lifecycle handles operator intent.

If each module mutated the record directly, legality would be spread across four modules, replay would not be reproducible, and no reviewer could enumerate the reachable states.

## Decision

State advances through **exactly one pure, total transition function**:

```ts
applyEvent(run: RunRecord, envelope: EventEnvelope): TransitionResult
```

- **Pure**: no I/O, no wall-clock read, no unseeded randomness, no input mutation. Time enters only as `envelope.occurredAt`, supplied by the caller as data.
- **Total**: every `(state, event)` pair yields either a new record or a typed `IllegalTransition`. It never throws.
- **Sole authority**: no module writes a state field. Scheduling, recovery, and lifecycle build envelopes; only the append path applies them.

Nine run states with three terminal (`succeeded`, `failed`, `cancelled`) and nine task states with three terminal (`succeeded`, `failed`, `cancelled`), with the full transition tables and the illegal-transition list recorded in [STATE-MACHINE.md](../architecture/runtime/STATE-MACHINE.md).

Three specific choices worth naming:

1. **`leased` and `running` are distinct task states.** Lease grant and worker dispatch are separate observable moments owned by separate modules. Collapsing them would make it impossible to tell a lease that expired before dispatch from one that expired mid-invocation, and those two cases have different effects on the attempt budget.
2. **`attempt` increments at `DispatchStarted`, not at `LeaseGranted`.** Scheduler churn — a lease that lapses before the worker starts — must not consume retry budget.
3. **`blocked` is non-terminal.** An escalating failure class is work that is still achievable once a human or another role acts. Recording it as `failed` would lose that distinction and would make exit code 3 in [LIFECYCLE-AND-BOOTSTRAP.md](../architecture/runtime/LIFECYCLE-AND-BOOTSTRAP.md) meaningless.

The task graph grows dynamically. Worker results may carry `proposedTasks`, admitted through `TaskCreated` under guards on identifier uniqueness, role validity, write-scope subsetting, dependency existence, and acyclicity. A proposal failing a guard blocks the proposing task rather than failing the run.

## Alternatives considered

**Direct field mutation with validation helpers.** Simplest and needs no event type. Rejected: legality checks would be duplicated in four modules, replay would be impossible, and the deterministic-replay criterion in TASK-006 would be untestable.

**A state machine library.** Rejected: the guards here depend on run-wide predicates — completion, no-progress, dependency satisfaction, cycle detection on admission — that a generic transition table does not express, and a dependency in the runtime's core is a security-review surface for little gain.

**Impure transition function reading the clock.** Convenient: `occurredAt` would not have to be threaded through every envelope. Rejected: it destroys replay determinism, which is the property everything else rests on, and it makes fake-clock tests in three other tasks harder rather than easier.

**A statically declared task graph fixed at bootstrap.** Much easier to validate. Rejected: it contradicts the objective. A single project input cannot enumerate the work; the Manager role's output *is* the decomposition, so the graph must grow at runtime.

**Separate transition functions for run state and task state.** Rejected: the completion predicates read across every task, so the run function would need the whole record anyway, and two functions would create an ordering question about which runs first.

## Consequences

Positive:

- `RunRecord(v)` is the fold of the journal, which is what makes checkpoints an optimization rather than a second source of truth ([ADR-0004](0004-durable-state-as-event-journal-with-atomic-checkpoints.md)).
- Recovery reuses the same function, so a crashed run and a healthy run are advanced by identical rules.
- Illegal transitions are enumerable, so review and QA can test each one.
- Duplicate result application is rejected structurally: the second `WorkerSucceeded` for a `succeeded` task is an illegal transition.

Negative:

- Every caller must thread `occurredAt` through envelopes, which is more ceremony than reading a clock.
- The event union is closed, so adding an event is a contract change requiring an ADR amendment and re-routing to consumers.
- Batch appends must be validated in full before any write, which means the function is invoked on a speculative copy of the record. TASK-003 must not mutate the live record during validation.
