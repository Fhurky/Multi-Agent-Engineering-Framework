# ADR-0007: Provider adapter boundary and error taxonomy

- Status: Accepted
- Date: 2026-08-04
- Deciders: Solution Architect under TASK-002
- Affects: TASK-004 primarily; TASK-005, TASK-006, TASK-008 consume it

## Context

The framework is provider-neutral by design: roles are assigned an LLM family name such as `claude`, `gpt`, or `gemini`, and any model in that family may claim the assignment. Providers differ in transport (CLI child process versus HTTP API), in authentication, in rate-limit signalling, and in error vocabulary.

If provider specifics leaked into the supervisor, adding a provider would touch scheduling, supervision, and recovery, and the retry policy would have to know every provider's error codes. That directly contradicts the repository's stated identity.

## Decision

**One interface contains all provider-specific behavior:**

```ts
interface ProviderAdapter {
  readonly family: string;
  invoke(invocation: AgentInvocation, signal: AbortSignal): Promise<AdapterOutcome>;
}
```

Adapters are resolved from an `AdapterRegistry` keyed by family name. **Adding a provider is a registry registration and nothing else.** If a new provider forces a change under `src/orchestrator/**`, the boundary has been violated — this is the reviewer's most direct check on TASK-004.

**A closed ten-member failure taxonomy** replaces raw provider errors at the boundary: `transient`, `rate_limited`, `timeout`, `provider_unavailable`, `invalid_request`, `authentication`, `quota_exhausted`, `policy_refusal`, `agent_reported_blocked`, `unknown`. Classification rules are total, deterministic, specific-over-general, and redacting.

**`unknown` maps to `fail`, not `retry`.** An unclassifiable failure is never retried, because retrying an effect of unknown character is the one outcome that can cause real duplication.

**`agent_reported_blocked` is a first-class class.** It is not a provider fault; it is how an agent that correctly refuses to cross a role boundary — as the project's governance requires — reaches the operator instead of being retried into the same wall. Without it, correct agent behavior would be indistinguishable from repeated failure.

**The adapter decides nothing beyond classification.** It never retries, never touches durable state, never treats the fencing token as authority, and never emits run events. The worker adds a timeout via `AbortSignal` and normalizes the outcome into a `WorkerResult` carrying the identifiers needed for aggregation.

**Credentials flow only through an injected `SecretProvider`**, constructed at the composition root. They are never fields of an invocation, an outcome, a worker result, a persisted record, a run event, a log line, or a test fixture. A missing credential produces `authentication` naming only the variable, never its value.

## Alternatives considered

**A provider-agnostic HTTP client with per-provider configuration.** Attractive because it needs no code per provider. Rejected: the framework's own agents are command-line tools, not HTTP endpoints, and forcing a CLI into an HTTP-shaped abstraction would push process spawning, streaming, and exit-code interpretation into configuration.

**Provider-specific branches inside the supervisor.** Rejected outright: it contradicts the repository's provider-neutral identity and would make every provider addition touch four modules with four review gates.

**An open error taxonomy — pass raw provider codes through.** Rejected: the retry policy would then need per-provider knowledge, which relocates the coupling rather than removing it, and no reviewer could enumerate the reachable dispositions.

**Retry inside the adapter.** Common in provider SDKs and initially tempting for `rate_limited`. Rejected: the adapter cannot see attempt budget, backoff state, the effect ledger, or the fencing token, so an adapter-level retry is invisible to the state machine and can duplicate an effect the ledger would have caught. Adapters surface `retryAfterMs`; the recovery layer honors it.

**Map `unknown` to `retry` for resilience.** Rejected: it optimizes for transient-fault recovery at the cost of the one guarantee the design cannot give back. Retrying unclassified failures is how duplicate effects happen.

**Fold `agent_reported_blocked` into `invalid_request`.** Rejected: they differ in disposition (`escalate` versus `fail`) and in meaning. Conflating them would fail tasks that a human could unblock in seconds.

## Consequences

Positive:

- Provider count has no effect on the complexity of scheduling, supervision, or recovery.
- Retry policy is provider-independent and testable from a table of synthetic failures with no network access.
- Credential handling has exactly one entry point, giving the security gate a single surface to audit.
- Timeout classification is guaranteed by the worker's own timer even for an adapter that ignores the abort signal.

Negative:

- Every new adapter must supply a complete classification mapping, and a poor mapping degrades retry behavior silently — a `transient` fault misclassified as `unknown` fails work that would have succeeded on retry. Each adapter's classification table needs its own review.
- Rich provider diagnostics are reduced to a class plus a code plus a redacted message. `providerCode` is retained for diagnosis, but detail is lost by design.
- `agents/contracts` re-declares six primitive aliases from `state/contracts` to keep Wave 2 parallel, which review must keep in sync ([ADR-0002](0002-runtime-component-boundaries-and-module-ownership.md)).
- Adapter-level retry conveniences offered by provider SDKs must be explicitly disabled, or they will silently violate this decision.
