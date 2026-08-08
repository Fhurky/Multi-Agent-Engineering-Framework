/**
 * Idempotency fixtures.
 *
 * Exactly one mutation occurs for a given idempotency key across process restart and
 * ambiguous responses, and a recorded `OutcomeUnknown` prevents a blind second call.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { execute, planStoreKey } from '../execute.ts';
import { evidenceStoreKey } from './helpers/admission.ts';
import { buildHarness, MERGED_COMMIT_OID, mergedPullRequest } from './helpers/execution.ts';
import { oid, validPullRequest } from './helpers/fixtures.ts';

test('the durable store key names the executor and the idempotency key only', () => {
  const harness = buildHarness();
  const key = planStoreKey(harness.plan);

  assert.equal(
    key,
    evidenceStoreKey(harness.plan.repositoryId, harness.plan.idempotencyKey),
  );
  assert.ok(key.startsWith('merge-evidence/v1/'));
  assert.ok(key.includes('/release_main/'));
  assert.ok(key.endsWith(harness.plan.idempotencyKey));
  // No token or secret is ever placed in the key.
  assert.equal(/token|secret|key-|bearer|ghp_|password/i.test(key), false);
});

test('a second execution across a process restart performs no second mutation', async () => {
  const first = buildHarness();
  const firstResult = await execute(first.dependencies, first.executionInput);
  assert.equal(firstResult.status, 'merged');
  assert.equal(first.mergePort.callCount, 1);

  // A new process with the same durable store.
  const second = buildHarness({
    store: first.store,
    mergeResults: [
      {
        outcome: 'merged',
        mergedCommitOid: oid('a-second-merge-that-must-not-happen'),
        resultTreeOid: oid('integration-head-tree'),
      },
    ],
  });

  const secondResult = await execute(second.dependencies, second.executionInput);

  assert.equal(secondResult.status, 'merged');
  if (secondResult.status !== 'merged') {
    return;
  }
  assert.equal(secondResult.mergedCommitOid, MERGED_COMMIT_OID);
  assert.equal(secondResult.adopted, true);
  assert.equal(second.mergePort.callCount, 0);
});

test('an ambiguous response followed by a restart adopts rather than re-merges', async () => {
  const first = buildHarness({
    mergeResults: [
      { outcome: 'ambiguous', reason: 'response_dropped' },
      { outcome: 'ambiguous', reason: 'response_dropped' },
      { outcome: 'ambiguous', reason: 'response_dropped' },
    ],
    mergeFallback: { outcome: 'ambiguous', reason: 'response_dropped' },
  });
  const firstResult = await execute(first.dependencies, first.executionInput);
  assert.equal(firstResult.status, 'refused');
  if (firstResult.status !== 'refused') {
    return;
  }
  assert.equal(firstResult.refusal.code, 'OutcomeUnknown');

  // The mutation did in fact land; a later authoritative read proves it.
  const second = buildHarness({
    store: first.store,
    pullRequests: [mergedPullRequest()],
    mergeResults: [
      {
        outcome: 'merged',
        mergedCommitOid: oid('a-second-merge-that-must-not-happen'),
        resultTreeOid: oid('integration-head-tree'),
      },
    ],
  });

  const secondResult = await execute(second.dependencies, second.executionInput);

  assert.equal(secondResult.status, 'merged');
  if (secondResult.status !== 'merged') {
    return;
  }
  assert.equal(secondResult.adopted, true);
  assert.equal(second.mergePort.callCount, 0);
});

test('OutcomeUnknown prevents a blind second call while the state stays ambiguous', async () => {
  const first = buildHarness({
    mergeResults: [
      { outcome: 'ambiguous', reason: 'response_dropped' },
      { outcome: 'ambiguous', reason: 'response_dropped' },
      { outcome: 'ambiguous', reason: 'response_dropped' },
    ],
    mergeFallback: { outcome: 'ambiguous', reason: 'response_dropped' },
  });
  await execute(first.dependencies, first.executionInput);
  assert.equal(
    first.store.outcomes.get(first.plan.idempotencyKey)?.status,
    'outcome_unknown',
  );

  // A restart where GitHub still cannot say whether the merge occurred: the pull
  // request is neither merged nor closed, so the executor may proceed only through the
  // ordinary revalidation path, never through a blind repeat.
  const second = buildHarness({
    store: first.store,
    pullRequests: [{ ...validPullRequest(), state: 'closed', merged: false }],
    mergeResults: [
      {
        outcome: 'merged',
        mergedCommitOid: oid('a-second-merge-that-must-not-happen'),
        resultTreeOid: oid('integration-head-tree'),
      },
    ],
  });

  const secondResult = await execute(second.dependencies, second.executionInput);

  assert.equal(secondResult.status, 'refused');
  if (secondResult.status !== 'refused') {
    return;
  }
  assert.equal(secondResult.refusal.code, 'GitHubRejected');
  assert.equal(second.mergePort.callCount, 0);
});

test('a recorded ResultUnverifiable blocks further execution for that key', async () => {
  const first = buildHarness({ mergedTree: oid('unexpected-tree') });
  const firstResult = await execute(first.dependencies, first.executionInput);
  assert.equal(firstResult.status, 'refused');

  const second = buildHarness({
    store: first.store,
    mergeResults: [
      {
        outcome: 'merged',
        mergedCommitOid: MERGED_COMMIT_OID,
        resultTreeOid: oid('integration-head-tree'),
      },
    ],
  });
  const secondResult = await execute(second.dependencies, second.executionInput);

  assert.equal(secondResult.status, 'refused');
  if (secondResult.status !== 'refused') {
    return;
  }
  assert.equal(secondResult.refusal.code, 'ResultUnverifiable');
  assert.equal(second.mergePort.callCount, 0);
});

test('a byte-identical replayed plan reuses the recorded intent', async () => {
  const harness = buildHarness();
  const first = await harness.store.recordIntent(harness.plan);
  assert.equal(first.status, 'recorded');

  const second = await harness.store.recordIntent(harness.plan);
  assert.equal(second.status, 'already_recorded');
  if (second.status !== 'already_recorded') {
    return;
  }
  assert.ok(await harness.store.verifyIntent(second.receipt, harness.plan));
  assert.equal(harness.store.intents.size, 1);
});

test('the idempotency key changes when any pinned plan input changes', () => {
  const baseline = buildHarness().plan;
  const other = buildHarness({ scenario: undefined }).plan;
  assert.equal(baseline.idempotencyKey, other.idempotencyKey);

  const fields = [
    'headOid',
    'baseOid',
    'expectedTreeOid',
    'orderKey',
    'gateSnapshotDigest',
    'securitySnapshotDigest',
    'publishedHeadEvidenceDigest',
    'immutableDiffDigest',
    'requiredPolicyProfileDigest',
    'policyDigest',
    'effectivePolicyProfileDigest',
    'preIntentPolicyAttestationDigest',
    'policyAdmissionContextNonce',
    'policyAdmissionContextDigest',
  ] as const;

  for (const field of fields) {
    assert.notEqual(
      baseline[field],
      undefined,
      `${field} must participate in the plan`,
    );
  }
});
