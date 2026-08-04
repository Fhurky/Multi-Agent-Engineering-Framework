---
task_id: TASK-011
title: QA validation of autonomous run lifecycle behavior
status: blocked
owner_role: qa
llm: gemini
branch: agent/gemini/qa/task-011
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/gemini-qa-task-011
write_scope:
  - reports/qa/BUG_REPORT.md
  - reports/qa/**
  - tests/integration/**
  - tests/e2e/**
  - tests/fixtures/**
dependencies:
  - TASK-007
  - TASK-008
required_gates: []
parent_task: TASK-001
blocked_reason: The lifecycle entry point and the recovery layer are not implemented yet.
exit_condition: TASK-007 and TASK-008 are complete, which implies TASK-003 through TASK-006 are complete.
---

# TASK-011: QA validation of autonomous run lifecycle behavior

## Objective

Independently validate the end-to-end autonomous run lifecycle against the TASK-001 acceptance behaviors and record reproducible defects that route back to the responsible implementation owner.

## Scope

- Author integration and end-to-end tests covering start, graceful drain, checkpoint, pause, resume, completion, timeout, crash recovery, and retry.
- Validate the one-input bootstrap: a single project input produces the initial Manager task record with no additional operator step.
- Validate that a paused and resumed run reaches the same terminal state as an uninterrupted run for the same input.
- Validate that a simulated crash followed by recovery reaches the same terminal state and does not duplicate completed work.
- Validate that bounded concurrency is never exceeded during a real run.
- Validate that operator-facing command-line copy is Turkish while identifiers, flags, and logs are English.
- Use deterministic fixtures and fake providers; no real provider credentials or network calls.
- Exclude production implementation, architecture decisions, and approval of another role's gate.

## Acceptance criteria

- [ ] Every behavior in the TASK-001 acceptance list has at least one executable test: start, graceful drain, checkpoint, pause, resume, completion, timeout, crash recovery, and retry.
- [ ] Pause-resume equivalence and crash-recovery equivalence are each asserted against an uninterrupted baseline run.
- [ ] Concurrency limit adherence is asserted during an actual multi-task run.
- [ ] Each defect is reproducible from a recorded command and fixture, and names the responsible child task ID and owning role.
- [ ] Tests are deterministic and contain no credentials or personal data.
- [ ] No production source file is modified by this task.
- [ ] All changed files remain inside this task's declared write scope.

## Expected artifacts

- `reports/qa/BUG_REPORT.md` summary.
- Integration tests under `tests/integration/`, end-to-end tests under `tests/e2e/`, and fixtures under `tests/fixtures/`.

## Gate and remediation path

This task performs the QA gate for the runtime. Defects return to the responsible implementation owner through TASK-013, which reopens the named child task. QA revalidates after remediation and does not implement fixes.

## Handoff

- Commit or pull request:
- Verification:
- Known risks:
- Next owner: orchestrator via TASK-013
