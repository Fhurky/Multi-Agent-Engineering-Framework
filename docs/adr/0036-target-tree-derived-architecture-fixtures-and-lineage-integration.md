# ADR-0036: Task fixtures and architecture-lineage integration are derived from the published target tree

- Status: TASK-035 recorded changes-required for TASK-034; A-202 and A-402, including A-004/A-101 residue, individually resolved; newest-to-oldest integration order superseded by [ADR-0041](0041-cumulative-architecture-lineage-integration-unit.md)
- Date: 2026-08-06
- Deciders: Solution Architect under TASK-034
- Affects: TASK-005 and TASK-007 projection fixtures; TASK-005 graph validation; Orchestrator integration; every consumer of `LIN-ARCH-REVIEW`
- Supersedes in part:
  - [ADR-0032](0032-lossless-task-record-source-and-projection.md) — its fixed immutable-target identity and literal task-relation fixture assertions. The recursive source schema, exact raw/body retention, leaf audit, explicit projection/inverse, and split ownership remain in force.
- Extends: [ADR-0016](0016-integration-branch-and-typed-merge-order.md) and [ADR-0018](0018-publication-classes-and-gate-lineages.md) with a target-tree derivation rule; their integration-branch and typed-lineage semantics remain unchanged.

## Context

Round-5 finding **A-202** records that ADR-0032's literal task-record, gate-relation, and enriched-relation fixture values did not describe its own published tree. Round-5 finding **A-402** records the same class of currentness defect in the integration strategy and graph proof: they still named the TASK-028 revision, four architecture artifacts, and a lineage-round-4 floor after a fifth rejected publication and two more task records existed.

The task graph is not owned by the Architect and changes whenever the Orchestrator activates another task. Copying a count or current round from a prior report makes an architecture amendment stale before review. Model correction MC-011 therefore requires every task-tree fact to be derived from the amendment's own published target and prohibits inheriting literals from an earlier target.

## Decision

**The published Git tree is the fixture and the derivation algorithm is normative.** Enumerate every tracked Markdown file under `tasks/`. A file is a task record only when its first YAML front-matter document is a mapping containing `task_id`; support records such as the dependency graph and activation log are not silently counted as tasks. Sort records by `(task_id, path)` for reproducible diagnostics.

For each record, load and project through the public source/projection boundary. Derive fixture facts rather than configuring them:

- record count is the number of projected task records;
- relation-document count is the sum of every `gate_tasks` and `gate_for` list length;
- pair count is the number of canonical eight-field relation keys after requiring one forward and one reverse document per key;
- an enriched relation document has all three provenance fields `verdict_recorded_at`, `remediated_by`, and `revalidated_by`; a partially enriched document is invalid;
- `G*` is expanded from the projected typed dependencies and gate relations using the normative expansion table, then checked by deterministic Kahn sorting with task ID as the tie-breaker.

No normative fixture embeds those counts. A publication may include a verification snapshot, but it must name the target tree and method, and a later target must recompute rather than copy it. The TASK-034 target snapshot derived at authoring time contains 35 task records, 116 relation documents forming 58 exact pairs, 44 fully enriched and zero partially enriched relation documents, and 153 expanded prerequisite edges. Deterministic Kahn sorting consumes all 35 tasks, so the target graph is acyclic. These values are evidence for this target, not configuration for the next one.

**Architecture lineage currentness is derived from the same records.** For `LIN-ARCH-REVIEW`, the registered cohort is the ordered union of relation targets, the current round is the greatest contiguous declared `lineage_round`, and the owner of each round is the unique gate task carrying that round. An implementation consumer's minimum acceptable floor is the current round until that round records a passing or formally accepted verdict; after `changes-required`, the next activated amendment/reviewer pair extends the register and the target-derived floor moves. The target snapshot has six authoring artifacts in the cohort, six review rounds, and TASK-035 as the round-6 gate task. Those values must not be copied into a future currentness clause.

Integration order lists architecture rows from newest amendment to oldest and derives each row's review chain from the matching `gate_tasks`/`gate_for` relations. The implementation, toolchain, and final integration rows then follow their typed dependencies. A failed architecture publication is an authoring baseline in the chain, never an approved source and never a reason to lower the lineage floor.

## Alternatives considered

**Freeze the TASK-034 snapshot as the new fixture.** Rejected. It would reproduce the same defect as soon as another activation adds a task or relation.

**Use the latest review report's counts.** Rejected. A report proves a different immutable target and cannot be the source of facts about this publication.

**Edit `tasks/**` so the graph matches existing architecture prose.** Rejected. The graph is outside the Architect's write scope, and the independent projection already proves it is schedulable. The defect is architecture currentness, not graph correctness.

**Keep a manually maintained revision number.** Rejected. Revision labels are neither part of the public graph input nor sufficient to identify the Git tree. The immutable target commit plus deterministic enumeration is the reproducible identity.

## Consequences

Positive:

- Projection fixtures, pair proofs, topology proofs, lineage floors, and integration cohorts cannot drift merely because a new task was activated.
- Review can reproduce every reported value directly from the immutable target.
- The A-004 and A-101 residue closes through the same A-402 rule without duplicate decision authority.
- ADR-0032's repaired schema and lossless inverse remain intact.

Negative:

- Validation must parse the complete task tree at publication and can no longer rely on a small representative fixture.
- Verification snapshots are intentionally per-target evidence and require recomputation in every amendment.
- Integration documentation must distinguish durable lineage rules from transient target snapshots.
