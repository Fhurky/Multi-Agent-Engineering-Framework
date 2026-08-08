/**
 * `release-gates/v1` manifest handling.
 *
 * The manifest is a versioned immutable artifact read from the release pull request's
 * head tree, whose digest is pinned in the plan. It does not create or pass a gate; it
 * declares which already-recorded lineage-form aggregate gate evidence must be present.
 *
 * It must contain exactly one requirement for each of the seven `ReleaseGateDomain`
 * values. Each requirement is evaluated with `ExecutorGateAdmissibility`, the
 * authoritative-round rule, and `gateClass: 'aggregate'`. The withdrawn owner form is
 * invalid. `gate_passed` alone is never sufficient.
 */

import {
  RELEASE_BASE_BRANCH,
  RELEASE_GATE_DOMAINS,
  RELEASE_SOURCE_BRANCH,
} from './contracts.ts';
import type {
  ExecutorGateAdmissibility,
  GitOid,
  ImmutableAggregateGateSnapshot,
  MergeRefusalCode,
  ReleaseGateDomain,
  ReleaseGateManifest,
  ReleaseGateRequirement,
  ReleaseSecurityFinding,
} from './contracts.ts';
import { isGitOid, isSha256Hex } from './canonical-json.ts';
import { evaluateRelation, resolveAuthoritativeRound } from './gate-admissibility.ts';

export type ManifestValidation =
  | { readonly status: 'valid'; readonly manifest: ReleaseGateManifest }
  | {
      readonly status: 'invalid';
      readonly code: 'ReleaseManifestInvalid';
      readonly reason: string;
    }
  | {
      readonly status: 'domain_missing';
      readonly code: 'ReleaseGateDomainMissing';
      readonly domain: ReleaseGateDomain;
    };

function isRecordObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function invalid(reason: string): ManifestValidation {
  return { status: 'invalid', code: 'ReleaseManifestInvalid', reason };
}

/**
 * Total structural validation. A missing domain is reported with its own dedicated
 * code; every other shape defect is `ReleaseManifestInvalid`.
 */
export function validateReleaseManifest(
  manifest: ReleaseGateManifest | null | undefined,
): ManifestValidation {
  if (!isRecordObject(manifest)) {
    return invalid('manifest_absent');
  }

  const record = manifest as unknown as Record<string, unknown>;

  if (record['schema'] !== 'release-gates/v1') {
    return invalid('schema_mismatch');
  }
  if (typeof record['repositoryId'] !== 'string' || record['repositoryId'] === '') {
    return invalid('repository_id_missing');
  }
  if (record['sourceBranch'] !== RELEASE_SOURCE_BRANCH) {
    return invalid('source_branch_mismatch');
  }
  if (record['baseBranch'] !== RELEASE_BASE_BRANCH) {
    return invalid('base_branch_mismatch');
  }
  // `mergeMethod` is deliberately NOT validated here. A manifest that names another
  // method is refused by the immutable-identity phase with the dedicated
  // `MergeMethodMismatch` code rather than being folded into a shape defect.
  if (!isGitOid(record['sourceOid'])) {
    return invalid('source_oid_not_immutable');
  }
  if (!isGitOid(record['baseOid'])) {
    return invalid('base_oid_not_immutable');
  }
  if (!isSha256Hex(record['integrationEvidenceSetDigest'])) {
    return invalid('integration_evidence_set_digest_invalid');
  }
  if (!isSha256Hex(record['publishedHeadEvidenceDigest'])) {
    return invalid('published_head_evidence_digest_invalid');
  }
  if (!isGitOid(record['integrationInitialTreeOid'])) {
    return invalid('integration_initial_tree_not_immutable');
  }

  const inventory = record['integrationUnitInventory'];
  if (!Array.isArray(inventory) || inventory.length === 0) {
    return invalid('integration_unit_inventory_missing');
  }
  const inventoryIds = new Set<string>();
  const inventoryOrderKeys = new Set<string>();
  for (const entry of inventory as readonly unknown[]) {
    if (!isRecordObject(entry)) {
      return invalid('integration_unit_inventory_entry_invalid');
    }
    if (typeof entry['unitId'] !== 'string' || entry['unitId'] === '') {
      return invalid('integration_unit_inventory_unit_id_missing');
    }
    if (typeof entry['orderKey'] !== 'string' || entry['orderKey'] === '') {
      return invalid('integration_unit_inventory_order_key_missing');
    }
    if (
      entry['unitKind'] !== 'ordinary-task' &&
      entry['unitKind'] !== 'cumulative-lineage'
    ) {
      return invalid('integration_unit_inventory_kind_invalid');
    }
    if (
      entry['proof'] !== 'content-merged' &&
      entry['proof'] !== 'lineage-subsumed'
    ) {
      return invalid('integration_unit_inventory_proof_invalid');
    }
    if (inventoryIds.has(entry['unitId'])) {
      return invalid('integration_unit_inventory_duplicate_unit');
    }
    inventoryIds.add(entry['unitId']);
    if (inventoryOrderKeys.has(entry['orderKey'])) {
      return invalid('integration_unit_inventory_duplicate_order_key');
    }
    inventoryOrderKeys.add(entry['orderKey']);
  }

  const coupling = record['irreversibleProductionCoupling'];
  if (!isRecordObject(coupling)) {
    return invalid('irreversible_production_coupling_missing');
  }
  if (coupling['coupled'] !== true && coupling['coupled'] !== false) {
    return invalid('irreversible_production_coupling_invalid');
  }
  if (coupling['coupled'] === true && !isGitOid(coupling['policyCommit'])) {
    return invalid('irreversible_production_policy_commit_not_immutable');
  }

  const requirements = record['requirements'];
  if (!Array.isArray(requirements)) {
    return invalid('requirements_missing');
  }

  const seen = new Map<string, number>();
  for (const entry of requirements as readonly unknown[]) {
    if (!isRecordObject(entry)) {
      return invalid('requirement_not_an_object');
    }
    const requirement = entry as unknown as ReleaseGateRequirement;
    if (
      typeof requirement.domain !== 'string' ||
      !(RELEASE_GATE_DOMAINS as readonly string[]).includes(requirement.domain)
    ) {
      return invalid('requirement_domain_unknown');
    }
    // A point gate never satisfies a release aggregate requirement.
    if (requirement.gateClass !== 'aggregate') {
      return invalid('requirement_gate_class_not_aggregate');
    }
    if (typeof requirement.lineage !== 'string' || requirement.lineage === '') {
      return invalid('requirement_lineage_missing');
    }
    if (
      !Number.isSafeInteger(requirement.minimumRound) ||
      requirement.minimumRound < 1
    ) {
      return invalid('requirement_minimum_round_invalid');
    }
    seen.set(requirement.domain, (seen.get(requirement.domain) ?? 0) + 1);
  }

  for (const [domain, count] of seen) {
    if (count > 1) {
      return invalid(`requirement_domain_duplicated:${domain}`);
    }
  }

  for (const domain of RELEASE_GATE_DOMAINS) {
    if (!seen.has(domain)) {
      return { status: 'domain_missing', code: 'ReleaseGateDomainMissing', domain };
    }
  }

  return { status: 'valid', manifest: manifest as ReleaseGateManifest };
}

export interface ReleaseGateDomainResult {
  readonly domain: ReleaseGateDomain;
  readonly admissibility: ExecutorGateAdmissibility;
}

export type ReleaseGateEvaluation =
  | {
      readonly status: 'admissible';
      readonly results: readonly ReleaseGateDomainResult[];
    }
  | {
      readonly status: 'not_admissible';
      readonly domain: ReleaseGateDomain;
      readonly code: MergeRefusalCode;
    };

/**
 * Evaluates the seven aggregate requirements in the declared domain order.
 *
 * Refusal-code mapping, stated explicitly so the exhaustive table can assert it:
 *
 *   no relation for the lineage / incomplete relation set / open / pending
 *       -> PreMergeGateOpen
 *   authoritative round below the declared minimum, point-class relation, or the
 *   withdrawn owner form
 *       -> ReleaseGateNotPassing
 *   changes_required, failed, generic formal acceptance, or formal acceptance of a
 *   non-security gate
 *       -> PreMergeGateNotPassing
 *   accepted-risk evidence that is incomplete, extra, unmatched, Low/Medium, bound to
 *   a mutable ref, or scoped to another predicate
 *       -> SecurityRiskAcceptanceInvalid
 */
export function evaluateReleaseGates(
  manifest: ReleaseGateManifest,
  snapshot: ImmutableAggregateGateSnapshot,
  securityFindings: readonly ReleaseSecurityFinding[],
  releaseTargetCommit: GitOid,
): ReleaseGateEvaluation {
  const results: ReleaseGateDomainResult[] = [];

  for (const domain of RELEASE_GATE_DOMAINS) {
    const requirement = manifest.requirements.find(
      (candidate) => candidate.domain === domain,
    );

    if (requirement === undefined) {
      return { status: 'not_admissible', domain, code: 'ReleaseGateDomainMissing' };
    }

    const resolution = resolveAuthoritativeRound(snapshot, requirement.lineage, domain);

    if (resolution.status === 'invalid_relation') {
      // A relation in the claimed complete set is malformed or names a mutable verdict
      // ref: the set is not authoritative passing evidence.
      return { status: 'not_admissible', domain, code: 'PreMergeGateNotPassing' };
    }
    if (resolution.status === 'ambiguous') {
      // Conflicting relations at one authoritative round leave the round unclosed.
      return { status: 'not_admissible', domain, code: 'PreMergeGateOpen' };
    }
    if (resolution.status !== 'resolved') {
      return { status: 'not_admissible', domain, code: 'PreMergeGateOpen' };
    }

    if (resolution.round < requirement.minimumRound) {
      // Stale round: the greatest contiguous authoritative round is below the floor
      // the manifest declares.
      return { status: 'not_admissible', domain, code: 'ReleaseGateNotPassing' };
    }

    const relation = resolution.relation;

    if (relation.gateClass !== 'aggregate') {
      return { status: 'not_admissible', domain, code: 'ReleaseGateNotPassing' };
    }

    if (relation.ownerForm === true) {
      // The owner form of `gate_passed` is withdrawn, not merely discouraged.
      return { status: 'not_admissible', domain, code: 'ReleaseGateNotPassing' };
    }

    const admissibility = evaluateRelation(
      relation,
      securityFindings,
      releaseTargetCommit,
    );

    if (admissibility.status === 'not_admissible') {
      return { status: 'not_admissible', domain, code: admissibility.code };
    }

    results.push({ domain, admissibility });
  }

  return { status: 'admissible', results };
}
