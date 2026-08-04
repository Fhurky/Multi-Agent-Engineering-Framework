---
task_id: TASK-007
title: Implement lifecycle control and the one-input project bootstrap
status: blocked
owner_role: runtime
llm: claude
branch: agent/claude/runtime/task-007
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/claude-runtime-task-007
write_scope:
  - src/orchestrator/lifecycle/**
  - bin/**
  - tests/unit/orchestrator/lifecycle/**
dependencies:
  - TASK-002
  - TASK-006
required_gates:
  - review
  - security
  - qa
parent_task: TASK-001
blocked_reason: The supervisor run loop and bootstrap contract are not available yet.
exit_condition: TASK-002 passes its review gate and TASK-006 is complete.
---

# TASK-007: Implement lifecycle control and the one-input project bootstrap

## Objective

Implement the single-command entry point and the lifecycle control surface that starts a run, gracefully drains it, pauses it at a durable checkpoint, resumes it, and reports completion.

## Scope

- Implement the one-input project bootstrap that accepts a single project input and deterministically produces the initial Manager task record without any additional operator step.
- Implement the command-line entry point under `bin/` that starts, pauses, resumes, inspects, and stops a run.
- Implement graceful drain, which stops new dispatch, allows in-flight leases to finish or expire, and writes a durable checkpoint before exiting.
- Implement pause and resume, where resume continues from the latest consistent checkpoint without duplicating already-completed work.
- Implement completion reporting that surfaces the terminal run state and its aggregated result.
- Implement signal handling so an interrupt triggers graceful drain rather than an abrupt exit.
- Render the initial Manager task from `templates/task.md` at runtime; do not add or edit repository task records under `tasks/` as part of this task, and write generated records only to a run-scoped or temporary directory in tests.
- User-visible command-line messages are Turkish; all identifiers, options, logs, exit codes, and code remain English.
- Exclude scheduling internals, state store internals, provider adapters, retry policy, and crash recovery.

## Acceptance criteria

- [ ] A single project input starts a run and creates the initial Manager task record automatically, with no second command required.
- [ ] Graceful drain stops new dispatch, waits for in-flight work within a bounded time, writes a durable checkpoint, and exits with a success code.
- [ ] Pause produces a durable checkpoint from which resume continues without re-executing already-completed tasks.
- [ ] Resume after pause reaches the same terminal run state that an uninterrupted run reaches for the same input.
- [ ] An interrupt signal triggers graceful drain instead of an abrupt exit.
- [ ] Completion reporting distinguishes success, failure, and cancellation with distinct exit codes.
- [ ] Operator-facing command-line messages are Turkish while all identifiers, flags, and logs are English.
- [ ] Bootstrap does not write into the repository `tasks/` directory during tests.
- [ ] Unit tests cover bootstrap output, drain bounds, pause and resume equivalence, signal handling, and exit codes.
- [ ] All changed files remain inside this task's declared write scope.

## Expected artifacts

- Lifecycle control under `src/orchestrator/lifecycle/`.
- Command-line entry point under `bin/`.
- Unit tests under `tests/unit/orchestrator/lifecycle/`.

## Dependency notes

- Depends on TASK-002 for the bootstrap contract and on TASK-006 for the supervisor loop and terminal states.
- May execute in parallel with TASK-008; their write scopes do not overlap.
- Required by TASK-011 for end-to-end validation.

## Handoff

- Commit or pull request:
- Verification:
- Known risks:
- Next owner: orchestrator, to route the change into TASK-009, TASK-010, and TASK-011
