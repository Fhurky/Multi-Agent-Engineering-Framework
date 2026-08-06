---
task_id: TASK-003
title: Implement durable run state and checkpointing
status: blocked
owner_role: runtime
llm: claude
branch: agent/claude/runtime/task-003
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/claude-runtime-task-003
write_scope:
  - src/orchestrator/state/**
  - tests/unit/orchestrator/state/**
dependencies:
  - lineage: LIN-ARCH-REVIEW
    edge: gate_passed
    gate: review
    lineage_round: 8
  - task: TASK-018
    edge: integrated
required_gates:
  - review
  - security
  - qa
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
blocked_reason: The architecture gate is NO LONGER a blocker. LIN-ARCH-REVIEW round 8 recorded approved at 734bdbc with A-601 resolved and no new finding, and TASK-013 activation ACT-016 closed all eight relations together, so this record's gate_passed(LIN-ARCH-REVIEW, review, 8) dependency is SATISFIED and the approved source is 8ea5c32. What still blocks this task is integrated(TASK-018) - the toolchain is not integrated, so this task cannot compile or run a test without writing outside its declared scope. No branch integration has happened yet: gate closure removes the obstacle to integration without performing one, and the integration of the approved architecture is a separate externally visible operation that produces its own ingress fact.
exit_condition: TASK-018 is integrated into integration/autonomous-runtime with a compiling toolchain. The architecture condition is already met and does not need to be waited on again.
review_target_base: not applicable until this task publishes
review_target_applicability: not applicable yet. This task is gated but no artifact of it exists, so no round is pinned and there is no delta to diff. It becomes applicable when this task reaches review_ready; the Orchestrator records review_target_commit and review_target_base then, at the activation that consumes the publication, from the branch as published.
branch_point_of: integration/autonomous-runtime
scope_validation_base: git merge-base HEAD integration/autonomous-runtime
scope_validation_applicability: applicable, declared as a reproducible expression because this task's branch does not exist yet
scope_validation_note: Branch from integration/autonomous-runtime at or after the commit where this task's dependencies merged, then resolve the immutable branch point inside the worktree with git merge-base HEAD integration/autonomous-runtime and pass that value to -BaseRef. Record the resolved value in the handoff; the Orchestrator pins it at the next activation. Never pass origin/main, c325275, or a review-diff base. Findings F-403 and A-209 each recorded why.
---

# TASK-003: Implement durable run state and checkpointing

## Objective

Implement the durable run state store that persists run and task records, writes checkpoints, and restores a consistent run snapshot after an abrupt process termination.

## Scope

- Implement the run and task record persistence defined by TASK-002.
- Implement atomic, crash-safe writes so that a partially written checkpoint can never be read as a valid checkpoint.
- Implement checkpoint creation, checkpoint listing, and restore-from-latest-consistent-checkpoint.
- Implement monotonic sequence or version numbering that the scheduler can use as a fencing source.
- Implement optimistic concurrency or compare-and-set semantics so two writers cannot silently overwrite each other.
- Provide unit tests for durability, atomicity, restore correctness, and concurrent write rejection.
- Exclude scheduling, supervision, provider calls, lifecycle commands, and recovery orchestration.

## Acceptance criteria

- [ ] Run and task state is persisted in the format defined by TASK-002 and survives process termination.
- [ ] A checkpoint write is atomic; an interrupted write leaves the last valid checkpoint readable and unchanged.
- [ ] Restore returns the latest consistent checkpoint and reports the state version it restored.
- [ ] Concurrent conflicting writes are rejected rather than silently merged, and the rejection is observable to the caller.
- [ ] Version or sequence numbers are strictly monotonic per run.
- [ ] Unit tests cover atomic write interruption, restore after simulated crash, monotonic versioning, and conflicting-write rejection.
- [ ] No secrets, credentials, or provider tokens are persisted in state or checkpoint records.
- [ ] All changed files remain inside this task's declared write scope.

## Expected artifacts

- Durable state implementation under `src/orchestrator/state/`.
- Unit tests under `tests/unit/orchestrator/state/`.

## Dependency notes

- `gate_passed(TASK-016, review)` supplies the state machine, checkpoint contract, and record schema. The normative source is `docs/architecture/runtime/DURABLE-STATE-AND-CHECKPOINTS.md`, `docs/architecture/runtime/INTERFACE-CONTRACTS.md`, and `docs/architecture/runtime/STATE-MACHINE.md` at commit `9576fc9` **as amended by the TASK-016 commit that TASK-020 approves**. Finding F-202 recorded that this record previously pinned the rejected baseline alone: TASK-015 judged three of TASK-002's seven acceptance criteria `not met`, and A-001 changes the journal batch contract this task implements, so `9576fc9` on its own is not implementable as written. Where the amendment supersedes a claim in those documents, the amendment governs.
- `integrated(TASK-018)` supplies the TypeScript and Node.js toolchain required by ADR-0001. Without it this task cannot compile or run a test without writing outside its declared scope.
- May execute in parallel with TASK-004; their write scopes do not overlap.
- Blocks TASK-005, TASK-006, TASK-008, and TASK-017.

## Contract root ownership

This task owns the contract root `src/orchestrator/state/contracts/`, which is normatively defined by `docs/architecture/runtime/INTERFACE-CONTRACTS.md` **as amended by the approved TASK-016 commit**. Transcribe that document; do not reinterpret it. Changing a type, signature, field name, or string-literal union declared there is prohibited during Waves 2 through 5 even though this task physically can. If a contract is wrong, stop at the boundary and hand off to the Orchestrator, which routes an amendment to the architect. See the contract change control procedure in `docs/architecture/runtime/INTEGRATION-STRATEGY.md`.

## Task-record lifecycle

This record's `status` field and its lifecycle directory are changed only by the Orchestrator under TASK-013. `tasks/**` is outside this role's configured write scope, so the owner of this task must not move or edit this file. Record the handoff in the commit message and the pull request description; the Orchestrator transcribes it into the section below.

## Handoff

Maintained by the Orchestrator under TASK-013 from the owner's commit and pull request.

- Commit or pull request:
- Verification:
- Known risks:
- Next owner: orchestrator via TASK-013, to unblock TASK-005 and TASK-017 and to route the change into TASK-009, TASK-010, and TASK-011
