# ADR-0018: Publication classes, gate lineages, and the withdrawal of the owner form

- Status: Accepted; extended by [ADR-0041](0041-cumulative-architecture-lineage-integration-unit.md) with post-verdict lineage-subsumption integration evidence
- Date: 2026-08-05
- Deciders: Solution Architect under TASK-024
- Affects: TASK-005 implements and enforces the eight invariants; TASK-003 declares the types; TASK-006 admits and applies; TASK-017 reads the publication class at finalize
- Supersedes in part: [ADR-0015](0015-typed-scheduling-gate-and-activation-contracts.md) — its `allowLocalOnlyPublication` run limit, its single undisambiguated `gate_passed` edge, its singular `gateFor`, and its five-invariant validator. ADR-0015's typed-edge model, its `pre_merge_gates` declaration, its durable-verdict rule, its named resource locks, and its `quiescent` state stand unchanged.

## Context

Finding **A-101** in `reports/code-review/TASK-016-ARCHITECTURE-AMENDMENT-REVIEW.md`, rated high, recorded that the TASK-016 contracts cannot represent the committed task graph. Five specific gaps, each of which a current task record already exercises:

- The `gate_passed` edge carries no `round`, so an edge cannot say which round it requires.
- `gateFor` is singular, while TASK-020 already carried two relations and TASK-025 carries three.
- No `gate_class`, `retrospective`, `gate_lineage`, or `lineage_round` field exists on either side of a gate pair.
- `allowLocalOnlyPublication` is a run-global flag standing in for a declared per-task publication class.
- The validator states five no-deadlock invariants where the committed graph states eight.

Finding **F-302** in `reports/code-review/TASK-001-DECOMPOSITION-REVIEW-ROUND-4.md` established the underlying defect, and it is a deadlock rather than an expressiveness gap. `{ task: TASK-011, edge: gate_passed, gate: qa, round: 1 }` asks whether **TASK-011** recorded a passing verdict. The graph simultaneously requires that a `changes-required` verdict be superseded by a **new** gate task and that a recorded verdict be durable and never rewritten. So if TASK-011 records `changes-required`, remediation lands, and a successor QA task passes at round 2, TASK-011's own verdict stays `changes-required` forever, and every consumer of that edge deadlocks permanently. This is not a scheduling inconvenience; it is a graph that cannot complete.

The publication half has a parallel shape. A run-global flag that weakens `review_ready` weakens it for **every** task in the run, so accepting a bootstrap-phase limitation for one human-launched session would silently accept it for a runtime-dispatched task whose gate a reviewer must be able to read.

## Decision

**`gate_passed` has exactly two forms, and the owner form is withdrawn.**

| Form | Written as | Satisfied when |
|---|---|---|
| Target | `{ edge, task: X, gate: g, round: n }` where X declares `g` in `requiredGates` | `review_ready(X)` and the relation `(X, g)` is closed at a round `>= n` |
| Lineage | `{ edge, lineage: L, gate: g, lineageRound: n }` where L is registered | L's authoritative verdict is passing or formally accepted, at a lineage round `>= n` |

An edge naming a task that declares the gate only in a `gateFor` entry is the owner form. It is **rejected at load** with `GRAPH_GATE_PASSED_OWNER_FORM`, whose message names the lineage that carries the relation and the round the edge should name instead. Withdrawal rather than deprecation is the point: a deprecated form still compiles and still deadlocks.

**A gate lineage is the durable relation that survives supersession.** It has a stable identifier, one gate name, a cohort that may grow but never shrink, and an ordered succession of lineage rounds, each recorded by exactly one gate task. Its **authoritative verdict** is the verdict at its highest recorded round; every earlier round stays durably recorded and is superseded, never rewritten. The lineage adds a name for "which round is currently authoritative" and removes nothing from history.

**A pair's `round` and its `lineageRound` answer different questions.** `round` is how many times *this artifact's* gate has been recorded; `lineageRound` is how many times *this relation* has been validated. They diverge whenever a cohort grows — an artifact joining at lineage round 2 carries `round: 1` and `lineageRound: 2` — which is why a pair carries both.

**`gateFor` is plural, and one review produces one verdict applied atomically.** A gate task carries one or more relations. `GateVerdictRecorded` names the gate task once and carries a `relations` array; applying it appends one `GateVerdictRecord` per relation and sets the verdict of each named lineage round. All relations close together or all stay open together, and a split outcome is not representable, because no event records a verdict for a subset.

**Every pair declares four scheduling and lineage properties on both sides** — `gateClass`, `retrospective`, `gateLineage`, `lineageRound` — and they must agree. `retrospective` equals `gate ∉ target.preMergeGates`. `gateClass` is computed against the publication of the artifact **that round reviews**, which at round *n* > 1 is the remediation named by round *n* − 1, not the original target. These values are normative in the pair's declaration and in the registers, and in no record body or document prose; the duplication finding F-303 recorded is removed rather than merely corrected.

**Publication class replaces the run-global flag.** `publicationClass` is a declared field on every task record and proposal, with two disjoint conditions: a `runtime` task's `review_ready` requires `publication: 'published'` and an unreachable remote is a `blocked` outcome; a `bootstrap` task may record `publication: 'local-only'` with a reason, which satisfies `review_ready` **for that task only**. An omitted class is rejected at admission; it is never inferred from the role, the owner, or the dependencies.

**The validator states eight invariants, not five.** Invariant 6 is form resolution with the owner form withdrawn; invariant 7 is gate-pair scheduling-property agreement against a recomputed class; invariant 8 is lineage well-formedness — constant gate name, one task per round, rounds `1 … k` with no gap, targets inside the cohort, and no round *n* > 1 before round *n* − 1 recorded a verdict. Each has its own diagnostic code, so a rejection is actionable.

## Alternatives considered

**Retarget the consumer's edge whenever a new round is created.** The reviewer offered this explicitly, and it is the smallest change: when TASK-013 creates a successor gate task, it edits every edge naming the superseded one. Rejected: it makes a scheduling edge mutable, so correctness depends on an activation performing an edit; it gives the graph no load-time check that the retarget happened, so an omission surfaces as a permanent stall rather than a diagnostic; and it means the graph a reviewer read is not the graph that will execute. Revision 4 performed exactly this retarget by hand when TASK-016 superseded TASK-002, and would have had to perform it again for TASK-024 — the second occurrence is what made it a pattern rather than an incident.

**Make a gate task's verdict mutable, so a successor round rewrites it.** No new concept at all. Rejected outright: it destroys the property independent review exists for. TASK-014's, TASK-015's, TASK-020's, and TASK-022's verdicts are permanent facts about the artifacts they reviewed, and a model in which a later round can erase one gives a reviewer nothing durable to point at. It also invites a recovery path that silently overwrites a verdict, which no reviewer could then detect.

**Keep the owner form and forbid consumers from using it, by convention.** Zero contract change. Rejected: a convention that produces a permanent deadlock when broken is not a convention, it is a trap. The withdrawal is load-time precisely so the failure mode is a message rather than a hang, and the message names the correct edge so the fix is mechanical.

**Model the lineage as a task alias — a symbolic name resolving to "the newest gate task".** Attractive because consumers keep the target form. Rejected: "newest" is a property of the graph at evaluation time, so the edge's meaning changes as the graph grows, and the acyclicity proof would have to be redone on every admission over a relation whose expansion is not stable. The lineage form expands to a *set* of gate tasks — every round at or above the floor — which is stable under cohort growth and is what invariant 1 can be stated over.

**Let a lineage's cohort shrink when an artifact is superseded.** It would keep the cohort small and make "what does this lineage cover" simpler to read. Rejected: an earlier round's coverage claim is a statement about what that round reviewed, and removing a member would make a durable record retroactively false. Growth-only costs nothing but a longer list.

**Keep `allowLocalOnlyPublication` alongside the classes, as an override.** It would preserve an escape hatch for an operator in an unusual environment. Rejected: the escape hatch is the defect. A run-global override is exactly what lets a bootstrap limitation leak into a runtime task's readiness edge, and the whole point of the classes is that the acceptance is scoped to the task that recorded it. An operator who needs the exception for a runtime task needs a different task record, not a different flag.

**Allow a gate task to record a per-relation verdict, so one review can pass one target and fail another.** More expressive, and it would model a reviewer who genuinely reached different conclusions. Rejected: one review is one judgment about one body of work. A reviewer who reaches two conclusions is performing two reviews and should carry two gate tasks. Permitting a split outcome would make "the gate is closed" a question about which relation you asked, and would give the remediation router no single verdict to route.

## Consequences

Positive:

- The committed graph at revision 5 compiles against the contracts name for name, which was A-101's stated acceptance condition.
- The F-302 deadlock is unrepresentable: no consumer edge names a gate task, so no consumer can be permanently blocked by a durable `changes-required`.
- No consumer edge has ever needed retargeting when a round was superseded, and none will — including for a fourth round of `LIN-ARCH-REVIEW`, if one is required.
- A gate task carrying several relations records one verdict once, so the atomic-application rule is a property of the event union rather than of a procedure someone must follow.
- A bootstrap-phase publication limitation is scoped to the task that recorded it, and a `runtime` task's `review_ready` cannot be weakened by anything an operator sets.
- Eight diagnostics replace a stall with a message that names the lineage, the round, or the disagreeing field.

Negative:

- Every gate pair now carries seven fields that must agree across both sides, so a hand-authored task record has more to get wrong. The compensation is that invariant 3 checks all seven at load rather than at run time, and names the disagreeing field.
- `RunRecord` gains a lineage register that is not derivable from the pairs, so the register and the pairs can disagree — which is why invariant 8 exists and why `GateLineageRoundOpened` is a separate event rather than an inference.
- The lineage form's expansion is a set rather than a single task, so `G*` has more edges and the acyclicity check is more expensive. Scheduling runs between agent invocations measured in minutes; this is not a throughput concern.
- Two rounds of the same relation on different artifacts carry different `round` values under one `lineageRound`, which reads as an inconsistency until the distinction is understood. It is stated once in [STATE-MACHINE.md](../architecture/runtime/STATE-MACHINE.md#gate-lineages) and not restated, so a reader meets it exactly once.
- Withdrawing the owner form is a breaking change to any edge already written in it. No such edge exists in the committed graph at revision 5, and the load-time message names the replacement, so the migration cost is bounded and visible.
