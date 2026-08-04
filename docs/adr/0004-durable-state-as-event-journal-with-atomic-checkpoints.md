# ADR-0004: Durable state as an event journal with atomic checkpoints

- Status: Accepted
- Date: 2026-08-04
- Deciders: Solution Architect under TASK-002
- Affects: TASK-003 primarily; TASK-005, TASK-006, TASK-007, TASK-008 consume it

## Context

The runtime must survive abrupt process termination and resume without duplicating completed work. TASK-003 must guarantee that an interrupted write never becomes readable as valid state, that restore returns the latest consistent state with the version it restored, and that concurrent conflicting writes are rejected rather than merged.

It must also supply a strictly monotonic sequence that the scheduler can use as a fencing source, and it must run on Windows and POSIX with the same guarantees.

## Decision

Durable state is an **append-only event journal** plus **periodic atomic snapshots**. The `RunRecord` is defined as the fold of the transition function over the journal; a checkpoint is a materialized fold, never an independent source of truth.

Layout, per run directory: `run.json`, `journal.ndjson`, `writer.lock`, and `checkpoints/` containing versioned snapshots and a `LATEST` pointer.

**Append protocol.** Validate writer epoch, then `expectedVersion` against the current version, then fencing tokens, then apply every event in the batch through the transition function on a speculative copy; only if all succeed, write the whole batch as one contiguous buffer and fsync. Success is returned only after the fsync. This makes acknowledgement equivalent to durability and makes a batch all-or-nothing.

**Checkpoint protocol.** Write `checkpoint-<version>.json.tmp`, fsync, atomically rename to the final name, fsync the directory, then update `LATEST` by the same tmp-and-rename sequence. Each checkpoint carries a SHA-256 checksum over its own payload.

**Restore protocol.** Resolve `LATEST`, validate the checksum, step down to older checkpoints if validation fails, then replay journal events with `seq` greater than the checkpoint version. Discard a torn or checksum-invalid trailing line and report how many bytes were dropped. Return `NoConsistentCheckpoint` rather than silently starting from zero.

**Concurrency control** is compare-and-set on `stateVersion`, with `VersionConflict` returned as a value rather than thrown.

**Monotonicity.** `stateVersion` starts at 0, increases by exactly 1 per applied event, and never resets or decreases. It is the single fencing source: a `FencingToken` is the `stateVersion` of the `LeaseGranted` event that issued it.

**Single-writer lock.** `writer.lock` carries a monotonic `writerEpoch` and a heartbeat. A process attaching to a run with a fresh heartbeat is refused; otherwise it takes the epoch plus one, and every append from a superseded process is rejected with `StaleWriterEpoch`.

## Alternatives considered

**Snapshot-only: rewrite the whole record on every change.** Simplest and needs no replay. Rejected: durability then depends entirely on getting the atomic rename right for every single change, the write cost grows with the number of tasks, and there is no record of *how* the run reached its state — which the reviewer, security, and QA gates all need.

**SQLite with WAL.** Gives transactions, compare-and-set, and crash safety without hand-written durability code, and is genuinely the strongest alternative. Rejected: it adds a native dependency to a repository that currently has none, complicates the Windows CI and container story, and puts a binary file where the project's whole operating model is reviewable text artifacts. A journal of canonical JSON lines is directly diffable and directly inspectable during a security or QA gate.

**Journal with no checkpoints.** Correct and simpler. Rejected: restore cost grows without bound over a long run, and TASK-003's acceptance criteria explicitly require checkpoint creation, listing, and restore.

**Checkpoints with no journal.** Rejected: state between checkpoints would be lost, so a crash could roll back acknowledged work, violating the equivalence claim in [CRASH-RECOVERY.md](../architecture/runtime/CRASH-RECOVERY.md).

**Separate per-task fencing counters.** Rejected: a second monotonic source can drift from the first and must itself be made crash-safe. Deriving tokens from `stateVersion` gives the per-task strict-increase property as a corollary of a global one, with nothing extra to persist.

**Locking by OS file lock instead of an epoch.** Rejected: advisory locks behave differently across platforms and are released on process death without leaving evidence. An epoch persisted in the record fences a resurrected process even after its lock disappeared.

## Consequences

Positive:

- The full causal history of a run is durable, diffable, and reviewable, which serves the review, security, and QA gates directly.
- Acknowledged means durable, giving a crisp boundary for the post-crash invariants.
- One monotonic counter serves versioning, compare-and-set, and fencing, so there is no cross-counter consistency question.
- Zero third-party dependencies in the most security-sensitive module.

Negative:

- TASK-003 hand-writes durability primitives — atomic replace, fsync ordering, torn-tail detection — that a database would provide. This is the largest correctness risk in the graph and is why TASK-003 carries review, security, and QA gates.
- Atomic replace differs between Windows and POSIX and must be abstracted behind one function; a delete-then-rename fallback is explicitly forbidden.
- Journal growth is unbounded until compaction is added. Compaction beyond the retained checkpoint window is deliberately out of scope for TASK-003 and is recorded as a follow-up.
- Canonical JSON serialization must be implemented exactly as specified, since every checksum and digest depends on byte-level agreement.
