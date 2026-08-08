/**
 * Total, pure release admission.
 *
 * `admit` accepts no flag that suppresses validation, performs no input or output,
 * and returns exactly one `MergeAdmissionResult` member for every input in its
 * declared domain. Only exhaustion of the entire ordered sequence constructs
 * `admitted`; every other path constructs one refusal or one human-exception record
 * and carries no plan.
 *
 * Totality first. The complete runtime input shape is validated before any dereference
 * or digest computation, so a hostile `unknown` value returns a typed refusal instead of
 * throwing. The whole ordered sequence additionally runs inside a total wrapper: an
 * input that canonical JSON cannot even represent still returns one typed refusal.
 *
 * The final result constructor is invoked exactly once and returns immediately at the
 * first applicable step:
 *
 *   0. A structurally unusable runtime input returns its exact source refusal.
 *   1. Invalid source or manifest shape returns its exact source refusal, and the
 *      manifest is bound to its immutable artifact reference.
 *   2. A missing non-policy activation prerequisite returns `AuthorityNotActivated`.
 *      Live attestor and observer-credential provisioning is deliberately excluded
 *      from this step and is classified at step 3. The activation-pinned required
 *      policy profile is resolved here, because every later authority predicate is
 *      derived from it rather than from a caller selection.
 *   3. `classifyPolicyControl` applies its exhaustive order. A non-usable result is
 *      returned immediately; no later predicate can construct another result.
 *   4. A missing or mismatched complete published-head evidence bundle returns its
 *      exact evidence refusal, bound to the expected remote ref and resolved bases.
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
  RELEASE_REMOTE_REF,
  RELEASE_SOURCE_BRANCH,
} from './contracts.ts';
import type {
  ExecutorAppIdentity,
  GitOid,
  HumanExceptionRecord,
  ImmutableArtifactRef,
  ImmutableHumanDecisionRef,
  ImmutableProvenancedArtifactRef,
  MergeEvidenceRef,
  MergeRefusal,
  MergeRefusalCode,
  PolicyControlFacts,
  ReleaseAdmissionInput,
  ReleaseAdmissionResult,
  ReleaseAuthorityPort,
  ReleaseExecutorCapability,
  ReleaseGateManifest,
  ReleaseMergePlan,
  RequiredGitHubPolicyProfile,
  Sha256Hex,
  TrustedCurrentPolicyAttestation,
} from './contracts.ts';
import {
  canonicalJson,
  hasControlCharacters,
  isGitOid,
  isSha256Hex,
  selfDigest,
  sha256Canonical,
} from './canonical-json.ts';
import { validateActivation } from './activation.ts';
import { resolveReleaseExecutorCapability } from './composition-capability.ts';
import {
  classifyPolicyControl,
  executorPermissionMapIsConfined,
  normalizePolicyAttestation,
} from './policy-control.ts';
import type { PolicyAttestationExpectations } from './policy-control.ts';
import {
  evaluateReleaseGates,
  validateReleaseManifest,
} from './release-manifest.ts';
import {
  aggregateGateSnapshotDigest,
  matchingBlockingFindings,
  releaseSecurityFindingDefect,
  releaseSecuritySnapshotDigest,
} from './gate-admissibility.ts';
import {
  integrationEvidenceSetDigest,
  validateReleaseLineage,
} from './release-lineage.ts';
import {
  bindPublishedHeadEvidence,
  validatePublishedHeadEvidence,
} from './published-head-evidence.ts';
import { evaluateRequiredChecks } from './required-checks.ts';
import { findProtectedPathChanges } from './protected-paths.ts';
import { validateAuthenticatedImmutableDiff } from './immutable-diff.ts';
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

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function artifactAuthentic(
  authority: ReleaseAuthorityPort,
  ref: ImmutableProvenancedArtifactRef,
): boolean {
  const resolved = authority.resolveArtifact(ref);
  return (
    resolved !== null &&
    resolved.producerAuthorized === true &&
    isGitOid(resolved.authorizationEvidenceCommit) &&
    canonicalJson(resolved.ref) === canonicalJson(ref) &&
    sha256Canonical(resolved.canonicalValue) === ref.digest &&
    canonicalJson(resolved.producer) === canonicalJson(ref.producer)
  );
}

/* ------------------------------------------------------------------------- *
 * Immutable artifact provenance
 * ------------------------------------------------------------------------- */

/**
 * A provenanced artifact reference is usable only when it names an immutable commit,
 * a path, a digest, an expected kind, and a producer that is not a merge executor.
 * Absent provenance is a defect: this is the check that stopped an executor-produced
 * artifact and an artifact with no producer at all from being accepted.
 */
export function provenancedArtifactDefect(
  value: unknown,
  expectedKind: string,
): string | null {
  if (!isRecordObject(value)) {
    return 'artifact_absent';
  }
  const ref = value as unknown as ImmutableProvenancedArtifactRef;
  if (ref.kind !== expectedKind) {
    return 'artifact_kind_mismatch';
  }
  if (hasControlCharacters(ref.kind)) {
    return 'artifact_kind_control_character';
  }
  if (!isGitOid(ref.commit)) {
    return 'artifact_commit_not_immutable';
  }
  if (!isNonEmptyString(ref.path) || hasControlCharacters(ref.path)) {
    return 'artifact_path_missing';
  }
  if (!isSha256Hex(ref.digest)) {
    return 'artifact_digest_invalid';
  }
  if (ref.producedByExecutor !== false) {
    return ref.producedByExecutor === true
      ? 'artifact_produced_by_executor'
      : 'artifact_provenance_absent';
  }
  if (!isRecordObject(ref.producer)) {
    return 'artifact_provenance_absent';
  }
  if (
    !isNonEmptyString(ref.producer.principalId) ||
    hasControlCharacters(ref.producer.principalId)
  ) {
    return 'artifact_provenance_absent';
  }
  if (ref.producer.principalType === 'merge_executor') {
    return 'artifact_produced_by_executor';
  }
  if (
    ref.producer.principalType !== 'human' &&
    ref.producer.principalType !== 'agent_role'
  ) {
    return 'artifact_provenance_absent';
  }
  if (!isGitOid(ref.producer.authorizationCommit)) {
    return 'artifact_provenance_absent';
  }
  return null;
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
  immutableDiffDigest: Sha256Hex,
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
    immutableDiffDigest,
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
    immutableDiffDigest: plan.immutableDiffDigest,
    requiredPolicyProfileDigest: plan.requiredPolicyProfileDigest,
    policyDigest: plan.policyDigest,
    effectivePolicyProfileDigest: plan.effectivePolicyProfileDigest,
    preIntentPolicyAttestationDigest: plan.preIntentPolicyAttestationDigest,
    policyGeneration: plan.policyGeneration,
    policyAdmissionContextNonce: plan.policyAdmissionContextNonce,
    policyAdmissionContextDigest: plan.policyAdmissionContextDigest,
  });
}

/**
 * The exact scope an irreversible-production authorization may discharge. A decision
 * that does not name this policy commit, release head, repository, and action has a
 * different scope digest and cannot authorize this release.
 */
export function expectedIrreversibleAuthorizationScopeDigest(
  repositoryId: string,
  policyCommit: GitOid,
  releaseHeadOid: GitOid,
): Sha256Hex {
  return sha256Canonical({
    schema: 'irreversible-production-authorization-scope/v1',
    executor: RELEASE_EXECUTOR,
    action: 'authorize_policy_required_irreversible_production_action',
    repositoryId,
    policyCommit,
    releaseHeadOid,
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
export function admit(input: ReleaseAdmissionInput): ReleaseAdmissionResult;
export function admit(
  input: ReleaseAdmissionInput,
  capability: ReleaseExecutorCapability | null,
): ReleaseAdmissionResult;
export function admit(
  input: ReleaseAdmissionInput,
  capability: ReleaseExecutorCapability | null = null,
): ReleaseAdmissionResult {
  try {
    return admitOrdered(input, capability);
  }
  catch {
    // Backstop for a value no canonical encoder can represent, such as a symbol or a
    // bigint reached through a declared boundary. The result is still exactly one
    // typed member, built from no caller-derived material.
    return refusal(
      'SourceRecordInvalid',
      'unknown',
      'unknown',
      [],
      null,
      'input_not_canonically_representable',
    );
  }
}

function admitOrdered(
  input: ReleaseAdmissionInput,
  capabilityDependency: ReleaseExecutorCapability | null,
): ReleaseAdmissionResult {
  /* --- Step 0: complete runtime input shape ----------------------------- */

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

  const shape = validateSourceShape(input);
  if (shape !== null && shape.scope === 'source') {
    return refusal(
      'SourceRecordInvalid',
      repositoryId,
      keyMaterial,
      [],
      null,
      shape.reason,
    );
  }

  /* --- Step 1: manifest shape and artifact binding ---------------------- */

  const manifestValidation = validateReleaseManifest(input.manifest);
  if (manifestValidation.status === 'invalid') {
    return refusal(
      'ReleaseManifestInvalid',
      repositoryId,
      keyMaterial,
      [],
      null,
      manifestValidation.reason,
    );
  }
  if (manifestValidation.status === 'domain_missing') {
    return refusal(
      'ReleaseGateDomainMissing',
      repositoryId,
      keyMaterial,
      [],
      null,
      `domain_missing:${manifestValidation.domain}`,
    );
  }
  const manifest: ReleaseGateManifest = manifestValidation.manifest;

  const manifestSourceDefect = provenancedArtifactDefect(
    input.manifestSource,
    'release-gate-manifest',
  );
  if (manifestSourceDefect !== null) {
    return refusal(
      'ReleaseManifestInvalid',
      repositoryId,
      keyMaterial,
      [],
      null,
      `manifest_source:${manifestSourceDefect}`,
    );
  }
  const manifestSource = input.manifestSource as ImmutableProvenancedArtifactRef;
  if (manifestSource.digest !== sha256Canonical(manifest)) {
    // The artifact reference is a subject label only until its digest is proven to
    // contain the supplied manifest bytes.
    return refusal(
      'ReleaseManifestInvalid',
      repositoryId,
      keyMaterial,
      [],
      null,
      'manifest_source_digest_does_not_contain_manifest',
    );
  }

  const subjects: readonly ImmutableArtifactRef[] = [manifestSource];

  /* --- Step 2: activation and the pinned required-policy profile -------- */

  const activation = validateActivation(input.activation, capabilityDependency);
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
  const capabilityRecord = resolveReleaseExecutorCapability(capabilityDependency);
  if (capabilityRecord === null) {
    return refusal(
      'AuthorityNotActivated', repositoryId, keyMaterial, subjects, null,
      'nominal_release_executor_capability_absent',
    );
  }
  const authority = capabilityRecord.authority;

  const profileSourceDefect = provenancedArtifactDefect(
    input.requiredPolicyProfileSource,
    'required-github-policy-profile',
  );
  if (profileSourceDefect !== null) {
    return refusal(
      'AuthorityNotActivated',
      repositoryId,
      keyMaterial,
      subjects,
      null,
      `requiredPolicyProfileSource:${profileSourceDefect}`,
    );
  }
  const profileSource =
    input.requiredPolicyProfileSource as ImmutableProvenancedArtifactRef;

  const profileDefect = requiredPolicyProfileDefect(input.requiredPolicyProfile);
  if (profileDefect !== null) {
    return refusal(
      'AuthorityNotActivated',
      repositoryId,
      keyMaterial,
      subjects,
      null,
      `requiredPolicyProfile:${profileDefect}`,
    );
  }
  const profile = input.requiredPolicyProfile as RequiredGitHubPolicyProfile;
  const profileDigest = sha256Canonical(profile);

  if (
    profileDigest !== activationRecord.requiredGitHubPolicyProfileDigest ||
    profileSource.digest !== activationRecord.requiredGitHubPolicyProfileDigest ||
    profileSource.commit !== activationRecord.requiredGitHubPolicyProfile.commit ||
    profileSource.path !== activationRecord.requiredGitHubPolicyProfile.path
  ) {
    return refusal(
      'AuthorityNotActivated',
      repositoryId,
      keyMaterial,
      subjects,
      null,
      'required_policy_profile_not_the_activation_pinned_artifact',
    );
  }

  if (!artifactAuthentic(authority, profileSource)) {
    return refusal(
      'AuthorityNotActivated',
      repositoryId,
      keyMaterial,
      subjects,
      null,
      'activation_pinned_source_unresolvable',
    );
  }
  if (!artifactAuthentic(authority, manifestSource)) {
    return refusal(
      'SourceRecordInvalid',
      repositoryId,
      keyMaterial,
      subjects,
      null,
      'manifest_source_unresolvable_or_producer_unauthenticated',
    );
  }
  if (profile.repositoryId !== manifest.repositoryId) {
    return refusal(
      'AuthorityNotActivated',
      repositoryId,
      keyMaterial,
      subjects,
      null,
      'required_policy_profile_names_another_repository',
    );
  }

  // The pinned profile is the floor for every aggregate requirement. A manifest may
  // declare a stricter round, but it can neither lower a floor nor retarget a lineage.
  for (const pinned of profile.releaseGateRequirements) {
    const declared = manifest.requirements.find(
      (candidate) => candidate.domain === pinned.domain,
    );
    if (declared === undefined) {
      return refusal(
        'ReleaseGateDomainMissing',
        repositoryId,
        keyMaterial,
        subjects,
        null,
        `domain_missing:${pinned.domain}`,
      );
    }
    if (
      declared.lineage !== pinned.lineage ||
      declared.gateClass !== 'aggregate' ||
      declared.minimumRound < pinned.minimumRound
    ) {
      return refusal(
        'ReleaseManifestInvalid',
        repositoryId,
        keyMaterial,
        subjects,
        null,
        `manifest_requirement_weaker_than_the_pinned_profile:${pinned.domain}`,
      );
    }
  }

  /* --- Step 2b: security evidence shape, before any dereference --------- */

  if (shape !== null) {
    return refusal(
      'SecurityEvidenceMissing',
      repositoryId,
      keyMaterial,
      subjects,
      null,
      shape.reason,
    );
  }

  for (const finding of input.securitySnapshot.findings) {
    const findingDefect = releaseSecurityFindingDefect(finding);
    if (findingDefect !== null) {
      return refusal(
        'SecurityEvidenceMissing', repositoryId, keyMaterial, subjects, null,
        findingDefect,
      );
    }
  }

  const authorityUniverse = authority.enumerateAdmissionUniverse(
    repositoryId,
    input.pullRequest.headOid,
  );
  const publicationIds =
    input.publishedHeadEvidence?.status === 'complete'
      ? [
          ...input.publishedHeadEvidence.author.commands,
          ...input.publishedHeadEvidence.control.commands,
        ].map((command) => command.evidenceId).sort()
      : [];
  if (
    authorityUniverse === null ||
    !isGitOid(authorityUniverse.evidenceCommit) ||
    selfDigest(authorityUniverse, 'universeDigest') !==
      authorityUniverse.universeDigest ||
    canonicalJson(authorityUniverse.manifestSource) !==
      canonicalJson(input.manifestSource) ||
    canonicalJson(authorityUniverse.gateSnapshotSource) !==
      canonicalJson(input.gateSnapshotSource) ||
    canonicalJson(authorityUniverse.securitySnapshotSource) !==
      canonicalJson(input.securitySnapshotSource) ||
    canonicalJson(authorityUniverse.integrationEvidenceSource) !==
      canonicalJson(input.integrationEvidenceSource) ||
    canonicalJson(authorityUniverse.requiredPolicyProfileSource) !==
      canonicalJson(input.requiredPolicyProfileSource) ||
    canonicalJson(authorityUniverse.gateRelations) !==
      canonicalJson(input.gateSnapshot.relations) ||
    canonicalJson(authorityUniverse.securityFindings) !==
      canonicalJson(input.securitySnapshot.findings) ||
    canonicalJson(authorityUniverse.integrationEvidence) !==
      canonicalJson(input.integrationEvidence) ||
    canonicalJson(authorityUniverse.requiredChecks) !==
      canonicalJson(input.requiredChecks) ||
    canonicalJson([...authorityUniverse.publicationCommandEvidenceIds].sort()) !==
      canonicalJson(publicationIds)
  ) {
    const universeCode: MergeRefusalCode =
      authorityUniverse !== null &&
      canonicalJson(authorityUniverse.securityFindings) !==
        canonicalJson(input.securitySnapshot.findings)
        ? 'SecurityEvidenceMissing'
        : authorityUniverse !== null &&
            canonicalJson(authorityUniverse.integrationEvidence) !==
              canonicalJson(input.integrationEvidence)
          ? 'IntegrationEvidenceIncomplete'
          : 'SourceRecordInvalid';
    return refusal(
      universeCode,
      repositoryId,
      keyMaterial,
      subjects,
      null,
      'authenticated_authority_universe_mismatch',
    );
  }

  const diffValidation = validateAuthenticatedImmutableDiff(
    authorityUniverse.immutableDiff,
    {
      repositoryId,
      baseOid: input.base.oid,
      headOid: input.pullRequest.headOid,
    },
  );
  if (diffValidation.status === 'invalid') {
    return refusal(
      'SourceRecordInvalid', repositoryId, keyMaterial, subjects, null,
      diffValidation.reason,
    );
  }
  const suppliedChangedPaths = [...input.changedPaths].sort();
  if (
    new Set(suppliedChangedPaths).size !== suppliedChangedPaths.length ||
    canonicalJson(suppliedChangedPaths) !== canonicalJson(diffValidation.changedPaths)
  ) {
    return refusal(
      'SourceRecordInvalid', repositoryId, keyMaterial, subjects, null,
      'caller_changed_paths_do_not_equal_authenticated_immutable_diff',
    );
  }
  const authenticatedChangedPaths = diffValidation.changedPaths;

  /* --- Step 2c: snapshot digests bound to canonical bytes --------------- */

  const gateSourceDefect = provenancedArtifactDefect(
    input.gateSnapshotSource,
    'aggregate-gate-snapshot',
  );
  if (gateSourceDefect !== null) {
    return refusal(
      'SourceRecordInvalid',
      repositoryId,
      keyMaterial,
      subjects,
      null,
      `gateSnapshotSource:${gateSourceDefect}`,
    );
  }
  const recomputedGateDigest = aggregateGateSnapshotDigest(
    input.gateSnapshot.relations,
  );
  if (
    recomputedGateDigest !== input.gateSnapshot.snapshotDigest ||
    (input.gateSnapshotSource as ImmutableProvenancedArtifactRef).digest !==
      recomputedGateDigest
  ) {
    return refusal(
      'SourceRecordInvalid',
      repositoryId,
      keyMaterial,
      subjects,
      null,
      'gate_snapshot_digest_not_over_its_own_relations',
    );
  }
  if (!artifactAuthentic(authority, input.gateSnapshotSource)) {
    return refusal(
      'SourceRecordInvalid', repositoryId, keyMaterial, subjects, null,
      'gate_snapshot_source_unresolvable',
    );
  }

  const securitySourceDefect = provenancedArtifactDefect(
    input.securitySnapshotSource,
    'release-security-snapshot',
  );
  if (securitySourceDefect !== null) {
    return refusal(
      'SecurityEvidenceMissing',
      repositoryId,
      keyMaterial,
      subjects,
      null,
      `securitySnapshotSource:${securitySourceDefect}`,
    );
  }
  const recomputedSecurityDigest = releaseSecuritySnapshotDigest(
    input.securitySnapshot.findings,
  );
  if (
    recomputedSecurityDigest !== input.securitySnapshot.snapshotDigest ||
    (input.securitySnapshotSource as ImmutableProvenancedArtifactRef).digest !==
      recomputedSecurityDigest
  ) {
    return refusal(
      'SecurityEvidenceMissing',
      repositoryId,
      keyMaterial,
      subjects,
      null,
      'security_snapshot_digest_not_over_its_own_findings',
    );
  }
  if (!artifactAuthentic(authority, input.securitySnapshotSource)) {
    return refusal(
      'SecurityEvidenceMissing', repositoryId, keyMaterial, subjects, null,
      'security_snapshot_source_unresolvable',
    );
  }

  const integrationSourceDefect = provenancedArtifactDefect(
    input.integrationEvidenceSource,
    'release-integration-evidence',
  );
  if (integrationSourceDefect !== null) {
    return refusal(
      'IntegrationEvidenceIncomplete',
      repositoryId,
      keyMaterial,
      subjects,
      null,
      `integrationEvidenceSource:${integrationSourceDefect}`,
    );
  }
  if (
    (input.integrationEvidenceSource as ImmutableProvenancedArtifactRef).digest !==
    integrationEvidenceSetDigest(input.integrationEvidence)
  ) {
    return refusal(
      'IntegrationEvidenceIncomplete',
      repositoryId,
      keyMaterial,
      subjects,
      null,
      'integration_evidence_source_digest_does_not_contain_the_evidence_set',
    );
  }
  if (!artifactAuthentic(authority, input.integrationEvidenceSource)) {
    return refusal(
      'IntegrationEvidenceIncomplete', repositoryId, keyMaterial, subjects, null,
      'integration_evidence_source_unresolvable',
    );
  }

  /* --- Step 3: policy control ------------------------------------------ */

  const expectedTreeOid = input.pullRequest.headTreeOid;
  const context = computeAdmissionContext(
    input,
    expectedTreeOid,
    manifest.publishedHeadEvidenceDigest,
    activationRecord.requiredGitHubPolicyProfileDigest,
    diffValidation.diff.evidenceDigest,
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
  const expectations: PolicyAttestationExpectations = releaseAttestationExpectations(
    input,
    context,
    activationRecord.policyAttestorTrustRoot,
    activationRecord.requiredGitHubPolicyProfileDigest,
    profile,
    'pre_intent',
    null,
    authority,
  );

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

  const authenticatedPhaseIdentities = [
    ...bundle.author.commands,
    ...bundle.control.commands,
  ].map((command) => authority.authenticateExecutionEvidence(command.evidenceId));
  if (authenticatedPhaseIdentities.some((identity) => identity === null)) {
    return refusal(
      'PublishedHeadEvidenceMismatch',
      repositoryId,
      keyMaterial,
      subjects,
      null,
      'publication_execution_identity_unauthenticated',
    );
  }
  const commands = [...bundle.author.commands, ...bundle.control.commands];
  for (let index = 0; index < commands.length; index += 1) {
    const command = commands[index]!;
    const identity = authenticatedPhaseIdentities[index]!;
    if (
      identity === null ||
      identity.evidenceId !== command.evidenceId ||
      identity.phase !== command.phase ||
      identity.principalId !== command.producer.role ||
      identity.executionSessionId !== command.producer.executionSessionId ||
      !isGitOid(identity.evidenceCommit)
    ) {
      return refusal(
        'PublishedHeadEvidenceMismatch', repositoryId, keyMaterial, subjects, null,
        'publication_identity_not_bound_to_command',
      );
    }
  }
  const authorIdentities = authenticatedPhaseIdentities.filter(
    (identity) => identity?.phase === 'author_pre_publication',
  );
  const controlIdentities = authenticatedPhaseIdentities.filter(
    (identity) => identity?.phase === 'control_post_publication',
  );
  const authorIdentity = authorIdentities[0];
  const controlIdentity = controlIdentities[0];
  if (
    authorIdentity === undefined ||
    controlIdentity === undefined ||
    authorIdentities.some(
      (identity) =>
        identity?.principalId !== authorIdentity.principalId ||
        identity.executionSessionId !== authorIdentity.executionSessionId ||
        identity.executionInstanceId !== authorIdentity.executionInstanceId ||
        identity.identityAuthorityId !== authorIdentity.identityAuthorityId ||
        identity.evidenceCommit !== authorIdentity.evidenceCommit,
    ) ||
    controlIdentities.some(
      (identity) =>
        identity?.principalId !== controlIdentity.principalId ||
        identity.executionSessionId !== controlIdentity.executionSessionId ||
        identity.executionInstanceId !== controlIdentity.executionInstanceId ||
        identity.identityAuthorityId !== controlIdentity.identityAuthorityId ||
        identity.evidenceCommit !== controlIdentity.evidenceCommit,
    ) ||
    authorIdentity.principalId === controlIdentity.principalId ||
    authorIdentity.executionSessionId === controlIdentity.executionSessionId ||
    authorIdentity.executionInstanceId === controlIdentity.executionInstanceId ||
    authorIdentity.evidenceCommit === controlIdentity.evidenceCommit
  ) {
    return refusal(
      'PublishedHeadEvidenceMismatch',
      repositoryId,
      keyMaterial,
      subjects,
      null,
      'publication_phases_not_independent_authenticated_executions',
    );
  }

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

  const binding = bindPublishedHeadEvidence(bundle, {
    targetCommit: manifest.sourceOid,
    branch: RELEASE_SOURCE_BRANCH,
    remoteRef: RELEASE_REMOTE_REF,
    pullRequestNumber: input.pullRequest.pullRequestNumber,
    // The observed protected base, not a label the bundle chose for itself.
    resolvedBases: { [RELEASE_BASE_BRANCH]: input.base.oid },
  });
  if (binding !== null) {
    return refusal(
      binding.code,
      repositoryId,
      keyMaterial,
      subjects,
      null,
      binding.reason,
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

  for (const relation of input.gateSnapshot.relations) {
    for (const acceptedRisk of relation.acceptedRisks) {
      if (
        canonicalJson(authority.resolveAcceptedRisk(acceptedRisk)) !==
          canonicalJson(acceptedRisk) ||
        canonicalJson(authority.resolveAuthorizedHuman(acceptedRisk.acceptedBy)) !==
        canonicalJson(acceptedRisk.acceptedBy)
      ) {
        return refusal(
          'SecurityRiskAcceptanceInvalid', repositoryId, keyMaterial, subjects, null,
          'accepted_risk_human_authority_unresolvable',
        );
      }
    }
  }

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
    if (coupling.authorization === null || coupling.authorization === undefined) {
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
    const authorizationDefect = irreversibleAuthorizationDefect(
      coupling.authorization,
      manifest,
      coupling.policyCommit,
    );
    if (
      authorizationDefect === null &&
      canonicalJson(authority.resolveHumanDecision(coupling.authorization)) !==
        canonicalJson(coupling.authorization)
    ) {
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
          phase: 'irreversible_production_authority_unresolvable',
        }),
      });
    }
    if (authorizationDefect !== null) {
      // An unclassifiable or unbound authorization is refused as a typed exception
      // record; it never turns the main merge itself into an implicit exception.
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
          defect: authorizationDefect,
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
    manifest.integrationUnitInventory,
    manifest.integrationInitialTreeOid,
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

  const checks = evaluateRequiredChecks(
    input.requiredChecks,
    pullRequest.headOid,
    profile.requiredCheckContexts,
  );
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

  const protectedChanges = findProtectedPathChanges(authenticatedChangedPaths);
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
    immutableDiffDigest: diffValidation.diff.evidenceDigest,
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
 * Attestation expectations
 * ------------------------------------------------------------------------- */

/**
 * Builds the exact attestation expectations from the pinned trust root and the pinned
 * required-policy profile. Both authorization phases use this one constructor, so the
 * pre-mutation phase can never be checked against weaker expectations than admission.
 */
export function releaseAttestationExpectations(
  input: {
    readonly repository: {
      readonly databaseId: number;
      readonly nodeId: string;
      readonly owner: string;
      readonly name: string;
    };
    readonly pullRequest: { readonly pullRequestNumber: number; readonly headOid: GitOid };
    readonly base: { readonly oid: GitOid };
  },
  context: AdmissionContext,
  trustRoot: PolicyAttestationExpectations['trustRoot'],
  requiredPolicyProfileDigest: Sha256Hex,
  profile: RequiredGitHubPolicyProfile,
  phase: 'pre_intent' | 'pre_mutation',
  expectedPolicyGeneration: number | null,
  authority: ReleaseAuthorityPort,
): PolicyAttestationExpectations {
  return {
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
    authorizationPhase: phase,
    requiredPolicyProfileDigest,
    trustRoot,
    expectedPolicyGeneration,
    expectedExecutorApps: profile.executorApps,
    expectedObserverPrincipalSetDigest: profile.observerPrincipalSetDigest,
    expectedRequiredCheckSources: profile.requiredCheckContexts.map((context_) => ({
      name: context_.name,
      appId: context_.expectedAppId,
    })),
    expectedMergeMethods: profile.mergeMethodsRequired,
    expectedRequiredPolicyProfile: profile,
    authority,
  };
}

/* ------------------------------------------------------------------------- *
 * Pinned required-policy profile
 * ------------------------------------------------------------------------- */

function executorAppDefect(value: unknown): string | null {
  if (!isRecordObject(value)) {
    return 'executor_app_absent';
  }
  const app = value as unknown as ExecutorAppIdentity;
  if (!Number.isSafeInteger(app.appId) || app.appId < 1) {
    return 'executor_app_id_invalid';
  }
  if (!Number.isSafeInteger(app.installationId) || app.installationId < 1) {
    return 'executor_app_installation_invalid';
  }
  if (
    !isNonEmptyString(app.nodeId) ||
    !isNonEmptyString(app.slug) ||
    hasControlCharacters(app.nodeId) ||
    hasControlCharacters(app.slug)
  ) {
    return 'executor_app_identity_incomplete';
  }
  if (!isRecordObject(app.permissions)) {
    return 'executor_app_permissions_absent';
  }
  if (!executorPermissionMapIsConfined(app.permissions)) {
    return 'executor_app_permissions_not_literal_allowlist';
  }
  for (const value_ of Object.values(app.permissions)) {
    if (value_ !== 'read' && value_ !== 'write' && value_ !== 'admin') {
      return 'executor_app_permission_value_invalid';
    }
  }
  return null;
}

function requiredPolicyProfileDefect(value: unknown): string | null {
  if (!isRecordObject(value)) {
    return 'profile_absent';
  }
  const profile = value as unknown as RequiredGitHubPolicyProfile;
  if (profile.schema !== 'required-github-policy-profile/v1') {
    return 'profile_schema_mismatch';
  }
  if (!isNonEmptyString(profile.repositoryId)) {
    return 'profile_repository_missing';
  }
  if (profile.protectedRef !== RELEASE_BASE_REF) {
    return 'profile_protected_ref_mismatch';
  }
  if (
    !Array.isArray(profile.requiredCheckContexts) ||
    profile.requiredCheckContexts.length === 0
  ) {
    return 'profile_required_check_contexts_missing';
  }
  for (const context of profile.requiredCheckContexts) {
    if (!isRecordObject(context)) {
      return 'profile_required_check_context_invalid';
    }
    if (!isNonEmptyString(context.name) || hasControlCharacters(context.name)) {
      return 'profile_required_check_name_missing';
    }
    if (!Number.isSafeInteger(context.expectedAppId)) {
      return 'profile_required_check_app_invalid';
    }
  }
  if (
    !Array.isArray(profile.releaseGateRequirements) ||
    profile.releaseGateRequirements.length === 0
  ) {
    return 'profile_release_gate_requirements_missing';
  }
  if (!Array.isArray(profile.executorApps) || profile.executorApps.length !== 2) {
    return 'profile_executor_apps_incomplete';
  }
  for (const app of profile.executorApps) {
    const defect = executorAppDefect(app);
    if (defect !== null) {
      return `profile_${defect}`;
    }
  }
  if (!isSha256Hex(profile.observerPrincipalSetDigest)) {
    return 'profile_observer_principal_digest_invalid';
  }
  if (
    !Array.isArray(profile.mergeMethodsRequired) ||
    !profile.mergeMethodsRequired.includes(RELEASE_MERGE_METHOD)
  ) {
    return 'profile_merge_methods_missing';
  }
  if (!isRecordObject(profile.branchControls)) {
    return 'profile_branch_controls_missing';
  }
  const controls = profile.branchControls;
  if (
    controls.updatesRequirePullRequest !== true ||
    controls.strictCurrentBase !== true ||
    controls.enforceAdministrators !== true ||
    controls.forcePushAllowed !== false ||
    controls.deletionAllowed !== false ||
    !Number.isSafeInteger(controls.minimumApprovingReviewCount) ||
    controls.minimumApprovingReviewCount < 1 ||
    controls.dismissStaleReviews !== true ||
    controls.requireCodeOwnerReview !== true ||
    controls.requireLastPushApproval !== true ||
    controls.requireConversationResolution !== true ||
    controls.requireSignedCommits !== true ||
    controls.linearHistoryRequired !== false ||
    controls.effectiveBypassActors !== 'none'
  ) {
    return 'profile_branch_controls_weakened_or_incomplete';
  }
  return null;
}

/* ------------------------------------------------------------------------- *
 * Irreversible production authorization
 * ------------------------------------------------------------------------- */

function irreversibleAuthorizationDefect(
  authorization: ImmutableHumanDecisionRef,
  manifest: ReleaseGateManifest,
  policyCommit: GitOid,
): string | null {
  if (!isRecordObject(authorization)) {
    return 'authorization_absent';
  }
  if (!isNonEmptyString(authorization.decisionId)) {
    return 'authorization_decision_id_missing';
  }
  if (!isGitOid(authorization.decisionCommit)) {
    return 'authorization_decision_commit_not_immutable';
  }
  if (!isNonEmptyString(authorization.artifactPath)) {
    return 'authorization_artifact_path_missing';
  }
  if (
    authorization.action !==
    'authorize_policy_required_irreversible_production_action'
  ) {
    return 'authorization_action_mismatch';
  }
  if (authorization.repositoryId !== manifest.repositoryId) {
    return 'authorization_repository_mismatch';
  }
  if (authorization.policyCommit !== policyCommit) {
    return 'authorization_policy_commit_mismatch';
  }
  if (authorization.releaseHeadOid !== manifest.sourceOid) {
    return 'authorization_release_head_mismatch';
  }
  if (!isRecordObject(authorization.authorizedBy)) {
    return 'authorization_principal_absent';
  }
  if (authorization.authorizedBy.principalType !== 'human') {
    return 'authorization_principal_not_human';
  }
  if (!isNonEmptyString(authorization.authorizedBy.principalId)) {
    return 'authorization_principal_id_missing';
  }
  if (!isGitOid(authorization.authorizedBy.authorizationCommit)) {
    return 'authorization_principal_commit_not_immutable';
  }
  if (
    authorization.scopeDigest !==
    expectedIrreversibleAuthorizationScopeDigest(
      manifest.repositoryId,
      policyCommit,
      manifest.sourceOid,
    )
  ) {
    return 'authorization_scope_digest_mismatch';
  }
  return null;
}

/* ------------------------------------------------------------------------- *
 * Source shape
 * ------------------------------------------------------------------------- */

interface ShapeDefect {
  readonly scope: 'source' | 'security';
  readonly reason: string;
}

function sourceDefect(reason: string): ShapeDefect {
  return { scope: 'source', reason };
}

/**
 * Complete structural validation of every declared runtime boundary, performed before
 * any dereference or digest computation. It reads no property without first proving
 * its container is a record, so no hostile value can throw here.
 *
 * A structurally unusable security snapshot is reported with its own scope so the
 * ordered selector can still return the typed `SecurityEvidenceMissing` refusal rather
 * than folding it into a generic source defect.
 */
function validateSourceShape(input: ReleaseAdmissionInput): ShapeDefect | null {
  if (input.executor !== RELEASE_EXECUTOR) {
    return sourceDefect('executor_mismatch');
  }
  if (!isNonEmptyString(input.evaluatedAtUtc)) {
    return sourceDefect('evaluated_at_missing');
  }
  if (!isRecordObject(input.repository)) {
    return sourceDefect('repository_identity_missing');
  }
  if (
    !isNonEmptyString(input.repository.repositoryId) ||
    hasControlCharacters(input.repository.repositoryId)
  ) {
    return sourceDefect('repository_id_missing');
  }
  if (!Number.isSafeInteger(input.repository.databaseId)) {
    return sourceDefect('repository_database_id_missing');
  }
  if (
    !isNonEmptyString(input.repository.nodeId) ||
    !isNonEmptyString(input.repository.owner) ||
    !isNonEmptyString(input.repository.name) ||
    hasControlCharacters(input.repository.nodeId) ||
    hasControlCharacters(input.repository.owner) ||
    hasControlCharacters(input.repository.name)
  ) {
    return sourceDefect('repository_identity_incomplete');
  }
  if (!isRecordObject(input.pullRequest)) {
    return sourceDefect('pull_request_observation_missing');
  }
  if (
    !Number.isSafeInteger(input.pullRequest.pullRequestNumber) ||
    (input.pullRequest.pullRequestNumber as number) < 1
  ) {
    return sourceDefect('pull_request_number_invalid');
  }
  if (!isGitOid(input.pullRequest.headOid)) {
    return sourceDefect('pull_request_head_not_full_oid');
  }
  if (!isGitOid(input.pullRequest.headTreeOid)) {
    return sourceDefect('pull_request_head_tree_not_full_oid');
  }
  if (!isGitOid(input.pullRequest.baseOid)) {
    return sourceDefect('pull_request_base_not_full_oid');
  }
  if (!isNonEmptyString(input.pullRequest.headBranch)) {
    return sourceDefect('pull_request_head_branch_missing');
  }
  if (!isNonEmptyString(input.pullRequest.baseBranch)) {
    return sourceDefect('pull_request_base_branch_missing');
  }
  if (input.pullRequest.state !== 'open' && input.pullRequest.state !== 'closed') {
    return sourceDefect('pull_request_state_invalid');
  }
  if (
    input.pullRequest.merged !== true &&
    input.pullRequest.merged !== false
  ) {
    return sourceDefect('pull_request_merged_flag_invalid');
  }
  if (
    input.pullRequest.baseIsAncestorOfHead !== true &&
    input.pullRequest.baseIsAncestorOfHead !== false
  ) {
    return sourceDefect('pull_request_ancestry_flag_invalid');
  }
  if (!isRecordObject(input.base)) {
    return sourceDefect('base_observation_missing');
  }
  if (!isGitOid(input.base.oid)) {
    return sourceDefect('base_oid_not_full_oid');
  }
  if (!isNonEmptyString(input.base.ref)) {
    return sourceDefect('base_ref_missing');
  }
  if (!isRecordObject(input.gateSnapshot)) {
    return sourceDefect('gate_snapshot_missing');
  }
  if (!isSha256Hex(input.gateSnapshot.snapshotDigest)) {
    return sourceDefect('gate_snapshot_digest_invalid');
  }
  if (!Array.isArray(input.gateSnapshot.relations)) {
    return sourceDefect('gate_snapshot_relations_missing');
  }
  if (!Array.isArray(input.integrationEvidence)) {
    return sourceDefect('integration_evidence_missing');
  }
  for (const unit of input.integrationEvidence) {
    if (!isRecordObject(unit)) {
      return sourceDefect('integration_evidence_unit_not_an_object');
    }
  }
  if (!Array.isArray(input.changedPaths)) {
    return sourceDefect('changed_paths_missing');
  }
  if (input.changedPaths.some((path) => hasControlCharacters(path))) {
    return sourceDefect('changed_path_control_character');
  }
  for (const path of input.changedPaths) {
    if (typeof path !== 'string') {
      return sourceDefect('changed_path_not_a_string');
    }
  }
  if (!isNonEmptyString(input.orderKey) || hasControlCharacters(input.orderKey)) {
    return sourceDefect('order_key_missing');
  }
  if (!isSha256Hex(input.admissionContextNonce)) {
    return sourceDefect('admission_context_nonce_invalid');
  }
  if (!isRecordObject(input.policyControlFacts)) {
    return sourceDefect('policy_control_facts_missing');
  }
  if (!isRecordObject(input.policyControlFacts.action)) {
    return sourceDefect('policy_control_action_missing');
  }
  if (!isRecordObject(input.policyControlFacts.observation)) {
    return sourceDefect('policy_control_observation_missing');
  }
  if (!isRecordObject(input.requiredChecks)) {
    return sourceDefect('required_check_observation_missing');
  }
  if (
    input.publishedHeadEvidence !== null &&
    !isRecordObject(input.publishedHeadEvidence)
  ) {
    return sourceDefect('published_head_evidence_not_an_object');
  }
  if (input.manifest !== null && !isRecordObject(input.manifest)) {
    return sourceDefect('manifest_not_an_object');
  }
  if (input.activation !== null && !isRecordObject(input.activation)) {
    return sourceDefect('activation_not_an_object');
  }

  /* --- The security snapshot keeps its own typed refusal ---------------- */

  if (!isRecordObject(input.securitySnapshot)) {
    return { scope: 'security', reason: 'security_snapshot_absent_or_unusable' };
  }
  if (!isSha256Hex(input.securitySnapshot.snapshotDigest)) {
    return { scope: 'security', reason: 'security_snapshot_absent_or_unusable' };
  }
  if (!Array.isArray(input.securitySnapshot.findings)) {
    return { scope: 'security', reason: 'security_snapshot_absent_or_unusable' };
  }
  for (const finding of input.securitySnapshot.findings) {
    if (!isRecordObject(finding)) {
      return { scope: 'security', reason: 'security_finding_not_an_object' };
    }
    if (
      !isSha256Hex(finding.evidenceDigest) ||
      !isGitOid(finding.targetCommit) ||
      !isNonEmptyString(finding.findingId)
    ) {
      return {
        scope: 'security',
        reason: `security_finding_evidence_invalid:${String(finding.findingId)}`,
      };
    }
  }

  return null;
}
