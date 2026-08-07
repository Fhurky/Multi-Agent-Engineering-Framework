/**
 * Shared harness for the execution, failure-injection, and idempotency fixtures.
 */

import { admit } from '../../admission.ts';
import type {
  GitOid,
  ReleaseAdmissionInput,
  ReleaseExecutionDependencies,
  ReleaseExecutionInput,
  ReleaseMergePlan,
  ReleaseMergePortResult,
  ImmutablePullRequestObservation,
} from '../../contracts.ts';
import {
  FakeClock,
  FakeLeaseManager,
  FakeObservationPort,
  InMemoryEvidenceStore,
  RecordingMergePort,
  fakeSleep,
} from './fakes.ts';
import {
  BASE_TIME_MS,
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
}

export interface HarnessOptions {
  readonly mergeResults?: readonly ReleaseMergePortResult[];
  readonly mergeFallback?: ReleaseMergePortResult;
  readonly pullRequests?: readonly ImmutablePullRequestObservation[];
  readonly mergedTree?: GitOid;
  readonly store?: InMemoryEvidenceStore;
  readonly scenario?: ReleaseAdmissionInput;
  readonly suppliedReceipt?: unknown;
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

  const observation = new FakeObservationPort({
    pullRequests: [...(options.pullRequests ?? [validPullRequest()])],
    base: validBaseRef(),
    checks: validRequiredChecks(),
    mergedTrees,
  });

  const leases = new FakeLeaseManager();

  const dependencies: ReleaseExecutionDependencies = {
    clock,
    sleep: fakeSleep(clock),
    store,
    observation,
    mergePort,
    leases,
  };

  const executionInput: ReleaseExecutionInput = {
    plan,
    admissionInput,
    preMutationPolicyFacts: preMutationFacts(plan),
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
