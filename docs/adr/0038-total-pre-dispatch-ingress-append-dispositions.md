# ADR-0038: Pre-dispatch ingress append outcomes are total over both dispositions

- Status: TASK-037 recorded changes-required for TASK-036; A-503 individually resolved and HUMAN-002 properties satisfied
- Date: 2026-08-06
- Deciders: Solution Architect under TASK-036
- Affects: TASK-026 inbox, validator, and collector; TASK-005 high-water signalling and delivery; TASK-006 pre-selection composition
- Supersedes in part:
  - [ADR-0031](0031-pre-dispatch-ingress-observer-and-collector.md) — the implicit collector-success assumption that every successful append supplies a new `IngressEntry`. Its ownership, authorization, fail-closed ordering, TASK-005 signal/observation/delivery split, and bounded interim authorization remain in force.

## Context

Round-6 finding **A-503** records that duplicate success is unrepresentable across the HUMAN-002 collector boundary. The inbox returned a duplicate only as a `FactId`, while `PreDispatchCollectResult` required an `IngressEntry` for every success.

The failure is concrete after a crash: the first process commits the append and dies before signalling. Retrying the same external fact correctly deduplicates, but the collector cannot recover the durable `seq` without fabricating an entry or reading it back. Fabrication is false, and an activation-range read would violate TASK-005's sole-reader boundary. Round 6 therefore records the contract property as unsatisfied even though the approved ownership and ordering decision remains unchanged.

## Decision

**Every normalized append candidate has one explicit success disposition.**

- `appended` carries the newly committed `IngressEntry`.
- `deduplicated` carries the existing `factId`.
- The successful append result carries the disposition list in deterministic normalized-candidate order plus the committed high-water mark.

The collector accepts one external fact, so its success union has exactly two members. Both carry `disposition`, `factId`, and `highWaterMark`; neither requires an entry. Those are the only values the supervisor consumes before signalling. The collector never calls `IngressInbox.read`.

The required crash fixture is:

1. Append fact F; receive `appended` and mark *n*.
2. Crash after the inbox commit and before `IngressHighWaterSignal.signal`.
3. Retry F; receive `deduplicated`, the same `factId`, and a committed mark greater than or equal to *n*.
4. Signal and observe that mark before scheduler selection.
5. Assert one durable entry, no collector read, no fabricated `seq`, and no fallback to interim authorization.
6. TASK-005 later performs the sole activation-range read through `IngressObserver.deliver`.

## Alternatives considered

**Return the existing full entry for a duplicate.** Viable, but rejected because the collector does not consume the entry and returning it broadens the pre-selection data surface unnecessarily. Identity and committed mark are sufficient.

**Let the collector read the duplicate back.** Rejected. It would create a second activation-range reader and weaken ADR-0029's ownership boundary.

**Treat a duplicate as failure.** Rejected. Retrying after the append-committed/signal-absent crash is expected and must resume the same idempotent protocol.

**Signal only the original mark from process-local memory.** Rejected. That memory is exactly what the crash loses; the retry must use durable store output.

## Consequences

Positive:

- Both idempotent success paths are representable without invented data.
- HUMAN-002's pre-selection sequence resumes safely after its critical crash window.
- TASK-005 remains the sole activation-range reader.
- A retry cannot append the same fact twice.

Negative:

- Callers handling batched appends must exhaustively switch over a disposition list.
- The collector no longer returns an entry even on first append, so implementations must not depend on unused entry payload.
- The inbox must return a current committed high-water mark on deduplication.
