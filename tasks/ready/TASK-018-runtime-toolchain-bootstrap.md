---
task_id: TASK-018
title: Bootstrap the runtime TypeScript and Node.js toolchain
status: ready
owner_role: devops
llm: claude
branch: agent/claude/devops/task-018
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/claude-devops-task-018
write_scope:
  - package.json
  - package-lock.json
  - tsconfig.json
  - scripts/quality/**
  - scripts/ci/**
  - .github/workflows/**
dependencies:
  - lineage: LIN-ARCH-REVIEW
    edge: gate_passed
    gate: review
    lineage_round: 8
required_gates:
  - review
  - security
pre_merge_gates:
  - review
gate_tasks:
  - task: TASK-019
    gate: review
    round: 1
    verdict: pending
    gate_class: point
    retrospective: false
    gate_lineage: LIN-TOOLCHAIN-REVIEW
    lineage_round: 1
  - task: TASK-010
    gate: security
    round: 1
    verdict: pending
    gate_class: aggregate
    retrospective: true
    gate_lineage: LIN-TOOLCHAIN-SECURITY
    lineage_round: 1
gate_scheduling: The security gate is aggregate and retrospective. Its reason and its recorded risk are in the aggregate and retrospective gate register in tasks/TASK-001-DEPENDENCY-GRAPH.md, row "TASK-010 / security / TASK-018". It has the longest exposure window in the graph but it is not the only retrospective gate; every runtime assembly gate is retrospective as well.
dependencies_satisfied:
  - lineage: LIN-ARCH-REVIEW
    edge: gate_passed
    gate: review
    lineage_round: 8
    satisfied_at: 734bdbc5d9541daa78fd570057317152247d1f87
    verdict_recorded: approved
    recorded_by: TASK-013 activation ACT-016, consuming ingress entry seq 24
    approved_source: 8ea5c32789ee01fd4a2cec4aff13905b120edae3
parent_task: TASK-001
publication_class: runtime
normative_architecture_source: 8ea5c32789ee01fd4a2cec4aff13905b120edae3, the immutable TASK-038 target. THIS IS THE FIRST APPROVED ARCHITECTURE SOURCE THIS GRAPH HAS HAD. LIN-ARCH-REVIEW recorded approved at lineage_round 8, at 734bdbc, and TASK-013 activation ACT-016 closed all eight relations together, so the lineage's authoritative verdict is passing at the floor this record's edge declares. The earlier baselines 9576fc9, 8d0c570, c2ee3eb, fe0374c, 468b37b, 6d145eb, and 970b081 remain superseded authoring baselines that were each rejected at rounds 1 through 7; a record that cites any of them as approved is still a finding. Build against 8ea5c32 and nothing else. The approved source is a commit on agent/gpt/architect/task-038 that has NOT been integrated into any branch; reading it is how a consumer consults the approved architecture until the separate branch-integration operation lands.
human_decisions:
  - id: HUMAN-001
    status: resolved
    option: A
    decided_at: fb9f45c
    decided_on: 2026-08-04
    effect: package.json, package-lock.json, tsconfig.json, and scripts/quality/** were added to assignments.devops.write_scope in config/agents/settings.yaml.
unblocked_reason: This task was blocked from the first decomposition until ACT-016 solely on the architecture gate. LIN-ARCH-REVIEW recorded approved at round 8, at 734bdbc, with A-601 resolved and no new finding, and ACT-016 closed all eight relations together. This record declares exactly ONE dependency - gate_passed(LIN-ARCH-REVIEW, review, 8) - and it is now satisfied, which makes this the only consumer whose complete typed dependency set is met and the first implementation task in this graph ever to become dispatchable. Build against the approved source 8ea5c32; it is a commit on agent/gpt/architect/task-038 that has not been integrated into any branch, so read it directly.
exit_condition: satisfied. This task declared exactly one dependency - gate_passed(LIN-ARCH-REVIEW, review, 8) - and LIN-ARCH-REVIEW recorded approved at round 8 at 734bdbc, closed by ACT-016. It is the ONLY consumer whose complete typed dependency set is now satisfied; every other consumer retains at least one integrated() edge that no branch integration has yet satisfied. This task is ready and dispatchable.
review_target_base: not applicable until this task publishes
review_target_applicability: not applicable yet. This task is gated but no artifact of it exists, so no round is pinned and there is no delta to diff. It becomes applicable when this task reaches review_ready; the Orchestrator records review_target_commit and review_target_base then, at the activation that consumes the publication, from the branch as published.
branch_point_of: integration/autonomous-runtime
scope_validation_base: git merge-base HEAD integration/autonomous-runtime
scope_validation_applicability: applicable, declared as a reproducible expression because this task's branch does not exist yet
scope_validation_note: Branch from integration/autonomous-runtime at or after the commit where this task's dependencies merged, then resolve the immutable branch point inside the worktree with git merge-base HEAD integration/autonomous-runtime and pass that value to -BaseRef. Record the resolved value in the handoff; the Orchestrator pins it at the next activation. Never pass origin/main, c325275, or a review-diff base. Findings F-403 and A-209 each recorded why.
---

# TASK-018: Bootstrap the runtime TypeScript and Node.js toolchain

## Objective

Land the compiler, test runner, and lint configuration that every runtime implementation task needs, so that Wave 2 can compile and run a test without any task writing outside its declared scope.

## Why this task exists

`docs/architecture/runtime/INTEGRATION-STRATEGY.md` and ADR-0001 at commit `9576fc9` record an ownership gap the architect could not close from inside its own role: the runtime is TypeScript on Node.js 22, but **no task in the TASK-001 graph owned the root manifests**. TASK-003's scope is `src/orchestrator/state/**` and `tests/unit/orchestrator/state/**`; `package.json`, `tsconfig.json`, and `scripts/quality/**` were outside every runtime task's scope, and `scripts/quality/**` was outside the devops role's configured scope as well.

The architect recommended one small devops-owned task, and rejected the alternative of extending TASK-003's scope because that would give one implementation task authority over a repository-wide surface and couple every later task to its toolchain choices without a separate review. This task adopts that recommendation.

## Human decision HUMAN-001 — resolved

A human resolved the ownership question on 2026-08-04 in commit `fb9f45c`, `chore: assign runtime toolchain ownership to devops`, on `integration/autonomous-runtime`. **Option A was adopted.** The commit added four paths to `assignments.devops.write_scope` in `config/agents/settings.yaml`:

```text
package.json
package-lock.json
tsconfig.json
scripts/quality/**
```

Consequences for this record, applied by TASK-013 activation `ACT-001`:

- All four paths moved from `requested_write_scope_extension` into the declared `write_scope`. The field no longer exists on this record; there is nothing left to request.
- The `human_decision(HUMAN-001)` scheduling edge was removed. No task in the graph carries a `human_decision` edge any longer.
- `blocked_reason` and `exit_condition` were narrowed to the one remaining precondition: the architecture gate.
- Every declared path is now inside the devops role's configured scope, so `validate-write-scope.ps1` will accept this task's diff without any further governance change.

The rejected options are recorded for traceability: option B would have extended `assignments.runtime.write_scope` and folded this task into TASK-003, which ADR-0001 rejects because it gives one implementation task repository-wide authority; option C would have had a human land the toolchain outside the agent graph, leaving it with no task record, no review gate, and no traceable owner.

## Scope

Once unblocked:

- Add `package.json` with `"type": "module"`, the Node.js 22 engine constraint, and the scripts the runtime tasks invoke, with zero third-party runtime dependencies as ADR-0001 requires.
- Add `tsconfig.json` in strict mode with `strict: true`, `noUncheckedIndexedAccess: true`, and `exactOptionalPropertyTypes: true`, targeting ESM with `.js` extensions in relative import specifiers.
- Configure `node:test` with `node:assert/strict` as the test runner, and a coverage invocation, without adding an external test framework.
- Add lint and format configuration under `scripts/quality/`.
- Add a runtime CI workflow under `.github/workflows/` that type-checks, tests, and lints the runtime on `windows-latest`, and wire the shared entry points under `scripts/ci/`. Do not modify `.github/workflows/ci.yml` or `.github/workflows/security.yml`; both are human-controlled governance paths.
- Verify the toolchain compiles and tests an empty runtime tree, so Wave 2 begins on a known-good baseline.
- Exclude runtime source, runtime tests, architecture decisions, and any application business rule.

## Acceptance criteria

- [ ] Every path this task writes is inside the devops role's configured scope in `config/agents/settings.yaml` as it stands at commit `fb9f45c`, where decision HUMAN-001 was recorded.
- [ ] `package.json`, `tsconfig.json`, the test runner configuration, and the lint configuration land together and are mutually consistent.
- [ ] Every ADR-0001 binding parameter is satisfied: Node.js 22 LTS or newer, TypeScript strict with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`, ESM with `.js` relative specifiers, `node:test` with `node:assert/strict`, and zero third-party runtime dependencies.
- [ ] A type-check, a test run, and a lint run each succeed against the empty runtime tree, and their exact commands are recorded.
- [ ] The runtime CI workflow runs on `windows-latest` and fails the build on a type error, a failing test, or a lint error.
- [ ] No human-controlled governance path is modified, including `.github/workflows/ci.yml`, `.github/workflows/security.yml`, and `config/agents/settings.yaml`.
- [ ] `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree` reports a valid result.
- [ ] All changed files remain inside this task's declared write scope.
- [ ] The task branch is published and a pull request is opened or updated. This task declares `publication_class: runtime`, so an unavailable remote or an unauthorized pull request is an explicit `blocked` outcome with its reason recorded — **not** a `local-only` success. The `bootstrap` class in `tasks/TASK-001-DEPENDENCY-GRAPH.md` does not apply to this task.

## Expected artifacts

- Root `package.json`, `package-lock.json`, and `tsconfig.json`.
- Lint and format configuration under `scripts/quality/`.
- A runtime CI workflow under `.github/workflows/` and its entry points under `scripts/ci/`.

## Dependency notes

- `gate_passed(TASK-016, review)` is the architecture-approval edge. TASK-015 round 1 returned `changes-required` on TASK-002, so `gate_passed(TASK-002)` is not satisfiable at round 1; the approved architecture is `9576fc9` as amended by TASK-016, and TASK-020 is the gate that approves it. ADR-0001's platform decision is part of that amended set.
- `human_decision(HUMAN-001)` is removed. It was satisfied at `fb9f45c`.
- **Blocks TASK-003, TASK-004, and TASK-017.** Each carries an explicit `integrated(TASK-018)` edge, because none of them can compile or run a test until this task's branch is reviewed and merged. This makes the toolchain gap visible in the scheduling graph rather than only in an architecture document.
- Corresponds to step 2 of the integration order in `docs/architecture/runtime/INTEGRATION-STRATEGY.md`.

## Gate ownership

This task declares `pre_merge_gates: [review]`. Its review gate is owned by **TASK-019**, which becomes dispatchable as soon as this task reaches `review_ready` — an immutable published commit on `agent/claude/devops/task-018`, with no merge required. The toolchain reaches `integrated` only after TASK-019's verdict closes that gate. That ordering is what removes finding F-101 for this task: the gate no longer waits for a merge that waits for the gate.

The gate is deliberately not owned by TASK-009: TASK-009 runs at Wave 7 and reviews runtime source, so assigning this gate to it would leave an unreviewed toolchain integrated for five waves with three tasks compiling against it.

The security gate is owned by TASK-010. Its scheduling class, its ordering against integration, its lineage, and its lineage round are declared on both sides of the pair in the frontmatter above and summarized in the aggregate and retrospective gate register in `tasks/TASK-001-DEPENDENCY-GRAPH.md`, row "TASK-010 / security / TASK-018"; those are the only normative statements of those values, and this body names the register rather than restating them. The register records why the delay is accepted — there is no code to threat-model before a toolchain exists — and the mitigations: ADR-0001's zero-third-party-runtime-dependency rule, the dependency inventory TASK-019 must produce as a pre-merge gate, and the repository's baseline security CI workflow running on the pull request. This task therefore reaches `integrated` before it reaches `done`, which the edge vocabulary in `tasks/TASK-001-DEPENDENCY-GRAPH.md` distinguishes. The independent assessment obligation is TASK-010 `V10-TOOLCHAIN`.

Finding F-203 recorded that revision 3 called this the graph's only delayed gate; the register now lists every one of them. Finding F-402 recorded that this body still restated values it may only reference.

## Task-record lifecycle

This record's `status` field and its lifecycle directory are changed only by the Orchestrator under TASK-013. `tasks/**` is outside this role's configured write scope. Record the handoff in the commit message and the pull request description; the Orchestrator transcribes it into the section below.

## Handoff

Maintained by the Orchestrator under TASK-013 from the owner's commit and pull request.

- Commit or pull request:
- Verification:
- Known risks:
- Governance decision consumed: HUMAN-001, option A, commit `fb9f45c`, recorded by TASK-013 activation `ACT-001` in `tasks/TASK-013-ACTIVATION-LOG.md` event seq 1.
- Next owner: devops / claude to implement once `gate_passed(TASK-016, review)` is satisfied; then reviewer / gpt for TASK-019; then orchestrator via TASK-013 to integrate the toolchain and unblock Wave 3
</content>
