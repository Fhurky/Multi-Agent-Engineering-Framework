# ADR-0021: The durable ingress module and the eight-module map

- Status: Accepted; superseded in part by [ADR-0029](0029-ingress-delivery-ownership.md), which names the scheduling-owned delivery interface that this record's responsibility split left implicit. Every other decision below stands.
- Date: 2026-08-05
- Deciders: Solution Architect under TASK-024
- Affects: TASK-026 owns the new module; TASK-005 consumes it through one interface; TASK-003 declares that interface; the integration order and wave assignment change for TASK-005 through TASK-008
- Supersedes in part: [ADR-0002](0002-runtime-component-boundaries-and-module-ownership.md) and [ADR-0011](0011-agent-workspace-lifecycle-module.md) — their module counts, six and seven respectively, and ADR-0011's "the module map now has no unassigned runtime responsibility" claim, which was true of the responsibilities known at the time. Both records' other decisions stand: the contract-root split, the injection rule, the acyclicity requirement, the `src/shared/` exclusion, and every workspace-module decision.

## Context

Finding **A-101** in `reports/code-review/TASK-016-ARCHITECTURE-AMENDMENT-REVIEW.md` and finding **F-301** in `reports/code-review/TASK-001-DECOMPOSITION-REVIEW-ROUND-4.md` together established that the durable ingress inbox the activation model requires has no owning module.

[ADR-0017](0017-durable-ingress-inbox-and-ingress-epochs.md) decides *what* the inbox is: an append-only store with identity-keyed deduplication, positions assigned once, reference-independent retention, class precedence, self-exclusion, and epochs. That decision needs an owner, a source path, and a place in the module partial order, and those are separable questions with their own trade-offs — which is why they are a separate record rather than a paragraph in ADR-0017.

The committed graph at revision 5 already assigns TASK-026 the paths `src/orchestrator/ingress/**` and `tests/unit/orchestrator/ingress/**`, places it at Wave 4 alongside TASK-017, and moves TASK-005 through TASK-008 one wave later. This record decides the architecture that assignment presupposes, so the graph and the module map agree rather than one being derived from the other after the fact.

## Decision

**An eighth module, `src/orchestrator/ingress/`, owned solely by TASK-026.** It owns the append-only ingress store, one-time `seq` assignment, `factId` and `contentHash` computation, identity-keyed deduplication, crash-safe append, ref-independent retention, the ingress adapters, class precedence, self-exclusion, batch order by source commit identifier, and ingress epochs.

**Its interface is `IngressInbox`, declared in `state/contracts`.** It imports one contract root and no module, exactly as `workspace` does. It is reached only through the interface, by constructor injection.

**The observer stays with the scheduler.** TASK-005 owns the ingress observer, the dispatch predicate, and the starvation bound; TASK-026 owns what an entry *is* and where it lives. The boundary is `highWaterMark()`. This is not shared ownership of the inbox: no part of the store's format, append protocol, or epoch history is TASK-005's, and no part of admission policy is TASK-026's.

**It sits at level 1 of the module partial order,** alongside `state`, `agents`, and `workspace`: above the contract roots, below `scheduling`. The graph stays acyclic and the two contract roots stay independent of each other, because the new module adds exactly one edge, `ingress → state/contracts`.

**The wave assignment follows.** TASK-026 integrates at Wave 4 with TASK-017 — disjoint scopes, neither importing the other, both at level 1 — and TASK-005 moves to Wave 5, TASK-006 to Wave 6, TASK-007 and TASK-008 to Wave 7. Contract immutability therefore covers Waves 3 through 7.

**The module map contains exactly eight modules, eight distinct owner tasks, and eight distinct source paths.** No module appears twice and no runtime responsibility is unassigned.

## Alternatives considered

**Give the inbox to TASK-003, inside `src/orchestrator/state/`.** The state store already owns durability, atomic appends, checksums, restore, and a crash-point matrix; the inbox needs all of the same primitives. Rejected on three grounds. First, the two stores have genuinely different models: the journal is a single-writer fold whose position is `stateVersion` and whose atomicity unit is a batch with a commit record; the inbox is an identity-keyed set whose position is `seq` and whose deduplication key is a content hash over an artifact the runtime did not write. One module owning both would own two append protocols, two crash-recovery stories, and two restore contracts, and a reviewer checking "is the append crash-atomic" would have to ask which one. Second, the inbox must be appendable by adapters that hold no writer lock, so putting it behind the writer lock would either serialize ingress behind run state or introduce a second writer to a store whose whole durability argument rests on there being one. Third, it would put the epoch history — a governance artifact about model corrections — inside the module that owns run state, where it has no relation to anything else.

**Give it to TASK-005, inside `src/orchestrator/scheduling/`.** The scheduler is the only consumer, so co-locating them removes an interface. Rejected: it makes the store's crash-safety a property of the module that merely reads it, and it gives one task both a persistence format and an admission policy — the two concerns most likely to be revised independently. It also breaks the parallelism the wave plan depends on: TASK-005 already waits on TASK-003, TASK-004, and now the inbox, so folding the inbox in would serialize work that can be done alongside TASK-017.

**Give it to TASK-017, inside `src/orchestrator/workspace/`.** Both deal with Git artifacts, and the workspace module already invokes Git. Rejected: the direction of authority is opposite. The workspace module *writes* the repository under the runtime's own authority — branches, commits, pushes — while the ingress adapters only *read* what other owners already published. Merging them would give one module both the right to publish and the right to decide what counts as a published fact, which is precisely the separation an independent ingress model exists to preserve.

**Make it a library rather than a module — a shared package under `src/shared/`.** It has no policy, so it reads like infrastructure. Rejected: `src/shared/` is outside every runtime task's write scope, so a module placed there would have no owner. That exclusion is ADR-0002's and it is unchanged; this record does not reopen it.

**Split it further: one module for the store, one for the adapters.** The store is pure persistence and the adapters read Git, so they have different dependencies and different test shapes. Rejected: class precedence and self-exclusion sit exactly on the seam between them — precedence is resolved by the store over the classes an adapter matched, and self-exclusion is enforced by both. Splitting would put one rule in two modules, which is the ownership defect this whole map exists to avoid. Nine modules would also mean nine owner tasks for a runtime that has eight coherent responsibilities.

**Keep seven modules and let the bootstrap-phase substitution stand permanently — the activation log *is* the inbox.** No new module at all, and it is what the bootstrap phase actually does today. Rejected: the substitution replaces *discovery*, not identity, position, or the cursor, and it depends on a human operator noticing a publication. That is acceptable while the runtime is being built and is not a design. Making it permanent would leave the runtime unable to activate its own control plane, which is the objective the whole activation model serves.

## Consequences

Positive:

- The ingress gap F-301 opened is closed with one owner, one source path, and one interface, and the module map has no unassigned runtime responsibility.
- The scheduler consumes the inbox exactly as it consumes every other durable boundary — an injected interface, no format knowledge — so TASK-005 can be unit tested with a fake inbox before TASK-026 exists.
- TASK-017 and TASK-026 are a genuine Wave 4 pair: disjoint scopes, both at level 1, neither importing the other, so they parallelize without coordination.
- The module partial order still exhibits acyclicity by a level assignment, and both contract roots remain independent, so nothing about the parallel-transcription argument changes.
- The store's crash-safety is testable in isolation, against a temporary directory, with no run record and no scheduler.

Negative:

- The runtime has two durable stores instead of one, so the durability argument must be made twice and a reviewer must check two append protocols. That is the cost this record trades against the coupling that folding them would create, and the trade is argued above rather than assumed.
- The wave plan lengthens by one wave, so TASK-007 and TASK-008 integrate at Wave 7 rather than Wave 6. The added wave is parallel with existing work at Wave 4, so the critical path grows by less than a full wave.
- Eight modules is more surface for a reviewer of the whole runtime, and TASK-009's cross-module review now spans eight rather than seven. The gates are already `aggregate` for exactly this reason, so the scheduling shape does not change.
- The consumption ledger lives in the run record while the inbox lives in its own store, so the durable provenance of a consumed fact is split across two files. That is deliberate — consumption is run state and the fact is not — but it means a reviewer reconstructing "what did this activation consume" reads both.
