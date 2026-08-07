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
  Sha256Hex,
  TrustedCurrentPolicyAttestation,
} from './contracts.ts';
import {
  isIsoTimestamp,
  isGitOid,
  isSha256Hex,
  isoToEpochMs,
  omitTopLevel,
  sha256Canonical,
} from './canonical-json.ts';

/**
 * `canonicalPayloadDigest` is SHA-256 over every attestation field other than
 * `signature`, and necessarily other than the digest property itself. The attestor
 * signs the canonical payload; it never signs a caller-supplied digest.
 */
export function attestationPayloadDigest(
  attestation: TrustedCurrentPolicyAttestation,
): Sha256Hex {
  const withoutSignature = omitTopLevel(attestation, 'signature');
  return sha256Canonical(omitTopLevel(withoutSignature, 'canonicalPayloadDigest'));
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

  if (!isSha256Hex(attestation.policyDigest)) {
    return invalid('digest');
  }
  if (!isSha256Hex(attestation.sourceEvidenceDigest)) {
    return invalid('digest');
  }
  if (!isSha256Hex(attestation.effectivePolicyProfileDigest)) {
    return invalid('digest');
  }
  if (
    attestation.effectivePolicyProfileDigest !==
    expectations.requiredPolicyProfileDigest
  ) {
    return invalid('digest');
  }
  if (
    !isSha256Hex(attestation.canonicalPayloadDigest) ||
    attestationPayloadDigest(attestation) !== attestation.canonicalPayloadDigest
  ) {
    return invalid('digest');
  }

  const policy = attestation.policy;
  if (!isRecordObject(policy)) {
    return invalid('completeness');
  }
  if (policy.classicProtectionComplete !== true) {
    return invalid('completeness');
  }
  if (policy.rulesetEnumerationComplete !== true) {
    return invalid('completeness');
  }
  if (policy.effectiveControlEvaluationComplete !== true) {
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
  if (policy.executorAppsAbsentFromBypassSets !== true) {
    return invalid('completeness');
  }
  if (!Array.isArray(policy.executorApps) || policy.executorApps.length !== 2) {
    return invalid('completeness');
  }
  if (!appsAbsentFromBypass(policy.executorApps, attestation)) {
    return invalid('completeness');
  }
  if (
    !Array.isArray(policy.mergeMethodsConfigured) ||
    !policy.mergeMethodsConfigured.includes('merge')
  ) {
    // The release pull request needs an ordinary merge commit; an executor cannot
    // change either the repository merge method or a linear-history rule.
    return invalid('completeness');
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
