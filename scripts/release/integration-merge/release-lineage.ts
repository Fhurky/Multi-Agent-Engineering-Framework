/**
 * Release integration-evidence transaction.
 *
 * The release executor may accept integration history produced by the activated
 * runtime executor, by the bounded legacy operator path, or by a mixture. It never
 * trusts producer identity alone: for every content unit the source OID, resulting
 * tree OID, order key, merge method, gate snapshot, and direct or lineage-subsumed
 * proof must be present and valid. A branch tip without the complete evidence set
 * refuses.
 *
 * Folding the records in ascending `IntegrationOrderKey` must yield the pinned
 * integration head tree, with no predecessor missing, no unit appearing twice, and
 * ADR-0041's cumulative-unit rule intact.
 */

import { isGitOid, isSha256Hex, sha256Canonical } from './canonical-json.ts';
import type {
  GitOid,
  IntegrationUnitEvidence,
  MergeRefusalCode,
  Sha256Hex,
} from './contracts.ts';

export type ReleaseLineageValidation =
  | {
      readonly status: 'complete';
      readonly orderedUnits: readonly IntegrationUnitEvidence[];
      readonly foldedTreeOid: GitOid;
      readonly evidenceSetDigest: Sha256Hex;
    }
  | {
      readonly status: 'refused';
      readonly code: MergeRefusalCode;
      readonly reason: string;
      readonly unitId: string | null;
    };

function refuse(
  code: MergeRefusalCode,
  reason: string,
  unitId: string | null,
): ReleaseLineageValidation {
  return { status: 'refused', code, reason, unitId };
}

function isRecordObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Canonical digest over the ascending-ordered evidence set. */
export function integrationEvidenceSetDigest(
  units: readonly IntegrationUnitEvidence[],
): Sha256Hex {
  const ordered = [...units].sort((left, right) =>
    left.orderKey < right.orderKey ? -1 : left.orderKey > right.orderKey ? 1 : 0,
  );
  return sha256Canonical(
    ordered.map((unit) => ({
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
    })),
  );
}

/**
 * Validates the complete integration evidence set and folds it.
 *
 * @param units                the observed evidence set, in any array order
 * @param integrationHeadTree  the tree of the pinned `sourceOid`
 * @param pinnedSetDigest      `ReleaseGateManifest.integrationEvidenceSetDigest`
 */
export function validateReleaseLineage(
  units: readonly IntegrationUnitEvidence[],
  integrationHeadTree: GitOid,
  pinnedSetDigest: Sha256Hex,
): ReleaseLineageValidation {
  if (!Array.isArray(units) || units.length === 0) {
    return refuse(
      'IntegrationEvidenceIncomplete',
      'evidence_set_empty',
      null,
    );
  }

  for (const unit of units) {
    if (!isRecordObject(unit)) {
      return refuse('IntegrationEvidenceIncomplete', 'unit_not_an_object', null);
    }
    const id = typeof unit.unitId === 'string' ? unit.unitId : null;

    if (id === null || id === '') {
      return refuse('IntegrationEvidenceIncomplete', 'unit_id_missing', null);
    }
    if (unit.unitKind !== 'ordinary-task' && unit.unitKind !== 'cumulative-lineage') {
      return refuse('IntegrationEvidenceIncomplete', 'unit_kind_invalid', id);
    }
    if (typeof unit.orderKey !== 'string' || unit.orderKey === '') {
      return refuse('IntegrationEvidenceIncomplete', 'order_key_missing', id);
    }
    if (unit.proof !== 'content-merged' && unit.proof !== 'lineage-subsumed') {
      return refuse('IntegrationEvidenceIncomplete', 'proof_invalid', id);
    }
    if (
      unit.producer !== 'runtime_executor' &&
      unit.producer !== 'legacy_operator'
    ) {
      return refuse('IntegrationEvidenceIncomplete', 'producer_invalid', id);
    }
    if (!isGitOid(unit.sourceOid)) {
      return refuse('IntegrationEvidenceIncomplete', 'source_oid_not_immutable', id);
    }
    if (unit.mergeMethod !== 'squash') {
      return refuse('IntegrationEvidenceIncomplete', 'merge_method_invalid', id);
    }
    if (!isSha256Hex(unit.gateSnapshotDigest)) {
      return refuse(
        'IntegrationEvidenceIncomplete',
        'gate_snapshot_digest_invalid',
        id,
      );
    }
    if (!isGitOid(unit.resultTreeOid)) {
      return refuse('IntegrationEvidenceIncomplete', 'result_tree_not_immutable', id);
    }
    if (unit.verified !== true) {
      return refuse('IntegrationEvidenceIncomplete', 'unit_unverifiable', id);
    }
    if (unit.proof === 'lineage-subsumed') {
      if (typeof unit.subsumedBy !== 'string' || unit.subsumedBy === '') {
        return refuse(
          'IntegrationEvidenceIncomplete',
          'subsumed_unit_names_no_content_unit',
          id,
        );
      }
    }
    else if (unit.subsumedBy !== null) {
      return refuse(
        'IntegrationEvidenceIncomplete',
        'content_unit_declares_subsumption',
        id,
      );
    }
  }

  const byId = new Set<string>();
  const byOrderKey = new Set<string>();
  for (const unit of units) {
    if (byId.has(unit.unitId)) {
      return refuse('IntegrationOrderViolation', 'duplicate_unit', unit.unitId);
    }
    byId.add(unit.unitId);

    if (byOrderKey.has(unit.orderKey)) {
      return refuse('IntegrationOrderViolation', 'duplicate_order_key', unit.unitId);
    }
    byOrderKey.add(unit.orderKey);
  }

  // ADR-0041: a subsumed predecessor contributes no Git content and must name a
  // content unit that is actually present in the same set.
  for (const unit of units) {
    if (unit.proof !== 'lineage-subsumed') {
      continue;
    }
    const target = units.find(
      (candidate) =>
        candidate.unitId === unit.subsumedBy && candidate.proof === 'content-merged',
    );
    if (target === undefined) {
      return refuse(
        'IntegrationEvidenceIncomplete',
        'subsuming_content_unit_absent',
        unit.unitId,
      );
    }
  }

  const ordered = [...units].sort((left, right) =>
    left.orderKey < right.orderKey ? -1 : left.orderKey > right.orderKey ? 1 : 0,
  );

  const contentUnits = ordered.filter((unit) => unit.proof === 'content-merged');

  if (contentUnits.length === 0) {
    return refuse(
      'IntegrationEvidenceIncomplete',
      'no_content_unit_in_evidence_set',
      null,
    );
  }

  let previousTree: GitOid | null = null;
  for (let index = 0; index < contentUnits.length; index += 1) {
    const unit = contentUnits[index] as IntegrationUnitEvidence;

    if (index === 0) {
      // The first content unit establishes the lineage base tree.
      if (unit.previousResultTreeOid !== null && !isGitOid(unit.previousResultTreeOid)) {
        return refuse(
          'IntegrationEvidenceIncomplete',
          'lineage_base_tree_not_immutable',
          unit.unitId,
        );
      }
    }
    else if (unit.previousResultTreeOid !== previousTree) {
      // A missing predecessor or a reordered chain breaks tree continuity.
      return refuse(
        'IntegrationOrderViolation',
        'evidence_chain_discontinuous',
        unit.unitId,
      );
    }

    previousTree = unit.resultTreeOid;
  }

  if (previousTree !== integrationHeadTree) {
    return refuse(
      'ExpectedTreeMismatch',
      'folded_tree_does_not_equal_integration_head_tree',
      null,
    );
  }

  const digest = integrationEvidenceSetDigest(units);
  if (digest !== pinnedSetDigest) {
    return refuse(
      'IntegrationEvidenceIncomplete',
      'evidence_set_digest_mismatch',
      null,
    );
  }

  return {
    status: 'complete',
    orderedUnits: ordered,
    foldedTreeOid: previousTree,
    evidenceSetDigest: digest,
  };
}
