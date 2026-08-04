# Runtime Interface Contracts

Normative cross-module contracts for the autonomous runtime. Produced under TASK-002. This document exists so that TASK-003 through TASK-008 never negotiate an interface during execution.

**Precedence.** This document is the source of truth for every type and signature listed here. Where an implementation and this document disagree, the implementation is wrong. A task that needs a change must stop and route it through the Orchestrator as an ADR amendment, per [INTEGRATION-STRATEGY.md](INTEGRATION-STRATEGY.md).

**Transcription rule.** TASK-003 transcribes the `state/contracts` section into `src/orchestrator/state/contracts/`. TASK-004 transcribes the `agents/contracts` section into `src/agents/contracts/`. Names, field names, and string literal unions must match exactly; formatting and file splitting are the implementer's choice. Every other module imports these types and declares none of its own copies.

Language and platform are fixed by [ADR-0001](../../adr/0001-runtime-platform-and-language.md): TypeScript in strict mode on Node.js, ES modules.

## 1. Shared primitives — `state/contracts` (TASK-003)

```ts
export type RunId = string;          // "run-" + 12 lowercase hex chars + "-" + zero-padded ordinal
export type TaskId = string;         // run-scoped, matches /^T-[0-9]{4}$/
export type EffectId = string;       // sha256 hex of the effect intent payload
export type Sha256Hex = string;      // 64 lowercase hex characters
export type IsoTimestamp = string;   // RFC 3339, UTC, millisecond precision, e.g. "2026-08-04T16:51:12.395Z"

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
  dependencies: TaskId[];
  requiredGates: string[];
  state: TaskState;
  attempt: number;                     // 0 before the first DispatchStarted
  maxAttempts: number;
  idempotencyKey: Sha256Hex | null;    // key of the current attempt
  lease: LeaseRecord | null;
  notBefore: IsoTimestamp | null;      // backoff deadline while awaiting_retry
  blockedReason: string | null;
  lastFailure: FailureSummary | null;
  result: TaskResultSummary | null;
  updatedAt: IsoTimestamp;
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
  | { type: 'TaskUnblocked'; taskId: TaskId; note: string };

export interface TaskProposal {
  taskId: TaskId;
  title: string;
  ownerRole: string;
  llm: string;
  writeScope: string[];
  dependencies: TaskId[];
  requiredGates: string[];
  recordPath: string;
  parentTaskId: TaskId | null;
  maxAttempts?: number;
}
```

`RuntimeEvent` is a closed union. Adding a member is a contract change and requires an ADR amendment.

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

  releaseWriter(runId: RunId, epoch: WriterEpoch): Promise<void>;
}

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
  | { ok: true; run: RunRecord; version: StateVersion; fromCheckpoint: StateVersion; replayedEvents: number; discardedTrailingBytes: number }
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
}

export interface Scheduler {
  /**
   * Pure and deterministic. Returns candidates in dispatch order, already filtered by
   * dependency readiness, backoff deadline, concurrency limits, and write-scope exclusion.
   * Never returns more candidates than the remaining global capacity.
   */
  selectDispatchable(run: RunRecord, now: IsoTimestamp): DispatchCandidate[];

  /** Emits LeaseGranted for the candidate. Returns the token the caller must present. */
  grantLease(run: RunRecord, candidate: DispatchCandidate, now: IsoTimestamp): LeaseGrant;

  /** Emits LeaseRenewed. Fails if the presented token is not the active one. */
  renewLease(run: RunRecord, taskId: TaskId, token: FencingToken, now: IsoTimestamp): LeaseRenewal;

  releaseLease(run: RunRecord, taskId: TaskId, token: FencingToken): EventEnvelopeInput;

  /** Pure. Returns one LeaseExpired envelope per lease whose expiresAt has passed. */
  reclaimExpiredLeases(run: RunRecord, now: IsoTimestamp): EventEnvelopeInput[];
}

export type LeaseGrant =
  | { ok: true; fencingToken: FencingToken; envelope: EventEnvelopeInput }
  | { ok: false; error: 'CapacityExhausted' | 'WriteScopeConflict' | 'AlreadyLeased' | 'NotReady' };

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
  invocationId: string;
  runId: RunId;
  taskId: TaskId;
  attempt: number;
  idempotencyKey: Sha256Hex;
  role: string;
  llm: string;
  roleContractPaths: string[];     // .agents/<role>/ contract files
  taskRecordPath: string;
  worktreePath: string;
  branch: string;
  timeoutMs: number;
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
```

`agents/contracts` re-declares `RunId`, `TaskId`, `Sha256Hex`, `IsoTimestamp`, `FencingToken`, and `TaskProposal` locally as structurally identical aliases. This is the one permitted duplication: it lets TASK-004 compile in parallel with TASK-003 without an import edge between the two contract roots. TypeScript structural typing makes the two views interchangeable at every consumer.

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
  | { ok: true; run: RunRecord; version: StateVersion; reclaimedTaskIds: TaskId[]; adoptedTaskIds: TaskId[]; blockedTaskIds: TaskId[] }
  | { ok: false; error: 'NoConsistentCheckpoint' | 'WriterAlive' | 'RunNotFound' };
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

## 10. Contract ownership summary

| Section | Contract root | Owner task | Consumed by |
|---|---|---|---|
| 1–4, 9 | `src/orchestrator/state/contracts/` | TASK-003 | TASK-005, TASK-006, TASK-007, TASK-008 |
| 5 | `src/orchestrator/state/contracts/` | TASK-003 | TASK-005, TASK-006 |
| 6 | `src/agents/contracts/` | TASK-004 | TASK-005, TASK-006, TASK-008 |
| 7 | `src/orchestrator/state/contracts/` | TASK-003 | TASK-008 |
| 8 | `src/orchestrator/state/contracts/` | TASK-003 | TASK-007 |

TASK-003 owns more contract surface than it implements. That is intentional: the contract root must exist before Wave 3 begins, and TASK-003 is the earliest module every later task depends on. TASK-003 implements only the `StateStore`; it declares the `Scheduler`, `RetryPolicy`, `TimeoutWatchdog`, `RecoveryCoordinator`, and `RunController` interfaces without implementing them.
