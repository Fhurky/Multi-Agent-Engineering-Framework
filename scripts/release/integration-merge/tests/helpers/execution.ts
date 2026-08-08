/**
 * Shared harness for the execution, failure-injection, and idempotency fixtures.
 */

import { admit } from '../../admission.ts';
import type {
  GitOid,
  PolicyControlFacts,
  PreMutationAuthorizationRequest,
  ReleaseAdmissionFacts,
  ReleaseAdmissionInput,
  ReleaseBaseContainment,
  ReleaseExecutionDependencies,
  ReleaseExecutionInput,
  ReleaseMergePlan,
  ReleaseMergePortResult,
  ImmutablePullRequestObservation,
} from '../../contracts.ts';
import {
  FakeAttestorChannel,
  FakeClock,
  FakeLeaseManager,
  FakeObservationPort,
  InMemoryEvidenceStore,
  RecordingMergePort,
  fakeSleep,
  validContainment,
} from './fakes.ts';
import {
  BASE_TIME_MS,
  MERGE_PORT_IDENTITY,
  oid,
  preMutationFacts,
  validBaseRef,
  validPullRequest,
  validRequiredChecks,
  validScenario,
} from './fixtures.ts';

export const MERGED_COMMIT_OID = oid('release-merge-commit');

export interface Harness {
  readonly admissionInput: ReleaseAdmissionInput;
  readonly plan: ReleaseMergePlan;
  readonly dependencies: ReleaseExecutionDependencies;
  readonly executionInput: ReleaseExecutionInput;
  readonly clock: FakeClock;
  readonly store: InMemoryEvidenceStore;
  readonly mergePort: RecordingMergePort;
  readonly observation: FakeObservationPort;
  readonly leases: FakeLeaseManager;
  readonly attestor: FakeAttestorChannel;
}

export interface HarnessOptions {
  readonly mergeResults?: readonly ReleaseMergePortResult[];
  readonly mergeFallback?: ReleaseMergePortResult;
  readonly pullRequests?: readonly ImmutablePullRequestObservation[];
  /**
   * The pull-request observation the authoritative revalidation reads. It is separate
   * from the reconciliation queue because revalidation happens before each mutation
   * while reconciliation happens after one.
   */
  readonly admissionPullRequest?: ImmutablePullRequestObservation;
  readonly mergedTree?: GitOid;
  readonly containment?: ReleaseBaseContainment;
  readonly store?: InMemoryEvidenceStore;
  readonly scenario?: ReleaseAdmissionInput;
  readonly suppliedReceipt?: unknown;
  readonly mergePortIdentity?: { brokerId: string; portIdentityDigest: string };
  readonly preMutationFactsFor?: (
    plan: ReleaseMergePlan,
    request: PreMutationAuthorizationRequest,
  ) => PolicyControlFacts;
}

/** The authoritative admission facts derived from one admission input. */
export function admissionFactsFrom(
  input: ReleaseAdmissionInput,
  pullRequest: ImmutablePullRequestObservation,
): ReleaseAdmissionFacts {
  return {
    activation: input.activation,
    manifest: input.manifest,
    manifestSource: input.manifestSource,
    repository: input.repository,
    pullRequest,
    base: input.base,
    gateSnapshot: input.gateSnapshot,
    gateSnapshotSource: input.gateSnapshotSource,
    securitySnapshot: input.securitySnapshot,
    securitySnapshotSource: input.securitySnapshotSource,
    integrationEvidence: input.integrationEvidence,
    integrationEvidenceSource: input.integrationEvidenceSource,
    requiredPolicyProfile: input.requiredPolicyProfile,
    requiredPolicyProfileSource: input.requiredPolicyProfileSource,
    requiredChecks: input.requiredChecks,
    changedPaths: input.changedPaths,
    publishedHeadEvidence: input.publishedHeadEvidence,
  };
}

/**
 * Builds a harness whose admission already succeeded, so an execution fixture can
 * exercise the durable-intent, policy, mutation, and verification phases.
 */
export function buildHarness(options: HarnessOptions = {}): Harness {
  const admissionInput = options.scenario ?? validScenario();
  const admitted = admit(admissionInput);
  if (admitted.status !== 'admitted') {
    throw new Error(
      `harness defect: admission returned ${JSON.stringify(admitted).slice(0, 300)}`,
    );
  }
  const plan = admitted.plan;

  const clock = new FakeClock(BASE_TIME_MS + 5_000);
  const store = options.store ?? new InMemoryEvidenceStore();
  const mergePort = new RecordingMergePort(
    options.mergeResults ?? [
      {
        outcome: 'merged',
        mergedCommitOid: MERGED_COMMIT_OID,
        resultTreeOid: plan.expectedTreeOid,
      },
    ],
    options.mergeFallback ?? { outcome: 'unsupported' },
  );

  const mergedTrees = new Map<GitOid, GitOid>();
  mergedTrees.set(MERGED_COMMIT_OID, options.mergedTree ?? plan.expectedTreeOid);

  const admissionPullRequest =
    options.admissionPullRequest ??
    options.pullRequests?.[0] ??
    validPullRequest();

  const observation = new FakeObservationPort({
    pullRequests: [...(options.pullRequests ?? [validPullRequest()])],
    base: validBaseRef(),
    checks: validRequiredChecks(),
    mergedTrees,
    admissionFacts: admissionFactsFrom(admissionInput, admissionPullRequest),
    containment: options.containment ?? validContainment(),
  });

  const leases = new FakeLeaseManager();

  const attestor = new FakeAttestorChannel((request) =>
    options.preMutationFactsFor === undefined
      ? preMutationFacts(plan)
      : options.preMutationFactsFor(plan, request),
  );

  const dependencies: ReleaseExecutionDependencies = {
    clock,
    sleep: fakeSleep(clock),
    store,
    observation,
    mergePort,
    mergePortIdentity: options.mergePortIdentity ?? MERGE_PORT_IDENTITY,
    attestor,
    leases,
  };

  const preIntentPolicyFacts = admissionInput.policyControlFacts;

  const executionInput: ReleaseExecutionInput = {
    plan,
    preIntentPolicyFacts,
    ...(options.suppliedReceipt === undefined
      ? {}
      : { receipt: options.suppliedReceipt }),
  };

  return {
    admissionInput,
    plan,
    dependencies,
    executionInput,
    clock,
    store,
    mergePort,
    observation,
    leases,
    attestor,
  };
}

/** A pull-request observation that reports the plan already merged. */
export function mergedPullRequest(
  mergedCommitOid: GitOid = MERGED_COMMIT_OID,
): ImmutablePullRequestObservation {
  return {
    ...validPullRequest(),
    state: 'closed',
    merged: true,
    mergedCommitOid,
  };
}
