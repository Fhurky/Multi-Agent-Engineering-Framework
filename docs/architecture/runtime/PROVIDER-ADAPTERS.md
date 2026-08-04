# Provider Adapter Boundary and Error Taxonomy

Normative provider contract for the autonomous runtime. Produced under TASK-002. Related decision: [ADR-0007](../../adr/0007-provider-adapter-boundary-and-error-taxonomy.md). Implemented by TASK-004.

## The boundary

The supervisor knows a role has an `llm` family name. It does not know what that name means, how that provider is invoked, what its errors look like, or whether it is a CLI, an HTTP API, or a local process.

```text
supervisor  ->  AgentWorker.execute(assignment)      provider-neutral
                    |
                    v
                AdapterRegistry.resolve(family)      provider-neutral
                    |
                    v
                ProviderAdapter.invoke(invocation)   the only provider-specific code
```

**Extension test.** Adding a provider must require exactly one change: registering a new `ProviderAdapter` implementation in the registry. If a new provider forces a change in `src/orchestrator/**`, the boundary has been violated. This is TASK-004's first acceptance criterion and the reviewer's most direct check.

## What crosses the boundary

Into the adapter, an `AgentInvocation`: identifiers, the role and its contract file paths, the task record path, the worktree path, the branch, the attempt number, the idempotency key, and a timeout. No credentials. No supervisor objects. No state store handle.

Out of the adapter, an `AdapterOutcome`: either a success carrying artifact paths, a summary, a result digest, and any proposed tasks; or a failure carrying exactly one `FailureClass`, a stable English code, a redacted message, the raw provider code for diagnostics, and an optional `retryAfterMs`.

The adapter never decides whether to retry, never touches durable state, never sees a fencing token as authority, and never emits run events. It classifies and returns.

## Error taxonomy

A closed set of ten classes. Every provider failure maps to exactly one.

| Class | Meaning | Disposition | Typical origin |
|---|---|---|---|
| `transient` | A momentary fault that is expected to clear | `retry` | Connection reset, socket hang-up, HTTP 502/504, DNS failure |
| `rate_limited` | The provider asked the caller to slow down | `retry` | HTTP 429, provider rate-limit error, `retry-after` header present |
| `timeout` | No response within the invocation bound | `retry` | Worker abort signal fired, provider read timeout |
| `provider_unavailable` | The provider is down or overloaded | `retry` | HTTP 503, model capacity error, upstream maintenance |
| `invalid_request` | The request is malformed or violates a contract | `fail` | Schema rejection, unsupported parameter, context length exceeded, missing required file |
| `unknown` | The failure could not be classified | `fail` | Any error not matched by a classification rule |
| `authentication` | Credentials missing, invalid, or expired | `escalate` | HTTP 401/403, missing environment variable, expired token |
| `quota_exhausted` | The account or key has no remaining budget | `escalate` | Billing or hard quota error |
| `policy_refusal` | The provider declined on policy grounds | `escalate` | Content policy rejection |
| `agent_reported_blocked` | The agent itself reported it cannot proceed | `escalate` | Agent output states a blocking dependency, ambiguous ownership, or a required human decision |

`agent_reported_blocked` is not a provider fault. It is the mechanism by which an agent that correctly refuses to cross a role boundary — as the project's governance requires — reaches the operator instead of being retried into the same wall. Without it, a correctly-behaving agent would look like a repeated failure.

### Disposition mapping

The mapping is a single exported constant, `DISPOSITION_BY_CLASS`, declared in `src/agents/contracts/` and imported everywhere. No module reimplements it.

- `retry` — the recovery layer schedules a bounded retry with backoff.
- `fail` — the task goes directly to `failed` with no further attempt.
- `escalate` — the task goes to `blocked` with a recorded reason and exit condition, awaiting a human or another role.

### Classification rules

1. **Total.** Every thrown value, rejected promise, and non-success response maps to a class.
2. **Unknown is safe.** Anything a rule does not match becomes `unknown`, whose disposition is `fail`. An unclassifiable failure is never retried, because retrying an effect of unknown character is the one outcome that can cause real duplication.
3. **Specific over general.** A response carrying both a rate-limit signal and a 5xx status classifies as `rate_limited`.
4. **Deterministic.** Classification is a pure function of the observed failure value. TASK-004 tests it with a table of synthetic failures, not with live calls.
5. **Redacting.** The `message` field is produced by a redactor that strips anything matching a credential shape and any value that equals a secret read through the `SecretProvider`. `providerCode` retains the raw code only, never a payload.

## Timeouts at the worker boundary

The worker creates an `AbortController` with `invocation.timeoutMs` and passes the signal to `invoke`. On abort the worker returns an `AdapterOutcome` of `{ status: 'failed', failure: { failureClass: 'timeout', ... } }` within the bound. An adapter that ignores the signal is non-conforming; the worker's own timer guarantees the classification is produced regardless, so an unresponsive provider surfaces as a timeout rather than blocking the supervisor.

This is worker-level timeout **signalling** only. Deciding what a timeout means for the run — retry, exhaustion, or run-level failure — belongs to TASK-008 and is specified in [RETRIES-TIMEOUTS-AND-IDEMPOTENCY.md](RETRIES-TIMEOUTS-AND-IDEMPOTENCY.md). The three timeout mechanisms are deliberately layered and independent:

| Layer | Bound | Owner | Purpose |
|---|---|---|---|
| Adapter/worker abort | `taskTimeoutMs` | TASK-004 | Stop waiting on one invocation |
| Lease TTL | `leaseTtlMs` | TASK-005 | Reclaim work whose owner stopped renewing |
| Watchdog scan | `taskTimeoutMs`, `runTimeoutMs` | TASK-008 | Transition timed-out work through the state machine even if no worker reports back |

The watchdog exists because a process that crashes mid-invocation never returns an outcome at all. Relying only on the worker's own timer would leave such a task in `running` forever.

## Credentials

`SecretProvider` is the only path to credential material, and it is constructed at the composition root from environment variables or an injected secret manager. Rules:

1. Credentials are never fields of `AgentInvocation`, `AdapterOutcome`, `WorkerResult`, or any record persisted by TASK-003.
2. Credentials are never written to run events, logs, artifact indexes, or test fixtures.
3. A missing credential produces `authentication` with a message naming only the variable name, never its value.
4. Test adapters are fakes. TASK-004's unit tests make no network calls and read no real credential.

## Worker responsibilities

`AgentWorker.execute` is the provider-neutral half:

1. Resolve the adapter by `invocation.llm`; an unregistered family is `invalid_request` with code `UNKNOWN_PROVIDER_FAMILY`.
2. Assemble the invocation from the role contract paths and the task record path. The worker reads those files; it does not interpret governance.
3. Start the abort timer, call `invoke`, and stop the timer.
4. Normalize the outcome into a `WorkerResult` carrying the invocation identifiers, the attempt, the idempotency key, the fencing token it was handed, and the start and finish timestamps.
5. Return. The worker performs no state write and no retry.

The `fencingToken` on `WorkAssignment` is carried through untouched so that the supervisor can present it when applying the result. The worker treats it as an opaque value.

## Observable pre- and post-conditions

| Claim | How it is observed |
|---|---|
| Provider specifics are contained | No import from `src/agents/` appears in `src/orchestrator/**` other than from `src/agents/contracts/` |
| One class per failure | Every `AdapterFailure` has exactly one `failureClass` drawn from the closed set |
| Unknown defaults safely | An unmatched synthetic failure classifies as `unknown` with disposition `fail` |
| Timeouts are bounded | With an adapter that never resolves, `execute` returns a `timeout` outcome within `timeoutMs` plus a fixed tolerance |
| Results are addressable | Every `WorkerResult` carries `runId`, `taskId`, `attempt`, `idempotencyKey`, and `fencingToken` |
| No credential leakage | A round-trip of every produced record and event contains no value returned by `SecretProvider` |
