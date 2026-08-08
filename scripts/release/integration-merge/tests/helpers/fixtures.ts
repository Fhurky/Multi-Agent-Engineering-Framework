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
import { createReleaseExecutorCompositionRoot } from '../../composition-capability.ts';
import { DormantReleaseMergePort } from '../../merge-port.ts';
import {
  canonicalBytes,
  canonicalJson,
  omitTopLevel,
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
  AuthenticatedImmutableDiff,
  AuthenticatedImmutableDiffEntry,
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
  ReleaseAuthorityPort,
  ReleaseExecutorCapability,
  ReleaseGateManifest,
  ReleaseGateRequirement,
  ReleaseIntegrationInventoryEntry,
  ReleaseRepositoryIdentity,
  ReleaseRequiredCheckObservation,
  ReleasePullRequestMergePort,
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
import {
  canonicalImmutableDiffEntriesBytes,
  canonicalImmutableDiffEntriesDigest,
} from '../../immutable-diff.ts';

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

export function authenticatedDiffFor(
  paths: readonly string[],
  options: {
    readonly repositoryId?: string;
    readonly baseOid?: GitOid;
    readonly headOid?: GitOid;
    readonly entries?: readonly AuthenticatedImmutableDiffEntry[];
    readonly pageSize?: number;
  } = {},
): AuthenticatedImmutableDiff {
  const entries = options.entries ?? paths.map((path, ordinal) => ({
    ordinal,
    changeKind: 'modified' as const,
    oldPath: path,
    newPath: path,
    oldBlobOid: oid(`diff-old:${path}`),
    newBlobOid: oid(`diff-new:${path}`),
  }));
  const pageSize = options.pageSize ?? Math.max(1, entries.length);
  const pageCount = Math.max(1, Math.ceil(entries.length / pageSize));
  const pages = Array.from({ length: pageCount }, (_, index) => {
    const entryStart = index * pageSize;
    const pageEntries = entries.slice(entryStart, entryStart + pageSize);
    const withoutResponse = {
      page: index + 1,
      pageCount,
      entryStart,
      entryCount: pageEntries.length,
      entriesDigest: sha256Canonical(pageEntries),
      responseDigest: '',
    };
    return {
      ...withoutResponse,
      responseDigest: selfDigest(withoutResponse, 'responseDigest'),
    };
  });
  const canonicalEntriesBytes = canonicalImmutableDiffEntriesBytes(entries);
  const withoutEvidence = {
    schema: 'authenticated-immutable-diff/v1' as const,
    repositoryId: options.repositoryId ?? REPOSITORY_ID,
    baseOid: options.baseOid ?? BASE_OID,
    headOid: options.headOid ?? HEAD_OID,
    comparison: 'base_to_head' as const,
    complete: true as const,
    renameDetection: 'complete' as const,
    deletionDetection: 'complete' as const,
    entries,
    pages,
    canonicalEntriesBytes,
    canonicalEntriesDigest: canonicalImmutableDiffEntriesDigest(entries),
    evidenceCommit: oid('authenticated-immutable-diff-evidence'),
    evidenceDigest: '',
  };
  return {
    ...withoutEvidence,
    evidenceDigest: selfDigest(withoutEvidence, 'evidenceDigest'),
  };
}

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
  digestValue: Sha256Hex = sha256Canonical({
    schema: 'fixture-authority-artifact/v1',
    kind,
    label,
  }),
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
    permissions: {
      contents: 'write',
      pull_requests: 'read',
      checks: 'read',
      commit_statuses: 'read',
      metadata: 'read',
    },
  },
  {
    appId: 222,
    installationId: 2222,
    nodeId: 'A_release_main',
    slug: 'release-merge-executor',
    permissions: {
      contents: 'write',
      pull_requests: 'read',
      checks: 'read',
      commit_statuses: 'read',
      metadata: 'read',
    },
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

export const AUTHORITY_PORT_IDENTITY = Object.freeze({
  resolverId: 'immutable-release-authority-resolver',
  resolverIdentityDigest: digest('immutable-release-authority-resolver'),
});

export const RELEASE_CAPABILITY_BINDING = Object.freeze({
  compositionRootId: 'release-control-deployment-root',
  bindingDigest: digest('release-control-deployment-root-binding'),
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
      targetCommit: 'f148567d716c00d7a24783318c8d6d7031492e7b',
      verdictCommit: '78359ae2e3dc6e97fb3d60f0b847b84abed08fa6',
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
      lineageRound: 3,
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
      lineageRound: 3,
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
      attestedAuthorityPortIdentity: AUTHORITY_PORT_IDENTITY,
      attestedCapabilityBinding: RELEASE_CAPABILITY_BINDING,
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

  const policySource = (
    sourceLevel: 'classic' | 'repository' | 'organization' | 'enterprise',
    sourcePolicyId: string,
    parentPolicyId: string | null,
    enforcement: 'active' | 'evaluate' | 'disabled',
    rules: readonly string[],
  ) => {
    const withoutDigest = {
      sourceLevel,
      sourcePolicyId,
      parentPolicyId,
      enforcement,
      version: 'fixture-v1',
      conditions: { ref: RELEASE_BASE_REF },
      rules,
      bypassActors: [],
      page: 1,
      pageCount: 1,
      pages: [{ page: 1, responseDigest: digest(`${sourcePolicyId}-page-1`) }],
    };
    return { ...withoutDigest, responseDigest: sha256Canonical(withoutDigest) };
  };
  const policySources = [
    policySource('classic', 'classic-main', null, 'active', ['required_checks']),
    policySource('enterprise', 'enterprise-parent', null, 'disabled', []),
    policySource('organization', 'organization-parent', 'enterprise-parent', 'evaluate', ['signed_commits']),
    policySource('repository', 'repository-main', 'organization-parent', 'active', ['pull_request', 'required_checks']),
  ];
  const effectiveRules = policySources.flatMap((source) =>
    source.rules.map((rule) => ({
      rule,
      sourcePolicyId: source.sourcePolicyId,
      sourceLevel: source.sourceLevel,
      effective: source.enforcement === 'active',
    })),
  );
  const policy = {
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
    policySources,
    effectiveRules,
  };

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
    policy,
    observedAt: isoAt(observedAt),
    issuedAt: isoAt(observedAt + 1_000),
    notBefore: isoAt(observedAt),
    expiresAt: isoAt(observedAt + expiresAt),
    sourceEvidenceDigest: sha256Canonical(policySources),
    sourceEvidence: policySources,
    policyDigest: options.policyDigest ?? sha256Canonical(policy),
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
  const rebound = {
    ...attestation,
    sourceEvidence: attestation.policy.policySources,
    sourceEvidenceDigest: sha256Canonical(attestation.policy.policySources),
    policyDigest: sha256Canonical(attestation.policy),
  };
  const withDigest = {
    ...rebound,
    canonicalPayloadDigest: attestationPayloadDigest({
      ...rebound,
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
  readonly authenticatedDiff?: AuthenticatedImmutableDiff;
  readonly publishedHeadEvidence?: ReleaseAdmissionInput['publishedHeadEvidence'];
  readonly policyControlFacts?: PolicyControlFacts;
  readonly evaluatedAtUtc?: string;
  readonly orderKey?: string;
  /** Exact callable broker bound by the test-only deployment composition root. */
  readonly mergePort?: ReleasePullRequestMergePort;
}

export type FixtureReleaseAdmissionInput = ReleaseAdmissionInput & {
  readonly authority: ReleaseAuthorityPort | null;
  readonly mergePort: ReleasePullRequestMergePort | null;
  readonly capability: ReleaseExecutorCapability | null;
  readonly authenticatedDiff: AuthenticatedImmutableDiff;
};

export const ADMISSION_CONTEXT_NONCE = digest('admission-context-nonce');

function sourceRefFor(
  kind: string,
  label: string,
  digestValue: Sha256Hex,
): ImmutableProvenancedArtifactRef {
  return { ...provenancedRef(kind, label, digestValue) };
}

function integrationAuthorityValue(
  units: readonly IntegrationUnitEvidence[],
): unknown {
  return [...units]
    .sort((left, right) =>
      left.orderKey < right.orderKey ? -1 : left.orderKey > right.orderKey ? 1 : 0,
    )
    .map((unit) => ({
      unitKind: unit.unitKind,
      unitId: unit.unitId,
      orderKey: unit.orderKey,
      proof: unit.proof,
      sourceOid: unit.sourceOid,
      mergeMethod: unit.mergeMethod,
      gateSnapshotDigest: unit.gateSnapshotDigest,
      previousResultTreeOid: unit.previousResultTreeOid,
      resultTreeOid: unit.resultTreeOid,
      subsumedBy: unit.subsumedBy,
    }));
}

/**
 * Offline read-only authority fixture. It models an already authenticated boundary;
 * it provisions no Git object, identity, credential, policy, control plane, or store.
 */
class FixtureAuthorityPort implements ReleaseAuthorityPort {
  readonly identity = AUTHORITY_PORT_IDENTITY;
  readonly #input: ReleaseAdmissionInput;
  readonly #artifacts = new Map<string, unknown>();

  constructor(input: ReleaseAdmissionInput) {
    this.#input = input;
    const activation = input.activation;
    if (activation !== null) {
      this.#artifacts.set(
        canonicalJson(activation.recordSource),
        omitTopLevel(activation, 'recordSource'),
      );
      if (activation.negativeCapabilityTestAttestation !== undefined) {
        this.#artifacts.set(
          canonicalJson(activation.negativeCapabilityTestAttestation),
          {
            schema: 'fixture-authority-artifact/v1',
            kind: 'negative-capability-test-attestation',
            label: 'negative-capability',
          },
        );
      }
      if (activation.gateVocabularyCorrection !== undefined) {
        this.#artifacts.set(
          canonicalJson(activation.gateVocabularyCorrection),
          {
            schema: 'fixture-authority-artifact/v1',
            kind: 'gate-vocabulary-correction',
            label: 'gate-vocabulary-correction',
          },
        );
      }
    }
    if (input.requiredPolicyProfile !== null && input.requiredPolicyProfileSource !== null) {
      this.#artifacts.set(
        canonicalJson(input.requiredPolicyProfileSource),
        input.requiredPolicyProfile,
      );
    }
    if (input.manifest !== null && input.manifestSource !== null) {
      this.#artifacts.set(canonicalJson(input.manifestSource), input.manifest);
    }
    if (input.gateSnapshotSource !== null) {
      this.#artifacts.set(canonicalJson(input.gateSnapshotSource), {
        schema: 'aggregate-gate-snapshot/v1',
        relations: [...input.gateSnapshot.relations]
          .map((relation) => ({
            lineage: relation.lineage,
            lineageRound: relation.lineageRound,
            gate: relation.gate,
            gateClass: relation.gateClass,
            ownerForm: relation.ownerForm,
            verdictState: relation.verdictState,
            verdictCommit: relation.verdictCommit,
            relationSetComplete: relation.relationSetComplete,
            acceptedRisks: relation.acceptedRisks,
          }))
          .sort((left, right) => {
            const leftTuple = [left.lineage, left.gate, String(left.lineageRound), left.verdictCommit];
            const rightTuple = [right.lineage, right.gate, String(right.lineageRound), right.verdictCommit];
            return canonicalJson(leftTuple).localeCompare(canonicalJson(rightTuple));
          }),
      });
    }
    if (input.securitySnapshotSource !== null) {
      this.#artifacts.set(canonicalJson(input.securitySnapshotSource), {
        schema: 'release-security-snapshot/v1',
        findings: [...input.securitySnapshot.findings]
          .map((finding) => ({ ...finding }))
          .sort((left, right) =>
            canonicalJson([left.findingId, left.evidenceDigest]).localeCompare(
              canonicalJson([right.findingId, right.evidenceDigest]),
            ),
          ),
      });
    }
    if (input.integrationEvidenceSource !== null) {
      this.#artifacts.set(
        canonicalJson(input.integrationEvidenceSource),
        integrationAuthorityValue(input.integrationEvidence),
      );
    }
  }

  resolveArtifact(ref: ImmutableArtifactRef) {
    const value = this.#artifacts.get(canonicalJson(ref));
    if (value === undefined || sha256Canonical(value) !== ref.digest) {
      return null;
    }
    const provenanced = ref as ImmutableProvenancedArtifactRef;
    const activation = this.#input.activation;
    const producer =
      provenanced.producer ??
      (activation === null
        ? null
        : {
            principalId: activation.issuer.principalId,
            principalType: 'human' as const,
            authorizationCommit: activation.issuer.authorizationCommit,
          });
    if (producer === null || producer === undefined) {
      return null;
    }
    return {
      ref,
      canonicalValue: value,
      producer,
      producerAuthorized: true as const,
      authorizationEvidenceCommit: producer.authorizationCommit,
    };
  }

  resolvePassingGate(ref: MergeExecutorActivationRecord['architectureReview']) {
    const activation = this.#input.activation;
    if (activation === null) {
      return null;
    }
    const expected = [
      activation.architectureReview,
      activation.implementationReview,
      activation.implementationSecurityReview,
    ].find((candidate) => canonicalJson(candidate) === canonicalJson(ref));
    if (expected === undefined) {
      return null;
    }
    const allowed =
      (ref.member === 'architectureReview' &&
        ref.producer.principalId === 'reviewer' &&
        ref.producer.authorizationCommit === oid('reviewer-authorization')) ||
      (ref.member === 'implementationReview' &&
        ref.producer.principalId === 'reviewer' &&
        ref.producer.authorizationCommit === oid('reviewer-authorization')) ||
      (ref.member === 'implementationSecurityReview' &&
        ref.producer.principalId === 'security' &&
        ref.producer.authorizationCommit === oid('security-authorization'));
    return allowed
      ? {
          verdict: ref,
          producerAuthorized: true as const,
          authorizationEvidenceCommit: ref.producer.authorizationCommit,
        }
      : null;
  }

  resolveTrustRoot(ref: MergeExecutorActivationRecord['policyAttestorTrustRoot']) {
    return this.#input.activation !== null &&
      canonicalJson(this.#input.activation.policyAttestorTrustRoot) === canonicalJson(ref)
      ? ref
      : null;
  }

  resolveAuthorizedHuman(principal: MergeExecutorActivationRecord['issuer']) {
    return principal.principalId === 'repository-owner' &&
      principal.authorizationCommit === oid('human-authorization')
      ? principal
      : null;
  }

  enumerateAdmissionUniverse(repositoryId: string, releaseHeadOid: GitOid) {
    const input = this.#input;
    if (
      input.manifestSource === null ||
      input.gateSnapshotSource === null ||
      input.securitySnapshotSource === null ||
      input.integrationEvidenceSource === null ||
      input.requiredPolicyProfileSource === null ||
      repositoryId !== input.repository.repositoryId ||
      releaseHeadOid !== input.pullRequest.headOid
    ) {
      return null;
    }
    const commands = input.publishedHeadEvidence?.status === 'complete'
      ? [
          ...input.publishedHeadEvidence.author.commands,
          ...input.publishedHeadEvidence.control.commands,
        ]
      : [];
    const humanDecisions =
      input.manifest?.irreversibleProductionCoupling.coupled === true &&
      input.manifest.irreversibleProductionCoupling.authorization !== null
        ? [input.manifest.irreversibleProductionCoupling.authorization]
        : [];
    const withoutDigest = {
      repositoryId,
      releaseHeadOid,
      manifestSource: input.manifestSource,
      gateSnapshotSource: input.gateSnapshotSource,
      securitySnapshotSource: input.securitySnapshotSource,
      integrationEvidenceSource: input.integrationEvidenceSource,
      requiredPolicyProfileSource: input.requiredPolicyProfileSource,
      gateRelations: input.gateSnapshot.relations,
      securityFindings: input.securitySnapshot.findings,
      integrationEvidence: input.integrationEvidence,
      requiredChecks: input.requiredChecks,
      immutableDiff: (input as FixtureReleaseAdmissionInput).authenticatedDiff,
      publicationCommandEvidenceIds: commands.map((command_) => command_.evidenceId).sort(),
      humanDecisions,
      evidenceCommit: oid('authority-universe-evidence'),
      universeDigest: '',
    };
    return {
      ...withoutDigest,
      universeDigest: selfDigest(withoutDigest, 'universeDigest'),
    };
  }

  resolveIssuerStatus(authorityId: string, keyId: string, policyGeneration: number) {
    const observation = this.#input.policyControlFacts.observation;
    if (observation.state !== 'current_valid') {
      return null;
    }
    const claimed = observation.attestation.policy.issuerStatus;
    if (
      claimed.authorityId !== authorityId ||
      claimed.keyId !== keyId ||
      claimed.policyGeneration !== policyGeneration
    ) {
      return null;
    }
    const withoutDigest = {
      channelId: claimed.channelId,
      statusAuthorityId: 'independent-key-status-authority',
      authorityId,
      keyId,
      publicKeyDigest: claimed.publicKeyDigest,
      state: claimed.state,
      policyGeneration,
      observedAtUtc: claimed.observedAtUtc,
      evidenceCommit: oid('online-issuer-status-evidence'),
    };
    return { ...withoutDigest, evidenceDigest: sha256Canonical(withoutDigest) };
  }

  authenticateExecutionEvidence(evidenceId: Sha256Hex) {
    const bundle = this.#input.publishedHeadEvidence;
    if (bundle?.status !== 'complete') {
      return null;
    }
    const command_ = [...bundle.author.commands, ...bundle.control.commands].find(
      (candidate) => candidate.evidenceId === evidenceId,
    );
    if (command_ === undefined) {
      return null;
    }
    const expected = command_.phase === 'author_pre_publication'
      ? AUTHOR_PRODUCER
      : CONTROL_PRODUCER;
    if (canonicalJson(command_.producer) !== canonicalJson(expected)) {
      return null;
    }
    return {
      evidenceId,
      phase: command_.phase,
      principalId: command_.producer.role,
      executionSessionId: command_.producer.executionSessionId,
      executionInstanceId:
        command_.phase === 'author_pre_publication'
          ? 'independent-author-process'
          : 'independent-control-process',
      identityAuthorityId: 'execution-identity-authority',
      evidenceCommit: oid(`execution-identity-${command_.phase}`),
    };
  }

  resolveHumanDecision(decision: ImmutableHumanDecisionRef) {
    const universe = this.enumerateAdmissionUniverse(
      this.#input.repository.repositoryId,
      this.#input.pullRequest.headOid,
    );
    return universe?.humanDecisions.some(
      (candidate) => canonicalJson(candidate) === canonicalJson(decision),
    ) === true
      ? decision
      : null;
  }

  resolveAcceptedRisk(record: AcceptedBlockingSecurityRiskRecord) {
    const universe = this.enumerateAdmissionUniverse(
      this.#input.repository.repositoryId,
      this.#input.pullRequest.headOid,
    );
    const acceptedRisks = universe?.gateRelations.flatMap(
      (relation) => relation.acceptedRisks,
    ) ?? [];
    return acceptedRisks.some(
      (candidate) => canonicalJson(candidate) === canonicalJson(record),
    )
      ? record
      : null;
  }
}

function bindFixtureCapability(
  authority: ReleaseAuthorityPort,
  mergePort: ReleasePullRequestMergePort,
): ReleaseExecutorCapability {
  // The fixture authenticator models provisioned composition-root registrations with
  // exact object identity. Copying either identity label onto another object is not an
  // authentication event and cannot produce a capability.
  const root = createReleaseExecutorCompositionRoot({
    authenticateAuthorityPort(candidate) {
      return candidate === authority ? AUTHORITY_PORT_IDENTITY : null;
    },
    authenticateMergePort(candidate) {
      return candidate === mergePort ? MERGE_PORT_IDENTITY : null;
    },
    authenticateComposition(candidateAuthority, candidateMergePort) {
      return candidateAuthority === authority && candidateMergePort === mergePort
        ? RELEASE_CAPABILITY_BINDING
        : null;
    },
  });
  const capability = root.bind(authority, mergePort);
  if (capability === null) {
    throw new Error('fixture composition root failed to bind trusted ports');
  }
  return capability;
}

/** Rebinds one fixture input to the exact callable broker used by execution tests. */
export function withFixtureMergePort(
  input: FixtureReleaseAdmissionInput,
  mergePort: ReleasePullRequestMergePort,
): FixtureReleaseAdmissionInput {
  if (input.authority === null) {
    return { ...input, mergePort, capability: null };
  }
  return {
    ...input,
    mergePort,
    capability: bindFixtureCapability(input.authority, mergePort),
  };
}

/** Registers an explicitly trusted offline resolver replacement for focused tests. */
export function withFixtureAuthority(
  input: FixtureReleaseAdmissionInput,
  authority: ReleaseAuthorityPort,
): FixtureReleaseAdmissionInput {
  const mergePort = input.mergePort ?? new DormantReleaseMergePort();
  return {
    ...input,
    authority,
    mergePort,
    capability: bindFixtureCapability(authority, mergePort),
  };
}

/**
 * The success fixture: one release manifest covering all seven aggregate domains,
 * with every other admission input valid.
 */
export function validScenario(
  overrides: ScenarioOverrides = {},
): FixtureReleaseAdmissionInput {
  const activation =
    overrides.activation === undefined ? validActivationRecord() : overrides.activation;
  const manifest =
    overrides.manifest === undefined ? validManifest() : overrides.manifest;
  const gateSnapshot = overrides.gateSnapshot ?? validGateSnapshot();
  const securitySnapshot = overrides.securitySnapshot ?? emptySecuritySnapshot();
  const integrationEvidence =
    overrides.integrationEvidence ?? validIntegrationEvidence();
  const changedPaths = overrides.changedPaths ?? [
    'src/orchestrator/state/index.ts',
    'docs/architecture/runtime/COMPONENT-BOUNDARIES.md',
  ];
  const authenticatedDiff =
    overrides.authenticatedDiff ?? authenticatedDiffFor(changedPaths, {
      repositoryId: REPOSITORY.repositoryId,
      baseOid: (overrides.base ?? validBaseRef()).oid,
      headOid: (overrides.pullRequest ?? validPullRequest()).headOid,
    });

  const skeleton: FixtureReleaseAdmissionInput = {
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
    changedPaths,
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
    authority: null,
    mergePort: null,
    capability: null,
    authenticatedDiff,
  };

  if (overrides.policyControlFacts !== undefined) {
    const completed = { ...skeleton, policyControlFacts: overrides.policyControlFacts };
    const authority = new FixtureAuthorityPort(completed);
    const mergePort = overrides.mergePort ?? new DormantReleaseMergePort();
    return {
      ...completed,
      authority,
      mergePort,
      capability: bindFixtureCapability(authority, mergePort),
    };
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
    authenticatedDiff.evidenceDigest,
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

  const completed: FixtureReleaseAdmissionInput = {
    ...skeleton,
    policyControlFacts: {
      action: excludedControlAction(),
      observation: { state: 'current_valid', attestation },
    },
  };
  const authority = new FixtureAuthorityPort(completed);
  const mergePort = overrides.mergePort ?? new DormantReleaseMergePort();
  return {
    ...completed,
    authority,
    mergePort,
    capability: bindFixtureCapability(authority, mergePort),
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
