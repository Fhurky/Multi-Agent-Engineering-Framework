---
task_id: TASK-006
title: Implement the supervisor core and deterministic state machine
status: blocked
owner_role: runtime
llm: claude
branch: agent/claude/runtime/task-006
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/claude-runtime-task-006
write_scope:
  - src/orchestrator/supervisor/**
  - tests/unit/orchestrator/supervisor/**
dependencies:
  - task: TASK-002
    edge: gate_passed
  - task: TASK-003
    edge: implementation_published
  - task: TASK-004
    edge: implementation_published
  - task: TASK-005
    edge: implementation_published
  - task: TASK-017
    edge: implementation_published
required_gates:
  - review
  - security
  - qa
  - performance
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
blocked_reason: The state machine contract is not approved, and the state store, worker contract, scheduler, and workspace lifecycle are not published.
exit_condition: TASK-015 records a passing verdict on TASK-002, and TASK-003, TASK-004, TASK-005, and TASK-017 are published on main.
---

# TASK-006: Implement the supervisor core and deterministic state machine

## Objective

Implement the supervisor run loop and the deterministic task state machine that drives a project run from start to a terminal completion state, aggregating worker results into durable state.

## Scope

- Implement the run and task state machine defined by TASK-002 as an explicit transition function that rejects illegal transitions.
- Implement the supervisor loop that requests dispatchable work from the scheduler, prepares the isolated agent workspace through the TASK-017 workspace lifecycle interface, invokes agent workers, finalizes or releases the workspace, and applies results to durable state under the holder's fencing token.
- Implement result aggregation, including how a worker outcome advances, fails, or blocks a task.
- Implement run completion detection and the terminal run states for success, failure, and cancellation.
- Emit structured run events for observability without writing secrets or provider payload credentials.
- Provide unit tests using fake scheduler, fake state store, and fake workers.
- Exclude lifecycle command handling, the bootstrap entry point, retry policy, timeout policy, and crash recovery.

## Acceptance criteria

- [ ] Every state transition is validated by a single transition function, and an illegal transition is rejected rather than applied.
- [ ] Replaying the same ordered event sequence produces an identical final run state.
- [ ] Worker results are applied to durable state only with a currently valid fencing token.
- [ ] Run completion is detected exactly once and produces exactly one terminal run state.
- [ ] The supervisor never invokes a provider directly and never bypasses the scheduler's concurrency limits.
- [ ] The supervisor never dispatches a worker without a prepared workspace from TASK-017, and never leaves a workspace unfinalized on any result path, including failure and cancellation.
- [ ] Emitted run events contain no credentials or secret values.
- [ ] Unit tests cover legal and illegal transitions, deterministic replay, stale-token result rejection, and each terminal completion path.
- [ ] All changed files remain inside this task's declared write scope.

## Expected artifacts

- Supervisor loop, transition function, and result aggregation under `src/orchestrator/supervisor/`.
- Unit tests under `tests/unit/orchestrator/supervisor/`.

## Dependency notes

- `gate_passed(TASK-002)` supplies the transition function, run events, and dynamic admission guards from `docs/architecture/runtime/STATE-MACHINE.md`.
- `implementation_published(TASK-003)` supplies the state store and its contract root; `implementation_published(TASK-005)` supplies the scheduler and lease grant.
- `implementation_published(TASK-004)` supplies the `AgentWorker` and `WorkerResult` contract that this loop invokes. This edge was missing in the first decomposition; the supervisor invokes agent workers and cannot be built or tested against a contract that has not been published.
- `implementation_published(TASK-017)` supplies the workspace lifecycle interface the supervisor calls before and after each dispatch.
- Imports from `src/agents/contracts/` only; never modifies `src/agents/`.
- Blocks TASK-007 and TASK-008.

## Task-record lifecycle

This record's `status` field and its lifecycle directory are changed only by the Orchestrator under TASK-013. `tasks/**` is outside this role's configured write scope, so the owner of this task must not move or edit this file. Record the handoff in the commit message and the pull request description; the Orchestrator transcribes it into the section below.

## Handoff

Maintained by the Orchestrator under TASK-013 from the owner's commit and pull request.

- Commit or pull request:
- Verification:
- Known risks:
- Next owner: orchestrator via TASK-013, to unblock TASK-007 and TASK-008 and to route the change into TASK-009, TASK-010, and TASK-012
