# ADR-0017: Durable append-only ingress inbox with stable positions and ingress epochs

- Status: Accepted
- Date: 2026-08-05
- Deciders: Solution Architect under TASK-024
- Affects: TASK-026 implements the inbox and its adapters; TASK-005 implements the observer and the dispatch predicate; TASK-003 declares the contracts; TASK-006 applies the events
- Supersedes in part: [ADR-0015](0015-typed-scheduling-gate-and-activation-contracts.md) — its "Monotonic event-triggered activation" decision, specifically `run.activationEvents` as an internal queue, `seq` assigned by `applyEvent` from `run.nextActivationSeq`, and `TaskActivated` recording a `pendingThroughSeq` reservation. ADR-0015's `quiescent` state, its starvation bound with reserved capacity, its advance-at-success rule, and its typed-edge decisions stand.

## Context

Finding **A-101** in `reports/code-review/TASK-016-ARCHITECTURE-AMENDMENT-REVIEW.md`, rated high, recorded that the TASK-016 activation contract is the pre-ACT-002 model: `ActivationEventAppended` creates rows in `run.activationEvents` and the recurring task consumes them through `pendingThroughSeq`. It has no closed Git-observable ingress source set produced by other owners, no deterministic ingress position, and no separate consumption ledger written already consumed. Consumption state is spread across the cursor and `pendingThroughSeq` rather than represented only by the cursor. A current task record cannot compile against it, and implementing it would reproduce the F-201 wake-up and consumption defect.

Finding **F-301** in `reports/code-review/TASK-001-DECOMPOSITION-REVIEW-ROUND-4.md` established the deeper problem, against the decomposition's own observation rule rather than against the contracts. The rule enumerated every matching fact reachable from the integration branch and every live `agent/*` branch, sorted by committer timestamp and SHA, and took the position as the **count**. Five failures follow, and each is a real scenario rather than a hypothetical:

- Publishing a backdated commit inserts a fact *before* the cursor, so consuming `(cursor, count]` replays the old tail and skips the new fact.
- Deleting a live branch reduces the count below the cursor, which the model itself declares invalid.
- One commit can match several event classes with no stated rule, so its type is not reproducible.
- The consuming task's own effects commit matched a class as written, so every activation would expose a new fact and quiescence could never be demonstrated.
- Two merges expressing one logical step were folded into one row under an unstated selection policy, so the count was not reproducible even for the history that already existed.

A count over a scan of mutable refs is not a position. That is the whole finding, and no amount of care in the scan fixes it, because the defect is in what the number *is*.

## Decision

**The ingress inbox is a durable, append-only state store, owned by its own module.** It is not a Git ref scan, not a commit count, and not a file under `tasks/`. Its contract is section 2b of [INTERFACE-CONTRACTS.md](../architecture/runtime/INTERFACE-CONTRACTS.md); its module boundary and its owner are decided in [ADR-0021](0021-durable-ingress-module-and-the-eight-module-map.md).

**Identity and position are separate, and both are properties of the store.**

- **Identity** is `factId`, a SHA-256 over a canonical tuple of epoch, event type, producer task, source commit, source path, and content hash. It is a function of the fact and of nothing else: when a fact was discovered, who appended it, and what position it received are all deliberately absent from the tuple.
- **Position** is `seq`, assigned **once** at append and never recomputed. `sourceCommit` and `sourcePath` are provenance and never determine position.

**Deduplication is identity-keyed.** An entry is appended only if its `factId` is absent, so re-observing a fact is a no-op and appending is idempotent.

**Positions are append-stable.** A fact discovered late receives the next free `seq`. Nothing is ever inserted before an existing entry, so `ingressSeq = max(seq)` is non-decreasing for the life of the run. This is the property the count could not have, and it is what makes a backdated publication a *late* fact rather than a *skipped* one.

**Batch order is by ascending source commit identifier, never by a timestamp.** `IngressFactCandidate` carries no timestamp field, so the rule is unrepresentable to violate rather than merely stated.

**Retention is reference-independent.** An entry outlives the ref that carried its source commit. Deleting, rewriting, or garbage-collecting a branch cannot remove an entry and therefore cannot lower `ingressSeq`. `contentHash` lets a later reader detect that the source artifact was rewritten; that detection is a finding, never a silent renumbering.

**Class precedence yields at most one entry per source commit.** `INGRESS_CLASS_PRECEDENCE` is a normative ordered constant, applied by the inbox rather than separately by each adapter, so a commit matching several classes has one reproducible type. Distinct commits stay distinct facts even when they express one logical step.

**Self-exclusion is explicit and structural.** A commit authored by the consuming activation on its own branch is never an ingress fact under any class. The adapter does not offer it and `append` rejects it with `SelfExcludedProducer`. An activation's own effects commit therefore cannot raise `ingressSeq`, which makes quiescence after an activation demonstrable rather than assumed.

**Consumption state is the cursor and nothing else.** `pendingThroughSeq` is withdrawn. A task is dispatchable when `run.ingressSeq > activation.lastConsumedEventSeq`, quiescent when they are equal, and a record in which the cursor exceeds the mark is rejected at load. `TaskActivated` records an observation and reserves nothing.

**Consumption is one batch.** `IngressRangeConsumed` appends one ledger row per entry of `(lastConsumedEventSeq, ingressSeq]` and advances the cursor, and it is applied in the same batch as the activation's effects and its `WorkerSucceeded`. If the batch does not commit, the cursor is unchanged, no row exists, and the next activation consumes the identical range with identical effects.

**The consumption ledger is a record, not a queue.** A row is created already consumed and already stamped with its consuming activation, so no row is edited and `consumedBy` is never mutated.

**A model correction opens an epoch; it never renumbers history.** An epoch declares a `seqBase` equal to the previous epoch's high-water mark, so its first entry takes `seqBase + 1` and the cursor stays monotonic across the boundary. Entries of a previous epoch are never re-derived, renumbered, reclassified, or edited, and no method on `IngressInbox` and no member of `RuntimeEvent` expresses any of those.

## Alternatives considered

**Keep the scan and fix its sort — order by commit topology instead of by timestamp.** The smallest change, and it removes the clock dependency. Rejected: it fixes one of five failures. A topological order over reachable refs is still a function of which refs exist, so a deleted branch still lowers the position and a backdated commit still lands before the cursor. The defect is that the position is derived from mutable state, and no ordering rule over mutable state repairs it.

**Keep the count but make the cursor a `factId` rather than an integer.** Attractive: identity is stable, so "consumed through this fact" is well defined. Rejected: it makes "what is unconsumed" an unbounded set difference rather than a comparison, so the dispatch predicate becomes a scan of the whole history on every scheduling pass, and "the same range" after a crash requires re-deriving a set rather than reading two integers. It also gives no answer for a fact discovered *before* the cursor fact in whatever order the scan produced.

**Store the inbox inside the run journal as a new event type, keeping one store.** One durability model, one crash story, one writer lock. Rejected: it makes every ingress fact a run-state event, so the journal grows with facts that no transition consumes, replay cost rises with observation volume rather than with state changes, and — decisively — the inbox's positions would then be minted by `applyEvent` from a per-run counter, which is precisely the internal-queue model A-101 rejected. The inbox must be appendable by adapters that hold no writer lock.

**Let each adapter resolve its own class and have the inbox trust the answer.** Simpler adapters and no shared constant. Rejected: precedence is a property of the *set* of classes a commit matched, so an adapter that sees only its own class cannot apply it. Two adapters would each append an entry for one commit, and the rule "one commit, at most one entry" would hold only by convention. Resolving precedence in the inbox makes it testable in one place.

**Record a timestamp on the candidate for diagnostics, and document that it must not be used for ordering.** Costs nothing and helps debugging. Rejected: a field that exists will eventually be sorted on, and F-301's first failure is exactly that. `IngressEntry.appendedAt` exists for provenance because it is a property of the append rather than of the fact, but the *candidate* carries no timestamp, so an ordering rule over source time has nothing to read.

**Renumber epoch 1's entries under the epoch-2 rule so the whole history is reproducible.** Tempting, because epoch 1's high-water mark is admittedly not reproducible. Rejected outright: renumbering a consumed position would move facts across a cursor that is already durable, which is the one operation the whole model exists to prevent. The irreproducibility of a sealed epoch is recorded rather than repaired, and the epoch boundary exists so that the record can be honest about it.

**Let the recurring task write its own trigger.** It would need no adapters at all. Rejected: it is the F-201 defect in its original form. A task that produces its own wake-up either never quiesces or quiesces by a rule nobody can check, and it requires the consuming task to write outside its own scope. Self-exclusion is the explicit negation of this alternative, and it is normative rather than advisory.

## Consequences

Positive:

- The cursor never reads a ref, so branch deletion, force-push, rebase, and clock skew cannot change it. Three of F-301's five failures become unrepresentable rather than handled.
- A late-discovered fact is late, not lost: it keeps its identity, receives the next free position, and is consumed exactly once.
- Quiescence is demonstrable. Self-exclusion means an activation's own commit cannot raise the mark, so "the mark equals the cursor" is a fact about the world rather than a race.
- Consumption state has exactly one home, so no two fields can disagree about what was consumed — the property A-101 said was still missing.
- The ledger gives a reviewer durable provenance for every consumed fact, including the content hash of the artifact it was read from, which is what makes a later rewrite detectable.
- A model correction is survivable: the epoch boundary keeps the cursor monotonic without touching history.

Negative:

- The runtime gains a second durable store with its own append protocol, its own crash-safety tests, and its own on-disk format. That is one more thing to get right, and [ADR-0021](0021-durable-ingress-module-and-the-eight-module-map.md) argues why folding it into the existing one is worse.
- `RunRecord` grows by four collections — `ingressSeq`, `ingressEpochs`, `ingressConsumptionLedger`, and the lineage register from [ADR-0018](0018-publication-classes-and-gate-lineages.md) — and the consumption ledger grows without bound for a long-lived run. It is append-only by design, so it cannot be pruned without a decision that does not exist yet. For the run lengths this runtime targets, that is acceptable; a long-lived deployment would need an archival ADR.
- The dispatch predicate now depends on an I/O read that the scheduler cannot perform, so the observer is a separate step that appends `IngressHighWaterMarkObserved` before the pure selection runs. That is one more event type and one more ordering rule than a purely in-memory queue would need.
- Bootstrap-phase discovery is still performed by a human operator rather than by an adapter, so a published fact may be noticed late. The design's answer is that discovery is *not* the cursor: correctness does not depend on promptness, and the liveness gap is bounded, named, and routed to TASK-026 rather than being papered over.
