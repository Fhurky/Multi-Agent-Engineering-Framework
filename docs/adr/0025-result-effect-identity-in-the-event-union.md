# ADR-0025: Result-effect identity in the event union, with a uniqueness guard

- Status: Accepted
- Date: 2026-08-05
- Deciders: Solution Architect under TASK-028
- Affects: TASK-003 declares the amended event; TASK-006 owns the guard and the transition table; TASK-008 reads the marked entry in the reconciliation decision
- Supersedes in part: [ADR-0020](0020-durable-adoptable-results-for-recovery.md) — one clause: its decision that `EffectLedgerEntry.isTaskResultEffect` identifies the adoptable result effect, which it decided without giving any member of `RuntimeEvent` a way to set it. The flag now originates in `EffectIntentRecorded` and the ledger entry derives it. ADR-0020's other decisions stand unchanged: `AdoptableResult` recorded verbatim, `run.pendingResults`, `WorkerResultRecorded` appended before the result effect is committed, `proposedTasks` never digested, the `escalate` outcome when a committed result effect has no adoptable record, and the clearing of `pendingResults[taskId]` by `WorkerSucceeded`.

## Context

Finding **A-203** in `reports/code-review/TASK-024-ARCHITECTURE-AMENDMENT-REVIEW-ROUND-2.md`, rated High, recorded that the adoptable-result path cannot mark a result effect with the event union that carries it.

`EffectLedgerEntry.isTaskResultEffect` is a **required** field at `docs/architecture/runtime/INTERFACE-CONTRACTS.md:310`, and the normative effect ordering at `docs/architecture/runtime/RETRIES-TIMEOUTS-AND-IDEMPOTENCY.md:52-58` requires `EffectIntentRecorded { effectId, isTaskResultEffect: true, ... }`. The `EffectIntentRecorded` member of `RuntimeEvent` at line 789 declares `effectId`, `taskId`, `attempt`, `idempotencyKey`, and `idempotent`, and no property named `isTaskResultEffect`. No other event sets it either. `applyEvent` is the only writer of a ledger entry, so a required field of that entry had no legal source: an implementation would have to default it to `false` for every entry and then no entry would ever be marked, or default it to something derived from a heuristic the contracts do not state.

Sequence 2 in `diagrams/architecture/runtime-sequences.md:97-107` compounded it by showing `WorkerResultRecorded` and later `EffectCommitted` with **no** `EffectIntentRecorded` between them, so the diagram's event order and the normative ordering were two different orders.

The consequence is exactly the one A-104 was raised about: recovery's `adopt` row reads `run.pendingResults[taskId]` **only for an entry carrying the flag**, so with no way to set the flag, no committed effect is ever recognized as the task's result effect and the `adopt` decision is unreachable. A-104 is not resolved while this holds.

## Decision

**Result-effect identity originates in the event and is derived by the record.** `EffectIntentRecorded` gains a required `isTaskResultEffect: boolean` property. Applying it creates the ledger entry with `isTaskResultEffect` copied from the event. No other event writes the field, and no event changes it after the entry exists; `EffectCommitted` moves an entry to `committed` and touches nothing else.

**The uniqueness guard is stated and enforced at admission of the event, not by convention.** For a given `(taskId, attempt)`:

1. At most one ledger entry may carry `isTaskResultEffect: true`. A second `EffectIntentRecorded` with the flag set for the same `(taskId, attempt)` is rejected as `IllegalTransition` with `GuardFailed`.
2. An `EffectIntentRecorded` with `isTaskResultEffect: true` is legal only when `run.pendingResults[taskId]` already holds an `AdoptableResult` for that `(taskId, attempt)`. This makes ADR-0020's ordering — the adoptable result is durable **before** the result effect is intended, and therefore before it is committed — a guard rather than a paragraph.
3. An `EffectIntentRecorded` with `isTaskResultEffect: false` carries no such requirement; ordinary effects are unaffected.

Together these give recovery the property its table assumes: for a task's current attempt there is **at most one** committed effect the `adopt` decision may read, finding it is a lookup rather than a search, and when it exists a matching `AdoptableResult` existed before it did.

**Every uninterrupted and recovery sequence uses the same legal event order,** and it is the one ADR-0020 already specified, now stated identically in every place it appears:

```text
0. WorkerResultRecorded  { taskId, attempt, adoptable }
1. EffectIntentRecorded  { effectId, taskId, attempt, isTaskResultEffect: true, ... }
2. ... the result effect is performed ...
3. EffectCommitted       { effectId, resultDigest }
4. WorkerSucceeded       { result, proposedTasks }
```

Recovery re-enters this order at whichever step the crash interrupted, and emits only step 4 — built from `run.pendingResults[taskId]` — because steps 0 through 3 are already durable when the `adopt` decision applies. Sequence 2 of the sequence diagrams is corrected to show all five steps in this order; it previously showed 0, 3, and 4 and omitted 1.

## Alternatives considered

**Derive the flag rather than declare it — treat the last committed effect of an attempt as the result effect.** No contract change at all. Rejected: it is a heuristic dressed as an invariant. An attempt may commit a rendered artifact after its result effect, or commit none at all, and the derivation would then adopt the wrong entry or no entry. Worse, it would be silently wrong: recovery would build a `WorkerSucceeded` from a `pendingResults` entry that belongs to a different effect, which is a corrupted terminal state rather than a refused one.

**Put the flag on `EffectCommitted` instead of on `EffectIntentRecorded`.** It is closer to the moment recovery cares about. Rejected: the entry exists from the intent, and a required field of an entry cannot first acquire a value at commit time without the entry being invalid in between. It would also weaken guard 2 into a check performed after the effect was already performed, which is the opposite of the intent-then-commit discipline the ledger exists for.

**Add a separate `TaskResultEffectRegistered` event.** It leaves `EffectIntentRecorded` untouched and makes the marking explicit. Rejected: it adds a 53rd member to a closed union to carry one boolean, it creates a second event that must be ordered against `EffectIntentRecorded` with its own guards, and it introduces a window in which an intended effect is unmarked. One required property on the event that already creates the entry has none of those costs.

**Make `EffectLedgerEntry.isTaskResultEffect` optional and let recovery fall back to `pendingResults` alone.** The `pendingResults` entry already names the task and the attempt, so the flag looks redundant. Rejected: the ledger state is what decides `adopt` versus `escalate`, and the decision needs to know whether the *committed* effect it is looking at is the result effect. Without the mark, a task with a committed unrelated effect and a durable `AdoptableResult` would adopt a result whose effect never committed, which reverses the guarantee the ledger provides.

## Consequences

Positive:

- The flag has exactly one legal source, so a conforming transition can identify the one committed result effect recovery may adopt, and A-104 becomes expressible rather than merely asserted.
- Guard 2 makes ADR-0020's ordering enforceable at the append path. An implementation that commits a result effect before recording the adoptable result is rejected rather than reviewed.
- Guard 1 makes the lookup total: at most one candidate exists per attempt, so `adopt` never has to choose.
- The five-step order is now written the same way in the contracts, the retry document, the state machine, and the sequence diagram, so the diagram is a reading aid rather than a fourth opinion.

Negative:

- `EffectIntentRecorded` gains a required property, so every existing call site must state it, including the ordinary effects for which the answer is always `false`. That is deliberate — a defaulted boolean is how the field came to have no source in the first place — but it is more ceremony at every effect.
- Guard 2 couples the effect ledger to `run.pendingResults`, which are otherwise independent registers. The coupling is one-directional and is checked at admission, but it means TASK-006's transition function needs both in scope for one guard.
- A non-conforming implementation that never sets the flag now produces a run whose result effects are all unmarked, and the failure surfaces at recovery rather than at dispatch. The R1x escalation from ADR-0020 is what keeps that from becoming a silent wrong answer, and it stays exactly as ADR-0020 wrote it.
