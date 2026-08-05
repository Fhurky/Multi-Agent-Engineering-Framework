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
    lineage_round: 3
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
normative_architecture_source: 9576fc9 as amended by 8d0c570 and by the TASK-024 commit that TASK-025 approves
blocked_reason: TASK-015 returned changes-required on the base architecture and TASK-020 returned changes-required on the first amendment, so the durable state contract is not approved and finding A-001 changes the journal batch contract this task implements. No toolchain is integrated to compile or test against.
exit_condition: The LIN-ARCH-REVIEW lineage records a passing or formally accepted authoritative verdict at lineage round 3 or higher, and TASK-018 is integrated into integration/autonomous-runtime with a compiling toolchain.
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
