---
task_id: TASK-018
title: Bootstrap the runtime TypeScript and Node.js toolchain
status: blocked
owner_role: devops
llm: claude
branch: agent/claude/devops/task-018
worktree: C:/Users/furko/Desktop/multi-agent-worktrees/claude-devops-task-018
write_scope:
  - scripts/ci/**
  - .github/workflows/**
requested_write_scope_extension:
  - package.json
  - package-lock.json
  - tsconfig.json
  - scripts/quality/**
dependencies:
  - task: TASK-002
    edge: gate_passed
  - task: HUMAN-001
    edge: human_decision
required_gates:
  - review
  - security
gate_tasks:
  - task: TASK-019
    gate: review
  - task: TASK-010
    gate: security
parent_task: TASK-001
blocked_reason: The repository root manifests and scripts/quality/** are outside every configured role write scope in config/agents/settings.yaml. No agent may extend that file, because it is a human-controlled governance path. A human must decide the ownership before this task can be claimed.
exit_condition: TASK-015 records a passing verdict on TASK-002, and a human records decision HUMAN-001 extending the devops write scope in config/agents/settings.yaml to cover the requested paths.
---

# TASK-018: Bootstrap the runtime TypeScript and Node.js toolchain

## Objective

Land the compiler, test runner, and lint configuration that every runtime implementation task needs, so that Wave 2 can compile and run a test without any task writing outside its declared scope.

## Why this task exists and why it is blocked

`docs/architecture/runtime/INTEGRATION-STRATEGY.md` and ADR-0001 at commit `9576fc9` record an ownership gap the architect could not close from inside its own role: the runtime is TypeScript on Node.js 22, but **no task in the TASK-001 graph owns the root manifests**. TASK-003's scope is `src/orchestrator/state/**` and `tests/unit/orchestrator/state/**`; `package.json`, `tsconfig.json`, and `scripts/quality/**` are outside every runtime task's scope, and `scripts/quality/**` is outside the devops role's configured scope as well.

The architect recommended one small devops-owned task, and rejected the alternative of extending TASK-003's scope because that would give one implementation task authority over a repository-wide surface and couple every later task to its toolchain choices without a separate review. This task adopts that recommendation.

**It cannot be claimed yet.** Two of the four paths it needs are outside the devops role's configured `write_scope` in `config/agents/settings.yaml`, and that file is a human-controlled governance path that `validate-write-scope.ps1` rejects from any `agent/*` branch. Declaring a scope the validator would reject would be a decomposition that looks executable and is not — the defect this whole corrective pass exists to remove. The `write_scope` above therefore lists only what the devops role may write today; the paths it additionally needs are listed separately under `requested_write_scope_extension` and are the subject of the human decision.

## Human decision required — HUMAN-001

A human must choose one of the following and record the choice. Until then this task stays blocked and Wave 2 cannot start.

| Option | Effect | Trade-off |
|---|---|---|
| **A. Extend the devops scope** (recommended) | Add `package.json`, `package-lock.json`, `tsconfig.json`, and `scripts/quality/**` to `assignments.devops.write_scope` in `config/agents/settings.yaml` | Matches the architect's recommendation and keeps toolchain ownership with the role that owns CI. Requires a human edit to a governance file. |
| **B. Extend the runtime scope instead** | Add the same paths to `assignments.runtime.write_scope` and fold this task into TASK-003 | Rejected by ADR-0001: it gives one implementation task repository-wide authority and couples every later task to its choices without separate review. |
| **C. A human lands the toolchain directly** | The toolchain arrives on `main` outside the agent graph | No governance change needed, but the toolchain then has no task record, no review gate, and no traceable owner. |

The Orchestrator cannot make this choice: it would mean either editing a governance file from an agent branch or declaring a write scope that the validator rejects. Both are prohibited.

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

- [ ] Decision HUMAN-001 is recorded before any edit, and the paths this task writes are inside the devops role's configured scope as it stands after that decision.
- [ ] `package.json`, `tsconfig.json`, the test runner configuration, and the lint configuration land together and are mutually consistent.
- [ ] Every ADR-0001 binding parameter is satisfied: Node.js 22 LTS or newer, TypeScript strict with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`, ESM with `.js` relative specifiers, `node:test` with `node:assert/strict`, and zero third-party runtime dependencies.
- [ ] A type-check, a test run, and a lint run each succeed against the empty runtime tree, and their exact commands are recorded.
- [ ] The runtime CI workflow runs on `windows-latest` and fails the build on a type error, a failing test, or a lint error.
- [ ] No human-controlled governance path is modified, including `.github/workflows/ci.yml`, `.github/workflows/security.yml`, and `config/agents/settings.yaml`.
- [ ] `scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree` reports a valid result.
- [ ] All changed files remain inside this task's declared write scope as extended by HUMAN-001.

## Expected artifacts

- Root `package.json`, `package-lock.json`, and `tsconfig.json`.
- Lint and format configuration under `scripts/quality/`.
- A runtime CI workflow under `.github/workflows/` and its entry points under `scripts/ci/`.

## Dependency notes

- `gate_passed(TASK-002)` fixes the platform decision in ADR-0001. Landing a toolchain before that decision is reviewed risks landing the wrong one.
- `human_decision(HUMAN-001)` is a scheduling edge with a distinct satisfying condition: it is satisfied when a human records the ownership decision above. It is not satisfiable by any agent.
- **Blocks TASK-003, TASK-004, and TASK-017.** Each carries an explicit `implementation_published(TASK-018)` edge, because none of them can compile or run a test until this lands. This makes the toolchain gap visible in the scheduling graph rather than only in an architecture document.
- Corresponds to step 2 of the integration order in `docs/architecture/runtime/INTEGRATION-STRATEGY.md`.

## Gate ownership

This task's review gate is owned by **TASK-019**, which is dispatchable as soon as this task publishes. It is deliberately not owned by TASK-009: TASK-009 runs at Wave 7 and reviews runtime source, so assigning this gate to it would leave an unreviewed toolchain on `main` for five waves with three tasks compiling against it.

The security gate is owned by TASK-010 and is **retrospective**: this task merges at Wave 2, while TASK-010 threat-models the whole runtime at Wave 7. This task therefore reaches `implementation_published` long before it reaches `done`, which the edge vocabulary in `tasks/TASK-001-DEPENDENCY-GRAPH.md` distinguishes. The consequence is accepted because there is no code to threat-model before a toolchain exists; the mitigations are ADR-0001's zero-third-party-runtime-dependency rule, the dependency inventory TASK-019 must produce, and the repository's baseline security CI workflow running on the pull request.

## Task-record lifecycle

This record's `status` field and its lifecycle directory are changed only by the Orchestrator under TASK-013. `tasks/**` is outside this role's configured write scope. Record the handoff in the commit message and the pull request description; the Orchestrator transcribes it into the section below.

## Handoff

Maintained by the Orchestrator under TASK-013 from the owner's commit and pull request.

- Commit or pull request:
- Verification:
- Known risks:
- Next owner: the user, to record decision HUMAN-001; then devops to implement, then orchestrator via TASK-013 to unblock Wave 2
</content>
