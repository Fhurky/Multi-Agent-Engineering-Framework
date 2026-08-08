/**
 * Exact success fixture: one release manifest containing all seven aggregate domains,
 * with every other admission input valid.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { admit, computeIdempotencyKey } from './helpers/admission.ts';
import {
  RELEASE_BASE_BRANCH,
  RELEASE_EXECUTOR,
  RELEASE_GATE_DOMAINS,
  RELEASE_MERGE_METHOD,
  RELEASE_SOURCE_BRANCH,
} from '../contracts.ts';
import { isGitOid, isSha256Hex } from '../canonical-json.ts';
import {
  BASE_OID,
  HEAD_OID,
  HEAD_TREE_OID,
  PULL_REQUEST_NUMBER,
  REPOSITORY_ID,
  validScenario,
} from './helpers/fixtures.ts';

test('the seven-domain release success fixture is admitted', () => {
  const result = admit(validScenario());

  assert.equal(
    result.status,
    'admitted',
    `expected admitted, received ${JSON.stringify(result).slice(0, 400)}`,
  );
});

test('the admitted plan pins every immutable identity', () => {
  const result = admit(validScenario());
  assert.equal(result.status, 'admitted');
  if (result.status !== 'admitted') {
    return;
  }

  const plan = result.plan;
  assert.equal(plan.schema, 'merge-plan/v1');
  assert.equal(plan.executor, RELEASE_EXECUTOR);
  assert.equal(plan.repositoryId, REPOSITORY_ID);
  assert.equal(plan.pullRequestNumber, PULL_REQUEST_NUMBER);
  assert.equal(plan.sourceBranch, RELEASE_SOURCE_BRANCH);
  assert.equal(plan.baseBranch, RELEASE_BASE_BRANCH);
  assert.equal(plan.mergeMethod, RELEASE_MERGE_METHOD);
  assert.equal(plan.headOid, HEAD_OID);
  assert.equal(plan.baseOid, BASE_OID);
  assert.equal(plan.expectedTreeOid, HEAD_TREE_OID);

  assert.ok(isGitOid(plan.headOid));
  assert.ok(isGitOid(plan.baseOid));
  assert.ok(isGitOid(plan.expectedTreeOid));
  assert.ok(isSha256Hex(plan.idempotencyKey));
  assert.ok(isSha256Hex(plan.policyAdmissionContextDigest));
  assert.ok(isSha256Hex(plan.preIntentPolicyAttestationDigest));
});

test('the idempotency key is a pure function of the plan inputs', () => {
  const first = admit(validScenario());
  const second = admit(validScenario());
  assert.equal(first.status, 'admitted');
  assert.equal(second.status, 'admitted');
  if (first.status !== 'admitted' || second.status !== 'admitted') {
    return;
  }

  assert.equal(first.plan.idempotencyKey, second.plan.idempotencyKey);

  const { idempotencyKey, ...withoutKey } = first.plan;
  assert.equal(computeIdempotencyKey(withoutKey), idempotencyKey);
});

test('a different order key produces a different idempotency key', () => {
  const first = admit(validScenario());
  const second = admit(validScenario({ orderKey: '0010' }));
  assert.equal(first.status, 'admitted');
  assert.equal(second.status, 'admitted');
  if (first.status !== 'admitted' || second.status !== 'admitted') {
    return;
  }
  assert.notEqual(first.plan.idempotencyKey, second.plan.idempotencyKey);
});

test('the manifest declares exactly the seven aggregate release domains', () => {
  const input = validScenario();
  assert.notEqual(input.manifest, null);
  const domains = (input.manifest?.requirements ?? []).map(
    (requirement) => requirement.domain,
  );
  assert.equal(domains.length, 7);
  assert.deepEqual([...domains].sort(), [...RELEASE_GATE_DOMAINS].sort());
});
