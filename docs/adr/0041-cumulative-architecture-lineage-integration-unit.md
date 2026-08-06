# ADR-0041: The cumulative architecture lineage is one content integration unit

- Status: Proposed under TASK-038; independent TASK-039 review pending
- Date: 2026-08-06
- Deciders: Solution Architect under TASK-038
- Affects: Orchestrator integration, TASK-003 and TASK-005 typed-edge evaluation, TASK-006 event application, every member and consumer of `LIN-ARCH-REVIEW`
- Supersedes in part:
  - [ADR-0010](0010-integration-and-branch-aggregation-strategy.md) and [ADR-0016](0016-integration-branch-and-typed-merge-order.md) — “squash per task” means one squash per content integration unit. Ordinary tasks remain one task per unit; a cumulative amendment lineage is one unit represented by its latest passing target, so predecessors receive no separate integration commit.
  - [ADR-0036](0036-target-tree-derived-architecture-fixtures-and-lineage-integration.md) — the newest-to-oldest architecture integration rows are replaced by one content-bearing row for the latest cumulative target. Target-tree derivation and all other currentness rules remain in force.
- Extends: [ADR-0018](0018-publication-classes-and-gate-lineages.md) with post-verdict lineage-subsumption evidence; its authoritative-verdict, growing-cohort, durable-history, and atomic-relation rules remain unchanged.

## Context

TASK-037 reproduced A-601 against the TASK-036 target. The normative order first integrated cumulative target `970b081`, then prescribed a squash of rejected predecessor `6d145eb`. Those branches are non-ancestral because the later authoring task imported the earlier architecture tree by content. The second merge-tree step exits 1 with 19 conflicting paths, even though the cumulative target alone merges cleanly into each tested integration base.

The same pattern exists throughout the architecture lineage. Content import is a legitimate authoring workaround when current task records and a rejected architecture tree have no permissible common branch point, but model correction MC-010 says import is neither ancestry nor integration. Replaying a predecessor after its cumulative successor both conflicts and risks restoring content that the later review already superseded.

The existing contracts also make a partial prose fix insufficient. `integrated(X)` requires a merge record for X, task lifecycle `done` requires `integrated(X)`, and ADR-0010/ADR-0016 say squash per task. Removing predecessor rows without defining their lifecycle evidence would strand them; retaining a commit for each would reproduce the defect.

## Decision

**Adopt the “latest passing cumulative target only” outcome.** `LIN-ARCH-REVIEW` is one cumulative content integration unit. From the immutable target tree, derive its complete ordered cohort, greatest contiguous round, unique gate task, complete relation set, and last cohort member `T`. Only when the authoritative verdict at that round is passing or formally accepted may `T` integrate. A `changes-required` verdict integrates no architecture content.

The integration transaction has one Git content operation: squash `T`'s published commit into `integration/autonomous-runtime` and require the result tree to equal `T`'s publication tree. Content-import commits, rejected predecessor branches, and their trees are not merge inputs. The one integration commit names `T` and `LIN-ARCH-REVIEW`.

After that verified squash, one crash-atomic event batch records lifecycle evidence. The first `BranchIntegrated` event gives `T` a `content-merged` record. Exactly one subsequent event per earlier cohort member, in cohort order, gives it a `lineage-subsumed` record. All records name the same integration branch, merge commit, source task `T`, source published commit, and timestamp; subsumed records additionally name the exact lineage and authoritative round. The batch is refused unless the passing verdict atomically closed every current relation and the source is the current cumulative target.

For `integrated(X)`, valid direct evidence and valid lineage-subsumption evidence are both sufficient, provided `review_ready(X)` and all of X's pre-merge gates are closed. A subsumption record is not a Git merge and does not approve X's rejected publication in isolation. It proves only that X's lifecycle responsibility is included in the one review-approved cumulative tree. Earlier publications and verdicts remain durable and unchanged.

**“Squash per task” is narrowed to “one squash per content integration unit.”** An ordinary task is still its own unit and still receives one squash commit. Only a cumulative amendment lineage is represented by one latest target; its superseded members receive no commits. This keeps task-level history everywhere that tasks contribute distinct content and gives remediation one precise commit for the cumulative architecture artifact.

The complete-order fixture is [`verify-integration-order.ps1`](../architecture/runtime/fixtures/verify-integration-order.ps1). It executes the full positive architecture content sequence, requires one step and exact target-tree equality, and also executes the historical second-step regression probe with its exact 19-path conflict set. Independent per-target checks do not satisfy this decision.

## Alternatives considered

**Integrate predecessors first, then the cumulative target, while preserving ancestry.** Rejected. The content-import lineage has no usable shared ancestry: merging a rejected architecture branch into the current task-record branch would bypass its pre-merge review gate. Manufacturing ancestry after review would change the provenance the reviewer assessed.

**Record explicit no-content predecessor steps before the target.** Rejected. Such steps add ordering and failure states without changing the tree. The lineage's atomic verdict already covers every predecessor relation, and typed subsumption records provide the lifecycle proof directly.

**Keep newest-to-oldest rows but resolve conflicts manually.** Rejected. It makes the prescribed output depend on conflict-resolution judgment after review and can regress repairs that the cumulative target already contains.

**Integrate only the target and leave predecessors unintegrated.** Rejected. Their closed gate relations would still be unable to satisfy the existing `terminal`/`done` lifecycle rule, producing durable task records that can never complete.

**Treat authoring content import as integration.** Rejected by provenance and MC-010. Import happens before the new cumulative artifact is reviewed, on an authoring branch, and cannot close a gate or create integration-branch evidence.

## Consequences

Positive:

- The normative architecture order cannot replay a rejected predecessor after its cumulative successor.
- The complete order has one deterministic content step and its final tree is the exact reviewed target tree.
- Every predecessor can close its lifecycle without a fabricated merge commit or rewritten verdict.
- Import provenance, review target identity, integration identity, and lifecycle closure remain distinct facts.

Negative:

- `IntegrationRecord` and `BranchIntegrated` gain discriminated evidence, and the transition function must validate a multi-task atomic batch.
- Integration history no longer has one commit for every architecture task; the one cumulative commit is the remediation identity for the lineage.
- The Orchestrator must derive the current cohort and target rather than accepting a caller-supplied predecessor list.

Risks and controls:

- A forged subsumption record could close an unrelated task. Exact cohort derivation, authoritative-round matching, full-batch cardinality, source-publication identity, and single-assignment guards reject it.
- A future amendment could accidentally restore predecessor rows. The complete-order fixture requires a one-step architecture sequence and keeps the historical 19-conflict regression live.
- This ADR is Architect-authored and has no approval authority. Until TASK-039 records a passing or formally accepted round-8 verdict, it integrates nothing and releases no consumer.
