---
task_id: TASK-018
title: Bootstrap the runtime TypeScript and Node.js toolchain
status: blocked
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
  - task: TASK-016
    edge: gate_passed
    gate: review
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
  - task: TASK-010
    gate: security
    round: 1
    verdict: pending
    retrospective: true
parent_task: TASK-001
human_decisions:
  - id: HUMAN-001
    status: resolved
    option: A
    decided_at: fb9f45c
    decided_on: 2026-08-04
    effect: package.json, package-lock.json, tsconfig.json, and scripts/quality/** were added to assignments.devops.write_scope in config/agents/settings.yaml.
blocked_reason: The amended runtime architecture has not passed its independent review gate. Landing a toolchain before the platform decision is reviewed risks landing the wrong one.
exit_condition: TASK-020 records a passing verdict on the TASK-016 amendment, which satisfies gate_passed(TASK-016, review).
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
- [ ] The task branch is published and a pull request is opened or updated, or the publication failure is recorded explicitly as `publication: local-only` with its reason, so the Orchestrator can transcribe the outcome accurately.

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

The security gate is owned by TASK-010 and is an **assembly gate, retrospective**: this task integrates at Wave 2, while TASK-010 threat-models the whole runtime at Wave 7. This task therefore reaches `integrated` long before it reaches `done`, which the edge vocabulary in `tasks/TASK-001-DEPENDENCY-GRAPH.md` distinguishes. The consequence is accepted because there is no code to threat-model before a toolchain exists; the mitigations are ADR-0001's zero-third-party-runtime-dependency rule, the dependency inventory TASK-019 must produce, and the repository's baseline security CI workflow running on the pull request.

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
