# Retries, Timeouts, and Idempotency

Normative retry and idempotency contract for the autonomous runtime. Produced under TASK-002. Related decision: [ADR-0006](../../adr/0006-retry-classification-backoff-and-idempotency-keys.md). Implemented by TASK-008 against the taxonomy owned by TASK-004.

## Idempotency keys

```text
inputDigest    = sha256(canonicalJson({
                   runId, taskId, ownerRole, llm,
                   roleContractDigest,        // sha256 over the concatenated .agents/<role>/ contract files
                   taskRecordDigest,          // sha256 over the rendered task record body
                   dependencyResultDigests,   // sorted by taskId, each the dependency's resultDigest
                 }))

idempotencyKey = sha256(canonicalJson({ runId, taskId, attempt, inputDigest }))
```

Properties:

- **Deterministic.** The same attempt of the same task with the same inputs always yields the same key, including after a crash and restart. Nothing in the key derives from a clock, a process identifier, or randomness.
- **Attempt-scoped.** A deliberate retry is attempt `n + 1` and therefore a different key. It is intended to be a new effect, because the previous attempt's effect either did not happen or was recorded as failed.
- **Input-sensitive.** If a dependency's result changes, the key changes. A task cannot silently adopt a stale result computed from different inputs.

The key is computed by the supervisor at `DispatchStarted` and persisted on the task record before the worker is invoked. It is therefore durable before any effect can occur.

## Effect ledger

An **effect** is anything externally visible that outlives the process: a commit on an agent branch, a file written under the run's artifact directory, a rendered task record, a pull request. Effects are registered in the run's ledger:

```text
1. EffectIntentRecorded { effectId, taskId, attempt, idempotencyKey, idempotent }
2. ... the effect is performed ...
3. EffectCommitted { effectId, resultDigest }
```

`effectId = sha256(canonicalJson({ idempotencyKey, effectKind, effectTarget }))`, so the same logical effect from the same attempt always has the same identifier. Both events go through the ordinary compare-and-set append, so both are durable before and after the effect respectively.

Three ledger states and their meaning:

| Ledger state | Meaning | Action on re-dispatch |
|---|---|---|
| No entry | The effect certainly did not happen | Execute |
| `intended`, no commit | Indeterminate: the process died between step 1 and step 3 | If `idempotent`, re-execute; otherwise block |
| `committed` | The effect certainly happened | Do not re-execute; adopt `resultDigest` |

### The guarantee, stated precisely

**Exactly-once effect** holds for every effect registered in the ledger with a stable `effectId` and marked `idempotent: true`: re-execution after an indeterminate outcome converges on the same result, and a committed effect is never re-executed.

**At-most-once with explicit escalation** holds for effects marked `idempotent: false`. An indeterminate entry transitions the task to `blocked` with reason `indeterminate_effect`, naming the `effectId`, so a human adjudicates rather than the runtime guessing. Claiming exactly-once for an arbitrary external side effect without a provider-side dedup key would be false, and a runtime that silently retried such an effect would corrupt work it cannot see.

Consequences for implementers:

- A git commit with deterministic content on a task-owned branch is `idempotent: true`; replaying it converges.
- Writing a file to the run's artifact directory at a path derived from the `effectId` is `idempotent: true`.
- Opening a pull request or pushing to a shared remote is `idempotent: false` unless the operation carries its own dedup key.

## Retry classification

Disposition comes from `DISPOSITION_BY_CLASS` in `src/agents/contracts/` ([PROVIDER-ADAPTERS.md](PROVIDER-ADAPTERS.md)). The recovery layer consumes it and never reclassifies:

- `retry` — schedule a bounded retry.
- `fail` — terminal `failed` immediately; no attempt is consumed beyond the one that failed.
- `escalate` — terminal-for-now `blocked`; retries are not attempted because repeating the call cannot change the outcome.

Only `retry` consumes retry budget. An `escalate` failure on attempt 1 does not exhaust attempts, so a task unblocked by a human still has its full budget.

## Backoff

```text
raw     = min(retryMaxDelayMs, retryBaseDelayMs * 2^(attempt - 1))
jitter  = SeededRandom.next("backoff:" + runId + ":" + taskId + ":" + attempt)   // in [0, 1)
delayMs = max(retryAfterMs ?? 0, floor(raw * (0.5 + 0.5 * jitter)))
notBefore = occurredAt + delayMs
```

With the defaults (`retryBaseDelayMs = 1000`, `retryMaxDelayMs = 60000`), attempt 1 retries within 0.5–1 s, attempt 2 within 1–2 s, attempt 3 within 2–4 s, converging to 30–60 s.

Two deliberate choices:

- **Jitter is seeded, not random.** Unseeded jitter would make replay non-deterministic and would break the equivalence test TASK-007 and TASK-008 both need. A seed derived from `(runId, taskId, attempt)` still decorrelates concurrent retries across tasks while remaining reproducible for a fixed run.
- **`retryAfterMs` wins when larger.** A provider that asked for a specific delay is honored; the computed backoff is only a floor.

Backoff is expressed as `notBefore` on the task record, not as a sleeping timer. A pause, a crash, or a restart in the middle of a backoff window loses nothing: `notBefore` is durable and the scheduler re-evaluates it on the next pass.

## Retry exhaustion

`maxAttempts` defaults to 3 and may be overridden per task at admission.

- On a `retry` disposition with `attempt < maxAttempts`: `running -> awaiting_retry`, with `RetryScheduled` recording `delayMs` and `notBefore`.
- On a `retry` disposition with `attempt >= maxAttempts`: `running -> failed`, with `lastFailure` recording the class, code, message, and final attempt number. `terminalReason` on the run, if this failure ends the run, names the task.

There is no unbounded loop anywhere: every retry path decrements a finite budget, and every budget exhaustion produces a recorded terminal state.

## Timeouts

Three independent enforcement points, layered so that no single failure mode leaves a task stuck.

| Timeout | Default | Enforced by | Transition |
|---|---|---|---|
| Task attempt | `taskTimeoutMs` 900 000 ms | Worker abort signal (TASK-004) and the watchdog (TASK-008) | `TaskTimedOut{ kind: 'task' }` -> `awaiting_retry` or `failed` |
| Lease | `leaseTtlMs` 120 000 ms | Scheduler reclaim (TASK-005) | `LeaseExpired` -> `ready`, attempt unchanged |
| Run | `runTimeoutMs` null by default | Watchdog (TASK-008) | Run `running -> draining`, then `cancelled` with `terminalReason.code = 'run_timeout'` |

`TimeoutWatchdog.scan(run, now)` is pure and returns envelopes; the supervisor appends them. It emits:

- `TaskTimedOut{ kind: 'task' }` for a task in `running` whose `attempt` started more than `taskTimeoutMs` ago.
- `TaskTimedOut{ kind: 'lease' }` for a task in `running` whose lease expired and whose attempt is past its deadline, when reclaim alone would leave the attempt unaccounted.
- A run-level stop request when `runTimeoutMs` has elapsed since `createdAt`.

A timeout is classified `timeout`, whose disposition is `retry`. A timed-out task therefore retries within budget and produces `failed` with a recorded timeout reason when the budget is exhausted. It is never silently abandoned, which is TASK-008's stated criterion.

Ordering rule: when both a timeout and a worker result are available for the same attempt, the first successful append wins and the second is rejected by the fencing check. There is no ambiguity about which one took effect.

## Observable pre- and post-conditions

| Claim | How it is observed |
|---|---|
| Retries are classified, not blanket | A synthetic `invalid_request` failure produces zero retries; a `transient` failure produces exactly one retry per remaining attempt |
| Retries are bounded | The count of `DispatchStarted` events for any task never exceeds `maxAttempts` |
| Exhaustion is recorded | After the last attempt, the task is `failed` with a non-null `lastFailure` naming the class and final attempt |
| Backoff is deterministic | Two runs with the same seed produce identical `delayMs` sequences |
| Backoff respects the ceiling | Every `delayMs` is at most `retryMaxDelayMs`, or equal to a larger provider-supplied `retryAfterMs` |
| Committed effects are not repeated | Replaying a dispatch whose `effectId` is `committed` produces no new `EffectIntentRecorded` |
| Indeterminate non-idempotent effects escalate | An `intended` entry with `idempotent: false` transitions the task to `blocked` with reason `indeterminate_effect` |
| A retry does not double-advance state | Applying the same `WorkerSucceeded` twice yields `IllegalTransition` on the second, and `stateVersion` advances by one, not two |
