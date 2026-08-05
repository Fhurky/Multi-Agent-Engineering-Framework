# Provider Adapter Boundary and Error Taxonomy

Normative provider contract for the autonomous runtime. Produced under TASK-002 and amended under TASK-016, TASK-024, and TASK-028. Related decisions: [ADR-0007](../../adr/0007-provider-adapter-boundary-and-error-taxonomy.md), [ADR-0014](../../adr/0014-live-run-control-and-process-tree-ownership.md), and TASK-028 ADRs [0026](../../adr/0026-blocked-drain-attach-and-unverified-closure-recovery.md), [0028](../../adr/0028-nominal-store-issued-durable-append-receipts.md), and [0029](../../adr/0029-ingress-delivery-ownership.md). Implemented by TASK-004.

## Amendment register — TASK-028

| Superseded claim | Superseded by | Finding | Decision |
|---|---|---|---|
| Structural receipt shape was accepted as proof and duplicated nominally across contract roots | TASK-004 accepts `unknown`, verifies it through the injected read-only store verifier, and checks the store-recorded invocation subject before spawning | A-206 | [ADR-0028](../../adr/0028-nominal-store-issued-durable-append-receipts.md) |
| `AgentInvocation` carried no immutable ingress entries | `AgentInvocation.ingress` receives the exact TASK-005 delivery and no inbox capability | A-207 | [ADR-0029](../../adr/0029-ingress-delivery-ownership.md) |
| A prior `ProcessGroupClosed { verifiedExit:false }` excluded an invocation from later recovery | Invocation-addressed closure may be superseded once during recovery; latest absent-or-unverified closure is selected | A-204 | [ADR-0026](../../adr/0026-blocked-drain-attach-and-unverified-closure-recovery.md) |

## Amendment register — TASK-016

| Superseded claim (TASK-002) | Superseded by | Decision |
|---|---|---|
| "An adapter that ignores the signal is non-conforming; the worker's own timer guarantees the classification is produced regardless" — a timeout classification with no mechanism that stops the process producing it | [Process-tree lifecycle](#process-tree-lifecycle) — the abort signal is the first step of a bounded escalation that ends in a verified tree exit | [ADR-0014](../../adr/0014-live-run-control-and-process-tree-ownership.md) |
| Three timeout layers, none of which owns the OS process | A fourth concern, process-tree ownership, assigned to this module with an explicit interface | [ADR-0014](../../adr/0014-live-run-control-and-process-tree-ownership.md) |
| `AgentInvocation` carrying `worktreePath` and `branch` with no module producing them | Produced by the workspace lifecycle module and handed to the worker as a prepared handle | [ADR-0011](../../adr/0011-agent-workspace-lifecycle-module.md) |

## The boundary

The supervisor knows a role has an `llm` family name. It does not know what that name means, how that provider is invoked, what its errors look like, or whether it is a CLI, an HTTP API, or a local process.

```text
supervisor  ->  AgentWorker.planInvocation(assignment)          provider-neutral
                    |                                           TASK-024: three phases,
                supervisor appends ProcessGroupRegistered       with the supervisor's
                    |                                           appends between them
                AgentWorker.beginInvocation(plan, receipt)      provider-neutral
                    |
                    v
                AdapterRegistry.resolve(family)                 provider-neutral
                    |
                    v
                ProviderAdapter.invoke(invocation)              the only provider-specific code
                    |
                supervisor appends ProcessGroupBound
                    |
                AgentWorker.completeInvocation(handle)          provider-neutral
```

The three phases replace the single `AgentWorker.execute` call under TASK-024. The boundary itself is unchanged: the supervisor still knows only a family name, and `ProviderAdapter.invoke` is still the only provider-specific code.

**Extension test.** Adding a provider must require exactly one change: registering a new `ProviderAdapter` implementation in the registry. If a new provider forces a change in `src/orchestrator/**`, the boundary has been violated. This is TASK-004's first acceptance criterion and the reviewer's most direct check.

## What crosses the boundary

Into the adapter, an `AgentInvocation`: identifiers, the role and its contract file paths, the task record path, the worktree path, the branch, the attempt number, the idempotency key, a timeout, and — for recurring work — a read-only `AgentIngressDelivery` carrying the exact immutable entries. No credentials. No supervisor objects. No state store or inbox handle.

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

Producing the classification is not the same as stopping the work. TASK-002 stopped here, and finding A-003 established the consequence: an adapter that ignores the abort leaves a `claude`, `codex`, or `gemini` process — and everything it spawned — running after the worker has already reported a timeout. The abort signal is therefore the **first step** of the escalation defined below, not the whole of it.

This is worker-level timeout **signalling** only. Deciding what a timeout means for the run — retry, exhaustion, or run-level failure — belongs to TASK-008 and is specified in [RETRIES-TIMEOUTS-AND-IDEMPOTENCY.md](RETRIES-TIMEOUTS-AND-IDEMPOTENCY.md). The timeout mechanisms are deliberately layered and independent:

| Layer | Bound | Owner | Purpose |
|---|---|---|---|
| Adapter/worker abort | `taskTimeoutMs` | TASK-004 | Stop waiting on one invocation |
| Process-tree escalation | `gracefulCancelGraceMs`, `treeExitVerifyTimeoutMs` | TASK-004 | Stop the invocation's OS processes, verifiably |
| Lease TTL | `leaseTtlMs` | TASK-005 | Reclaim work whose owner stopped renewing |
| Watchdog scan | `taskTimeoutMs`, `runTimeoutMs` | TASK-008 | Transition timed-out work through the state machine even if no worker reports back |

The watchdog exists because a process that crashes mid-invocation never returns an outcome at all. Relying only on the worker's own timer would leave such a task in `running` forever.

## Process-tree lifecycle

Added under TASK-016 to resolve the second half of A-003. **This module owns it**, and no other module has any part of it. The reason is that this is the only module that spawns a provider process: ownership of a process tree belongs where the spawn happens, because only there can the child be placed into an owned group at creation, which is the only moment at which that is possible. The lifecycle module and the recovery module both act on process trees, and both do so exclusively through the `ProcessTreeController` interface declared in `agents/contracts` and implemented here. [COMPONENT-BOUNDARIES.md](COMPONENT-BOUNDARIES.md) records the single ownership.

### Durable invocation identity

Every invocation has an `invocationId` that is durable **before** any process exists, and the runtime records the binding immediately after.

Amended under TASK-024 (ADR-0019) to resolve A-102. TASK-016 stated this sequence and then gave `AgentWorker.execute` a single opaque signature, so no caller could interleave an append with the spawn. The sequence diagram closed the gap by showing the worker appending directly, which violates the declared boundary — workers never write durable state. The handshake below has a seam at every append, and every append is performed by the supervisor.

| Step | Actor | Action | Journal |
|---|---|---|---|
| 1 | supervisor | `plan = worker.planInvocation(assignment)`. Pure: computes `invocationId` deterministically from `(runId, taskId, attempt, idempotencyKey)`, derives the group name from it, assembles the command vector. Spawns nothing | — |
| 2 | supervisor | Append the registration | `ProcessGroupRegistered { invocationId, taskId, attempt, groupKind, groupName }`, durable **before** the spawn |
| 3 | supervisor | Take `receipt` from the append result | — |
| 4 | supervisor | `begun = await worker.beginInvocation(plan, receipt, signal)`. The worker verifies the opaque value through `AgentReceiptVerifier` and refuses unless the store-recorded subject names `plan.invocationId` in the current writer epoch | — |
| 5 | supervisor | Append the binding, immediately after step 4 returns | `ProcessGroupBound { invocationId, pid, groupRef, processStartTime }` |
| 6 | supervisor | `result = await worker.completeInvocation(begun.handle, signal)`, which awaits the provider outcome and then the verified tree close | — |
| 7 | supervisor | Append the close | `ProcessGroupClosed { invocationId, outcome, exitCode, escalation, verifiedExit, closedAt }` |

Three properties this buys, each checkable rather than promised:

1. **Registration is durable before the spawn, by verified boundary.** The state root's receipt is nominal and issued only after the batch commit record. The independent agent root does not counterfeit that nominal type: it accepts an opaque value and its injected `AgentReceiptVerifier` returns the store-recorded subject or `null`. `beginInvocation` and `spawnOwned` return `RegistrationNotDurable` before group creation when verification fails, the invocation identity mismatches, or the writer epoch is stale. An ordinary caller can supply a value but cannot synthesize one that passes verification.
2. **TASK-004 gains no state-write ownership.** The verifier is read-only and returns evidence, not an append capability. `agents` still never touches durable state, and the diagram shows no worker append.
3. **The binding is durable immediately after the spawn.** Step 5 is the supervisor's next action after step 4 returns, with nothing between them, which keeps the unbound window exactly one append wide — the same width TASK-016 claimed and could not deliver.

The window between steps 2 and 5 is the residual risk recorded in [CRASH-RECOVERY.md](CRASH-RECOVERY.md): a POSIX crash inside it leaves a child whose group was never recorded. It is unchanged in width by this amendment; what changed is that the window is now the *only* gap, rather than one gap among several that the interface could not close at all.

`processStartTime` is recorded so that identity can be re-verified later. A pid alone is not an identity: pids are reused, and signalling a reused pid would terminate an unrelated process.

### Owned group per platform

| Platform | Mechanism | Kill-on-crash |
|---|---|---|
| Windows | A **Job Object** created with the derived name before the spawn, with `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE` set. The child is created suspended, assigned to the job, then resumed, so no descendant can escape the job between creation and assignment. `CREATE_NEW_PROCESS_GROUP` is also set so a console control event can be directed at the group | **Yes.** When the supervisor dies, its last handle to the job closes and the kernel terminates every process in it. A crash therefore cannot leave a descendant behind |
| POSIX | The child is spawned detached, which places it in a **new process group** whose pgid equals the child's pid. Signals are sent to `-pgid`, so they reach descendants that did not change their own group | **No.** POSIX has no equivalent of kill-on-close. A supervisor crash leaves the group running until the next attach fences and terminates it |

An adapter that spawns a provider without an owned group is non-conforming. There is exactly one spawn function in this module, it always creates the group, and no adapter implementation calls a process API directly — this is the structural mechanism, not a review convention.

### Graceful cancellation and bounded escalation

```text
1. Signal the adapter through AbortSignal.                        cooperative
2. Send a graceful termination to the whole group:                bounded by gracefulCancelGraceMs
     POSIX:   SIGTERM to -pgid
     Windows: CTRL_BREAK to the process group
3. If the tree has not exited within gracefulCancelGraceMs:       forced
     POSIX:   SIGKILL to -pgid
     Windows: TerminateJobObject
4. Verify exit, polling at treeExitPollIntervalMs
   until treeExitVerifyTimeoutMs:                                 verification
     POSIX:   kill(-pgid, 0) returns ESRCH
     Windows: the job reports zero assigned process ids
5. If verification did not succeed and treeCloseTotalBudgetMs      TASK-024: re-escalation
   is not exhausted, repeat steps 3 and 4.
6. Append ProcessGroupClosed with the escalation reached
   and verifiedExit true or false.
```

Defaults: `gracefulCancelGraceMs` 10 000, `treeExitVerifyTimeoutMs` 5 000, `treeExitPollIntervalMs` 250, `processTreeCloseTimeoutMs` 20 000, and — added under TASK-024 — `processTreeCloseTotalBudgetMs` 60 000. All are run limits, all are injected, and none is read from wall-clock time directly.

A child that ignores step 2 is expected, not exceptional: agent CLIs trap interrupts to flush their own state. Step 3 is unconditional once the grace elapses, and step 4 is what turns "we sent a signal" into "the tree is gone". Step 5 is added under TASK-024: a single verification timeout is no longer the end of the attempt, because one timed-out poll is weak evidence that a tree is unkillable. `verifiedExit: false` after the **total budget** is exhausted is recorded as `orphan_unresolved` and reported; it is never silently treated as success, and — under ADR-0022 — it is never treated as an acceptable state in which a drain may return.

### Persisted outcome before the writer lock is released

**Normative.** `releaseWriter` must not be called, and `RunDrainCompleted` must not be emitted, while any invocation of the current writer epoch lacks a durable `ProcessGroupClosed`. `pause` and `stop` therefore wait for step 6 of every in-flight invocation, bounded by `processTreeCloseTotalBudgetMs`.

**Amended under TASK-024 (ADR-0022).** TASK-016 stopped here, which left the pause post-condition qualified: an `orphan_unresolved` outcome satisfied "has a durable `ProcessGroupClosed`" while a descendant might still be alive, so `pause` could return reporting a clean, resumable run with a process still editing a worktree. Finding A-102 recorded that as contrary to the unqualified criterion.

`RunDrainCompleted` additionally requires `verifiedExit: true` for every invocation of the epoch. When the budget is exhausted with any invocation unverified, the runtime appends `RunDrainBlocked`, writes a checkpoint, releases the writer lock, and exits **5**. The run stays in `pausing` or `draining`. The next attach is legal from either state; Phase 5 selects every invocation whose latest closure is absent or `verifiedExit:false`, repeats bounded termination, and appends one invocation-addressed recovery closure that supersedes the unverified evidence.

This is what gives the pause post-condition in [LIFECYCLE-AND-BOOTSTRAP.md](LIFECYCLE-AND-BOOTSTRAP.md) its teeth, and the post-condition is now unqualified: pause may leave resumable **task** state, and there is no outcome under which it returns a paused run while an unmanaged descendant remains.

### Test obligations for A-003

The finding names one scenario explicitly; it is required, and four more follow from the contract.

1. **Grandchild, ignored cancellation, outlived timeout.** A fake adapter spawns a child that spawns a grandchild; the child installs a handler that ignores the first graceful termination; both outlive `taskTimeoutMs`. Assert: the worker returns a `timeout` outcome within its bound; escalation reaches `forced`; neither child nor grandchild is alive after `ProcessGroupClosed`; `verifiedExit` is true; and the append precedes `releaseWriter`.
2. **Pause with the same tree.** Assert `pause` does not return until the tree is gone, and that it returns within `processTreeCloseTimeoutMs` plus a fixed tolerance.
3. **Crash with a bound invocation.** Kill the supervisor with the tree alive. On Windows assert the tree is already gone by kill-on-close; on POSIX assert the next attach terminates it and records `terminated_by_recovery`.
4. **Pid reuse.** Present a live process holding the recorded pid with a different start time. Assert no signal is sent and the outcome is `orphan_unresolved` with reason `pid_reuse`.
5. **Registered but unbound.** Simulate a crash between the pre-spawn append and the post-spawn append. Assert the outcome is `orphan_unresolved` with reason `unbound`, that `RECOVERY_ORPHAN_UNRESOLVED` is emitted, and that the invocation is fenced so a late result changes nothing.

### Test obligations added for A-102 under TASK-024

6. **Spawn without a receipt is refused.** Call `beginInvocation` with no receipt, with a receipt naming a different `invocationId`, and with a receipt carrying a superseded `writerEpoch`. Assert each returns `RegistrationNotDurable`, that no process was created, asserted on the OS process table, and that no journal append was attempted.
7. **Registration precedes every spawn.** Over a fixture run dispatching many tasks, assert that for every `ProcessGroupBound` there is a `ProcessGroupRegistered` for the same `invocationId` at a strictly lower `stateVersion`, and that no process start time precedes the registration's durability.
8. **The worker appends nothing.** Assert the `AgentWorker` implementation is constructed without a `StateStore` and that a static check finds no import of the store interface in `src/agents/`. This is the boundary the sequence diagram previously violated.
9. **Drain does not return with a live descendant.** With a tree that survives the total budget, assert `RunDrainCompleted` is absent, `RunDrainBlocked` names the invocation, the run is still `pausing`, the command exits 5, and the next attach terminates the tree and records `terminated_by_recovery`.

Tests 1 through 9 use a fake adapter and real OS processes; none makes a network call or invokes a real provider.

## Credentials

`SecretProvider` is the only path to credential material, and it is constructed at the composition root from environment variables or an injected secret manager. Rules:

1. Credentials are never fields of `AgentInvocation`, `AdapterOutcome`, `WorkerResult`, or any record persisted by TASK-003.
2. Credentials are never written to run events, logs, artifact indexes, or test fixtures.
3. A missing credential produces `authentication` with a message naming only the variable name, never its value.
4. Test adapters are fakes. TASK-004's unit tests make no network calls and read no real credential.

## Worker responsibilities

The provider-neutral half, amended under TASK-024 to the three-phase handshake:

1. **`planInvocation`.** Resolve the adapter by `invocation.llm`; an unregistered family is `invalid_request` with code `UNKNOWN_PROVIDER_FAMILY`. Compute `invocationId` and the group name. Assemble the invocation from the role contract paths and the task record path — the worker reads those files; it does not interpret governance. Build the command vector. Pure with respect to processes: nothing is spawned.
2. **`beginInvocation`.** Verify the receipt. Create the owned group, spawn the provider into it, and return the binding.
3. **`completeInvocation`.** Start the abort timer, await the adapter outcome, stop the timer, then close the tree with verified exit. Normalize the outcome into a `WorkerResult` carrying the invocation identifiers, the attempt, the idempotency key, the fencing token it was handed, and the start and finish timestamps.
4. Return. **The worker performs no state write and no retry**, in any phase. It receives no `StateStore` and holds no append path; the receipts it receives are evidence and carry no capability.

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
| Every process is owned | For every spawned provider process, a `ProcessGroupRegistered` is durable before the spawn and a `ProcessGroupBound` follows it; a spawn with no owned group fails the test suite |
| Registration is durable before the spawn | `beginInvocation` without a valid receipt creates no process; asserted on the OS process table, not on a log line |
| The worker writes no durable state | `src/agents/` contains no import of `StateStore`, and the worker is constructible without one |
| Every tree is closed | For every `ProcessGroupRegistered` there is exactly one `ProcessGroupClosed` before the writer lock is released |
| No drain returns with a live descendant | No `RunDrainCompleted` exists in any journal alongside an invocation of the same epoch whose `verifiedExit` is false |
| Escalation is bounded | With a child that ignores graceful termination, the forced step occurs within `gracefulCancelGraceMs` plus a fixed tolerance |
| Exit is verified, not assumed | `ProcessGroupClosed.verifiedExit` is true only after the platform check reports no remaining process; a timeout on that check records `orphan_unresolved` |
| No invocation runs outside a worktree | `execute` refuses an assignment whose workspace handle is not `prepared`, asserted with preparation stubbed to fail |
