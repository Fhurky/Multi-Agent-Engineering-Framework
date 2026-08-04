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
  - task: TASK-002
    edge: gate_passed
  - task: TASK-003
    edge: implementation_published
  - task: TASK-004
    edge: implementation_published
required_gates:
  - review
  - security
  - qa
  - performance
gate_tasks:
  - task: TASK-009
    gate: review
  - task: TASK-010
    gate: security
  - task: TASK-011
    gate: qa
  - task: TASK-012
    gate: performance
parent_task: TASK-001
blocked_reason: The lease and fencing contract is not approved, and neither the durable state store nor the worker result contract has been published.
exit_condition: TASK-015 records a passing verdict on TASK-002, and TASK-003 and TASK-004 are published on main.
---

# TASK-005: Implement scheduling, leases, fencing tokens, and bounded concurrency

## Objective

Implement the scheduler that selects ready tasks, enforces a bounded concurrency limit, and grants time-bounded execution leases protected by monotonic fencing tokens.

## Scope

- Implement ready-task selection over the typed dependency edges defined in `tasks/TASK-001-DEPENDENCY-GRAPH.md`, so that gate readiness and terminal completion are evaluated separately and a review gate can start while its target is still in `review`.
- Implement the graph validator that rejects a task graph containing a cycle over scheduling edges, or a gate task holding a `terminal` edge to a task it gates.
- Implement write-scope exclusion at admission, so two concurrently leased tasks never hold overlapping write scopes or the same declared resource lock.
- Implement a configurable global and per-role concurrency limit that is never exceeded.
- Implement lease acquisition, renewal, expiry, and release against the durable state store from TASK-003.
- Implement monotonic fencing tokens so a write from an expired lease holder is rejected by the state store.
- Implement lease-expiry detection that returns an abandoned task to the ready set exactly once.
- Implement deterministic and reproducible dispatch ordering for equally eligible tasks.
- Provide unit tests using a fake clock and the real state contract.
- Exclude run supervision, provider invocation, lifecycle commands, retry policy, and crash-recovery orchestration.

## Acceptance criteria

- [ ] The number of concurrently leased tasks never exceeds the configured global limit, and per-role limits are independently enforced.
- [ ] A task is dispatched only when every declared dependency edge is satisfied under the typed edge vocabulary in `tasks/TASK-001-DEPENDENCY-GRAPH.md`: `gate_passed`, `implementation_published`, `terminal`, and `human_decision` each have a distinct satisfying condition, and `gate_for` is not a scheduling edge.
- [ ] A `gate_for` declaration never gates dispatch of the task that declares it, so a gate task becomes dispatchable while its target is still in `review`.
- [ ] A no-deadlock test asserts that for the full TASK-001 graph every task eventually becomes dispatchable, and that a graph containing a `terminal` edge from a gate task to its own gate target is rejected at load time as an invalid graph.
- [ ] Each lease carries a fencing token that is strictly greater than every previously issued token for the same task.
- [ ] A write attempted with a stale fencing token is rejected, and the rejection is observable.
- [ ] An expired lease returns its task to the ready set exactly once, with no duplicate dispatch.
- [ ] Dispatch order for equally eligible tasks is deterministic under a fixed input and fixed clock.
- [ ] Unit tests cover limit enforcement, dependency gating, lease renewal, lease expiry, stale-token rejection, and duplicate-dispatch prevention using a fake clock.
- [ ] All changed files remain inside this task's declared write scope.

## Expected artifacts

- Scheduler, lease manager, and concurrency limiter under `src/orchestrator/scheduling/`.
- Unit tests under `tests/unit/orchestrator/scheduling/`.

## Dependency notes

- `gate_passed(TASK-002)` supplies the leasing, fencing, concurrency, and write-scope-exclusion contract from `docs/architecture/runtime/LEASES-AND-SCHEDULING.md`.
- `implementation_published(TASK-003)` supplies the versioned durable state store and `src/orchestrator/state/contracts/`.
- `implementation_published(TASK-004)` supplies the worker result and work assignment contract from `src/agents/contracts/`. This edge was missing in the first decomposition; this task consumes TASK-004's contract and must not start before it is published. This task imports from `src/agents/contracts/` only and never modifies `src/agents/`.
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
