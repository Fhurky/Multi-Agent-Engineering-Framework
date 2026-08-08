/**
 * Agent-owned remediation routing.
 *
 * No result asks a human to perform a routine merge. Instead the executor publishes a
 * durable `RemediationRequest` for the Orchestrator to consume and turn into a task.
 * The executor cannot create or assign a task itself, cannot propose a verdict, and
 * cannot change authority; those three facts are encoded as literal `false`/`null`
 * fields on every request this module can construct.
 */

import { RELEASE_EXECUTOR } from './contracts.ts';
import type {
  ImmutableArtifactRef,
  MergeRefusalCode,
  RemediationCondition,
  RemediationRequest,
  RemediationRole,
} from './contracts.ts';

/**
 * The approved condition-to-responsible-role table, narrowed to the conditions the
 * release executor can itself observe.
 */
const CONDITION_ROLE: Readonly<Record<RemediationCondition, RemediationRole>> =
  Object.freeze({
    release_conflict_or_control_defect: 'devops',
    release_manifest_defect: 'devops',
    gate_evidence_missing_or_failed: 'reviewer',
    open_or_unverifiable_security_evidence: 'security',
    integration_evidence_gap_or_runtime_defect: 'runtime',
  });

/** Non-retryable refusal codes that route a remediation request. */
const CONDITION_BY_CODE: Readonly<
  Partial<Record<MergeRefusalCode, RemediationCondition>>
> = Object.freeze({
  ReleaseManifestInvalid: 'release_manifest_defect',
  ReleaseGateDomainMissing: 'release_manifest_defect',
  PreMergeGateOpen: 'gate_evidence_missing_or_failed',
  PreMergeGateNotPassing: 'gate_evidence_missing_or_failed',
  ReleaseGateNotPassing: 'gate_evidence_missing_or_failed',
  SecurityRiskAcceptanceInvalid: 'open_or_unverifiable_security_evidence',
  SecurityEvidenceMissing: 'open_or_unverifiable_security_evidence',
  ResultUnverifiable: 'open_or_unverifiable_security_evidence',
  IntegrationEvidenceIncomplete: 'integration_evidence_gap_or_runtime_defect',
  IntegrationOrderViolation: 'integration_evidence_gap_or_runtime_defect',
  ExpectedTreeMismatch: 'integration_evidence_gap_or_runtime_defect',
  MergeConflict: 'release_conflict_or_control_defect',
  GitHubRejected: 'release_conflict_or_control_defect',
  RequiredCheckMissing: 'release_conflict_or_control_defect',
  RequiredCheckNotSuccessful: 'release_conflict_or_control_defect',
  RequiredCheckPublisherMismatch: 'release_conflict_or_control_defect',
  ProtectedPathChange: 'release_conflict_or_control_defect',
  PublicationMismatch: 'release_conflict_or_control_defect',
  SourceBranchMismatch: 'release_conflict_or_control_defect',
  BaseBranchMismatch: 'release_conflict_or_control_defect',
  HeadOidMismatch: 'release_conflict_or_control_defect',
  BaseOidMismatch: 'release_conflict_or_control_defect',
  MergeMethodMismatch: 'release_conflict_or_control_defect',
  PublishedHeadEvidenceIncomplete: 'release_conflict_or_control_defect',
  PublishedHeadEvidenceMismatch: 'release_conflict_or_control_defect',
  PublishedHeadVerificationFailed: 'release_conflict_or_control_defect',
  IntentNotDurable: 'release_conflict_or_control_defect',
  IntentReceiptInvalid: 'release_conflict_or_control_defect',
  OutcomeUnknown: 'release_conflict_or_control_defect',
  RetryExhausted: 'release_conflict_or_control_defect',
  UnsupportedOperation: 'release_conflict_or_control_defect',
});

/**
 * Builds the remediation request for a refusal code, or `null` when the code carries
 * no remediation (an activation, source-shape, or policy-classification refusal, which
 * is resolved in the control plane rather than by an agent role).
 */
export function remediationFor(
  code: MergeRefusalCode,
  immutableSubjects: readonly ImmutableArtifactRef[],
): RemediationRequest | null {
  const condition = CONDITION_BY_CODE[code];
  if (condition === undefined) {
    return null;
  }

  return {
    schema: 'merge-remediation-request/v1',
    executor: RELEASE_EXECUTOR,
    condition,
    responsibleRole: CONDITION_ROLE[condition],
    refusalCode: code,
    immutableSubjects,
    createsTask: false,
    proposedVerdict: null,
    changesAuthority: false,
  };
}

/** The complete routing table, exposed read-only for tests. */
export function remediationRoutingTable(): Readonly<
  Record<RemediationCondition, RemediationRole>
> {
  return CONDITION_ROLE;
}
