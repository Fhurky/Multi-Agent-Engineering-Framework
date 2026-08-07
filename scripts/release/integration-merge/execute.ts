/**
 * Side-effecting execution, recovery, and bounded retry.
 *
 * Execution order is fixed:
 *
 *   0. Read the durable evidence history first. Recovery never blindly repeats the
 *      mutation.
 *   1. Re-read the pull request, required checks, published-head evidence bundle,
 *      activation record, and base ref, and re-run the complete pure admission with
 *      those fresh immutable observations. The re-derived plan must be identical.
 *   2. Acquire the one durable executor lease for `(repositoryId, baseBranch)`.
 *   3. Persist intent and verify the store-issued receipt.
 *   4. Obtain the independently signed `pre_mutation` authorization immediately before
 *      the mutation, persist it, verify its receipt, re-run `classifyPolicyControl`,
 *      then call the narrow merge port once.
 *   5. Re-read the pull request, merged commit, and protected base, and verify the
 *      merged tree equals the plan's expected tree.
 *   6. Persist the terminal outcome.
 *
 * The merge port is the sole external mutation. The lease serializes admitted plans
 * locally; GitHub branch protection remains the authoritative server-side
 * serialization and cannot be bypassed.
 */

import {
  RELEASE_BASE_REF,
  RELEASE_EXECUTOR,
} from './contracts.ts';
import type {
  GitOid,
  HumanExceptionRecord,
  ImmutableArtifactRef,
  MergeEvidenceRef,
  MergeOutcomeRecord,
  MergeRefusal,
  MergeRefusalCode,
  PolicyControlFacts,
  ReleaseAdmissionInput,
  ReleaseExecutionDependencies,
  ReleaseExecutionInput,
  ReleaseExecutionResult,
  ReleaseExecutorLease,
  ReleaseMergePlan,
} from './contracts.ts';
import { admit, evidenceStoreKey } from './admission.ts';
import { sha256Canonical } from './canonical-json.ts';
import { buildReleaseMergeRequest } from './merge-port.ts';
import {
  classifyPolicyControl,
  normalizePolicyAttestation,
} from './policy-control.ts';
import type { PolicyAttestationExpectations } from './policy-control.ts';
import { remediationFor } from './remediation.ts';
import {
  isRetryableFailure,
  nextRetryDecision,
} from './retry.ts';

function evidenceRef(
  plan: ReleaseMergePlan,
  subject: unknown,
): MergeEvidenceRef {
  return {
    store: 'merge-evidence/v1',
    key: evidenceStoreKey(plan.repositoryId, plan.idempotencyKey),
    digest: sha256Canonical(subject),
  };
}

function buildRefusal(
  plan: ReleaseMergePlan,
  code: MergeRefusalCode,
  reason: string,
  subjects: readonly ImmutableArtifactRef[],
): MergeRefusal {
  return {
    code,
    executor: RELEASE_EXECUTOR,
    idempotencyKey: plan.idempotencyKey,
    immutableSubjects: subjects,
    evidenceRecord: evidenceRef(plan, {
      executor: RELEASE_EXECUTOR,
      code,
      reason,
      idempotencyKey: plan.idempotencyKey,
    }),
    remediation: remediationFor(code, subjects),
  };
}

async function persistRefusal(
  dependencies: ReleaseExecutionDependencies,
  plan: ReleaseMergePlan,
  refusal: MergeRefusal,
  status: 'refused' | 'outcome_unknown' | 'result_unverifiable',
): Promise<ReleaseExecutionResult> {
  const record: MergeOutcomeRecord = {
    schema: 'merge-outcome/v1',
    executor: RELEASE_EXECUTOR,
    idempotencyKey: plan.idempotencyKey,
    status,
    mergedCommitOid: null,
    resultTreeOid: null,
    refusalCode: refusal.code,
    remediation: refusal.remediation,
    recordedAtUtc: dependencies.clock.nowIso(),
  };
  await dependencies.store.recordOutcome(record);
  return { status: 'refused', refusal };
}

async function persistException(
  dependencies: ReleaseExecutionDependencies,
  plan: ReleaseMergePlan,
  record: HumanExceptionRecord,
): Promise<ReleaseExecutionResult> {
  const outcome: MergeOutcomeRecord = {
    schema: 'merge-outcome/v1',
    executor: RELEASE_EXECUTOR,
    idempotencyKey: plan.idempotencyKey,
    status: 'human_exception_required',
    mergedCommitOid: null,
    resultTreeOid: null,
    refusalCode: null,
    remediation: null,
    recordedAtUtc: dependencies.clock.nowIso(),
  };
  await dependencies.store.recordOutcome(outcome);
  return { status: 'human_exception_required', exception: record };
}

async function verifyMergedResult(
  dependencies: ReleaseExecutionDependencies,
  plan: ReleaseMergePlan,
  mergedCommitOid: GitOid | null,
): Promise<
  | { readonly ok: true; readonly mergedCommitOid: GitOid; readonly treeOid: GitOid }
  | { readonly ok: false; readonly reason: string }
> {
  if (mergedCommitOid === null) {
    return { ok: false, reason: 'merged_commit_absent' };
  }

  const treeOid = await dependencies.observation.readMergedCommitTree(
    mergedCommitOid,
  );
  if (treeOid === null) {
    return { ok: false, reason: 'merged_commit_tree_unreadable' };
  }
  if (treeOid !== plan.expectedTreeOid) {
    return { ok: false, reason: 'merged_tree_not_expected_tree' };
  }

  const base = await dependencies.observation.readBaseRef();
  if (base.ref !== RELEASE_BASE_REF) {
    return { ok: false, reason: 'protected_base_ref_unexpected' };
  }

  return { ok: true, mergedCommitOid, treeOid };
}

async function recordMerged(
  dependencies: ReleaseExecutionDependencies,
  plan: ReleaseMergePlan,
  mergedCommitOid: GitOid,
  resultTreeOid: GitOid,
  adopted: boolean,
): Promise<ReleaseExecutionResult> {
  const record: MergeOutcomeRecord = {
    schema: 'merge-outcome/v1',
    executor: RELEASE_EXECUTOR,
    idempotencyKey: plan.idempotencyKey,
    status: adopted ? 'recovered_merged' : 'merged',
    mergedCommitOid,
    resultTreeOid,
    refusalCode: null,
    remediation: null,
    recordedAtUtc: dependencies.clock.nowIso(),
  };
  const evidence = await dependencies.store.recordOutcome(record);
  return {
    status: 'merged',
    mergedCommitOid,
    resultTreeOid,
    evidence,
    adopted,
  };
}

/**
 * Executes one admitted plan. Returns exactly one result member and performs at most
 * one successful merge for a given idempotency key across restarts and ambiguous
 * responses.
 */
export async function execute(
  dependencies: ReleaseExecutionDependencies,
  input: ReleaseExecutionInput,
): Promise<ReleaseExecutionResult> {
  const plan = input.plan;
  const subjects: readonly ImmutableArtifactRef[] =
    input.admissionInput.manifestSource === null
      ? []
      : [input.admissionInput.manifestSource];

  /* --- Step 0: durable history first ----------------------------------- */

  const history = await dependencies.store.read(plan.idempotencyKey);

  if (history.terminalOutcome !== null) {
    const terminal = history.terminalOutcome;

    if (terminal.status === 'merged' || terminal.status === 'recovered_merged') {
      // A recorded terminal outcome is returned as-is. No API mutation.
      return {
        status: 'merged',
        mergedCommitOid: terminal.mergedCommitOid as GitOid,
        resultTreeOid: terminal.resultTreeOid as GitOid,
        evidence: evidenceRef(plan, {
          executor: RELEASE_EXECUTOR,
          replayOf: plan.idempotencyKey,
        }),
        adopted: true,
      };
    }

    if (terminal.status === 'result_unverifiable') {
      // Further execution for this key is blocked until security and the responsible
      // owner resolve it.
      return {
        status: 'refused',
        refusal: buildRefusal(
          plan,
          'ResultUnverifiable',
          'execution_blocked_for_key',
          subjects,
        ),
      };
    }

    if (terminal.status === 'outcome_unknown') {
      // `OutcomeUnknown` prevents a blind second call. Retry only after a later
      // authoritative read proves the pull request is still open and unmerged.
      const observed = await dependencies.observation.readPullRequest(
        plan.pullRequestNumber,
      );
      if (observed.merged === true) {
        const verified = await verifyMergedResult(
          dependencies,
          plan,
          observed.mergedCommitOid,
        );
        if (!verified.ok) {
          return persistRefusal(
            dependencies,
            plan,
            buildRefusal(plan, 'ResultUnverifiable', verified.reason, subjects),
            'result_unverifiable',
          );
        }
        return recordMerged(
          dependencies,
          plan,
          verified.mergedCommitOid,
          verified.treeOid,
          true,
        );
      }
      if (observed.state !== 'open') {
        return persistRefusal(
          dependencies,
          plan,
          buildRefusal(
            plan,
            'GitHubRejected',
            'pull_request_closed_unmerged',
            subjects,
          ),
          'refused',
        );
      }
      // Falls through to ordinary revalidation with the mutation budget already
      // partly consumed.
    }
  }

  if (history.intent !== null && history.terminalOutcome === null) {
    // Intent without a terminal outcome: reconcile before any retry.
    const observed = await dependencies.observation.readPullRequest(
      plan.pullRequestNumber,
    );
    if (observed.merged === true) {
      const verified = await verifyMergedResult(
        dependencies,
        plan,
        observed.mergedCommitOid,
      );
      if (!verified.ok) {
        return persistRefusal(
          dependencies,
          plan,
          buildRefusal(plan, 'ResultUnverifiable', verified.reason, subjects),
          'result_unverifiable',
        );
      }
      // Adopt the external effect; do not call merge.
      return recordMerged(
        dependencies,
        plan,
        verified.mergedCommitOid,
        verified.treeOid,
        true,
      );
    }
  }

  /* --- Step 1: revalidate against fresh immutable observations ---------- */

  const freshPullRequest = await dependencies.observation.readPullRequest(
    plan.pullRequestNumber,
  );
  const freshBase = await dependencies.observation.readBaseRef();
  const freshChecks = await dependencies.observation.readRequiredChecks(
    freshPullRequest.headOid,
  );

  if (freshPullRequest.headOid !== plan.headOid) {
    return {
      status: 'refused',
      refusal: buildRefusal(plan, 'HeadOidMismatch', 'head_moved', subjects),
    };
  }
  if (freshBase.oid !== plan.baseOid) {
    return {
      status: 'refused',
      refusal: buildRefusal(plan, 'BaseOidMismatch', 'base_moved', subjects),
    };
  }

  const revalidationInput: ReleaseAdmissionInput = {
    ...input.admissionInput,
    evaluatedAtUtc: dependencies.clock.nowIso(),
    pullRequest: freshPullRequest,
    base: freshBase,
    requiredChecks: freshChecks,
  };

  const revalidated = admit(revalidationInput);

  if (revalidated.status === 'refused') {
    return { status: 'refused', refusal: revalidated.refusal };
  }
  if (revalidated.status === 'human_exception_required') {
    return { status: 'human_exception_required', exception: revalidated.exception };
  }
  if (revalidated.plan.idempotencyKey !== plan.idempotencyKey) {
    return {
      status: 'refused',
      refusal: buildRefusal(
        plan,
        'IntentReceiptInvalid',
        'revalidated_plan_differs_from_supplied_plan',
        subjects,
      ),
    };
  }

  /* --- Step 2: durable executor lease ----------------------------------- */

  const leaseResult = await dependencies.leases.acquire(plan.repositoryId);
  if (leaseResult.status !== 'granted') {
    return {
      status: 'refused',
      refusal: buildRefusal(
        plan,
        'IntentNotDurable',
        `executor_lease_unavailable:${leaseResult.reason}`,
        subjects,
      ),
    };
  }
  const lease: ReleaseExecutorLease = leaseResult.lease;

  try {
    /* --- Step 3: durable intent and receipt ----------------------------- */

    const intent = await dependencies.store.recordIntent(plan);

    if (intent.status === 'unavailable') {
      return persistRefusalSafely(
        dependencies,
        plan,
        buildRefusal(
          plan,
          'IntentNotDurable',
          `store_unavailable:${intent.reason}`,
          subjects,
        ),
      );
    }
    if (intent.status === 'conflict') {
      return persistRefusalSafely(
        dependencies,
        plan,
        buildRefusal(
          plan,
          'IntentReceiptInvalid',
          'recorded_plan_bytes_differ',
          subjects,
        ),
      );
    }

    const receiptVerified = await dependencies.store.verifyIntent(
      intent.receipt,
      plan,
    );
    if (!receiptVerified) {
      return persistRefusalSafely(
        dependencies,
        plan,
        buildRefusal(
          plan,
          'IntentReceiptInvalid',
          'store_rejected_issued_receipt',
          subjects,
        ),
      );
    }

    if (input.receipt !== undefined) {
      // A resumed execution carries its earlier receipt; it must still verify.
      const suppliedReceiptVerified = await dependencies.store.verifyIntent(
        input.receipt,
        plan,
      );
      if (!suppliedReceiptVerified) {
        return persistRefusalSafely(
          dependencies,
          plan,
          buildRefusal(
            plan,
            'IntentReceiptInvalid',
            'supplied_receipt_not_store_issued',
            subjects,
          ),
        );
      }
    }

    /* --- Step 4: pre-mutation authorization ----------------------------- */

    const preMutationEvidence = evidenceRef(plan, {
      executor: RELEASE_EXECUTOR,
      phase: 'pre_mutation_policy_control',
      idempotencyKey: plan.idempotencyKey,
    });

    const firstPass = classifyPolicyControl(
      input.preMutationPolicyFacts,
      preMutationEvidence,
    );

    if (firstPass.status === 'human_exception_required') {
      return persistException(dependencies, plan, firstPass.exception);
    }
    if (firstPass.status === 'refused') {
      return persistRefusal(
        dependencies,
        plan,
        buildRefusal(
          plan,
          firstPass.refusalCode,
          'pre_mutation_policy_control',
          subjects,
        ),
        'refused',
      );
    }

    const expectations: PolicyAttestationExpectations = {
      repositoryDatabaseId: input.admissionInput.repository.databaseId,
      repositoryNodeId: input.admissionInput.repository.nodeId,
      repositoryOwner: input.admissionInput.repository.owner,
      repositoryName: input.admissionInput.repository.name,
      protectedRef: RELEASE_BASE_REF,
      pullRequestNumber: plan.pullRequestNumber,
      headOid: plan.headOid,
      baseOid: plan.baseOid,
      admissionContextNonce: plan.policyAdmissionContextNonce,
      admissionContextDigest: plan.policyAdmissionContextDigest,
      authorizationPhase: 'pre_mutation',
      requiredPolicyProfileDigest: plan.requiredPolicyProfileDigest,
      trustRoot:
        input.admissionInput.activation === null
          ? {
              authorityId: '',
              keyId: '',
              publicKeyDigest: '',
              acceptedSchema: 'github-current-policy-attestation/v1',
              revocationChannelId: '',
              pinnedCommit: '',
            }
          : input.admissionInput.activation.policyAttestorTrustRoot,
      expectedPolicyGeneration: plan.policyGeneration,
    };

    const normalized = normalizePolicyAttestation(
      firstPass.attestation,
      expectations,
      dependencies.clock.nowIso(),
    );

    if (normalized.state !== 'current_valid') {
      const facts: PolicyControlFacts = {
        action: input.preMutationPolicyFacts.action,
        observation: normalized,
      };
      const secondPass = classifyPolicyControl(facts, preMutationEvidence);
      if (secondPass.status === 'human_exception_required') {
        return persistException(dependencies, plan, secondPass.exception);
      }
      if (secondPass.status === 'refused') {
        return persistRefusal(
          dependencies,
          plan,
          buildRefusal(
            plan,
            secondPass.refusalCode,
            'pre_mutation_attestation_binding',
            subjects,
          ),
          'refused',
        );
      }
      // A non-current observation cannot classify as usable. Fail closed.
      return persistRefusal(
        dependencies,
        plan,
        buildRefusal(
          plan,
          'PolicyAttestationInvalid',
          'pre_mutation_attestation_binding_unresolved',
          subjects,
        ),
        'refused',
      );
    }

    const preMutation = normalized.attestation;

    // The two authorizations must be independently signed: distinct canonical
    // attestation digests naming the same policy digest, subject, context, and
    // non-revoked monotonic generation.
    if (
      preMutation.canonicalPayloadDigest === plan.preIntentPolicyAttestationDigest
    ) {
      return persistRefusal(
        dependencies,
        plan,
        buildRefusal(
          plan,
          'PolicyAttestationInvalid',
          'pre_mutation_reuses_pre_intent_attestation',
          subjects,
        ),
        'refused',
      );
    }
    if (preMutation.policyDigest !== plan.policyDigest) {
      return persistRefusal(
        dependencies,
        plan,
        buildRefusal(
          plan,
          'PolicyAttestationInvalid',
          'pre_mutation_policy_digest_differs',
          subjects,
        ),
        'refused',
      );
    }

    const authorizationReceipt =
      await dependencies.store.recordPolicyAuthorization(
        plan.idempotencyKey,
        preMutation,
      );
    if (
      authorizationReceipt === null ||
      typeof authorizationReceipt.token !== 'string' ||
      authorizationReceipt.token === '' ||
      authorizationReceipt.attestationDigest !== preMutation.canonicalPayloadDigest
    ) {
      return persistRefusal(
        dependencies,
        plan,
        buildRefusal(
          plan,
          'IntentReceiptInvalid',
          'policy_authorization_receipt_invalid',
          subjects,
        ),
        'refused',
      );
    }

    /* --- Step 4b: the sole mutation, with bounded retry ----------------- */

    return await performBoundedMerge(dependencies, plan, subjects, history.attempts);
  }
  finally {
    await dependencies.leases.release(lease);
  }
}

async function persistRefusalSafely(
  dependencies: ReleaseExecutionDependencies,
  plan: ReleaseMergePlan,
  refusal: MergeRefusal,
): Promise<ReleaseExecutionResult> {
  return persistRefusal(dependencies, plan, refusal, 'refused');
}

async function performBoundedMerge(
  dependencies: ReleaseExecutionDependencies,
  plan: ReleaseMergePlan,
  subjects: readonly ImmutableArtifactRef[],
  priorAttempts: number,
): Promise<ReleaseExecutionResult> {
  const request = buildReleaseMergeRequest(plan);
  const startedMs = dependencies.clock.monotonicMs();

  let attempts = priorAttempts;

  for (;;) {
    attempts += 1;
    const result =
      await dependencies.mergePort.mergeIntegrationPullRequestIntoMain(request);

    if (result.outcome === 'merged') {
      const verified = await verifyMergedResult(
        dependencies,
        plan,
        result.mergedCommitOid,
      );
      if (!verified.ok) {
        return persistRefusal(
          dependencies,
          plan,
          buildRefusal(plan, 'ResultUnverifiable', verified.reason, subjects),
          'result_unverifiable',
        );
      }
      return recordMerged(
        dependencies,
        plan,
        verified.mergedCommitOid,
        verified.treeOid,
        false,
      );
    }

    if (result.outcome === 'conflict') {
      return persistRefusal(
        dependencies,
        plan,
        buildRefusal(plan, 'MergeConflict', 'github_reported_conflict', subjects),
        'refused',
      );
    }

    if (result.outcome === 'rejected') {
      return persistRefusal(
        dependencies,
        plan,
        buildRefusal(
          plan,
          'GitHubRejected',
          `github_rejected:${result.statusCode}`,
          subjects,
        ),
        'refused',
      );
    }

    if (result.outcome === 'unsupported') {
      return persistRefusal(
        dependencies,
        plan,
        buildRefusal(
          plan,
          'UnsupportedOperation',
          'merge_port_reports_operation_unsupported',
          subjects,
        ),
        'refused',
      );
    }

    if (result.outcome === 'ambiguous') {
      // Reconcile before any retry. The mutation may or may not have occurred.
      const observed = await dependencies.observation.readPullRequest(
        plan.pullRequestNumber,
      );
      if (observed.merged === true) {
        const verified = await verifyMergedResult(
          dependencies,
          plan,
          observed.mergedCommitOid,
        );
        if (!verified.ok) {
          return persistRefusal(
            dependencies,
            plan,
            buildRefusal(plan, 'ResultUnverifiable', verified.reason, subjects),
            'result_unverifiable',
          );
        }
        return recordMerged(
          dependencies,
          plan,
          verified.mergedCommitOid,
          verified.treeOid,
          true,
        );
      }
      if (observed.state !== 'open') {
        return persistRefusal(
          dependencies,
          plan,
          buildRefusal(
            plan,
            'GitHubRejected',
            'pull_request_closed_unmerged_after_ambiguous_response',
            subjects,
          ),
          'refused',
        );
      }
      // The authoritative read proves the pull request is still open and unmerged, so
      // a retry is permitted only if the failure class and budget allow it.
      const decision = nextRetryDecision(
        attempts,
        dependencies.clock.monotonicMs() - startedMs,
        null,
      );
      if (decision.status === 'exhausted') {
        return persistRefusal(
          dependencies,
          plan,
          buildRefusal(plan, 'OutcomeUnknown', result.reason, subjects),
          'outcome_unknown',
        );
      }
      await dependencies.sleep(decision.delayMs);
      continue;
    }

    // Transient transport, rate-limit, or server failure.
    if (!isRetryableFailure(result.reason)) {
      return persistRefusal(
        dependencies,
        plan,
        buildRefusal(
          plan,
          'GitHubRejected',
          'non_retryable_transport_class',
          subjects,
        ),
        'refused',
      );
    }

    const decision = nextRetryDecision(
      attempts,
      dependencies.clock.monotonicMs() - startedMs,
      result.retryAfterSeconds,
    );

    if (decision.status === 'exhausted') {
      return persistRefusal(
        dependencies,
        plan,
        buildRefusal(plan, 'RetryExhausted', decision.reason, subjects),
        'refused',
      );
    }

    // Reconcile before the retry: never repeat the mutation while GitHub may already
    // have applied it.
    const observed = await dependencies.observation.readPullRequest(
      plan.pullRequestNumber,
    );
    if (observed.merged === true) {
      const verified = await verifyMergedResult(
        dependencies,
        plan,
        observed.mergedCommitOid,
      );
      if (!verified.ok) {
        return persistRefusal(
          dependencies,
          plan,
          buildRefusal(plan, 'ResultUnverifiable', verified.reason, subjects),
          'result_unverifiable',
        );
      }
      return recordMerged(
        dependencies,
        plan,
        verified.mergedCommitOid,
        verified.treeOid,
        true,
      );
    }
    if (observed.state !== 'open') {
      return persistRefusal(
        dependencies,
        plan,
        buildRefusal(
          plan,
          'GitHubRejected',
          'pull_request_closed_unmerged_before_retry',
          subjects,
        ),
        'refused',
      );
    }
    if (observed.headOid !== plan.headOid) {
      return persistRefusal(
        dependencies,
        plan,
        buildRefusal(plan, 'HeadOidMismatch', 'head_moved_before_retry', subjects),
        'refused',
      );
    }

    await dependencies.sleep(decision.delayMs);
  }
}

/** The logical durable-store key for one plan. */
export function planStoreKey(plan: ReleaseMergePlan): string {
  return evidenceStoreKey(plan.repositoryId, plan.idempotencyKey);
}
