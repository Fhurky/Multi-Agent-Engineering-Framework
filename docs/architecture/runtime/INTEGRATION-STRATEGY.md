# Integration and Branch Aggregation Strategy

Normative integration strategy for the runtime task graph. Produced under TASK-002. Related decision: [ADR-0010](../../adr/0010-integration-and-branch-aggregation-strategy.md).

Six implementation tasks (TASK-003 … TASK-008) run in four waves across isolated worktrees and separate agent branches. This document defines how their branches converge without contract drift and without a merge conflict any agent has to resolve.

## Why conflicts are structurally impossible

The write-scope partition recorded in `tasks/TASK-001-DEPENDENCY-GRAPH.md` gives no two tasks a shared path. Every module has exactly one owner ([COMPONENT-BOUNDARIES.md](COMPONENT-BOUNDARIES.md)). Consequently:

- Two agent branches never modify the same file, so a textual merge conflict cannot arise from the partition itself.
- The remaining risk is **semantic**, not textual: two branches can compile independently and still disagree about a contract. That is the risk this strategy manages.

The single control for semantic drift is that [INTERFACE-CONTRACTS.md](INTERFACE-CONTRACTS.md) is normative and immutable during Wave 2 through Wave 5.

## Branch topology

```text
main
 |
 +-- agent/claude/architect/task-002        Wave 1   docs and ADRs
 |
 +-- agent/claude/runtime/task-003          Wave 2   src/orchestrator/state/**
 +-- agent/claude/runtime/task-004          Wave 2   src/agents/**
 +-- agent/claude/runtime/task-005          Wave 3   src/orchestrator/scheduling/**
 +-- agent/claude/runtime/task-006          Wave 4   src/orchestrator/supervisor/**
 +-- agent/claude/runtime/task-007          Wave 5   src/orchestrator/lifecycle/**, bin/**
 +-- agent/claude/runtime/task-008          Wave 5   src/orchestrator/recovery/**
```

Rules:

1. **Every task branches from `main`**, never from a sibling agent branch. A task created from a sibling would inherit unreviewed work and would make the sibling's review gate meaningless.
2. **A task branches from `main` at or after the commit where its declared dependencies merged.** Wave 3 worktrees are created only after TASK-003 is on `main`; Wave 4 only after TASK-005 is on `main`; Wave 5 only after TASK-006 is on `main`.
3. **No agent pushes to `main`.** The tracked pre-push hook blocks it and every branch integrates by pull request.
4. **No rebasing of a sibling's branch by anyone but its owner.** A branch that needs a newer `main` is rebased or merged by its own owner, in its own worktree.

## Integration order

Integration follows the wave order because dependency edges are compile-time edges: TASK-005 imports interfaces that TASK-003's branch introduces.

| Step | Merge to `main` | Unblocks |
|---|---|---|
| 1 | TASK-002 (this task), after its review gate | TASK-003 and TASK-004 worktrees |
| 2 | Toolchain bootstrap (see the ownership gap below) | Wave 2 compilation |
| 3 | TASK-003 and TASK-004, in either order | TASK-005 |
| 4 | TASK-005 | TASK-006 |
| 5 | TASK-006 | TASK-007 and TASK-008 |
| 6 | TASK-007 and TASK-008, in either order | TASK-009 … TASK-012 |

Within a wave, the two parallel tasks may merge in either order and require no coordination, because their scopes are disjoint and neither imports the other.

**Merge method: squash per task**, one commit per task on `main`, message prefixed `feat:` and naming the task ID. One commit per task keeps `main` bisectable at task granularity and makes the remediation routing in TASK-013 able to name a single commit per finding.

**No long-lived integration branch.** An `integration/runtime` branch was considered and rejected: it would add a second merge for every task, delay the review and security gates behind an extra hop, and provide no protection that per-wave merging into `main` with required CI checks does not already provide. The fallback, should `main` ever need to stay releasable while the runtime lands, is to cut `release/*` from the last pre-runtime commit rather than to hold the runtime on a side branch.

## Contract change control

This is the mechanism that keeps six parallel implementations compatible.

**Rule.** During Wave 2 through Wave 5, no implementation task may change a type, signature, field name, or string-literal union defined in [INTERFACE-CONTRACTS.md](INTERFACE-CONTRACTS.md), even inside its own write scope.

**Procedure when a contract is wrong.**

1. The implementation task stops at the boundary and records the partial result, as the project's handoff rules require.
2. It hands off to the Orchestrator naming the exact type, the observed problem, and the minimum change.
3. The Orchestrator routes an amendment task to the architect role in a separate execution context.
4. The architect amends this document set and supersedes or amends the affected ADR.
5. The Orchestrator re-routes the amendment to every task already merged that consumes the changed type, as a remediation task with its own review gate.

**Why this rather than letting the owner change its own file.** The contract roots live inside TASK-003's and TASK-004's write scopes, so those two tasks physically *can* change them. If either did so unilaterally, downstream branches authored against the published contract would compile against a different shape and the drift would surface only at integration, after four other tasks had built on it. The rule converts a silent integration failure into an explicit handoff.

**Detection.** CI compiles the whole tree on every pull request, so a contract change made in violation of this rule fails the branch that made it as soon as a consumer exists on `main`. Before consumers exist, review of TASK-003 and TASK-004 must diff the contract roots against this document.

## Ownership gap that the Orchestrator must resolve before Wave 2

The runtime needs a toolchain: `package.json`, `tsconfig.json`, a test runner configuration, and a lint configuration. Those files sit at the repository root or under `scripts/quality/`.

**No task in the TASK-001 graph has them in its write scope.** TASK-003's scope is `src/orchestrator/state/**` and `tests/unit/orchestrator/state/**`; the root manifests are outside every runtime task's scope, and `scripts/quality/**` is not in the runtime role's configured scope either.

Consequence: as written, TASK-003 and TASK-004 cannot compile or run a test without changing a file outside their declared scope, which `validate-write-scope.ps1` would reject.

**This is not the architect's to fix.** Recorded here for Orchestrator routing, with a recommendation:

- Create one small task owned by the **devops** role, scoped to the root toolchain manifests and `scripts/quality/**`, that lands the Node.js and TypeScript toolchain, the test runner, and the corresponding CI step.
- Sequence it between TASK-002's review gate and the creation of the Wave 2 worktrees, as step 2 in the integration order above.
- Alternatively, extend TASK-003's write scope to include the root manifests. This is worse: it gives one implementation task authority over a repository-wide surface and couples every later task to TASK-003's toolchain choices without a separate review.

The parameters that task must satisfy are recorded in [ADR-0001](../../adr/0001-runtime-platform-and-language.md).

## Validation gates per branch

Before any runtime branch opens a pull request, its owner runs, from its own worktree:

```powershell
./scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree
```

CI additionally runs the framework validator, the orchestration control tests, and the write-scope validator against the pull request head. A branch that touches a governance path or another role's scope fails before review.

Review, security, QA, and performance gates then run as separate execution contexts per the TASK-001 graph. No author approves their own branch.

## Findings and remediation

Findings from TASK-009 through TASK-012 name the responsible child task ID. TASK-013 creates one remediation task per responsible implementation owner, and the owner fixes it on a new branch from current `main`. A validating role never edits the implementation, and a remediation branch follows the same partition and the same contract change control as the original.
