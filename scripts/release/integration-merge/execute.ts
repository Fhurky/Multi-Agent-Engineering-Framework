/**
 * Side-effecting execution, recovery, and bounded retry.
 *
 * Execution order is fixed:
 *
 *   0. Authenticate the supplied plan against itself, then read the durable evidence
 *      history and prove the store issued it. Every durable terminal outcome is
 *      terminal, including `refused` and `human_exception_required`. Recovery never
 *      blindly repeats the mutation.
 *   1. Re-read the complete authoritative admission facts — pull request, base,
 *      checks, activation record, manifest, gate and security snapshots, integration
 *      evidence, required policy profile, changed paths, and published-head evidence —
 *      and re-run the complete pure admission over them. The re-derived plan must be
 *      byte-identical to the supplied one.
 *   2. Acquire the one durable executor lease for `(repositoryId, baseBranch)`.
 *   3. Persist intent and verify the store-issued receipt.
 *   4. For every mutation attempt, in this order: record the attempt durably; re-read
 *      and re-admit the authoritative facts again; obtain, cryptographically verify,
 *      persist, and re-verify a fresh `pre_mutation` authorization; then call the
 *      narrow merge port once. Any drift refuses instead of retrying.
 *   5. Re-read the merged commit and the protected base, and verify the merged tree,
 *      its reachability from and containment by the protected base, and its parent
 *      order.
 *   6. Persist the terminal outcome.
 *
 * The merge port is the sole external mutation. The lease serializes admitted plans
 * locally; GitHub branch protection remains the authoritative server-side
 * serialization and cannot be circumvented.
 */

import {
  RELEASE_BASE_REF,
  RELEASE_EXECUTOR,
} from './contracts.ts';
import type {
  GitOid,
  HumanExceptionKind,
  HumanExceptionRecord,
  ImmutableArtifactRef,
  MergeEvidenceHistory,
  MergeEvidenceRef,
  MergeOutcomeRecord,
  MergeRefusal,
  MergeRefusalCode,
  PolicyControlFacts,
  ReleaseAdmissionFacts,
  ReleaseAdmissionInput,
  ReleaseExecutionDependencies,
  ReleaseExecutionInput,
  ReleaseExecutionResult,
  ReleaseExecutorLease,
  ReleaseMergePlan,
  RequiredGitHubPolicyProfile,
} from './contracts.ts';
import {
  admit,
  computeIdempotencyKey,
  evidenceStoreKey,
  releaseAttestationExpectations,
} from './admission.ts';
import { canonicalJson, isSha256Hex, sha256Canonical } from './canonical-json.ts';
import { buildReleaseMergeRequest } from './merge-port.ts';
import {
  classifyPolicyControl,
  normalizePolicyAttestation,
} from './policy-control.ts';
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

function planDigestOf(plan: ReleaseMergePlan): string {
  return sha256Canonical(plan);
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
    planDigest: planDigestOf(plan),
    status,
    mergedCommitOid: null,
    resultTreeOid: null,
    refusalCode: refusal.code,
    humanExceptionKind: null,
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
    planDigest: planDigestOf(plan),
    status: 'human_exception_required',
    mergedCommitOid: null,
    resultTreeOid: null,
    refusalCode: null,
    humanExceptionKind:
      record.classification === 'detected' ? record.kind : null,
    remediation: null,
    recordedAtUtc: dependencies.clock.nowIso(),
  };
  await dependencies.store.recordOutcome(outcome);
  return { status: 'human_exception_required', exception: record };
}

/**
 * Verifies an immutable merge result against GitHub and the durable plan: the merged
 * tree equals the expected tree, the protected base contains the merged commit, and
 * the commit's parents are the protected base and the release head in that order.
 */
async function verifyMergedResult(
  dependencies: ReleaseExecutionDependencies,
  plan: ReleaseMergePlan,
  mergedCommitOid: GitOid | null,
): Promise<
  | { readonly ok: true; readonly mergedCommitOid: GitOid; readonly treeOid: GitOid }
  | { readonly ok: false; readonly reason: string }
> {
  if (mergedCommitOid === null || mergedCommitOid === undefined) {
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

  const containment = await dependencies.observation.readBaseContainment(
    mergedCommitOid,
  );
  if (containment === null || containment === undefined) {
    return { ok: false, reason: 'protected_base_containment_unreadable' };
  }
  if (containment.ref !== RELEASE_BASE_REF) {
    return { ok: false, reason: 'containment_ref_unexpected' };
  }
  if (containment.containsMergedCommit !== true) {
    // A port can report a matching-tree commit that never reached the protected base.
    return { ok: false, reason: 'merged_commit_not_reachable_from_protected_base' };
  }
  if (!Array.isArray(containment.mergedCommitParents)) {
    return { ok: false, reason: 'merged_commit_parents_unreadable' };
  }
  if (containment.mergedCommitParents.length !== 2) {
    return { ok: false, reason: 'merged_commit_is_not_an_ordinary_merge_commit' };
  }
  if (containment.mergedCommitParents[0] !== plan.baseOid) {
    return { ok: false, reason: 'merged_commit_first_parent_not_protected_base' };
  }
  if (containment.mergedCommitParents[1] !== plan.headOid) {
    return { ok: false, reason: 'merged_commit_second_parent_not_release_head' };
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
    planDigest: planDigestOf(plan),
    status: adopted ? 'recovered_merged' : 'merged',
    mergedCommitOid,
    resultTreeOid,
    refusalCode: null,
    humanExceptionKind: null,
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

/* ------------------------------------------------------------------------- *
 * Plan and durable-record authentication
 * ------------------------------------------------------------------------- */

function isRecordObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * The supplied plan must derive its own idempotency key from its own canonical fields.
 * Retaining an admitted key while altering any other field therefore fails here, before
 * the store, the lease, and the mutation.
 */
export function planSelfDefect(plan: ReleaseMergePlan): string | null {
  if (!isRecordObject(plan)) {
    return 'plan_absent';
  }
  if (plan.schema !== 'merge-plan/v1' || plan.executor !== RELEASE_EXECUTOR) {
    return 'plan_schema_or_executor_mismatch';
  }
  if (typeof plan.repositoryId !== 'string' || plan.repositoryId === '') {
    return 'plan_repository_missing';
  }
  if (!isSha256Hex(plan.idempotencyKey)) {
    return 'plan_idempotency_key_invalid';
  }
  const { idempotencyKey, ...withoutKey } = plan;
  if (computeIdempotencyKey(withoutKey) !== idempotencyKey) {
    return 'plan_idempotency_key_not_derived_from_its_own_fields';
  }
  return null;
}

function terminalOutcomeDefect(
  record: MergeOutcomeRecord,
  plan: ReleaseMergePlan,
): string | null {
  if (!isRecordObject(record)) {
    return 'terminal_outcome_absent';
  }
  if (record.schema !== 'merge-outcome/v1') {
    return 'terminal_outcome_schema_mismatch';
  }
  if (record.executor !== RELEASE_EXECUTOR) {
    return 'terminal_outcome_executor_mismatch';
  }
  if (record.idempotencyKey !== plan.idempotencyKey) {
    return 'terminal_outcome_key_mismatch';
  }
  if (record.planDigest !== planDigestOf(plan)) {
    return 'terminal_outcome_plan_digest_mismatch';
  }
  return null;
}

/* ------------------------------------------------------------------------- *
 * Authoritative fresh revalidation
 * ------------------------------------------------------------------------- */

function admissionInputFrom(
  facts: ReleaseAdmissionFacts,
  plan: ReleaseMergePlan,
  nowUtc: string,
  preIntentPolicyFacts: PolicyControlFacts,
): ReleaseAdmissionInput {
  return {
    executor: RELEASE_EXECUTOR,
    evaluatedAtUtc: nowUtc,
    activation: facts.activation,
    manifest: facts.manifest,
    manifestSource: facts.manifestSource,
    repository: facts.repository,
    pullRequest: facts.pullRequest,
    base: facts.base,
    gateSnapshot: facts.gateSnapshot,
    gateSnapshotSource: facts.gateSnapshotSource,
    securitySnapshot: facts.securitySnapshot,
    securitySnapshotSource: facts.securitySnapshotSource,
    integrationEvidence: facts.integrationEvidence,
    integrationEvidenceSource: facts.integrationEvidenceSource,
    requiredPolicyProfile: facts.requiredPolicyProfile,
    requiredPolicyProfileSource: facts.requiredPolicyProfileSource,
    requiredChecks: facts.requiredChecks,
    changedPaths: facts.changedPaths,
    publishedHeadEvidence: facts.publishedHeadEvidence,
    policyControlFacts: preIntentPolicyFacts,
    orderKey: plan.orderKey,
    admissionContextNonce: plan.policyAdmissionContextNonce,
  };
}

type Revalidation =
  | { readonly ok: true; readonly facts: ReleaseAdmissionFacts }
  | { readonly ok: false; readonly result: ReleaseExecutionResult };

/**
 * Reads every mutable and control-plane admission input fresh and re-runs the complete
 * pure admission over it. Nothing is carried over from an earlier caller-supplied
 * object, so a base, head, check, gate, security, activation, profile, evidence, or
 * path change between planning and mutation refuses rather than being reused.
 */
async function revalidateAuthoritatively(
  dependencies: ReleaseExecutionDependencies,
  plan: ReleaseMergePlan,
  preIntentPolicyFacts: PolicyControlFacts,
): Promise<Revalidation> {
  const facts = await dependencies.observation.readReleaseAdmissionFacts(
    plan.pullRequestNumber,
  );

  if (!isRecordObject(facts)) {
    return {
      ok: false,
      result: {
        status: 'refused',
        refusal: buildRefusal(
          plan,
          'IntentReceiptInvalid',
          'authoritative_admission_facts_unreadable',
          [],
        ),
      },
    };
  }

  const subjects: readonly ImmutableArtifactRef[] =
    facts.manifestSource === null || facts.manifestSource === undefined
      ? []
      : [facts.manifestSource];

  if (facts.pullRequest.headOid !== plan.headOid) {
    return {
      ok: false,
      result: {
        status: 'refused',
        refusal: buildRefusal(plan, 'HeadOidMismatch', 'head_moved', subjects),
      },
    };
  }
  if (facts.base.oid !== plan.baseOid) {
    return {
      ok: false,
      result: {
        status: 'refused',
        refusal: buildRefusal(plan, 'BaseOidMismatch', 'base_moved', subjects),
      },
    };
  }

  const revalidated = admit(
    admissionInputFrom(
      facts,
      plan,
      dependencies.clock.nowIso(),
      preIntentPolicyFacts,
    ),
  );

  if (revalidated.status === 'refused') {
    return { ok: false, result: { status: 'refused', refusal: revalidated.refusal } };
  }
  if (revalidated.status === 'human_exception_required') {
    return {
      ok: false,
      result: {
        status: 'human_exception_required',
        exception: revalidated.exception,
      },
    };
  }
  if (canonicalJson(revalidated.plan) !== canonicalJson(plan)) {
    // Byte equality, not key equality: a substituted plan that retains the admitted key
    // is a different plan and is refused here.
    return {
      ok: false,
      result: {
        status: 'refused',
        refusal: buildRefusal(
          plan,
          'IntentReceiptInvalid',
          'revalidated_plan_differs_from_supplied_plan',
          subjects,
        ),
      },
    };
  }

  const activation = facts.activation;
  if (
    activation === null ||
    activation === undefined ||
    activation.negativeCapabilityTestAttestation.attestedMergePortIdentity.brokerId !==
      dependencies.mergePortIdentity.brokerId ||
    activation.negativeCapabilityTestAttestation.attestedMergePortIdentity
      .portIdentityDigest !== dependencies.mergePortIdentity.portIdentityDigest
  ) {
    // An injected adapter does not inherit the negative-capability attestation.
    return {
      ok: false,
      result: {
        status: 'refused',
        refusal: buildRefusal(
          plan,
          'UnsupportedOperation',
          'merge_port_identity_not_bound_to_the_negative_capability_attestation',
          subjects,
        ),
      },
    };
  }

  return { ok: true, facts };
}

/* ------------------------------------------------------------------------- *
 * Fresh pre-mutation authorization
 * ------------------------------------------------------------------------- */

type Authorization =
  | { readonly ok: true }
  | { readonly ok: false; readonly result: ReleaseExecutionResult };

/**
 * Obtains, cryptographically verifies, persists, and re-verifies one independently
 * signed `pre_mutation` authorization immediately before one mutation attempt. It is
 * requested per attempt, so an authorization can never outlive a retry delay.
 */
async function authorizePreMutation(
  dependencies: ReleaseExecutionDependencies,
  plan: ReleaseMergePlan,
  facts: ReleaseAdmissionFacts,
  subjects: readonly ImmutableArtifactRef[],
  attempt: number,
): Promise<Authorization> {
  const preMutationEvidence = evidenceRef(plan, {
    executor: RELEASE_EXECUTOR,
    phase: 'pre_mutation_policy_control',
    idempotencyKey: plan.idempotencyKey,
    attempt,
  });

  const requested = await dependencies.attestor.requestPreMutationAuthorization({
    executor: RELEASE_EXECUTOR,
    repositoryId: plan.repositoryId,
    pullRequestNumber: plan.pullRequestNumber,
    headOid: plan.headOid,
    baseOid: plan.baseOid,
    admissionContextNonce: plan.policyAdmissionContextNonce,
    admissionContextDigest: plan.policyAdmissionContextDigest,
    requiredPolicyProfileDigest: plan.requiredPolicyProfileDigest,
    policyGeneration: plan.policyGeneration,
    attempt,
  });

  if (!isRecordObject(requested)) {
    return {
      ok: false,
      result: await persistRefusal(
        dependencies,
        plan,
        buildRefusal(
          plan,
          'PolicyObservationUnavailable',
          'pre_mutation_authorization_unavailable',
          subjects,
        ),
        'refused',
      ),
    };
  }

  const firstPass = classifyPolicyControl(requested, preMutationEvidence);

  if (firstPass.status === 'human_exception_required') {
    return {
      ok: false,
      result: await persistException(dependencies, plan, firstPass.exception),
    };
  }
  if (firstPass.status === 'refused') {
    return {
      ok: false,
      result: await persistRefusal(
        dependencies,
        plan,
        buildRefusal(
          plan,
          firstPass.refusalCode,
          'pre_mutation_policy_control',
          subjects,
        ),
        'refused',
      ),
    };
  }

  const activation = facts.activation;
  const profile = facts.requiredPolicyProfile;
  if (activation === null || activation === undefined || profile === null || profile === undefined) {
    return {
      ok: false,
      result: await persistRefusal(
        dependencies,
        plan,
        buildRefusal(
          plan,
          'PolicyAttestationInvalid',
          'pre_mutation_expectations_unavailable',
          subjects,
        ),
        'refused',
      ),
    };
  }

  const context = {
    nonce: plan.policyAdmissionContextNonce,
    digest: plan.policyAdmissionContextDigest,
  };
  const expectations = releaseAttestationExpectations(
    {
      repository: facts.repository,
      pullRequest: {
        pullRequestNumber: plan.pullRequestNumber,
        headOid: plan.headOid,
      },
      base: { oid: plan.baseOid },
    },
    context,
    activation.policyAttestorTrustRoot,
    plan.requiredPolicyProfileDigest,
    profile as RequiredGitHubPolicyProfile,
    'pre_mutation',
    plan.policyGeneration,
  );

  const normalized = normalizePolicyAttestation(
    firstPass.attestation,
    expectations,
    dependencies.clock.nowIso(),
  );

  if (normalized.state !== 'current_valid') {
    const facts_: PolicyControlFacts = {
      action: requested.action,
      observation: normalized,
    };
    const secondPass = classifyPolicyControl(facts_, preMutationEvidence);
    if (secondPass.status === 'human_exception_required') {
      return {
        ok: false,
        result: await persistException(dependencies, plan, secondPass.exception),
      };
    }
    if (secondPass.status === 'refused') {
      return {
        ok: false,
        result: await persistRefusal(
          dependencies,
          plan,
          buildRefusal(
            plan,
            secondPass.refusalCode,
            'pre_mutation_attestation_binding',
            subjects,
          ),
          'refused',
        ),
      };
    }
    return {
      ok: false,
      result: await persistRefusal(
        dependencies,
        plan,
        buildRefusal(
          plan,
          'PolicyAttestationInvalid',
          'pre_mutation_attestation_binding_unresolved',
          subjects,
        ),
        'refused',
      ),
    };
  }

  const preMutation = normalized.attestation;

  // The two authorizations must be independently signed: distinct canonical
  // attestation digests naming the same policy digest, subject, context, and
  // non-revoked monotonic generation.
  if (preMutation.canonicalPayloadDigest === plan.preIntentPolicyAttestationDigest) {
    return {
      ok: false,
      result: await persistRefusal(
        dependencies,
        plan,
        buildRefusal(
          plan,
          'PolicyAttestationInvalid',
          'pre_mutation_reuses_pre_intent_attestation',
          subjects,
        ),
        'refused',
      ),
    };
  }
  if (preMutation.policyDigest !== plan.policyDigest) {
    return {
      ok: false,
      result: await persistRefusal(
        dependencies,
        plan,
        buildRefusal(
          plan,
          'PolicyAttestationInvalid',
          'pre_mutation_policy_digest_differs',
          subjects,
        ),
        'refused',
      ),
    };
  }

  const receipt = await dependencies.store.recordPolicyAuthorization(
    plan.idempotencyKey,
    preMutation,
  );
  if (
    receipt === null ||
    receipt === undefined ||
    typeof receipt.token !== 'string' ||
    receipt.token === '' ||
    receipt.attestationDigest !== preMutation.canonicalPayloadDigest ||
    !(await dependencies.store.verifyPolicyAuthorization(receipt, preMutation))
  ) {
    // The store, not the executor, decides whether its own receipt is genuine.
    return {
      ok: false,
      result: await persistRefusal(
        dependencies,
        plan,
        buildRefusal(
          plan,
          'IntentReceiptInvalid',
          'policy_authorization_receipt_invalid',
          subjects,
        ),
        'refused',
      ),
    };
  }

  return { ok: true };
}

/* ------------------------------------------------------------------------- *
 * execute
 * ------------------------------------------------------------------------- */

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
  const noSubjects: readonly ImmutableArtifactRef[] = [];

  /* --- Step 0a: the supplied plan authenticates itself ------------------ */

  const planDefect = planSelfDefect(plan);
  if (planDefect !== null) {
    return {
      status: 'refused',
      refusal: buildRefusal(plan, 'IntentReceiptInvalid', planDefect, noSubjects),
    };
  }

  /* --- Step 0b: durable history first ----------------------------------- */

  const history: MergeEvidenceHistory = await dependencies.store.read(
    plan.idempotencyKey,
  );

  if (!(await dependencies.store.verifyHistory(history))) {
    // A record the store did not itself append is not release evidence.
    return {
      status: 'refused',
      refusal: buildRefusal(
        plan,
        'IntentReceiptInvalid',
        'durable_history_not_store_authenticated',
        noSubjects,
      ),
    };
  }

  if (history.terminalOutcome !== null && history.terminalOutcome !== undefined) {
    const terminal = history.terminalOutcome;

    const defect = terminalOutcomeDefect(terminal, plan);
    if (defect !== null) {
      return {
        status: 'refused',
        refusal: buildRefusal(plan, 'ResultUnverifiable', defect, noSubjects),
      };
    }

    if (terminal.status === 'merged' || terminal.status === 'recovered_merged') {
      // A recorded terminal success is returned only after the immutable result is
      // re-verified against GitHub and the durable plan. No API mutation.
      const verified = await verifyMergedResult(
        dependencies,
        plan,
        terminal.mergedCommitOid,
      );
      if (!verified.ok) {
        return {
          status: 'refused',
          refusal: buildRefusal(
            plan,
            'ResultUnverifiable',
            verified.reason,
            noSubjects,
          ),
        };
      }
      return {
        status: 'merged',
        mergedCommitOid: verified.mergedCommitOid,
        resultTreeOid: verified.treeOid,
        evidence: evidenceRef(plan, {
          executor: RELEASE_EXECUTOR,
          replayOf: plan.idempotencyKey,
        }),
        adopted: true,
      };
    }

    if (terminal.status === 'refused') {
      // A durable refusal is terminal. Replaying it never reaches the merge port.
      return {
        status: 'refused',
        refusal: buildRefusal(
          plan,
          terminal.refusalCode ?? 'ResultUnverifiable',
          'terminal_refusal_replayed',
          noSubjects,
        ),
      };
    }

    if (terminal.status === 'human_exception_required') {
      // A durable human exception is terminal until a human resolves it.
      const kind: HumanExceptionKind | null = terminal.humanExceptionKind ?? null;
      const evidence = evidenceRef(plan, {
        executor: RELEASE_EXECUTOR,
        replayOf: plan.idempotencyKey,
        phase: 'terminal_human_exception',
      });
      return {
        status: 'human_exception_required',
        exception:
          kind === null
            ? {
                status: 'human_exception_required',
                classification: 'unclassifiable',
                kind: null,
                candidateKinds: [],
                executor: RELEASE_EXECUTOR,
                immutableSubjects: noSubjects,
                evidenceRecord: evidence,
              }
            : {
                status: 'human_exception_required',
                classification: 'detected',
                kind,
                executor: RELEASE_EXECUTOR,
                immutableSubjects: noSubjects,
                evidenceRecord: evidence,
              },
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
          noSubjects,
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
            buildRefusal(plan, 'ResultUnverifiable', verified.reason, noSubjects),
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
            noSubjects,
          ),
          'refused',
        );
      }
      // Falls through to ordinary revalidation with the mutation budget already
      // partly consumed.
    }
  }

  if (
    history.intent !== null &&
    history.intent !== undefined &&
    (history.terminalOutcome === null || history.terminalOutcome === undefined)
  ) {
    if (history.intent.planDigest !== planDigestOf(plan)) {
      return {
        status: 'refused',
        refusal: buildRefusal(
          plan,
          'IntentReceiptInvalid',
          'recorded_intent_names_another_plan',
          noSubjects,
        ),
      };
    }
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
          buildRefusal(plan, 'ResultUnverifiable', verified.reason, noSubjects),
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

  /* --- Step 1: authoritative fresh revalidation ------------------------- */

  const revalidation = await revalidateAuthoritatively(
    dependencies,
    plan,
    input.preIntentPolicyFacts,
  );
  if (!revalidation.ok) {
    return revalidation.result;
  }

  const subjects: readonly ImmutableArtifactRef[] =
    revalidation.facts.manifestSource === null ||
    revalidation.facts.manifestSource === undefined
      ? []
      : [revalidation.facts.manifestSource];

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
      return persistRefusal(
        dependencies,
        plan,
        buildRefusal(
          plan,
          'IntentNotDurable',
          `store_unavailable:${intent.reason}`,
          subjects,
        ),
        'refused',
      );
    }
    if (intent.status === 'conflict') {
      return persistRefusal(
        dependencies,
        plan,
        buildRefusal(
          plan,
          'IntentReceiptInvalid',
          'recorded_plan_bytes_differ',
          subjects,
        ),
        'refused',
      );
    }

    const receiptVerified = await dependencies.store.verifyIntent(
      intent.receipt,
      plan,
    );
    if (!receiptVerified) {
      return persistRefusal(
        dependencies,
        plan,
        buildRefusal(
          plan,
          'IntentReceiptInvalid',
          'store_rejected_issued_receipt',
          subjects,
        ),
        'refused',
      );
    }

    if (input.receipt !== undefined) {
      // A resumed execution carries its earlier receipt; it must still verify.
      const suppliedReceiptVerified = await dependencies.store.verifyIntent(
        input.receipt,
        plan,
      );
      if (!suppliedReceiptVerified) {
        return persistRefusal(
          dependencies,
          plan,
          buildRefusal(
            plan,
            'IntentReceiptInvalid',
            'supplied_receipt_not_store_issued',
            subjects,
          ),
          'refused',
        );
      }
    }

    /* --- Step 4: the sole mutation, with bounded retry ------------------ */

    return await performBoundedMerge(
      dependencies,
      plan,
      subjects,
      history.attempts,
      input.preIntentPolicyFacts,
    );
  }
  finally {
    await dependencies.leases.release(lease);
  }
}

async function performBoundedMerge(
  dependencies: ReleaseExecutionDependencies,
  plan: ReleaseMergePlan,
  subjects: readonly ImmutableArtifactRef[],
  priorAttempts: number,
  preIntentPolicyFacts: PolicyControlFacts,
): Promise<ReleaseExecutionResult> {
  const request = buildReleaseMergeRequest(plan);
  const startedMs = dependencies.clock.monotonicMs();

  let attempts = Number.isSafeInteger(priorAttempts) && priorAttempts > 0
    ? priorAttempts
    : 0;

  if (attempts > 0) {
    // The global budget survives a restart: attempts a previous process recorded are
    // already spent, so a fresh process cannot start the count again from zero.
    const seeded = nextRetryDecision(attempts, 0, null);
    if (seeded.status === 'exhausted') {
      return persistRefusal(
        dependencies,
        plan,
        buildRefusal(plan, 'RetryExhausted', seeded.reason, subjects),
        'refused',
      );
    }
  }

  for (;;) {
    const attemptNumber = attempts + 1;

    /* --- Durable attempt accounting, before the mutation --------------- */

    const attemptReceipt = await dependencies.store.recordAttempt(
      plan.idempotencyKey,
      attemptNumber,
    );
    if (
      attemptReceipt === null ||
      attemptReceipt === undefined ||
      attemptReceipt.attempt !== attemptNumber ||
      typeof attemptReceipt.token !== 'string' ||
      attemptReceipt.token === ''
    ) {
      return persistRefusal(
        dependencies,
        plan,
        buildRefusal(
          plan,
          'IntentNotDurable',
          'attempt_not_durably_recorded',
          subjects,
        ),
        'refused',
      );
    }
    attempts = attemptNumber;

    /* --- Authoritative revalidation immediately before this attempt ---- */

    const revalidation = await revalidateAuthoritatively(
      dependencies,
      plan,
      preIntentPolicyFacts,
    );
    if (!revalidation.ok) {
      return revalidation.result;
    }

    /* --- A fresh authorization for this attempt alone ------------------ */

    const authorization = await authorizePreMutation(
      dependencies,
      plan,
      revalidation.facts,
      subjects,
      attemptNumber,
    );
    if (!authorization.ok) {
      return authorization.result;
    }

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

/** Exposed for fixtures that need the same admission input the executor re-derives. */
export { admissionInputFrom };
