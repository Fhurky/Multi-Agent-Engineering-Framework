# Architecture Decision Records

Durable records of consequential technical decisions. Each ADR states the context, the decision, the alternatives that were considered and why they were rejected, and the consequences that follow.

A superseded decision is replaced by a new record that references it, never deleted or edited in place. An ADR is amended only by the Solution Architect, in a separate execution context from the implementation it constrains.

## Index

| ADR | Title | Status | Primary consumer |
|---|---|---|---|
| [0001](0001-runtime-platform-and-language.md) | Runtime platform and language | Accepted | All runtime tasks |
| [0002](0002-runtime-component-boundaries-and-module-ownership.md) | Runtime component boundaries and module ownership | Accepted | All runtime tasks |
| [0003](0003-deterministic-run-and-task-state-machine.md) | Deterministic run and task state machine | Accepted | TASK-006 |
| [0004](0004-durable-state-as-event-journal-with-atomic-checkpoints.md) | Durable state as an event journal with atomic checkpoints | Accepted | TASK-003 |
| [0005](0005-time-bounded-leases-with-monotonic-fencing-tokens.md) | Time-bounded leases with monotonic fencing tokens | Accepted | TASK-005 |
| [0006](0006-retry-classification-backoff-and-idempotency-keys.md) | Retry classification, backoff, and idempotency keys | Accepted | TASK-008 |
| [0007](0007-provider-adapter-boundary-and-error-taxonomy.md) | Provider adapter boundary and error taxonomy | Accepted | TASK-004 |
| [0008](0008-one-input-project-bootstrap-contract.md) | One-input project bootstrap contract | Accepted | TASK-007 |
| [0009](0009-graceful-pause-drain-and-crash-recovery.md) | Graceful pause, drain, and crash recovery | Accepted | TASK-007, TASK-008 |
| [0010](0010-integration-and-branch-aggregation-strategy.md) | Integration and branch aggregation strategy | Accepted | Orchestrator, all runtime tasks |

All ten were recorded under TASK-002. The architecture documents they constrain are under [`docs/architecture/runtime/`](../architecture/runtime/), with [`docs/architecture/ARCHITECTURE.md`](../architecture/ARCHITECTURE.md) as the entry point.
