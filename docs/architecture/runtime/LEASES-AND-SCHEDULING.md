# Leases, Fencing, and Bounded-Concurrency Scheduling

Normative scheduling contract for the autonomous runtime. Produced under TASK-002 and amended under TASK-016, TASK-024, TASK-028, TASK-032, TASK-034, TASK-036, TASK-040, and TASK-042. Related decisions: [ADR-0005](../../adr/0005-time-bounded-leases-with-monotonic-fencing-tokens.md) and [ADR-0015](../../adr/0015-typed-scheduling-gate-and-activation-contracts.md), as amended by [ADR-0017](../../adr/0017-durable-ingress-inbox-and-ingress-epochs.md), [ADR-0018](../../adr/0018-publication-classes-and-gate-lineages.md), TASK-028 ADRs [0024](../../adr/0024-task-record-projection-contract.md), [0029](../../adr/0029-ingress-delivery-ownership.md), and [0031](../../adr/0031-pre-dispatch-ingress-observer-and-collector.md), [ADR-0032](../../adr/0032-lossless-task-record-source-and-projection.md), [ADR-0036](../../adr/0036-target-tree-derived-architecture-fixtures-and-lineage-integration.md), proposed [ADR-0042](../../adr/0042-conditionally-authorized-post-gate-merge-executors.md), and [ADR-0043](../../adr/0043-exact-merge-admission-policy-attestation-and-published-head-evidence.md). Implemented by TASK-005, over an inbox and collector implemented by TASK-026.

## Amendment register — TASK-040 and TASK-042

TASK-040 adds no scheduling edge and changes no gate verdict. It re-enumerates the amendment's own target tree under ADR-0036 and states that a verified merge result reaches selection only through TASK-026 append and TASK-005 signal/observe/deliver. TASK-041 subsequently recorded `changes-required`. TASK-042 still adds no scheduling edge, verdict, or task record; it makes executor admission stricter than the current generic graph predicate and returns the tasks-owned narrowing to the Orchestrator. TASK-044 is the separately routed next review context. `LIN-INTEGRATION-AUTHORITY-REVIEW` remains independent of the closed eight-round `LIN-ARCH-REVIEW` cohort.

## Amendment register — TASK-036

TASK-036 re-enumerates the immutable publication target under ADR-0036. The fixture now includes TASK-036/TASK-037, all 65 paired relations, and the round-7 architecture lineage. These values are publication evidence rather than reusable acceptance constants.

## Amendment register — TASK-034

| Superseded claim (TASK-032) | Superseded by | Finding | Decision |
|---|---|---|---|
| Fixed task, relation, and enrichment totals were treated as immutable fixture expectations | Enumerate task records and relation documents from the published target tree and derive every total | A-202 residual | [ADR-0036](../../adr/0036-target-tree-derived-architecture-fixtures-and-lineage-integration.md) |
| Revision-7/TASK-028 was still called the current graph and the proof omitted later rounds | Target-identified projection, exact pair proof, expanded-edge derivation, and deterministic topological proof for the publication tree | A-402 (A-004/A-101 residue) | [ADR-0036](../../adr/0036-target-tree-derived-architecture-fixtures-and-lineage-integration.md) |

## Amendment register — TASK-032

| Superseded claim (TASK-028) | Superseded by | Finding | Decision |
|---|---|---|---|
| Closed nested source types and top-level retention were described as exact | The source is a lossless YAML tree plus raw text; the typed target and inverse transform explicitly partition every leaf at any depth | A-202 (A-004/A-101 views) | [ADR-0032](../../adr/0032-lossless-task-record-source-and-projection.md) |

## Amendment register — TASK-028

| Superseded claim (TASK-024) | Superseded by | Finding | Decision |
|---|---|---|---|
| The observer polled the inbox before a pass, with no authorized pre-dispatch producer and no delivery of entries | TASK-026 validates and appends first; TASK-005 signals, observes, and delivers before selection | A-201, A-207, HUMAN-002 | [ADR-0029](../../adr/0029-ingress-delivery-ownership.md), [ADR-0031](../../adr/0031-pre-dispatch-ingress-observer-and-collector.md) |
| Every committed task record parsed into runtime types with no field renaming | Exact document parsing followed by the sole `TaskRecordProjection` | A-202 | [ADR-0024](../../adr/0024-task-record-projection-contract.md) |
| Revision-5 fixture and pair-property counts were treated as current | Load the complete committed task set through the projection and validate its current lineage graph | A-202 | [ADR-0024](../../adr/0024-task-record-projection-contract.md) |

## Amendment register — TASK-024

| Superseded claim (TASK-016) | Superseded by | Finding | Decision |
|---|---|---|---|
| Gate 1's third clause, "an unconsumed subscribed activation event exists" over `run.activationEvents` | [Gate 1](#gate-1--readiness): `run.ingressSeq > activation.lastConsumedEventSeq`, over the durable inbox | A-101, F-301 | [ADR-0017](../../adr/0017-durable-ingress-inbox-and-ingress-epochs.md) |
| "Five no-deadlock invariants" | [Load-time graph validation](#load-time-graph-validation): **eight**, adding form resolution, gate-pair scheduling properties, and lineage well-formedness | A-101 | [ADR-0018](../../adr/0018-publication-classes-and-gate-lineages.md) |
| `gate_passed(X, g)` expanding to one owner, with no lineage form | The expansion table below carries both forms; the lineage form expands to every gate task recording a lineage round `>=` the edge's | A-101 | [ADR-0018](../../adr/0018-publication-classes-and-gate-lineages.md) |
| The expanded graph proved acyclic for the revision-3 graph | [Acyclicity of the current committed graph](#acyclicity-of-the-current-committed-graph), proved over the projected committed task set | A-101, A-202 | [ADR-0018](../../adr/0018-publication-classes-and-gate-lineages.md), [ADR-0024](../../adr/0024-task-record-projection-contract.md) |
| The activation candidate carrying `activateThroughSeq`, a reserved range | `observedIngressSeq`, an observation that reserves nothing | A-101 | [ADR-0017](../../adr/0017-durable-ingress-inbox-and-ingress-epochs.md) |

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
- `state === 'quiescent'` and `run.ingressSeq > task.activation.lastConsumedEventSeq` (the scheduler emits `TaskActivated` before granting).

The third clause is over the durable ingress high-water mark. TASK-005 owns observation, signalling, and delivery but not append. Under `durable-bootstrap-append`, TASK-026 must first validate, deduplicate, and append the external source fact through `IngressInbox`; TASK-005 then accepts the returned mark through `IngressHighWaterSignal`, calls `IngressObserver.observe`, and appends `IngressHighWaterMarkObserved` before this gate is evaluated. Any pre-selection failure returns `BootstrapContractUnsatisfied`; the scheduler is not called. `selectDispatchable` stays pure because it reads only `run.ingressSeq`.

After `TaskActivated` is durable and before provider invocation, TASK-005 calls `IngressObserver.deliver` for exactly `(activation.lastConsumedEventSeq, observedIngressSeq]`. The returned `IngressDelivery` enters both `WorkAssignment.ingressDelivery` and `AgentInvocation.ingress`; the activation receives no `IngressInbox` capability.

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

Together these give the property the control plane needs: after `run.ingressSeq` increases, the reservation guarantees a slot frees no later than the completion of the tasks already in flight, and the ordering guarantees the activatable task takes it. Without the reservation, a run that always has more ready work than capacity would starve its own lifecycle transitions forever, which is the livelock finding F-104 recorded against the earlier decomposition.

The bound is stated over `run.ingressSeq` rather than over an internal queue length, which is what makes it observable: the inbox's high-water mark is durable and reproducible from the inbox alone, so "within N rounds of the mark increasing" is a checkable claim rather than one that depends on when a scan happened to run.

## Load-time graph validation

Added under TASK-016. TASK-005 validates the whole task graph when it is loaded, and rejects an invalid graph with a named diagnostic rather than deadlocking at run time. It re-validates on every `TaskCreated` admission, because the graph grows dynamically.

### The expanded precondition graph

Acyclicity over scheduling edges alone is not sufficient, and proving it over that projection is what allowed the pre-merge deadlock to be missed. The validator builds `G*` over tasks, where an edge `T ← X` means "T cannot proceed until X has":

| Declared edge on T | Edges contributed to `G*` |
|---|---|
| `review_ready(X)` | `T ← X` |
| `gate_recorded(X)` | `T ← X` |
| `gate_passed(X, g, round n)` — target form | `T ← X`, and `T ← Gt` for the owner `Gt` of gate `g` on X at every declared round `>= n` |
| `gate_passed(L, g, lineageRound n)` — lineage form, **TASK-024** | `T ← Gt` for **every** gate task recording a round of lineage `L` at `lineageRound >= n`, and `T ← X` for every cohort member X those rounds gate |
| `integrated(X)` | `T ← X`, and `T ← Gt` for the owner of **every** gate in X's `preMergeGates` |
| `terminal(X)` | `T ← X`, the `integrated(X)` expansion, and `T ← Gt` for the owner of every gate in X's `gateTasks` |
| `human_decision(D)` | none; D is external and is satisfied or not, never by a task |
| a `gateFor` entry naming X on T | `T ← X` of kind `review_ready`, added implicitly if not already declared, because no gate can run before its target publishes. **TASK-024:** contributed once per entry, since `gateFor` is plural |

`G*` is acyclic if and only if the graph is schedulable. The **eight** no-deadlock invariants below apply to the complete projected task-record set in the immutable published target tree. No revision label or earlier amendment identifies that set. Invariants 1 through 5 originated under TASK-016 except where later edge forms changed; 6 through 8 were added under TASK-024 and their pair-property projection was completed under TASK-028.

1. The directed graph over `review_ready`, `integrated`, `gate_passed`, `gate_recorded`, `terminal`, and `human_decision` edges is acyclic. A lineage-form `gate_passed` edge expands, for this purpose, to the gate tasks recording lineage rounds `>=` its `lineageRound`.
2. No task holding a `gateFor` entry naming X also holds a `gate_passed` edge naming X, an `integrated(X)`, or a `terminal(X)` edge, nor a lineage-form `gate_passed` edge naming a lineage of which it itself records a round. It may hold `review_ready(X)`, which is satisfiable while X is still in `review` and unmerged.
3. Every `gateFor` entry has a matching `gateTasks` entry on the target and the reverse, agreeing on gate name, round, `gateClass`, `retrospective`, `gateLineage`, `lineageRound`, and `declaredVerdict`.
4. For every task X, no gate task owning a gate in X's `preMergeGates` holds an `integrated(X)` edge.
5. `G*` — the expansion above — is itself acyclic.
6. **Form resolution.** Every `gate_passed` edge declares exactly one of `task` and `lineage`. With `task`, the named task declares the gate in its `requiredGates` — the target form. With `lineage`, the named lineage is present in the register — the lineage form. The **owner form is withdrawn**: an edge naming a task that declares the gate only in a `gateFor` entry is rejected at load, with a message directing it to the lineage form.
7. **Gate scheduling properties.** Every `gateFor` / `gateTasks` pair declares `gateClass`, `retrospective`, and `declaredVerdict`; the declared `gateClass` equals the class computed from the owner's dependency set against the publication of the artifact that round reviews; the declared `retrospective` equals `gate ∉ target.preMergeGates`; both sides agree on the projected verdict; and every pair declaring `gateClass: 'aggregate'` or `retrospective: true` has an entry in the aggregate and retrospective gate register.
8. **Lineage well-formedness.** Every `gateFor` / `gateTasks` pair declares a `gateLineage` present in the register and a `lineageRound`. Within one lineage the gate name is constant, every declared `lineageRound` maps to exactly one gate task, the set of declared rounds is `1 … k` with no gap, and every target named by a pair in the lineage is a member of that lineage's registered cohort. A lineage round greater than 1 exists only if the preceding round recorded a verdict.

Invariant 5 is the one that catches the failure the scheduling-edge projection missed. Invariants 2 and 4 are the structural reasons it holds in practice: a gate task may depend on its target's publication and on nothing stronger, so no gate ever waits on a merge that waits on that gate. Invariant 6 is what makes the F-302 deadlock unrepresentable rather than merely discouraged, and invariant 8 is what makes the relation that survives supersession checkable at load rather than by inspection.

### Diagnostics

| Code | Invariant | Condition |
|---|---|---|
| `GRAPH_CYCLE_SCHEDULING` | 1 | The diagnostic names the cycle's tasks in order |
| `GRAPH_GATE_HOLDS_STRONG_EDGE` | 2 | Names the gate task, its target, and the offending edge kind |
| `GRAPH_GATE_PAIR_MISMATCH` | 3 | Names both sides and the disagreeing field, which may be any of the eight pair fields |
| `GRAPH_PREMERGE_GATE_AWAITS_MERGE` | 4 | Names the gate task and the target it would wait on |
| `GRAPH_CYCLE_EXPANDED` | 5 | Names the cycle in `G*` and the edge expansion that produced each hop |
| `GRAPH_UNKNOWN_TARGET` | 1, 6 | An edge names a task, lineage, or human decision that does not exist |
| `GRAPH_TERMINAL_EDGE_CYCLE` | 5 | A `terminal` edge whose expansion produces a cycle. The edge kind is reserved and this is the diagnostic that makes its misuse a rejection rather than a hang |
| `GRAPH_GATE_PASSED_FORM_AMBIGUOUS` | 6 | An edge declaring neither or both of `task` and `lineage` |
| `GRAPH_GATE_PASSED_OWNER_FORM` | 6 | The withdrawn owner form. The message names the lineage that carries the relation and the `lineageRound` the edge should name instead |
| `GRAPH_GATE_PASSED_UNKNOWN_LINEAGE` | 6 | A lineage-form edge naming a lineage absent from the register |
| `GRAPH_GATE_PASSED_GATE_NOT_REQUIRED` | 6 | A target-form edge naming a gate absent from the target's `requiredGates` |
| `GRAPH_GATE_CLASS_MISMATCH` | 7 | The declared `gateClass` differs from the computed class; names both and the reference publication |
| `GRAPH_RETROSPECTIVE_MISMATCH` | 7 | The declared `retrospective` differs from `gate ∉ target.preMergeGates` |
| `GRAPH_DELAYED_GATE_UNREGISTERED` | 7 | An `aggregate` or `retrospective: true` pair with no register entry |
| `GRAPH_LINEAGE_UNDECLARED` | 8 | A pair naming a lineage the register does not hold |
| `GRAPH_LINEAGE_GATE_INCONSISTENT` | 8 | The gate name is not constant within the lineage |
| `GRAPH_LINEAGE_ROUND_COLLISION` | 8 | Two gate tasks declaring the same `lineageRound` of one lineage |
| `GRAPH_LINEAGE_ROUND_GAP` | 8 | The declared rounds are not `1 … k` |
| `GRAPH_LINEAGE_COHORT_VIOLATION` | 8 | A pair whose target is not a member of the lineage's cohort |
| `GRAPH_LINEAGE_ROUND_PREMATURE` | 8 | A round *n* > 1 opened while round *n* − 1 has no recorded verdict |
| `GRAPH_PUBLICATION_CLASS_MISSING` | — | A task record omitting `publicationClass`. Declared-field completeness, not an invariant over edges |
| `GRAPH_BOOTSTRAP_CONTRACT_MISSING` | — | A recurring activation omits `bootstrapDispatchContract` or declares an unknown value |
| `GRAPH_GATE_VERDICT_DECLARATION_MISMATCH` | 3, 7 | The projected `verdict` differs across a `gate_for` / `gate_tasks` pair or contradicts an already-recorded authoritative round |

Rejection is a returned value on the load path, not a thrown error, and it names every violated invariant rather than the first one.

### Acyclicity of the current committed graph

The rule is normative; the numbers below are a TASK-036 publication snapshot. Enumerate tracked Markdown files under `tasks/`, select those whose first YAML front matter is a mapping containing `task_id`, project every selected record, pair `gate_tasks` and `gate_for` by their canonical eight fields, expand `G*` using the table above, and run Kahn's algorithm with task ID as its deterministic tie-breaker. Recompute this snapshot for every later published target.

The TASK-036 target enumeration yields 37 task records from 39 tracked task Markdown files; `TASK-001-DEPENDENCY-GRAPH.md` and `TASK-013-ACTIVATION-LOG.md` are the two support documents without `task_id`. The records' 130 relation documents form 65 exact forward/reverse pairs; 56 documents carry all three enrichment fields and none is partially enriched. Expansion yields 170 unique prerequisite edges. Kahn's algorithm consumes all 37 task nodes in this order:

```text
TASK-001, TASK-002, TASK-013, TASK-014, TASK-015, TASK-016, TASK-020,
TASK-021, TASK-022, TASK-023, TASK-024, TASK-025, TASK-027, TASK-028,
TASK-029, TASK-030, TASK-031, TASK-032, TASK-033, TASK-034, TASK-035,
TASK-036, TASK-037, TASK-018, TASK-019, TASK-003, TASK-004, TASK-017,
TASK-026, TASK-005, TASK-006, TASK-007, TASK-008, TASK-009, TASK-010,
TASK-011, TASK-012
```

- **Invariants 1 and 5.** Every expanded predecessor is consumed before its dependent. Consuming every node proves both the declared graph and `G*` acyclic.
- **Invariants 2 and 4.** For every gate relation, the validator derives prohibited strong edges and pre-merge ownership from the projected target; the target contains none.
- **Invariant 3.** All 65 canonical pairs occur once on each side and agree on all eight fields.
- **Invariant 6.** Every `gate_passed` edge resolves to exactly one legal target or lineage form; no owner-form edge exists.
- **Invariant 7.** Gate class, retrospective status, declared verdict, and delayed-gate registration are recomputed from the same projected records rather than copied from prose.
- **Invariant 8.** Lineage rounds are contiguous and uniquely owned. For `LIN-ARCH-REVIEW`, the target-derived cohort is TASK-002, TASK-016, TASK-024, TASK-028, TASK-032, TASK-034, and TASK-036; rounds 1 through 7 are uniquely owned by TASK-015, TASK-020, TASK-025, TASK-029, TASK-033, TASK-035, and TASK-037 respectively. Every round after the first follows a recorded predecessor verdict.

This snapshot proves the graph in the TASK-036 target tree only. TASK-005's `validateGraph` recomputes all eight invariants at load and on every admission; neither these values nor an earlier review report is an input to validation.

### Test obligations for A-004

1. **Edge satisfaction.** For each of the six edge kinds, a table test over target states asserting exactly when the edge is satisfied, including that `review_ready` is satisfied while the target is unmerged and that `integrated` is not satisfied while any `preMergeGate` is open.
2. **Gate rounds.** Record `changes-required` at round 1 and `approved` at round 2; assert the gate is closed, both verdicts are readable, and an attempt to rewrite round 1 is rejected.
3. **Gate durability.** Assert there is no code path — including recovery — that removes or mutates an existing `GateVerdictRecord`.
4. **Acyclicity.** Assert `GRAPH_CYCLE_EXPANDED` for a graph whose scheduling-edge projection is acyclic but whose expansion is not, which is the F-101 shape: a gate task on X holding `integrated(X)`.
5. **Resource locks.** Assert two tasks holding the same lock are never leased concurrently, that the second is returned to the ready set rather than queued, and that a lock is never treated as an ordering constraint.
6. **Idle quiescence.** With a quiescent activation task and a cursor equal to `run.ingressSeq`, assert `selectDispatchable` never returns it, across an unbounded number of rounds.
7. **Exactly-once activation.** Append an entry, dispatch the activation, crash between `TaskActivated` and the consumption batch, and assert the next activation consumes the identical range, that the cursor advances exactly once, that exactly one ledger row exists per entry, and that the effects are identical.
8. **Monotonic cursor.** Assert the cursor never decreases across a crash, a replay, or a recovery, and that an event proposing a decrease is rejected.
9. **No starvation.** With a saturated ready set and `maxConcurrentTasks` long-running tasks, append an ingress entry and assert the activation task is dispatched within `activationStarvationBoundRounds` rounds of a slot becoming free, and that reserved capacity never causes `maxConcurrentTasks` to be exceeded.
10. **Lossless projection agreement.** TASK-007 derives the task-record set from the immutable published tree and loads every member into `TaskRecordSourceDocument` without rejecting unknown nested keys. TASK-005 projects each through `TaskRecordProjection`; the fixture asserts one disposition per YAML leaf, canonical equality of `unproject(project(source))` with the entire source mapping, derived-field equality, and `validateGraph.ok` over the whole projected set. For every activation it derives omitted defaults and retained nested keys from the source; for gate relations it derives document, pair, complete-enrichment, and partial-enrichment totals and reports them without configuring literal expectations.

### Test obligations added for A-101 under TASK-024

11. **Eight invariants, each with its own diagnostic.** For every code in the diagnostics table, construct a graph violating exactly that invariant and assert the code is returned, that the graph is refused rather than stalled, and that a graph violating several returns several.
12. **Owner form is refused with a direction.** Assert `GRAPH_GATE_PASSED_OWNER_FORM` names the lineage and the `lineageRound` the edge should carry, so the diagnostic is actionable rather than merely correct.
13. **Lineage form survives supersession.** With `LIN-RUNTIME-QA` at lineage round 1 recording `changes-required` and a successor gate task recording `approved` at lineage round 2, assert TASK-012's unedited edge becomes satisfied, and assert that the equivalent owner-form edge would not have — the F-302 deadlock, exhibited as a test rather than as prose.
14. **Cohort growth.** Extend a lineage's cohort with a new artifact at a later lineage round. Assert the earlier round's coverage claim is unchanged, that no cohort member can be removed, and that the new pair's `round` and `lineageRound` may legitimately differ.
15. **Projected committed graph loads.** Enumerate every Markdown task record at the immutable target, require `load.ok`, `project.ok`, and exact inverse equality for each, then assert `validateGraph` returns `ok` with the eight invariants exercised by the real graph. Unknown future nested keys must round-trip as inert rather than fail as an unknown shape.
16. **Pre-selection ingress path.** Under `durable-bootstrap-append`, assert validator → collector append → high-water signal → observation all complete before `selectDispatchable`; make each step fail in turn and assert no selection occurs.
17. **Owned delivery.** Assert TASK-005 alone reads the inbox range, `WorkAssignment.ingressDelivery` equals `AgentInvocation.ingress`, and the ledger projection covers the identical entries without a second read.

## Observable pre- and post-conditions

| Claim | How it is observed |
|---|---|
| Global limit is never exceeded | After any successful append, `count(state in {leased, running}) <= maxConcurrentTasks` |
| Per-role limit is never exceeded | The same count grouped by `ownerRole` is `<= maxConcurrentTasksPerRole` |
| No overlapping scopes in flight | For every pair of leased or running tasks, their `writeScope` sets do not intersect |
| No shared resource lock in flight | For every pair of leased or running tasks, their `resourceLock` values are not equal |
| Dependencies gate dispatch | No task reaches `leased` unless every dependency **edge** is satisfied under its typed condition |
| A quiescent task is never dispatched | With the cursor equal to `run.ingressSeq`, the task never appears in a candidate list |
| An activated task is dispatched promptly | After `run.ingressSeq` increases, the task appears in a candidate list within the starvation bound of a slot becoming free |
| An invalid graph is refused, not stalled | A graph violating any of the **eight** no-deadlock invariants is rejected at load with a named diagnostic |
| Consumption state has one home | For every activation task, no field other than `activation.lastConsumedEventSeq` changes when a range is consumed, and no field other than the ledger records which entries it covered |
| The inbox high-water mark never falls | Across branch deletion, force-push, rebase, and a clock moved backwards, `run.ingressSeq` is non-decreasing |
| Tokens strictly increase per task | For each task, the sequence of `fencingToken` values across its `LeaseGranted` events is strictly increasing |
| Stale writes are rejected | An append with a superseded token returns `StaleFencingToken` and changes nothing |
| Reclaim happens once | Between two `LeaseGranted` events for the same task there is at most one `LeaseExpired` or `LeaseReleased` event |
| Dispatch order is deterministic | Two calls with the same record and `now` return equal lists |

## Diagrams

- [Dispatch and fencing sequence](../../../diagrams/architecture/runtime-sequences.md)
