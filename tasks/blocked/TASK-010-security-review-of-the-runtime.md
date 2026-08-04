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
  - task: TASK-018
    edge: implementation_published
required_gates: []
gate_for:
  - task: TASK-003
    gate: security
  - task: TASK-004
    gate: security
  - task: TASK-005
    gate: security
  - task: TASK-006
    gate: security
  - task: TASK-007
    gate: security
  - task: TASK-008
    gate: security
  - task: TASK-017
    gate: security
  - task: TASK-018
    gate: security
parent_task: TASK-001
blocked_reason: The runtime implementation tasks have not published their branches.
exit_condition: TASK-003 through TASK-008 and TASK-017 have reached status review with their branches available for review. This task does not wait for those tasks to reach done, because it is the gate that lets them reach done.
---

# TASK-010: Security review of the autonomous runtime

## Objective

Threat model the autonomous runtime, perform the security gate for TASK-003 through TASK-008, and record risk findings with remediation requirements.

## Scope

- Threat model the supervisor, durable state, scheduler, provider adapters, workspace lifecycle, lifecycle entry point, and recovery layer.
- Assess the workspace lifecycle from TASK-017 specifically: that the runtime cannot create a branch or worktree outside the `agent/<llm>/<role>/<task-id>` convention, cannot edit the primary checkout, cannot force-release another session's task lock, cannot bypass the tracked pre-push hook or push to `main`, and cannot modify a human-controlled governance path.
- Assess the three provider adapters from TASK-004: that no credential reaches an argument vector, a diagnostic, a log, an event, or a persisted record, and that provider standard output is treated as untrusted input rather than as a trusted instruction to the supervisor.
- Verify that credentials and tokens are never persisted in state, checkpoints, logs, run events, reports, or test fixtures.
- Verify that agent output, task records, and provider responses are treated as untrusted input.
- Verify that the one-input bootstrap cannot be used to write outside its intended run-scoped output location.
- Verify that lease and fencing token handling cannot be bypassed to gain unauthorized concurrent write access.
- Assess the TASK-018 toolchain retrospectively: review the dependency inventory TASK-019 produced, assess the supply-chain surface of every added devDependency, and confirm that ADR-0001's zero-third-party-runtime-dependency rule held. This assessment is retrospective by design — the toolchain merges at Wave 2 because no code exists to threat-model before it.
- Record security requirements under `specs/security/` where a durable requirement is missing.
- Assign a severity to each finding and mark high and critical findings as delivery blocking.
- Exclude implementing remediation code, feature work, and approval of another role's gate.

## Acceptance criteria

- [ ] A threat model covers every runtime component from TASK-003 through TASK-008 plus TASK-017.
- [ ] Git worktree, branch, task-lock, push-protection, and governance-path integrity are explicitly assessed for the automated workspace lifecycle.
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

This task performs the security gate for TASK-003 through TASK-008 and TASK-017, declared in the `gate_for` field. A `gate_for` declaration is not a scheduling dependency: this task becomes dispatchable when its targets reach `review`, and its targets reach `done` only after this task records a verdict.

Remediation is performed by the responsible implementation owner, not by this role. Findings return through TASK-013, which reopens the named child task, and this role revalidates afterward. High and critical findings block delivery until they are resolved or formally accepted by an authorized human.

## Task-record lifecycle

This record's `status` field and its lifecycle directory are changed only by the Orchestrator under TASK-013. `tasks/**` is outside this role's configured write scope. Record the handoff in `reports/security/SECURITY_REPORT.md` and in the pull request description; the Orchestrator transcribes it into the section below.

## Handoff

Maintained by the Orchestrator under TASK-013 from the owner's report and pull request.

- Commit or pull request:
- Verification:
- Known risks:
- Next owner: orchestrator via TASK-013
