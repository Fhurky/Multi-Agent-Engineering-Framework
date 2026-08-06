# ADR-0032: Lossless task-record source and exact projection

- Status: Authoring baseline; TASK-033 recorded `changes-required`; superseded in part by [ADR-0036](0036-target-tree-derived-architecture-fixtures-and-lineage-integration.md)
- Date: 2026-08-06
- Deciders: Solution Architect under TASK-032
- Affects: TASK-007 owns exact task-record loading; TASK-005 owns the pure projection, inverse audit, and committed-repository fixture; TASK-003 declares the source and projection contracts; TASK-006 admits only successfully projected proposals
- Supersedes in part: [ADR-0024](0024-task-record-projection-contract.md) — its closed nested source shapes, its claim that retention is lossless without an exact inverse, and its representative fixture language. ADR-0024's projection target, split ownership, inert-retention rule, derived-field checks, and graph-validation responsibility remain in force.

## Context

Round-4 finding **A-202** records that ADR-0024's intended projection is not lossless for the immutable implementation-review target. The committed TASK-013 activation omits `subscribed_event_types` and carries thirteen further nested activation keys that the source type did not admit. The committed graph also contains 92 gate relation documents, 24 of which carry all of `verdict_recorded_at`, `remediated_by`, and `revalidated_by`; the closed relation type did not admit those fields. A loader following the declared source type would reject those records, and a projection following the declared mapping could drop them.

A bag named `retained` is not by itself a lossless contract. The architecture needs to say which exact source value is accepted, how every leaf is classified, how defaults are distinguished from source values, how nested location is preserved, and how the original semantic document is reconstructed. The committed repository must exercise that contract rather than a hand-written representative record.

## Decision

**The source is the exact committed document, not a closed approximation of its front matter.** `TaskRecordDocumentSource`, implemented by TASK-007, returns the exact UTF-8 `rawText`, the exact body text, and a recursively typed YAML mapping whose keys are never renamed. It reports only malformed encoding, missing or invalid front matter, or a non-mapping front matter value. An unknown but valid nested key is data, never `UnknownProjectedShape`.

**TASK-005 owns one pure exact projection and its semantic inverse.** Every successfully parsed source leaf receives exactly one disposition:

- `projected`: mapped by the normative table to a runtime proposal field;
- `derived_checked`: compared with a runtime derivation while its source value is retained for inversion; or
- `retained_inert`: preserved at the same RFC 6901 source path and denied scheduling authority.

The audit contains one duplicate-free disposition row per source leaf, the retained subtree at its original nested paths, original derived values, and every source path omitted when a declared target default was supplied. `unproject(project(source))` must equal `source.frontMatter` under canonical JSON. `rawText` separately preserves comments, formatting, delimiters, and body bytes; the semantic inverse does not pretend to regenerate YAML presentation.

**Omission defaults are explicit and reversible.** An absent `/activation/subscribed_event_types` projects to the complete `INGRESS_CLASS_PRECEDENCE` tuple and records the omitted source path. The inverse removes that path again. A present value is mapped in source order and must be non-empty. No other omission silently creates source data.

**The immutable target is the fixture.** TASK-007 and TASK-005 enumerate every committed Markdown task record at the review target, respectively loading it and projecting it. The fixture requires loader success, projection success, exact inverse equality, an exhaustive leaf partition, derived-field equality, and one valid complete graph. It also asserts:

1. TASK-013's absent `subscribed_event_types` receives and reverses the explicit all-event default.
2. All thirteen named additional TASK-013 activation keys survive at their original `/activation/*` paths.
3. All 92 gate relations load; exactly 24 enriched relations carry `verdict_recorded_at`, `remediated_by`, and `revalidated_by`, and every value survives at its original relation index.
4. A future unknown nested key loads and round-trips inertly rather than becoming a shape error.

The immutable implementation-review target remains `fe0374c45aaa51e589525cee978c8ff244837163`. The TASK-032 branch point is separately recorded as `7ff618b3268e9b9057da53a75874f0f7c5cdf6a4`; integration ancestry cannot redefine the fixture target.

## Alternatives considered

**Continually widen closed TypeScript source interfaces.** Rejected. It would repair the current 13 and 3 fields but repeat the defect whenever inert record metadata grows. A document source must accept valid YAML before a runtime projection judges the fields it uses.

**Keep raw text only and parse projected fields ad hoc.** Rejected. Raw text protects bytes but supplies no exhaustive semantic-leaf audit, no exact inverse over the parsed mapping, and no enforceable ownership boundary for defaults and renames.

**Drop enriched relation provenance because it has no runtime authority.** Rejected. Inertness and losslessness are separate properties. Preserving the fields at their exact paths prevents them from becoming verdict authority without erasing committed provenance.

**Move loading or projection into the state store.** Rejected. YAML and repository I/O would enter the state root, and the eight-module dependency graph would gain responsibility in the wrong layer. The lifecycle edge owns I/O; scheduling owns graph projection.

## Consequences

Positive:

- Every committed task record is valid source data even when it carries inert future metadata.
- Defaults, renames, derivations, and retention are auditable and exactly reversible.
- The TASK-013 and enriched-relation cases are first-class fixtures rather than examples hidden by a broad claim.
- The eight-module map, two independent contract roots, dependency graph, and single verdict authority are unchanged.

Negative:

- TASK-005 must maintain a leaf-partition and inverse implementation in addition to proposal construction.
- TASK-007 must retain exact source text as well as parsed YAML.
- Adding a projected field requires updating both directions and the immutable-target fixture; silently ignoring a leaf is no longer conforming.
