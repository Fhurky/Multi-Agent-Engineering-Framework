# ADR-0033: Recovery requires one unique committed result effect

- Status: Authoring baseline; TASK-033 recorded `changes-required`; superseded in part by [ADR-0035](0035-explicit-reconciliation-evidence-composition-boundary.md)
- Date: 2026-08-06
- Deciders: Solution Architect under TASK-032
- Affects: TASK-003 declares flagged effect identity and the recovery evidence types; TASK-006 enforces event admission and ordering; TASK-008 constructs exact recovery evidence and fails closed on duplication
- Supersedes in part:
  - [ADR-0025](0025-result-effect-identity-in-the-event-union.md) — its conclusion that an at-most-one admission guard makes recovery lookup sufficient without specifying a restored-state uniqueness failure.
  - [ADR-0030](0030-one-canonical-recovery-decision-input-domain.md) — its ledger reduction in which any committed entry could produce the committed value. ADR-0030's exactly six input fields, four-value ledger axis, one cardinality statement, and exhaustive decision-domain requirement remain in force.

## Context

Round-4 finding **A-203** records that recovery could infer success from the wrong committed effect. A task attempt may have ordinary effects as well as its one result effect. Treating any committed ledger entry as the committed recovery value lets an unrelated artifact or publication effect combine with a durable pending result and incorrectly imply `WorkerSucceeded`.

The admission guard added by ADR-0025 prevents a conforming live append from creating two flagged result effects, but recovery reads restored durable state and must validate rather than assume that invariant. It must identify exactly one committed flagged effect, preserve that identity through its decision, refuse duplicate flagged evidence, and use the same event order as the uninterrupted path.

## Decision

**Result-effect identity is durable, unique, and carried into recovery evidence.** `EffectIntentRecorded.isTaskResultEffect` remains the sole origin of the flag. The transition function rejects a second flagged intent for the same `(taskId, attempt)`; `EffectCommitted` may change only the ledger state and result digest, never add or change the flag.

**The recovery input builder validates restored state before classification.** It considers only ledger entries for the current attempt and partitions them by the durable flag. More than one flagged entry is `RecoveryInvariantViolation`; the builder does not choose by position, timestamp, or effect ID. A committed-result classification carries the exact `resultEffectId`. The decider cannot manufacture or discard that identity.

**The four-value ledger axis is retained with an exact meaning.** Its values are `none`, `intended_idempotent`, `intended_non_idempotent`, and `committed_result`. Construction uses this priority:

1. any intended non-idempotent entry yields `intended_non_idempotent`;
2. otherwise any intended entry yields `intended_idempotent`;
3. otherwise exactly one committed flagged result effect yields `committed_result` and its identity;
4. otherwise the value is `none`.

A committed unflagged effect is absent from rule 2. Therefore an unrelated committed effect can never select adoption and can never imply `WorkerSucceeded`. The six-field input and its cardinality remain those of ADR-0030; this record changes one member's vocabulary and reduction, not the domain's shape.

**Uninterrupted execution and recovery share one legal order:**

~~~text
WorkerResultRecorded
EffectIntentRecorded { isTaskResultEffect: true }
perform the registered result effect
EffectCommitted { matching effectId }
WorkerSucceeded
~~~

The uninterrupted path emits all four durable events around the effect. Recovery may emit only the final `WorkerSucceeded`, and only because the first three durable events and the unique matching identity are already present. Sequence 8, as well as Sequence 2, must show the full normative order. The fixtures include the exact crash prefix containing a pending result plus an unrelated committed effect and assert that it is never adopted.

## Alternatives considered

**Treat the latest committed effect as the result effect.** Rejected. Ledger ordering is not semantic identity, and a later ordinary effect would make the recovered terminal result incorrect.

**Trust the live uniqueness guard during restore.** Rejected. Recovery exists to validate and reconcile durable facts after interruption. Forged, corrupted, or legacy state with duplicate flags must fail closed rather than make an arbitrary choice.

**Add a fifth ledger-axis value for duplicate evidence.** Rejected. Duplicate flagged effects violate an invariant and never enter the decision domain. Turning corruption into a normal classifier value would multiply states and weaken the guard.

**Adopt from `pendingResults` without ledger evidence.** Rejected. The pending record proves the result is reconstructable; the flagged committed effect proves its registered external effect completed. Both are required.

## Consequences

Positive:

- Recovery names the exact committed effect that authorizes adoption.
- Duplicate flagged evidence fails closed before a decision event is built.
- Ordinary committed effects are unable to imply task success.
- The six-field domain, four-value axis, event union, and one-decision-per-task architecture remain stable.

Negative:

- Input construction returns a typed failure and carries an effect ID alongside the classifier input.
- Restored state that violates the uniqueness invariant blocks recovery until repaired or explicitly adjudicated.
- Tests must cover both duplicate flagged entries and an unrelated committed effect at the critical crash prefix.
