---
task_id: TASK-006
title: Implement the supervisor core and deterministic state machine
status: blocked
owner_role: runtime
llm: claude
branch: agent/claude/runtime/task-006
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/claude-runtime-task-006
write_scope:
  - src/orchestrator/supervisor/**
  - tests/unit/orchestrator/supervisor/**
dependencies:
  - TASK-002
  - TASK-003
  - TASK-005
required_gates:
  - review
  - security
  - qa
  - performance
parent_task: TASK-001
blocked_reason: The state machine contract is not approved and the state store and scheduler do not exist yet.
exit_condition: TASK-002 passes its review gate and TASK-003 and TASK-005 are complete.
---

# TASK-006: Implement the supervisor core and deterministic state machine

## Objective

Implement the supervisor run loop and the deterministic task state machine that drives a project run from start to a terminal completion state, aggregating worker results into durable state.

## Scope

- Implement the run and task state machine defined by TASK-002 as an explicit transition function that rejects illegal transitions.
- Implement the supervisor loop that requests dispatchable work from the scheduler, invokes agent workers, and applies results to durable state under the holder's fencing token.
- Implement result aggregation, including how a worker outcome advances, fails, or blocks a task.
- Implement run completion detection and the terminal run states for success, failure, and cancellation.
- Emit structured run events for observability without writing secrets or provider payload credentials.
- Provide unit tests using fake scheduler, fake state store, and fake workers.
- Exclude lifecycle command handling, the bootstrap entry point, retry policy, timeout policy, and crash recovery.

## Acceptance criteria

- [ ] Every state transition is validated by a single transition function, and an illegal transition is rejected rather than applied.
- [ ] Replaying the same ordered event sequence produces an identical final run state.
- [ ] Worker results are applied to durable state only with a currently valid fencing token.
- [ ] Run completion is detected exactly once and produces exactly one terminal run state.
- [ ] The supervisor never invokes a provider directly and never bypasses the scheduler's concurrency limits.
- [ ] Emitted run events contain no credentials or secret values.
- [ ] Unit tests cover legal and illegal transitions, deterministic replay, stale-token result rejection, and each terminal completion path.
- [ ] All changed files remain inside this task's declared write scope.

## Expected artifacts

- Supervisor loop, transition function, and result aggregation under `src/orchestrator/supervisor/`.
- Unit tests under `tests/unit/orchestrator/supervisor/`.

## Dependency notes

- Depends on TASK-002, TASK-003, and TASK-005.
- Blocks TASK-007 and TASK-008.

## Handoff

- Commit or pull request:
- Verification:
- Known risks:
- Next owner: orchestrator, to unblock TASK-007 and TASK-008 and to route the change into TASK-009, TASK-010, and TASK-012
