# Leases, Fencing, and Bounded-Concurrency Scheduling

Normative scheduling contract for the autonomous runtime. Produced under TASK-002. Related decision: [ADR-0005](../../adr/0005-time-bounded-leases-with-monotonic-fencing-tokens.md). Implemented by TASK-005.

## Why leases

A task in flight has an owner. If that owner dies, hangs, or is superseded, the task must return to the ready set without any risk that the abandoned owner later writes a result. A lease is the time-bounded claim, and a fencing token is what makes a late write from an expired claim harmless.

## Lease record

```ts
interface LeaseRecord {
  holderId: string;
  fencingToken: FencingToken;   // == the StateVersion of the LeaseGranted event
  writerEpoch: WriterEpoch;
  grantedAt: IsoTimestamp;
  expiresAt: IsoTimestamp;
  renewals: number;
}
```

`holderId` is opaque and identifies the worker slot within the supervisor process. It is not a security principal; the writer epoch and the fencing token carry the authority.

## Lease lifecycle

| Operation | Pre-condition | Post-condition |
|---|---|---|
| **Acquire** | Task is `ready`; `lease === null`; global and per-role capacity available; no concurrently leased task with an overlapping write scope | Task is `leased`; `lease.fencingToken` is strictly greater than every token previously issued for any task in the run; `expiresAt === now + leaseTtlMs`; `renewals === 0` |
| **Renew** | Task is `leased` or `running`; presented token equals `lease.fencingToken`; `now < lease.expiresAt` | `expiresAt` extended to `now + leaseTtlMs`; `renewals` incremented; **`fencingToken` unchanged** |
| **Release** | Task is `leased` or `running`; presented token equals `lease.fencingToken` | `lease === null`; task returns to `ready` if it did not reach a terminal state in the same batch |
| **Expire** | `now >= lease.expiresAt`, or `lease.writerEpoch < run.writerEpoch` | `lease === null`; task is `ready`; `attempt` unchanged; the expired token is now permanently stale |

Renew must not change the token. If renewal issued a new token, the holder's own in-flight write could present the previous one and be rejected as stale. Token changes happen at grant and only at grant.

`leaseTtlMs` (default 120 s) is much shorter than `taskTimeoutMs` (default 900 s). A long-running task stays alive by renewing every `leaseRenewIntervalMs` (default 40 s, one third of the TTL, giving two missed renewals of tolerance). A dead process stops renewing and its leases become reclaimable within one TTL rather than after the full task timeout.

## Fencing

`FencingToken` is the run's `StateVersion` at the moment the `LeaseGranted` event is applied. Because `stateVersion` is strictly monotonic per run and never resets ([DURABLE-STATE-AND-CHECKPOINTS.md](DURABLE-STATE-AND-CHECKPOINTS.md)), tokens are globally ordered and per-task strictly increasing without a second counter.

**Write guard.** Every task-addressed event carrying a `fencingToken` is checked by the state store before the transition function runs:

```text
presented == task.lease.fencingToken   -> accept
presented <  task.lease.fencingToken   -> reject StaleFencingToken
task.lease == null                     -> reject StaleFencingToken (expected: none)
presented >  task.lease.fencingToken   -> reject StaleFencingToken (a token the run never issued)
```

Rejection is a returned `AppendResult` variant, not an exception, so TASK-005, TASK-006, and TASK-008 can assert on it directly.

**The property this buys.** Consider a worker whose lease expires while its provider call is still running. The scheduler reclaims the task and grants a new lease with token `t2 > t1`. When the original worker finally returns, the supervisor attempts `WorkerSucceeded` with token `t1`, which is rejected. The stale result cannot overwrite the new attempt, cannot resurrect a terminal state, and cannot double-count an effect. No coordination with the abandoned worker is required — the ordering of the tokens is the whole mechanism.

**Two-level fencing.** The writer epoch fences whole processes; the fencing token fences individual task claims inside a process. Both checks run on every append. A resurrected supervisor fails the epoch check even if its tokens happen to look current.

## Expiry detection and exactly-once reclaim

`reclaimExpiredLeases(run, now)` is pure and returns one `LeaseExpired` envelope per expired lease. The supervisor appends them. Exactly-once reclaim follows from the compare-and-set append rather than from any locking in the scheduler:

1. Two callers observe the same expired lease and both build a `LeaseExpired` envelope at `expectedVersion = v`.
2. The first append succeeds and the version becomes `v + 1`.
3. The second append fails with `VersionConflict`, reloads, observes `lease === null` and the task already `ready`, and emits nothing.

The task therefore returns to the ready set exactly once and is never dispatched twice for the same reclaim. TASK-005 must test this race explicitly with a fake clock.

An expired lease does not consume an attempt. `attempt` advances at `DispatchStarted`, so a task reclaimed before dispatch keeps its full retry budget.

## Admission control

`selectDispatchable(run, now)` filters candidates through four gates in this order, then orders the survivors.

### Gate 1 — readiness

A task is a candidate when:

- `state === 'ready'`, or
- `state === 'awaiting_retry'` and `now >= notBefore` (the scheduler emits `BackoffElapsed` before granting).

A `pending` task is never a candidate. It becomes `ready` only through `TaskDependenciesSatisfied`, which requires every dependency to be `succeeded`. A dependency that ends `failed` or `cancelled` never satisfies the guard, so the dependent task remains `pending` and contributes to the run's no-progress condition rather than being dispatched into a broken precondition.

### Gate 2 — global concurrency

`inFlight = count(tasks where state in {leased, running})`. At most `limits.maxConcurrentTasks - inFlight` candidates survive. The scheduler never returns more candidates than remaining capacity, so the supervisor cannot exceed the limit even by dispatching every candidate it receives.

### Gate 3 — per-role concurrency

For each role, at most `limits.maxConcurrentTasksPerRole` tasks may be in flight. Enforced independently of the global limit; the binding constraint is whichever is lower.

### Gate 4 — write-scope exclusion

Two tasks whose `writeScope` glob sets intersect may never hold leases at the same time. A candidate is dropped if its scope intersects the scope of any currently leased or running task, or of any earlier-ordered candidate already selected in this pass.

This gate exists because the project's concurrency policy is `allow_overlapping_write_scopes: false` and because each dispatched task edits an isolated worktree on its own branch. Two concurrent agents writing the same paths would produce conflicting branches that no downstream merge could safely reconcile. Enforcing the constraint at admission is the only place it can be enforced without a distributed merge policy.

Scope intersection is computed on normalized glob patterns: two patterns intersect when the set of paths matching either is non-empty in common. A conservative implementation that treats a prefix relationship (`src/agents/**` versus `src/agents/contracts/**`) as intersecting is correct and is what TASK-005 should implement; over-approximation costs parallelism, never correctness.

### Ordering

Survivors are sorted by a total order with no ties:

1. `createdSeq` ascending — earlier-admitted work first, which keeps the graph advancing breadth-first from the Manager task.
2. `taskId` ascending as a final tiebreak — a total order even if `createdSeq` were ever duplicated.

No clock value, no map iteration order, and no randomness enters the ordering. For a fixed `RunRecord` and a fixed `now`, `selectDispatchable` returns the identical list every time, which is TASK-005's determinism criterion.

## Observable pre- and post-conditions

| Claim | How it is observed |
|---|---|
| Global limit is never exceeded | After any successful append, `count(state in {leased, running}) <= maxConcurrentTasks` |
| Per-role limit is never exceeded | The same count grouped by `ownerRole` is `<= maxConcurrentTasksPerRole` |
| No overlapping scopes in flight | For every pair of leased or running tasks, their `writeScope` sets do not intersect |
| Dependencies gate dispatch | No task reaches `leased` unless every dependency is `succeeded` |
| Tokens strictly increase per task | For each task, the sequence of `fencingToken` values across its `LeaseGranted` events is strictly increasing |
| Stale writes are rejected | An append with a superseded token returns `StaleFencingToken` and changes nothing |
| Reclaim happens once | Between two `LeaseGranted` events for the same task there is at most one `LeaseExpired` or `LeaseReleased` event |
| Dispatch order is deterministic | Two calls with the same record and `now` return equal lists |

## Diagrams

- [Dispatch and fencing sequence](../../../diagrams/architecture/runtime-sequences.md)
