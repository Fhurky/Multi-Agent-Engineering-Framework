/**
 * Deterministic fixture builders for the release merge executor tests.
 *
 * Every identifier here is derived from a fixed label, so no fixture depends on wall
 * clock time, randomness, the filesystem, the network, or repository state.
 *
 * NO SECRET MATERIAL. The `signature` field is a clearly non-secret deterministic
 * placeholder string and no key, token, or credential is present anywhere in this
 * file. The module never verifies a raw signature itself: complete policy observation
 * and signing belong to the separate human-controlled `RepositoryPolicyAttestor`.
 */

import { computeAdmissionContext } from '../../admission.ts';
import { sha256Canonical, sha256Utf8, selfDigest } from '../../canonical-json.ts';
import {
  RELEASE_BASE_BRANCH,
  RELEASE_BASE_REF,
  RELEASE_EXECUTOR,
  RELEASE_GATE_DOMAINS,
  RELEASE_MERGE_METHOD,
  RELEASE_SOURCE_BRANCH,
  GOVERNANCE_DECISION_COMMIT,
} from '../../contracts.ts';
import type {
  AcceptedBlockingSecurityRiskRecord,
  AggregateGateRelation,
  AuthorPrePublicationEvidence,
  CompletePublishedHeadEvidenceBundle,
  ControlPostPublicationEvidence,
  ExecutorAppIdentity,
  GitOid,
  ImmutableAggregateGateSnapshot,
  ImmutableArtifactRef,
  ImmutablePullRequestObservation,
  ImmutableRefObservation,
  ImmutableReleaseSecuritySnapshot,
  IntegrationUnitEvidence,
  MergeExecutorActivationRecord,
  PolicyControlFacts,
  PublishedHeadCommandEvidence,
  ReleaseAdmissionInput,
  ReleaseGateManifest,
  ReleaseGateRequirement,
  ReleaseRepositoryIdentity,
  ReleaseRequiredCheckObservation,
  ReleaseSecurityFinding,
  Sha256Hex,
  TrustedCurrentPolicyAttestation,
} from '../../contracts.ts';
import { expectedAcceptanceScopeDigest } from '../../gate-admissibility.ts';
import { attestationPayloadDigest } from '../../policy-control.ts';
import { integrationEvidenceSetDigest } from '../../release-lineage.ts';

/** Deterministic full 40-hex object id derived from a label. */
export function oid(label: string): GitOid {
  return sha256Utf8(`oid:${label}`).slice(0, 40);
}

/** Deterministic 64-hex digest derived from a label. */
export function digest(label: string): Sha256Hex {
  return sha256Utf8(`digest:${label}`);
}

export const BASE_TIME_MS = Date.parse('2026-08-08T00:00:00.000Z');

export function isoAt(offsetMs: number): string {
  return new Date(BASE_TIME_MS + offsetMs).toISOString();
}

export const HEAD_OID = oid('integration-head');
export const HEAD_TREE_OID = oid('integration-head-tree');
export const BASE_OID = oid('main-base');
export const BASE_TREE_OID = oid('lineage-base-tree');
export const INTERMEDIATE_TREE_OID = oid('intermediate-tree');
export const PULL_REQUEST_NUMBER = 99;
export const REPOSITORY_ID = 'Fhurky/Multi-Agent-Engineering-Framework';
export const REQUIRED_CHECK_APP_ID = 15368;

export const REPOSITORY: ReleaseRepositoryIdentity = Object.freeze({
  repositoryId: REPOSITORY_ID,
  owner: 'Fhurky',
  name: 'Multi-Agent-Engineering-Framework',
  databaseId: 100200300,
  nodeId: 'R_kgDOFIXTURE',
});

export const REQUIRED_POLICY_PROFILE_DIGEST = digest('required-policy-profile');

export function artifactRef(label: string): ImmutableArtifactRef {
  return {
    kind: label,
    commit: oid(`artifact-${label}`),
    path: `docs/fixtures/${label}.md`,
    digest: digest(`artifact-${label}`),
  };
}

/* ------------------------------------------------------------------------- *
 * Activation record
 * ------------------------------------------------------------------------- */

export function validActivationRecord(): MergeExecutorActivationRecord {
  return {
    executor: RELEASE_EXECUTOR,
    governanceDecisionCommit: GOVERNANCE_DECISION_COMMIT,
    architectureReview: {
      lineage: 'LIN-INTEGRATION-AUTHORITY-REVIEW',
      lineageRound: 3,
      gate: 'review',
      verdictCommit: oid('architecture-review-verdict'),
      verdictState: 'passing',
      producedByExecutor: false,
    },
    implementationReview: {
      lineage: 'LIN-RELEASE-EXECUTOR-REVIEW',
      lineageRound: 1,
      gate: 'review',
      verdictCommit: oid('implementation-review-verdict'),
      verdictState: 'passing',
      producedByExecutor: false,
    },
    implementationSecurityReview: {
      lineage: 'LIN-RELEASE-EXECUTOR-SECURITY',
      lineageRound: 1,
      gate: 'security',
      verdictCommit: oid('implementation-security-verdict'),
      verdictState: 'passing',
      producedByExecutor: false,
    },
    negativeCapabilityTestAttestation: artifactRef('negative-capability'),
    gateVocabularyCorrection: artifactRef('gate-vocabulary-correction'),
    requiredGitHubPolicyProfile: artifactRef('required-policy-profile'),
    requiredGitHubPolicyProfileDigest: REQUIRED_POLICY_PROFILE_DIGEST,
    policyAttestorTrustRoot: {
      authorityId: 'repository-policy-attestor',
      keyId: 'key-1',
      publicKeyDigest: digest('attestor-public-key'),
      acceptedSchema: 'github-current-policy-attestation/v1',
      revocationChannelId: 'revocation-channel-1',
      pinnedCommit: oid('attestor-trust-root'),
    },
  };
}

/* ------------------------------------------------------------------------- *
 * Gate snapshot
 * ------------------------------------------------------------------------- */

export function passingRelation(
  domain: (typeof RELEASE_GATE_DOMAINS)[number],
  round: number,
): AggregateGateRelation {
  return {
    lineage: `LIN-RELEASE-${domain.toUpperCase()}`,
    lineageRound: round,
    gate: domain,
    gateClass: 'aggregate',
    ownerForm: false,
    verdictState: 'passing',
    verdictCommit: oid(`verdict-${domain}-${round}`),
    relationSetComplete: true,
    acceptedRisks: [],
  };
}

/** Two contiguous rounds per domain; round 2 is authoritative. */
export function validGateSnapshot(): ImmutableAggregateGateSnapshot {
  const relations: AggregateGateRelation[] = [];
  for (const domain of RELEASE_GATE_DOMAINS) {
    relations.push(passingRelation(domain, 1));
    relations.push(passingRelation(domain, 2));
  }
  return {
    snapshotDigest: digest('gate-snapshot'),
    relations,
  };
}

export function validRequirements(): ReleaseGateRequirement[] {
  return RELEASE_GATE_DOMAINS.map((domain) => ({
    domain,
    lineage: `LIN-RELEASE-${domain.toUpperCase()}`,
    minimumRound: 1,
    gateClass: 'aggregate' as const,
  }));
}

/* ------------------------------------------------------------------------- *
 * Security snapshot
 * ------------------------------------------------------------------------- */

export function emptySecuritySnapshot(): ImmutableReleaseSecuritySnapshot {
  return { snapshotDigest: digest('security-snapshot'), findings: [] };
}

export function blockingFinding(
  overrides: Partial<ReleaseSecurityFinding> = {},
): ReleaseSecurityFinding {
  return {
    findingId: 'F-REL-001',
    severity: 'critical',
    resolved: false,
    appliesToRelease: true,
    targetCommit: HEAD_OID,
    evidenceDigest: digest('finding-evidence'),
    securityLineage: 'LIN-RELEASE-SECURITY',
    securityLineageRound: 2,
    securityVerdictCommit: oid('verdict-security-2'),
    ...overrides,
  };
}

export function acceptanceFor(
  finding: ReleaseSecurityFinding,
  overrides: Partial<AcceptedBlockingSecurityRiskRecord> = {},
): AcceptedBlockingSecurityRiskRecord {
  const base: AcceptedBlockingSecurityRiskRecord = {
    schema: 'accepted-blocking-security-risk/v1',
    recordCommit: oid(`acceptance-record-${finding.findingId}`),
    acceptanceDecisionCommit: oid(`acceptance-decision-${finding.findingId}`),
    acceptedBy: {
      principalId: 'repository-owner',
      principalType: 'human',
      authorizationCommit: oid('human-authorization'),
    },
    targetCommit: finding.targetCommit,
    securityLineage: finding.securityLineage,
    securityLineageRound: finding.securityLineageRound,
    securityVerdictCommit: finding.securityVerdictCommit,
    findingId: finding.findingId,
    findingSeverity: finding.severity === 'high' ? 'high' : 'critical',
    findingEvidenceDigest: finding.evidenceDigest,
    acceptanceScopeDigest: expectedAcceptanceScopeDigest(finding),
    acceptedAt: isoAt(-3_600_000),
  };
  return { ...base, ...overrides };
}

/* ------------------------------------------------------------------------- *
 * Integration lineage evidence
 * ------------------------------------------------------------------------- */

export function validIntegrationEvidence(): IntegrationUnitEvidence[] {
  return [
    {
      unitKind: 'cumulative-lineage',
      unitId: 'LIN-ARCH-REVIEW',
      orderKey: '0001',
      proof: 'content-merged',
      producer: 'legacy_operator',
      sourceOid: oid('unit-arch-source'),
      mergeMethod: 'squash',
      gateSnapshotDigest: digest('unit-arch-gates'),
      previousResultTreeOid: BASE_TREE_OID,
      resultTreeOid: INTERMEDIATE_TREE_OID,
      subsumedBy: null,
      verified: true,
    },
    {
      unitKind: 'ordinary-task',
      unitId: 'TASK-018',
      orderKey: '0002',
      proof: 'content-merged',
      producer: 'runtime_executor',
      sourceOid: oid('unit-018-source'),
      mergeMethod: 'squash',
      gateSnapshotDigest: digest('unit-018-gates'),
      previousResultTreeOid: INTERMEDIATE_TREE_OID,
      resultTreeOid: HEAD_TREE_OID,
      subsumedBy: null,
      verified: true,
    },
    {
      unitKind: 'cumulative-lineage',
      unitId: 'TASK-036',
      orderKey: '0003',
      proof: 'lineage-subsumed',
      producer: 'legacy_operator',
      sourceOid: oid('unit-036-source'),
      mergeMethod: 'squash',
      gateSnapshotDigest: digest('unit-036-gates'),
      previousResultTreeOid: null,
      resultTreeOid: INTERMEDIATE_TREE_OID,
      subsumedBy: 'LIN-ARCH-REVIEW',
      verified: true,
    },
  ];
}

/* ------------------------------------------------------------------------- *
 * Published-head evidence
 * ------------------------------------------------------------------------- */

const DECLARED_CHECK_IDS: readonly string[] = Object.freeze([
  'validate-write-scope',
  'validate-framework',
]);

const RESOLVED_BASES: Readonly<Record<string, GitOid>> = Object.freeze({
  'integration/autonomous-runtime': BASE_OID,
});

function command(
  phase: 'author_pre_publication' | 'control_post_publication',
  checkId: string,
  targetCommit: GitOid,
  branch: string,
  overrides: Partial<PublishedHeadCommandEvidence> = {},
): PublishedHeadCommandEvidence {
  const withoutId = {
    schema: 'published-head-command-evidence/v2' as const,
    phase,
    producer: { role: 'devops', executionSessionId: `session-${phase}` },
    targetCommit,
    branch,
    workingDirectory: 'C:/fixtures/worktree',
    startedAtUtc: isoAt(1_000),
    endedAtUtc: isoAt(2_000),
    executable: 'powershell',
    arguments: ['-NoProfile', '-File', `./scripts/ci/${checkId}.ps1`],
    renderedCommand: `powershell -NoProfile -File ./scripts/ci/${checkId}.ps1`,
    materialArguments: { checkId },
    resolvedBases: RESOLVED_BASES,
    headBefore: targetCommit,
    headAfter: targetCommit,
    expectedExitCode: 0,
    exitCode: 0,
    actualResult: {
      summary: `${checkId} passed`,
      outputDigest: digest(`output-${phase}-${checkId}`),
      derivation: null,
    },
    ...overrides,
  };
  const evidenceId = selfDigest(
    { ...withoutId, evidenceId: '' },
    'evidenceId',
  );
  return { ...withoutId, evidenceId };
}

export function validAuthorPhase(
  targetCommit: GitOid = HEAD_OID,
  branch: string = RELEASE_SOURCE_BRANCH,
): AuthorPrePublicationEvidence {
  const commands = DECLARED_CHECK_IDS.map((checkId) =>
    command('author_pre_publication', checkId, targetCommit, branch),
  );
  const withoutDigest = {
    phase: 'author_pre_publication' as const,
    targetCommit,
    branch,
    authoredParents: [oid('authored-parent')],
    resolvedBases: RESOLVED_BASES,
    declaredCheckIds: DECLARED_CHECK_IDS,
    commands,
    completedAtUtc: isoAt(3_000),
    canonicalAuthorEvidenceDigest: '',
  };
  const canonicalAuthorEvidenceDigest = selfDigest(
    withoutDigest,
    'canonicalAuthorEvidenceDigest',
  );
  return { ...withoutDigest, canonicalAuthorEvidenceDigest };
}

export function validControlPhase(
  author: AuthorPrePublicationEvidence,
  targetCommit: GitOid = HEAD_OID,
  branch: string = RELEASE_SOURCE_BRANCH,
): ControlPostPublicationEvidence {
  const commands = DECLARED_CHECK_IDS.map((checkId) =>
    command('control_post_publication', checkId, targetCommit, branch),
  );
  return {
    phase: 'control_post_publication',
    targetCommit,
    branch,
    authorEvidenceDigest: author.canonicalAuthorEvidenceDigest,
    resolvedBases: RESOLVED_BASES,
    declaredCheckIds: DECLARED_CHECK_IDS,
    commands,
    noLaterContent: {
      targetCommit,
      branch,
      remoteRef: `refs/remotes/origin/${branch}`,
      pullRequestNumber: PULL_REQUEST_NUMBER,
      localBranchHeadOid: targetCommit,
      remoteBranchHeadOid: targetCommit,
      pullRequestHeadOid: targetCommit,
      commitsAfterTarget: { localBranch: 0, remoteBranch: 0, pullRequestHead: 0 },
      observedAtUtc: isoAt(4_000),
      proofCommandEvidenceIds: commands.map((entry) => entry.evidenceId),
    },
    exactHeadChecks: {
      targetCommit,
      queriedAtUtc: isoAt(4_500),
      state: 'present_successful',
      totalCount: 2,
      checks: [
        {
          name: 'CI / validate',
          appId: REQUIRED_CHECK_APP_ID,
          startedAtUtc: isoAt(500),
          completedAtUtc: isoAt(1_500),
          conclusion: 'success',
        },
        {
          name: 'Security / scan',
          appId: REQUIRED_CHECK_APP_ID,
          startedAtUtc: isoAt(500),
          completedAtUtc: isoAt(1_600),
          conclusion: 'success',
        },
      ],
    },
    completedAtUtc: isoAt(5_000),
  };
}

export function validPublishedHeadBundle(): CompletePublishedHeadEvidenceBundle {
  const author = validAuthorPhase();
  const control = validControlPhase(author);
  const withoutDigest = {
    schema: 'published-head-evidence/v2' as const,
    status: 'complete' as const,
    targetCommit: HEAD_OID,
    branch: RELEASE_SOURCE_BRANCH,
    author,
    control,
    canonicalBundleDigest: '',
  };
  const canonicalBundleDigest = selfDigest(withoutDigest, 'canonicalBundleDigest');
  return { ...withoutDigest, canonicalBundleDigest };
}

/* ------------------------------------------------------------------------- *
 * Required checks
 * ------------------------------------------------------------------------- */

export function validRequiredChecks(): ReleaseRequiredCheckObservation {
  return {
    targetCommit: HEAD_OID,
    requiredContexts: [
      { name: 'CI / validate', expectedAppId: REQUIRED_CHECK_APP_ID },
      { name: 'Security / scan', expectedAppId: REQUIRED_CHECK_APP_ID },
    ],
    observed: [
      {
        name: 'CI / validate',
        appId: REQUIRED_CHECK_APP_ID,
        status: 'completed',
        conclusion: 'success',
      },
      {
        name: 'Security / scan',
        appId: REQUIRED_CHECK_APP_ID,
        status: 'completed',
        conclusion: 'success',
      },
    ],
  };
}

/* ------------------------------------------------------------------------- *
 * Observations
 * ------------------------------------------------------------------------- */

export function validPullRequest(): ImmutablePullRequestObservation {
  return {
    repositoryId: REPOSITORY_ID,
    pullRequestNumber: PULL_REQUEST_NUMBER,
    headBranch: RELEASE_SOURCE_BRANCH,
    headOid: HEAD_OID,
    headTreeOid: HEAD_TREE_OID,
    baseBranch: RELEASE_BASE_BRANCH,
    baseOid: BASE_OID,
    state: 'open',
    merged: false,
    mergedCommitOid: null,
    mergeableState: 'clean',
    baseIsAncestorOfHead: true,
  };
}

export function validBaseRef(): ImmutableRefObservation {
  return { ref: RELEASE_BASE_REF, oid: BASE_OID };
}

/* ------------------------------------------------------------------------- *
 * Manifest
 * ------------------------------------------------------------------------- */

export function validManifest(
  overrides: Partial<ReleaseGateManifest> = {},
): ReleaseGateManifest {
  const bundle = validPublishedHeadBundle();
  return {
    schema: 'release-gates/v1',
    repositoryId: REPOSITORY_ID,
    sourceBranch: RELEASE_SOURCE_BRANCH,
    sourceOid: HEAD_OID,
    baseBranch: RELEASE_BASE_BRANCH,
    baseOid: BASE_OID,
    mergeMethod: RELEASE_MERGE_METHOD,
    requirements: validRequirements(),
    integrationEvidenceSetDigest: integrationEvidenceSetDigest(
      validIntegrationEvidence(),
    ),
    publishedHeadEvidenceDigest: bundle.canonicalBundleDigest,
    irreversibleProductionCoupling: { coupled: false },
    ...overrides,
  };
}

/* ------------------------------------------------------------------------- *
 * Policy attestation
 * ------------------------------------------------------------------------- */

const EXECUTOR_APPS: readonly ExecutorAppIdentity[] = Object.freeze([
  {
    appId: 111,
    installationId: 1111,
    nodeId: 'A_task_integration',
    slug: 'task-integration-executor',
    permissions: { contents: 'write', pull_requests: 'read', checks: 'read' },
  },
  {
    appId: 222,
    installationId: 2222,
    nodeId: 'A_release_main',
    slug: 'release-merge-executor',
    permissions: { contents: 'write', pull_requests: 'read', checks: 'read' },
  },
]);

const OBSERVER_PRINCIPAL_SET_DIGEST = digest('observer-principal-set');

export interface AttestationOptions {
  readonly phase?: 'pre_intent' | 'pre_mutation';
  readonly admissionContextNonce: Sha256Hex;
  readonly admissionContextDigest: Sha256Hex;
  readonly policyGeneration?: number;
  readonly observedAtOffsetMs?: number;
  readonly expiresAtOffsetMs?: number;
  readonly effectivePolicyProfileDigest?: Sha256Hex;
  readonly policyDigest?: Sha256Hex;
  readonly signatureLabel?: string;
  readonly headOid?: GitOid;
  readonly baseOid?: GitOid;
  readonly pullRequestNumber?: number;
}

/**
 * Builds a structurally complete attestation. `signature` is a clearly non-secret
 * deterministic placeholder; no key material exists in this repository.
 */
export function buildAttestation(
  options: AttestationOptions,
): TrustedCurrentPolicyAttestation {
  const observedAt = options.observedAtOffsetMs ?? 0;
  const expiresAt = options.expiresAtOffsetMs ?? 55_000;

  const withoutDigest = {
    schema: 'github-current-policy-attestation/v1' as const,
    issuer: {
      authorityId: 'repository-policy-attestor',
      keyId: 'key-1',
      publicKeyDigest: digest('attestor-public-key'),
      signatureAlgorithm: 'Ed25519' as const,
      policyGeneration: options.policyGeneration ?? 7,
      observerPrincipalSetDigest: OBSERVER_PRINCIPAL_SET_DIGEST,
    },
    subject: {
      githubHost: 'github.com' as const,
      repository: {
        databaseId: REPOSITORY.databaseId,
        nodeId: REPOSITORY.nodeId,
        owner: REPOSITORY.owner,
        name: REPOSITORY.name,
      },
      protectedRef: RELEASE_BASE_REF,
      executor: RELEASE_EXECUTOR,
      pullRequestNumber: options.pullRequestNumber ?? PULL_REQUEST_NUMBER,
      headOid: options.headOid ?? HEAD_OID,
      baseOid: options.baseOid ?? BASE_OID,
      admissionContextNonce: options.admissionContextNonce,
      admissionContextDigest: options.admissionContextDigest,
      authorizationPhase: options.phase ?? ('pre_intent' as const),
      executorApps: EXECUTOR_APPS,
    },
    policy: {
      bypassActorsComplete: true,
      bypassActors: [],
      paginationComplete: true,
      rulesetEnumerationComplete: true,
      classicProtectionComplete: true,
      requiredCheckSources: [
        { name: 'CI / validate', appId: REQUIRED_CHECK_APP_ID },
        { name: 'Security / scan', appId: REQUIRED_CHECK_APP_ID },
      ],
      mergeMethodsConfigured: ['merge', 'squash'],
      executorApps: EXECUTOR_APPS,
      observerPrincipalSetDigest: OBSERVER_PRINCIPAL_SET_DIGEST,
      executorAppsAbsentFromBypassSets: true,
      unknownPayloadMembers: [],
      effectiveControlEvaluationComplete: true,
    },
    observedAt: isoAt(observedAt),
    issuedAt: isoAt(observedAt + 1_000),
    notBefore: isoAt(observedAt),
    expiresAt: isoAt(observedAt + expiresAt),
    sourceEvidenceDigest: digest('policy-source-evidence'),
    policyDigest: options.policyDigest ?? digest('policy'),
    effectivePolicyProfileDigest:
      options.effectivePolicyProfileDigest ?? REQUIRED_POLICY_PROFILE_DIGEST,
    canonicalPayloadDigest: '',
    signature: `non-secret-fixture-signature:${options.signatureLabel ?? options.phase ?? 'pre_intent'}`,
  };

  // `canonicalPayloadDigest` covers every attestation field other than `signature`
  // and other than the digest property itself.
  const canonicalPayloadDigest = attestationPayloadDigest({
    ...withoutDigest,
    canonicalPayloadDigest: '',
  });
  return { ...withoutDigest, canonicalPayloadDigest };
}

/**
 * Recomputes `canonicalPayloadDigest` after a fixture mutates the payload, modelling an
 * attestor that honestly signs a payload which is itself incomplete or incorrect. It
 * lets a fixture reach the completeness, pagination, and unknown-member branches
 * instead of stopping at the digest branch.
 */
export function resignAttestation(
  attestation: TrustedCurrentPolicyAttestation,
): TrustedCurrentPolicyAttestation {
  return {
    ...attestation,
    canonicalPayloadDigest: attestationPayloadDigest({
      ...attestation,
      canonicalPayloadDigest: '',
    }),
  };
}

export function excludedControlAction(): PolicyControlFacts['action'] {
  return { status: 'excluded', evidence: artifactRef('control-action-excluded') };
}

/* ------------------------------------------------------------------------- *
 * Complete admission input
 * ------------------------------------------------------------------------- */

export interface ScenarioOverrides {
  readonly activation?: MergeExecutorActivationRecord | null;
  readonly manifest?: ReleaseGateManifest | null;
  readonly pullRequest?: ImmutablePullRequestObservation;
  readonly base?: ImmutableRefObservation;
  readonly gateSnapshot?: ImmutableAggregateGateSnapshot;
  readonly securitySnapshot?: ImmutableReleaseSecuritySnapshot;
  readonly integrationEvidence?: readonly IntegrationUnitEvidence[];
  readonly requiredChecks?: ReleaseRequiredCheckObservation;
  readonly changedPaths?: readonly string[];
  readonly publishedHeadEvidence?: ReleaseAdmissionInput['publishedHeadEvidence'];
  readonly policyControlFacts?: PolicyControlFacts;
  readonly evaluatedAtUtc?: string;
  readonly orderKey?: string;
}

export const ADMISSION_CONTEXT_NONCE = digest('admission-context-nonce');

/**
 * The success fixture: one release manifest covering all seven aggregate domains,
 * with every other admission input valid.
 */
export function validScenario(
  overrides: ScenarioOverrides = {},
): ReleaseAdmissionInput {
  const activation =
    overrides.activation === undefined ? validActivationRecord() : overrides.activation;
  const manifest =
    overrides.manifest === undefined ? validManifest() : overrides.manifest;

  const skeleton: ReleaseAdmissionInput = {
    executor: RELEASE_EXECUTOR,
    evaluatedAtUtc: overrides.evaluatedAtUtc ?? isoAt(5_000),
    activation,
    manifest,
    manifestSource: artifactRef('release-gate-manifest'),
    repository: REPOSITORY,
    pullRequest: overrides.pullRequest ?? validPullRequest(),
    base: overrides.base ?? validBaseRef(),
    gateSnapshot: overrides.gateSnapshot ?? validGateSnapshot(),
    securitySnapshot: overrides.securitySnapshot ?? emptySecuritySnapshot(),
    integrationEvidence:
      overrides.integrationEvidence ?? validIntegrationEvidence(),
    requiredChecks: overrides.requiredChecks ?? validRequiredChecks(),
    changedPaths: overrides.changedPaths ?? [
      'src/orchestrator/state/index.ts',
      'docs/architecture/runtime/COMPONENT-BOUNDARIES.md',
    ],
    publishedHeadEvidence:
      overrides.publishedHeadEvidence === undefined
        ? validPublishedHeadBundle()
        : overrides.publishedHeadEvidence,
    policyControlFacts: {
      action: excludedControlAction(),
      observation: { state: 'operationally_unavailable', reason: 'github_5xx' },
    },
    orderKey: overrides.orderKey ?? '0009',
    admissionContextNonce: ADMISSION_CONTEXT_NONCE,
  };

  if (overrides.policyControlFacts !== undefined) {
    return { ...skeleton, policyControlFacts: overrides.policyControlFacts };
  }

  const requiredPolicyProfileDigest =
    activation === null
      ? REQUIRED_POLICY_PROFILE_DIGEST
      : activation.requiredGitHubPolicyProfileDigest;
  const publishedHeadEvidenceDigest =
    manifest === null
      ? digest('absent-manifest')
      : manifest.publishedHeadEvidenceDigest;

  const context = computeAdmissionContext(
    skeleton,
    skeleton.pullRequest.headTreeOid,
    publishedHeadEvidenceDigest,
    requiredPolicyProfileDigest,
  );

  const attestation = buildAttestation({
    phase: 'pre_intent',
    admissionContextNonce: context.nonce,
    admissionContextDigest: context.digest,
    headOid: skeleton.pullRequest.headOid,
    baseOid: skeleton.base.oid,
    pullRequestNumber: skeleton.pullRequest.pullRequestNumber,
    effectivePolicyProfileDigest: requiredPolicyProfileDigest,
  });

  return {
    ...skeleton,
    policyControlFacts: {
      action: excludedControlAction(),
      observation: { state: 'current_valid', attestation },
    },
  };
}

/** The `pre_mutation` authorization for a scenario's admitted plan. */
export function preMutationFacts(
  plan: {
    readonly policyAdmissionContextNonce: Sha256Hex;
    readonly policyAdmissionContextDigest: Sha256Hex;
    readonly policyGeneration: number;
    readonly policyDigest: Sha256Hex;
    readonly requiredPolicyProfileDigest: Sha256Hex;
    readonly headOid: GitOid;
    readonly baseOid: GitOid;
    readonly pullRequestNumber: number;
  },
): PolicyControlFacts {
  return {
    action: excludedControlAction(),
    observation: {
      state: 'current_valid',
      attestation: buildAttestation({
        phase: 'pre_mutation',
        admissionContextNonce: plan.policyAdmissionContextNonce,
        admissionContextDigest: plan.policyAdmissionContextDigest,
        policyGeneration: plan.policyGeneration,
        policyDigest: plan.policyDigest,
        effectivePolicyProfileDigest: plan.requiredPolicyProfileDigest,
        headOid: plan.headOid,
        baseOid: plan.baseOid,
        pullRequestNumber: plan.pullRequestNumber,
        // A distinct canonical attestation digest, as the two independently signed
        // authorizations require.
        signatureLabel: 'pre-mutation',
      }),
    },
  };
}

/** Canonical digest helper for tests that assert digest stability. */
export function canonicalDigestOf(value: unknown): Sha256Hex {
  return sha256Canonical(value);
}
