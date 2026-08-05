# ADR-0015: Typed scheduling, gate, resource-lock, and activation contracts

- Status: Accepted
- Date: 2026-08-05
- Deciders: Solution Architect under TASK-016
- Affects: TASK-005 implements and enforces; TASK-003 declares; TASK-006 admits and applies; TASK-013's activation model becomes representable
- Extends: [ADR-0003](0003-deterministic-run-and-task-state-machine.md) — the task state set gains `quiescent`, and the event union grows from 25 to 44 members across this amendment. ADR-0003's single-pure-transition-function decision and its three named choices stand unchanged.

## Context

Finding A-004 in `reports/code-review/TASK-002-ARCHITECTURE-REVIEW.md`, rated high, established that the runtime contracts cannot represent the task graph the runtime is scheduled by.

The contracts modelled a dependency as a `TaskId`, satisfied only when the target task is `succeeded`. The corrected decomposition in `tasks/TASK-001-DEPENDENCY-GRAPH.md` uses typed edges with distinct satisfying conditions, per-task declarations of which gates block integration, durable gate verdicts that supersede across rounds, named resource locks, and a monotonic event-triggered activation model. None of it had a representation: no edge type, no target condition, no gate verdict, no recurring activation, no waiting state, no resource lock.

Implementing the architecture as written would fail in one of two directions depending on how "succeeded" was interpreted. Read strictly, a pre-merge review gate waits for its target to succeed while the target's merge waits for the gate — the F-101 deadlock. Read loosely, a consumer is released as soon as its dependency's worker returns, before that dependency's blocking gate has passed. And a recurring lifecycle task with no waiting state is permanently dispatchable, which redispatches it after every release and starves the ready set — the F-104 livelock.

The graph is not an aspiration; it is committed, it is what TASK-013 maintains, and the runtime must execute it without any task record being restated.

## Decision

**Six typed dependency edges**, named and conditioned exactly as `tasks/TASK-001-DEPENDENCY-GRAPH.md` names and conditions them: `review_ready`, `integrated`, `gate_passed` with a gate name, `gate_recorded`, `human_decision`, and `terminal`. The satisfying conditions are normative in [STATE-MACHINE.md](../architecture/runtime/STATE-MACHINE.md#typed-dependency-edges).

Two properties do the load-bearing work. `review_ready` is satisfied by a durable publication record — an immutable commit on a published task branch — while the target is still unmerged, so a gate task is schedulable before its target merges. `integrated` expands to include every gate in the target's `pre_merge_gates`, so a consumer is not released before its dependency's blocking gates close.

**`pre_merge_gates` as a per-task declaration**, a subset of `required_gates`. The remainder are assembly gates: they run after merge and block only `done`. A task with an empty `pre_merge_gates` is integrable as soon as it is `review_ready` and reached in merge order.

**Gate verdicts are durable and supersede rather than rewrite.** `gateVerdicts` is append-only; gate status is the verdict at the highest round; closure requires `approved`, or `approved-with-findings` with zero open blocking findings, or a recorded formal human acceptance. Durability is structural: no event in the union expresses removing or mutating a verdict, and `applyEvent` rejects a duplicate `(gate, round)` pair, a non-increasing round, a self-gating task, and a gate task recording a second verdict for the same target and gate at a lower round.

**Named resource locks** serialize tasks whose scopes cannot be made disjoint. At most one holder may be leased or running; a lock is not a dependency and contributes no edge; the scheduler refuses admission and returns the candidate to the ready set rather than queueing behind it, so there is no lock-ordering deadlock to reason about.

**A `quiescent` task state**, distinct from `blocked`. `blocked` waits on a decision a human or another role must make and carries a reason an operator must read. `quiescent` waits on an event the runtime itself appends, and its exit condition is a comparison of two integers. Only a task declaring an `activation` block may enter it.

**Monotonic event-triggered activation.** `run.activationEvents` is append-only with a strictly increasing `seq` and a closed six-member `ActivationEventType` set matching the graph name for name. A task's cursor is monotonically non-decreasing. Dispatch requires `max(subscribed seq) > lastConsumedEventSeq`. `TaskActivated` records only the **intent** to consume through a bound; the cursor advances only in the append that carries `WorkerSucceeded`, so a crash between them leaves the same range to be consumed again with identical effects.

**A starvation bound with reserved capacity.** While an activatable task exists, the effective global capacity for ordinary candidates is reduced by `reservedControlPlaneSlots`, and an activatable task must be selected within `activationStarvationBoundRounds` rounds of a slot becoming free. Ordering alone would not bound starvation, because a saturated ready set can hold every slot indefinitely.

**Acyclicity is proven over the expanded precondition graph, not over scheduling edges alone.** `gate_passed(X, g)` expands to include the owner of gate `g`; `integrated(X)` expands to include the owners of every gate in X's `pre_merge_gates`; a `gateFor` relation contributes an implicit `review_ready` edge. TASK-005 validates the five no-deadlock invariants at load and on every admission, and **rejects** a violating graph with a named diagnostic rather than deadlocking at run time. Proving acyclicity over the scheduling projection alone is precisely what allowed F-101 to be missed.

**`terminal` is reserved and defined.** It is satisfied when the target is succeeded, integrated, and has every gate closed. It is defined rather than omitted so that its misuse produces `GRAPH_TERMINAL_EDGE_CYCLE` at load instead of a hang.

**Publication policy is explicit.** `review_ready` requires `publication: 'published'`. A `local-only` publication satisfies it only when `limits.allowLocalOnlyPublication` is true, which is an operator-recorded acceptance of a bootstrap-phase limitation and is never a default and never inferred.

## Alternatives considered

**Keep `TaskId[]` and encode the edge kind in a naming convention or a side table.** Smallest contract change. Rejected: it moves the type into a string, so the compiler stops helping exactly where six variants with different satisfying conditions need to be exhaustively handled. The whole reason ADR-0001 chose a typed language was that six parallel tasks share a checkable contract.

**Model only two edges — `review_ready` and `integrated` — and express gates as ordinary dependencies.** Simpler, and covers F-101. Rejected: `gate_passed` and `gate_recorded` have genuinely different conditions. `gate_passed(TASK-016, review)` requires a verdict of a specific quality at the highest round; `gate_recorded(TASK-015)` is satisfied by a `changes-required` verdict, which is exactly why TASK-016 could be scheduled at all. Collapsing them would make the remediation path unschedulable.

**Store gate status as a mutable field updated by each round.** Much simpler to query. Rejected: it destroys the durability property the graph depends on. TASK-014's and TASK-015's `changes-required` verdicts are permanent facts about the artifacts they reviewed, and a later round supersedes rather than erases them. A mutable field also invites a recovery path that silently overwrites a verdict, which no reviewer could then detect.

**Let a gate task be re-entered for a later round instead of creating a new task.** Fewer task records. Rejected: it is the F-102 defect. A re-entrant gate task carries an undeclared per-round dependency, and the runtime has no way to express "this task depends on TASK-016 for round 2 but not for round 1". A new task per round makes each round's dependency explicit and its verdict durable.

**Derive resource-lock exclusion from write-scope overlap and drop the separate concept.** One mechanism instead of two. Rejected: a lock also serializes tasks whose globs do not obviously overlap and whose conflict is semantic. Conversely, an over-approximating scope comparison would serialize tasks that do not conflict. They are different constraints and the graph declares them separately.

**Model a resource lock as a dependency edge.** It would need no new admission gate. Rejected: a lock constrains concurrency, not order, and modelling it as order would impose an arbitrary sequence between two tasks that may run in either order — and would put lock edges into the acyclicity proof, where a mutual lock would read as a cycle.

**Give the recurring task a timer instead of a cursor.** The obvious reading of "recurring". Rejected: it is F-104 with extra steps. A timer redispatches work with nothing to do, and it makes exactly-once consumption unexpressible, because there is no record of what was consumed.

**Reuse `blocked` for the quiescent state.** No new state. Rejected: `blocked` drives exit code 3, "this run is waiting on a human". A run whose only remaining task is an idle control-plane task is waiting on nobody, and reporting it as needing adjudication would make the exit code meaningless. The completion predicates also need to distinguish them: a quiescent task with no unconsumed event is settled, and a blocked task is not.

**Advance the activation cursor at dispatch rather than at success.** Simpler, and avoids a pending field. Rejected: a crash between dispatch and result would skip the range permanently, silently dropping a lifecycle transition. Advancing at success can only re-consume, and re-consumption is safe because every transition the control plane performs is idempotent. Losing an event is not recoverable; repeating one is.

## Consequences

Positive:

- The committed task graph becomes executable without any task record being restated, which was A-004's stated acceptance condition.
- Both deadlock shapes are structurally excluded, and a graph that would deadlock is rejected at load with a diagnostic naming the cycle.
- Gate verdicts become permanent evidence with no code path that can rewrite them, which is what an independent review gate is worth.
- Idle control-plane work costs nothing, and an activation event cannot be lost, consumed twice with effect, or starved indefinitely.
- The runtime's vocabulary and the Orchestrator's vocabulary are the same words, so a drift between the graph document and the contracts is visible as a compile error rather than as a scheduling bug.

Negative:

- `TaskRecord` grows by nine fields, and `RuntimeEvent` grows from 25 to 44 members across this amendment. TASK-003 transcribes more, TASK-006 handles more cases, and every reviewer reads more. The alternative was a contract that cannot express the graph.
- Seventeen of the nineteen new events change no state field. They are durable facts rather than transitions, which required loosening the "exactly one task or the run changed state" post-condition to "at most one". The `stateVersion`-advances-by-one property, on which fencing depends, is untouched.
- Edge evaluation is more expensive than an identifier comparison, and `integrated` requires reading the target's gate set. Scheduling runs between agent invocations that take minutes, so this is not a throughput concern.
- Reserved control-plane capacity slightly reduces throughput when an activation is pending. That is the price of a bounded starvation guarantee, and the reservation is one slot by default.
- `allowLocalOnlyPublication` is a footgun if set carelessly: it lets a gate be scheduled against a commit no independent context can read. It defaults to false, must be set explicitly, and its use is recorded in the publication record with a reason.
