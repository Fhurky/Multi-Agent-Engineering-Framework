/**
 * Dormancy fixtures for the `dormant-before-durable-merge-ingress` contract.
 *
 * Source may land before TASK-026 and TASK-005 complete only under that contract: the
 * activation record is invalid, `admit` returns `AuthorityNotActivated`, and NO MERGE
 * SIDE EFFECT MAY OCCUR. These fixtures assert that with the real, current activation
 * state — five of the seven immutable members do not exist — the module refuses and
 * constructs nothing.
 *
 * Landing this source never activates the authority.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { admit } from '../admission.ts';
import { validateActivation } from '../activation.ts';
import { ACTIVATION_MEMBERS } from '../contracts.ts';
import type { MergeExecutorActivationRecord } from '../contracts.ts';
import { InMemoryEvidenceStore, RecordingMergePort } from './helpers/fakes.ts';
import { validActivationRecord, validScenario } from './helpers/fixtures.ts';

/**
 * The activation state this publication actually leaves behind.
 *
 * `architectureReview` is satisfied at `78359ae2e3dc6e97fb3d60f0b847b84abed08fa6`.
 * `implementationReview` is TASK-053's alone, `implementationSecurityReview` is
 * TASK-054's alone, `negativeCapabilityTestAttestation` is TASK-055's alone to
 * validate, and neither `requiredGitHubPolicyProfile` with its immutable digest nor
 * `policyAttestorTrustRoot` exists. `gateVocabularyCorrection` is Orchestrator-owned
 * and unpinned. This task produces none of them.
 */
function currentActivationState(): MergeExecutorActivationRecord {
  const record = validActivationRecord() as unknown as Record<string, unknown>;
  for (const member of [
    'implementationReview',
    'implementationSecurityReview',
    'negativeCapabilityTestAttestation',
    'gateVocabularyCorrection',
    'requiredGitHubPolicyProfile',
    'policyAttestorTrustRoot',
  ]) {
    delete record[member];
  }
  delete record['requiredGitHubPolicyProfileDigest'];
  return record as unknown as MergeExecutorActivationRecord;
}

test('the current activation state is invalid on six of the seven members', () => {
  const validation = validateActivation(currentActivationState());
  assert.equal(validation.status, 'not_activated');
  if (validation.status !== 'not_activated') {
    return;
  }
  const members = new Set(validation.defects.map((defect) => defect.member));
  assert.ok(members.has('implementationReview'));
  assert.ok(members.has('implementationSecurityReview'));
  assert.ok(members.has('negativeCapabilityTestAttestation'));
  assert.ok(members.has('gateVocabularyCorrection'));
  assert.ok(members.has('requiredGitHubPolicyProfile'));
  assert.ok(members.has('policyAttestorTrustRoot'));
  assert.equal(members.has('architectureReview'), false);
});

test('under the dormancy contract admit returns AuthorityNotActivated', () => {
  const port = new RecordingMergePort();
  const store = new InMemoryEvidenceStore();

  const result = admit(validScenario({ activation: currentActivationState() }));

  assert.equal(result.status, 'refused');
  if (result.status !== 'refused') {
    return;
  }
  assert.equal(result.refusal.code, 'AuthorityNotActivated');
  assert.ok(!('plan' in result));
  assert.equal(result.refusal.idempotencyKey, null);
  assert.equal(port.callCount, 0);
  assert.equal(store.intents.size, 0);
  assert.equal(store.outcomes.size, 0);
  assert.equal(store.authorizations.size, 0);
});

test('no merge side effect can occur while any activation member is absent', () => {
  for (const member of ACTIVATION_MEMBERS) {
    const record = validActivationRecord() as unknown as Record<string, unknown>;
    delete record[member];

    const port = new RecordingMergePort();
    const result = admit(
      validScenario({
        activation: record as unknown as MergeExecutorActivationRecord,
      }),
    );

    assert.equal(result.status, 'refused', member);
    if (result.status !== 'refused') {
      continue;
    }
    assert.equal(result.refusal.code, 'AuthorityNotActivated', member);
    assert.equal(port.callCount, 0, member);
  }
});

test('landing implementation code never activates the authority', () => {
  // The module exposes no function that can construct or complete an activation
  // record; the record is an externally issued immutable input.
  const admission = admit(validScenario({ activation: null }));
  assert.equal(admission.status, 'refused');
  if (admission.status !== 'refused') {
    return;
  }
  assert.equal(admission.refusal.code, 'AuthorityNotActivated');
});

test('the module exports no activation constructor or mutator', async () => {
  const module = (await import('../index.ts')) as Record<string, unknown>;
  const exported = Object.keys(module);
  for (const name of exported) {
    assert.equal(
      /^(create|issue|grant|activate|complete|sign)/i.test(name) &&
        /activation|authority|attestation/i.test(name),
      false,
      `${name} would be an activation constructor`,
    );
  }
  assert.ok(exported.includes('validateActivation'));
  assert.equal(exported.includes('createActivationRecord'), false);
});

test('the exported surface performs no side effect on import', async () => {
  const before = new RecordingMergePort();
  await import('../index.ts');
  assert.equal(before.callCount, 0);
});
