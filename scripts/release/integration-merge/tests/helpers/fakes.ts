/**
 * Deterministic in-memory fakes for the release merge executor tests.
 *
 * Nothing here contacts a network, spawns a process, reads the environment, or touches
 * the filesystem. The merge port counts every call so a fixture can assert that a
 * refusal produced ZERO merge API calls.
 */

import type {
  Clock,
  DurableMergeIntentResult,
  DurablePolicyAuthorizationReceipt,
  GitOid,
  ImmutablePullRequestObservation,
  ImmutableRefObservation,
  MergeEvidenceHistory,
  MergeEvidenceRef,
  MergeOutcomeRecord,
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
import { sha256Canonical } from '../../canonical-json.ts';
import { BASE_TIME_MS } from './fixtures.ts';

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
}

interface StoredIntent {
  readonly planDigest: Sha256Hex;
  readonly token: string;
}

/**
 * Append-only, compare-and-put in-memory evidence store. It holds no token, secret, or
 * credential. Its state survives a simulated process restart because the test keeps the
 * same instance.
 */
export class InMemoryEvidenceStore implements MergeEvidenceStore {
  readonly intents = new Map<Sha256Hex, StoredIntent>();
  readonly outcomes = new Map<Sha256Hex, MergeOutcomeRecord>();
  readonly authorizations = new Map<Sha256Hex, Sha256Hex>();
  readonly attempts = new Map<Sha256Hex, number>();
  unavailable = false;

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
      token: `policy-receipt-${attestation.canonicalPayloadDigest.slice(0, 16)}`,
    };
  }

  async recordOutcome(record: MergeOutcomeRecord): Promise<MergeEvidenceRef> {
    this.outcomes.set(record.idempotencyKey, record);
    return {
      store: 'merge-evidence/v1',
      key: record.idempotencyKey,
      digest: sha256Canonical(record),
    };
  }

  async read(idempotencyKey: Sha256Hex): Promise<MergeEvidenceHistory> {
    const intent = this.intents.get(idempotencyKey);
    return {
      idempotencyKey,
      intent: intent === undefined ? null : { planDigest: intent.planDigest },
      terminalOutcome: this.outcomes.get(idempotencyKey) ?? null,
      attempts: this.attempts.get(idempotencyKey) ?? 0,
    };
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
