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
| [0010](0010-integration-and-branch-aggregation-strategy.md) | Integration and branch aggregation strategy | Accepted; superseded in part by 0016 | Orchestrator, all runtime tasks |
| [0011](0011-agent-workspace-lifecycle-module.md) | Agent workspace lifecycle as the seventh runtime module | Accepted; superseded in part by 0019 and 0021 | TASK-017 |
| [0012](0012-crash-atomic-journal-batches-with-commit-records.md) | Crash-atomic journal batches with commit records | Accepted | TASK-003 |
| [0013](0013-single-decision-recovery-reconciliation.md) | Single-decision recovery reconciliation | Accepted; superseded in part by 0020 | TASK-008, TASK-006 |
| [0014](0014-live-run-control-and-process-tree-ownership.md) | Live-run control protocol and OS process-tree ownership | Accepted; superseded in part by 0019 and 0022 | TASK-007, TASK-004 |
| [0015](0015-typed-scheduling-gate-and-activation-contracts.md) | Typed scheduling, gate, resource-lock, and activation contracts | Accepted; superseded in part by 0017 and 0018 | TASK-005, TASK-003, TASK-006 |
| [0016](0016-integration-branch-and-typed-merge-order.md) | Integration branch and typed merge order | Accepted | Orchestrator, all runtime tasks |
| [0017](0017-durable-ingress-inbox-and-ingress-epochs.md) | Durable append-only ingress inbox with stable positions and ingress epochs | Accepted | TASK-026, TASK-005, TASK-003 |
| [0018](0018-publication-classes-and-gate-lineages.md) | Publication classes, gate lineages, and the withdrawal of the owner form | Accepted | TASK-005, TASK-003, TASK-006, TASK-017 |
| [0019](0019-durable-intent-receipts-for-side-effects.md) | Durable-intent receipts for process and workspace side effects | Accepted | TASK-004, TASK-017, TASK-003, TASK-006 |
| [0020](0020-durable-adoptable-results-for-recovery.md) | Durable adoptable results, recorded before the result effect is committed | Accepted | TASK-006, TASK-008, TASK-003 |
| [0021](0021-durable-ingress-module-and-the-eight-module-map.md) | The durable ingress module and the eight-module map | Accepted | TASK-026, TASK-005, Orchestrator |
| [0022](0022-unqualified-drain-closure.md) | A drain that cannot return with a surviving descendant | Accepted | TASK-007, TASK-004, TASK-008 |

ADR-0001 through ADR-0010 were recorded under TASK-002. ADR-0011 through ADR-0016 were recorded under TASK-016, the architecture amendment that resolved findings A-001 through A-004 from `reports/code-review/TASK-002-ARCHITECTURE-REVIEW.md` and added the workspace lifecycle module. ADR-0017 through ADR-0022 were recorded under TASK-024, the second architecture amendment, which resolves findings A-101 through A-105 from `reports/code-review/TASK-016-ARCHITECTURE-AMENDMENT-REVIEW.md` and the contract representation of F-301 and F-302 from `reports/code-review/TASK-001-DECOMPOSITION-REVIEW-ROUND-4.md`.

The architecture documents they constrain are under [`docs/architecture/runtime/`](../architecture/runtime/), with [`docs/architecture/ARCHITECTURE.md`](../architecture/ARCHITECTURE.md) as the entry point. Its TASK-016 and TASK-024 amendment registers map each finding to the documents and decisions that resolve it.

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
| 0010 | Branch from and merge to `main`; no integration branch; wave numbering | 0016 | Squash per task, contract change control, no branching from a sibling |
| 0011 | Four single-call workspace operations; the intent-then-commit pairing they promised | 0019 | The module itself, its four operations, script delegation, publication and pull-request identity, the four structural prohibitions, the session-token rule, failure classification by artifact observation |
| 0011 | "Seven modules; no unassigned runtime responsibility" | 0021 | Everything else in 0011 |
| 0013 | The `adopt` row emitting `WorkerSucceeded` from a `resultDigest` alone | 0020 | One decision per task, the four-input total function, the priority order, the `current_epoch` defect rule, determinism, `attemptStartedAt` |
| 0014 | Durable identity before the spawn as expressed through one opaque `execute` call and an undischargeable `spawnOwned` pre-condition | 0019 | Owned groups per platform, bounded escalation, verified exit, identity by pid and start time, unconditional fencing at recovery, the whole control protocol |
| 0014 | `verifiedExit: false` as an outcome compatible with a completed drain; the qualified pause post-condition | 0022 | Everything else in 0014 |
| 0015 | `run.activationEvents` as an internal queue; `seq` minted by `applyEvent`; `pendingThroughSeq` | 0017 | The `quiescent` state, the starvation bound with reserved capacity, advance-at-success, the typed-edge model |
| 0015 | `allowLocalOnlyPublication`; one undisambiguated `gate_passed`; singular `gateFor`; five invariants | 0018 | The typed-edge model, `pre_merge_gates`, the durable-verdict rule, named resource locks, `quiescent` |

Read down the "Still in force" column: no clause appears in two rows with different answers. ADR-0015 is superseded by two later records that touch disjoint clauses — 0017 takes its activation model, 0018 takes its gate and publication model — and neither touches the typed-edge decision both leave standing. ADR-0011 and ADR-0014 are each superseded by two records under the same pattern.
