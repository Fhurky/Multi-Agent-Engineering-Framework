/**
 * Release lineage fixtures.
 *
 * Runtime, operator, and mixed provenance are accepted only when every content unit
 * carries equivalent immutable evidence. Any missing, duplicate, reordered, or
 * unverifiable unit refuses. Producer identity alone is never sufficient.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { admit } from './helpers/admission.ts';
import {
  integrationEvidenceSetDigest,
  validateReleaseLineage,
} from '../release-lineage.ts';
import type { IntegrationUnitEvidence } from '../contracts.ts';
import { RecordingMergePort } from './helpers/fakes.ts';
import {
  HEAD_TREE_OID,
  INTERMEDIATE_TREE_OID,
  digest,
  initialTreeFor,
  inventoryFor,
  oid,
  validIntegrationEvidence,
  validManifest,
  validScenario,
} from './helpers/fixtures.ts';

function admitWithEvidence(units: readonly IntegrationUnitEvidence[]): string {
  const port = new RecordingMergePort();
  const result = admit(
    validScenario({
      integrationEvidence: units,
      manifest: validManifest({
        integrationEvidenceSetDigest: integrationEvidenceSetDigest(units),
        // An empty evidence set keeps the pinned inventory of the real release so the
        // lineage predicate, not the manifest shape, owns the empty-set case.
        integrationUnitInventory:
          units.length === 0
            ? inventoryFor(validIntegrationEvidence())
            : inventoryFor(units),
        integrationInitialTreeOid: initialTreeFor(units),
      }),
    }),
  );
  assert.equal(port.callCount, 0);
  if (result.status === 'admitted') {
    return 'admitted';
  }
  if (result.status !== 'refused') {
    return 'human_exception_required';
  }
  assert.ok(!('plan' in result));
  return result.refusal.code;
}

test('mixed runtime and operator provenance is accepted with equivalent evidence', () => {
  const units = validIntegrationEvidence();
  const producers = new Set(units.map((unit) => unit.producer));
  assert.ok(producers.has('runtime_executor'));
  assert.ok(producers.has('legacy_operator'));
  assert.equal(admitWithEvidence(units), 'admitted');
});

test('wholly operator-produced evidence is accepted when every unit is equivalent', () => {
  const units = validIntegrationEvidence().map((unit) => ({
    ...unit,
    producer: 'legacy_operator' as const,
  }));
  assert.equal(admitWithEvidence(units), 'admitted');
});

test('wholly runtime-produced evidence is accepted when every unit is equivalent', () => {
  const units = validIntegrationEvidence().map((unit) => ({
    ...unit,
    producer: 'runtime_executor' as const,
  }));
  assert.equal(admitWithEvidence(units), 'admitted');
});

test('a missing predecessor breaks the fold and refuses', () => {
  const units = validIntegrationEvidence().filter(
    (unit) => unit.unitId !== 'LIN-ARCH-REVIEW',
  );
  // The subsumed unit now names an absent content unit.
  assert.equal(admitWithEvidence(units), 'IntegrationEvidenceIncomplete');
});

test('a missing intermediate content unit refuses with IntegrationOrderViolation', () => {
  const units: IntegrationUnitEvidence[] = [
    {
      unitKind: 'ordinary-task',
      unitId: 'TASK-003',
      orderKey: '0001',
      proof: 'content-merged',
      producer: 'runtime_executor',
      sourceOid: oid('task-003-source'),
      mergeMethod: 'squash',
      gateSnapshotDigest: digest('task-003-gates'),
      previousResultTreeOid: oid('lineage-base'),
      resultTreeOid: oid('tree-after-003'),
      subsumedBy: null,
      verified: true,
    },
    {
      unitKind: 'ordinary-task',
      unitId: 'TASK-005',
      orderKey: '0003',
      proof: 'content-merged',
      producer: 'runtime_executor',
      sourceOid: oid('task-005-source'),
      mergeMethod: 'squash',
      gateSnapshotDigest: digest('task-005-gates'),
      // Names the tree of the absent TASK-004 unit.
      previousResultTreeOid: oid('tree-after-004'),
      resultTreeOid: HEAD_TREE_OID,
      subsumedBy: null,
      verified: true,
    },
  ];
  assert.equal(admitWithEvidence(units), 'IntegrationOrderViolation');
});

test('a duplicated unit refuses with IntegrationOrderViolation', () => {
  const units = validIntegrationEvidence();
  const first = units[0];
  assert.ok(first !== undefined);
  assert.equal(
    admitWithEvidence([...units, { ...first, orderKey: '0004' }]),
    'IntegrationOrderViolation',
  );
});

test('a duplicated order key refuses with IntegrationOrderViolation', () => {
  const units = validIntegrationEvidence();
  const first = units[0];
  assert.ok(first !== undefined);
  assert.equal(
    admitWithEvidence([...units, { ...first, unitId: 'TASK-DUP' }]),
    'IntegrationOrderViolation',
  );
});

test('a reordered chain refuses with IntegrationOrderViolation', () => {
  const units = validIntegrationEvidence().map((unit) => {
    if (unit.unitId === 'LIN-ARCH-REVIEW') {
      return { ...unit, orderKey: '0002' };
    }
    if (unit.unitId === 'TASK-018') {
      return { ...unit, orderKey: '0001' };
    }
    return unit;
  });
  assert.equal(admitWithEvidence(units), 'IntegrationOrderViolation');
});

test('an unverifiable unit refuses with IntegrationEvidenceIncomplete', () => {
  const units = validIntegrationEvidence().map((unit) =>
    unit.unitId === 'TASK-018' ? { ...unit, verified: false } : unit,
  );
  assert.equal(admitWithEvidence(units), 'IntegrationEvidenceIncomplete');
});

test('a mutable source identity refuses with IntegrationEvidenceIncomplete', () => {
  const units = validIntegrationEvidence().map((unit) =>
    unit.unitId === 'TASK-018'
      ? { ...unit, sourceOid: 'agent/claude/devops/task-018' }
      : unit,
  );
  assert.equal(admitWithEvidence(units), 'IntegrationEvidenceIncomplete');
});

test('a merge method other than squash refuses', () => {
  const units = validIntegrationEvidence().map((unit) =>
    unit.unitId === 'TASK-018'
      ? { ...unit, mergeMethod: 'merge' as never }
      : unit,
  );
  assert.equal(admitWithEvidence(units), 'IntegrationEvidenceIncomplete');
});

test('a subsumed unit naming no content unit refuses', () => {
  const units = validIntegrationEvidence().map((unit) =>
    unit.proof === 'lineage-subsumed' ? { ...unit, subsumedBy: null } : unit,
  );
  assert.equal(admitWithEvidence(units), 'IntegrationEvidenceIncomplete');
});

test('a subsumed unit naming an absent content unit refuses', () => {
  const units = validIntegrationEvidence().map((unit) =>
    unit.proof === 'lineage-subsumed'
      ? { ...unit, subsumedBy: 'LIN-DOES-NOT-EXIST' }
      : unit,
  );
  assert.equal(admitWithEvidence(units), 'IntegrationEvidenceIncomplete');
});

test('ADR-0041 subsumed units contribute no Git content to the fold', () => {
  const withSubsumed = validateReleaseLineage(
    validIntegrationEvidence(),
    HEAD_TREE_OID,
    integrationEvidenceSetDigest(validIntegrationEvidence()),
    inventoryFor(validIntegrationEvidence()),
    initialTreeFor(validIntegrationEvidence()),
  );
  const withoutSubsumed = validIntegrationEvidence().filter(
    (unit) => unit.proof !== 'lineage-subsumed',
  );
  const foldOnly = validateReleaseLineage(
    withoutSubsumed,
    HEAD_TREE_OID,
    integrationEvidenceSetDigest(withoutSubsumed),
    inventoryFor(withoutSubsumed),
    initialTreeFor(withoutSubsumed),
  );

  assert.equal(withSubsumed.status, 'complete');
  assert.equal(foldOnly.status, 'complete');
  if (withSubsumed.status !== 'complete' || foldOnly.status !== 'complete') {
    return;
  }
  assert.equal(withSubsumed.foldedTreeOid, foldOnly.foldedTreeOid);
  assert.equal(withSubsumed.foldedTreeOid, HEAD_TREE_OID);
});

test('a branch tip without the complete evidence set refuses', () => {
  assert.equal(admitWithEvidence([]), 'IntegrationEvidenceIncomplete');
});

test('a folded tree other than the integration head tree refuses', () => {
  const units = validIntegrationEvidence().map((unit) =>
    unit.unitId === 'TASK-018'
      ? { ...unit, resultTreeOid: oid('some-other-tree') }
      : unit,
  );
  assert.equal(admitWithEvidence(units), 'ExpectedTreeMismatch');
});

test('an evidence set digest other than the pinned value refuses', () => {
  const units = validIntegrationEvidence();
  const result = admit(
    validScenario({
      integrationEvidence: units,
      manifest: validManifest({
        integrationEvidenceSetDigest: digest('another-evidence-set'),
      }),
    }),
  );
  assert.equal(result.status, 'refused');
  if (result.status !== 'refused') {
    return;
  }
  assert.equal(result.refusal.code, 'IntegrationEvidenceIncomplete');
});

test('the evidence set digest is order-independent over the same set', () => {
  const units = validIntegrationEvidence();
  const reversed = [...units].reverse();
  assert.equal(
    integrationEvidenceSetDigest(units),
    integrationEvidenceSetDigest(reversed),
  );
});

test('main must be an ancestor of the integration head', () => {
  const result = admit(
    validScenario({
      pullRequest: {
        ...validScenario().pullRequest,
        baseIsAncestorOfHead: false,
      },
    }),
  );
  assert.equal(result.status, 'refused');
  if (result.status !== 'refused') {
    return;
  }
  assert.equal(result.refusal.code, 'IntegrationOrderViolation');
});

test('the intermediate fold tree is exercised by the fixture chain', () => {
  const units = validIntegrationEvidence();
  const contentUnits = units.filter((unit) => unit.proof === 'content-merged');
  assert.equal(contentUnits.length, 2);
  assert.equal(contentUnits[0]?.resultTreeOid, INTERMEDIATE_TREE_OID);
  assert.equal(contentUnits[1]?.previousResultTreeOid, INTERMEDIATE_TREE_OID);
});
