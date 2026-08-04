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
  - reports/code-review/runtime/**
dependencies:
  - task: TASK-003
    edge: implementation_published
  - task: TASK-004
    edge: implementation_published
  - task: TASK-005
    edge: implementation_published
  - task: TASK-006
    edge: implementation_published
  - task: TASK-007
    edge: implementation_published
  - task: TASK-008
    edge: implementation_published
  - task: TASK-017
    edge: implementation_published
required_gates: []
gate_for:
  - task: TASK-003
    gate: review
  - task: TASK-004
    gate: review
  - task: TASK-005
    gate: review
  - task: TASK-006
    gate: review
  - task: TASK-007
    gate: review
  - task: TASK-008
    gate: review
  - task: TASK-017
    gate: review
parent_task: TASK-001
blocked_reason: The runtime implementation tasks have not published their branches.
exit_condition: TASK-003 through TASK-008 and TASK-017 have reached status review with their branches available for review. This task does not wait for those tasks to reach done, because it is the gate that lets them reach done.
---

# TASK-009: Independent code review of the autonomous runtime

## Objective

Perform an independent code review of the runtime implementation produced by TASK-003 through TASK-008 and TASK-017, and record actionable findings that route back to the responsible implementation owner.

## Scope

- Review correctness, maintainability, and compliance with the architecture approved in TASK-002 and amended by TASK-016.
- Verify that the `claude`, `gpt`, and `gemini` adapters required by TASK-004 each exist and implement command discovery, non-interactive invocation construction, cancellation, result parsing, and credential-free diagnostics. An adapter set that satisfies only the registry abstraction is a finding.
- Verify that the workspace lifecycle from TASK-017 is invoked on every dispatch path and that no result path leaves a workspace or a task lock unfinalized.
- Verify that neither contract root was amended locally in violation of the contract change control procedure in `docs/architecture/runtime/INTEGRATION-STRATEGY.md`, by diffing `src/orchestrator/state/contracts/` and `src/agents/contracts/` against `docs/architecture/runtime/INTERFACE-CONTRACTS.md`.
- Verify that each implementation task stayed inside its declared write scope and did not modify another task's module.
- Verify that the state machine, lease and fencing, checkpoint, retry, and idempotency contracts are implemented as specified rather than reinterpreted.
- Verify that the language policy holds: Turkish only for user-visible command-line copy, English everywhere else.
- Record each finding with a severity, a file and line reference, and the responsible child task ID and owner role.
- Exclude authoring or fixing any reviewed change, architecture decisions, and approval of any other role's gate.

## Acceptance criteria

- [ ] Every implementation task from TASK-003 through TASK-008 plus TASK-017 is covered, and coverage is stated explicitly.
- [ ] Each finding records severity, file and line, the responsible child task ID, and the owning role.
- [ ] Contract deviations from TASK-002 are reported as findings rather than silently accepted.
- [ ] No reviewed source file is modified by this task.
- [ ] All changed files remain inside this task's declared write scope.

## Expected artifacts

- `reports/code-review/REVIEW.md` summary.
- Detailed findings under `reports/code-review/runtime/`.

## Write-scope isolation

This task's scope was narrowed from `reports/code-review/**` to `reports/code-review/REVIEW.md` and `reports/code-review/runtime/**` so that it is path-disjoint from every other review task. It must not write `reports/code-review/TASK-001-DECOMPOSITION-REVIEW.md`, which belongs to TASK-014, or `reports/code-review/TASK-002-ARCHITECTURE-REVIEW.md`, which belongs to TASK-015. No sequencing assumption is required; the partition is now enforceable by path.

## Gate and remediation path

This task performs the review gate for TASK-003 through TASK-008 and TASK-017, declared in the `gate_for` field. A `gate_for` declaration is not a scheduling dependency: this task becomes dispatchable when its targets reach `review`, and its targets reach `done` only after this task records a verdict. That is why the two directions cannot deadlock.

It does not approve its own output. Findings return to the responsible implementation owner through TASK-013, which reopens the named child task. The reviewer must run in an execution context separate from every implementation author.

## Task-record lifecycle

This record's `status` field and its lifecycle directory are changed only by the Orchestrator under TASK-013. `tasks/**` is outside this role's configured write scope. Record the handoff in `reports/code-review/REVIEW.md` and in the pull request description; the Orchestrator transcribes it into the section below.

## Handoff

Maintained by the Orchestrator under TASK-013 from the owner's report and pull request.

- Commit or pull request:
- Verification:
- Known risks:
- Next owner: orchestrator via TASK-013
