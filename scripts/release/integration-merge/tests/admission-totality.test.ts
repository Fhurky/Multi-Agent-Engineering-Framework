/**
 * Exhaustive admission table.
 *
 * `admit` is total over its declared input domain and returns exactly one result
 * member for every input. Every refusal and all three exception classifications
 * produce no plan, no durable intent, and zero merge API calls.
 *
 * The table is enumerated against the complete `MergeRefusalCode` union rather than
 * sampled: each code is either exercised here or declared as an execution-phase code
 * and exercised in `execute.test.ts` / `failure-injection.test.ts`.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { admit } from '../admission.ts';
import {
  HUMAN_EXCEPTION_KIND_ORDER,
  MERGE_REFUSAL_CODES,
} from '../contracts.ts';
import type {
  MergeRefusalCode,
  ReleaseAdmissionInput,
  ReleaseAdmissionResult,
} from '../contracts.ts';
import {
  authorEvidenceDigest,
  bundleDigest,
  commandEvidenceId,
} from '../published-head-evidence.ts';
import { InMemoryEvidenceStore, RecordingMergePort } from './helpers/fakes.ts';
import {
  acceptanceFor,
  artifactRef,
  blockingFinding,
  digest,
  emptySecuritySnapshot,
  excludedControlAction,
  oid,
  validGateSnapshot,
  validIntegrationEvidence,
  validManifest,
  validPublishedHeadBundle,
  validPullRequest,
  validRequiredChecks,
  validRequirements,
  validScenario,
} from './helpers/fixtures.ts';

/** Codes that only an execution phase can construct. */
const EXECUTION_ONLY_CODES: readonly MergeRefusalCode[] = [
  'IntentNotDurable',
  'IntentReceiptInvalid',
  'MergeConflict',
  'GitHubRejected',
  'OutcomeUnknown',
  'ResultUnverifiable',
  'RetryExhausted',
  'UnsupportedOperation',
];


/**
 * A bundle whose author phase truthfully records a declared command that exited with
 * an unexpected code. The digests are recomputed so the failure is the exit code
 * rather than a tampered projection.
 */
function verificationFailedBundle() {
  const bundle = validPublishedHeadBundle();
  const first = bundle.author.commands[0];
  if (first === undefined) {
    throw new Error('fixture defect: the author phase declares no command');
  }
  const failed = { ...first, exitCode: 2 };
  const withId = { ...failed, evidenceId: commandEvidenceId(failed) };
  const authorWithoutDigest = {
    ...bundle.author,
    commands: [withId, ...bundle.author.commands.slice(1)],
    canonicalAuthorEvidenceDigest: '',
  };
  const author = {
    ...authorWithoutDigest,
    canonicalAuthorEvidenceDigest: authorEvidenceDigest(authorWithoutDigest),
  };
  const control = { ...bundle.control, authorEvidenceDigest: author.canonicalAuthorEvidenceDigest };
  const withoutDigest = {
    ...bundle,
    author,
    control,
    canonicalBundleDigest: '',
  };
  return {
    ...withoutDigest,
    canonicalBundleDigest: bundleDigest(withoutDigest),
  };
}

interface TableRow {
  readonly code: MergeRefusalCode;
  readonly input: () => ReleaseAdmissionInput;
}

const TABLE: readonly TableRow[] = [
  {
    code: 'SourceRecordInvalid',
    input: () => ({ ...validScenario(), executor: 'task_integration' as never }),
  },
  {
    code: 'ReleaseManifestInvalid',
    input: () => validScenario({ manifest: null }),
  },
  {
    code: 'ReleaseGateDomainMissing',
    input: () =>
      validScenario({
        manifest: validManifest({
          requirements: validRequirements().filter(
            (requirement) => requirement.domain !== 'deployment',
          ),
        }),
      }),
  },
  {
    code: 'AuthorityNotActivated',
    input: () => validScenario({ activation: null }),
  },
  {
    code: 'PolicyObservationUnavailable',
    input: () =>
      validScenario({
        policyControlFacts: {
          action: excludedControlAction(),
          observation: { state: 'operationally_unavailable', reason: 'github_5xx' },
        },
      }),
  },
  {
    code: 'PolicyAttestationInvalid',
    input: () =>
      validScenario({
        policyControlFacts: {
          action: excludedControlAction(),
          observation: { state: 'present_invalid', reason: 'subject' },
        },
      }),
  },
  {
    code: 'PolicyAttestationStale',
    input: () =>
      validScenario({
        policyControlFacts: {
          action: excludedControlAction(),
          observation: { state: 'present_valid_but_stale', reason: 'expired' },
        },
      }),
  },
  {
    code: 'PublishedHeadEvidenceIncomplete',
    input: () => validScenario({ publishedHeadEvidence: null }),
  },
  {
    code: 'PublishedHeadEvidenceMismatch',
    input: () =>
      validScenario({
        manifest: validManifest({
          publishedHeadEvidenceDigest: digest('another-bundle'),
        }),
      }),
  },
  {
    code: 'PublicationMismatch',
    input: () =>
      validScenario({
        manifest: validManifest({ sourceOid: oid('another-published-head') }),
      }),
  },
  {
    code: 'PreMergeGateOpen',
    input: () =>
      validScenario({
        gateSnapshot: { snapshotDigest: digest('empty'), relations: [] },
      }),
  },
  {
    code: 'PreMergeGateNotPassing',
    input: () => {
      const snapshot = validGateSnapshot();
      return validScenario({
        gateSnapshot: {
          snapshotDigest: snapshot.snapshotDigest,
          relations: snapshot.relations.map((relation) =>
            relation.gate === 'documentation' && relation.lineageRound === 2
              ? { ...relation, verdictState: 'changes_required' as never }
              : relation,
          ),
        },
      });
    },
  },
  {
    code: 'ReleaseGateNotPassing',
    input: () =>
      validScenario({
        manifest: validManifest({
          requirements: validRequirements().map((requirement) =>
            requirement.domain === 'qa'
              ? { ...requirement, minimumRound: 9 }
              : requirement,
          ),
        }),
      }),
  },
  {
    code: 'SecurityRiskAcceptanceInvalid',
    input: () => {
      const finding = blockingFinding();
      const snapshot = validGateSnapshot();
      return validScenario({
        gateSnapshot: {
          snapshotDigest: snapshot.snapshotDigest,
          relations: snapshot.relations.map((relation) =>
            relation.gate === 'security' && relation.lineageRound === 2
              ? {
                  ...relation,
                  verdictState: 'formally_accepted' as never,
                  acceptedRisks: [
                    { ...acceptanceFor(finding), findingId: 'F-REL-OTHER' },
                  ],
                }
              : relation,
          ),
        },
        securitySnapshot: {
          snapshotDigest: digest('security-snapshot'),
          findings: [finding],
        },
      });
    },
  },
  {
    code: 'SecurityEvidenceMissing',
    input: () =>
      validScenario({
        securitySnapshot: {
          snapshotDigest: 'not-a-digest',
          findings: [],
        } as never,
      }),
  },
  {
    code: 'TargetNotReviewReady',
    input: () =>
      validScenario({
        pullRequest: { ...validPullRequest(), state: 'closed' },
      }),
  },
  {
    code: 'SourceBranchMismatch',
    input: () =>
      validScenario({
        pullRequest: { ...validPullRequest(), headBranch: 'release/candidate' },
      }),
  },
  {
    code: 'BaseBranchMismatch',
    input: () =>
      validScenario({
        pullRequest: { ...validPullRequest(), baseBranch: 'develop' },
      }),
  },
  {
    code: 'MergeMethodMismatch',
    input: () =>
      validScenario({ manifest: validManifest({ mergeMethod: 'squash' as never }) }),
  },
  {
    code: 'HeadOidMismatch',
    input: () =>
      // The bundle and the manifest agree on a published head the pull request no
      // longer carries. Policy evidence is bound to the observed head, so the
      // identity phase is the first predicate that can refuse.
      validScenario({
        pullRequest: { ...validPullRequest(), headOid: oid('moved-head') },
      }),
  },
  {
    code: 'PublishedHeadVerificationFailed',
    input: () => {
      const bundle = verificationFailedBundle();
      return validScenario({
        publishedHeadEvidence: bundle,
        manifest: validManifest({
          publishedHeadEvidenceDigest: bundle.canonicalBundleDigest,
        }),
      });
    },
  },
  {
    code: 'BaseOidMismatch',
    input: () =>
      validScenario({ manifest: validManifest({ baseOid: oid('another-base') }) }),
  },
  {
    code: 'IntegrationOrderViolation',
    input: () =>
      validScenario({
        pullRequest: { ...validPullRequest(), baseIsAncestorOfHead: false },
      }),
  },
  {
    code: 'IntegrationEvidenceIncomplete',
    input: () => validScenario({ integrationEvidence: [] }),
  },
  {
    code: 'ExpectedTreeMismatch',
    input: () => {
      const units = validIntegrationEvidence().map((unit) =>
        unit.unitId === 'TASK-018'
          ? { ...unit, resultTreeOid: oid('divergent-tree') }
          : unit,
      );
      return validScenario({ integrationEvidence: units });
    },
  },
  {
    code: 'RequiredCheckMissing',
    input: () =>
      validScenario({
        requiredChecks: { ...validRequiredChecks(), observed: [] },
      }),
  },
  {
    code: 'RequiredCheckNotSuccessful',
    input: () =>
      validScenario({
        requiredChecks: {
          ...validRequiredChecks(),
          observed: validRequiredChecks().observed.map((run) => ({
            ...run,
            conclusion: 'neutral',
          })),
        },
      }),
  },
  {
    code: 'RequiredCheckPublisherMismatch',
    input: () =>
      validScenario({
        requiredChecks: {
          ...validRequiredChecks(),
          observed: validRequiredChecks().observed.map((run) => ({
            ...run,
            appId: 1,
          })),
        },
      }),
  },
  {
    code: 'ProtectedPathChange',
    input: () => validScenario({ changedPaths: ['AGENTS.md'] }),
  },
];

const observedCodes = new Set<MergeRefusalCode>();

for (const row of TABLE) {
  test(`the admission table constructs ${row.code} with no plan and no API call`, () => {
    const port = new RecordingMergePort();
    const store = new InMemoryEvidenceStore();
    const result: ReleaseAdmissionResult = admit(row.input());

    assert.equal(
      result.status,
      'refused',
      `expected ${row.code}, received ${JSON.stringify(result).slice(0, 300)}`,
    );
    if (result.status !== 'refused') {
      return;
    }
    assert.equal(result.refusal.code, row.code);
    assert.equal(result.refusal.executor, 'release_main');
    assert.ok(!('plan' in result));
    assert.equal(port.callCount, 0);
    assert.equal(store.intents.size, 0);
    observedCodes.add(result.refusal.code);
  });
}

test('the admission table covers every non-execution refusal code exactly once', () => {
  const admissionCodes = MERGE_REFUSAL_CODES.filter(
    (code) => !EXECUTION_ONLY_CODES.includes(code),
  );
  const tableCodes = TABLE.map((row) => row.code);

  assert.equal(
    new Set(tableCodes).size,
    tableCodes.length,
    'no code appears twice in the table',
  );

  const missing = admissionCodes.filter((code) => !tableCodes.includes(code));
  assert.deepEqual(missing, [], `uncovered admission refusal codes: ${missing}`);

  const unexpected = tableCodes.filter(
    (code) => !(admissionCodes as readonly string[]).includes(code),
  );
  assert.deepEqual(unexpected, []);
});

test('the closed refusal union has no member outside the two partitions', () => {
  const admissionCodes = TABLE.map((row) => row.code);
  const union = new Set<string>([...admissionCodes, ...EXECUTION_ONLY_CODES]);
  assert.deepEqual([...union].sort(), [...MERGE_REFUSAL_CODES].sort());
});

/* --- Exactly one result member ----------------------------------------- */

test('admit returns exactly one result member for every table input', () => {
  for (const row of [...TABLE, { code: 'admitted' as never, input: validScenario }]) {
    const result = admit(row.input());
    const members = [
      'plan' in result ? 1 : 0,
      'refusal' in result ? 1 : 0,
      'exception' in result ? 1 : 0,
    ].reduce((left, right) => left + right, 0);
    assert.equal(members, 1, `input ${row.code} produced ${members} members`);
  }
});

test('admit never throws on a structurally hostile input', () => {
  const hostile: unknown[] = [
    null,
    undefined,
    {},
    { executor: 'release_main' },
    { ...validScenario(), pullRequest: null },
    { ...validScenario(), gateSnapshot: null },
    { ...validScenario(), integrationEvidence: null },
    { ...validScenario(), policyControlFacts: null },
    { ...validScenario(), changedPaths: 'AGENTS.md' },
    { ...validScenario(), admissionContextNonce: 42 },
  ];

  for (const input of hostile) {
    const result = admit(input as never);
    assert.equal(result.status, 'refused');
    if (result.status !== 'refused') {
      continue;
    }
    assert.equal(result.refusal.code, 'SourceRecordInvalid');
  }
});

/* --- The three human exception kinds ------------------------------------ */

test('an unresolved blocking finding without acceptance detects only the first kind', () => {
  const finding = blockingFinding();
  const result = admit(
    validScenario({
      securitySnapshot: {
        snapshotDigest: digest('security-snapshot'),
        findings: [finding],
      },
    }),
  );
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
    'accept_blocking_high_or_critical_security_risk',
  );
});

test('an explicitly coupled irreversible action without authorization detects only the second kind', () => {
  const result = admit(
    validScenario({
      manifest: validManifest({
        irreversibleProductionCoupling: {
          coupled: true,
          policyCommit: oid('deployment-policy'),
          authorization: null,
        },
      }),
    }),
  );
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
    'authorize_policy_required_irreversible_production_action',
  );
});

test('a main merge alone is never the second exception', () => {
  const result = admit(
    validScenario({
      manifest: validManifest({ irreversibleProductionCoupling: { coupled: false } }),
    }),
  );
  assert.equal(result.status, 'admitted');
});

test('a coupled action with a valid human authorization is admitted', () => {
  const result = admit(
    validScenario({
      manifest: validManifest({
        irreversibleProductionCoupling: {
          coupled: true,
          policyCommit: oid('deployment-policy'),
          authorization: {
            decisionId: 'HUMAN-00X',
            decisionCommit: oid('human-authorization-decision'),
            artifactPath: 'plans/decisions/HUMAN-00X.md',
          },
        },
      }),
    }),
  );
  assert.equal(result.status, 'admitted');
});

test('an unclassifiable production authorization returns one unclassifiable exception', () => {
  const result = admit(
    validScenario({
      manifest: validManifest({
        irreversibleProductionCoupling: {
          coupled: true,
          policyCommit: oid('deployment-policy'),
          authorization: {
            decisionId: '',
            decisionCommit: 'refs/heads/main',
            artifactPath: 'plans/decisions/unknown.md',
          },
        },
      }),
    }),
  );
  assert.equal(result.status, 'human_exception_required');
  if (result.status !== 'human_exception_required') {
    return;
  }
  assert.equal(result.exception.classification, 'unclassifiable');
});

test('a verified control-plane action detects only the third kind', () => {
  const result = admit(
    validScenario({
      policyControlFacts: {
        action: {
          status: 'detected',
          actions: ['branch_protection_changed'],
          evidence: [artifactRef('policy-observation')],
        },
        observation: { state: 'present_invalid', reason: 'completeness' },
      },
    }),
  );
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
});

test('coexisting exception facts return the policy-control result first', () => {
  const finding = blockingFinding();
  const result = admit(
    validScenario({
      securitySnapshot: {
        snapshotDigest: digest('security-snapshot'),
        findings: [finding],
      },
      manifest: validManifest({
        irreversibleProductionCoupling: {
          coupled: true,
          policyCommit: oid('deployment-policy'),
          authorization: null,
        },
      }),
      policyControlFacts: {
        action: {
          status: 'detected',
          actions: ['ruleset_or_ruleset_applicability_changed'],
          evidence: [artifactRef('policy-observation')],
        },
        observation: { state: 'present_invalid', reason: 'completeness' },
      },
    }),
  );

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
});

test('with policy usable, the security exception precedes the production exception', () => {
  const finding = blockingFinding();
  const result = admit(
    validScenario({
      securitySnapshot: {
        snapshotDigest: digest('security-snapshot'),
        findings: [finding],
      },
      manifest: validManifest({
        irreversibleProductionCoupling: {
          coupled: true,
          policyCommit: oid('deployment-policy'),
          authorization: null,
        },
      }),
    }),
  );

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
    'accept_blocking_high_or_critical_security_risk',
  );
});

test('the human exception union has exactly three kinds and no fourth', () => {
  assert.equal(HUMAN_EXCEPTION_KIND_ORDER.length, 3);
  assert.deepEqual(HUMAN_EXCEPTION_KIND_ORDER, [
    'accept_blocking_high_or_critical_security_risk',
    'authorize_policy_required_irreversible_production_action',
    'change_credentials_or_repository_authorization_policy',
  ]);
});

test('unclassifiable is a result state, not a fourth kind', () => {
  const result = admit(
    validScenario({
      policyControlFacts: {
        action: {
          status: 'unknown',
          candidateActions: ['observer_credential_rotated_or_revoked'],
          evidence: [],
        },
        observation: { state: 'present_invalid', reason: 'signature' },
      },
    }),
  );
  assert.equal(result.status, 'human_exception_required');
  if (result.status !== 'human_exception_required') {
    return;
  }
  assert.equal(result.exception.classification, 'unclassifiable');
  if (result.exception.classification !== 'unclassifiable') {
    return;
  }
  assert.equal(result.exception.kind, null);
  for (const candidate of result.exception.candidateKinds) {
    assert.ok(HUMAN_EXCEPTION_KIND_ORDER.includes(candidate));
  }
});

test('the release success fixture with an empty security snapshot stays admitted', () => {
  assert.equal(
    admit(validScenario({ securitySnapshot: emptySecuritySnapshot() })).status,
    'admitted',
  );
});
