/**
 * Local type surface of the DevOps-owned integration-to-`main` release merge executor.
 *
 * Transcribed from the approved contract in
 * `docs/architecture/runtime/POST-GATE-MERGE-EXECUTORS.md`,
 * `docs/architecture/runtime/COMPONENT-BOUNDARIES.md`,
 * `docs/architecture/runtime/INTEGRATION-STRATEGY.md`, and ADR-0042/0043/0044,
 * all read at `f148567d716c00d7a24783318c8d6d7031492e7b`.
 *
 * This module is a self-contained release control-plane module. It imports no runtime
 * implementation and no runtime contract root; every type below is executor-local and
 * is not a re-declaration of a `state/contracts` or `agents/contracts` type.
 *
 * The executor is DORMANT. No value in this file activates any authority.
 */

/* ------------------------------------------------------------------------- *
 * Primitives
 * ------------------------------------------------------------------------- */

/** Full 40-character lowercase hexadecimal Git object identifier. */
export type GitOid = string;

/** Lowercase hexadecimal SHA-256 digest over canonical JSON. */
export type Sha256Hex = string;

/** RFC 3339 UTC timestamp. */
export type IsoTimestamp = string;

/** Absolute filesystem path. */
export type AbsolutePath = string;

export type GateLineageId = string;

export type GateName =
  | 'review'
  | 'security'
  | 'qa'
  | 'performance'
  | 'documentation'
  | 'deployment'
  | 'rollback';

/** The single executor identity this module implements. */
export type ExecutorKind = 'release_main';

export const RELEASE_EXECUTOR: ExecutorKind = 'release_main';

export const RELEASE_SOURCE_BRANCH = 'integration/autonomous-runtime';
export const RELEASE_BASE_BRANCH = 'main';
export const RELEASE_BASE_REF = 'refs/heads/main';
export const RELEASE_MERGE_METHOD = 'merge';

/** The exact remote name and remote-tracking ref published-head evidence must name. */
export const RELEASE_REMOTE_NAME = 'origin';
export const RELEASE_REMOTE_REF =
  'refs/remotes/origin/integration/autonomous-runtime';

/** HUMAN-004, approved at this immutable commit. */
export const GOVERNANCE_DECISION_COMMIT =
  '7dc07488a5b1cac8b1327ebd63bf747adbe03c68';

/* ------------------------------------------------------------------------- *
 * Immutable references
 * ------------------------------------------------------------------------- */

export interface ImmutableArtifactRef {
  readonly kind: string;
  readonly commit: GitOid;
  readonly path: string;
  readonly digest: Sha256Hex;
}

/**
 * Who produced an immutable artifact. `merge_executor` is representable precisely so
 * executor-produced evidence can be named and refused; it is never admissible.
 */
export type ArtifactProducerType = 'human' | 'agent_role' | 'merge_executor';

export interface ImmutableArtifactProducer {
  readonly principalId: string;
  readonly principalType: ArtifactProducerType;
  readonly authorizationCommit: GitOid;
}

/**
 * An immutable artifact reference that can express producer provenance. Absent
 * provenance is a defect, not a permissive default: every activation member and every
 * authoritative admission artifact must carry one.
 */
export interface ImmutableProvenancedArtifactRef extends ImmutableArtifactRef {
  readonly producedByExecutor: boolean;
  readonly producer: ImmutableArtifactProducer;
}

export interface ImmutablePassingGateRef {
  /** The exact activation slot this reference may occupy. */
  readonly member: ActivationMember;
  readonly lineage: GateLineageId;
  readonly lineageRound: number;
  readonly gate: GateName;
  /** The immutable artifact this verdict judged. */
  readonly targetCommit: GitOid;
  readonly verdictCommit: GitOid;
  readonly verdictState: 'passing';
  /** True when the referenced evidence was produced by a merge executor itself. */
  readonly producedByExecutor: boolean;
  readonly producer: ImmutableArtifactProducer;
}

export interface ImmutablePolicyAttestorTrustRootRef {
  readonly authorityId: string;
  readonly keyId: string;
  readonly keyAlgorithm: 'Ed25519';
  /**
   * The SPKI DER encoding of the attestor's Ed25519 verification key, base64. It is
   * activation-pinned material, not a caller hint: its SHA-256 must equal
   * `publicKeyDigest`, which the activation record also pins.
   */
  readonly publicKeySpkiBase64: string;
  readonly publicKeyDigest: Sha256Hex;
  readonly acceptedSchema: 'github-current-policy-attestation/v1';
  readonly revocationChannelId: string;
  readonly pinnedCommit: GitOid;
}

export interface ImmutableAuthorizedHumanPrincipal {
  readonly principalId: string;
  readonly principalType: 'human';
  readonly authorizationCommit: GitOid;
}

/**
 * An authorized-human decision. It names the exact policy commit, release head,
 * repository, action, and scope it authorizes, so an unrelated decision cannot be
 * presented as authorization for this release.
 */
export interface ImmutableHumanDecisionRef {
  readonly decisionId: string;
  readonly decisionCommit: GitOid;
  readonly artifactPath: string;
  readonly repositoryId: string;
  readonly policyCommit: GitOid;
  readonly releaseHeadOid: GitOid;
  readonly action: 'authorize_policy_required_irreversible_production_action';
  readonly authorizedBy: ImmutableAuthorizedHumanPrincipal;
  readonly scopeDigest: Sha256Hex;
}

/** The opaque identity of the concrete merge broker and port supplied at execution. */
export interface ImmutableMergePortIdentity {
  readonly brokerId: string;
  readonly portIdentityDigest: Sha256Hex;
}

/**
 * The negative-capability attestation additionally binds the concrete broker and port
 * identity the attested evidence was produced against, so an arbitrary injected adapter
 * cannot inherit that attestation.
 */
export interface ImmutableNegativeCapabilityAttestationRef
  extends ImmutableProvenancedArtifactRef {
  readonly attestedMergePortIdentity: ImmutableMergePortIdentity;
  readonly attestedAuthorityPortIdentity: ImmutableAuthorityPortIdentity;
}

/** Opaque identity of the independently provisioned, read-only authority resolver. */
export interface ImmutableAuthorityPortIdentity {
  readonly resolverId: string;
  readonly resolverIdentityDigest: Sha256Hex;
}

/** One immutable object resolved from its exact commit/path, including its bytes. */
export interface AuthenticatedArtifactResolution {
  readonly ref: ImmutableArtifactRef;
  readonly canonicalValue: unknown;
  readonly producer: ImmutableArtifactProducer;
  readonly producerAuthorized: true;
  readonly authorizationEvidenceCommit: GitOid;
}

/** One passing gate verdict resolved from its immutable verdict commit. */
export interface AuthenticatedGateResolution {
  readonly verdict: ImmutablePassingGateRef;
  readonly producerAuthorized: true;
  readonly authorizationEvidenceCommit: GitOid;
}

/** Independently authenticated issuer/key status. The signing key cannot issue it. */
export interface AuthenticatedIssuerStatus {
  readonly channelId: string;
  readonly statusAuthorityId: string;
  readonly authorityId: string;
  readonly keyId: string;
  readonly publicKeyDigest: Sha256Hex;
  readonly state: 'active' | 'revoked' | 'unknown';
  readonly policyGeneration: number;
  readonly observedAtUtc: IsoTimestamp;
  readonly evidenceCommit: GitOid;
  readonly evidenceDigest: Sha256Hex;
}

/** Independent execution identity for one published-head command record. */
export interface AuthenticatedExecutionIdentity {
  readonly evidenceId: Sha256Hex;
  readonly phase: 'author_pre_publication' | 'control_post_publication';
  readonly principalId: string;
  readonly executionSessionId: string;
  readonly executionInstanceId: string;
  readonly identityAuthorityId: string;
  readonly evidenceCommit: GitOid;
}

/**
 * Exact admission universe enumerated by the authority resolver. Equality with this
 * value prevents a caller from narrowing any gate, finding, integration unit, check,
 * publication command, or human-decision set.
 */
export interface AuthenticatedAdmissionUniverse {
  readonly repositoryId: string;
  readonly releaseHeadOid: GitOid;
  readonly manifestSource: ImmutableProvenancedArtifactRef;
  readonly gateSnapshotSource: ImmutableProvenancedArtifactRef;
  readonly securitySnapshotSource: ImmutableProvenancedArtifactRef;
  readonly integrationEvidenceSource: ImmutableProvenancedArtifactRef;
  readonly requiredPolicyProfileSource: ImmutableProvenancedArtifactRef;
  readonly gateRelations: readonly AggregateGateRelation[];
  readonly securityFindings: readonly ReleaseSecurityFinding[];
  readonly integrationEvidence: readonly IntegrationUnitEvidence[];
  readonly requiredChecks: ReleaseRequiredCheckObservation;
  readonly publicationCommandEvidenceIds: readonly Sha256Hex[];
  readonly humanDecisions: readonly ImmutableHumanDecisionRef[];
  readonly evidenceCommit: GitOid;
  readonly universeDigest: Sha256Hex;
}

/**
 * Narrow read-only trust boundary. It cannot observe or mutate repository policy and
 * exposes no generic Git, HTTP, ref, credential, gate, task, or lock operation.
 */
export interface ReleaseAuthorityPort {
  readonly identity: ImmutableAuthorityPortIdentity;
  resolveArtifact(ref: ImmutableArtifactRef): AuthenticatedArtifactResolution | null;
  resolvePassingGate(ref: ImmutablePassingGateRef): AuthenticatedGateResolution | null;
  resolveTrustRoot(
    ref: ImmutablePolicyAttestorTrustRootRef,
  ): ImmutablePolicyAttestorTrustRootRef | null;
  resolveAuthorizedHuman(
    principal: ImmutableAuthorizedHumanPrincipal,
  ): ImmutableAuthorizedHumanPrincipal | null;
  enumerateAdmissionUniverse(
    repositoryId: string,
    releaseHeadOid: GitOid,
  ): AuthenticatedAdmissionUniverse | null;
  resolveIssuerStatus(
    authorityId: string,
    keyId: string,
    policyGeneration: number,
  ): AuthenticatedIssuerStatus | null;
  authenticateExecutionEvidence(
    evidenceId: Sha256Hex,
  ): AuthenticatedExecutionIdentity | null;
  resolveHumanDecision(
    decision: ImmutableHumanDecisionRef,
  ): ImmutableHumanDecisionRef | null;
  resolveAcceptedRisk(
    record: AcceptedBlockingSecurityRiskRecord,
  ): AcceptedBlockingSecurityRiskRecord | null;
}

/* ------------------------------------------------------------------------- *
 * Activation record
 * ------------------------------------------------------------------------- */

export interface MergeExecutorActivationRecord {
  readonly executor: ExecutorKind;
  readonly governanceDecisionCommit: typeof GOVERNANCE_DECISION_COMMIT;
  /**
   * The record's own immutable artifact identity. Its digest is the canonical digest of
   * the record with exactly this property omitted, so the record authenticates itself
   * rather than being asserted by its bearer.
   */
  readonly recordSource: ImmutableArtifactRef;
  /** The authorized human who issued the record. An executor may never issue one. */
  readonly issuer: ImmutableAuthorizedHumanPrincipal;
  readonly producedByExecutor: boolean;
  readonly architectureReview: ImmutablePassingGateRef;
  readonly implementationReview: ImmutablePassingGateRef;
  readonly implementationSecurityReview: ImmutablePassingGateRef;
  readonly negativeCapabilityTestAttestation: ImmutableNegativeCapabilityAttestationRef;
  readonly gateVocabularyCorrection: ImmutableProvenancedArtifactRef;
  readonly requiredGitHubPolicyProfile: ImmutableProvenancedArtifactRef;
  readonly requiredGitHubPolicyProfileDigest: Sha256Hex;
  readonly policyAttestorTrustRoot: ImmutablePolicyAttestorTrustRootRef;
}

/**
 * The immutable required-policy profile document. Its canonical digest is
 * `MergeExecutorActivationRecord.requiredGitHubPolicyProfileDigest`, so the required
 * check set, the expected App identities and permission maps, the pinned observer set,
 * and the release gate floors are all activation-pinned rather than caller-selected.
 */
export interface RequiredGitHubPolicyProfile {
  readonly schema: 'required-github-policy-profile/v1';
  readonly repositoryId: string;
  readonly protectedRef: typeof RELEASE_BASE_REF;
  readonly requiredCheckContexts: readonly {
    readonly name: string;
    readonly expectedAppId: number;
  }[];
  readonly releaseGateRequirements: readonly ReleaseGateRequirement[];
  /** Both least-privilege executor App identities, with their complete permission maps. */
  readonly executorApps: readonly ExecutorAppIdentity[];
  readonly observerPrincipalSetDigest: Sha256Hex;
  readonly mergeMethodsRequired: readonly string[];
}

/** The seven immutable activation members, in their declared order. */
export const ACTIVATION_MEMBERS = [
  'architectureReview',
  'implementationReview',
  'implementationSecurityReview',
  'negativeCapabilityTestAttestation',
  'gateVocabularyCorrection',
  'requiredGitHubPolicyProfile',
  'policyAttestorTrustRoot',
] as const;

export type ActivationMember = (typeof ACTIVATION_MEMBERS)[number];

/* ------------------------------------------------------------------------- *
 * Gate admissibility
 * ------------------------------------------------------------------------- */

export interface AcceptedBlockingSecurityRiskRecord {
  readonly schema: 'accepted-blocking-security-risk/v1';
  readonly recordCommit: GitOid;
  readonly acceptanceDecisionCommit: GitOid;
  readonly acceptedBy: ImmutableAuthorizedHumanPrincipal;
  readonly targetCommit: GitOid;
  readonly securityLineage: GateLineageId;
  readonly securityLineageRound: number;
  readonly securityVerdictCommit: GitOid;
  readonly findingId: string;
  readonly findingSeverity: 'high' | 'critical';
  readonly findingEvidenceDigest: Sha256Hex;
  readonly acceptanceScopeDigest: Sha256Hex;
  readonly acceptedAt: IsoTimestamp;
}

export type ExecutorGateAdmissibility =
  | {
      readonly status: 'passing';
      readonly gate: GateName;
      readonly lineage: GateLineageId;
      readonly lineageRound: number;
      readonly authoritativeVerdictCommit: GitOid;
    }
  | {
      readonly status: 'accepted_security_risk';
      readonly gate: 'security';
      readonly lineage: GateLineageId;
      readonly lineageRound: number;
      readonly authoritativeVerdictState: 'formally_accepted';
      readonly authoritativeVerdictCommit: GitOid;
      readonly acceptedRisks: readonly AcceptedBlockingSecurityRiskRecord[];
    }
  | {
      readonly status: 'not_admissible';
      readonly code:
        | 'PreMergeGateOpen'
        | 'PreMergeGateNotPassing'
        | 'SecurityRiskAcceptanceInvalid';
    };

export type GateVerdictState =
  | 'passing'
  | 'changes_required'
  | 'failed'
  | 'pending'
  | 'open'
  | 'formally_accepted';

/** The closed verdict-state vocabulary, used to validate every observed relation. */
export const GATE_VERDICT_STATES = [
  'passing',
  'changes_required',
  'failed',
  'pending',
  'open',
  'formally_accepted',
] as const;

/**
 * One authoritative relation of one aggregate gate lineage round, as observed in the
 * immutable gate snapshot. `ownerForm` records the withdrawn target form, which is
 * always invalid.
 */
export interface AggregateGateRelation {
  readonly lineage: GateLineageId;
  readonly lineageRound: number;
  readonly gate: GateName;
  readonly gateClass: 'aggregate' | 'point';
  readonly ownerForm: boolean;
  readonly verdictState: GateVerdictState;
  readonly verdictCommit: GitOid;
  /** Every relation in this round's atomic verdict batch is closed. */
  readonly relationSetComplete: boolean;
  readonly acceptedRisks: readonly AcceptedBlockingSecurityRiskRecord[];
}

export interface ImmutableAggregateGateSnapshot {
  readonly snapshotDigest: Sha256Hex;
  readonly relations: readonly AggregateGateRelation[];
}

/* ------------------------------------------------------------------------- *
 * Release security snapshot
 * ------------------------------------------------------------------------- */

export interface ReleaseSecurityFinding {
  readonly findingId: string;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly resolved: boolean;
  readonly appliesToRelease: boolean;
  readonly targetCommit: GitOid;
  readonly evidenceDigest: Sha256Hex;
  readonly securityLineage: GateLineageId;
  readonly securityLineageRound: number;
  readonly securityVerdictCommit: GitOid;
}

export interface ImmutableReleaseSecuritySnapshot {
  readonly snapshotDigest: Sha256Hex;
  readonly findings: readonly ReleaseSecurityFinding[];
}

/* ------------------------------------------------------------------------- *
 * Release gate manifest
 * ------------------------------------------------------------------------- */

export type ReleaseGateDomain =
  | 'review'
  | 'security'
  | 'qa'
  | 'performance'
  | 'documentation'
  | 'deployment'
  | 'rollback';

/** The complete, closed seven-member release aggregate domain set. */
export const RELEASE_GATE_DOMAINS = [
  'review',
  'security',
  'qa',
  'performance',
  'documentation',
  'deployment',
  'rollback',
] as const;

export interface ReleaseGateRequirement {
  readonly domain: ReleaseGateDomain;
  readonly lineage: GateLineageId;
  readonly minimumRound: number;
  readonly gateClass: 'aggregate';
}

export type IrreversibleProductionCoupling =
  | { readonly coupled: false }
  | {
      readonly coupled: true;
      readonly policyCommit: GitOid;
      readonly authorization: ImmutableHumanDecisionRef | null;
    };

/**
 * One entry of the complete ordered integration unit inventory. The manifest is read
 * from the release head tree, so the inventory is content-bound to `sourceOid` and is
 * not a caller-selected list of whichever units the caller chose to supply evidence for.
 */
export interface ReleaseIntegrationInventoryEntry {
  readonly unitId: string;
  readonly orderKey: string;
  readonly unitKind: 'ordinary-task' | 'cumulative-lineage';
  readonly proof: 'content-merged' | 'lineage-subsumed';
}

export interface ReleaseGateManifest {
  readonly schema: 'release-gates/v1';
  readonly repositoryId: string;
  readonly sourceBranch: typeof RELEASE_SOURCE_BRANCH;
  readonly sourceOid: GitOid;
  readonly baseBranch: typeof RELEASE_BASE_BRANCH;
  readonly baseOid: GitOid;
  readonly mergeMethod: typeof RELEASE_MERGE_METHOD;
  readonly requirements: readonly ReleaseGateRequirement[];
  readonly integrationEvidenceSetDigest: Sha256Hex;
  /** The complete ordered unit inventory the evidence set must cover exactly. */
  readonly integrationUnitInventory: readonly ReleaseIntegrationInventoryEntry[];
  /** The tree the integration branch carried before the first content unit. */
  readonly integrationInitialTreeOid: GitOid;
  readonly publishedHeadEvidenceDigest: Sha256Hex;
  readonly irreversibleProductionCoupling: IrreversibleProductionCoupling;
}

/* ------------------------------------------------------------------------- *
 * Release integration lineage evidence
 * ------------------------------------------------------------------------- */

export interface IntegrationUnitEvidence {
  readonly unitKind: 'ordinary-task' | 'cumulative-lineage';
  readonly unitId: string;
  /** `IntegrationOrderKey`; ascending lexicographic order is the fold order. */
  readonly orderKey: string;
  readonly proof: 'content-merged' | 'lineage-subsumed';
  readonly producer: 'runtime_executor' | 'legacy_operator';
  readonly sourceOid: GitOid;
  readonly mergeMethod: 'squash';
  readonly gateSnapshotDigest: Sha256Hex;
  /** Tree the integration branch carried before this unit; null only for the first unit. */
  readonly previousResultTreeOid: GitOid | null;
  /** Tree the integration branch carries after this unit. */
  readonly resultTreeOid: GitOid;
  /** Content unit that subsumes this one; required for and only for `lineage-subsumed`. */
  readonly subsumedBy: string | null;
  /** False when the unit's evidence could not be independently verified. */
  readonly verified: boolean;
}

/* ------------------------------------------------------------------------- *
 * Published-head evidence, schema `published-head-evidence/v2`
 * ------------------------------------------------------------------------- */

export interface PublishedHeadCommandEvidence {
  readonly schema: 'published-head-command-evidence/v2';
  readonly evidenceId: Sha256Hex;
  readonly phase: 'author_pre_publication' | 'control_post_publication';
  readonly producer: {
    readonly role: string;
    readonly executionSessionId: string;
  };
  readonly targetCommit: GitOid;
  readonly branch: string;
  readonly workingDirectory: AbsolutePath;
  readonly startedAtUtc: IsoTimestamp;
  readonly endedAtUtc: IsoTimestamp;
  readonly executable: string;
  readonly arguments: readonly string[];
  readonly renderedCommand: string;
  readonly materialArguments: Readonly<Record<string, string | number | boolean>>;
  readonly resolvedBases: Readonly<Record<string, GitOid>>;
  readonly headBefore: GitOid;
  readonly headAfter: GitOid;
  readonly expectedExitCode: number;
  readonly exitCode: number;
  readonly actualResult: {
    readonly summary: string;
    readonly outputDigest: Sha256Hex | null;
    readonly derivation: string | null;
  };
}

export interface AuthorPrePublicationEvidence {
  readonly phase: 'author_pre_publication';
  readonly targetCommit: GitOid;
  readonly branch: string;
  readonly authoredParents: readonly GitOid[];
  readonly resolvedBases: Readonly<Record<string, GitOid>>;
  readonly declaredCheckIds: readonly string[];
  readonly commands: readonly PublishedHeadCommandEvidence[];
  readonly completedAtUtc: IsoTimestamp;
  readonly canonicalAuthorEvidenceDigest: Sha256Hex;
}

export interface NoLaterContentProof {
  readonly targetCommit: GitOid;
  readonly branch: string;
  readonly remoteRef: string;
  readonly pullRequestNumber: number;
  readonly localBranchHeadOid: GitOid;
  readonly remoteBranchHeadOid: GitOid;
  readonly pullRequestHeadOid: GitOid;
  readonly commitsAfterTarget: {
    readonly localBranch: number;
    readonly remoteBranch: number;
    readonly pullRequestHead: number;
  };
  readonly observedAtUtc: IsoTimestamp;
  readonly proofCommandEvidenceIds: readonly Sha256Hex[];
}

export interface ExactHeadCheckEvidence {
  readonly targetCommit: GitOid;
  readonly queriedAtUtc: IsoTimestamp;
  readonly state: 'present_successful' | 'present_nonpassing' | 'absent';
  readonly totalCount: number;
  readonly checks: readonly {
    readonly name: string;
    readonly appId: number;
    readonly startedAtUtc: IsoTimestamp | null;
    readonly completedAtUtc: IsoTimestamp | null;
    readonly conclusion: string | null;
  }[];
}

export interface ControlPostPublicationEvidence {
  readonly phase: 'control_post_publication';
  readonly targetCommit: GitOid;
  readonly branch: string;
  readonly authorEvidenceDigest: Sha256Hex;
  readonly resolvedBases: Readonly<Record<string, GitOid>>;
  readonly declaredCheckIds: readonly string[];
  readonly commands: readonly PublishedHeadCommandEvidence[];
  readonly noLaterContent: NoLaterContentProof;
  readonly exactHeadChecks: ExactHeadCheckEvidence;
  readonly completedAtUtc: IsoTimestamp;
}

export interface CompletePublishedHeadEvidenceBundle {
  readonly schema: 'published-head-evidence/v2';
  readonly status: 'complete';
  readonly targetCommit: GitOid;
  readonly branch: string;
  readonly author: AuthorPrePublicationEvidence;
  readonly control: ControlPostPublicationEvidence;
  readonly canonicalBundleDigest: Sha256Hex;
}

/**
 * A bundle whose control phase has not been produced yet. It is structurally
 * representable so an author phase can exist before publication, and it is never
 * admissible.
 */
export interface IncompletePublishedHeadEvidenceBundle {
  readonly schema: 'published-head-evidence/v2';
  readonly status: 'author_phase_only';
  readonly targetCommit: GitOid;
  readonly branch: string;
  readonly author: AuthorPrePublicationEvidence;
  readonly control: null;
}

export type PublishedHeadEvidenceBundle =
  | CompletePublishedHeadEvidenceBundle
  | IncompletePublishedHeadEvidenceBundle;

/* ------------------------------------------------------------------------- *
 * Trusted current-policy attestation
 * ------------------------------------------------------------------------- */

export interface ExecutorAppIdentity {
  readonly appId: number;
  readonly installationId: number;
  readonly nodeId: string;
  readonly slug: string;
  readonly permissions: Readonly<Record<string, 'read' | 'write' | 'admin'>>;
}

export interface PolicyBypassActor {
  readonly actorId: number;
  readonly actorType: string;
  readonly bypassMode: string;
  readonly sourcePolicyId: string;
  readonly sourceLevel: 'repository' | 'organization' | 'enterprise' | 'classic';
}

/** One pinned policy-observer principal, signed inside the attestation payload. */
export interface PolicyObserverPrincipal {
  readonly principalId: string;
  readonly principalType: string;
  readonly installationScope: string;
  readonly permissions: Readonly<Record<string, string>>;
  readonly credentialScopeDigest: Sha256Hex;
}

/**
 * The attestor's own online issuer and key status, signed inside the canonical payload
 * so a revocation result is neither caller-classified nor replayable independently of
 * the attestation it authorizes.
 */
export interface AttestorIssuerStatus {
  readonly channelId: string;
  readonly authorityId: string;
  readonly keyId: string;
  readonly publicKeyDigest: Sha256Hex;
  readonly state: 'active' | 'revoked' | 'unknown';
  readonly policyGeneration: number;
  readonly observedAtUtc: IsoTimestamp;
}

export interface CompleteGitHubPolicyPayload {
  /** Every effective layer reported a complete, explicitly observed bypass actor set. */
  readonly bypassActorsComplete: boolean;
  readonly bypassActors: readonly PolicyBypassActor[];
  /** The complete pinned observer principal set; its digest is compared, not claimed. */
  readonly observerPrincipals: readonly PolicyObserverPrincipal[];
  readonly issuerStatus: AttestorIssuerStatus;
  /** Every page of every enumerated policy response was consumed. */
  readonly paginationComplete: boolean;
  /** Classic protection and every applicable ruleset were enumerated with parents. */
  readonly rulesetEnumerationComplete: boolean;
  readonly classicProtectionComplete: boolean;
  readonly requiredCheckSources: readonly {
    readonly name: string;
    readonly appId: number;
  }[];
  readonly mergeMethodsConfigured: readonly string[];
  readonly executorApps: readonly ExecutorAppIdentity[];
  readonly observerPrincipalSetDigest: Sha256Hex;
  /** Neither executor App is a bypass actor, an administrator, or a policy mutator. */
  readonly executorAppsAbsentFromBypassSets: boolean;
  /** Unknown, redacted, or unrecognized response members make the payload incomplete. */
  readonly unknownPayloadMembers: readonly string[];
  readonly effectiveControlEvaluationComplete: boolean;
  /** Enumerated classic protection and every applicable ruleset and effective rule. */
  readonly policySources: readonly GitHubPolicySourceRecord[];
  readonly effectiveRules: readonly GitHubEffectiveRuleRecord[];
}

export interface GitHubPolicySourceRecord {
  readonly sourceLevel: 'classic' | 'repository' | 'organization' | 'enterprise';
  readonly sourcePolicyId: string;
  readonly parentPolicyId: string | null;
  readonly enforcement: 'active' | 'evaluate' | 'disabled';
  readonly version: string;
  readonly conditions: Readonly<Record<string, string>>;
  readonly rules: readonly string[];
  readonly bypassActors: readonly PolicyBypassActor[];
  readonly page: number;
  readonly pageCount: number;
  readonly pages: readonly {
    readonly page: number;
    readonly responseDigest: Sha256Hex;
  }[];
  readonly responseDigest: Sha256Hex;
}

export interface GitHubEffectiveRuleRecord {
  readonly rule: string;
  readonly sourcePolicyId: string;
  readonly sourceLevel: 'classic' | 'repository' | 'organization' | 'enterprise';
  readonly effective: boolean;
}

export interface TrustedCurrentPolicyAttestation {
  readonly schema: 'github-current-policy-attestation/v1';
  readonly issuer: {
    readonly authorityId: string;
    readonly keyId: string;
    readonly publicKeyDigest: Sha256Hex;
    readonly signatureAlgorithm: 'Ed25519';
    readonly policyGeneration: number;
    readonly observerPrincipalSetDigest: Sha256Hex;
  };
  readonly subject: {
    readonly githubHost: 'github.com';
    readonly repository: {
      readonly databaseId: number;
      readonly nodeId: string;
      readonly owner: string;
      readonly name: string;
    };
    readonly protectedRef:
      | 'refs/heads/integration/autonomous-runtime'
      | 'refs/heads/main';
    readonly executor: ExecutorKind;
    readonly pullRequestNumber: number;
    readonly headOid: GitOid;
    readonly baseOid: GitOid;
    readonly admissionContextNonce: Sha256Hex;
    readonly admissionContextDigest: Sha256Hex;
    readonly authorizationPhase: 'pre_intent' | 'pre_mutation';
    readonly executorApps: readonly ExecutorAppIdentity[];
  };
  readonly policy: CompleteGitHubPolicyPayload;
  readonly observedAt: IsoTimestamp;
  readonly issuedAt: IsoTimestamp;
  readonly notBefore: IsoTimestamp;
  readonly expiresAt: IsoTimestamp;
  readonly sourceEvidenceDigest: Sha256Hex;
  readonly sourceEvidence: readonly GitHubPolicySourceRecord[];
  readonly policyDigest: Sha256Hex;
  readonly effectivePolicyProfileDigest: Sha256Hex;
  readonly canonicalPayloadDigest: Sha256Hex;
  readonly signature: string;
}

/* ------------------------------------------------------------------------- *
 * Policy-control classification (ADR-0044)
 * ------------------------------------------------------------------------- */

export type PolicyControlAction =
  | 'attestor_provisioning_required'
  | 'observer_credential_grant_required'
  | 'observer_credential_rotated_or_revoked'
  | 'executor_or_observer_permission_changed'
  | 'attestor_issuer_or_key_changed_or_revoked'
  | 'branch_protection_changed'
  | 'ruleset_or_ruleset_applicability_changed'
  | 'required_check_source_changed'
  | 'bypass_or_exemption_set_changed'
  | 'repository_authorization_policy_changed';

/** Literal order used to sort detected actions. */
export const POLICY_CONTROL_ACTION_ORDER = [
  'attestor_provisioning_required',
  'observer_credential_grant_required',
  'observer_credential_rotated_or_revoked',
  'executor_or_observer_permission_changed',
  'attestor_issuer_or_key_changed_or_revoked',
  'branch_protection_changed',
  'ruleset_or_ruleset_applicability_changed',
  'required_check_source_changed',
  'bypass_or_exemption_set_changed',
  'repository_authorization_policy_changed',
] as const;

export type PolicyControlActionState =
  | {
      readonly status: 'detected';
      readonly actions: readonly PolicyControlAction[];
      readonly evidence: readonly ImmutableArtifactRef[];
    }
  | { readonly status: 'excluded'; readonly evidence: ImmutableArtifactRef }
  | {
      readonly status: 'unknown';
      readonly candidateActions: readonly PolicyControlAction[];
      readonly evidence: readonly ImmutableArtifactRef[];
    };

export type PolicyAttestationObservation =
  | {
      readonly state: 'current_valid';
      readonly attestation: TrustedCurrentPolicyAttestation;
    }
  | {
      readonly state: 'operationally_unavailable';
      readonly reason:
        | 'transport_before_authentication'
        | 'authenticated_rate_limit'
        | 'github_5xx'
        | 'attestor_service_outage';
    }
  | {
      readonly state: 'present_invalid';
      readonly reason:
        | 'signature'
        | 'subject'
        | 'digest'
        | 'completeness'
        | 'pagination'
        | 'unknown_payload_member';
    }
  | {
      readonly state: 'present_valid_but_stale';
      readonly reason: 'not_yet_valid' | 'expired' | 'insufficient_execution_margin';
    };

export interface PolicyControlFacts {
  readonly action: PolicyControlActionState;
  readonly observation: PolicyAttestationObservation;
}

export type PolicyControlClassification =
  | { readonly status: 'usable'; readonly attestation: TrustedCurrentPolicyAttestation }
  | {
      readonly status: 'refused';
      readonly refusalCode:
        | 'PolicyObservationUnavailable'
        | 'PolicyAttestationInvalid'
        | 'PolicyAttestationStale';
      readonly evidence: readonly ImmutableArtifactRef[];
    }
  | {
      readonly status: 'human_exception_required';
      readonly exception: HumanExceptionRecord;
    };

/* ------------------------------------------------------------------------- *
 * Human exception surface
 * ------------------------------------------------------------------------- */

export type HumanExceptionKind =
  | 'accept_blocking_high_or_critical_security_risk'
  | 'authorize_policy_required_irreversible_production_action'
  | 'change_credentials_or_repository_authorization_policy';

/** Fixed order of the three closed exception kinds. */
export const HUMAN_EXCEPTION_KIND_ORDER = [
  'accept_blocking_high_or_critical_security_risk',
  'authorize_policy_required_irreversible_production_action',
  'change_credentials_or_repository_authorization_policy',
] as const;

export type HumanExceptionRecord =
  | {
      readonly status: 'human_exception_required';
      readonly classification: 'detected';
      readonly kind: HumanExceptionKind;
      readonly executor: ExecutorKind;
      readonly immutableSubjects: readonly ImmutableArtifactRef[];
      readonly evidenceRecord: MergeEvidenceRef;
    }
  | {
      readonly status: 'human_exception_required';
      readonly classification: 'unclassifiable';
      readonly kind: null;
      readonly candidateKinds: readonly HumanExceptionKind[];
      readonly executor: ExecutorKind;
      readonly immutableSubjects: readonly ImmutableArtifactRef[];
      readonly evidenceRecord: MergeEvidenceRef;
    };

/* ------------------------------------------------------------------------- *
 * Refusals, remediation, and the total admission result
 * ------------------------------------------------------------------------- */

export type MergeRefusalCode =
  | 'AuthorityNotActivated'
  | 'SourceRecordInvalid'
  | 'ReleaseManifestInvalid'
  | 'TargetNotReviewReady'
  | 'PreMergeGateOpen'
  | 'PreMergeGateNotPassing'
  | 'SecurityRiskAcceptanceInvalid'
  | 'ReleaseGateDomainMissing'
  | 'ReleaseGateNotPassing'
  | 'SecurityEvidenceMissing'
  | 'PolicyObservationUnavailable'
  | 'PolicyAttestationInvalid'
  | 'PolicyAttestationStale'
  | 'PublishedHeadEvidenceIncomplete'
  | 'PublishedHeadEvidenceMismatch'
  | 'PublishedHeadVerificationFailed'
  | 'PublicationMismatch'
  | 'SourceBranchMismatch'
  | 'BaseBranchMismatch'
  | 'HeadOidMismatch'
  | 'BaseOidMismatch'
  | 'MergeMethodMismatch'
  | 'IntegrationOrderViolation'
  | 'IntegrationEvidenceIncomplete'
  | 'ExpectedTreeMismatch'
  | 'ProtectedPathChange'
  | 'RequiredCheckMissing'
  | 'RequiredCheckNotSuccessful'
  | 'RequiredCheckPublisherMismatch'
  | 'IntentNotDurable'
  | 'IntentReceiptInvalid'
  | 'MergeConflict'
  | 'GitHubRejected'
  | 'OutcomeUnknown'
  | 'ResultUnverifiable'
  | 'RetryExhausted'
  | 'UnsupportedOperation';

/** The complete closed refusal-code set, used by the exhaustive admission table. */
export const MERGE_REFUSAL_CODES = [
  'AuthorityNotActivated',
  'SourceRecordInvalid',
  'ReleaseManifestInvalid',
  'TargetNotReviewReady',
  'PreMergeGateOpen',
  'PreMergeGateNotPassing',
  'SecurityRiskAcceptanceInvalid',
  'ReleaseGateDomainMissing',
  'ReleaseGateNotPassing',
  'SecurityEvidenceMissing',
  'PolicyObservationUnavailable',
  'PolicyAttestationInvalid',
  'PolicyAttestationStale',
  'PublishedHeadEvidenceIncomplete',
  'PublishedHeadEvidenceMismatch',
  'PublishedHeadVerificationFailed',
  'PublicationMismatch',
  'SourceBranchMismatch',
  'BaseBranchMismatch',
  'HeadOidMismatch',
  'BaseOidMismatch',
  'MergeMethodMismatch',
  'IntegrationOrderViolation',
  'IntegrationEvidenceIncomplete',
  'ExpectedTreeMismatch',
  'ProtectedPathChange',
  'RequiredCheckMissing',
  'RequiredCheckNotSuccessful',
  'RequiredCheckPublisherMismatch',
  'IntentNotDurable',
  'IntentReceiptInvalid',
  'MergeConflict',
  'GitHubRejected',
  'OutcomeUnknown',
  'ResultUnverifiable',
  'RetryExhausted',
  'UnsupportedOperation',
] as const;

/**
 * Roles the remediation request may name. The executor never creates or assigns a
 * task; only the Orchestrator turns a published request into one.
 */
export type RemediationRole =
  | 'devops'
  | 'runtime'
  | 'security'
  | 'reviewer'
  | 'qa'
  | 'performance'
  | 'docs'
  | 'backend'
  | 'frontend'
  | 'database';

export interface RemediationRequest {
  readonly schema: 'merge-remediation-request/v1';
  readonly executor: ExecutorKind;
  readonly condition: RemediationCondition;
  readonly responsibleRole: RemediationRole;
  readonly refusalCode: MergeRefusalCode;
  readonly immutableSubjects: readonly ImmutableArtifactRef[];
  /** Always false. The executor has no task-creation capability. */
  readonly createsTask: false;
  /** Always null. A remediation request never proposes a verdict. */
  readonly proposedVerdict: null;
  /** Always false. A remediation request never changes authority. */
  readonly changesAuthority: false;
}

export type RemediationCondition =
  | 'release_conflict_or_control_defect'
  | 'gate_evidence_missing_or_failed'
  | 'open_or_unverifiable_security_evidence'
  | 'integration_evidence_gap_or_runtime_defect'
  | 'release_manifest_defect';

export interface MergeEvidenceRef {
  readonly store: 'merge-evidence/v1';
  readonly key: string;
  readonly digest: Sha256Hex;
}

export interface MergeRefusal {
  readonly code: MergeRefusalCode;
  readonly executor: ExecutorKind;
  readonly idempotencyKey: Sha256Hex | null;
  readonly immutableSubjects: readonly ImmutableArtifactRef[];
  readonly evidenceRecord: MergeEvidenceRef;
  readonly remediation: RemediationRequest | null;
}

export type MergeAdmissionResult<P> =
  | { readonly status: 'admitted'; readonly plan: P }
  | { readonly status: 'refused'; readonly refusal: MergeRefusal }
  | {
      readonly status: 'human_exception_required';
      readonly exception: HumanExceptionRecord;
    };

/* ------------------------------------------------------------------------- *
 * Release merge plan
 * ------------------------------------------------------------------------- */

export interface ReleaseMergePlan {
  readonly schema: 'merge-plan/v1';
  readonly executor: ExecutorKind;
  readonly repositoryId: string;
  readonly pullRequestNumber: number;
  readonly sourceBranch: typeof RELEASE_SOURCE_BRANCH;
  readonly headOid: GitOid;
  readonly baseBranch: typeof RELEASE_BASE_BRANCH;
  readonly baseOid: GitOid;
  readonly mergeMethod: typeof RELEASE_MERGE_METHOD;
  readonly expectedTreeOid: GitOid;
  readonly orderKey: string;
  readonly gateSnapshotDigest: Sha256Hex;
  readonly securitySnapshotDigest: Sha256Hex;
  readonly publishedHeadEvidenceDigest: Sha256Hex;
  readonly requiredPolicyProfileDigest: Sha256Hex;
  readonly policyDigest: Sha256Hex;
  readonly effectivePolicyProfileDigest: Sha256Hex;
  readonly preIntentPolicyAttestationDigest: Sha256Hex;
  readonly policyGeneration: number;
  readonly policyAdmissionContextNonce: Sha256Hex;
  readonly policyAdmissionContextDigest: Sha256Hex;
  readonly idempotencyKey: Sha256Hex;
}

export type ReleaseAdmissionResult = MergeAdmissionResult<ReleaseMergePlan>;

/* ------------------------------------------------------------------------- *
 * Immutable GitHub observations
 * ------------------------------------------------------------------------- */

export interface ImmutablePullRequestObservation {
  readonly repositoryId: string;
  readonly pullRequestNumber: number;
  readonly headBranch: string;
  readonly headOid: GitOid;
  readonly headTreeOid: GitOid;
  readonly baseBranch: string;
  readonly baseOid: GitOid;
  readonly state: 'open' | 'closed';
  readonly merged: boolean;
  readonly mergedCommitOid: GitOid | null;
  readonly mergeableState: 'clean' | 'blocked' | 'dirty' | 'unknown';
  readonly baseIsAncestorOfHead: boolean;
}

export interface ImmutableRefObservation {
  readonly ref: typeof RELEASE_BASE_REF;
  readonly oid: GitOid;
}

export interface ObservedCheckRun {
  readonly name: string;
  readonly appId: number;
  readonly status: 'queued' | 'in_progress' | 'completed';
  readonly conclusion: string | null;
}

export interface ReleaseRequiredCheckObservation {
  readonly targetCommit: GitOid;
  readonly requiredContexts: readonly {
    readonly name: string;
    readonly expectedAppId: number;
  }[];
  readonly observed: readonly ObservedCheckRun[];
}

export interface ReleaseRepositoryIdentity {
  readonly repositoryId: string;
  readonly owner: string;
  readonly name: string;
  readonly databaseId: number;
  readonly nodeId: string;
}

/* ------------------------------------------------------------------------- *
 * Admission input
 * ------------------------------------------------------------------------- */

export interface ReleaseAdmissionInput {
  readonly executor: ExecutorKind;
  /** Trusted time supplied by the caller so `admit` stays pure. */
  readonly evaluatedAtUtc: IsoTimestamp;
  readonly activation: MergeExecutorActivationRecord | null;
  readonly manifest: ReleaseGateManifest | null;
  readonly manifestSource: ImmutableProvenancedArtifactRef | null;
  readonly repository: ReleaseRepositoryIdentity;
  readonly pullRequest: ImmutablePullRequestObservation;
  readonly base: ImmutableRefObservation;
  readonly gateSnapshot: ImmutableAggregateGateSnapshot;
  readonly gateSnapshotSource: ImmutableProvenancedArtifactRef | null;
  readonly securitySnapshot: ImmutableReleaseSecuritySnapshot;
  readonly securitySnapshotSource: ImmutableProvenancedArtifactRef | null;
  readonly integrationEvidence: readonly IntegrationUnitEvidence[];
  readonly integrationEvidenceSource: ImmutableProvenancedArtifactRef | null;
  /** The activation-pinned required-policy profile document, not a caller selection. */
  readonly requiredPolicyProfile: RequiredGitHubPolicyProfile | null;
  readonly requiredPolicyProfileSource: ImmutableProvenancedArtifactRef | null;
  readonly requiredChecks: ReleaseRequiredCheckObservation;
  readonly changedPaths: readonly string[];
  readonly publishedHeadEvidence: PublishedHeadEvidenceBundle | null;
  readonly policyControlFacts: PolicyControlFacts;
  readonly orderKey: string;
  readonly admissionContextNonce: Sha256Hex;
}

/**
 * The complete authoritative set of mutable and control-plane admission inputs, read
 * fresh from the observation boundary immediately before any intent or mutation. Every
 * member is re-read; none is carried over from an earlier caller-supplied object.
 */
export interface ReleaseAdmissionFacts {
  readonly activation: MergeExecutorActivationRecord | null;
  readonly manifest: ReleaseGateManifest | null;
  readonly manifestSource: ImmutableProvenancedArtifactRef | null;
  readonly repository: ReleaseRepositoryIdentity;
  readonly pullRequest: ImmutablePullRequestObservation;
  readonly base: ImmutableRefObservation;
  readonly gateSnapshot: ImmutableAggregateGateSnapshot;
  readonly gateSnapshotSource: ImmutableProvenancedArtifactRef | null;
  readonly securitySnapshot: ImmutableReleaseSecuritySnapshot;
  readonly securitySnapshotSource: ImmutableProvenancedArtifactRef | null;
  readonly integrationEvidence: readonly IntegrationUnitEvidence[];
  readonly integrationEvidenceSource: ImmutableProvenancedArtifactRef | null;
  readonly requiredPolicyProfile: RequiredGitHubPolicyProfile | null;
  readonly requiredPolicyProfileSource: ImmutableProvenancedArtifactRef | null;
  readonly requiredChecks: ReleaseRequiredCheckObservation;
  readonly changedPaths: readonly string[];
  readonly publishedHeadEvidence: PublishedHeadEvidenceBundle | null;
}

/* ------------------------------------------------------------------------- *
 * Durable evidence store and the single merge port
 * ------------------------------------------------------------------------- */

export interface DurableMergeIntentReceipt {
  readonly store: 'merge-evidence/v1';
  readonly key: string;
  readonly planDigest: Sha256Hex;
  readonly issuedAtUtc: IsoTimestamp;
  readonly token: string;
}

export type DurableMergeIntentResult =
  | { readonly status: 'recorded'; readonly receipt: DurableMergeIntentReceipt }
  | { readonly status: 'already_recorded'; readonly receipt: DurableMergeIntentReceipt }
  | { readonly status: 'conflict'; readonly recordedPlanDigest: Sha256Hex }
  | { readonly status: 'unavailable'; readonly reason: string };

export interface DurablePolicyAuthorizationReceipt {
  readonly store: 'merge-evidence/v1';
  readonly key: string;
  readonly attestationDigest: Sha256Hex;
  readonly issuedAtUtc: IsoTimestamp;
  readonly token: string;
}

export type MergeOutcomeStatus =
  | 'merged'
  | 'recovered_merged'
  | 'refused'
  | 'human_exception_required'
  | 'outcome_unknown'
  | 'result_unverifiable';

export interface DurableAttemptReceipt {
  readonly store: 'merge-evidence/v1';
  readonly key: string;
  readonly attempt: number;
  readonly issuedAtUtc: IsoTimestamp;
  readonly token: string;
}

export interface DurableRetrySequenceReceipt {
  readonly store: 'merge-evidence/v1';
  readonly key: Sha256Hex;
  readonly planDigest: Sha256Hex;
  readonly startedAtUtc: IsoTimestamp;
  readonly deadlineUtc: IsoTimestamp;
  readonly token: string;
}

export interface MergeOutcomeRecord {
  readonly schema: 'merge-outcome/v1';
  readonly executor: ExecutorKind;
  readonly idempotencyKey: Sha256Hex;
  /** Canonical digest of the plan this outcome belongs to. */
  readonly planDigest: Sha256Hex;
  readonly status: MergeOutcomeStatus;
  readonly mergedCommitOid: GitOid | null;
  readonly resultTreeOid: GitOid | null;
  readonly refusalCode: MergeRefusalCode | null;
  /** Set only for a `human_exception_required` outcome; null means unclassifiable. */
  readonly humanExceptionKind: HumanExceptionKind | null;
  readonly remediation: RemediationRequest | null;
  readonly recordedAtUtc: IsoTimestamp;
}

/**
 * Store-issued authenticity material over the returned history. A history the store did
 * not itself append cannot carry a valid token, so a directly inserted terminal record
 * is not replayable as a successful release result.
 */
export interface DurableHistoryAuthenticity {
  readonly historyDigest: Sha256Hex;
  readonly token: string;
}

export interface MergeEvidenceHistory {
  readonly idempotencyKey: Sha256Hex;
  readonly intent: { readonly planDigest: Sha256Hex } | null;
  readonly terminalOutcome: MergeOutcomeRecord | null;
  readonly attempts: number;
  readonly retrySequence: Omit<DurableRetrySequenceReceipt, 'token' | 'store'> | null;
  readonly authenticity: DurableHistoryAuthenticity;
}

export interface MergeEvidenceStore {
  recordIntent(plan: ReleaseMergePlan): Promise<DurableMergeIntentResult>;
  verifyIntent(receipt: unknown, plan: ReleaseMergePlan): Promise<boolean>;
  recordRetrySequence(
    idempotencyKey: Sha256Hex,
    planDigest: Sha256Hex,
    startedAtUtc: IsoTimestamp,
    deadlineUtc: IsoTimestamp,
  ): Promise<DurableRetrySequenceReceipt | null>;
  verifyRetrySequence(receipt: unknown): Promise<boolean>;
  recordAttempt(
    idempotencyKey: Sha256Hex,
    attempt: number,
  ): Promise<DurableAttemptReceipt>;
  recordPolicyAuthorization(
    idempotencyKey: Sha256Hex,
    attestation: TrustedCurrentPolicyAttestation,
  ): Promise<DurablePolicyAuthorizationReceipt>;
  verifyPolicyAuthorization(
    receipt: unknown,
    attestation: TrustedCurrentPolicyAttestation,
  ): Promise<boolean>;
  recordOutcome(record: MergeOutcomeRecord): Promise<MergeEvidenceRef>;
  read(idempotencyKey: Sha256Hex): Promise<MergeEvidenceHistory>;
  verifyHistory(history: unknown): Promise<boolean>;
}

/**
 * The one and only external mutation this module can express.
 *
 * There is no generic HTTP method, no ref update, no push, no force, no administrator
 * override, no required-check mutation, no branch-protection or ruleset mutation, no
 * gate mutation, no task-ownership mutation, and no lock-release operation. The base
 * branch and merge method are literal types, so no caller can retarget the port.
 */
export interface ReleaseMergeRequest {
  readonly pullRequestNumber: number;
  readonly expectedHeadOid: GitOid;
  readonly baseBranch: typeof RELEASE_BASE_BRANCH;
  readonly mergeMethod: typeof RELEASE_MERGE_METHOD;
  readonly idempotencyKey: Sha256Hex;
}

export type ReleaseMergePortResult =
  | {
      readonly outcome: 'merged';
      readonly mergedCommitOid: GitOid;
      readonly resultTreeOid: GitOid;
    }
  | { readonly outcome: 'conflict' }
  | { readonly outcome: 'rejected'; readonly statusCode: number }
  | {
      readonly outcome: 'transient_failure';
      readonly reason: 'transport' | 'rate_limit' | 'server_error';
      readonly retryAfterSeconds: number | null;
    }
  | { readonly outcome: 'ambiguous'; readonly reason: string }
  | { readonly outcome: 'unsupported' };

export interface ReleasePullRequestMergePort {
  mergeIntegrationPullRequestIntoMain(
    request: ReleaseMergeRequest,
  ): Promise<ReleaseMergePortResult>;
}

/**
 * Read-only observation of immutable pull-request, check, head, and base state.
 * This port carries no policy-observation operation; complete policy observation
 * belongs to the separate human-controlled `RepositoryPolicyAttestor`.
 */
export interface ReleaseObservationPort {
  readPullRequest(
    pullRequestNumber: number,
  ): Promise<ImmutablePullRequestObservation>;
  readBaseRef(): Promise<ImmutableRefObservation>;
  readRequiredChecks(
    targetCommit: GitOid,
  ): Promise<ReleaseRequiredCheckObservation>;
  readMergedCommitTree(mergedCommitOid: GitOid): Promise<GitOid | null>;
  readReleaseAdmissionFacts(
    pullRequestNumber: number,
  ): Promise<ReleaseAdmissionFacts>;
  readBaseContainment(
    mergedCommitOid: GitOid,
  ): Promise<ReleaseBaseContainment>;
}

/**
 * Reachability and containment of a merged commit with respect to the protected base,
 * plus its parent order. An ordinary release merge commit has the protected base as its
 * first parent and the release head as its second.
 */
export interface ReleaseBaseContainment {
  readonly ref: typeof RELEASE_BASE_REF;
  readonly baseOid: GitOid;
  readonly containsMergedCommit: boolean;
  readonly mergedCommitParents: readonly GitOid[];
}

export interface ReleaseExecutorLease {
  readonly repositoryId: string;
  readonly baseBranch: typeof RELEASE_BASE_BRANCH;
  readonly leaseId: string;
}

export interface ReleaseExecutorLeaseManager {
  acquire(
    repositoryId: string,
  ): Promise<
    | { readonly status: 'granted'; readonly lease: ReleaseExecutorLease }
    | { readonly status: 'unavailable'; readonly reason: string }
  >;
  release(lease: ReleaseExecutorLease): Promise<void>;
}

/** Injected clock. No module member reads wall-clock time directly. */
export interface Clock {
  nowIso(): IsoTimestamp;
  monotonicMs(): number;
}

/* ------------------------------------------------------------------------- *
 * Execution
 * ------------------------------------------------------------------------- */

/**
 * The exact subject the executor asks the human-controlled attestor to sign immediately
 * before one mutation attempt. The channel carries no policy-observation and no
 * policy-mutation operation: the executor supplies a closed subject and receives signed
 * facts, exactly as the approved two-authorization order requires.
 */
export interface PreMutationAuthorizationRequest {
  readonly executor: ExecutorKind;
  readonly repositoryId: string;
  readonly pullRequestNumber: number;
  readonly headOid: GitOid;
  readonly baseOid: GitOid;
  readonly admissionContextNonce: Sha256Hex;
  readonly admissionContextDigest: Sha256Hex;
  readonly requiredPolicyProfileDigest: Sha256Hex;
  readonly policyGeneration: number;
  readonly attempt: number;
}

export interface ReleaseAttestationRequestChannel {
  requestPreMutationAuthorization(
    request: PreMutationAuthorizationRequest,
  ): Promise<PolicyControlFacts>;
}

export interface ReleaseExecutionDependencies {
  readonly clock: Clock;
  /**
   * Injected delay used by the bounded retry policy. No module member creates an
   * ambient timer, so execution stays deterministic under a fake clock.
   */
  readonly sleep: (milliseconds: number) => Promise<void>;
  readonly store: MergeEvidenceStore;
  readonly observation: ReleaseObservationPort;
  readonly mergePort: ReleasePullRequestMergePort;
  /** Identity of the concrete broker and port; bound to the activation attestation. */
  readonly mergePortIdentity: ImmutableMergePortIdentity;
  readonly authority: ReleaseAuthorityPort;
  readonly attestor: ReleaseAttestationRequestChannel;
  readonly leases: ReleaseExecutorLeaseManager;
}

export interface ReleaseExecutionInput {
  readonly plan: ReleaseMergePlan;
  /**
   * A previously issued durable intent receipt, supplied only when resuming. When
   * present it must verify against the store; a missing, forged, wrong-key, or
   * mismatched receipt returns `IntentReceiptInvalid` before any network mutation.
   * On a first run the receipt is the one `recordIntent` issues inside `execute`.
   */
  readonly receipt?: unknown;
  /**
   * The plan-bound `pre_intent` authorization the attestor signed at admission. It is
   * immutable evidence, not a mutable input: `ReleaseMergePlan` pins its canonical
   * digest, and the executor re-verifies its Ed25519 signature, exact subject, and
   * freshness during revalidation. The `pre_mutation` authorization is obtained
   * separately, once per mutation attempt, through the attestor channel.
   */
  readonly preIntentPolicyFacts: PolicyControlFacts;
}

export type ReleaseExecutionResult =
  | {
      readonly status: 'merged';
      readonly mergedCommitOid: GitOid;
      readonly resultTreeOid: GitOid;
      readonly evidence: MergeEvidenceRef;
      readonly adopted: boolean;
    }
  | { readonly status: 'refused'; readonly refusal: MergeRefusal }
  | {
      readonly status: 'human_exception_required';
      readonly exception: HumanExceptionRecord;
    };
