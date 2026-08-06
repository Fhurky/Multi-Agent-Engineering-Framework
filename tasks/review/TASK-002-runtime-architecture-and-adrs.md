---
task_id: TASK-002
title: Define the autonomous runtime architecture and decision records
status: review
owner_role: architect
llm: claude
branch: agent/claude/architect/task-002
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/claude-architect-task-002
write_scope:
  - docs/architecture/ARCHITECTURE.md
  - docs/architecture/**
  - docs/adr/**
  - diagrams/architecture/**
resource_lock: architecture-docs
dependencies: []
required_gates:
  - review
pre_merge_gates:
  - review
gate_tasks:
  - task: TASK-015
    gate: review
    round: 1
    verdict: changes-required
    verdict_recorded_at: 8632469
    remediated_by: TASK-016
    revalidated_by: TASK-020
    gate_class: point
    retrospective: false
    gate_lineage: LIN-ARCH-REVIEW
    lineage_round: 1
  - task: TASK-020
    gate: review
    round: 2
    verdict: changes-required
    verdict_recorded_at: 4874a9d
    remediated_by: TASK-024
    revalidated_by: TASK-025
    gate_class: point
    retrospective: false
    gate_lineage: LIN-ARCH-REVIEW
    lineage_round: 2
  - task: TASK-025
    gate: review
    round: 3
    verdict: changes-required
    verdict_recorded_at: aa38c7d2e095f6ffd108bbd737a9862e1bff3ec2
    remediated_by: TASK-028
    revalidated_by: TASK-029
    gate_class: point
    retrospective: false
    gate_lineage: LIN-ARCH-REVIEW
    lineage_round: 3
  - task: TASK-029
    gate: review
    round: 4
    verdict: changes-required
    verdict_recorded_at: 3df261fa8f3a65bb20b9c5d6d316d8cb600a0d8c
    remediated_by: TASK-032
    revalidated_by: TASK-033
    gate_class: point
    retrospective: false
    gate_lineage: LIN-ARCH-REVIEW
    lineage_round: 4
  - task: TASK-033
    gate: review
    round: 5
    verdict: changes-required
    verdict_recorded_at: 3660cc2bf0bbe5bfcf4c76ad2c3401d4c4bfa0da
    remediated_by: TASK-034
    revalidated_by: TASK-035
    gate_class: point
    retrospective: false
    gate_lineage: LIN-ARCH-REVIEW
    lineage_round: 5
  - task: TASK-035
    gate: review
    round: 6
    verdict: changes-required
    verdict_recorded_at: afed1012b5f6a6febe33a0a007234fbaba987a38
    remediated_by: TASK-036
    revalidated_by: TASK-037
    gate_class: point
    retrospective: false
    gate_lineage: LIN-ARCH-REVIEW
    lineage_round: 6
  - task: TASK-037
    gate: review
    round: 7
    verdict: changes-required
    verdict_recorded_at: 9bb75d9705533e52e150cafb6fa87a382496c90c
    remediated_by: TASK-038
    revalidated_by: TASK-039
    gate_class: point
    retrospective: false
    gate_lineage: LIN-ARCH-REVIEW
    lineage_round: 7
  - task: TASK-039
    gate: review
    round: 8
    verdict: pending
    gate_class: point
    retrospective: false
    gate_lineage: LIN-ARCH-REVIEW
    lineage_round: 8
parent_task: TASK-001
publication_class: bootstrap
published_commit: 9576fc9
published_branch: agent/claude/architect/task-002
publication: local-only
publication_reason: The executing session recorded that no push and no merge were performed.
review_target_base: a117f9b18e77167f03c027a9ab23543f6848e53a
review_target_applicability: applicable and resolved
review_target_note: TASK-015 round 1 reviewed the immutable commit 9576fc9 against the branch ref agent/claude/orchestrator/task-001, whose head is 657b83a; the authored delta is a117f9b...9576fc9, 25 files, all under docs/ and diagrams/. a117f9b is recorded here because it is the base that delta actually resolves against and is reproducible with git diff --name-only a117f9b...9576fc9. Rounds 2 and 3 reviewed the TASK-016 and TASK-024 remediations against their own bases, recorded on those records; this field names the base of the artifact this record owns.
branch_point_of: agent/claude/orchestrator/task-001
scope_validation_base: a117f9b18e77167f03c027a9ab23543f6848e53a
scope_validation_applicability: applicable and resolved
scope_validation_note: Resolved by activation ACT-006 from the repository rather than asserted. This branch has one authored commit, 9576fc9, whose parent is a117f9b, and git merge-base agent/claude/architect/task-002 agent/claude/orchestrator/task-001 returns a117f9b. git diff --name-only a117f9b...9576fc9 returns 25 paths, every one under docs/ or diagrams/architecture/, which is inside this task's declared write scope. The execution is closed, so this value is durable provenance; it is also the acceptance base and it reproduces today.
---

# TASK-002: Define the autonomous runtime architecture and decision records

## Objective

Produce the approved architecture and decision records for a single-command autonomous supervisor that starts, gracefully pauses, checkpoints, resumes, recovers, and completes multi-agent project runs, so that runtime implementation can proceed against stable contracts.

## Scope

- Define the runtime component boundaries for supervisor, durable state store, scheduler, provider adapters, lifecycle control, and recovery, and map each boundary to exactly one implementation task among TASK-003 through TASK-008.
- Define the deterministic run and task state machine, including the legal transitions and the terminal states used for completion.
- Define durable checkpoint semantics, the checkpoint record contract, and the resume-from-checkpoint contract.
- Define lease acquisition, lease renewal, lease expiry, and monotonic fencing token semantics for bounded-concurrency scheduling.
- Define idempotency keys, retry classification, backoff policy, and the exactly-once-effect guarantee expected from retried work.
- Define the provider adapter interface, its error taxonomy, and how provider-specific behavior stays out of the supervisor.
- Define the one-input project bootstrap contract, including how a single project input deterministically produces the initial Manager task record.
- Define the crash-recovery contract, including which invariants must hold after an abrupt process termination.
- Record each cross-cutting decision as an Architecture Decision Record under `docs/adr/`.
- Exclude runtime implementation, test authorship, task decomposition, independent approval, and release.

## Acceptance criteria

- [x] Every component boundary named in this task maps to exactly one implementation task among TASK-003 through TASK-008, with no shared module ownership.
- [x] The run and task state machine is documented as an explicit transition table with terminal states and illegal transitions.
- [x] Checkpoint, resume, lease, fencing token, idempotency, retry, timeout, and crash-recovery contracts are each specified with observable pre- and post-conditions.
- [x] The interface contracts consumed across implementation tasks are documented before implementation starts, so that TASK-003 through TASK-008 do not have to negotiate contracts during execution.
- [x] The one-input project bootstrap contract specifies its single input, its deterministic output, and that it creates the initial Manager task record without an additional operator step.
- [x] Each cross-cutting decision has an ADR that records context, decision, alternatives, and consequences.
- [x] All changed files remain inside this task's declared write scope.

These boxes record the author's own assessment. They are not an approval, and they are **contradicted by the independent gate**. TASK-015 round 1 judged three of the seven criteria `not met` and one `met with blocking inconsistency`, and returned `changes-required` with findings A-001 through A-004 in `reports/code-review/TASK-002-ARCHITECTURE-REVIEW.md`.

## Review gate status

| Round | Owner | Verdict | Commit | Findings |
|---|---|---|---|---|
| 1 | TASK-015, `reviewer` / `gpt` | `changes-required` | `8632469`, merged at `049158d` | A-001 … A-004, all High |
| 2 | TASK-020, `reviewer` / `gpt` | `changes-required` | `4874a9d` | A-101 … A-105. Dispositions: A-001 `resolved`; A-002 and A-003 `partially resolved`; A-004 `not resolved` |
| 3 | TASK-025, `reviewer` / `gpt` | `changes-required` | `aa38c7d2` | A-201 … A-207 High, A-208 Medium, A-209 Medium. Dispositions: A-101 `not resolved`; A-102 `not resolved`; A-103 `partially resolved`; A-104 `not resolved`; A-105 `partially resolved`; A-002 and A-003 `partially resolved`; A-004 `not resolved` |
| 4 | TASK-029, `reviewer` / `gpt` | pending | — | Verifies that TASK-028 resolves A-201 … A-208 and the still-open A-002, A-003, A-004, and A-101 … A-105, and judges the approved `HUMAN-002` observer contract |

The gate remains **open**, and has now recorded `changes-required` at every one of its three completed rounds. Under the gate-round rule in `tasks/TASK-001-DEPENDENCY-GRAPH.md`, each round's verdict is durable and is superseded rather than rewritten. This record reaches `done` only when a round records a passing verdict.

All four rounds are rounds of the gate lineage `LIN-ARCH-REVIEW`, whose cohort is this record, then TASK-016, then TASK-024, then TASK-028. The lineage is what the architecture-approval edge held by TASK-003 … TASK-008, TASK-017, TASK-018, and TASK-026 names, so that edge does not have to be retargeted each time a round is superseded. That retyping is the remediation for finding F-302. Activation `ACT-006` raised that edge's floor from `lineage_round: 3` to `4`, because the amendment carrying A-201 … A-208 must be the approved one and a passing verdict at round 3 will never exist.

TASK-020 recorded **exactly one verdict**, applied atomically to the two relations it carried — this record's round 2 relation and TASK-016's round 1 relation — producing two durable gate-verdict facts. Both stayed open together. TASK-025 carries three relations and records one verdict on the same terms. Finding F-205 recorded that TASK-020's record previously stated three inconsistent cardinalities; activation `ACT-002` chose this one model and stated it in every place that describes it.

The remediation is routed to **TASK-016**, which the Orchestrator reframed under TASK-013 activation `ACT-001` to carry all four findings alongside the workspace lifecycle module. The architect owns the resolution; the Orchestrator neither judges the findings nor decides the architecture.

Because `gate_passed(TASK-002, review)` is not satisfied at round 1 and cannot become satisfied there, the architecture-approval edge held by TASK-003 through TASK-008, TASK-017, and TASK-018 was retargeted to `gate_passed(TASK-016, review)`. The approved architecture is `9576fc9` as amended by TASK-016. This record is not superseded by that retargeting; it remains the baseline the amendment revises.

## Expected artifacts

- `docs/architecture/ARCHITECTURE.md` updated with the runtime architecture summary.
- Detailed runtime architecture documents under `docs/architecture/`.
- ADRs under `docs/adr/` for the state machine, durable state, leasing and fencing, retry and idempotency, provider adapter boundary, and bootstrap contract.
- Optional component and sequence diagrams under `diagrams/architecture/`.

## Delivered artifacts

Commit `9576fc9` on `agent/claude/architect/task-002`, 25 files, 2862 insertions:

- `docs/architecture/ARCHITECTURE.md` — runtime architecture summary.
- `docs/architecture/runtime/COMPONENT-BOUNDARIES.md` — module map, contract roots, allowed import directions, cross-cutting rules.
- `docs/architecture/runtime/INTERFACE-CONTRACTS.md` — normative cross-module types.
- `docs/architecture/runtime/STATE-MACHINE.md` — run and task transition tables, terminal and illegal transitions, dynamic admission guards.
- `docs/architecture/runtime/DURABLE-STATE-AND-CHECKPOINTS.md` — append-only journal, atomic checkpoints, monotonic versioning, compare-and-set append, single-writer lock.
- `docs/architecture/runtime/LEASES-AND-SCHEDULING.md` — leases, fencing tokens, bounded concurrency, write-scope exclusion, deterministic dispatch order.
- `docs/architecture/runtime/PROVIDER-ADAPTERS.md` — adapter boundary, closed ten-member failure taxonomy, layered timeouts, credential rules.
- `docs/architecture/runtime/RETRIES-TIMEOUTS-AND-IDEMPOTENCY.md` — idempotency keys, intent-then-commit effect ledger, seeded backoff, bounded retries.
- `docs/architecture/runtime/LIFECYCLE-AND-BOOTSTRAP.md` — one-input bootstrap, graceful drain, pause, resume, exit codes.
- `docs/architecture/runtime/CRASH-RECOVERY.md` — seven recovery phases, twelve post-crash invariants.
- `docs/architecture/runtime/INTEGRATION-STRATEGY.md` — branch topology, merge order, contract change control.
- `docs/adr/0001` through `docs/adr/0010`, plus `docs/adr/README.md`.
- `diagrams/architecture/runtime-components.md`, `runtime-state-machine.md`, `runtime-sequences.md`.

## Dependency notes

- This task has no dependencies and is the first executable node of the TASK-001 graph.
- TASK-003 through TASK-008 remain blocked. Their architecture edge is now `gate_passed(TASK-016, review)`, because TASK-015 round 1 returned `changes-required` on this task and the approved architecture is this commit as amended. See the edge vocabulary in `tasks/TASK-001-DEPENDENCY-GRAPH.md`.
- This task holds resource lock `architecture-docs`. TASK-016 amends the same documents. The two are serialized by the lock; this task's execution released it, so TASK-016 may be claimed.

## Routing items raised by this task for the Orchestrator

The architect recorded two items it could not resolve inside its own role boundary. Both are now routed:

1. **No task owns the runtime toolchain.** `docs/architecture/runtime/INTEGRATION-STRATEGY.md` and ADR-0001 record that the root manifests and `scripts/quality/**` are outside every configured role write scope, so Wave 2 cannot compile. Routed to **TASK-018**. The ownership question was resolved by human decision HUMAN-001 at commit `fb9f45c`, which added all four paths to `assignments.devops.write_scope`. TASK-018 now blocks only on the architecture gate.
2. **No module owns the isolated agent workspace lifecycle.** `AgentInvocation` carries `worktreePath` and `branch`, and `LIFECYCLE-AND-BOOTSTRAP.md` states the runtime resolves the worktree at dispatch, but the module map has no owner for creating it. Routed to **TASK-016** for the architecture amendment and **TASK-017** for the implementation.

## Handoff

- Commit or pull request: commit `9576fc9`, `docs: define the autonomous runtime architecture and decision records`, on branch `agent/claude/architect/task-002`. No push and no merge were performed by that execution.
- Verification recorded by the author: `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree -BaseRef agent/claude/orchestrator/task-001` reported valid over 25 files; `scripts/ci/validate-framework.ps1` and `scripts/ci/test-orchestration.ps1` passed; 77 relative document links resolved. This is the author's own evidence and is not a substitute for the TASK-015 gate.
- Known risks:
  - The module map has six modules and no owner for the agent workspace lifecycle. TASK-016 must amend it before TASK-017 can implement against it.
  - Wave 2 cannot compile until TASK-018 lands a toolchain, and TASK-018 is blocked on a human write-scope decision.
  - The two contract roots live inside TASK-003's and TASK-004's write scopes, so those tasks can physically change a normative contract. The contract change control procedure in `INTEGRATION-STRATEGY.md` is the only control; TASK-015 should confirm it is enforceable by review.
- Gate outcome transcribed by the Orchestrator under TASK-013 activation `ACT-001`: TASK-015 round 1 recorded `changes-required` at commit `8632469`, merged at `049158d`, with findings A-001 through A-004, all High. The report states that TASK-003 through TASK-008 and TASK-017 must remain `blocked` on the strength of that verdict, and that all 25 target files were covered. Every finding is routed to TASK-016; the mapping is in `tasks/TASK-013-ACTIVATION-LOG.md`.
- Next owner: **architect / claude for TASK-024**, then **reviewer / gpt for TASK-025**, which records round 3 of this record's review gate. TASK-020 recorded `changes-required` at `4874a9d`: it judged A-001 `resolved`, A-002 and A-003 `partially resolved`, and A-004 `not resolved`, and added A-101 … A-105. The TASK-016 amendment is therefore delivered but not approved, and this record's gate stays **open** at round 2 with round 3 pending. It stays in `tasks/review/`. The Claude Architect that authored this output may not close that gate. After a round records a passing verdict, the Orchestrator unblocks TASK-018 and then Wave 3 under TASK-013.
- Task lock released: yes, by the TASK-002 execution.
</content>
