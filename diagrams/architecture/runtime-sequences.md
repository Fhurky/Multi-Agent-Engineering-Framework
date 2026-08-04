# Runtime Sequence Diagrams

Source diagrams for the four sequences that carry the runtime's guarantees. Produced under TASK-002.

Specifications: [LEASES-AND-SCHEDULING.md](../../docs/architecture/runtime/LEASES-AND-SCHEDULING.md), [CRASH-RECOVERY.md](../../docs/architecture/runtime/CRASH-RECOVERY.md), [LIFECYCLE-AND-BOOTSTRAP.md](../../docs/architecture/runtime/LIFECYCLE-AND-BOOTSTRAP.md).

## 1. Bootstrap — one input to a running run

```mermaid
sequenceDiagram
  actor Operator
  participant CLI as bin/ CLI (TASK-007)
  participant Boot as bootstrap() (TASK-007)
  participant Store as StateStore (TASK-003)
  participant Sup as Supervisor (TASK-006)

  Operator->>CLI: start --input "<brief>"
  CLI->>CLI: build BootstrapContext<br/>(nowIso, runOrdinal, repoHead, template, manager assignment)
  CLI->>Boot: bootstrap(input, context)
  Note over Boot: pure — byte-identical for a fixed (input, context)
  Boot-->>CLI: BootstrapPlan { runId, runDir, T-0001 body, 3 events }
  CLI->>Store: createRun(init)
  CLI->>Store: acquireWriter(runId, holderId)
  Store-->>CLI: writerEpoch = 1
  CLI->>Store: append(v=0, [RunBootstrapped, TaskCreated, RunStarted])
  Note over Store: one CAS batch — all or nothing
  Store-->>CLI: ok, version = 3, run.state = running
  CLI->>Sup: run loop
```

## 2. Dispatch, lease, and fencing

```mermaid
sequenceDiagram
  participant Sup as Supervisor (TASK-006)
  participant Sched as Scheduler (TASK-005)
  participant Store as StateStore (TASK-003)
  participant Worker as AgentWorker (TASK-004)
  participant Adapter as ProviderAdapter (TASK-004)

  Sup->>Sched: selectDispatchable(run, now)
  Note over Sched: gates: readiness, global limit,<br/>per-role limit, write-scope exclusion<br/>order: (createdSeq, taskId)
  Sched-->>Sup: [candidate T-0007]
  Sup->>Sched: grantLease(run, candidate, now)
  Sched-->>Sup: envelope LeaseGranted (token placeholder -1)
  Sup->>Store: append(v, [LeaseGranted])
  Note over Store: substitutes assigned stateVersion<br/>as the fencing token
  Store-->>Sup: ok, token = 42

  Sup->>Store: append(43, [DispatchStarted{token:42, attempt:1, idempotencyKey}])
  Sup->>Worker: execute({invocation, fencingToken: 42}, signal)
  Worker->>Adapter: invoke(invocation, signal)

  loop every leaseRenewIntervalMs
    Sup->>Store: append(LeaseRenewed{token:42})
    Note over Store: expiresAt extended, token unchanged
  end

  Adapter-->>Worker: AdapterOutcome
  Worker-->>Sup: WorkerResult{token: 42}
  Sup->>Store: append(v, [WorkerSucceeded{token:42}])
  Store-->>Sup: ok
```

## 3. Lease expiry and the rejected late write

The sequence fencing exists for. No coordination with the abandoned worker is needed.

```mermaid
sequenceDiagram
  participant W1 as Worker A (token 42)
  participant Sup as Supervisor
  participant Store as StateStore
  participant Sched as Scheduler
  participant W2 as Worker B (token 57)

  W1->>W1: provider call still running
  Note over Sup: renewals stop — holder is hung or gone

  Sup->>Sched: reclaimExpiredLeases(run, now)
  Sched-->>Sup: [LeaseExpired{T-0007, token 42}]
  Sup->>Store: append(v, [LeaseExpired])
  Store-->>Sup: ok — task back to ready, attempt unchanged

  Sup->>Store: append(v+1, [LeaseGranted{T-0007}])
  Store-->>Sup: ok, token = 57
  Sup->>W2: execute({..., fencingToken: 57})

  W1-->>Sup: WorkerResult{token: 42}  (late)
  Sup->>Store: append(v+n, [WorkerSucceeded{token:42}])
  Store-->>Sup: StaleFencingToken{expected: 57, presented: 42}
  Note over Store: nothing changed — the late result cannot<br/>overwrite the new attempt or resurrect state
```

## 4. Crash recovery

```mermaid
sequenceDiagram
  participant P2 as New process (epoch 2)
  participant Rec as RecoveryCoordinator (TASK-008)
  participant Store as StateStore (TASK-003)
  participant Ledger as Effect ledger (in RunRecord)

  Note over P2: previous process died in `running` at epoch 1

  P2->>Rec: recover(runId, {holderId, now})
  Rec->>Store: acquireWriter(runId, holderId)
  alt heartbeat is fresh
    Store-->>Rec: WriterAlive — abort the attach
  else stale or absent
    Store-->>Rec: epoch = 2
  end

  Rec->>Store: restore(runId)
  Store->>Store: newest checksum-valid checkpoint<br/>+ journal replay, torn tail discarded
  Store-->>Rec: run, version, fromCheckpoint, replayedEvents

  Rec->>Store: append([RunResumeRequested{epoch:2}])
  Note over Store: run -> recovering

  Rec->>Rec: Phase 4 — leases with epoch 1 or past expiry -> LeaseExpired
  Rec->>Ledger: Phase 5 — inspect entries for each affected attempt
  Ledger-->>Rec: committed -> adopt | intended+idempotent -> re-execute<br/>intended+non-idempotent -> block | none -> execute
  Rec->>Rec: Phase 6 — TimeoutWatchdog.scan(run, now)

  Rec->>Store: append(v, [phase 4..6 events, RunRecoveryCompleted])
  Note over Store: one CAS batch — a crash here repeats<br/>the same phases from the same restored state
  Store-->>Rec: ok — run -> running
  Rec->>Store: checkpoint(runId, version)
```
