/**
 * Round-1 remediation fixtures.
 *
 * One section per finding recorded by `LIN-RELEASE-EXECUTOR-REVIEW` round 1
 * (`reports/code-review/TASK-049-RELEASE-MERGE-EXECUTOR-REVIEW.md` at
 * `7e78f1405e40e29034673944949c3851e466cf3c`) and `LIN-RELEASE-EXECUTOR-SECURITY`
 * round 1 (`reports/security/TASK-049-RELEASE-MERGE-EXECUTOR-SECURITY.md` at
 * `8b2da2f88d38872ded14bc18b739c6586ec47336`).
 *
 * Each case reconstructs that finding's own reproduced counterexample. Every one of
 * them was `admitted`, `merged`, or a thrown `TypeError` against
 * `9fb2eb0ca7c02101fd067452824e2612fda5cc0c`; each must now return exactly one typed
 * refusal or exception, with zero merge port calls.
 *
 * A remedy for one lens does not discharge the other lens's finding, so overlapping
 * pairs are exercised separately and named separately.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { admit, computeAdmissionContext } from './helpers/admission.ts';
import { execute } from '../execute.ts';
import { validateActivation } from '../activation.ts';
import { validateReleaseLineage } from '../release-lineage.ts';
import { validatePublishedHeadEvidence } from '../published-head-evidence.ts';
import { sha256Canonical } from '../canonical-json.ts';
import { RELEASE_GATE_DOMAINS } from '../contracts.ts';
import type {
  AggregateGateRelation,
  ExecutorAppIdentity,
  ImmutablePullRequestObservation,
  MergeExecutorActivationRecord,
  MergeOutcomeRecord,
  ReleaseAdmissionInput,
  ReleaseAdmissionResult,
  ReleaseMergePlan,
  ReleaseMergePortResult,
  ReleaseMergeRequest,
  ReleasePullRequestMergePort,
  TrustedCurrentPolicyAttestation,
} from '../contracts.ts';
import { InMemoryEvidenceStore, RecordingMergePort } from './helpers/fakes.ts';
import { buildHarness, MERGED_COMMIT_OID } from './helpers/execution.ts';
import {
  ADMISSION_CONTEXT_NONCE,
  ATTESTOR_PUBLIC_KEY_SPKI_BASE64,
  BASE_OID,
  BASE_TREE_OID,
  EXECUTOR_APPS,
  HEAD_OID,
  HEAD_TREE_OID,
  MERGE_PORT_IDENTITY,
  OBSERVER_PRINCIPALS,
  REQUIRED_CHECK_CONTEXTS,
  REQUIRED_POLICY_PROFILE_DIGEST,
  acceptanceFor,
  blockingFinding,
  buildAttestation,
  digest,
  excludedControlAction,
  gateSnapshotOf,
  initialTreeFor,
  inventoryFor,
  isoAt,
  irreversibleAuthorizationFor,
  oid,
  preMutationFacts,
  provenancedRef,
  resealCommand,
  resignAttestation,
  reseal,
  securitySnapshotOf,
  validActivationRecord,
  validAuthorPhase,
  validControlPhase,
  validGateSnapshot,
  validIntegrationEvidence,
  validManifest,
  validPublishedHeadBundle,
  validPullRequest,
  validRequiredChecks,
  validRequirements,
  validScenario,
  sealBundle,
} from './helpers/fixtures.ts';

/* ------------------------------------------------------------------------- *
 * Shared helpers
 * ------------------------------------------------------------------------- */

function refusalCodeOf(result: ReleaseAdmissionResult): string {
  if (result.status === 'admitted') {
    return 'admitted';
  }
  if (result.status === 'human_exception_required') {
    return `exception:${result.exception.classification}`;
  }
  assert.ok(!('plan' in result));
  return result.refusal.code;
}

/** Admits and asserts that no plan, no durable intent, and no merge call resulted. */
function admitWithNoSideEffect(input: ReleaseAdmissionInput): string {
  const port = new RecordingMergePort();
  const store = new InMemoryEvidenceStore();
  const result = admit(input);
  assert.equal(port.callCount, 0);
  assert.equal(store.intents.size, 0);
  return refusalCodeOf(result);
}

function currentAttestationOf(
  scenario: ReleaseAdmissionInput,
): TrustedCurrentPolicyAttestation {
  const observation = scenario.policyControlFacts.observation;
  assert.equal(observation.state, 'current_valid');
  if (observation.state !== 'current_valid') {
    throw new Error('fixture defect: the scenario carries no current attestation');
  }
  return observation.attestation;
}

/** Replaces the scenario's pre-intent attestation, leaving every other input valid. */
function withAttestation(
  scenario: ReleaseAdmissionInput,
  attestation: TrustedCurrentPolicyAttestation,
): ReleaseAdmissionInput {
  return {
    ...scenario,
    policyControlFacts: {
      action: excludedControlAction(),
      observation: { state: 'current_valid', attestation },
    },
  };
}

function contextOf(scenario: ReleaseAdmissionInput) {
  return computeAdmissionContext(
    scenario,
    scenario.pullRequest.headTreeOid,
    scenario.manifest?.publishedHeadEvidenceDigest ?? digest('none'),
    REQUIRED_POLICY_PROFILE_DIGEST,
  );
}

/** A merge port that runs a side effect on the call, then reports a transient failure. */
class SideEffectMergePort implements ReleasePullRequestMergePort {
  calls = 0;
  #onCall: () => void;
  #result: ReleaseMergePortResult;

  constructor(onCall: () => void, result: ReleaseMergePortResult) {
    this.#onCall = onCall;
    this.#result = result;
  }

  async mergeIntegrationPullRequestIntoMain(
    _request: ReleaseMergeRequest,
  ): Promise<ReleaseMergePortResult> {
    this.calls += 1;
    this.#onCall();
    return this.#result;
  }
}

function terminalRecord(
  plan: ReleaseMergePlan,
  overrides: Partial<MergeOutcomeRecord>,
): MergeOutcomeRecord {
  return {
    schema: 'merge-outcome/v1',
    executor: 'release_main',
    idempotencyKey: plan.idempotencyKey,
    planDigest: sha256Canonical(plan),
    status: 'refused',
    mergedCommitOid: null,
    resultTreeOid: null,
    refusalCode: null,
    humanExceptionKind: null,
    remediation: null,
    recordedAtUtc: '2026-08-08T00:00:00.000Z',
    ...overrides,
  };
}

/* ========================================================================= *
 * F-053-01 — policy attestations are cryptographically authenticated
 * ========================================================================= */

test('F-053-01: the reviewer counterexample — a forged non-Ed25519 signature refuses', () => {
  // The reviewer changed only `signature` to a different non-empty string. Because
  // `attestationPayloadDigest` excludes the signature, admission returned `admitted`.
  const scenario = validScenario();
  const forged = {
    ...currentAttestationOf(scenario),
    signature: 'a-different-non-empty-forged-string',
  };
  assert.equal(
    admitWithNoSideEffect(withAttestation(scenario, forged)),
    'PolicyAttestationInvalid',
  );
});

test('F-053-01: a signature made with a key the activation record does not pin refuses', () => {
  const scenario = validScenario();
  const context = contextOf(scenario);
  const wrongKey = buildAttestation({
    phase: 'pre_intent',
    admissionContextNonce: context.nonce,
    admissionContextDigest: context.digest,
    wrongKey: true,
  });
  assert.equal(
    admitWithNoSideEffect(withAttestation(scenario, wrongKey)),
    'PolicyAttestationInvalid',
  );
});

test('F-053-01: a signature that is not decodable base64 refuses', () => {
  const scenario = validScenario();
  for (const signature of ['!!!not base64!!!', 'AAA', 'ab==cd', '']) {
    const attestation = { ...currentAttestationOf(scenario), signature };
    assert.equal(
      admitWithNoSideEffect(withAttestation(scenario, attestation)),
      'PolicyAttestationInvalid',
      signature,
    );
  }
});

test('F-053-01: a correctly encoded signature of the wrong length refuses', () => {
  const scenario = validScenario();
  const attestation = {
    ...currentAttestationOf(scenario),
    signature: Buffer.alloc(32).toString('base64'),
  };
  assert.equal(
    admitWithNoSideEffect(withAttestation(scenario, attestation)),
    'PolicyAttestationInvalid',
  );
});

test('F-053-01: unusable pinned key material is AuthorityNotActivated, not a pass', () => {
  const record = validActivationRecord();
  for (const key of ['not-base64!', 'AAAA', ATTESTOR_PUBLIC_KEY_SPKI_BASE64.slice(4)]) {
    const mutated = reseal({
      ...record,
      policyAttestorTrustRoot: {
        ...record.policyAttestorTrustRoot,
        publicKeySpkiBase64: key,
      },
    });
    assert.equal(validateActivation(mutated).status, 'not_activated', key);
    assert.equal(
      admitWithNoSideEffect(validScenario({ activation: mutated })),
      'AuthorityNotActivated',
      key,
    );
  }
});

test('F-053-01: a trust root whose key bytes are not covered by the pinned digest refuses', () => {
  const record = validActivationRecord();
  const mutated = reseal({
    ...record,
    policyAttestorTrustRoot: {
      ...record.policyAttestorTrustRoot,
      publicKeyDigest: digest('an-unrelated-key'),
    },
  });
  assert.equal(
    admitWithNoSideEffect(validScenario({ activation: mutated })),
    'AuthorityNotActivated',
  );
});

test('F-053-01: a forged pre-mutation signature refuses with zero merge calls', async () => {
  const harness = buildHarness({
    preMutationFactsFor: (plan) => {
      const facts = preMutationFacts(plan);
      assert.equal(facts.observation.state, 'current_valid');
      if (facts.observation.state !== 'current_valid') {
        throw new Error('fixture defect');
      }
      return {
        action: excludedControlAction(),
        observation: {
          state: 'current_valid',
          attestation: {
            ...facts.observation.attestation,
            signature: 'a-different-non-empty-forged-string',
          },
        },
      };
    },
  });

  const result = await execute(harness.dependencies, harness.executionInput);

  assert.equal(result.status, 'refused');
  if (result.status !== 'refused') {
    return;
  }
  assert.equal(result.refusal.code, 'PolicyAttestationInvalid');
  assert.equal(harness.mergePort.callCount, 0);
});

test('F-053-01: a wrong-key pre-mutation signature refuses with zero merge calls', async () => {
  const harness = buildHarness({
    preMutationFactsFor: (plan) =>
      preMutationFacts(plan, { wrongKey: true }),
  });

  const result = await execute(harness.dependencies, harness.executionInput);

  assert.equal(result.status, 'refused');
  if (result.status !== 'refused') {
    return;
  }
  assert.equal(result.refusal.code, 'PolicyAttestationInvalid');
  assert.equal(harness.mergePort.callCount, 0);
});

/* ========================================================================= *
 * F-054-01 — least-privilege identity, observer set, and revocation
 * ========================================================================= */

const OVERPRIVILEGED_PERMISSIONS: readonly Readonly<Record<string, string>>[] = [
  { administration: 'write' },
  { actions: 'write' },
  { secrets: 'write' },
  { checks: 'write' },
  { statuses: 'write' },
  { environments: 'write' },
  { deployments: 'write' },
  { issues: 'write' },
];

for (const extra of OVERPRIVILEGED_PERMISSIONS) {
  const name = Object.keys(extra)[0] as string;
  test(`F-054-01: a release App permission map augmented with ${name} refuses`, () => {
    // The security reviewer's probe returned `admitted` for a permission map augmented
    // with Administration, Actions, Secrets, checks-write, and commit-status-write.
    const scenario = validScenario();
    const context = contextOf(scenario);
    const apps: ExecutorAppIdentity[] = EXECUTOR_APPS.map((app, index) =>
      index === 1
        ? { ...app, permissions: { ...app.permissions, ...extra } as never }
        : app,
    );
    const attestation = buildAttestation({
      phase: 'pre_intent',
      admissionContextNonce: context.nonce,
      admissionContextDigest: context.digest,
      executorApps: apps,
    });
    assert.equal(
      admitWithNoSideEffect(withAttestation(scenario, attestation)),
      'PolicyAttestationInvalid',
      name,
    );
  });
}

test('F-054-01: a substituted executor App identity refuses', () => {
  const scenario = validScenario();
  const context = contextOf(scenario);
  const apps = EXECUTOR_APPS.map((app, index) =>
    index === 1 ? { ...app, appId: 999, installationId: 9999 } : app,
  );
  const attestation = buildAttestation({
    phase: 'pre_intent',
    admissionContextNonce: context.nonce,
    admissionContextDigest: context.digest,
    executorApps: apps,
  });
  assert.equal(
    admitWithNoSideEffect(withAttestation(scenario, attestation)),
    'PolicyAttestationInvalid',
  );
});

test('F-054-01: a subject App list that differs from the observed policy list refuses', () => {
  const scenario = validScenario();
  const attestation = currentAttestationOf(scenario);
  const mutated = resignAttestation({
    ...attestation,
    policy: {
      ...attestation.policy,
      executorApps: EXECUTOR_APPS.map((app) => ({ ...app, installationId: 7 })),
    },
  });
  assert.equal(
    admitWithNoSideEffect(withAttestation(scenario, mutated)),
    'PolicyAttestationInvalid',
  );
});

test('F-054-01: an observer principal set that is not the pinned set refuses', () => {
  const scenario = validScenario();
  const attestation = currentAttestationOf(scenario);
  const principals = [
    ...OBSERVER_PRINCIPALS,
    {
      principalId: 'an-extra-observer',
      principalType: 'User',
      installationScope: 'repository',
      permissions: { administration: 'write' },
      credentialScopeDigest: digest('an-extra-observer-scope'),
    },
  ];
  const mutated = resignAttestation({
    ...attestation,
    policy: { ...attestation.policy, observerPrincipals: principals },
  });
  assert.equal(
    admitWithNoSideEffect(withAttestation(scenario, mutated)),
    'PolicyAttestationInvalid',
  );
});

test('F-054-01: an observer set digest that is merely claimed is recomputed and refused', () => {
  const scenario = validScenario();
  const attestation = currentAttestationOf(scenario);
  const mutated = resignAttestation({
    ...attestation,
    issuer: {
      ...attestation.issuer,
      observerPrincipalSetDigest: digest('a-claimed-observer-digest'),
    },
    policy: {
      ...attestation.policy,
      observerPrincipalSetDigest: digest('a-claimed-observer-digest'),
    },
  });
  assert.equal(
    admitWithNoSideEffect(withAttestation(scenario, mutated)),
    'PolicyAttestationInvalid',
  );
});

for (const state of ['revoked', 'unknown'] as const) {
  test(`F-054-01: a signed issuer status of ${state} refuses`, () => {
    const scenario = validScenario();
    const context = contextOf(scenario);
    const attestation = buildAttestation({
      phase: 'pre_intent',
      admissionContextNonce: context.nonce,
      admissionContextDigest: context.digest,
      issuerStatusState: state,
    });
    assert.equal(
      admitWithNoSideEffect(withAttestation(scenario, attestation)),
      'PolicyAttestationInvalid',
      state,
    );
  });
}

test('F-054-01: an issuer status from another revocation channel refuses', () => {
  const scenario = validScenario();
  const attestation = currentAttestationOf(scenario);
  const mutated = resignAttestation({
    ...attestation,
    policy: {
      ...attestation.policy,
      issuerStatus: {
        ...attestation.policy.issuerStatus,
        channelId: 'another-revocation-channel',
      },
    },
  });
  assert.equal(
    admitWithNoSideEffect(withAttestation(scenario, mutated)),
    'PolicyAttestationInvalid',
  );
});

test('F-054-01: a stale issuer status outside the freshness window refuses', () => {
  const scenario = validScenario();
  const attestation = currentAttestationOf(scenario);
  const mutated = resignAttestation({
    ...attestation,
    policy: {
      ...attestation.policy,
      issuerStatus: {
        ...attestation.policy.issuerStatus,
        observedAtUtc: '2026-08-07T00:00:00.000Z',
      },
    },
  });
  assert.equal(
    admitWithNoSideEffect(withAttestation(scenario, mutated)),
    'PolicyAttestationInvalid',
  );
});

test('F-054-01: required-check sources that are not the pinned profile set refuse', () => {
  const scenario = validScenario();
  const attestation = currentAttestationOf(scenario);
  const mutated = resignAttestation({
    ...attestation,
    policy: {
      ...attestation.policy,
      requiredCheckSources: [{ name: 'CI / validate', appId: 1 }],
    },
  });
  assert.equal(
    admitWithNoSideEffect(withAttestation(scenario, mutated)),
    'PolicyAttestationInvalid',
  );
});

/* ========================================================================= *
 * F-053-02 — authoritative-round resolution, all seven domains
 * ========================================================================= */

function duplicateAtAuthoritativeRound(
  domain: (typeof RELEASE_GATE_DOMAINS)[number],
): AggregateGateRelation[] {
  const relations = [...validGateSnapshot().relations];
  const authoritative = relations.find(
    (relation) => relation.gate === domain && relation.lineageRound === 2,
  ) as AggregateGateRelation;
  // The reviewer appended a second relation at the same authoritative round with
  // `verdictState: open` and `relationSetComplete: false`; admission selected the
  // earlier passing relation and returned `admitted`.
  return [
    ...relations,
    {
      ...authoritative,
      verdictState: 'open',
      relationSetComplete: false,
      verdictCommit: oid(`conflicting-verdict-${domain}`),
    },
  ];
}

for (const domain of RELEASE_GATE_DOMAINS) {
  test(`F-053-02: a conflicting duplicate ${domain} relation at the authoritative round refuses`, () => {
    const relations = duplicateAtAuthoritativeRound(domain);
    assert.equal(
      admitWithNoSideEffect(validScenario({ gateSnapshot: gateSnapshotOf(relations) })),
      'PreMergeGateOpen',
      domain,
    );
  });

  test(`F-053-02: the ${domain} duplicate refuses independently of array order`, () => {
    const relations = duplicateAtAuthoritativeRound(domain);
    // Permutation independence: the previous resolver used `find()`, so the observed
    // array order decided which conflicting relation won.
    assert.equal(
      admitWithNoSideEffect(
        validScenario({ gateSnapshot: gateSnapshotOf([...relations].reverse()) }),
      ),
      'PreMergeGateOpen',
      domain,
    );
    assert.equal(
      admitWithNoSideEffect(
        validScenario({
          gateSnapshot: gateSnapshotOf(
            [...relations].sort((left, right) =>
              left.verdictCommit < right.verdictCommit ? -1 : 1,
            ),
          ),
        }),
      ),
      'PreMergeGateOpen',
      domain,
    );
  });

  test(`F-053-02: a mutable ${domain} verdict ref at the authoritative round refuses`, () => {
    const relations = validGateSnapshot().relations.map((relation) =>
      relation.gate === domain && relation.lineageRound === 2
        ? { ...relation, verdictCommit: 'refs/heads/mutable-review' }
        : relation,
    );
    assert.equal(
      admitWithNoSideEffect(validScenario({ gateSnapshot: gateSnapshotOf(relations) })),
      'PreMergeGateNotPassing',
      domain,
    );
  });
}

test('F-053-02: a malformed relation anywhere in the claimed complete set refuses', () => {
  const relations = validGateSnapshot().relations.map((relation, index) =>
    index === 0 ? { ...relation, verdictState: 'unknown_state' as never } : relation,
  );
  assert.equal(
    admitWithNoSideEffect(validScenario({ gateSnapshot: gateSnapshotOf(relations) })),
    'PreMergeGateNotPassing',
  );
});

/* ========================================================================= *
 * F-054-03 — release authority evidence is neither caller-forged nor truncated
 * ========================================================================= */

test('F-054-03: a fabricated gate snapshot refuses even when its own digest is recomputed', () => {
  // The security reviewer supplied a snapshot containing both a passing and a
  // `changes_required` relation for the same authoritative round and observed
  // `admitted`. Recomputing the snapshot digest now changes the signed admission
  // context, so the attestation no longer binds the supplied evidence.
  const relations = duplicateAtAuthoritativeRound('review');
  const scenario = validScenario();
  const fabricated: ReleaseAdmissionInput = {
    ...scenario,
    gateSnapshot: gateSnapshotOf(relations),
    gateSnapshotSource: provenancedRef(
      'aggregate-gate-snapshot',
      'gate-snapshot',
      gateSnapshotOf(relations).snapshotDigest,
    ),
  };
  assert.equal(admitWithNoSideEffect(fabricated), 'SourceRecordInvalid');
});

test('F-054-03: a gate snapshot whose declared digest is not over its own relations refuses', () => {
  const scenario = validScenario();
  const tampered: ReleaseAdmissionInput = {
    ...scenario,
    gateSnapshot: {
      snapshotDigest: scenario.gateSnapshot.snapshotDigest,
      relations: scenario.gateSnapshot.relations.slice(1),
    },
  };
  assert.equal(admitWithNoSideEffect(tampered), 'SourceRecordInvalid');
});

test('F-054-03: a security snapshot whose declared digest is not over its own findings refuses', () => {
  const scenario = validScenario();
  const tampered: ReleaseAdmissionInput = {
    ...scenario,
    securitySnapshot: {
      snapshotDigest: scenario.securitySnapshot.snapshotDigest,
      findings: [blockingFinding()],
    },
  };
  assert.equal(admitWithNoSideEffect(tampered), 'SecurityEvidenceMissing');
});

test('F-054-03: a manifest source that does not contain the supplied manifest refuses', () => {
  const scenario = validScenario();
  assert.equal(
    admitWithNoSideEffect({
      ...scenario,
      manifestSource: provenancedRef(
        'release-gate-manifest',
        'release-gate-manifest',
        digest('some-other-manifest'),
      ),
    }),
    'ReleaseManifestInvalid',
  );
});

test('F-054-03: a caller-selected narrower required-check set refuses', () => {
  // The probe declared a single required context and observed `admitted`.
  assert.equal(
    admitWithNoSideEffect(
      validScenario({
        requiredChecks: {
          targetCommit: HEAD_OID,
          requiredContexts: [REQUIRED_CHECK_CONTEXTS[0] as never],
          observed: validRequiredChecks().observed.slice(0, 1),
        },
      }),
    ),
    'RequiredCheckMissing',
  );
});

test('F-054-03: a manifest requirement weaker than the pinned profile floor refuses', () => {
  const requirements = validRequirements().map((requirement) =>
    requirement.domain === 'security'
      ? { ...requirement, lineage: 'LIN-A-LINEAGE-OF-MY-CHOOSING' }
      : requirement,
  );
  assert.equal(
    admitWithNoSideEffect(validScenario({ manifest: validManifest({ requirements }) })),
    'ReleaseManifestInvalid',
  );
});

test('F-054-03: an accepted-risk record with a mutable human authorization refuses', () => {
  const finding = blockingFinding();
  const relations = validGateSnapshot().relations.map((relation) =>
    relation.gate === 'security' && relation.lineageRound === 2
      ? {
          ...relation,
          verdictState: 'formally_accepted' as never,
          acceptedRisks: [
            {
              ...acceptanceFor(finding),
              acceptedBy: {
                principalId: 'repository-owner',
                principalType: 'human' as const,
                authorizationCommit: 'refs/heads/main',
              },
            },
          ],
        }
      : relation,
  );
  assert.equal(
    admitWithNoSideEffect(
      validScenario({
        gateSnapshot: gateSnapshotOf(relations),
        securitySnapshot: securitySnapshotOf([finding]),
      }),
    ),
    'SecurityRiskAcceptanceInvalid',
  );
});

/* ========================================================================= *
 * F-053-03 — release-lineage completeness
 * ========================================================================= */

test('F-053-03: the reviewer counterexample — a digest-recomputed suffix refuses', () => {
  // The reviewer removed the first required content unit, retained only the TASK-018
  // suffix, recomputed and pinned the evidence-set digest, and observed `admitted`.
  const suffix = validIntegrationEvidence().filter(
    (unit) => unit.unitId === 'TASK-018',
  );
  const manifest = validManifest({
    // The evidence-set digest is recomputed over the truncated set, exactly as the
    // reviewer did. The pinned inventory and initial tree still name the full lineage.
    integrationEvidenceSetDigest: sha256Canonical(
      // Recomputed by the same canonical rule the module uses.
      [...suffix]
        .sort((left, right) => (left.orderKey < right.orderKey ? -1 : 1))
        .map((unit) => ({
          unitKind: unit.unitKind,
          unitId: unit.unitId,
          orderKey: unit.orderKey,
          proof: unit.proof,
          sourceOid: unit.sourceOid,
          mergeMethod: unit.mergeMethod,
          gateSnapshotDigest: unit.gateSnapshotDigest,
          previousResultTreeOid: unit.previousResultTreeOid,
          resultTreeOid: unit.resultTreeOid,
          subsumedBy: unit.subsumedBy,
        })),
    ),
  });

  const result = admit(
    validScenario({
      integrationEvidence: suffix,
      manifest,
      integrationEvidenceSource: provenancedRef(
        'release-integration-evidence',
        'integration-evidence',
        manifest.integrationEvidenceSetDigest,
      ),
    }),
  );
  assert.equal(refusalCodeOf(result), 'IntegrationEvidenceIncomplete');
});

test('F-053-03: a lineage whose first content unit is not the pinned initial tree refuses', () => {
  const units = validIntegrationEvidence().map((unit) =>
    unit.unitId === 'LIN-ARCH-REVIEW'
      ? { ...unit, previousResultTreeOid: oid('a-tree-of-my-choosing') }
      : unit,
  );
  const validation = validateReleaseLineage(
    units,
    HEAD_TREE_OID,
    digest('irrelevant'),
    inventoryFor(units),
    BASE_TREE_OID,
  );
  assert.equal(validation.status, 'refused');
  if (validation.status !== 'refused') {
    return;
  }
  assert.equal(validation.code, 'IntegrationEvidenceIncomplete');
  assert.equal(validation.reason, 'lineage_base_tree_not_pinned_initial_tree');
});

test('F-053-03: a caller `verified: true` on a unit outside the pinned inventory refuses', () => {
  const units = [
    ...validIntegrationEvidence(),
    {
      ...(validIntegrationEvidence()[1] as never),
      unitId: 'TASK-NOT-IN-THE-INVENTORY',
      orderKey: '0004',
      verified: true,
    },
  ];
  const validation = validateReleaseLineage(
    units as never,
    HEAD_TREE_OID,
    digest('irrelevant'),
    inventoryFor(validIntegrationEvidence()),
    initialTreeFor(validIntegrationEvidence()),
  );
  assert.equal(validation.status, 'refused');
  if (validation.status !== 'refused') {
    return;
  }
  assert.equal(validation.code, 'IntegrationOrderViolation');
  assert.equal(validation.reason, 'evidence_unit_absent_from_inventory');
});

/* ========================================================================= *
 * F-053-04 and F-054-02 — activation binding
 * ========================================================================= */

test('F-053-04: implementationReview substituted with a copy of architectureReview refuses', () => {
  // The reviewer replaced `implementationReview` with a copy of `architectureReview`
  // and observed `activated`.
  const record = validActivationRecord();
  const mutated = reseal({
    ...record,
    implementationReview: record.architectureReview,
  });
  assert.equal(validateActivation(mutated).status, 'not_activated');
  assert.equal(
    admitWithNoSideEffect(validScenario({ activation: mutated })),
    'AuthorityNotActivated',
  );
});

test('F-053-04: an artifact carrying producedByExecutor true refuses', () => {
  const record = validActivationRecord();
  const mutated = reseal({
    ...record,
    negativeCapabilityTestAttestation: {
      ...record.negativeCapabilityTestAttestation,
      producedByExecutor: true,
    },
  });
  assert.equal(
    admitWithNoSideEffect(validScenario({ activation: mutated })),
    'AuthorityNotActivated',
  );
});

test('F-054-02: an artifact with omitted provenance refuses', () => {
  const record = validActivationRecord();
  for (const member of [
    'negativeCapabilityTestAttestation',
    'gateVocabularyCorrection',
    'requiredGitHubPolicyProfile',
  ] as const) {
    const artifact = { ...(record[member] as unknown as Record<string, unknown>) };
    delete artifact['producedByExecutor'];
    delete artifact['producer'];
    const mutated = reseal({ ...record, [member]: artifact } as never);
    assert.equal(
      admitWithNoSideEffect(validScenario({ activation: mutated })),
      'AuthorityNotActivated',
      member,
    );
  }
});

test('F-054-02: an artifact produced by a merge executor principal refuses', () => {
  const record = validActivationRecord();
  const mutated = reseal({
    ...record,
    gateVocabularyCorrection: {
      ...record.gateVocabularyCorrection,
      producer: {
        principalId: 'release-merge-executor',
        principalType: 'merge_executor' as const,
        authorizationCommit: oid('executor-authorization'),
      },
    },
  });
  assert.equal(
    admitWithNoSideEffect(validScenario({ activation: mutated })),
    'AuthorityNotActivated',
  );
});

test('F-054-02: a required-profile artifact digest unequal to the effective digest refuses', () => {
  // The probe validated the artifact digest and the required digest independently and
  // never required them to be equal, so a substituted profile activated.
  const record = validActivationRecord();
  const mutated = reseal({
    ...record,
    requiredGitHubPolicyProfile: {
      ...record.requiredGitHubPolicyProfile,
      digest: digest('a-substituted-profile'),
    },
  });
  assert.equal(validateActivation(mutated).status, 'not_activated');
  assert.equal(
    admitWithNoSideEffect(validScenario({ activation: mutated })),
    'AuthorityNotActivated',
  );
});

test('F-054-02: a required-policy profile that is not the pinned document refuses', () => {
  const profile = {
    ...validScenario().requiredPolicyProfile,
    mergeMethodsRequired: ['merge', 'squash'],
  };
  assert.equal(
    admitWithNoSideEffect(
      validScenario({ requiredPolicyProfile: profile as never }),
    ),
    'AuthorityNotActivated',
  );
});

test('F-054-02: an activation record that does not authenticate itself refuses', () => {
  const record = validActivationRecord();
  const mutated: MergeExecutorActivationRecord = {
    ...record,
    // Every member is individually well formed, but the record's own artifact digest
    // no longer covers it.
    implementationReview: {
      ...record.implementationReview,
      lineageRound: 9,
    },
  };
  assert.equal(validateActivation(mutated).status, 'not_activated');
  assert.equal(
    admitWithNoSideEffect(validScenario({ activation: mutated })),
    'AuthorityNotActivated',
  );
});

test('F-054-02: a record whose issuer is not an authorized human refuses', () => {
  const record = validActivationRecord();
  const mutated = reseal({
    ...record,
    issuer: {
      principalId: 'release-merge-executor',
      principalType: 'automation' as never,
      authorizationCommit: oid('human-authorization'),
    },
  });
  assert.equal(
    admitWithNoSideEffect(validScenario({ activation: mutated })),
    'AuthorityNotActivated',
  );
});

test('F-054-02: an injected merge port outside the attested identity refuses', async () => {
  const harness = buildHarness({
    mergePortIdentity: {
      brokerId: 'an-arbitrary-injected-adapter',
      portIdentityDigest: digest('an-arbitrary-injected-adapter'),
    },
  });

  const result = await execute(harness.dependencies, harness.executionInput);

  assert.equal(result.status, 'refused');
  if (result.status !== 'refused') {
    return;
  }
  assert.equal(result.refusal.code, 'UnsupportedOperation');
  assert.equal(harness.mergePort.callCount, 0);
});

test('F-054-02: the attested port identity is what the dormant deployment declares', () => {
  const record = validActivationRecord();
  assert.deepEqual(
    record.negativeCapabilityTestAttestation.attestedMergePortIdentity,
    MERGE_PORT_IDENTITY,
  );
});

/* ========================================================================= *
 * F-053-05, F-054-04, F-054-05 — the execution boundary
 * ========================================================================= */

test('F-053-05: a preloaded terminal refusal makes zero merge calls', async () => {
  const first = buildHarness();
  await first.store.recordOutcome(
    terminalRecord(first.plan, {
      status: 'refused',
      refusalCode: 'PolicyAttestationInvalid',
    }),
  );

  const second = buildHarness({
    store: first.store,
    mergeResults: [
      {
        outcome: 'merged',
        mergedCommitOid: MERGED_COMMIT_OID,
        resultTreeOid: first.plan.expectedTreeOid,
      },
    ],
  });

  const result = await execute(second.dependencies, second.executionInput);

  assert.equal(result.status, 'refused');
  if (result.status !== 'refused') {
    return;
  }
  assert.equal(result.refusal.code, 'PolicyAttestationInvalid');
  assert.equal(second.mergePort.callCount, 0);
});

test('F-053-05: a preloaded terminal human exception makes zero merge calls', async () => {
  const first = buildHarness();
  await first.store.recordOutcome(
    terminalRecord(first.plan, {
      status: 'human_exception_required',
      humanExceptionKind: 'change_credentials_or_repository_authorization_policy',
    }),
  );

  const second = buildHarness({ store: first.store });
  const result = await execute(second.dependencies, second.executionInput);

  assert.equal(result.status, 'human_exception_required');
  if (result.status !== 'human_exception_required') {
    return;
  }
  assert.equal(result.exception.classification, 'detected');
  if (result.exception.classification !== 'detected') {
    return;
  }
  assert.equal(
    result.exception.kind,
    'change_credentials_or_repository_authorization_policy',
  );
  assert.equal(second.mergePort.callCount, 0);
});

test('F-054-04: a plan altered while retaining the admitted idempotency key refuses', async () => {
  // The probe changed only `expectedTreeOid`, retained the admitted key, and observed
  // `merged` with one merge call.
  const harness = buildHarness();
  const substituted: ReleaseMergePlan = {
    ...harness.plan,
    expectedTreeOid: oid('a-tree-of-my-choosing'),
  };

  const result = await execute(harness.dependencies, {
    ...harness.executionInput,
    plan: substituted,
  });

  assert.equal(result.status, 'refused');
  if (result.status !== 'refused') {
    return;
  }
  assert.equal(result.refusal.code, 'IntentReceiptInvalid');
  assert.equal(harness.mergePort.callCount, 0);
});

test('F-054-04: every plan field participates in the recomputed key', async () => {
  const harness = buildHarness();
  const fields: readonly (keyof ReleaseMergePlan)[] = [
    'headOid',
    'baseOid',
    'expectedTreeOid',
    'orderKey',
    'gateSnapshotDigest',
    'securitySnapshotDigest',
    'publishedHeadEvidenceDigest',
    'requiredPolicyProfileDigest',
    'policyDigest',
    'effectivePolicyProfileDigest',
    'preIntentPolicyAttestationDigest',
    'policyAdmissionContextNonce',
    'policyAdmissionContextDigest',
  ];

  for (const field of fields) {
    const substituted = {
      ...harness.plan,
      [field]: typeof harness.plan[field] === 'number' ? 424242 : digest(`altered-${String(field)}`),
    } as ReleaseMergePlan;
    const port = new RecordingMergePort();
    const result = await execute(
      { ...harness.dependencies, mergePort: port },
      { ...harness.executionInput, plan: substituted },
    );
    assert.equal(result.status, 'refused', String(field));
    assert.equal(port.callCount, 0, String(field));
  }
});

test('F-054-05: a retry after the protected base changes refuses instead of merging', async () => {
  const harness = buildHarness();
  const port = new SideEffectMergePort(
    () => {
      // The protected base moves while the first attempt is in flight.
      harness.observation.script.admissionFacts = {
        ...harness.observation.script.admissionFacts,
        base: { ref: 'refs/heads/main', oid: oid('main-moved-mid-flight') },
      };
    },
    { outcome: 'transient_failure', reason: 'server_error', retryAfterSeconds: null },
  );

  const result = await execute(
    { ...harness.dependencies, mergePort: port },
    harness.executionInput,
  );

  assert.equal(result.status, 'refused');
  if (result.status !== 'refused') {
    return;
  }
  assert.equal(result.refusal.code, 'BaseOidMismatch');
  assert.equal(port.calls, 1);
});

test('F-054-05: a retry that outlives the authorization refuses instead of merging', async () => {
  // The probe used a 50-second retry delay and reached a second merge call at the exact
  // instant the pre-mutation attestation expired.
  const harness = buildHarness({
    mergeResults: [
      { outcome: 'transient_failure', reason: 'rate_limit', retryAfterSeconds: 45 },
      {
        outcome: 'merged',
        mergedCommitOid: MERGED_COMMIT_OID,
        resultTreeOid: HEAD_TREE_OID,
      },
    ],
  });

  const result = await execute(harness.dependencies, harness.executionInput);

  assert.equal(result.status, 'refused');
  if (result.status !== 'refused') {
    return;
  }
  assert.equal(result.refusal.code, 'PolicyAttestationStale');
  assert.equal(harness.mergePort.callCount, 1);
});

test('F-054-05: an authorization is reacquired for every attempt, never reused', async () => {
  const harness = buildHarness({
    mergeResults: [
      { outcome: 'transient_failure', reason: 'transport', retryAfterSeconds: null },
      { outcome: 'transient_failure', reason: 'transport', retryAfterSeconds: null },
      {
        outcome: 'merged',
        mergedCommitOid: MERGED_COMMIT_OID,
        resultTreeOid: HEAD_TREE_OID,
      },
    ],
  });

  const result = await execute(harness.dependencies, harness.executionInput);

  assert.equal(result.status, 'merged');
  assert.equal(harness.mergePort.callCount, 3);
  assert.equal(harness.attestor.requestCount, 3);
  assert.deepEqual(
    harness.attestor.requests.map((request) => request.attempt),
    [1, 2, 3],
  );
});

/* ========================================================================= *
 * F-053-06 and F-054-06 — durable evidence and result reconciliation
 * ========================================================================= */

test('F-054-06: a forged terminal store record is rejected with zero merge calls', async () => {
  // The probe inserted a forged terminal outcome directly and observed `merged` with
  // zero GitHub calls and no reconciliation.
  const harness = buildHarness();
  harness.store.outcomes.set(
    harness.plan.idempotencyKey,
    terminalRecord(harness.plan, {
      status: 'merged',
      mergedCommitOid: MERGED_COMMIT_OID,
      resultTreeOid: harness.plan.expectedTreeOid,
    }),
  );

  const result = await execute(harness.dependencies, harness.executionInput);

  assert.equal(result.status, 'refused');
  if (result.status !== 'refused') {
    return;
  }
  assert.equal(result.refusal.code, 'IntentReceiptInvalid');
  assert.equal(harness.mergePort.callCount, 0);
});

test('F-054-06: a store-issued terminal record naming another plan is rejected', async () => {
  const harness = buildHarness();
  await harness.store.recordOutcome({
    ...terminalRecord(harness.plan, {
      status: 'merged',
      mergedCommitOid: MERGED_COMMIT_OID,
      resultTreeOid: harness.plan.expectedTreeOid,
    }),
    planDigest: digest('another-plan'),
  });

  const result = await execute(harness.dependencies, harness.executionInput);

  assert.equal(result.status, 'refused');
  if (result.status !== 'refused') {
    return;
  }
  assert.equal(result.refusal.code, 'ResultUnverifiable');
  assert.equal(harness.mergePort.callCount, 0);
});

test('F-053-06: the attempt count survives a fresh process', async () => {
  const first = buildHarness();
  // A previous process recorded the whole attempt budget and then died.
  await first.store.recordRetrySequence(
    first.plan.idempotencyKey,
    sha256Canonical(first.plan),
    isoAt(0),
    isoAt(120_000),
  );
  first.store.attempts.set(first.plan.idempotencyKey, 3);

  const second = buildHarness({ store: first.store });
  const result = await execute(second.dependencies, second.executionInput);

  assert.equal(result.status, 'refused');
  if (result.status !== 'refused') {
    return;
  }
  assert.equal(result.refusal.code, 'RetryExhausted');
  assert.equal(second.mergePort.callCount, 0);
});

test('F-053-06: a partly consumed budget leaves only the remaining attempts', async () => {
  const first = buildHarness();
  await first.store.recordRetrySequence(
    first.plan.idempotencyKey,
    sha256Canonical(first.plan),
    isoAt(0),
    isoAt(120_000),
  );
  first.store.attempts.set(first.plan.idempotencyKey, 2);

  const second = buildHarness({
    store: first.store,
    mergeResults: [
      { outcome: 'transient_failure', reason: 'transport', retryAfterSeconds: null },
    ],
    mergeFallback: {
      outcome: 'transient_failure',
      reason: 'transport',
      retryAfterSeconds: null,
    },
  });
  const result = await execute(second.dependencies, second.executionInput);

  assert.equal(result.status, 'refused');
  if (result.status !== 'refused') {
    return;
  }
  assert.equal(result.refusal.code, 'RetryExhausted');
  assert.equal(second.mergePort.callCount, 1);
});

test('F-054-06: a merged commit not reachable from the protected base is not a success', async () => {
  const harness = buildHarness({
    containment: {
      ref: 'refs/heads/main',
      baseOid: BASE_OID,
      containsMergedCommit: false,
      mergedCommitParents: [BASE_OID, HEAD_OID],
    },
  });

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

test('F-054-06: a merged commit whose parent order is wrong is not a success', async () => {
  const harness = buildHarness({
    containment: {
      ref: 'refs/heads/main',
      baseOid: BASE_OID,
      containsMergedCommit: true,
      // The release head as first parent: not an ordinary base-first release merge.
      mergedCommitParents: [HEAD_OID, BASE_OID],
    },
  });

  const result = await execute(harness.dependencies, harness.executionInput);

  assert.equal(result.status, 'refused');
  if (result.status !== 'refused') {
    return;
  }
  assert.equal(result.refusal.code, 'ResultUnverifiable');
});

test('F-054-06: an unauthenticated policy-authorization receipt refuses', async () => {
  const harness = buildHarness();
  const store = harness.store;
  const dependencies = {
    ...harness.dependencies,
    store: {
      ...store,
      recordIntent: store.recordIntent.bind(store),
      verifyIntent: store.verifyIntent.bind(store),
      recordRetrySequence: store.recordRetrySequence.bind(store),
      verifyRetrySequence: store.verifyRetrySequence.bind(store),
      recordAttempt: store.recordAttempt.bind(store),
      recordPolicyAuthorization: async (key: string, attestation: never) => ({
        ...(await store.recordPolicyAuthorization(key, attestation)),
        token: 'a-token-the-store-never-issued',
      }),
      verifyPolicyAuthorization: store.verifyPolicyAuthorization.bind(store),
      recordOutcome: store.recordOutcome.bind(store),
      read: store.read.bind(store),
      verifyHistory: store.verifyHistory.bind(store),
    },
  } as never;

  const result = await execute(dependencies, harness.executionInput);

  assert.equal(result.status, 'refused');
  if (result.status !== 'refused') {
    return;
  }
  assert.equal(result.refusal.code, 'IntentReceiptInvalid');
  assert.equal(harness.mergePort.callCount, 0);
});

test('F-053-06: an intent recorded for another plan refuses before any mutation', async () => {
  const harness = buildHarness();
  await harness.store.recordIntent({ ...harness.plan, orderKey: 'another-order-key' });
  // Occupy the key with a different plan under the same idempotency key.
  harness.store.intents.set(harness.plan.idempotencyKey, {
    planDigest: digest('another-plan'),
    token: 'token',
  });

  const result = await execute(harness.dependencies, harness.executionInput);

  assert.equal(result.status, 'refused');
  if (result.status !== 'refused') {
    return;
  }
  assert.equal(harness.mergePort.callCount, 0);
});

/* ========================================================================= *
 * F-054-07 — release-bound irreversible-production authorization
 * ========================================================================= */

function coupledScenario(
  authorization: unknown,
  policyCommit = oid('deployment-policy'),
): ReleaseAdmissionInput {
  return validScenario({
    manifest: validManifest({
      irreversibleProductionCoupling: {
        coupled: true,
        policyCommit,
        authorization: authorization as never,
      },
    }),
  });
}

test('F-054-07: an exactly bound authorization is admitted', () => {
  assert.equal(
    admitWithNoSideEffect(
      coupledScenario(irreversibleAuthorizationFor(oid('deployment-policy'))),
    ),
    'admitted',
  );
});

test('F-054-07: an authorization naming another release head refuses', () => {
  assert.equal(
    admitWithNoSideEffect(
      coupledScenario(
        irreversibleAuthorizationFor(
          oid('deployment-policy'),
          oid('another-release-head'),
        ),
      ),
    ),
    'exception:unclassifiable',
  );
});

test('F-054-07: an authorization naming another policy commit refuses', () => {
  assert.equal(
    admitWithNoSideEffect(
      coupledScenario(irreversibleAuthorizationFor(oid('another-policy'))),
    ),
    'exception:unclassifiable',
  );
});

test('F-054-07: an authorization naming another repository refuses', () => {
  assert.equal(
    admitWithNoSideEffect(
      coupledScenario(
        irreversibleAuthorizationFor(
          oid('deployment-policy'),
          HEAD_OID,
          'another/repository',
        ),
      ),
    ),
    'exception:unclassifiable',
  );
});

test('F-054-07: an authorization with a broadened scope digest refuses', () => {
  assert.equal(
    admitWithNoSideEffect(
      coupledScenario({
        ...irreversibleAuthorizationFor(oid('deployment-policy')),
        scopeDigest: digest('a-scope-that-waives-more'),
      }),
    ),
    'exception:unclassifiable',
  );
});

test('F-054-07: an authorization whose principal is not an authorized human refuses', () => {
  assert.equal(
    admitWithNoSideEffect(
      coupledScenario({
        ...irreversibleAuthorizationFor(oid('deployment-policy')),
        authorizedBy: {
          principalId: 'release-merge-executor',
          principalType: 'automation',
          authorizationCommit: oid('human-authorization'),
        },
      }),
    ),
    'exception:unclassifiable',
  );
});

test('F-054-07: an uncoupled main merge records no irreversible-action coupling', () => {
  const scenario = validScenario();
  assert.deepEqual(scenario.manifest?.irreversibleProductionCoupling, {
    coupled: false,
  });
  assert.equal(admitWithNoSideEffect(scenario), 'admitted');
});

/* ========================================================================= *
 * F-053-07 and F-054-08 — published-head evidence
 * ========================================================================= */

/** Re-points the no-later-content proof identifiers at the resealed proof commands. */
function withResealedProofIds(
  control: ReturnType<typeof validControlPhase>,
): ReturnType<typeof validControlPhase> {
  return {
    ...control,
    noLaterContent: {
      ...control.noLaterContent,
      proofCommandEvidenceIds: control.commands
        .filter((command) => command.materialArguments['proofKind'] !== undefined)
        .map((command) => command.evidenceId),
    },
  };
}

function bundleScenario(
  mutate: (
    author: ReturnType<typeof validAuthorPhase>,
    control: ReturnType<typeof validControlPhase>,
  ) => {
    author: ReturnType<typeof validAuthorPhase>;
    control: ReturnType<typeof validControlPhase>;
  },
): ReleaseAdmissionInput {
  const author = validAuthorPhase();
  const control = validControlPhase(author);
  const mutated = mutate(author, control);
  const bundle = sealBundle(mutated.author, mutated.control);
  return validScenario({
    publishedHeadEvidence: bundle,
    manifest: validManifest({
      publishedHeadEvidenceDigest: bundle.canonicalBundleDigest,
    }),
  });
}

test('F-053-07: the reviewer counterexample — an unbound remote ref refuses', () => {
  // The reviewer changed `control.noLaterContent.remoteRef` to an unrelated non-empty
  // ref, recomputed the canonical bundle digest, repinned the manifest, and observed
  // `admitted`.
  const author = validAuthorPhase();
  const control = validControlPhase(
    author,
    HEAD_OID,
    'integration/autonomous-runtime',
    99,
    'refs/remotes/somewhere/else',
  );
  const bundle = sealBundle(author, control);
  assert.equal(
    admitWithNoSideEffect(
      validScenario({
        publishedHeadEvidence: bundle,
        manifest: validManifest({
          publishedHeadEvidenceDigest: bundle.canonicalBundleDigest,
        }),
      }),
    ),
    'PublishedHeadEvidenceMismatch',
  );
});

test('F-053-07: an unbound resolved-base name refuses', () => {
  assert.equal(
    admitWithNoSideEffect(
      bundleScenario((author, control) => ({
        author: { ...author, resolvedBases: { 'some-other-base': BASE_OID } },
        control: { ...control, resolvedBases: { 'some-other-base': BASE_OID } },
      })),
    ),
    'PublishedHeadEvidenceMismatch',
  );
});

test('F-053-07: an unbound resolved-base value refuses', () => {
  assert.equal(
    admitWithNoSideEffect(
      bundleScenario((author, control) => ({
        author: { ...author, resolvedBases: { main: oid('some-other-base') } },
        control: { ...control, resolvedBases: { main: oid('some-other-base') } },
      })),
    ),
    'PublishedHeadEvidenceMismatch',
  );
});

test('F-053-07: a proof command that does not name the observed head refuses', () => {
  // The command is resealed, so the refusal is the semantic binding rather than a
  // stale self-digest.
  const scenario = bundleScenario((author, control) => ({
    author,
    control: withResealedProofIds({
      ...control,
      commands: control.commands.map((command) =>
        command.materialArguments['proofKind'] === 'remote_branch_head'
          ? resealCommand({
              ...command,
              materialArguments: {
                ...command.materialArguments,
                observedHeadOid: oid('a-head-the-proof-never-observed'),
              },
            })
          : command,
      ),
    }),
  }));
  assert.equal(admitWithNoSideEffect(scenario), 'PublishedHeadEvidenceMismatch');

  const bundle = scenario.publishedHeadEvidence;
  assert.ok(bundle !== null && bundle.status === 'complete');
  if (bundle === null || bundle.status !== 'complete') {
    return;
  }
  const validation = validatePublishedHeadEvidence(bundle);
  assert.equal(validation.status, 'refused');
  if (validation.status !== 'refused') {
    return;
  }
  assert.equal(
    validation.reason,
    'no_later_content_proof_head_unbound:remote_branch_head',
  );
});

test('F-053-07: a missing proof kind refuses', () => {
  assert.equal(
    admitWithNoSideEffect(
      bundleScenario((author, control) => ({
        author,
        control: {
          ...control,
          noLaterContent: {
            ...control.noLaterContent,
            proofCommandEvidenceIds: control.noLaterContent.proofCommandEvidenceIds.slice(
              0,
              2,
            ),
          },
        },
      })),
    ),
    'PublishedHeadEvidenceIncomplete',
  );
});

test('F-054-08: a same-producer two-phase bundle refuses', () => {
  const scenario = bundleScenario((author, control) => ({
    author,
    control: withResealedProofIds({
      ...control,
      commands: control.commands.map((command) =>
        // One producer manufacturing both phases, with every self-digest resealed so
        // the refusal is producer separation and not a stale projection.
        resealCommand({
          ...command,
          producer: author.commands[0]?.producer as never,
        }),
      ),
    }),
  }));
  assert.equal(admitWithNoSideEffect(scenario), 'PublishedHeadEvidenceMismatch');

  const bundle = scenario.publishedHeadEvidence;
  assert.ok(bundle !== null && bundle.status === 'complete');
  if (bundle === null || bundle.status !== 'complete') {
    return;
  }
  const validation = validatePublishedHeadEvidence(bundle);
  assert.equal(validation.status, 'refused');
  if (validation.status !== 'refused') {
    return;
  }
  assert.equal(validation.reason, 'phase_producer_sessions_not_independent');
});

test('F-054-08: a control phase split across two sessions refuses', () => {
  const scenario = bundleScenario((author, control) => ({
    author,
    control: {
      ...control,
      commands: control.commands.map((command, index) =>
        index === 0
          ? resealCommand({
              ...command,
              producer: {
                role: 'devops-control',
                executionSessionId: 'a-second-control-session',
              },
            })
          : command,
      ),
    },
  }));
  assert.equal(admitWithNoSideEffect(scenario), 'PublishedHeadEvidenceIncomplete');

  const bundle = scenario.publishedHeadEvidence;
  assert.ok(bundle !== null && bundle.status === 'complete');
  if (bundle === null || bundle.status !== 'complete') {
    return;
  }
  const validation = validatePublishedHeadEvidence(bundle);
  assert.equal(validation.status, 'refused');
  if (validation.status !== 'refused') {
    return;
  }
  assert.equal(validation.reason, 'phase_producer_not_a_single_session');
});

test('F-054-08: every proof command carries a reproducible result digest', () => {
  const bundle = validPublishedHeadBundle();
  const proofs = bundle.control.commands.filter(
    (command) => command.materialArguments['proofKind'] !== undefined,
  );
  assert.equal(proofs.length, 3);
  for (const proof of proofs) {
    assert.notEqual(proof.actualResult.outputDigest, null);
    assert.equal(proof.exitCode, proof.expectedExitCode);
  }
});

/* ========================================================================= *
 * F-053-08 — admission is total for hostile runtime input
 * ========================================================================= */

const HOSTILE_BOUNDARY_VALUES: readonly unknown[] = [
  null,
  undefined,
  0,
  '',
  'a string',
  true,
  [],
  {},
  Number.NaN,
];

const DECLARED_BOUNDARIES: readonly (keyof ReleaseAdmissionInput)[] = [
  'executor',
  'evaluatedAtUtc',
  'activation',
  'manifest',
  'manifestSource',
  'repository',
  'pullRequest',
  'base',
  'gateSnapshot',
  'gateSnapshotSource',
  'securitySnapshot',
  'securitySnapshotSource',
  'integrationEvidence',
  'integrationEvidenceSource',
  'requiredPolicyProfile',
  'requiredPolicyProfileSource',
  'requiredChecks',
  'changedPaths',
  'publishedHeadEvidence',
  'policyControlFacts',
  'orderKey',
  'admissionContextNonce',
];

test('F-053-08: the reviewer counterexample — a null security snapshot returns a typed refusal', () => {
  // Passing the otherwise valid scenario with `securitySnapshot: null` threw
  // `TypeError: Cannot read properties of null (reading 'snapshotDigest')`.
  const result = admit({ ...validScenario(), securitySnapshot: null } as never);
  assert.equal(result.status, 'refused');
  if (result.status !== 'refused') {
    return;
  }
  assert.equal(result.refusal.code, 'SecurityEvidenceMissing');
});

test('F-053-08: admit returns exactly one typed result for every hostile boundary value', () => {
  for (const boundary of DECLARED_BOUNDARIES) {
    for (const value of HOSTILE_BOUNDARY_VALUES) {
      const input = { ...validScenario(), [boundary]: value } as never;
      let result: ReleaseAdmissionResult;
      try {
        result = admit(input);
      }
      catch (error) {
        assert.fail(
          `admit threw for ${String(boundary)} = ${String(value)}: ${String(error)}`,
        );
      }
      const members =
        ('plan' in result ? 1 : 0) +
        ('refusal' in result ? 1 : 0) +
        ('exception' in result ? 1 : 0);
      assert.equal(
        members,
        1,
        `${String(boundary)} = ${String(value)} produced ${members} members`,
      );
      // An empty changed-path set is genuinely admissible; every other hostile value
      // at every other boundary must produce a refusal or an exception.
      if (boundary !== 'changedPaths' || !Array.isArray(value)) {
        assert.notEqual(
          result.status,
          'admitted',
          `${String(boundary)} = ${String(value)} was admitted`,
        );
      }
    }
  }
});

test('F-053-08: a boundary removed entirely returns a typed refusal', () => {
  for (const boundary of DECLARED_BOUNDARIES) {
    const input = { ...validScenario() } as Record<string, unknown>;
    delete input[boundary as string];
    const result = admit(input as never);
    assert.notEqual(result.status, 'admitted', String(boundary));
    assert.ok(!('plan' in result), String(boundary));
  }
});

test('F-053-08: a value canonical JSON cannot represent returns a typed refusal', () => {
  for (const value of [Symbol('hostile'), 10n, () => undefined]) {
    const result = admit({
      ...validScenario(),
      changedPaths: ['README.md', value],
    } as never);
    assert.equal(result.status, 'refused');
    if (result.status !== 'refused') {
      continue;
    }
    assert.equal(result.refusal.code, 'SourceRecordInvalid');
  }
});

test('F-053-08: a nested hostile member below a declared boundary returns a typed refusal', () => {
  const nested: readonly [string, unknown][] = [
    ['pullRequest', { ...validPullRequest(), headOid: null }],
    ['pullRequest', { ...validPullRequest(), pullRequestNumber: 'ninety-nine' }],
    ['base', { ref: null, oid: BASE_OID }],
    ['repository', { repositoryId: 'x' }],
    ['gateSnapshot', { snapshotDigest: ADMISSION_CONTEXT_NONCE, relations: null }],
    ['securitySnapshot', { snapshotDigest: ADMISSION_CONTEXT_NONCE, findings: [null] }],
    ['integrationEvidence', [null]],
    ['policyControlFacts', { action: null, observation: null }],
    ['requiredChecks', 'not-an-object'],
  ];

  for (const [boundary, value] of nested) {
    const result = admit({ ...validScenario(), [boundary]: value } as never);
    assert.notEqual(result.status, 'admitted', `${boundary}`);
    assert.ok(!('plan' in result), `${boundary}`);
  }
});

/* ========================================================================= *
 * Dormancy and the negative-capability surface are unchanged
 * ========================================================================= */

test('the remediation keeps the module dormant for every activation member', () => {
  const port = new RecordingMergePort();
  assert.equal(
    admitWithNoSideEffect(validScenario({ activation: null })),
    'AuthorityNotActivated',
  );
  assert.equal(port.callCount, 0);
});

test('a merged pull request observation never bypasses the plan binding', async () => {
  const observation: ImmutablePullRequestObservation = {
    ...validPullRequest(),
    merged: true,
    state: 'closed',
    mergedCommitOid: oid('a-merge-by-an-unknown-actor'),
  };
  const harness = buildHarness({ pullRequests: [observation] });
  await harness.store.recordIntent(harness.plan);

  const result = await execute(harness.dependencies, harness.executionInput);

  assert.equal(result.status, 'refused');
  if (result.status !== 'refused') {
    return;
  }
  assert.equal(result.refusal.code, 'ResultUnverifiable');
  assert.equal(harness.mergePort.callCount, 0);
});
