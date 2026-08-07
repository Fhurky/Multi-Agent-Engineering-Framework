---
task_id: TASK-042
title: Second integration-authority amendment for the round-1 blocking findings
status: ready
owner_role: architect
llm: gpt
branch: agent/gpt/architect/task-042
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/gpt-architect-task-042
write_scope:
  - docs/architecture/ARCHITECTURE.md
  - docs/architecture/runtime/**
  - docs/adr/**
  - diagrams/architecture/**
resource_lock: architecture-docs
dependencies:
  - task: TASK-041
    edge: gate_recorded
    satisfied: true
    satisfied_at: ec533fb5bb0055675fb81f72057d5636f7867db3
    satisfied_by: ACT-021 consuming ingress entry seq 29, class gate_verdict_recorded
required_gates:
  - review
pre_merge_gates:
  - review
gate_tasks:
  - task: TASK-044
    gate: review
    round: 1
    verdict: pending
    gate_class: point
    retrospective: false
    gate_lineage: LIN-INTEGRATION-AUTHORITY-REVIEW
    lineage_round: 2
parent_task: TASK-001
publication_class: bootstrap
normative_architecture_source: 8ea5c32789ee01fd4a2cec4aff13905b120edae3, the immutable TASK-038 target, approved by LIN-ARCH-REVIEW at lineage_round 8 at 734bdbc and integrated onto integration/autonomous-runtime at de3a8d6. This task amends that approved baseline as extended by TASK-040 at 5e5fc8fe656b0e08a5337642447d7a81f83c4822; it does not replace either and does not reopen any relation LIN-ARCH-REVIEW closed at round 8.
governance_decision_context: HUMAN-004, approved at 7dc07488a5b1cac8b1327ebd63bf747adbe03c68 on human/decision/human-004-autonomous-merge, artifact plans/decisions/HUMAN-004-autonomous-merge-authority.md. Read the decision at that commit. Do not read it from TASK-040's transcription, from this record, or from the round-1 report alone. The decision is the boundary in both directions, and TASK-041 recorded that the amendment currently exceeds it.
predecessor_target: 5e5fc8fe656b0e08a5337642447d7a81f83c4822, the immutable TASK-040 target judged changes-required at LIN-INTEGRATION-AUTHORITY-REVIEW lineage_round 1.
integration_ancestry:
  branch_from: 5e5fc8fe656b0e08a5337642447d7a81f83c4822
  verified_at: ACT-021
  verification: git branch -a --contains 5e5fc8fe656b0e08a5337642447d7a81f83c4822 returns agent/gpt/architect/task-040 and remotes/origin/agent/gpt/architect/task-040. The commit exists, is immutable, is published on origin, and is reachable from this clone, so this instruction is satisfiable. Under MC-010 the Orchestrator read the ancestry rather than inferring it.
  why_not_content_import: The LIN-ARCH-REVIEW rounds 5 through 8 reconstructed their predecessor by content import because that predecessor was rejected and unmergeable. TASK-040 is not in that condition. Pull request 22 is OPEN, MERGEABLE, and CLEAN against integration/autonomous-runtime, so true ancestry is available and is preferred. This task's publication then becomes the single cumulative content unit for this lineage, which is the shape ADR-0041 requires and which A-601 was opened to establish.
  known_divergence: This branch point does not contain 461511437a26a57fe9a976c5ce3222ca123084d1, the current head of integration/autonomous-runtime. That commit is a one-parent operator synchronization whose only changed paths are under tasks/**, which is outside this role's write scope and outside the reviewed delta. The two lines diverge only between tasks/** and docs/**. This is recorded so that no reader infers an ancestry that does not exist and no owner treats the difference as a conflict to resolve.
review_target_base: c95ce600b40ab2dbac73da44a21bbb7a207c444d
review_target_applicability: applicable and resolved at ACT-021. Round 2 diffs this task's published head against this base, which is TASK-040's own immutable branch point on integration/autonomous-runtime, so the round sees the complete integration-authority amendment rather than only the correction to it. That is required, because round 2 carries a relation for TASK-040 as well as for this task. The value was read with git merge-base agent/gpt/architect/task-040 integration/autonomous-runtime at ACT-021 and independently confirmed as the parent of TASK-040's first authored commit d2c599696d25bc8938ef43514e8dc37aad70b047. It is deliberately not de3a8d6, not 4615114, not origin/main, and not this branch's own branch point.
review_target_commit: not yet published. Pinned by the activation that consumes this task's publication, bound to the branch head rather than to any earlier authored commit, under the head-binding rule ACT-009, ACT-013, ACT-015, and ACT-020 each applied.
branch_point_of: agent/gpt/architect/task-040
scope_validation_base: git merge-base HEAD agent/gpt/architect/task-040
scope_validation_applicability: applicable, declared as a reproducible expression because this task's branch does not exist yet. It is this task's own branch point and is unrelated to review_target_base above, which belongs to the delta under review; findings F-403 and A-209 required the two to stay separate fields.
scope_validation_note: Create agent/gpt/architect/task-042 from 5e5fc8fe656b0e08a5337642447d7a81f83c4822, then resolve the immutable branch point inside the worktree with git merge-base HEAD agent/gpt/architect/task-040 and pass that value to -BaseRef. The expected resolution is 5e5fc8fe656b0e08a5337642447d7a81f83c4822 itself, so the acceptance command attributes only this task's authored delta and not TASK-040's 18 paths. Never pass c95ce600, de3a8d6, 4615114, origin/main, or a review-diff base. If the resolved value disagrees with what this record anticipates, report the actual provenance rather than substituting a base that passes; A-209 records what happens otherwise.
---

# TASK-042: Second integration-authority amendment for the round-1 blocking findings

## Objective

Amend the integration-authority architecture so that the three findings `LIN-INTEGRATION-AUTHORITY-REVIEW` round 1 recorded against the architect are resolved, and so that a later round can decide whether implementation tasks for the two `HUMAN-004` executors may be created.

**This task authors a contract. It does not authorize the capability, does not build it, and does not decide whether it is now safe.** The authorization is `HUMAN-004`; the judgment is TASK-044's; the implementations are tasks that do not exist and **may not be created until a `LIN-INTEGRATION-AUTHORITY-REVIEW` round records a passing verdict.**

## The verdict this task remediates

**`LIN-INTEGRATION-AUTHORITY-REVIEW` lineage round 1 recorded `changes-required`** at commit `ec533fb5bb0055675fb81f72057d5636f7867db3` on `agent/gpt/reviewer/task-041`, published as pull request 23, artifact `reports/code-review/TASK-040-INTEGRATION-AUTHORITY-REVIEW.md`. The verdict applies to the single relation `(TASK-040, review, round 1)`, which **stays open** and is superseded by round 2.

**Read the report at that commit.** The dispositions below are the Orchestrator's routing of it, not a substitute for it, and the reviewer's own "Required remediation" line under each finding is the authoritative statement of what must change.

The report is explicit about what the verdict forbids: the Orchestrator "**must not create either the separately owned runtime implementation task or the separately owned DevOps implementation task** from this amendment", and "no implementation or validation task authorized by HUMAN-004 may be created until a later architecture amendment receives a passing independent review round". No such task exists.

## Findings routed to this task

| Finding | Severity | What the reviewer recorded | Where the reviewer located it |
|---|---|---|---|
| **F-041-01** | High | Generic formal acceptance can admit a non-passing independent gate. The executor reuses the lineage-form `gate_passed` predicate, which the graph defines as satisfied when the authoritative verdict is "passing **or formally accepted**", and it does not require the acceptance to be the exact immutable High/Critical accepted-security-risk record. `HUMAN-004` permits formal acceptance only for an unresolved blocking High or Critical security risk | `docs/architecture/runtime/POST-GATE-MERGE-EXECUTORS.md:76`; inherited predicate at `tasks/TASK-001-DEPENDENCY-GRAPH.md:125,133`; boundary at `plans/decisions/HUMAN-004-autonomous-merge-authority.md:23,41,51-52` at `7dc0748` |
| **F-041-02** | High | Live no-bypass verification is not constructible with the declared credential boundary. The contract requires digest equality with live branch protection and live proof that neither App is a bypass actor, while withholding Administration and ruleset administration — and GitHub's documented contracts do not expose that information under the granted permissions | `docs/architecture/runtime/POST-GATE-MERGE-EXECUTORS.md:37,204,292,301,303-310`; `docs/architecture/runtime/INTEGRATION-STRATEGY.md:259` |
| **F-041-04** | Medium | Owner verification is not bound to the published head. The pull request records "write scope: valid, 17 changed files" and 570 checked links, which describe `d2c5996`; the published head has 18 paths and 602 links, and the second commit changed two documents that the recorded verification never covered | Pull request 22 description, `Verification` section; interval `d2c5996..5e5fc8f` |

**F-041-03 is not yours.** It is High, its responsible owner is `devops`, and it is routed to **TASK-043**. Do not attempt to produce, trigger, or assert a continuous-integration result, and do not treat the absence of one as an architecture defect to fix in a document.

## What round 1 recorded as met, and what that does and does not mean

The report judged **twenty-two of twenty-six scope items `met`**, including both-executor coverage, typed admission and refusal totality, the structural impossibility of a direct `main` push, durable-intent-before-side-effect ordering, exactly-once recovery, bounded retries, ADR-0041 order preservation, the authorized-appender rule, credential confinement, the untouched governance paths, owner write-scope placement, the module and level proof, the `HUMAN-002` separation, and the preservation of every relation `LIN-ARCH-REVIEW` closed at round 8.

**A majority of satisfied checks is not a passing verdict, and this record does not present it as one.** `ACT-008` recorded the same shape at `LIN-ARCH-REVIEW` round 4, where all six `HUMAN-002` Part B properties were individually satisfied inside a `changes-required` verdict. What the met items buy is a narrower remediation: **do not re-author what round 1 judged sound, and do not regress it.** Round 2 re-verifies every one of them regardless, because a reviewer's duty to find fresh defects is not discharged by an author meeting the previous round's list.

## Scope

- **Resolve F-041-01.** Make task admission require an **authoritative passing verdict**. A formal acceptance may contribute to admissibility only when it is the exact immutable High or Critical accepted-security-risk record applied to the matching security finding, as the contract already defines at `POST-GATE-MERGE-EXECUTORS.md:247-280`. A generic formal acceptance of a non-security gate verdict must remain a typed `PreMergeGateNotPassing` refusal and **must never construct a merge plan**. State whether the fix belongs in the executor's own admission predicate, in the graph's `gate_passed` definition, or in both — and if it belongs in the graph's definition, **return that change rather than authoring it**, because `tasks/**` is outside this role's write scope.
- **Resolve F-041-02.** Define a **constructible** trusted policy-observation boundary that can prove the complete current branch-protection controls and the complete bypass-actor set without granting either executor an administrative or bypass capability. It must specify freshness, identity, digest, and policy-drift behaviour. **If GitHub cannot expose that information under an acceptable read boundary, the contract must fail closed and return the unresolved control-plane dependency**; the reviewer stated that outcome is acceptable and that claiming activation is implementable without it is not. A returned dependency is a correct result for this finding, not a failure of this task.
- **Resolve F-041-04 as a contract obligation.** Bind owner verification to the exact published commit and require every declared target-dependent check to be repeated after the final authored commit. The reviewer recorded that this "generalizes to every artifact owner"; state the general obligation in the architecture where it belongs and **name the owner of any change that falls outside this role's scope rather than making it.** This task's own publication must satisfy the obligation it writes.
- Preserve every scope item round 1 judged `met`, and every relation `LIN-ARCH-REVIEW` closed at round 8. **Reopening, retargeting, or weakening any of them is a blocking finding for round 2 regardless of the merits of the change.**
- Preserve TASK-018's and TASK-019's gates, edges, ordering, and targets. This amendment has no relationship to the toolchain lineage.
- Re-derive every count, cardinality, and graph proof by **enumeration over this amendment's own published target tree at publication time**, under `MC-011`. Inherit no figure from TASK-040's record, from the round-1 report, from this record, or from any earlier amendment. **This record deliberately states no count of the module map, the edge set, the level partition, the ADR sequence, or the record set** — naming an expected value is how a stale figure propagates, and `MC-011` records the two rounds that cost.
- Cite `HUMAN-004` at `7dc07488a5b1cac8b1327ebd63bf747adbe03c68` and stay inside its boundary in both directions. Assuming an authority the decision did not grant is a blocking finding; silently dropping an authority it did grant is also one.
- **Exclude** authoring any change to `AGENTS.md`, `config/agents/settings.yaml`, `.agents/**`, `.github/**`, `.githooks/**`, `scripts/**`, `src/**`, `tests/**`, or `tasks/**`. Governance and enforcement paths are human-controlled and cannot be changed from an `agent/*` branch. State what the authorized `AGENTS.md` amendment must say and **return it**; authoring it is a blocking finding regardless of content.
- **Exclude** creating any implementation or validation task, deciding any gate verdict, approving any gate outcome, producing or asserting a continuous-integration result, merging or modifying pull request 22 or pull request 23, and performing any merge of any kind.

## Acceptance criteria

- [ ] F-041-01, F-041-02, and F-041-04 each receive an explicit, located resolution in the amendment, or an explicit returned dependency with the reason it cannot be resolved inside this role's authority.
- [ ] Task admission cannot be constructed to admit a target whose authoritative verdict is non-passing, and the only acceptance that can contribute to admissibility is the exact immutable High or Critical accepted-security-risk record. The declared test that demonstrates this is stated.
- [ ] The policy-observation boundary is constructible under a stated permission set, or the contract fails closed and the unresolved control-plane dependency is named and returned.
- [ ] Owner verification is bound to the published head as a stated contract obligation, and **this task's own handoff satisfies it**: every declared target-dependent check is re-run against the final authored commit and its result recorded against that commit's identifier.
- [ ] Every count, cardinality, and graph proof is derived by enumeration over this amendment's own target tree, and the derivation is stated so a reviewer can reproduce it.
- [ ] No path outside this task's declared write scope appears in the authored delta, verified as an empty residue rather than inferred.
- [ ] `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree -BaseRef <resolved scope_validation_base>` reports a valid result, run against the **final authored commit**, and its output is recorded in the handoff.
- [ ] The publication records its own remote and pull-request outcome accurately, including the presence or absence of GitHub check runs for the published head, recorded as an absence when absent and never as a success.

## Expected artifacts

- `docs/architecture/ARCHITECTURE.md` as the declared entry-point artifact.
- The amended documents under `docs/architecture/runtime/`.
- New or amended records under `docs/adr/`.
- Changed diagrams under `diagrams/architecture/`.

## Resource lock

This task declares `resource_lock: architecture-docs`, whose registered holders are TASK-002, TASK-016, TASK-024, TASK-028, TASK-032, TASK-034, TASK-036, TASK-038, TASK-040, and this task. The scopes are genuinely identical, because an amendment necessarily edits the documents the previous amendment authored; they are serialized by the lock rather than made disjoint. The lock was free at `ACT-021`, confirmed by a direct read of the shared lock directory.

## Gate and remediation path

Round 2 of `LIN-INTEGRATION-AUTHORITY-REVIEW` is recorded by **TASK-044**, in an execution context separate from this one, over **two** relations — this task at round 1 and TASK-040 at round 2 — applied atomically. Findings return to the Orchestrator under TASK-013, which routes remediation; the reviewer never implements the fix and this task never records a verdict.

**Independence.** The architect and the reviewer are both `gpt` while `assignments.architect.llm` stands at `gpt`, so the repository's cross-family preference does not apply. The mandatory guarantee is execution-context separation, and no script enforces it.

## Operational steps

1. From the primary checkout, run `scripts/orchestration/create-worktree.ps1 -TaskId TASK-042 -Role architect -Llm gpt`, with the branch created from `5e5fc8fe656b0e08a5337642447d7a81f83c4822`.
2. Start the assigned CLI inside the returned worktree path and run `scripts/orchestration/claim-task.ps1 -TaskId TASK-042 -Role architect -Llm gpt` before editing.
3. Before handoff, resolve the branch point with `git merge-base HEAD agent/gpt/architect/task-040`, record it, and run `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree -BaseRef <that value>` **after the final authored commit**.
4. Commit, publish as the environment permits, and run `scripts/orchestration/release-task.ps1 -TaskId TASK-042 -Role architect -Llm gpt`. Never push `main` and never merge anything.

Do not move this record between lifecycle directories and do not edit its `status` field. `tasks/**` is outside the architect role's configured write scope.

## Handoff

Maintained by the Orchestrator under TASK-013 from the architect's commit, pull request, and report.

- Commit or pull request:
- Verification:
- Known risks:
- **Edge satisfied at `ACT-021`:** `gate_recorded(TASK-041)` at `ec533fb5bb0055675fb81f72057d5636f7867db3`, ingress entry `seq` 29, class `gate_verdict_recorded`. `gate_recorded` is satisfied by **any** verdict, which is why a `changes-required` verdict dispatches this task; the lineage-form `gate_passed` edge, which requires a passing verdict, is not held by this task and would never be satisfiable at this round.
- Next owner: reviewer / gpt via **TASK-044**, once this task publishes.
