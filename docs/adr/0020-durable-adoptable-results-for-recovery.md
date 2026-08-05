# ADR-0020: Durable adoptable results, recorded before the result effect is committed

- Status: Accepted
- Date: 2026-08-05
- Deciders: Solution Architect under TASK-024
- Affects: TASK-006 appends `WorkerResultRecorded` and owns the transition table; TASK-008 reads `pendingResults` in the reconciliation decision; TASK-003 declares the types and persists the register
- Supersedes in part: [ADR-0013](0013-single-decision-recovery-reconciliation.md) — its decision table's `adopt` row, which emitted `WorkerSucceeded` from a ledger entry retaining only `resultDigest`. ADR-0013's one-decision-per-task invariant, its four-input total function, its priority order, its `current_epoch` defect rule, its determinism rule, and `attemptStartedAt` all stand.

## Context

Finding **A-104** in `reports/code-review/TASK-016-ARCHITECTURE-AMENDMENT-REVIEW.md`, rated high, established that recovery cannot execute the transition its own table calls legal.

The committed ledger entry durably retains `resultDigest` and nothing else. Recovery's row R1 maps a `running` task with a `committed` ledger entry to `WorkerSucceeded`, and that event requires a complete `TaskResultSummary` — artifact paths, summary text, completion timestamp — plus `proposedTasks`. Neither `RecoveryContext` nor `ReconciliationDecision` supplied any of it.

The window is the ordinary one, not an exotic one: a crash between `EffectCommitted` and `WorkerSucceeded` is exactly the case the effect ledger exists to adjudicate, and it is the case ADR-0013 named as "the most ordinary case there is". So the design failed precisely where it claimed strength, and it failed silently — an implementer following the table would have written a `WorkerSucceeded` with an empty summary and an empty proposal list, because those are the only values available.

The `proposedTasks` half is the serious one. A digest cannot reconstruct a list, and losing task proposals changes the terminal task graph: a Manager result that proposed four tasks and was adopted with none produces a run that terminates successfully having done a quarter of the work, with no record that anything was lost.

## Decision

**The complete adoptable result is made durable before the attempt's result effect is committed.**

```text
0. WorkerResultRecorded { taskId, attempt, adoptable }   changes no state field
1. EffectIntentRecorded { effectId, isTaskResultEffect: true, ... }
2. ... the effect is performed ...
3. EffectCommitted { effectId, resultDigest }
4. WorkerSucceeded { result, proposedTasks }             the transition
```

`AdoptableResult` carries the task and attempt identity, the idempotency key, the fencing token, the complete `TaskResultSummary`, and `proposedTasks` **verbatim**. It is held in `run.pendingResults`, keyed by task, and cleared by `WorkerSucceeded`.

Because step 0 precedes step 3, a `committed` result effect always has a complete durable result behind it. Recovery's `adopt` decision reads `RecoveryContext.pendingResults[taskId]` and emits the same `WorkerSucceeded` an uninterrupted run would have emitted at step 4.

**The ledger entry is marked.** `EffectLedgerEntry.isTaskResultEffect` distinguishes the one entry per attempt that registers the task's own result from the arbitrary effects an agent may also register. Recovery consults `pendingResults` only for that entry.

**A committed result effect with no adoptable result escalates.** Row R1x: the decision is `escalate` with reason `unreconstructable_result:<effectId>`, and a `RunEvent` with code `RECOVERY_RESULT_UNRECONSTRUCTABLE` names the task and the effect. Recovery does not synthesize a partial `WorkerSucceeded`.

**The fate of `proposedTasks` is stated explicitly and in one place.** They are recorded verbatim, never digested and never truncated; on adoption they are carried into the emitted event and admitted by the same guards an uninterrupted run applies; and when they cannot be reconstructed the task is blocked rather than the graph silently truncated.

**An activation task is never adopted.** Row R0: a task carrying an `activation` block takes `reclaim_activation` regardless of ledger state. Its consumption, its effects, and its result are one batch, so either it landed — and the task is not `running` — or it did not, and the cursor is unchanged and re-consuming the identical range is the designed behavior.

## Alternatives considered

**Define a recovery-specific adoption event with sufficient durable source data.** The second remedy A-104 named, and a legitimate one: `WorkerAdopted { taskId, effectId }` with record effects defined against the ledger entry. Rejected: it gives the state machine two ways to reach `succeeded` with two sets of guards, on the hottest path, specifically for the code that runs when the system is in its least-understood state. ADR-0013 rejected exactly this shape when it declined "recovery-specific transitions with explicit guards" in favour of one table, and re-introducing it here for one row would undo that decision without saying so. It also does not solve the real problem: the event still needs `proposedTasks` from somewhere, and the only somewhere is a durable record — which is this decision, with an extra event on top.

**Store the summary and proposals in the ledger entry itself rather than in a separate register.** No new collection, and the data sits with the effect it describes. Rejected: the ledger is keyed by `effectId` and its entries are consumed by the retry and idempotency policies, which reason about whether re-execution is safe. Putting a task graph inside an entry those policies read would couple two vocabularies, and a ledger entry for a non-result effect would carry a field that is always null. The separate register is keyed by task, which is how recovery already indexes its decisions.

**Digest the proposals and re-derive them on adoption from the artifact the worker wrote.** It would keep the record small. Rejected: it makes adoption depend on reading a file the worker produced, which may be on a worktree that reconciliation is about to abandon, and it makes a crash-recovery path depend on a filesystem read whose failure mode is a partially reconstructed graph. Durable means in the journal.

**Record the adoptable result at `DispatchStarted`, before the work runs.** It would need no reordering at all. Rejected: the result does not exist yet. There is nothing to record.

**Adopt with whatever is available and accept a partial result.** The pragmatic reading: `resultDigest` proves the work happened, so mark it succeeded and move on. Rejected: it is the failure this finding describes, chosen deliberately instead of accidentally. A run that terminates `succeeded` having dropped four proposed tasks is worse than a run that blocks one task with a named defect, because the first is indistinguishable from correct.

**Let recovery adopt an activation task's consumption from the ledger.** It would treat control-plane work uniformly with everything else. Rejected: an activation's cursor advance and its effects are one batch by construction, so there is no state in which the effects landed and the cursor did not. Adoption would be a decision about a state that cannot exist, and writing a row for it would invite an implementation that produces one.

## Consequences

Positive:

- Recovery can execute the transition its table declares legal, in the crash window it exists to recover. That was A-104's stated acceptance condition.
- Task proposals survive a crash, so an interrupted run's terminal task graph equals an uninterrupted run's — which is what the equivalence claim in [CRASH-RECOVERY.md](../architecture/runtime/CRASH-RECOVERY.md) already promised and could not deliver.
- The failure mode when reconstruction is impossible is a blocked task naming a defect, which a human can act on, rather than a silently truncated graph, which nobody can detect.
- The ordering is checkable by a static property of any journal: for every `EffectCommitted` on a result effect there is a `WorkerResultRecorded` at a strictly lower `stateVersion`.
- The state machine still has exactly one way to reach `succeeded`.

Negative:

- One more event per successful attempt, and one more durable register on `RunRecord`. `proposedTasks` can be large for a Manager task, so the journal grows by roughly the size of the proposals it would have carried in `WorkerSucceeded` anyway — the cost is that it now carries them twice, once in `WorkerResultRecorded` and once in `WorkerSucceeded`.
- `pendingResults` must be cleared by `WorkerSucceeded`, so a bug that fails to clear it leaves a stale adoptable result that a later attempt could adopt. The guard against a second `WorkerResultRecorded` for the same `(taskId, attempt)` bounds this, and the recovery test obligations exercise it.
- The recovery decision table gains two rows and two input axes, so its cross-product test is larger. It remains finite and enumerable, which is why the obligation is stated as one test.
- `isTaskResultEffect` is a flag on a ledger entry that only recovery reads, which is mild coupling between the ledger and the adoption path. The alternative — inferring which entry is the result effect from its `effectKind` — would put a string comparison on the recovery path and would break the moment an agent registered an effect with a colliding kind.
