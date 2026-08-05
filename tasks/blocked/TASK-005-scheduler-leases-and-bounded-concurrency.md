---
task_id: TASK-005
title: Implement scheduling, leases, fencing tokens, and bounded concurrency
status: blocked
owner_role: runtime
llm: claude
branch: agent/claude/runtime/task-005
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/claude-runtime-task-005
write_scope:
  - src/orchestrator/scheduling/**
  - tests/unit/orchestrator/scheduling/**
dependencies:
  - task: TASK-016
    edge: gate_passed
    gate: review
  - task: TASK-003
    edge: integrated
  - task: TASK-004
    edge: integrated
required_gates:
  - review
  - security
  - qa
  - performance
pre_merge_gates: []
gate_tasks:
  - task: TASK-009
    gate: review
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
  - task: TASK-010
    gate: security
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
  - task: TASK-011
    gate: qa
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
  - task: TASK-012
    gate: performance
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
parent_task: TASK-001
publication_class: runtime
normative_architecture_source: 9576fc9 as amended by the TASK-016 commit that TASK-020 approves
remediates:
  - finding: F-104
    source: reports/code-review/TASK-001-DECOMPOSITION-REVIEW.md
  - finding: F-201
    source: reports/code-review/TASK-001-DECOMPOSITION-REVIEW-ROUND-3.md
blocked_reason: TASK-015 returned changes-required on the base architecture, so the lease, fencing, and typed-dependency contracts are not approved; finding A-004 defines the edge, gate, resource-lock, and recurring-activation semantics this task enforces. Neither the durable state store nor the worker result contract is integrated.
exit_condition: TASK-020 records a passing verdict on the TASK-016 amendment, and TASK-003 and TASK-004 are integrated into integration/autonomous-runtime.
---

# TASK-005: Implement scheduling, leases, fencing tokens, and bounded concurrency

## Objective

Implement the scheduler that selects ready tasks, enforces a bounded concurrency limit, and grants time-bounded execution leases protected by monotonic fencing tokens.

## Scope

- Implement ready-task selection over the typed dependency edges defined in `tasks/TASK-001-DEPENDENCY-GRAPH.md` — `review_ready`, `integrated`, `gate_passed` with a named gate and round, `gate_recorded`, `human_decision`, and `terminal` — so that review readiness, integration readiness, gate closure, and terminal completion are four distinct conditions and a review gate can start while its target is still unmerged.
- Implement `pre_merge_gates` evaluation, so that `integrated(X)` is satisfied only when X is `review_ready`, every gate in X's `pre_merge_gates` is closed, and X's branch is merged into the integration branch.
- Implement gate rounds: the status of a gate is the verdict at its highest round, a verdict is durable and is superseded rather than rewritten, and a gate is closed only by a passing or formally accepted verdict at the highest round.
- Implement both forms of `gate_passed` and the resolution rule that disambiguates them: the target form, where the named task declares the gate in its `required_gates`, and the owner form, where the named task declares the gate in a `gate_for` entry and the edge is satisfied only by a **passing or formally accepted** verdict. `gate_recorded` remains satisfied by any verdict, including `changes-required`.
- Implement the graph validator that rejects, at load time, a graph containing a cycle over scheduling edges; a gate task holding a `gate_passed`, `integrated`, or `terminal` edge to a task it gates; an unmatched `gate_for` / `gate_tasks` pair; a pre-merge gate owner holding an `integrated` edge to its own target; a cycle in the relation produced by expanding each `integrated` edge into `review_ready` plus its target's pre-merge gate owners; a `gate_passed` edge whose form is ambiguous or unresolvable; or a gate pair whose declared `gate_class` disagrees with the class computed from the owner's dependency set, or whose `aggregate` or `retrospective` declaration has no entry in the aggregate and retrospective gate register.
- Implement write-scope exclusion at admission, so two concurrently leased tasks never hold overlapping write scopes or the same declared resource lock.
- Implement the **event-ingress observer** for tasks that declare an `activation` block, as specified in `tasks/blocked/TASK-013-task-record-lifecycle-and-gate-closure.md` and `tasks/TASK-001-DEPENDENCY-GRAPH.md`, section "TASK-013 activation and event-ingress model": enumerate the ingress source set, order the observed facts deterministically by committer timestamp then commit SHA, compute `ingress_seq` as the count, and dispatch only when `ingress_seq > last_consumed_event_seq`, with a `quiescent` waiting state when they are equal.
- Implement the consumption model finding F-201 requires: the per-task cursor is the **only** representation of consumption state, the consumption ledger is append-only and is written by the consuming activation, and the observer never mutates a ledger row and never treats a ledger field as the dispatch signal.
- Implement the one-commit rule: an activation's effects, its ledger rows for the consumed range, and its cursor advance either all land in one commit or none of them do.
- Implement a configurable global and per-role concurrency limit that is never exceeded.
- Implement lease acquisition, renewal, expiry, and release against the durable state store from TASK-003.
- Implement monotonic fencing tokens so a write from an expired lease holder is rejected by the state store.
- Implement lease-expiry detection that returns an abandoned task to the ready set exactly once.
- Implement deterministic and reproducible dispatch ordering for equally eligible tasks.
- Provide unit tests using a fake clock and the real state contract.
- Exclude run supervision, provider invocation, lifecycle commands, retry policy, and crash-recovery orchestration.

## Acceptance criteria

- [ ] The number of concurrently leased tasks never exceeds the configured global limit, and per-role limits are independently enforced.
- [ ] A task is dispatched only when every declared dependency edge is satisfied under the typed edge vocabulary in `tasks/TASK-001-DEPENDENCY-GRAPH.md`: `review_ready`, `integrated`, `gate_passed`, `gate_recorded`, `terminal`, and `human_decision` each have a distinct satisfying condition, and `gate_for` is not a scheduling edge.
- [ ] `review_ready(X)` is satisfied while X is unmerged, and `integrated(X)` is not satisfied until every gate in X's `pre_merge_gates` is closed and X's branch is merged. A test asserts that a pre-merge gate owner is dispatched before its target is integrated.
- [ ] A `gate_for` declaration never gates dispatch of the task that declares it, so a gate task becomes dispatchable while its target is still in `review`.
- [ ] Gate closure uses the highest recorded round. A test asserts that a `changes-required` verdict at round *n* leaves the gate open, that a passing verdict at round *n+1* closes it, and that the round *n* verdict is still readable afterwards.
- [ ] A single verdict recorded by a gate task holding more than one `gate_for` relation is applied **atomically** to every relation it carries, producing one durable gate-verdict fact per relation. A test asserts that a partial application — one relation closed while another stays open from the same verdict — is not representable.
- [ ] The owner form of `gate_passed` is satisfied only by a passing or formally accepted verdict. A test asserts that `gate_passed(G, g, n)` is unsatisfied while G's highest recorded round for `g` is `changes-required`, that `gate_recorded(G)` is satisfied by that same verdict, and that a passing verdict at a later round satisfies the round-`n` edge.
- [ ] A `gate_passed` edge that resolves to both forms, or to neither, is rejected at load time as ambiguous.
- [ ] Every gate pair's declared `gate_class` is recomputed from the owner's dependency set and compared, and every pair declaring `gate_class: aggregate` or `retrospective: true` is checked against the register. A disagreement or a missing register entry is rejected at load time.
- [ ] A no-deadlock test asserts that for the full TASK-001 graph every task eventually becomes dispatchable, and that each of these graphs is rejected at load time as invalid: a scheduling cycle; a gate task holding `gate_passed`, `integrated`, or `terminal` to its own gate target; an unmatched `gate_for` / `gate_tasks` pair; a pre-merge gate owner holding `integrated` to its own target; a cycle produced by expanding `integrated` edges into `review_ready` plus pre-merge gate owners; an ambiguous `gate_passed` form; and an unregistered or misdeclared gate class.
- [ ] Each lease carries a fencing token that is strictly greater than every previously issued token for the same task.
- [ ] A write attempted with a stale fencing token is rejected, and the rejection is observable.
- [ ] An expired lease returns its task to the ready set exactly once, with no duplicate dispatch.
- [ ] Dispatch order for equally eligible tasks is deterministic under a fixed input and fixed clock.
- [ ] Unit tests cover limit enforcement, dependency gating, lease renewal, lease expiry, stale-token rejection, and duplicate-dispatch prevention using a fake clock.
- [ ] All changed files remain inside this task's declared write scope.

### Event ingress and recurring activation

These criteria remediate finding F-104 in `reports/code-review/TASK-001-DECOMPOSITION-REVIEW.md`, which recorded that a recurring task with no dependencies and no defined activation is seen by the scheduler as continuously dispatchable, and finding **F-201** in `reports/code-review/TASK-001-DECOMPOSITION-REVIEW-ROUND-3.md`, which recorded that the revision-3 replacement contained a wake-up deadlock and an impossible consumption representation.

- [ ] **Ingress observation.** The observer enumerates the ingress source set, orders the observed facts by committer timestamp and then by commit SHA, and computes `ingress_seq` as the count. A test asserts that two independent observations of the same repository state produce the same `ingress_seq` and the same order, including when two facts share a timestamp.
- [ ] **No self-trigger requirement.** A test asserts that `ingress_seq` increases when a fact is produced **solely** by a writer whose configured scope excludes the recurring task's own write scope — for example a gate report commit under `reports/**` raising the signal for a task scoped to `tasks/**`. This is the property whose absence was finding F-201.
- [ ] **Cursor is the only consumption state.** A test asserts that the observer's dispatch decision is unchanged by any field in the consumption ledger, that no ledger row is ever written or modified by the observer, and that removing a `consumed_by` value from a row changes nothing about dispatchability.
- [ ] **Idle quiescence.** A recurring task whose cursor equals `ingress_seq` is never selected. A test runs the scheduler for a bounded number of rounds against a graph containing a quiescent recurring task and a saturated ready set, and asserts zero dispatches of the recurring task.
- [ ] **Exactly-once consumption.** Each observed fact is consumed by exactly one activation. A test produces N ingress facts, runs activations to completion, and asserts that exactly N ledger rows exist, each written once and each naming exactly one consuming activation, and that the cursor advanced by exactly the consumed range.
- [ ] **Crash between dispatch and cursor advance.** A test simulates a crash after the activation's effects are computed but before its commit lands, re-runs the activation, and asserts the same effects, the same ledger rows, and the same final cursor — no double advance, no skipped fact, no duplicated effect, no orphaned row.
- [ ] **Monotonic cursor and upper bound.** The cursor never decreases. A load-time test rejects a ledger with a duplicate, out-of-order, or non-increasing `seq`, rejects a cursor greater than `ingress_seq`, and rejects an edit to an existing ledger row.
- [ ] **No starvation.** With a continuously saturated ready set, a new ingress fact causes the recurring task to be dispatched within a stated bounded number of scheduling rounds. The test asserts the bound rather than eventual dispatch.
- [ ] **No continuous redispatch after release.** Releasing a recurring task without a new ingress fact returns it to `quiescent`. A test asserts zero further dispatches over a bounded number of rounds.

The end-to-end path — gate report publication, ingress observation, dispatch, effects commit, cursor advance, and return to quiescence — is validated independently by **TASK-011** as `V11-A004-ACT`. These unit criteria do not substitute for it.

## Expected artifacts

- Scheduler, lease manager, concurrency limiter, graph validator, event-ingress observer, and recurring-activation cursor under `src/orchestrator/scheduling/`.
- Unit tests under `tests/unit/orchestrator/scheduling/`, including the no-deadlock, gate-form-resolution, gate-class, gate-round, atomic multi-relation verdict, ingress determinism, no-self-trigger, cursor-only-consumption, quiescence, exactly-once, crash-replay, monotonic-cursor, and starvation-bound tests.

## Dependency notes

- `gate_passed(TASK-016, review)` supplies the leasing, fencing, concurrency, and write-scope-exclusion contract from `docs/architecture/runtime/LEASES-AND-SCHEDULING.md`, together with the typed edge, gate-verdict, resource-lock, and event-ingress activation contracts that TASK-016 adds under finding A-004. That gate is owned by TASK-020. The normative source is those documents at `9576fc9` **as amended by the TASK-016 commit that TASK-020 approves**, never the rejected baseline alone.
- `integrated(TASK-003)` supplies the versioned durable state store and `src/orchestrator/state/contracts/`.
- `integrated(TASK-004)` supplies the worker result and work assignment contract from `src/agents/contracts/`. This task consumes TASK-004's contract at compile time and must not start before it is integrated. This task imports from `src/agents/contracts/` only and never modifies `src/agents/`.
- This task owns enforcement of the activation and ingress semantics TASK-013 declares. It does not own the task-record surface those semantics operate on; `tasks/**` is outside the runtime role's configured write scope. It also never produces an ingress fact for TASK-013: producing one is the job of whichever owner publishes its own artifact.
- Blocks TASK-006.
- May execute in parallel with TASK-017; their write scopes do not overlap.

## Task-record lifecycle

This record's `status` field and its lifecycle directory are changed only by the Orchestrator under TASK-013. `tasks/**` is outside this role's configured write scope, so the owner of this task must not move or edit this file. Record the handoff in the commit message and the pull request description; the Orchestrator transcribes it into the section below.

## Handoff

Maintained by the Orchestrator under TASK-013 from the owner's commit and pull request.

- Commit or pull request:
- Verification:
- Known risks:
- Next owner: orchestrator via TASK-013, to unblock TASK-006 and to route the change into TASK-009, TASK-010, and TASK-012
