# ADR-0026: A blocked drain is attachable, and recovery selects every unverified closure

- Status: Accepted
- Date: 2026-08-05
- Deciders: Solution Architect under TASK-028
- Affects: TASK-007 attaches to a blocked-drain run and re-issues the operator's intent; TASK-006 owns the amended run transition table and the invocation-addressed event rules; TASK-008 selects and terminates the unresolved trees; TASK-004 performs the termination
- Supersedes in part:
  - [ADR-0022](0022-unqualified-drain-closure.md) — one clause: its claim that after `RunDrainBlocked` "the next attach fences and terminates the orphans through Phase 5", which was true of neither half at the time. `RunResumeRequested` was legal only from `running` and `paused`, and Phase 5 selected only invocations with no `ProcessGroupClosed` at all. Both halves are decided here. ADR-0022's other decisions stand: `RunDrainCompleted` guarded on verified closure of every invocation of the epoch, `RunDrainBlocked` as a non-success outcome, the total tree-close budget, exit code 5, and the unqualified pause post-condition.
  - [ADR-0014](0014-live-run-control-and-process-tree-ownership.md) — one clause: its recovery-selection rule, "every invocation with a `ProcessGroupRegistered` and no `ProcessGroupClosed`". The predicate is now unverified closure rather than absent closure, and `ProcessGroupClosed` is reclassified as invocation-addressed. ADR-0014's owned groups per platform, bounded escalation, verification by polling, identity by pid and process start time, unconditional fencing at recovery, and the whole live-run control protocol stand unchanged.

## Context

Finding **A-204** in `reports/code-review/TASK-024-ARCHITECTURE-AMENDMENT-REVIEW-ROUND-2.md`, rated High, recorded that `RunDrainBlocked` strands the run and excludes its surviving process tree from recovery. The two halves are independent and each is sufficient on its own to falsify the claim ADR-0022 rested on.

**The run has no legal attach transition.** A blocked drain records `ProcessGroupClosed { verifiedExit: false }`, leaves the run in `pausing` or `draining`, writes a checkpoint, releases the writer lock, and exits 5 — with provider processes possibly still running. The next attach appends `RunResumeRequested`, and at `docs/architecture/runtime/STATE-MACHINE.md:73-86` that event is legal only from `running` and from `paused`. A run left in `pausing` or `draining` can therefore never enter `recovering`, so the sentence "the next attach terminates it" describes a path the transition table forbids.

**Recovery would not select the tree even if it could enter.** `docs/architecture/runtime/CRASH-RECOVERY.md:85-98` processes "every invocation in `run.invocations` with a `ProcessGroupRegistered` and **no** `ProcessGroupClosed`". The drain has just recorded a `ProcessGroupClosed` for exactly the invocations it could not verify, so the record that documents the surviving tree is the record that excludes it from the phase that would terminate it.

The combination makes ADR-0022's remedy an improvement on paper and a regression in effect: TASK-016 recorded the survivor inside a success, and TASK-024 recorded it inside a run that cannot be recovered.

## Decision

**A drain-blocked run is attachable.** `RunResumeRequested` becomes legal from `pausing` and from `draining`, under the same guard it already carries from `running`: the attaching process observed a stale writer epoch. A run in `pausing` or `draining` whose writer epoch is stale is, by exactly the reasoning ADR-0013 applies to a run found in `running`, a run whose process is gone — either it crashed mid-drain or it exited 5 after `RunDrainBlocked`. There is one attach path, and it is the one every other interruption already uses.

**The operator's intent is not lost across the attach.** `RunDrainBlocked` records `intent`. On attach, the lifecycle reads the intent from the last `RunDrainBlocked` of the run and, after `RunRecoveryCompleted` returns the run to `running`, immediately re-issues `RunPauseRequested` or `RunStopRequested` to match it. An operator who asked for a pause and got exit 5 gets a paused run from the next `resume`, not a running one. This is a lifecycle obligation, not a new transition: both events are already legal from `running`.

**Recovery selects unverified closure, not absent closure.** Phase 5 processes every invocation of every writer epoch whose **latest** `ProcessGroupClosed` is absent **or** records `verifiedExit: false`. The predicate is "this tree is not known to be gone", which is the predicate the phase was always meant to have.

**`ProcessGroupClosed` is invocation-addressed, and a superseding closure is legal exactly once per writer epoch.** The three process-group events are reclassified: their guards are evaluated against `run.invocations[invocationId]`, not against a task's state.

- `ProcessGroupRegistered` and `ProcessGroupBound` still require their task to be `running`. Registration precedes the spawn and binding follows it, and both happen inside a dispatch.
- `ProcessGroupClosed` requires only that the invocation exists and the run is non-terminal. A **second** `ProcessGroupClosed` for one invocation is legal only when the existing record has `verifiedExit: false`, only while the run is `recovering`, and only once per writer epoch. It supersedes the unverified record with the verified one and changes no task state.

This is what lets recovery close a tree the drain could not, without making a fifth event legal against a terminal task: the four evidence exceptions in [STATE-MACHINE.md](../architecture/runtime/STATE-MACHINE.md#evidence-events-and-the-terminal-task-rule) are task-addressed and are unchanged at four.

**The claim is restated so that it is true on every path it is stated for.** "The next attach terminates it" now holds because there is a legal attach transition from both blocked-drain states, and because the phase that terminates selects the record the drain wrote. Where termination is still impossible — a reused pid, or an invocation registered but never bound — the outcome stays `orphan_unresolved` and stays in the accepted-risk table, unchanged and unqualified by this record.

## Alternatives considered

**Let `RunDrainBlocked` move the run to `paused` and record the survivor there.** The run would then attach through the existing `paused -> recovering` edge with no new transition. Rejected outright: it is the exception ADR-0022 removed, wearing a different hat. A run in `paused` with a live descendant is precisely the state the unqualified post-condition forbids, and reaching it through a differently named event does not change what an operator is being told.

**Add a distinct `RunAttachToBlockedDrain` event.** It would make the blocked-drain attach visible in the journal as its own fact. Rejected: it adds a 53rd union member for a transition that differs from the existing one in no observable way, and it creates two attach paths where ADR-0009's "one drain, one recovery path" decision exists to have one. `RunDrainBlocked` already records the fact; the attach does not need to record it twice.

**Keep the absent-closure predicate and have the drain not record `ProcessGroupClosed` for a tree it could not verify.** Then the existing Phase 5 predicate selects it with no change. Rejected: it trades a selection defect for an evidence defect. `RunDrainBlocked.unresolvedInvocationIds` would be the only record that the tree was ever escalated against, invariant I13 — every registered invocation has exactly one closure record after recovery — would be false during the blocked interval, and a reader could not distinguish "never attempted" from "attempted and unverifiable". The closure record is the honest artifact; the predicate was the defect.

**Make Phase 5 select from `RunDrainBlocked.unresolvedInvocationIds` rather than from the invocation register.** It reads directly from what the drain recorded. Rejected: it works only for the blocked-drain path and not for an ordinary crash that left a `verifiedExit: false` record for some other reason, and it makes recovery's input a specific prior event rather than the durable register. Recovery reads the register everywhere else, and a phase that reads one event is a phase that misses every case that event does not cover.

**Allow unlimited superseding `ProcessGroupClosed` records.** Simpler guard. Rejected: it would let a record be rewritten repeatedly, which is the property the invocation register does not otherwise have, and it would make "how many times was this tree closed" unbounded. Once per writer epoch, only from `recovering`, only over an unverified record, is the narrowest rule that makes the recovery path expressible.

## Consequences

Positive:

- Exit code 5 is now a recoverable state rather than a terminal inconvenience: the documented remedy — resume — is a path the transition table permits.
- The invariant that no completed drain leaves an unverified tree is joined by one that matters as much: no unverified tree is unreachable by recovery.
- The operator's pause intent survives an exit 5, so the automation wrapper contract in [LIFECYCLE-AND-BOOTSTRAP.md](../architecture/runtime/LIFECYCLE-AND-BOOTSTRAP.md) — "resume rather than retry the pause" — produces the outcome the operator asked for.
- Reclassifying the process-group events to invocation-addressed removes a latent coupling that was never intended: a tree's closure has nothing to do with its task's state, and recording it should not depend on one.

Negative:

- The run transition table gains two rows and the closure event gains a superseding case with three conditions. That is more surface for TASK-006 to test, and the "once per writer epoch" clause is the kind of guard that is easy to implement as "at most twice ever".
- A blocked drain followed by a resume passes through `running` before returning to `pausing`. The window is one append wide and admission is closed for it, but a status probe taken inside it reports `running` for a run the operator asked to pause.
- Recovery may now terminate a tree whose task already reached a terminal state, because the invocation register outlives the task. That is correct — an unmanaged descendant is a resource problem, not a state problem — but it means a `ProcessGroupClosed` can appear in the journal after its task's `WorkerSucceeded`, which a reader tracing one task will encounter.
