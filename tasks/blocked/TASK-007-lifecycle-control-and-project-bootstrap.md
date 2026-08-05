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
    lineage_round: 5
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
parent_task: TASK-001
publication_class: runtime
normative_architecture_source: 9576fc9 as amended by 8d0c570, by c2ee3eb, by fe0374c, and by the TASK-032 commit that TASK-033 approves. None of 9576fc9, 8d0c570, c2ee3eb, and fe0374c is approved — LIN-ARCH-REVIEW recorded changes-required at rounds 1, 2, 3, and 4, the round-4 verdict at 3df261fa — so each is a superseded authoring baseline to amend and never an approved source to build on. No approved architecture source exists yet: one comes into being only when LIN-ARCH-REVIEW records a passing or formally accepted authoritative verdict at lineage_round 5 or later, which TASK-033 owns. A record that cites any of the four as approved is a finding, and a record that attributes an approval to a round that recorded changes-required is a finding.
blocked_reason: TASK-015 returned changes-required on the base architecture and TASK-020 returned changes-required on the first amendment, so the bootstrap and lifecycle contracts are not approved and finding A-003 adds the live run control protocol this task implements. The supervisor run loop is not integrated. LIN-ARCH-REVIEW has since recorded changes-required at round 3 on the TASK-024 amendment c2ee3eb at aa38c7d2 and at round 4 on the TASK-028 amendment fe0374c at 3df261fa, so the authoritative round is 4 and it failed. The remediation is TASK-032 and the revalidation is TASK-033 at round 5. This task is exactly as far from dispatch as it was before round 4.
exit_condition: The LIN-ARCH-REVIEW lineage records a passing or formally accepted authoritative verdict at lineage round 5 or higher, and TASK-006 is integrated into integration/autonomous-runtime.
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
