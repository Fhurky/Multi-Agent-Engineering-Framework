# ADR-0034: Spawn-owned registration proof refusal is explicit

- Status: Authoring baseline; TASK-033 recorded `changes-required` for TASK-032; A-206 was individually resolved
- Date: 2026-08-06
- Deciders: Solution Architect under TASK-032
- Affects: TASK-004 exposes the refusal through worker and provider-adapter boundaries; TASK-003 retains nominal issuance and verification; TASK-006 handles the typed refusal without creating a process
- Supersedes in part: [ADR-0028](0028-nominal-store-issued-durable-append-receipts.md) — its worker-boundary result declarations, which require proof verification but omit the proof-refusal outcome from `SpawnOwnedResult`. ADR-0028's nominal brand, event discriminant, subject identity, store issuance, epoch-scoped verification, independent-root verifier, and unsynthesizability decisions remain in force.

## Context

Round-4 finding **A-206** records that the provider-adapter boundary could refuse invalid durable-registration proof only in prose. `beginInvocation` declared `RegistrationNotDurable`, while the internal `ProcessTreeController.spawnOwned` result exposed only success or `AdapterFailure`. An implementation could therefore collapse a missing, forged, stale-epoch, or mismatched proof into a provider error or spawn despite failed verification, and still claim to implement the visible union.

The receipt itself must remain nominal, discriminated, store-issued, store-verifiable, and impossible for an ordinary caller to synthesize as an accepted proof. The gap is the result boundary, not the proof model.

## Decision

**One shared discriminated refusal is part of both spawn boundaries.**

~~~ts
interface RegistrationNotDurableRefusal {
  ok: false;
  error: 'RegistrationNotDurable';
  detail: string;
}
~~~

Both `WorkerBeginResult` and `SpawnOwnedResult` include that exact branch. It is not an `AdapterFailure`: no provider call has happened, so classifying it as a provider failure would misstate both ownership and retry semantics.

**Verification precedes every group or process side effect.** The state verifier accepts a `ProcessGroupRegistrationReceipt` only when its proof was retained for the current writer epoch and returns the durable `process_group_registration` subject. `beginInvocation` and `spawnOwned` compare that subject's `invocationId` with the plan or invocation; that identity was derived from `(runId, taskId, attempt, idempotencyKey)` before registration. The internal boundary repeats or consumes this narrowed verification contract before group creation. Missing, forged, stale-epoch, or mismatched proof returns `RegistrationNotDurable`; it creates no group, process, binding, or provider request.

**Receipt strength is unchanged.** The brand remains declared only in the state contract root. Receipts remain discriminated by event type, identity-bearing, issued only after the durable batch commit, retained and verified by the store for the current writer epoch, and unsynthesizable as accepted proofs by ordinary callers. The independent agent root receives only an opaque value and the narrowed read-only verifier; it does not duplicate the nominal brand.

**Fixtures exercise both boundaries.** For each of the four refusal causes—missing, forged, stale epoch, and subject mismatch—tests call both `beginInvocation` and `spawnOwned`, assert the typed refusal rather than `AdapterFailure`, and assert zero group/process/provider side effects. A current, matching store-issued receipt takes the success branch.

## Alternatives considered

**Reuse `AdapterFailure`.** Rejected. Proof rejection happens before adapter invocation, has no provider failure class, and should not enter provider retry policy.

**Throw an exception.** Rejected. A proof refusal is an expected fail-closed boundary result. Exceptions would erase the discriminant and make exhaustive handling impossible.

**Verify only in `beginInvocation` and omit refusal from `spawnOwned`.** Rejected. The internal side-effect boundary is the last point before process creation and must express its own refusal. A prose precondition is the defect this record repairs.

**Make receipts structural to simplify internal calls.** Rejected. That reopens forgery and stale-proof use. The architecture needs a stronger result union without weakening issuance or verification.

## Consequences

Positive:

- Both process-creation boundaries make proof refusal exhaustive and machine-checkable.
- Invalid proof is separated from provider failure and cannot accidentally enter retry classification.
- Missing, forged, stale, and mismatched proofs all have one fail-closed outcome and zero side effects.
- The two independent contract roots, nominal receipt authority, and process ownership design remain unchanged.

Negative:

- Callers must handle a third `SpawnOwnedResult` branch explicitly.
- The internal controller needs verifier context sufficient to check epoch and subject without receiving append authority.
- Tests must observe absence of group, process, and provider activity, not merely the returned discriminant.
