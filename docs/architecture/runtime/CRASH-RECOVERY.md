# Crash Recovery

Normative recovery contract for the autonomous runtime. Produced under TASK-002. Related decision: [ADR-0009](../../adr/0009-graceful-pause-drain-and-crash-recovery.md). Implemented by TASK-008.

## Failure model

The runtime assumes **fail-stop with no warning**: the process may be terminated at any instruction boundary, including between a filesystem write and its fsync, and including while a provider invocation is in flight. It does not assume a shutdown hook runs, and it does not assume the machine survives.

Out of scope: a corrupted or lying filesystem, a clock that moves backwards across a restart by more than one lease TTL, and byzantine agents. The first two are recorded as accepted risks; the third is governed by review gates rather than by the runtime.

## What a crash can leave behind

| Artifact | Possible post-crash states |
|---|---|
| Journal | Complete; or with one torn trailing line that was never acknowledged |
| Checkpoint | Valid; or a stray `.tmp`; or a new file that `LATEST` does not yet name |
| `LATEST` | Old value, new value, or unparsable |
| Leases in the record | Held by a process that no longer exists |
| Effects | None; intended but not committed; or committed |
| Provider work | Completed and unreported, in flight, or never started |

Recovery must produce one consistent run from any combination of these.

## Recovery procedure

`RecoveryCoordinator.recover(runId, context)` runs on every attach — after a crash, after a pause, and after a drain deadline. There is one path, not three.

**Phase 1 — acquire the writer lock.**
Call `acquireWriter`. If it returns `WriterAlive`, abort with that error; a second supervisor must never attach to a live run. On success the writer epoch is strictly greater than the crashed process's epoch, so any append from a resurrected predecessor is rejected with `StaleWriterEpoch` from this moment on.

**Phase 2 — restore.**
Call `restore`. It resolves the newest checksum-valid checkpoint, replays later journal events through the transition function, discards a torn tail, and reports `fromCheckpoint`, `replayedEvents`, and `discardedTrailingBytes`. If it returns `NoConsistentCheckpoint`, recovery fails and the run transitions to `failed` with `terminalReason.code = 'recovery_failed'`. It does not silently start over; destroying an operator's run state is worse than reporting that it cannot be read.

**Phase 3 — enter recovering.**
Append `RunResumeRequested{ writerEpoch }`. From `paused` and from `running` alike this moves the run to `recovering`. A run found in `running` with a stale writer epoch is by definition a crashed run.

**Phase 4 — reconcile leases.**
For every task holding a lease, exactly one of:

| Condition | Action |
|---|---|
| `lease.writerEpoch < run.writerEpoch` | `LeaseExpired` — the holder's process is gone |
| `now >= lease.expiresAt` | `LeaseExpired` — the lease lapsed |
| Neither | Impossible after Phase 1; a lease from the current epoch cannot exist yet. Treated as a defect and reported. |

Every reclaimed task returns to `ready` with `attempt` unchanged.

**Phase 5 — reconcile effects.**
For every task reclaimed in Phase 4 and for every task left in `running`, inspect the ledger for its current attempt:

| Ledger state | Action |
|---|---|
| `committed` | Adopt: emit `WorkerSucceeded` reconstructed from the committed `resultDigest`. The work is done; re-running it would duplicate it. |
| `intended`, `idempotent: true` | Re-execute: the task stays `ready` and will be dispatched again on the same attempt with the same idempotency key. |
| `intended`, `idempotent: false` | Escalate: emit `TaskBlocked{ reason: 'indeterminate_effect:<effectId>' }`. |
| No entry | Re-execute: nothing externally visible happened. |

Phase 5 is the reason a task crashed in flight is "completed once or retried once, never duplicated". The ledger, not a guess about elapsed time, decides which.

**Phase 6 — reconcile timeouts.**
Run `TimeoutWatchdog.scan` once. A task whose attempt deadline elapsed during the outage produces `TaskTimedOut` and follows the ordinary retry or exhaustion path rather than silently restarting its clock.

**Phase 7 — complete.**
Append `RunRecoveryCompleted{ reclaimedTaskIds, adoptedTaskIds }`, which moves the run to `running`. Write a checkpoint immediately, so a crash during recovery does not force the same reconciliation work again.

Phases 4 through 6 are appended as a single compare-and-set batch. Reconciliation is all-or-nothing: a crash during recovery leaves the run exactly as it was before recovery started, and the next attempt repeats the same phases from the same restored state.

## Post-crash invariants

These are the invariants a reviewer, a security reviewer, and QA can each check independently. TASK-008 must have a test per invariant.

| # | Invariant |
|---|---|
| I1 | The journal contains no partially acknowledged event. The last complete, checksum-valid line is the last state any caller was told was durable. |
| I2 | `restore` returns either the newest checksum-valid checkpoint plus its journal tail, or `NoConsistentCheckpoint`. It never returns a record derived from a checkpoint that failed validation. |
| I3 | `result.version === fromCheckpoint + replayedEvents`. |
| I4 | After Phase 4, no task holds a lease from a superseded writer epoch or a lapsed deadline. |
| I5 | Every reclaimed task returns to `ready` exactly once. Between two `LeaseGranted` events for a task there is at most one `LeaseExpired`. |
| I6 | An effect whose ledger entry is `committed` is never re-executed. |
| I7 | An effect that is `intended` but not `committed` is either re-executed under the same idempotency key (when marked idempotent) or escalated to `blocked` with `indeterminate_effect`. |
| I8 | Recovery never rewrites a terminal task state or a terminal run state. |
| I9 | Monotonicity survives the crash: post-recovery `stateVersion`, `writerEpoch`, and every subsequently issued `FencingToken` are strictly greater than any value observed before the crash. |
| I10 | Recovery is idempotent: running it twice against the same run directory yields the same `RunRecord` and no additional effects. |
| I11 | No credential, token, or provider secret appears in the journal, any checkpoint, the ledger, or any run event. |
| I12 | A result produced by a pre-crash worker that returns after recovery is rejected by the fencing or writer-epoch check and changes nothing. |

## Equivalence claim

For the same project input, the same seeded randomness, and the same provider outcomes, a run interrupted by any number of crashes reaches the same terminal run state as an uninterrupted run.

This is the property TASK-008 and TASK-011 both validate. It follows from four facts already established:

1. State is a deterministic fold over an ordered journal (STATE-MACHINE, DURABLE-STATE).
2. The journal only ever loses an unacknowledged tail (DURABLE-STATE).
3. Work already done is recorded in the effect ledger and is adopted rather than repeated (RETRIES-TIMEOUTS-AND-IDEMPOTENCY).
4. Superseded actors cannot write, by writer epoch and fencing token (LEASES-AND-SCHEDULING).

The claim is about the terminal state and the set of committed effects. It is not a claim about dispatch interleaving, wall-clock duration, or the number of attempts consumed, all of which may legitimately differ across an interrupted run.

## Accepted risks

| Risk | Consequence | Mitigation and owner |
|---|---|---|
| A filesystem that acknowledges fsync without durability | I1 and I2 can be violated; the run may lose acknowledged events | Documented platform requirement; TASK-011 validates on the supported filesystems only |
| Backwards clock jump larger than one lease TTL across a restart | A lease may appear unexpired and Phase 4 reports a defect | Phase 4 treats a current-epoch lease as a defect and reports it rather than proceeding silently |
| Non-idempotent effects performed by an agent outside the ledger | The runtime cannot detect or reconcile them | Effects must be registered before they are performed; enforced by review on TASK-004 and TASK-008 |
| A long provider invocation outliving several lease TTLs | Duplicate provider work, wasted spend, no state corruption | Renew interval is one third of the TTL; duplicate results are rejected by fencing |
