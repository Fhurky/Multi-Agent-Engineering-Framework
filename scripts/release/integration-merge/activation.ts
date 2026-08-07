/**
 * Validation of the immutable `MergeExecutorActivationRecord`.
 *
 * All four HUMAN-004 operational conditions must be present, plus the three members
 * TASK-042 added. A record produced by an executor itself, a mutable ref, a missing
 * member, an unpinned attestor, or a required-policy profile without an immutable
 * digest returns `AuthorityNotActivated`. Merely landing implementation code never
 * activates it.
 *
 * Scope note for the ordered admission selector: this step evaluates the activation
 * record's own seven immutable members. It deliberately does not evaluate live
 * attestor or observer-credential provisioning, which reaches admission as
 * `PolicyControlFacts` and is classified one step later by `classifyPolicyControl`.
 */

import {
  ACTIVATION_MEMBERS,
  GOVERNANCE_DECISION_COMMIT,
  RELEASE_EXECUTOR,
} from './contracts.ts';
import type {
  ActivationMember,
  ImmutableArtifactRef,
  ImmutablePassingGateRef,
  ImmutablePolicyAttestorTrustRootRef,
  MergeExecutorActivationRecord,
} from './contracts.ts';
import { isGitOid, isSha256Hex } from './canonical-json.ts';

export type ActivationDefectReason =
  | 'member_missing'
  | 'member_mutable_ref'
  | 'member_unpinned'
  | 'member_produced_by_executor'
  | 'member_not_passing'
  | 'executor_mismatch'
  | 'governance_decision_commit_mismatch';

export interface ActivationDefect {
  readonly member: ActivationMember | 'executor' | 'governanceDecisionCommit';
  readonly reason: ActivationDefectReason;
}

export type ActivationValidation =
  | { readonly status: 'activated'; readonly record: MergeExecutorActivationRecord }
  | { readonly status: 'not_activated'; readonly defects: readonly ActivationDefect[] };

function isRecordObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validatePassingGateRef(
  member: ActivationMember,
  value: unknown,
  defects: ActivationDefect[],
): void {
  if (!isRecordObject(value)) {
    defects.push({ member, reason: 'member_missing' });
    return;
  }

  const ref = value as unknown as ImmutablePassingGateRef;

  if (typeof ref.lineage !== 'string' || ref.lineage.length === 0) {
    defects.push({ member, reason: 'member_unpinned' });
    return;
  }
  if (!Number.isSafeInteger(ref.lineageRound) || ref.lineageRound < 1) {
    defects.push({ member, reason: 'member_unpinned' });
    return;
  }
  if (!isGitOid(ref.verdictCommit)) {
    defects.push({ member, reason: 'member_mutable_ref' });
    return;
  }
  if (ref.verdictState !== 'passing') {
    defects.push({ member, reason: 'member_not_passing' });
    return;
  }
  if (ref.producedByExecutor === true) {
    defects.push({ member, reason: 'member_produced_by_executor' });
  }
}

function validateArtifactRef(
  member: ActivationMember,
  value: unknown,
  defects: ActivationDefect[],
): void {
  if (!isRecordObject(value)) {
    defects.push({ member, reason: 'member_missing' });
    return;
  }

  const ref = value as unknown as ImmutableArtifactRef;

  if (typeof ref.path !== 'string' || ref.path.length === 0) {
    defects.push({ member, reason: 'member_unpinned' });
    return;
  }
  if (!isGitOid(ref.commit)) {
    defects.push({ member, reason: 'member_mutable_ref' });
    return;
  }
  if (!isSha256Hex(ref.digest)) {
    defects.push({ member, reason: 'member_unpinned' });
  }
}

function validateTrustRoot(
  value: unknown,
  defects: ActivationDefect[],
): void {
  const member: ActivationMember = 'policyAttestorTrustRoot';

  if (!isRecordObject(value)) {
    defects.push({ member, reason: 'member_missing' });
    return;
  }

  const root = value as unknown as ImmutablePolicyAttestorTrustRootRef;

  if (typeof root.authorityId !== 'string' || root.authorityId.length === 0) {
    defects.push({ member, reason: 'member_unpinned' });
    return;
  }
  if (typeof root.keyId !== 'string' || root.keyId.length === 0) {
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
    root.revocationChannelId.length === 0
  ) {
    defects.push({ member, reason: 'member_unpinned' });
    return;
  }
  if (!isGitOid(root.pinnedCommit)) {
    defects.push({ member, reason: 'member_mutable_ref' });
  }
}

/**
 * Total validation of the activation record. Never throws; an absent or structurally
 * unusable record is `not_activated` with one `member_missing` defect per member.
 */
export function validateActivation(
  activation: MergeExecutorActivationRecord | null | undefined,
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

  return {
    status: 'activated',
    record: activation as MergeExecutorActivationRecord,
  };
}
