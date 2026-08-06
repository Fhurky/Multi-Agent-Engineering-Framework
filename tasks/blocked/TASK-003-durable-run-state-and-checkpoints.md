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
parent_task: TASK-001
publication_class: runtime
normative_architecture_source: 9576fc9 as amended by 8d0c570, by c2ee3eb, by fe0374c, by 468b37b, by 6d145eb, by 970b081, and by the TASK-038 commit that TASK-039 approves. None of 9576fc9, 8d0c570, c2ee3eb, fe0374c, 468b37b, 6d145eb, and 970b081 is approved — LIN-ARCH-REVIEW recorded changes-required at rounds 1, 2, 3, 4, 5, 6, and 7, the round-7 verdict at 9bb75d9 — so each is a superseded authoring baseline to amend and never an approved source to build on. No approved architecture source exists yet: one comes into being only when LIN-ARCH-REVIEW records a passing or formally accepted authoritative verdict at lineage_round 8 or later, which TASK-039 owns. A record that cites any of the seven as approved is a finding, and a record that attributes an approval to a round that recorded changes-required is a finding.
blocked_reason: TASK-015 returned changes-required on the base architecture and TASK-020 returned changes-required on the first amendment, so the durable state contract is not approved and finding A-001 changes the journal batch contract this task implements. No toolchain is integrated to compile or test against. LIN-ARCH-REVIEW has since recorded changes-required at round 5 on the TASK-032 amendment 468b37b at 3660cc2, at round 6 on the TASK-034 amendment 6d145eb at afed101, and at round 7 on the TASK-036 amendment 970b081 at 9bb75d9, so the authoritative round is 7 and it failed. Round 7 resolved A-501 through A-505, satisfied every inherited obligation, and met every declared acceptance criterion, and still blocked on one fresh High finding A-601 - the normative integration order replays a non-ancestral rejected predecessor immediately after the cumulative target and conflicts in 19 files. The remediation is TASK-038 and the revalidation is TASK-039 at round 8. This task is exactly as far from dispatch as it was before round 7.
exit_condition: The LIN-ARCH-REVIEW lineage records a passing or formally accepted authoritative verdict at lineage round 8 or higher, and TASK-018 is integrated into integration/autonomous-runtime with a compiling toolchain.
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
