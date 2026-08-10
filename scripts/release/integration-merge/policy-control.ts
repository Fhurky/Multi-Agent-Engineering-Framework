/**
 * One policy-control classifier and one result constructor (ADR-0044).
 *
 * This module owns NO policy-observation port. It holds no Administration, ruleset,
 * bypass, or policy-mutation capability, and it is not a bypass actor. Complete policy
 * observation belongs to the separate human-controlled `RepositoryPolicyAttestor` and
 * its pinned observer principals; the executor consumes only signed, exact-subject,
 * fresh attestations that reach it as input facts.
 *
 * `PolicyControlFacts` is the only input to `classifyPolicyControl`. Raw observer,
 * activation, credential-broker, status-channel, and attestation facts are normalized
 * into it once. Contradictory evidence becomes `action.status: 'unknown'`; simultaneous
 * booleans are never passed to separate refusal and exception constructors.
 */

import { createPublicKey, verify as verifyDetachedSignature } from 'node:crypto';

import {
  POLICY_CONTROL_ACTION_ORDER,
  RELEASE_EXECUTOR,
} from './contracts.ts';
import type {
  ExecutorAppIdentity,
  GitOid,
  ImmutableArtifactRef,
  ImmutablePolicyAttestorTrustRootRef,
  MergeEvidenceRef,
  PolicyAttestationObservation,
  PolicyControlAction,
  PolicyControlClassification,
  PolicyControlFacts,
  PolicyObserverPrincipal,
  ReleaseAuthorityPort,
  RequiredGitHubPolicyProfile,
  GitHubPolicyRuleRecord,
  Sha256Hex,
  TrustedCurrentPolicyAttestation,
} from './contracts.ts';
import {
  canonicalBytes,
  canonicalJson,
  decodeBase64,
  hasControlCharacters,
  isIsoTimestamp,
  isGitOid,
  isSha256Hex,
  isoToEpochMs,
  omitTopLevel,
  sha256Canonical,
} from './canonical-json.ts';

/**
 * The exact canonical payload the attestor signs: every attestation field other than
 * `signature`, and necessarily other than the self-referential digest property. The
 * attestor signs these bytes, never a caller-supplied digest.
 */
export function attestationSignedPayload(
  attestation: TrustedCurrentPolicyAttestation,
): unknown {
  const withoutSignature = omitTopLevel(attestation, 'signature');
  return omitTopLevel(withoutSignature, 'canonicalPayloadDigest');
}

/** SHA-256 over the exact canonical payload bytes. */
export function attestationPayloadDigest(
  attestation: TrustedCurrentPolicyAttestation,
): Sha256Hex {
  return sha256Canonical(attestationSignedPayload(attestation));
}

/**
 * Real Ed25519 verification over the exact canonical payload, using the
 * activation-pinned verification key.
 *
 * Every failure mode is closed: unusable key material, a non-base64 or wrong-length
 * signature, a key the pinned digest does not cover, and a mathematically invalid
 * signature all return `false`. No branch treats a decode or key error as success, and
 * no branch substitutes digest equality for signature verification.
 */
export function verifyAttestationSignature(
  attestation: TrustedCurrentPolicyAttestation,
  trustRoot: ImmutablePolicyAttestorTrustRootRef,
): boolean {
  if (trustRoot.keyAlgorithm !== 'Ed25519') {
    return false;
  }
  const keyBytes = decodeBase64(trustRoot.publicKeySpkiBase64);
  if (keyBytes === null) {
    return false;
  }
  const signatureBytes = decodeBase64(attestation.signature);
  if (signatureBytes === null || signatureBytes.length !== 64) {
    return false;
  }
  try {
    const key = createPublicKey({
      key: Buffer.from(keyBytes),
      format: 'der',
      type: 'spki',
    });
    if (key.asymmetricKeyType !== 'ed25519') {
      return false;
    }
    return verifyDetachedSignature(
      null,
      Buffer.from(canonicalBytes(attestationSignedPayload(attestation))),
      key,
      Buffer.from(signatureBytes),
    );
  }
  catch {
    // A malformed key, an unsupported curve, or any decode failure is a refusal.
    return false;
  }
}

/** Canonical digest of the pinned observer principal set. */
export function observerPrincipalSetDigest(
  principals: readonly PolicyObserverPrincipal[],
): Sha256Hex {
  return sha256Canonical(
    [...principals]
      .map((principal) => ({
        principalId: principal.principalId,
        principalType: principal.principalType,
        installationScope: principal.installationScope,
        permissions: principal.permissions,
        credentialScopeDigest: principal.credentialScopeDigest,
      }))
      .sort((left, right) =>
        left.principalId < right.principalId
          ? -1
          : left.principalId > right.principalId
            ? 1
            : 0,
      ),
  );
}

/** Canonical digest of a complete executor App identity set, order-independent. */
export function executorAppSetDigest(
  apps: readonly ExecutorAppIdentity[],
): Sha256Hex {
  return sha256Canonical(
    [...apps]
      .map((app) => ({
        appId: app.appId,
        installationId: app.installationId,
        nodeId: app.nodeId,
        slug: app.slug,
        permissions: app.permissions,
      }))
      .sort((left, right) => left.appId - right.appId),
  );
}

/** Maximum observation-to-issue and observation-to-expiry window, in milliseconds. */
export const POLICY_FRESHNESS_WINDOW_MS = 60_000;

/** Minimum remaining validity when the merge call begins, in milliseconds. */
export const POLICY_EXECUTION_MARGIN_MS = 15_000;

function sortActions(
  actions: readonly PolicyControlAction[],
): readonly PolicyControlAction[] {
  return [...actions].sort(
    (left, right) =>
      POLICY_CONTROL_ACTION_ORDER.indexOf(left) -
      POLICY_CONTROL_ACTION_ORDER.indexOf(right),
  );
}

/**
 * The total, ordered classifier.
 *
 * 1. `detected` returns one `human_exception_required` record of kind
 *    `change_credentials_or_repository_authorization_policy`. Every detected action is
 *    retained in the evidence record but they never create multiple results, and the
 *    observation state is not mapped separately.
 * 2. `unknown` returns one unclassifiable exception whose only candidate kind is the
 *    third. The observation state is not mapped separately.
 * 3. Only `excluded` examines the observation.
 *
 * Pure, deterministic, and total.
 */
export function classifyPolicyControl(
  facts: PolicyControlFacts,
  evidenceRecord: MergeEvidenceRef,
): PolicyControlClassification {
  const action = facts.action;

  if (action.status === 'detected') {
    return {
      status: 'human_exception_required',
      exception: {
        status: 'human_exception_required',
        classification: 'detected',
        kind: 'change_credentials_or_repository_authorization_policy',
        executor: RELEASE_EXECUTOR,
        immutableSubjects: action.evidence,
        evidenceRecord,
      },
    };
  }

  if (action.status === 'unknown') {
    return {
      status: 'human_exception_required',
      exception: {
        status: 'human_exception_required',
        classification: 'unclassifiable',
        kind: null,
        candidateKinds: ['change_credentials_or_repository_authorization_policy'],
        executor: RELEASE_EXECUTOR,
        immutableSubjects: action.evidence,
        evidenceRecord,
      },
    };
  }

  const excludedEvidence: readonly ImmutableArtifactRef[] = [action.evidence];
  const observation = facts.observation;

  switch (observation.state) {
    case 'current_valid':
      return { status: 'usable', attestation: observation.attestation };
    case 'operationally_unavailable':
      return {
        status: 'refused',
        refusalCode: 'PolicyObservationUnavailable',
        evidence: excludedEvidence,
      };
    case 'present_invalid':
      return {
        status: 'refused',
        refusalCode: 'PolicyAttestationInvalid',
        evidence: excludedEvidence,
      };
    case 'present_valid_but_stale':
      return {
        status: 'refused',
        refusalCode: 'PolicyAttestationStale',
        evidence: excludedEvidence,
      };
    default: {
      // Exhaustiveness: the observation union is closed.
      const unreachable: never = observation;
      return unreachable;
    }
  }
}

/** Detected actions in their literal order, for the durable evidence record. */
export function orderedDetectedActions(
  facts: PolicyControlFacts,
): readonly PolicyControlAction[] {
  if (facts.action.status === 'detected') {
    return sortActions(facts.action.actions);
  }
  if (facts.action.status === 'unknown') {
    return sortActions(facts.action.candidateActions);
  }
  return [];
}

/* ------------------------------------------------------------------------- *
 * Attestation normalization
 * ------------------------------------------------------------------------- */

export interface PolicyAttestationExpectations {
  readonly repositoryDatabaseId: number;
  readonly repositoryNodeId: string;
  readonly repositoryOwner: string;
  readonly repositoryName: string;
  readonly protectedRef: 'refs/heads/main';
  readonly pullRequestNumber: number;
  readonly headOid: GitOid;
  readonly baseOid: GitOid;
  readonly admissionContextNonce: Sha256Hex;
  readonly admissionContextDigest: Sha256Hex;
  readonly authorizationPhase: 'pre_intent' | 'pre_mutation';
  readonly requiredPolicyProfileDigest: Sha256Hex;
  readonly trustRoot: ImmutablePolicyAttestorTrustRootRef;
  /** Expected policy generation; null for the first observation of a plan. */
  readonly expectedPolicyGeneration: number | null;
  /**
   * The two exact executor App identities, installations, and complete permission maps
   * pinned by the activation-bound required-policy profile. Any additional, missing, or
   * altered permission is rejected; the executor never infers an allowed set.
   */
  readonly expectedExecutorApps: readonly ExecutorAppIdentity[];
  readonly expectedObserverPrincipalSetDigest: Sha256Hex;
  readonly expectedRequiredCheckSources: readonly {
    readonly name: string;
    readonly appId: number;
  }[];
  readonly expectedMergeMethods: readonly string[];
  /** Full immutable profile used only as the comparison target for derivation. */
  readonly expectedRequiredPolicyProfile: RequiredGitHubPolicyProfile;
  readonly authority: ReleaseAuthorityPort;
}

export const EXECUTOR_PERMISSION_ALLOWLIST = Object.freeze({
  contents: 'write',
  pull_requests: 'read',
  checks: 'read',
  commit_statuses: 'read',
  metadata: 'read',
} as const);

export const FORBIDDEN_EXECUTOR_PERMISSIONS = Object.freeze([
  'administration',
  'actions',
  'environments',
  'deployments',
  'secrets',
  'issues',
  'repository_rulesets',
  'branch_protection',
  'checks_write',
  'commit_statuses_write',
  'bypass',
] as const);

export function executorPermissionMapIsConfined(
  permissions: Readonly<Record<string, unknown>>,
): boolean {
  const actual = Object.keys(permissions).sort();
  const expected = Object.keys(EXECUTOR_PERMISSION_ALLOWLIST).sort();
  return (
    actual.length === expected.length &&
    actual.every((name, index) => name === expected[index]) &&
    FORBIDDEN_EXECUTOR_PERMISSIONS.every((name) => !(name in permissions)) &&
    expected.every(
      (name) =>
        permissions[name] ===
        EXECUTOR_PERMISSION_ALLOWLIST[
          name as keyof typeof EXECUTOR_PERMISSION_ALLOWLIST
        ],
    )
  );
}

function invalid(
  reason:
    | 'signature'
    | 'subject'
    | 'digest'
    | 'completeness'
    | 'pagination'
    | 'unknown_payload_member',
): PolicyAttestationObservation {
  return { state: 'present_invalid', reason };
}

function stale(
  reason: 'not_yet_valid' | 'expired' | 'insufficient_execution_margin',
): PolicyAttestationObservation {
  return { state: 'present_valid_but_stale', reason };
}

function isRecordObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function appsAbsentFromBypass(
  apps: readonly ExecutorAppIdentity[],
  attestation: TrustedCurrentPolicyAttestation,
): boolean {
  const bypassActorIds = new Set(
    attestation.policy.bypassActors.map((actor) => actor.actorId),
  );
  return apps.every((app) => !bypassActorIds.has(app.appId));
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return actual.length === wanted.length &&
    actual.every((key, index) => key === wanted[index]);
}

function textArrayValid(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every(
    (item) => typeof item === 'string' && item.length > 0 &&
      !hasControlCharacters(item),
  );
}

function checkContextsValid(value: unknown): value is readonly {
  readonly name: string;
  readonly appId: number;
}[] {
  return Array.isArray(value) && value.length > 0 && value.every(
    (context) => isRecordObject(context) &&
      hasExactKeys(context, ['name', 'appId']) &&
      typeof context.name === 'string' && context.name.length > 0 &&
      !hasControlCharacters(context.name) &&
      Number.isSafeInteger(context.appId) && (context.appId as number) > 0,
  );
}

function policyRuleValid(value: unknown): value is GitHubPolicyRuleRecord {
  if (
    !isRecordObject(value) ||
    !hasExactKeys(value, ['ruleType', 'parameters', 'unknownFields']) ||
    !Array.isArray(value.unknownFields) || value.unknownFields.length !== 0 ||
    !isRecordObject(value.parameters)
  ) {
    return false;
  }
  const parameters = value.parameters;
  switch (value.ruleType) {
    case 'pull_request':
      return hasExactKeys(parameters, [
        'requiredApprovingReviewCount',
        'dismissStaleReviews',
        'requireCodeOwnerReview',
        'requireLastPushApproval',
      ]) &&
        Number.isSafeInteger(parameters.requiredApprovingReviewCount) &&
        (parameters.requiredApprovingReviewCount as number) >= 0 &&
        typeof parameters.dismissStaleReviews === 'boolean' &&
        typeof parameters.requireCodeOwnerReview === 'boolean' &&
        typeof parameters.requireLastPushApproval === 'boolean';
    case 'required_status_checks':
      return hasExactKeys(parameters, ['strict', 'contexts']) &&
        typeof parameters.strict === 'boolean' &&
        checkContextsValid(parameters.contexts);
    case 'enforce_admins':
      return hasExactKeys(parameters, ['enabled']) &&
        typeof parameters.enabled === 'boolean';
    case 'force_push':
    case 'deletion':
      return hasExactKeys(parameters, ['allowed']) &&
        typeof parameters.allowed === 'boolean';
    case 'required_conversation_resolution':
    case 'required_signatures':
    case 'linear_history':
      return hasExactKeys(parameters, ['required']) &&
        typeof parameters.required === 'boolean';
    default:
      return false;
  }
}

function policySourceApplicability(
  source: TrustedCurrentPolicyAttestation['policy']['policySources'][number],
  protectedRef: 'refs/heads/main',
): boolean | null {
  const include = source.conditions.refName.include;
  const exclude = source.conditions.refName.exclude;
  const supported = new Set([protectedRef, '~DEFAULT_BRANCH']);
  if (
    include.some((pattern) => !supported.has(pattern)) ||
    exclude.some((pattern) => !supported.has(pattern))
  ) {
    return null;
  }
  const included = include.includes(protectedRef) || include.includes('~DEFAULT_BRANCH');
  const excluded = exclude.includes(protectedRef) || exclude.includes('~DEFAULT_BRANCH');
  return included && !excluded;
}

/**
 * Derives the normalized effective profile from signed enumerated source rules. No
 * attestor-declared completeness or effective digest participates in this reduction.
 */
export function deriveEffectivePolicyProfile(
  attestation: TrustedCurrentPolicyAttestation,
  expectations: PolicyAttestationExpectations,
): RequiredGitHubPolicyProfile | null {
  const effectiveSources = [] as typeof attestation.policy.policySources[number][];
  for (const source of attestation.policy.policySources) {
    const applies = policySourceApplicability(source, expectations.protectedRef);
    if (applies === null) {
      return null;
    }
    if (source.enforcement === 'active' && applies) {
      effectiveSources.push(source);
    }
  }

  const rules = effectiveSources.flatMap((source) => source.rules);
  const pullRequests = rules.filter((rule) => rule.ruleType === 'pull_request');
  const checks = rules.filter((rule) => rule.ruleType === 'required_status_checks');
  const administrators = rules.filter((rule) => rule.ruleType === 'enforce_admins');
  const forcePush = rules.filter((rule) => rule.ruleType === 'force_push');
  const deletion = rules.filter((rule) => rule.ruleType === 'deletion');
  const conversations = rules.filter(
    (rule) => rule.ruleType === 'required_conversation_resolution',
  );
  const signatures = rules.filter((rule) => rule.ruleType === 'required_signatures');
  const linearHistory = rules.filter((rule) => rule.ruleType === 'linear_history');

  // HUMAN-004 requires a complete control observation, including controls whose
  // secure value is `false`. Absence must not be interpreted as an equivalent
  // disabled value because that would let an omitted linear-history observation
  // authenticate as the required profile.
  if (
    pullRequests.length === 0 ||
    checks.length === 0 ||
    administrators.length === 0 ||
    forcePush.length === 0 ||
    deletion.length === 0 ||
    conversations.length === 0 ||
    signatures.length === 0 ||
    linearHistory.length === 0
  ) {
    return null;
  }

  const requiredCheckContexts = checks
    .flatMap((rule) => rule.parameters.contexts)
    .map((context) => ({ name: context.name, expectedAppId: context.appId }))
    .sort((left, right) => left.name < right.name ? -1 : left.name > right.name ? 1 : left.expectedAppId - right.expectedAppId)
    .filter((context, index, all) =>
      index === 0 || canonicalJson(context) !== canonicalJson(all[index - 1]),
    );
  const bypassActors = effectiveSources.flatMap((source) => source.bypassActors);

  return {
    schema: 'required-github-policy-profile/v1',
    repositoryId: expectations.expectedRequiredPolicyProfile.repositoryId,
    protectedRef: expectations.protectedRef,
    requiredCheckContexts,
    // Release gates are not GitHub policy observations. They remain immutable inputs
    // from the pinned profile while every GitHub control below is source-derived.
    releaseGateRequirements:
      expectations.expectedRequiredPolicyProfile.releaseGateRequirements,
    executorApps: attestation.policy.executorApps,
    observerPrincipalSetDigest: observerPrincipalSetDigest(
      attestation.policy.observerPrincipals,
    ),
    mergeMethodsRequired: expectations.expectedMergeMethods.filter((method) =>
      attestation.policy.mergeMethodsConfigured.includes(method),
    ),
    branchControls: {
      updatesRequirePullRequest: (pullRequests.length > 0) as true,
      strictCurrentBase: (
        checks.length > 0 && checks.every((rule) => rule.parameters.strict)
      ) as true,
      enforceAdministrators: (
        administrators.length > 0 &&
        administrators.every((rule) => rule.parameters.enabled)
      ) as true,
      forcePushAllowed: (
        forcePush.length === 0 || forcePush.some((rule) => rule.parameters.allowed)
      ) as false,
      deletionAllowed: (
        deletion.length === 0 || deletion.some((rule) => rule.parameters.allowed)
      ) as false,
      minimumApprovingReviewCount: pullRequests.reduce(
        (maximum, rule) =>
          Math.max(maximum, rule.parameters.requiredApprovingReviewCount),
        0,
      ),
      dismissStaleReviews: (
        pullRequests.length > 0 &&
        pullRequests.every((rule) => rule.parameters.dismissStaleReviews)
      ) as true,
      requireCodeOwnerReview: (
        pullRequests.length > 0 &&
        pullRequests.every((rule) => rule.parameters.requireCodeOwnerReview)
      ) as true,
      requireLastPushApproval: (
        pullRequests.length > 0 &&
        pullRequests.every((rule) => rule.parameters.requireLastPushApproval)
      ) as true,
      requireConversationResolution: (
        conversations.length > 0 &&
        conversations.every((rule) => rule.parameters.required)
      ) as true,
      requireSignedCommits: (
        signatures.length > 0 &&
        signatures.every((rule) => rule.parameters.required)
      ) as true,
      linearHistoryRequired: linearHistory.some(
        (rule) => rule.parameters.required,
      ) as false,
      effectiveBypassActors: (bypassActors.length === 0 ? 'none' : 'present') as 'none',
    },
  };
}

/**
 * Normalizes one raw attestation into the closed `PolicyAttestationObservation` union.
 *
 * This is a normalization step, not a second result constructor: its output is one
 * member of `PolicyControlFacts.observation` and is only ever consumed by
 * `classifyPolicyControl`.
 */
export function normalizePolicyAttestation(
  attestation: TrustedCurrentPolicyAttestation | null | undefined,
  expectations: PolicyAttestationExpectations,
  nowUtc: string,
): PolicyAttestationObservation {
  if (!isRecordObject(attestation)) {
    return invalid('completeness');
  }
  if (attestation.schema !== 'github-current-policy-attestation/v1') {
    return invalid('completeness');
  }

  const issuer = attestation.issuer;
  if (!isRecordObject(issuer)) {
    return invalid('completeness');
  }
  if (expectations.trustRoot.acceptedSchema !== attestation.schema) {
    return invalid('signature');
  }
  if (issuer.authorityId !== expectations.trustRoot.authorityId) {
    return invalid('signature');
  }
  if (issuer.keyId !== expectations.trustRoot.keyId) {
    return invalid('signature');
  }
  if (issuer.publicKeyDigest !== expectations.trustRoot.publicKeyDigest) {
    return invalid('signature');
  }
  if (issuer.signatureAlgorithm !== 'Ed25519') {
    return invalid('signature');
  }
  if (typeof attestation.signature !== 'string' || attestation.signature === '') {
    return invalid('signature');
  }
  // The signature itself, not merely its presence. An unkeyed canonical digest is
  // integrity against accidental mutation; only this step is signer authentication.
  if (!verifyAttestationSignature(attestation, expectations.trustRoot)) {
    return invalid('signature');
  }
  if (
    !Number.isSafeInteger(issuer.policyGeneration) ||
    issuer.policyGeneration < 1
  ) {
    return invalid('completeness');
  }
  if (
    expectations.expectedPolicyGeneration !== null &&
    issuer.policyGeneration !== expectations.expectedPolicyGeneration
  ) {
    // A generation change is a policy-control symptom; the caller normalizes it into
    // `action` before classification. Here it is a subject-binding failure.
    return invalid('subject');
  }

  const subject = attestation.subject;
  if (!isRecordObject(subject)) {
    return invalid('completeness');
  }
  if (subject.githubHost !== 'github.com') {
    return invalid('subject');
  }
  if (!isRecordObject(subject.repository)) {
    return invalid('subject');
  }
  if (subject.repository.databaseId !== expectations.repositoryDatabaseId) {
    return invalid('subject');
  }
  if (subject.repository.nodeId !== expectations.repositoryNodeId) {
    return invalid('subject');
  }
  if (subject.repository.owner !== expectations.repositoryOwner) {
    return invalid('subject');
  }
  if (subject.repository.name !== expectations.repositoryName) {
    return invalid('subject');
  }
  if (subject.protectedRef !== expectations.protectedRef) {
    return invalid('subject');
  }
  if (subject.executor !== RELEASE_EXECUTOR) {
    return invalid('subject');
  }
  if (subject.pullRequestNumber !== expectations.pullRequestNumber) {
    return invalid('subject');
  }
  if (!isGitOid(subject.headOid) || subject.headOid !== expectations.headOid) {
    return invalid('subject');
  }
  if (!isGitOid(subject.baseOid) || subject.baseOid !== expectations.baseOid) {
    return invalid('subject');
  }
  if (subject.admissionContextNonce !== expectations.admissionContextNonce) {
    return invalid('subject');
  }
  if (subject.admissionContextDigest !== expectations.admissionContextDigest) {
    return invalid('subject');
  }
  if (subject.authorizationPhase !== expectations.authorizationPhase) {
    return invalid('subject');
  }
  if (!Array.isArray(subject.executorApps) || subject.executorApps.length !== 2) {
    // Both executor App identities must be present so one cannot be hidden by
    // observing only the active identity.
    return invalid('completeness');
  }
  if (
    !Array.isArray(expectations.expectedExecutorApps) ||
    expectations.expectedExecutorApps.length !== 2
  ) {
    // Without a pinned expectation there is nothing to confine the identities to.
    return invalid('completeness');
  }
  if (
    executorAppSetDigest(subject.executorApps as readonly ExecutorAppIdentity[]) !==
    executorAppSetDigest(expectations.expectedExecutorApps)
  ) {
    // Exact App IDs, installations, node IDs, slugs, and complete permission maps.
    // An augmented permission map is a different set and is rejected here.
    return invalid('subject');
  }
  if (
    !(subject.executorApps as readonly ExecutorAppIdentity[]).every((app) =>
      executorPermissionMapIsConfined(app.permissions),
    ) ||
    !expectations.expectedExecutorApps.every((app) =>
      executorPermissionMapIsConfined(app.permissions),
    )
  ) {
    return invalid('subject');
  }

  if (!isSha256Hex(attestation.policyDigest)) {
    return invalid('digest');
  }
  if (!isSha256Hex(attestation.sourceEvidenceDigest)) {
    return invalid('digest');
  }
  if (
    !Array.isArray(attestation.sourceEvidence) ||
    sha256Canonical(attestation.sourceEvidence) !== attestation.sourceEvidenceDigest ||
    sha256Canonical(attestation.policy) !== attestation.policyDigest
  ) {
    return invalid('digest');
  }
  if (!isSha256Hex(attestation.effectivePolicyProfileDigest)) {
    return invalid('digest');
  }
  if (
    !isSha256Hex(attestation.canonicalPayloadDigest) ||
    attestationPayloadDigest(attestation) !== attestation.canonicalPayloadDigest
  ) {
    return invalid('digest');
  }

  const policy = attestation.policy;
  if (
    !isRecordObject(policy) ||
    !hasExactKeys(policy, [
      'bypassActorsComplete',
      'bypassActors',
      'observerPrincipals',
      'issuerStatus',
      'paginationComplete',
      'enumeration',
      'requiredCheckSources',
      'mergeMethodsConfigured',
      'executorApps',
      'observerPrincipalSetDigest',
      'executorAppsAbsentFromBypassSets',
      'unknownPayloadMembers',
      'policySources',
      'effectiveRules',
    ])
  ) {
    return invalid('completeness');
  }
  if (
    !isRecordObject(policy.enumeration) ||
    !hasExactKeys(policy.enumeration, [
      'classicProtectionSourceId',
      'rulesetSourceLevels',
      'parentRulesetsIncluded',
      'permissionRedactions',
      'unknownPolicyKinds',
    ]) ||
    typeof policy.enumeration.classicProtectionSourceId !== 'string' ||
    policy.enumeration.classicProtectionSourceId.length === 0 ||
    !Array.isArray(policy.enumeration.rulesetSourceLevels) ||
    canonicalJson([...policy.enumeration.rulesetSourceLevels].sort()) !==
      canonicalJson(['enterprise', 'organization', 'repository']) ||
    policy.enumeration.parentRulesetsIncluded !== true ||
    !Array.isArray(policy.enumeration.permissionRedactions) ||
    policy.enumeration.permissionRedactions.length !== 0 ||
    !Array.isArray(policy.enumeration.unknownPolicyKinds) ||
    policy.enumeration.unknownPolicyKinds.length !== 0
  ) {
    return invalid('completeness');
  }
  if (
    !Array.isArray(policy.policySources) ||
    !Array.isArray(policy.effectiveRules) ||
    canonicalJson(policy.policySources) !== canonicalJson(attestation.sourceEvidence)
  ) {
    return invalid('completeness');
  }
  const validLevels = new Set([
    'classic',
    'repository',
    'organization',
    'enterprise',
  ]);
  const seenLevels = new Set<string>();
  const sourceIds = new Set<string>();
  for (const source of policy.policySources) {
    if (
      !isRecordObject(source) ||
      !hasExactKeys(source, [
        'sourceLevel',
        'sourcePolicyId',
        'parentPolicyId',
        'enforcement',
        'version',
        'target',
        'conditions',
        'rules',
        'bypassActors',
        'bypassActorsComplete',
        'permissionRedactedFields',
        'unknownFields',
        'page',
        'pageCount',
        'pages',
        'responseDigest',
      ]) ||
      !validLevels.has(source.sourceLevel) ||
      typeof source.sourcePolicyId !== 'string' ||
      source.sourcePolicyId === '' ||
      hasControlCharacters(source.sourcePolicyId) ||
      (source.parentPolicyId !== null &&
        hasControlCharacters(source.parentPolicyId)) ||
      sourceIds.has(source.sourcePolicyId) ||
      (source.enforcement !== 'active' &&
        source.enforcement !== 'evaluate' &&
        source.enforcement !== 'disabled') ||
      typeof source.version !== 'string' ||
      source.version === '' ||
      hasControlCharacters(source.version) ||
      source.target !== 'branch' ||
      !isRecordObject(source.conditions) ||
      !hasExactKeys(source.conditions, ['refName', 'unknownConditions']) ||
      !isRecordObject(source.conditions.refName) ||
      !hasExactKeys(source.conditions.refName, ['include', 'exclude']) ||
      !textArrayValid(source.conditions.refName.include) ||
      !Array.isArray(source.conditions.refName.exclude) ||
      !source.conditions.refName.exclude.every(
        (pattern) => typeof pattern === 'string' && !hasControlCharacters(pattern),
      ) ||
      !Array.isArray(source.conditions.unknownConditions) ||
      source.conditions.unknownConditions.length !== 0 ||
      !Array.isArray(source.rules) ||
      source.rules.some((rule) => !policyRuleValid(rule)) ||
      !Array.isArray(source.bypassActors) ||
      source.bypassActorsComplete !== true ||
      !Array.isArray(source.permissionRedactedFields) ||
      source.permissionRedactedFields.length !== 0 ||
      !Array.isArray(source.unknownFields) || source.unknownFields.length !== 0 ||
      !Number.isSafeInteger(source.page) ||
      !Number.isSafeInteger(source.pageCount) ||
      source.page < 1 ||
      source.pageCount < source.page ||
      !Array.isArray(source.pages) ||
      source.pages.length !== source.pageCount ||
      source.pages.some(
        (page, index) =>
          !isRecordObject(page) ||
          !hasExactKeys(page, ['page', 'responseDigest']) ||
          page.page !== index + 1 ||
          !isSha256Hex(page.responseDigest),
      ) ||
      !isSha256Hex(source.responseDigest) ||
      sha256Canonical(omitTopLevel(source, 'responseDigest')) !== source.responseDigest
    ) {
      return invalid('completeness');
    }
    sourceIds.add(source.sourcePolicyId);
    seenLevels.add(source.sourceLevel);
  }
  if ([...validLevels].some((level) => !seenLevels.has(level))) {
    return invalid('completeness');
  }
  const classic = policy.policySources.find(
    (source) => source.sourceLevel === 'classic' &&
      source.sourcePolicyId === policy.enumeration.classicProtectionSourceId,
  );
  if (classic === undefined) {
    return invalid('completeness');
  }
  for (const source of policy.policySources) {
    if (source.parentPolicyId !== null && !sourceIds.has(source.parentPolicyId)) {
      return invalid('completeness');
    }
  }
  const derivedEffectiveRules = policy.policySources
    .flatMap((source) =>
      source.rules.map((rule) => ({
        rule,
        sourcePolicyId: source.sourcePolicyId,
        sourceLevel: source.sourceLevel,
        effective: source.enforcement === 'active',
      })),
    )
    .sort((left, right) => canonicalJson(left).localeCompare(canonicalJson(right)));
  if (
    canonicalJson(derivedEffectiveRules) !==
    canonicalJson(
      [...policy.effectiveRules].sort((left, right) =>
        canonicalJson(left).localeCompare(canonicalJson(right)),
      ),
    )
  ) {
    return invalid('completeness');
  }
  const effectiveSources = policy.policySources.filter((source) =>
    source.enforcement === 'active' &&
    policySourceApplicability(source, expectations.protectedRef) === true,
  );
  if (
    policy.policySources.some(
      (source) => policySourceApplicability(source, expectations.protectedRef) === null,
    )
  ) {
    return invalid('completeness');
  }
  const derivedBypassActors = effectiveSources
    .flatMap((source) => source.bypassActors)
    .sort((left, right) => canonicalJson(left).localeCompare(canonicalJson(right)));
  if (
    !Array.isArray(policy.bypassActors) ||
    canonicalJson(derivedBypassActors) !==
    canonicalJson(
      [...policy.bypassActors].sort((left, right) =>
        canonicalJson(left).localeCompare(canonicalJson(right)),
      ),
    )
  ) {
    return invalid('completeness');
  }
  // A missing or permission-redacted bypass actor list is never an empty set.
  if (policy.bypassActorsComplete !== true) {
    return invalid('completeness');
  }
  if (!Array.isArray(policy.bypassActors)) {
    return invalid('completeness');
  }
  if (policy.observerPrincipalSetDigest !== issuer.observerPrincipalSetDigest) {
    return invalid('completeness');
  }
  // The observer set is pinned and verified, not merely claimed: its recomputed digest
  // must equal both declarations and the activation-bound expected value.
  if (!Array.isArray(policy.observerPrincipals) || policy.observerPrincipals.length === 0) {
    return invalid('completeness');
  }
  const observedPrincipalDigest = observerPrincipalSetDigest(
    policy.observerPrincipals as readonly PolicyObserverPrincipal[],
  );
  if (observedPrincipalDigest !== policy.observerPrincipalSetDigest) {
    return invalid('completeness');
  }
  if (observedPrincipalDigest !== expectations.expectedObserverPrincipalSetDigest) {
    return invalid('completeness');
  }
  if (policy.executorAppsAbsentFromBypassSets !== true) {
    return invalid('completeness');
  }
  if (!Array.isArray(policy.executorApps) || policy.executorApps.length !== 2) {
    return invalid('completeness');
  }
  if (
    executorAppSetDigest(policy.executorApps as readonly ExecutorAppIdentity[]) !==
    executorAppSetDigest(subject.executorApps as readonly ExecutorAppIdentity[])
  ) {
    // The subject App list and the observed policy App list must be identical, so one
    // cannot name a confined identity while the other observes a privileged one.
    return invalid('completeness');
  }
  if (
    !(policy.executorApps as readonly ExecutorAppIdentity[]).every((app) =>
      executorPermissionMapIsConfined(app.permissions),
    )
  ) {
    return invalid('completeness');
  }
  if (!appsAbsentFromBypass(policy.executorApps, attestation)) {
    return invalid('completeness');
  }
  if (
    !Array.isArray(policy.requiredCheckSources) ||
    sha256Canonical(
      [...(policy.requiredCheckSources as readonly { name: string; appId: number }[])]
        .map((source) => ({ name: source.name, appId: source.appId }))
        .sort((left, right) => (left.name < right.name ? -1 : left.name > right.name ? 1 : 0)),
    ) !==
      sha256Canonical(
        [...expectations.expectedRequiredCheckSources]
          .map((source) => ({ name: source.name, appId: source.appId }))
          .sort((left, right) => (left.name < right.name ? -1 : left.name > right.name ? 1 : 0)),
      )
  ) {
    // The authoritative required-check set and its publisher identities come from the
    // pinned signed profile; the observation that supplies the runs cannot declare them.
    return invalid('completeness');
  }
  if (
    !Array.isArray(policy.mergeMethodsConfigured) ||
    !policy.mergeMethodsConfigured.includes('merge') ||
    !expectations.expectedMergeMethods.every((method) =>
      (policy.mergeMethodsConfigured as readonly string[]).includes(method),
    )
  ) {
    // The release pull request needs an ordinary merge commit; an executor cannot
    // change either the repository merge method or a linear-history rule.
    return invalid('completeness');
  }
  const derivedEffectiveProfile = deriveEffectivePolicyProfile(
    attestation,
    expectations,
  );
  if (
    derivedEffectiveProfile === null ||
    sha256Canonical(derivedEffectiveProfile) !==
      expectations.requiredPolicyProfileDigest ||
    sha256Canonical(derivedEffectiveProfile) !==
      attestation.effectivePolicyProfileDigest
  ) {
    return invalid('digest');
  }
  const issuerStatus = expectations.authority.resolveIssuerStatus(
    issuer.authorityId,
    issuer.keyId,
    issuer.policyGeneration,
  );
  if (!isRecordObject(issuerStatus)) {
    return invalid('completeness');
  }
  const claimedIssuerStatus = policy.issuerStatus;
  if (
    !isRecordObject(claimedIssuerStatus) ||
    claimedIssuerStatus.channelId !== issuerStatus.channelId ||
    claimedIssuerStatus.authorityId !== issuerStatus.authorityId ||
    claimedIssuerStatus.keyId !== issuerStatus.keyId ||
    claimedIssuerStatus.publicKeyDigest !== issuerStatus.publicKeyDigest ||
    claimedIssuerStatus.policyGeneration !== issuerStatus.policyGeneration ||
    claimedIssuerStatus.state !== issuerStatus.state ||
    claimedIssuerStatus.observedAtUtc !== issuerStatus.observedAtUtc
  ) {
    return invalid('signature');
  }
  if (
    issuerStatus.channelId !== expectations.trustRoot.revocationChannelId ||
    issuerStatus.statusAuthorityId === issuer.authorityId ||
    issuerStatus.authorityId !== expectations.trustRoot.authorityId ||
    issuerStatus.keyId !== expectations.trustRoot.keyId ||
    issuerStatus.publicKeyDigest !== expectations.trustRoot.publicKeyDigest
  ) {
    return invalid('signature');
  }
  if (issuerStatus.policyGeneration !== issuer.policyGeneration) {
    return invalid('signature');
  }
  if (issuerStatus.state !== 'active') {
    // A revoked or indeterminate issuer or key is never usable, and a caller cannot
    // classify it away: this status is inside the signed canonical payload.
    return invalid('signature');
  }
  if (
    !isGitOid(issuerStatus.evidenceCommit) ||
    !isSha256Hex(issuerStatus.evidenceDigest) ||
    sha256Canonical(omitTopLevel(issuerStatus, 'evidenceDigest')) !==
      issuerStatus.evidenceDigest
  ) {
    return invalid('signature');
  }
  if (policy.paginationComplete !== true) {
    return invalid('pagination');
  }
  if (
    !Array.isArray(policy.unknownPayloadMembers) ||
    policy.unknownPayloadMembers.length > 0
  ) {
    return invalid('unknown_payload_member');
  }

  if (
    !isIsoTimestamp(attestation.observedAt) ||
    !isIsoTimestamp(attestation.issuedAt) ||
    !isIsoTimestamp(attestation.notBefore) ||
    !isIsoTimestamp(attestation.expiresAt) ||
    !isIsoTimestamp(nowUtc)
  ) {
    return invalid('completeness');
  }

  const observedAt = isoToEpochMs(attestation.observedAt);
  const issuedAt = isoToEpochMs(attestation.issuedAt);
  const notBefore = isoToEpochMs(attestation.notBefore);
  const expiresAt = isoToEpochMs(attestation.expiresAt);
  const now = isoToEpochMs(nowUtc);

  if (!(observedAt <= issuedAt)) {
    return invalid('completeness');
  }
  if (!(issuedAt < expiresAt)) {
    return invalid('completeness');
  }
  if (!(notBefore <= issuedAt)) {
    return invalid('completeness');
  }
  if (issuedAt - observedAt > POLICY_FRESHNESS_WINDOW_MS) {
    return invalid('completeness');
  }
  if (expiresAt - observedAt > POLICY_FRESHNESS_WINDOW_MS) {
    return invalid('completeness');
  }
  // The online issuer/key status must be as fresh as the observation it authorizes.
  if (!isIsoTimestamp(issuerStatus.observedAtUtc)) {
    return invalid('completeness');
  }
  const statusObservedAt = isoToEpochMs(issuerStatus.observedAtUtc as string);
  if (Math.abs(issuedAt - statusObservedAt) > POLICY_FRESHNESS_WINDOW_MS) {
    return invalid('signature');
  }

  if (now < notBefore) {
    return stale('not_yet_valid');
  }
  if (now >= expiresAt) {
    return stale('expired');
  }
  if (expiresAt - now < POLICY_EXECUTION_MARGIN_MS) {
    return stale('insufficient_execution_margin');
  }

  return { state: 'current_valid', attestation };
}
