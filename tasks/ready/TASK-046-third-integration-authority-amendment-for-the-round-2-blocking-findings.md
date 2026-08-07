---
task_id: TASK-046
title: Third integration-authority amendment for the round-2 blocking findings
status: ready
owner_role: architect
llm: gpt
branch: agent/gpt/architect/task-046
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/gpt-architect-task-046
write_scope:
  - docs/architecture/ARCHITECTURE.md
  - docs/architecture/runtime/**
  - docs/adr/**
  - diagrams/architecture/**
resource_lock: architecture-docs
dependencies:
  - task: TASK-044
    edge: gate_recorded
    satisfied: true
    satisfied_at: 6f7f0edb63615d7f143dd6c59750a5ea7db701fc
    satisfied_by: ACT-023 consuming ingress entry seq 33, class gate_verdict_recorded
required_gates:
  - review
pre_merge_gates:
  - review
gate_tasks:
  - task: TASK-047
    gate: review
    round: 1
    verdict: pending
    gate_class: point
    retrospective: false
    gate_lineage: LIN-INTEGRATION-AUTHORITY-REVIEW
    lineage_round: 3
parent_task: TASK-001
publication_class: bootstrap
normative_architecture_source: 8ea5c32789ee01fd4a2cec4aff13905b120edae3, the immutable TASK-038 target, approved by LIN-ARCH-REVIEW at lineage_round 8 at 734bdbc and integrated onto integration/autonomous-runtime at de3a8d6. This task amends that approved baseline as extended by TASK-040 at 5e5fc8fe656b0e08a5337642447d7a81f83c4822 and corrected by TASK-042 at e33a62beb8198162db7c37f4e9740269e1454d2d; it replaces none of the three and does not reopen any relation LIN-ARCH-REVIEW closed at round 8.
governance_decision_context: HUMAN-004, approved at 7dc07488a5b1cac8b1327ebd63bf747adbe03c68 on human/decision/human-004-autonomous-merge, artifact plans/decisions/HUMAN-004-autonomous-merge-authority.md. Read the decision at that commit. Do not read it from TASK-040's transcription, from TASK-042's record, from this record, or from either round report alone. The decision is the boundary in both directions, and rounds 1 and 2 have each recorded that the amendment as published does not meet it.
predecessor_target: e33a62beb8198162db7c37f4e9740269e1454d2d, the immutable TASK-042 target judged changes-required at LIN-INTEGRATION-AUTHORITY-REVIEW lineage_round 2.
predecessor_round: LIN-INTEGRATION-AUTHORITY-REVIEW lineage_round 2, recorded by TASK-044 at 6f7f0edb63615d7f143dd6c59750a5ea7db701fc, verdict changes-required, published as pull request 27, artifact reports/code-review/TASK-042-INTEGRATION-AUTHORITY-REVIEW-ROUND-2.md.
integration_ancestry:
  branch_from: e33a62beb8198162db7c37f4e9740269e1454d2d
  verified_at: ACT-023
  verification: git branch -a --contains e33a62beb8198162db7c37f4e9740269e1454d2d returns agent/gpt/architect/task-042 and remotes/origin/agent/gpt/architect/task-042. The commit exists, is immutable, is published on origin, and is reachable from this clone, so this instruction is satisfiable. Under MC-010 the Orchestrator read the ancestry rather than inferring it.
  why_not_content_import: TASK-042 reached its own predecessor by true ancestry rather than by content import, which is what made its publication a single cumulative content unit. That condition still holds. Pull request 25 is OPEN, MERGEABLE, and CLEAN against integration/autonomous-runtime, so branching from e33a62be is available and is preferred, and the MC-010 import-fidelity obligation that bound LIN-ARCH-REVIEW rounds 5 through 8 has no counterpart here.
  known_divergence: This branch point does not contain f123c9a3e16072c4f215acd73ca2a14414158143, the current head of integration/autonomous-runtime as read at ACT-024. That commit is the two-parent merge of pull request 24, whose first parent 26c548a5f416e487ef6fae35a1b676d6711aa83d is a one-parent operator synchronization changing only paths under tasks/** and whose second parent 37a48249c03509e929fed2c8d27a1ff4f152f8db adds only four files under scripts/ci/**. Both path sets are outside this role's write scope and outside the reviewed delta, so the divergence is unchanged in kind and only larger by one directory. The two lines diverge between tasks/** and scripts/ci/** on one side and docs/** and diagrams/** on the other. This is recorded so that no reader infers an ancestry that does not exist and no owner treats the difference as a conflict to resolve. Nothing about this task's branch point, base, scope, findings, gate, round, or acceptance criteria changed at ACT-024; only this currentness statement did. The superseded ACT-023 value read - This branch point does not contain 8e6a22e1d4fa6fe8db440b9afa96444ee60db9a0, the current head of integration/autonomous-runtime. That commit is a one-parent operator synchronization whose only changed paths are under tasks/**, which is outside this role's write scope and outside the reviewed delta. The two lines diverge only between tasks/** and docs/**. It was true when written and is superseded by an external event rather than corrected, so it is ordinary revision work and deliberately not a model correction.
review_target_base: c95ce600b40ab2dbac73da44a21bbb7a207c444d
review_target_applicability: applicable and resolved at ACT-023. Round 3 diffs this task's published head against this base, which is TASK-040's own immutable branch point on integration/autonomous-runtime, so the round sees the complete integration-authority amendment rather than only the latest correction to it. That is required, because round 3 carries relations for TASK-040 and TASK-042 as well as for this task. The value was read with git merge-base agent/gpt/architect/task-040 integration/autonomous-runtime and independently confirmed as the parent of TASK-040's first authored commit d2c599696d25bc8938ef43514e8dc37aad70b047. It is the same base rounds 1 and 2 used, deliberately, and is not de3a8d6, not 8e6a22e1, not origin/main, not 5e5fc8f, and not this branch's own branch point.
review_target_commit: not yet resolved. It is this task's published branch head, bound by the TASK-013 activation that consumes this task's publication, under the head-binding rule ACT-009, ACT-013, ACT-015, ACT-018, ACT-020, ACT-021, and ACT-022 each applied.
review_target_note: >-
  The reviewed delta will be git diff c95ce600b40ab2dbac73da44a21bbb7a207c444d <published head>.
  This task's own authored delta against its branch point, which is
  e33a62beb8198162db7c37f4e9740269e1454d2d, is a DIFFERENT delta and the two must be recorded as
  separate provenance sets rather than as one figure, under the rule ACT-009 established. Read the
  target through Git object access or a detached worktree; do not merge it into a review branch to
  assemble the review. Re-derive every figure from the target tree under MC-011.
branch_point_of: agent/gpt/architect/task-042
scope_validation_base: git merge-base HEAD agent/gpt/architect/task-042
scope_validation_applicability: applicable, declared as a reproducible expression because this task's branch does not exist yet. It is this task's own branch point and is unrelated to review_target_base above, which belongs to the delta under review; findings F-403 and A-209 required the two to stay separate fields, and here they will hold genuinely different values.
scope_validation_note: Create the branch from e33a62beb8198162db7c37f4e9740269e1454d2d, then resolve the immutable branch point inside the worktree with git merge-base HEAD agent/gpt/architect/task-042 and pass that value to -BaseRef, after the final authored commit. Record the resolved value in the handoff; the Orchestrator pins it at the next activation. Never pass c95ce600, de3a8d6, 8e6a22e1, 8a4fe763, origin/main, or a review-diff base.
---

# TASK-046: Third integration-authority amendment for the round-2 blocking findings

## Objective

Amend the integration-authority architecture so that the three findings `LIN-INTEGRATION-AUTHORITY-REVIEW` round 2 recorded against the architect are resolved, and so that a later round can decide whether implementation tasks for the two `HUMAN-004` executors may be created.

**This task authors a contract. It does not authorize the capability, does not build it, and does not decide whether it is now safe.** The authorization is `HUMAN-004`; the judgment is TASK-047's; the implementations are tasks that do not exist and **may not be created until a `LIN-INTEGRATION-AUTHORITY-REVIEW` round records a passing verdict.** Round 1 and round 2 each recorded `changes-required` and each denied that authorization explicitly.

## The verdict this task remediates

**`LIN-INTEGRATION-AUTHORITY-REVIEW` lineage round 2 recorded `changes-required`** at commit `6f7f0edb63615d7f143dd6c59750a5ea7db701fc` on `agent/gpt/reviewer/task-044`, published as pull request 27, artifact `reports/code-review/TASK-042-INTEGRATION-AUTHORITY-REVIEW-ROUND-2.md`. The verdict was applied **atomically** to `(TASK-042, review, round 1)` and `(TASK-040, review, round 2)`; both **stay open** and are superseded by round 3.

**Read the report at that commit.** The dispositions and findings below are the Orchestrator's routing of it, not a substitute for it, and the reviewer's own "Required remediation" line under each finding is the authoritative statement of what must change.

The report is explicit about what the verdict forbids: the Orchestrator "**must not create either executor implementation task**: neither the runtime-owned task-integration executor nor the DevOps-owned integration-to-main release executor may proceed." No such task exists.

## What round 2 resolved, and what it did not

Round 2 is the strongest result this lineage has produced and it still blocked. Its dispositions of the round-1 findings, recorded by the reviewer:

| Round-1 finding | Disposition | Residue |
|---|---|---|
| **F-041-01** | **`resolved`** | None. Admission requires the authoritative verdict itself to pass, only exact matching `accepted-blocking-security-risk/v1` evidence in the security domain can contribute, and the reviewer's independently constructed counterexample returns a refusal with no plan, no durable intent, and no merge call |
| **F-041-02** | **`partially resolved`** | Carried by **F-044-02**. The normative contract's returned attestor dependency and fail-closed behaviour are correct against GitHub's own documented contracts; the component diagram contradicts the boundary |
| **F-041-04** | **`partially resolved`** | Carried by **F-044-03**. The exact-published-head obligation is now a general contract requirement; TASK-042's own publication does not satisfy it |
| **F-041-03** | not re-dispositioned by round 2 | Not yours. It is `devops`-owned, was remediated by TASK-043, and **`LIN-CI-EVIDENCE-REVIEW` round 1 recorded it `resolved`** at `18cbdfadf3d55e94bbc88bacadfb8adc8d3bf159`. Do not re-open, re-argue, or claim credit for it |

**Two things round 2 found affirmatively, which this amendment must not regress.** It found **no** path by which generic formal acceptance of a non-security verdict can construct a merge plan, and **no** contract path by which the release executor could reach `main` other than the exact-head pull-request merge API under authoritative branch protection. **A change that reopens either is a blocking finding for round 3 regardless of its merits elsewhere.**

**Round 2 recounted round 1's scope table rather than inheriting a figure, and so must you.** Round 1's table holds twenty-six rows, of which **20 are `met` and `6` are `not met`** — a figure this role previously recorded as twenty-two and corrected under `MC-018`. Round 2's own recount returns **21 `met` and 5 `not met`**, with one formerly-`met` row regressing under F-044-01. **A majority of satisfied checks is not a passing verdict**, and this record does not present one as such.

## Findings routed to this task

| Finding | Severity | Blocking | What the reviewer recorded | Where the reviewer located it |
|---|---|---|---|---|
| **F-044-01** | Medium | yes | Policy-control inputs have two incompatible result constructors. The contract claims a closed, total, mutually exclusive `MergeAdmissionResult`, but the same detectable condition can select `refused` and `human_exception_required`: an unprovisioned or missing attestor and policy or ruleset drift map to `refused` / `PolicyObservationUnavailable` and `PolicyDrift`, while a missing or changed credential, ruleset, branch protection, required-check source, bypass list, or authorization policy is said to detect the third human-exception member. **Missing policy-observer credentials can make the attestor unavailable, and a changed ruleset is policy drift, so the sets overlap directly.** An implementer cannot deterministically reproduce `HUMAN-004`'s third exception boundary or the required durable result | `docs/architecture/runtime/POST-GATE-MERGE-EXECUTORS.md:61, 121-129, 274-314, 402-439`; boundary at `plans/decisions/HUMAN-004-autonomous-merge-authority.md:43-45` |
| **F-044-02** | Medium | yes | The component diagram reintroduces executor-side policy reads. Rows 155-156 say the integration and release identities use their narrow GitHub API paths to "Read immutable PR/check/policy state", while line 158 says neither receives a policy-observation port and only the external attestor observes policy. **An implementation following the repository-access table would give the executor identities a direct policy-observation responsibility that the F-041-02 correction explicitly removes**, producing two incompatible construction boundaries for the same security-sensitive port | `diagrams/architecture/runtime-components.md:93-98, 150-158`; conflicting normative boundary at `docs/architecture/runtime/POST-GATE-MERGE-EXECUTORS.md:51-61, 366, 451, 460-462` |
| **F-044-03** | Medium | yes | TASK-042 does not satisfy its own published-head evidence schema. Line 502 requires `targetCommit`, branch, resolved bases, command and material arguments, **working directory, start/end time, exit code**, and actual result or derivation; pull request 25 and the TASK-042 handoff supply the target, branch, bases, commands, arguments, and summarized results and, except for one GitHub re-query timestamp, **do not record local working directories, start/end times, or explicit exit codes**. Head identity and "no later content" are proven. **Approving it would waive a requirement the amendment says applies to every artifact owner** | `docs/architecture/runtime/POST-GATE-MERGE-EXECUTORS.md:500-508`; pull request 25's exact-final-head verification; `tasks/review/TASK-042-…:222-229` |

**All three are `architect`-owned.** The report states it in terms: "All three findings are architect-owned. None is routed to the Orchestrator as its responsible owner; the Orchestrator's role is to record this verdict and route the remediation." **One remediation task, because the report names exactly one responsible owner role** — unlike round 1, which named two and produced two tasks.

## Scope

- **Resolve F-044-01.** Partition operational observation failures from human-controlled credential or repository-policy changes with **disjoint predicates**, then assign every input in the closed domain to **exactly one** `MergeAdmissionResult` member. Preserve fail-closed behaviour and the durable evidence requirement for either result. State the disjointness so an implementer can check it, and state which member each of the reviewer's overlapping inputs now selects.
- **Resolve F-044-02.** Make the repository-access rows name only PR, check, head, and base reads plus the exact merge endpoint for the two executor identities, and show policy state arriving **only** as a signed `RepositoryPolicyAttestor` payload. The diagram and the normative contract must state one boundary rather than two.
- **Resolve F-044-03.** Either publish a **complete** external verification record for this task's own final correction head — target commit, branch, resolved bases, command and material arguments, working directory, start and end time, exit code, and actual result or derivation for every declared target-dependent check — or amend the evidence contract coherently and repeat the target-dependent set after the resulting final content commit. **Do not reuse evidence from an earlier content head.** This task's own publication must satisfy the obligation it writes, which is the same requirement round 2 found unmet.
- Preserve everything round 2 judged `met`, every affirmative negative it recorded about the merge surface, and every relation `LIN-ARCH-REVIEW` closed at round 8. **Reopening, retargeting, or weakening any of them is a blocking finding for round 3 regardless of the merits of the change.**
- Preserve TASK-018's and TASK-019's gates, edges, ordering, and targets, and preserve TASK-043's closed `LIN-CI-EVIDENCE-REVIEW` relation. This amendment has no relationship to either lineage.
- Re-derive every count, cardinality, and graph proof by **enumeration over this amendment's own published target tree at publication time**, under `MC-011`. Inherit no figure from TASK-040's record, from TASK-042's record, from either round report, or from this record. **This record deliberately states no count of the module map, the edge set, the level partition, the ADR sequence, the pair set, or the record set.**
- Cite `HUMAN-004` at `7dc07488a5b1cac8b1327ebd63bf747adbe03c68` and stay inside its boundary in both directions. Assuming an authority the decision did not grant is a blocking finding; silently dropping an authority it did grant is also one.
- **Exclude** authoring any change to `AGENTS.md`, `config/agents/settings.yaml`, `.agents/**`, `.github/**`, `.githooks/**`, `scripts/**`, `src/**`, `tests/**`, or `tasks/**`. Governance and enforcement paths are human-controlled and cannot be changed from an `agent/*` branch. **State what the authorized `AGENTS.md` amendment must say and return it**; authoring it is a blocking finding regardless of content. The same applies to the exact `tasks/**`-owned `gate_passed` narrowing, which remains the Orchestrator's to apply and which round 2 recorded is still required before activation.
- **Exclude** provisioning, configuring, or requesting any part of the GitHub control plane — branch protection, rulesets, required checks, merge permissions, the two executor Apps, the token broker, the `RepositoryPolicyAttestor`, or any credential. Round 2 read the live control plane and recorded that `main` and `integration/autonomous-runtime` are both unprotected and the ruleset list is empty; **that is a fact to design against and not an authorization to change it.**
- **Exclude** creating any implementation or validation task, deciding any gate verdict, approving any gate outcome, judging TASK-043 or re-dispositioning F-041-03, merging or modifying any pull request, and performing any merge of any kind.

## Acceptance criteria

- [ ] F-044-01, F-044-02, and F-044-03 each receive an explicit, located resolution in the amendment, or an explicit returned dependency with the reason it cannot be resolved inside this role's authority.
- [ ] Every input in the closed policy-control domain maps to exactly one `MergeAdmissionResult` member under disjoint predicates, and the mapping is stated so a reviewer can construct the reviewer's own overlapping cases and reproduce a single answer for each.
- [ ] The component diagram's repository-access rows and the normative executor contract state one policy-observation boundary, with no direct policy read attributed to either executor identity.
- [ ] Owner verification for this task's own publication satisfies `POST-GATE-MERGE-EXECUTORS.md`'s published-head evidence schema in full, including working directory, start and end time, and exit code for every declared target-dependent check, run **after** the final authored commit.
- [ ] Nothing round 2 judged `met` is regressed, and neither affirmative negative it recorded about the merge surface is reopened.
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

This task declares `resource_lock: architecture-docs`, whose registered holders are TASK-002, TASK-016, TASK-024, TASK-028, TASK-032, TASK-034, TASK-036, TASK-038, TASK-040, TASK-042, and this task — **eleven**. The scopes are genuinely identical, because an amendment necessarily edits the documents the previous amendment authored; they are serialized by the lock rather than made disjoint. The lock was **free** at `ACT-023`, confirmed by a direct read of the shared lock directory, which held exactly one entry, `task-013.json`.

## Gate and remediation path

Round 3 of `LIN-INTEGRATION-AUTHORITY-REVIEW` is recorded by **TASK-047**, in an execution context separate from this one, over **three** relations — this task at round 1, TASK-042 at round 2, and TASK-040 at round 3 — applied atomically. Findings return to the Orchestrator under TASK-013, which routes remediation; the reviewer never implements the fix and this task never records a verdict.

**Independence.** The architect and the reviewer are both `gpt` while `assignments.architect.llm` stands at `gpt`, so the repository's cross-family preference does not apply. The mandatory guarantee is execution-context separation, and no script enforces it.

## Operational steps

1. From the primary checkout, run `scripts/orchestration/create-worktree.ps1 -TaskId TASK-046 -Role architect -Llm gpt`, with the branch created from `e33a62beb8198162db7c37f4e9740269e1454d2d`.
2. Start the assigned CLI inside the returned worktree path and run `scripts/orchestration/claim-task.ps1 -TaskId TASK-046 -Role architect -Llm gpt` before editing.
3. Read `plans/decisions/HUMAN-004-autonomous-merge-authority.md` at `7dc07488a5b1cac8b1327ebd63bf747adbe03c68` and both round reports at their own source commits before authoring.
4. Before handoff, resolve the branch point with `git merge-base HEAD agent/gpt/architect/task-042`, record it, and run `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree -BaseRef <that value>` **after the final authored commit**.
5. Commit, publish as the environment permits, and run `scripts/orchestration/release-task.ps1 -TaskId TASK-046 -Role architect -Llm gpt`. Never push `main` and never merge anything.

Do not move this record between lifecycle directories and do not edit its `status` field. `tasks/**` is outside the architect role's configured write scope.

## Task-record lifecycle

This record's `status` field and its lifecycle directory are changed only by the Orchestrator under TASK-013. Record the handoff in the commit message and the pull request description; the Orchestrator transcribes it.

## Handoff

Maintained by the Orchestrator under TASK-013 from the architect's commit, pull request, and report.

- Commit or pull request:
- Verification:
- Known risks:
- **Created `ready` at `ACT-023`**, on the satisfied `gate_recorded(TASK-044)` edge at `6f7f0edb63615d7f143dd6c59750a5ea7db701fc`, ingress entry `seq` 33, class `gate_verdict_recorded`. `gate_recorded` is satisfied by **any** verdict, which is why a `changes-required` verdict dispatches this task; the lineage-form `gate_passed` edge, which requires a passing verdict, is not held by this task and would never be satisfiable at this round.
- Next owner after publication: **reviewer / gpt via TASK-047**, `LIN-INTEGRATION-AUTHORITY-REVIEW` round 3, which records **one** verdict applied atomically to **three** relations.
