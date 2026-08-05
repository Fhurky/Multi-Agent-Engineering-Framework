---
task_id: TASK-020
title: Independent review of the runtime architecture amendment
status: ready
owner_role: reviewer
llm: gpt
branch: agent/gpt/reviewer/task-020
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/gpt-reviewer-task-020
write_scope:
  - reports/code-review/TASK-016-ARCHITECTURE-AMENDMENT-REVIEW.md
dependencies:
  - task: TASK-016
    edge: review_ready
required_gates: []
pre_merge_gates: []
gate_for:
  - task: TASK-016
    gate: review
    round: 1
    verdict: pending
    gate_class: point
    retrospective: false
  - task: TASK-002
    gate: review
    round: 2
    verdict: pending
    gate_class: point
    retrospective: false
verdict_cardinality: one
verdict_application: atomic
verdict_note: This task records exactly one verdict. That single verdict is applied atomically to both gate relations above, producing two durable gate-verdict facts. Both relations close together or both stay open together; a split outcome is not representable.
parent_task: TASK-001
publication_class: bootstrap
remediates:
  - finding: F-205
    source: reports/code-review/TASK-001-DECOMPOSITION-REVIEW-ROUND-3.md
dependencies_satisfied:
  - task: TASK-016
    edge: review_ready
    satisfied_by_commit: 8d0c570
    satisfied_by_branch: agent/claude/architect/task-016
    published_remote_ref: origin/agent/claude/architect/task-016
    pull_request: https://github.com/Fhurky/Multi-Agent-Engineering-Framework/pull/3
    publication_class: bootstrap
    publication: published
    observed_as: ingress fact seq 6
    recorded_by: ACT-003
review_target_branch: agent/claude/architect/task-016
review_target_commit: 8d0c570
review_target_base: 9576fc9
---

# TASK-020: Independent review of the runtime architecture amendment

## Objective

Perform the independent review gate that TASK-016 declares, and decide whether the amended runtime architecture may be integrated and whether TASK-003 through TASK-008, TASK-017, and TASK-018 may leave `blocked`.

## Why this task exists rather than a second round of TASK-015

TASK-015 was declared re-entrant across two rounds against two different targets, with a `rounds` metadata block and a single `dependencies` entry naming only TASK-002. Finding F-102 in `reports/code-review/TASK-001-DECOMPOSITION-REVIEW.md` records the defect: round 2's dependency on TASK-016 was not machine-readable, the claimed topological order placed TASK-015 before TASK-016, and nothing required TASK-016 to publish before round 2 could start.

TASK-013 activation `ACT-001` removed the re-entrancy. TASK-015's round 1 verdict is durable and its record is `done`. This task carries the round 2 obligation as a first-class node with an explicit `review_ready(TASK-016)` dependency, so the scheduler can see it. Each round is now a task, and each task has exactly one dependency set and records exactly one verdict.

## Verdict cardinality — one verdict, two gate-verdict facts

Finding **F-205** in `reports/code-review/TASK-001-DECOMPOSITION-REVIEW-ROUND-3.md` recorded that this record previously stated three mutually inconsistent cardinalities: that each task records exactly one verdict, that this task performs two gates in one verdict, and that the report must record two verdicts. Activation `ACT-002` chose one model and states it here, in the gate section below, in `tasks/TASK-001-DEPENDENCY-GRAPH.md` gate-round rule clause 5, and in the frontmatter fields `verdict_cardinality` and `verdict_application`. It is stated identically in all four places.

**This task records exactly one verdict.** That single verdict is applied **atomically** to the two gate relations it carries, `(TASK-016, review, round 1)` and `(TASK-002, review, round 2)`, producing **two durable gate-verdict facts** — one per relation, so that each target reads its own gate status from its own relation. Both relations close together or both stay open together. A split outcome, in which the amendment is approved as an artifact but rejected as the remediation for A-001 … A-004 or the reverse, is deliberately not representable: the amendment *is* the remediation, so a judgment that separated them would have no coherent meaning.

The single verdict emits one `gate_verdict_recorded` ingress fact, whose payload names both relations it closes or leaves open. TASK-013 records both facts from that one event.

## Review target

Branch `agent/claude/architect/task-016`, at the immutable commit **`8d0c570`** `docs: amend the runtime architecture for TASK-016`, compared against `9576fc9` — the TASK-002 baseline this amendment revises. The target commit was published to `origin/agent/claude/architect/task-016` and opened as pull request #3; it branches from `c325275` and changes 29 files, all under `docs/` and `diagrams/`. TASK-013 activation `ACT-003` recorded that publication as ingress fact seq 6 and moved this record to `ready` on the strength of it. The target is immutable: a later activation does not change it.

Everything TASK-016 lists under **Expected artifacts** is in scope, including the amended `docs/architecture/ARCHITECTURE.md`, the amended documents under `docs/architecture/runtime/`, the new and superseding ADRs from `docs/adr/0011`, and the updated diagrams under `diagrams/architecture/`.

The round 1 baseline is `reports/code-review/TASK-002-ARCHITECTURE-REVIEW.md`. Read it first; this review decides whether its four findings are resolved.

## Scope

This task performs two gate relations and records **one** verdict for both. Both relations must be named separately in the report, and the report must state explicitly that the single verdict applies to both.

**Part A — remediation verification for TASK-002 round 2.** For each of A-001, A-002, A-003, and A-004, state one of `resolved`, `partially resolved`, or `not resolved`, with the file and line that supports the judgment.

| Finding | What the amendment must demonstrate |
|---|---|
| A-001 | A recoverable batch boundary is defined, the restore post-condition exposes a committed batch entirely or not at all, the false all-or-nothing claim is explicitly superseded, and crash-point test obligations are stated. |
| A-002 | Every recovery batch is legal by construction, each combination of lease state, ledger state, and elapsed deadline maps to exactly one legal transition, and the diagrams agree with the amended table. |
| A-003 | Live-run control and provider process-tree lifecycle each have exactly one owning module, and their contracts state transport, identity, acknowledgement, ordering, ownership check, stale-request behavior, owned process group or Job Object, bounded escalation, verified tree exit, and orphan detection. |
| A-004 | The contracts represent `review_ready` with its publication classes, `integrated`, **both forms of** `gate_passed` with gate and round and the rule that disambiguates them, `gate_recorded`, `pre_merge_gates`, gate scheduling class and retrospective status, named resource locks, and monotonic **event-ingress** activation with a durable cursor and a quiescent state. Acyclicity is proven across scheduling, gate, and integration preconditions together. **The ingress half is checked specifically:** the contracts must represent an ingress source set whose facts are produced by owners other than the recurring task, a cursor that is the only representation of consumption state, and an append-only consumption ledger that is never edited — the model `tasks/blocked/TASK-013-task-record-lifecycle-and-gate-closure.md` defines and that finding F-201 required. A contract in which the recurring task must write its own trigger, or in which consumption is represented by mutating a ledger row, is `not resolved`. |

**Part B — fresh review of the amendment as an architecture change.**

- Verify that the module map contains exactly seven modules, each with exactly one owner task, and that no runtime responsibility remains unassigned. The live-control and process-tree responsibilities from A-003 and the workspace lifecycle module are the ones this amendment adds.
- Verify that the workspace lifecycle contract states observable pre- and post-conditions for `prepare`, `finalize`, `abandon`, and `reconcile`, and that `finalize` covers branch publication, idempotent pull-request creation, durable branch/commit/pull-request identity, and an explicit blocked outcome when the remote or credentials are unavailable — the obligations finding F-105 recorded as missing.
- Verify that the amendment states that the runtime delegates to `scripts/orchestration/*.ps1` and never reimplements branch, worktree, lock, or write-scope logic, and that pushing `main`, bypassing the pre-push hook, setting `ALLOW_MAIN_PUSH`, and writing a governance path are each structurally unavailable rather than merely discouraged.
- Verify that the module dependency graph remains acyclic and that the two contract roots do not import each other.
- Verify that every change is an amendment naming what it supersedes, that no existing contract is silently rewritten, and that ADR-0004 and ADR-0009 are superseded explicitly where they are changed.
- Verify that each new ADR records context, decision, rejected alternatives, and consequences, and that no two ADRs decide the same question differently.
- Verify that the amended vocabulary matches `tasks/TASK-001-DEPENDENCY-GRAPH.md` name for name, so no task record must be restated to compile against the contracts. Report any divergence as a finding against the architect, not against the decomposition.
- Verify that the amendment does not require any agent to write outside its configured role scope and does not require a governance or enforcement file to change.
- Verify the language policy: English throughout, with Turkish reserved for user-visible command-line copy.
- Record each finding with a severity, the file and line, and the responsible owner role.
- Exclude authoring or amending any architecture document, deciding the architecture, reviewing runtime source code, reviewing the TASK-001 decomposition, and approving any other role's gate.

## Acceptance criteria

- [ ] Every artifact listed under **Review target** is covered, and coverage is stated explicitly, including artifacts reviewed with no finding.
- [ ] Each of A-001 through A-004 receives an explicit `resolved`, `partially resolved`, or `not resolved` disposition with supporting file and line evidence.
- [ ] Each new finding records a severity, the file and line, the affected task ID, and the responsible owner role, and uses an identifier that does not collide with round 1 — round 2 findings are numbered from A-101.
- [ ] The report records **exactly one** verdict, one of `approved`, `approved-with-findings`, or `changes-required`, with rationale, and states explicitly that it applies atomically to both gate relations — `(TASK-016, review, round 1)` and `(TASK-002, review, round 2)` — producing two durable gate-verdict facts that close together or stay open together. Recording two independent verdicts, or a verdict for one relation only, does not satisfy this criterion.
- [ ] The report states plainly whether the amendment may be integrated, and whether TASK-003 through TASK-008, TASK-017, and TASK-018 may leave `blocked` on the strength of these verdicts.
- [ ] Any runtime responsibility with no assigned module owner is reported explicitly, or its absence is stated explicitly.
- [ ] No file outside `reports/code-review/TASK-016-ARCHITECTURE-AMENDMENT-REVIEW.md` is modified by this task.
- [ ] `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree` reports a valid result and its output is recorded in the report.

## Expected artifacts

- `reports/code-review/TASK-016-ARCHITECTURE-AMENDMENT-REVIEW.md` containing the coverage statement, the A-001 through A-004 dispositions, the fresh findings, the single verdict, and the statement of its atomic application to both gate relations.

## Write-scope isolation

This task's single file is path-disjoint from TASK-009's `reports/code-review/REVIEW.md` and `reports/code-review/runtime/**`, and from the single files of TASK-014, TASK-015, TASK-019, and TASK-021. No resource lock is required, so this task may run concurrently with any other reviewer-owned task.

## Gate and remediation path

This task performs two gate relations, recorded as `gate_for` reverse edges rather than scheduling dependencies, both `gate_class: point` and `retrospective: false`. It becomes dispatchable when TASK-016 is `review_ready` — an immutable published commit, no merge required. **That edge is now satisfied**, at `8d0c570` with pull request #3, so this task is `ready`. TASK-016 becomes integrable only after this task's verdict closes its review gate, which is what removes finding F-101 for this pair. No verdict has been recorded for either relation; both `gate_for` entries remain `pending`, and the Orchestrator neither authored nor pre-judged one.

It also carries TASK-002's review gate at round 2. TASK-015 recorded `changes-required` at round 1 and TASK-016 is the remediation for that verdict, so the verdict on the remediation is what closes TASK-002's gate. Under the gate-round rule in `tasks/TASK-001-DEPENDENCY-GRAPH.md`, round 1's verdict stays recorded and is superseded, never rewritten.

**One verdict, applied atomically to both relations, yielding two durable gate-verdict facts.** This is the model stated in "Verdict cardinality" above, in the acceptance criteria, in the frontmatter, and in gate-round rule clause 5. Nothing in this record asks for two verdicts.

The reviewer is `gpt` and the architect is `claude`, so author and reviewer are in separate execution contexts and separate LLM families. This task reviews an artifact it did not author and did not previously review; TASK-015's execution context is not reused. Findings return to the Orchestrator under TASK-013, which routes a further amendment to the architect and creates the next round's reviewer task. The architect may not close either gate. Publishing this task's report is itself the ingress fact that wakes TASK-013; this task never writes under `tasks/`.

## Operational steps

1. From the primary checkout, run `scripts/orchestration/create-worktree.ps1 -TaskId TASK-020 -Role reviewer -Llm gpt`.
2. Start the assigned CLI inside the returned worktree path and run `scripts/orchestration/claim-task.ps1 -TaskId TASK-020 -Role reviewer -Llm gpt` before editing.
3. Review with `git diff 9576fc9..8d0c570`, and read `reports/code-review/TASK-002-ARCHITECTURE-REVIEW.md` first for the four round 1 findings this review decides on.
4. Before handoff, run `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree`.
5. Commit, publish the task branch and open or update a pull request when a remote and credentials are available — otherwise record `publication: local-only` with the reason — and run `scripts/orchestration/release-task.ps1 -TaskId TASK-020 -Role reviewer -Llm gpt`.

Do not move this record between lifecycle directories and do not edit its `status` field. `tasks/**` is outside the reviewer role's configured write scope. Record the handoff in the report and the pull request description; the Orchestrator performs the transition under TASK-013.

## Task-record lifecycle

This record's `status` field and its lifecycle directory are changed only by the Orchestrator under TASK-013.

## Handoff

Maintained by the Orchestrator under TASK-013 from the reviewer's report and pull request.

- Commit or pull request:
- Verification:
- Known risks:
- Next owner: orchestrator via TASK-013, to record the single verdict as two durable gate-verdict facts — closing the TASK-016 round 1 and TASK-002 round 2 relations together and unblocking TASK-018 and Wave 3 on a passing verdict, or leaving both open, routing findings back to the architect, and creating the next round's reviewer task
