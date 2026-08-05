# ADR-0030: One canonical recovery decision input domain

- Status: Accepted
- Date: 2026-08-05
- Deciders: Solution Architect under TASK-028
- Affects: TASK-008 computes the input and the decision; TASK-006 owns the transition table the decision expands against; TASK-003 declares the input type
- Supersedes in part:
  - [ADR-0013](0013-single-decision-recovery-reconciliation.md) — one clause: its "total function of the four inputs" cardinality. The one-decision-per-task invariant, the priority order, the `current_epoch` defect rule, the determinism rule, and `attemptStartedAt` all stand exactly as written; only the count and the type of the domain change.
  - [ADR-0020](0020-durable-adoptable-results-for-recovery.md) — one clause: its introduction of `pendingResults` and an `activation` block as decision inputs without restating the cardinality they changed. Those two axes are now members of the declared domain rather than additions acknowledged beside a four-input statement. ADR-0020's other decisions stand unchanged.

## Context

Finding **A-208** in `reports/code-review/TASK-024-ARCHITECTURE-AMENDMENT-REVIEW-ROUND-2.md`, rated Medium, recorded that recovery is simultaneously normative over four inputs and tested over six.

Three normative statements say four:

- `docs/adr/0013-single-decision-recovery-reconciliation.md:23` — a total function of four inputs.
- `docs/architecture/runtime/CRASH-RECOVERY.md:71-83` — "The decision is a total function of four observable inputs".
- `docs/architecture/runtime/STATE-MACHINE.md:462-473` — the same four, enumerated.

The rows branch on six. Row R0 branches on whether the record carries an `activation` block; rows R1 and R1x branch on whether a matching `pendingResults` entry exists. `docs/architecture/runtime/STATE-MACHINE.md:530` — test obligation 1 — enumerates the cross product over six axes and names the last two as added under TASK-024. `docs/adr/0020-durable-adoptable-results-for-recovery.md` introduces both without saying that the domain it inherited is no longer the domain.

The cost is not cosmetic. Two independent implementations can each follow a normative statement and construct different decision-domain types: one with four fields that must smuggle the other two in as guards, one with six. The decision table is the same table for both, but "total over the domain" is a different claim about each, and the exhaustive test that proves totality enumerates a domain no normative statement declares. The amendment discipline is what fails here — a decision was changed by addition rather than superseded.

## Decision

**There is one canonical decision input type, `ReconciliationInput`, declared in `state/contracts`, with exactly six members.** Every normative statement about the recovery decision is stated over it, and no document restates the count in prose.

| # | Member | Type | Values |
|---|---|---|---|
| 1 | `fromState` | `TaskState` | 10 |
| 2 | `leaseState` | `'none' \| 'superseded' \| 'current_epoch'` | 3 |
| 3 | `ledgerState` | `'none' \| 'intended_idempotent' \| 'intended_non_idempotent' \| 'committed'` | 4 |
| 4 | `deadline` | `'elapsed' \| 'not_elapsed'` | 2 |
| 5 | `activationPresent` | `boolean` | 2 |
| 6 | `adoptableResultPresent` | `boolean` | 2 |

**The cardinality of the domain is 10 × 3 × 4 × 2 × 2 × 2 = 1920**, and it is stated once, here, and referenced from the documents rather than recomputed in them. The pure `ReconciliationDecider.decide(input: ReconciliationInput): ReconciliationDecision['decision']`, declared in `state/contracts` and implemented by TASK-008, is total over all 1920 points, and the decision table's twelve rows partition them exhaustively with no overlap. The coordinator combines that classification with the task identity, the matching adoptable result when required, and the legal emitted sequence; those are outputs and context, not additional decision axes.

**A mixed ledger is not a seventh value and not a seventh axis.** When a task's current attempt has several entries, the pre-existing "most severe unresolved" rule resolves them to exactly one member of axis 3 before the input is constructed: any `intended` non-idempotent entry yields `intended_non_idempotent`; otherwise any `intended` entry yields `intended_idempotent`; otherwise `committed`. The resolution is part of constructing the input, not part of the decision, so the domain stays at four values on that axis. Test obligation 1's fifth constructed value, `mixed`, is an input-**construction** case that asserts the resolution, and it is labelled as one.

**`adoptableResultPresent` means what R1 and R1x need it to mean and nothing broader**: `run.pendingResults[taskId]` exists **and** its `attempt` equals the task's current attempt. A stale entry from an earlier attempt is `false`, not `true`, because adopting it would produce a `WorkerSucceeded` for work that a later attempt superseded.

**The two documents and the ADR that said four now say six by naming the type**, and each states what it supersedes rather than being edited into agreement. `CRASH-RECOVERY.md` and `STATE-MACHINE.md` each carry an amendment-register row recording the superseded four-input wording; ADR-0013's and ADR-0020's `Status` lines carry a forward reference to this record; neither ADR's body is edited, per the discipline in [`docs/adr/README.md`](README.md).

## Alternatives considered

**Collapse the two added axes back into the four by deriving them.** `activationPresent` is a property of the task record and `adoptableResultPresent` is a property of the run, so both could be read inside the decision function instead of being passed to it. Rejected: it makes the function a function of the whole `RunRecord`, which is strictly larger and unenumerable, and it is exactly how the drift happened — a "four-input" function that reads two more things is a six-input function whose signature lies. The domain must be enumerable, because the totality proof is an enumeration.

**State the domain as four inputs plus two guards.** It preserves ADR-0013's wording and marks the additions as a different kind of thing. Rejected: a guard that changes which row applies is an input. R0 is selected by `activationPresent` alone and R1 versus R1x by `adoptableResultPresent` alone; calling them guards would mean two of the twelve rows are selected by something outside the decision domain, which makes "total over the domain" false as a description of the table.

**Fold `adoptableResultPresent` into `ledgerState` as a fifth value, `committed_adoptable`.** It keeps the axis count at five and puts the distinction where the table uses it. Rejected: the two are independent facts about different registers, and folding them makes `ledgerState` no longer a statement about the ledger. It would also hide the R1x case — a committed effect with no adoptable record — inside a value name rather than exposing it as a combination the enumeration must cover.

**Leave the wording and let the test be the specification.** The test already enumerates six. Rejected: it inverts the source of truth. The reviewer's point is that an implementer reading the normative documents builds a four-field type and then discovers the test needs six; the documents are what the implementation is written against.

## Consequences

Positive:

- One type, one cardinality, one statement of totality. An implementation that constructs a different decision-domain type is now wrong against a declaration rather than merely different.
- The exhaustive test and the normative statement enumerate the same 1920 points, so "total" is checkable against the document rather than against a second reading of it.
- The mixed-ledger resolution has an explicit home — input construction — so it is tested where it happens rather than as a decision-table row it never was.
- The attempt-scoping of `adoptableResultPresent` is stated, which closes a case the previous wording left open: a stale `pendingResults` entry from an earlier attempt is not adoptable.

Negative:

- 1920 is a large enumeration, and most of it is `none` — every combination whose `fromState` is not `leased` or `running` collapses to rows R10 and R11. The test is therefore mostly asserting that nothing happens, which is cheap to run and easy to under-read.
- The domain is fixed by a declaration, so a future decision that needs a seventh input must supersede this record rather than add an axis. That is the intended cost and it is the failure mode this record exists to prevent, but it makes any future recovery input a contract change with an ADR.
- Three documents and two ADRs now reference one cardinality that lives in a single place. If that place is wrong, it is wrong everywhere at once — which is the trade the finding asks for, since the alternative is five places that can disagree.
