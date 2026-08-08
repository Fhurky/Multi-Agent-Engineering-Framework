/**
 * Activation-record fixtures.
 *
 * With any activation-record member absent, unpinned, mutable, or executor-produced,
 * `admit` returns `AuthorityNotActivated`. Each case is constructed individually, and
 * each asserts no plan, no durable intent, and zero merge API calls.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { admit } from '../admission.ts';
import { validateActivation } from '../activation.ts';
import { ACTIVATION_MEMBERS, GOVERNANCE_DECISION_COMMIT } from '../contracts.ts';
import type { MergeExecutorActivationRecord } from '../contracts.ts';
import {
  digest,
  oid,
  validActivationRecord,
  validScenario,
} from './helpers/fixtures.ts';

function withoutMember(member: string): MergeExecutorActivationRecord {
  const record = validActivationRecord() as unknown as Record<string, unknown>;
  delete record[member];
  return record as unknown as MergeExecutorActivationRecord;
}

test('the complete fixture activation record validates', () => {
  assert.equal(validateActivation(validActivationRecord()).status, 'activated');
});

test('an absent activation record is not activated on every member', () => {
  const result = validateActivation(null);
  assert.equal(result.status, 'not_activated');
  if (result.status !== 'not_activated') {
    return;
  }
  assert.equal(result.defects.length, ACTIVATION_MEMBERS.length);
});

for (const member of ACTIVATION_MEMBERS) {
  test(`admit returns AuthorityNotActivated when ${member} is absent`, () => {
    const result = admit(
      validScenario({ activation: withoutMember(member) }),
    );

    assert.equal(result.status, 'refused');
    if (result.status !== 'refused') {
      return;
    }
    assert.equal(result.refusal.code, 'AuthorityNotActivated');
    assert.equal(result.refusal.idempotencyKey, null);
    assert.ok(!('plan' in result));
  });
}

test('admit returns AuthorityNotActivated when the whole record is absent', () => {
  const result = admit(validScenario({ activation: null }));
  assert.equal(result.status, 'refused');
  if (result.status !== 'refused') {
    return;
  }
  assert.equal(result.refusal.code, 'AuthorityNotActivated');
});

test('a mutable ref in a gate member is not activated', () => {
  const record = validActivationRecord();
  const mutated: MergeExecutorActivationRecord = {
    ...record,
    implementationReview: {
      ...record.implementationReview,
      // A branch name where the contract requires an immutable commit.
      verdictCommit: 'refs/heads/agent/gpt/reviewer/task-053',
    },
  };

  const result = validateActivation(mutated);
  assert.equal(result.status, 'not_activated');
  if (result.status !== 'not_activated') {
    return;
  }
  assert.deepEqual(result.defects, [
    { member: 'implementationReview', reason: 'member_mutable_ref' },
  ]);
  assert.equal(
    (admit(validScenario({ activation: mutated })) as { refusal: { code: string } })
      .refusal.code,
    'AuthorityNotActivated',
  );
});

test('a mutable ref in an artifact member is not activated', () => {
  const record = validActivationRecord();
  const mutated: MergeExecutorActivationRecord = {
    ...record,
    gateVocabularyCorrection: {
      ...record.gateVocabularyCorrection,
      commit: 'main',
    },
  };
  const result = validateActivation(mutated);
  assert.equal(result.status, 'not_activated');
  if (result.status !== 'not_activated') {
    return;
  }
  assert.deepEqual(result.defects, [
    { member: 'gateVocabularyCorrection', reason: 'member_mutable_ref' },
  ]);
});

test('an executor-produced gate reference is not activated', () => {
  const record = validActivationRecord();
  const mutated: MergeExecutorActivationRecord = {
    ...record,
    implementationSecurityReview: {
      ...record.implementationSecurityReview,
      producedByExecutor: true,
    },
  };
  const result = validateActivation(mutated);
  assert.equal(result.status, 'not_activated');
  if (result.status !== 'not_activated') {
    return;
  }
  assert.deepEqual(result.defects, [
    {
      member: 'implementationSecurityReview',
      reason: 'member_produced_by_executor',
    },
  ]);
});

test('a non-passing gate reference is not activated', () => {
  const record = validActivationRecord();
  const mutated = {
    ...record,
    architectureReview: {
      ...record.architectureReview,
      verdictState: 'changes_required',
    },
  } as unknown as MergeExecutorActivationRecord;

  const result = validateActivation(mutated);
  assert.equal(result.status, 'not_activated');
  if (result.status !== 'not_activated') {
    return;
  }
  assert.deepEqual(result.defects, [
    { member: 'architectureReview', reason: 'member_not_passing' },
  ]);
});

test('a required-policy profile without an immutable digest is not activated', () => {
  const record = validActivationRecord();
  const mutated = {
    ...record,
    requiredGitHubPolicyProfileDigest: 'not-a-digest',
  } as unknown as MergeExecutorActivationRecord;

  const result = validateActivation(mutated);
  assert.equal(result.status, 'not_activated');
  if (result.status !== 'not_activated') {
    return;
  }
  assert.deepEqual(result.defects, [
    { member: 'requiredGitHubPolicyProfile', reason: 'member_unpinned' },
  ]);
});

test('an unpinned attestor trust root is not activated', () => {
  const record = validActivationRecord();
  const mutated = {
    ...record,
    policyAttestorTrustRoot: {
      ...record.policyAttestorTrustRoot,
      publicKeyDigest: '',
    },
  } as unknown as MergeExecutorActivationRecord;

  const result = validateActivation(mutated);
  assert.equal(result.status, 'not_activated');
  if (result.status !== 'not_activated') {
    return;
  }
  assert.deepEqual(result.defects, [
    { member: 'policyAttestorTrustRoot', reason: 'member_unpinned' },
  ]);
});

test('a foreign executor identity is not activated', () => {
  const mutated = {
    ...validActivationRecord(),
    executor: 'task_integration',
  } as unknown as MergeExecutorActivationRecord;

  const result = validateActivation(mutated);
  assert.equal(result.status, 'not_activated');
  if (result.status !== 'not_activated') {
    return;
  }
  assert.deepEqual(result.defects, [
    { member: 'executor', reason: 'executor_mismatch' },
  ]);
});

test('a governance decision commit other than HUMAN-004 is not activated', () => {
  const mutated = {
    ...validActivationRecord(),
    governanceDecisionCommit: oid('some-other-decision'),
  } as unknown as MergeExecutorActivationRecord;

  const result = validateActivation(mutated);
  assert.equal(result.status, 'not_activated');
  if (result.status !== 'not_activated') {
    return;
  }
  assert.deepEqual(result.defects, [
    {
      member: 'governanceDecisionCommit',
      reason: 'governance_decision_commit_mismatch',
    },
  ]);
});

test('the pinned governance decision commit is HUMAN-004 exactly', () => {
  assert.equal(
    GOVERNANCE_DECISION_COMMIT,
    '7dc07488a5b1cac8b1327ebd63bf747adbe03c68',
  );
});

test('landing code does not activate: an artifact digest alone is insufficient', () => {
  const record = validActivationRecord();
  const mutated = {
    ...record,
    negativeCapabilityTestAttestation: {
      ...record.negativeCapabilityTestAttestation,
      digest: digest('some-other-artifact'),
      commit: 'HEAD',
    },
  } as unknown as MergeExecutorActivationRecord;

  const result = validateActivation(mutated);
  assert.equal(result.status, 'not_activated');
});
