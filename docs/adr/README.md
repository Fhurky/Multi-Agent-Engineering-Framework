# Architecture Decision Records

Durable records of consequential technical decisions. Each ADR states the context, the decision, the alternatives that were considered and why they were rejected, and the consequences that follow.

A superseded decision is replaced by a new record that references it, never deleted or edited in place. An ADR is amended only by the Solution Architect, in a separate execution context from the implementation it constrains.

When a later record supersedes only part of an earlier one, the earlier record's `Status` line carries a forward reference and its Context, Decision, Alternatives, and Consequences sections are left exactly as written. That forward reference is the only change ever made to a superseded record.

## Index

| ADR | Title | Status | Primary consumer |
|---|---|---|---|
| [0001](0001-runtime-platform-and-language.md) | Runtime platform and language | Accepted | All runtime tasks |
| [0002](0002-runtime-component-boundaries-and-module-ownership.md) | Runtime component boundaries and module ownership | Accepted; superseded in part by 0011 | All runtime tasks |
| [0003](0003-deterministic-run-and-task-state-machine.md) | Deterministic run and task state machine | Accepted; extended by 0013 and 0015 | TASK-006 |
| [0004](0004-durable-state-as-event-journal-with-atomic-checkpoints.md) | Durable state as an event journal with atomic checkpoints | Accepted; superseded in part by 0012 | TASK-003 |
| [0005](0005-time-bounded-leases-with-monotonic-fencing-tokens.md) | Time-bounded leases with monotonic fencing tokens | Accepted | TASK-005 |
| [0006](0006-retry-classification-backoff-and-idempotency-keys.md) | Retry classification, backoff, and idempotency keys | Accepted; refined by 0011 | TASK-008 |
| [0007](0007-provider-adapter-boundary-and-error-taxonomy.md) | Provider adapter boundary and error taxonomy | Accepted; extended by 0014 | TASK-004 |
| [0008](0008-one-input-project-bootstrap-contract.md) | One-input project bootstrap contract | Accepted | TASK-007 |
| [0009](0009-graceful-pause-drain-and-crash-recovery.md) | Graceful pause, drain, and crash recovery | Accepted; superseded in part by 0013 and 0014 | TASK-007, TASK-008 |
| [0010](0010-integration-and-branch-aggregation-strategy.md) | Integration and branch aggregation strategy | Accepted; superseded in part by 0016 | Orchestrator, all runtime tasks |
| [0011](0011-agent-workspace-lifecycle-module.md) | Agent workspace lifecycle as the seventh runtime module | Accepted | TASK-017 |
| [0012](0012-crash-atomic-journal-batches-with-commit-records.md) | Crash-atomic journal batches with commit records | Accepted | TASK-003 |
| [0013](0013-single-decision-recovery-reconciliation.md) | Single-decision recovery reconciliation | Accepted | TASK-008, TASK-006 |
| [0014](0014-live-run-control-and-process-tree-ownership.md) | Live-run control protocol and OS process-tree ownership | Accepted | TASK-007, TASK-004 |
| [0015](0015-typed-scheduling-gate-and-activation-contracts.md) | Typed scheduling, gate, resource-lock, and activation contracts | Accepted | TASK-005, TASK-003, TASK-006 |
| [0016](0016-integration-branch-and-typed-merge-order.md) | Integration branch and typed merge order | Accepted | Orchestrator, all runtime tasks |

ADR-0001 through ADR-0010 were recorded under TASK-002. ADR-0011 through ADR-0016 were recorded under TASK-016, the architecture amendment that resolved findings A-001 through A-004 from `reports/code-review/TASK-002-ARCHITECTURE-REVIEW.md` and added the missing workspace lifecycle module.

The architecture documents they constrain are under [`docs/architecture/runtime/`](../architecture/runtime/), with [`docs/architecture/ARCHITECTURE.md`](../architecture/ARCHITECTURE.md) as the entry point. Its TASK-016 amendment register maps each finding to the documents and decisions that resolve it.

## Supersession map

No two records decide the same question differently. Where a later record changes an earlier decision, it names the exact clause it replaces and leaves the rest in force.

| Earlier | Clause superseded or extended | Later | Still in force |
|---|---|---|---|
| 0002 | Six-module map; "one permitted duplication" | 0011 | Contract-root split, injection rule, acyclicity, `src/shared/` exclusion |
| 0003 | Task state set; closed event union | 0013, 0015 | One pure total transition function as sole authority; the three named choices |
| 0004 | Append protocol; restore torn-tail rule | 0012 | Journal-plus-checkpoint model, checkpoint protocol, compare-and-set, monotonicity, writer lock |
| 0006 | Pull-request creation classified non-idempotent in all cases | 0011 | Key derivation, ledger states, backoff, exhaustion, the honest guarantee |
| 0007 | Timeout signalling as the end of the story | 0014 | Adapter boundary, closed taxonomy, disposition mapping, credential rules |
| 0009 | Seven-phase recovery split; in-flight work never terminated at the drain deadline | 0013, 0014 | One drain with two intents, resume through recovery, reported restore failure, equivalence claim |
| 0010 | Branch from and merge to `main`; no integration branch; wave numbering | 0016 | Squash per task, contract change control, no branching from a sibling |
