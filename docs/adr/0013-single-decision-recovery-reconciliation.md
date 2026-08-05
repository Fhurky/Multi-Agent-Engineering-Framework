# ADR-0013: Single-decision recovery reconciliation

- Status: Accepted; superseded in part by [ADR-0020](0020-durable-adoptable-results-for-recovery.md), which replaces the `adopt` row's reliance on a ledger entry retaining only `resultDigest`. The one-decision-per-task invariant, the four-input total function, the priority order, the `current_epoch` defect rule, the determinism rule, and `attemptStartedAt` stand as written.
- Date: 2026-08-05
- Deciders: Solution Architect under TASK-016
- Affects: TASK-008 primarily; TASK-006 owns the transition table it must satisfy; TASK-003 persists the batch
- Supersedes in part: [ADR-0009](0009-graceful-pause-drain-and-crash-recovery.md) — its seven-phase recovery procedure, specifically the phase 4, 5, and 6 split. ADR-0009's one-drain-two-intents model, its resume-always-through-recovery rule, its restore-failure-is-reported rule, and its equivalence claim all stand.

## Context

Finding A-002 in `reports/code-review/TASK-002-ARCHITECTURE-REVIEW.md`, rated high, established that the documented recovery procedure emits transitions the documented state machine rejects.

Phase 4 emitted `LeaseExpired` for every task holding a lease, which moves a task from `running` to `ready`. Phase 5 then emitted `WorkerSucceeded` for a committed effect or `TaskBlocked` for an indeterminate non-idempotent one. Both are legal only from `running`, and the task was already `ready` by an earlier event in the same batch. Phase 6 could emit `TaskTimedOut` for a task phase 4 had likewise already moved.

Because phases 4 through 6 were appended as one all-or-nothing batch, the batch would be rejected as a whole. Recovery would fail on ordinary crash cases — a task crashed mid-effect with a committed ledger entry is the most ordinary case there is — rather than completing.

The underlying error is structural, not a typo in a table. The procedure was organized around the **questions** recovery asks — what happened to leases, what happened to effects, what happened to deadlines — and emitted an event per question. The state machine is organized around **outcomes**, and each task has exactly one.

## Decision

**Recovery computes exactly one reconciliation decision per task, and each decision expands to one fixed event sequence whose legality from that task's restored pre-batch state is proven in a table.**

The decision is a total function of four observable inputs, all present in the restored record: the pre-batch task state, the lease state, the ledger state for the task's current attempt, and whether the attempt deadline has elapsed. The full table is normative in [STATE-MACHINE.md](../architecture/runtime/STATE-MACHINE.md#recovery-reconciliation-decisions).

**The invariant that makes every batch legal by construction:**

> No two decisions address the same task, and every decision is computed from the restored state, which no other decision in the batch modifies. Batch legality therefore reduces to per-decision legality, which the table establishes exhaustively.

Three structural consequences follow:

- **The separate lease-reclamation phase disappears.** A task whose decision is `adopt`, `escalate`, or a timeout keeps its lease record until its single event clears it, so the fencing check passes against the lease that is still there. Only the `reclaim` decision emits `LeaseExpired`.
- **The separate timeout scan disappears.** An elapsed deadline is the fourth input to the decision, not a second pass. `TimeoutWatchdog.scan` does not run during recovery; it resumes after `RunRecoveryCompleted`.
- **Priority is explicit:** committed outranks indeterminate-non-idempotent, which outranks an elapsed deadline, which outranks reclaim. A committed effect is recorded fact and timing it out would duplicate it; retrying an indeterminate non-idempotent effect is the one action the idempotency guarantee refuses to take.

**A supporting field is added.** `TaskRecord.attemptStartedAt` is set at `DispatchStarted` and cleared on leaving `running`. TASK-002 required both the watchdog and recovery to reason about when an attempt started, without a field that records it; `updatedAt` is overwritten by every lease renewal and every ledger event, so a long-running task's deadline would have receded indefinitely. Without this field the decision is not a function of the record, which breaks both determinism and A-002's requirement that every input combination map to exactly one transition.

**The `current_epoch` lease defect is decided rather than deferred.** ADR-0009 said such a lease is "treated as a defect and reported", which left the decision undefined and is incompatible with a total table. It is now reconciled by the same row a superseded lease would take — no live holder can exist after the epoch advanced — and a `RECOVERY_LEASE_EPOCH_DEFECT` run event names the task and both epochs. The run is not failed.

## Alternatives considered

**Define recovery-specific transitions with explicit guards and record effects.** The other mechanism the finding named as acceptable. It would keep the phase structure and add rows like `ready + WorkerSucceeded(recovering)` to the transition table. Rejected: it doubles the legality surface of the state machine's hottest path, and it does so specifically for the code path that runs when the system is already in its least-understood state. Two sets of rules for the same events is exactly what ADR-0003 rejected when it made one pure transition function the sole authority, and a reviewer would then have to check every event against two tables.

**Emit the phases as separate batches, one per phase.** Each batch would be internally legal, and phase 5 would see the state phase 4 produced. Rejected: it abandons all-or-nothing recovery. A crash between phase 4 and phase 5 would leave every in-flight task reclaimed to `ready` with its effects unreconciled, so the next attach would re-dispatch work whose effect was already committed. That is the duplication the ledger exists to prevent, reintroduced by the recovery path itself.

**Order the events so the later ones are legal — emit `WorkerSucceeded` first, then `LeaseExpired` for the rest.** Minimal change, and it works for the specific pair in the finding. Rejected: it is a coincidence rather than a property. It leaves the batch's legality dependent on emission order, so any future event added to recovery re-opens the question, and it gives no answer for a task that needs both a timeout and an adoption decision. The one-event-per-task rule makes order irrelevant, which is why the batch can be asserted order-independent in a test.

**Let recovery bypass the transition function and write reconciled state directly.** Fastest and simplest to write. Rejected outright: it makes recovery the second authority on legality, so a crashed run and a healthy run would be advanced by different rules, and the replay property that every other guarantee rests on would no longer hold for any run that ever crashed.

**Keep phase 6 as a real watchdog scan and accept that it may produce a second event.** Rejected: it is the same defect in a smaller shape, and folding the deadline into the decision costs nothing — the watchdog's rule is already a comparison against `attemptStartedAt`, which the decision needs anyway.

## Consequences

Positive:

- Recovery completes on ordinary crash cases, which the superseded design did not.
- Batch legality is a property of the construction, provable once over a finite table, instead of a property that must be re-checked whenever a recovery step changes.
- The batch is order-independent, so it can be asserted byte-identical under any permutation — a strong, cheap test.
- The ledger's role is unchanged and now clearly stated as one input among four, rather than as a phase whose output could conflict with another phase's.
- The `current_epoch` defect and the deadline case both have defined outcomes, so the table is total.

Negative:

- The decision function is a four-input table with eleven rows and an explicit priority order. It is more to hold in the head at once than three sequential phases, and it must be tested as a cross product rather than phase by phase. The cross product is finite and enumerable, which is why the test obligation is stated as one.
- `attemptStartedAt` is a new field on every task record, added for a case that only matters after a crash. It is small, and the alternative was a rule that could not be evaluated from the record.
- Recovery's ordering with workspace reconciliation is now explicit and slightly counter-intuitive: the workspace findings are an **input** to the decision, so detection runs before event construction even though the phases are numbered in reading order. Stated plainly in [CRASH-RECOVERY.md](../architecture/runtime/CRASH-RECOVERY.md) rather than left implicit.
- A task that both timed out and completed its effect now reaches `succeeded` rather than retrying. That is the intended change, and it means an operator watching wall-clock deadlines will occasionally see a task adopt a result after its deadline passed.
