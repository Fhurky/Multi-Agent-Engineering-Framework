---
task_id: TASK-010
title: Security review of the autonomous runtime
status: blocked
owner_role: security
llm: gpt
branch: agent/gpt/security/task-010
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/gpt-security-task-010
write_scope:
  - reports/security/SECURITY_REPORT.md
  - reports/security/**
  - specs/security/**
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

# TASK-010: Security review of the autonomous runtime

## Objective

Threat model the autonomous runtime, perform the security gate for TASK-003 through TASK-008, and record risk findings with remediation requirements.

## Scope

- Threat model the supervisor, durable state, scheduler, provider adapters, lifecycle entry point, and recovery layer.
- Verify that credentials and tokens are never persisted in state, checkpoints, logs, run events, reports, or test fixtures.
- Verify that agent output, task records, and provider responses are treated as untrusted input.
- Verify that the one-input bootstrap cannot be used to write outside its intended run-scoped output location.
- Verify that lease and fencing token handling cannot be bypassed to gain unauthorized concurrent write access.
- Record security requirements under `specs/security/` where a durable requirement is missing.
- Assign a severity to each finding and mark high and critical findings as delivery blocking.
- Exclude implementing remediation code, feature work, and approval of another role's gate.

## Acceptance criteria

- [ ] A threat model covers every runtime component from TASK-003 through TASK-008.
- [ ] Secret handling, untrusted input handling, bootstrap write boundaries, and lease integrity are each explicitly assessed.
- [ ] Each finding records severity, affected component, the responsible child task ID, and the required remediation outcome.
- [ ] High and critical findings are marked as blocking delivery until resolved or formally accepted by an authorized human.
- [ ] No production source file is modified by this task.
- [ ] No secret value or scanner output containing a secret is committed.
- [ ] All changed files remain inside this task's declared write scope.

## Expected artifacts

- `reports/security/SECURITY_REPORT.md` summary.
- Detailed findings under `reports/security/`.
- Security requirements under `specs/security/` when a durable requirement is missing.

## Gate and remediation path

This task performs the security gate for TASK-003 through TASK-008. Remediation is performed by the responsible implementation owner, not by this role. Findings return through TASK-013, which reopens the named child task, and this role revalidates afterward.

## Handoff

- Commit or pull request:
- Verification:
- Known risks:
- Next owner: orchestrator via TASK-013
