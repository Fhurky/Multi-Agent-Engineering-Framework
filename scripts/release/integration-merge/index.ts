/**
 * Published entry point of the DevOps-owned integration-to-`main` release merge
 * executor.
 *
 * DORMANCY. This module is dormant under the `dormant-before-durable-merge-ingress`
 * contract named in `docs/architecture/runtime/COMPONENT-BOUNDARIES.md`. No activation
 * prerequisite is satisfied, the human-controlled control plane is not provisioned, the
 * activation record is invalid, `admit` returns `AuthorityNotActivated`, and no merge
 * side effect may occur. Landing this source never activates the authority.
 *
 * The module is self-contained: it imports no runtime implementation module and no
 * runtime contract root, and nothing imports it. Repository observations, durable
 * evidence adapters, the executor lease, the injected clock, and the single merge port
 * are supplied through this entry point by the release control plane.
 */

export type {
  AcceptedBlockingSecurityRiskRecord,
  ActivationMember,
  AggregateGateRelation,
  ArtifactProducerType,
  AuthenticatedAdmissionUniverse,
  AuthenticatedImmutableDiff,
  AuthenticatedImmutableDiffEntry,
  AuthenticatedImmutableDiffPage,
  AuthenticatedImmutableDiffResolution,
  AuthenticatedArtifactResolution,
  AuthenticatedExecutionIdentity,
  AuthenticatedGateResolution,
  AuthenticatedIssuerStatus,
  AttestorIssuerStatus,
  AuthorPrePublicationEvidence,
  Clock,
  DurableAttemptReceipt,
  DurableHistoryAuthenticity,
  ImmutableArtifactProducer,
  ImmutableMergePortIdentity,
  ImmutableReleaseCapabilityBinding,
  ImmutableNegativeCapabilityAttestationRef,
  ImmutableProvenancedArtifactRef,
  PolicyObserverPrincipal,
  PreMutationAuthorizationRequest,
  ReleaseAdmissionFacts,
  ReleaseAttestationRequestChannel,
  ReleaseBaseContainment,
  ReleaseIntegrationInventoryEntry,
  RequiredGitHubPolicyProfile,
  RequiredBranchControlProfile,
  CompleteGitHubPolicyPayload,
  CompletePublishedHeadEvidenceBundle,
  ControlPostPublicationEvidence,
  DurableMergeIntentReceipt,
  DurableMergeIntentResult,
  DurablePolicyAuthorizationReceipt,
  DurableRetrySequenceReceipt,
  ExactHeadCheckEvidence,
  ExecutorAppIdentity,
  ExecutorGateAdmissibility,
  ExecutorKind,
  GateLineageId,
  GateName,
  GateVerdictState,
  GitOid,
  ImmutableDiffChangeKind,
  GitHubEffectiveRuleRecord,
  GitHubPolicySourceRecord,
  GitHubPolicyRuleRecord,
  HumanExceptionKind,
  HumanExceptionRecord,
  ImmutableAggregateGateSnapshot,
  ImmutableArtifactRef,
  ImmutableAuthorityPortIdentity,
  ImmutableAuthorizedHumanPrincipal,
  ImmutableHumanDecisionRef,
  ImmutableDiffArtifactRef,
  ImmutablePassingGateRef,
  ImmutablePolicyAttestorTrustRootRef,
  ImmutablePullRequestObservation,
  ImmutableRefObservation,
  ImmutableReleaseSecuritySnapshot,
  IncompletePublishedHeadEvidenceBundle,
  IntegrationUnitEvidence,
  IrreversibleProductionCoupling,
  IsoTimestamp,
  MergeAdmissionResult,
  MergeEvidenceHistory,
  MergeEvidenceRef,
  MergeEvidenceStore,
  MergeExecutorActivationRecord,
  MergeOutcomeRecord,
  MergeOutcomeStatus,
  MergeRefusal,
  MergeRefusalCode,
  NoLaterContentProof,
  ObservedCheckRun,
  PolicyAttestationObservation,
  PolicyBypassActor,
  PolicyControlAction,
  PolicyControlActionState,
  PolicyControlClassification,
  PolicyControlFacts,
  PublishedHeadCommandEvidence,
  PublishedHeadEvidenceBundle,
  ReleaseAdmissionInput,
  ReleaseAdmissionResult,
  ReleaseAuthorityPort,
  ReleaseExecutionDependencies,
  ReleaseExecutorCapability,
  ReleaseExecutionInput,
  ReleaseExecutionResult,
  ReleaseExecutorLease,
  ReleaseExecutorLeaseManager,
  ReleaseGateDomain,
  ReleaseGateManifest,
  ReleaseGateRequirement,
  ReleaseMergePlan,
  ReleaseMergePortResult,
  ReleaseMergeRequest,
  ReleaseObservationPort,
  ReleasePullRequestMergePort,
  ReleaseRepositoryIdentity,
  ReleaseRequiredCheckObservation,
  ReleaseSecurityFinding,
  RemediationCondition,
  RemediationRequest,
  RemediationRole,
  Sha256Hex,
  TrustedCurrentPolicyAttestation,
} from './contracts.ts';

export {
  ACTIVATION_MEMBERS,
  GATE_VERDICT_STATES,
  GOVERNANCE_DECISION_COMMIT,
  HUMAN_EXCEPTION_KIND_ORDER,
  MERGE_REFUSAL_CODES,
  POLICY_CONTROL_ACTION_ORDER,
  RELEASE_BASE_BRANCH,
  RELEASE_BASE_REF,
  RELEASE_EXECUTOR,
  RELEASE_GATE_DOMAINS,
  RELEASE_MERGE_METHOD,
  RELEASE_REMOTE_NAME,
  RELEASE_REMOTE_REF,
  RELEASE_SOURCE_BRANCH,
} from './contracts.ts';

export {
  canonicalBytes,
  canonicalJson,
  decodeBase64,
  isBase64,
  isGitOid,
  isIsoTimestamp,
  isSha256Hex,
  omitTopLevel,
  selfDigest,
  sha256Bytes,
  sha256Canonical,
} from './canonical-json.ts';

export {
  ACTIVATION_ARTIFACT_KINDS,
  ACTIVATION_GATE_EXPECTATIONS,
  validateActivation,
} from './activation.ts';
export type { ActivationDefect, ActivationValidation } from './activation.ts';

export {
  aggregateGateSnapshotDigest,
  evaluateRelation,
  expectedAcceptanceScopeDigest,
  matchingBlockingFindings,
  relationDefect,
  releaseSecuritySnapshotDigest,
  resolveAuthoritativeRound,
} from './gate-admissibility.ts';

export {
  evaluateReleaseGates,
  validateReleaseManifest,
} from './release-manifest.ts';
export type {
  ManifestValidation,
  ReleaseGateEvaluation,
} from './release-manifest.ts';

export {
  integrationEvidenceSetDigest,
  integrationInventoryDigest,
  validateReleaseLineage,
} from './release-lineage.ts';

export {
  NO_LATER_CONTENT_PROOF_KINDS,
  authorEvidenceDigest,
  bindPublishedHeadEvidence,
  bundleDigest,
  commandEvidenceId,
  validatePublishedHeadEvidence,
} from './published-head-evidence.ts';
export type {
  NoLaterContentProofKind,
  PublishedHeadEvidenceExpectations,
} from './published-head-evidence.ts';

export {
  POLICY_EXECUTION_MARGIN_MS,
  POLICY_FRESHNESS_WINDOW_MS,
  attestationSignedPayload,
  classifyPolicyControl,
  deriveEffectivePolicyProfile,
  executorAppSetDigest,
  normalizePolicyAttestation,
  observerPrincipalSetDigest,
  orderedDetectedActions,
  verifyAttestationSignature,
} from './policy-control.ts';
export type { PolicyAttestationExpectations } from './policy-control.ts';

export { evaluateRequiredChecks } from './required-checks.ts';
export type { PinnedRequiredCheckContext } from './required-checks.ts';
export {
  canonicalImmutableDiffEntriesBytes,
  canonicalImmutableDiffEntriesDigest,
  immutableDiffArtifactIdentityDigest,
  validateAuthenticatedImmutableDiff,
  validateImmutableDiffResolution,
} from './immutable-diff.ts';
export type {
  ImmutableDiffExpectation,
  ImmutableDiffValidation,
} from './immutable-diff.ts';
export {
  findProtectedPathChanges,
  isProtectedPath,
  protectedPathSet,
} from './protected-paths.ts';
export { remediationFor, remediationRoutingTable } from './remediation.ts';

export {
  DETERMINISTIC_DELAYS_MS,
  MAX_MUTATION_ATTEMPTS,
  MERGE_RETRY_POLICY_ID,
  TOTAL_BUDGET_MS,
  isRetryableFailure,
  nextRetryDecision,
} from './retry.ts';

export {
  DormantReleaseMergePort,
  RELEASE_MERGE_PORT_OPERATIONS,
  buildReleaseMergeRequest,
} from './merge-port.ts';

export {
  admit,
  computeAdmissionContext,
  computeIdempotencyKey,
  evidenceStoreKey,
  expectedIrreversibleAuthorizationScopeDigest,
  provenancedArtifactDefect,
  releaseAttestationExpectations,
} from './admission.ts';
export type { AdmissionContext } from './admission.ts';

export { execute, planSelfDefect, planStoreKey } from './execute.ts';
