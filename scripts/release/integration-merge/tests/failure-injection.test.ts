/**
 * Failure-injection fixtures.
 *
 * Conflict, 4xx, 5xx, rate-limit, timeout, dropped response, crash before the call,
 * crash after the call but before the result, and a result-tree mismatch. Only
 * transport interruption, rate limiting, and GitHub 5xx responses are eligible for a
 * bounded mutation retry, and every retry reconciles first.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { execute } from '../execute.ts';
import {
  DETERMINISTIC_DELAYS_MS,
  MAX_MUTATION_ATTEMPTS,
  MERGE_RETRY_POLICY_ID,
  TOTAL_BUDGET_MS,
  isRetryableFailure,
  nextRetryDecision,
} from '../retry.ts';
import { buildHarness, MERGED_COMMIT_OID, mergedPullRequest } from './helpers/execution.ts';
import { oid, validPullRequest } from './helpers/fixtures.ts';

test('the approved retry policy parameters are exactly merge-retry/v1', () => {
  assert.equal(MERGE_RETRY_POLICY_ID, 'merge-retry/v1');
  assert.equal(MAX_MUTATION_ATTEMPTS, 3);
  assert.deepEqual(DETERMINISTIC_DELAYS_MS, [1_000, 4_000, 16_000]);
  assert.equal(TOTAL_BUDGET_MS, 120_000);
});

test('only transport, rate limit, and server error are retryable', () => {
  assert.ok(isRetryableFailure('transport'));
  assert.ok(isRetryableFailure('rate_limit'));
  assert.ok(isRetryableFailure('server_error'));
  for (const other of ['conflict', 'rejected', 'ambiguous', 'unsupported', '']) {
    assert.equal(isRetryableFailure(other), false, other);
  }
});

test('a conflict is never retried and routes remediation', async () => {
  const harness = buildHarness({ mergeResults: [{ outcome: 'conflict' }] });
  const result = await execute(harness.dependencies, harness.executionInput);

  assert.equal(result.status, 'refused');
  if (result.status !== 'refused') {
    return;
  }
  assert.equal(result.refusal.code, 'MergeConflict');
  assert.equal(harness.mergePort.callCount, 1);
  assert.ok(result.refusal.remediation !== null);
  assert.equal(result.refusal.remediation?.responsibleRole, 'devops');
  assert.equal(result.refusal.remediation?.createsTask, false);
});

test('a 4xx policy rejection is never retried', async () => {
  const harness = buildHarness({
    mergeResults: [{ outcome: 'rejected', statusCode: 405 }],
  });
  const result = await execute(harness.dependencies, harness.executionInput);

  assert.equal(result.status, 'refused');
  if (result.status !== 'refused') {
    return;
  }
  assert.equal(result.refusal.code, 'GitHubRejected');
  assert.equal(harness.mergePort.callCount, 1);
});

test('a 5xx failure retries within the bounded policy and then succeeds', async () => {
  const harness = buildHarness({
    mergeResults: [
      { outcome: 'transient_failure', reason: 'server_error', retryAfterSeconds: null },
      {
        outcome: 'merged',
        mergedCommitOid: MERGED_COMMIT_OID,
        resultTreeOid: oid('integration-head-tree'),
      },
    ],
  });
  const result = await execute(harness.dependencies, harness.executionInput);

  assert.equal(result.status, 'merged');
  assert.equal(harness.mergePort.callCount, 2);
  // Reconciled before the retry, and revalidated again before the second attempt.
  assert.ok(
    harness.observation.reads.filter((read) => read === 'readPullRequest').length >= 1,
  );
  assert.ok(
    harness.observation.reads.filter(
      (read) => read === 'readReleaseAdmissionFacts',
    ).length >= 3,
  );
  assert.equal(harness.attestor.requestCount, 2);
});

test('a rate limit honours a server Retry-After no shorter than the deterministic delay', () => {
  const withoutServer = nextRetryDecision(1, 0, null);
  assert.equal(withoutServer.status, 'retry');
  if (withoutServer.status !== 'retry') {
    return;
  }
  assert.equal(withoutServer.delayMs, 1_000);

  const withLargerServer = nextRetryDecision(1, 0, 30);
  assert.equal(withLargerServer.status, 'retry');
  if (withLargerServer.status !== 'retry') {
    return;
  }
  assert.equal(withLargerServer.delayMs, 30_000);

  const withSmallerServer = nextRetryDecision(2, 0, 1);
  assert.equal(withSmallerServer.status, 'retry');
  if (withSmallerServer.status !== 'retry') {
    return;
  }
  assert.equal(withSmallerServer.delayMs, 4_000);
});

test('a Retry-After the budget cannot accommodate exhausts rather than extends', () => {
  const decision = nextRetryDecision(1, 0, 600);
  assert.equal(decision.status, 'exhausted');
  if (decision.status !== 'exhausted') {
    return;
  }
  assert.equal(decision.reason, 'delay_exceeds_wall_clock_budget');
});

test('the attempt budget is bounded to three total mutation attempts', async () => {
  const harness = buildHarness({
    mergeResults: [
      { outcome: 'transient_failure', reason: 'transport', retryAfterSeconds: null },
      { outcome: 'transient_failure', reason: 'transport', retryAfterSeconds: null },
      { outcome: 'transient_failure', reason: 'transport', retryAfterSeconds: null },
    ],
    mergeFallback: {
      outcome: 'transient_failure',
      reason: 'transport',
      retryAfterSeconds: null,
    },
  });

  const result = await execute(harness.dependencies, harness.executionInput);

  assert.equal(result.status, 'refused');
  if (result.status !== 'refused') {
    return;
  }
  assert.equal(result.refusal.code, 'RetryExhausted');
  assert.equal(harness.mergePort.callCount, MAX_MUTATION_ATTEMPTS);
});

test('the wall-clock budget is enforced', () => {
  const decision = nextRetryDecision(1, TOTAL_BUDGET_MS, null);
  assert.equal(decision.status, 'exhausted');
  if (decision.status !== 'exhausted') {
    return;
  }
  assert.equal(decision.reason, 'wall_clock_budget_consumed');
});

test('a dropped response is reconciled and adopted when GitHub already merged', async () => {
  const harness = buildHarness({
    mergeResults: [{ outcome: 'ambiguous', reason: 'response_dropped' }],
    // Open at revalidation, merged by the time the ambiguous response is reconciled.
    admissionPullRequest: validPullRequest(),
    pullRequests: [mergedPullRequest()],
  });

  const result = await execute(harness.dependencies, harness.executionInput);

  assert.equal(result.status, 'merged');
  if (result.status !== 'merged') {
    return;
  }
  assert.equal(result.adopted, true);
  // The mutation was never repeated.
  assert.equal(harness.mergePort.callCount, 1);
});

test('a dropped response with the pull request still open may retry once reconciled', async () => {
  const harness = buildHarness({
    mergeResults: [
      { outcome: 'ambiguous', reason: 'response_dropped' },
      {
        outcome: 'merged',
        mergedCommitOid: MERGED_COMMIT_OID,
        resultTreeOid: oid('integration-head-tree'),
      },
    ],
  });

  const result = await execute(harness.dependencies, harness.executionInput);

  assert.equal(result.status, 'merged');
  assert.equal(harness.mergePort.callCount, 2);
});

test('a dropped response that cannot be resolved becomes OutcomeUnknown', async () => {
  const harness = buildHarness({
    mergeResults: [
      { outcome: 'ambiguous', reason: 'response_dropped' },
      { outcome: 'ambiguous', reason: 'response_dropped' },
      { outcome: 'ambiguous', reason: 'response_dropped' },
    ],
    mergeFallback: { outcome: 'ambiguous', reason: 'response_dropped' },
  });

  const result = await execute(harness.dependencies, harness.executionInput);

  assert.equal(result.status, 'refused');
  if (result.status !== 'refused') {
    return;
  }
  assert.equal(result.refusal.code, 'OutcomeUnknown');
  assert.equal(
    harness.store.outcomes.get(harness.plan.idempotencyKey)?.status,
    'outcome_unknown',
  );
  assert.equal(harness.mergePort.callCount, MAX_MUTATION_ATTEMPTS);
});

test('a pull request closed unmerged after an ambiguous response is not retried', async () => {
  const harness = buildHarness({
    mergeResults: [{ outcome: 'ambiguous', reason: 'response_dropped' }],
    admissionPullRequest: validPullRequest(),
    pullRequests: [{ ...validPullRequest(), state: 'closed', merged: false }],
  });

  const result = await execute(harness.dependencies, harness.executionInput);

  assert.equal(result.status, 'refused');
  if (result.status !== 'refused') {
    return;
  }
  assert.equal(result.refusal.code, 'GitHubRejected');
  assert.equal(harness.mergePort.callCount, 1);
});

test('crash before the call: no intent means pure admission simply re-runs', async () => {
  // Simulated by executing with an empty store, exactly as a fresh process would.
  const harness = buildHarness();
  assert.equal(harness.store.intents.size, 0);
  assert.equal(harness.store.outcomes.size, 0);

  const result = await execute(harness.dependencies, harness.executionInput);
  assert.equal(result.status, 'merged');
  assert.equal(harness.mergePort.callCount, 1);
});

test('crash after the call before the result: reconcile adopts, never re-merges', async () => {
  const first = buildHarness();
  // The first process recorded intent and then died before persisting an outcome.
  await first.store.recordIntent(first.plan);
  assert.equal(first.store.outcomes.size, 0);

  const second = buildHarness({
    store: first.store,
    pullRequests: [mergedPullRequest()],
    mergeResults: [{ outcome: 'unsupported' }],
  });

  const result = await execute(second.dependencies, second.executionInput);

  assert.equal(result.status, 'merged');
  if (result.status !== 'merged') {
    return;
  }
  assert.equal(result.adopted, true);
  assert.equal(second.mergePort.callCount, 0);
});

test('a merged pull request whose tree cannot be verified is ResultUnverifiable', async () => {
  const first = buildHarness();
  await first.store.recordIntent(first.plan);

  const second = buildHarness({
    store: first.store,
    pullRequests: [mergedPullRequest(oid('unknown-merge-commit'))],
  });

  const result = await execute(second.dependencies, second.executionInput);

  assert.equal(result.status, 'refused');
  if (result.status !== 'refused') {
    return;
  }
  assert.equal(result.refusal.code, 'ResultUnverifiable');
  assert.equal(second.mergePort.callCount, 0);
  assert.equal(result.refusal.remediation?.responsibleRole, 'security');
});

test('a merge by an unknown actor is never adopted into the release lineage', async () => {
  const first = buildHarness();
  await first.store.recordIntent(first.plan);

  // The pull request reports merged, but the merge commit's tree is not the plan's.
  const second = buildHarness({
    store: first.store,
    pullRequests: [mergedPullRequest()],
    mergedTree: oid('someone-elses-tree'),
  });

  const result = await execute(second.dependencies, second.executionInput);

  assert.equal(result.status, 'refused');
  if (result.status !== 'refused') {
    return;
  }
  assert.equal(result.refusal.code, 'ResultUnverifiable');
});

test('a head that moved before a retry is refused rather than merged', async () => {
  const harness = buildHarness({
    mergeResults: [
      { outcome: 'transient_failure', reason: 'server_error', retryAfterSeconds: null },
    ],
    admissionPullRequest: validPullRequest(),
    pullRequests: [{ ...validPullRequest(), headOid: oid('head-moved-mid-flight') }],
  });

  const result = await execute(harness.dependencies, harness.executionInput);

  assert.equal(result.status, 'refused');
  if (result.status !== 'refused') {
    return;
  }
  assert.equal(result.refusal.code, 'HeadOidMismatch');
  assert.equal(harness.mergePort.callCount, 1);
});
