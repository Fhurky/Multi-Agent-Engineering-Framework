# Durable State, Checkpoints, and Resume

Normative durability contract for the autonomous runtime. Produced under TASK-002, amended under TASK-016, amended again under TASK-024. Related decisions: [ADR-0004](../../adr/0004-durable-state-as-event-journal-with-atomic-checkpoints.md) as superseded in part by [ADR-0012](../../adr/0012-crash-atomic-journal-batches-with-commit-records.md), plus [ADR-0017](../../adr/0017-durable-ingress-inbox-and-ingress-epochs.md) and [ADR-0019](../../adr/0019-durable-intent-receipts-for-side-effects.md). Implemented by TASK-003, with the ingress store implemented by TASK-026.

## Amendment register — TASK-024

| Superseded claim (TASK-016) | Superseded by | Finding | Decision |
|---|---|---|---|
| A run directory holding exactly one durable store | [Run directory layout](#run-directory-layout): a second store, `ingress/`, owned by TASK-026, sharing the three durability primitives and nothing else | A-101, F-301 | [ADR-0017](../../adr/0017-durable-ingress-inbox-and-ingress-epochs.md) |
| `AppendResult` returning only the version and the record | Also returning one `DurableAppendReceipt` per event, which is how a module proves a named intent is durable without holding write authority | A-102, A-103 | [ADR-0019](../../adr/0019-durable-intent-receipts-for-side-effects.md) |

## Amendment register — TASK-016

Finding A-001 in `reports/code-review/TASK-002-ARCHITECTURE-REVIEW.md` established that the TASK-002 append protocol was not crash-atomic. This amendment supersedes the claims below. Nothing else in this document changes.

| Superseded claim (TASK-002) | Superseded by | Decision |
|---|---|---|
| "Steps 6 and 7 are all-or-nothing … a rejected event never leaves a partial batch in the journal", asserted for an arbitrarily sized fsynced buffer | [Journal append protocol](#journal-append-protocol) and [Batch framing](#batch-framing-and-the-commit-record) below | [ADR-0012](../../adr/0012-crash-atomic-journal-batches-with-commit-records.md) |
| "Torn tail is safe. A crash mid-write can leave a truncated final line. The reader discards any trailing bytes after the last complete LF-terminated, checksum-valid line" — a rule that retains a valid prefix of an uncommitted batch | [Restore contract](#restore-contract) below: restore is truncated at the last **committed batch boundary**, not at the last valid line | [ADR-0012](../../adr/0012-crash-atomic-journal-batches-with-commit-records.md) |
| "A crash before the fsync returns leaves the batch absent" | Restated: a crash before the commit record is durable leaves the batch **uncommitted**, therefore invisible to restore, whether or not some of its bytes reached the device | [ADR-0012](../../adr/0012-crash-atomic-journal-batches-with-commit-records.md) |
| One journal line per `EventEnvelope` | One journal line per `JournalLine`, a two-member union of an event line and a batch commit record | [ADR-0012](../../adr/0012-crash-atomic-journal-batches-with-commit-records.md) |

## Model

Durable state is an **append-only event journal** with **periodic atomic snapshots**. The `RunRecord` is a derived value: it is always exactly the fold of the transition function over the journal.

```text
RunRecord(v) = fold(applyEvent, RunRecord(0), journal[1..v])
```

A checkpoint is a materialized `RunRecord(v)` written atomically so that restore does not have to replay from zero. Checkpoints are an optimization for restore cost and a bound on journal growth; they are never the only record of a state change. Every state change is in the journal before it is acknowledged.

## Run directory layout

```text
<runRoot>/<runId>/
  run.json                      immutable run identity and limits, written once at creation
  journal.ndjson                append-only, one canonical-JSON JournalLine per line, LF terminated
  writer.lock                   single-writer lock and heartbeat
  checkpoints/
    LATEST                      one line: the version of the newest validated checkpoint
    checkpoint-000000000042.json
    checkpoint-000000000067.json
  control/                      live-run control inbox; see LIFECYCLE-AND-BOOTSTRAP.md
    req-<requestId>.json
    ack-<requestId>.json
    consumed/
  tasks/                        rendered task records produced by bootstrap and by task proposals
  artifacts/                    worker artifact output, referenced by TaskResultSummary.artifactPaths
  ingress/                      TASK-024: the durable ingress inbox, owned by TASK-026
    inbox.ndjson                append-only, one canonical-JSON IngressEntry per line, LF terminated
    epochs.ndjson               append-only, one IngressEpochRecord per line
    index/                      the factId set used for identity-keyed deduplication
```

The run directory is outside the repository working tree by default. Bootstrap never writes into the repository `tasks/` directory.

**The ingress inbox is a second store, not a second journal.** It is owned by TASK-026, not by TASK-003, and it holds no run state: it is never folded into a `RunRecord` and never replayed through the transition function. It shares the three durability primitives below and nothing else — its own append protocol, its own identity rule, its own crash-safety story, and its own epoch history. `run.ingressSeq` is the only thing the journal knows about it, and the journal learns that by observation rather than by owning it. The rationale for the separation is in [COMPONENT-BOUNDARIES.md](COMPONENT-BOUNDARIES.md#durable-ingress-inbox-task-026).

**Crash-safe ingress append.** TASK-026's append writes the batch's entry lines in one contiguous buffer followed by one fsync, and reports the batch's high-water mark only after that fsync returns. An interrupted append leaves a trailing partial line that the reader discards, exactly as an uncommitted journal batch is discarded. Because `seq` is assigned in append order and never recomputed, and because a discarded partial line was never acknowledged and therefore never raised the reported high-water mark, `max(seq)` is non-decreasing across any crash. A re-observed fact is deduplicated by `factId`, so replaying an interrupted append converges rather than duplicating.

Checkpoint file names use a zero-padded 12-digit version so lexical order equals numeric order.

## Durability primitives

The store depends on exactly three filesystem guarantees, all available on NTFS and on POSIX filesystems:

1. **Append with flush.** A write to an open append handle followed by an fsync makes the appended bytes durable.
2. **Atomic rename within a volume.** A rename either fully replaces the target or leaves it untouched. No reader ever observes a partially renamed file.
3. **Directory fsync.** After a rename, an fsync of the containing directory makes the name change durable.

On Windows the atomic replace is `ReplaceFile`/`MoveFileEx` with `MOVEFILE_REPLACE_EXISTING`; on POSIX it is `rename(2)`. TASK-003 must abstract this behind one function and must not fall back to delete-then-rename, which is not atomic.

## Batch framing and the commit record

**Why the TASK-002 protocol was not atomic.** Appending a contiguous buffer of `k` newline-delimited envelopes and calling fsync gives durability, not transaction atomicity. A crash during the write, or a crash after a partial device flush, can leave the file holding a prefix of complete, individually checksum-valid lines followed by a torn line — or, on a filesystem that persists blocks out of order, a valid prefix, a hole, and a valid suffix. The TASK-002 restore rule discarded only the bytes after the last valid line, so it would expose that prefix as applied state. For the two batches that must be all-or-nothing — bootstrap and recovery reconciliation — that means a run whose `RunBootstrapped` was retained without its `RunStarted`, or a recovery in which some lease and effect decisions were applied and others were not. Validation before the write does not help: the defect is in the persistence boundary, not in the validation.

**The recoverable batch boundary is a batch identifier plus a durable commit record.** A journal line is one of two kinds:

```text
{"kind":"event","batchId":"b-1f0c…","batchIndex":0,"envelope":{…},"checksum":"…"}
{"kind":"event","batchId":"b-1f0c…","batchIndex":1,"envelope":{…},"checksum":"…"}
{"kind":"batch_commit","batchId":"b-1f0c…","runId":"run-…","writerEpoch":2,
 "firstSeq":41,"eventCount":2,"batchDigest":"…","committedAt":"…","checksum":"…"}
```

Definitions, all over canonical JSON as defined in [INTERFACE-CONTRACTS.md](INTERFACE-CONTRACTS.md):

```text
line.checksum   = sha256(canonicalJson(line with "checksum" omitted))
batchDigest     = sha256(canonicalJson([envelope_0, envelope_1, … envelope_{n-1}]))
batchId         = "b-" + first16HexOf(sha256(canonicalJson({ runId, writerEpoch, firstSeq, envelopes })))
```

A batch is **committed** if and only if all five hold:

1. A `batch_commit` line for `batchId` exists and its own checksum validates.
2. Exactly `eventCount` event lines carry that `batchId`, with `batchIndex` values forming the contiguous range `0 … eventCount - 1` with no duplicate.
3. Every one of those event lines validates its own checksum.
4. `sha256(canonicalJson(envelopes in batchIndex order))` equals `batchDigest`.
5. `envelope.seq` equals `firstSeq + batchIndex` for every event line, and `firstSeq` equals the previous committed batch's `firstSeq + eventCount`, so committed batches tile the sequence space with no gap and no overlap.

Condition 4 is what closes the defect A-001 named. A retained valid prefix fails the digest, so it is not committed, so restore never exposes it. Conditions 2 and 5 close the out-of-order-persistence case, where a hole sits between two valid lines.

**Why this mechanism.** Three were named by the finding.

| Candidate | Rejected because |
|---|---|
| Length-prefixed, checksummed binary transaction frame | It abandons the line-oriented, directly diffable, directly greppable journal that [ADR-0004](../../adr/0004-durable-state-as-event-journal-with-atomic-checkpoints.md) chose deliberately so that a security or QA gate can read run history as text. It also needs a second framing parser and a resynchronization rule after a torn frame. |
| One atomically replaced segment file per batch | Genuinely atomic through `rename`, and the strongest guarantee available. Rejected: it converts one append into a file create, an fsync, a rename, and a directory fsync per batch, produces one small file per batch — thousands per run — and moves ordering from a single file offset into directory enumeration, which is not ordered on either platform. Segment compaction would then become mandatory rather than deferrable. |
| **Batch identifier plus a durable commit record** — chosen | It keeps one append-only text file and the three filesystem primitives already relied on, adds one line per batch, and makes commitment a property the reader can verify from the file's own bytes with no additional state. The commit record is the last bytes written, so "not yet committed" is the default outcome of every interruption. |

## Journal append protocol

`append(runId, expectedVersion, events)`:

1. Verify the run exists and is loaded.
2. Verify `writerEpoch` in every envelope equals the current writer epoch. Otherwise return `StaleWriterEpoch`.
3. Verify `expectedVersion === run.stateVersion`. Otherwise return `VersionConflict` with the current version.
4. For every task-addressed event carrying a `fencingToken`, verify it equals the active lease token for that task. Otherwise return `StaleFencingToken`.
5. Assign `seq = run.stateVersion + i` for the i-th event, substituting the assigned version wherever a `LeaseGranted` placeholder token appears.
6. Apply the events in order through the injected `TransitionFn` on a speculative copy. If any event is rejected, return `IllegalTransition` and persist nothing.
7. Compute `batchId` and `batchDigest`, serialize the `eventCount` event lines followed by the `batch_commit` line into one contiguous buffer, write it at the current end of file, and fsync.
8. Only after the fsync returns, publish the new in-memory `RunRecord` and return `{ ok: true, version, run, receipts }`.

Step 8's `receipts` is added under TASK-024 (ADR-0019): one `DurableAppendReceipt` per event of the batch, in batch order, each carrying the event type, the `stateVersion` it produced, the writer epoch, and the `batchId`. Because the array is constructed only after the commit record's fsync returns, holding a receipt is proof that the named event is durable. A receipt is evidence and not a capability — it carries no method that writes — which is what lets the workspace and agent modules be told "your intent is durable, proceed" without either of them being given the store.

The buffer is written in one call and the commit record is its final line, so no ordering assumption is made about how the device persists the bytes; commitment is decided by the reader from conditions 1–5, not by write ordering.

**Truncation on attach.** Before its first append, a process that has acquired the writer lock truncates `journal.ndjson` to the end offset of the last committed batch's `batch_commit` line, then fsyncs the file and its directory. This is the only write `restore` ever motivates and it is performed by the writer, not by `restore`. It guarantees that a new batch is never appended after an uncommitted remnant, which would otherwise leave an unreachable hole permanently inside the file. Truncation is itself idempotent and crash-safe: an interrupted truncation leaves either the old length or the new one, and both truncate to the same offset on the next attempt.

Properties this yields:

- **Crash-atomic batch.** Restore exposes every event of a committed batch or none of it. A batch whose commit record is absent, torn, or digest-mismatched is not committed and contributes nothing to the restored record, regardless of how many of its event lines are individually valid.
- **Acknowledged means durable.** The caller observes success only after the fsync that carries the commit record. A crash before that fsync returns leaves the batch uncommitted; a crash after it leaves the batch committed. Both are consistent, and neither exposes a partial batch.
- **Uncommitted suffix is safe.** Every byte after the last committed batch boundary is discarded and reported in `RestoreResult.discardedTrailingBytes`, with the number of discarded event lines in `RestoreResult.discardedUncommittedEvents`. Discarded bytes were never acknowledged to any caller.
- **No silent merge.** Two writers with the same `expectedVersion` cannot both succeed; the second receives `VersionConflict`. Rejection is a returned value, so it is observable, which is TASK-003's stated acceptance criterion.

## Crash-point obligations for the append path

TASK-003 must have a test at each point below, driven by an injected filesystem seam that can stop after an arbitrary byte offset, and each must assert the normative restore post-condition: **every event of a committed batch is exposed, or none of it is.**

| # | Crash point | Required observable result |
|---|---|---|
| C1 | Before the first byte of the batch reaches the file | Batch absent; `stateVersion` unchanged |
| C2 | After a whole number of event lines, before the next one | Batch uncommitted; no event of it exposed; discarded bytes reported |
| C3 | Mid-way through any event line, at every intra-line boundary the seam can produce | Batch uncommitted; no event of it exposed |
| C4 | After the last event line, before any byte of the commit record | Batch uncommitted; no event of it exposed |
| C5 | Mid-way through the commit record | Batch uncommitted; the partial commit record is discarded |
| C6 | After the complete commit record, before the fsync returns | Either fully committed or fully absent; both are legal, nothing in between |
| C7 | After the fsync returns, before the caller is resumed | Batch committed and exposed; the caller may safely repeat the append and must receive `VersionConflict` |
| C8 | With an injected hole: event lines 0 and 2 persisted, line 1 zero-filled, commit record persisted | Batch uncommitted — condition 2 fails on the missing `batchIndex` and condition 4 fails on the digest |
| C9 | With an injected byte flip inside one event line of an otherwise complete batch | Batch uncommitted — condition 3 fails on that line's checksum and condition 4 fails on the digest |
| C10 | During truncation on attach | Truncation is repeated on the next attach and reaches the same offset; no committed batch is ever truncated |

C8 and C9 are the two cases the superseded protocol got wrong, and they are the reason a per-line checksum alone is insufficient.

## Checkpoint write protocol

`checkpoint(runId, expectedVersion)`:

1. Verify `expectedVersion === run.stateVersion`; otherwise return `VersionConflict`.
2. If a validated checkpoint already exists at that version, return it. Checkpointing is idempotent per version.
3. Serialize `{ schemaVersion, version, createdAt, run, checksum }` to canonical JSON, where `checksum` is the SHA-256 of the same object with `checksum` omitted.
4. Write to `checkpoints/checkpoint-<padded>.json.tmp`, fsync the file.
5. Rename to `checkpoints/checkpoint-<padded>.json`, fsync the checkpoints directory.
6. Write the version to `checkpoints/LATEST.tmp`, fsync, rename to `checkpoints/LATEST`, fsync the directory.
7. Prune checkpoints beyond `limits.checkpointRetained`, oldest first, never pruning the newest validated one.

Interruption analysis, which is TASK-003's required test matrix:

| Crash point | Observable result |
|---|---|
| During step 4 | Only a `.tmp` file exists. `LATEST` and the previous checkpoint are unchanged and readable. |
| Between steps 4 and 5 | Same as above; the `.tmp` is ignored and swept on next start. |
| Between steps 5 and 6 | The new checkpoint file exists but `LATEST` still names the previous one. Restore uses the previous one and replays more journal events. Correct, only slower. |
| During step 6 | `LATEST` is either the old value or the new value; a torn `LATEST` fails to parse and restore falls back to the newest checkpoint file that validates. |
| During step 7 | A retained checkpoint may be missing; the newest validated one is never pruned, so restore still succeeds. |

**In no interruption does a partially written checkpoint become readable as a valid checkpoint.** That is the invariant the two-phase rename plus checksum enforces.

Checkpoints are taken when `stateVersion - lastCheckpointVersion >= limits.checkpointEveryEvents`, and unconditionally before `RunDrainCompleted` for either intent, before `releaseWriter`, and immediately after `RunRecoveryCompleted`.

## Restore contract

`restore(runId)`:

1. Read `checkpoints/LATEST`. If it is missing or unparsable, take the highest-numbered checkpoint file instead.
2. Load that checkpoint and validate its checksum. If validation fails, step down to the next lower checkpoint and repeat. If none validates and the journal starts at version 1, replay the entire journal from an empty record. If neither is possible, return `NoConsistentCheckpoint`.
3. Scan the journal forward and resolve it into a sequence of **committed batches** under conditions 1–5 of [Batch framing](#batch-framing-and-the-commit-record). Scanning stops at the first batch that is not committed. Nothing at or after that point is exposed, even if a later batch would validate on its own; a committed batch after a gap would break sequence contiguity and is by definition unreachable state.
4. Replay the envelopes of committed batches with `seq > checkpoint.version` in `seq` order through the transition function.
5. Return the restored record, its version, the checkpoint version it started from, the number of replayed events, the discarded trailing byte count, the number of discarded uncommitted event lines, and the identifier and end offset of the last committed batch.

Pre- and post-conditions:

| | Condition |
|---|---|
| Pre | The run directory exists; the caller holds or is about to acquire the writer lock |
| Post | **Batch atomicity.** For every batch in the journal, restore exposes all `eventCount` of its events or none of them. This is the normative post-condition A-001 requires and is the property every crash-point test asserts. |
| Post | `result.version` equals `fromCheckpoint + replayedEvents` |
| Post | `result.version` equals the `firstSeq + eventCount - 1` of the last committed batch, or `checkpoint.version` when no batch follows the checkpoint |
| Post | The restored record is byte-identical under canonical JSON to the record the crashed process last acknowledged at that version |
| Post | Every terminal task and run state present before the crash is present after restore, unchanged |
| Post | `restore` performed no write; it is a read-only operation and may be run twice with identical results. Truncation is a separate writer-side step and is never performed by `restore`. |

A checkpoint is only ever written at a committed batch boundary, because `checkpoint(runId, expectedVersion)` requires `expectedVersion === run.stateVersion` and `run.stateVersion` only advances through an acknowledged, committed append. A checkpoint therefore never materializes a partial batch.

Restore does not reconcile leases or effects. That is recovery's job and is specified in [CRASH-RECOVERY.md](CRASH-RECOVERY.md). Separating them keeps `restore` pure enough to test without a scheduler.

## Monotonicity

`stateVersion` starts at 0 and increases by exactly 1 per applied event, per run, forever. It never resets, never reuses a value, and never decreases across a crash, because the journal is the authority and the journal only grows.

This single counter is the fencing source. `FencingToken` is the `stateVersion` produced by the `LeaseGranted` event, so a token issued later is strictly greater than every token issued earlier for any task in the run. The per-task strict-increase property that TASK-005 requires is therefore a corollary of a global property, and no separate per-task counter exists to drift.

## Single-writer lock

`writer.lock` holds `{ holderId, writerEpoch, acquiredAt, heartbeatAt, pid, hostName }`.

`acquireWriter(runId, holderId)`:

1. If the file is absent, create it with `writerEpoch = 1`.
2. If present and `heartbeatAt` is newer than `2 x leaseTtlMs`, return `WriterAlive` with the current holder. A second supervisor must not attach to a live run.
3. Otherwise rewrite it atomically with `writerEpoch + 1` and the new holder.

The holder refreshes `heartbeatAt` at `leaseRenewIntervalMs`. Every appended envelope carries the holder's `writerEpoch`; an append from a superseded process is rejected with `StaleWriterEpoch`. This is process-level fencing and is independent of the task-level fencing token. Both are required: the writer epoch stops a resurrected supervisor, and the fencing token stops a superseded worker within a supervisor.

## Secrets

No credential, token, API key, provider header, or environment variable value is written to `run.json`, the journal, a checkpoint, the effect ledger, an artifact index, or a run event. Adapter failure messages are redacted at the adapter boundary before they become a `FailureSummary`. TASK-003 must include a test asserting that a record round-trip contains no value from the process environment.
