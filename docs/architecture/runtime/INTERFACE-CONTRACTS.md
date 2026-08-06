# Runtime Interface Contracts

## Amendment register - TASK-040

TASK-040 adds no generic merge function and no shared executor implementation. It adds the merge-result append principal below and records the executor-local typed protocol in section 10b. The full authority/refusal/evidence contract is [POST-GATE-MERGE-EXECUTORS.md](POST-GATE-MERGE-EXECUTORS.md), decided by [ADR-0042](../../adr/0042-conditionally-authorized-post-gate-merge-executors.md). This is Architect-authored contract text, not TASK-041 approval.

Normative cross-module contracts for the autonomous runtime. Produced under TASK-002 and amended under TASK-016, TASK-024, TASK-028, TASK-032, TASK-034, TASK-036, and TASK-038. This document exists so that TASK-003 through TASK-008, TASK-017, and TASK-026 never negotiate an interface during execution.

## Amendment register - TASK-038

TASK-037 recorded `changes-required` for TASK-036 solely because of A-601. TASK-038 changed the existing integration evidence shape so one reviewed cumulative architecture target can close its superseded lineage cohort without replaying predecessor content. It added no runtime-event member and changed no recovery, ingress, receipt, or provider contract judged sound at round 7. [ADR-0041](../../adr/0041-cumulative-architecture-lineage-integration-unit.md) is the decision authority; TASK-039 later approved it at review commit `734bdbc`.

## Amendment register - TASK-036

TASK-035 recorded `changes-required` for TASK-034. TASK-036 is an Architect-authored amendment, not a review verdict; independent TASK-037 owns the lineage-round-7 disposition.

| Superseded shape or contradictory transcription (TASK-034) | Replaced by | Finding | Decision |
|---|---|---|---|
| `RunRecoveryCompleted` omitted three outcome fields already required by the recovery procedure and `RecoveryOutcome` | One `RecoveryCompletionEvidence` shape shared by the exact event member and successful outcome, with canonical ordering and application semantics | A-501 | [ADR-0037](../../adr/0037-recovery-completion-evidence-and-decision-block-legality.md) |
| Recovery legality was sometimes stated as one event per task even though one decision may expand to the legal `TaskTimedOut` then `RetryScheduled` sequence | One decision block per task; blocks are independent and each block's fixed sequence is applied sequentially | A-502 | [ADR-0037](../../adr/0037-recovery-completion-evidence-and-decision-block-legality.md) |
| A duplicate append returned only a `FactId`, while collector success required an `IngressEntry` | Explicit appended/deduplicated dispositions at both boundaries; collector success carries only disposition, `factId`, and the committed high-water mark it actually consumes | A-503 / HUMAN-002 Part B | [ADR-0038](../../adr/0038-total-pre-dispatch-ingress-append-dispositions.md) |
| One workspace sentence claimed the agent root re-declared receipt types, and one sequence invented `AgentRegistrationReceipt` | The nominal receipt remains declared once in the state root and crosses to the agent root only as `unknown` plus `AgentReceiptVerifier` | A-504 | [ADR-0039](../../adr/0039-single-nominal-receipt-authority-and-cross-root-conformance.md) |
| `planInvocation` returned a plan directly although unknown provider family is a classified plan failure | `WorkerPlanResult` represents success or the exact `UNKNOWN_PROVIDER_FAMILY` failure before any durable registration or process side effect | A-505 | [ADR-0040](../../adr/0040-typed-provider-planning-result-and-phase-observables.md) |

## Amendment register — TASK-034

TASK-033 recorded `changes-required` for TASK-032. TASK-034 is an Architect-authored amendment, not a review verdict; independent TASK-035 owns the lineage-round-6 disposition.

| Superseded shape or claim (TASK-032) | Replaced by | Finding | Decision |
|---|---|---|---|
| Literal task-tree fixture totals tied to an earlier target | Enumeration of the published Git target tree, with relation and enrichment totals derived by rule rather than configured as expected values | A-202 residual | [ADR-0036](../../adr/0036-target-tree-derived-architecture-fixtures-and-lineage-integration.md) |
| `build(task, currentAttemptEntries, deadline)` promised lease and adoptable-result classifications without receiving their evidence | `build(task, evidence)` receives the current writer epoch, exact current-attempt entries, deadline, and pending-result candidate through one typed public composition boundary | A-401 (A-104 residue) | [ADR-0035](../../adr/0035-explicit-reconciliation-evidence-composition-boundary.md) |
| `validateGraph` described a fixed revision-7/TASK-028 graph as current | Validation is always over the complete projected task-record set in the immutable published target tree | A-402 (A-004/A-101 residue) | [ADR-0036](../../adr/0036-target-tree-derived-architecture-fixtures-and-lineage-integration.md) |

## Amendment register — TASK-032

TASK-032 was an Architect-authored amendment, not a review verdict. TASK-033 subsequently recorded `changes-required` at lineage round 5; this historical register preserves what TASK-032 intended to amend.

| Superseded shape (TASK-028) | Replaced by | Finding | Decision |
|---|---|---|---|
| Closed nested task-document types plus top-level-only retention | Lossless raw YAML source, exact checked projection target, recursive leaf dispositions, and an inverse transform whose fixture covers TASK-013 and enriched gate relations | A-202 (A-004/A-101 views) | [ADR-0032](../../adr/0032-lossless-task-record-source-and-projection.md) |
| Any committed current-attempt effect reduced to recovery `committed` | `committed_result` only for the unique flagged committed result effect, with exact `resultEffectId` evidence and fail-closed duplicate detection | A-203 (A-104 view) | [ADR-0033](../../adr/0033-unique-committed-result-effect-recovery.md) |
| `spawnOwned` promised a proof refusal that its result union omitted | Shared `RegistrationNotDurableRefusal` in `WorkerBeginResult` and `SpawnOwnedResult` | A-206 (A-102 view) | [ADR-0034](../../adr/0034-spawn-owned-registration-proof-refusal.md) |

**Precedence.** This document is the source of truth for every type and signature listed here. Where an implementation and this document disagree, the implementation is wrong. A task that needs a change must stop and route it through the Orchestrator as an ADR amendment, per [INTEGRATION-STRATEGY.md](INTEGRATION-STRATEGY.md).

**Transcription rule.** TASK-003 transcribes the `state/contracts` section into `src/orchestrator/state/contracts/`. TASK-004 transcribes the `agents/contracts` section into `src/agents/contracts/`. Names, field names, and string literal unions must match exactly; formatting and file splitting are the implementer's choice. Every other module imports these types and declares none of its own copies.

Language and platform are fixed by [ADR-0001](../../adr/0001-runtime-platform-and-language.md): TypeScript in strict mode on Node.js, ES modules.

## Amendment register — TASK-028

Every type carrying a `// TASK-028` marker is new or changed by this amendment. TASK-025 recorded findings A-201 through A-209 against the TASK-024 shapes. This register names each replacement; A-209 concerned execution provenance and was corrected outside this architecture scope.

| Superseded shape (TASK-024) | Replaced by | Finding | Decision |
|---|---|---|---|
| `IngressEntry.consumedBy` and string-valued `appendedBy`; no named bootstrap contract | Immutable entries, a closed `IngressAppendPrincipal`, and required `BootstrapDispatchContract` | A-201 | [ADR-0023](../../adr/0023-immutable-ingress-entries-and-named-bootstrap-dispatch-contracts.md) |
| Claim that committed YAML loads name-for-name into runtime records | `TaskRecordDocumentSource` plus total `TaskRecordProjection` into `TaskProposal` | A-202 | [ADR-0024](../../adr/0024-task-record-projection-contract.md) |
| Result-effect flag present only on the ledger entry | Required `EffectIntentRecorded.isTaskResultEffect` with uniqueness and ordering guards | A-203 | [ADR-0025](../../adr/0025-result-effect-identity-in-the-event-union.md) |
| Blocked drain with no legal attach and recovery selecting absent closures only | Attach from both blocked states and recovery over every unverified closure | A-204 | [ADR-0026](../../adr/0026-blocked-drain-attach-and-unverified-closure-recovery.md) |
| One-call finalize releasing before the supervisor can persist publication identity | `executeFinalize` publish phase plus receipt-gated `completeFinalize` | A-205 | [ADR-0027](../../adr/0027-finalize-split-around-the-publication-append.md) |
| Structural, identity-poor durable receipts | Discriminated, identity-bearing, nominal and store-verifiable receipts | A-206 | [ADR-0028](../../adr/0028-nominal-store-issued-durable-append-receipts.md) |
| High-water integers with no owned delivery of entries | Scheduling-owned `IngressObserver.deliver` and invocation-carried `IngressDelivery` | A-207 | [ADR-0029](../../adr/0029-ingress-delivery-ownership.md) |
| Recovery described over four inputs while rows and tests use six | Canonical six-member `ReconciliationInput` | A-208 | [ADR-0030](../../adr/0030-one-canonical-recovery-decision-input-domain.md) |
| Interim operator bootstrap with no autonomous producer | Runtime-owned pre-dispatch validator/collector and scheduling-owned high-water signal | HUMAN-002 | [ADR-0031](../../adr/0031-pre-dispatch-ingress-observer-and-collector.md) |

## Amendment register — TASK-024

Every type carrying a `// TASK-024` marker is new or changed by this amendment. TASK-020 recorded findings A-101 through A-105 against the TASK-016 shapes in `reports/code-review/TASK-016-ARCHITECTURE-AMENDMENT-REVIEW.md`; this register names each superseded shape so there is exactly one normative reading of every contract. Nothing below is a silent rewrite: each row names what it supersedes.

| Superseded shape (TASK-016) | Replaced by | Finding | Decision |
|---|---|---|---|
| `RunLimits.allowLocalOnlyPublication`, a run-global boolean | `PublicationClass` as a declared per-task field with two disjoint satisfying conditions, section 2a | A-101 | [ADR-0018](../../adr/0018-publication-classes-and-gate-lineages.md) supersedes part of ADR-0015 |
| `TaskDependency` with one `gate_passed` member carrying `task` and `gate` and no round | Two disambiguated members — the **target form** with `task`, `gate`, `round`, and the **lineage form** with `lineage`, `gate`, `lineageRound`. The owner form is withdrawn and rejected at load | A-101 | [ADR-0018](../../adr/0018-publication-classes-and-gate-lineages.md) |
| `TaskRecord.gateFor: GateTarget \| null`, singular | `gateFor: GateTarget[]`, plural. One gate task carries one or more relations and records exactly one verdict, applied atomically to every relation | A-101 | [ADR-0018](../../adr/0018-publication-classes-and-gate-lineages.md) |
| `GateAssignment` and `GateTarget` with `gate`, `gateTaskId`/`task`, and `round` only | Both carry `gateClass`, `retrospective`, `gateLineage`, and `lineageRound`, and must agree pairwise on all seven fields | A-101 | [ADR-0018](../../adr/0018-publication-classes-and-gate-lineages.md) |
| No representation of a gate lineage | `GateLineageRecord`, `GateLineageRoundRecord`, `run.gateLineages`, and three declaring events, section 2a | A-101 | [ADR-0018](../../adr/0018-publication-classes-and-gate-lineages.md) |
| `GraphViolation` over five no-deadlock invariants | Eight invariants, including form resolution and lineage well-formedness, section 5 | A-101 | [ADR-0018](../../adr/0018-publication-classes-and-gate-lineages.md) |
| `run.activationEvents`, `run.nextActivationSeq`, `ActivationEventRecord`, `ActivationSpec.pendingThroughSeq`, `ActivationEventAppended`, and `TaskActivated.throughSeq` | The three ingress surfaces — a durable append-only `IngressInbox`, a cursor-only `ActivationSpec`, and an append-only consumption ledger — in new section 2b | A-101, F-301 | [ADR-0017](../../adr/0017-durable-ingress-inbox-and-ingress-epochs.md) supersedes part of ADR-0015 |
| `AgentWorker.execute`, one opaque call whose contract required the caller to have appended `ProcessGroupRegistered` with no way to prove it | A three-phase handshake — `planInvocation`, `beginInvocation` behind an opaque value accepted only by the narrowed store verifier, `completeInvocation` — in section 6 | A-102, A-206 | [ADR-0019](../../adr/0019-durable-intent-receipts-for-side-effects.md), amended by [ADR-0028](../../adr/0028-nominal-store-issued-durable-append-receipts.md) |
| `WorkspaceLifecycle.prepare`, `finalize`, and `abandon` as single calls that returned their intent events only after the operation | Split `plan*`/`execute*` phases behind a `WorkspaceIntentReceipt`, plus the new `WorkspaceAbandonIntended` event that enters `abandoning`, in section 10 | A-103 | [ADR-0019](../../adr/0019-durable-intent-receipts-for-side-effects.md) supersedes part of ADR-0011 |
| A committed effect retaining only `resultDigest`, from which recovery was required to build `WorkerSucceeded` | `AdoptableResult`, `run.pendingResults`, and the `WorkerResultRecorded` event appended **before** `EffectCommitted` | A-104 | [ADR-0020](../../adr/0020-durable-adoptable-results-for-recovery.md) supersedes part of ADR-0013 |
| `RunDrainCompleted` emitted while an `orphan_unresolved` descendant survived | `RunDrainBlocked`, a non-success drain outcome; `RunDrainCompleted` requires verified closure of every invocation of the epoch | A-102 | [ADR-0022](../../adr/0022-unqualified-drain-closure.md) supersedes part of ADR-0014 |
| `RunLimits`, twenty-two fields | Twenty-five; `allowLocalOnlyPublication` is removed and four ingress and drain limits are added | A-101, A-102 | ADR-0017, ADR-0022 |
| `RuntimeEvent`, 44 members | 52 members; the additions and the three withdrawals are marked in section 3 | A-101 … A-104 | ADR-0017 … ADR-0022 |

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
export type TaskId = string;         // /^T-[0-9]{4}$/ in a run; /^TASK-[0-9]{3,}$/ for committed framework records projected at bootstrap
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

// TASK-024 additions
export type GateLineageId = string;  // matches /^LIN-[A-Z0-9-]+$/, e.g. "LIN-ARCH-REVIEW"
export type ActivationId = string;   // run-scoped identity of one activation, matches /^act-[0-9a-f]{16}$/
export type FactId = Sha256Hex;      // an ingress entry's identity; see section 2b
export type IngressSeq = number;     // stable monotonic inbox position, assigned once at append; 0 means "empty"
export type IngressEpoch = number;   // >= 1; declared by a numbered model correction

/** TASK-024 — withdrawn. `ActivationSeq` was a per-run counter over `run.activationEvents`,
 *  which section 2b replaces with the durable inbox. Use `IngressSeq`. */
// export type ActivationSeq = number;

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

  // TASK-024 — ingress inbox (ADR-0017)
  ingressAppendBatchMaxEntries: number;   // default 256
  ingressObserveIntervalMs: number;       // default 5_000
  ingressConsumeMaxEntries: number;       // default 256

  // TASK-024 — drain closure (ADR-0022)
  /** Total budget for verified closure of every invocation of the epoch, across escalation
   *  rounds. Exceeding it produces RunDrainBlocked, never RunDrainCompleted. */
  processTreeCloseTotalBudgetMs: number;  // default 60_000
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
  invocations: Record<InvocationId, InvocationRecord>;     // process-tree register (ADR-0014)
  workspaces: Record<WorkspaceId, WorkspaceRecord>;        // workspace register (ADR-0011)
  acceptedControlRequests: AcceptedControlRequest[];       // append-only (ADR-0014)
  humanDecisions: HumanDecisionRecord[];                   // append-only (ADR-0015)

  // TASK-024 additions
  gateLineages: Record<GateLineageId, GateLineageRecord>;  // append-only register (ADR-0018)
  /** The producer-side high-water mark of the ingress inbox, `max(seq)` over every entry of
   *  every epoch, or 0 when the inbox is empty. Non-decreasing for the life of the run.
   *  It is NOT consumption state; consumption state is the per-task cursor and nothing else. */
  ingressSeq: IngressSeq;                                  // starts at 0 (ADR-0017)
  ingressEpochs: IngressEpochRecord[];                     // append-only, ordered by epoch (ADR-0017)
  /** Append-only consumption ledger. One row per consumed entry, created already consumed and
   *  already stamped with its consuming activation. No row is ever edited. (ADR-0017) */
  ingressConsumptionLedger: IngressConsumptionRow[];
  /** Durable adoptable results, keyed by task. Written before the result effect is committed,
   *  so recovery can reconstruct a complete `WorkerSucceeded`. (ADR-0020) */
  pendingResults: Record<TaskId, AdoptableResult>;
}

/** TASK-024 — withdrawn from `RunRecord`. `nextActivationSeq` and `activationEvents` modelled
 *  activation as an internal queue; section 2b replaces both with the durable ingress inbox,
 *  whose positions are assigned by the inbox and never by `applyEvent`. */

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
  gateVerdicts: GateVerdictRecord[];   // append-only; a later round supersedes, never rewrites
  resourceLock: string | null;         // named lock serializing non-disjoint scopes
  publication: PublicationRecord | null;   // durable review_ready evidence
  integration: IntegrationRecord | null;   // durable integrated evidence
  activation: ActivationSpec | null;   // event-triggered recurring work
  workspaceId: WorkspaceId | null;     // workspace of the current attempt

  // TASK-024 additions
  /** TASK-024 — was `gateFor: GateTarget | null`. A gate task carries one or more relations;
   *  `[]` means the task is not a gate task. It records exactly one verdict and applies it
   *  atomically to every relation here. TASK-025 carries three. */
  gateFor: GateTarget[];
  /** TASK-024 — replaces the run-global `limits.allowLocalOnlyPublication`. Declared, never
   *  inferred; a record that omits it is rejected by the graph validator. */
  publicationClass: PublicationClass;
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
  /** TASK-024. True for the one entry per attempt that registers the task's own result effect.
   *  Recovery reads `run.pendingResults[taskId]` only for an entry carrying this flag. */
  isTaskResultEffect: boolean;         // TASK-024 (ADR-0020)
}

/**
 * TASK-024 (ADR-0020). The complete, durable, adoptable result of one attempt. Recorded by
 * `WorkerResultRecorded` **before** the attempt's result effect is committed, so a crash in the
 * window A-104 named leaves recovery everything `WorkerSucceeded` requires. It changes no task
 * state; it is evidence, not a transition.
 */
export interface AdoptableResult {
  taskId: TaskId;
  attempt: number;
  idempotencyKey: Sha256Hex;
  fencingToken: FencingToken;
  result: TaskResultSummary;           // artifact paths, digest, summary, completedAt
  proposedTasks: TaskProposal[];       // never summarized to a digest; see ADR-0020
  recordedAt: IsoTimestamp;
}
```

`TaskResultSummary` already carries `artifactPaths`, `resultDigest`, `summary`, and `completedAt`, so `AdoptableResult` adds exactly the two things a `resultDigest` cannot reconstruct: the summary itself and `proposedTasks`. Losing `proposedTasks` can change the terminal task graph, which is why they are stored verbatim rather than as a digest.

## 2a. Typed dependencies, gates, and gate lineages — `state/contracts` (TASK-003)

Added under TASK-016 to resolve A-004 and amended under TASK-024 and TASK-028. Committed YAML does **not** compile into runtime records name-for-name. Section 2c defines the only legal projection from the exact snake_case document vocabulary into `TaskProposal`; `TaskRecord` is created only by applying `TaskCreated`. The satisfying condition of each edge is normative in [STATE-MACHINE.md](STATE-MACHINE.md#typed-dependency-edges).

```ts
export type DependencyEdgeKind =
  | 'review_ready' | 'integrated' | 'gate_passed'
  | 'gate_recorded' | 'human_decision' | 'terminal';

/**
 * TASK-024. `gate_passed` has exactly two surviving forms, disambiguated by which of `task`
 * and `lineage` is present. Invariant 6 in section 5 rejects an edge declaring neither or both.
 * The **owner form** — a `gate_passed` edge naming a task that declares the gate only in a
 * `gateFor` entry — is withdrawn and is rejected at load with a message directing it to the
 * lineage form. See ADR-0018 and finding F-302.
 */
export type TaskDependency =
  | { edge: 'review_ready'; task: TaskId }
  | { edge: 'integrated'; task: TaskId }
  | { edge: 'gate_passed'; task: TaskId; gate: GateName; round?: number }              // target form
  | { edge: 'gate_passed'; lineage: GateLineageId; gate: GateName; lineageRound?: number } // lineage form
  | { edge: 'gate_recorded'; task: TaskId }
  | { edge: 'human_decision'; decision: HumanDecisionId }
  | { edge: 'terminal'; task: TaskId };

/** `round` and `lineageRound` default to 1 when a record omits them. The loader normalizes
 *  the omission once, at admission, so every stored edge carries an explicit value. */
export const DEFAULT_GATE_ROUND = 1;

export type GateVerdict =
  | 'approved' | 'approved-with-findings'
  | 'changes-required' | 'formally-accepted';

/** TASK-028. The YAML declaration may be pending; durable runtime authority never is. */
export type DeclaredGateVerdict = GateVerdict | 'pending';

/** TASK-024. Scheduling timeliness of one gate pair. Computed and declared; a mismatch is
 *  rejected at load by invariant 7. */
export type GateClass = 'point' | 'aggregate';

/** Scheduling and lineage properties shared by a declaration and its durable verdict. */
export interface GateLineageProperties {
  gateClass: GateClass;
  /** True exactly when the gate is not in the target's `preMergeGates`. */
  retrospective: boolean;
  gateLineage: GateLineageId;
  lineageRound: number;                // >= 1
}

/** TASK-028. The document-declared properties that must agree on both pair sides. */
export interface GatePairProperties extends GateLineageProperties {
  /** Projected losslessly from each gate_for/gate_tasks relation. It is checked against, but
   *  never replaces, the authoritative GateVerdictRecorded lineage state. */
  declaredVerdict: DeclaredGateVerdict;
}

/** The target's view: who gates this task, at which round, under which lineage. */
export interface GateAssignment extends GatePairProperties {
  gate: GateName;
  gateTaskId: TaskId;
  round: number;                       // >= 1; defaults to 1 when a record omits it
}

/** The gate task's view. One entry per relation the gate task carries.
 *  Must agree with the target's `GateAssignment` on all eight fields. */
export interface GateTarget extends GatePairProperties {
  task: TaskId;
  gate: GateName;
  round: number;
}

/** Append-only. A later round supersedes an earlier one; both stay recorded. */
export interface GateVerdictRecord extends GateLineageProperties {
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

/**
 * TASK-024 (ADR-0018). A gate lineage is the durable relation between one gate name and one
 * cohort of gated artifacts, held across every round and across every successive gate task
 * that records a round of it. It is what survives supersession, so no consumer edge has to be
 * retargeted when a `changes-required` verdict is superseded by a new gate task.
 */
export interface GateLineageRecord {
  lineage: GateLineageId;
  gate: GateName;                      // constant within a lineage
  cohort: TaskId[];                    // append-only, in the order artifacts joined; never shrinks
  rounds: GateLineageRoundRecord[];    // append-only; declared rounds are 1 … k with no gap
  declaredAt: IsoTimestamp;
}

export interface GateLineageRoundRecord {
  lineageRound: number;                // >= 1
  gateTaskId: TaskId;                  // exactly one gate task records a given lineage round
  verdict: GateVerdict | null;         // null until the round's verdict is recorded
  recordedAt: IsoTimestamp | null;
}

/**
 * TASK-024 (ADR-0018). Replaces the run-global `allowLocalOnlyPublication` flag with a declared
 * per-task class. The two classes have disjoint satisfying conditions, normative in
 * STATE-MACHINE.md; a `local-only` publication never satisfies `review_ready` for a `runtime`
 * task, and an unavailable remote is a `blocked` outcome for one rather than a success.
 */
export type PublicationClass = 'runtime' | 'bootstrap';

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

/** TASK-038 (ADR-0041). Durable evidence for a content merge or for lifecycle closure
 *  by exact cumulative-lineage subsumption. Both forms name the one resulting commit. */
export type IntegrationRecord =
  | {
      disposition: 'content-merged';
      integrationBranch: string;
      mergedCommit: string;
      sourceTaskId: TaskId;             // equals the TaskRecord that owns this record
      sourcePublishedCommit: string;
      lineage: GateLineageId | null;    // both lineage fields are set for a cumulative target
      lineageRound: number | null;      // both are null for an ordinary task
      mergedAt: IsoTimestamp;
    }
  | {
      disposition: 'lineage-subsumed';
      integrationBranch: string;
      mergedCommit: string;
      sourceTaskId: TaskId;             // latest passing cumulative target
      sourcePublishedCommit: string;
      lineage: GateLineageId;
      lineageRound: number;
      mergedAt: IsoTimestamp;
    };

export interface HumanDecisionRecord {
  decisionId: HumanDecisionId;
  commit: string;                      // tracked commit on a non-agent branch
  summary: string;                     // English
  recordedAt: IsoTimestamp;
}

/**
 * TASK-024 (ADR-0017). The activation spec of an event-triggered recurring task. Consumption
 * state is represented by **the cursor and nothing else**: `pendingThroughSeq` is withdrawn,
 * because a second field holding half the consumption state is what finding A-101 recorded.
 * The range an activation consumes is `(lastConsumedEventSeq, run.ingressSeq]`, recomputed at
 * consumption time rather than reserved in advance.
 */
export interface ActivationSpec {
  mode: 'event-triggered';
  subscribedEventTypes: IngressEventType[];      // non-empty; see section 2b
  /** TASK-028. Required and never defaulted. Admission refuses an omitted or unsatisfied
   *  declaration; see ADR-0023 and ADR-0031. */
  bootstrapDispatchContract: BootstrapDispatchContract;
  /** THE cursor. Monotonically non-decreasing; `applyEvent` rejects any event that would
   *  lower it, and rejects a restored record in which it exceeds `run.ingressSeq`. */
  lastConsumedEventSeq: IngressSeq;
  state: 'quiescent' | 'pending_activation' | 'consuming';
}
```

`gateVerdicts`, `gateLineages`, `ingressEpochs`, `ingressConsumptionLedger`, `acceptedControlRequests`, and `humanDecisions` are append-only by contract. No event in the union expresses removing or mutating an existing member of any of them, which is what makes a recorded verdict, a lineage round, and a consumption row durable structurally rather than by convention.

## 2b. The four ingress surfaces — `state/contracts` (TASK-003)

Added under TASK-024 to resolve A-101 and the contract representation of F-301. It supersedes the TASK-016 model in which `ActivationEventAppended` created rows in `run.activationEvents` and the recurring task consumed them through `pendingThroughSeq`.

There are exactly four surfaces. TASK-026 owns durability and append; TASK-005 owns observation and delivery; neither may perform the other's half.

| Surface | What it is | Who may write it | Who reads it |
|---|---|---|---|
| **Ingress inbox** | A durable, append-only store of ingress **entries**, owned by the module at `src/orchestrator/ingress/` | The ingress adapters, on behalf of the producing owners. No write under `tasks/` is required or permitted to append one | The ingress observer in `src/orchestrator/scheduling/` |
| **Ingress cursor** | `TaskRecord.activation.lastConsumedEventSeq` | The consuming activation, in the same batch as its effects | The ingress observer |
| **Consumption ledger** | `run.ingressConsumptionLedger` | The consuming activation, append-only, one row per consumed entry, written already consumed | Reviewers and operators, as durable provenance |
| **Ingress delivery** | One ephemeral `IngressDelivery` containing the exact immutable range supplied to an activation | `IngressObserver.deliver` in scheduling; never the activation | The supervisor for the ledger projection and `AgentInvocation.ingress` for the consumer |

The inbox is not a Git ref scan, not a commit count, and not a file under `tasks/`. The ledger is a record of consumption, not a queue and not the inbox: a row is created already stamped with its consuming activation, so no row is ever edited and `consumedBy` is never mutated.

```ts
/** The closed ingress source set. Order is meaningless here; precedence is the constant below. */
export type IngressEventType =
  | 'human_decision_recorded' | 'branch_integrated' | 'gate_verdict_recorded'
  | 'remediation_completed' | 'dependency_unsatisfiable' | 'artifact_published';

/** TASK-028. Required on every recurring activation; admission never defaults it. */
export type BootstrapDispatchContract =
  | 'durable-bootstrap-append'
  | 'interim-operator-authorized';

/** TASK-028. Closed append authority. No member denotes an activation, recurring task,
 *  operator, Orchestrator, or supervisor. */
export type IngressAppendPrincipal =
  | { kind: 'ingress_adapter'; eventType: IngressEventType; adapterId: string }
  | { kind: 'pre_dispatch_collector'; collectorId: 'runtime-pre-dispatch-ingress' }
  | {
      kind: 'merge_result_adapter';
      executor: 'task_integration' | 'release_main';
      adapterId: 'runtime-merge-result-ingress';
    };

export interface IngressAppendContext {
  phase: 'bootstrap' | 'runtime';
  bootstrapDispatchContract: BootstrapDispatchContract | null;
}

/**
 * Normative class precedence, highest first. A source commit matching several classes produces
 * exactly **one** entry, typed by the earliest member of this array that it matches. Distinct
 * commits are distinct facts even when they express one logical step.
 */
export const INGRESS_CLASS_PRECEDENCE = [
  'human_decision_recorded',
  'branch_integrated',
  'gate_verdict_recorded',
  'remediation_completed',
  'dependency_unsatisfiable',
  'artifact_published',
] as const satisfies readonly IngressEventType[];

/** One durable inbox entry. Every field is written once at append and never recomputed. */
export interface IngressEntry {
  /** Stable monotonic position, assigned **once** at append and never recomputed. It is not a
   *  count of anything outside the inbox and it is never derived from an observable ref. */
  seq: IngressSeq;
  epoch: IngressEpoch;                 // the epoch that assigned this seq
  /** SHA-256 over the canonical identity tuple below. The entry's identity and the
   *  deduplication key. */
  factId: FactId;
  /** SHA-256 over the bytes of the source artifact at the source commit. Lets a later reader
   *  detect that `sourcePath` was rewritten since the append; that detection is a finding,
   *  never a silent renumbering. */
  contentHash: Sha256Hex;
  eventType: IngressEventType;         // the single class the fact resolves to after precedence
  producerTask: TaskId;
  producerRole: string;
  /** Provenance only. `sourceCommit` and `sourcePath` identify where the fact came from; they
   *  never determine its position. */
  sourceCommit: string;                // 40 lowercase hex
  sourcePath: string;                  // repository-relative
  appendedBy: IngressAppendPrincipal;  // typed principal accepted by the append authorization table
  /** Provenance only. Explicitly **not** an ordering input; see `IngressFactCandidate`. */
  appendedAt: IsoTimestamp;
}

/**
 * What an adapter offers the inbox. It carries **no timestamp**, so a timestamp cannot be an
 * ordering input even by mistake, and it carries every class the commit matched, so precedence
 * is resolved in one place — the inbox — rather than separately in each adapter.
 */
export interface IngressFactCandidate {
  matchedClasses: IngressEventType[];  // non-empty; the inbox applies INGRESS_CLASS_PRECEDENCE
  producerTask: TaskId;
  producerRole: string;
  sourceCommit: string;
  sourcePath: string;
  contentHash: Sha256Hex;
}

/** An epoch declares the observation model that assigned its positions. */
export interface IngressEpochRecord {
  epoch: IngressEpoch;
  /** The previous epoch's high-water mark. The epoch's first entry takes `seqBase + 1`, so the
   *  cursor is monotonic across the boundary and never runs ahead of the observed facts. */
  seqBase: IngressSeq;
  model: string;                       // English description of the observation model
  declaredBy: string;                  // the numbered model correction that declared it
  status: 'active' | 'sealed';
  declaredAt: IsoTimestamp;
  sealedAt: IsoTimestamp | null;
}

/** One row of the consumption ledger. Created already consumed; never edited. */
export interface IngressConsumptionRow {
  seq: IngressSeq;
  epoch: IngressEpoch;
  factId: FactId;
  contentHash: Sha256Hex;
  eventType: IngressEventType;
  producerTask: TaskId;
  producerRole: string;
  sourceCommit: string;
  sourcePath: string;
  consumedBy: ActivationId;            // stamped at creation
  consumedAt: IsoTimestamp;
}
```

### The canonical identity tuple

`factId` is the lowercase hexadecimal SHA-256 of this exact byte sequence: UTF-8, LF separators, one trailing LF.

```text
epoch=<n>
event_type=<eventType>
producer_task=<TaskId>
source_commit=<40-hex commit id>
source_path=<repository-relative path>
content_hash=<64-hex>
```

Identity is a function of the fact, never of when it was discovered. `seq`, `appendedBy`, and `appendedAt` are deliberately absent from it. An inbox entry has no consumption field of any kind.

### The inbox interface

```ts
export interface IngressInbox {
  /**
   * Identity-keyed, crash-safe append. For each candidate the inbox resolves its class by
   * `INGRESS_CLASS_PRECEDENCE`, computes `factId`, and appends only when that `factId` is not
   * already present — so re-observing a fact is a no-op and a fact can never be counted twice.
   * Within one call, candidates are ordered by **ascending `sourceCommit` identifier**, a total
   * order independent of refs, of branch existence, and of clocks. Committer timestamps are
   * never used and are not accepted as an input.
   * Two candidates sharing a `sourceCommit` collapse to one entry by precedence.
   */
  append(
    principal: IngressAppendPrincipal,
    context: IngressAppendContext,
    batch: IngressFactCandidate[],
  ): Promise<IngressAppendResult>;

  /**
   * `max(seq)` over every entry of every epoch, or 0 when the inbox is empty. Non-decreasing
   * for the life of the run. It reads no Git ref, so branch deletion, force-push, rebase, and
   * clock skew cannot change it.
   */
  highWaterMark(): Promise<IngressSeq>;

  /** Entries in the contiguous range `(afterSeq, throughSeq]`, ascending by `seq`. */
  read(afterSeq: IngressSeq, throughSeq: IngressSeq): Promise<IngressEntry[]>;

  /**
   * Declares the next epoch with `seqBase` equal to the current high-water mark and seals the
   * previous one. Entries of a previous epoch are never re-derived, renumbered, reclassified,
   * or edited; there is no operation on this interface that expresses any of those.
   */
  declareEpoch(declaration: IngressEpochDeclaration): Promise<IngressEpochResult>;

  epochs(): Promise<IngressEpochRecord[]>;
}

export interface IngressEpochDeclaration {
  model: string;                       // English
  declaredBy: string;                  // the numbered model correction
  now: IsoTimestamp;
}

export type IngressAppendDisposition =
  | { disposition: 'appended'; entry: IngressEntry }
  | { disposition: 'deduplicated'; factId: FactId };

export type IngressAppendResult =
  | {
      ok: true;
      /** Exactly one result for each candidate remaining after same-commit precedence collapse,
       * in the same deterministic order. A duplicate needs no fabricated entry or range read. */
      dispositions: readonly IngressAppendDisposition[];
      highWaterMark: IngressSeq;
    }
  | { ok: false; error: 'UnauthorizedPrincipal'; principal: IngressAppendPrincipal; context: IngressAppendContext }
  | { ok: false; error: 'SelfExcludedProducer'; factId: FactId }
  | { ok: false; error: 'UnknownClass' | 'MalformedCandidate'; detail: string }
  | { ok: false; error: 'NoActiveEpoch' };

export type IngressEpochResult =
  | { ok: true; sealed: IngressEpochRecord | null; active: IngressEpochRecord }
  | { ok: false; error: 'EpochAlreadyActive' | 'MalformedDeclaration'; detail: string };

/**
 * Adapter configuration. `consumerTaskId` and `consumerBranch` are what make self-exclusion
 * structural: a commit authored by the consuming activation on its own branch is never an
 * ingress fact under any class. The adapter does not offer it, and `append` rejects it with
 * `SelfExcludedProducer` if it is offered anyway. This is what makes quiescence after an
 * activation demonstrable rather than assumed — an activation's own effects commit cannot
 * raise `ingressSeq`.
 */
export interface IngressAdapterConfig {
  consumerTaskId: TaskId;
  consumerBranch: string;
  sources: IngressSourceClass[];       // one per member of IngressEventType
}

export interface IngressSourceClass {
  eventType: IngressEventType;
  producerRoles: string[];             // the roles permitted to produce this class
  pathScope: string[];                 // the producing owner's own write scope
}

// TASK-028 (ADR-0031) — external fact validation and pre-dispatch collection, owned by TASK-026.
export interface ExternalIngressSourceFact {
  matchedClasses: IngressEventType[];
  producerTask: TaskId;
  producerRole: string;
  sourceCommit: string;
  sourcePath: string;
  contentHash: Sha256Hex;
}

export interface PreDispatchIngressValidator {
  validate(fact: ExternalIngressSourceFact): IngressValidationResult;
}

export type IngressValidationResult =
  | { ok: true; candidate: IngressFactCandidate }
  | { ok: false; error: 'MalformedExternalFact' | 'UnauthorizedProducer' | 'SelfExcludedProducer'; detail: string };

export interface PreDispatchIngressCollector {
  /** Validates, then appends through IngressInbox under the pre_dispatch_collector principal.
   *  It never signals scheduling directly; the returned mark is the only exposed output. */
  collect(fact: ExternalIngressSourceFact, context: IngressAppendContext): Promise<PreDispatchCollectResult>;
}

export type PreDispatchCollectResult =
  | { ok: true; disposition: 'appended'; factId: FactId; highWaterMark: IngressSeq }
  | { ok: true; disposition: 'deduplicated'; factId: FactId; highWaterMark: IngressSeq }
  | { ok: false; stage: 'validation' | 'append'; code: string; detail: string };

// TASK-040 — owned by TASK-026. Executors publish evidence and never receive this capability.
export interface ExternalMergeResultFact {
  executor: 'task_integration' | 'release_main';
  evidenceRef: string;
  evidenceDigest: Sha256Hex;
  producerTask: TaskId;
  producerRole: 'runtime' | 'devops';
  sourceCommit: string;
  sourcePath: string;
  contentHash: Sha256Hex;
  headOid: string;
  baseOid: string;
  mergedCommitOid: string;
  resultingTreeOid: string;
  terminalOutcome: 'merged' | 'recovered_merged';
}

export interface MergeResultIngressAdapter {
  /** Validates a terminal evidence record, then appends exactly one branch_integrated candidate
   * through IngressInbox under its own principal. It never accepts a planned, retry, unknown,
   * refused, or unverifiable outcome. */
  collect(fact: ExternalMergeResultFact): Promise<MergeResultCollectResult>;
}

export type MergeResultCollectResult =
  | { ok: true; disposition: 'appended' | 'deduplicated'; factId: FactId; highWaterMark: IngressSeq }
  | { ok: false; error: 'EvidenceInvalid' | 'OutcomeNotTerminal' | 'UnauthorizedExecutor' | 'AppendFailed'; detail: string };

// TASK-028 (ADR-0029/0031) — signalling, observation, and delivery, owned by TASK-005.
export interface IngressHighWaterSignal {
  signal(highWaterMark: IngressSeq): Promise<{ ok: true } | { ok: false; error: 'SignalRegressed' }>;
}

export interface IngressObservation {
  highWaterMark: IngressSeq;
  observedEvent: EventEnvelopeInput;   // IngressHighWaterMarkObserved
}

export interface IngressDelivery {
  taskId: TaskId;
  activationId: ActivationId;
  fromSeq: IngressSeq;
  throughSeq: IngressSeq;
  entries: readonly IngressEntry[];    // exact immutable range, ascending by seq
}

export interface IngressObserver {
  observe(expectedMinimum: IngressSeq): Promise<IngressObservationResult>;
  deliver(
    run: RunRecord,
    taskId: TaskId,
    activationId: ActivationId,
    throughSeq: IngressSeq,
  ): Promise<IngressDeliveryResult>;
}

export type IngressObservationResult =
  | { ok: true; observation: IngressObservation }
  | { ok: false; error: 'BootstrapContractUnsatisfied' | 'SignalNotObserved'; detail: string };

export type IngressDeliveryResult =
  | { ok: true; delivery: IngressDelivery }
  | { ok: false; error: 'CursorMismatch' | 'RangeNotContiguous' | 'ActivationNotDurable'; detail: string };
```

### The rules the interface encodes

1. **Identity-keyed append with a total disposition.** An entry is appended only if its `factId` is absent. Re-observation returns `deduplicated` for that same identity, so appending is idempotent and every normalized candidate has one success disposition. The collector does not need an entry or a `seq`; it exposes the disposition, identity, and committed mark the supervisor actually consumes.
2. **Append-stable positions.** `seq` is assigned in append order and never changes. A fact discovered late — a backdated commit, a branch published after the fact, a historical commit nobody had scanned — receives the **next free `seq`**. Nothing is ever inserted before an existing entry, so `ingressSeq = max(seq)` is non-decreasing for the life of the run.
3. **Batch order.** Ascending `sourceCommit` identifier, never a timestamp. `IngressFactCandidate` has no timestamp field, so the rule is unrepresentable to violate.
4. **Reference independence and retention.** An entry outlives the ref that carried its source commit. Deleting, rewriting, or garbage-collecting a branch cannot remove an entry and therefore cannot lower `ingressSeq`.
5. **Class precedence.** One commit, at most one entry, typed by the highest-precedence class it matched.
6. **Self-exclusion.** The consuming activation is a consumer, not a producer, and its own commits are never facts.
7. **The cursor.** `ingressSeq = max(seq)`, or 0 when empty. **Dispatchable:** `ingressSeq > activation.lastConsumedEventSeq`. **Quiescent:** equal. **Invalid:** `lastConsumedEventSeq > ingressSeq`, rejected at load.
8. **Exactly-once consumption.** An activation consumes `(lastConsumedEventSeq, ingressSeq]`. The effects, the ledger rows for the consumed range, and the cursor advance are applied in **one batch**. If the batch does not land, the cursor is unchanged, no ledger row exists, and the same range is consumed again by the next activation with identical effects, because every transition a control-plane activation performs is idempotent.
9. **Epochs.** A new epoch is declared only by a numbered model correction, takes `seqBase` from the previous epoch's high-water mark, and never re-derives, renumbers, reclassifies, or edits a prior epoch's entries.
10. **Append authorization.** Runtime accepts an `ingress_adapter` matching the entry class, or `merge_result_adapter` only for a verified `branch_integrated` terminal merge result. Bootstrap under `durable-bootstrap-append` accepts only `pre_dispatch_collector`; bootstrap under `interim-operator-authorized` accepts no append principal at all. An executor, activation, recurring task, Orchestrator, supervisor, scheduler, and operator remain outside the union. Every other combination returns `UnauthorizedPrincipal`.
11. **Pre-selection durability.** Under `durable-bootstrap-append`, validation, identity-keyed append, high-water signalling, and successful observation occur before `Scheduler.activatableTasks`. A failure returns `BootstrapContractUnsatisfied`; no fallback may claim that the durable predicate authorized the dispatch.
12. **One read, two consumers.** TASK-005 alone reads the activation range through `IngressObserver.deliver`. The same `IngressDelivery` enters `AgentInvocation.ingress` and is projected into `IngressRangeConsumed.rows`; the activation holds no inbox capability and never re-reads.

**Required crash fixture - append committed, signal absent.** Append one external fact and persist the returned `appended` disposition and mark *n*, then crash before `IngressHighWaterSignal.signal`. Retry collection with the byte-identical fact. The inbox returns `deduplicated` with the same `factId` and a high-water mark greater than or equal to *n*; the collector returns that exact success, the supervisor signals and observes the mark, and scheduler selection follows. Assert the collector never calls `IngressInbox.read`, never fabricates an `IngressEntry` or `seq`, and appends no second entry. TASK-005 later performs the sole activation-range read through `IngressObserver.deliver`.

Rules 1, 2, 4, and 9 are why a count over a scan of mutable refs is not a position, and why this contract is not that. Rules 3, 5, and 6 are why `ingressSeq` is reproducible from the inbox alone. Rules 10 through 12 are the authorization, ordering, and ownership boundary added under TASK-028.

## 2c. Lossless committed task-record source and exact projection — declared by TASK-003, implemented by TASK-005 and TASK-007

TASK-032 supersedes the closed nested source shapes introduced by TASK-028. TASK-007 owns file I/O, front-matter separation, and YAML parsing through `TaskRecordDocumentSource`; TASK-005 owns the pure, total `TaskRecordProjection` and its inverse audit transform. No other module may parse a task record or construct a proposal from one. The source schema accepts every YAML value and preserves the original text, so a newly observed inert key cannot become data loss or a load failure.

```ts
export type YamlScalar = string | number | boolean | null;
export type YamlValue =
  | YamlScalar
  | readonly YamlValue[]
  | { readonly [key: string]: YamlValue };
export type YamlMap = Readonly<Record<string, YamlValue>>;

export interface TaskRecordSourceDocument {
  /** Exact UTF-8 file content, including delimiters, comments, formatting, and body. */
  rawText: string;
  /** The YAML mapping between the first pair of `---` delimiters, with no key renamed. */
  frontMatter: YamlMap;
  /** Exact text after the closing front-matter delimiter. */
  body: string;
}

export interface TaskRecordDocumentEnvelope {
  path: string;
  source: TaskRecordSourceDocument;
}

export interface TaskRecordDocumentSource {
  load(path: string): Promise<TaskRecordDocumentLoadResult>;
}

export type TaskRecordDocumentLoadResult =
  | { ok: true; record: TaskRecordDocumentEnvelope }
  | {
      ok: false;
      error: 'FrontMatterMissing' | 'YamlInvalid' | 'FrontMatterNotMapping' | 'Utf8Invalid';
      path: string;
      detail: string;
    };

export type TaskRecordDocumentStatus =
  | 'backlog' | 'ready' | 'in-progress' | 'review' | 'blocked' | 'done';

export type TaskDependencyDocument =
  | { edge: 'review_ready' | 'integrated' | 'gate_recorded' | 'terminal'; task: TaskId }
  | { edge: 'gate_passed'; task: TaskId; gate: GateName; round?: number }
  | { edge: 'gate_passed'; lineage: GateLineageId; gate: GateName; lineage_round?: number }
  | { edge: 'human_decision'; decision: HumanDecisionId };

/** Exact recognized relation vocabulary. The final three fields are inert provenance, not verdict authority. */
export interface GateRelationProjectionDocument {
  task: TaskId;
  gate: GateName;
  round: number;
  verdict: DeclaredGateVerdict;
  gate_class: GateClass;
  retrospective: boolean;
  gate_lineage: GateLineageId;
  lineage_round: number;
  verdict_recorded_at?: IsoTimestamp;
  remediated_by?: TaskId | null;
  revalidated_by?: TaskId | null;
}

/** Exact recognized activation vocabulary at the TASK-032 fixture. */
export interface ActivationProjectionDocument {
  mode: 'event-triggered';
  subscribed_event_types?: readonly IngressEventType[];
  last_consumed_event_seq: IngressSeq;
  state: ActivationSpec['state'];
  bootstrap_dispatch_contract: BootstrapDispatchContract;

  /** The committed TASK-013 activation's thirteen additional keys. They remain inert and
   *  round-trip at these exact nested paths; none is hoisted into top-level retention. */
  ingress_model?: string;
  ingress_inbox_owner?: TaskId;
  ingress_observer_owner?: TaskId;
  consumption_ledger?: string;
  cursor_field?: string;
  ingress_epoch?: number;
  ingress_epoch_seq_base?: IngressSeq;
  ingress_seq?: IngressSeq;
  ingress_seq_definition?: string;
  dispatch_condition?: string;
  bootstrap_dispatch_contract_note?: string;
  bootstrap_dispatch_contract_exit?: string;
  last_activation?: string;
}

/** Checked projection vocabulary. Unknown keys are legal source data and go to the audit tree. */
export interface TaskRecordProjectionDocument {
  task_id: TaskId;
  title: string;
  status: TaskRecordDocumentStatus;
  owner_role: string;
  llm: string;
  branch: string;
  worktree: string | null;
  write_scope: string[];
  dependencies: TaskDependencyDocument[];
  required_gates: GateName[];
  pre_merge_gates: GateName[];
  gate_tasks?: GateRelationProjectionDocument[];
  gate_for?: GateRelationProjectionDocument[];
  resource_lock?: string | null;
  parent_task?: TaskId | null;
  publication_class: PublicationClass;
  max_attempts?: number;
  activation?: ActivationProjectionDocument | null;
}

export type ProjectionDisposition = 'projected' | 'derived_checked' | 'retained_inert';

export interface ProjectionLeafDisposition {
  /** RFC 6901 pointer into source.frontMatter. One row per source leaf. */
  sourcePointer: string;
  disposition: ProjectionDisposition;
  /** Present only for projected leaves. */
  targetPointer: string | null;
}

export interface TaskRecordProjectionAudit {
  /** Exact unprojected YAML subtree at the original nested paths. */
  retained: YamlMap;
  /** Original branch/worktree values at their source paths. */
  derivedSourceValues: YamlMap;
  /** Absent source paths for which the explicit transform supplied a target default. */
  omittedDefaultPaths: readonly string[];
  /** Exhaustive, duplicate-free partition of every source leaf. */
  leafDispositions: readonly ProjectionLeafDisposition[];
}

export interface TaskRecordProjection {
  /** Pure and total over every successfully parsed YAML mapping. */
  project(record: TaskRecordDocumentEnvelope): TaskRecordProjectionResult;
  /** Exact semantic inverse: canonical JSON of the result equals canonical JSON of source.frontMatter. */
  unproject(result: TaskRecordProjectionSuccess): YamlMap;
}

export interface TaskRecordProjectionSuccess {
  ok: true;
  proposal: TaskProposal;
  audit: TaskRecordProjectionAudit;
}

export type TaskRecordProjectionResult =
  | TaskRecordProjectionSuccess
  | {
      ok: false;
      error:
        | 'RequiredFieldMissing' | 'ProjectedFieldTypeInvalid'
        | 'DerivedFieldMismatch' | 'ProjectionInvalid'
        | 'GRAPH_GATE_VERDICT_DECLARATION_MISMATCH';
      path: string;
      field: string;
      detail: string;
    };
```

The transform is exact and owned:

| Source path | Target or disposition |
|---|---|
| `/task_id`, `/title`, `/owner_role`, `/llm`, `/write_scope` | `TaskProposal.taskId`, `title`, `ownerRole`, `llm`, `writeScope` |
| `/dependencies` | `TaskDependency[]`; only `lineage_round -> lineageRound` is renamed |
| `/required_gates`, `/pre_merge_gates` | `requiredGates`, `preMergeGates` |
| The first eight fields of each `/gate_tasks/*` and `/gate_for/*` relation | `gateTasks` and `gateFor`; omission projects to `[]`; relation field renames are explicit |
| `verdict_recorded_at`, `remediated_by`, and `revalidated_by` in a relation | `retained_inert` at that same relation path. They survive `unproject` exactly and never become verdict authority |
| `/resource_lock`, `/parent_task`, `/publication_class`, `/max_attempts` | Optional lock/parent omissions map to `null`; class maps to `publicationClass`; omitted attempts stay `undefined` for the runtime default |
| `/activation/mode`, `last_consumed_event_seq`, `state`, `bootstrap_dispatch_contract` | The corresponding `ActivationSpec` fields |
| `/activation/subscribed_event_types` | When present, maps in source order and must be non-empty. When absent, maps to the complete `INGRESS_CLASS_PRECEDENCE` event-type tuple and records the omitted path so `unproject` omits it again |
| The thirteen named additional TASK-013 activation fields above, plus any future activation key | `retained_inert` at the original nested path; never top-level retention |
| envelope `path` | `recordPath` |
| `/branch`, `/worktree` | Derived from `(llm, ownerRole, taskId)`, compared, and recorded as `derived_checked`; mismatch rejects |
| `/status` and every remaining leaf at any depth | `retained_inert` at its exact RFC 6901 path |

A source leaf has exactly one disposition. Projected leaves influence the proposal; derived leaves are compared but not consumed; retained leaves are inert. `unproject` overlays the retained tree and derived source values on the inverse field mapping, removes every path in `omittedDefaultPaths`, and must reproduce `source.frontMatter` under canonical JSON. The raw source text remains available independently, so comments and formatting are not claimed to be reconstructable from YAML values.

**The published target tree is the fixture.** TASK-005 owns the pure projection fixture and TASK-007 owns the source-loader fixture. At publication they enumerate tracked Markdown files under `tasks/`; a file is a task record only when its first YAML front-matter document is a mapping containing `task_id`. They sort by `(task_id, path)`, then require `load.ok`, `project.ok`, an exhaustive one-row-per-leaf disposition partition, exact `unproject(project(source))` canonical-JSON equality, derived-field equality, and `validateGraph.ok` over the complete projected set. Counts are computed from that enumeration and are never configured as expected integers.

The fixture additionally asserts all of the following rather than relying on one representative record:

1. For every activation document that omits `subscribed_event_types`, the explicit all-event default is produced and the omission round-trips.
2. Every additional activation key not mapped into `ActivationSpec` remains at its exact `/activation/*` path in `audit.retained`; the assertion derives the key set from the source document.
3. Relation-document count is the sum of all `gate_tasks` and `gate_for` list lengths. Every canonical eight-field relation key occurs once on each side, every document carrying any enrichment field carries all three, and every enrichment value survives at the same relation index and path. The fixture reports its derived totals for the immutable target but does not use them as acceptance constants.
4. A fixture with an unrelated future nested key loads and round-trips as `retained_inert`; unknown data can never be converted into `UnknownProjectedShape`.

## 2d. Process-tree and workspace registers — `state/contracts` (TASK-003)

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

/** TASK-036 (ADR-0037). State-root snapshot of one Phase-5 process-tree outcome.
 * TASK-008 maps the structurally compatible agents-root TreeCloseOutcome into this value;
 * the state root never imports the independent agent root. */
export interface RecoveryOrphanOutcome {
  invocationId: InvocationId;
  outcome: ProcessTreeOutcome;
  exitCode: number | null;
  escalation: 'none' | 'graceful' | 'forced';
  verifiedExit: boolean;
  unresolvedReason: 'pid_reuse' | 'unbound' | 'verify_timeout' | null;
}

/** The one authoritative durable payload shared by the completion event and public outcome. */
export interface RecoveryCompletionEvidence {
  reclaimedTaskIds: TaskId[];
  adoptedTaskIds: TaskId[];
  blockedTaskIds: TaskId[];
  orphanOutcomes: RecoveryOrphanOutcome[];
  workspaceOutcomes: WorkspaceReconcileEntry[];
}

export type RunRecoveryCompletedEvent =
  { type: 'RunRecoveryCompleted' } & RecoveryCompletionEvidence;

export type RuntimeEvent =
  | { type: 'RunBootstrapped'; runId: RunId; projectInputDigest: Sha256Hex; repoHead: string | null; limits: RunLimits }
  | { type: 'RunStarted' }
  | { type: 'RunPauseRequested'; requestedBy: string }
  | { type: 'RunStopRequested'; requestedBy: string }
  | { type: 'RunDrainCompleted'; intent: 'pause' | 'stop'; abandonedTaskIds: TaskId[]; treeClosure: 'all_verified' }  // TASK-024
  | { type: 'RunResumeRequested'; writerEpoch: WriterEpoch }
  | RunRecoveryCompletedEvent
  | { type: 'RunCompleted'; state: 'succeeded' | 'failed' | 'cancelled'; reason: TerminalReason }
  | { type: 'RunCancelled'; reason: TerminalReason }
  | { type: 'TaskCreated'; task: TaskProposal }
  | { type: 'TaskDependenciesSatisfied'; taskId: TaskId }
  | { type: 'LeaseGranted'; taskId: TaskId; holderId: string; fencingToken: FencingToken; expiresAt: IsoTimestamp }
  | { type: 'LeaseRenewed'; taskId: TaskId; fencingToken: FencingToken; expiresAt: IsoTimestamp }
  | { type: 'LeaseReleased'; taskId: TaskId; fencingToken: FencingToken }
  | { type: 'LeaseExpired'; taskId: TaskId; fencingToken: FencingToken }
  | { type: 'DispatchStarted'; taskId: TaskId; fencingToken: FencingToken; attempt: number; idempotencyKey: Sha256Hex }
  | { type: 'EffectIntentRecorded'; effectId: EffectId; taskId: TaskId; attempt: number; idempotencyKey: Sha256Hex; idempotent: boolean; isTaskResultEffect: boolean } // TASK-028 (ADR-0025)
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

  // Workspace lifecycle (ADR-0011, amended by ADR-0019)
  | { type: 'WorkspacePrepareIntended'; workspaceId: WorkspaceId; taskId: TaskId; attempt: number; branch: string; worktreePath: string }
  | { type: 'WorkspacePrepared'; workspaceId: WorkspaceId; lockSessionId: string; hooksVerified: true }
  | { type: 'WorkspaceFinalizeIntended'; workspaceId: WorkspaceId }
  | { type: 'WorkspaceFinalized'; workspaceId: WorkspaceId; lockReleased: boolean }
  | { type: 'WorkspaceAbandonIntended'; workspaceId: WorkspaceId; reason: string }   // TASK-024 — enters `abandoning`
  | { type: 'WorkspaceAbandoned'; workspaceId: WorkspaceId; reason: string; lockReleased: boolean }
  | { type: 'WorkspaceReconciled'; workspaceId: WorkspaceId; resolvedTo: WorkspaceState; unresolvedReason: WorkspaceRecord['unresolvedReason'] }

  // Typed scheduling, gates, publication, integration (ADR-0015, amended by ADR-0018)
  | { type: 'ArtifactPublished'; taskId: TaskId; workspaceId: WorkspaceId; publication: PublicationRecord } // TASK-028 receipt subject
  /** TASK-024. One review produces exactly one verdict, applied atomically to every relation
   *  the gate task carries. Applying this event appends one GateVerdictRecord per relation and
   *  sets the verdict of each named lineage round. A split outcome is not representable. */
  | { type: 'GateVerdictRecorded'; gateTaskId: TaskId; verdict: GateVerdict; blockingFindingsOpen: number; artifactPath: string; remediatedBy: TaskId | null; revalidatedBy: TaskId | null; acceptedBy: HumanDecisionId | null; relations: GateTarget[] }
  | { type: 'BranchIntegrated'; taskId: TaskId; integration: IntegrationRecord }
  | { type: 'HumanDecisionRecorded'; decisionId: HumanDecisionId; commit: string; summary: string }
  | { type: 'DependencyUnsatisfiable'; taskId: TaskId; dependency: TaskDependency; reason: string }
  | { type: 'RemediationCompleted'; taskId: TaskId; remediates: Array<{ task: TaskId; finding: string }> }

  // ---- TASK-024 additions ----

  // Gate lineages (ADR-0018)
  | { type: 'GateLineageDeclared'; lineage: GateLineageId; gate: GateName; cohort: TaskId[] }
  | { type: 'GateLineageCohortExtended'; lineage: GateLineageId; task: TaskId }
  | { type: 'GateLineageRoundOpened'; lineage: GateLineageId; lineageRound: number; gateTaskId: TaskId }

  // Ingress inbox, cursor, and consumption ledger (ADR-0017)
  /** The observer's durable record that the inbox's high-water mark advanced. It carries no
   *  entry payload: the entries live in the inbox, not in the journal. */
  | { type: 'IngressHighWaterMarkObserved'; epoch: IngressEpoch; ingressSeq: IngressSeq }
  | { type: 'IngressEpochDeclared'; epoch: IngressEpoch; seqBase: IngressSeq; model: string; declaredBy: string }
  /** Appends one ledger row per entry of `(fromSeq, throughSeq]` and advances that task's
   *  cursor to `throughSeq`, in one event. Applied in the same batch as the activation's
   *  effects and its `WorkerSucceeded`. */
  | { type: 'IngressRangeConsumed'; taskId: TaskId; activationId: ActivationId; fromSeq: IngressSeq; throughSeq: IngressSeq; rows: IngressConsumptionRow[] }
  | { type: 'TaskActivated'; taskId: TaskId; activationId: ActivationId; observedIngressSeq: IngressSeq }
  | { type: 'TaskQuiesced'; taskId: TaskId; atSeq: IngressSeq }

  // Durable adoptable results (ADR-0020)
  | { type: 'WorkerResultRecorded'; taskId: TaskId; fencingToken: FencingToken; attempt: number; adoptable: AdoptableResult }

  // Unqualified drain closure (ADR-0022)
  | { type: 'RunDrainBlocked'; intent: 'pause' | 'stop'; reason: 'unverified_process_tree'; unresolvedInvocationIds: InvocationId[] };

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
  resourceLock?: string | null;        // defaults to null
  activation?: ActivationSpec | null;  // defaults to null

  // TASK-024 additions, mirroring TaskRecord
  gateFor?: GateTarget[];              // defaults to []
  publicationClass: PublicationClass;  // required; never inferred
}
```

`RuntimeEvent` remains a closed union of **52** members. TASK-036 changes the existing recovery-completion member's payload and does not add a member. TASK-038 changes only the existing `BranchIntegrated` payload. `EffectIntentRecorded` changes shape but is not a new member. Adding a member is a contract change and requires an ADR amendment.

The membership arithmetic, stated so it can be recomputed rather than trusted: TASK-002 declared 25; TASK-016 added 19, giving 44; TASK-024 **withdraws** `ActivationEventAppended` and adds nine — `WorkspaceAbandonIntended`, `GateLineageDeclared`, `GateLineageCohortExtended`, `GateLineageRoundOpened`, `IngressHighWaterMarkObserved`, `IngressEpochDeclared`, `IngressRangeConsumed`, `WorkerResultRecorded`, and `RunDrainBlocked` — giving 52. `TaskActivated` and `TaskQuiesced` survive with changed payloads rather than being withdrawn.

Of the nine additions, seven change no task or run state field: every one except `IngressRangeConsumed`, which advances a cursor, and `WorkspaceAbandonIntended`, which enters `abandoning`. Each still advances `stateVersion` by exactly one, so replay determinism and the derivation of fencing tokens from `stateVersion` are unaffected. [STATE-MACHINE.md](STATE-MACHINE.md) lists which states each is legal from.

**TASK-028 event guards, strengthened under TASK-032.** Applying `EffectIntentRecorded` copies
`isTaskResultEffect` into the new ledger entry. For one `(taskId, attempt)`, a second event with
the flag `true` is `IllegalTransition/GuardFailed`; the first is legal only after a matching
`run.pendingResults[taskId]` is durable. `EffectCommitted` addresses an existing `effectId`
and cannot add or change the flag. Restore independently fails closed with
`RecoveryInvariantViolation` if corrupt evidence contains more than one flagged entry, so neither
the live guard nor recovery may select among duplicates. The uninterrupted order is
`WorkerResultRecorded -> EffectIntentRecorded -> effect execution -> EffectCommitted -> WorkerSucceeded`.
Recovery emits only the last event, and only when the committed entry is that unique flagged
result effect; a committed unflagged effect is never adoption evidence.

`ProcessGroupClosed` is invocation-addressed. A second closure for an invocation is legal only in `recovering`, only when the latest closure has `verifiedExit: false`, and only once for the current writer epoch; it supersedes that unverified evidence with verified closure without changing task state. `RunResumeRequested` is legal from `pausing` and `draining` when the prior writer epoch is stale, so a `RunDrainBlocked` outcome has a legal attach path.

**TASK-036 recovery-completion application semantics.** `RunRecoveryCompletedEvent` is legal only as the final event of a recovery batch. Its five arrays are canonical snapshots of that recovery attempt: task identifiers are unique and ordered by `(createdSeq, taskId)`; orphan outcomes are ordered by `invocationId`; workspace outcomes are ordered by `workspaceId`. The three task-id arrays equal the corresponding results of the decision blocks already applied in the batch, and the two outcome arrays equal the Phase-5 and Phase-6 results whose event envelopes precede it. A mismatch is `RecoveryInvariantViolation`, not evidence the transition function silently repairs. Applying the event changes only the run state from `recovering` to `running` and advances ordinary envelope metadata. The payload remains durable in the journal rather than being copied into a second mutable `RunRecord` field. The successful `RecoveryOutcome` returns the exact same five values.

`ActivationEventAppended` is withdrawn because its record effect — creating a row in `run.activationEvents` with a `seq` assigned by `applyEvent` — is precisely the internal-queue model finding A-101 rejected. Ingress positions are assigned by the inbox at append time and the journal observes them; it does not mint them.

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
/** TASK-028. State-root-only nominal brand; agents/contracts must not redeclare it. */
declare const DURABLE_RECEIPT_BRAND: unique symbol;
export type DurableReceiptProof = string & { readonly __opaqueDurableReceiptProof: unique symbol };

export interface DurableAppendReceiptBase {
  stateVersion: StateVersion;
  writerEpoch: WriterEpoch;
  batchId: BatchId;
  issuedAt: IsoTimestamp;
  proof: DurableReceiptProof;
  readonly [DURABLE_RECEIPT_BRAND]: 'state-store-append';
}

export interface ProcessGroupRegistrationReceipt extends DurableAppendReceiptBase {
  eventType: 'ProcessGroupRegistered';
  invocationId: InvocationId;
}

export type WorkspaceIntent = 'prepare' | 'finalize' | 'abandon';

export interface WorkspaceIntentReceipt extends DurableAppendReceiptBase {
  eventType: 'WorkspacePrepareIntended' | 'WorkspaceFinalizeIntended' | 'WorkspaceAbandonIntended';
  workspaceId: WorkspaceId;
  intent: WorkspaceIntent;
}

export interface ArtifactPublicationReceipt extends DurableAppendReceiptBase {
  eventType: 'ArtifactPublished';
  workspaceId: WorkspaceId;
  publishedCommit: string;
}

export interface PlainAppendReceipt extends DurableAppendReceiptBase {
  eventType: Exclude<
    RuntimeEvent['type'],
    'ProcessGroupRegistered' | 'WorkspacePrepareIntended' | 'WorkspaceFinalizeIntended'
      | 'WorkspaceAbandonIntended' | 'ArtifactPublished'
  >;
}

export type DurableAppendReceipt =
  | ProcessGroupRegistrationReceipt
  | WorkspaceIntentReceipt
  | ArtifactPublicationReceipt
  | PlainAppendReceipt;

export type DurableReceiptSubject =
  | { kind: 'process_group_registration'; invocationId: InvocationId }
  | { kind: 'workspace_intent'; workspaceId: WorkspaceId; intent: WorkspaceIntent }
  | { kind: 'artifact_publication'; workspaceId: WorkspaceId; publishedCommit: string }
  | { kind: 'plain'; eventType: PlainAppendReceipt['eventType'] };

export interface ReceiptVerifier {
  verifyReceipt(receipt: unknown): DurableReceiptSubject | null;
}

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

  /** TASK-028 (ADR-0028). Returns the subject retained when append issued this proof, or null
   *  for a synthesized proof or one from a superseded writer epoch. It grants no write access. */
  verifyReceipt(receipt: unknown): DurableReceiptSubject | null;

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
  /** TASK-024. `receipts` carries one `DurableAppendReceipt` per event of the batch, in batch
   *  order, issued only after the batch commit record is durable. It is how a module proves to
   *  another module that a named intent is durable without being given write authority. */
  | { ok: true; version: StateVersion; run: RunRecord; receipts: DurableAppendReceipt[] }
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
  /** TASK-024 — was `activateThroughSeq: ActivationSeq | null`. Set for an activation
   *  candidate: the inbox high-water mark observed when the candidate was selected. It is an
   *  observation, not a reservation: nothing is claimed until `IngressRangeConsumed` lands. */
  observedIngressSeq: IngressSeq | null;
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
   * TASK-024 — was five invariants; target-current rule amended by TASK-034. Pure. Validates
   * the complete projected task-record set from the immutable published Git tree against the
   * **eight** no-deadlock invariants, including acyclicity of the expanded precondition graph,
   * `gate_passed` form resolution with the
   * owner form withdrawn, all eight gate-pair fields including declared verdict, and gate-lineage
   * well-formedness. Called at load and on every TaskCreated admission. Returns every
   * violation, not only the first.
   */
  validateGraph(run: RunRecord): GraphValidation;

  /**
   * TASK-024 (ADR-0017). Pure. Given the run record and the inbox high-water mark, returns the
   * tasks whose cursor is behind it, in dispatch order. `ingressSeq` is supplied by the caller
   * because reading the inbox is I/O and the scheduler is pure; the ingress observer in
   * `src/orchestrator/scheduling/` performs the read and appends
   * `IngressHighWaterMarkObserved` before calling this.
   */
  activatableTasks(run: RunRecord, ingressSeq: IngressSeq): DispatchCandidate[];

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
    // invariants 1 … 5, unchanged from TASK-016
    | 'GRAPH_CYCLE_SCHEDULING' | 'GRAPH_GATE_HOLDS_STRONG_EDGE'
    | 'GRAPH_GATE_PAIR_MISMATCH' | 'GRAPH_PREMERGE_GATE_AWAITS_MERGE'
    | 'GRAPH_CYCLE_EXPANDED' | 'GRAPH_UNKNOWN_TARGET' | 'GRAPH_TERMINAL_EDGE_CYCLE'
    // TASK-024 — invariant 6, gate_passed form resolution
    | 'GRAPH_GATE_PASSED_FORM_AMBIGUOUS'      // declares neither or both of task and lineage
    | 'GRAPH_GATE_PASSED_OWNER_FORM'          // the withdrawn owner form; message names the lineage form
    | 'GRAPH_GATE_PASSED_UNKNOWN_LINEAGE'     // lineage absent from the register
    | 'GRAPH_GATE_PASSED_GATE_NOT_REQUIRED'   // target form naming a gate absent from requiredGates
    // TASK-024 — invariant 7, gate scheduling properties
    | 'GRAPH_GATE_CLASS_MISMATCH'             // declared gateClass differs from the computed class
    | 'GRAPH_RETROSPECTIVE_MISMATCH'          // declared retrospective differs from gate ∉ preMergeGates
    | 'GRAPH_DELAYED_GATE_UNREGISTERED'       // aggregate or retrospective pair with no register entry
    // TASK-024 — invariant 8, gate-lineage well-formedness
    | 'GRAPH_LINEAGE_UNDECLARED'              // a pair naming a lineage the register does not hold
    | 'GRAPH_LINEAGE_GATE_INCONSISTENT'       // the gate name is not constant within the lineage
    | 'GRAPH_LINEAGE_ROUND_COLLISION'         // two gate tasks declaring the same lineage round
    | 'GRAPH_LINEAGE_ROUND_GAP'               // declared rounds are not 1 … k
    | 'GRAPH_LINEAGE_COHORT_VIOLATION'        // a pair whose target is not a cohort member
    | 'GRAPH_LINEAGE_ROUND_PREMATURE'         // round n > 1 opened before round n − 1 recorded a verdict
    // TASK-024 — declared-field completeness
    | 'GRAPH_PUBLICATION_CLASS_MISSING'       // a task record omitting publicationClass
    | 'GRAPH_BOOTSTRAP_CONTRACT_MISSING'      // an activation omitting bootstrapDispatchContract
    | 'GRAPH_GATE_VERDICT_DECLARATION_MISMATCH'; // YAML declaration contradicts durable lineage state
  taskIds: TaskId[];                   // the cycle in order, or the tasks involved
  lineages: GateLineageId[];           // TASK-024; the lineages involved, may be empty
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

/** TASK-028. Read-only invocation view of one delivered ingress entry. */
export interface AgentIngressEntry {
  seq: IngressSeq;
  epoch: IngressEpoch;
  factId: FactId;
  contentHash: Sha256Hex;
  eventType: IngressEventType;
  producerTask: TaskId;
  producerRole: string;
  sourceCommit: string;
  sourcePath: string;
  appendedBy: IngressAppendPrincipal;
  appendedAt: IsoTimestamp;
}

export interface AgentIngressDelivery {
  taskId: TaskId;
  activationId: ActivationId;
  fromSeq: IngressSeq;
  throughSeq: IngressSeq;
  entries: readonly AgentIngressEntry[];
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
  /** TASK-028. Non-null only for an event-triggered activation. No inbox or append capability
   *  crosses this boundary. */
  ingress: AgentIngressDelivery | null;
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
  ingressDelivery: AgentIngressDelivery | null; // must equal invocation.ingress
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

/**
 * TASK-024 (ADR-0019), resolving A-102. `execute` was one opaque call whose `spawnOwned`
 * pre-condition — "the caller must have appended ProcessGroupRegistered" — no caller could
 * satisfy, because the supervisor had no seam inside the call and the worker holds no
 * state-write authority. The call is split into three phases. The supervisor appends between
 * them; the worker still appends nothing and still receives no state store.
 *
 *   1. supervisor: planned = worker.planInvocation(assignment)         pure, spawns nothing
 *      if !planned.ok: record the classified failure; append no registration
 *   2. supervisor: plan = planned.plan; append ProcessGroupRegistered  durable
 *   3. supervisor: receipt = the append path's receipt for that event
 *   4. supervisor: begun = await worker.beginInvocation(plan, receipt, signal)
 *   5. supervisor: append ProcessGroupBound{ begun.binding }           durable, immediately after
 *   6. supervisor: result = await worker.completeInvocation(begun.handle, signal)
 *   7. supervisor: append ProcessGroupClosed{ result.close }           durable
 */
export interface AgentWorker {
  /**
   * Phase 1. Pure and deterministic. Resolves the adapter, derives `invocationId` from
   * `(runId, taskId, attempt, idempotencyKey)`, derives the group name from it, and assembles
   * the command vector. Spawns no process, touches no filesystem, appends nothing.
   */
  planInvocation(assignment: WorkAssignment): WorkerPlanResult;

  /**
   * Phase 2. Creates the owned group and spawns the provider into it.
   * **Refuses without a verified receipt**. The injected AgentReceiptVerifier must return a
   * process_group_registration subject whose invocationId equals `plan.invocationId`, and the
   * receipt writerEpoch must be current; otherwise it returns `RegistrationNotDurable` before
   * creating a group or spawning. Only the append path can issue a proof the verifier accepts.
   */
  beginInvocation(
    plan: WorkerInvocationPlan,
    receipt: unknown,
    signal: AbortSignal,
  ): Promise<WorkerBeginResult>;

  /** Phase 3. Awaits the provider outcome, then the verified close of the owned tree. */
  completeInvocation(handle: WorkerInvocationHandle, signal: AbortSignal): Promise<WorkerResult>;
}

export interface WorkerInvocationPlan {
  invocationId: InvocationId;
  taskId: TaskId;
  attempt: number;
  groupKind: ProcessGroupKind;
  groupName: string;                   // derived from invocationId; known before the spawn
  invocation: AgentInvocation;
  command: SpawnCommand;
  fencingToken: FencingToken;          // carried through untouched
}

/** TASK-036 (ADR-0040). The only plan-time classified failure. Adapter invocation has not
 * started, so no provider code or retry-after value exists. */
export interface WorkerPlanFailure extends AdapterFailure {
  failureClass: 'invalid_request';
  code: 'UNKNOWN_PROVIDER_FAMILY';
  providerCode: null;
  retryAfterMs: null;
}

export type WorkerPlanResult =
  | { ok: true; plan: WorkerInvocationPlan }
  | { ok: false; failure: WorkerPlanFailure };

/** TASK-028. Structural read-only view in agents/contracts. The nominal receipt and its brand
 *  are deliberately not duplicated from state/contracts. */
export interface AgentProcessRegistrationSubject {
  kind: 'process_group_registration';
  invocationId: InvocationId;
}

export interface AgentReceiptVerifier {
  /** The supervisor composition adapter narrows the state verifier to this one subject. */
  verifyProcessGroupRegistration(receipt: unknown): AgentProcessRegistrationSubject | null;
}

/** TASK-032 (ADR-0034). A proof refusal is a protocol outcome, never an adapter failure. */
export interface RegistrationNotDurableRefusal {
  ok: false;
  error: 'RegistrationNotDurable';
  detail: string;
}

export type WorkerBeginResult =
  | { ok: true; handle: WorkerInvocationHandle; binding: ProcessGroupBinding }
  | RegistrationNotDurableRefusal
  | { ok: false; failure: AdapterFailure };

export interface ProcessGroupBinding {
  invocationId: InvocationId;
  pid: number;
  groupRef: string;
  processStartTime: string;
}

/** Opaque to every consumer. Only TASK-004 interprets it. */
export interface WorkerInvocationHandle {
  invocationId: InvocationId;
  taskId: TaskId;
  attempt: number;
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
   * TASK-028: the opaque value is verified through AgentReceiptVerifier before any group or
   * process exists. A missing, forged, stale-epoch, or subject-mismatched value returns
   * RegistrationNotDurable.
   */
  spawnOwned(
    invocation: AgentInvocation,
    command: SpawnCommand,
    receipt: unknown,
  ): Promise<SpawnOwnedResult>;

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
  | RegistrationNotDurableRefusal
  | { ok: false; failure: AdapterFailure };

export interface TreeCancelDeadlines {
  gracefulCancelGraceMs: number;
  treeExitVerifyTimeoutMs: number;
  treeExitPollIntervalMs: number;
  /** TASK-024 (ADR-0022). Total budget across every escalation and verification round for one
   *  invocation. `cancelTree` re-forces and re-verifies until either exit is verified or this
   *  budget is exhausted; exhaustion returns `verifiedExit: false`, which the drain treats as a
   *  blocking outcome rather than as a permitted exception. */
  treeCloseTotalBudgetMs: number;
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

`agents/contracts` re-declares the primitive aliases enumerated in [COMPONENT-BOUNDARIES.md](COMPONENT-BOUNDARIES.md), plus `AgentProcessRegistrationSubject` and `AgentReceiptVerifier`. It does **not** re-declare `DURABLE_RECEIPT_BRAND`, `DurableReceiptProof`, or a receipt type: two separately declared unique symbols would be different nominal types and falsely claim interchangeability. The supervisor may pass the state-issued value as `unknown`; TASK-004 can use it only after `verifyProcessGroupRegistration` returns the matching store-recorded subject.

**Cross-root nominal-receipt conformance fixture.** Enumerate declarations in the two transcribed roots. Assert exactly one `DURABLE_RECEIPT_BRAND` declaration and exactly one `ProcessGroupRegistrationReceipt` declaration, both in `state/contracts`; assert zero nominal receipt or brand declarations in `agents/contracts`; and type-check `AgentWorker.beginInvocation` and `ProcessTreeController.spawnOwned` with `receipt: unknown` plus an injected `AgentReceiptVerifier`. The supervisor may name the value `ProcessGroupRegistrationReceipt` while it holds it on the state side, but the crossing parameter is always `unknown`. No cast to a copied nominal type is permitted.

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
  /** TASK-024 (ADR-0020), composed explicitly by TASK-034 (ADR-0035). The durable adoptable
   *  results restored with the record. The coordinator looks up the candidate for each task
   *  and passes it to ReconciliationInputBuilder; the builder never reads this map implicitly. */
  pendingResults: Readonly<Record<TaskId, AdoptableResult>>;
}

export type RecoveryOutcome =
  | ({
      ok: true;
      run: RunRecord;
      version: StateVersion;
      decisions: ReconciliationDecision[];
      staleControlRequests: ControlRequestId[];
    } & RecoveryCompletionEvidence)
  | { ok: false; error: 'NoConsistentCheckpoint' | 'WriterAlive' | 'RunNotFound' | 'RecoveryInvariantViolation'; detail?: string };

/** TASK-036 fixture rule: tests construct RunRecoveryCompletedEvent directly, not a wider
 * object literal, a Partial, or a second helper payload type. */

/** TASK-028 (ADR-0030). The one canonical, enumerable recovery decision domain. */
export interface ReconciliationInput {
  fromState: TaskState;
  leaseState: 'none' | 'superseded' | 'current_epoch';
  /** TASK-032. 'committed_result' means the unique flagged result effect is committed;
   *  an unrelated committed effect can never produce this value. */
  ledgerState: 'none' | 'intended_idempotent' | 'intended_non_idempotent' | 'committed_result';
  deadline: 'elapsed' | 'not_elapsed';
  activationPresent: boolean;
  /** True only for a pending result whose attempt equals the task's current attempt. */
  adoptableResultPresent: boolean;
}

export interface ReconciliationEvidence {
  input: ReconciliationInput;
  /** Non-null if and only if input.ledgerState is 'committed_result'. */
  resultEffectId: EffectId | null;
}

export type ReconciliationEvidenceResult =
  | { ok: true; evidence: ReconciliationEvidence }
  | {
      ok: false;
      error: 'RecoveryInvariantViolation';
      reason:
        | 'multiple_result_effects'
        | 'committed_result_without_identity'
        | 'current_attempt_entry_mismatch'
        | 'adoptable_result_subject_mismatch';
      effectIds: EffectId[];
    };

/** TASK-034 (ADR-0035). All non-task evidence required to construct the six-field input. */
export interface ReconciliationBuildEvidence {
  currentWriterEpoch: WriterEpoch;
  /** Every member must have taskId === task.taskId and attempt === task.attempt. */
  currentAttemptEntries: readonly EffectLedgerEntry[];
  deadline: ReconciliationInput['deadline'];
  /** The value selected from RecoveryContext.pendingResults by task.taskId, or null. */
  adoptableResult: AdoptableResult | null;
}

export interface ReconciliationInputBuilder {
  /** Pure and complete: constructs every input field from these parameters and performs no read. */
  build(
    task: TaskRecord,
    evidence: ReconciliationBuildEvidence,
  ): ReconciliationEvidenceResult;
}

export interface ReconciliationDecider {
  decide(input: ReconciliationInput): ReconciliationDecision['decision'];
}

/**
 * Exactly one per reconcilable task. It extends the canonical input rather than restating a
 * second domain. Its expansion is proven legal from `fromState` by STATE-MACHINE.md.
 */
export interface ReconciliationDecision extends ReconciliationInput {
  taskId: TaskId;
  /** Copied from ReconciliationEvidence. Required for `adopt` and committed-result
   *  `escalate`; null for every other decision. */
  resultEffectId: EffectId | null;
  /** TASK-024. `reclaim_activation` is the decision for a task carrying an `activation` block:
   *  a control-plane consumption is never adopted, because its cursor advance and its effects
   *  are one batch that either landed or did not. `escalate` additionally covers the
   *  `unreconstructable_result` case in the A-104 fix. */
  decision:
    | 'adopt' | 'escalate' | 'reclaim' | 'reclaim_activation'
    | 'retry_timeout' | 'exhaust_timeout' | 'none';
  /** TASK-024. Present when `decision` is `adopt`; the durable result the emitted
   *  `WorkerSucceeded` is built from. Null for every other decision. */
  adoptable: AdoptableResult | null;
  emitted: Array<RuntimeEvent['type']>;   // the fixed sequence for this decision
  toState: TaskState;
}
```

The recovery coordinator is the only composition owner. For each restored task it passes
`run.writerEpoch`, entries filtered from `run.effects` to that exact `(taskId, attempt)`, the
deadline classification, and `context.pendingResults[task.taskId] ?? null`. The builder validates
the entry subjects and rejects a candidate keyed to another task. It derives `fromState` and
`activationPresent` from the task; derives `leaseState` as `none` for a null lease,
`current_epoch` for an equal writer epoch, and `superseded` otherwise; and sets
`adoptableResultPresent` only for a candidate whose task and attempt match. A stale-attempt
candidate yields `false` rather than adoption. No builder, decider, or fixture reads a complete
`RunRecord` implicitly or patches fields after construction.

When several current-attempt ledger entries exist, the builder partitions them by
`isTaskResultEffect` before calling `decide`. More than one flagged entry is
`RecoveryInvariantViolation`; the builder never chooses one. Reduction then follows this exact
priority: any intended non-idempotent entry wins; otherwise any intended entry yields
`intended_idempotent`; otherwise a **committed flagged result effect** yields `committed_result`
and its `effectId` becomes `ReconciliationEvidence.resultEffectId`; otherwise the value is `none`.
A committed unflagged effect is deliberately absent from the third rule. Therefore a durable
`WorkerResultRecorded` plus an unrelated committed effect, with no committed flagged result
effect, can never select `adopt`. The `mixed` fixtures test each priority combination and include
that exact unrelated-commit crash prefix; `mixed` is neither another input member nor another
axis. The canonical input still has six fields and the four-value ledger axis, so ADR-0030's
cardinality remains unchanged. Every canonical domain point is constructed through `build`
before `decide`; direct `ReconciliationInput` fixture literals are prohibited.

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
  /** TASK-024 (ADR-0022). 5 is added: the drain could not verify closure of every process tree
   *  of this writer epoch, so no `RunDrainCompleted` was emitted and the command did **not**
   *  return a paused or cancelled run. */
  exitCode: 0 | 1 | 2 | 3 | 4 | 5;
}

export interface RunStatusView {
  runId: RunId;
  runState: RunState;
  stateVersion: StateVersion;
  counts: Record<TaskState, number>;
  inFlight: TaskId[];
  blocked: Array<{ taskId: TaskId; reason: string }>;
  // TASK-016 additions, amended by TASK-024
  quiescent: Array<{ taskId: TaskId; lastConsumedEventSeq: IngressSeq; ingressSeq: IngressSeq }>;
  openGates: Array<{ taskId: TaskId; gate: GateName; highestRound: number; verdict: GateVerdict | null }>;

  // TASK-024 additions
  ingressSeq: IngressSeq;
  ingressEpoch: IngressEpoch;
  openLineages: Array<{
    lineage: GateLineageId;
    gate: GateName;
    highestLineageRound: number;
    authoritativeVerdict: GateVerdict | null;
  }>;
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

/**
 * TASK-024 (ADR-0019), responding to A-103. Each mutating operation is split into a **plan** phase
 * that produces the intent event and performs no side effect, and an **execute** phase that
 * refuses to act without a receipt proving the intent is durable. The module still appends
 * nothing; the supervisor appends the intent between the two phases.
 *
 *   1. supervisor: plan = ws.planPrepare(request)          pure; no script, no git, no filesystem
 *   2. supervisor: append plan.intentEvent                 WorkspacePrepareIntended, durable
 *   3. supervisor: receipt = the append path's receipt
 *   4. supervisor: result = await ws.executePrepare(plan, receipt)
 *
 * `abandon` follows the identical two-phase shape. TASK-028 makes finalize three-phase:
 * executeFinalize publishes while retaining the lock, the supervisor durably appends its
 * ArtifactPublished event, and completeFinalize accepts only that append's verified receipt
 * before releasing the lock.
 */
export interface WorkspaceLifecycle {
  planPrepare(request: WorkspacePrepareRequest): WorkspacePreparePlan | WorkspacePlanRefusal;
  executePrepare(plan: WorkspacePreparePlan, receipt: WorkspaceIntentReceipt): Promise<WorkspacePrepareResult>;

  planFinalize(handle: WorkspaceHandle, request: WorkspaceFinalizeRequest): WorkspaceFinalizePlan | WorkspacePlanRefusal;
  /** Performs validation, commit, publication, and PR lookup/create/update. Never releases. */
  executeFinalize(plan: WorkspaceFinalizePlan, receipt: WorkspaceIntentReceipt): Promise<WorkspaceFinalizePublishResult>;
  /** The only lock-release method. Refuses without a verified publication receipt matching
   *  both workspaceId and publishedCommit. Never uses -Force. */
  completeFinalize(
    continuation: WorkspaceFinalizeContinuation,
    receipt: ArtifactPublicationReceipt,
  ): Promise<WorkspaceFinalizeCompletionResult>;

  planAbandon(handle: WorkspaceHandle, reason: string): WorkspaceAbandonPlan | WorkspacePlanRefusal;
  executeAbandon(plan: WorkspaceAbandonPlan, receipt: WorkspaceIntentReceipt): Promise<WorkspaceAbandonResult>;

  reconcile(runId: RunId, context: WorkspaceReconcileContext): Promise<WorkspaceReconcileResult>;
}

/** Each plan carries the intent event the supervisor must append, and the validated identity
 *  the execute phase will act on. A plan is pure data; holding one performs nothing. */
export interface WorkspacePreparePlan {
  intent: 'prepare';
  workspaceId: WorkspaceId;
  taskId: TaskId;
  attempt: number;
  branch: string;                      // derived and validated; never from agent output
  worktreePath: string;
  baseRef: string;
  intentEvent: EventEnvelopeInput;     // WorkspacePrepareIntended
}

export interface WorkspaceFinalizePlan {
  intent: 'finalize';
  workspaceId: WorkspaceId;
  taskId: TaskId;
  request: WorkspaceFinalizeRequest;
  intentEvent: EventEnvelopeInput;     // WorkspaceFinalizeIntended
}

export interface WorkspaceAbandonPlan {
  intent: 'abandon';
  workspaceId: WorkspaceId;
  taskId: TaskId;
  reason: string;                      // English
  intentEvent: EventEnvelopeInput;     // WorkspaceAbandonIntended — TASK-024; enters `abandoning`
}

/** A plan phase can refuse before any intent exists: a branch or worktree that fails
 *  derivation validation is a dispatch refusal, not a sanitization opportunity. */
export type WorkspacePlanRefusal = { ok: false; outcome: 'failed'; failure: WorkspaceFailure };

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
  /** TASK-024 — replaces `allowLocalOnlyPublication`. The owning task's declared class decides
   *  whether an unreachable remote is a recorded `local-only` publication or a `blocked`
   *  outcome. It is read from the task record, never from a run-global flag. */
  publicationClass: PublicationClass;
  now: IsoTimestamp;
}

/** Process-local continuation. It is deliberately not durable: a crash is reconciled from the
 *  workspace register plus ArtifactPublished, never by restoring this object. */
export interface WorkspaceFinalizeContinuation {
  workspaceId: WorkspaceId;
  taskId: TaskId;
  publishedCommit: string;
  lockSessionId: string;
}

export type WorkspaceFinalizePublishResult =
  | {
      ok: true;
      publication: PublicationRecord;
      publicationEvent: EventEnvelopeInput; // ArtifactPublished
      continuation: WorkspaceFinalizeContinuation;
      lockReleased: false;
    }
  | {
      ok: false;
      outcome: 'failed' | 'blocked';
      failure: WorkspaceFailure;
      publication: PublicationRecord | null;
      lockReleased: false;
      events: EventEnvelopeInput[];
    };

export type WorkspaceFinalizeCompletionResult =
  | { ok: true; lockReleased: true; completionEvent: EventEnvelopeInput } // WorkspaceFinalized
  | { ok: false; failure: WorkspaceFailure; lockReleased: false; events: EventEnvelopeInput[] };

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

Every operation returns envelopes rather than appending them. The workspace module produces them and the supervisor's append path applies them, so only one module mutates durable state. A successful `executeFinalize` returns exactly one `publicationEvent`; it still appends nothing.

`executePrepare`, failed or blocked `executeFinalize`, and `executeAbandon` return an `events` array because the outcome following the durable intent is part of what the caller persists. A successful finalize instead returns a publication event and a process-local continuation with `lockReleased: false`; only `completeFinalize` returns `lockReleased: true` and a `WorkspaceFinalized` event.

`WorkspaceIntentReceipt` and `ArtifactPublicationReceipt` give the module evidence, not authority. The module verifies each proof through an injected read-only `ReceiptVerifier`, checks the recorded subject against the plan or continuation, and refuses a synthesized or stale-epoch receipt before any side effect. It holds no append capability.

## 10a. Recovery reconstruction of an adopted result

The recovery layer reads `run.pendingResults[taskId]` to build the `WorkerSucceeded` event that decision `adopt` emits. That is the whole of the A-104 fix at the contract level, and the two things it needed are present: `AdoptableResult.result` is a complete `TaskResultSummary`, and `AdoptableResult.proposedTasks` is the verbatim proposal list.

`RecoveryContext` in section 7 carries `pendingResults` so the reconciliation decision is a function of durable inputs only.

The fate of `proposedTasks` is stated once, here, and nowhere contradicted: they are recorded verbatim before the result effect is committed, they are adopted with the result, and they are admitted by the same `TaskCreated` guards an uninterrupted run would apply. They are never digested, never truncated, and never silently dropped. When a task's current attempt has a `committed` result effect and **no** matching `pendingResults` entry, the decision is `escalate` with reason `unreconstructable_result:<effectId>`, not `adopt` with a partial event — because a terminal task graph missing a proposal is a worse outcome than a blocked task naming the defect.

## 10b. Post-gate merge protocol — executor-local contracts under TASK-040

The task executor declares its types under `src/orchestrator/integration/`; the release executor declares its different release types under `scripts/release/integration-merge/`. They do not add a contract root or import one another. Their canonical JSON shapes and result discriminants are fixed by [POST-GATE-MERGE-EXECUTORS.md](POST-GATE-MERGE-EXECUTORS.md):

- `MergeExecutorActivationRecord` proves the four operational prerequisites.
- `TaskIntegrationAdmissionInput` and `ReleaseGateManifest` provide the two different closed input domains. The release manifest contains exactly seven aggregate domains: review, security, QA, performance, documentation, deployment, and rollback.
- `MergeAdmissionResult` is exactly `admitted`, `refused`, or `human_exception_required`; there is no unchecked plan constructor.
- `MergePlan` pins repository, PR, head/base OIDs, literal base and method, expected tree, order, gate/security/policy digests, and canonical idempotency key.
- `MergeEvidenceStore.recordIntent` precedes the one API mutation and returns an opaque receipt verified by `execute`; terminal result evidence follows result-tree verification.
- `HumanExceptionKind` has exactly three members and unknown classification can only refuse.

The task executor may read existing task/gate views from `state/contracts`, but it cannot append run state. The release executor is a self-contained consumer of immutable release artifacts and GitHub observations. The sole cross-module result boundary is `ExternalMergeResultFact` above: TASK-026 validates it and appends; TASK-005 observes and delivers; the ordinary transition function alone applies `BranchIntegrated`.

No `GitHubMergePort` exposes a ref update. The runtime-local port fixes base `integration/autonomous-runtime` and method `squash`; the DevOps-local port fixes base `main` and method `merge`. Both accept a PR number and exact head OID. Neither accepts an environment map, a force/admin flag, a gate mutation, a task mutation, a lock operation, or a generic target ref.

## 11. Contract ownership summary

| Section | Contract root | Owner task | Consumed by |
|---|---|---|---|
| 1–4, 9 | `src/orchestrator/state/contracts/` | TASK-003 | TASK-005, TASK-006, TASK-007, TASK-008, TASK-017, TASK-026, and the runtime task integration executor |
| 2a, 2d | `src/orchestrator/state/contracts/` | TASK-003 | TASK-005, TASK-006, TASK-008, TASK-017 |
| 2b | `src/orchestrator/state/contracts/` | TASK-003 | TASK-005 and TASK-026; TASK-006 applies ingress events; merge executors have no append capability |
| 3a | `src/orchestrator/state/contracts/` | TASK-003 | TASK-003 only; no other module reads a journal line |
| 5 | `src/orchestrator/state/contracts/` | TASK-003 | TASK-005, TASK-006 |
| 6 | `src/agents/contracts/` | TASK-004 | TASK-005, TASK-006, TASK-007, TASK-008 |
| 7 | `src/orchestrator/state/contracts/` | TASK-003 | TASK-008 |
| 8 | `src/orchestrator/state/contracts/` | TASK-003 | TASK-007 |
| 10, 10a | `src/orchestrator/state/contracts/` | TASK-003 | TASK-006, TASK-008, TASK-017 |
| 10b task executor | `src/orchestrator/integration/` | Future `runtime` implementation task, only after TASK-041 passes | TASK-006 composition; TASK-026 consumes only the published result artifact |
| 10b release executor | `scripts/release/integration-merge/` | Future `devops` implementation task, only after TASK-041 passes | Release control plane; TASK-026 consumes only the published result artifact |

TASK-003 owns more contract surface than it implements. That is intentional: the contract root must exist before Wave 3 begins, and TASK-003 is the earliest module every later task depends on. TASK-003 implements only the `StateStore`; it declares the `Scheduler`, `RetryPolicy`, `TimeoutWatchdog`, `RecoveryCoordinator`, `RunController`, `ControlChannel`, `WorkspaceLifecycle`, and — added under TASK-024 — `IngressInbox` interfaces without implementing them.

TASK-017 and TASK-026 are consumers of `state/contracts` and appear in no row of `agents/contracts`, which is what keeps the workspace module and the ingress module at a single contract root each.

`DurableAppendReceipt` and every nominal refinement are declared only in `state/contracts`. `agents/contracts` mirrors only the structural `AgentReceiptVerifier` view and the subject it returns; its method accepts `unknown`. This preserves the independent contract roots without pretending that two separately declared `unique symbol` brands are interchangeable. The workspace boundary is in the state root and therefore consumes the nominal specialized types directly; the agent boundary consumes only verified store-recorded evidence. The state-root `RecoveryOrphanOutcome` and agent-root `TreeCloseOutcome` are the two names for the deliberately structural Phase-5 composition value; ADR-0037 extends the existing first structural-alias family with that pair and does not duplicate a nominal receipt or create an import edge.
