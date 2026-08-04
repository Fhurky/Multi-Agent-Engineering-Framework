# ADR-0005: Time-bounded leases with monotonic fencing tokens

- Status: Accepted
- Date: 2026-08-04
- Deciders: Solution Architect under TASK-002
- Affects: TASK-005 primarily; TASK-003, TASK-006, TASK-008 consume it

## Context

A dispatched task is owned by a worker for as long as the provider call runs, which may be minutes. If the owner dies, hangs, or is superseded, the task must return to the ready set. But a returning owner may still complete its provider call and try to report a result long after it was replaced.

Without a mechanism to invalidate the superseded owner, that late result could overwrite a newer attempt, resurrect a terminal state, or double-count an effect. Timeouts alone cannot solve this: no timeout can prove the old owner is gone.

The runtime also has a hard admission constraint the project's governance imposes: `allow_overlapping_write_scopes: false`. Two agents editing the same paths on separate branches would produce conflicting work that no downstream merge could safely reconcile.

## Decision

**Time-bounded leases with monotonic fencing tokens.**

A lease carries `holderId`, `fencingToken`, `writerEpoch`, `grantedAt`, `expiresAt`, and `renewals`. `fencingToken` is the `stateVersion` produced by the `LeaseGranted` event, so tokens are globally ordered and strictly increasing per task without a separate counter.

Lifecycle:

- **Acquire** requires `ready`, no active lease, available global and per-role capacity, and no write-scope intersection with anything in flight.
- **Renew** extends `expiresAt` and **never changes the token**. A token change on renew would let the holder's own in-flight write present a superseded value.
- **Release** and **expire** clear the lease and return the task to `ready` with `attempt` unchanged.

**Write guard.** Every task-addressed event carrying a token is checked against the active lease before the transition function runs. Anything other than an exact match is rejected as `StaleFencingToken`, returned as a value.

**Two-level fencing.** `writerEpoch` fences whole processes; `fencingToken` fences individual claims within a process. Both are checked on every append.

**Exactly-once reclaim** comes from compare-and-set, not from locking: two callers observing the same expired lease both build a `LeaseExpired` envelope, the first append wins, the second gets `VersionConflict`, reloads, sees the lease already cleared, and emits nothing.

**Timing.** `leaseTtlMs` 120 s, `leaseRenewIntervalMs` 40 s (one third of the TTL, tolerating two missed renewals), `taskTimeoutMs` 900 s. The lease TTL is deliberately far shorter than the task timeout so that a dead process is detected in one TTL rather than in one task timeout.

**Admission gates**, in order: readiness (dependencies all `succeeded`, backoff elapsed), global concurrency, per-role concurrency, and write-scope exclusion. Survivors are ordered by `(createdSeq, taskId)`, a total order with no ties and no clock or map-iteration dependence.

## Alternatives considered

**Timeouts with no fencing.** Reclaim the task after a deadline and hope the old worker is gone. Rejected: this is the classic distributed-systems mistake. A paused process, a long garbage-collection pause, or a slow provider call produces exactly the duplicate-write scenario fencing exists to prevent, and the failure is silent.

**Cancel the old worker instead of fencing it.** Rejected: cancellation is best-effort and unverifiable. The process may already be gone, or may be blocked in a syscall. Fencing needs no cooperation from the superseded actor, which is precisely why it works.

**A separate monotonic counter per task.** Rejected: a second counter must itself be crash-safe and can drift from `stateVersion`. Deriving tokens from the version gives the required per-task property for free.

**Bumping the token on renew.** Rejected: it creates a race between the holder's renew and the holder's own result write, so a healthy long-running task could have its result rejected.

**Enforcing write-scope exclusion in the supervisor or at admission time.** Rejected: at admission, it would forbid legitimate graphs where two overlapping tasks simply must not run *concurrently*; in the supervisor, the constraint would live outside the module that knows current capacity. The scheduler is the only component that sees both the in-flight set and the candidate set.

**Optimistic dispatch with conflict detection at merge time.** Rejected: conflicts would be discovered after two agents had each spent a full provider invocation, and resolving them would require a merge policy the project does not have.

## Consequences

Positive:

- A late write from a superseded worker is impossible to apply, with no coordination and no cooperation required from the superseded actor.
- Duplicate dispatch after reclaim is structurally excluded by compare-and-set.
- Bounded concurrency and write-scope exclusion are enforced in one place, so the supervisor cannot exceed a limit even by dispatching every candidate it receives.
- Dispatch is reproducible for a fixed record and clock, which is what makes scheduler unit tests meaningful.

Negative:

- A worker whose lease lapsed while it was still working does real provider work that is then discarded. The cost is spend and latency, not correctness; the renew interval is set to make it rare.
- Write-scope exclusion reduces achievable parallelism, and the conservative prefix-based intersection test over-approximates. Over-approximation costs parallelism, never correctness.
- Lease TTL and renew interval are now operational tuning parameters with real consequences: too short causes churn, too long delays reclaim after a crash.
- Every append pays two extra validation checks, on a path already doing an fsync. The cost is negligible relative to the fsync.
