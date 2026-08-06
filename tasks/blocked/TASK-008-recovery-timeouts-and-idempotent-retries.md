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
  - lineage: LIN-ARCH-REVIEW
    edge: gate_passed
    gate: review
    lineage_round: 6
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
parent_task: TASK-001
publication_class: runtime
normative_architecture_source: 9576fc9 as amended by 8d0c570, by c2ee3eb, by fe0374c, by 468b37b, and by the TASK-034 commit that TASK-035 approves. None of 9576fc9, 8d0c570, c2ee3eb, fe0374c, and 468b37b is approved — LIN-ARCH-REVIEW recorded changes-required at rounds 1, 2, 3, 4, and 5, the round-5 verdict at 3660cc2 — so each is a superseded authoring baseline to amend and never an approved source to build on. No approved architecture source exists yet: one comes into being only when LIN-ARCH-REVIEW records a passing or formally accepted authoritative verdict at lineage_round 6 or later, which TASK-035 owns. A record that cites any of the five as approved is a finding, and a record that attributes an approval to a round that recorded changes-required is a finding.
blocked_reason: TASK-015 returned changes-required on the base architecture and TASK-020 returned changes-required on the first amendment, so the recovery and retry contracts are not approved and findings A-001, A-002, and A-003 change the recovery batch, transition legality, and orphan termination behavior this task implements. The state store, error taxonomy, supervisor, and workspace lifecycle are not integrated. LIN-ARCH-REVIEW has since recorded changes-required at round 3 on the TASK-024 amendment c2ee3eb at aa38c7d2, at round 4 on the TASK-028 amendment fe0374c at 3df261fa, and at round 5 on the TASK-032 amendment 468b37b at 3660cc2, so the authoritative round is 5 and it failed. The remediation is TASK-034 and the revalidation is TASK-035 at round 6. This task is exactly as far from dispatch as it was before round 5.
exit_condition: The LIN-ARCH-REVIEW lineage records a passing or formally accepted authoritative verdict at lineage round 6 or higher, and TASK-003, TASK-004, TASK-006, and TASK-017 are integrated into integration/autonomous-runtime.
review_target_base: not applicable until this task publishes
review_target_applicability: not applicable yet. This task is gated but no artifact of it exists, so no round is pinned and there is no delta to diff. It becomes applicable when this task reaches review_ready; the Orchestrator records review_target_commit and review_target_base then, at the activation that consumes the publication, from the branch as published.
branch_point_of: integration/autonomous-runtime
scope_validation_base: git merge-base HEAD integration/autonomous-runtime
scope_validation_applicability: applicable, declared as a reproducible expression because this task's branch does not exist yet
scope_validation_note: Branch from integration/autonomous-runtime at or after the commit where this task's dependencies merged, then resolve the immutable branch point inside the worktree with git merge-base HEAD integration/autonomous-runtime and pass that value to -BaseRef. Record the resolved value in the handoff; the Orchestrator pins it at the next activation. Never pass origin/main, c325275, or a review-diff base. Findings F-403 and A-209 each recorded why.
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

- `gate_passed(TASK-016, review)` supplies the recovery phases, post-crash invariants, idempotency keys, effect ledger, and backoff policy from `docs/architecture/runtime/CRASH-RECOVERY.md` and `docs/architecture/runtime/RETRIES-TIMEOUTS-AND-IDEMPOTENCY.md` at commit `9576fc9` **as amended by the TASK-016 commit that TASK-020 approves**. The rejected baseline alone is not the normative source; A-001, A-002, and A-003 change the recovery batch, transition legality, and orphan termination behavior this task implements.
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
