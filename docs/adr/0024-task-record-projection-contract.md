# ADR-0024: An explicit, owned task-record projection contract

- Status: Accepted
- Date: 2026-08-05
- Deciders: Solution Architect under TASK-028
- Affects: TASK-003 declares `TaskRecordDocument`, `TaskRecordProjection`, and `TaskRecordDocumentSource`; TASK-005 implements the pure projection and the fixture obligation; TASK-007 implements the document source; TASK-006 admits the projected proposals
- Supersedes in part: [ADR-0018](0018-publication-classes-and-gate-lineages.md) — its consequence "The committed graph at revision 5 compiles against the contracts name for name, which was A-101's stated acceptance condition." That claim is withdrawn and replaced by a narrower one that is true as written: the committed graph is **projected** onto the contracts by the total, declared mapping below, and the mapping is lossless for every field the runtime schedules on. ADR-0018's decisions all stand: publication classes, the two `gate_passed` forms with the owner form withdrawn, plural `gateFor`, the four gate-pair properties, gate lineages, and the eight no-deadlock invariants.

## Context

Finding **A-202** in `reports/code-review/TASK-024-ARCHITECTURE-AMENDMENT-REVIEW-ROUND-2.md`, rated High, recorded that two acceptance claims are false as written at commit `c2ee3eb`:

- `docs/architecture/runtime/INTERFACE-CONTRACTS.md:334` claimed that "a committed task record compiles against these types without restatement", and `docs/architecture/runtime/STATE-MACHINE.md:330` claimed the same.
- `docs/architecture/runtime/LEASES-AND-SCHEDULING.md:260` required a fixture asserting that every task record in `tasks/` "parses into the contract types with **no field renaming**".

Neither can hold. A committed record uses `task_id`, `owner_role`, `write_scope`, `required_gates`, `pre_merge_gates`, `gate_for`, `gate_tasks`, `gate_class`, `gate_lineage`, `lineage_round`, `publication_class`, and `status`; `TaskRecord` uses `taskId`, `ownerRole`, `writeScope`, `requiredGates`, `preMergeGates`, `gateFor`, `gateTasks`, `gateClass`, `gateLineage`, `lineageRound`, `publicationClass`, and `state`. `TaskRecord` additionally requires runtime-only fields no committed record carries — `createdSeq`, `attempt`, `idempotencyKey`, `attemptStartedAt`, `lease`, `notBefore`, `lastFailure`, `result`, `updatedAt`, `workspaceId`, `publication`, `integration`, and `gateVerdicts`. And a committed `gate_tasks` or `gate_for` entry carries a per-relation `verdict`, which `GateAssignment` and `GateTarget` do not declare at all.

The claim was therefore doing real damage rather than merely overstating: it asserted that no normalization layer exists, so no module owned one, so gate lineage and scheduling validation depended on a transformation nobody had specified and nobody would review.

There are two honest remediations. Rename every contract field to the record's snake_case vocabulary, or declare the projection. This record takes the second.

## Decision

**A committed task record reaches the runtime through exactly one declared, owned projection, and through no other path.** The projection has an explicit source schema and an explicit target schema, both normative in section 2c of [INTERFACE-CONTRACTS.md](../architecture/runtime/INTERFACE-CONTRACTS.md).

- **Source.** `TaskRecordDocument` is the committed record's YAML front matter as a plain object, with the repository's snake_case field names exactly as committed. It is data, not a runtime record: it has no `state`, no `lease`, and no attempt.
- **Target.** `TaskRecordProjection.project` returns a `TaskProposal`, never a `TaskRecord`. This is the load-bearing half of the correction: a `TaskRecord` is produced only by `applyEvent` from `TaskCreated`, which is where the runtime-only fields come from. Asking a YAML document to produce a `TaskRecord` was the category error the claim rested on.
- **Ownership is split at the I/O boundary, exactly as every other boundary in this architecture is.** `TaskRecordProjection.project` is **pure and total** and is implemented in `src/orchestrator/scheduling/` by **TASK-005**, which already owns graph validation and the fixture obligation. `TaskRecordDocumentSource` — reading and parsing the files — is implemented in `src/orchestrator/lifecycle/` by **TASK-007**, which already owns every filesystem edge. The supervisor obtains documents from the source and hands them to the pure projection, so the declared import directions are unchanged and no module gains a second concern.

**Every document field is accounted for, in one of three classes, and the partition is exhaustive.**

| Class | Meaning | Effect on the runtime |
|---|---|---|
| Projected | Mapped by the total field table in section 2c to a named `TaskProposal` field | Schedules the task |
| Derived-and-checked | `branch` and `worktree`, which the workspace module derives from `(llm, ownerRole, taskId)` | Never consumed as input. The projection compares the document's value with the derivation and reports `DerivedFieldMismatch` rather than accepting either |
| Retained | Every remaining field — review targets, scope-validation bases, publication provenance, blocked reasons, remediation links, and the rest | Retained verbatim in `TaskRecordDocument.retained` and influences **no** runtime decision |

The claim this replaces the withdrawn one with is narrower and is true as written: **the mapping is total over the projected class and lossless in both directions for it, and no field outside that class reaches a scheduling decision.** A document field that is neither projected nor derived-and-checked nor retained does not exist, and the fixture asserts that.

**The per-relation `verdict` is projected rather than dropped.** `GatePairProperties` gains `declaredVerdict: DeclaredGateVerdict`, where `DeclaredGateVerdict = GateVerdict | 'pending'`. It is the *declaration's* record of the round's outcome and is never the runtime's authority: the authoritative verdict remains the one computed from `GateVerdictRecorded` and held in `run.gateLineages[l].rounds[n].verdict`. Admission rejects a proposal whose `declaredVerdict` contradicts a verdict the run has already recorded for that pair, with `GRAPH_GATE_VERDICT_DECLARATION_MISMATCH`. Projecting it keeps the mapping lossless; refusing it authority keeps the single-authority rule from ADR-0003 intact.

**The acceptance language and the fixture now say the same thing.** Both are restated over the projection: the fixture loads every committed record, projects it, asserts `ok`, asserts that the projected proposal round-trips back to the document's projected fields byte-for-byte under canonical JSON, and asserts that `validateGraph` returns `ok` for the whole projected set. "No field renaming" is gone, because renaming is precisely what the projection does and denying it was the finding.

## Alternatives considered

**Rename every contract field to the record's snake_case vocabulary.** It makes the original claim true with no new interface, and it is the option A-202 names first. Rejected. It renames roughly forty fields across two contract roots at Wave-3 boundaries, and it makes the TypeScript contracts read against the language's own conventions for the sake of a document format that is not otherwise part of the runtime. Worse, it would only make *some* of the claim true: `TaskRecord` would still require `createdSeq`, `attempt`, `lease`, and eleven other runtime-only fields that no committed record can carry, so a projection would still be needed and would then be invisible because the field names happened to agree. Making the names match hides the transformation instead of specifying it.

**Keep the claim and scope it to the field names alone.** "The vocabulary matches name for name" could be read as a statement about the *set of concepts*, not about literal identifiers. Rejected: A-202 read the claim the way a reviewer must, and the fixture obligation had already turned the loose reading into an executable assertion — "no field renaming" — that would fail. A claim that needs a charitable reading to be true is a claim that will be tested against the uncharitable one.

**Own the projection in `state/contracts` and implement it in TASK-003.** The types live there already, so the implementation could too. Rejected: it gives the durable state store a YAML dialect and a document schema to maintain alongside two storage formats, and TASK-003 is the earliest module every other one depends on. Putting a document format in the substrate would make the substrate's release depend on the repository's task-record conventions.

**Give the projection its own module and its own owner task.** It is a real, testable concern with a clean boundary. Rejected: it would make nine modules where the map declares eight, it would need a new write scope and a new owner task, and the concern splits naturally across two existing owners at exactly the seam this architecture already uses everywhere — pure transformation in the policy module, I/O at the lifecycle edge.

**Drop the per-relation `verdict` during projection and document the loss.** The runtime computes gate status from events, so the declared value is redundant. Rejected: a documented loss is still a loss, and a mapping that silently discards a field cannot support the round-trip assertion that makes the fixture meaningful. Projecting it and denying it authority costs one field and one admission guard, and it turns a possible disagreement between the record and the run into a rejected proposal rather than into a divergence nobody notices.

## Consequences

Positive:

- The transformation between the committed graph and the runtime types exists, has a name, has one owner per half, and has a fixture that fails when it drifts.
- `TaskProposal` is the projection target, which restates the true invariant: records are proposals, and only `applyEvent` makes them run state.
- The retained class makes the review-target and scope-validation metadata explicitly inert, so no reviewer has to reason about whether a `review_target_base` could reach a scheduling decision.
- The round-trip assertion is a stronger acceptance test than the withdrawn claim was, because it fails on a dropped field as well as on a renamed one.

Negative:

- Two contracts and one field are added to `state/contracts`, and TASK-005 gains a pure function with a large table to test. The table is the specification, so it has to be kept in step with the repository's record conventions by hand; there is no compiler check that the source schema still matches what `tasks/**` contains, only the fixture.
- `GatePairProperties` now carries a value the runtime does not trust, which is a shape reviewers should be alert to. The admission guard is what keeps it from becoming a second source of truth, and it is the only thing that does.
- The document source is at the lifecycle edge, so a projection failure surfaces as a startup or fixture failure rather than as a scheduling one. That is the right place for it, but it means the failure is reported far from the record that caused it, and the diagnostic must therefore name the document path and the field.
