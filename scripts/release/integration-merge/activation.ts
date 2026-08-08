/**
 * Validation of the immutable `MergeExecutorActivationRecord`.
 *
 * All four HUMAN-004 operational conditions must be present, plus the three members
 * TASK-042 added. A record produced by an executor itself, a mutable ref, a missing
 * member, an unpinned attestor, or a required-policy profile without an immutable
 * digest returns `AuthorityNotActivated`. Merely landing implementation code never
 * activates it.
 *
 * Binding, not shape. Every member declares the exact activation slot it may occupy,
 * its expected artifact kind or gate, the immutable target it judged, and an
 * independently named non-executor producer. The record additionally authenticates
 * itself: `recordSource.digest` is the canonical digest of the record with exactly that
 * one property omitted, so a record cannot assert its own artifact identity. A
 * syntactically plausible object assembled from copies of other members is therefore
 * not an activation record.
 *
 * Scope note for the ordered admission selector: this step evaluates the activation
 * record's own immutable members. It deliberately does not evaluate live attestor or
 * observer-credential provisioning, which reaches admission as `PolicyControlFacts` and
 * is classified one step later by `classifyPolicyControl`.
 */

import {
  ACTIVATION_MEMBERS,
  GOVERNANCE_DECISION_COMMIT,
  RELEASE_EXECUTOR,
} from './contracts.ts';
import type {
  ActivationMember,
  GateName,
  ImmutableArtifactProducer,
  ImmutableMergePortIdentity,
  ImmutableNegativeCapabilityAttestationRef,
  ImmutablePassingGateRef,
  ImmutablePolicyAttestorTrustRootRef,
  ImmutableProvenancedArtifactRef,
  MergeExecutorActivationRecord,
  ReleaseExecutorCapability,
} from './contracts.ts';
import {
  canonicalJson,
  decodeBase64,
  hasControlCharacters,
  isGitOid,
  isSha256Hex,
  selfDigest,
  sha256Bytes,
  sha256Canonical,
  omitTopLevel,
} from './canonical-json.ts';
import { resolveReleaseExecutorCapability } from './composition-capability.ts';

export const APPROVED_ARCHITECTURE_SOURCE =
  'f148567d716c00d7a24783318c8d6d7031492e7b';
export const APPROVED_ARCHITECTURE_REVIEW =
  '78359ae2e3dc6e97fb3d60f0b847b84abed08fa6';
export const ARCHITECTURE_LINEAGE = 'LIN-INTEGRATION-AUTHORITY-REVIEW';
export const IMPLEMENTATION_REVIEW_LINEAGE = 'LIN-RELEASE-EXECUTOR-REVIEW';
export const IMPLEMENTATION_SECURITY_LINEAGE =
  'LIN-RELEASE-EXECUTOR-SECURITY';

export type ActivationDefectReason =
  | 'member_missing'
  | 'member_mutable_ref'
  | 'member_unpinned'
  | 'member_produced_by_executor'
  | 'member_not_passing'
  | 'member_kind_mismatch'
  | 'member_gate_mismatch'
  | 'member_provenance_absent'
  | 'member_target_unpinned'
  | 'member_not_independent'
  | 'member_digest_not_bound'
  | 'trust_root_key_unbound'
  | 'record_source_mismatch'
  | 'authority_resolver_absent'
  | 'authority_resolver_mismatch'
  | 'capability_binding_mismatch'
  | 'member_unresolvable'
  | 'producer_unauthenticated'
  | 'issuer_invalid'
  | 'executor_mismatch'
  | 'governance_decision_commit_mismatch';

export interface ActivationDefect {
  readonly member:
    | ActivationMember
    | 'executor'
    | 'governanceDecisionCommit'
    | 'recordSource'
    | 'issuer';
  readonly reason: ActivationDefectReason;
}

export type ActivationValidation =
  | { readonly status: 'activated'; readonly record: MergeExecutorActivationRecord }
  | { readonly status: 'not_activated'; readonly defects: readonly ActivationDefect[] };

/** The exact gate each gate-reference member must carry. */
export const ACTIVATION_GATE_EXPECTATIONS: Readonly<
  Record<'architectureReview' | 'implementationReview' | 'implementationSecurityReview', GateName>
> = Object.freeze({
  architectureReview: 'review',
  implementationReview: 'review',
  implementationSecurityReview: 'security',
});

/** The exact artifact kind each artifact member must carry. */
export const ACTIVATION_ARTIFACT_KINDS: Readonly<
  Record<
    'negativeCapabilityTestAttestation' | 'gateVocabularyCorrection' | 'requiredGitHubPolicyProfile',
    string
  >
> = Object.freeze({
  negativeCapabilityTestAttestation: 'negative-capability-test-attestation',
  gateVocabularyCorrection: 'gate-vocabulary-correction',
  requiredGitHubPolicyProfile: 'required-github-policy-profile',
});

function isRecordObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Provenance is required, never defaulted. An absent producer, a producer without an
 * immutable authorization commit, and a `merge_executor` producer are each a defect.
 */
function producerDefect(
  producedByExecutor: unknown,
  producer: unknown,
): ActivationDefectReason | null {
  if (producedByExecutor !== false && producedByExecutor !== true) {
    return 'member_provenance_absent';
  }
  if (producedByExecutor === true) {
    return 'member_produced_by_executor';
  }
  if (!isRecordObject(producer)) {
    return 'member_provenance_absent';
  }
  const identity = producer as unknown as ImmutableArtifactProducer;
  if (
    typeof identity.principalId !== 'string' ||
    identity.principalId.length === 0 ||
    hasControlCharacters(identity.principalId)
  ) {
    return 'member_provenance_absent';
  }
  if (identity.principalType === 'merge_executor') {
    return 'member_produced_by_executor';
  }
  if (identity.principalType !== 'human' && identity.principalType !== 'agent_role') {
    return 'member_provenance_absent';
  }
  if (!isGitOid(identity.authorizationCommit)) {
    return 'member_provenance_absent';
  }
  return null;
}

function validatePassingGateRef(
  member: 'architectureReview' | 'implementationReview' | 'implementationSecurityReview',
  value: unknown,
  defects: ActivationDefect[],
): void {
  if (!isRecordObject(value)) {
    defects.push({ member, reason: 'member_missing' });
    return;
  }

  const ref = value as unknown as ImmutablePassingGateRef;

  if (ref.member !== member) {
    // The reference declares which activation slot it may occupy, so a copy of another
    // member cannot be substituted for this one.
    defects.push({ member, reason: 'member_kind_mismatch' });
    return;
  }
  if (
    typeof ref.lineage !== 'string' ||
    ref.lineage.length === 0 ||
    hasControlCharacters(ref.lineage)
  ) {
    defects.push({ member, reason: 'member_unpinned' });
    return;
  }
  if (!Number.isSafeInteger(ref.lineageRound) || ref.lineageRound < 1) {
    defects.push({ member, reason: 'member_unpinned' });
    return;
  }
  if (ref.gate !== ACTIVATION_GATE_EXPECTATIONS[member]) {
    defects.push({ member, reason: 'member_gate_mismatch' });
    return;
  }
  if (!isGitOid(ref.verdictCommit)) {
    defects.push({ member, reason: 'member_mutable_ref' });
    return;
  }
  if (!isGitOid(ref.targetCommit)) {
    defects.push({ member, reason: 'member_target_unpinned' });
    return;
  }
  if (ref.verdictState !== 'passing') {
    defects.push({ member, reason: 'member_not_passing' });
    return;
  }
  const provenance = producerDefect(ref.producedByExecutor, ref.producer);
  if (provenance !== null) {
    defects.push({ member, reason: provenance });
  }
}

function validateArtifactRef(
  member:
    | 'negativeCapabilityTestAttestation'
    | 'gateVocabularyCorrection'
    | 'requiredGitHubPolicyProfile',
  value: unknown,
  defects: ActivationDefect[],
): void {
  if (!isRecordObject(value)) {
    defects.push({ member, reason: 'member_missing' });
    return;
  }

  const ref = value as unknown as ImmutableProvenancedArtifactRef;

  if (
    typeof ref.path !== 'string' ||
    ref.path.length === 0 ||
    hasControlCharacters(ref.path) ||
    hasControlCharacters(ref.kind)
  ) {
    defects.push({ member, reason: 'member_unpinned' });
    return;
  }
  if (!isGitOid(ref.commit)) {
    defects.push({ member, reason: 'member_mutable_ref' });
    return;
  }
  if (!isSha256Hex(ref.digest)) {
    defects.push({ member, reason: 'member_unpinned' });
    return;
  }
  if (ref.kind !== ACTIVATION_ARTIFACT_KINDS[member]) {
    defects.push({ member, reason: 'member_kind_mismatch' });
    return;
  }
  const provenance = producerDefect(ref.producedByExecutor, ref.producer);
  if (provenance !== null) {
    defects.push({ member, reason: provenance });
  }
}

function validateMergePortBinding(
  value: unknown,
  defects: ActivationDefect[],
): void {
  const member: ActivationMember = 'negativeCapabilityTestAttestation';
  if (!isRecordObject(value)) {
    return;
  }
  const ref = value as unknown as ImmutableNegativeCapabilityAttestationRef;
  const identity = ref.attestedMergePortIdentity as unknown as
    | ImmutableMergePortIdentity
    | undefined;
  if (!isRecordObject(identity)) {
    defects.push({ member, reason: 'member_unpinned' });
    return;
  }
  if (
    typeof identity.brokerId !== 'string' ||
    identity.brokerId.length === 0 ||
    hasControlCharacters(identity.brokerId)
  ) {
    defects.push({ member, reason: 'member_unpinned' });
    return;
  }
  if (!isSha256Hex(identity.portIdentityDigest)) {
    defects.push({ member, reason: 'member_unpinned' });
  }

  const authorityIdentity = ref.attestedAuthorityPortIdentity;
  if (
    !isRecordObject(authorityIdentity) ||
    typeof authorityIdentity.resolverId !== 'string' ||
    authorityIdentity.resolverId.length === 0 ||
    hasControlCharacters(authorityIdentity.resolverId) ||
    !isSha256Hex(authorityIdentity.resolverIdentityDigest)
  ) {
    defects.push({ member, reason: 'member_unpinned' });
  }

  const binding = ref.attestedCapabilityBinding;
  if (
    !isRecordObject(binding) ||
    typeof binding.compositionRootId !== 'string' ||
    binding.compositionRootId.length === 0 ||
    hasControlCharacters(binding.compositionRootId) ||
    !isSha256Hex(binding.bindingDigest)
  ) {
    defects.push({ member, reason: 'member_unpinned' });
  }
}

function validateTrustRoot(value: unknown, defects: ActivationDefect[]): void {
  const member: ActivationMember = 'policyAttestorTrustRoot';

  if (!isRecordObject(value)) {
    defects.push({ member, reason: 'member_missing' });
    return;
  }

  const root = value as unknown as ImmutablePolicyAttestorTrustRootRef;

  if (
    typeof root.authorityId !== 'string' ||
    root.authorityId.length === 0 ||
    hasControlCharacters(root.authorityId)
  ) {
    defects.push({ member, reason: 'member_unpinned' });
    return;
  }
  if (
    typeof root.keyId !== 'string' ||
    root.keyId.length === 0 ||
    hasControlCharacters(root.keyId)
  ) {
    defects.push({ member, reason: 'member_unpinned' });
    return;
  }
  if (!isSha256Hex(root.publicKeyDigest)) {
    defects.push({ member, reason: 'member_unpinned' });
    return;
  }
  if (root.acceptedSchema !== 'github-current-policy-attestation/v1') {
    defects.push({ member, reason: 'member_unpinned' });
    return;
  }
  if (
    typeof root.revocationChannelId !== 'string' ||
    root.revocationChannelId.length === 0 ||
    hasControlCharacters(root.revocationChannelId)
  ) {
    defects.push({ member, reason: 'member_unpinned' });
    return;
  }
  if (!isGitOid(root.pinnedCommit)) {
    defects.push({ member, reason: 'member_mutable_ref' });
    return;
  }
  if (root.keyAlgorithm !== 'Ed25519') {
    defects.push({ member, reason: 'trust_root_key_unbound' });
    return;
  }
  const key = decodeBase64(root.publicKeySpkiBase64);
  if (key === null) {
    defects.push({ member, reason: 'trust_root_key_unbound' });
    return;
  }
  if (sha256Bytes(key) !== root.publicKeyDigest) {
    // The pinned digest is what makes the key material trustworthy; unbound key bytes
    // are exactly the substitution a wrong-key attestation needs.
    defects.push({ member, reason: 'trust_root_key_unbound' });
  }
}

function validateIssuer(value: unknown, defects: ActivationDefect[]): void {
  if (!isRecordObject(value)) {
    defects.push({ member: 'issuer', reason: 'issuer_invalid' });
    return;
  }
  if (typeof value['principalId'] !== 'string' || value['principalId'] === '') {
    defects.push({ member: 'issuer', reason: 'issuer_invalid' });
    return;
  }
  if (value['principalType'] !== 'human') {
    defects.push({ member: 'issuer', reason: 'issuer_invalid' });
    return;
  }
  if (!isGitOid(value['authorizationCommit'])) {
    defects.push({ member: 'issuer', reason: 'issuer_invalid' });
  }
}

/**
 * Total validation of the activation record. Never throws; an absent or structurally
 * unusable record is `not_activated` with one `member_missing` defect per member.
 */
export function validateActivation(
  activation: MergeExecutorActivationRecord | null | undefined,
  capability?: ReleaseExecutorCapability | null,
): ActivationValidation {
  const defects: ActivationDefect[] = [];

  if (!isRecordObject(activation)) {
    for (const member of ACTIVATION_MEMBERS) {
      defects.push({ member, reason: 'member_missing' });
    }
    return { status: 'not_activated', defects };
  }

  const record = activation as unknown as Record<string, unknown>;

  if (record['executor'] !== RELEASE_EXECUTOR) {
    defects.push({ member: 'executor', reason: 'executor_mismatch' });
  }
  if (record['governanceDecisionCommit'] !== GOVERNANCE_DECISION_COMMIT) {
    defects.push({
      member: 'governanceDecisionCommit',
      reason: 'governance_decision_commit_mismatch',
    });
  }
  if (record['producedByExecutor'] !== false) {
    defects.push({ member: 'recordSource', reason: 'member_produced_by_executor' });
  }
  validateIssuer(record['issuer'], defects);

  validatePassingGateRef('architectureReview', record['architectureReview'], defects);
  validatePassingGateRef('implementationReview', record['implementationReview'], defects);
  validatePassingGateRef(
    'implementationSecurityReview',
    record['implementationSecurityReview'],
    defects,
  );
  validateArtifactRef(
    'negativeCapabilityTestAttestation',
    record['negativeCapabilityTestAttestation'],
    defects,
  );
  validateMergePortBinding(record['negativeCapabilityTestAttestation'], defects);
  validateArtifactRef(
    'gateVocabularyCorrection',
    record['gateVocabularyCorrection'],
    defects,
  );
  validateArtifactRef(
    'requiredGitHubPolicyProfile',
    record['requiredGitHubPolicyProfile'],
    defects,
  );

  if (!isSha256Hex(record['requiredGitHubPolicyProfileDigest'])) {
    defects.push({
      member: 'requiredGitHubPolicyProfile',
      reason: 'member_unpinned',
    });
  }

  validateTrustRoot(record['policyAttestorTrustRoot'], defects);

  if (defects.length > 0) {
    return { status: 'not_activated', defects };
  }

  const complete = activation as MergeExecutorActivationRecord;

  const capabilityRecord = resolveReleaseExecutorCapability(capability);
  if (capabilityRecord === null) {
    return {
      status: 'not_activated',
      defects: [{ member: 'recordSource', reason: 'authority_resolver_absent' }],
    };
  }
  const authority = capabilityRecord.authority;

  const attestedAuthority =
    complete.negativeCapabilityTestAttestation.attestedAuthorityPortIdentity;
  if (
    !isRecordObject(attestedAuthority) ||
    canonicalJson(attestedAuthority) !==
      canonicalJson(capabilityRecord.authorityIdentity)
  ) {
    return {
      status: 'not_activated',
      defects: [{ member: 'recordSource', reason: 'authority_resolver_mismatch' }],
    };
  }
  if (
    canonicalJson(
      complete.negativeCapabilityTestAttestation.attestedMergePortIdentity,
    ) !== canonicalJson(capabilityRecord.mergePortIdentity) ||
    canonicalJson(
      complete.negativeCapabilityTestAttestation.attestedCapabilityBinding,
    ) !== canonicalJson(capabilityRecord.capabilityBinding)
  ) {
    return {
      status: 'not_activated',
      defects: [{ member: 'recordSource', reason: 'capability_binding_mismatch' }],
    };
  }

  /* --- Cross-member binding --------------------------------------------- */

  if (
    complete.requiredGitHubPolicyProfile.digest !==
    complete.requiredGitHubPolicyProfileDigest
  ) {
    // The profile artifact and the effective required digest must be the same value;
    // validating each independently is what let a substituted profile activate.
    defects.push({
      member: 'requiredGitHubPolicyProfile',
      reason: 'member_digest_not_bound',
    });
  }

  const gateMembers = [
    complete.architectureReview,
    complete.implementationReview,
    complete.implementationSecurityReview,
  ];
  const lineages = new Set(gateMembers.map((ref) => ref.lineage));
  const verdicts = new Set(gateMembers.map((ref) => ref.verdictCommit));
  if (lineages.size !== gateMembers.length || verdicts.size !== gateMembers.length) {
    defects.push({ member: 'implementationReview', reason: 'member_not_independent' });
  }
  if (
    complete.implementationReview.targetCommit !==
    complete.implementationSecurityReview.targetCommit
  ) {
    // Both implementation gates judge the same executor source.
    defects.push({
      member: 'implementationSecurityReview',
      reason: 'member_target_unpinned',
    });
  }

  if (
    complete.architectureReview.lineage !== ARCHITECTURE_LINEAGE ||
    complete.architectureReview.lineageRound !== 3 ||
    complete.architectureReview.targetCommit !== APPROVED_ARCHITECTURE_SOURCE ||
    complete.architectureReview.verdictCommit !== APPROVED_ARCHITECTURE_REVIEW
  ) {
    defects.push({ member: 'architectureReview', reason: 'member_target_unpinned' });
  }
  if (
    complete.implementationReview.lineage !== IMPLEMENTATION_REVIEW_LINEAGE ||
    complete.implementationSecurityReview.lineage !==
      IMPLEMENTATION_SECURITY_LINEAGE ||
    complete.implementationReview.lineageRound !== 3 ||
    complete.implementationSecurityReview.lineageRound !== 3
  ) {
    defects.push({ member: 'implementationReview', reason: 'member_target_unpinned' });
  }

  for (const [member, gate] of [
    ['architectureReview', complete.architectureReview],
    ['implementationReview', complete.implementationReview],
    ['implementationSecurityReview', complete.implementationSecurityReview],
  ] as const) {
    const resolved = authority.resolvePassingGate(gate);
    if (
      resolved === null ||
      resolved.producerAuthorized !== true ||
      !isGitOid(resolved.authorizationEvidenceCommit) ||
      canonicalJson(resolved.verdict) !== canonicalJson(gate)
    ) {
      defects.push({ member, reason: 'member_unresolvable' });
    }
  }
  if (
    complete.architectureReview.targetCommit ===
    complete.implementationReview.targetCommit
  ) {
    defects.push({ member: 'architectureReview', reason: 'member_not_independent' });
  }

  const artifactDigests = new Set([
    complete.negativeCapabilityTestAttestation.digest,
    complete.gateVocabularyCorrection.digest,
    complete.requiredGitHubPolicyProfile.digest,
  ]);
  if (artifactDigests.size !== 3) {
    defects.push({
      member: 'negativeCapabilityTestAttestation',
      reason: 'member_not_independent',
    });
  }

  if (defects.length > 0) {
    return { status: 'not_activated', defects };
  }

  /* --- The record's own artifact identity -------------------------------- */

  const source = complete.recordSource;
  if (
    !isRecordObject(source) ||
    source.kind !== 'merge-executor-activation-record' ||
    !isGitOid(source.commit) ||
    typeof source.path !== 'string' ||
    source.path.length === 0 ||
    !isSha256Hex(source.digest) ||
    selfDigest(complete, 'recordSource') !== source.digest
  ) {
    return {
      status: 'not_activated',
      defects: [{ member: 'recordSource', reason: 'record_source_mismatch' }],
    };
  }


  const resolvedRecord = authority.resolveArtifact(source);
  if (
    resolvedRecord === null ||
    resolvedRecord.producerAuthorized !== true ||
    canonicalJson(resolvedRecord.ref) !== canonicalJson(source) ||
    sha256Canonical(resolvedRecord.canonicalValue) !== source.digest ||
    canonicalJson(resolvedRecord.canonicalValue) !==
      canonicalJson(omitTopLevel(complete, 'recordSource')) ||
    resolvedRecord.producer.principalType !== 'human' ||
    resolvedRecord.producer.principalId !== complete.issuer.principalId ||
    resolvedRecord.producer.authorizationCommit !==
      complete.issuer.authorizationCommit ||
    canonicalJson(authority.resolveAuthorizedHuman(complete.issuer)) !==
      canonicalJson(complete.issuer)
  ) {
    return {
      status: 'not_activated',
      defects: [{ member: 'recordSource', reason: 'record_source_mismatch' }],
    };
  }

  for (const [member, ref] of [
    ['negativeCapabilityTestAttestation', complete.negativeCapabilityTestAttestation],
    ['gateVocabularyCorrection', complete.gateVocabularyCorrection],
    ['requiredGitHubPolicyProfile', complete.requiredGitHubPolicyProfile],
  ] as const) {
    const resolved = authority.resolveArtifact(ref);
    if (
      resolved === null ||
      resolved.producerAuthorized !== true ||
      canonicalJson(resolved.ref) !== canonicalJson(ref) ||
      sha256Canonical(resolved.canonicalValue) !== ref.digest ||
      canonicalJson(resolved.producer) !== canonicalJson(ref.producer)
    ) {
      return {
        status: 'not_activated',
        defects: [{ member, reason: 'member_unresolvable' }],
      };
    }
  }

  if (
    canonicalJson(authority.resolveTrustRoot(complete.policyAttestorTrustRoot)) !==
    canonicalJson(complete.policyAttestorTrustRoot)
  ) {
    return {
      status: 'not_activated',
      defects: [{ member: 'policyAttestorTrustRoot', reason: 'member_unresolvable' }],
    };
  }

  return { status: 'activated', record: complete };
}
