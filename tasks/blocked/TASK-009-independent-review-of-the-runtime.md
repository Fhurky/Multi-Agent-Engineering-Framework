---
task_id: TASK-009
title: Independent code review of the autonomous runtime
status: blocked
owner_role: reviewer
llm: gpt
branch: agent/gpt/reviewer/task-009
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/gpt-reviewer-task-009
write_scope:
  - reports/code-review/REVIEW.md
  - reports/code-review/**
dependencies:
  - TASK-003
  - TASK-004
  - TASK-005
  - TASK-006
  - TASK-007
  - TASK-008
required_gates: []
parent_task: TASK-001
blocked_reason: The runtime implementation tasks are not complete.
exit_condition: TASK-003 through TASK-008 are complete and their branches are available for review.
---

# TASK-009: Independent code review of the autonomous runtime

## Objective

Perform an independent code review of the runtime implementation produced by TASK-003 through TASK-008 and record actionable findings that route back to the responsible implementation owner.

## Scope

- Review correctness, maintainability, and compliance with the architecture approved in TASK-002.
- Verify that each implementation task stayed inside its declared write scope and did not modify another task's module.
- Verify that the state machine, lease and fencing, checkpoint, retry, and idempotency contracts are implemented as specified rather than reinterpreted.
- Verify that the language policy holds: Turkish only for user-visible command-line copy, English everywhere else.
- Record each finding with a severity, a file and line reference, and the responsible child task ID and owner role.
- Exclude authoring or fixing any reviewed change, architecture decisions, and approval of any other role's gate.

## Acceptance criteria

- [ ] Every implementation task from TASK-003 through TASK-008 is covered, and coverage is stated explicitly.
- [ ] Each finding records severity, file and line, the responsible child task ID, and the owning role.
- [ ] Contract deviations from TASK-002 are reported as findings rather than silently accepted.
- [ ] No reviewed source file is modified by this task.
- [ ] All changed files remain inside this task's declared write scope.

## Expected artifacts

- `reports/code-review/REVIEW.md` summary.
- Detailed findings under `reports/code-review/`.

## Gate and remediation path

This task performs the review gate for TASK-003 through TASK-008. It does not approve its own output. Findings return to the responsible implementation owner through TASK-013, which reopens the named child task. The reviewer must run in an execution context separate from every implementation author.

## Handoff

- Commit or pull request:
- Verification:
- Known risks:
- Next owner: orchestrator via TASK-013
