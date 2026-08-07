/**
 * Total, pure release admission.
 *
 * `admit` accepts no flag that suppresses validation, performs no input or output,
 * and returns exactly one `MergeAdmissionResult` member for every input in its
 * declared domain. Only exhaustion of the entire ordered sequence constructs
 * `admitted`; every other path constructs one refusal or one human-exception record
 * and carries no plan.
 *
 * The final result constructor is invoked exactly once and returns immediately at the
 * first applicable step:
 *
 *   1. Invalid source or manifest shape returns its exact source refusal.
 *   2. A missing non-policy activation prerequisite returns `AuthorityNotActivated`.
 *      Live attestor and observer-credential provisioning is deliberately excluded
 *      from this step and is classified at step 3.
 *   3. `classifyPolicyControl` applies its exhaustive order. A non-usable result is
 *      returned immediately; no later predicate can construct another result.
 *   4. A missing or mismatched complete published-head evidence bundle returns its
 *      exact evidence refusal.
 *   5. Gate, security, irreversible-production, immutable-identity, order, check,
 *      path, and tree predicates run in their documented order.
 *
 * If facts for more than one human exception kind coexist, this fixed phase order
 * returns the first only: policy-control, then matching unresolved security risk,
 * then irreversible production.
 */

import {
  RELEASE_BASE_BRANCH,
  RELEASE_BASE_REF,
  RELEASE_EXECUTOR,
  RELEASE_MERGE_METHOD,
  RELEASE_SOURCE_BRANCH,
} from './contracts.ts';
import type {
  GitOid,
  HumanExceptionRecord,
  ImmutableArtifactRef,
  MergeEvidenceRef,
  MergeRefusal,
  MergeRefusalCode,
  PolicyControlFacts,
  ReleaseAdmissionInput,
  ReleaseAdmissionResult,
  ReleaseMergePlan,
  Sha256Hex,
  TrustedCurrentPolicyAttestation,
} from './contracts.ts';
import { isGitOid, isSha256Hex, sha256Canonical } from './canonical-json.ts';
import { validateActivation } from './activation.ts';
import {
  classifyPolicyControl,
  normalizePolicyAttestation,
} from './policy-control.ts';
import type { PolicyAttestationExpectations } from './policy-control.ts';
import {
  evaluateReleaseGates,
  validateReleaseManifest,
} from './release-manifest.ts';
import { matchingBlockingFindings } from './gate-admissibility.ts';
import { validateReleaseLineage } from './release-lineage.ts';
import { validatePublishedHeadEvidence } from './published-head-evidence.ts';
import { evaluateRequiredChecks } from './required-checks.ts';
import { findProtectedPathChanges } from './protected-paths.ts';
import { remediationFor } from './remediation.ts';

/* ------------------------------------------------------------------------- *
 * Evidence references
 * ------------------------------------------------------------------------- */

/** The logical durable-store key. No token or secret is ever placed in it. */
export function evidenceStoreKey(
  repositoryId: string,
  idempotencyKey: string,
): string {
  return `merge-evidence/v1/${repositoryId}/${RELEASE_EXECUTOR}/${idempotencyKey}`;
}

function evidenceRef(
  repositoryId: string,
  keyMaterial: string,
  subject: unknown,
): MergeEvidenceRef {
  return {
    store: 'merge-evidence/v1',
    key: evidenceStoreKey(repositoryId, keyMaterial),
    digest: sha256Canonical(subject),
  };
}

function isRecordObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/* ------------------------------------------------------------------------- *
 * Admission context
 * ------------------------------------------------------------------------- */

export interface AdmissionContext {
  readonly nonce: Sha256Hex;
  readonly digest: Sha256Hex;
}

/**
 * The admission context is constructible before any attestation exists. It excludes
 * every attestation field, signature, idempotency key, and final plan digest, which is
 * what prevents a circular plan/attestation hash dependency. The attestor
 * independently recomputes it from its own closed request.
 */
export function computeAdmissionContext(
  input: ReleaseAdmissionInput,
  expectedTreeOid: GitOid,
  publishedHeadEvidenceDigest: Sha256Hex,
  requiredPolicyProfileDigest: Sha256Hex,
): AdmissionContext {
  const digest = sha256Canonical({
    executor: RELEASE_EXECUTOR,
    repository: {
      repositoryId: input.repository.repositoryId,
      databaseId: input.repository.databaseId,
      nodeId: input.repository.nodeId,
      owner: input.repository.owner,
      name: input.repository.name,
    },
    pullRequestNumber: input.pullRequest.pullRequestNumber,
    protectedRef: RELEASE_BASE_REF,
    headOid: input.pullRequest.headOid,
    baseOid: input.base.oid,
    mergeMethod: RELEASE_MERGE_METHOD,
    expectedTreeOid,
    orderKey: input.orderKey,
    gateSnapshotDigest: input.gateSnapshot.snapshotDigest,
    securitySnapshotDigest: input.securitySnapshot.snapshotDigest,
    publishedHeadEvidenceDigest,
    requiredPolicyProfileDigest,
    admissionContextNonce: input.admissionContextNonce,
  });

  return { nonce: input.admissionContextNonce, digest };
}

/** The idempotency key over the complete canonical plan inputs. */
export function computeIdempotencyKey(
  plan: Omit<ReleaseMergePlan, 'idempotencyKey'>,
): Sha256Hex {
  return sha256Canonical({
    schema: plan.schema,
    executor: plan.executor,
    repositoryId: plan.repositoryId,
    pullRequestNumber: plan.pullRequestNumber,
    headOid: plan.headOid,
    baseBranch: plan.baseBranch,
    baseOid: plan.baseOid,
    mergeMethod: plan.mergeMethod,
    expectedTreeOid: plan.expectedTreeOid,
    orderKey: plan.orderKey,
    gateSnapshotDigest: plan.gateSnapshotDigest,
    securitySnapshotDigest: plan.securitySnapshotDigest,
    publishedHeadEvidenceDigest: plan.publishedHeadEvidenceDigest,
    requiredPolicyProfileDigest: plan.requiredPolicyProfileDigest,
    policyDigest: plan.policyDigest,
    effectivePolicyProfileDigest: plan.effectivePolicyProfileDigest,
    preIntentPolicyAttestationDigest: plan.preIntentPolicyAttestationDigest,
    policyGeneration: plan.policyGeneration,
    policyAdmissionContextNonce: plan.policyAdmissionContextNonce,
    policyAdmissionContextDigest: plan.policyAdmissionContextDigest,
  });
}

/* ------------------------------------------------------------------------- *
 * Result constructors
 * ------------------------------------------------------------------------- */

function refusal(
  code: MergeRefusalCode,
  repositoryId: string,
  keyMaterial: string,
  immutableSubjects: readonly ImmutableArtifactRef[],
  idempotencyKey: Sha256Hex | null,
  reason: string,
): ReleaseAdmissionResult {
  const record: MergeRefusal = {
    code,
    executor: RELEASE_EXECUTOR,
    idempotencyKey,
    immutableSubjects,
    evidenceRecord: evidenceRef(repositoryId, keyMaterial, {
      executor: RELEASE_EXECUTOR,
      code,
      reason,
      immutableSubjects,
    }),
    remediation: remediationFor(code, immutableSubjects),
  };
  return { status: 'refused', refusal: record };
}

function exception(record: HumanExceptionRecord): ReleaseAdmissionResult {
  return { status: 'human_exception_required', exception: record };
}

/* ------------------------------------------------------------------------- *
 * admit
 * ------------------------------------------------------------------------- */

/**
 * Pure, total release admission. Never throws and never performs input or output.
 */
export function admit(input: ReleaseAdmissionInput): ReleaseAdmissionResult {
  /* --- Step 1a: source shape ------------------------------------------- */

  if (!isRecordObject(input)) {
    return refusal(
      'SourceRecordInvalid',
      'unknown',
      'unknown',
      [],
      null,
      'input_absent',
    );
  }

  const repositoryId = isRecordObject(input.repository)
    ? String(input.repository.repositoryId ?? 'unknown')
    : 'unknown';
  const keyMaterial = isSha256Hex(input.admissionContextNonce)
    ? input.admissionContextNonce
    : 'unresolved-admission-context';

  const sourceDefect = validateSourceShape(input);
  if (sourceDefect !== null) {
    return refusal(
      'SourceRecordInvalid',
      repositoryId,
      keyMaterial,
      [],
      null,
      sourceDefect,
    );
  }

  const subjects: readonly ImmutableArtifactRef[] =
    input.manifestSource === null ? [] : [input.manifestSource];

  /* --- Step 1b: manifest shape ----------------------------------------- */

  const manifestValidation = validateReleaseManifest(input.manifest);
  if (manifestValidation.status === 'invalid') {
    return refusal(
      'ReleaseManifestInvalid',
      repositoryId,
      keyMaterial,
      subjects,
      null,
      manifestValidation.reason,
    );
  }
  if (manifestValidation.status === 'domain_missing') {
    return refusal(
      'ReleaseGateDomainMissing',
      repositoryId,
      keyMaterial,
      subjects,
      null,
      `domain_missing:${manifestValidation.domain}`,
    );
  }
  const manifest = manifestValidation.manifest;

  /* --- Step 2: activation ---------------------------------------------- */

  const activation = validateActivation(input.activation);
  if (activation.status === 'not_activated') {
    return refusal(
      'AuthorityNotActivated',
      repositoryId,
      keyMaterial,
      subjects,
      null,
      activation.defects
        .map((defect) => `${defect.member}:${defect.reason}`)
        .join(','),
    );
  }
  const activationRecord = activation.record;

  /* --- Step 3: policy control ------------------------------------------ */

  const expectedTreeOid = input.pullRequest.headTreeOid;
  const context = computeAdmissionContext(
    input,
    expectedTreeOid,
    manifest.publishedHeadEvidenceDigest,
    activationRecord.requiredGitHubPolicyProfileDigest,
  );

  const policyEvidenceRecord = evidenceRef(repositoryId, keyMaterial, {
    executor: RELEASE_EXECUTOR,
    phase: 'policy_control',
    admissionContextDigest: context.digest,
  });

  const firstPass = classifyPolicyControl(
    input.policyControlFacts,
    policyEvidenceRecord,
  );

  if (firstPass.status === 'human_exception_required') {
    return exception(firstPass.exception);
  }
  if (firstPass.status === 'refused') {
    return refusal(
      firstPass.refusalCode,
      repositoryId,
      keyMaterial,
      subjects,
      null,
      'policy_control_refusal',
    );
  }

  // The attestation reached the classifier as `current_valid`. Re-derive that state
  // from the exact expectations rather than trusting the supplied label, then run the
  // same single constructor again so no second result type can appear.
  const expectations: PolicyAttestationExpectations = {
    repositoryDatabaseId: input.repository.databaseId,
    repositoryNodeId: input.repository.nodeId,
    repositoryOwner: input.repository.owner,
    repositoryName: input.repository.name,
    protectedRef: RELEASE_BASE_REF,
    pullRequestNumber: input.pullRequest.pullRequestNumber,
    headOid: input.pullRequest.headOid,
    baseOid: input.base.oid,
    admissionContextNonce: context.nonce,
    admissionContextDigest: context.digest,
    authorizationPhase: 'pre_intent',
    requiredPolicyProfileDigest:
      activationRecord.requiredGitHubPolicyProfileDigest,
    trustRoot: activationRecord.policyAttestorTrustRoot,
    expectedPolicyGeneration: null,
  };

  const normalized = normalizePolicyAttestation(
    firstPass.attestation,
    expectations,
    input.evaluatedAtUtc,
  );

  if (normalized.state !== 'current_valid') {
    const facts: PolicyControlFacts = {
      action: input.policyControlFacts.action,
      observation: normalized,
    };
    const secondPass = classifyPolicyControl(facts, policyEvidenceRecord);
    if (secondPass.status === 'human_exception_required') {
      return exception(secondPass.exception);
    }
    if (secondPass.status === 'refused') {
      return refusal(
        secondPass.refusalCode,
        repositoryId,
        keyMaterial,
        subjects,
        null,
        'policy_attestation_binding_refusal',
      );
    }
    // A non-current observation cannot classify as usable. Fail closed rather than
    // continue with policy evidence that was not independently re-derived.
    return refusal(
      'PolicyAttestationInvalid',
      repositoryId,
      keyMaterial,
      subjects,
      null,
      'policy_attestation_binding_unresolved',
    );
  }

  const attestation: TrustedCurrentPolicyAttestation = normalized.attestation;

  /* --- Step 4: published-head evidence --------------------------------- */

  const evidence = validatePublishedHeadEvidence(input.publishedHeadEvidence);
  if (evidence.status === 'refused') {
    return refusal(
      evidence.code,
      repositoryId,
      keyMaterial,
      subjects,
      null,
      evidence.reason,
    );
  }
  const bundle = evidence.bundle;

  if (bundle.targetCommit !== manifest.sourceOid) {
    return refusal(
      'PublicationMismatch',
      repositoryId,
      keyMaterial,
      subjects,
      null,
      'evidence_target_not_manifest_source',
    );
  }
  if (bundle.branch !== RELEASE_SOURCE_BRANCH) {
    return refusal(
      'PublishedHeadEvidenceMismatch',
      repositoryId,
      keyMaterial,
      subjects,
      null,
      'evidence_branch_not_integration_branch',
    );
  }
  if (
    bundle.control.noLaterContent.pullRequestNumber !==
    input.pullRequest.pullRequestNumber
  ) {
    return refusal(
      'PublishedHeadEvidenceMismatch',
      repositoryId,
      keyMaterial,
      subjects,
      null,
      'evidence_pull_request_mismatch',
    );
  }
  if (evidence.bundleDigest !== manifest.publishedHeadEvidenceDigest) {
    return refusal(
      'PublishedHeadEvidenceMismatch',
      repositoryId,
      keyMaterial,
      subjects,
      null,
      'evidence_digest_not_pinned_value',
    );
  }

  /* --- Step 5a: aggregate gates ---------------------------------------- */

  const releaseTargetCommit = input.pullRequest.headOid;

  if (
    !isRecordObject(input.securitySnapshot) ||
    !isSha256Hex(input.securitySnapshot.snapshotDigest) ||
    !Array.isArray(input.securitySnapshot.findings)
  ) {
    return refusal(
      'SecurityEvidenceMissing',
      repositoryId,
      keyMaterial,
      subjects,
      null,
      'security_snapshot_absent_or_unusable',
    );
  }
  for (const finding of input.securitySnapshot.findings) {
    if (!isSha256Hex(finding.evidenceDigest) || !isGitOid(finding.targetCommit)) {
      return refusal(
        'SecurityEvidenceMissing',
        repositoryId,
        keyMaterial,
        subjects,
        null,
        `security_finding_evidence_invalid:${finding.findingId}`,
      );
    }
  }

  const gates = evaluateReleaseGates(
    manifest,
    input.gateSnapshot,
    input.securitySnapshot.findings,
    releaseTargetCommit,
  );

  if (gates.status === 'not_admissible') {
    return refusal(
      gates.code,
      repositoryId,
      keyMaterial,
      subjects,
      null,
      `release_gate:${gates.domain}`,
    );
  }

  /* --- Step 5b: unresolved blocking security findings ------------------ */

  const blocking = matchingBlockingFindings(
    input.securitySnapshot.findings,
    releaseTargetCommit,
  );

  const securityResult = gates.results.find(
    (entry) => entry.domain === 'security',
  );
  const dischargedFindings = new Set<string>(
    securityResult !== undefined &&
    securityResult.admissibility.status === 'accepted_security_risk'
      ? securityResult.admissibility.acceptedRisks.map(
          (record) => record.findingId,
        )
      : [],
  );

  const undischarged = blocking.filter(
    (finding) => !dischargedFindings.has(finding.findingId),
  );

  if (undischarged.length > 0) {
    // An applicable unresolved High or Critical finding without an exact
    // accepted-risk record detects HUMAN-004's first exception.
    return exception({
      status: 'human_exception_required',
      classification: 'detected',
      kind: 'accept_blocking_high_or_critical_security_risk',
      executor: RELEASE_EXECUTOR,
      immutableSubjects: subjects,
      evidenceRecord: evidenceRef(repositoryId, keyMaterial, {
        executor: RELEASE_EXECUTOR,
        phase: 'unresolved_blocking_security_finding',
        findings: undischarged.map((finding) => finding.findingId),
      }),
    });
  }

  /* --- Step 5c: irreversible production coupling ----------------------- */

  const coupling = manifest.irreversibleProductionCoupling;
  if (coupling.coupled === true) {
    if (coupling.authorization === null) {
      // A merge to `main` is never itself an irreversible production action. Only an
      // explicitly coupled deployment policy detects the second exception.
      return exception({
        status: 'human_exception_required',
        classification: 'detected',
        kind: 'authorize_policy_required_irreversible_production_action',
        executor: RELEASE_EXECUTOR,
        immutableSubjects: subjects,
        evidenceRecord: evidenceRef(repositoryId, keyMaterial, {
          executor: RELEASE_EXECUTOR,
          phase: 'irreversible_production_coupling',
          policyCommit: coupling.policyCommit,
        }),
      });
    }
    if (
      !isGitOid(coupling.authorization.decisionCommit) ||
      typeof coupling.authorization.decisionId !== 'string' ||
      coupling.authorization.decisionId === ''
    ) {
      // An unclassifiable authorization is refused as a typed exception record; it
      // never turns the main merge itself into an implicit exception.
      return exception({
        status: 'human_exception_required',
        classification: 'unclassifiable',
        kind: null,
        candidateKinds: [
          'authorize_policy_required_irreversible_production_action',
        ],
        executor: RELEASE_EXECUTOR,
        immutableSubjects: subjects,
        evidenceRecord: evidenceRef(repositoryId, keyMaterial, {
          executor: RELEASE_EXECUTOR,
          phase: 'irreversible_production_authorization_unclassifiable',
          policyCommit: coupling.policyCommit,
        }),
      });
    }
  }

  /* --- Step 5d: immutable identity ------------------------------------- */

  const pullRequest = input.pullRequest;

  if (pullRequest.repositoryId !== manifest.repositoryId) {
    return refusal(
      'PublicationMismatch',
      repositoryId,
      keyMaterial,
      subjects,
      null,
      'pull_request_repository_mismatch',
    );
  }
  if (pullRequest.state !== 'open' || pullRequest.merged === true) {
    return refusal(
      'TargetNotReviewReady',
      repositoryId,
      keyMaterial,
      subjects,
      null,
      'pull_request_not_open',
    );
  }
  if (pullRequest.headBranch !== RELEASE_SOURCE_BRANCH) {
    return refusal(
      'SourceBranchMismatch',
      repositoryId,
      keyMaterial,
      subjects,
      null,
      'head_branch_not_integration_branch',
    );
  }
  if (pullRequest.baseBranch !== RELEASE_BASE_BRANCH) {
    return refusal(
      'BaseBranchMismatch',
      repositoryId,
      keyMaterial,
      subjects,
      null,
      'base_branch_not_main',
    );
  }
  if (manifest.mergeMethod !== RELEASE_MERGE_METHOD) {
    return refusal(
      'MergeMethodMismatch',
      repositoryId,
      keyMaterial,
      subjects,
      null,
      'manifest_merge_method_not_ordinary_merge',
    );
  }
  if (pullRequest.headOid !== manifest.sourceOid) {
    return refusal(
      'HeadOidMismatch',
      repositoryId,
      keyMaterial,
      subjects,
      null,
      'pull_request_head_not_manifest_source',
    );
  }
  if (pullRequest.baseOid !== manifest.baseOid || input.base.oid !== manifest.baseOid) {
    return refusal(
      'BaseOidMismatch',
      repositoryId,
      keyMaterial,
      subjects,
      null,
      'observed_base_not_manifest_base',
    );
  }
  if (input.base.ref !== RELEASE_BASE_REF) {
    return refusal(
      'BaseBranchMismatch',
      repositoryId,
      keyMaterial,
      subjects,
      null,
      'base_ref_not_refs_heads_main',
    );
  }

  /* --- Step 5e: integration order and evidence ------------------------- */

  if (pullRequest.baseIsAncestorOfHead !== true) {
    return refusal(
      'IntegrationOrderViolation',
      repositoryId,
      keyMaterial,
      subjects,
      null,
      'main_is_not_an_ancestor_of_the_integration_head',
    );
  }

  const lineage = validateReleaseLineage(
    input.integrationEvidence,
    pullRequest.headTreeOid,
    manifest.integrationEvidenceSetDigest,
  );

  if (lineage.status === 'refused') {
    return refusal(
      lineage.code,
      repositoryId,
      keyMaterial,
      subjects,
      null,
      lineage.reason,
    );
  }

  /* --- Step 5f: required checks ---------------------------------------- */

  const checks = evaluateRequiredChecks(input.requiredChecks, pullRequest.headOid);
  if (checks.status === 'refused') {
    return refusal(
      checks.code,
      repositoryId,
      keyMaterial,
      subjects,
      null,
      checks.reason,
    );
  }

  /* --- Step 5g: protected paths ---------------------------------------- */

  const protectedChanges = findProtectedPathChanges(input.changedPaths);
  if (protectedChanges.length > 0) {
    return refusal(
      'ProtectedPathChange',
      repositoryId,
      keyMaterial,
      subjects,
      null,
      protectedChanges.map((finding) => finding.path).join(','),
    );
  }

  /* --- Step 5h: expected tree ------------------------------------------ */

  if (lineage.foldedTreeOid !== expectedTreeOid) {
    return refusal(
      'ExpectedTreeMismatch',
      repositoryId,
      keyMaterial,
      subjects,
      null,
      'folded_tree_not_expected_post_merge_tree',
    );
  }

  /* --- Plan ------------------------------------------------------------- */

  const withoutKey: Omit<ReleaseMergePlan, 'idempotencyKey'> = {
    schema: 'merge-plan/v1',
    executor: RELEASE_EXECUTOR,
    repositoryId: manifest.repositoryId,
    pullRequestNumber: pullRequest.pullRequestNumber,
    sourceBranch: RELEASE_SOURCE_BRANCH,
    headOid: pullRequest.headOid,
    baseBranch: RELEASE_BASE_BRANCH,
    baseOid: input.base.oid,
    mergeMethod: RELEASE_MERGE_METHOD,
    expectedTreeOid,
    orderKey: input.orderKey,
    gateSnapshotDigest: input.gateSnapshot.snapshotDigest,
    securitySnapshotDigest: input.securitySnapshot.snapshotDigest,
    publishedHeadEvidenceDigest: evidence.bundleDigest,
    requiredPolicyProfileDigest:
      activationRecord.requiredGitHubPolicyProfileDigest,
    policyDigest: attestation.policyDigest,
    effectivePolicyProfileDigest: attestation.effectivePolicyProfileDigest,
    preIntentPolicyAttestationDigest: attestation.canonicalPayloadDigest,
    policyGeneration: attestation.issuer.policyGeneration,
    policyAdmissionContextNonce: context.nonce,
    policyAdmissionContextDigest: context.digest,
  };

  const plan: ReleaseMergePlan = {
    ...withoutKey,
    idempotencyKey: computeIdempotencyKey(withoutKey),
  };

  return { status: 'admitted', plan };
}

/* ------------------------------------------------------------------------- *
 * Source shape
 * ------------------------------------------------------------------------- */

function validateSourceShape(input: ReleaseAdmissionInput): string | null {
  if (input.executor !== RELEASE_EXECUTOR) {
    return 'executor_mismatch';
  }
  if (typeof input.evaluatedAtUtc !== 'string' || input.evaluatedAtUtc === '') {
    return 'evaluated_at_missing';
  }
  if (!isRecordObject(input.repository)) {
    return 'repository_identity_missing';
  }
  if (
    typeof input.repository.repositoryId !== 'string' ||
    input.repository.repositoryId === ''
  ) {
    return 'repository_id_missing';
  }
  if (!Number.isSafeInteger(input.repository.databaseId)) {
    return 'repository_database_id_missing';
  }
  if (!isRecordObject(input.pullRequest)) {
    return 'pull_request_observation_missing';
  }
  if (
    !Number.isSafeInteger(input.pullRequest.pullRequestNumber) ||
    input.pullRequest.pullRequestNumber < 1
  ) {
    return 'pull_request_number_invalid';
  }
  if (!isGitOid(input.pullRequest.headOid)) {
    return 'pull_request_head_not_full_oid';
  }
  if (!isGitOid(input.pullRequest.headTreeOid)) {
    return 'pull_request_head_tree_not_full_oid';
  }
  if (!isGitOid(input.pullRequest.baseOid)) {
    return 'pull_request_base_not_full_oid';
  }
  if (!isRecordObject(input.base)) {
    return 'base_observation_missing';
  }
  if (!isGitOid(input.base.oid)) {
    return 'base_oid_not_full_oid';
  }
  if (!isRecordObject(input.gateSnapshot)) {
    return 'gate_snapshot_missing';
  }
  if (!isSha256Hex(input.gateSnapshot.snapshotDigest)) {
    return 'gate_snapshot_digest_invalid';
  }
  if (!Array.isArray(input.gateSnapshot.relations)) {
    return 'gate_snapshot_relations_missing';
  }
  if (!Array.isArray(input.integrationEvidence)) {
    return 'integration_evidence_missing';
  }
  if (!Array.isArray(input.changedPaths)) {
    return 'changed_paths_missing';
  }
  if (typeof input.orderKey !== 'string' || input.orderKey === '') {
    return 'order_key_missing';
  }
  if (!isSha256Hex(input.admissionContextNonce)) {
    return 'admission_context_nonce_invalid';
  }
  if (!isRecordObject(input.policyControlFacts)) {
    return 'policy_control_facts_missing';
  }
  if (!isRecordObject(input.policyControlFacts.action)) {
    return 'policy_control_action_missing';
  }
  if (!isRecordObject(input.policyControlFacts.observation)) {
    return 'policy_control_observation_missing';
  }
  return null;
}
