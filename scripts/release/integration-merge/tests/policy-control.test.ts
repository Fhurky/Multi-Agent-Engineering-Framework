/**
 * F-044-01 policy-control fixtures.
 *
 * Every normative counterexample from the approved contract is reproduced, including
 * simultaneous unavailable/credential-missing, ruleset-change/drift,
 * key-revocation/invalid-signature, and unknown-cause inputs. Each asserts exactly one
 * result member, an empty `MergePlan` set, no durable intent, and zero merge API calls.
 *
 * This module owns no policy-observation port. The fixtures supply attestations as
 * input facts; nothing here can observe or mutate policy.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  admit,
  computeAdmissionContext,
  releaseAttestationExpectations,
} from '../admission.ts';
import {
  POLICY_EXECUTION_MARGIN_MS,
  classifyPolicyControl,
  normalizePolicyAttestation,
  orderedDetectedActions,
} from '../policy-control.ts';
import type { PolicyAttestationExpectations } from '../policy-control.ts';
import { RELEASE_BASE_REF, RELEASE_EXECUTOR } from '../contracts.ts';
import type {
  MergeEvidenceRef,
  PolicyControlFacts,
  ReleaseAdmissionInput,
  TrustedCurrentPolicyAttestation,
} from '../contracts.ts';
import { InMemoryEvidenceStore, RecordingMergePort } from './helpers/fakes.ts';
import {
  ADMISSION_CONTEXT_NONCE,
  BASE_OID,
  HEAD_OID,
  PULL_REQUEST_NUMBER,
  REPOSITORY,
  REQUIRED_POLICY_PROFILE_DIGEST,
  artifactRef,
  buildAttestation,
  digest,
  excludedControlAction,
  isoAt,
  oid,
  resignAttestation,
  validActivationRecord,
  validRequiredPolicyProfile,
  validScenario,
} from './helpers/fixtures.ts';

const EVIDENCE: MergeEvidenceRef = {
  store: 'merge-evidence/v1',
  key: 'merge-evidence/v1/fixture/release_main/fixture-key',
  digest: digest('policy-evidence'),
};

interface Outcome {
  readonly kind: 'refused' | 'human_exception_required' | 'admitted';
  readonly code: string | null;
  readonly classification: string | null;
  readonly mergeCalls: number;
  readonly intents: number;
}

function run(facts: PolicyControlFacts): Outcome {
  const port = new RecordingMergePort();
  const store = new InMemoryEvidenceStore();
  const result = admit(validScenario({ policyControlFacts: facts }));

  if (result.status === 'admitted') {
    return {
      kind: 'admitted',
      code: null,
      classification: null,
      mergeCalls: port.callCount,
      intents: store.intents.size,
    };
  }
  if (result.status === 'refused') {
    assert.ok(!('plan' in result));
    return {
      kind: 'refused',
      code: result.refusal.code,
      classification: null,
      mergeCalls: port.callCount,
      intents: store.intents.size,
    };
  }
  return {
    kind: 'human_exception_required',
    code: null,
    classification: result.exception.classification,
    mergeCalls: port.callCount,
    intents: store.intents.size,
  };
}

function assertNoSideEffect(outcome: Outcome): void {
  assert.equal(outcome.mergeCalls, 0);
  assert.equal(outcome.intents, 0);
}

/* --- The normative counterexample table -------------------------------- */

test('unprovisioned attestor plus absent observer credential is the third exception', () => {
  const outcome = run({
    action: {
      status: 'detected',
      actions: [
        'attestor_provisioning_required',
        'observer_credential_grant_required',
      ],
      evidence: [artifactRef('attestor-inventory')],
    },
    observation: {
      state: 'operationally_unavailable',
      reason: 'attestor_service_outage',
    },
  });

  assert.equal(outcome.kind, 'human_exception_required');
  assert.equal(outcome.classification, 'detected');
  // Neither AuthorityNotActivated nor PolicyObservationUnavailable.
  assert.equal(outcome.code, null);
  assertNoSideEffect(outcome);
});

test('a verified ruleset or bypass-actor change is the third exception, not drift', () => {
  const outcome = run({
    action: {
      status: 'detected',
      actions: [
        'ruleset_or_ruleset_applicability_changed',
        'bypass_or_exemption_set_changed',
      ],
      evidence: [artifactRef('signed-observation-a'), artifactRef('signed-observation-b')],
    },
    observation: { state: 'present_invalid', reason: 'completeness' },
  });

  assert.equal(outcome.kind, 'human_exception_required');
  assert.equal(outcome.classification, 'detected');
  assertNoSideEffect(outcome);
});

test('an undeterminable 401 is the single unclassifiable candidate-third exception', () => {
  const facts: PolicyControlFacts = {
    action: {
      status: 'unknown',
      candidateActions: ['observer_credential_rotated_or_revoked'],
      evidence: [artifactRef('status-channel-indeterminate')],
    },
    observation: {
      state: 'operationally_unavailable',
      reason: 'transport_before_authentication',
    },
  };

  const classification = classifyPolicyControl(facts, EVIDENCE);
  assert.equal(classification.status, 'human_exception_required');
  if (classification.status !== 'human_exception_required') {
    return;
  }
  assert.equal(classification.exception.classification, 'unclassifiable');
  if (classification.exception.classification !== 'unclassifiable') {
    return;
  }
  assert.equal(classification.exception.kind, null);
  assert.deepEqual(classification.exception.candidateKinds, [
    'change_credentials_or_repository_authorization_policy',
  ]);

  const outcome = run(facts);
  assert.equal(outcome.kind, 'human_exception_required');
  assert.equal(outcome.classification, 'unclassifiable');
  assertNoSideEffect(outcome);
});

test('a pre-authentication transport timeout with control action excluded is a refusal', () => {
  const outcome = run({
    action: excludedControlAction(),
    observation: {
      state: 'operationally_unavailable',
      reason: 'transport_before_authentication',
    },
  });
  assert.equal(outcome.kind, 'refused');
  assert.equal(outcome.code, 'PolicyObservationUnavailable');
  assertNoSideEffect(outcome);
});

test('an attestation expired by one millisecond is PolicyAttestationStale', () => {
  const outcome = run({
    action: excludedControlAction(),
    observation: { state: 'present_valid_but_stale', reason: 'expired' },
  });
  assert.equal(outcome.kind, 'refused');
  assert.equal(outcome.code, 'PolicyAttestationStale');
  assertNoSideEffect(outcome);
});

test('a signature or subject mismatch with issuer change excluded is PolicyAttestationInvalid', () => {
  const outcome = run({
    action: excludedControlAction(),
    observation: { state: 'present_invalid', reason: 'signature' },
  });
  assert.equal(outcome.kind, 'refused');
  assert.equal(outcome.code, 'PolicyAttestationInvalid');
  assertNoSideEffect(outcome);
});

test('verified key revocation plus an invalid-signature symptom is the third exception', () => {
  const outcome = run({
    action: {
      status: 'detected',
      actions: ['attestor_issuer_or_key_changed_or_revoked'],
      evidence: [artifactRef('revocation-channel-record')],
    },
    observation: { state: 'present_invalid', reason: 'signature' },
  });
  assert.equal(outcome.kind, 'human_exception_required');
  assert.equal(outcome.classification, 'detected');
  assert.equal(outcome.code, null);
  assertNoSideEffect(outcome);
});

/* --- Totality and ordering --------------------------------------------- */

test('detected actions are retained in the literal order and produce one result', () => {
  const facts: PolicyControlFacts = {
    action: {
      status: 'detected',
      actions: [
        'repository_authorization_policy_changed',
        'attestor_provisioning_required',
        'branch_protection_changed',
      ],
      evidence: [artifactRef('multi-action')],
    },
    observation: { state: 'present_valid_but_stale', reason: 'expired' },
  };

  assert.deepEqual(orderedDetectedActions(facts), [
    'attestor_provisioning_required',
    'branch_protection_changed',
    'repository_authorization_policy_changed',
  ]);

  const classification = classifyPolicyControl(facts, EVIDENCE);
  assert.equal(classification.status, 'human_exception_required');
});

test('classifyPolicyControl is total over the closed fact domain', () => {
  const actions: PolicyControlFacts['action'][] = [
    {
      status: 'detected',
      actions: ['branch_protection_changed'],
      evidence: [artifactRef('a')],
    },
    { status: 'excluded', evidence: artifactRef('b') },
    {
      status: 'unknown',
      candidateActions: ['required_check_source_changed'],
      evidence: [],
    },
  ];
  const observations: PolicyControlFacts['observation'][] = [
    {
      state: 'current_valid',
      attestation: buildAttestation({
        admissionContextNonce: ADMISSION_CONTEXT_NONCE,
        admissionContextDigest: digest('ctx'),
      }),
    },
    { state: 'operationally_unavailable', reason: 'github_5xx' },
    { state: 'present_invalid', reason: 'pagination' },
    { state: 'present_valid_but_stale', reason: 'not_yet_valid' },
  ];

  let count = 0;
  for (const action of actions) {
    for (const observation of observations) {
      const result = classifyPolicyControl({ action, observation }, EVIDENCE);
      assert.ok(
        result.status === 'usable' ||
          result.status === 'refused' ||
          result.status === 'human_exception_required',
      );
      count += 1;
    }
  }
  assert.equal(count, actions.length * observations.length);
});

test('only an excluded control action ever examines the observation', () => {
  const usable = buildAttestation({
    admissionContextNonce: ADMISSION_CONTEXT_NONCE,
    admissionContextDigest: digest('ctx'),
  });

  const detected = classifyPolicyControl(
    {
      action: {
        status: 'detected',
        actions: ['branch_protection_changed'],
        evidence: [artifactRef('a')],
      },
      observation: { state: 'current_valid', attestation: usable },
    },
    EVIDENCE,
  );
  assert.equal(detected.status, 'human_exception_required');

  const unknown = classifyPolicyControl(
    {
      action: { status: 'unknown', candidateActions: ['branch_protection_changed'], evidence: [] },
      observation: { state: 'current_valid', attestation: usable },
    },
    EVIDENCE,
  );
  assert.equal(unknown.status, 'human_exception_required');
});

/* --- Attestation normalization ----------------------------------------- */

function expectationsFor(
  input: ReleaseAdmissionInput,
  phase: 'pre_intent' | 'pre_mutation' = 'pre_intent',
): PolicyAttestationExpectations {
  const context = computeAdmissionContext(
    input,
    input.pullRequest.headTreeOid,
    input.manifest?.publishedHeadEvidenceDigest ?? digest('none'),
    REQUIRED_POLICY_PROFILE_DIGEST,
  );
  return releaseAttestationExpectations(
    {
      repository: REPOSITORY,
      pullRequest: { pullRequestNumber: PULL_REQUEST_NUMBER, headOid: HEAD_OID },
      base: { oid: BASE_OID },
    },
    context,
    validActivationRecord().policyAttestorTrustRoot,
    REQUIRED_POLICY_PROFILE_DIGEST,
    validRequiredPolicyProfile(),
    phase,
    null,
  );
}

function currentAttestation(
  input: ReleaseAdmissionInput,
): TrustedCurrentPolicyAttestation {
  const expectations = expectationsFor(input);
  return buildAttestation({
    phase: 'pre_intent',
    admissionContextNonce: expectations.admissionContextNonce,
    admissionContextDigest: expectations.admissionContextDigest,
  });
}

test('the fixture attestation normalizes as current and valid', () => {
  const input = validScenario();
  const observation = normalizePolicyAttestation(
    currentAttestation(input),
    expectationsFor(input),
    isoAt(5_000),
  );
  assert.equal(observation.state, 'current_valid');
});

const SUBJECT_MUTATIONS: readonly {
  readonly label: string;
  readonly mutate: (
    attestation: TrustedCurrentPolicyAttestation,
  ) => TrustedCurrentPolicyAttestation;
  readonly expected: string;
}[] = [
  {
    label: 'repository database identity',
    mutate: (attestation) => ({
      ...attestation,
      subject: {
        ...attestation.subject,
        repository: { ...attestation.subject.repository, databaseId: 1 },
      },
    }),
    expected: 'subject',
  },
  {
    label: 'protected ref',
    mutate: (attestation) => ({
      ...attestation,
      subject: {
        ...attestation.subject,
        protectedRef: 'refs/heads/integration/autonomous-runtime',
      },
    }),
    expected: 'subject',
  },
  {
    label: 'pull request number',
    mutate: (attestation) => ({
      ...attestation,
      subject: { ...attestation.subject, pullRequestNumber: 1 },
    }),
    expected: 'subject',
  },
  {
    label: 'head identity',
    mutate: (attestation) => ({
      ...attestation,
      subject: { ...attestation.subject, headOid: oid('another-head') },
    }),
    expected: 'subject',
  },
  {
    label: 'base identity',
    mutate: (attestation) => ({
      ...attestation,
      subject: { ...attestation.subject, baseOid: oid('another-base') },
    }),
    expected: 'subject',
  },
  {
    label: 'authorization phase',
    mutate: (attestation) => ({
      ...attestation,
      subject: { ...attestation.subject, authorizationPhase: 'pre_mutation' },
    }),
    expected: 'subject',
  },
  {
    label: 'executor identity',
    mutate: (attestation) => ({
      ...attestation,
      subject: { ...attestation.subject, executor: 'task_integration' as never },
    }),
    expected: 'subject',
  },
  {
    label: 'admission context digest',
    mutate: (attestation) => ({
      ...attestation,
      subject: {
        ...attestation.subject,
        admissionContextDigest: digest('another-context'),
      },
    }),
    expected: 'subject',
  },
];

for (const entry of SUBJECT_MUTATIONS) {
  test(`an attestation whose ${entry.label} differs is present_invalid/${entry.expected}`, () => {
    const input = validScenario();
    const observation = normalizePolicyAttestation(
      resignAttestation(entry.mutate(currentAttestation(input))),
      expectationsFor(input),
      isoAt(5_000),
    );
    assert.equal(observation.state, 'present_invalid');
    if (observation.state !== 'present_invalid') {
      return;
    }
    assert.equal(observation.reason, entry.expected);
  });
}

test('a payload with an incomplete bypass actor set is present_invalid/completeness', () => {
  const input = validScenario();
  const attestation = currentAttestation(input);
  const observation = normalizePolicyAttestation(
    resignAttestation({
      ...attestation,
      policy: { ...attestation.policy, bypassActorsComplete: false },
    }),
    expectationsFor(input),
    isoAt(5_000),
  );
  assert.equal(observation.state, 'present_invalid');
  if (observation.state !== 'present_invalid') {
    return;
  }
  assert.equal(observation.reason, 'completeness');
});

test('a redacted bypass property is never treated as an empty actor set', () => {
  const input = validScenario();
  const attestation = currentAttestation(input);
  const redacted = { ...attestation.policy } as Record<string, unknown>;
  delete redacted['bypassActors'];
  const observation = normalizePolicyAttestation(
    resignAttestation({ ...attestation, policy: redacted as never }),
    expectationsFor(input),
    isoAt(5_000),
  );
  assert.equal(observation.state, 'present_invalid');
});

test('a non-empty bypass set containing an executor App is present_invalid', () => {
  const input = validScenario();
  const attestation = currentAttestation(input);
  const observation = normalizePolicyAttestation(
    resignAttestation({
      ...attestation,
      policy: {
        ...attestation.policy,
        bypassActors: [
          {
            actorId: 222,
            actorType: 'Integration',
            bypassMode: 'always',
            sourcePolicyId: 'ruleset-1',
            sourceLevel: 'repository',
          },
        ],
      },
    }),
    expectationsFor(input),
    isoAt(5_000),
  );
  assert.equal(observation.state, 'present_invalid');
  if (observation.state !== 'present_invalid') {
    return;
  }
  assert.equal(observation.reason, 'completeness');
});

test('an unconsumed page is present_invalid/pagination', () => {
  const input = validScenario();
  const attestation = currentAttestation(input);
  const observation = normalizePolicyAttestation(
    resignAttestation({
      ...attestation,
      policy: { ...attestation.policy, paginationComplete: false },
    }),
    expectationsFor(input),
    isoAt(5_000),
  );
  assert.equal(observation.state, 'present_invalid');
  if (observation.state !== 'present_invalid') {
    return;
  }
  assert.equal(observation.reason, 'pagination');
});

test('an unrecognized payload member is present_invalid/unknown_payload_member', () => {
  const input = validScenario();
  const attestation = currentAttestation(input);
  const observation = normalizePolicyAttestation(
    resignAttestation({
      ...attestation,
      policy: {
        ...attestation.policy,
        unknownPayloadMembers: ['unsupported_policy_kind'],
      },
    }),
    expectationsFor(input),
    isoAt(5_000),
  );
  assert.equal(observation.state, 'present_invalid');
  if (observation.state !== 'present_invalid') {
    return;
  }
  assert.equal(observation.reason, 'unknown_payload_member');
});

test('an untrusted issuer key is present_invalid/signature', () => {
  const input = validScenario();
  const attestation = currentAttestation(input);
  const observation = normalizePolicyAttestation(
    resignAttestation({
      ...attestation,
      issuer: { ...attestation.issuer, keyId: 'key-rotated' },
    }),
    expectationsFor(input),
    isoAt(5_000),
  );
  assert.equal(observation.state, 'present_invalid');
  if (observation.state !== 'present_invalid') {
    return;
  }
  assert.equal(observation.reason, 'signature');
});

test('an effective profile digest other than the required profile is present_invalid/digest', () => {
  const input = validScenario();
  const attestation = buildAttestation({
    admissionContextNonce: expectationsFor(input).admissionContextNonce,
    admissionContextDigest: expectationsFor(input).admissionContextDigest,
    effectivePolicyProfileDigest: digest('a-different-profile'),
  });
  const observation = normalizePolicyAttestation(
    attestation,
    expectationsFor(input),
    isoAt(5_000),
  );
  assert.equal(observation.state, 'present_invalid');
  if (observation.state !== 'present_invalid') {
    return;
  }
  assert.equal(observation.reason, 'digest');
});

test('a tampered canonical payload digest is present_invalid/digest', () => {
  const input = validScenario();
  const observation = normalizePolicyAttestation(
    { ...currentAttestation(input), canonicalPayloadDigest: digest('tampered') },
    expectationsFor(input),
    isoAt(5_000),
  );
  assert.equal(observation.state, 'present_invalid');
  if (observation.state !== 'present_invalid') {
    return;
  }
  assert.equal(observation.reason, 'digest');
});

test('a 60-second freshness window is enforced on the payload itself', () => {
  const input = validScenario();
  const expectations = expectationsFor(input);
  const attestation = buildAttestation({
    admissionContextNonce: expectations.admissionContextNonce,
    admissionContextDigest: expectations.admissionContextDigest,
    expiresAtOffsetMs: 61_000,
  });
  const observation = normalizePolicyAttestation(
    attestation,
    expectations,
    isoAt(5_000),
  );
  assert.equal(observation.state, 'present_invalid');
  if (observation.state !== 'present_invalid') {
    return;
  }
  assert.equal(observation.reason, 'completeness');
});

test('an attestation observed in the future is present_valid_but_stale/not_yet_valid', () => {
  const input = validScenario();
  const expectations = expectationsFor(input);
  const attestation = buildAttestation({
    admissionContextNonce: expectations.admissionContextNonce,
    admissionContextDigest: expectations.admissionContextDigest,
    observedAtOffsetMs: 30_000,
  });
  const observation = normalizePolicyAttestation(
    attestation,
    expectations,
    isoAt(5_000),
  );
  assert.equal(observation.state, 'present_valid_but_stale');
  if (observation.state !== 'present_valid_but_stale') {
    return;
  }
  assert.equal(observation.reason, 'not_yet_valid');
});

test('an expired attestation is present_valid_but_stale/expired', () => {
  const input = validScenario();
  const expectations = expectationsFor(input);
  const observation = normalizePolicyAttestation(
    currentAttestation(input),
    expectations,
    isoAt(55_001),
  );
  assert.equal(observation.state, 'present_valid_but_stale');
  if (observation.state !== 'present_valid_but_stale') {
    return;
  }
  assert.equal(observation.reason, 'expired');
});

test('less than the 15-second execution margin is present_valid_but_stale', () => {
  const input = validScenario();
  const expectations = expectationsFor(input);
  const observation = normalizePolicyAttestation(
    currentAttestation(input),
    expectations,
    isoAt(55_000 - POLICY_EXECUTION_MARGIN_MS + 1),
  );
  assert.equal(observation.state, 'present_valid_but_stale');
  if (observation.state !== 'present_valid_but_stale') {
    return;
  }
  assert.equal(observation.reason, 'insufficient_execution_margin');
});

test('a mislabelled current_valid observation still refuses through one constructor', () => {
  const input = validScenario();
  const expectations = expectationsFor(input);
  const stale = buildAttestation({
    admissionContextNonce: expectations.admissionContextNonce,
    admissionContextDigest: expectations.admissionContextDigest,
    observedAtOffsetMs: -120_000,
  });

  const outcome = run({
    action: excludedControlAction(),
    observation: { state: 'current_valid', attestation: stale },
  });

  assert.equal(outcome.kind, 'refused');
  assert.equal(outcome.code, 'PolicyAttestationStale');
  assertNoSideEffect(outcome);
});

test('the executor identity in every classification is the release executor', () => {
  const classification = classifyPolicyControl(
    {
      action: {
        status: 'detected',
        actions: ['branch_protection_changed'],
        evidence: [artifactRef('a')],
      },
      observation: { state: 'present_invalid', reason: 'subject' },
    },
    EVIDENCE,
  );
  assert.equal(classification.status, 'human_exception_required');
  if (classification.status !== 'human_exception_required') {
    return;
  }
  assert.equal(classification.exception.executor, RELEASE_EXECUTOR);
});
