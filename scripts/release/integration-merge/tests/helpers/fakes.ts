/**
 * Deterministic in-memory fakes for the release merge executor tests.
 *
 * Nothing here contacts a network, spawns a process, reads the environment, or touches
 * the filesystem. The merge port counts every call so a fixture can assert that a
 * refusal produced ZERO merge API calls.
 *
 * The evidence store models a nominal store-issued authenticity boundary: only records
 * appended through its own operations are covered by the authenticity token it returns,
 * so a record inserted directly into its maps is detectably not store-issued.
 */

import type {
  Clock,
  DurableAttemptReceipt,
  DurableMergeIntentResult,
  DurablePolicyAuthorizationReceipt,
  GitOid,
  ImmutablePullRequestObservation,
  ImmutableRefObservation,
  MergeEvidenceHistory,
  MergeEvidenceRef,
  MergeOutcomeRecord,
  PolicyControlFacts,
  PreMutationAuthorizationRequest,
  ReleaseAdmissionFacts,
  ReleaseAttestationRequestChannel,
  ReleaseBaseContainment,
  ReleaseExecutorLease,
  ReleaseExecutorLeaseManager,
  ReleaseMergePlan,
  ReleaseMergePortResult,
  ReleaseMergeRequest,
  ReleaseObservationPort,
  ReleasePullRequestMergePort,
  ReleaseRequiredCheckObservation,
  MergeEvidenceStore,
  Sha256Hex,
  TrustedCurrentPolicyAttestation,
} from '../../contracts.ts';
import { RELEASE_BASE_REF } from '../../contracts.ts';
import { sha256Canonical, sha256Utf8 } from '../../canonical-json.ts';
import { BASE_OID, BASE_TIME_MS, HEAD_OID } from './fixtures.ts';

/** Fake clock. No module member reads wall-clock time directly. */
export class FakeClock implements Clock {
  #epochMs: number;
  #monotonicMs: number;

  constructor(epochMs: number = BASE_TIME_MS) {
    this.#epochMs = epochMs;
    this.#monotonicMs = 0;
  }

  nowIso(): string {
    return new Date(this.#epochMs).toISOString();
  }

  monotonicMs(): number {
    return this.#monotonicMs;
  }

  advance(milliseconds: number): void {
    this.#epochMs += milliseconds;
    this.#monotonicMs += milliseconds;
  }
}

/** Injected delay that advances the fake clock instead of waiting. */
export function fakeSleep(clock: FakeClock): (ms: number) => Promise<void> {
  return async (milliseconds: number) => {
    clock.advance(milliseconds);
  };
}

export interface RecordedMergeCall {
  readonly request: ReleaseMergeRequest;
}

/**
 * Merge port that replays a scripted result sequence and records every call.
 * `callCount` is the assertion every refusal fixture uses.
 */
export class RecordingMergePort implements ReleasePullRequestMergePort {
  readonly calls: RecordedMergeCall[] = [];
  #results: ReleaseMergePortResult[];
  #fallback: ReleaseMergePortResult;

  constructor(
    results: readonly ReleaseMergePortResult[] = [],
    fallback: ReleaseMergePortResult = { outcome: 'unsupported' },
  ) {
    this.#results = [...results];
    this.#fallback = fallback;
  }

  get callCount(): number {
    return this.calls.length;
  }

  async mergeIntegrationPullRequestIntoMain(
    request: ReleaseMergeRequest,
  ): Promise<ReleaseMergePortResult> {
    this.calls.push({ request });
    const next = this.#results.shift();
    return next ?? this.#fallback;
  }
}

export interface ObservationScript {
  pullRequests: ImmutablePullRequestObservation[];
  base: ImmutableRefObservation;
  checks: ReleaseRequiredCheckObservation;
  mergedTrees: Map<GitOid, GitOid>;
  /** The authoritative facts the executor re-reads before intent and every attempt. */
  admissionFacts: ReleaseAdmissionFacts;
  containment: ReleaseBaseContainment;
}

/** Read-only observation port. It exposes no policy-observation operation. */
export class FakeObservationPort implements ReleaseObservationPort {
  readonly script: ObservationScript;
  readonly reads: string[] = [];

  constructor(script: ObservationScript) {
    this.script = script;
  }

  async readPullRequest(
    _pullRequestNumber: number,
  ): Promise<ImmutablePullRequestObservation> {
    this.reads.push('readPullRequest');
    const next =
      this.script.pullRequests.length > 1
        ? (this.script.pullRequests.shift() as ImmutablePullRequestObservation)
        : (this.script.pullRequests[0] as ImmutablePullRequestObservation);
    return next;
  }

  async readBaseRef(): Promise<ImmutableRefObservation> {
    this.reads.push('readBaseRef');
    return this.script.base;
  }

  async readRequiredChecks(
    _targetCommit: GitOid,
  ): Promise<ReleaseRequiredCheckObservation> {
    this.reads.push('readRequiredChecks');
    return this.script.checks;
  }

  async readMergedCommitTree(mergedCommitOid: GitOid): Promise<GitOid | null> {
    this.reads.push('readMergedCommitTree');
    return this.script.mergedTrees.get(mergedCommitOid) ?? null;
  }

  async readReleaseAdmissionFacts(
    _pullRequestNumber: number,
  ): Promise<ReleaseAdmissionFacts> {
    this.reads.push('readReleaseAdmissionFacts');
    return this.script.admissionFacts;
  }

  async readBaseContainment(
    _mergedCommitOid: GitOid,
  ): Promise<ReleaseBaseContainment> {
    this.reads.push('readBaseContainment');
    return this.script.containment;
  }
}

/** The default containment observation: an ordinary release merge commit on `main`. */
export function validContainment(): ReleaseBaseContainment {
  return {
    ref: RELEASE_BASE_REF,
    baseOid: BASE_OID,
    containsMergedCommit: true,
    mergedCommitParents: [BASE_OID, HEAD_OID],
  };
}

interface StoredIntent {
  readonly planDigest: Sha256Hex;
  readonly token: string;
}

/**
 * Append-only, compare-and-put in-memory evidence store. It holds no token, secret, or
 * credential of any external system. Its state survives a simulated process restart
 * because the test keeps the same instance.
 */
export class InMemoryEvidenceStore implements MergeEvidenceStore {
  readonly intents = new Map<Sha256Hex, StoredIntent>();
  readonly outcomes = new Map<Sha256Hex, MergeOutcomeRecord>();
  readonly authorizations = new Map<Sha256Hex, Sha256Hex>();
  readonly attempts = new Map<Sha256Hex, number>();
  unavailable = false;

  /** Digests of every record this store itself appended. */
  readonly #appended = new Set<string>();
  readonly #instanceLabel: string;

  constructor(instanceLabel = 'in-memory-evidence-store') {
    this.#instanceLabel = instanceLabel;
  }

  #token(subject: unknown): string {
    return sha256Utf8(`${this.#instanceLabel}:${sha256Canonical(subject)}`);
  }

  async recordIntent(plan: ReleaseMergePlan): Promise<DurableMergeIntentResult> {
    if (this.unavailable) {
      return { status: 'unavailable', reason: 'store_offline' };
    }
    const planDigest = sha256Canonical(plan);
    const existing = this.intents.get(plan.idempotencyKey);

    if (existing === undefined) {
      const receipt = {
        store: 'merge-evidence/v1' as const,
        key: plan.idempotencyKey,
        planDigest,
        issuedAtUtc: new Date(BASE_TIME_MS).toISOString(),
        token: `receipt-${planDigest.slice(0, 16)}`,
      };
      this.intents.set(plan.idempotencyKey, {
        planDigest,
        token: receipt.token,
      });
      this.#appended.add(this.#token({ intent: planDigest }));
      return { status: 'recorded', receipt };
    }

    if (existing.planDigest !== planDigest) {
      return { status: 'conflict', recordedPlanDigest: existing.planDigest };
    }

    return {
      status: 'already_recorded',
      receipt: {
        store: 'merge-evidence/v1',
        key: plan.idempotencyKey,
        planDigest,
        issuedAtUtc: new Date(BASE_TIME_MS).toISOString(),
        token: existing.token,
      },
    };
  }

  async verifyIntent(receipt: unknown, plan: ReleaseMergePlan): Promise<boolean> {
    const stored = this.intents.get(plan.idempotencyKey);
    if (stored === undefined) {
      return false;
    }
    if (typeof receipt !== 'object' || receipt === null) {
      return false;
    }
    const candidate = receipt as { token?: unknown; planDigest?: unknown };
    return (
      candidate.token === stored.token &&
      candidate.planDigest === stored.planDigest
    );
  }

  async recordAttempt(
    idempotencyKey: Sha256Hex,
    attempt: number,
  ): Promise<DurableAttemptReceipt> {
    // Atomic in this single-threaded model: the count is durable before the caller can
    // reach its mutation.
    this.attempts.set(idempotencyKey, attempt);
    return {
      store: 'merge-evidence/v1',
      key: idempotencyKey,
      attempt,
      issuedAtUtc: new Date(BASE_TIME_MS).toISOString(),
      token: this.#token({ attempt, idempotencyKey }),
    };
  }

  async recordPolicyAuthorization(
    idempotencyKey: Sha256Hex,
    attestation: TrustedCurrentPolicyAttestation,
  ): Promise<DurablePolicyAuthorizationReceipt> {
    this.authorizations.set(idempotencyKey, attestation.canonicalPayloadDigest);
    return {
      store: 'merge-evidence/v1',
      key: idempotencyKey,
      attestationDigest: attestation.canonicalPayloadDigest,
      issuedAtUtc: new Date(BASE_TIME_MS).toISOString(),
      token: this.#token({
        authorization: attestation.canonicalPayloadDigest,
        idempotencyKey,
      }),
    };
  }

  async verifyPolicyAuthorization(
    receipt: unknown,
    attestation: TrustedCurrentPolicyAttestation,
  ): Promise<boolean> {
    if (typeof receipt !== 'object' || receipt === null) {
      return false;
    }
    const candidate = receipt as { token?: unknown; key?: unknown };
    if (typeof candidate.key !== 'string') {
      return false;
    }
    return (
      candidate.token ===
      this.#token({
        authorization: attestation.canonicalPayloadDigest,
        idempotencyKey: candidate.key,
      })
    );
  }

  async recordOutcome(record: MergeOutcomeRecord): Promise<MergeEvidenceRef> {
    this.outcomes.set(record.idempotencyKey, record);
    this.#appended.add(this.#token({ outcome: sha256Canonical(record) }));
    return {
      store: 'merge-evidence/v1',
      key: record.idempotencyKey,
      digest: sha256Canonical(record),
    };
  }

  async read(idempotencyKey: Sha256Hex): Promise<MergeEvidenceHistory> {
    const intent = this.intents.get(idempotencyKey);
    const terminalOutcome = this.outcomes.get(idempotencyKey) ?? null;

    const body = {
      idempotencyKey,
      intent: intent === undefined ? null : { planDigest: intent.planDigest },
      terminalOutcome,
      attempts: this.attempts.get(idempotencyKey) ?? 0,
    };

    const storeIssued =
      (terminalOutcome === null ||
        this.#appended.has(
          this.#token({ outcome: sha256Canonical(terminalOutcome) }),
        )) &&
      (intent === undefined ||
        this.#appended.has(this.#token({ intent: intent.planDigest })));

    const historyDigest = sha256Canonical(body);
    return {
      ...body,
      authenticity: {
        historyDigest,
        token: storeIssued ? this.#token({ history: historyDigest }) : '',
      },
    };
  }

  async verifyHistory(history: unknown): Promise<boolean> {
    if (typeof history !== 'object' || history === null) {
      return false;
    }
    const candidate = history as MergeEvidenceHistory;
    if (
      candidate.authenticity === undefined ||
      candidate.authenticity === null ||
      typeof candidate.authenticity.token !== 'string' ||
      candidate.authenticity.token === ''
    ) {
      return false;
    }
    const body = {
      idempotencyKey: candidate.idempotencyKey,
      intent: candidate.intent,
      terminalOutcome: candidate.terminalOutcome,
      attempts: candidate.attempts,
    };
    const historyDigest = sha256Canonical(body);
    return (
      candidate.authenticity.historyDigest === historyDigest &&
      candidate.authenticity.token === this.#token({ history: historyDigest })
    );
  }
}

export class FakeLeaseManager implements ReleaseExecutorLeaseManager {
  granted = 0;
  released = 0;
  available = true;

  async acquire(
    repositoryId: string,
  ): Promise<
    | { status: 'granted'; lease: ReleaseExecutorLease }
    | { status: 'unavailable'; reason: string }
  > {
    if (!this.available) {
      return { status: 'unavailable', reason: 'held_by_another_plan' };
    }
    this.granted += 1;
    return {
      status: 'granted',
      lease: { repositoryId, baseBranch: 'main', leaseId: `lease-${this.granted}` },
    };
  }

  async release(_lease: ReleaseExecutorLease): Promise<void> {
    this.released += 1;
  }
}

/**
 * The human-controlled attestor, modelled as a request channel with exactly one
 * operation. It cannot observe or mutate policy: it receives a closed subject and
 * returns signed facts about it.
 */
export class FakeAttestorChannel implements ReleaseAttestationRequestChannel {
  readonly requests: PreMutationAuthorizationRequest[] = [];
  #factsFor: (request: PreMutationAuthorizationRequest) => PolicyControlFacts;

  constructor(
    factsFor: (request: PreMutationAuthorizationRequest) => PolicyControlFacts,
  ) {
    this.#factsFor = factsFor;
  }

  get requestCount(): number {
    return this.requests.length;
  }

  async requestPreMutationAuthorization(
    request: PreMutationAuthorizationRequest,
  ): Promise<PolicyControlFacts> {
    this.requests.push(request);
    return this.#factsFor(request);
  }
}
