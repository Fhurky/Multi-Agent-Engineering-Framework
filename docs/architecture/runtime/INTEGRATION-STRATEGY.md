# Integration and Branch Aggregation Strategy

Normative integration strategy for the runtime task graph and final release merge. Produced under TASK-002 and amended under TASK-016, TASK-024, TASK-028, TASK-032, TASK-034, TASK-036, TASK-038, and TASK-040. Related decisions: [ADR-0010](../../adr/0010-integration-and-branch-aggregation-strategy.md) as superseded in part by [ADR-0016](../../adr/0016-integration-branch-and-typed-merge-order.md), [ADR-0015](../../adr/0015-typed-scheduling-gate-and-activation-contracts.md), [ADR-0018](../../adr/0018-publication-classes-and-gate-lineages.md), [ADR-0021](../../adr/0021-durable-ingress-module-and-the-eight-module-map.md), TASK-028 ADRs [0027](../../adr/0027-finalize-split-around-the-publication-append.md) and [0028](../../adr/0028-nominal-store-issued-durable-append-receipts.md), [ADR-0036](../../adr/0036-target-tree-derived-architecture-fixtures-and-lineage-integration.md), [ADR-0041](../../adr/0041-cumulative-architecture-lineage-integration-unit.md), and [ADR-0042](../../adr/0042-conditionally-authorized-post-gate-merge-executors.md).

**Eight** implementation tasks — TASK-003 through TASK-008, TASK-017, and TASK-026 — run in waves across isolated worktrees and separate agent branches, behind a toolchain task and the complete architecture-amendment lineage. This document defines how their branches converge without contract drift and without a merge conflict any agent has to resolve.

## Amendment register — TASK-040

TASK-040 adds the two conditional executors authorized by HUMAN-004 at `7dc07488a5b1cac8b1327ebd63bf747adbe03c68`. ADR-0042 supersedes only the operator-execution clauses: all typed order, squash, cumulative-unit, tree-equality, and contract-change rules remain. The complete authority contract is [POST-GATE-MERGE-EXECUTORS.md](POST-GATE-MERGE-EXECUTORS.md). This amendment records no approval; TASK-041 owns that verdict.

## Amendment register — TASK-038

TASK-037 recorded `changes-required` for TASK-036 at lineage round 7. It recorded A-501 through A-505 and every inherited obligation satisfied, but opened A-601 because the old order replayed rejected, non-ancestral predecessor trees after the cumulative target. TASK-038 changed only that integration procedure; TASK-039 later recorded the passing round-8 verdict at `734bdbc`, and the approved target was integrated at `de3a8d6`.

| Superseded integration claim | Superseded by | Finding | Decision |
|---|---|---|---|
| Every architecture authoring task is a separate content-bearing integration row, newest to oldest | The latest cumulative architecture target with the authoritative passing or formally accepted verdict is the lineage's only content integration unit; predecessors close by lineage-subsumption evidence and contribute no Git content | A-601 | [ADR-0041](../../adr/0041-cumulative-architecture-lineage-integration-unit.md) |
| Squash per task means one integration commit for every superseded architecture task | One squash commit per content integration unit. Ordinary tasks remain one task per unit; the cumulative architecture lineage is one unit represented by its latest passing target | A-601 | [ADR-0041](../../adr/0041-cumulative-architecture-lineage-integration-unit.md) |
| Content import made an imported predecessor integrable | Content import is authoring provenance only. The reviewed cumulative publication is the integration source; imported commits and predecessor branches are never replayed | A-601, MC-010 | [ADR-0041](../../adr/0041-cumulative-architecture-lineage-integration-unit.md) |

The target tree derives the current cohort, round, review owner, and current cumulative target. The TASK-038 publication snapshot is evidence for its own review and is never a literal fixture for a later target.

## Amendment register — TASK-036

TASK-035 recorded `changes-required` for TASK-034 at lineage round 6. TASK-036 joins `LIN-ARCH-REVIEW`; TASK-037 alone may record round 7. Enumeration of this publication target, rather than the TASK-034 snapshot below, supplies every current topology and lineage value.

| Superseded currentness claim | Superseded by | Finding | Decision |
|---|---|---|---|
| TASK-034/TASK-035 ended the author/reviewer topology at round 6 | The target-derived cohort has seven authoring artifacts and round 7 is uniquely owned by TASK-037 | A-501 through A-505 routing currentness | [ADR-0036](../../adr/0036-target-tree-derived-architecture-fixtures-and-lineage-integration.md) |
| `architecture-docs` had six registered holders | The target-derived holder set also includes TASK-036, still as one serialized overlap class | Scope currentness | Existing resource-lock rule; no new overlap class |

## Amendment register — TASK-034

TASK-033 recorded `changes-required` for TASK-032 at lineage round 5. TASK-034 joins `LIN-ARCH-REVIEW`; TASK-035 alone may record round 6. These rows name the round-4/TASK-028 currentness clauses superseded by this amendment rather than silently rewriting them.

| Superseded currentness claim | Superseded by | Finding | Decision |
|---|---|---|---|
| The strategy stopped at TASK-028/TASK-029 and called a four-member cohort at round 4 releasable | The lineage register in the published target derives the complete cohort, current round, review chain, and consumer floor; the TASK-034 snapshot is six artifacts at round 6 | A-402 (A-101 residue) | [ADR-0036](../../adr/0036-target-tree-derived-architecture-fixtures-and-lineage-integration.md) |
| Revision 7/TASK-028 identified the current branch topology | The current topology is enumerated from task records in the immutable published target, without a manually maintained revision label | A-402 (A-004 residue) | [ADR-0036](../../adr/0036-target-tree-derived-architecture-fixtures-and-lineage-integration.md) |
| `architecture-docs` had four registered holders | The target-derived holder set includes TASK-002, TASK-016, TASK-024, TASK-028, TASK-032, and TASK-034, still one serialized overlap class | Scope currentness | Existing resource-lock rule; no new overlap class |

## Amendment register — TASK-028

TASK-025 recorded `changes-required` for the TASK-024 publication, so neither TASK-024 nor either earlier authoring baseline is approved. TASK-028 joins `LIN-ARCH-REVIEW` at lineage round 4; TASK-029 independently records one verdict over the four accumulated relations.

| Superseded claim (TASK-024) | Superseded by | Finding | Decision |
|---|---|---|---|
| TASK-024 was the amendment that could merge and lineage round 3 released implementation | TASK-028 is the next reviewable amendment; only a passing TASK-029 verdict at lineage round 4 can make any architecture artifact integrable | Review provenance | The committed task graph's round-4 lineage |
| `architecture-docs` had three holders | TASK-002, TASK-016, TASK-024, and TASK-028 share the same serialized scope | Scope isolation | Existing resource-lock rule; no new overlap class |
| A successful `executeFinalize` could publish, release the task lock, and then return publication events | Three phases: durable finalize intent, publication while the task lock remains held, durable `ArtifactPublished`, then `completeFinalize` verifies its store-issued subject and releases | A-205, A-206 | [ADR-0027](../../adr/0027-finalize-split-around-the-publication-append.md), [ADR-0028](../../adr/0028-nominal-store-issued-durable-append-receipts.md) |

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

The write-scope partition projected from the published task tree gives no two implementation tasks a shared path. Every module has exactly one owner ([COMPONENT-BOUNDARIES.md](COMPONENT-BOUNDARIES.md)), and TASK-026's `src/orchestrator/ingress/**` is disjoint from TASK-003's `state/`, TASK-005's `scheduling/`, TASK-006's `supervisor/`, TASK-007's `lifecycle/`, TASK-008's `recovery/`, and TASK-017's `workspace/`. Consequently:

- Two concurrently admissible implementation branches never modify the same file, so a textual merge conflict cannot arise from the implementation partition itself.
- The remaining risk is **semantic**, not textual: two branches can compile independently and still disagree about a contract. That is the risk this strategy manages.

Tasks whose scopes genuinely cannot be made disjoint — because each later task revises what its predecessor produced — declare a shared `resource_lock`, and the scheduler serializes them at admission. At the TASK-038 target, `architecture-docs` is held by TASK-002, TASK-016, TASK-024, TASK-028, TASK-032, TASK-034, TASK-036, and TASK-038. The set is derived from task records; later amendments extend it without creating another overlap class. Serialization prevents concurrent authorship; ADR-0041 separately prevents those deliberately overlapping histories from being replayed as independent content merges.

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
      +-- agent/gpt/reviewer/task-025        Wave 0   rejected task-024
      +-- agent/gpt/architect/task-028       Wave 1   third amendment, this document set
      +-- agent/gpt/reviewer/task-029        Wave 1   gates task-028 and prior cohort
      +-- agent/gpt/architect/task-032       Wave 1   fourth amendment; rejected at round 5
      +-- agent/gpt/reviewer/task-033        Wave 1   gated task-032 and prior cohort
      +-- agent/gpt/architect/task-034       Wave 1   fifth amendment, this document set
      +-- agent/gpt/reviewer/task-035        Wave 1   rejected task-034 and prior cohort
      +-- agent/gpt/architect/task-036       Wave 1   sixth amendment, this document set
      +-- agent/gpt/reviewer/task-037        Wave 1   rejected task-036 and prior cohort
      +-- agent/gpt/architect/task-038       Wave 1   seventh amendment, this document set
      +-- agent/gpt/reviewer/task-039        Wave 1   gates task-038 and prior cohort
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

The published target tree is the topology authority. At the TASK-038 snapshot, TASK-026 remains at Wave 4 and the architecture author/reviewer chain extends through TASK-038/TASK-039 at Wave 1. The implementation wave numbers remain unchanged. A later publication re-enumerates the task tree; it does not edit a revision label here.

Rules:

1. **Every task branches from `integration/autonomous-runtime`**, never from a sibling agent branch. A task created from a sibling would inherit unreviewed work and would make the sibling's review gate meaningless.
2. **A task branches at or after the commit where its declared dependencies reached `integrated`.** Wave 4 worktrees are created after TASK-003 and TASK-004 are integrated; Wave 5 after TASK-017 and TASK-026; Wave 6 after TASK-005; Wave 7 after TASK-006.
3. **No agent or executor pushes to `main`.** The tracked pre-push hook blocks the push, every branch integrates by pull request, and the runtime's workspace module has no code path that can construct a push to any ref but its own task branch ([WORKSPACE-LIFECYCLE.md](WORKSPACE-LIFECYCLE.md)). HUMAN-004 conditionally permits only the DevOps release executor to merge the protected integration pull request through the GitHub API. It cannot invoke `git push`, set `ALLOW_MAIN_PUSH`, bypass policy, or name another base.
4. **No rebasing of a sibling's branch by anyone but its owner.** A branch that needs a newer integration branch is rebased or merged by its own owner, in its own worktree.
5. **`main` receives the runtime as one independently gated pull request** from `integration/autonomous-runtime`, not as a stream of task merges. Its merge is performed by the DevOps executor only after conditional activation and release admission; until then, the current human-controlled flow remains and existing pull requests are unaffected.

## Integration order

Integration follows the wave order because dependency edges are compile-time edges: TASK-005 imports interfaces that TASK-003's branch introduces. For `LIN-ARCH-REVIEW`, however, the entire amendment cohort represents one successively refined artifact. Its content-bearing order is therefore a one-element sequence containing only the latest cumulative target whose authoritative lineage verdict passes.

Each row states what merging that task **releases**, in the typed vocabulary of [STATE-MACHINE.md](STATE-MACHINE.md#typed-dependency-edges). A task becomes **integrable** when it is `review_ready` and every gate in its `pre_merge_gates` is closed.

| Step | Wave | Merge into `integration/autonomous-runtime` | `pre_merge_gates` that must close first | Releases |
|---|---|---|---|---|
| 1 | 1 | The target-derived latest cumulative `LIN-ARCH-REVIEW` target; TASK-038 in this publication | Its own `review` relation at the target-derived authoritative lineage round; TASK-039 in this publication | One content merge closes `integrated` directly for the target and by lineage subsumption for every superseded cohort member; releases the target-derived lineage floor to consumers |
| 2 | 2 | TASK-018, the toolchain | `review` — TASK-019 r1 | `integrated(TASK-018)` for TASK-003, TASK-004, TASK-017, TASK-026 |
| 3 | 3 | TASK-003 and TASK-004, in either order | none — assembly gates only | `integrated` for TASK-005, TASK-006, TASK-008, TASK-017, TASK-026 |
| 4 | 4 | TASK-017, the workspace module | none | `integrated(TASK-017)` for TASK-006 and TASK-008 |
| 5 | 4 | TASK-026, the ingress inbox and collector | none | `integrated(TASK-026)` for TASK-005 |
| 6 | 5 | TASK-005 | none | `integrated(TASK-005)` for TASK-006 |
| 7 | 6 | TASK-006 | none | `integrated(TASK-006)` for TASK-007 and TASK-008 |
| 8 | 7 | TASK-007 and TASK-008, in either order | none | `review_ready` for TASK-009 … TASK-012 |
| 9 | — | `integration/autonomous-runtime` into `main` | one immutable `release-gates/v1` manifest; authoritative aggregate review, security, QA, performance, documentation, deployment, and rollback lineage requirements all closed | Release |

Within a wave, parallel tasks may merge in either order and require no coordination, because their scopes are disjoint and neither imports the other. TASK-017 and TASK-026 are the Wave 4 pair: `src/orchestrator/workspace/**` and `src/orchestrator/ingress/**` do not overlap, and neither imports the other's implementation. Both sit at level 1 of the module partial order, so neither can depend on the other even accidentally.

Steps 1 and 2 are the only task rows with a non-empty `pre_merge_gates`. Every gate task in those rows is dispatchable on `review_ready`, before its target merges, so no review gate waits on a merge that waits on that review. Step 9 is different and explicitly new: its seven aggregate domains are declared in `ReleaseGateManifest`, evaluated with the lineage form of `gate_passed`, and never inferred from a task owner form.

**The architecture edge is the lineage form.** Consumers name `LIN-ARCH-REVIEW`, never an authoring task. The minimum acceptable floor is derived from the greatest contiguous round declared by the target's matching relation pairs. A passing or formally accepted verdict at that floor closes the edge. A `changes-required` verdict remains durable and causes the next activated amendment/reviewer pair to extend the register; no consumer edge is retargeted and no failed target is integrated.

**Merge method: one squash commit per content integration unit.** For an ordinary task, the unit is that task and the message is prefixed `feat:` and names its task ID. For `LIN-ARCH-REVIEW`, the unit is the complete cumulative artifact represented by the latest target with the authoritative passing or formally accepted verdict; its one commit names that target and the lineage. Superseded cohort members receive lineage-subsumed integration evidence pointing to that same commit and receive no commit of their own. This preserves one-commit remediation identity without replaying rejected trees.

**Executor and identity.** After its activation conditions hold, the runtime post-gate executor performs Steps 1 through 8 one admitted content unit at a time using `squash`. The DevOps release executor performs Step 9 using the protected PR `merge` method. Each plan pins the exact PR head and base OIDs and the next `IntegrationOrderKey`; a mutable branch name only selects a ref for an immediate equality check. A base change, stale head, wrong method, earlier missing unit, or order-key mismatch refuses before mutation.

The integration lease serializes admitted local plans per protected base. GitHub rules require strict current-base checks and no bypass, so a concurrent protected-base update invalidates admission at the server rather than silently changing the content unit. After the API call, exact target-tree equality is mandatory. No result is integrated merely because GitHub reports the PR closed or merged.

### Cumulative architecture integration transaction

The runtime post-gate executor performs the GitHub portion of this transaction only after deriving and validating the lineage from the immutable target tree. The Orchestrator neither merges nor appends the result:

1. Derive the ordered `LIN-ARCH-REVIEW` cohort, the greatest contiguous round, its unique gate task, and that gate task's complete relation set. Let `T` be the last cohort member and require that the gate task's unique `review_ready` dependency names `T`.
2. Require the authoritative verdict at that round to be passing or formally accepted, every relation in its atomic verdict batch to be closed, and `T` to be `review_ready`. A `changes-required` verdict integrates nothing.
3. Squash only `T`'s published commit into `integration/autonomous-runtime`. Verify that the resulting tree equals the published tree of `T`. Neither an authoring content-import commit nor any superseded task branch is a merge input.
4. Persist and publish the verified terminal merge result. TASK-026's authorized result adapter appends one `branch_integrated` fact. In the ordinary scheduling activation, the supervisor appends one crash-atomic state evidence batch. Its first `BranchIntegrated` records `content-merged` for `T`. The remaining events, in cohort order, record `lineage-subsumed` for each predecessor. Every record names the same integration branch, merged commit, source task `T`, source published commit, lineage, and authoritative round. A mismatch, duplicate record, non-current target, incomplete cohort, or predecessor content operation rejects the whole batch.
5. Evaluate `integrated(X)` from those records. `T` is integrated directly; a predecessor is integrated only by the exact lineage-subsumption proof above. Because the same authoritative verdict has already closed every cohort relation, each predecessor may then satisfy `terminal` and reach lifecycle `done` without replaying its blobs.

`lineage-subsumed` is lifecycle evidence, not a Git operation and not a claim that a rejected predecessor was approved in isolation. It says that the predecessor's historical responsibility is contained in the one reviewed cumulative tree. Each rejected verdict and publication remains durable.

The alternative named by A-601—integrating predecessors before the cumulative target through preserved ancestry or explicit no-content steps—is rejected. Content-import lineage deliberately has no usable shared ancestry, and no-content predecessor steps would add ordering state while producing the same final tree and evidence. The single cumulative unit is both smaller and faithful to what the review gate actually assesses.

### Complete-order fixture

[`fixtures/verify-integration-order.ps1`](fixtures/verify-integration-order.ps1) is the normative read-only Git fixture for the architecture portion of the prescribed order. Given an integration base and the cumulative published target, it executes the complete content-bearing sequence—exactly one merge-tree step—requires zero conflicts, and requires the result tree to equal the target tree. It then runs the historical two-row regression probe (`970b081` followed by rejected predecessor `6d145eb`) and requires the known 19-path conflict set. The set uses Git's actual path, `docs/adr/README.md`; the round-7 prose called that path `docs/architecture/README.md`, which does not exist in the target. A fixture that merely tests each old target independently against the base is invalid because it does not execute the sequence that caused A-601.

### Release integration-evidence transaction

The release executor may accept integration history produced by the activated runtime executor, the bounded legacy operator path, or a mixture. It never trusts producer identity alone. Before Step 9 it:

1. Reads the immutable `ReleaseGateManifest`, requires exactly the seven aggregate gate domains, and proves each lineage requirement closed at or above its minimum round.
2. Enumerates every content unit represented by the integration head and requires one verified integration record for each. Direct and ADR-0041 lineage-subsumed records retain their distinct meanings.
3. Folds the records by `IntegrationOrderKey`, rejects missing/duplicate/reordered evidence, and requires the folded result tree to equal the pinned integration head tree.
4. Requires the pinned `main` base to be an ancestor of the integration head, persists the release plan, and invokes the protected PR merge only after the durable receipt is verified.
5. Verifies the release merge commit tree equals the integration head tree, persists the outcome, and publishes it for the same TASK-026/TASK-005 ingress path.

An operator-produced task merge is therefore compatible only while it emits evidence identical in semantics to executor-produced evidence. A naked merge commit or mutable branch observation is never sufficient release lineage.

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

TASK-016, TASK-024, TASK-028, TASK-032, TASK-034, TASK-036, TASK-038, and TASK-040 each apply the procedure below once. TASK-015, TASK-020, TASK-025, TASK-029, TASK-033, TASK-035, and TASK-037 independently rejected preceding authoring baselines; TASK-039 approved TASK-038 at round 8. TASK-041 alone may judge the TASK-040 amendment. No publication becomes approved by its authoring commit.

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

Human governance decision **HUMAN-001**, recorded at commit `fb9f45c`, adopted the recommended option: it added `package.json`, `package-lock.json`, `tsconfig.json`, and `scripts/quality/**` to the devops role's configured write scope. **TASK-018 owns the toolchain**, is gated by TASK-019 before it merges, carries a retrospective security gate owned by TASK-010, and appears after the target-derived architecture rows in the integration order above.

The rejected alternative stands as rejected: extending TASK-003's write scope to the root manifests would have given one implementation task authority over a repository-wide surface and coupled every later task to its toolchain choices without a separate review.

The parameters TASK-018 must satisfy remain those in [ADR-0001](../../adr/0001-runtime-platform-and-language.md).

## Ownership status and implementation gaps

All three earlier gaps are closed. TASK-040 closes the architectural ownership gap for both merge effects, while their implementations and activation controls remain deliberately absent until TASK-041 passes.

| Gap | Recorded by | Closed by |
|---|---|---|
| No task owned the root toolchain manifests or `scripts/quality/**` | TASK-002 | HUMAN-001 at `fb9f45c`; TASK-018 owns the toolchain |
| No module owned the agent workspace lifecycle that `AgentInvocation.worktreePath` presupposed | TASK-002, narrowed by F-105 | ADR-0011 under TASK-016; TASK-017 owns it. TASK-024 makes its intents durable before their side effects (A-103) |
| No module owned the durable ingress inbox the activation model requires | F-301, inherited by A-101 | ADR-0017 and ADR-0021 under TASK-024; TASK-026 owns it |
| No module owned admitted task-to-integration merge | HUMAN-004 / TASK-040 | ADR-0042 assigns `src/orchestrator/integration/` to `runtime`; implementation task not yet created |
| No module owned admitted integration-to-main release merge | HUMAN-004 / TASK-040 | ADR-0042 assigns `scripts/release/integration-merge/` to `devops`; implementation task not yet created |

The target-tree module map now has **ten** modules and ten distinct source paths, with no shared ownership ([COMPONENT-BOUNDARIES.md](COMPONENT-BOUNDARIES.md)). This assignment creates no task and no operational capability.

## Validation gates per branch

Before any runtime branch opens a pull request, its owner runs, from its own worktree:

```powershell
./scripts/orchestration/validate-write-scope.ps1 -IncludeWorkingTree
```

CI additionally runs the framework validator, the orchestration control tests, and the write-scope validator against the pull request head. A branch that touches a governance path or another role's scope fails before review.

Review, security, QA, and performance gates then run as separate execution contexts per the TASK-001 graph. No author approves their own branch.

For the two merge executors, ordinary branch validation is necessary but insufficient. Their immutable activation records additionally require independent implementation review, security validation, negative-capability and failure-injection evidence, live GitHub protection tests, and a human-issued GitHub control attestation. A missing or stale member refuses. TASK-040 supplies the contract only; TASK-041 reviews it, and the Orchestrator alone may create later work after a passing verdict.

For work the **runtime** dispatches, these steps are performed by the workspace lifecycle module rather than by a human: it verifies hooks, creates the branch and worktree, claims the lock, and runs the scope validator. Finalization is three-phase: `executeFinalize` commits, pushes, and creates or updates the pull request while returning `lockReleased:false`; the supervisor appends `ArtifactPublished`; `completeFinalize` accepts the store-issued publication receipt and only then releases the task lock. A failed append or verification leaves the lock held for recovery. See [WORKSPACE-LIFECYCLE.md](WORKSPACE-LIFECYCLE.md). The manual procedure remains in force for human-launched CLI sessions that build the runtime itself.

## Findings and remediation

Findings from TASK-009 through TASK-012 and every recorded review round, including TASK-014, TASK-015, TASK-019 through TASK-023, TASK-025, TASK-029, TASK-033, and TASK-035, name the responsible task ID. TASK-013 creates one remediation task per responsible owner, and the owner fixes it on a new branch from the current integration branch. A validating role never edits the implementation, and a remediation branch follows the same partition and the same contract change control as the original.

A superseding round is a **new gate task**, never a re-entered one. A recorded verdict is durable: a later round supersedes it and both stay recorded. That rule is enforced structurally in the runtime contracts — `gateVerdicts` is append-only, `gateLineages[l].rounds` is append-only, and no event expresses a rewrite of either — and procedurally in the task graph, where each architecture review through TASK-037 remains recorded and TASK-039 is a new task rather than a reopened reviewer.

**The relation that survives supersession is the lineage.** `LIN-ARCH-REVIEW` has one gate name; its cohort, contiguous rounds, and unique round owners are derived from the target's paired relations. At the TASK-038 target the cohort ends with TASK-038 and the current round is uniquely owned by TASK-039; the complete lists are enumerated from this publication rather than copied from an earlier snapshot. A consumer names the lineage and the target-derived floor; it never names one authoring task. That is the F-302 correction, and it is why the owner form of `gate_passed` is withdrawn rather than merely discouraged.
