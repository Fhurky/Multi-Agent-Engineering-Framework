# Retries, Timeouts, and Idempotency

## Amendment register — TASK-040

Post-gate merge effects use a separate executor-local evidence ledger and the fixed `merge-retry/v1` policy in [POST-GATE-MERGE-EXECUTORS.md](POST-GATE-MERGE-EXECUTORS.md). They do not reuse a worker attempt, provider failure class, or the run's effect ledger, but preserve the same intent-before-effect and reconcile-before-retry principle. [ADR-0042](../../adr/0042-conditionally-authorized-post-gate-merge-executors.md) is the authority.

Normative retry and idempotency contract for the autonomous runtime. Produced under TASK-002 and amended under TASK-016, TASK-024, TASK-028, and TASK-032. Related decisions: [ADR-0006](../../adr/0006-retry-classification-backoff-and-idempotency-keys.md), [ADR-0013](../../adr/0013-single-decision-recovery-reconciliation.md), [ADR-0014](../../adr/0014-live-run-control-and-process-tree-ownership.md), [ADR-0020](../../adr/0020-durable-adoptable-results-for-recovery.md), [ADR-0025](../../adr/0025-result-effect-identity-in-the-event-union.md), and [ADR-0033](../../adr/0033-unique-committed-result-effect-recovery.md). Implemented by TASK-008 against the taxonomy owned by TASK-004.

## Amendment register — TASK-032

| Superseded claim (TASK-028) | Superseded by | Finding | Decision |
|---|---|---|---|
| Recovery reduced any committed current-attempt entry to `committed` | Only the unique entry marked `isTaskResultEffect` may yield `committed_result`; exact identity is preserved and unrelated committed effects cannot select adoption | A-203 (A-104 view) | [ADR-0033](../../adr/0033-unique-committed-result-effect-recovery.md) |

## Amendment register — TASK-028

| Superseded claim (TASK-024) | Superseded by | Finding | Decision |
|---|---|---|---|
| The ledger required a result-effect flag that no runtime event could carry, and diagrams omitted the intent event | `EffectIntentRecorded.isTaskResultEffect`, a one-per-attempt guard, and one five-step order used by uninterrupted and recovery paths | A-203 | [ADR-0025](../../adr/0025-result-effect-identity-in-the-event-union.md) |

## Amendment register — TASK-024

| Superseded claim (TASK-016) | Superseded by | Finding | Decision |
|---|---|---|---|
| A `committed` ledger state contributing `adopt` with only `resultDigest` durably retained | [Effect ledger](#effect-ledger) step 0 and [Recovery application](#recovery-application): the complete `AdoptableResult` is durable before the commit, and a `committed` entry without one escalates instead of adopting | A-104 | [ADR-0020](../../adr/0020-durable-adoptable-results-for-recovery.md) |
| No statement of what happens to `proposedTasks` across a crash | Stated explicitly: recorded verbatim, adopted with the result, never digested or dropped | A-104 | [ADR-0020](../../adr/0020-durable-adoptable-results-for-recovery.md) |

## Amendment register — TASK-016

| Superseded claim (TASK-002) | Superseded by | Decision |
|---|---|---|
| Recovery applying ledger reconciliation and a timeout scan as separate passes over the same task | [Recovery application](#recovery-application) — one decision per task, with the elapsed deadline as an input rather than a second pass | [ADR-0013](../../adr/0013-single-decision-recovery-reconciliation.md) |
| Watchdog rule "a task in `running` whose `attempt` started more than `taskTimeoutMs` ago", with no field recording when the attempt started | The same rule over the new durable `attemptStartedAt` field | [ADR-0013](../../adr/0013-single-decision-recovery-reconciliation.md) |
| "Opening a pull request or pushing to a shared remote is `idempotent: false`" | Refined: task-branch publication and pull-request creation are `idempotent: true` **because** the workspace contract gives them a dedup key — the task branch is the key, and the pull request is looked up by head branch before it is created | [ADR-0011](../../adr/0011-agent-workspace-lifecycle-module.md) |
| Drain-deadline behavior inherited from ADR-0009, in which in-flight provider processes were never terminated | Termination with bounded escalation at the drain deadline, and the resulting indeterminacy adjudicated by this ledger | [ADR-0014](../../adr/0014-live-run-control-and-process-tree-ownership.md) |

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

**The task's own result effect carries one extra step, added under TASK-024 (ADR-0020).** The effect that registers a task's result is marked `isTaskResultEffect: true`, and the complete adoptable result is made durable **before** it is committed:

```text
0. WorkerResultRecorded { taskId, attempt, adoptable }   the complete TaskResultSummary and proposedTasks
1. EffectIntentRecorded { effectId, isTaskResultEffect: true, ... }
2. ... the effect is performed ...
3. EffectCommitted { effectId, resultDigest }
4. WorkerSucceeded { result, proposedTasks }             the transition; clears pendingResults[taskId]
```

Step 0 exists because finding A-104 established that a committed result-effect entry retaining only `resultDigest` is not enough to reconstruct step 4 after a crash between 3 and 4 — and that window is exactly the one recovery is meant to close. With step 0, the unique flagged committed result effect always has a complete durable result behind it. `proposedTasks` are stored verbatim and never digested, because losing them can change the terminal task graph.

`EffectIntentRecorded` is the event that sets `isTaskResultEffect`; the transition copies that value into the ledger entry. Exactly one effect per `(taskId, attempt)` may set it to `true`, and it is legal only after the matching `WorkerResultRecorded`. A second flagged intent, an unflagged intent later treated as the result effect, or `EffectCommitted` before the flagged intent is rejected. Recovery rechecks the zero-or-one invariant and fails closed on duplicate flagged evidence. It does not replay steps 0 through 3; it emits only step 4 when that exact flagged `effectId` is committed. An ordinary committed effect is never substituted.

`effectId = sha256(canonicalJson({ idempotencyKey, effectKind, effectTarget }))`, so the same logical effect from the same attempt always has the same identifier. Both events go through the ordinary compare-and-set append, so both are durable before and after the effect respectively.

Three ledger states and their meaning:

| Ledger state | Meaning | Action on re-dispatch |
|---|---|---|
| No entry | The effect certainly did not happen | Execute |
| `intended`, no commit | Indeterminate: the process died between step 1 and step 3 | If `idempotent`, re-execute; otherwise block |
| `committed` | The effect certainly happened | Do not re-execute; for a result effect, adopt the matching durable `AdoptableResult` or escalate as `unreconstructable_result` |

### The guarantee, stated precisely

**Exactly-once effect** holds for every effect registered in the ledger with a stable `effectId` and marked `idempotent: true`: re-execution after an indeterminate outcome converges on the same result, and a committed effect is never re-executed.

**At-most-once with explicit escalation** holds for effects marked `idempotent: false`. An indeterminate entry transitions the task to `blocked` with reason `indeterminate_effect`, naming the `effectId`, so a human adjudicates rather than the runtime guessing. Claiming exactly-once for an arbitrary external side effect without a provider-side dedup key would be false, and a runtime that silently retried such an effect would corrupt work it cannot see.

Consequences for implementers:

- A git commit with deterministic content on a task-owned branch is `idempotent: true`; replaying it converges.
- Writing a file to the run's artifact directory at a path derived from the `effectId` is `idempotent: true`.
- Pushing to an arbitrary shared remote ref is `idempotent: false`.
- **Task-branch publication and pull-request creation are `idempotent: true`**, amended under TASK-016. TASK-002 classified them as non-idempotent because "the operation carries its own dedup key" was not established for them. [WORKSPACE-LIFECYCLE.md](WORKSPACE-LIFECYCLE.md) now establishes it: the push targets exactly one derived ref, `refs/heads/agent/<llm>/<role>/<task-id>`, which is a stable key owned by exactly one task; and pull-request creation is a look-up-then-create-or-update against that head branch, so a replay after an indeterminate outcome converges on the same pull request rather than opening a second one. Without that refinement, every crash between publication and lock release would have escalated to a human, which would have made the autonomous single-command run impossible in exactly the case it most needs to recover from.
- The refinement is conditional on the contract, not on optimism: an implementation that pushes a non-derived ref, or that creates a pull request without first looking one up, is non-conforming, and its effects must be registered `idempotent: false`.

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

- `TaskTimedOut{ kind: 'task' }` for a task in `running` whose `attemptStartedAt` is more than `taskTimeoutMs` before `now`.
- `TaskTimedOut{ kind: 'lease' }` for a task in `running` whose lease expired and whose attempt is past its deadline, when reclaim alone would leave the attempt unaccounted.
- A run-level stop request when `runTimeoutMs` has elapsed since `createdAt`.

`attemptStartedAt` is the field added under TASK-016 and recorded by `DispatchStarted`. TASK-002 stated the first rule over "when the attempt started" without a field that records it; `updatedAt` is not that field, because every lease renewal and every ledger event overwrites it, which would have made a long-running task's deadline recede indefinitely.

A timeout is classified `timeout`, whose disposition is `retry`. A timed-out task therefore retries within budget and produces `failed` with a recorded timeout reason when the budget is exhausted. It is never silently abandoned, which is TASK-008's stated criterion.

Ordering rule: when both a timeout and a worker result are available for the same attempt, the first successful append wins and the second is rejected by the fencing check. There is no ambiguity about which one took effect.

**The watchdog does not run during recovery.** An elapsed deadline is the fourth input to the recovery decision table in [STATE-MACHINE.md](STATE-MACHINE.md#recovery-reconciliation-decisions), not a separate scan. Running both would produce two events for one task in one batch, which is the defect A-002 named. The watchdog resumes its ordinary role once `RunRecoveryCompleted` returns the run to `running`.

## Recovery application

Amended under TASK-016. TASK-002 described recovery as reconciling leases, then effects, then timeouts. Each pass emitted its own event for the same task, and the combination was illegal. The ledger's role is unchanged; what changed is that it is one input to a single decision rather than one pass of three.

| Ledger state for the current attempt | Contribution to the decision |
|---|---|
| `committed_result`, with a durable `AdoptableResult` | `adopt` — the exact flagged result effect is committed and outranks every other input except an `activation` block, including an elapsed deadline. The emitted `WorkerSucceeded` carries the complete summary and verbatim `proposedTasks` from `run.pendingResults` |
| `committed_result`, with no `AdoptableResult` — TASK-024, narrowed by TASK-032 | `escalate` with reason `unreconstructable_result`. Not `adopt` with a partial event: a terminal task graph missing a proposal is worse than a blocked task naming the defect |
| `intended`, `idempotent: false` | `escalate` — outranks an elapsed deadline, because a timeout leads to a retry and retrying an indeterminate non-idempotent effect is the one action this document refuses to take |
| `intended`, `idempotent: true` | `reclaim` when the deadline has not elapsed; the timeout path when it has. Both are safe: re-execution converges under the same idempotency key, and a retry is a new attempt with a new key |
| No entry | `reclaim` when the deadline has not elapsed; the timeout path when it has. Nothing externally visible happened |

A retry produced by recovery is an ordinary retry: it consumes budget, it goes through `awaiting_retry` and `notBefore`, and it produces a new attempt with a new idempotency key. Recovery has no privileged retry path.

## Drain-deadline termination and the effects it can create

Amended under TASK-016 through [ADR-0014](../../adr/0014-live-run-control-and-process-tree-ownership.md), which supersedes the ADR-0009 clause that in-flight provider work is never terminated at the drain deadline.

At the deadline the runtime now terminates the invocation's whole OS process tree with bounded escalation and verified exit. That is a deliberate trade: an agent killed mid-effect can leave an `intended` ledger entry with no commit, which is the indeterminate state this document treats as expensive. The alternative TASK-002 chose — leaving the tree alive — was worse in a way the ledger cannot compensate for, because a detached agent keeps editing a worktree and performing external effects after the supervisor has exited, with no lease, no fencing, and no record. Fencing prevents a stale **write to run state**; it does nothing about a stale write to a Git worktree.

The consequences are contained by mechanisms already in this document:

- An effect registered `idempotent: true` and left `intended` is re-executed under the same key on the next attach, and converges.
- An effect registered `idempotent: false` and left `intended` escalates to `blocked` with `indeterminate_effect`, and a human adjudicates. This is expected to become more common than it was under the TASK-002 design, and QA must exercise it.
- An effect never registered is invisible to the runtime either way. That is why registration before performance is a review-enforced rule on TASK-004 and TASK-017 rather than a suggestion.

The drain deadline therefore stays bounded, the tree is gone when the command returns, and the cost is paid in the one place the design already models honestly.

## Observable pre- and post-conditions

| Claim | How it is observed |
|---|---|
| Retries are classified, not blanket | A synthetic `invalid_request` failure produces zero retries; a `transient` failure produces exactly one retry per remaining attempt |
| Retries are bounded | The count of `DispatchStarted` events for any task never exceeds `maxAttempts` |
| Exhaustion is recorded | After the last attempt, the task is `failed` with a non-null `lastFailure` naming the class and final attempt |
| Backoff is deterministic | Two runs with the same seed produce identical `delayMs` sequences |
| Backoff respects the ceiling | Every `delayMs` is at most `retryMaxDelayMs`, or equal to a larger provider-supplied `retryAfterMs` |
| Committed effects are not repeated | Replaying a dispatch whose `effectId` is `committed` produces no new `EffectIntentRecorded` |
| A committed result is reconstructable | For every `EffectCommitted` on an entry with `isTaskResultEffect`, a `WorkerResultRecorded` for the same `(taskId, attempt)` appears at a strictly lower `stateVersion` |
| Task proposals survive a crash | The set of admitted tasks after a crash between `EffectCommitted` and `WorkerSucceeded` equals the set an uninterrupted run admits, compared under canonical JSON |
| Indeterminate non-idempotent effects escalate | An `intended` entry with `idempotent: false` transitions the task to `blocked` with reason `indeterminate_effect` |
| A retry does not double-advance state | Applying the same `WorkerSucceeded` twice yields `IllegalTransition` on the second, and `stateVersion` advances by one, not two |
