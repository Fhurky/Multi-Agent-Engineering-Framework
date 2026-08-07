/**
 * `ExecutorGateAdmissibility` — executor-local, stricter than generic graph
 * satisfaction.
 *
 * `gate_passed` from the task graph is an input fact for graph and lifecycle
 * compatibility. It is never sufficient to construct an executor plan. This module
 * derives the closed result below from the complete authoritative relation set, and
 * the same exhaustive rule applies to every one of the seven release aggregate gates.
 *
 * The `accepted_security_risk` alternative exists only for HUMAN-004's first
 * exception. The executor cannot author or broaden it.
 */

import { isGitOid, isSha256Hex, sha256Canonical } from './canonical-json.ts';
import type {
  AcceptedBlockingSecurityRiskRecord,
  AggregateGateRelation,
  ExecutorGateAdmissibility,
  GateLineageId,
  GateName,
  GitOid,
  ImmutableAggregateGateSnapshot,
  ReleaseSecurityFinding,
  Sha256Hex,
} from './contracts.ts';

/** Resolution of the authoritative round for one lineage and gate. */
export type AuthoritativeRoundResolution =
  | {
      readonly status: 'resolved';
      readonly round: number;
      readonly relation: AggregateGateRelation;
    }
  | { readonly status: 'no_relation' }
  | { readonly status: 'not_contiguous'; readonly observedRounds: readonly number[] };

/**
 * The authoritative round is the greatest contiguous round declared for the lineage
 * and gate, counting from round 1. A round declared above a gap is not authoritative,
 * because the relation set between it and the floor is not complete.
 */
export function resolveAuthoritativeRound(
  snapshot: ImmutableAggregateGateSnapshot,
  lineage: GateLineageId,
  gate: GateName,
): AuthoritativeRoundResolution {
  const matching = snapshot.relations.filter(
    (relation) => relation.lineage === lineage && relation.gate === gate,
  );

  if (matching.length === 0) {
    return { status: 'no_relation' };
  }

  const rounds = [...new Set(matching.map((relation) => relation.lineageRound))].sort(
    (left, right) => left - right,
  );

  let greatestContiguous = 0;
  for (let expected = 1; expected <= rounds.length; expected += 1) {
    if (rounds[expected - 1] === expected) {
      greatestContiguous = expected;
      continue;
    }
    break;
  }

  if (greatestContiguous === 0) {
    return { status: 'not_contiguous', observedRounds: rounds };
  }

  const relation = matching.find(
    (candidate) => candidate.lineageRound === greatestContiguous,
  );

  if (relation === undefined) {
    return { status: 'not_contiguous', observedRounds: rounds };
  }

  return { status: 'resolved', round: greatestContiguous, relation };
}

/**
 * The exact scope an `accepted-blocking-security-risk/v1` record may discharge.
 * A record whose `acceptanceScopeDigest` differs purports to waive something other
 * than the named finding on the named target, and is invalid.
 */
export function expectedAcceptanceScopeDigest(
  finding: ReleaseSecurityFinding,
): Sha256Hex {
  return sha256Canonical({
    schema: 'accepted-blocking-security-risk/v1',
    findingId: finding.findingId,
    findingSeverity: finding.severity,
    findingEvidenceDigest: finding.evidenceDigest,
    targetCommit: finding.targetCommit,
    securityLineage: finding.securityLineage,
    securityLineageRound: finding.securityLineageRound,
    securityVerdictCommit: finding.securityVerdictCommit,
  });
}

/** Unresolved blocking High or Critical findings that apply to the release target. */
export function matchingBlockingFindings(
  findings: readonly ReleaseSecurityFinding[],
  releaseTargetCommit: GitOid,
): readonly ReleaseSecurityFinding[] {
  return findings.filter(
    (finding) =>
      finding.resolved === false &&
      finding.appliesToRelease === true &&
      (finding.severity === 'high' || finding.severity === 'critical') &&
      finding.targetCommit === releaseTargetCommit,
  );
}

function recordBindsFinding(
  record: AcceptedBlockingSecurityRiskRecord,
  finding: ReleaseSecurityFinding,
  relation: AggregateGateRelation,
): boolean {
  if (record.schema !== 'accepted-blocking-security-risk/v1') {
    return false;
  }
  // A mutable ref where the contract requires an immutable commit is invalid.
  if (
    !isGitOid(record.recordCommit) ||
    !isGitOid(record.acceptanceDecisionCommit) ||
    !isGitOid(record.targetCommit) ||
    !isGitOid(record.securityVerdictCommit)
  ) {
    return false;
  }
  if (record.acceptedBy === undefined || record.acceptedBy === null) {
    return false;
  }
  if (record.acceptedBy.principalType !== 'human') {
    return false;
  }
  if (!isGitOid(record.acceptedBy.authorizationCommit)) {
    return false;
  }
  if (record.findingSeverity !== 'high' && record.findingSeverity !== 'critical') {
    return false;
  }
  if (record.findingId !== finding.findingId) {
    return false;
  }
  if (record.findingSeverity !== finding.severity) {
    return false;
  }
  if (!isSha256Hex(record.findingEvidenceDigest)) {
    return false;
  }
  if (record.findingEvidenceDigest !== finding.evidenceDigest) {
    return false;
  }
  if (record.targetCommit !== finding.targetCommit) {
    return false;
  }
  if (record.securityLineage !== finding.securityLineage) {
    return false;
  }
  if (record.securityLineageRound !== finding.securityLineageRound) {
    return false;
  }
  if (record.securityVerdictCommit !== finding.securityVerdictCommit) {
    return false;
  }
  if (record.securityLineage !== relation.lineage) {
    return false;
  }
  if (record.securityLineageRound !== relation.lineageRound) {
    return false;
  }
  if (record.securityVerdictCommit !== relation.verdictCommit) {
    return false;
  }
  if (record.acceptanceScopeDigest !== expectedAcceptanceScopeDigest(finding)) {
    return false;
  }
  return true;
}

/**
 * Evaluates one authoritative relation.
 *
 * `changes_required`, `failed`, `pending`, `open`, a missing or partially closed
 * relation set, a generic `formally_accepted`, and every formal acceptance for a
 * non-security gate are not admissible. Only an exact, complete, immutable,
 * authorized-human accepted-risk set on a security relation is the alternative.
 */
export function evaluateRelation(
  relation: AggregateGateRelation,
  securityFindings: readonly ReleaseSecurityFinding[],
  releaseTargetCommit: GitOid,
): ExecutorGateAdmissibility {
  if (relation.relationSetComplete !== true) {
    return { status: 'not_admissible', code: 'PreMergeGateOpen' };
  }

  if (relation.verdictState === 'open' || relation.verdictState === 'pending') {
    return { status: 'not_admissible', code: 'PreMergeGateOpen' };
  }

  if (relation.verdictState === 'passing') {
    return {
      status: 'passing',
      gate: relation.gate,
      lineage: relation.lineage,
      lineageRound: relation.lineageRound,
      authoritativeVerdictCommit: relation.verdictCommit,
    };
  }

  if (relation.verdictState !== 'formally_accepted') {
    // `changes_required` and `failed`.
    return { status: 'not_admissible', code: 'PreMergeGateNotPassing' };
  }

  // Every formal acceptance for a non-security gate is inadmissible.
  if (relation.gate !== 'security') {
    return { status: 'not_admissible', code: 'PreMergeGateNotPassing' };
  }

  const records = relation.acceptedRisks;

  // A bare generic formal acceptance carries no accepted-risk record at all.
  if (records.length === 0) {
    return { status: 'not_admissible', code: 'PreMergeGateNotPassing' };
  }

  const matching = matchingBlockingFindings(securityFindings, releaseTargetCommit);

  // An extra record: acceptance evidence exists for something that is not a matching
  // unresolved blocking finding.
  if (records.length !== matching.length) {
    return { status: 'not_admissible', code: 'SecurityRiskAcceptanceInvalid' };
  }

  const consumed = new Set<string>();
  for (const finding of matching) {
    const record = records.find(
      (candidate) =>
        !consumed.has(candidate.recordCommit) &&
        recordBindsFinding(candidate, finding, relation),
    );
    if (record === undefined) {
      return { status: 'not_admissible', code: 'SecurityRiskAcceptanceInvalid' };
    }
    consumed.add(record.recordCommit);
  }

  if (consumed.size !== records.length) {
    return { status: 'not_admissible', code: 'SecurityRiskAcceptanceInvalid' };
  }

  return {
    status: 'accepted_security_risk',
    gate: 'security',
    lineage: relation.lineage,
    lineageRound: relation.lineageRound,
    authoritativeVerdictState: 'formally_accepted',
    authoritativeVerdictCommit: relation.verdictCommit,
    acceptedRisks: records,
  };
}
