# Leases, Fencing, and Bounded-Concurrency Scheduling

Normative scheduling contract for the autonomous runtime. Produced under TASK-002, amended under TASK-016. Related decisions: [ADR-0005](../../adr/0005-time-bounded-leases-with-monotonic-fencing-tokens.md) and [ADR-0015](../../adr/0015-typed-scheduling-gate-and-activation-contracts.md). Implemented by TASK-005.

## Amendment register — TASK-016

| Superseded claim (TASK-002) | Superseded by | Decision |
|---|---|---|
| Gate 1: "It becomes `ready` only through `TaskDependenciesSatisfied`, which requires every dependency to be `succeeded`" | [Gate 1](#gate-1--readiness): every dependency **edge** is satisfied under its own typed condition | [ADR-0015](../../adr/0015-typed-scheduling-gate-and-activation-contracts.md) |
| Four admission gates | Six: named resource-lock exclusion and workspace readiness are added | [ADR-0015](../../adr/0015-typed-scheduling-gate-and-activation-contracts.md), [ADR-0011](../../adr/0011-agent-workspace-lifecycle-module.md) |
| Ordering by `(createdSeq, taskId)` alone | The same total order, preceded by an activation-priority class and a reserved control-plane slot | [ADR-0015](../../adr/0015-typed-scheduling-gate-and-activation-contracts.md) |
| No graph validation; a malformed graph would stall at run time | [Load-time graph validation](#load-time-graph-validation) rejects a graph violating any of the five no-deadlock invariants | [ADR-0015](../../adr/0015-typed-scheduling-gate-and-activation-contracts.md) |

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

`selectDispatchable(run, now)` filters candidates through six gates in this order, then orders the survivors.

### Gate 1 — readiness

A task is a candidate when:

- `state === 'ready'`, or
- `state === 'awaiting_retry'` and `now >= notBefore` (the scheduler emits `BackoffElapsed` before granting), or
- `state === 'quiescent'` and an unconsumed subscribed activation event exists (the scheduler emits `TaskActivated` before granting).

A `pending` task is never a candidate. It becomes `ready` only through `TaskDependenciesSatisfied`, whose guard is that **every edge** in `dependencies` is satisfied under the typed conditions in [STATE-MACHINE.md](STATE-MACHINE.md#typed-dependency-edges).

TASK-002 required every dependency to be `succeeded`. Finding A-004 established that this cannot express the graph the runtime is scheduled by, and would produce one of two failures depending on how it was applied: a pre-merge review gate that waits for its target to succeed while the target waits for the gate, or a consumer released as soon as its dependency's worker returned, before that dependency's blocking gate had passed. The typed conditions resolve both, because `review_ready` is satisfiable from a published commit while the target is still under review, and `integrated` is not satisfiable until the target's `preMergeGates` have closed.

A dependency edge that can never be satisfied — a target that reached `failed` or `cancelled`, or a `gate_recorded` edge on a target that failed without recording a verdict — leaves the dependent task `pending`. It contributes to the run's no-progress condition rather than being dispatched into a broken precondition, which is the TASK-002 behavior preserved over typed edges.

### Gate 2 — global concurrency

`inFlight = count(tasks where state in {leased, running})`. At most `limits.maxConcurrentTasks - inFlight` candidates survive. The scheduler never returns more candidates than remaining capacity, so the supervisor cannot exceed the limit even by dispatching every candidate it receives.

### Gate 3 — per-role concurrency

For each role, at most `limits.maxConcurrentTasksPerRole` tasks may be in flight. Enforced independently of the global limit; the binding constraint is whichever is lower.

### Gate 4 — write-scope exclusion

Two tasks whose `writeScope` glob sets intersect may never hold leases at the same time. A candidate is dropped if its scope intersects the scope of any currently leased or running task, or of any earlier-ordered candidate already selected in this pass.

This gate exists because the project's concurrency policy is `allow_overlapping_write_scopes: false` and because each dispatched task edits an isolated worktree on its own branch. Two concurrent agents writing the same paths would produce conflicting branches that no downstream merge could safely reconcile. Enforcing the constraint at admission is the only place it can be enforced without a distributed merge policy.

Scope intersection is computed on normalized glob patterns: two patterns intersect when the set of paths matching either is non-empty in common. A conservative implementation that treats a prefix relationship (`src/agents/**` versus `src/agents/contracts/**`) as intersecting is correct and is what TASK-005 should implement; over-approximation costs parallelism, never correctness.

### Gate 5 — named resource-lock exclusion

Added under TASK-016. At most one task holding a given `resourceLock` may be `leased` or `running` at any time. A candidate is dropped if its lock is held by any currently leased or running task, or by any earlier-ordered candidate already selected in this pass.

Write-scope exclusion is not sufficient for this. Two tasks may declare **identical** scopes on purpose — one revising what the other produced — and disjointness can never be arranged for them. `tasks/TASK-001-DEPENDENCY-GRAPH.md` records two such pairs, `task-records` and `architecture-docs`. Gate 4 would exclude them as a side effect of their overlapping globs, but a resource lock also serializes tasks whose globs are **not** obviously overlapping and whose conflict is semantic rather than textual, which is precisely why it is declared separately and enforced separately.

Four semantics, matching the graph document:

1. At most one task holding a given resource lock is claimed at any time.
2. A lock is not a dependency. It constrains concurrency, not order. It never appears in `dependencies` and never contributes an edge to the precondition graph.
3. The scheduler **refuses admission** of a task whose lock is held and returns it to the ready set rather than queueing behind it. There is no lock wait queue, so there is no lock-ordering deadlock to reason about.
4. The lock is declared in `TaskRecord.resourceLock` and is machine-readable.

### Gate 6 — workspace readiness

Added under TASK-016. A task is dropped when its workspace is in a state that would make a second preparation unsafe:

- A workspace record in `preparing`, `finalizing`, or `unresolved` for this task, which means a previous attempt left work that `reconcile` has not yet resolved. Dispatching now would create a second worktree or a second lock claim for one task.
- A derived branch name that does not match `agent/<llm>/<role>/<task-id>` for the task's role and LLM. This is refused at admission rather than at spawn time, so the refusal is visible in the scheduler's decision rather than buried in a process failure.

A workspace in `prepared` for the task's current attempt is not a reason to drop the candidate; it is reused. See [WORKSPACE-LIFECYCLE.md](WORKSPACE-LIFECYCLE.md).

### Ordering

Survivors are sorted by a total order with no ties:

1. **Activation class descending** — a task that is activatable (Gate 1's third clause) sorts ahead of every ordinary candidate. Control-plane work that reacts to a recorded lifecycle event is short, and delaying it delays every task waiting on the transition it performs.
2. `createdSeq` ascending — earlier-admitted work first, which keeps the graph advancing breadth-first from the Manager task.
3. `taskId` ascending as a final tiebreak — a total order even if `createdSeq` were ever duplicated.

No clock value, no map iteration order, and no randomness enters the ordering. For a fixed `RunRecord` and a fixed `now`, `selectDispatchable` returns the identical list every time, which is TASK-005's determinism criterion.

### Starvation bound for event-triggered activation

Ordering alone does not bound starvation, because a saturated ready set can hold every dispatch slot indefinitely while long agent invocations run. The bound has two parts:

1. **Reserved capacity.** While at least one activatable task exists, the effective global capacity available to non-activatable candidates in Gate 2 is `maxConcurrentTasks - limits.reservedControlPlaneSlots` (default 1). The reservation applies to admission only; it never preempts a running task and never exceeds `maxConcurrentTasks`.
2. **Bounded rounds.** An activatable task must appear in the returned candidate list within `limits.activationStarvationBoundRounds` (default 1) scheduling rounds after a slot is free, and must never appear while it is quiescent.

Together these give the property the control plane needs: after an activation event is appended, the reservation guarantees a slot frees no later than the completion of the tasks already in flight, and the ordering guarantees the activatable task takes it. Without the reservation, a run that always has more ready work than capacity would starve its own lifecycle transitions forever, which is the livelock finding F-104 recorded against the earlier decomposition.

## Load-time graph validation

Added under TASK-016. TASK-005 validates the whole task graph when it is loaded, and rejects an invalid graph with a named diagnostic rather than deadlocking at run time. It re-validates on every `TaskCreated` admission, because the graph grows dynamically.

### The expanded precondition graph

Acyclicity over scheduling edges alone is not sufficient, and proving it over that projection is what allowed the pre-merge deadlock to be missed. The validator builds `G*` over tasks, where an edge `T ← X` means "T cannot proceed until X has":

| Declared edge on T | Edges contributed to `G*` |
|---|---|
| `review_ready(X)` | `T ← X` |
| `gate_recorded(X)` | `T ← X` |
| `gate_passed(X, g)` | `T ← X`, and `T ← Gt` for the owner `Gt` of gate `g` on X at its highest declared round |
| `integrated(X)` | `T ← X`, and `T ← Gt` for the owner of **every** gate in X's `preMergeGates` |
| `terminal(X)` | `T ← X`, the `integrated(X)` expansion, and `T ← Gt` for the owner of every gate in X's `gateTasks` |
| `human_decision(D)` | none; D is external and is satisfied or not, never by a task |
| `gateFor: X` on T | `T ← X` of kind `review_ready`, added implicitly if not already declared, because no gate can run before its target publishes |

`G*` is acyclic if and only if the graph is schedulable. The five no-deadlock invariants, stated in the same terms as `tasks/TASK-001-DEPENDENCY-GRAPH.md`:

1. The directed graph over `review_ready`, `integrated`, `gate_passed`, `gate_recorded`, `terminal`, and `human_decision` edges is acyclic.
2. No task holding `gateFor: X` also holds a `gate_passed(X)`, `integrated(X)`, or `terminal(X)` edge. It may hold `review_ready(X)`.
3. Every `gateFor` entry has a matching `gateTasks` entry on the target and the reverse, agreeing on gate name and round.
4. For every task X, no gate task owning a gate in X's `preMergeGates` holds an `integrated(X)` edge.
5. `G*` — the expansion above — is itself acyclic.

Invariant 5 is the one that catches the failure the projection missed. Invariants 2 and 4 are the structural reasons it holds in practice: a gate task may depend on its target's publication and on nothing stronger, so no gate ever waits on a merge that waits on that gate.

### Diagnostics

| Code | Condition |
|---|---|
| `GRAPH_CYCLE_SCHEDULING` | Invariant 1 violated; the diagnostic names the cycle's tasks in order |
| `GRAPH_GATE_HOLDS_STRONG_EDGE` | Invariant 2 violated; names the gate task, its target, and the offending edge kind |
| `GRAPH_GATE_PAIR_MISMATCH` | Invariant 3 violated; names both sides and the disagreeing field |
| `GRAPH_PREMERGE_GATE_AWAITS_MERGE` | Invariant 4 violated; names the gate task and the target it would wait on |
| `GRAPH_CYCLE_EXPANDED` | Invariant 5 violated; names the cycle in `G*` and the edge expansion that produced each hop |
| `GRAPH_UNKNOWN_TARGET` | An edge names a task or human decision that does not exist |
| `GRAPH_TERMINAL_EDGE_CYCLE` | A `terminal` edge whose expansion produces a cycle. The edge kind is reserved and this is the diagnostic that makes its misuse a rejection rather than a hang |

Rejection is a returned value on the load path, not a thrown error, and it names every violated invariant rather than the first one.

### Test obligations for A-004

1. **Edge satisfaction.** For each of the six edge kinds, a table test over target states asserting exactly when the edge is satisfied, including that `review_ready` is satisfied while the target is unmerged and that `integrated` is not satisfied while any `preMergeGate` is open.
2. **Gate rounds.** Record `changes-required` at round 1 and `approved` at round 2; assert the gate is closed, both verdicts are readable, and an attempt to rewrite round 1 is rejected.
3. **Gate durability.** Assert there is no code path — including recovery — that removes or mutates an existing `GateVerdictRecord`.
4. **Acyclicity.** Assert `GRAPH_CYCLE_EXPANDED` for a graph whose scheduling-edge projection is acyclic but whose expansion is not, which is the F-101 shape: a gate task on X holding `integrated(X)`.
5. **Resource locks.** Assert two tasks holding the same lock are never leased concurrently, that the second is returned to the ready set rather than queued, and that a lock is never treated as an ordering constraint.
6. **Idle quiescence.** With a quiescent activation task and a cursor equal to the highest subscribed `seq`, assert `selectDispatchable` never returns it, across an unbounded number of rounds.
7. **Exactly-once activation.** Append an event, dispatch the activation, crash between `TaskActivated` and `WorkerSucceeded`, and assert the next activation consumes the identical range, that the cursor advances exactly once, and that the effects are identical.
8. **Monotonic cursor.** Assert the cursor never decreases across a crash, a replay, or a recovery, and that an event proposing a decrease is rejected.
9. **No starvation.** With a saturated ready set and `maxConcurrentTasks` long-running tasks, append an activation event and assert the activation task is dispatched within `activationStarvationBoundRounds` rounds of a slot becoming free, and that reserved capacity never causes `maxConcurrentTasks` to be exceeded.
10. **Vocabulary agreement.** Load every task record in `tasks/` as a fixture and assert each parses into the contract types with no field renaming, which is what makes the committed graph executable without restatement.

## Observable pre- and post-conditions

| Claim | How it is observed |
|---|---|
| Global limit is never exceeded | After any successful append, `count(state in {leased, running}) <= maxConcurrentTasks` |
| Per-role limit is never exceeded | The same count grouped by `ownerRole` is `<= maxConcurrentTasksPerRole` |
| No overlapping scopes in flight | For every pair of leased or running tasks, their `writeScope` sets do not intersect |
| No shared resource lock in flight | For every pair of leased or running tasks, their `resourceLock` values are not equal |
| Dependencies gate dispatch | No task reaches `leased` unless every dependency **edge** is satisfied under its typed condition |
| A quiescent task is never dispatched | With the cursor equal to the highest subscribed activation `seq`, the task never appears in a candidate list |
| An activated task is dispatched promptly | After an activation event is appended, the task appears in a candidate list within the starvation bound of a slot becoming free |
| An invalid graph is refused, not stalled | A graph violating any of the five no-deadlock invariants is rejected at load with a named diagnostic |
| Tokens strictly increase per task | For each task, the sequence of `fencingToken` values across its `LeaseGranted` events is strictly increasing |
| Stale writes are rejected | An append with a superseded token returns `StaleFencingToken` and changes nothing |
| Reclaim happens once | Between two `LeaseGranted` events for the same task there is at most one `LeaseExpired` or `LeaseReleased` event |
| Dispatch order is deterministic | Two calls with the same record and `now` return equal lists |

## Diagrams

- [Dispatch and fencing sequence](../../../diagrams/architecture/runtime-sequences.md)
