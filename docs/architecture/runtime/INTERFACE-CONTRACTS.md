# Runtime Interface Contracts

Normative cross-module contracts for the autonomous runtime. Produced under TASK-002, amended under TASK-016. This document exists so that TASK-003 through TASK-008 and TASK-017 never negotiate an interface during execution.

**Precedence.** This document is the source of truth for every type and signature listed here. Where an implementation and this document disagree, the implementation is wrong. A task that needs a change must stop and route it through the Orchestrator as an ADR amendment, per [INTEGRATION-STRATEGY.md](INTEGRATION-STRATEGY.md).

**Transcription rule.** TASK-003 transcribes the `state/contracts` section into `src/orchestrator/state/contracts/`. TASK-004 transcribes the `agents/contracts` section into `src/agents/contracts/`. Names, field names, and string literal unions must match exactly; formatting and file splitting are the implementer's choice. Every other module imports these types and declares none of its own copies.

Language and platform are fixed by [ADR-0001](../../adr/0001-runtime-platform-and-language.md): TypeScript in strict mode on Node.js, ES modules.

## Amendment register — TASK-016

Every type below that carries an `// TASK-016` marker is new or changed by this amendment. The superseded shapes are named here rather than left in the document, so there is exactly one normative reading of every contract.

| Superseded shape (TASK-002) | Replaced by | Finding | Decision |
|---|---|---|---|
| One journal line per `EventEnvelope` | `JournalLine`, a union of `JournalEventLine` and `JournalBatchCommitLine`, in section 3a | A-001 | [ADR-0012](../../adr/0012-crash-atomic-journal-batches-with-commit-records.md) |
| `RestoreResult` reporting only `discardedTrailingBytes` | Also reports `discardedUncommittedEvents`, `lastCommittedBatchId`, and `lastCommittedEndOffset` | A-001 | [ADR-0012](../../adr/0012-crash-atomic-journal-batches-with-commit-records.md) |
| `TaskRecord.dependencies: TaskId[]` | `TaskDependency[]`, a typed six-member union | A-004 | [ADR-0015](../../adr/0015-typed-scheduling-gate-and-activation-contracts.md) |
| `TaskRecord` with no gate, publication, integration, resource-lock, or activation fields | Nine added fields, section 2 | A-004 | [ADR-0015](../../adr/0015-typed-scheduling-gate-and-activation-contracts.md) |
| `TaskRecord` with no record of when the current attempt started | `attemptStartedAt` | A-002 | [ADR-0013](../../adr/0013-single-decision-recovery-reconciliation.md) |
| `TaskState` with nine members | Ten; `quiescent` added | A-004 | [ADR-0015](../../adr/0015-typed-scheduling-gate-and-activation-contracts.md) |
| `TaskProposal.dependencies: TaskId[]` and no gate fields | Mirrors the amended `TaskRecord` | A-004 | [ADR-0015](../../adr/0015-typed-scheduling-gate-and-activation-contracts.md) |
| `RuntimeEvent`, 25 members | 44 members; the nineteen additions are grouped and marked in section 3 | A-001 … A-004 | ADR-0012 … ADR-0015, [ADR-0011](../../adr/0011-agent-workspace-lifecycle-module.md) |
| `RecoveryOutcome` with three task-id lists | Also carries the reconciliation decisions, orphan outcomes, and workspace outcomes | A-002, A-003 | ADR-0013, ADR-0014 |
| `Scheduler` with no graph validation | `validateGraph` added; a malformed graph is rejected at load | A-004 | [ADR-0015](../../adr/0015-typed-scheduling-gate-and-activation-contracts.md) |
| `AgentInvocation` carrying a `worktreePath` and `branch` with no producer | Carries a `WorkspaceRef` produced by the workspace module | F-105, module gap | [ADR-0011](../../adr/0011-agent-workspace-lifecycle-module.md) |
| No process-tree interface | `ProcessTreeController` in `agents/contracts`, section 6 | A-003 | [ADR-0014](../../adr/0014-live-run-control-and-process-tree-ownership.md) |
| No control-channel interface | `ControlChannel` in `state/contracts`, section 8 | A-003 | [ADR-0014](../../adr/0014-live-run-control-and-process-tree-ownership.md) |
| No workspace interface | `WorkspaceLifecycle` in `state/contracts`, section 11 | module gap, F-105 | [ADR-0011](../../adr/0011-agent-workspace-lifecycle-module.md) |
| `RunLimits`, twelve fields | Twenty-two; the ten additions are marked | A-003, A-004 | ADR-0014, ADR-0015 |

## 1. Shared primitives — `state/contracts` (TASK-003)

```ts
export type RunId = string;          // "run-" + 12 lowercase hex chars + "-" + zero-padded ordinal
export type TaskId = string;         // run-scoped, matches /^T-[0-9]{4}$/
export type EffectId = string;       // sha256 hex of the effect intent payload
export type Sha256Hex = string;      // 64 lowercase hex characters
export type IsoTimestamp = string;   // RFC 3339, UTC, millisecond precision, e.g. "2026-08-04T16:51:12.395Z"

// TASK-016 additions
export type BatchId = string;        // "b-" + 16 lowercase hex chars
export type InvocationId = string;   // "inv-" + 16 lowercase hex chars
export type WorkspaceId = string;    // "ws-" + 16 lowercase hex chars
export type ControlRequestId = string; // matches /^ctl-[0-9a-f]{16}$/
export type GateName = string;       // 'review' | 'security' | 'qa' | 'performance' and any gate a task declares
export type HumanDecisionId = string; // e.g. "HUMAN-001"
export type ActivationSeq = number;  // strictly monotonic per run, starts at 1

/** Strictly monotonic per run. Starts at 0 for a run with no applied events. */
export type StateVersion = number;

/** Equal to the StateVersion produced by the LeaseGranted event that issued it. */
export type FencingToken = number;

/** Strictly monotonic per run. Incremented each time a process acquires the writer lock. */
export type WriterEpoch = number;
```

### Canonical serialization

Every digest, checksum, and determinism claim in this document set is defined over **canonical JSON**:

1. UTF-8 encoding, no byte order mark.
2. Object keys sorted ascending by UTF-16 code unit.
3. No insignificant whitespace.
4. Numbers serialized as the shortest round-tripping decimal form; no `NaN`, no infinities.
5. `undefined`-valued properties omitted; explicit `null` retained.
6. LF line endings where a document is line-oriented.

`Sha256Hex` values are lowercase hexadecimal SHA-256 digests over the canonical JSON encoding of the named value.

### Clock and randomness

```ts
export interface Clock {
  /** Wall-clock time for record fields and expiry comparisons. */
  nowIso(): IsoTimestamp;
  /** Monotonic milliseconds for duration measurement. Never compared across processes. */
  monotonicMs(): number;
}

/** Deterministic, run-scoped randomness. Required for reproducible backoff jitter. */
export interface SeededRandom {
  /** Uniform in [0, 1). Deterministic for a fixed (seed, label) pair. */
  next(label: string): number;
}
```

Every module receives `Clock` and, where it needs randomness, `SeededRandom` by injection. No module reads `Date.now()` or `Math.random()` directly. Expiry comparisons use `nowIso()`; elapsed-duration measurement uses `monotonicMs()`.

## 2. Run and task records — `state/contracts` (TASK-003)

```ts
export type RunState =
  | 'initializing' | 'running' | 'pausing' | 'paused'
  | 'draining' | 'recovering'
  | 'succeeded' | 'failed' | 'cancelled';

export type TaskState =
  | 'pending' | 'ready' | 'leased' | 'running'
  | 'awaiting_retry' | 'blocked'
  | 'quiescent'                        // TASK-016
  | 'succeeded' | 'failed' | 'cancelled';

export const TERMINAL_RUN_STATES = ['succeeded', 'failed', 'cancelled'] as const;
export const TERMINAL_TASK_STATES = ['succeeded', 'failed', 'cancelled'] as const;

export interface RunLimits {
  maxConcurrentTasks: number;          // default 4
  maxConcurrentTasksPerRole: number;   // default 1
  taskTimeoutMs: number;               // default 900_000
  runTimeoutMs: number | null;         // default null (unbounded)
  leaseTtlMs: number;                  // default 120_000
  leaseRenewIntervalMs: number;        // default 40_000
  drainTimeoutMs: number;              // default 120_000
  maxAttempts: number;                 // default 3
  retryBaseDelayMs: number;            // default 1_000
  retryMaxDelayMs: number;             // default 60_000
  checkpointEveryEvents: number;       // default 25
  checkpointRetained: number;          // default 3

  // TASK-016 — process-tree lifecycle (ADR-0014)
  gracefulCancelGraceMs: number;       // default 10_000
  treeExitVerifyTimeoutMs: number;     // default 5_000
  treeExitPollIntervalMs: number;      // default 250
  processTreeCloseTimeoutMs: number;   // default 20_000

  // TASK-016 — live-run control (ADR-0014)
  controlAckTimeoutMs: number;         // default 15_000
  controlRequestTtlMs: number;         // default 300_000
  controlRequestMaxBytes: number;      // default 8_192

  // TASK-016 — scheduling and activation (ADR-0015)
  reservedControlPlaneSlots: number;      // default 1
  activationStarvationBoundRounds: number; // default 1

  // TASK-016 — publication policy (ADR-0011)
  /** false by default. True is an operator-recorded acceptance of a bootstrap-phase limitation,
   *  under which a `local-only` publication satisfies a review_ready edge. Never inferred. */
  allowLocalOnlyPublication: boolean;  // default false
}

export interface RunRecord {
  schemaVersion: 1;
  runId: RunId;
  state: RunState;
  stateVersion: StateVersion;
  writerEpoch: WriterEpoch;
  projectInputDigest: Sha256Hex;
  repoHead: string | null;             // git commit the run was bootstrapped against
  limits: RunLimits;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  terminalReason: TerminalReason | null;
  nextCreatedSeq: number;              // monotonic admission counter
  tasks: Record<TaskId, TaskRecord>;
  effects: Record<EffectId, EffectLedgerEntry>;

  // TASK-016 additions
  nextActivationSeq: ActivationSeq;                        // starts at 1
  activationEvents: ActivationEventRecord[];               // append-only, strictly increasing seq
  invocations: Record<InvocationId, InvocationRecord>;     // process-tree register (ADR-0014)
  workspaces: Record<WorkspaceId, WorkspaceRecord>;        // workspace register (ADR-0011)
  acceptedControlRequests: AcceptedControlRequest[];       // append-only (ADR-0014)
  humanDecisions: HumanDecisionRecord[];                   // append-only (ADR-0015)
}

export interface TaskRecord {
  taskId: TaskId;
  createdSeq: number;
  parentTaskId: TaskId | null;
  title: string;
  ownerRole: string;
  llm: string;
  recordPath: string;                  // run-scoped path of the rendered task record
  writeScope: string[];
  dependencies: TaskDependency[];      // TASK-016 — was TaskId[]
  requiredGates: GateName[];
  state: TaskState;
  attempt: number;                     // 0 before the first DispatchStarted
  maxAttempts: number;
  idempotencyKey: Sha256Hex | null;    // key of the current attempt
  attemptStartedAt: IsoTimestamp | null; // TASK-016 — set at DispatchStarted, cleared on leaving running
  lease: LeaseRecord | null;
  notBefore: IsoTimestamp | null;      // backoff deadline while awaiting_retry
  blockedReason: string | null;
  lastFailure: FailureSummary | null;
  result: TaskResultSummary | null;
  updatedAt: IsoTimestamp;

  // TASK-016 additions — the vocabulary of tasks/TASK-001-DEPENDENCY-GRAPH.md, name for name
  preMergeGates: GateName[];           // subset of requiredGates that blocks integration
  gateTasks: GateAssignment[];         // who gates this task, and at which round
  gateFor: GateTarget | null;          // set when this task IS a gate for another task
  gateVerdicts: GateVerdictRecord[];   // append-only; a later round supersedes, never rewrites
  resourceLock: string | null;         // named lock serializing non-disjoint scopes
  publication: PublicationRecord | null;   // durable review_ready evidence
  integration: IntegrationRecord | null;   // durable integrated evidence
  activation: ActivationSpec | null;   // event-triggered recurring work
  workspaceId: WorkspaceId | null;     // workspace of the current attempt
}

export interface LeaseRecord {
  holderId: string;                    // opaque, process- and worker-scoped
  fencingToken: FencingToken;
  writerEpoch: WriterEpoch;
  grantedAt: IsoTimestamp;
  expiresAt: IsoTimestamp;
  renewals: number;
}

export interface FailureSummary {
  failureClass: FailureClass;          // closed set, section 6
  code: string;                        // stable English machine code
  message: string;                     // English, never contains secret material
  attempt: number;
  occurredAt: IsoTimestamp;
}

export interface TaskResultSummary {
  attempt: number;
  idempotencyKey: Sha256Hex;
  resultDigest: Sha256Hex;
  artifactPaths: string[];
  summary: string;                     // English
  completedAt: IsoTimestamp;
}

export interface TerminalReason {
  code:
    | 'all_tasks_succeeded' | 'task_failed' | 'no_progress'
    | 'operator_stop' | 'run_timeout' | 'bootstrap_failed' | 'recovery_failed';
  message: string;
  taskIds: TaskId[];                   // tasks that caused the outcome; may be empty
}

export interface EffectLedgerEntry {
  effectId: EffectId;
  taskId: TaskId;
  attempt: number;
  idempotencyKey: Sha256Hex;
  status: 'intended' | 'committed';
  idempotent: boolean;                 // whether re-execution is safe if indeterminate
  resultDigest: Sha256Hex | null;      // set when status is 'committed'
  intendedAt: IsoTimestamp;
  committedAt: IsoTimestamp | null;
}
```

## 2a. Typed dependencies, gates, and activation — `state/contracts` (TASK-003)

Added under TASK-016 to resolve A-004. Every name here matches `tasks/TASK-001-DEPENDENCY-GRAPH.md` exactly, so a committed task record compiles against these types without restatement. The satisfying condition of each edge is normative in [STATE-MACHINE.md](STATE-MACHINE.md#typed-dependency-edges).

```ts
export type DependencyEdgeKind =
  | 'review_ready' | 'integrated' | 'gate_passed'
  | 'gate_recorded' | 'human_decision' | 'terminal';

export type TaskDependency =
  | { edge: 'review_ready'; task: TaskId }
  | { edge: 'integrated'; task: TaskId }
  | { edge: 'gate_passed'; task: TaskId; gate: GateName }
  | { edge: 'gate_recorded'; task: TaskId }
  | { edge: 'human_decision'; decision: HumanDecisionId }
  | { edge: 'terminal'; task: TaskId };

export type GateVerdict =
  | 'approved' | 'approved-with-findings'
  | 'changes-required' | 'formally-accepted';

/** The target's view: who gates this task, at which round. */
export interface GateAssignment {
  gate: GateName;
  gateTaskId: TaskId;
  round: number;                       // >= 1; defaults to 1 when a record omits it
}

/** The gate task's view. Must agree pairwise with the target's GateAssignment. */
export interface GateTarget {
  task: TaskId;
  gate: GateName;
  round: number;
}

/** Append-only. A later round supersedes an earlier one; both stay recorded. */
export interface GateVerdictRecord {
  gate: GateName;
  round: number;
  verdict: GateVerdict;
  gateTaskId: TaskId;
  blockingFindingsOpen: number;        // closure requires 0 for 'approved-with-findings'
  artifactPath: string;                // the report the verdict was read from
  remediatedBy: TaskId | null;         // required when verdict is 'changes-required'
  revalidatedBy: TaskId | null;        // required when verdict is 'changes-required'
  acceptedBy: HumanDecisionId | null;  // required when verdict is 'formally-accepted'
  recordedAt: IsoTimestamp;
  supersedes: number | null;           // the round this one supersedes, null at round 1
}

export interface PullRequestIdentity {
  provider: 'github' | 'none';
  number: number | null;
  url: string | null;
  headBranch: string;                  // always the task branch
  baseBranch: string;                  // the configured integration branch
}

/** Durable review_ready evidence, written before the task lock is released. */
export interface PublicationRecord {
  publishedCommit: string;             // immutable commit sha
  publishedBranch: string;             // agent/<llm>/<role>/<task-id>
  remote: string | null;
  pullRequest: PullRequestIdentity | null;
  publication: 'published' | 'local-only' | 'blocked';
  reason: string | null;               // English; required unless 'published'
  supersededCommits: string[];         // earlier published commits, in order
  recordedAt: IsoTimestamp;
}

export interface IntegrationRecord {
  integrationBranch: string;
  mergedCommit: string;
  mergedAt: IsoTimestamp;
}

export interface HumanDecisionRecord {
  decisionId: HumanDecisionId;
  commit: string;                      // tracked commit on a non-agent branch
  summary: string;                     // English
  recordedAt: IsoTimestamp;
}

export type ActivationEventType =
  | 'gate_verdict_recorded' | 'artifact_published' | 'branch_integrated'
  | 'human_decision_recorded' | 'dependency_unsatisfiable' | 'remediation_completed';

export interface ActivationEventRecord {
  seq: ActivationSeq;                  // strictly increasing per run, assigned by applyEvent
  eventType: ActivationEventType;
  sourceRef: string;                   // the commit, report, or record it was read from
  subjectTaskId: TaskId | null;
  appendedAt: IsoTimestamp;
}

export interface ActivationSpec {
  mode: 'event-triggered';
  subscribedEventTypes: ActivationEventType[];   // non-empty
  lastConsumedEventSeq: ActivationSeq;           // monotonically non-decreasing; never rewound
  pendingThroughSeq: ActivationSeq | null;       // set by TaskActivated, cleared by the cursor advance
  state: 'quiescent' | 'pending_activation' | 'consuming';
}
```

`gateVerdicts`, `activationEvents`, `acceptedControlRequests`, and `humanDecisions` are append-only by contract. No event in the union expresses removing or mutating an existing member of any of them, which is what makes a recorded verdict durable structurally rather than by convention.

## 2b. Process-tree and workspace registers — `state/contracts` (TASK-003)

Added under TASK-016. Both are durable registers that recovery reads; the mechanisms that maintain them belong to TASK-004 and TASK-017 respectively.

```ts
export type ProcessGroupKind = 'windows_job_object' | 'posix_process_group';

export type ProcessTreeOutcome =
  | 'exited_normally' | 'already_exited'
  | 'terminated_graceful' | 'terminated_forced'
  | 'terminated_by_recovery' | 'orphan_unresolved';

export interface InvocationRecord {
  invocationId: InvocationId;
  taskId: TaskId;
  attempt: number;
  groupKind: ProcessGroupKind;
  groupName: string;                   // derived from invocationId; known before the spawn
  groupRef: string | null;             // job handle name or pgid; set by ProcessGroupBound
  pid: number | null;                  // set by ProcessGroupBound
  processStartTime: string | null;     // platform-reported; guards against pid reuse
  state: 'registered' | 'bound' | 'closed';
  outcome: ProcessTreeOutcome | null;
  escalation: 'none' | 'graceful' | 'forced' | null;
  verifiedExit: boolean | null;
  unresolvedReason: 'pid_reuse' | 'unbound' | 'verify_timeout' | null;
  registeredAt: IsoTimestamp;
  closedAt: IsoTimestamp | null;
}

export type WorkspaceState =
  | 'unprepared' | 'preparing' | 'prepared' | 'finalizing'
  | 'finalized' | 'abandoning' | 'abandoned' | 'unresolved';

export interface WorkspaceRecord {
  workspaceId: WorkspaceId;
  taskId: TaskId;
  attempt: number;
  branch: string;                      // derived; validated against the agent branch pattern
  worktreePath: string;
  lockSessionId: string | null;        // returned by claim-task.ps1; ownership survives a crash
  hooksVerified: boolean;
  state: WorkspaceState;
  unresolvedReason:
    | 'lock_not_releasable' | 'orphan_unowned' | 'live_owning_session'
    | 'uncommitted_changes' | null;
  preparedAt: IsoTimestamp | null;
  finalizedAt: IsoTimestamp | null;
}

export interface AcceptedControlRequest {
  requestId: ControlRequestId;
  kind: ControlRequestKind;
  requestedBy: string;                 // opaque English label; never an authorization claim
  targetWriterEpoch: WriterEpoch;
  acceptedAt: IsoTimestamp;
}
```

## 3. Events — `state/contracts` (TASK-003)

```ts
export interface EventEnvelope {
  seq: StateVersion;         // equals the stateVersion produced by applying this event
  runId: RunId;
  writerEpoch: WriterEpoch;
  occurredAt: IsoTimestamp;  // caller-supplied; the transition function treats it as data
  event: RuntimeEvent;
}

/** The append API accepts envelopes without seq; the store assigns it. */
export type EventEnvelopeInput = Omit<EventEnvelope, 'seq'>;

export type RuntimeEvent =
  | { type: 'RunBootstrapped'; runId: RunId; projectInputDigest: Sha256Hex; repoHead: string | null; limits: RunLimits }
  | { type: 'RunStarted' }
  | { type: 'RunPauseRequested'; requestedBy: string }
  | { type: 'RunStopRequested'; requestedBy: string }
  | { type: 'RunDrainCompleted'; intent: 'pause' | 'stop'; abandonedTaskIds: TaskId[] }
  | { type: 'RunResumeRequested'; writerEpoch: WriterEpoch }
  | { type: 'RunRecoveryCompleted'; reclaimedTaskIds: TaskId[]; adoptedTaskIds: TaskId[] }
  | { type: 'RunCompleted'; state: 'succeeded' | 'failed' | 'cancelled'; reason: TerminalReason }
  | { type: 'RunCancelled'; reason: TerminalReason }
  | { type: 'TaskCreated'; task: TaskProposal }
  | { type: 'TaskDependenciesSatisfied'; taskId: TaskId }
  | { type: 'LeaseGranted'; taskId: TaskId; holderId: string; fencingToken: FencingToken; expiresAt: IsoTimestamp }
  | { type: 'LeaseRenewed'; taskId: TaskId; fencingToken: FencingToken; expiresAt: IsoTimestamp }
  | { type: 'LeaseReleased'; taskId: TaskId; fencingToken: FencingToken }
  | { type: 'LeaseExpired'; taskId: TaskId; fencingToken: FencingToken }
  | { type: 'DispatchStarted'; taskId: TaskId; fencingToken: FencingToken; attempt: number; idempotencyKey: Sha256Hex }
  | { type: 'EffectIntentRecorded'; effectId: EffectId; taskId: TaskId; attempt: number; idempotencyKey: Sha256Hex; idempotent: boolean }
  | { type: 'EffectCommitted'; effectId: EffectId; resultDigest: Sha256Hex }
  | { type: 'WorkerSucceeded'; taskId: TaskId; fencingToken: FencingToken; attempt: number; result: TaskResultSummary; proposedTasks: TaskProposal[] }
  | { type: 'WorkerFailed'; taskId: TaskId; fencingToken: FencingToken; attempt: number; failure: FailureSummary; disposition: Disposition }
  | { type: 'TaskTimedOut'; taskId: TaskId; fencingToken: FencingToken; attempt: number; timeoutKind: 'task' | 'lease' }
  | { type: 'RetryScheduled'; taskId: TaskId; attempt: number; notBefore: IsoTimestamp; delayMs: number }
  | { type: 'BackoffElapsed'; taskId: TaskId }
  | { type: 'TaskBlocked'; taskId: TaskId; reason: string }
  | { type: 'TaskUnblocked'; taskId: TaskId; note: string }

  // ---- TASK-016 additions ----

  // Live-run control (ADR-0014)
  | { type: 'ControlRequestAccepted'; requestId: ControlRequestId; kind: ControlRequestKind; requestedBy: string; targetWriterEpoch: WriterEpoch }

  // Process-tree lifecycle (ADR-0014)
  | { type: 'ProcessGroupRegistered'; invocationId: InvocationId; taskId: TaskId; attempt: number; groupKind: ProcessGroupKind; groupName: string }
  | { type: 'ProcessGroupBound'; invocationId: InvocationId; pid: number; groupRef: string; processStartTime: string }
  | { type: 'ProcessGroupClosed'; invocationId: InvocationId; outcome: ProcessTreeOutcome; exitCode: number | null; escalation: 'none' | 'graceful' | 'forced'; verifiedExit: boolean; unresolvedReason: InvocationRecord['unresolvedReason'] }

  // Workspace lifecycle (ADR-0011)
  | { type: 'WorkspacePrepareIntended'; workspaceId: WorkspaceId; taskId: TaskId; attempt: number; branch: string; worktreePath: string }
  | { type: 'WorkspacePrepared'; workspaceId: WorkspaceId; lockSessionId: string; hooksVerified: true }
  | { type: 'WorkspaceFinalizeIntended'; workspaceId: WorkspaceId }
  | { type: 'WorkspaceFinalized'; workspaceId: WorkspaceId; lockReleased: boolean }
  | { type: 'WorkspaceAbandoned'; workspaceId: WorkspaceId; reason: string; lockReleased: boolean }
  | { type: 'WorkspaceReconciled'; workspaceId: WorkspaceId; resolvedTo: WorkspaceState; unresolvedReason: WorkspaceRecord['unresolvedReason'] }

  // Typed scheduling, gates, publication, integration (ADR-0015)
  | { type: 'ArtifactPublished'; taskId: TaskId; publication: PublicationRecord }
  | { type: 'GateVerdictRecorded'; targetTaskId: TaskId; gateTaskId: TaskId; gate: GateName; round: number; verdict: GateVerdict; blockingFindingsOpen: number; artifactPath: string; remediatedBy: TaskId | null; revalidatedBy: TaskId | null; acceptedBy: HumanDecisionId | null }
  | { type: 'BranchIntegrated'; taskId: TaskId; integrationBranch: string; mergedCommit: string }
  | { type: 'HumanDecisionRecorded'; decisionId: HumanDecisionId; commit: string; summary: string }
  | { type: 'DependencyUnsatisfiable'; taskId: TaskId; dependency: TaskDependency; reason: string }
  | { type: 'RemediationCompleted'; taskId: TaskId; remediates: Array<{ task: TaskId; finding: string }> }

  // Event-triggered recurring activation (ADR-0015)
  | { type: 'ActivationEventAppended'; eventType: ActivationEventType; sourceRef: string; subjectTaskId: TaskId | null }
  | { type: 'TaskActivated'; taskId: TaskId; throughSeq: ActivationSeq }
  | { type: 'TaskQuiesced'; taskId: TaskId; atSeq: ActivationSeq };

export interface TaskProposal {
  taskId: TaskId;
  title: string;
  ownerRole: string;
  llm: string;
  writeScope: string[];
  dependencies: TaskDependency[];      // TASK-016 — was TaskId[]
  requiredGates: GateName[];
  recordPath: string;
  parentTaskId: TaskId | null;
  maxAttempts?: number;

  // TASK-016 additions, mirroring TaskRecord
  preMergeGates?: GateName[];          // defaults to []
  gateTasks?: GateAssignment[];        // defaults to []
  gateFor?: GateTarget | null;         // defaults to null
  resourceLock?: string | null;        // defaults to null
  activation?: ActivationSpec | null;  // defaults to null
}
```

`RuntimeEvent` is a closed union of 44 members. Adding a member is a contract change and requires an ADR amendment; the nineteen members above were added by this amendment under ADR-0011 and ADR-0013 through ADR-0015.

Seventeen of the nineteen change no state field — every one except `TaskActivated` and `TaskQuiesced`. They record a durable fact — a gate verdict, a publication, an accepted control request, a process group, a workspace step — and each still advances `stateVersion` by exactly one, so replay determinism and the derivation of fencing tokens from `stateVersion` are unaffected. [STATE-MACHINE.md](STATE-MACHINE.md) lists which states each is legal from.

## 3a. Journal line framing — `state/contracts` (TASK-003)

Added under TASK-016 to resolve A-001. The journal is no longer one `EventEnvelope` per line; it is one `JournalLine` per line, and a batch becomes visible to restore only when its commit record validates. The five conditions for a committed batch, the digest definition, and the crash-point matrix are normative in [DURABLE-STATE-AND-CHECKPOINTS.md](DURABLE-STATE-AND-CHECKPOINTS.md).

```ts
export interface JournalEventLine {
  kind: 'event';
  batchId: BatchId;
  batchIndex: number;                  // 0-based within the batch
  envelope: EventEnvelope;
  checksum: Sha256Hex;                 // over canonical JSON of this line with checksum omitted
}

export interface JournalBatchCommitLine {
  kind: 'batch_commit';
  batchId: BatchId;
  runId: RunId;
  writerEpoch: WriterEpoch;
  firstSeq: StateVersion;              // seq of batchIndex 0
  eventCount: number;
  batchDigest: Sha256Hex;              // sha256(canonicalJson(envelopes in batchIndex order))
  committedAt: IsoTimestamp;
  checksum: Sha256Hex;
}

export type JournalLine = JournalEventLine | JournalBatchCommitLine;
```

## 4. Durable state store — `state/contracts` (TASK-003)

```ts
export interface StateStore {
  /** Fails with 'RunAlreadyExists' if runId is already present. */
  createRun(init: RunInit): Promise<CreateRunResult>;

  /** Latest committed record. Does not replay; use restore() after a crash. */
  load(runId: RunId): Promise<LoadResult>;

  /**
   * Compare-and-set append. Validates writer epoch, fencing tokens, and — via the
   * injected transition function — semantic legality, then persists durably before returning.
   */
  append(
    runId: RunId,
    expectedVersion: StateVersion,
    events: EventEnvelopeInput[],
  ): Promise<AppendResult>;

  /** Writes an atomic snapshot at the current version. Idempotent for a version already checkpointed. */
  checkpoint(runId: RunId, expectedVersion: StateVersion): Promise<CheckpointResult>;

  listCheckpoints(runId: RunId): Promise<CheckpointDescriptor[]>;

  /** Latest checksum-valid checkpoint plus journal replay of every later event. */
  restore(runId: RunId): Promise<RestoreResult>;

  /** Acquires the run's single-writer lock with a strictly greater epoch. */
  acquireWriter(runId: RunId, holderId: string): Promise<AcquireWriterResult>;

  /**
   * TASK-016. Truncates the journal at the end offset of the last committed batch.
   * Called once by the writer after acquiring the lock and before its first append.
   * Idempotent: an interrupted truncation reaches the same offset on the next call.
   */
  truncateToLastCommittedBatch(runId: RunId): Promise<TruncateResult>;

  /**
   * TASK-016 pre-condition: every invocation of this epoch has a durable ProcessGroupClosed.
   * Violating it is a defect; TASK-003 rejects the call rather than releasing the lock.
   */
  releaseWriter(runId: RunId, epoch: WriterEpoch): Promise<void>;
}

export type TruncateResult =
  | { ok: true; truncatedBytes: number; endOffset: number }
  | { ok: false; error: 'RunNotFound' | 'NotWriter' };

export interface RunInit {
  runId: RunId;
  runDir: string;
  projectInputDigest: Sha256Hex;
  repoHead: string | null;
  limits: RunLimits;
  createdAt: IsoTimestamp;
}

export type CreateRunResult =
  | { ok: true; run: RunRecord }
  | { ok: false; error: 'RunAlreadyExists' };

export type LoadResult =
  | { ok: true; run: RunRecord; version: StateVersion }
  | { ok: false; error: 'RunNotFound' };

export type AppendResult =
  | { ok: true; version: StateVersion; run: RunRecord }
  | { ok: false; error: 'VersionConflict'; currentVersion: StateVersion }
  | { ok: false; error: 'StaleWriterEpoch'; currentEpoch: WriterEpoch }
  | { ok: false; error: 'StaleFencingToken'; taskId: TaskId; expected: FencingToken; presented: FencingToken }
  | { ok: false; error: 'IllegalTransition'; detail: TransitionError }
  | { ok: false; error: 'RunNotFound' };

export interface CheckpointDescriptor {
  version: StateVersion;
  path: string;
  checksum: Sha256Hex;
  createdAt: IsoTimestamp;
}

export type CheckpointResult =
  | { ok: true; checkpoint: CheckpointDescriptor }
  | { ok: false; error: 'VersionConflict'; currentVersion: StateVersion };

export type RestoreResult =
  | {
      ok: true;
      run: RunRecord;
      version: StateVersion;
      fromCheckpoint: StateVersion;
      replayedEvents: number;
      discardedTrailingBytes: number;
      // TASK-016 additions
      discardedUncommittedEvents: number;   // event lines belonging to the uncommitted suffix
      lastCommittedBatchId: BatchId | null;
      lastCommittedEndOffset: number;       // byte offset the writer truncates to on attach
    }
  | { ok: false; error: 'NoConsistentCheckpoint' }
  | { ok: false; error: 'RunNotFound' };

export type AcquireWriterResult =
  | { ok: true; epoch: WriterEpoch }
  | { ok: false; error: 'WriterAlive'; holderId: string; heartbeatAt: IsoTimestamp };
```

Every failure is a returned value, not a thrown exception. Callers must handle each variant; TASK-005, TASK-006, and TASK-008 all depend on observing `VersionConflict` and `StaleFencingToken` rather than catching errors.

The store receives the transition function by injection so that legality is decided by TASK-006's single authority while durability is enforced by TASK-003:

```ts
export type TransitionFn = (run: RunRecord, envelope: EventEnvelope) => TransitionResult;

export type TransitionResult =
  | { ok: true; run: RunRecord }
  | { ok: false; error: TransitionError };

export interface TransitionError {
  code: 'IllegalTransition' | 'UnknownTask' | 'DuplicateTask' | 'GuardFailed' | 'TerminalRun' | 'SequenceGap';
  from: RunState | TaskState;
  eventType: RuntimeEvent['type'];
  taskId: TaskId | null;
  message: string;
}
```

TASK-003 constructs its store with a `TransitionFn` parameter and unit-tests it with a trivial fake. TASK-006 supplies the real one. Neither task imports the other's implementation.

## 5. Scheduling — declared in `state/contracts`, implemented by TASK-005

These types live in `state/contracts` because both TASK-005 and TASK-006 consume them and TASK-003 owns that root.

```ts
export interface DispatchCandidate {
  taskId: TaskId;
  ownerRole: string;
  llm: string;
  createdSeq: number;
  /** TASK-016. Activatable candidates sort ahead of ordinary ones. */
  activationClass: 'activation' | 'ordinary';
  /** TASK-016. Set for an activation candidate; the range TaskActivated will claim. */
  activateThroughSeq: ActivationSeq | null;
}

export interface Scheduler {
  /**
   * Pure and deterministic. Returns candidates in dispatch order, already filtered by
   * typed dependency readiness, backoff deadline, activation cursor, concurrency limits,
   * write-scope exclusion, named resource-lock exclusion, and workspace readiness.
   * Never returns more candidates than the remaining global capacity.
   */
  selectDispatchable(run: RunRecord, now: IsoTimestamp): DispatchCandidate[];

  /**
   * TASK-016. Pure. Evaluates one typed edge against the record.
   * The satisfying conditions are normative in STATE-MACHINE.md.
   */
  isEdgeSatisfied(run: RunRecord, edge: TaskDependency): EdgeEvaluation;

  /**
   * TASK-016. Pure. Validates the whole graph against the five no-deadlock invariants,
   * including acyclicity of the expanded precondition graph. Called at load and on every
   * TaskCreated admission. Returns every violation, not only the first.
   */
  validateGraph(run: RunRecord): GraphValidation;

  /** Emits LeaseGranted for the candidate. Returns the token the caller must present. */
  grantLease(run: RunRecord, candidate: DispatchCandidate, now: IsoTimestamp): LeaseGrant;

  /** Emits LeaseRenewed. Fails if the presented token is not the active one. */
  renewLease(run: RunRecord, taskId: TaskId, token: FencingToken, now: IsoTimestamp): LeaseRenewal;

  releaseLease(run: RunRecord, taskId: TaskId, token: FencingToken): EventEnvelopeInput;

  /** Pure. Returns one LeaseExpired envelope per lease whose expiresAt has passed. */
  reclaimExpiredLeases(run: RunRecord, now: IsoTimestamp): EventEnvelopeInput[];
}

export type EdgeEvaluation =
  | { satisfied: true }
  | { satisfied: false; permanently: boolean; reason: string };

export type GraphValidation =
  | { ok: true }
  | { ok: false; violations: GraphViolation[] };

export interface GraphViolation {
  code:
    | 'GRAPH_CYCLE_SCHEDULING' | 'GRAPH_GATE_HOLDS_STRONG_EDGE'
    | 'GRAPH_GATE_PAIR_MISMATCH' | 'GRAPH_PREMERGE_GATE_AWAITS_MERGE'
    | 'GRAPH_CYCLE_EXPANDED' | 'GRAPH_UNKNOWN_TARGET' | 'GRAPH_TERMINAL_EDGE_CYCLE';
  taskIds: TaskId[];                   // the cycle in order, or the tasks involved
  detail: string;                      // English
}

export type LeaseGrant =
  | { ok: true; fencingToken: FencingToken; envelope: EventEnvelopeInput }
  | { ok: false; error: 'CapacityExhausted' | 'WriteScopeConflict' | 'ResourceLockHeld' | 'WorkspaceNotReady' | 'AlreadyLeased' | 'NotReady' };

export type LeaseRenewal =
  | { ok: true; envelope: EventEnvelopeInput }
  | { ok: false; error: 'StaleFencingToken' | 'LeaseExpired' | 'NoLease' };
```

`grantLease` returns an envelope rather than performing a write. The supervisor appends it. This keeps the scheduler pure and testable and preserves the rule that only the supervisor's append path mutates durable state.

Because `fencingToken` equals the `StateVersion` produced by the `LeaseGranted` event, the scheduler cannot know the value before the append succeeds. The contract resolves this by having `grantLease` emit the envelope with a token placeholder of `-1`; `StateStore.append` substitutes the assigned `StateVersion` into both the envelope and the resulting `LeaseRecord`, and returns the updated `RunRecord` from which the caller reads the real token. TASK-003 must implement that substitution; TASK-005 must not compute a token itself.

## 6. Provider adapters and workers — `agents/contracts` (TASK-004)

```ts
export type FailureClass =
  | 'transient'
  | 'rate_limited'
  | 'timeout'
  | 'provider_unavailable'
  | 'invalid_request'
  | 'authentication'
  | 'quota_exhausted'
  | 'policy_refusal'
  | 'agent_reported_blocked'
  | 'unknown';

export type Disposition = 'retry' | 'fail' | 'escalate';

/** The single normative mapping. Every module uses this table; none redefines it. */
export const DISPOSITION_BY_CLASS: Readonly<Record<FailureClass, Disposition>> = {
  transient: 'retry',
  rate_limited: 'retry',
  timeout: 'retry',
  provider_unavailable: 'retry',
  invalid_request: 'fail',
  unknown: 'fail',
  authentication: 'escalate',
  quota_exhausted: 'escalate',
  policy_refusal: 'escalate',
  agent_reported_blocked: 'escalate',
};

export interface AdapterFailure {
  failureClass: FailureClass;
  code: string;                    // stable English machine code, e.g. 'PROVIDER_HTTP_503'
  message: string;                 // English, redacted, never contains credential material
  providerCode: string | null;     // raw provider code, retained for diagnostics only
  retryAfterMs: number | null;     // honored by the retry policy when present
}

export interface AgentInvocation {
  invocationId: InvocationId;      // TASK-016 — durable before the spawn, not an ad-hoc string
  runId: RunId;
  taskId: TaskId;
  attempt: number;
  idempotencyKey: Sha256Hex;
  role: string;
  llm: string;
  roleContractPaths: string[];     // .agents/<role>/ contract files
  taskRecordPath: string;
  workspace: WorkspaceRef;         // TASK-016 — replaces the bare worktreePath and branch
  timeoutMs: number;
}

/**
 * TASK-016. A prepared workspace, produced by the workspace lifecycle module and
 * carried verbatim. The worker never derives, edits, or validates these values;
 * a workspace that is not `prepared` cannot reach an invocation at all.
 */
export interface WorkspaceRef {
  workspaceId: WorkspaceId;
  worktreePath: string;
  branch: string;
  prepared: true;
}

export type AdapterOutcome =
  | { status: 'succeeded'; artifactPaths: string[]; summary: string; resultDigest: Sha256Hex; proposedTasks: TaskProposal[]; usage: UsageSummary | null }
  | { status: 'failed'; failure: AdapterFailure };

export interface UsageSummary {
  inputTokens: number | null;
  outputTokens: number | null;
  durationMs: number;
}

export interface ProviderAdapter {
  readonly family: string;         // lowercase family name matching config/agents/settings.yaml
  invoke(invocation: AgentInvocation, signal: AbortSignal): Promise<AdapterOutcome>;
}

export interface AdapterRegistry {
  register(adapter: ProviderAdapter): void;
  resolve(family: string): ProviderAdapter | null;
  families(): string[];
}

/** Credentials are read here and nowhere else. Values never enter a record, log, or event. */
export interface SecretProvider {
  get(name: string): string | null;
  require(name: string): string;   // throws a redacted error naming only the variable
}

export interface WorkAssignment {
  invocation: AgentInvocation;
  fencingToken: FencingToken;
}

export interface WorkerResult {
  invocationId: string;
  runId: RunId;
  taskId: TaskId;
  attempt: number;
  idempotencyKey: Sha256Hex;
  fencingToken: FencingToken;
  startedAt: IsoTimestamp;
  finishedAt: IsoTimestamp;
  outcome: AdapterOutcome;
}

export interface AgentWorker {
  execute(assignment: WorkAssignment, signal: AbortSignal): Promise<WorkerResult>;
}

/**
 * TASK-016 (ADR-0014). OS process-tree ownership. Implemented by TASK-004 and by nobody else.
 * Consumed by TASK-007 during drain and by TASK-008 during recovery, through this interface only.
 */
export interface ProcessTreeController {
  /**
   * Creates the owned group and returns the descriptor to record.
   * On Windows the job object is created with KILL_ON_JOB_CLOSE **before** the spawn, so a
   * supervisor crash terminates the whole tree. On POSIX the child is spawned detached into a
   * new process group whose pgid equals its pid.
   * The caller must have appended ProcessGroupRegistered before calling this.
   */
  spawnOwned(invocation: AgentInvocation, command: SpawnCommand): Promise<SpawnOwnedResult>;

  /**
   * Graceful cancellation, then bounded escalation, then verified exit.
   * Never returns while a member of the tree is still alive unless verification timed out,
   * which is reported as verifiedExit false rather than as success.
   */
  cancelTree(invocationId: InvocationId, deadlines: TreeCancelDeadlines): Promise<TreeCloseOutcome>;

  /**
   * Recovery path. Verifies identity by pid **and** process start time before signalling,
   * so a reused pid is never targeted. An invocation that was registered but never bound
   * cannot be identified and returns 'orphan_unresolved' with reason 'unbound'.
   */
  reclaimOrphan(record: InvocationRecord, deadlines: TreeCancelDeadlines): Promise<TreeCloseOutcome>;
}

export interface SpawnCommand {
  /** Argument vector. Never a shell command string; no value is interpolated for a shell. */
  argv: string[];
  cwd: string;
  /** Allow-listed only. A variable absent from the allow list is stripped, never inherited. */
  env: Readonly<Record<string, string>>;
}

export type SpawnOwnedResult =
  | { ok: true; pid: number; groupRef: string; processStartTime: string }
  | { ok: false; failure: AdapterFailure };

export interface TreeCancelDeadlines {
  gracefulCancelGraceMs: number;
  treeExitVerifyTimeoutMs: number;
  treeExitPollIntervalMs: number;
}

export interface TreeCloseOutcome {
  invocationId: InvocationId;
  outcome: ProcessTreeOutcome;
  exitCode: number | null;
  escalation: 'none' | 'graceful' | 'forced';
  verifiedExit: boolean;
  unresolvedReason: 'pid_reuse' | 'unbound' | 'verify_timeout' | null;
}
```

`agents/contracts` re-declares `RunId`, `TaskId`, `Sha256Hex`, `IsoTimestamp`, `FencingToken`, `TaskProposal`, and — added under TASK-016 — `InvocationId`, `WorkspaceId`, `InvocationRecord`, and `ProcessTreeOutcome` locally as structurally identical aliases. This is the first of the two permitted duplications: it lets TASK-004 compile in parallel with TASK-003 without an import edge between the two contract roots. TypeScript structural typing makes the two views interchangeable at every consumer. The second permitted duplication is `WorkspaceFailureClass`; see [COMPONENT-BOUNDARIES.md](COMPONENT-BOUNDARIES.md).

## 7. Retry, timeout, and recovery — declared in `state/contracts`, implemented by TASK-008

```ts
export interface RetryPolicy {
  /** Uses DISPOSITION_BY_CLASS. Never overrides it. */
  disposition(failure: FailureSummary): Disposition;

  /**
   * Deterministic for a fixed (runId, taskId, attempt, failure) tuple.
   * Returns the delay before the task becomes ready again.
   */
  nextDelayMs(taskId: TaskId, attempt: number, failure: FailureSummary, limits: RunLimits): number;
}

export interface TimeoutWatchdog {
  /** Pure. Emits TaskTimedOut for attempts past their deadline and for expired leases. */
  scan(run: RunRecord, now: IsoTimestamp): EventEnvelopeInput[];
}

export interface RecoveryCoordinator {
  recover(runId: RunId, context: RecoveryContext): Promise<RecoveryOutcome>;
}

export interface RecoveryContext {
  holderId: string;
  now: IsoTimestamp;
}

export type RecoveryOutcome =
  | {
      ok: true;
      run: RunRecord;
      version: StateVersion;
      reclaimedTaskIds: TaskId[];
      adoptedTaskIds: TaskId[];
      blockedTaskIds: TaskId[];
      // TASK-016 additions
      decisions: ReconciliationDecision[];
      orphanOutcomes: TreeCloseOutcome[];
      workspaceOutcomes: WorkspaceReconcileEntry[];
      staleControlRequests: ControlRequestId[];
    }
  | { ok: false; error: 'NoConsistentCheckpoint' | 'WriterAlive' | 'RunNotFound' };

/**
 * TASK-016 (ADR-0013). Exactly one per reconcilable task. The decision is a total function
 * of the four inputs below, and its expansion is proven legal from `fromState` by the
 * decision table in STATE-MACHINE.md. Recovery emits nothing outside these expansions.
 */
export interface ReconciliationDecision {
  taskId: TaskId;
  fromState: TaskState;
  leaseState: 'none' | 'superseded' | 'current_epoch';
  ledgerState: 'none' | 'intended_idempotent' | 'intended_non_idempotent' | 'committed';
  deadline: 'elapsed' | 'not_elapsed';
  decision: 'adopt' | 'escalate' | 'reclaim' | 'retry_timeout' | 'exhaust_timeout' | 'none';
  emitted: Array<RuntimeEvent['type']>;   // the fixed sequence for this decision
  toState: TaskState;
}
```

## 8. Lifecycle and bootstrap — declared in `state/contracts`, implemented by TASK-007

```ts
export interface ProjectInput {
  /** The single operator-supplied input: a project brief, verbatim. */
  brief: string;
}

/** Everything impure that bootstrap needs, supplied by the caller so bootstrap stays pure. */
export interface BootstrapContext {
  nowIso: IsoTimestamp;
  runOrdinal: number;              // derived from existing run directories
  repoHead: string | null;
  runRoot: string;                 // parent directory for run directories
  taskTemplate: string;            // contents of templates/task.md
  managerRole: RoleAssignment;     // resolved from config/agents/settings.yaml
  limits: RunLimits;
}

export interface RoleAssignment {
  role: string;
  llm: string;
  enabled: boolean;
  writeScope: string[];
}

export type BootstrapResult =
  | { ok: true; plan: BootstrapPlan }
  | { ok: false; error: BootstrapError };

export interface BootstrapPlan {
  runId: RunId;
  runDir: string;
  projectInputDigest: Sha256Hex;
  initialTaskRecordPath: string;
  initialTaskRecordBody: string;   // fully rendered Markdown
  events: EventEnvelopeInput[];    // RunBootstrapped, TaskCreated, RunStarted — appended as one batch
}

export interface BootstrapError {
  code: 'EMPTY_INPUT' | 'INPUT_TOO_LARGE' | 'MANAGER_ROLE_UNASSIGNED' | 'MANAGER_ROLE_DISABLED' | 'TEMPLATE_INVALID';
  message: string;                 // English; the CLI renders a Turkish message from the code
}

export interface RunController {
  start(input: ProjectInput): Promise<RunOutcome>;
  resume(runId: RunId): Promise<RunOutcome>;
  pause(runId: RunId): Promise<RunOutcome>;
  stop(runId: RunId): Promise<RunOutcome>;
  status(runId: RunId): Promise<RunStatusView>;
}

export interface RunOutcome {
  runId: RunId;
  runState: RunState;
  terminalReason: TerminalReason | null;
  exitCode: 0 | 1 | 2 | 3 | 4;
}

export interface RunStatusView {
  runId: RunId;
  runState: RunState;
  stateVersion: StateVersion;
  counts: Record<TaskState, number>;
  inFlight: TaskId[];
  blocked: Array<{ taskId: TaskId; reason: string }>;
  // TASK-016 additions
  quiescent: Array<{ taskId: TaskId; lastConsumedEventSeq: ActivationSeq; maxSubscribedSeq: ActivationSeq }>;
  openGates: Array<{ taskId: TaskId; gate: GateName; highestRound: number; verdict: GateVerdict | null }>;
}

/**
 * TASK-016 (ADR-0014). The live-run control channel. Owned by TASK-007 and by nobody else.
 * The supervisor consumes accepted requests as events and never reads the transport.
 */
export type ControlRequestKind = 'pause' | 'stop' | 'status_probe';

export interface ControlRequest {
  requestId: ControlRequestId;
  runId: RunId;
  kind: ControlRequestKind;
  requestedBy: string;                 // opaque English label; never an authorization claim
  requestedAt: IsoTimestamp;
  targetWriterEpoch: WriterEpoch;      // read from writer.lock by the requester
}

export type ControlAckStatus =
  | 'accepted' | 'superseded' | 'rejected_stale'
  | 'rejected_unsupported' | 'rejected_terminal_run';

export interface ControlAck {
  requestId: ControlRequestId;
  status: ControlAckStatus;
  observedAt: IsoTimestamp;
  runState: RunState;
  stateVersion: StateVersion;
  detail: string;                      // English
}

export interface ControlChannel {
  /** Requester side. Writes req-<requestId>.json by tmp-then-atomic-rename. */
  submit(request: ControlRequest): Promise<SubmitControlResult>;

  /** Requester side. Polls for this request's acknowledgement until the deadline. */
  awaitAck(requestId: ControlRequestId, timeoutMs: number): Promise<ControlAck | null>;

  /**
   * Supervisor side. Reads every pending request, validates it, and returns the acceptable
   * ones sorted by (requestedAt, requestId), with `stop` outranking `pause` in one pass.
   * Rejected requests are acknowledged and moved to control/consumed/ by this call.
   */
  drainPending(run: RunRecord, now: IsoTimestamp): Promise<PendingControl>;

  /** Supervisor side. Writes the acknowledgement after ControlRequestAccepted is durable. */
  acknowledge(ack: ControlAck): Promise<void>;

  /** Recovery side. Rejects and sweeps every request stale under the current epoch. */
  sweepStale(run: RunRecord, now: IsoTimestamp): Promise<ControlRequestId[]>;
}

export type SubmitControlResult =
  | { ok: true; requestId: ControlRequestId }
  | { ok: false; error: 'RunNotFound' | 'NoWriterLock' | 'RequestTooLarge' };

export interface PendingControl {
  accepted: ControlRequest[];          // in the order they must be applied
  rejected: ControlAck[];              // already acknowledged and swept
}
```

## 9. Run events for observability — declared in `state/contracts`

```ts
export interface RunEvent {
  runId: RunId;
  taskId: TaskId | null;
  level: 'debug' | 'info' | 'warn' | 'error';
  code: string;                    // stable English machine code
  message: string;                 // English
  at: IsoTimestamp;
  stateVersion: StateVersion;
  fields: Record<string, string | number | boolean | null>;
}

export interface RunEventSink {
  emit(event: RunEvent): void;
}
```

`fields` is restricted to primitives so that no structure carrying provider payloads or credentials can be emitted accidentally. TASK-006 must not place raw adapter output into `fields`; only digests, identifiers, counts, and classifications belong there.

## 10. Workspace lifecycle — declared in `state/contracts`, implemented by TASK-017

Added under TASK-016 (ADR-0011). The operations, their pre- and post-conditions, the script delegation table, the session-token rule, and the structural prohibitions are normative in [WORKSPACE-LIFECYCLE.md](WORKSPACE-LIFECYCLE.md).

```ts
/**
 * Structurally identical to FailureClass in agents/contracts. This is the second and last
 * permitted duplication: the workspace module classifies into the same closed taxonomy the
 * recovery layer acts on, while importing state/contracts only. Members must stay identical;
 * that is a review obligation on TASK-017, not a compiler check.
 */
export type WorkspaceFailureClass =
  | 'transient' | 'rate_limited' | 'timeout' | 'provider_unavailable'
  | 'invalid_request' | 'authentication' | 'quota_exhausted'
  | 'policy_refusal' | 'agent_reported_blocked' | 'unknown';

export interface WorkspaceHandle {
  workspaceId: WorkspaceId;
  runId: RunId;
  taskId: TaskId;
  attempt: number;
  ownerRole: string;
  llm: string;
  branch: string;                      // derived and validated; never from agent output
  worktreePath: string;
  repositoryRoot: string;
  lockSessionId: string | null;
  hooksVerified: boolean;
  state: WorkspaceState;
  preparedAt: IsoTimestamp | null;
}

export interface WorkspaceFailure {
  failureClass: WorkspaceFailureClass;
  code: string;                        // stable English machine code, e.g. 'HOOKS_NOT_INSTALLED'
  message: string;                     // English, redacted, never a credential or a raw script dump
  observation: string;                 // the durable artifact the class was decided from
  exitCode: number | null;
}

export interface WorkspaceLifecycle {
  prepare(request: WorkspacePrepareRequest): Promise<WorkspacePrepareResult>;
  finalize(handle: WorkspaceHandle, request: WorkspaceFinalizeRequest): Promise<WorkspaceFinalizeResult>;
  abandon(handle: WorkspaceHandle, reason: string): Promise<WorkspaceAbandonResult>;
  reconcile(runId: RunId, context: WorkspaceReconcileContext): Promise<WorkspaceReconcileResult>;
}

export interface WorkspacePrepareRequest {
  runId: RunId;
  taskId: TaskId;
  attempt: number;
  ownerRole: string;
  llm: string;
  baseRef: string;                     // integration branch at or after the dependency merge
  now: IsoTimestamp;
}

export type WorkspacePrepareResult =
  | { ok: true; handle: WorkspaceHandle; events: EventEnvelopeInput[] }
  | { ok: false; outcome: 'failed' | 'blocked'; failure: WorkspaceFailure; events: EventEnvelopeInput[] };

export interface WorkspaceFinalizeRequest {
  commitMessage: string;               // English, names the task ID
  writeScope: string[];                // the only paths that may be staged
  remote: string | null;
  integrationBranch: string;           // pull-request base
  allowLocalOnlyPublication: boolean;
  now: IsoTimestamp;
}

export type WorkspaceFinalizeResult =
  | { ok: true; publication: PublicationRecord; lockReleased: true; events: EventEnvelopeInput[] }
  | { ok: false; outcome: 'failed' | 'blocked'; failure: WorkspaceFailure; publication: PublicationRecord | null; events: EventEnvelopeInput[] };

export type WorkspaceAbandonResult =
  | { ok: true; lockReleased: boolean; worktreeRemoved: boolean; branchRetained: boolean; events: EventEnvelopeInput[] }
  | { ok: false; failure: WorkspaceFailure; events: EventEnvelopeInput[] };

export interface WorkspaceReconcileContext {
  now: IsoTimestamp;
  worktreeRoot: string;
  remote: string | null;
}

export interface WorkspaceReconcileEntry {
  workspaceId: WorkspaceId;
  taskId: TaskId;
  resolvedTo: WorkspaceState;
  unresolvedReason: WorkspaceRecord['unresolvedReason'];
  detail: string;                      // English
}

export type WorkspaceReconcileResult =
  | { ok: true; entries: WorkspaceReconcileEntry[]; events: EventEnvelopeInput[] }
  | { ok: false; failure: WorkspaceFailure; entries: WorkspaceReconcileEntry[]; events: EventEnvelopeInput[] };
```

Every operation returns `events` rather than appending them. The workspace module produces envelopes and the supervisor's append path applies them, which is the same rule that binds the scheduler and the recovery layer: only one module mutates durable state.

`prepare` and `finalize` return an `events` array even on failure, because the intent events they already made durable, and the abandonment or blocked record that follows, are part of the outcome the caller must persist.

## 11. Contract ownership summary

| Section | Contract root | Owner task | Consumed by |
|---|---|---|---|
| 1–4, 9 | `src/orchestrator/state/contracts/` | TASK-003 | TASK-005, TASK-006, TASK-007, TASK-008, TASK-017 |
| 2a, 2b | `src/orchestrator/state/contracts/` | TASK-003 | TASK-005, TASK-006, TASK-008, TASK-017 |
| 3a | `src/orchestrator/state/contracts/` | TASK-003 | TASK-003 only; no other module reads a journal line |
| 5 | `src/orchestrator/state/contracts/` | TASK-003 | TASK-005, TASK-006 |
| 6 | `src/agents/contracts/` | TASK-004 | TASK-005, TASK-006, TASK-007, TASK-008 |
| 7 | `src/orchestrator/state/contracts/` | TASK-003 | TASK-008 |
| 8 | `src/orchestrator/state/contracts/` | TASK-003 | TASK-007 |
| 10 | `src/orchestrator/state/contracts/` | TASK-003 | TASK-006, TASK-008, TASK-017 |

TASK-003 owns more contract surface than it implements. That is intentional: the contract root must exist before Wave 3 begins, and TASK-003 is the earliest module every later task depends on. TASK-003 implements only the `StateStore`; it declares the `Scheduler`, `RetryPolicy`, `TimeoutWatchdog`, `RecoveryCoordinator`, `RunController`, `ControlChannel`, and `WorkspaceLifecycle` interfaces without implementing them.

TASK-017 is added to the consumer set of `state/contracts` and appears in no row of `agents/contracts`, which is what keeps the workspace module at a single contract root.
