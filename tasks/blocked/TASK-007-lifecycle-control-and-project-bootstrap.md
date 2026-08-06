---
task_id: TASK-007
title: Implement lifecycle control and the one-input project bootstrap
status: blocked
owner_role: runtime
llm: claude
branch: agent/claude/runtime/task-007
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/claude-runtime-task-007
write_scope:
  - src/orchestrator/lifecycle/**
  - bin/**
  - tests/unit/orchestrator/lifecycle/**
dependencies:
  - lineage: LIN-ARCH-REVIEW
    edge: gate_passed
    gate: review
    lineage_round: 8
  - task: TASK-006
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
blocked_reason: The architecture gate is NO LONGER a blocker. LIN-ARCH-REVIEW round 8 recorded approved at 734bdbc with A-601 resolved and no new finding, and TASK-013 activation ACT-016 closed all eight relations together, so this record's gate_passed(LIN-ARCH-REVIEW, review, 8) dependency is SATISFIED and the approved source is 8ea5c32. What still blocks this task is integrated(TASK-006) - the supervisor core is not integrated. No branch integration has happened yet: gate closure removes the obstacle to integration without performing one, and the integration of the approved architecture is a separate externally visible operation that produces its own ingress fact.
exit_condition: TASK-006 is integrated into integration/autonomous-runtime. The architecture condition is already met and does not need to be waited on again.
review_target_base: not applicable until this task publishes
review_target_applicability: not applicable yet. This task is gated but no artifact of it exists, so no round is pinned and there is no delta to diff. It becomes applicable when this task reaches review_ready; the Orchestrator records review_target_commit and review_target_base then, at the activation that consumes the publication, from the branch as published.
branch_point_of: integration/autonomous-runtime
scope_validation_base: git merge-base HEAD integration/autonomous-runtime
scope_validation_applicability: applicable, declared as a reproducible expression because this task's branch does not exist yet
scope_validation_note: Branch from integration/autonomous-runtime at or after the commit where this task's dependencies merged, then resolve the immutable branch point inside the worktree with git merge-base HEAD integration/autonomous-runtime and pass that value to -BaseRef. Record the resolved value in the handoff; the Orchestrator pins it at the next activation. Never pass origin/main, c325275, or a review-diff base. Findings F-403 and A-209 each recorded why.
---

# TASK-007: Implement lifecycle control and the one-input project bootstrap

## Objective

Implement the single-command entry point and the lifecycle control surface that starts a run, gracefully drains it, pauses it at a durable checkpoint, resumes it, and reports completion.

## Scope

- Implement the one-input project bootstrap that accepts a single project input and deterministically produces the initial Manager task record without any additional operator step.
- Implement the command-line entry point under `bin/` that starts, pauses, resumes, inspects, and stops a run.
- Implement graceful drain, which stops new dispatch, allows in-flight leases to finish or expire, and writes a durable checkpoint before exiting.
- Implement pause and resume, where resume continues from the latest consistent checkpoint without duplicating already-completed work.
- Implement completion reporting that surfaces the terminal run state and its aggregated result.
- Implement signal handling so an interrupt triggers graceful drain rather than an abrupt exit.
- Render the initial Manager task from `templates/task.md` at runtime; do not add or edit repository task records under `tasks/` as part of this task, and write generated records only to a run-scoped or temporary directory in tests.
- User-visible command-line messages are Turkish; all identifiers, options, logs, exit codes, and code remain English.
- Exclude scheduling internals, state store internals, provider adapters, retry policy, and crash recovery.

## Acceptance criteria

- [ ] A single project input starts a run and creates the initial Manager task record automatically, with no second command required.
- [ ] Graceful drain stops new dispatch, waits for in-flight work within a bounded time, writes a durable checkpoint, and exits with a success code.
- [ ] Pause produces a durable checkpoint from which resume continues without re-executing already-completed tasks.
- [ ] Resume after pause reaches the same terminal run state that an uninterrupted run reaches for the same input.
- [ ] An interrupt signal triggers graceful drain instead of an abrupt exit.
- [ ] Completion reporting distinguishes success, failure, and cancellation with distinct exit codes.
- [ ] Operator-facing command-line messages are Turkish while all identifiers, flags, and logs are English.
- [ ] Bootstrap does not write into the repository `tasks/` directory during tests.
- [ ] Unit tests cover bootstrap output, drain bounds, pause and resume equivalence, signal handling, and exit codes.
- [ ] All changed files remain inside this task's declared write scope.

## Expected artifacts

- Lifecycle control under `src/orchestrator/lifecycle/`.
- Command-line entry point under `bin/`.
- Unit tests under `tests/unit/orchestrator/lifecycle/`.

## Dependency notes

- `gate_passed(TASK-016, review)` supplies the bootstrap contract, drain, pause, resume, exit codes, and the A-003 live-run control protocol from `docs/architecture/runtime/LIFECYCLE-AND-BOOTSTRAP.md` at commit `9576fc9` **as amended by the TASK-016 commit that TASK-020 approves**. The rejected baseline alone is not the normative source; A-003 adds the live-run control protocol and the process-tree ownership rules this task implements.
- `integrated(TASK-006)` supplies the supervisor loop and terminal states. TASK-006 in turn carries the TASK-003, TASK-004, TASK-005, and TASK-017 edges, so this task does not restate them; the transitive closure is recorded in `tasks/TASK-001-DEPENDENCY-GRAPH.md`.
- May execute in parallel with TASK-008; their write scopes do not overlap.
- Required by TASK-011 for end-to-end validation.
- This task composes the object graph at the composition root. It constructs the workspace lifecycle from TASK-017 and the adapter registry from TASK-004 by injection; it does not reimplement either.

## Task-record lifecycle

This record's `status` field and its lifecycle directory are changed only by the Orchestrator under TASK-013. `tasks/**` is outside this role's configured write scope, so the owner of this task must not move or edit this file. The exclusion already stated in the scope above — that bootstrap does not add or edit repository task records under `tasks/` — is the runtime-behavior half of the same rule. Record the handoff in the commit message and the pull request description; the Orchestrator transcribes it into the section below.

## Handoff

Maintained by the Orchestrator under TASK-013 from the owner's commit and pull request.

- Commit or pull request:
- Verification:
- Known risks:
- Next owner: orchestrator via TASK-013, to route the change into TASK-009, TASK-010, and TASK-011
