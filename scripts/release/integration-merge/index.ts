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
  AuthorPrePublicationEvidence,
  Clock,
  CompleteGitHubPolicyPayload,
  CompletePublishedHeadEvidenceBundle,
  ControlPostPublicationEvidence,
  DurableMergeIntentReceipt,
  DurableMergeIntentResult,
  DurablePolicyAuthorizationReceipt,
  ExactHeadCheckEvidence,
  ExecutorAppIdentity,
  ExecutorGateAdmissibility,
  ExecutorKind,
  GateLineageId,
  GateName,
  GateVerdictState,
  GitOid,
  HumanExceptionKind,
  HumanExceptionRecord,
  ImmutableAggregateGateSnapshot,
  ImmutableArtifactRef,
  ImmutableAuthorizedHumanPrincipal,
  ImmutableHumanDecisionRef,
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
  ReleaseExecutionDependencies,
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
  GOVERNANCE_DECISION_COMMIT,
  HUMAN_EXCEPTION_KIND_ORDER,
  MERGE_REFUSAL_CODES,
  POLICY_CONTROL_ACTION_ORDER,
  RELEASE_BASE_BRANCH,
  RELEASE_BASE_REF,
  RELEASE_EXECUTOR,
  RELEASE_GATE_DOMAINS,
  RELEASE_MERGE_METHOD,
  RELEASE_SOURCE_BRANCH,
} from './contracts.ts';

export {
  canonicalJson,
  isGitOid,
  isIsoTimestamp,
  isSha256Hex,
  omitTopLevel,
  selfDigest,
  sha256Canonical,
} from './canonical-json.ts';

export { validateActivation } from './activation.ts';
export type { ActivationDefect, ActivationValidation } from './activation.ts';

export {
  evaluateRelation,
  expectedAcceptanceScopeDigest,
  matchingBlockingFindings,
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
  validateReleaseLineage,
} from './release-lineage.ts';

export {
  authorEvidenceDigest,
  bundleDigest,
  commandEvidenceId,
  validatePublishedHeadEvidence,
} from './published-head-evidence.ts';

export {
  POLICY_EXECUTION_MARGIN_MS,
  POLICY_FRESHNESS_WINDOW_MS,
  classifyPolicyControl,
  normalizePolicyAttestation,
  orderedDetectedActions,
} from './policy-control.ts';
export type { PolicyAttestationExpectations } from './policy-control.ts';

export { evaluateRequiredChecks } from './required-checks.ts';
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
} from './admission.ts';

export { execute, planStoreKey } from './execute.ts';
