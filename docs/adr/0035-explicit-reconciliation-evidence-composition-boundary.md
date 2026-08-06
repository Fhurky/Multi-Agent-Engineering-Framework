# ADR-0035: Reconciliation evidence is assembled through one explicit public boundary

- Status: TASK-035 recorded changes-required for TASK-034; A-401 and its A-104 residue individually resolved
- Date: 2026-08-06
- Deciders: Solution Architect under TASK-034
- Affects: TASK-003 declares the evidence types; TASK-008 supplies restored run evidence, constructs every reconciliation input, and owns the exhaustive construction fixture
- Supersedes in part:
  - [ADR-0030](0030-one-canonical-recovery-decision-input-domain.md) — its constructibility claim did not declare how the current writer epoch or attempt-matching pending result reaches the six-field input. The six fields, four-value ledger axis, cardinality, and pure decider remain in force.
  - [ADR-0033](0033-unique-committed-result-effect-recovery.md) — its input-builder clause accepted only a task, current-attempt ledger entries, and a deadline, although the promised result also contains lease and adoptable-result classifications. Its result-effect uniqueness, reduction priority, evidence identity, and event order remain in force.

## Context

Round-5 finding **A-401** establishes that the published `ReconciliationInputBuilder` cannot construct the type it promises. `leaseState` depends on comparing `TaskRecord.lease.writerEpoch` with the restored `RunRecord.writerEpoch`; `adoptableResultPresent` depends on the matching entry in `RunRecord.pendingResults`. Neither fact was a parameter of `build(task, currentAttemptEntries, deadline)`. A conforming implementation therefore had to read hidden run state or fabricate two values, contradicting ADR-0030's enumerable six-field domain.

The defect also leaves the A-104 residue open. A durable `AdoptableResult` exists, but the public recovery composition boundary does not carry it to the classification that selects R1 or R1x. Correct individual types are insufficient when no declared operation composes them.

## Decision

**`ReconciliationInputBuilder.build` receives one typed `ReconciliationBuildEvidence` value containing every fact not derivable from the task record.** It contains the restored current writer epoch, the entries for the task's current attempt, the already classified deadline, and the pending-result candidate selected from `RecoveryContext.pendingResults` by task ID. The builder has no `RunRecord`, state-store, or recovery-context capability and performs no hidden read.

The builder derives the six fields exactly as follows:

1. `fromState` is `task.state`.
2. `leaseState` is `none` when `task.lease` is null, `current_epoch` when its writer epoch equals `currentWriterEpoch`, and `superseded` otherwise.
3. `ledgerState` and `resultEffectId` use ADR-0033's unique flagged-result validation and reduction priority. Every supplied entry must match `task.taskId` and `task.attempt`; a mismatched entry is a recovery invariant violation.
4. `deadline` is the supplied typed value.
5. `activationPresent` is `task.activation !== null`.
6. `adoptableResultPresent` is true only when the supplied candidate is non-null and its `taskId` and `attempt` match the task. A stale-attempt candidate is false. A candidate selected under the wrong task key is a recovery invariant violation.

The recovery coordinator is the composition owner. For each restored task it passes `run.writerEpoch`, filters `run.effects` to the exact task and attempt, classifies the deadline from the injected clock and task deadline, and passes `context.pendingResults[task.taskId] ?? null`. It then calls the pure decider only with the successful builder output. No other recovery branch may independently assemble a `ReconciliationInput`.

**The exhaustive fixture crosses this public boundary.** For every point in the canonical domain declared by ADR-0030, the test constructs a `TaskRecord` and `ReconciliationBuildEvidence` whose public `build` result is that point, then passes the result to `ReconciliationDecider.decide`. It does not create `ReconciliationInput` object literals. Separate negative fixtures cover duplicate flagged effects, mismatched current-attempt entries, a pending-result subject mismatch, a stale-attempt pending result, and an unrelated committed effect.

## Alternatives considered

**Let the builder read the complete `RunRecord`.** Rejected. It hides an unbounded input behind an object capability, destroys the enumerable proof boundary, and recreates the exact problem ADR-0030 rejected.

**Keep the three-argument builder and let the coordinator patch two fields afterward.** Rejected. It creates two input constructors, permits the decider to receive partially validated values, and leaves no public boundary through which the exhaustive fixture can prove constructibility.

**Pass two booleans instead of source evidence.** Rejected. A caller could assert a lease or adoption classification that contradicts durable state. Passing the current epoch and candidate keeps the classification pure, reviewable, and centralized.

## Consequences

Positive:

- Every `ReconciliationInput` member is constructible from declared parameters with no hidden state.
- Lease epoch and pending-result matching have one authoritative derivation.
- The totality fixture proves the public composition path and the decider together.
- ADR-0033's result-effect identity and A-203 event-order repair remain unchanged.

Negative:

- TASK-008 must build a typed evidence value for every restored task and handle explicit invariant failures before deciding.
- The exhaustive fixture needs synthetic task, lease, ledger, deadline, and pending-result evidence rather than compact input literals.
- Adding any future decision axis requires another explicit composition input and an ADR amendment.
