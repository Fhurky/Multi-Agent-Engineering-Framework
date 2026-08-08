/**
 * Deterministic fixture builders for the release merge executor tests.
 *
 * Every identifier here is derived from a fixed label, so no fixture depends on wall
 * clock time, randomness, the filesystem, the network, or repository state.
 *
 * NO SECRET MATERIAL IS STORED. The fixtures now perform real Ed25519 signing, so a
 * signing key must exist while the tests run; it is DERIVED AT RUN TIME from a public,
 * non-secret label through SHA-256 and is never written to disk, committed, logged, or
 * shared. It authenticates nothing outside this offline suite: the real attestor's key
 * lives in the human-controlled policy plane, outside this repository and outside every
 * executor process.
 */

import { createPrivateKey, createPublicKey, sign } from 'node:crypto';

import {
  computeAdmissionContext,
  expectedIrreversibleAuthorizationScopeDigest,
} from '../../admission.ts';
import {
  canonicalBytes,
  selfDigest,
  sha256Bytes,
  sha256Canonical,
  sha256Utf8,
} from '../../canonical-json.ts';
import {
  RELEASE_BASE_BRANCH,
  RELEASE_BASE_REF,
  RELEASE_EXECUTOR,
  RELEASE_GATE_DOMAINS,
  RELEASE_MERGE_METHOD,
  RELEASE_REMOTE_REF,
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
  ImmutableHumanDecisionRef,
  ImmutableProvenancedArtifactRef,
  ImmutablePullRequestObservation,
  ImmutableRefObservation,
  ImmutableReleaseSecuritySnapshot,
  IntegrationUnitEvidence,
  MergeExecutorActivationRecord,
  PolicyControlFacts,
  PolicyObserverPrincipal,
  PublishedHeadCommandEvidence,
  ReleaseAdmissionInput,
  ReleaseGateManifest,
  ReleaseGateRequirement,
  ReleaseIntegrationInventoryEntry,
  ReleaseRepositoryIdentity,
  ReleaseRequiredCheckObservation,
  ReleaseSecurityFinding,
  RequiredGitHubPolicyProfile,
  Sha256Hex,
  TrustedCurrentPolicyAttestation,
} from '../../contracts.ts';
import {
  aggregateGateSnapshotDigest,
  expectedAcceptanceScopeDigest,
  releaseSecuritySnapshotDigest,
} from '../../gate-admissibility.ts';
import {
  attestationPayloadDigest,
  attestationSignedPayload,
  observerPrincipalSetDigest,
} from '../../policy-control.ts';
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

/* ------------------------------------------------------------------------- *
 * Deterministic Ed25519 fixture key material, derived at run time
 * ------------------------------------------------------------------------- */

/** RFC 8410 PKCS#8 prefix for an Ed25519 private key carrying a 32-byte seed. */
const PKCS8_ED25519_PREFIX = '302e020100300506032b657004220420';

function fixtureSeed(label: string): Buffer {
  return Buffer.from(sha256Utf8(`ed25519-seed:${label}`), 'hex');
}

function fixturePrivateKey(label: string) {
  const der = Buffer.concat([
    Buffer.from(PKCS8_ED25519_PREFIX, 'hex'),
    fixtureSeed(label),
  ]);
  return createPrivateKey({ key: der, format: 'der', type: 'pkcs8' });
}

const ATTESTOR_PRIVATE_KEY = fixturePrivateKey('repository-policy-attestor');
const ATTESTOR_PUBLIC_KEY_DER = createPublicKey(ATTESTOR_PRIVATE_KEY).export({
  format: 'der',
  type: 'spki',
}) as Buffer;

export const ATTESTOR_PUBLIC_KEY_SPKI_BASE64 =
  ATTESTOR_PUBLIC_KEY_DER.toString('base64');
export const ATTESTOR_PUBLIC_KEY_DIGEST = sha256Bytes(
  new Uint8Array(ATTESTOR_PUBLIC_KEY_DER),
);

/** A second, unrelated attestor identity used by the wrong-key fixtures. */
const WRONG_PRIVATE_KEY = fixturePrivateKey('an-unrelated-signer');

/** Signs the exact canonical payload with the pinned fixture key. */
export function signAttestationPayload(
  attestation: TrustedCurrentPolicyAttestation,
  key = ATTESTOR_PRIVATE_KEY,
): string {
  return sign(
    null,
    Buffer.from(canonicalBytes(attestationSignedPayload(attestation))),
    key,
  ).toString('base64');
}

/** Signs with a key the activation record does not pin. */
export function signWithWrongKey(
  attestation: TrustedCurrentPolicyAttestation,
): string {
  return signAttestationPayload(attestation, WRONG_PRIVATE_KEY);
}

/* ------------------------------------------------------------------------- *
 * Immutable artifact references
 * ------------------------------------------------------------------------- */

export function artifactRef(label: string): ImmutableArtifactRef {
  return {
    kind: label,
    commit: oid(`artifact-${label}`),
    path: `docs/fixtures/${label}.md`,
    digest: digest(`artifact-${label}`),
  };
}

/** A provenanced artifact reference with a named non-executor producer. */
export function provenancedRef(
  kind: string,
  label: string,
  digestValue: Sha256Hex = digest(`artifact-${label}`),
): ImmutableProvenancedArtifactRef {
  return {
    kind,
    commit: oid(`artifact-${label}`),
    path: `docs/fixtures/${label}.md`,
    digest: digestValue,
    producedByExecutor: false,
    producer: {
      principalId: `producer-${label}`,
      principalType: 'agent_role',
      authorizationCommit: oid(`producer-authorization-${label}`),
    },
  };
}

/* ------------------------------------------------------------------------- *
 * Executor App identities and the pinned required-policy profile
 * ------------------------------------------------------------------------- */

export const EXECUTOR_APPS: readonly ExecutorAppIdentity[] = Object.freeze([
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

export const OBSERVER_PRINCIPALS: readonly PolicyObserverPrincipal[] = Object.freeze([
  {
    principalId: 'policy-observer-administration',
    principalType: 'App',
    installationScope: 'repository',
    permissions: { administration: 'read', metadata: 'read' },
    credentialScopeDigest: digest('observer-administration-scope'),
  },
  {
    principalId: 'policy-observer-rulesets',
    principalType: 'App',
    installationScope: 'organization',
    permissions: { repository_rulesets: 'write', metadata: 'read' },
    credentialScopeDigest: digest('observer-ruleset-scope'),
  },
]);

export const OBSERVER_PRINCIPAL_SET_DIGEST =
  observerPrincipalSetDigest(OBSERVER_PRINCIPALS);

export const REQUIRED_CHECK_CONTEXTS: readonly {
  readonly name: string;
  readonly expectedAppId: number;
}[] = Object.freeze([
  { name: 'CI / validate', expectedAppId: REQUIRED_CHECK_APP_ID },
  { name: 'Security / scan', expectedAppId: REQUIRED_CHECK_APP_ID },
]);

export function validRequirements(): ReleaseGateRequirement[] {
  return RELEASE_GATE_DOMAINS.map((domain) => ({
    domain,
    lineage: `LIN-RELEASE-${domain.toUpperCase()}`,
    minimumRound: 1,
    gateClass: 'aggregate' as const,
  }));
}

export function validRequiredPolicyProfile(): RequiredGitHubPolicyProfile {
  return {
    schema: 'required-github-policy-profile/v1',
    repositoryId: REPOSITORY_ID,
    protectedRef: RELEASE_BASE_REF,
    requiredCheckContexts: REQUIRED_CHECK_CONTEXTS,
    releaseGateRequirements: validRequirements(),
    executorApps: EXECUTOR_APPS,
    observerPrincipalSetDigest: OBSERVER_PRINCIPAL_SET_DIGEST,
    mergeMethodsRequired: [RELEASE_MERGE_METHOD],
  };
}

export const REQUIRED_POLICY_PROFILE_DIGEST = sha256Canonical(
  validRequiredPolicyProfile(),
);

export const REQUIRED_POLICY_PROFILE_COMMIT = oid('required-policy-profile-artifact');
export const REQUIRED_POLICY_PROFILE_PATH =
  'docs/fixtures/required-github-policy-profile.json';

export function requiredPolicyProfileRef(): ImmutableProvenancedArtifactRef {
  return {
    kind: 'required-github-policy-profile',
    commit: REQUIRED_POLICY_PROFILE_COMMIT,
    path: REQUIRED_POLICY_PROFILE_PATH,
    digest: REQUIRED_POLICY_PROFILE_DIGEST,
    producedByExecutor: false,
    producer: {
      principalId: 'repository-owner',
      principalType: 'human',
      authorizationCommit: oid('human-authorization'),
    },
  };
}

export const MERGE_PORT_IDENTITY = Object.freeze({
  brokerId: 'release-merge-token-broker',
  portIdentityDigest: digest('release-merge-port-identity'),
});

/* ------------------------------------------------------------------------- *
 * Activation record
 * ------------------------------------------------------------------------- */

export function validActivationRecord(): MergeExecutorActivationRecord {
  const withoutSource = {
    executor: RELEASE_EXECUTOR,
    governanceDecisionCommit: GOVERNANCE_DECISION_COMMIT,
    issuer: {
      principalId: 'repository-owner',
      principalType: 'human' as const,
      authorizationCommit: oid('human-authorization'),
    },
    producedByExecutor: false,
    architectureReview: {
      member: 'architectureReview' as const,
      lineage: 'LIN-INTEGRATION-AUTHORITY-REVIEW',
      lineageRound: 3,
      gate: 'review' as const,
      targetCommit: oid('approved-architecture-source'),
      verdictCommit: oid('architecture-review-verdict'),
      verdictState: 'passing' as const,
      producedByExecutor: false,
      producer: {
        principalId: 'reviewer',
        principalType: 'agent_role' as const,
        authorizationCommit: oid('reviewer-authorization'),
      },
    },
    implementationReview: {
      member: 'implementationReview' as const,
      lineage: 'LIN-RELEASE-EXECUTOR-REVIEW',
      lineageRound: 2,
      gate: 'review' as const,
      targetCommit: oid('release-executor-implementation'),
      verdictCommit: oid('implementation-review-verdict'),
      verdictState: 'passing' as const,
      producedByExecutor: false,
      producer: {
        principalId: 'reviewer',
        principalType: 'agent_role' as const,
        authorizationCommit: oid('reviewer-authorization'),
      },
    },
    implementationSecurityReview: {
      member: 'implementationSecurityReview' as const,
      lineage: 'LIN-RELEASE-EXECUTOR-SECURITY',
      lineageRound: 2,
      gate: 'security' as const,
      targetCommit: oid('release-executor-implementation'),
      verdictCommit: oid('implementation-security-verdict'),
      verdictState: 'passing' as const,
      producedByExecutor: false,
      producer: {
        principalId: 'security',
        principalType: 'agent_role' as const,
        authorizationCommit: oid('security-authorization'),
      },
    },
    negativeCapabilityTestAttestation: {
      ...provenancedRef('negative-capability-test-attestation', 'negative-capability'),
      attestedMergePortIdentity: MERGE_PORT_IDENTITY,
    },
    gateVocabularyCorrection: provenancedRef(
      'gate-vocabulary-correction',
      'gate-vocabulary-correction',
    ),
    requiredGitHubPolicyProfile: requiredPolicyProfileRef(),
    requiredGitHubPolicyProfileDigest: REQUIRED_POLICY_PROFILE_DIGEST,
    policyAttestorTrustRoot: {
      authorityId: 'repository-policy-attestor',
      keyId: 'key-1',
      keyAlgorithm: 'Ed25519' as const,
      publicKeySpkiBase64: ATTESTOR_PUBLIC_KEY_SPKI_BASE64,
      publicKeyDigest: ATTESTOR_PUBLIC_KEY_DIGEST,
      acceptedSchema: 'github-current-policy-attestation/v1' as const,
      revocationChannelId: 'revocation-channel-1',
      pinnedCommit: oid('attestor-trust-root'),
    },
    recordSource: {
      kind: 'merge-executor-activation-record',
      commit: oid('activation-record-artifact'),
      path: 'docs/fixtures/merge-executor-activation-record.json',
      digest: '',
    },
  };

  const recordDigest = selfDigest(
    withoutSource as unknown as MergeExecutorActivationRecord,
    'recordSource',
  );

  return {
    ...withoutSource,
    recordSource: { ...withoutSource.recordSource, digest: recordDigest },
  } as unknown as MergeExecutorActivationRecord;
}

/** Recomputes `recordSource.digest` after a fixture mutates the activation record. */
export function reseal(
  record: MergeExecutorActivationRecord,
): MergeExecutorActivationRecord {
  return {
    ...record,
    recordSource: {
      ...record.recordSource,
      digest: selfDigest(record, 'recordSource'),
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

/** A snapshot whose digest is recomputed over its own canonical relation bytes. */
export function gateSnapshotOf(
  relations: readonly AggregateGateRelation[],
): ImmutableAggregateGateSnapshot {
  return {
    snapshotDigest: aggregateGateSnapshotDigest(relations),
    relations,
  };
}

/** Two contiguous rounds per domain; round 2 is authoritative. */
export function validGateSnapshot(): ImmutableAggregateGateSnapshot {
  const relations: AggregateGateRelation[] = [];
  for (const domain of RELEASE_GATE_DOMAINS) {
    relations.push(passingRelation(domain, 1));
    relations.push(passingRelation(domain, 2));
  }
  return gateSnapshotOf(relations);
}

/* ------------------------------------------------------------------------- *
 * Security snapshot
 * ------------------------------------------------------------------------- */

/** A snapshot whose digest is recomputed over its own canonical finding bytes. */
export function securitySnapshotOf(
  findings: readonly ReleaseSecurityFinding[],
): ImmutableReleaseSecuritySnapshot {
  return {
    snapshotDigest: releaseSecuritySnapshotDigest(findings),
    findings,
  };
}

export function emptySecuritySnapshot(): ImmutableReleaseSecuritySnapshot {
  return securitySnapshotOf([]);
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

/**
 * The pinned inventory for an evidence set. Duplicate unit identities and duplicate
 * order keys are dropped so a fixture that deliberately supplies a duplicate unit still
 * reaches the lineage predicate that owns that case rather than a manifest shape defect.
 */
export function inventoryFor(
  units: readonly IntegrationUnitEvidence[],
): ReleaseIntegrationInventoryEntry[] {
  const entries: ReleaseIntegrationInventoryEntry[] = [];
  const ids = new Set<string>();
  const orderKeys = new Set<string>();
  for (const unit of units) {
    if (ids.has(unit.unitId) || orderKeys.has(unit.orderKey)) {
      continue;
    }
    ids.add(unit.unitId);
    orderKeys.add(unit.orderKey);
    entries.push({
      unitId: unit.unitId,
      orderKey: unit.orderKey,
      unitKind: unit.unitKind,
      proof: unit.proof,
    });
  }
  return entries;
}

/** The tree the integration branch carried before the first content unit. */
export function initialTreeFor(units: readonly IntegrationUnitEvidence[]): GitOid {
  const content = [...units]
    .filter((unit) => unit.proof === 'content-merged')
    .sort((left, right) =>
      left.orderKey < right.orderKey ? -1 : left.orderKey > right.orderKey ? 1 : 0,
    );
  const first = content[0];
  if (first === undefined || first.previousResultTreeOid === null) {
    return BASE_TREE_OID;
  }
  return first.previousResultTreeOid;
}

/* ------------------------------------------------------------------------- *
 * Published-head evidence
 * ------------------------------------------------------------------------- */

const DECLARED_CHECK_IDS: readonly string[] = Object.freeze([
  'validate-write-scope',
  'validate-framework',
]);

const RESOLVED_BASES: Readonly<Record<string, GitOid>> = Object.freeze({
  [RELEASE_BASE_BRANCH]: BASE_OID,
});

const AUTHOR_PRODUCER = Object.freeze({
  role: 'devops',
  executionSessionId: 'session-author-pre-publication',
});

const CONTROL_PRODUCER = Object.freeze({
  role: 'devops-control',
  executionSessionId: 'session-control-post-publication',
});

function command(
  phase: 'author_pre_publication' | 'control_post_publication',
  label: string,
  targetCommit: GitOid,
  branch: string,
  materialArguments: Readonly<Record<string, string | number | boolean>>,
  overrides: Partial<PublishedHeadCommandEvidence> = {},
): PublishedHeadCommandEvidence {
  const withoutId = {
    schema: 'published-head-command-evidence/v2' as const,
    phase,
    producer: phase === 'author_pre_publication' ? AUTHOR_PRODUCER : CONTROL_PRODUCER,
    targetCommit,
    branch,
    workingDirectory: 'C:/fixtures/worktree',
    startedAtUtc: isoAt(1_000),
    endedAtUtc: isoAt(2_000),
    executable: 'powershell',
    arguments: ['-NoProfile', '-File', `./scripts/ci/${label}.ps1`],
    renderedCommand: `powershell -NoProfile -File ./scripts/ci/${label}.ps1`,
    materialArguments,
    resolvedBases: RESOLVED_BASES,
    headBefore: targetCommit,
    headAfter: targetCommit,
    expectedExitCode: 0,
    exitCode: 0,
    actualResult: {
      summary: `${label} completed`,
      outputDigest: digest(`output-${phase}-${label}`),
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
    command('author_pre_publication', checkId, targetCommit, branch, { checkId }),
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
  pullRequestNumber: number = PULL_REQUEST_NUMBER,
  remoteRef: string = RELEASE_REMOTE_REF,
): ControlPostPublicationEvidence {
  const checkCommands = DECLARED_CHECK_IDS.map((checkId) =>
    command('control_post_publication', checkId, targetCommit, branch, { checkId }),
  );

  const localProof = command(
    'control_post_publication',
    'proof-local-branch-head',
    targetCommit,
    branch,
    {
      proofKind: 'local_branch_head',
      observedHeadOid: targetCommit,
      commitsAfterTarget: 0,
    },
  );
  const remoteProof = command(
    'control_post_publication',
    'proof-remote-branch-head',
    targetCommit,
    branch,
    {
      proofKind: 'remote_branch_head',
      observedHeadOid: targetCommit,
      commitsAfterTarget: 0,
      remoteRef,
    },
  );
  const pullRequestProof = command(
    'control_post_publication',
    'proof-pull-request-head',
    targetCommit,
    branch,
    {
      proofKind: 'pull_request_head',
      observedHeadOid: targetCommit,
      commitsAfterTarget: 0,
      pullRequestNumber,
    },
  );

  const proofCommands = [localProof, remoteProof, pullRequestProof];

  return {
    phase: 'control_post_publication',
    targetCommit,
    branch,
    authorEvidenceDigest: author.canonicalAuthorEvidenceDigest,
    resolvedBases: RESOLVED_BASES,
    declaredCheckIds: DECLARED_CHECK_IDS,
    commands: [...checkCommands, ...proofCommands],
    noLaterContent: {
      targetCommit,
      branch,
      remoteRef,
      pullRequestNumber,
      localBranchHeadOid: targetCommit,
      remoteBranchHeadOid: targetCommit,
      pullRequestHeadOid: targetCommit,
      commitsAfterTarget: { localBranch: 0, remoteBranch: 0, pullRequestHead: 0 },
      observedAtUtc: isoAt(4_000),
      proofCommandEvidenceIds: proofCommands.map((entry) => entry.evidenceId),
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

/** Recomputes a command's self-identifying `evidenceId` after a fixture mutates it. */
export function resealCommand(
  command: PublishedHeadCommandEvidence,
): PublishedHeadCommandEvidence {
  return {
    ...command,
    evidenceId: selfDigest({ ...command, evidenceId: '' }, 'evidenceId'),
  };
}

export function sealBundle(
  author: AuthorPrePublicationEvidence,
  control: ControlPostPublicationEvidence,
  targetCommit: GitOid = HEAD_OID,
  branch: string = RELEASE_SOURCE_BRANCH,
): CompletePublishedHeadEvidenceBundle {
  const withoutDigest = {
    schema: 'published-head-evidence/v2' as const,
    status: 'complete' as const,
    targetCommit,
    branch,
    author,
    control,
    canonicalBundleDigest: '',
  };
  return {
    ...withoutDigest,
    canonicalBundleDigest: selfDigest(withoutDigest, 'canonicalBundleDigest'),
  };
}

export function validPublishedHeadBundle(): CompletePublishedHeadEvidenceBundle {
  const author = validAuthorPhase();
  const control = validControlPhase(author);
  return sealBundle(author, control);
}

/* ------------------------------------------------------------------------- *
 * Required checks
 * ------------------------------------------------------------------------- */

export function validRequiredChecks(): ReleaseRequiredCheckObservation {
  return {
    targetCommit: HEAD_OID,
    requiredContexts: [...REQUIRED_CHECK_CONTEXTS],
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
  const units = validIntegrationEvidence();
  return {
    schema: 'release-gates/v1',
    repositoryId: REPOSITORY_ID,
    sourceBranch: RELEASE_SOURCE_BRANCH,
    sourceOid: HEAD_OID,
    baseBranch: RELEASE_BASE_BRANCH,
    baseOid: BASE_OID,
    mergeMethod: RELEASE_MERGE_METHOD,
    requirements: validRequirements(),
    integrationEvidenceSetDigest: integrationEvidenceSetDigest(units),
    integrationUnitInventory: inventoryFor(units),
    integrationInitialTreeOid: initialTreeFor(units),
    publishedHeadEvidenceDigest: bundle.canonicalBundleDigest,
    irreversibleProductionCoupling: { coupled: false },
    ...overrides,
  };
}

/** The provenanced artifact reference that contains a manifest's exact bytes. */
export function manifestSourceFor(
  manifest: ReleaseGateManifest | null,
): ImmutableProvenancedArtifactRef {
  return {
    kind: 'release-gate-manifest',
    commit: oid('release-gate-manifest-artifact'),
    path: 'release/release-gates.json',
    digest:
      manifest === null
        ? digest('absent-manifest')
        : sha256Canonical(manifest),
    producedByExecutor: false,
    producer: {
      principalId: 'devops',
      principalType: 'agent_role',
      authorizationCommit: oid('devops-authorization'),
    },
  };
}

/**
 * A complete, release-bound irreversible-production authorization: it names this
 * repository, this policy commit, and this release head, and its scope digest is
 * computed from exactly those values.
 */
export function irreversibleAuthorizationFor(
  policyCommit: GitOid,
  releaseHeadOid: GitOid = HEAD_OID,
  repositoryId: string = REPOSITORY_ID,
): ImmutableHumanDecisionRef {
  return {
    decisionId: 'HUMAN-00X',
    decisionCommit: oid('human-authorization-decision'),
    artifactPath: 'plans/decisions/HUMAN-00X.md',
    repositoryId,
    policyCommit,
    releaseHeadOid,
    action: 'authorize_policy_required_irreversible_production_action',
    authorizedBy: {
      principalId: 'repository-owner',
      principalType: 'human',
      authorizationCommit: oid('human-authorization'),
    },
    scopeDigest: expectedIrreversibleAuthorizationScopeDigest(
      repositoryId,
      policyCommit,
      releaseHeadOid,
    ),
  };
}

/* ------------------------------------------------------------------------- *
 * Policy attestation
 * ------------------------------------------------------------------------- */

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
  readonly executorApps?: readonly ExecutorAppIdentity[];
  readonly issuerStatusState?: 'active' | 'revoked' | 'unknown';
  /** Signs with a key the activation record does not pin. */
  readonly wrongKey?: boolean;
}

/**
 * Builds a structurally complete attestation and signs its exact canonical payload with
 * the run-time-derived fixture key. `signatureLabel` distinguishes the two independently
 * signed phases through the payload's own `sourceEvidenceDigest`, so the two
 * authorizations carry genuinely different canonical digests and signatures.
 */
export function buildAttestation(
  options: AttestationOptions,
): TrustedCurrentPolicyAttestation {
  const observedAt = options.observedAtOffsetMs ?? 0;
  const expiresAt = options.expiresAtOffsetMs ?? 55_000;
  const policyGeneration = options.policyGeneration ?? 7;
  const apps = options.executorApps ?? EXECUTOR_APPS;
  const label = options.signatureLabel ?? options.phase ?? 'pre_intent';

  const withoutDigest = {
    schema: 'github-current-policy-attestation/v1' as const,
    issuer: {
      authorityId: 'repository-policy-attestor',
      keyId: 'key-1',
      publicKeyDigest: ATTESTOR_PUBLIC_KEY_DIGEST,
      signatureAlgorithm: 'Ed25519' as const,
      policyGeneration,
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
      executorApps: apps,
    },
    policy: {
      bypassActorsComplete: true,
      bypassActors: [],
      observerPrincipals: OBSERVER_PRINCIPALS,
      issuerStatus: {
        channelId: 'revocation-channel-1',
        authorityId: 'repository-policy-attestor',
        keyId: 'key-1',
        publicKeyDigest: ATTESTOR_PUBLIC_KEY_DIGEST,
        state: options.issuerStatusState ?? ('active' as const),
        policyGeneration,
        observedAtUtc: isoAt(observedAt + 1_000),
      },
      paginationComplete: true,
      rulesetEnumerationComplete: true,
      classicProtectionComplete: true,
      requiredCheckSources: REQUIRED_CHECK_CONTEXTS.map((context) => ({
        name: context.name,
        appId: context.expectedAppId,
      })),
      mergeMethodsConfigured: ['merge', 'squash'],
      executorApps: apps,
      observerPrincipalSetDigest: OBSERVER_PRINCIPAL_SET_DIGEST,
      executorAppsAbsentFromBypassSets: true,
      unknownPayloadMembers: [],
      effectiveControlEvaluationComplete: true,
    },
    observedAt: isoAt(observedAt),
    issuedAt: isoAt(observedAt + 1_000),
    notBefore: isoAt(observedAt),
    expiresAt: isoAt(observedAt + expiresAt),
    sourceEvidenceDigest: digest(`policy-source-evidence:${label}`),
    policyDigest: options.policyDigest ?? digest('policy'),
    effectivePolicyProfileDigest:
      options.effectivePolicyProfileDigest ?? REQUIRED_POLICY_PROFILE_DIGEST,
    canonicalPayloadDigest: '',
    signature: '',
  };

  const canonicalPayloadDigest = attestationPayloadDigest(
    withoutDigest as unknown as TrustedCurrentPolicyAttestation,
  );
  const unsigned = {
    ...withoutDigest,
    canonicalPayloadDigest,
  } as unknown as TrustedCurrentPolicyAttestation;

  return {
    ...unsigned,
    signature:
      options.wrongKey === true
        ? signWithWrongKey(unsigned)
        : signAttestationPayload(unsigned),
  };
}

/**
 * Recomputes `canonicalPayloadDigest` and the Ed25519 signature after a fixture mutates
 * the payload, modelling an attestor that honestly signs a payload which is itself
 * incomplete or incorrect. It lets a fixture reach the completeness, pagination, and
 * unknown-member branches instead of stopping at the digest or signature branch.
 */
export function resignAttestation(
  attestation: TrustedCurrentPolicyAttestation,
): TrustedCurrentPolicyAttestation {
  const withDigest = {
    ...attestation,
    canonicalPayloadDigest: attestationPayloadDigest({
      ...attestation,
      canonicalPayloadDigest: '',
    }),
  };
  return { ...withDigest, signature: signAttestationPayload(withDigest) };
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
  readonly manifestSource?: ImmutableProvenancedArtifactRef | null;
  readonly pullRequest?: ImmutablePullRequestObservation;
  readonly base?: ImmutableRefObservation;
  readonly gateSnapshot?: ImmutableAggregateGateSnapshot;
  readonly gateSnapshotSource?: ImmutableProvenancedArtifactRef | null;
  readonly securitySnapshot?: ImmutableReleaseSecuritySnapshot;
  readonly securitySnapshotSource?: ImmutableProvenancedArtifactRef | null;
  readonly integrationEvidence?: readonly IntegrationUnitEvidence[];
  readonly integrationEvidenceSource?: ImmutableProvenancedArtifactRef | null;
  readonly requiredPolicyProfile?: RequiredGitHubPolicyProfile | null;
  readonly requiredPolicyProfileSource?: ImmutableProvenancedArtifactRef | null;
  readonly requiredChecks?: ReleaseRequiredCheckObservation;
  readonly changedPaths?: readonly string[];
  readonly publishedHeadEvidence?: ReleaseAdmissionInput['publishedHeadEvidence'];
  readonly policyControlFacts?: PolicyControlFacts;
  readonly evaluatedAtUtc?: string;
  readonly orderKey?: string;
}

export const ADMISSION_CONTEXT_NONCE = digest('admission-context-nonce');

function sourceRefFor(
  kind: string,
  label: string,
  digestValue: Sha256Hex,
): ImmutableProvenancedArtifactRef {
  return { ...provenancedRef(kind, label, digestValue) };
}

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
  const gateSnapshot = overrides.gateSnapshot ?? validGateSnapshot();
  const securitySnapshot = overrides.securitySnapshot ?? emptySecuritySnapshot();
  const integrationEvidence =
    overrides.integrationEvidence ?? validIntegrationEvidence();

  const skeleton: ReleaseAdmissionInput = {
    executor: RELEASE_EXECUTOR,
    evaluatedAtUtc: overrides.evaluatedAtUtc ?? isoAt(5_000),
    activation,
    manifest,
    manifestSource:
      overrides.manifestSource === undefined
        ? manifestSourceFor(manifest)
        : overrides.manifestSource,
    repository: REPOSITORY,
    pullRequest: overrides.pullRequest ?? validPullRequest(),
    base: overrides.base ?? validBaseRef(),
    gateSnapshot,
    gateSnapshotSource:
      overrides.gateSnapshotSource === undefined
        ? sourceRefFor(
            'aggregate-gate-snapshot',
            'gate-snapshot',
            aggregateGateSnapshotDigest(gateSnapshot.relations),
          )
        : overrides.gateSnapshotSource,
    securitySnapshot,
    securitySnapshotSource:
      overrides.securitySnapshotSource === undefined
        ? sourceRefFor(
            'release-security-snapshot',
            'security-snapshot',
            releaseSecuritySnapshotDigest(securitySnapshot.findings ?? []),
          )
        : overrides.securitySnapshotSource,
    integrationEvidence,
    integrationEvidenceSource:
      overrides.integrationEvidenceSource === undefined
        ? sourceRefFor(
            'release-integration-evidence',
            'integration-evidence',
            integrationEvidenceSetDigest(integrationEvidence),
          )
        : overrides.integrationEvidenceSource,
    requiredPolicyProfile:
      overrides.requiredPolicyProfile === undefined
        ? validRequiredPolicyProfile()
        : overrides.requiredPolicyProfile,
    requiredPolicyProfileSource:
      overrides.requiredPolicyProfileSource === undefined
        ? requiredPolicyProfileRef()
        : overrides.requiredPolicyProfileSource,
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
  overrides: Partial<AttestationOptions> = {},
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
        ...overrides,
      }),
    },
  };
}

/** Canonical digest helper for tests that assert digest stability. */
export function canonicalDigestOf(value: unknown): Sha256Hex {
  return sha256Canonical(value);
}
