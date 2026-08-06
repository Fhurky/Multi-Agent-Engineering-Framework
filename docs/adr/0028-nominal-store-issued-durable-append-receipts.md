# ADR-0028: Nominal, store-issued, discriminated durable-append receipts

- Status: Accepted; superseded in part by [ADR-0034](0034-spawn-owned-registration-proof-refusal.md)
- Date: 2026-08-05
- Deciders: Solution Architect under TASK-028
- Affects: TASK-003 issues, brands, and verifies receipts; TASK-004 and TASK-017 consume them at the side-effect boundaries; TASK-006 and TASK-008 pass them between the phases
- Supersedes in part: [ADR-0019](0019-durable-intent-receipts-for-side-effects.md) — one clause: its receipt model, in which `DurableAppendReceipt` was a plain structural interface, `StateStore.append` returned an array of the base type, and the ADR conceded that a caller could construct one while specifying only identifier and epoch checks against it. The receipt is now discriminated by `eventType`, carries a subject the caller narrows to without an assertion, is nominally branded so it cannot be constructed outside the declaring module, and carries a store-verifiable proof. ADR-0019's other decisions stand unchanged: the plan/execute split, the three-phase worker handshake, the rule that the module performing the side effect holds no write path, receipts as evidence rather than authority, and the ordering they enforce.

## Context

Finding **A-206** in `reports/code-review/TASK-024-ARCHITECTURE-AMENDMENT-REVIEW-ROUND-2.md`, rated High, recorded that durable-intent receipts neither carry the identity the side-effect boundaries require nor prove durable issuance. There are two independent defects and the finding names both.

**The returned type is too weak to use.** `StateStore.append` returns `DurableAppendReceipt[]` at `docs/architecture/runtime/INTERFACE-CONTRACTS.md:984`, whose element type declares `eventType`, `stateVersion`, `writerEpoch`, `batchId`, and `issuedAt` — and no `invocationId`, no `workspaceId`, and no `intent`. The boundaries require the narrower types: `AgentWorker.beginInvocation` takes a `ProcessGroupRegistrationReceipt`, which adds `invocationId`; `WorkspaceLifecycle.executePrepare` and its siblings take a `WorkspaceIntentReceipt`, which adds `workspaceId` and `intent`. The documented call sequences — "receipt = the append path's receipt for that event" — therefore do not type-check. An implementation must either cast, which discards the guarantee, or reconstruct the receipt from the event it appended, which means the caller manufactures the proof it is supposed to be given.

**The type is forgeable.** A TypeScript structural interface is inhabited by any object literal with the right shape. ADR-0019 conceded this and specified identifier and epoch checks in its place, which a forged object carrying the correct identifiers satisfies exactly. So "a process cannot exist before its identity does" and "only `StateStore.append` issues a receipt" were true of the implementation the architects had in mind and of nothing in the contract. A-102 and A-103 are not resolved while a caller can hand itself the proof.

## Decision

**Receipts are a discriminated union, and the discriminant is the event type.** `StateStore.append` returns `DurableAppendReceipt[]`, where

```text
DurableAppendReceipt =
  | ProcessGroupRegistrationReceipt   eventType: 'ProcessGroupRegistered'
  | WorkspaceIntentReceipt            eventType: 'WorkspacePrepareIntended' | 'WorkspaceFinalizeIntended' | 'WorkspaceAbandonIntended'
  | ArtifactPublicationReceipt        eventType: 'ArtifactPublished'
  | PlainAppendReceipt                every other member of RuntimeEvent
```

Every member extends one base carrying `stateVersion`, `writerEpoch`, `batchId`, `issuedAt`, and the brand and proof below; each specialized member adds the subject its boundary requires — `invocationId`, or `workspaceId` and `intent`, or `workspaceId` and `publishedCommit`. A caller narrows by `receipt.eventType` and reaches the specialized member with no assertion and no reconstruction, which is what the documented call sequences already assumed.

**Receipts are nominal, so an ordinary caller cannot construct one.** The base carries a brand keyed by a `unique symbol` declared in `state/contracts` and exported as a type only:

```ts
declare const DURABLE_RECEIPT_BRAND: unique symbol;
readonly [DURABLE_RECEIPT_BRAND]: 'state-store-append';
```

A `unique symbol` is not nameable outside the module that declares it, so no object literal written anywhere else can satisfy the type, and no interface a consumer writes can widen into it. This is compile-time nominality using only the language the runtime already fixes in [ADR-0001](0001-runtime-platform-and-language.md); it requires no class hierarchy, no runtime wrapper, and no change to how receipts are passed.

**Receipts carry a store-verifiable proof, so a forgery is refused at run time as well.** Each receipt carries `proof: DurableReceiptProof`, an opaque store-scoped token. `StateStore` retains the set of proofs it issued under the current writer epoch and exposes

```text
verifyReceipt(receipt): DurableReceiptSubject | null
```

which returns the subject the store recorded for that proof, or `null` for a proof it did not issue or one issued under a superseded writer epoch. A boundary that consumes a receipt verifies it and refuses on `null`. The proof is not a credential: it is opaque, run-scoped, never persisted outside the run directory, never logged, and it grants nothing — a verified receipt is still evidence, never authority, and there is still no operation on it that appends anything.

**Both properties are required, and neither replaces the other.** The brand makes a forgery unwritable in a conforming TypeScript build; the proof makes it unusable in a build that was coerced, in a boundary reached across a JavaScript call, and in a test that tried to shortcut the protocol. A-206 asks for a proof "that cannot be synthesized by an ordinary caller"; a compile-time-only answer is synthesizable by anyone willing to write a cast.

**The boundaries are restated over the verified receipt.** The nominal receipt union and brand exist only in `state/contracts`. Workspace methods live on that root and consume the specialized nominal types directly, then verify their store-recorded subjects; `completeFinalize` uses `PUBLICATION_NOT_DURABLE` for its publication proof. The independent `agents/contracts` root deliberately does **not** redeclare the brand. Its `AgentWorker.beginInvocation` and `ProcessTreeController.spawnOwned` parameters are `unknown`, and an injected structural `AgentReceiptVerifier` returns the current-epoch store-recorded process-registration subject or `null`. Both refuse with `RegistrationNotDurable` before group creation when verification fails or `invocationId` differs. An ordinary caller may synthesize an argument value, but it cannot synthesize one that the verifier accepts.

## Alternatives considered

**Keep the structural interface and rely on review.** No contract change. Rejected: it is the reviewed state, and A-206 records precisely why review is not the mechanism. The two claims the architecture makes about receipts are claims about what is *expressible*, and a convention cannot make anything inexpressible.

**Make receipts opaque handles — an integer index into a store-held table — and pass the index.** Simple, and unforgeable in the sense that a wrong index fails lookup. Rejected: a small integer is guessable, and more importantly it carries no subject, so the boundary must look the subject up through the store, which gives TASK-004 and TASK-017 a `StateStore` reference. Both are forbidden one, and holding one is a strictly larger capability than holding a receipt.

**Sign receipts with an HMAC over a per-run secret.** Cryptographically unforgeable and stateless to verify. Rejected: it introduces a secret into the runtime for a property the runtime does not need cryptography for. There is one writer process and the store already holds durable state; a retained set of issued proofs gives the same refusal with no key to generate, inject, rotate, or accidentally persist. [ADR-0007](0007-provider-adapter-boundary-and-error-taxonomy.md)'s rule that no credential is ever written to state, logs, or checkpoints is easier to keep when there is no credential.

**Use a class with a private constructor instead of a branded interface.** Idiomatic nominality in TypeScript. Rejected: the state root needs only compile-time nominal issuance plus runtime verification, not class identity or behavior. The independent agent root must not import the value in either design; accepting `unknown` behind the verifier is the smaller and more honest boundary.

**Keep one receipt type and widen it with optional `invocationId`, `workspaceId`, and `intent`.** One type, no narrowing. Rejected: every consumer would check for the presence of a field the type says may be absent, so the "cannot type-check without an assertion" defect becomes "cannot use without a runtime null check", and nothing in the type would associate `intent` with the workspace events. A discriminated union is what makes the association a property of the declaration.

## Consequences

Positive:

- The documented call sequences type-check as written. `receipt = appendResult.receipts[i]` narrows to the boundary's type by its discriminant, with no assertion and no reconstruction.
- "Only `StateStore.append` issues a receipt" is a property of the contract: the brand makes any other origin unwritable and the proof makes any other origin unverifiable.
- "Spawn before durable registration is not expressible" is likewise a property: the only parameter that unlocks the spawn is one the store issues after the batch commit record.
- Verification is epoch-scoped, so a receipt from a superseded writer epoch is refused. A resurrected pre-crash process holding an old receipt cannot use it, which closes the same window the writer epoch closes for appends.

Negative:

- `state/contracts` gains a `unique symbol` and a union with four members. `agents/contracts` mirrors only a structural verifier view and subject, never the brand. TASK-004 therefore gives up compile-time narrowing at its independent-root boundary and relies on mandatory store verification there; the payoff is that the two roots remain independent without declaring incompatible nominal symbols.
- The store retains issued proofs for the current writer epoch, so it holds one more in-memory set whose size is the number of appended events since attach. It is bounded by the epoch and discarded on release, and it is deliberately not persisted, which means a receipt does not survive a crash — correctly, since neither does the process that would use it.
- Receipt verification is a synchronous call every side-effect boundary must make: workspace boundaries use `ReceiptVerifier.verifyReceipt`, while the independent agent root uses `AgentReceiptVerifier.verifyProcessGroupRegistration`. Forgetting it leaves only compile-time or call-site shape checks, which are weaker than the record claims. The test obligations name verification explicitly for each boundary.
