---
task_id: TASK-019
title: Independent review of the runtime toolchain bootstrap
status: ready
owner_role: reviewer
llm: gpt
branch: agent/gpt/reviewer/task-019
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/gpt-reviewer-task-019
write_scope:
  - reports/code-review/TASK-018-TOOLCHAIN-REVIEW.md
dependencies:
  - task: TASK-018
    edge: review_ready
required_gates: []
pre_merge_gates: []
gate_for:
  - task: TASK-018
    gate: review
    round: 1
    verdict: pending
    gate_class: point
    retrospective: false
    gate_lineage: LIN-TOOLCHAIN-REVIEW
    lineage_round: 1
dependencies_satisfied:
  - task: TASK-018
    edge: review_ready
    satisfied_at: 296b14faad459307650f0f6e066bd55fdd4bcbe3
    satisfied_under: publication_class runtime - immutable published commit, branch pushed to refs/heads/agent/claude/devops/task-018 on origin, and pull request 20 OPEN against integration/autonomous-runtime. All three conditions the runtime class requires are present, so no bootstrap allowance is relied on.
    recorded_by: TASK-013 activation ACT-018, consuming ingress entry seq 26
parent_task: TASK-001
publication_class: bootstrap
unblocked_reason: This task declared exactly ONE dependency - review_ready(TASK-018) - and it is satisfied at 296b14f. It does not wait for TASK-018 to be integrated or to reach done, because it is the pre-merge gate that lets TASK-018 be integrated. That ordering is finding F-101's correction and this is the first time in this graph that it has actually been exercised on an implementation artifact.
exit_condition: satisfied. TASK-018 is review_ready at 296b14faad459307650f0f6e066bd55fdd4bcbe3 on agent/claude/devops/task-018. This task is ready and dispatchable.
review_target_base: 5dc764057843fc5e5a40909847b1de900c4fd992
review_target_commit: 296b14faad459307650f0f6e066bd55fdd4bcbe3
review_target_applicability: applicable and resolved. This task diffs the TASK-018 branch head against the integration-branch commit TASK-018 branched from. Both values were read from the repository at ACT-018 - git merge-base 296b14f integration/autonomous-runtime returns 5dc7640, which is on origin/integration/autonomous-runtime - rather than guessed or inherited. The target is IMMUTABLE. If TASK-018 publishes a further commit, this round is not retargeted; a new round reviews it, per findings F-403 and A-209.
branch_point_of: integration/autonomous-runtime
scope_validation_base: git merge-base HEAD integration/autonomous-runtime
scope_validation_applicability: applicable, declared as a reproducible expression because this task's branch does not exist yet. It is a DIFFERENT base from review_target_base above and must not be conflated with it - one bounds this task's own authored delta, the other bounds the delta under review.
scope_validation_note: Branch from integration/autonomous-runtime, then resolve the immutable branch point inside the worktree with git merge-base HEAD integration/autonomous-runtime and pass that value to -BaseRef. Record the resolved value in the report; the Orchestrator pins it at the next activation. Never pass origin/main, c325275, or a review-diff base. Findings F-403 and A-209 each recorded why.
---

# TASK-019: Independent review of the runtime toolchain bootstrap

## Objective

Perform the review gate that TASK-018 declares, before the toolchain is integrated into `integration/autonomous-runtime` and three implementation tasks begin building on it.

## Why this task exists

TASK-018 declares `required_gates: [review]` and `pre_merge_gates: [review]`, and the integration order in `docs/architecture/runtime/INTEGRATION-STRATEGY.md` puts the toolchain on `integration/autonomous-runtime` at step 2 — before Wave 3. No agent branch is ever merged to `main` by this graph; `main` is reached only through a human-approved pull request from the integration branch. TASK-009 cannot own this gate: it runs at Wave 7, reviews runtime source, and is an aggregate gate. Assigning TASK-018's review to TASK-009 would let an unreviewed toolchain sit on the integration branch for five waves with three tasks compiling against it, which is the same defect the round 1 review recorded as F-002 for TASK-002. This task gives the gate an owner that is schedulable immediately after TASK-018 publishes. The pair's scheduling class, its ordering against integration, its lineage, and its lineage round are declared in the frontmatter above and in TASK-018's `gate_tasks` entry; this body does not restate them.

## Review target

**Resolved and bound at activation `ACT-018`.** The target is commit **`296b14faad459307650f0f6e066bd55fdd4bcbe3`**, the head of `agent/claude/devops/task-018`, compared against base **`5dc764057843fc5e5a40909847b1de900c4fd992`** — the integration-branch commit TASK-018 branched from, which `git merge-base` returns and which is present on `origin/integration/autonomous-runtime`. Both values are declared in the frontmatter above and in TASK-018's record; neither is guessed.

The delta is **12 paths, 1069 insertions, 0 deletions**: `package.json`, `package-lock.json`, `tsconfig.json`, `scripts/quality/typecheck.mjs`, `lint.mjs`, `format.mjs`, `lib/toolchain.mjs`, `quality.config.json`, `scripts/ci/runtime-checks.ps1`, `runtime-test.mjs`, `toolchain-smoke.mjs`, and `.github/workflows/runtime.yml`. That path count is the Orchestrator's own `git diff --name-only` against the bound base and it agrees with the owner's recorded write-scope validation; the reviewer should re-derive it rather than inherit it.

**Bind the head, not `560f9a0`.** Pull request 20's body contains one sentence naming `560f9a0` as the `review_ready` commit, which its own Verification section and Commits table both contradict, and which the durable ref state contradicts. TASK-018's `review_target_note` records both statements. The commit under review is `296b14f`.

Finding F-101 was recorded as only `partially resolved` at round 3 because this section previously named `main` as both the merge destination and the comparison base. Both are `integration/autonomous-runtime`, which is what the `integrated` edge in `tasks/TASK-001-DEPENDENCY-GRAPH.md` means.

## Scope

- Verify each of ADR-0001's binding parameters against the delivered configuration: Node.js 22 LTS or newer; TypeScript with `strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes`; ESM with `"type": "module"` and `.js` extensions in relative specifiers; `node:test` with `node:assert/strict`; and zero third-party runtime dependencies.
- Verify that the four configuration files are mutually consistent and that the recorded type-check, test, and lint commands actually run against an empty runtime tree.
- Verify that the CI workflow runs on `windows-latest` and fails on a type error, a failing test, or a lint error.
- Verify that no human-controlled governance path was modified, specifically `.github/workflows/ci.yml`, `.github/workflows/security.yml`, `config/agents/settings.yaml`, `scripts/orchestration/**`, `scripts/ci/validate-framework.ps1`, `scripts/ci/test-orchestration.ps1`, and `.githooks/**`.
- Verify that every changed path is inside the devops role's configured write scope in `config/agents/settings.yaml` as it stands at commit `fb9f45c`, where decision HUMAN-001 added `package.json`, `package-lock.json`, `tsconfig.json`, and `scripts/quality/**`. Report any path that is not.
- Report every added devDependency with its purpose, so the security gate at TASK-010 has an inventory to assess. The owner recorded three dev-only packages — `typescript`, `@types/node`, and `undici-types` — and zero runtime dependencies; derive the inventory from `package-lock.json` at the target rather than from that statement.
- **Judge the absent CI run explicitly.** No GitHub Actions run exists for this branch or for pull request 20: the owner recorded that none was created within roughly twenty minutes of publication and attributed it to a platform or connectivity condition, and the Orchestrator confirmed the absence independently — `gh run list --branch agent/claude/devops/task-018` returns `[]` and `gh pr checks 20` reports no checks. **No CI success is claimed by anyone, and none may be assumed.** Every stage the workflow invokes was verified only locally. Decide whether an unexecuted workflow is acceptable for this gate, and record the decision either way rather than leaving it implicit. Re-running the checks on the pull request is available to this execution if its environment permits network access; if it does not, say so.
- **Re-derive every owner-recorded figure rather than inheriting it**, under model correction `MC-011`. That applies to the 12-path delta, the 9/9 smoke result, the coverage figures, and the dependency count. This record deliberately states the owner's numbers as *claims to check*, not as expected values.
- Exclude authoring or fixing the toolchain, deciding the platform, reviewing runtime source code, approving any other role's gate, and merging or requesting the merge of pull request 20.

## Acceptance criteria

- [ ] Every ADR-0001 binding parameter receives an explicit `met` or `not met` judgment with supporting file and line evidence.
- [ ] The recorded type-check, test, and lint commands are confirmed to run, and their output is quoted.
- [ ] Every added dependency is inventoried by name, version, and purpose, derived from `package-lock.json` at the target.
- [ ] The absence of any GitHub Actions run for this branch and pull request is stated explicitly, judged, and recorded as `met` or `not met` for the CI acceptance criterion. **A verdict that treats an unexecuted workflow as a passing CI check is a defect in this report.**
- [ ] Governance-path integrity and write-scope compliance are each explicitly confirmed or reported as violated.
- [ ] Each finding records severity, file and line, and the responsible owner role.
- [ ] The verdict is one of `approved`, `approved-with-findings`, or `changes-required`, and states plainly whether the toolchain may be integrated into `integration/autonomous-runtime`.
- [ ] No file outside `reports/code-review/TASK-018-TOOLCHAIN-REVIEW.md` is modified by this task.
- [ ] `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree` reports a valid result and its output is recorded in the report.

## Expected artifacts

- `reports/code-review/TASK-018-TOOLCHAIN-REVIEW.md` containing the per-parameter judgments, the dependency inventory, the findings list, and the verdict.

## Write-scope isolation

This task's single file is path-disjoint from TASK-009's `reports/code-review/REVIEW.md` and `reports/code-review/runtime/**`, from TASK-014's file, and from TASK-015's file. No resource lock is required.

## Gate and remediation path

This task performs the review gate declared by TASK-018, recorded as a `gate_for` reverse edge rather than a scheduling dependency. TASK-018 declares `pre_merge_gates: [review]`, so this task becomes dispatchable when TASK-018 is `review_ready` — an immutable published commit, no merge required — and TASK-018 becomes integrable only after this task's verdict closes the gate. That ordering is the correction for finding F-101: the gate no longer waits for a merge that waits for the gate. TASK-018 reaches `done` only after this task and TASK-010 both record verdicts.

TASK-018's security gate is owned by TASK-010. Its scheduling class, its ordering against integration, its lineage, and its lineage round are declared on both sides of that pair and summarized in the aggregate and retrospective gate register in `tasks/TASK-001-DEPENDENCY-GRAPH.md`, row "TASK-010 / security / TASK-018"; this body names the register and does not restate them. The register records that this pair carries the graph's longest exposure window, which is why this task must inventory every dependency the toolchain adds. The repository's baseline security CI workflow runs on the pull request in the meantime.

Findings return to the Orchestrator under TASK-013, which reopens TASK-018 for the devops owner. The reviewer does not implement the fix. Publishing this task's report is itself the ingress fact that wakes TASK-013; this task never writes under `tasks/`.

**Independence, stated because this is the first implementation gate in the graph.** TASK-018's author is `devops` / `claude`; this task is `reviewer` / `gpt`. Author and reviewer are in different roles, different execution contexts, **and** different LLM families — the first gate pair in this graph since the architecture lineage where the repository's `prefer_different_llm` preference actually holds, rather than only the mandatory execution-context separation. This task must not run in TASK-018's execution context, and no script enforces that.

**This task does not merge anything and must not request a merge.** Pull request 20 stays open until this verdict is recorded. The Orchestrator records the verdict; the merge, when it is authorized, is a separate externally visible operation that produces its own `branch_integrated` ingress fact.

## Operational steps

1. From the primary checkout, run `scripts/orchestration/create-worktree.ps1 -TaskId TASK-019 -Role reviewer -Llm gpt`.
2. Start the assigned CLI inside the returned worktree path and run `scripts/orchestration/claim-task.ps1 -TaskId TASK-019 -Role reviewer -Llm gpt` before editing.
3. Before handoff, run `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree`.
4. Commit, push the agent branch, open a pull request, and run `scripts/orchestration/release-task.ps1 -TaskId TASK-019 -Role reviewer -Llm gpt`. Never push `main`.

Do not move this record between lifecycle directories and do not edit its `status` field. `tasks/**` is outside the reviewer role's configured write scope. Record the handoff in the report and the pull request description; the Orchestrator performs the transition under TASK-013.

## Handoff

Maintained by the Orchestrator under TASK-013 from the reviewer's report and pull request.

- Commit or pull request:
- Verification:
- Known risks:
- Next owner: orchestrator via TASK-013, to integrate the toolchain into `integration/autonomous-runtime` and unblock TASK-003, TASK-004, and TASK-017 on a passing verdict, or to route findings back to devops
</content>
