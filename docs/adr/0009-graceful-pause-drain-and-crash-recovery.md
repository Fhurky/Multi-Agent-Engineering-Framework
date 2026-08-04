# ADR-0009: Graceful pause, drain, and crash recovery

- Status: Accepted
- Date: 2026-08-04
- Deciders: Solution Architect under TASK-002
- Affects: TASK-007 and TASK-008; TASK-003 and TASK-006 provide the primitives

## Context

A run may last hours and must survive three kinds of interruption: an operator pausing it, an operator stopping it, and the process dying without warning. The failure model is fail-stop at any instruction boundary, including between a write and its fsync and while a provider invocation is in flight.

All three interruptions leave the same question: what happened to the tasks that were in flight? The naive answer is to treat them differently — a pause knows what it interrupted, a crash does not — which produces three code paths and three sets of bugs.

## Decision

**Drain is one mechanism with two intents.** `pause` ends in `paused`; `stop` ends in `cancelled`. Both close admission immediately, let in-flight tasks finish while continuing to renew their leases, wait up to `drainTimeoutMs`, write a checkpoint, and release the writer lock.

**In-flight work is never killed at the drain deadline.** Tasks still running are recorded in `RunDrainCompleted.abandonedTaskIds`, their leases are left to lapse, and they are reconciled on the next attach. Killing an agent mid-effect would manufacture precisely the indeterminate effects the ledger exists to avoid ([ADR-0006](0006-retry-classification-backoff-and-idempotency-keys.md)).

**Resume always goes through recovery**, via `paused -> recovering -> running`. A pause that hit the drain deadline is indistinguishable from a crash with respect to in-flight tasks, so there is one reconciliation path, not two.

**Recovery is seven phases**, appended as one all-or-nothing batch for phases 4 through 6:

1. Acquire the writer lock, taking `writerEpoch + 1`. A live writer refuses the attach.
2. Restore the newest checksum-valid checkpoint plus its journal tail.
3. Enter `recovering` via `RunResumeRequested`.
4. Reclaim every lease held under a superseded epoch or past its deadline.
5. Reconcile effects from the ledger: `committed` means adopt, `intended` and idempotent means re-execute, `intended` and non-idempotent means block, no entry means execute.
6. Run the timeout watchdog once, so deadlines that elapsed during the outage are honored rather than silently restarted.
7. Emit `RunRecoveryCompleted`, return to `running`, and checkpoint immediately.

**A run found in `running` with a stale writer epoch is a crashed run** by definition. `running -> recovering` is therefore a legal transition, which is what lets a crash be detected without a separate crash marker.

**Restore failure is reported, not papered over.** `NoConsistentCheckpoint` moves the run to `failed` with `recovery_failed`. Starting over from zero would silently destroy an operator's run.

**A first `SIGINT` or `SIGTERM` triggers a drain with stop intent.** A second within five seconds exits immediately, which is safe because every acknowledged event is already durable and the run becomes an ordinary crashed run.

**Twelve post-crash invariants** are enumerated in [CRASH-RECOVERY.md](../architecture/runtime/CRASH-RECOVERY.md), each with a required TASK-008 test.

**The equivalence claim** is that for the same input, the same seeded randomness, and the same provider outcomes, a run interrupted by any number of pauses or crashes reaches the same terminal run state as an uninterrupted run. It is a claim about the terminal state and the set of committed effects, not about dispatch interleaving, duration, or attempts consumed.

## Alternatives considered

**Separate code paths for pause, stop, and crash.** The intuitive design, since a pause knows more than a crash does. Rejected: the drain-deadline case makes a pause exactly as uncertain as a crash, so the pause path would need the crash path's reconciliation anyway. Three paths means three sets of edge cases and three places for the equivalence claim to break.

**Kill in-flight workers at the drain deadline.** Bounded and predictable shutdown. Rejected: it converts every deadline into a set of indeterminate effects, which is the most expensive state the design has, since non-idempotent ones require a human.

**A shutdown hook that flushes state on exit.** Rejected: it does not run on `SIGKILL`, on power loss, or on a container kill, and relying on it would weaken the durability guarantee to "usually". The design already makes acknowledgement equivalent to durability, so no flush is needed.

**A separate crash marker file written at startup and removed at clean exit.** Rejected: the writer epoch already distinguishes a crashed run from a clean one, and a marker adds a file whose own write is not atomic with anything else.

**Start over from an empty run when no consistent checkpoint exists.** Rejected: it would silently destroy work and would make the failure invisible until someone noticed the run had restarted.

**Resume directly to `running` when the pause drained cleanly.** A legitimate optimization, since a clean drain has no in-flight tasks. Rejected for now: it reintroduces the second code path to save one no-op reconciliation pass on a path that runs once per attach.

## Consequences

Positive:

- One reconciliation path serves pause, stop, and crash, so the equivalence claim rests on one implementation rather than three.
- No interruption can produce a partially written checkpoint that reads as valid, and no acknowledged event can be lost.
- A late result from a pre-crash worker is rejected by the writer epoch or the fencing token and changes nothing.
- Recovery is itself idempotent and interruptible: a crash during recovery repeats the same phases from the same restored state.

Negative:

- Every attach pays a reconciliation pass even when nothing needs reconciling. The cost is one restore plus one batch append.
- A drain deadline can leave real provider work orphaned; the run pays for it again on resume. Duplicate spend, not duplicate effect.
- Non-idempotent indeterminate effects require a human, so a run can end at exit code 3 waiting on adjudication. This is intended and must be exercised by QA.
- The design depends on fsync being honest. A filesystem that acknowledges without durability breaks invariants I1 and I2; this is an accepted, documented platform requirement rather than something the runtime can detect.
- A backwards clock jump larger than one lease TTL across a restart can make a lease appear unexpired. Phase 4 treats a current-epoch lease as a defect and reports it rather than proceeding silently.
