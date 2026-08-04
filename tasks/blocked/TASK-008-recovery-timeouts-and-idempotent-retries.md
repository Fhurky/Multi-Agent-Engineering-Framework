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
  - task: TASK-016
    edge: gate_passed
    gate: review
  - task: TASK-003
    edge: integrated
  - task: TASK-004
    edge: integrated
  - task: TASK-006
    edge: integrated
  - task: TASK-017
    edge: integrated
required_gates:
  - review
  - security
  - qa
  - performance
pre_merge_gates: []
gate_tasks:
  - task: TASK-009
    gate: review
  - task: TASK-010
    gate: security
  - task: TASK-011
    gate: qa
  - task: TASK-012
    gate: performance
parent_task: TASK-001
blocked_reason: TASK-015 returned changes-required on the base architecture, so the recovery and retry contracts are not approved and findings A-001, A-002, and A-003 change the recovery batch, transition legality, and orphan termination behavior this task implements. The state store, error taxonomy, supervisor, and workspace lifecycle are not integrated.
exit_condition: TASK-020 records a passing verdict on the TASK-016 amendment, and TASK-003, TASK-004, TASK-006, and TASK-017 are integrated into integration/autonomous-runtime.
---

# TASK-008: Implement crash recovery, timeouts, and idempotent retries

## Objective

Implement the recovery layer that restores a run after an abrupt process termination, enforces task timeouts, and retries failed work idempotently without duplicating completed effects.

## Scope

- Implement crash recovery that restores the latest consistent checkpoint, reconciles tasks whose leases expired during the outage, reconciles orphaned agent workspaces through the TASK-017 reconciliation interface, and resumes the run.
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
- [ ] Retries occur only for the `retry` disposition of the TASK-004 taxonomy as declared by `DISPOSITION_BY_CLASS`; `fail` and `escalate` classes are never retried, and this module never redefines that mapping.
- [ ] A crash that left an agent workspace behind is reconciled through TASK-017 exactly once, and a retried attempt never reuses a workspace that a stale attempt may still hold.
- [ ] Retry attempts are bounded, and exhausting them produces a recorded terminal outcome rather than an infinite loop.
- [ ] Repeating a task with the same idempotency key does not apply the effect or the state advance twice.
- [ ] Unit tests cover crash recovery, lease reconciliation, timeout transitions, retry classification, backoff bounds, retry exhaustion, and idempotent replay.
- [ ] All changed files remain inside this task's declared write scope.

## Expected artifacts

- Recovery, timeout, and retry implementation under `src/orchestrator/recovery/`.
- Unit tests under `tests/unit/orchestrator/recovery/`.

## Dependency notes

- `gate_passed(TASK-016, review)` supplies the recovery phases, post-crash invariants, idempotency keys, effect ledger, and backoff policy from `docs/architecture/runtime/CRASH-RECOVERY.md` and `docs/architecture/runtime/RETRIES-TIMEOUTS-AND-IDEMPOTENCY.md`.
- `integrated(TASK-003)` supplies the state store, journal, and effect ledger substrate; `integrated(TASK-006)` supplies the transition function this module reuses.
- `integrated(TASK-004)` supplies the error taxonomy and `DISPOSITION_BY_CLASS` that drive retry classification. This edge was missing in the first decomposition; the retry policy is defined entirely in terms of TASK-004's taxonomy and cannot be built against an unpublished contract. This task imports from `src/agents/contracts/` only and never modifies `src/agents/`.
- `integrated(TASK-017)` supplies workspace reconciliation for work abandoned by a crash.
- May execute in parallel with TASK-007; their write scopes do not overlap.

## Task-record lifecycle

This record's `status` field and its lifecycle directory are changed only by the Orchestrator under TASK-013. `tasks/**` is outside this role's configured write scope, so the owner of this task must not move or edit this file. Record the handoff in the commit message and the pull request description; the Orchestrator transcribes it into the section below.

## Handoff

Maintained by the Orchestrator under TASK-013 from the owner's commit and pull request.

- Commit or pull request:
- Verification:
- Known risks:
- Next owner: orchestrator via TASK-013, to route the change into TASK-009, TASK-010, TASK-011, and TASK-012
