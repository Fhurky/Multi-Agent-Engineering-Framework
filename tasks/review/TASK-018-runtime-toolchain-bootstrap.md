---
task_id: TASK-018
title: Bootstrap the runtime TypeScript and Node.js toolchain
status: review
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
published_commit: 296b14faad459307650f0f6e066bd55fdd4bcbe3
published_branch: agent/claude/devops/task-018
published_remote_ref: refs/heads/agent/claude/devops/task-018 on origin, at 296b14faad459307650f0f6e066bd55fdd4bcbe3
pull_request: 20, OPEN, base integration/autonomous-runtime, head agent/claude/devops/task-018 at 296b14faad459307650f0f6e066bd55fdd4bcbe3, not a draft, mergeable
publication: published
publication_recorded_by: TASK-013 activation ACT-018, consuming ingress entry seq 26, event type artifact_published
review_ready: satisfied at 296b14faad459307650f0f6e066bd55fdd4bcbe3. This is the FIRST record in this graph to satisfy review_ready under the runtime publication class rather than the bootstrap class - immutable published commit, branch pushed to the configured remote, and an open pull request against integration/autonomous-runtime, all three present. Every earlier publication in this graph was bootstrap class.
integration_state: NOT INTEGRATED. review_ready is satisfied and the review gate is OPEN. TASK-018 declares pre_merge_gates [review], owned by TASK-019 at LIN-TOOLCHAIN-REVIEW lineage_round 1, verdict pending. No branch_integrated fact exists for this branch, nothing is merged, and pull request 20 must not be merged until TASK-019 records a passing verdict. ACT-018 performed no merge and simulated none.
owner_commits:
  - bc20bc533739cddd63804ca5eab1ad90bdb1107f
  - cd565e5b882f018a138eb34d4488a8d54b027647
  - 560f9a045704cffcc7493412326679bb5972a068
  - 296b14faad459307650f0f6e066bd55fdd4bcbe3
normative_architecture_source: 8ea5c32789ee01fd4a2cec4aff13905b120edae3, the immutable TASK-038 target. THIS IS THE FIRST APPROVED ARCHITECTURE SOURCE THIS GRAPH HAS HAD. LIN-ARCH-REVIEW recorded approved at lineage_round 8, at 734bdbc, and TASK-013 activation ACT-016 closed all eight relations together, so the lineage's authoritative verdict is passing at the floor this record's edge declares. The earlier baselines 9576fc9, 8d0c570, c2ee3eb, fe0374c, 468b37b, 6d145eb, and 970b081 remain superseded authoring baselines that were each rejected at rounds 1 through 7; a record that cites any of them as approved is still a finding. Build against 8ea5c32 and nothing else. The approved source is a commit on agent/gpt/architect/task-038 that has NOT been integrated into any branch; reading it is how a consumer consults the approved architecture until the separate branch-integration operation lands.
human_decisions:
  - id: HUMAN-001
    status: resolved
    option: A
    decided_at: fb9f45c
    decided_on: 2026-08-04
    effect: package.json, package-lock.json, tsconfig.json, and scripts/quality/** were added to assignments.devops.write_scope in config/agents/settings.yaml.
unblocked_reason: This task was blocked from the first decomposition until ACT-016 solely on the architecture gate. LIN-ARCH-REVIEW recorded approved at round 8, at 734bdbc, with A-601 resolved and no new finding, and ACT-016 closed all eight relations together. This record declares exactly ONE dependency - gate_passed(LIN-ARCH-REVIEW, review, 8) - and it is now satisfied, which makes this the only consumer whose complete typed dependency set is met and the first implementation task in this graph ever to become dispatchable. Build against the approved source 8ea5c32; it is a commit on agent/gpt/architect/task-038 that has not been integrated into any branch, so read it directly.
exit_condition: satisfied and discharged. This task declared exactly one dependency - gate_passed(LIN-ARCH-REVIEW, review, 8) - and LIN-ARCH-REVIEW recorded approved at round 8 at 734bdbc, closed by ACT-016. It was dispatched, executed, and published at 296b14f, and ACT-018 moved it to review. What remains is its own review and security gates, not a dependency.
review_target_base: 5dc764057843fc5e5a40909847b1de900c4fd992
review_target_commit: 296b14faad459307650f0f6e066bd55fdd4bcbe3
review_target_applicability: applicable and resolved. TASK-019 reviews the delta between this task's branch point on integration/autonomous-runtime and its published head. Both values are read from the repository - git merge-base 296b14f integration/autonomous-runtime returns 5dc7640, and 5dc7640 is on origin/integration/autonomous-runtime - rather than asserted. The target is immutable and must not be retargeted if this task later publishes a further commit; a superseding commit is reviewed by a new round, per findings F-403 and A-209.
review_target_note: The head 296b14f is bound rather than 560f9a0. The owner's pull request body contains one internally inconsistent sentence - "This branch is review_ready at 560f9a0" - which its own Verification section contradicts by recording that every command was run "in this worktree at 296b14f, the head of this branch", and which its own Commits table contradicts by listing 296b14f as the fourth commit. The durable ref state agrees with the head - refs/heads/agent/claude/devops/task-018 and its remote tracking ref both point at 296b14f, and pull request 20 reports headRefOid 296b14f. Both statements are recorded and neither overwrites the other, which is this graph's standing treatment of an owner statement a durable fact contradicts.
branch_point_of: integration/autonomous-runtime
scope_validation_base: 5dc764057843fc5e5a40909847b1de900c4fd992
scope_validation_applicability: applicable and resolved
scope_validation_note: Resolved by the owner inside its worktree as git merge-base HEAD integration/autonomous-runtime, reported in pull request 20, and reproduced by the Orchestrator at ACT-018. The owner recorded validate-write-scope.ps1 -IncludeWorkingTree -BaseRef 5dc764057843fc5e5a40909847b1de900c4fd992 as valid true over 12 changed files, and the Orchestrator independently confirmed the same 12 paths by git diff --name-only against the same base. The superseded pre-publication value was the reproducible expression git merge-base HEAD integration/autonomous-runtime. It is deliberately not origin/main, not c325275, and not a review-diff base. Findings F-403 and A-209 each recorded why.
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

Maintained by the Orchestrator under TASK-013 from the owner's commit messages and pull request 20, transcribed at activation `ACT-018`. Quoted material is the owner's; the Orchestrator adds no evidence of its own to this section beyond what it independently reproduced and says so where it did.

- **Commit or pull request:** four commits on `agent/claude/devops/task-018` over branch point `5dc7640` — `bc20bc5` the manifests, `tsconfig.json`, and the quality entry points; `cd565e5` the shared PowerShell entry point and the toolchain smoke test; `560f9a0` the runtime CI workflow; and the head **`296b14f`**, a linter fix so that specifier rules scan whole files and a specifier on the closing line of a multi-line import is checked. Published at `refs/heads/agent/claude/devops/task-018` on `origin` and opened as **pull request 20**, `OPEN` against `integration/autonomous-runtime`, head `296b14f`, not a draft, reported `MERGEABLE`. **This is the first `runtime`-class publication in this graph**, and the first record whose `review_ready` is satisfied by commit **plus** remote **plus** pull request rather than by the bootstrap allowance.

- **Verification, as the owner recorded it in pull request 20.** Every command was run in the owner's worktree at `296b14f`:

  | Command | Owner-recorded result |
  |---|---|
  | `./scripts/ci/runtime-checks.ps1 -Stage all` | pass — typecheck, lint, format, test, smoke |
  | `npm run typecheck` / `lint` / `format:check` / `test` | pass against the empty runtime tree, each reporting the skip explicitly |
  | `npm run toolchain:smoke` | pass — **9/9 cases**, including a type error, a failing test, a single-line and a multi-line lint violation, and a non-strict `node:assert` import each failing the build |
  | Temporary real module and `node:test` suite under `src/` and `tests/`, removed before commit | typecheck, lint, format, `npm test` 2/2, and `npm run test:coverage` at 100% line, branch, and function |
  | `./scripts/ci/validate-framework.ps1` | pass — 13 roles |
  | `./scripts/ci/test-orchestration.ps1` | pass |
  | `./scripts/security/check-repository.ps1` | pass |
  | `git diff --check 5dc7640...HEAD` | clean |
  | `./scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree -BaseRef 5dc764057843fc5e5a40909847b1de900c4fd992` | `valid: true`, **12 changed files** |

  The owner also recorded its ADR-0001 parameter mapping: `engines.node: ">=22.0.0"` with the workflow pinned to `node-version: 22.x`; `strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes` in `tsconfig.json`; `"type": "module"` with `NodeNext` resolution and a lint rule `ESM-RELATIVE-EXTENSION`; `node:test` with a `STRICT-ASSERT` lint rule; and an empty `dependencies` object with a `NO-THIRD-PARTY-IMPORT` lint rule. **Dependency inventory for the security gate: three dev-only packages** — `typescript`, `@types/node`, and `undici-types` — and zero runtime dependencies.

  **What the Orchestrator reproduced rather than accepted**, stated separately because the distinction is the one this log keeps everywhere: the four-commit chain and its order; the branch point `5dc7640` as `git merge-base 296b14f integration/autonomous-runtime`, and that `5dc7640` is on `origin/integration/autonomous-runtime`; the authored delta of exactly **12 paths, 1069 insertions, 0 deletions**, every one inside this task's declared write scope and inside `assignments.devops.write_scope`; `git diff --check` clean; that `package.json` declares the Node 22 floor, `"type": "module"`, and an empty `dependencies`; that the workflow holds `contents: read` and does not touch `ci.yml` or `security.yml`; and the pull-request state, base, head, and draft status. **Every PowerShell validator result above is the owner's, not the Orchestrator's** — this execution profile blocks those scripts and none was re-run here.

- **Known risks, as the owner recorded them and as the Orchestrator confirmed them:**
  - **No GitHub Actions run exists for this branch or this pull request.** The owner recorded that Actions is enabled on the repository but that no run was created for `runtime.yml` or for the baseline `ci.yml` within roughly twenty minutes of publication, that the most recent repository run predates the branch, and that `api.github.com` intermittently refused connections from that host during the window. **The Orchestrator confirmed the absence independently**: `gh run list --branch agent/claude/devops/task-018` returns `[]` and `gh pr checks 20` reports "no checks reported". **No CI success is claimed, inferred, or recorded.** The workflow has never executed on GitHub, so its `windows-latest` behavior is verified only by the owner's local runs. Re-running the checks on pull request 20 is how that gets confirmed, and it is a reviewer and operator action rather than an Orchestrator one.
  - The owner's own decisions a reviewer is asked to weigh, recorded verbatim in substance: no ESLint or Prettier, with lint and format written as dependency-free Node scripts under `scripts/quality/`; compile-then-run rather than type stripping, with `erasableSyntaxOnly` keeping the source compatible with stripping later; `tsconfig.json` options beyond the ADR-0001 minimum that constrain eight downstream tasks; an empty runtime tree reporting success with an explicit skip because `src/**` and `tests/**` are outside this task's scope; and `actions/setup-node@v4` chosen as a stable major beside the repository's existing `actions/checkout@v6`.
  - One internally inconsistent sentence in the pull request body names `560f9a0` as the `review_ready` commit. See `review_target_note` in the frontmatter: the head `296b14f` is bound, the owner's own verification and commit table agree with the head, and both statements are recorded.
  - The security gate is aggregate and retrospective. The toolchain and its three dev-only packages sit on the integration branch unassessed until TASK-010 runs at Wave 8. That exposure is declared in the aggregate and retrospective gate register and is unchanged by this publication.

- **Governance decision consumed:** HUMAN-001, option A, commit `fb9f45c`, recorded by TASK-013 activation `ACT-001` in `tasks/TASK-013-ACTIVATION-LOG.md` event seq 1. The owner recorded that no human-controlled governance path was modified, and the Orchestrator confirmed it from the changed-path list: `.github/workflows/ci.yml`, `.github/workflows/security.yml`, `config/agents/settings.yaml`, `.agents/**`, `scripts/orchestration/**`, and `tasks/**` are all absent from the delta.
- **The author did not approve this work and marked no gate as passed.** The owner states so in its own words, and no verdict on this artifact exists.
- **Next owner: reviewer / gpt for TASK-019**, `LIN-TOOLCHAIN-REVIEW` round 1, now `ready` on the satisfied `review_ready(TASK-018)` edge. Its target is `296b14f` against base `5dc7640`. **Pull request 20 must not be merged until that verdict passes**; merging first would be exactly the pre-merge-gate inversion finding F-101 exists to prevent. Then TASK-010 for the retrospective security gate, and the Orchestrator via TASK-013 to record the integration once it happens and release TASK-003, TASK-004, TASK-017, and TASK-026 from their `integrated(TASK-018)` edges.
</content>
