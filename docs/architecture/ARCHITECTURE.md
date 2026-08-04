# Architecture

Entry point for the project's architecture documentation. Owned by the Solution Architect.

The repository is a provider-neutral multi-agent engineering framework. Its governance layer — roles, write scopes, worktrees, task locks, and quality gates — is defined in [`AGENTS.md`](../../AGENTS.md) and enforced by the PowerShell orchestration scripts. This document set covers the **autonomous runtime**: the executable supervisor that turns a single project input into a completed multi-agent run.

## Autonomous runtime

### Objective

One command starts a project. The supervisor bootstraps the initial Manager task from a single project brief, dispatches role-scoped work to LLM providers under bounded concurrency, persists every state change durably, and drives the run to a terminal state across pauses, provider failures, timeouts, and abrupt process termination — without an operator step in between and without duplicating completed work.

### Shape

```text
Operator ──► bin/ CLI ──► lifecycle ──► supervisor ──► scheduler ──► leases
                                            │                          │
                                            ├──► agent workers ──► provider adapters
                                            │
                                            └──► durable state ──► run directory
                                                     ▲
                                          recovery ──┘
```

Six modules, each owned end to end by exactly one implementation task, with no shared module ownership:

| Module | Path | Owner task |
|---|---|---|
| Durable state store | `src/orchestrator/state/` | TASK-003 |
| Provider adapters and agent workers | `src/agents/` | TASK-004 |
| Scheduler and lease manager | `src/orchestrator/scheduling/` | TASK-005 |
| Supervisor core | `src/orchestrator/supervisor/` | TASK-006 |
| Lifecycle control and entry point | `src/orchestrator/lifecycle/`, `bin/` | TASK-007 |
| Recovery, timeouts, retries | `src/orchestrator/recovery/` | TASK-008 |

### Load-bearing decisions

Everything else follows from six choices:

1. **State is the fold of an append-only event journal.** A `RunRecord` is never authored directly; it is computed by replaying events through one pure transition function. Checkpoints are materialized folds written atomically, never a second source of truth. This is what makes crash recovery a replay rather than a repair.

2. **One pure, total transition function is the sole authority on legality.** No module writes a state field. Scheduling, recovery, and lifecycle build event envelopes; only the append path applies them. Determinism follows: the same ordered event sequence always yields the same final state.

3. **Leases are time-bounded and fenced by a monotonic token.** A fencing token is the `stateVersion` of the event that granted the lease, so tokens are globally ordered without a second counter. A superseded worker's late write is rejected by comparison, with no cooperation required from the worker. A second level, the writer epoch, fences whole processes after a crash.

4. **Provider specifics live behind one interface.** Adding a provider is a registry registration. A closed ten-member failure taxonomy replaces raw provider errors at the boundary, and the disposition mapping — retry, fail, or escalate — has exactly one definition. Unknown failures default to `fail`, because retrying an effect of unknown character is the only outcome that can cause real duplication.

5. **Effects are registered before they are performed.** An intent-then-commit ledger lets recovery decide from recorded fact whether to adopt a completed effect or re-execute it. The guarantee is stated honestly: exactly-once for ledger-registered idempotent effects, at-most-once with explicit human escalation otherwise.

6. **Pause, stop, and crash share one reconciliation path.** A drain that hits its deadline is indistinguishable from a crash with respect to in-flight work, so resume always goes through recovery. One path, one set of invariants, one equivalence claim.

### Guarantees

| Guarantee | Established by |
|---|---|
| One project input starts a complete run with no second operator step | [Lifecycle and bootstrap](runtime/LIFECYCLE-AND-BOOTSTRAP.md) |
| Every state transition is deterministic, and replay is reproducible | [State machine](runtime/STATE-MACHINE.md) |
| An interrupted write never becomes readable as valid state | [Durable state and checkpoints](runtime/DURABLE-STATE-AND-CHECKPOINTS.md) |
| Concurrent conflicting writes are rejected, never merged | [Durable state and checkpoints](runtime/DURABLE-STATE-AND-CHECKPOINTS.md) |
| Concurrency limits and write-scope exclusion are never exceeded | [Leases and scheduling](runtime/LEASES-AND-SCHEDULING.md) |
| A superseded worker cannot overwrite a newer attempt | [Leases and scheduling](runtime/LEASES-AND-SCHEDULING.md) |
| An abandoned task returns to the ready set exactly once | [Leases and scheduling](runtime/LEASES-AND-SCHEDULING.md) |
| Retries are classified, bounded, and reproducible | [Retries, timeouts, and idempotency](runtime/RETRIES-TIMEOUTS-AND-IDEMPOTENCY.md) |
| A task in flight at crash time completes once or retries once, never both | [Crash recovery](runtime/CRASH-RECOVERY.md) |
| An interrupted run reaches the same terminal state as an uninterrupted one | [Crash recovery](runtime/CRASH-RECOVERY.md) |
| No credential is ever persisted, logged, checkpointed, or emitted | [Provider adapters](runtime/PROVIDER-ADAPTERS.md) |

### Quality attributes

| Attribute | Position |
|---|---|
| Correctness under interruption | Highest priority. Every other attribute yields to it. |
| Determinism | Required, not merely desirable: replay, seeded backoff, and total dispatch ordering are what make the equivalence claims testable. |
| Observability | Every state change is a durable, diffable, canonical-JSON event. Run events carry primitives only, so no payload can leak through them. |
| Testability | Every boundary is an injected interface, so each module is unit-testable with fakes before its dependencies exist. |
| Throughput | Deliberately traded away. Bounded concurrency and write-scope exclusion cap parallelism; agent invocations dominate wall-clock time, so scheduler overhead is irrelevant. |
| Distribution | Explicitly out of scope. A run has one writer process. The writer epoch is the seam a future multi-process design would extend. |

### Document set

Detailed specifications, all normative:

| Document | Covers |
|---|---|
| [COMPONENT-BOUNDARIES.md](runtime/COMPONENT-BOUNDARIES.md) | Module map, contract roots, allowed dependency directions, cross-cutting rules |
| [INTERFACE-CONTRACTS.md](runtime/INTERFACE-CONTRACTS.md) | Every type and signature crossing a module boundary |
| [STATE-MACHINE.md](runtime/STATE-MACHINE.md) | Run and task states, transition tables, illegal transitions, dynamic admission |
| [DURABLE-STATE-AND-CHECKPOINTS.md](runtime/DURABLE-STATE-AND-CHECKPOINTS.md) | Journal, atomic checkpoints, restore, monotonicity, writer lock |
| [LEASES-AND-SCHEDULING.md](runtime/LEASES-AND-SCHEDULING.md) | Lease lifecycle, fencing, admission gates, deterministic ordering |
| [PROVIDER-ADAPTERS.md](runtime/PROVIDER-ADAPTERS.md) | Adapter interface, failure taxonomy, timeout layering, credential handling |
| [RETRIES-TIMEOUTS-AND-IDEMPOTENCY.md](runtime/RETRIES-TIMEOUTS-AND-IDEMPOTENCY.md) | Idempotency keys, effect ledger, backoff, exhaustion, timeout layers |
| [LIFECYCLE-AND-BOOTSTRAP.md](runtime/LIFECYCLE-AND-BOOTSTRAP.md) | One-input bootstrap, command surface, drain, pause and resume, exit codes |
| [CRASH-RECOVERY.md](runtime/CRASH-RECOVERY.md) | Failure model, recovery phases, twelve post-crash invariants, accepted risks |
| [INTEGRATION-STRATEGY.md](runtime/INTEGRATION-STRATEGY.md) | Branch topology, integration order, contract change control |

Decisions: [`docs/adr/`](../adr/README.md), ADR-0001 through ADR-0010.

Diagrams: [components](../../diagrams/architecture/runtime-components.md), [state machines](../../diagrams/architecture/runtime-state-machine.md), [sequences](../../diagrams/architecture/runtime-sequences.md).

### Constraints on implementation tasks

1. [INTERFACE-CONTRACTS.md](runtime/INTERFACE-CONTRACTS.md) is normative. During Waves 2 through 5, no implementation task changes a contract, even inside its own write scope. A contract believed to be wrong is escalated to the Orchestrator for an architect amendment.
2. Every module receives `Clock`, `SeededRandom`, and `SecretProvider` by injection. No module reads wall-clock time, unseeded randomness, or an environment variable directly.
3. No credential, token, or provider secret is written to state, checkpoints, journals, logs, run events, or test fixtures.
4. Operator-visible command-line text is Turkish. Identifiers, options, error codes, log lines, event names, and all source content are English.
5. Every published module entry point is `index.ts`. Deep imports into another module's internals are a boundary violation.

### Known gap requiring Orchestrator routing

The runtime needs a toolchain — `package.json`, `tsconfig.json`, and a test runner configuration — and **no task in the TASK-001 graph has those paths in its write scope**. TASK-003 and TASK-004 therefore cannot compile or run a test without a scope violation. The recommendation is one small devops-owned task sequenced between TASK-002's review gate and the creation of the Wave 2 worktrees. Parameters are in [ADR-0001](../adr/0001-runtime-platform-and-language.md); routing rationale is in [INTEGRATION-STRATEGY.md](runtime/INTEGRATION-STRATEGY.md).

## Application architecture

Not yet defined. The repository's application layers — `src/backend/`, `src/frontend/`, `console/`, and `schema/` — remain placeholders until a target project supplies scope. Their architecture will be recorded here and under `docs/architecture/` when a Project Manager task defines it.
