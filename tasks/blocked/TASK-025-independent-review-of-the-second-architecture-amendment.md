---
task_id: TASK-025
title: Independent review of the second runtime architecture amendment
status: blocked
owner_role: reviewer
llm: gpt
branch: agent/gpt/reviewer/task-025
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/gpt-reviewer-task-025
write_scope:
  - reports/code-review/TASK-024-ARCHITECTURE-AMENDMENT-REVIEW-ROUND-2.md
dependencies:
  - task: TASK-024
    edge: review_ready
required_gates: []
pre_merge_gates: []
gate_for:
  - task: TASK-024
    gate: review
    round: 1
    verdict: pending
    gate_class: point
    retrospective: false
    gate_lineage: LIN-ARCH-REVIEW
    lineage_round: 3
  - task: TASK-016
    gate: review
    round: 2
    verdict: pending
    gate_class: point
    retrospective: false
    gate_lineage: LIN-ARCH-REVIEW
    lineage_round: 3
  - task: TASK-002
    gate: review
    round: 3
    verdict: pending
    gate_class: point
    retrospective: false
    gate_lineage: LIN-ARCH-REVIEW
    lineage_round: 3
verdict_cardinality: one
verdict_application: atomic
verdict_note: This task records exactly one verdict. That single verdict is applied atomically to all three gate relations above, producing three durable gate-verdict facts. All three close together or all three stay open together; a split outcome is not representable.
parent_task: TASK-001
publication_class: bootstrap
remediates:
  - finding: A-101
    source: reports/code-review/TASK-016-ARCHITECTURE-AMENDMENT-REVIEW.md
    part: gate ownership for the remediation
supersedes: TASK-020
blocked_reason: TASK-024 has not published the second architecture amendment, so there is no immutable commit to review.
exit_condition: TASK-024 is review_ready, with an immutable published commit on agent/claude/architect/task-024. This task does not wait for TASK-024 to be integrated or to reach done, because it is the pre-merge gate that lets it be integrated.
---

# TASK-025: Independent review of the second runtime architecture amendment

## Objective

Record `LIN-ARCH-REVIEW` lineage round 3 — the independent review gate that TASK-024 declares — and decide whether the amended runtime architecture may be integrated and whether TASK-003 through TASK-008, TASK-017, TASK-018, and TASK-026 may leave `blocked`.

## Why this task exists rather than a second round of TASK-020

TASK-020 recorded one durable verdict, `changes-required` at commit `4874a9d`, and its record is `done`. Under the gate-round rule a recorded verdict is superseded rather than rewritten, and each superseding round is a new task with its own explicit dependency. This task carries the next round of the same lineage as a first-class node with an explicit `review_ready(TASK-024)` dependency, so the scheduler can see it.

TASK-020's execution context is not reused. This task must not be run by the execution that produced TASK-020's report.

## Verdict cardinality — one verdict, three gate-verdict facts

**This task records exactly one verdict.** That single verdict is applied **atomically** to the three relations it carries — `(TASK-024, review, round 1)`, `(TASK-016, review, round 2)`, and `(TASK-002, review, round 3)` — producing **three durable gate-verdict facts**, one per relation, so that each target reads its own gate status from its own relation. All three close together or all three stay open together.

A split outcome is deliberately not representable. TASK-024 *is* the remediation for TASK-020's verdict on TASK-016, which *is* the remediation for TASK-015's verdict on TASK-002. A judgment that approved the amendment as an artifact but rejected it as the remediation would have no coherent meaning.

The single verdict emits one `gate_verdict_recorded` fact, whose payload names all three relations it closes or leaves open. TASK-013 records three facts from that one event.

## Review target

Branch `agent/claude/architect/task-024`, at the immutable commit TASK-024 publishes, compared against **`8d0c570`** — the TASK-016 amendment this one revises. Read `9576fc9` for the original baseline where a judgment needs it.

Everything TASK-024 lists under **Expected artifacts** is in scope.

The two round baselines are `reports/code-review/TASK-002-ARCHITECTURE-REVIEW.md` (A-001 … A-004) and `reports/code-review/TASK-016-ARCHITECTURE-AMENDMENT-REVIEW.md` (A-101 … A-105, and the round-1 dispositions that left A-002, A-003, and A-004 open). Read both first; this review decides on all of them.

## Scope

This task performs three gate relations and records **one** verdict for all of them. All three must be named separately in the report, and the report must state explicitly that the single verdict applies to all three.

**Part A — remediation verification.** For each of A-101, A-102, A-103, A-104, A-105, and for the still-open A-002, A-003, and A-004, state one of `resolved`, `partially resolved`, or `not resolved`, with the file and line that supports the judgment.

| Finding | What the amendment must demonstrate |
|---|---|
| A-101 | The contracts model `publication_class`; the target and lineage forms of `gate_passed` with `round` and `lineage_round`; the withdrawal of the owner form as a load-time rejection; plural gate relations on one gate task with one atomic verdict; `gate_class`, per-pair `retrospective`, `gate_lineage`, and `lineage_round`; gate lineages with the authoritative-verdict rule; and all eight invariants. The activation contract models the three ingress surfaces with consumption state in the cursor alone. A current task record must compile against the contracts name for name. |
| A-102 | Registration is durable before the worker-owned spawn without any interface requiring a worker to append durable state and without a sequence diagram that violates the module boundary. No post-condition permits pause or drain to return while an unmanaged descendant survives. |
| A-103 | Workspace `prepare`, `finalize`, and `abandon` intent is durable before any script or Git side effect, through explicit phases or an append acknowledgement, and `abandoning` has an entering event. A crash mid-operation leaves discoverable durable intent. |
| A-104 | Recovery can construct a legal transition for a committed-but-unadopted result, and the fate of `proposedTasks` is stated rather than lost. |
| A-105 | Each diagram states the same allowed paths, terminal-event exceptions, and repository access paths as the normative contracts. |
| A-002 | Every recovery batch is legal by construction, each combination of lease state, ledger state, and elapsed deadline maps to exactly one legal transition, and the diagrams agree with the amended table. Round 2 judged this `partially resolved` because of A-104. |
| A-003 | Live-run control and provider process-tree lifecycle each have exactly one owning module with a complete contract. Round 2 judged this `partially resolved` because of A-102. |
| A-004 | The full typed scheduling and activation vocabulary is represented. Round 2 judged this `not resolved`; A-101 is its successor. |

**Part B — the ingress contract, checked specifically.** Finding F-301 in `reports/code-review/TASK-001-DECOMPOSITION-REVIEW-ROUND-4.md` is the reason this half exists. The contract is `not resolved` unless it represents each of the following, and each is checked individually:

- A durable append-only inbox whose entries carry a `seq` assigned **once** at append and never recomputed.
- A `fact_id` content hash as the entry's identity, and identity-keyed deduplication making append idempotent.
- A `content_hash` over the source artifact, sufficient to detect that the artifact was rewritten under the same path.
- Class precedence yielding at most one entry per source commit, with distinct commits remaining distinct facts.
- Batch ordering by a stable source identifier. A contract that orders by committer timestamp is `not resolved`.
- Retention independent of refs: deleting, rewriting, or garbage-collecting a branch cannot remove an entry or lower `ingress_seq`.
- Explicit exclusion of the recurring task's own commits from every fact class.
- `ingress_seq = max(seq)`, never a count over an observable set.
- Consumption state represented **only** by the cursor, with a separate append-only ledger written already consumed.
- Ingress epochs with a `seq_base`, and the rule that a prior epoch's entries are never re-derived, renumbered, or reclassified.
- An owning module for the inbox, mapped to exactly one owner task.

**Part C — fresh review of the amendment as an architecture change.**

- Verify that the module map contains exactly eight modules, each with exactly one owner task, and that no runtime responsibility remains unassigned.
- Verify that the module dependency graph remains acyclic and that the two contract roots do not import each other.
- Verify that the graph validator contract proves acyclicity for the **revision-5** graph across scheduling, gate, and integration preconditions together.
- Verify that every change is an amendment naming what it supersedes, that no existing contract is silently rewritten, and that every ADR whose decision changed carries an explicit supersession record.
- Verify that each new ADR records context, decision, rejected alternatives, and consequences, and that no two ADRs decide the same question differently.
- Verify that the structural prohibitions on pushing `main`, setting `ALLOW_MAIN_PUSH`, bypassing hooks, writing a governance path, and force-releasing a lock are not weakened.
- Verify that the amendment does not require any agent to write outside its configured role scope and does not require a governance or enforcement file to change.
- Verify the language policy: English throughout, with Turkish reserved for user-visible command-line copy.
- Record each finding with a severity, the file and line, the affected task ID, and the responsible owner role.
- Exclude authoring or amending any architecture document, deciding the architecture, reviewing runtime source code, reviewing the TASK-001 decomposition, and approving any other role's gate.

The decomposition is reviewed by **TASK-023**, not by this task. Report a divergence between the contracts and the decomposition as a finding against the architect; if you judge the decomposition itself to be at fault, say so and route it to the Orchestrator rather than deciding it here.

## Acceptance criteria

- [ ] Every artifact listed under **Review target** is covered, and coverage is stated explicitly, including artifacts reviewed with no finding.
- [ ] Each of A-101 … A-105 and the still-open A-002, A-003, and A-004 receives an explicit `resolved`, `partially resolved`, or `not resolved` disposition with supporting file and line evidence.
- [ ] Each of the eleven Part B ingress checks is assessed individually and reported as satisfied or not satisfied.
- [ ] Each new finding records a severity, the file and line, the affected task ID, and the responsible owner role, and uses an identifier that does not collide with earlier rounds — round 3 findings are numbered from **A-201**.
- [ ] The report records **exactly one** verdict, one of `approved`, `approved-with-findings`, or `changes-required`, with rationale, and states explicitly that it applies atomically to all three gate relations — `(TASK-024, review, round 1)`, `(TASK-016, review, round 2)`, and `(TASK-002, review, round 3)` — producing three durable gate-verdict facts that close together or stay open together. Recording more than one verdict, or a verdict for a subset of the relations, does not satisfy this criterion.
- [ ] The report states plainly whether the amendment may be integrated, and whether TASK-003 through TASK-008, TASK-017, TASK-018, and TASK-026 may leave `blocked`.
- [ ] Any runtime responsibility with no assigned module owner is reported explicitly, or its absence is stated explicitly.
- [ ] No file outside `reports/code-review/TASK-024-ARCHITECTURE-AMENDMENT-REVIEW-ROUND-2.md` is modified by this task.
- [ ] `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree` reports a valid result and its output is recorded in the report.

## Expected artifacts

- `reports/code-review/TASK-024-ARCHITECTURE-AMENDMENT-REVIEW-ROUND-2.md` containing the coverage statement, the Part A dispositions, the eleven Part B ingress assessments, the fresh findings, the single verdict, and the statement of its atomic application to all three gate relations.

## Write-scope isolation

This task's single file is new and path-disjoint from TASK-009's `reports/code-review/REVIEW.md` and `reports/code-review/runtime/**`, and from the single files of TASK-014, TASK-015, TASK-019, TASK-020, TASK-021, TASK-022, and TASK-023. No resource lock is required, so this task may run concurrently with any other reviewer-owned task.

## Gate and remediation path

This task records three gate relations as `gate_for` reverse edges rather than scheduling dependencies. Their `gate_class`, `retrospective`, `gate_lineage`, and `lineage_round` are declared in the frontmatter above and summarized in the aggregate and retrospective gate register in `tasks/TASK-001-DEPENDENCY-GRAPH.md`; this body does not restate them. It becomes dispatchable when TASK-024 is `review_ready` — an immutable published commit, no merge required. TASK-024 becomes integrable only after this task's verdict closes its review gate.

**One verdict, applied atomically to three relations, yielding three durable gate-verdict facts.** This is the model stated in "Verdict cardinality" above, in the acceptance criteria, in the frontmatter fields `verdict_cardinality` and `verdict_application`, and in gate-round rule clause 5.

The reviewer is `gpt` and the architect is `claude`, so author and reviewer are in separate execution contexts and separate LLM families. This task reviews an artifact it did not author and did not previously review; neither TASK-015's nor TASK-020's execution context is reused. The architect may not close any of these gates. Publishing this task's report is itself the ingress fact that wakes TASK-013; this task never writes under `tasks/`.

## Operational steps

1. From the primary checkout, run `scripts/orchestration/create-worktree.ps1 -TaskId TASK-025 -Role reviewer -Llm gpt`.
2. Start the assigned CLI inside the returned worktree path and run `scripts/orchestration/claim-task.ps1 -TaskId TASK-025 -Role reviewer -Llm gpt` before editing.
3. Review with `git diff 8d0c570..<TASK-024 commit>`, and read both baseline reports first for the findings this review decides on.
4. Before handoff, run `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree`.
5. Commit, publish the task branch and open or update a pull request when a remote and credentials are available — otherwise record `publication: local-only` with the reason — and run `scripts/orchestration/release-task.ps1 -TaskId TASK-025 -Role reviewer -Llm gpt`.

Do not move this record between lifecycle directories and do not edit its `status` field. `tasks/**` is outside the reviewer role's configured write scope. Record the handoff in the report and the pull request description; the Orchestrator performs the transition under TASK-013.

## Task-record lifecycle

This record's `status` field and its lifecycle directory are changed only by the Orchestrator under TASK-013.

## Handoff

Maintained by the Orchestrator under TASK-013 from the reviewer's report and pull request.

- Commit or pull request:
- Verification:
- Known risks:
- Next owner: orchestrator via TASK-013, to record the single verdict as three durable gate-verdict facts — closing the TASK-024 round 1, TASK-016 round 2, and TASK-002 round 3 relations together and unblocking TASK-018 and Wave 3 on a passing verdict, or leaving all three open, routing findings back to the architect, and creating the next round's reviewer task
