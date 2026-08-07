# ADR-0029: One owner delivers consumed inbox entries to the activation

- Status: Accepted; extended by proposed [ADR-0042](0042-conditionally-authorized-post-gate-merge-executors.md), as corrected by [ADR-0043](0043-exact-merge-admission-policy-attestation-and-published-head-evidence.md), with a TASK-026-owned exact gate/policy-verified merge-result adapter while TASK-005 remains the sole delivery owner
- Date: 2026-08-05
- Deciders: Solution Architect under TASK-028
- Affects: TASK-005 owns the reader and the delivery; TASK-026 owns the store and, under [ADR-0031](0031-pre-dispatch-ingress-observer-and-collector.md), the appending collector; TASK-003 declares the delivery contract; TASK-006 carries the delivery into the invocation and builds the ledger rows from it
- Supersedes in part: [ADR-0021](0021-durable-ingress-module-and-the-eight-module-map.md) — one clause: its responsibility split as stated, "TASK-026 owns what an entry *is* and where it lives, TASK-005 owns what the runtime *does* when the mark advances", which assigned the read to TASK-005 and then named no interface by which the entries reach the task that consumes them. The split stands; the missing half is decided here. ADR-0021's other decisions stand unchanged: the eighth module, its source path, its sole owner, the reasons it is separate from `state`, `scheduling`, and `workspace`, and the level-1 position that keeps the graph acyclic.

## Context

Finding **A-207** in `reports/code-review/TASK-024-ARCHITECTURE-AMENDMENT-REVIEW-ROUND-2.md`, rated High, recorded that no owned interface delivers immutable inbox entries to the consuming activation.

The three-surface table at `docs/architecture/runtime/INTERFACE-CONTRACTS.md:500-504` assigns inbox reads to the ingress observer in `src/orchestrator/scheduling/`. What the observer can pass on is an integer: `Scheduler.activatableTasks` takes `ingressSeq`, `DispatchCandidate` carries `observedIngressSeq`, `TaskActivated` carries `observedIngressSeq`, and `AgentInvocation` carries no entries and no inbox capability at all. Sequence 8 at `diagrams/architecture/runtime-sequences.md:358-361` papered over the gap by drawing the activation calling `Inbox.read` directly, which contradicts the ownership table it is supposed to illustrate.

The consequence is concrete rather than stylistic. `IngressRangeConsumed.rows` requires one `IngressConsumptionRow` per entry of the consumed range, each carrying `factId`, `contentHash`, `eventType`, `producerTask`, `producerRole`, `sourceCommit`, and `sourcePath` — every one of them a field of the entry and none of them derivable from a high-water integer. The event is therefore unconstructible by anyone who has not read the entries, and no declared interface gives them to anyone who is allowed to. The "no runtime responsibility unassigned" criterion fails on a responsibility the model cannot work without.

This finding and the approved `HUMAN-002` collector are the same seam approached from two directions — one component appends, another delivers — and they are decided together, here and in [ADR-0031](0031-pre-dispatch-ingress-observer-and-collector.md).

## Decision

**The seam has exactly two halves, and each has exactly one owning module and one implementing task.**

| Half | Module | Owner task | Interface |
|---|---|---|---|
| **Append.** Validate, deduplicate, and durably append an entry before scheduler selection | `src/orchestrator/ingress/` | **TASK-026** | `PreDispatchIngressCollector` and `IngressInbox.append`, decided in [ADR-0031](0031-pre-dispatch-ingress-observer-and-collector.md) |
| **Deliver.** Observe the mark, read the consumed range, and hand the entries to the activation | `src/orchestrator/scheduling/` | **TASK-005** | `IngressObserver`, decided here |

**`IngressObserver` is the typed delivery interface, and it is the observer's I/O half.** `Scheduler` stays pure: `activatableTasks(run, ingressSeq)` is unchanged. `IngressObserver` holds the two operations that read the inbox, and it is the only consumer of `IngressInbox` in the runtime:

```text
observe():                       Promise<IngressObservation>   // highWaterMark + the IngressHighWaterMarkObserved envelope
deliver(run, taskId, throughSeq): Promise<IngressDeliveryResult> // read((cursor, throughSeq]) and return it
```

`deliver` reads exactly `(activation.lastConsumedEventSeq, throughSeq]`, ascending by `seq`, and returns an `IngressDelivery` carrying the activation identity, both bounds, and the entries verbatim. It appends nothing, mutates nothing, and refuses a range whose bounds do not match the record's cursor.

**The delivery reaches the consuming activation through the invocation, and reaches the ledger through the supervisor.** The supervisor calls `deliver` after `TaskActivated` is durable and before `DispatchStarted`, and then uses the one result twice:

- `WorkAssignment.ingressDelivery` carries it into `AgentInvocation.ingress`, so the agent that performs the activation receives the immutable entries it must act on. This is the field A-207 records as absent.
- The supervisor constructs `IngressRangeConsumed.rows` from `delivery.entries` when it assembles the consumption batch. The rows are a projection of the entries plus `consumedBy` and `consumedAt`, so they are derived from what was delivered rather than re-read, and the event's existing guard — the rows cover exactly `(fromSeq, throughSeq]` with strictly increasing `seq` — checks the derivation.

**The activation never calls the inbox.** Sequence 8 is corrected: the `Act ->> Inbox: read` arrow is replaced by the observer's `deliver` and the supervisor's hand-off. The consuming task holds no inbox capability, which is the same shape as every other resource in this runtime — the module that owns durability is reached through one interface by one consumer.

**Ownership of the two halves is stated in every place the surfaces are enumerated,** so the component table, sequence 8, the scheduler API, `AgentInvocation`, and the consumption contracts all name the same owner for the same operation. The three-surface table gains a fourth row for the delivery, because a surface with no row is how the responsibility went unassigned.

## Alternatives considered

**Give the activation an `IngressInbox` reference, as sequence 8 drew.** No new interface, and the entries arrive where they are used. Rejected: it makes the consuming task a second reader of the store, so `src/orchestrator/ingress/` acquires a consumer that is not the one the module map declares, and the activation — an agent invocation running in a worktree — would hold a durable-store capability. Every other resource in this runtime reaches its consumer through the supervisor; ingress entries are not the exception.

**Move the read to TASK-026 and have the inbox push a delivery.** The store already has the entries. Rejected: it inverts the dependency. `ingress` sits at level 1 and is reached by `scheduling`; a push would make the inbox depend on the scheduler or the supervisor and would put dispatch policy — which range, for which task, at which moment — inside the module whose concern is durability. ADR-0021's reason for the split says exactly this, and it is still the reason.

**Carry the entries in `TaskActivated` and let `applyEvent` hold them.** The journal would then be the delivery mechanism, and recovery would replay it for free. Rejected: it puts the entry payloads in the run journal, which [ADR-0017](0017-durable-ingress-inbox-and-ingress-epochs.md) rejected for the inbox itself and for the same reasons — replay cost grows with observation volume, and the journal becomes a second copy of a store that already exists. `IngressHighWaterMarkObserved` is explicitly documented as carrying no entry payload; `TaskActivated` should not quietly carry one instead.

**Add a ninth module that owns delivery.** The concern is real and separable. Rejected: the module map declares eight, each with one owner task, and delivery is admission-adjacent work that the module already reading the inbox performs. A ninth module would need a write scope, an owner task, and a wave position for one interface with two methods.

**Let the supervisor read the inbox itself.** It already assembles the batch and the invocation. Rejected: it gives TASK-006 a second store to read and makes the supervisor the module that decides which range is current, which is the dispatch predicate — TASK-005's, by the same ADR-0021 argument that keeps the predicate out of TASK-026.

## Consequences

Positive:

- Every field of `IngressConsumptionRow` has a stated source, so `IngressRangeConsumed` is constructible by the module that constructs it, and the ledger is producible rather than only specifiable.
- The consuming activation receives the immutable entries as invocation input, so what the agent acts on and what the ledger records are the same read, not two.
- Exactly one module owns each half of the seam, and the two halves are named in the same table, so the question A-207 and `HUMAN-002` ask from opposite directions has one answer written once.
- The scheduler stays pure. The I/O the dispatch predicate needs lives in a named observer, which is the shape the architecture already uses for `StateStore` and `WorkspaceLifecycle`.

Negative:

- `AgentInvocation` gains a field that is non-null only for activation tasks, so every provider adapter sees a shape that is empty for ordinary work. The alternative — a second invocation type — would fork the adapter interface for one field.
- The delivery is not durable. A crash between `deliver` and the consumption batch loses it, and the next activation re-reads the identical range from the inbox. That is the designed behavior and it costs one re-read, but it means a reader must not mistake `IngressDelivery` for a record.
- `IngressObserver` is a second interface owned by TASK-005 alongside `Scheduler`, and the split between them is by purity rather than by subject. That is a boundary an implementer can blur, so the contract states which of the two each operation belongs to rather than leaving it to judgment.
