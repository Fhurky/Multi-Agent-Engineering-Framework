# ADR-0039: Nominal receipt authority is singular and checked across contract roots

- Status: TASK-037 recorded changes-required for TASK-036; A-504 individually resolved
- Date: 2026-08-06
- Deciders: Solution Architect under TASK-036
- Affects: TASK-003 state contracts; TASK-004 agent contracts; TASK-006 composition; TASK-017 workspace contract transcription
- Extends:
  - [ADR-0028](0028-nominal-store-issued-durable-append-receipts.md) — adds a required cross-root conformance fixture and consistent sequence naming. The nominal issuance and verification decision is unchanged.
  - [ADR-0034](0034-spawn-owned-registration-proof-refusal.md) — preserves proof refusal at both agent-side side-effect boundaries.

## Context

Round-6 finding **A-504** records two contradictions in an otherwise sound receipt decision. The workspace document said `agents/contracts` re-declared receipt types from `state/contracts`, while the component and interface contracts correctly require the unique-symbol brand and every nominal receipt type to exist only in the state root. Sequence 3 then named a nonexistent `AgentRegistrationReceipt`; the actual state-root type is `ProcessGroupRegistrationReceipt`.

Two independent declarations of a `unique symbol` are not interchangeable nominal authority. Leaving the contradiction as prose lets implementations either create a forbidden root dependency or counterfeit a second type while believing the architecture requires it.

## Decision

**ADR-0028's single-authority model is reaffirmed and made mechanically checkable.**

1. `state/contracts` contains the only `DURABLE_RECEIPT_BRAND` declaration and the only `ProcessGroupRegistrationReceipt` declaration.
2. `agents/contracts` declares neither. It mirrors only permitted primitive aliases, `AgentProcessRegistrationSubject`, and `AgentReceiptVerifier`.
3. `AgentWorker.beginInvocation` and `ProcessTreeController.spawnOwned` accept `receipt: unknown`. The injected verifier is the only narrowing operation.
4. The supervisor may hold and label the append result as `ProcessGroupRegistrationReceipt` on the state side. The value crosses the TASK-004 boundary as `unknown`.
5. Architecture sequences use `ProcessGroupRegistrationReceipt`; `AgentRegistrationReceipt` is not a contract name.

The cross-root fixture enumerates semantic declarations in both transcribed roots and normative code blocks. It asserts exactly one brand and one process-registration receipt declaration in the state root, zero in the agent root, both agent-side parameters typed `unknown`, and exactly the narrowed verifier surface. It is a declaration-aware check, not a raw prose occurrence count.

## Alternatives considered

**Declare an agent-specific nominal receipt.** Rejected. It would have a different unique-symbol identity and could not prove state-store issuance.

**Import `state/contracts` from `agents/contracts`.** Rejected. It creates an edge between the two independent roots and prevents TASK-003/TASK-004 parallel authoring.

**Use only a structural receipt everywhere.** Rejected. A structurally matching object could be synthesized and would not prove durable append.

**Fix only the sequence label.** Rejected. The contradictory workspace import statement would remain an implementation instruction.

## Consequences

Positive:

- The nominal authority is declared once and named consistently.
- The independent-root topology remains unchanged.
- Both side-effect boundaries continue to refuse missing, forged, stale-epoch, or mismatched proof before spawn.

Negative:

- The supervisor composition adapter must bridge a nominal state-side value to a structural verifier without exporting the brand.
- Static validation must understand declarations and contract-root sections rather than count all textual mentions.
