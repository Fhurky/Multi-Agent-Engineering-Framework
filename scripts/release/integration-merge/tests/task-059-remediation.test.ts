import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { admit } from './helpers/admission.ts';
import { admit as productionAdmit } from '../admission.ts';
import { validateActivation } from '../activation.ts';
import { sha256Canonical } from '../canonical-json.ts';
import type {
  MergeExecutorActivationRecord,
  ReleaseAuthorityPort,
  ReleaseAdmissionInput,
  TrustedCurrentPolicyAttestation,
} from '../contracts.ts';
import {
  aggregateGateSnapshotDigest,
} from '../gate-admissibility.ts';
import {
  executorPermissionMapIsConfined,
} from '../policy-control.ts';
import { execute } from '../execute.ts';
import { buildHarness } from './helpers/execution.ts';
import {
  HEAD_OID,
  acceptanceFor,
  blockingFinding,
  buildAttestation,
  digest,
  gateSnapshotOf,
  irreversibleAuthorizationFor,
  oid,
  passingRelation,
  reseal,
  resealCommand,
  resignAttestation,
  sealBundle,
  securitySnapshotOf,
  validActivationRecord,
  validAuthorPhase,
  validControlPhase,
  validGateSnapshot,
  validManifest,
  validScenario,
} from './helpers/fixtures.ts';

function refusalCode(input: ReleaseAdmissionInput): string {
  const result = admit(input);
  return result.status === 'refused' ? result.refusal.code : result.status;
}

function authorityOverride(
  base: ReleaseAuthorityPort,
  overrides: Partial<ReleaseAuthorityPort>,
): ReleaseAuthorityPort {
  return {
    identity: base.identity,
    resolveArtifact: base.resolveArtifact.bind(base),
    resolvePassingGate: base.resolvePassingGate.bind(base),
    resolveTrustRoot: base.resolveTrustRoot.bind(base),
    resolveAuthorizedHuman: base.resolveAuthorizedHuman.bind(base),
    enumerateAdmissionUniverse: base.enumerateAdmissionUniverse.bind(base),
    resolveIssuerStatus: base.resolveIssuerStatus.bind(base),
    authenticateExecutionEvidence: base.authenticateExecutionEvidence.bind(base),
    resolveHumanDecision: base.resolveHumanDecision.bind(base),
    resolveAcceptedRisk: base.resolveAcceptedRisk.bind(base),
    ...overrides,
  };
}

test('F-057-01: unrelated lineage, target, and producer all remain dormant', () => {
  const scenario = validScenario();
  const probes: MergeExecutorActivationRecord[] = [
    reseal({
      ...validActivationRecord(),
      implementationReview: {
        ...validActivationRecord().implementationReview,
        lineage: 'LIN-UNRELATED-REVIEW',
      },
    }),
    reseal({
      ...validActivationRecord(),
      implementationReview: {
        ...validActivationRecord().implementationReview,
        targetCommit: oid('unrelated-target'),
      },
      implementationSecurityReview: {
        ...validActivationRecord().implementationSecurityReview,
        targetCommit: oid('unrelated-target'),
      },
    }),
    reseal({
      ...validActivationRecord(),
      implementationReview: {
        ...validActivationRecord().implementationReview,
        producer: {
          principalId: 'unrelated-producer',
          principalType: 'agent_role',
          authorizationCommit: oid('unrelated-authorization'),
        },
      },
    }),
  ];
  for (const activation of probes) {
    assert.equal(
      validateActivation(activation, scenario.authority).status,
      'not_activated',
    );
    assert.equal(refusalCode({ ...scenario, activation }), 'AuthorityNotActivated');
  }
});

test('F-057-02: an expired authenticated retry deadline survives recovery', async () => {
  const harness = buildHarness();
  const planDigest = sha256Canonical(harness.plan);
  await harness.store.recordRetrySequence(
    harness.plan.idempotencyKey,
    planDigest,
    '2026-08-07T23:57:00.000Z',
    '2026-08-07T23:59:00.000Z',
  );
  await harness.store.recordAttempt(harness.plan.idempotencyKey, 1);

  const result = await execute(harness.dependencies, harness.executionInput);
  assert.equal(result.status, 'refused');
  if (result.status === 'refused') {
    assert.equal(result.refusal.code, 'RetryExhausted');
  }
  assert.equal(harness.mergePort.callCount, 0);
  assert.equal(harness.store.attempts.get(harness.plan.idempotencyKey), 1);
});

test('F-057-02: recovered attempts without a sequence start fail closed', async () => {
  const harness = buildHarness();
  await harness.store.recordAttempt(harness.plan.idempotencyKey, 1);
  const result = await execute(harness.dependencies, harness.executionInput);
  assert.equal(result.status, 'refused');
  if (result.status === 'refused') {
    assert.equal(result.refusal.code, 'IntentReceiptInvalid');
  }
  assert.equal(harness.mergePort.callCount, 0);
});

test('F-057-03: production sources contain no literal NUL bytes', () => {
  for (const path of [
    new URL('../gate-admissibility.ts', import.meta.url),
    new URL('../published-head-evidence.ts', import.meta.url),
  ]) {
    assert.equal(readFileSync(path).includes(0), false);
  }
});

test('F-058-01: an unresolvable activation record cannot self-authenticate', () => {
  const scenario = validScenario();
  const base = scenario.authority!;
  const recordSource = scenario.activation!.recordSource;
  const authority = authorityOverride(base, {
    resolveArtifact: (ref) =>
      ref.commit === recordSource.commit && ref.path === recordSource.path
        ? null
        : base.resolveArtifact(ref),
  });
  assert.equal(
    refusalCode({ ...scenario, authority }),
    'AuthorityNotActivated',
  );
});

test('F-058-01: caller-computable configuration without an authority resolver stays dormant', () => {
  const scenario = validScenario();
  const result = productionAdmit(scenario, null);
  assert.equal(result.status, 'refused');
  if (result.status === 'refused') {
    assert.equal(result.refusal.code, 'AuthorityNotActivated');
  }
});

test('F-058-02: literal permission confinement rejects missing and forbidden grants', () => {
  assert.equal(
    executorPermissionMapIsConfined({
      contents: 'write',
      pull_requests: 'read',
      checks: 'read',
      commit_statuses: 'read',
    }),
    false,
  );
  assert.equal(
    executorPermissionMapIsConfined({
      contents: 'write',
      pull_requests: 'read',
      checks: 'read',
      commit_statuses: 'read',
      metadata: 'read',
      administration: 'read',
    }),
    false,
  );
});

test('F-058-02: a truncated policy-source universe is invalid', () => {
  const scenario = validScenario();
  const observation = scenario.policyControlFacts.observation;
  assert.equal(observation.state, 'current_valid');
  if (observation.state !== 'current_valid') return;
  const attestation = observation.attestation;
  const sources = attestation.policy.policySources.filter(
    (source) => source.sourceLevel !== 'enterprise',
  );
  const mutated = resignAttestation({
    ...attestation,
    policy: {
      ...attestation.policy,
      policySources: sources,
      effectiveRules: attestation.policy.effectiveRules.filter(
        (rule) => rule.sourceLevel !== 'enterprise',
      ),
    },
  });
  assert.equal(
    refusalCode({
      ...scenario,
      policyControlFacts: {
        ...scenario.policyControlFacts,
        observation: { state: 'current_valid', attestation: mutated },
      },
    }),
    'PolicyAttestationInvalid',
  );
});

test('F-058-02: independently revoked issuer status overrides a signed active claim', () => {
  const scenario = validScenario();
  const base = scenario.authority!;
  const authority = authorityOverride(base, {
    resolveIssuerStatus: (authorityId, keyId, generation) => {
      const status = base.resolveIssuerStatus(authorityId, keyId, generation);
      return status === null
        ? null
        : { ...status, state: 'revoked', evidenceDigest: digest('revoked-status') };
    },
  });
  assert.equal(
    refusalCode({ ...scenario, authority }),
    'PolicyAttestationInvalid',
  );
});

test('F-058-03: caller-resealed authority data cannot narrow the gate universe', () => {
  const scenario = validScenario();
  const gateSnapshot = validGateSnapshot();
  const narrowed = {
    relations: gateSnapshot.relations.slice(0, -1),
    snapshotDigest: aggregateGateSnapshotDigest(gateSnapshot.relations.slice(0, -1)),
  };
  assert.equal(
    refusalCode({ ...scenario, gateSnapshot: narrowed }),
    'SourceRecordInvalid',
  );
});

test('F-058-03: an authority artifact with a different producer is rejected', () => {
  const scenario = validScenario();
  const base = scenario.authority!;
  const manifestSource = scenario.manifestSource!;
  const authority = authorityOverride(base, {
    resolveArtifact: (ref) => {
      const resolved = base.resolveArtifact(ref);
      return resolved !== null && ref.commit === manifestSource.commit
        ? {
            ...resolved,
            producer: {
              principalId: 'untrusted-producer',
              principalType: 'agent_role' as const,
              authorizationCommit: oid('untrusted-producer-authorization'),
            },
          }
        : resolved;
    },
  });
  assert.equal(refusalCode({ ...scenario, authority }), 'SourceRecordInvalid');
});

test('F-058-03: an unresolvable human decision cannot authorize production coupling', () => {
  const policyCommit = oid('deployment-policy');
  const scenario = validScenario({
    manifest: validManifest({
      irreversibleProductionCoupling: {
        coupled: true,
        policyCommit,
        authorization: irreversibleAuthorizationFor(policyCommit),
      },
    }),
  });
  const authority = authorityOverride(scenario.authority!, {
    resolveHumanDecision: () => null,
  });
  const result = admit({ ...scenario, authority });
  assert.equal(result.status, 'human_exception_required');
  if (result.status === 'human_exception_required') {
    assert.equal(result.exception.classification, 'unclassifiable');
  }
});

test('F-058-03: an unresolvable accepted-risk decision cannot waive a finding', () => {
  const finding = blockingFinding();
  const acceptedRisk = acceptanceFor(finding);
  const relations = validGateSnapshot().relations.map((relation) =>
    relation.gate === 'security' && relation.lineageRound === 2
      ? {
          ...relation,
          verdictState: 'formally_accepted' as const,
          acceptedRisks: [acceptedRisk],
        }
      : relation,
  );
  const scenario = validScenario({
    gateSnapshot: gateSnapshotOf(relations),
    securitySnapshot: securitySnapshotOf([finding]),
  });
  const authority = authorityOverride(scenario.authority!, {
    resolveAcceptedRisk: () => null,
  });
  assert.equal(
    refusalCode({ ...scenario, authority }),
    'SecurityRiskAcceptanceInvalid',
  );
});

test('F-058-04: one process cannot authenticate both publication phases by relabelling', () => {
  const scenario = validScenario();
  const author = validAuthorPhase();
  const control = validControlPhase(author);
  const relabelled = {
    ...control,
    commands: control.commands.map((command) =>
      resealCommand({
        ...command,
        producer: {
          role: 'self-declared-control',
          executionSessionId: 'self-declared-second-session',
        },
      }),
    ),
  };
  const bundle = sealBundle(author, relabelled);
  assert.equal(
    refusalCode({ ...scenario, publishedHeadEvidence: bundle }),
    'SourceRecordInvalid',
  );
});

test('F-058-05: control characters are rejected and tuple digests are permutation-stable', () => {
  const malicious = passingRelation('review', 1);
  const snapshot = {
    relations: [{ ...malicious, lineage: 'LIN-RELEASE-REVIEW\u0000suffix' }],
    snapshotDigest: aggregateGateSnapshotDigest([
      { ...malicious, lineage: 'LIN-RELEASE-REVIEW\u0000suffix' },
    ]),
  };
  assert.notEqual(admit(validScenario({ gateSnapshot: snapshot })).status, 'admitted');

  // These two old NUL-delimited keys were identical: `a\0b\0c\0...`.
  const relations = [
    { ...passingRelation('review', 1), lineage: 'a', gate: 'b\u0000c' as never },
    { ...passingRelation('review', 1), lineage: 'a\u0000b', gate: 'c' as never },
  ];
  const baseline = aggregateGateSnapshotDigest(relations);
  assert.equal(aggregateGateSnapshotDigest([...relations].reverse()), baseline);
});
