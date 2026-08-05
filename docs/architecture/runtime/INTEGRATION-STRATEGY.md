# Integration and Branch Aggregation Strategy

Normative integration strategy for the runtime task graph. Produced under TASK-002, amended under TASK-016, amended again under TASK-024. Related decisions: [ADR-0010](../../adr/0010-integration-and-branch-aggregation-strategy.md) as superseded in part by [ADR-0016](../../adr/0016-integration-branch-and-typed-merge-order.md), [ADR-0015](../../adr/0015-typed-scheduling-gate-and-activation-contracts.md), and — under TASK-024 — [ADR-0018](../../adr/0018-publication-classes-and-gate-lineages.md) and [ADR-0021](../../adr/0021-durable-ingress-module-and-the-eight-module-map.md).

**Eight** implementation tasks — TASK-003 through TASK-008, TASK-017, and TASK-026 — run in waves across isolated worktrees and separate agent branches, behind a toolchain task and two architecture amendments. This document defines how their branches converge without contract drift and without a merge conflict any agent has to resolve.

## Amendment register — TASK-024

TASK-020's finding A-101 recorded that this document still proved the revision-3 five-invariant graph and still described a seven-module runtime. Every row below is a reconciliation with revision 5 of `tasks/TASK-001-DEPENDENCY-GRAPH.md`.

| Superseded claim (TASK-016) | Superseded by | Finding | Decision |
|---|---|---|---|
| A seven-branch topology ending at TASK-008 in Wave 6 | [Branch topology](#branch-topology): eleven rows over the revision-5 wave assignment, adding TASK-024, TASK-025, and TASK-026 | A-101 | [ADR-0021](../../adr/0021-durable-ingress-module-and-the-eight-module-map.md) |
| A nine-row integration order whose step 1 merges TASK-016 on the strength of TASK-020 | [Integration order](#integration-order): eleven rows, in which TASK-024 is the amendment that merges and TASK-025 is the gate that releases it | A-101 | [ADR-0021](../../adr/0021-durable-ingress-module-and-the-eight-module-map.md) |
| "Releases `gate_passed(TASK-016, review)` for TASK-003 …" — the target form naming one task | The lineage form `gate_passed(LIN-ARCH-REVIEW, review, 3)`, which needs no retarget when a round is superseded | A-101 | [ADR-0018](../../adr/0018-publication-classes-and-gate-lineages.md) |
| Contract immutability "during Waves 3 through 6" | During Waves 3 through **7**, matching the revision-5 wave numbering after TASK-026 was inserted at Wave 4 | A-101 | [ADR-0021](../../adr/0021-durable-ingress-module-and-the-eight-module-map.md) |
| "Ownership gaps that remain: none. The module map now has seven modules" | Eight modules, eight owners; the ingress gap opened by F-301 is closed by this amendment and TASK-026 | A-101, F-301 | [ADR-0021](../../adr/0021-durable-ingress-module-and-the-eight-module-map.md) |
| "Six parallel implementations" in contract change control | Eight | A-101 | [ADR-0021](../../adr/0021-durable-ingress-module-and-the-eight-module-map.md) |

## Amendment register — TASK-016

| Superseded claim (TASK-002) | Superseded by | Decision |
|---|---|---|
| "**Every task branches from `main`**" and "Merge to `main`" | Branch from and merge into `integration/autonomous-runtime`; `main` receives the integrated branch by a single human-reviewed pull request | [ADR-0016](../../adr/0016-integration-branch-and-typed-merge-order.md) |
| "**No long-lived integration branch.** An `integration/runtime` branch was considered and rejected" | Reversed on new evidence: the branch exists, the committed graph is defined over it, and the reasons for rejecting it do not survive the typed-edge model | [ADR-0016](../../adr/0016-integration-branch-and-typed-merge-order.md) |
| Six-row integration order with no TASK-017 and an unowned toolchain step | Nine-row order over the committed wave assignment, with TASK-017 at Wave 4 and TASK-018 owning the toolchain | [ADR-0016](../../adr/0016-integration-branch-and-typed-merge-order.md) |
| "Unblocks" expressed as merge alone | Expressed in the typed vocabulary: `review_ready`, `integrated`, `gate_passed`, and `pre_merge_gates` | [ADR-0015](../../adr/0015-typed-scheduling-gate-and-activation-contracts.md) |
| "Ownership gap that the Orchestrator must resolve before Wave 2" | Resolved: HUMAN-001 at `fb9f45c` assigned the toolchain to the devops role, and TASK-018 owns it | HUMAN-001, recorded in `tasks/TASK-001-DEPENDENCY-GRAPH.md` |
| Contract immutability "during Wave 2 through Wave 5" | During Waves 3 through 6, matching the committed wave numbering | [ADR-0016](../../adr/0016-integration-branch-and-typed-merge-order.md) |

## Why conflicts are structurally impossible

The write-scope partition recorded in `tasks/TASK-001-DEPENDENCY-GRAPH.md` revision 5 gives no two tasks a shared path. Every module has exactly one owner ([COMPONENT-BOUNDARIES.md](COMPONENT-BOUNDARIES.md)), and TASK-026's `src/orchestrator/ingress/**` is disjoint from TASK-003's `state/`, TASK-005's `scheduling/`, TASK-006's `supervisor/`, TASK-007's `lifecycle/`, TASK-008's `recovery/`, and TASK-017's `workspace/`. Consequently:

- Two agent branches never modify the same file, so a textual merge conflict cannot arise from the partition itself.
- The remaining risk is **semantic**, not textual: two branches can compile independently and still disagree about a contract. That is the risk this strategy manages.

Two tasks whose scopes genuinely cannot be made disjoint — because the second exists to revise what the first produced — declare a shared `resource_lock` instead, and the scheduler serializes them at admission. `architecture-docs`, held by TASK-002, TASK-016, and TASK-024, is one of the two.

The single control for semantic drift is that [INTERFACE-CONTRACTS.md](INTERFACE-CONTRACTS.md) is normative and immutable during Waves 3 through 7.

## Branch topology

```text
main
 |
 +-- integration/autonomous-runtime         the runtime's integration branch
      |
      +-- agent/claude/architect/task-002    Wave 0   docs and ADRs
      +-- agent/claude/architect/task-016    Wave 0   first amendment
      +-- agent/gpt/reviewer/task-020        Wave 0   gated task-016; recorded changes-required
      +-- agent/claude/architect/task-024    Wave 0   second amendment, this document set
      +-- agent/gpt/reviewer/task-025        Wave 1   gates task-024 before it merges
      +-- agent/claude/devops/task-018       Wave 2   toolchain manifests, scripts/quality/**
      +-- agent/gpt/reviewer/task-019        Wave 2   gates task-018 before it merges
      +-- agent/claude/runtime/task-003      Wave 3   src/orchestrator/state/**
      +-- agent/claude/runtime/task-004      Wave 3   src/agents/**
      +-- agent/claude/runtime/task-017      Wave 4   src/orchestrator/workspace/**
      +-- agent/claude/runtime/task-026      Wave 4   src/orchestrator/ingress/**
      +-- agent/claude/runtime/task-005      Wave 5   src/orchestrator/scheduling/**
      +-- agent/claude/runtime/task-006      Wave 6   src/orchestrator/supervisor/**
      +-- agent/claude/runtime/task-007      Wave 7   src/orchestrator/lifecycle/**, bin/**
      +-- agent/claude/runtime/task-008      Wave 7   src/orchestrator/recovery/**
```

Revision 5 inserted TASK-026 at Wave 4 and moved the scheduler and everything after it one wave later, because the scheduler's ingress observer reads a durable inbox TASK-026 owns. The wave numbers above are revision 5's, not revision 3's.

Rules:

1. **Every task branches from `integration/autonomous-runtime`**, never from a sibling agent branch. A task created from a sibling would inherit unreviewed work and would make the sibling's review gate meaningless.
2. **A task branches at or after the commit where its declared dependencies reached `integrated`.** Wave 4 worktrees are created after TASK-003 and TASK-004 are integrated; Wave 5 after TASK-017 and TASK-026; Wave 6 after TASK-005; Wave 7 after TASK-006.
3. **No agent pushes to `main`, and no agent merges into `main`.** The tracked pre-push hook blocks the push, every branch integrates by pull request, and the runtime's workspace module has no code path that can construct a push to any ref but its own task branch ([WORKSPACE-LIFECYCLE.md](WORKSPACE-LIFECYCLE.md)).
4. **No rebasing of a sibling's branch by anyone but its owner.** A branch that needs a newer integration branch is rebased or merged by its own owner, in its own worktree.
5. **`main` receives the runtime as one human-reviewed pull request** from `integration/autonomous-runtime`, not as a stream of agent merges.

## Integration order

Integration follows the wave order because dependency edges are compile-time edges: TASK-005 imports interfaces that TASK-003's branch introduces.

Each row states what merging that task **releases**, in the typed vocabulary of [STATE-MACHINE.md](STATE-MACHINE.md#typed-dependency-edges). A task becomes **integrable** when it is `review_ready` and every gate in its `pre_merge_gates` is closed.

| Step | Wave | Merge into `integration/autonomous-runtime` | `pre_merge_gates` that must close first | Releases |
|---|---|---|---|---|
| 1 | 0 | TASK-024, this amendment | `review` — TASK-025 r1 | `gate_passed(LIN-ARCH-REVIEW, review, 3)` for TASK-003 … TASK-008, TASK-017, TASK-018, TASK-026 |
| 2 | 0 | TASK-016, whose review gate closes at round 2 on the strength of this amendment | `review` — TASK-020 r1, TASK-025 r2 | Nothing further; its consumers name the lineage, not the task |
| 3 | 0 | TASK-002, whose review gate closes at round 3 | `review` — TASK-015 r1, TASK-020 r2, TASK-025 r3 | Nothing further; same reason |
| 4 | 2 | TASK-018, the toolchain | `review` — TASK-019 r1 | `integrated(TASK-018)` for TASK-003, TASK-004, TASK-017, TASK-026 |
| 5 | 3 | TASK-003 and TASK-004, in either order | none — assembly gates only | `integrated` for TASK-005, TASK-006, TASK-008, TASK-017, TASK-026 |
| 6 | 4 | TASK-017, the workspace module | none | `integrated(TASK-017)` for TASK-006 and TASK-008 |
| 7 | 4 | TASK-026, the ingress inbox | none | `integrated(TASK-026)` for TASK-005 |
| 8 | 5 | TASK-005 | none | `integrated(TASK-005)` for TASK-006 |
| 9 | 6 | TASK-006 | none | `integrated(TASK-006)` for TASK-007 and TASK-008 |
| 10 | 7 | TASK-007 and TASK-008, in either order | none | `review_ready` for TASK-009 … TASK-012 |
| 11 | — | `integration/autonomous-runtime` into `main` | every assembly gate closed | Release |

Within a wave, parallel tasks may merge in either order and require no coordination, because their scopes are disjoint and neither imports the other. TASK-017 and TASK-026 are the Wave 4 pair: `src/orchestrator/workspace/**` and `src/orchestrator/ingress/**` do not overlap, and neither imports the other's implementation. Both sit at level 1 of the module partial order, so neither can depend on the other even accidentally.

Steps 1 through 4 are the only rows with a non-empty `pre_merge_gates`. That is what makes TASK-019 and TASK-025 schedulable before their targets merge, and it is the reason a review gate no longer waits on a merge that waits on the review gate.

**The architecture edge is the lineage form.** Step 1 releases `{ lineage: LIN-ARCH-REVIEW, gate: review, lineageRound: 3 }`, held by nine tasks, rather than a target-form edge naming TASK-024. That is deliberate and it is the F-302 correction: revision 4 had to retarget this edge by hand when TASK-016 superseded TASK-002, and would have had to do so again for TASK-024. The lineage form names the durable relation, so a fourth round would require no edit to any consumer. `lineageRound: 3` is a floor, not an equality — the amendment carrying A-101 … A-105 must be the approved one, so a passing verdict at lineage round 1 or 2 does not satisfy it.

**Merge method: squash per task**, one commit per task on the integration branch, message prefixed `feat:` and naming the task ID. One commit per task keeps the branch bisectable at task granularity and makes the remediation routing in TASK-013 able to name a single commit per finding.

## Why an integration branch, reversing the TASK-002 decision

TASK-002 rejected a long-lived integration branch on three grounds. Each is re-examined here rather than left as a contradiction with the committed graph, which defines `integrated` over `integration/autonomous-runtime` and which the runtime must be able to execute.

| TASK-002 objection | Why it does not survive |
|---|---|
| "It adds a second merge for every task" | It adds one merge for the whole runtime, not one per task. Each task merges once, into the integration branch; only the final step touches `main` |
| "It delays every review and security gate behind an extra hop" | The opposite is now true. Gates are scheduled on `review_ready`, which is satisfied by a published commit on an unmerged branch. No gate waits on any merge, so the hop delays nothing |
| "It provides no protection that per-wave merges into `main` with required CI checks do not already provide" | It provides one the earlier model could not: `main` never holds a partially assembled runtime. TASK-018's security gate is retrospective by recorded acceptance, and TASK-010 assesses the toolchain at Wave 7. Under per-wave merges to `main`, `main` would carry an unreviewed-for-security toolchain for five waves |

The fallback recorded in TASK-002 — cutting `release/*` from the last pre-runtime commit — is unnecessary under this model, because `main` is never disturbed until the runtime is whole.

## Contract change control

This is the mechanism that keeps eight parallel implementations compatible.

**Rule.** During Waves 3 through 7, no implementation task may change a type, signature, field name, or string-literal union defined in [INTERFACE-CONTRACTS.md](INTERFACE-CONTRACTS.md), even inside its own write scope.

TASK-016 and TASK-024 are each the procedure below, executed once. TASK-015 found four contracts wrong before any implementation existed and TASK-016 amended them; TASK-020 then found five more, and this document set is TASK-024's amendment. Both are much cheaper here than they would have been in Wave 6, which is the whole argument for the rule — and the fact that the procedure ran twice before Wave 3 is evidence for it, not against it.

**Procedure when a contract is wrong.**

1. The implementation task stops at the boundary and records the partial result, as the project's handoff rules require.
2. It hands off to the Orchestrator naming the exact type, the observed problem, and the minimum change.
3. The Orchestrator routes an amendment task to the architect role in a separate execution context.
4. The architect amends this document set and supersedes or amends the affected ADR.
5. The Orchestrator re-routes the amendment to every task already merged that consumes the changed type, as a remediation task with its own review gate.

**Why this rather than letting the owner change its own file.** The contract roots live inside TASK-003's and TASK-004's write scopes, so those two tasks physically *can* change them. If either did so unilaterally, downstream branches authored against the published contract would compile against a different shape and the drift would surface only at integration, after four other tasks had built on it. The rule converts a silent integration failure into an explicit handoff.

**Detection.** CI compiles the whole tree on every pull request, so a contract change made in violation of this rule fails the branch that made it as soon as a consumer is on the integration branch. Before consumers exist, review of TASK-003 and TASK-004 must diff the contract roots against this document.

## Toolchain ownership — resolved

TASK-002 recorded that the runtime needs `package.json`, `tsconfig.json`, a test runner configuration, and a lint configuration, and that **no task in the graph had those paths in its write scope**. That gap is closed and this section supersedes the routing recommendation TASK-002 left here.

Human governance decision **HUMAN-001**, recorded at commit `fb9f45c`, adopted the recommended option: it added `package.json`, `package-lock.json`, `tsconfig.json`, and `scripts/quality/**` to the devops role's configured write scope. **TASK-018 owns the toolchain**, is gated by TASK-019 before it merges, carries a retrospective security gate owned by TASK-010, and appears as step 3 of the integration order above.

The rejected alternative stands as rejected: extending TASK-003's write scope to the root manifests would have given one implementation task authority over a repository-wide surface and coupled every later task to its toolchain choices without a separate review.

The parameters TASK-018 must satisfy remain those in [ADR-0001](../../adr/0001-runtime-platform-and-language.md).

## Ownership gaps that remain

None. All three gaps recorded against this graph are closed.

| Gap | Recorded by | Closed by |
|---|---|---|
| No task owned the root toolchain manifests or `scripts/quality/**` | TASK-002 | HUMAN-001 at `fb9f45c`; TASK-018 owns the toolchain |
| No module owned the agent workspace lifecycle that `AgentInvocation.worktreePath` presupposed | TASK-002, narrowed by F-105 | ADR-0011 under TASK-016; TASK-017 owns it. TASK-024 makes its intents durable before their side effects (A-103) |
| No module owned the durable ingress inbox the activation model requires | F-301, inherited by A-101 | ADR-0017 and ADR-0021 under TASK-024; TASK-026 owns it |

The module map now has **eight** modules, eight owners, and no unassigned runtime responsibility ([COMPONENT-BOUNDARIES.md](COMPONENT-BOUNDARIES.md)).

## Validation gates per branch

Before any runtime branch opens a pull request, its owner runs, from its own worktree:

```powershell
./scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree
```

CI additionally runs the framework validator, the orchestration control tests, and the write-scope validator against the pull request head. A branch that touches a governance path or another role's scope fails before review.

Review, security, QA, and performance gates then run as separate execution contexts per the TASK-001 graph. No author approves their own branch.

For work the **runtime** dispatches, these steps are performed by the workspace lifecycle module rather than by a human: it verifies hooks, creates the branch and worktree, claims the lock, runs the scope validator before any commit, publishes the branch, creates or updates the pull request, persists the identity durably, and releases the lock. See [WORKSPACE-LIFECYCLE.md](WORKSPACE-LIFECYCLE.md). The manual procedure above remains in force for the human-launched CLI sessions that build the runtime itself.

## Findings and remediation

Findings from TASK-009 through TASK-012, and from TASK-014, TASK-015, and TASK-019 through TASK-023 and TASK-025, name the responsible task ID. TASK-013 creates one remediation task per responsible owner, and the owner fixes it on a new branch from the current integration branch. A validating role never edits the implementation, and a remediation branch follows the same partition and the same contract change control as the original.

A superseding round is a **new gate task**, never a re-entered one. A recorded verdict is durable: a later round supersedes it and both stay recorded. That rule is enforced structurally in the runtime contracts — `gateVerdicts` is append-only, `gateLineages[l].rounds` is append-only, and no event expresses a rewrite of either — and procedurally in the task graph, where TASK-020 performed round 2 of TASK-002's review rather than TASK-015 being reopened, and TASK-025 performs round 3 rather than TASK-020 being reopened.

**The relation that survives supersession is the lineage.** `LIN-ARCH-REVIEW` has one gate name, a cohort that grew TASK-002 → TASK-016 → TASK-024, and three lineage rounds recorded by three distinct gate tasks. A consumer that needs "an approved runtime architecture" names the lineage and a floor round; it never names the gate task, so no consumer edge changed when TASK-016 superseded TASK-002 or when TASK-024 superseded TASK-016, and none will change if a fourth round becomes necessary. That is the whole of the F-302 correction, and it is why the owner form of `gate_passed` is withdrawn rather than merely discouraged.
