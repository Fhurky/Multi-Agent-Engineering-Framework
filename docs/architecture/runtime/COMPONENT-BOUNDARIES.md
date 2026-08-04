# Runtime Component Boundaries

Normative component decomposition for the autonomous multi-agent runtime. Produced under TASK-002. Related decision: [ADR-0002](../../adr/0002-runtime-component-boundaries-and-module-ownership.md).

## Purpose

The runtime is a single-command supervisor that starts a project run, dispatches role-scoped agent work to LLM providers, persists every state change durably, and drives the run to a terminal state across pauses, crashes, and retries.

This document partitions that runtime into modules such that each module has exactly one implementation task owner, and no two tasks write the same module.

## Module map

Each row is owned end to end by exactly one task. No module appears twice.

| Module | Source path | Owner task | Responsibility |
|---|---|---|---|
| Durable state store | `src/orchestrator/state/` | TASK-003 | Run and task record persistence, event journal, atomic checkpoints, compare-and-set append, restore, writer lock |
| Provider adapters and agent workers | `src/agents/` | TASK-004 | Provider adapter interface and registry, invocation assembly, provider call execution, failure classification, worker timeout signalling |
| Scheduler and lease manager | `src/orchestrator/scheduling/` | TASK-005 | Ready-task selection, dependency gating, bounded concurrency, write-scope exclusion, lease grant, renew, expiry, reclaim, fencing token issuance |
| Supervisor core | `src/orchestrator/supervisor/` | TASK-006 | Deterministic transition function, run loop, result aggregation, dynamic task admission, completion detection, run events |
| Lifecycle control and entry point | `src/orchestrator/lifecycle/`, `bin/` | TASK-007 | One-input bootstrap, command surface, graceful drain, pause, resume, signal handling, completion reporting, exit codes |
| Recovery, timeouts, retries | `src/orchestrator/recovery/` | TASK-008 | Crash recovery, lease reconciliation, timeout watchdog, retry policy, backoff, idempotency ledger enforcement, retry exhaustion |

## Contract roots

Cross-module types are a shared surface, and a shared surface with no single owner is the most likely source of conflict between the six parallel implementation tasks. The runtime therefore has exactly two contract roots, each inside an existing task's write scope.

| Contract root | Owner task | Declares |
|---|---|---|
| `src/orchestrator/state/contracts/` | TASK-003 | Identifiers, run and task records, run and task states, lease record, event envelope, event union, store interface, error values, clock interface |
| `src/agents/contracts/` | TASK-004 | Provider adapter interface, invocation, adapter outcome, failure taxonomy, worker result, secret provider interface |

`src/shared/` is deliberately not used by the runtime. It is outside every runtime task's write scope, so a module placed there would have no owner.

TASK-003 and TASK-004 execute in parallel and cannot import from each other at authoring time. Both transcribe their half of [INTERFACE-CONTRACTS.md](INTERFACE-CONTRACTS.md) verbatim. That document, not either implementation, is the normative source. Neither contract root imports the other, so the parallel transcription cannot deadlock.

## Allowed dependency directions

An arrow means "may import from". Any import not listed is a boundary violation and must be rejected in review.

```text
state/contracts   <-  state
state/contracts   <-  scheduling
state/contracts   <-  supervisor
state/contracts   <-  lifecycle
state/contracts   <-  recovery

agents/contracts  <-  agents
agents/contracts  <-  scheduling
agents/contracts  <-  supervisor
agents/contracts  <-  recovery

state             <-  (nobody; reached only through the StateStore interface)
scheduling        <-  supervisor
supervisor        <-  lifecycle
supervisor        <-  recovery
agents            <-  (nobody; reached only through the AgentWorker interface)
```

Derived rules:

1. Neither contract root imports anything. They are leaves of the dependency graph.
2. Concrete implementations are never imported across module boundaries. A consumer depends on the interface declared in a contract root and receives the implementation by constructor injection. This is what allows TASK-005, TASK-006, TASK-007, and TASK-008 to be unit tested with fakes before their dependencies exist.
3. There are no cycles. The graph is a strict partial order matching the TASK-001 wave order.
4. `supervisor` is the only module that applies events to durable state. `scheduling` and `recovery` produce events and hand them to the supervisor's append path; they never call `StateStore.append` with their own transition logic.
5. `agents` never touches durable state, never sees a fencing token as an authority, and never decides whether to retry. It classifies and returns.
6. `lifecycle` never contains scheduling, state, provider, or retry logic. It composes the object graph, translates operator intent into run events, and owns process signals and exit codes.

## Boundary rationale per module

### Durable state store (TASK-003)

The state store is the substrate. Every invariant in [CRASH-RECOVERY.md](CRASH-RECOVERY.md) is enforced here or nowhere. It owns atomicity, monotonicity, and compare-and-set rejection. It deliberately does not know what a run means; it validates structure, version, epoch, and fencing token, and delegates semantic legality to the transition function supplied by the caller.

### Provider adapters and agent workers (TASK-004)

Provider-specific behavior is confined behind `ProviderAdapter`. The supervisor selects an LLM family name from the role assignment and never learns what that family is. Adding a provider is a registry entry, not a change to any other module. Failure classification lives here because only the adapter can interpret a provider-specific error code; every module downstream consumes the closed taxonomy instead.

### Scheduler and lease manager (TASK-005)

Admission control is the only place where concurrency, dependency readiness, and write-scope exclusion are decided. Centralizing it means the supervisor cannot accidentally exceed a limit, and the limits are testable without a supervisor. Fencing tokens are issued here because grant is the only moment at which a token may change.

### Supervisor core (TASK-006)

The transition function is the single authority for state legality. Making it pure, total, and free of clock and randomness is what makes replay deterministic and what lets recovery reuse it without duplicating rules.

### Lifecycle control and entry point (TASK-007)

Operator intent and process concerns are isolated at the edge. Everything below the lifecycle boundary is deterministic given its inputs; time, signals, the filesystem location of the run, and the terminal are injected here.

### Recovery, timeouts, retries (TASK-008)

Recovery, timeout enforcement, and retry policy share one concern: deciding what to do about work that did not report a result. Splitting them would create three modules that each need the same lease, ledger, and attempt state. They are one module with one owner.

## Cross-cutting rules binding all six tasks

1. No module writes credentials, tokens, or provider payload secrets to state, checkpoints, journals, logs, run events, or test fixtures.
2. Every module receives its `Clock`; no module reads wall-clock time directly. This is required for the fake-clock unit tests named in TASK-005, TASK-007, and TASK-008.
3. Every module receives its randomness through a seeded, run-scoped source. Unseeded randomness would break deterministic replay.
4. Every published module entry point is `index.ts`. Deep imports into another module's internals are a boundary violation.
5. User-visible command-line text is Turkish. Identifiers, option names, error codes, log lines, event names, and all source content are English.
6. An implementation task that believes a contract in this document set is wrong must stop and route the change through the Orchestrator back to the architect as an ADR amendment. It must not change the contract locally. See [INTEGRATION-STRATEGY.md](INTEGRATION-STRATEGY.md).

## Traceability to acceptance criteria

| TASK-002 acceptance criterion | Satisfied by |
|---|---|
| Every component boundary maps to exactly one implementation task, with no shared module ownership | Module map and contract roots above |
| Interface contracts consumed across implementation tasks are documented before implementation starts | [INTERFACE-CONTRACTS.md](INTERFACE-CONTRACTS.md) |
