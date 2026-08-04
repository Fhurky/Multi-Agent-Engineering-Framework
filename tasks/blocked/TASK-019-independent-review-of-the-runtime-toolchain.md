---
task_id: TASK-019
title: Independent review of the runtime toolchain bootstrap
status: blocked
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
parent_task: TASK-001
blocked_reason: The toolchain has not been published.
exit_condition: TASK-018 is review_ready, with an immutable published commit on agent/claude/devops/task-018. This task does not wait for TASK-018 to be integrated or to reach done, because it is the pre-merge gate that lets it be integrated.
---

# TASK-019: Independent review of the runtime toolchain bootstrap

## Objective

Perform the review gate that TASK-018 declares, before the toolchain merges to `main` and three implementation tasks begin building on it.

## Why this task exists

TASK-018 declares `required_gates: [review]`, and the integration order in `docs/architecture/runtime/INTEGRATION-STRATEGY.md` puts the toolchain on `main` at step 2 — before Wave 3. TASK-009 cannot own that gate: it runs at Wave 7 and reviews runtime source. Assigning TASK-018's review to TASK-009 would let an unreviewed toolchain sit on `main` for five waves with three tasks compiling against it, which is the same defect the round 1 review recorded as F-002 for TASK-002. This task gives the gate an owner that is schedulable immediately after TASK-018 publishes.

## Review target

Branch `agent/claude/devops/task-018`, compared against `main` at the commit where TASK-002 merged. In scope: `package.json`, `package-lock.json`, `tsconfig.json`, the lint and format configuration under `scripts/quality/`, the runtime CI workflow under `.github/workflows/`, and the entry points under `scripts/ci/`.

## Scope

- Verify each of ADR-0001's binding parameters against the delivered configuration: Node.js 22 LTS or newer; TypeScript with `strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes`; ESM with `"type": "module"` and `.js` extensions in relative specifiers; `node:test` with `node:assert/strict`; and zero third-party runtime dependencies.
- Verify that the four configuration files are mutually consistent and that the recorded type-check, test, and lint commands actually run against an empty runtime tree.
- Verify that the CI workflow runs on `windows-latest` and fails on a type error, a failing test, or a lint error.
- Verify that no human-controlled governance path was modified, specifically `.github/workflows/ci.yml`, `.github/workflows/security.yml`, `config/agents/settings.yaml`, `scripts/orchestration/**`, `scripts/ci/validate-framework.ps1`, `scripts/ci/test-orchestration.ps1`, and `.githooks/**`.
- Verify that every changed path is inside the devops role's configured write scope in `config/agents/settings.yaml` as it stands at commit `fb9f45c`, where decision HUMAN-001 added `package.json`, `package-lock.json`, `tsconfig.json`, and `scripts/quality/**`. Report any path that is not.
- Report every added devDependency with its purpose, so the security gate at TASK-010 has an inventory to assess.
- Exclude authoring or fixing the toolchain, deciding the platform, reviewing runtime source code, and approving any other role's gate.

## Acceptance criteria

- [ ] Every ADR-0001 binding parameter receives an explicit `met` or `not met` judgment with supporting file and line evidence.
- [ ] The recorded type-check, test, and lint commands are confirmed to run, and their output is quoted.
- [ ] Every added dependency is inventoried by name, version, and purpose.
- [ ] Governance-path integrity and write-scope compliance are each explicitly confirmed or reported as violated.
- [ ] Each finding records severity, file and line, and the responsible owner role.
- [ ] The verdict is one of `approved`, `approved-with-findings`, or `changes-required`, and states plainly whether the toolchain may merge.
- [ ] No file outside `reports/code-review/TASK-018-TOOLCHAIN-REVIEW.md` is modified by this task.
- [ ] `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree` reports a valid result and its output is recorded in the report.

## Expected artifacts

- `reports/code-review/TASK-018-TOOLCHAIN-REVIEW.md` containing the per-parameter judgments, the dependency inventory, the findings list, and the verdict.

## Write-scope isolation

This task's single file is path-disjoint from TASK-009's `reports/code-review/REVIEW.md` and `reports/code-review/runtime/**`, from TASK-014's file, and from TASK-015's file. No resource lock is required.

## Gate and remediation path

This task performs the review gate declared by TASK-018, recorded as a `gate_for` reverse edge rather than a scheduling dependency. TASK-018 declares `pre_merge_gates: [review]`, so this task becomes dispatchable when TASK-018 is `review_ready` — an immutable published commit, no merge required — and TASK-018 becomes integrable only after this task's verdict closes the gate. That ordering is the correction for finding F-101: the gate no longer waits for a merge that waits for the gate. TASK-018 reaches `done` only after this task and TASK-010 both record verdicts.

TASK-018's security gate is owned by TASK-010 and is an assembly gate, retrospective: the toolchain integrates at Wave 2 while TASK-010 runs at Wave 7. That is a recorded and accepted consequence of needing a toolchain before any code exists to threat-model, and it is why this task must inventory every dependency it adds. The repository's baseline security CI workflow runs on the pull request in the meantime.

Findings return to the Orchestrator under TASK-013, which reopens TASK-018 for the devops owner. The reviewer does not implement the fix.

## Operational steps

1. From the primary checkout, run `scripts/orchestration/create-worktree.ps1 -TaskId TASK-019 -Role reviewer -Llm gpt`.
2. Start the assigned CLI inside the returned worktree path and run `scripts/orchestration/claim-task.ps1 -TaskId TASK-019 -Role reviewer -Llm gpt` before editing.
3. Before handoff, run `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree`.
4. Commit, push the agent branch, open a pull request, and run `scripts/orchestration/release-task.ps1 -TaskId TASK-019 -Role reviewer -Llm gpt`.

Do not move this record between lifecycle directories and do not edit its `status` field. `tasks/**` is outside the reviewer role's configured write scope. Record the handoff in the report and the pull request description; the Orchestrator performs the transition under TASK-013.

## Handoff

Maintained by the Orchestrator under TASK-013 from the reviewer's report and pull request.

- Commit or pull request:
- Verification:
- Known risks:
- Next owner: orchestrator via TASK-013, to merge the toolchain and unblock TASK-003, TASK-004, and TASK-017 on a passing verdict, or to route findings back to devops
</content>
