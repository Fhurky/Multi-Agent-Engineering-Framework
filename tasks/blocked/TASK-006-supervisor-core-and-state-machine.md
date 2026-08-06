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
  - lineage: LIN-ARCH-REVIEW
    edge: gate_passed
    gate: review
    lineage_round: 8
  - task: TASK-003
    edge: integrated
  - task: TASK-004
    edge: integrated
  - task: TASK-005
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
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
    gate_lineage: LIN-RUNTIME-REVIEW
    lineage_round: 1
  - task: TASK-010
    gate: security
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
    gate_lineage: LIN-RUNTIME-SECURITY
    lineage_round: 1
  - task: TASK-011
    gate: qa
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
    gate_lineage: LIN-RUNTIME-QA
    lineage_round: 1
  - task: TASK-012
    gate: performance
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
    gate_lineage: LIN-RUNTIME-PERFORMANCE
    lineage_round: 1
dependencies_satisfied:
  - lineage: LIN-ARCH-REVIEW
    edge: gate_passed
    gate: review
    lineage_round: 8
    satisfied_at: 734bdbc5d9541daa78fd570057317152247d1f87
    verdict_recorded: approved
    recorded_by: TASK-013 activation ACT-016, consuming ingress entry seq 24
    approved_source: 8ea5c32789ee01fd4a2cec4aff13905b120edae3
parent_task: TASK-001
publication_class: runtime
normative_architecture_source: 8ea5c32789ee01fd4a2cec4aff13905b120edae3, the immutable TASK-038 target. THIS IS THE FIRST APPROVED ARCHITECTURE SOURCE THIS GRAPH HAS HAD. LIN-ARCH-REVIEW recorded approved at lineage_round 8, at 734bdbc, and TASK-013 activation ACT-016 closed all eight relations together, so the lineage's authoritative verdict is passing at the floor this record's edge declares. The earlier baselines 9576fc9, 8d0c570, c2ee3eb, fe0374c, 468b37b, 6d145eb, and 970b081 remain superseded authoring baselines that were each rejected at rounds 1 through 7; a record that cites any of them as approved is still a finding. Build against 8ea5c32 and nothing else. The approved source is a commit on agent/gpt/architect/task-038 that has NOT been integrated into any branch; reading it is how a consumer consults the approved architecture until the separate branch-integration operation lands.
blocked_reason: The architecture gate is NO LONGER a blocker. LIN-ARCH-REVIEW round 8 recorded approved at 734bdbc with A-601 resolved and no new finding, and TASK-013 activation ACT-016 closed all eight relations together, so this record's gate_passed(LIN-ARCH-REVIEW, review, 8) dependency is SATISFIED and the approved source is 8ea5c32. What still blocks this task is integrated(TASK-003), integrated(TASK-004), integrated(TASK-005), and integrated(TASK-017) - none of state, workers, scheduler, or workspace is integrated. No branch integration has happened yet: gate closure removes the obstacle to integration without performing one, and the integration of the approved architecture is a separate externally visible operation that produces its own ingress fact.
exit_condition: TASK-003, TASK-004, TASK-005, and TASK-017 are integrated into integration/autonomous-runtime. The architecture condition is already met and does not need to be waited on again.
review_target_base: not applicable until this task publishes
review_target_applicability: not applicable yet. This task is gated but no artifact of it exists, so no round is pinned and there is no delta to diff. It becomes applicable when this task reaches review_ready; the Orchestrator records review_target_commit and review_target_base then, at the activation that consumes the publication, from the branch as published.
branch_point_of: integration/autonomous-runtime
scope_validation_base: git merge-base HEAD integration/autonomous-runtime
scope_validation_applicability: applicable, declared as a reproducible expression because this task's branch does not exist yet
scope_validation_note: Branch from integration/autonomous-runtime at or after the commit where this task's dependencies merged, then resolve the immutable branch point inside the worktree with git merge-base HEAD integration/autonomous-runtime and pass that value to -BaseRef. Record the resolved value in the handoff; the Orchestrator pins it at the next activation. Never pass origin/main, c325275, or a review-diff base. Findings F-403 and A-209 each recorded why.
---

# TASK-006: Implement the supervisor core and deterministic state machine

## Objective

Implement the supervisor run loop and the deterministic task state machine that drives a project run from start to a terminal completion state, aggregating worker results into durable state.

## Scope

- Implement the run and task state machine defined by the normative architecture — `9576fc9` as amended by the approved TASK-016 commit — as an explicit transition function that rejects illegal transitions.
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

- `gate_passed(TASK-016, review)` supplies the transition function, run events, and dynamic admission guards from `docs/architecture/runtime/STATE-MACHINE.md` at commit `9576fc9` **as amended by the TASK-016 commit that TASK-020 approves**. The rejected baseline alone is not the normative source; A-002 changes the recovery transitions this task implements.
- `integrated(TASK-003)` supplies the state store and its contract root; `integrated(TASK-005)` supplies the scheduler and lease grant.
- `integrated(TASK-004)` supplies the `AgentWorker` and `WorkerResult` contract that this loop invokes. This edge was missing in the first decomposition; the supervisor invokes agent workers and cannot be built or tested against a contract that has not been published.
- `integrated(TASK-017)` supplies the workspace lifecycle interface the supervisor calls before and after each dispatch.
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
