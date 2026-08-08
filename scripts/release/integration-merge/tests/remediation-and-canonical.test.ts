/**
 * Remediation-routing and canonical-serialization fixtures.
 *
 * A remediation request names the responsible agent role and creates no task, proposes
 * no verdict, and changes no authority. Canonical JSON follows the repository rules so
 * every digest in this module is reproducible.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { admit } from '../admission.ts';
import { remediationFor, remediationRoutingTable } from '../remediation.ts';
import {
  canonicalJson,
  isGitOid,
  isIsoTimestamp,
  isSha256Hex,
  omitTopLevel,
  selfDigest,
  sha256Canonical,
} from '../canonical-json.ts';
import { MERGE_REFUSAL_CODES } from '../contracts.ts';
import type { MergeRefusalCode } from '../contracts.ts';
import {
  digest,
  gateSnapshotOf,
  oid,
  validManifest,
  validRequiredChecks,
  validScenario,
} from './helpers/fixtures.ts';

/* --- Remediation --------------------------------------------------------- */

test('the routing table names one responsible role per condition', () => {
  assert.deepEqual(remediationRoutingTable(), {
    release_conflict_or_control_defect: 'devops',
    release_manifest_defect: 'devops',
    gate_evidence_missing_or_failed: 'reviewer',
    open_or_unverifiable_security_evidence: 'security',
    integration_evidence_gap_or_runtime_defect: 'runtime',
  });
});

test('every remediation request creates no task and proposes no verdict', () => {
  for (const code of MERGE_REFUSAL_CODES) {
    const request = remediationFor(code as MergeRefusalCode, []);
    if (request === null) {
      continue;
    }
    assert.equal(request.createsTask, false, code);
    assert.equal(request.proposedVerdict, null, code);
    assert.equal(request.changesAuthority, false, code);
    assert.equal(request.executor, 'release_main', code);
    assert.equal(request.schema, 'merge-remediation-request/v1', code);
  }
});

test('control-plane refusals carry no agent remediation', () => {
  for (const code of [
    'AuthorityNotActivated',
    'SourceRecordInvalid',
    'PolicyObservationUnavailable',
    'PolicyAttestationInvalid',
    'PolicyAttestationStale',
    'TargetNotReviewReady',
  ] as const) {
    assert.equal(remediationFor(code, []), null, code);
  }
});

test('a release manifest defect routes to devops', () => {
  const result = admit(validScenario({ manifest: null }));
  assert.equal(result.status, 'refused');
  if (result.status !== 'refused') {
    return;
  }
  assert.equal(result.refusal.remediation?.responsibleRole, 'devops');
  assert.equal(
    result.refusal.remediation?.condition,
    'release_manifest_defect',
  );
});

test('a gate evidence failure routes to the recorded gate owner role', () => {
  const result = admit(
    validScenario({
      gateSnapshot: gateSnapshotOf([]),
    }),
  );
  assert.equal(result.status, 'refused');
  if (result.status !== 'refused') {
    return;
  }
  assert.equal(result.refusal.remediation?.responsibleRole, 'reviewer');
});

test('an integration evidence gap routes to runtime', () => {
  const result = admit(validScenario({ integrationEvidence: [] }));
  assert.equal(result.status, 'refused');
  if (result.status !== 'refused') {
    return;
  }
  assert.equal(result.refusal.remediation?.responsibleRole, 'runtime');
});

test('a missing required check routes to devops', () => {
  const result = admit(
    validScenario({
      requiredChecks: { ...validRequiredChecks(), observed: [] },
    }),
  );
  assert.equal(result.status, 'refused');
  if (result.status !== 'refused') {
    return;
  }
  assert.equal(result.refusal.remediation?.responsibleRole, 'devops');
});

test('every refusal carries a durable evidence reference', () => {
  const result = admit(validScenario({ manifest: validManifest({ mergeMethod: 'squash' as never }) }));
  assert.equal(result.status, 'refused');
  if (result.status !== 'refused') {
    return;
  }
  assert.equal(result.refusal.evidenceRecord.store, 'merge-evidence/v1');
  assert.ok(isSha256Hex(result.refusal.evidenceRecord.digest));
  assert.ok(result.refusal.evidenceRecord.key.startsWith('merge-evidence/v1/'));
});

/* --- Canonical serialization -------------------------------------------- */

test('object keys are sorted ascending by code unit', () => {
  assert.equal(canonicalJson({ b: 1, a: 2, C: 3 }), '{"C":3,"a":2,"b":1}');
});

test('undefined properties are omitted and explicit null is retained', () => {
  assert.equal(
    canonicalJson({ a: undefined, b: null, c: 1 }),
    '{"b":null,"c":1}',
  );
});

test('there is no insignificant whitespace', () => {
  assert.equal(canonicalJson([1, { a: 'b' }]), '[1,{"a":"b"}]');
});

test('numbers use the shortest round-tripping decimal form', () => {
  assert.equal(canonicalJson({ n: 1.0 }), '{"n":1}');
  assert.equal(canonicalJson({ n: -0 }), '{"n":0}');
  assert.equal(canonicalJson({ n: 1e21 }), '{"n":1e+21}');
});

test('NaN and infinities are rejected', () => {
  assert.throws(() => canonicalJson({ n: Number.NaN }));
  assert.throws(() => canonicalJson({ n: Number.POSITIVE_INFINITY }));
});

test('nested objects are canonicalized recursively', () => {
  assert.equal(
    canonicalJson({ z: { y: 1, x: 2 }, a: [3, { c: 4, b: 5 }] }),
    '{"a":[3,{"b":5,"c":4}],"z":{"x":2,"y":1}}',
  );
});

test('digests are lowercase 64-character hexadecimal', () => {
  const value = sha256Canonical({ a: 1 });
  assert.match(value, /^[0-9a-f]{64}$/);
  assert.ok(isSha256Hex(value));
});

test('the same value always produces the same digest', () => {
  assert.equal(sha256Canonical({ a: 1, b: 2 }), sha256Canonical({ b: 2, a: 1 }));
});

test('omitTopLevel removes exactly one property and keeps every other', () => {
  const record = { a: 1, b: 2, c: 3 };
  const projected = omitTopLevel(record, 'b') as Record<string, unknown>;
  assert.deepEqual(Object.keys(projected).sort(), ['a', 'c']);
  assert.equal(projected['a'], 1);
  assert.equal(projected['c'], 3);
});

test('selfDigest differs from a digest over the whole record', () => {
  const record = { a: 1, d: 'x' };
  assert.notEqual(selfDigest(record, 'd'), sha256Canonical(record));
  assert.equal(selfDigest(record, 'd'), sha256Canonical({ a: 1 }));
});

test('a full object identity is required where the contract says immutable', () => {
  assert.ok(isGitOid(oid('anything')));
  assert.equal(isGitOid('main'), false);
  assert.equal(isGitOid('refs/heads/main'), false);
  assert.equal(isGitOid('cf6333b'), false);
  assert.equal(isGitOid('CF6333B10E628B3B61F3B7F8716B30923725067D'), false);
  assert.ok(isGitOid('cf6333b10e628b3b61f3b7f8716b30923725067d'));
});

test('timestamps must be RFC 3339 UTC', () => {
  assert.ok(isIsoTimestamp('2026-08-08T00:00:00.000Z'));
  assert.ok(isIsoTimestamp('2026-08-08T00:00:00Z'));
  assert.equal(isIsoTimestamp('2026-08-08T00:00:00+03:00'), false);
  assert.equal(isIsoTimestamp('2026-08-08'), false);
  assert.equal(isIsoTimestamp(''), false);
});
