# ADR-0023: Immutable ingress entries and two named bootstrap dispatch contracts

- Status: Accepted
- Date: 2026-08-05
- Deciders: Solution Architect under TASK-028
- Affects: TASK-026 implements the inbox, the principal check, and the entry schema; TASK-005 evaluates the declared contract before a dispatch; TASK-003 declares the contracts; TASK-006 applies the events
- Supersedes in part: [ADR-0017](0017-durable-ingress-inbox-and-ingress-epochs.md) — three clauses, and no others. (1) The entry shape it decided, which carried `consumedBy: ActivationId | null` on `IngressEntry`; consumption state is now the cursor and the ledger row and nothing else, and the inbox entry carries no consumption field of any kind. (2) Its `appendedBy` field as "the adapter or activation that appended the entry"; the appender is now a typed principal, and no principal kind denotes an activation. (3) Its final consequence clause, "Bootstrap-phase discovery is still performed by a human operator … correctness does not depend on promptness, and the liveness gap is bounded, named, and routed to TASK-026 rather than being papered over"; that claim is withdrawn, because in the bootstrap phase the consumer was also the first durable appender, which makes discovery a dispatch-validity question rather than a liveness question. Everything else in ADR-0017 stands: identity by `factId`, position by `seq` assigned once, identity-keyed deduplication, append-stable positions, batch order by ascending source commit identifier, reference-independent retention, class precedence, self-exclusion, one-batch consumption, and the epoch rule.

## Context

Finding **A-201** in `reports/code-review/TASK-024-ARCHITECTURE-AMENDMENT-REVIEW-ROUND-2.md`, rated High, recorded that the TASK-024 amendment did not carry the F-401 correction the decomposition had already made, and that four of the six Part D checks were not satisfied at commit `c2ee3eb`:

- `IngressEntry.consumedBy` remained declared at `docs/architecture/runtime/INTERFACE-CONTRACTS.md:551`, while [ADR-0017](0017-durable-ingress-inbox-and-ingress-epochs.md) and [STATE-MACHINE.md](../architecture/runtime/STATE-MACHINE.md) both said the cursor is the whole of consumption state. Two documents disagreed about whether an entry is byte-identical before and after its consumption.
- Neither `durable-bootstrap-append` nor `interim-operator-authorized` existed in the contracts, so no task could declare which one it runs under and no reader could tell whether a dispatch's declared predicate was operative.
- `appendedBy` permitted "the adapter or activation", which is the F-201 self-trigger readmitted as a field comment: an activation that may append is an activation that can manufacture its own wake-up.
- ADR-0017's consequence claimed that bootstrap discovery affects only liveness, while the same phase had the consuming activation as the first durable appender. Finding **F-401**, recorded in `reports/code-review/TASK-001-DECOMPOSITION-REVIEW-ROUND-5.md` and transcribed as model corrections `MC-004` and `MC-005` in `tasks/TASK-013-ACTIVATION-LOG.md`, had already established that this is false: before dispatch no durable entry existed, `ingress_seq` equalled the cursor, and `ingress_seq > last_consumed_event_seq` therefore cannot be what authorized the dispatch.

The four are one defect seen from four sides. The inbox was described as immutable and the entry was not; the appender was described as an adapter and the type permitted an activation; the predicate was described as operative and the phase in which it was not had no name.

## Decision

**An inbox entry carries no consumption state.** `IngressEntry` declares `seq`, `epoch`, `factId`, `contentHash`, `eventType`, `producerTask`, `producerRole`, `sourceCommit`, `sourcePath`, `appendedBy`, and `appendedAt`, and nothing else. `consumedBy` is removed. An entry is byte-identical before and after its consumption, and there is no operation on `IngressInbox` and no member of `RuntimeEvent` that writes any field of an existing entry. Consumption is recorded in exactly two places, both outside the inbox: `TaskRecord.activation.lastConsumedEventSeq`, the cursor, and `run.ingressConsumptionLedger`, an append-only ledger whose rows are created already consumed and already stamped with their consuming activation.

**The appender is a typed principal, and no principal kind denotes an activation.** `IngressAppendPrincipal` is a closed two-member union: `ingress_adapter` and `pre_dispatch_collector`. `IngressInbox.append` takes a principal as its first parameter and rejects a principal that is not authorized for the active phase with `UnauthorizedPrincipal`. A recurring task, an activation, an operator, and an orchestrator role are not members of the union, so "the recurring task appends its own trigger" is not a statement the contract can express. This is finding F-201's self-trigger rule restated as an authorization property rather than as a convention, which is what `HUMAN-002` requires and what [ADR-0031](0031-pre-dispatch-ingress-observer-and-collector.md) builds the collector on.

**Two bootstrap dispatch contracts are named, and a recurring task declares which one it runs under.** `BootstrapDispatchContract` is `'durable-bootstrap-append' | 'interim-operator-authorized'`, and `ActivationSpec.bootstrapDispatchContract` is a required declared field that admission rejects when it is absent. The two are disjoint:

| Contract | What appends before dispatch | What evaluates the predicate | What is claimed |
|---|---|---|---|
| `durable-bootstrap-append` | The `pre_dispatch_collector` principal, before scheduler selection | The ingress observer, over the mark the collector raised | The durable predicate is operative |
| `interim-operator-authorized` | Nothing. No durable entry exists before dispatch | A human operator, on their own authority | The durable predicate is **not** operative, and no claim that it authorized the dispatch is made anywhere |

**Authorized append principals are enumerated per phase, and every other principal is rejected.**

| Phase and contract | Authorized to append | Rejected |
|---|---|---|
| Runtime phase | `ingress_adapter`, one per member of `IngressEventType` | Every other principal, with `UnauthorizedPrincipal` |
| Bootstrap under `durable-bootstrap-append` | `pre_dispatch_collector`, and `ingress_adapter` once the run is past bootstrap | Every other principal, with `UnauthorizedPrincipal` |
| Bootstrap under `interim-operator-authorized` | Nothing. A pre-dispatch append is not authorized for any principal under this contract | Every principal, with `UnauthorizedPrincipal` |

**A dispatch whose declared contract is unsatisfied is refused, not silently performed.** The observer evaluates the declared contract before selecting an activation candidate and returns `BootstrapContractUnsatisfied` when `durable-bootstrap-append` is declared and no durable entry exists above the cursor. Under `interim-operator-authorized` the observer never selects the candidate at all; selection is the operator's, and the runtime records that fact rather than asserting the predicate.

**No promptness claim survives.** The withdrawn ADR-0017 consequence is replaced by a statement of what is actually true: under `durable-bootstrap-append` correctness does not depend on promptness, because the entry is durable before selection; under `interim-operator-authorized` discovery affects **dispatch validity**, and that is recorded as an open finding rather than as a resolved one. `F-401` is not claimed resolved by this record, which decides a contract and builds nothing.

## Alternatives considered

**Keep `consumedBy` on the entry and declare it write-once.** The smallest change, and "written once, never mutated" is a real property. Rejected: a write-once field is still a write, so the entry is not byte-identical before and after consumption, and a reader cannot tell an unconsumed entry from a consumed one without knowing which of two documents is authoritative. It also gives consumption state two homes — the field and the cursor — which is the exact defect A-101 recorded and A-201 recorded again. The ledger row already carries `consumedBy`, so the field on the entry is not even a second source of information; it is only a second source of disagreement.

**Keep `appendedBy: string` and constrain it by review.** Costs nothing and keeps the schema flat. Rejected: A-201's evidence is a comment that permitted an activation. A string field with a documented convention is what produced the finding, and a second convention would produce it a third time. A closed union in which no member denotes an activation makes the prohibition structural, and structural is what `HUMAN-002` asks for in the clause "the recurring task is prohibited from appending its own trigger".

**Name one bootstrap contract and treat the other as the absence of a contract.** Simpler: one named durable path, and "no contract declared" for the interim case. Rejected: an absent declaration is indistinguishable from an omission, so a record that simply forgot the field would read as running under the interim contract, and a reader could not tell a deliberate limitation from a defect. Two names and a required field make the choice legible in the record and rejectable at admission.

**Let the operator be a third append principal under the interim contract.** It would let the interim phase append durably and would collapse the two contracts into one. Rejected on two grounds. It is not what `HUMAN-002` approved — the approved appender is a runtime-owned component, not an operator or an operator-run tool, and this amendment represents the approved option rather than the superseded proposal. And an operator principal would make the interim contract look durable while the entry's provenance is a human action with no module boundary, which is the overclaim F-401 identified.

**Model the phase as a run-level flag rather than a per-task declaration.** One field, one place to read. Rejected for the same reason ADR-0018 removed `allowLocalOnlyPublication`: a run-global flag makes one task's declared limitation silently true of every other task in the run. The contract in force is a property of the recurring task's activation, and only that task's activation.

## Consequences

Positive:

- The inbox is immutable in the sense the word normally carries: no field of an appended entry is ever written again, and the interface offers no operation that would.
- Consumption state has exactly one authoritative position, the cursor, with the ledger as its append-only provenance. Two fields can no longer disagree about what was consumed.
- The self-trigger prohibition is a type, so a reviewer checks a union rather than an intention, and an implementation cannot drift into permitting it.
- A reader of `tasks/blocked/TASK-013-task-record-lifecycle-and-gate-closure.md` can tell from `activation.bootstrap_dispatch_contract` whether the durable predicate authorized a dispatch, without reconstructing an argument.
- The runtime can refuse a dispatch that claims a contract it does not satisfy, so the overclaim F-401 recorded becomes a rejected call rather than a paragraph.

Negative:

- `IngressInbox.append` gains a parameter, and every adapter and the collector must be constructed with an identity. That is one more piece of wiring in TASK-026 and one more thing for TASK-010's `V10-F401-AUTH` to check.
- A run that is genuinely in the interim phase now has a durable, legible record saying its dispatch predicate is not operative. That is deliberate and is the point of the record, but it means the architecture carries a named unresolved limitation until [ADR-0031](0031-pre-dispatch-ingress-observer-and-collector.md)'s collector exists and is validated.
- `ActivationSpec` gains a required field, so every activation-bearing record must declare it and the projection in [ADR-0024](0024-task-record-projection-contract.md) must carry it. A record that omits it is rejected at admission rather than defaulted, which is stricter than the rest of the activation block.
