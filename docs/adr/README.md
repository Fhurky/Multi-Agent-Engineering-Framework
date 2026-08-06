# Architecture Decision Records

Durable records of consequential technical decisions. Each ADR states the context, the decision, the alternatives that were considered and why they were rejected, and the consequences that follow.

A superseded decision is replaced by a new record that references it, never deleted or edited in place. An ADR is amended only by the Solution Architect, in a separate execution context from the implementation it constrains.

When a later record supersedes only part of an earlier one, the earlier record's `Status` line carries a forward reference and its Context, Decision, Alternatives, and Consequences sections are left exactly as written. That forward reference is the only change ever made to a superseded record.

## Index

| ADR | Title | Status | Primary consumer |
|---|---|---|---|
| [0001](0001-runtime-platform-and-language.md) | Runtime platform and language | Accepted | All runtime tasks |
| [0002](0002-runtime-component-boundaries-and-module-ownership.md) | Runtime component boundaries and module ownership | Accepted; superseded in part by 0011 and 0021 | All runtime tasks |
| [0003](0003-deterministic-run-and-task-state-machine.md) | Deterministic run and task state machine | Accepted; extended by 0013 and 0015 | TASK-006 |
| [0004](0004-durable-state-as-event-journal-with-atomic-checkpoints.md) | Durable state as an event journal with atomic checkpoints | Accepted; superseded in part by 0012 | TASK-003 |
| [0005](0005-time-bounded-leases-with-monotonic-fencing-tokens.md) | Time-bounded leases with monotonic fencing tokens | Accepted | TASK-005 |
| [0006](0006-retry-classification-backoff-and-idempotency-keys.md) | Retry classification, backoff, and idempotency keys | Accepted; refined by 0011 | TASK-008 |
| [0007](0007-provider-adapter-boundary-and-error-taxonomy.md) | Provider adapter boundary and error taxonomy | Accepted; extended by 0014 | TASK-004 |
| [0008](0008-one-input-project-bootstrap-contract.md) | One-input project bootstrap contract | Accepted | TASK-007 |
| [0009](0009-graceful-pause-drain-and-crash-recovery.md) | Graceful pause, drain, and crash recovery | Accepted; superseded in part by 0013 and 0014 | TASK-007, TASK-008 |
| [0010](0010-integration-and-branch-aggregation-strategy.md) | Integration and branch aggregation strategy | Accepted; superseded in part by 0016, 0041, and proposed 0042 | Orchestrator, all runtime tasks |
| [0011](0011-agent-workspace-lifecycle-module.md) | Agent workspace lifecycle as the seventh runtime module | Accepted; superseded in part by 0019 and 0021 | TASK-017 |
| [0012](0012-crash-atomic-journal-batches-with-commit-records.md) | Crash-atomic journal batches with commit records | Accepted | TASK-003 |
| [0013](0013-single-decision-recovery-reconciliation.md) | Single-decision recovery reconciliation | Accepted; superseded in part by 0020, 0030, and 0037 | TASK-008, TASK-006 |
| [0014](0014-live-run-control-and-process-tree-ownership.md) | Live-run control protocol and OS process-tree ownership | Accepted; superseded in part by 0019, 0022, and 0026 | TASK-007, TASK-004 |
| [0015](0015-typed-scheduling-gate-and-activation-contracts.md) | Typed scheduling, gate, resource-lock, and activation contracts | Accepted; superseded in part by 0017 and 0018 | TASK-005, TASK-003, TASK-006 |
| [0016](0016-integration-branch-and-typed-merge-order.md) | Integration branch and typed merge order | Accepted; superseded in part by 0021, 0041, and proposed 0042 | Orchestrator, all runtime tasks |
| [0017](0017-durable-ingress-inbox-and-ingress-epochs.md) | Durable append-only ingress inbox with stable positions and ingress epochs | Accepted; superseded in part by 0023 | TASK-026, TASK-005, TASK-003 |
| [0018](0018-publication-classes-and-gate-lineages.md) | Publication classes, gate lineages, and the withdrawal of the owner form | Accepted; extended by 0041 | TASK-005, TASK-003, TASK-006, TASK-017 |
| [0019](0019-durable-intent-receipts-for-side-effects.md) | Durable-intent receipts for process and workspace side effects | Accepted; superseded in part by 0027, 0028, and 0040 | TASK-004, TASK-017, TASK-003, TASK-006 |
| [0020](0020-durable-adoptable-results-for-recovery.md) | Durable adoptable results, recorded before the result effect is committed | Accepted; superseded in part by 0025 and 0030 | TASK-006, TASK-008, TASK-003 |
| [0021](0021-durable-ingress-module-and-the-eight-module-map.md) | The durable ingress module and the eight-module map | Accepted; superseded in part by 0029 and proposed 0042 | TASK-026, TASK-005, Orchestrator |
| [0022](0022-unqualified-drain-closure.md) | A drain that cannot return with a surviving descendant | Accepted; superseded in part by 0026 | TASK-007, TASK-004, TASK-008 |
| [0023](0023-immutable-ingress-entries-and-named-bootstrap-dispatch-contracts.md) | Immutable ingress entries and named bootstrap dispatch contracts | Accepted | TASK-026, TASK-005, TASK-003 |
| [0024](0024-task-record-projection-contract.md) | Exact task-record projection contract | Accepted; superseded in part by 0032 | TASK-007, TASK-005 |
| [0025](0025-result-effect-identity-in-the-event-union.md) | Result-effect identity in the event union | Accepted; superseded in part by 0033 | TASK-003, TASK-006, TASK-008 |
| [0026](0026-blocked-drain-attach-and-unverified-closure-recovery.md) | Blocked-drain attach and unverified-closure recovery | Accepted | TASK-007, TASK-008, TASK-004 |
| [0027](0027-finalize-split-around-the-publication-append.md) | Finalize split around the publication append | Accepted | TASK-017, TASK-006, TASK-003 |
| [0028](0028-nominal-store-issued-durable-append-receipts.md) | Nominal, store-issued durable append receipts | Accepted; superseded in part by 0034 | TASK-003, TASK-004, TASK-017 |
| [0029](0029-ingress-delivery-ownership.md) | Scheduling-owned ingress delivery | Accepted; extended by proposed 0042 | TASK-005, TASK-006, TASK-004, TASK-026 |
| [0030](0030-one-canonical-recovery-decision-input-domain.md) | One canonical recovery decision input domain | Accepted; superseded in part by 0033 and 0035 | TASK-008, TASK-006 |
| [0031](0031-pre-dispatch-ingress-observer-and-collector.md) | Pre-dispatch ingress observer and collector | Accepted HUMAN-002 decision; result shape superseded in part by 0038 | TASK-026, TASK-005, TASK-006 |
| [0032](0032-lossless-task-record-source-and-projection.md) | Lossless task-record source and exact projection | TASK-033 changes-required; superseded in part by 0036 | TASK-007, TASK-005, TASK-003, TASK-006 |
| [0033](0033-unique-committed-result-effect-recovery.md) | Recovery requires one unique committed result effect | TASK-033 changes-required; superseded in part by 0035 | TASK-003, TASK-006, TASK-008 |
| [0034](0034-spawn-owned-registration-proof-refusal.md) | Spawn-owned registration proof refusal is explicit | TASK-033 changes-required for TASK-032; A-206 individually resolved | TASK-004, TASK-003, TASK-006 |
| [0035](0035-explicit-reconciliation-evidence-composition-boundary.md) | Explicit reconciliation evidence composition boundary | TASK-035 changes-required overall; A-401/A-104 residue resolved | TASK-003, TASK-008 |
| [0036](0036-target-tree-derived-architecture-fixtures-and-lineage-integration.md) | Target-tree-derived architecture fixtures and lineage integration | TASK-035 changes-required overall; integration order superseded by 0041 | TASK-005, TASK-007, Orchestrator, all runtime tasks |
| [0037](0037-recovery-completion-evidence-and-decision-block-legality.md) | Recovery completion evidence and decision-block legality | TASK-037 changes-required overall; A-501/A-502 resolved | TASK-003, TASK-006, TASK-008 |
| [0038](0038-total-pre-dispatch-ingress-append-dispositions.md) | Total pre-dispatch ingress append dispositions | TASK-037 changes-required overall; A-503/HUMAN-002 resolved | TASK-026, TASK-005, TASK-006 |
| [0039](0039-single-nominal-receipt-authority-and-cross-root-conformance.md) | Single nominal receipt authority and cross-root conformance | TASK-037 changes-required overall; A-504 resolved | TASK-003, TASK-004, TASK-006, TASK-017 |
| [0040](0040-typed-provider-planning-result-and-phase-observables.md) | Typed provider planning result and phase observables | TASK-037 changes-required overall; A-505 resolved | TASK-004, TASK-006, TASK-017 |
| [0041](0041-cumulative-architecture-lineage-integration-unit.md) | The cumulative architecture lineage is one content integration unit | Accepted by TASK-039; extended by proposed 0042 | Orchestrator, TASK-003, TASK-005, TASK-006, all lineage consumers |
| [0042](0042-conditionally-authorized-post-gate-merge-executors.md) | Conditionally authorized post-gate merge executors | Proposed under TASK-040; TASK-041 review pending | Future runtime and DevOps executor tasks, TASK-026, TASK-005, TASK-006 |

ADR-0001 through ADR-0010 were recorded under TASK-002. ADR-0011 through ADR-0016 were recorded under TASK-016. ADR-0017 through ADR-0022 were recorded under TASK-024. Independent reviews rejected each of those three architecture publications; their records remain authoring baselines, not approved architecture. ADR-0023 through ADR-0031 are the TASK-028 amendment for findings A-201 through A-208 and the HUMAN-002 contract; TASK-029 rejected that publication in round 4. ADR-0032 through ADR-0034 are the TASK-032 authoring baseline; TASK-033 rejected it in round 5 while individually resolving A-203, A-206, A-301, and the A-102 inherited view. ADR-0035 and ADR-0036 are the TASK-034 fifth amendment; TASK-035 rejected that publication in round 6 while resolving its entire routed set and opening A-501 through A-505. ADR-0037 through ADR-0040 are the TASK-036 sixth amendment; TASK-037 rejected that publication in round 7 while recording A-501 through A-505 and every inherited obligation satisfied and opening A-601. ADR-0041 is the TASK-038 single-finding amendment, accepted by independent TASK-039 at review commit `734bdbc` and integrated at `de3a8d6`. ADR-0042 is the TASK-040 HUMAN-004 amendment. It is Architect-authored and proposed; TASK-041 alone may record its verdict.

The architecture documents they constrain are under [`docs/architecture/runtime/`](../architecture/runtime/), with [`docs/architecture/ARCHITECTURE.md`](../architecture/ARCHITECTURE.md) as the entry point. Its amendment registers map each finding to the documents and decisions intended to address it; those mappings are traceability claims, not self-review dispositions.

## Supersession map

No two records decide the same question differently. Where a later record changes an earlier decision, it names the exact clause it replaces and leaves the rest in force.

| Earlier | Clause superseded or extended | Later | Still in force |
|---|---|---|---|
| 0002 | Six-module map; "one permitted duplication" | 0011 | Contract-root split, injection rule, acyclicity, `src/shared/` exclusion |
| 0002 | Module count, again | 0021 | The same; the `src/shared/` exclusion in particular is reaffirmed rather than reopened |
| 0003 | Task state set; closed event union | 0013, 0015 | One pure total transition function as sole authority; the three named choices |
| 0004 | Append protocol; restore torn-tail rule | 0012 | Journal-plus-checkpoint model, checkpoint protocol, compare-and-set, monotonicity, writer lock |
| 0006 | Pull-request creation classified non-idempotent in all cases | 0011 | Key derivation, ledger states, backoff, exhaustion, the honest guarantee |
| 0007 | Timeout signalling as the end of the story | 0014 | Adapter boundary, closed taxonomy, disposition mapping, credential rules |
| 0009 | Seven-phase recovery split; in-flight work never terminated at the drain deadline | 0013, 0014 | One drain with two intents, resume through recovery, reported restore failure, equivalence claim |
| 0010 | Branch from and merge to `main`; no integration branch; wave numbering | 0016 | Squash discipline as later narrowed by 0041, contract change control, no branching from a sibling |
| 0010 | One squash commit for every task, without a cumulative-lineage exception | 0041 | Contract change control and no branching from a sibling; ordinary tasks still squash once |
| 0010 | Human-only execution of the final integration-to-main release merge | 0042 | Branch topology, one final release PR, contract change control, and no sibling branching |
| 0016 | Per-task squash and the architecture portion of the typed merge order | 0041 | Integration branch, ordinary-task order and squash, consumer dependency order, contract change control |
| 0016 | Operator execution of task integration and blanket prohibition on non-human main merge | 0042 | Exact integration order, task squash method, integration branch, and contract change control |
| 0011 | Four single-call workspace operations; the intent-then-commit pairing they promised | 0019 | The module itself, its four operations, script delegation, publication and pull-request identity, the four structural prohibitions, the session-token rule, failure classification by artifact observation |
| 0011 | "Seven modules; no unassigned runtime responsibility" | 0021 | Everything else in 0011 |
| 0013 | The `adopt` row emitting `WorkerSucceeded` from a `resultDigest` alone | 0020 | One decision per task, priority order, the `current_epoch` defect rule, determinism, `attemptStartedAt` |
| 0013 | Four-input cardinality of recovery reconciliation | 0030 | One decision per task, priority order, the `current_epoch` defect rule, determinism, `attemptStartedAt` |
| 0013 | One-event-per-task wording and the claim that every event in a decision is legal directly from restored state | 0037 | One decision per task, decision table, priority order, fencing, and deterministic block order |
| 0014 | Durable identity before the spawn as expressed through one opaque `execute` call and an undischargeable `spawnOwned` pre-condition | 0019 | Owned groups per platform, bounded escalation, verified exit, identity by pid and start time, unconditional fencing at recovery, the whole control protocol |
| 0014 | `verifiedExit: false` as an outcome compatible with a completed drain; the qualified pause post-condition | 0022 | Everything else in 0014 |
| 0014 | Recovery selecting only registrations with no closure record | 0026 | Owned groups, bounded escalation, verified exit, identity by pid and start time, unconditional fencing, control protocol |
| 0015 | `run.activationEvents` as an internal queue; `seq` minted by `applyEvent`; `pendingThroughSeq` | 0017 | The `quiescent` state, the starvation bound with reserved capacity, advance-at-success, the typed-edge model |
| 0015 | `allowLocalOnlyPublication`; one undisambiguated `gate_passed`; singular `gateFor`; five invariants | 0018 | The typed-edge model, `pre_merge_gates`, the durable-verdict rule, named resource locks, `quiescent` |
| 0018 | Extended with post-verdict lifecycle closure for a cumulative lineage | 0041 | Authoritative verdict, growing cohort, atomic relations, durable history, publication classes, owner-form withdrawal |
| 0017 | Entry consumption field, string-valued append authority, and bootstrap promptness claim | 0023 | Stable identity and position, deduplication, ordering, retention, class precedence, self-exclusion, epochs |
| 0019 | One-call finalization around publication and lock release | 0027 | Intent-before-effect ordering and workspace lifecycle ownership |
| 0019 | Structural, identity-poor durable receipts | 0028 | Plan/execute side-effect split and append-before-effect requirement |
| 0019 | `planInvocation` returned a plan directly although family resolution can fail | 0040 | Three-phase split, supervisor append seams, and intent-before-effect ordering |
| 0020 | Result-effect identity inferred outside `EffectIntentRecorded` | 0025 | Durable adoptable-result record and adopt outcome |
| 0020 | Recovery inputs described without one canonical type | 0030 | Adoptable-result semantics and result digest rules |
| 0021 | Unnamed delivery responsibility between inbox and activation | 0029 | Eight-module count, unique owners, dependency levels, ingress-store ownership |
| 0021 | Eight-module count | 0042 | Ingress module, ownership, dependency level, and all store responsibilities |
| 0022 | Blocked drain with no legal attach and absent-closure-only recovery | 0026 | Unqualified no-survivor completion criterion and bounded drain attempt |
| 0024 | Closed nested source shapes, lossless-retention claim without an exact inverse, and representative fixtures | 0032 | Projection target, split ownership, inertness, derived checks, and graph validation |
| 0025 | Live admission uniqueness treated as sufficient recovery lookup | 0033 | Durable flag origin, pre-result ordering, and the live admission guard |
| 0028 | Worker result unions omitted proof refusal at the internal spawn boundary | 0034 | Nominal/discriminated receipts, store issuance and verification, epoch/subject binding, independent-root verifier |
| 0028 | Cross-document declaration and sequence-name conformance was implicit | 0039 | Single state-root nominal authority, store issuance and verification, epoch/subject binding, independent-root verifier |
| 0030 | Any committed effect reduced to the committed ledger member | 0033 | Six fields, four-value axis, canonical cardinality, and total decision-domain ownership |
| 0030 | Complete constructibility claimed without declaring current-epoch and pending-result evidence | 0035 | Six fields, four-value axis, canonical cardinality, and the pure decider |
| 0032 | Fixed target identity and literal task/relation fixture totals | 0036 | Recursive source schema, raw/body retention, exhaustive leaf audit, exact projection and inverse, split ownership |
| 0036 | Newest-to-oldest architecture content integration rows | 0041 | Published-target derivation for every current fact, topology proof, cohort and floor derivation |
| 0033 | Builder accepted only task, ledger entries, and deadline while promising a complete input | 0035 | Result-effect uniqueness, reduction priority, evidence identity, and event order |
| 0031 | Collector success implicitly required a newly appended entry | 0038 | Runtime-owned collector, authorization, fail-closed pre-selection order, signal/observation/delivery ownership, and bounded interim authorization |
| 0029 | Ingress delivery covered existing external facts but no merge-result adapter principal | 0042 | TASK-005 remains sole signal/observation/delivery owner; TASK-026 remains sole store/append owner |
| 0041 | Extended with conditional executor and result-ingress ownership | 0042 | One cumulative content unit, exact tree equality, direct/subsumed evidence, and no predecessor blob replay |

Read down the "Still in force" column: no clause appears in two rows with different answers. ADR-0015 is superseded by two later records that touch disjoint clauses — 0017 takes its activation model, 0018 takes its gate and publication model — and neither touches the typed-edge decision both leave standing. ADR-0011 and ADR-0014 are each superseded by two records under the same pattern. ADR-0033 changes ADR-0030's committed-member vocabulary and reduction; ADR-0035 changes only its evidence-composition boundary. Both preserve the six-field domain and four-value cardinality. ADR-0036 replaces ADR-0032's current-target literals without weakening its lossless schema and inverse; ADR-0041 replaces only its content integration order and extends ADR-0018 only after a passing verdict. Proposed ADR-0042 changes who may conditionally execute the two merges and adds result ingress; it preserves ADR-0041 content-unit semantics, typed gate authority, and TASK-005/TASK-026 ownership. No second projection, gate-lineage, recovery-domain, or generic merge authority exists.
