# ADR-0012: Crash-atomic journal batches with commit records

- Status: Accepted
- Date: 2026-08-05
- Deciders: Solution Architect under TASK-016
- Affects: TASK-003 primarily; TASK-006, TASK-007, and TASK-008 depend on the guarantee
- Supersedes in part: [ADR-0004](0004-durable-state-as-event-journal-with-atomic-checkpoints.md) — its append protocol and its restore torn-tail rule. ADR-0004's journal-plus-checkpoint model, checkpoint protocol, compare-and-set concurrency control, monotonicity derivation, and single-writer lock all stand unchanged.

## Context

Finding A-001 in `reports/code-review/TASK-002-ARCHITECTURE-REVIEW.md`, rated high, established that the TASK-002 append protocol was not crash-atomic.

The protocol serialized `k` newline-delimited event envelopes into one buffer, wrote it, and fsynced, then claimed that "validation before the write makes the persisted batch all-or-nothing" and that "a crash before the fsync returns leaves the batch absent". Filesystem append and fsync provide **durability**, not transaction atomicity for an arbitrarily sized buffer. A crash can persist one or more complete, individually checksum-valid lines followed by a torn final line, and on a filesystem that persists blocks out of order it can leave a valid prefix, a hole, and a valid suffix.

The restore rule compounded it: it discarded only the bytes after the last complete, checksum-valid line, so it would retain and replay a valid prefix of a batch that was never acknowledged.

Two batches in the design must be all-or-nothing, and both fail in ways that are silently wrong rather than merely inefficient:

- **Bootstrap** appends `RunBootstrapped`, `TaskCreated`, and `RunStarted` as one batch. A retained prefix produces a run that exists with no Manager task, or a run bootstrapped but never started — precisely the "half-bootstrapped run" [LIFECYCLE-AND-BOOTSTRAP.md](../architecture/runtime/LIFECYCLE-AND-BOOTSTRAP.md) promises cannot exist.
- **Recovery reconciliation** appends one decision per task plus `RunRecoveryCompleted`. A retained prefix applies some lease and effect decisions and not others, then reports the run as recovered.

Validation before the write does not help. The defect is at the persistence boundary, not in validation order.

## Decision

**A batch is committed by a durable commit record, not by an fsync.**

The journal holds one `JournalLine` per line, a union of an event line and a batch commit record. Every event line carries the batch's `batchId` and its `batchIndex`. The batch's final line is a `batch_commit` record carrying `batchId`, `firstSeq`, `eventCount`, and `batchDigest` — a SHA-256 over the canonical JSON of the batch's envelopes in index order.

**A batch is committed if and only if** its commit record validates its own checksum; exactly `eventCount` event lines carry that `batchId` with `batchIndex` forming the contiguous range `0 … eventCount - 1`; every one of those lines validates its own checksum; the digest over them equals `batchDigest`; and the sequence numbers tile contiguously with the previous committed batch.

**Restore exposes every event of a committed batch or none of it.** It scans forward and stops at the first batch that is not committed; nothing at or after that point is exposed, even if a later batch would validate alone, because a committed batch after a gap would break sequence contiguity and is unreachable state.

**The writer truncates the journal at the last committed batch boundary** after acquiring the writer lock and before its first append, so a new batch is never written after an uncommitted remnant. The truncation is idempotent and crash-safe.

The digest condition is what closes the finding. A retained valid prefix fails it, and so does a hole between two valid lines.

## Alternatives considered

The finding named three acceptable mechanisms. All three were evaluated.

**A length-prefixed, checksummed binary transaction frame.** Compact, unambiguous, and the standard answer in a write-ahead log. Rejected: it abandons the line-oriented, directly diffable, directly greppable journal that ADR-0004 chose deliberately, on the reasoning that "a journal of canonical JSON lines is directly diffable and directly inspectable during a security or QA gate". It also needs a second framing parser and a resynchronization rule after a torn frame, which is new correctness surface in the module that already carries the largest correctness risk in the graph.

**One atomically replaced segment file per batch.** The strongest guarantee available, since `rename` is genuinely atomic and already a required primitive. Rejected: it converts one append into a create, an fsync, a rename, and a directory fsync per batch — four syscalls with two durability barriers where there was one — and produces one small file per batch, thousands over a run. Worse, it moves ordering out of a single file offset and into directory enumeration, which is unordered on both target platforms, so the log's order would have to be reconstructed from file names. Segment compaction would become mandatory rather than the deferrable follow-up ADR-0004 recorded.

**A batch identifier plus a durable commit record — chosen.** It keeps one append-only text file and the three filesystem primitives already required. It adds one line per batch. Commitment becomes a property a reader verifies from the file's own bytes with no additional state, no second file, and no parser for a second format. Because the commit record is the last bytes written, "not committed" is the default outcome of every interruption, which is the safe direction.

**Keep the per-line checksum and simply discard more aggressively — for example, discard the whole trailing line group after any invalid line.** Cheapest possible change. Rejected: it does not close the case where every line of a batch is individually valid but one is missing entirely, and it has no way to know how many lines a batch was supposed to contain. The count and the digest are exactly the missing information.

**Write the batch, fsync, then write a separate commit marker file and fsync it.** Also correct, and closer to a classic two-phase commit. Rejected: two durability barriers per batch instead of one, plus a second file whose own write must be reasoned about, plus a directory fsync. The in-line commit record gets the same guarantee from one write and one fsync.

## Consequences

Positive:

- Restore's post-condition is now true as stated, and it is the one property the bootstrap and recovery guarantees rest on.
- The journal stays a single append-only text file that a reviewer can read, diff, and grep, so ADR-0004's core reason for choosing it survives intact.
- Commitment is verifiable from the file alone. No sidecar, no index, no second source of truth.
- The crash-point test matrix becomes concrete and enumerable: ten named points, two of which — a hole in the middle of a batch and a flipped byte in one line — are exactly the cases the superseded protocol failed.

Negative:

- One extra line and one extra digest computation per batch. Batches are small and infrequent relative to agent invocations, so the cost is not measurable in practice, but the digest is over the whole batch and is recomputed on every restore scan.
- The journal is no longer one envelope per line, so any tooling that assumed that shape must read the `kind` discriminator. Nothing outside TASK-003 reads a journal line, which bounds the blast radius.
- Restore is strictly more conservative than before: a batch that is complete but whose commit record was lost is discarded, even though its events were all persisted. That is correct — it was never acknowledged — but it means a crash can now discard slightly more than the superseded rule would have. Discarding unacknowledged work is always safe; retaining it was the defect.
- The writer performs a truncation on attach, which is a write on a path that was previously read-only. It is confined to the writer, never performed by `restore`, and is itself idempotent, but it is one more crash point and carries its own test obligation.
