---
task_id: TASK-003
title: Implement durable run state and checkpointing
status: blocked
owner_role: runtime
llm: claude
branch: agent/claude/runtime/task-003
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/claude-runtime-task-003
write_scope:
  - src/orchestrator/state/**
  - tests/unit/orchestrator/state/**
dependencies:
  - TASK-002
required_gates:
  - review
  - security
  - qa
parent_task: TASK-001
blocked_reason: The durable state contract is not approved yet.
exit_condition: TASK-002 passes its review gate and its durable state and checkpoint contracts are recorded.
---

# TASK-003: Implement durable run state and checkpointing

## Objective

Implement the durable run state store that persists run and task records, writes checkpoints, and restores a consistent run snapshot after an abrupt process termination.

## Scope

- Implement the run and task record persistence defined by TASK-002.
- Implement atomic, crash-safe writes so that a partially written checkpoint can never be read as a valid checkpoint.
- Implement checkpoint creation, checkpoint listing, and restore-from-latest-consistent-checkpoint.
- Implement monotonic sequence or version numbering that the scheduler can use as a fencing source.
- Implement optimistic concurrency or compare-and-set semantics so two writers cannot silently overwrite each other.
- Provide unit tests for durability, atomicity, restore correctness, and concurrent write rejection.
- Exclude scheduling, supervision, provider calls, lifecycle commands, and recovery orchestration.

## Acceptance criteria

- [ ] Run and task state is persisted in the format defined by TASK-002 and survives process termination.
- [ ] A checkpoint write is atomic; an interrupted write leaves the last valid checkpoint readable and unchanged.
- [ ] Restore returns the latest consistent checkpoint and reports the state version it restored.
- [ ] Concurrent conflicting writes are rejected rather than silently merged, and the rejection is observable to the caller.
- [ ] Version or sequence numbers are strictly monotonic per run.
- [ ] Unit tests cover atomic write interruption, restore after simulated crash, monotonic versioning, and conflicting-write rejection.
- [ ] No secrets, credentials, or provider tokens are persisted in state or checkpoint records.
- [ ] All changed files remain inside this task's declared write scope.

## Expected artifacts

- Durable state implementation under `src/orchestrator/state/`.
- Unit tests under `tests/unit/orchestrator/state/`.

## Dependency notes

- Depends on TASK-002 for the state machine, checkpoint contract, and record schema.
- May execute in parallel with TASK-004; their write scopes do not overlap.
- Blocks TASK-005, TASK-006, and TASK-008.

## Handoff

- Commit or pull request:
- Verification:
- Known risks:
- Next owner: orchestrator, to unblock TASK-005 and to route the change into TASK-009 and TASK-010
