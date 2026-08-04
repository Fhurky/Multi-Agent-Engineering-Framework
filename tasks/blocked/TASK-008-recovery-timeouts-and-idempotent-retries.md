---
task_id: TASK-008
title: Implement crash recovery, timeouts, and idempotent retries
status: blocked
owner_role: runtime
llm: claude
branch: agent/claude/runtime/task-008
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/claude-runtime-task-008
write_scope:
  - src/orchestrator/recovery/**
  - tests/unit/orchestrator/recovery/**
dependencies:
  - TASK-002
  - TASK-003
  - TASK-006
required_gates:
  - review
  - security
  - qa
  - performance
parent_task: TASK-001
blocked_reason: The recovery and retry contracts are not approved and the state store and supervisor do not exist yet.
exit_condition: TASK-002 passes its review gate and TASK-003 and TASK-006 are complete.
---

# TASK-008: Implement crash recovery, timeouts, and idempotent retries

## Objective

Implement the recovery layer that restores a run after an abrupt process termination, enforces task timeouts, and retries failed work idempotently without duplicating completed effects.

## Scope

- Implement crash recovery that restores the latest consistent checkpoint, reconciles tasks whose leases expired during the outage, and resumes the run.
- Implement task-level and run-level timeout enforcement that transitions a timed-out task through the state machine rather than abandoning it.
- Implement retry policy driven by the TASK-004 error taxonomy, with bounded attempts and backoff.
- Implement idempotency keys so a retried task cannot apply a duplicate effect or a duplicate state advance.
- Implement the exhausted-retry path that moves a task to a blocked or failed terminal state with a recorded reason.
- Provide unit tests using a fake clock and simulated abrupt termination.
- Exclude state store internals, scheduling internals, provider adapters, and lifecycle command handling.

## Acceptance criteria

- [ ] Recovery after a simulated crash restores a consistent run and reaches the same terminal state as an uninterrupted run for the same input.
- [ ] A task in flight at crash time is either completed once or retried once, never duplicated.
- [ ] Task and run timeouts produce an explicit state transition with a recorded timeout reason.
- [ ] Retries occur only for the retryable class from the TASK-004 taxonomy, and non-retryable failures are not retried.
- [ ] Retry attempts are bounded, and exhausting them produces a recorded terminal outcome rather than an infinite loop.
- [ ] Repeating a task with the same idempotency key does not apply the effect or the state advance twice.
- [ ] Unit tests cover crash recovery, lease reconciliation, timeout transitions, retry classification, backoff bounds, retry exhaustion, and idempotent replay.
- [ ] All changed files remain inside this task's declared write scope.

## Expected artifacts

- Recovery, timeout, and retry implementation under `src/orchestrator/recovery/`.
- Unit tests under `tests/unit/orchestrator/recovery/`.

## Dependency notes

- Depends on TASK-002, TASK-003, and TASK-006, and consumes the TASK-004 error taxonomy without modifying `src/agents/`.
- May execute in parallel with TASK-007; their write scopes do not overlap.

## Handoff

- Commit or pull request:
- Verification:
- Known risks:
- Next owner: orchestrator, to route the change into TASK-009, TASK-010, TASK-011, and TASK-012
