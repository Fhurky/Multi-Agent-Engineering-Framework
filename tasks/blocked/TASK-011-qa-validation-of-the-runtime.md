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
    gate: qa
  - task: TASK-004
    gate: qa
  - task: TASK-005
    gate: qa
  - task: TASK-006
    gate: qa
  - task: TASK-007
    gate: qa
  - task: TASK-008
    gate: qa
  - task: TASK-017
    gate: qa
parent_task: TASK-001
blocked_reason: The runtime implementation tasks have not published their branches.
exit_condition: TASK-003 through TASK-008 and TASK-017 have each reached status review with their branches available. Every dependency is listed explicitly; this task does not infer a dependency from another task's dependency list.
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
- Validate the provider adapter surface delivered by TASK-004: that `claude`, `gpt`, and `gemini` are all registered and resolvable, that each reports a usable `diagnose()` result, and that a missing executable or a missing credential variable produces the specified classification. Adapter execution is exercised through local script fixtures, never a real provider.
- Validate the workspace lifecycle delivered by TASK-017 end to end: that a dispatched task runs on its own `agent/<llm>/<role>/<task-id>` branch in its own worktree, that the task lock is claimed before any edit and released afterward, that write-scope validation runs before handoff, and that an abruptly terminated run leaves no worktree, branch, or lock that recovery cannot reconcile.
- Validate that operator-facing command-line copy is Turkish while identifiers, flags, and logs are English.
- Use deterministic fixtures and fake providers; no real provider credentials or network calls.
- Exclude production implementation, architecture decisions, and approval of another role's gate.

## Acceptance criteria

- [ ] Every behavior in the TASK-001 acceptance list has at least one executable test: start, graceful drain, checkpoint, pause, resume, completion, timeout, crash recovery, and retry.
- [ ] Pause-resume equivalence and crash-recovery equivalence are each asserted against an uninterrupted baseline run.
- [ ] Concurrency limit adherence is asserted during an actual multi-task run.
- [ ] All three configured provider families are asserted present and resolvable, and adapter discovery, cancellation, and diagnostic behavior are each covered.
- [ ] Automated branch creation, worktree isolation, hook installation, lock claim, scope validation, commit and handoff persistence, lock release, and crash-safe cleanup are each covered by an executable test.
- [ ] Coverage is stated per dependency task, and every dependency named in the frontmatter is covered explicitly rather than assumed to be covered transitively.
- [ ] Each defect is reproducible from a recorded command and fixture, and names the responsible child task ID and owning role.
- [ ] Tests are deterministic and contain no credentials or personal data.
- [ ] No production source file is modified by this task.
- [ ] All changed files remain inside this task's declared write scope.

## Expected artifacts

- `reports/qa/BUG_REPORT.md` summary.
- Integration tests under `tests/integration/`, end-to-end tests under `tests/e2e/`, and fixtures under `tests/fixtures/`.

## Gate and remediation path

This task performs the QA gate for TASK-003 through TASK-008 and TASK-017, declared in the `gate_for` field. A `gate_for` declaration is not a scheduling dependency: this task becomes dispatchable when its targets reach `review`, and its targets reach `done` only after this task records a verdict.

Defects return to the responsible implementation owner through TASK-013, which reopens the named child task. QA revalidates after remediation and does not implement fixes.

## Task-record lifecycle

This record's `status` field and its lifecycle directory are changed only by the Orchestrator under TASK-013. `tasks/**` is outside this role's configured write scope. Record the handoff in `reports/qa/BUG_REPORT.md` and in the pull request description; the Orchestrator transcribes it into the section below.

## Handoff

Maintained by the Orchestrator under TASK-013 from the owner's report and pull request.

- Commit or pull request:
- Verification:
- Known risks:
- Next owner: orchestrator via TASK-013
