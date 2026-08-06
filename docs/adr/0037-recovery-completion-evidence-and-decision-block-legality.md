# ADR-0037: Recovery completion evidence and decision-block legality

- Status: TASK-037 recorded changes-required for TASK-036; A-501 and A-502 individually resolved
- Date: 2026-08-06
- Deciders: Solution Architect under TASK-036
- Affects: TASK-003 event and transition contracts; TASK-006 transition tests; TASK-008 recovery construction and fixtures
- Supersedes in part:
  - [ADR-0013](0013-single-decision-recovery-reconciliation.md) — statements that equated one decision per task with one task-addressed event per task, or treated every event in a multi-event decision as legal directly from restored state. One decision per task, the decision table, priority order, fencing, and deterministic task order remain in force.

## Context

Round-6 finding **A-501** records that the recovery procedure constructs `RunRecoveryCompleted` with five evidence arrays while the public event member accepts only two. `RecoveryOutcome` already exposes the other three, so an implementation must either fail excess-property checking or drop evidence the procedure calls durable.

Finding **A-502** records a separate legality contradiction. The illegal-transition table and crash invariant prohibited two task-addressed events for one task, while recovery rows R4 and R7 require `TaskTimedOut` followed by `RetryScheduled`. The first event changes the task to `awaiting_retry`; the second is legal only from that resulting state. Saying both are legal from restored `running` state is false, and calling the pair an exception leaves two incompatible invariants.

## Decision

**One `RecoveryCompletionEvidence` shape is authoritative.** It contains `reclaimedTaskIds`, `adoptedTaskIds`, `blockedTaskIds`, `orphanOutcomes`, and `workspaceOutcomes`. `RunRecoveryCompletedEvent` is the event discriminator intersected with that shape, and successful `RecoveryOutcome` intersects the same shape. No partial helper payload exists.

The state root declares `RecoveryOrphanOutcome`, a structural snapshot of the agent-root `TreeCloseOutcome`, so the event remains transcribable without importing the independent agent contract root. TASK-008 maps the compatible result at composition. This differently named pair extends the existing first structural-alias family enumerated by the component boundary; it creates neither a third duplication family nor a nominal declaration. Workspace outcomes already have a state-root type.

The completion arrays are canonical and checked:

1. Task IDs are unique and ordered by `(createdSeq, taskId)`.
2. Orphan outcomes are ordered by `invocationId`.
3. Workspace outcomes are ordered by `workspaceId`.
4. The arrays exactly equal the applied decision results and Phase-5/Phase-6 outcomes. A mismatch is `RecoveryInvariantViolation`.
5. Applying the event changes the run from `recovering` to `running`; evidence stays in the journal instead of being copied into a second mutable record field.

**Recovery legality is expressed as one decision block per task.** A decision is computed from restored state and expands to its fixed table sequence. The first event is legal from restored state; each later event is legal from the state produced by its predecessor inside that block. Two blocks never address the same task and blocks never interleave. Complete blocks are independent and may be permuted for the order-independence fixture, but events inside a block may not be permuted.

R4 and R7 therefore require exactly this sequential block:

```text
TaskTimedOut: running -> awaiting_retry
RetryScheduled: awaiting_retry -> awaiting_retry, sets notBefore
```

`RunRecoveryCompletedEvent` is last after every decision block and Phase-5/Phase-6 evidence event.

## Alternatives considered

**Keep one event per task and fold retry scheduling into `TaskTimedOut`.** Rejected. It would change the ordinary transition table and duplicate the established `RetryScheduled` record effect solely to accommodate recovery wording.

**Declare the timeout pair as a one-off exception.** Rejected. The real invariant is one decision, not one event. A general decision-block rule states why the pair is legal and prevents future multi-event decisions from recreating the contradiction.

**Store only task identifiers on the completion event.** Rejected. Process-tree and workspace outcomes are part of the recovery result, and dropping them makes the claimed durable completion evidence incomplete.

**Import the agent root's `TreeCloseOutcome` into the state root.** Rejected. That would introduce a root-to-root dependency and regress the two-root independence property.

## Consequences

Positive:

- The procedure, event union, transition semantics, and public outcome share one complete representation.
- R4/R7 are legal without an exception to a contradictory one-event invariant.
- Order-independence tests permute only independent units and cannot accidentally reverse a required transition sequence.
- The two contract roots remain independent.

Negative:

- TASK-008 must map tree-close outcomes into the durable state-root snapshot and canonicalize all five arrays.
- Recovery append validation must compare completion evidence with the preceding batch.
- Fixtures become more explicit because they must build the exact event and retain decision-block boundaries.
