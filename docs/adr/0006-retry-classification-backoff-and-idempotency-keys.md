# ADR-0006: Retry classification, backoff, and idempotency keys

- Status: Accepted; refined by [ADR-0011](0011-agent-workspace-lifecycle-module.md)
- Refined: pull-request creation remains non-idempotent in the general case. ADR-0011 establishes a dedup key for the runtime's own usage — one derived push ref per task, and look-up-then-create-or-update by head branch — so task-branch publication and pull-request creation are registered `idempotent: true`. An implementation that does not follow that contract must register them `idempotent: false`.
- Date: 2026-08-04
- Deciders: Solution Architect under TASK-002
- Affects: TASK-008 primarily; TASK-004, TASK-006 consume it

## Context

Agent work fails for many reasons, and they are not interchangeable. A connection reset should be retried; a malformed request should not; a missing credential should reach a human; an agent that correctly reports it cannot cross a role boundary should reach a human too, not be hammered into the same wall three times.

Retrying is also dangerous. An agent invocation produces externally visible effects — commits on a branch, files in a run directory, rendered task records. Retrying an invocation whose effect may already have landed can duplicate it. TASK-008 must guarantee that a task crashed in flight is "either completed once or retried once, never duplicated".

Backoff conventionally uses random jitter, which conflicts with the deterministic replay this design depends on.

## Decision

**Classification drives disposition.** The closed ten-member `FailureClass` taxonomy is owned by TASK-004 and mapped by one exported constant, `DISPOSITION_BY_CLASS`, to `retry`, `fail`, or `escalate`. The recovery layer consumes the mapping and never reclassifies. Only `retry` consumes retry budget, so a task escalated on attempt 1 keeps its full budget after a human unblocks it.

**Idempotency keys are deterministic and attempt-scoped.**

```text
idempotencyKey = sha256(canonicalJson({ runId, taskId, attempt, inputDigest }))
```

where `inputDigest` covers the role contract digest, the rendered task record, and the sorted result digests of every dependency. Nothing derives from a clock, a process identifier, or randomness, so a crash and restart reproduce the same key for the same attempt. Including `attempt` makes a deliberate retry a distinct effect; excluding time makes a crash-recovery re-dispatch of the *same* attempt deduplicable.

**An effect ledger records intent before and commitment after.** `EffectIntentRecorded` then the effect then `EffectCommitted`, both through the ordinary compare-and-set append. Three ledger states drive recovery: no entry means execute, `committed` means adopt without re-executing, `intended` without commit means indeterminate.

**The guarantee is stated honestly.** Exactly-once effect holds for ledger-registered effects marked `idempotent: true`. For `idempotent: false`, the guarantee is at-most-once with explicit escalation: an indeterminate entry moves the task to `blocked` with reason `indeterminate_effect`, naming the effect, for human adjudication.

**Backoff is exponential with seeded jitter.**

```text
raw     = min(retryMaxDelayMs, retryBaseDelayMs * 2^(attempt - 1))
jitter  = SeededRandom.next("backoff:" + runId + ":" + taskId + ":" + attempt)
delayMs = max(retryAfterMs ?? 0, floor(raw * (0.5 + 0.5 * jitter)))
```

Backoff is expressed as a durable `notBefore` timestamp on the task record, not as an in-memory timer, so a pause or crash mid-backoff loses nothing.

**Exhaustion is always recorded.** `maxAttempts` defaults to 3; exhausting it produces `failed` with `lastFailure` naming the class, code, and final attempt. No path loops without a decrementing budget.

**Timeouts are enforced at three independent layers** — worker abort signal, lease TTL, and the recovery watchdog — because a process that crashes mid-invocation never returns an outcome at all, and relying on the worker's own timer would leave such a task in `running` forever.

## Alternatives considered

**Retry everything a fixed number of times.** Rejected: it retries malformed requests that can never succeed, burns budget on policy refusals, and turns a correct agent-reported block into three identical failures.

**Let the recovery layer classify raw provider errors.** Rejected: only the adapter can interpret a provider-specific code, and the classification would have to be duplicated per provider inside a provider-neutral module, which is exactly what [ADR-0007](0007-provider-adapter-boundary-and-error-taxonomy.md) exists to prevent.

**Unseeded random jitter.** The standard practice. Rejected: it destroys deterministic replay, which the pause-and-resume equivalence claim and the crash-recovery equivalence claim both depend on. Seeding by `(runId, taskId, attempt)` keeps the decorrelation across tasks that jitter exists for, while remaining reproducible for a fixed run.

**Omit `attempt` from the idempotency key.** Rejected: a deliberate retry would then look identical to the failed attempt, and the ledger would suppress the retry entirely.

**Claim exactly-once for all effects.** Rejected as false. Without a provider-side or target-side dedup key, an effect performed just before a crash cannot be distinguished from one that never happened. Claiming otherwise would be a guarantee the runtime silently breaks; escalating the indeterminate case is the honest behavior.

**Kill in-flight work at the drain deadline instead of letting leases lapse.** Rejected: it manufactures precisely the indeterminate effects the ledger exists to avoid.

## Consequences

Positive:

- Retry behavior is a property of the failure class, uniform across providers, and testable from a table of synthetic failures with no network.
- Crash recovery can decide re-execute versus adopt from recorded fact rather than from a timing heuristic.
- Backoff is reproducible, so an interrupted run and an uninterrupted run remain comparable.
- Every failure path terminates in a recorded state; no unbounded loop exists.

Negative:

- Every effect must be registered in the ledger *before* it is performed. An effect performed outside the ledger is invisible to recovery, and nothing but review enforces this on TASK-004 and TASK-008.
- Classifying an effect as idempotent is a judgement call made by the implementer, and a wrong `idempotent: true` produces duplication rather than escalation.
- Seeded jitter means two runs of the same input retry on identical schedules, so a systematic provider-side timing problem reproduces rather than being smoothed by randomness. This is a deliberate trade in favor of reproducibility.
- `blocked` tasks accumulate for a human, so a run can end at exit code 3 needing operator attention rather than failing outright. This is intended, and QA must validate that path explicitly.
