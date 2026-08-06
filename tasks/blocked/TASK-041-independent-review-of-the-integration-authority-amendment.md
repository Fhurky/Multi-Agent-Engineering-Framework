---
task_id: TASK-041
title: Independent review of the autonomous integration authority amendment
status: blocked
owner_role: reviewer
llm: gpt
branch: agent/gpt/reviewer/task-041
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/gpt-reviewer-task-041
write_scope:
  - reports/code-review/TASK-040-INTEGRATION-AUTHORITY-REVIEW.md
dependencies:
  - task: TASK-040
    edge: review_ready
required_gates: []
pre_merge_gates: []
gate_for:
  - task: TASK-040
    gate: review
    round: 1
    verdict: pending
    gate_class: point
    retrospective: false
    gate_lineage: LIN-INTEGRATION-AUTHORITY-REVIEW
    lineage_round: 1
parent_task: TASK-001
publication_class: bootstrap
blocked_reason: TASK-040 has not published. It is now ready rather than blocked, because HUMAN-004 was approved at 7dc07488a5b1cac8b1327ebd63bf747adbe03c68 and ACT-019 released its human_decision edge, so this task is one step from dispatchable rather than two. The remaining step is TASK-040 reaching review_ready with an immutable published commit; nothing this task owns can shorten it.
superseded_blocked_reason: TASK-040 has not published. TASK-040 is itself blocked on the open governance decision HUMAN-004, so this task is two steps from dispatchable and the graph says so rather than presenting it as next.
governance_decision_context: HUMAN-004, approved at 7dc07488a5b1cac8b1327ebd63bf747adbe03c68 on human/decision/human-004-autonomous-merge, artifact plans/decisions/HUMAN-004-autonomous-merge-authority.md. It authorizes two executors rather than one, which is why this record's review scope was expanded by ACT-019. Read the decision at that commit; do not read it from TASK-040's transcription alone.
exit_condition: TASK-040 is review_ready, with an immutable published commit on agent/gpt/architect/task-040 readable from the shared Git common directory. This task does not wait for TASK-040 to be integrated, because it is the pre-merge gate that lets it be integrated.
review_target_base: TASK-040's declared scope_validation_base, resolved when TASK-040 publishes
review_target_applicability: applicable, not yet resolvable. This task diffs the TASK-040 branch against the integration-branch commit TASK-040 branched from, which is TASK-040's own recorded branch point. TASK-040 has not published, so that value is a reproducible expression rather than a hash, and this record does not guess it.
branch_point_of: integration/autonomous-runtime
scope_validation_base: git merge-base HEAD integration/autonomous-runtime
scope_validation_applicability: applicable, declared as a reproducible expression because this task's branch does not exist yet
scope_validation_note: Branch from integration/autonomous-runtime, then resolve the immutable branch point inside the worktree with git merge-base HEAD integration/autonomous-runtime and pass that value to -BaseRef. Record the resolved value in the report; the Orchestrator pins it at the next activation. Never pass origin/main, c325275, or a review-diff base.
---

# TASK-041: Independent review of the autonomous integration authority amendment

## Objective

Record `LIN-INTEGRATION-AUTHORITY-REVIEW` round 1: decide whether TASK-040's amendment defines an autonomous post-gate integration authority that is safe to build, and state plainly whether an implementation task may be created for it.

## Why this task exists

TASK-040 amends the approved architecture to grant **two** components authority that no component has today — merging into the shared integration branch, and merging that branch into `main`. That is the most consequential authority this graph has ever considered granting, because it is the point at which a passing gate becomes an irreversible shared-branch change with no human between the two, and because the second executor's target is the branch every safeguard in this repository is built around. It therefore gets its own independent verdict before any implementation task is created, in an execution context separate from TASK-040's.

**`HUMAN-004` is approved and it is the boundary, in both directions.** An amendment that assumes an authority the decision did not grant is a blocking finding; so is one that silently omits an authority the decision did grant, because the decision's own sequencing clause requires the amendment to cover task-to-integration **and** integration-to-`main` automation. Read the decision at `7dc07488a5b1cac8b1327ebd63bf747adbe03c68` yourself; do not take TASK-040's transcription of it as the source.

## Review target

Branch `agent/gpt/architect/task-040`, at the commit TASK-040's own record names, compared against its recorded branch point on `integration/autonomous-runtime`. In scope: `docs/architecture/ARCHITECTURE.md`, the amended documents under `docs/architecture/runtime/`, the new ADRs under `docs/adr/`, and any changed diagram under `diagrams/architecture/`.

The governance source you check the amendment against is `plans/decisions/HUMAN-004-autonomous-merge-authority.md` at `7dc07488a5b1cac8b1327ebd63bf747adbe03c68`. It is not part of the reviewed delta and must not be modified; it is the boundary the delta is judged against.

## Scope

Every item applies to **both** authorized executors unless it names one.

- Verify that the amendment cites the recorded `HUMAN-004` commit `7dc07488a5b1cac8b1327ebd63bf747adbe03c68` and stays inside the boundary that decision sets. **An amendment that assumes an authority the decision did not grant is a blocking finding, whatever its other merits.**
- **Verify coverage of both executors.** The decision authorizes a **runtime-owned** post-gate integration executor for the task-to-`integration/autonomous-runtime` merge and a **DevOps-owned** release merge executor for the `integration/autonomous-runtime`-to-`main` merge, and requires their implementation tasks to be owned separately. **An amendment that covers only the first, or that collapses the two into one component parameterized by target ref, does not satisfy the decision and is a blocking finding.**
- Verify each admission predicate against the graph's own typed vocabulary: that it cannot admit a target whose `pre_merge_gates` are not closed at the authoritative lineage round, cannot admit on a non-passing verdict, and cannot admit on a verdict the executor itself produced. For the **release** executor, verify additionally that it cannot admit unless all aggregate review, security, QA, performance, documentation, deployment, and rollback requirements declared for the release are complete — and judge whether the amendment expresses that in this graph's existing vocabulary or introduces new vocabulary, and if it introduces it, whether it says so.
- Verify that each refusal set is **total and typed**, and that each named structural prohibition — pushing `main`, `ALLOW_MAIN_PUSH`, `--no-verify`, force-pushing, bypassing hooks or branch protection, administrator override, disabling a required check, force-releasing a lock, modifying task ownership to make a merge admissible, writing or merging a governance path, using a mutable head where an immutable commit is required, treating a missing, skipped, timed-out, or cancelled check as passing, merging any ref other than the one that executor is configured for, and authoring, closing, overriding, or formally accepting a gate verdict — is **unconstructible rather than merely forbidden**, with the declared test that shows it.
- **Verify the `main` distinction specifically.** The DevOps executor is authorized to merge into `main` through the API under branch protection and is prohibited from pushing `main` or setting `ALLOW_MAIN_PUSH`. Judge whether the amendment makes the prohibited half unconstructible while the authorized half works, or whether it merely asserts the difference. This is the single place where an error would hand a component the capability the repository's pre-push hook exists to deny.
- Verify that neither executor can merge a target with an open blocking High or Critical security finding, and that the human exception set is enumerable, typed, has exactly the three members the decision names, and is **detectable** rather than discretionary — including what happens when an executor cannot classify a case, which the decision requires to be refusal with a typed exception record.
- Verify the fail-closed contract: that no path produces a routine human merge request for a conflict, stale head, missing check, ambiguous state, API failure, or unverifiable result, that evidence is preserved, that remediation is routed to the responsible agent role, and that retries are bounded.
- Verify that the durable-intent-before-side-effect ordering holds for each merge, that idempotency keys and durable intent and result records make a duplicate side effect after retry or restart unrepresentable, that ADR-0041's cumulative-unit rule and the `INTEGRATION-STRATEGY.md` integration order are preserved unchanged, and that the resulting `branch_integrated` fact is appended by an authorized appender and never by the Orchestrator or by the executor writing its own trigger.
- Verify the credential contract: least-privilege, short-lived, auditable, held outside the repository, carrying merge permission and **no bypass permission**, with no credential value, token, or secret-bearing endpoint appearing in any artifact.
- Verify that **`AGENTS.md` and `config/agents/settings.yaml` are unmodified by the amendment**, and that what the authorized `AGENTS.md` amendment must say is stated and returned rather than authored. Authoring it from an `agent/*` branch is a blocking finding regardless of content.
- Verify the module map, dependency graph, level witness, acyclicity, and two-independent-contract-roots property by **your own enumeration of the amendment's target tree**, under `MC-011`. Inherit no count from TASK-040's record, from this record, or from any earlier amendment. Judge whether each component's declared source path lies inside its owner role's declared `write_scope`, and whether the amendment **returned** any placement that does not rather than deciding it.
- Verify that the amendment states its relationship to the unimplemented `HUMAN-002` collector explicitly, and claims neither implies the other.
- Verify that the amendment does not reopen, retarget, or weaken any relation `LIN-ARCH-REVIEW` closed at round 8, and does not alter TASK-018's or TASK-019's gates, edges, or ordering.
- Exclude authoring or fixing the amendment, re-deciding or reinterpreting `HUMAN-004` beyond its text, approving any other role's gate, and creating any implementation task.

## Acceptance criteria

- [ ] Every scope item above receives an explicit `met` or `not met` judgment with file and line evidence.
- [ ] The verdict is one of `approved`, `approved-with-findings`, or `changes-required`, applied atomically to the single relation this task carries, and states plainly whether implementation tasks for the **two** executors may be created — separately owned by `runtime` and `devops`, as the decision requires.
- [ ] The report states explicitly whether the amendment covers **both** authorized merges, and quotes the evidence either way. A partially covering amendment cannot receive `approved`.
- [ ] Each finding records severity, file and line, and the responsible owner role. A finding whose owner is the Orchestrator is named as such rather than routed to the architect.
- [ ] The report states explicitly whether it found any path by which either executor could merge without a passing independent gate, and any path by which the release executor could reach `main` other than an API merge under branch protection, and quotes the evidence either way.
- [ ] No file outside `reports/code-review/TASK-040-INTEGRATION-AUTHORITY-REVIEW.md` is modified.
- [ ] `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree` reports a valid result and its output is recorded in the report.

## Expected artifacts

- `reports/code-review/TASK-040-INTEGRATION-AUTHORITY-REVIEW.md`.

## Write-scope isolation

This task's single file is path-disjoint from every other reviewer-owned report path in this graph. No resource lock is required.

## Gate and remediation path

This task performs the review gate TASK-040 declares, recorded as a `gate_for` reverse edge rather than a scheduling dependency. TASK-040 becomes integrable only after this verdict closes the relation. Findings return to the Orchestrator under TASK-013, which routes remediation to the architect in a new round of `LIN-INTEGRATION-AUTHORITY-REVIEW`; the reviewer does not implement the fix. Publishing this report is itself the ingress fact that wakes TASK-013; this task never writes under `tasks/`.

**Independence.** The architect and the reviewer are both `gpt` while `assignments.architect.llm` stands at `gpt`, so the repository's cross-family preference does not apply here. The mandatory guarantee is execution-context separation: this task must not run in TASK-040's execution context, and no script enforces that today.

## Operational steps

1. From the primary checkout, run `scripts/orchestration/create-worktree.ps1 -TaskId TASK-041 -Role reviewer -Llm gpt`.
2. Start the assigned CLI inside the returned worktree path and run `scripts/orchestration/claim-task.ps1 -TaskId TASK-041 -Role reviewer -Llm gpt` before editing.
3. Before handoff, run `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree`.
4. Commit, publish as the environment permits, and run `scripts/orchestration/release-task.ps1 -TaskId TASK-041 -Role reviewer -Llm gpt`. Never push `main`.

Do not move this record between lifecycle directories and do not edit its `status` field. `tasks/**` is outside the reviewer role's configured write scope.

## Handoff

Maintained by the Orchestrator under TASK-013 from the reviewer's report and pull request.

- Commit or pull request:
- Verification:
- Known risks:
- Next owner: orchestrator via TASK-013, to record the verdict and either route remediation or — only on a passing verdict — create the implementation tasks the amendment defines. There are **two** of them, owned separately by `runtime` and `devops`, plus the independent reviewer, security, QA, and failure-injection validation tasks `HUMAN-004` names. None exists today and none may be created before this verdict passes.
