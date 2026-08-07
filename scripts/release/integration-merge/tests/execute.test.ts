/**
 * Execution-order fixtures.
 *
 * Durable receipt-backed intent precedes the sole mutation; the independently signed
 * `pre_mutation` authorization is obtained immediately before it; the merged tree is
 * verified afterwards; and the terminal outcome is persisted before the result returns.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { execute } from '../execute.ts';
import { RELEASE_BASE_BRANCH, RELEASE_MERGE_METHOD } from '../contracts.ts';
import { buildHarness, MERGED_COMMIT_OID } from './helpers/execution.ts';
import { excludedControlAction, artifactRef, oid, validPullRequest } from './helpers/fixtures.ts';

test('the happy path performs exactly one merge and verifies the resulting tree', async () => {
  const harness = buildHarness();
  const result = await execute(harness.dependencies, harness.executionInput);

  assert.equal(result.status, 'merged');
  if (result.status !== 'merged') {
    return;
  }
  assert.equal(result.mergedCommitOid, MERGED_COMMIT_OID);
  assert.equal(result.resultTreeOid, harness.plan.expectedTreeOid);
  assert.equal(result.adopted, false);
  assert.equal(harness.mergePort.callCount, 1);
});

test('the merge request is bound to the plan and cannot be retargeted', async () => {
  const harness = buildHarness();
  await execute(harness.dependencies, harness.executionInput);

  const call = harness.mergePort.calls[0];
  assert.ok(call !== undefined);
  assert.equal(call.request.pullRequestNumber, harness.plan.pullRequestNumber);
  assert.equal(call.request.expectedHeadOid, harness.plan.headOid);
  assert.equal(call.request.baseBranch, RELEASE_BASE_BRANCH);
  assert.equal(call.request.mergeMethod, RELEASE_MERGE_METHOD);
  assert.equal(call.request.idempotencyKey, harness.plan.idempotencyKey);
  assert.deepEqual(Object.keys(call.request).sort(), [
    'baseBranch',
    'expectedHeadOid',
    'idempotencyKey',
    'mergeMethod',
    'pullRequestNumber',
  ]);
});

test('durable intent is recorded before the mutation', async () => {
  const harness = buildHarness();
  await execute(harness.dependencies, harness.executionInput);

  assert.equal(harness.store.intents.size, 1);
  assert.ok(harness.store.intents.has(harness.plan.idempotencyKey));
});

test('a store that cannot persist intent refuses before any merge call', async () => {
  const harness = buildHarness();
  harness.store.unavailable = true;

  const result = await execute(harness.dependencies, harness.executionInput);

  assert.equal(result.status, 'refused');
  if (result.status !== 'refused') {
    return;
  }
  assert.equal(result.refusal.code, 'IntentNotDurable');
  assert.equal(harness.mergePort.callCount, 0);
});

test('a forged resume receipt refuses before any merge call', async () => {
  const harness = buildHarness({
    suppliedReceipt: { token: 'forged', planDigest: 'forged' },
  });

  const result = await execute(harness.dependencies, harness.executionInput);

  assert.equal(result.status, 'refused');
  if (result.status !== 'refused') {
    return;
  }
  assert.equal(result.refusal.code, 'IntentReceiptInvalid');
  assert.equal(harness.mergePort.callCount, 0);
});

test('a plan whose bytes collide with a recorded plan refuses', async () => {
  const harness = buildHarness();

  // Occupy the key with different bytes under the same idempotency key.
  await harness.store.recordIntent({ ...harness.plan, orderKey: 'tampered' });
  assert.equal(harness.store.intents.size, 1);

  const result = await execute(harness.dependencies, harness.executionInput);

  assert.equal(result.status, 'refused');
  if (result.status !== 'refused') {
    return;
  }
  assert.equal(result.refusal.code, 'IntentReceiptInvalid');
  assert.equal(harness.mergePort.callCount, 0);
});

test('the executor lease is acquired and released exactly once', async () => {
  const harness = buildHarness();
  await execute(harness.dependencies, harness.executionInput);
  assert.equal(harness.leases.granted, 1);
  assert.equal(harness.leases.released, 1);
});

test('an unavailable executor lease refuses before intent and before any merge call', async () => {
  const harness = buildHarness();
  harness.leases.available = false;

  const result = await execute(harness.dependencies, harness.executionInput);

  assert.equal(result.status, 'refused');
  if (result.status !== 'refused') {
    return;
  }
  assert.equal(result.refusal.code, 'IntentNotDurable');
  assert.equal(harness.store.intents.size, 0);
  assert.equal(harness.mergePort.callCount, 0);
});

test('a pre-mutation authorization is persisted before the mutation', async () => {
  const harness = buildHarness();
  await execute(harness.dependencies, harness.executionInput);

  assert.equal(harness.store.authorizations.size, 1);
  const recorded = harness.store.authorizations.get(harness.plan.idempotencyKey);
  assert.ok(recorded !== undefined);
  assert.notEqual(recorded, harness.plan.preIntentPolicyAttestationDigest);
});

test('reusing the pre-intent attestation for the mutation refuses', async () => {
  const harness = buildHarness();
  const preIntent = harness.admissionInput.policyControlFacts.observation;
  assert.equal(preIntent.state, 'current_valid');
  if (preIntent.state !== 'current_valid') {
    return;
  }

  const result = await execute(harness.dependencies, {
    ...harness.executionInput,
    preMutationPolicyFacts: {
      action: excludedControlAction(),
      observation: { state: 'current_valid', attestation: preIntent.attestation },
    },
  });

  assert.equal(result.status, 'refused');
  if (result.status !== 'refused') {
    return;
  }
  // The pre-intent attestation names the `pre_intent` phase, so its subject binding
  // fails for the mutation phase.
  assert.equal(result.refusal.code, 'PolicyAttestationInvalid');
  assert.equal(harness.mergePort.callCount, 0);
});

test('a detected control-plane action before the mutation returns the third exception', async () => {
  const harness = buildHarness();
  const result = await execute(harness.dependencies, {
    ...harness.executionInput,
    preMutationPolicyFacts: {
      action: {
        status: 'detected',
        actions: ['bypass_or_exemption_set_changed'],
        evidence: [artifactRef('pre-mutation-observation')],
      },
      observation: { state: 'present_invalid', reason: 'completeness' },
    },
  });

  assert.equal(result.status, 'human_exception_required');
  if (result.status !== 'human_exception_required') {
    return;
  }
  assert.equal(result.exception.classification, 'detected');
  assert.equal(harness.mergePort.callCount, 0);
});

test('a stale pre-mutation attestation refuses before the mutation', async () => {
  const harness = buildHarness();
  // Advance beyond the attestation validity window.
  harness.clock.advance(60_000);

  const result = await execute(harness.dependencies, harness.executionInput);

  assert.equal(result.status, 'refused');
  if (result.status !== 'refused') {
    return;
  }
  assert.equal(result.refusal.code, 'PolicyAttestationStale');
  assert.equal(harness.mergePort.callCount, 0);
});

test('a moved head refuses before intent and before any merge call', async () => {
  const harness = buildHarness({
    pullRequests: [{ ...validPullRequest(), headOid: oid('moved-head') }],
  });

  const result = await execute(harness.dependencies, harness.executionInput);

  assert.equal(result.status, 'refused');
  if (result.status !== 'refused') {
    return;
  }
  assert.equal(result.refusal.code, 'HeadOidMismatch');
  assert.equal(harness.store.intents.size, 0);
  assert.equal(harness.mergePort.callCount, 0);
});

test('a merged tree other than the expected tree is ResultUnverifiable', async () => {
  const harness = buildHarness({ mergedTree: oid('unexpected-tree') });

  const result = await execute(harness.dependencies, harness.executionInput);

  assert.equal(result.status, 'refused');
  if (result.status !== 'refused') {
    return;
  }
  assert.equal(result.refusal.code, 'ResultUnverifiable');
  assert.equal(
    harness.store.outcomes.get(harness.plan.idempotencyKey)?.status,
    'result_unverifiable',
  );
});

test('the terminal outcome is persisted before the result returns', async () => {
  const harness = buildHarness();
  const result = await execute(harness.dependencies, harness.executionInput);

  assert.equal(result.status, 'merged');
  const outcome = harness.store.outcomes.get(harness.plan.idempotencyKey);
  assert.ok(outcome !== undefined);
  assert.equal(outcome.status, 'merged');
  assert.equal(outcome.mergedCommitOid, MERGED_COMMIT_OID);
  assert.equal(outcome.resultTreeOid, harness.plan.expectedTreeOid);
});

test('a merge port that reports the operation unsupported refuses', async () => {
  const harness = buildHarness({ mergeResults: [{ outcome: 'unsupported' }] });

  const result = await execute(harness.dependencies, harness.executionInput);

  assert.equal(result.status, 'refused');
  if (result.status !== 'refused') {
    return;
  }
  assert.equal(result.refusal.code, 'UnsupportedOperation');
});

test('revalidation re-runs the complete pure admission with fresh observations', async () => {
  const harness = buildHarness();
  await execute(harness.dependencies, harness.executionInput);

  assert.ok(harness.observation.reads.includes('readPullRequest'));
  assert.ok(harness.observation.reads.includes('readBaseRef'));
  assert.ok(harness.observation.reads.includes('readRequiredChecks'));
});
