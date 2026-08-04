# Durable State, Checkpoints, and Resume

Normative durability contract for the autonomous runtime. Produced under TASK-002. Related decision: [ADR-0004](../../adr/0004-durable-state-as-event-journal-with-atomic-checkpoints.md). Implemented by TASK-003.

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
  journal.ndjson                append-only, one canonical-JSON EventEnvelope per line, LF terminated
  writer.lock                   single-writer lock and heartbeat
  checkpoints/
    LATEST                      one line: the version of the newest validated checkpoint
    checkpoint-000000000042.json
    checkpoint-000000000067.json
  tasks/                        rendered task records produced by bootstrap and by task proposals
  artifacts/                    worker artifact output, referenced by TaskResultSummary.artifactPaths
```

The run directory is outside the repository working tree by default. Bootstrap never writes into the repository `tasks/` directory.

Checkpoint file names use a zero-padded 12-digit version so lexical order equals numeric order.

## Durability primitives

The store depends on exactly three filesystem guarantees, all available on NTFS and on POSIX filesystems:

1. **Append with flush.** A write to an open append handle followed by an fsync makes the appended bytes durable.
2. **Atomic rename within a volume.** A rename either fully replaces the target or leaves it untouched. No reader ever observes a partially renamed file.
3. **Directory fsync.** After a rename, an fsync of the containing directory makes the name change durable.

On Windows the atomic replace is `ReplaceFile`/`MoveFileEx` with `MOVEFILE_REPLACE_EXISTING`; on POSIX it is `rename(2)`. TASK-003 must abstract this behind one function and must not fall back to delete-then-rename, which is not atomic.

## Journal append protocol

`append(runId, expectedVersion, events)`:

1. Verify the run exists and is loaded.
2. Verify `writerEpoch` in every envelope equals the current writer epoch. Otherwise return `StaleWriterEpoch`.
3. Verify `expectedVersion === run.stateVersion`. Otherwise return `VersionConflict` with the current version.
4. For every task-addressed event carrying a `fencingToken`, verify it equals the active lease token for that task. Otherwise return `StaleFencingToken`.
5. Assign `seq = run.stateVersion + i` for the i-th event, substituting the assigned version wherever a `LeaseGranted` placeholder token appears.
6. Apply the events in order through the injected `TransitionFn`. If any event is rejected, return `IllegalTransition` and persist nothing.
7. Serialize all envelopes to canonical JSON, write them to the journal as one contiguous buffer, and fsync.
8. Only after the fsync returns, publish the new in-memory `RunRecord` and return `{ ok: true, version, run }`.

Properties this yields:

- **Atomic batch.** Steps 6 and 7 are all-or-nothing. A batch is validated fully before a single byte is written, so a rejected event never leaves a partial batch in the journal.
- **Acknowledged means durable.** The caller observes success only after fsync. A crash before the fsync returns leaves the batch absent; a crash after it leaves the batch present. Both are consistent.
- **Torn tail is safe.** A crash mid-write can leave a truncated final line. The reader discards any trailing bytes after the last complete LF-terminated, checksum-valid line and reports the discarded byte count in `RestoreResult.discardedTrailingBytes`. A discarded tail was never acknowledged to any caller.
- **No silent merge.** Two writers with the same `expectedVersion` cannot both succeed; the second receives `VersionConflict`. Rejection is a returned value, so it is observable, which is TASK-003's stated acceptance criterion.

Each journal line carries a `checksum` field over the canonical JSON of the envelope with `checksum` omitted. A line whose checksum does not validate terminates the replay exactly as a torn tail does.

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
3. Replay journal envelopes with `seq > checkpoint.version` in `seq` order through the transition function, stopping at the first checksum failure, sequence gap, or torn tail.
4. Return the restored record, its version, the checkpoint version it started from, the number of replayed events, and the discarded trailing byte count.

Pre- and post-conditions:

| | Condition |
|---|---|
| Pre | The run directory exists; the caller holds or is about to acquire the writer lock |
| Post | `result.version` equals `fromCheckpoint + replayedEvents` |
| Post | The restored record is byte-identical under canonical JSON to the record the crashed process last acknowledged at that version |
| Post | Every terminal task and run state present before the crash is present after restore, unchanged |
| Post | `restore` performed no write; it is a read-only operation and may be run twice with identical results |

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
