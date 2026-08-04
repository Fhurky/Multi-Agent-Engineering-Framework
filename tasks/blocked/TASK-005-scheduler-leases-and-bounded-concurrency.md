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
  - TASK-002
  - TASK-003
required_gates:
  - review
  - security
  - qa
  - performance
parent_task: TASK-001
blocked_reason: The lease and fencing contract is not approved and the durable state store does not exist yet.
exit_condition: TASK-002 passes its review gate and TASK-003 exposes a versioned durable state store.
---

# TASK-005: Implement scheduling, leases, fencing tokens, and bounded concurrency

## Objective

Implement the scheduler that selects ready tasks, enforces a bounded concurrency limit, and grants time-bounded execution leases protected by monotonic fencing tokens.

## Scope

- Implement ready-task selection that honors declared task dependencies and never dispatches a task whose dependencies are unmet.
- Implement a configurable global and per-role concurrency limit that is never exceeded.
- Implement lease acquisition, renewal, expiry, and release against the durable state store from TASK-003.
- Implement monotonic fencing tokens so a write from an expired lease holder is rejected by the state store.
- Implement lease-expiry detection that returns an abandoned task to the ready set exactly once.
- Implement deterministic and reproducible dispatch ordering for equally eligible tasks.
- Provide unit tests using a fake clock and the real state contract.
- Exclude run supervision, provider invocation, lifecycle commands, retry policy, and crash-recovery orchestration.

## Acceptance criteria

- [ ] The number of concurrently leased tasks never exceeds the configured global limit, and per-role limits are independently enforced.
- [ ] A task is dispatched only when every declared dependency has reached a satisfying terminal state.
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

- Depends on TASK-002 for the leasing and fencing contract and on TASK-003 for versioned durable state.
- Blocks TASK-006.
- Consumes the worker result contract from TASK-004 without modifying `src/agents/`.

## Handoff

- Commit or pull request:
- Verification:
- Known risks:
- Next owner: orchestrator, to unblock TASK-006 and to route the change into TASK-009, TASK-010, and TASK-012
