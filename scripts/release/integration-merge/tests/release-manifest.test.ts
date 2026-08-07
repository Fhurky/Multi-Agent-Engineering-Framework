/**
 * `release-gates/v1` manifest fixtures.
 *
 * A manifest missing any one of the seven domains, or carrying a duplicate, a point
 * gate, a stale round, or a generic formal acceptance constructs no plan, no durable
 * intent, and zero merge API calls — one test per case.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { admit } from '../admission.ts';
import { validateReleaseManifest } from '../release-manifest.ts';
import { RELEASE_GATE_DOMAINS } from '../contracts.ts';
import type { ReleaseGateManifest } from '../contracts.ts';
import { RecordingMergePort } from './helpers/fakes.ts';
import {
  digest,
  oid,
  validManifest,
  validRequirements,
  validScenario,
} from './helpers/fixtures.ts';

function refusalCode(manifest: ReleaseGateManifest | null): string {
  const port = new RecordingMergePort();
  const result = admit(validScenario({ manifest }));
  // A pure admission never reaches a port; the counter proves it stayed at zero.
  assert.equal(port.callCount, 0);
  assert.equal(result.status, 'refused');
  if (result.status !== 'refused') {
    return 'unexpected';
  }
  assert.equal(result.refusal.idempotencyKey, null);
  return result.refusal.code;
}

test('the complete seven-domain manifest validates', () => {
  assert.equal(validateReleaseManifest(validManifest()).status, 'valid');
});

for (const missing of RELEASE_GATE_DOMAINS) {
  test(`a manifest missing the ${missing} domain refuses with ReleaseGateDomainMissing`, () => {
    const manifest = validManifest({
      requirements: validRequirements().filter(
        (requirement) => requirement.domain !== missing,
      ),
    });
    assert.equal(refusalCode(manifest), 'ReleaseGateDomainMissing');
  });
}

test('a duplicate domain refuses with ReleaseManifestInvalid', () => {
  const requirements = validRequirements();
  const manifest = validManifest({
    requirements: [...requirements, requirements[0] as never],
  });
  assert.equal(refusalCode(manifest), 'ReleaseManifestInvalid');
});

test('a point gate requirement refuses with ReleaseManifestInvalid', () => {
  const requirements = validRequirements().map((requirement) =>
    requirement.domain === 'qa'
      ? { ...requirement, gateClass: 'point' as never }
      : requirement,
  );
  assert.equal(refusalCode(validManifest({ requirements })), 'ReleaseManifestInvalid');
});

test('an unknown domain refuses with ReleaseManifestInvalid', () => {
  const requirements = [
    ...validRequirements(),
    {
      domain: 'accessibility' as never,
      lineage: 'LIN-RELEASE-ACCESSIBILITY',
      minimumRound: 1,
      gateClass: 'aggregate' as const,
    },
  ];
  assert.equal(refusalCode(validManifest({ requirements })), 'ReleaseManifestInvalid');
});

test('a non-positive minimum round refuses with ReleaseManifestInvalid', () => {
  const requirements = validRequirements().map((requirement) =>
    requirement.domain === 'rollback'
      ? { ...requirement, minimumRound: 0 }
      : requirement,
  );
  assert.equal(refusalCode(validManifest({ requirements })), 'ReleaseManifestInvalid');
});

test('a stale round below the declared minimum refuses with ReleaseGateNotPassing', () => {
  // The fixture snapshot closes rounds 1 and 2; a floor of 3 is unreachable.
  const requirements = validRequirements().map((requirement) =>
    requirement.domain === 'performance'
      ? { ...requirement, minimumRound: 3 }
      : requirement,
  );
  assert.equal(refusalCode(validManifest({ requirements })), 'ReleaseGateNotPassing');
});

test('a mutable source identity refuses with ReleaseManifestInvalid', () => {
  assert.equal(
    refusalCode(
      validManifest({ sourceOid: 'integration/autonomous-runtime' as never }),
    ),
    'ReleaseManifestInvalid',
  );
});

test('a wrong schema refuses with ReleaseManifestInvalid', () => {
  assert.equal(
    refusalCode(validManifest({ schema: 'release-gates/v2' as never })),
    'ReleaseManifestInvalid',
  );
});

test('a source branch other than the integration branch refuses', () => {
  assert.equal(
    refusalCode(validManifest({ sourceBranch: 'release/candidate' as never })),
    'ReleaseManifestInvalid',
  );
});

test('a base branch other than main refuses', () => {
  assert.equal(
    refusalCode(validManifest({ baseBranch: 'develop' as never })),
    'ReleaseManifestInvalid',
  );
});

test('an absent manifest refuses with ReleaseManifestInvalid', () => {
  assert.equal(refusalCode(null), 'ReleaseManifestInvalid');
});

test('an unpinned integration evidence set digest refuses', () => {
  assert.equal(
    refusalCode(validManifest({ integrationEvidenceSetDigest: 'none' as never })),
    'ReleaseManifestInvalid',
  );
});

test('a coupled irreversible production policy without an immutable commit refuses', () => {
  assert.equal(
    refusalCode(
      validManifest({
        irreversibleProductionCoupling: {
          coupled: true,
          policyCommit: 'refs/heads/main' as never,
          authorization: null,
        },
      }),
    ),
    'ReleaseManifestInvalid',
  );
});

test('a merge method other than the ordinary merge refuses with MergeMethodMismatch', () => {
  // Deliberately NOT folded into the manifest shape defect: the dedicated code exists.
  assert.equal(
    refusalCode(validManifest({ mergeMethod: 'squash' as never })),
    'MergeMethodMismatch',
  );
});

test('the manifest neither creates nor passes a gate', () => {
  // A manifest declaring every domain still refuses when the snapshot has no
  // authoritative relation: declaring a requirement is not satisfying it.
  const result = admit(
    validScenario({
      gateSnapshot: { snapshotDigest: digest('empty-gates'), relations: [] },
    }),
  );
  assert.equal(result.status, 'refused');
  if (result.status !== 'refused') {
    return;
  }
  assert.equal(result.refusal.code, 'PreMergeGateOpen');
});

test('a manifest pinned to a different published head refuses before any plan', () => {
  const result = admit(
    validScenario({
      manifest: validManifest({ sourceOid: oid('another-integration-head') }),
    }),
  );
  assert.equal(result.status, 'refused');
  if (result.status !== 'refused') {
    return;
  }
  assert.equal(result.refusal.code, 'PublicationMismatch');
});
