/**
 * `ExecutorGateAdmissibility` fixtures.
 *
 * `gate_passed` alone is never plan evidence. Every authoritative independent verdict
 * must be passing; the sole alternative is a security relation whose authoritative
 * state is formally accepted and whose evidence contains one exact immutable
 * authorized-human accepted-risk record for every matching unresolved High or Critical
 * finding.
 *
 * The F-041-01 fixture is the first test below: an authoritative `changes-required`
 * review verdict plus a generic formal acceptance asserts `PreMergeGateNotPassing`,
 * no `MergePlan`, no durable intent, and zero merge API calls.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { admit } from '../admission.ts';
import {
  evaluateRelation,
  expectedAcceptanceScopeDigest,
  resolveAuthoritativeRound,
} from '../gate-admissibility.ts';
import { RELEASE_GATE_DOMAINS } from '../contracts.ts';
import type {
  AggregateGateRelation,
  GateVerdictState,
  ImmutableAggregateGateSnapshot,
  ReleaseGateDomain,
} from '../contracts.ts';
import { InMemoryEvidenceStore, RecordingMergePort } from './helpers/fakes.ts';
import {
  acceptanceFor,
  blockingFinding,
  digest,
  emptySecuritySnapshot,
  gateSnapshotOf,
  HEAD_OID,
  oid,
  passingRelation,
  securitySnapshotOf,
  validGateSnapshot,
  validScenario,
} from './helpers/fixtures.ts';

function snapshotWith(
  domain: ReleaseGateDomain,
  overrides: Partial<AggregateGateRelation>,
): ImmutableAggregateGateSnapshot {
  const snapshot = validGateSnapshot();
  return gateSnapshotOf(
    snapshot.relations.map((relation) =>
      relation.gate === domain && relation.lineageRound === 2
        ? { ...relation, ...overrides }
        : relation,
    ),
  );
}

interface Assertion {
  readonly code: string;
  readonly mergeCalls: number;
  readonly intents: number;
}

function admitWith(
  snapshot: ImmutableAggregateGateSnapshot,
  securitySnapshot = emptySecuritySnapshot(),
): Assertion {
  const port = new RecordingMergePort();
  const store = new InMemoryEvidenceStore();
  const result = admit(validScenario({ gateSnapshot: snapshot, securitySnapshot }));

  assert.equal(result.status, 'refused', JSON.stringify(result).slice(0, 300));
  if (result.status !== 'refused') {
    return { code: 'unexpected', mergeCalls: port.callCount, intents: 0 };
  }
  assert.ok(!('plan' in result));
  return {
    code: result.refusal.code,
    mergeCalls: port.callCount,
    intents: store.intents.size,
  };
}

/* --- F-041-01 --------------------------------------------------------- */

test('F-041-01: changes-required review plus a generic formal acceptance', () => {
  const snapshot = validGateSnapshot();
  const relations = snapshot.relations.map((relation) => {
    if (relation.gate === 'review' && relation.lineageRound === 2) {
      return { ...relation, verdictState: 'changes_required' as GateVerdictState };
    }
    if (relation.gate === 'security' && relation.lineageRound === 2) {
      // A generic formal acceptance carrying no accepted-risk record at all.
      return { ...relation, verdictState: 'formally_accepted' as GateVerdictState };
    }
    return relation;
  });

  const outcome = admitWith(gateSnapshotOf(relations));

  assert.equal(outcome.code, 'PreMergeGateNotPassing');
  assert.equal(outcome.mergeCalls, 0);
  assert.equal(outcome.intents, 0);
});

/* --- Every non-security gate, every non-passing verdict ---------------- */

const NON_PASSING: readonly GateVerdictState[] = [
  'changes_required',
  'failed',
];

for (const domain of RELEASE_GATE_DOMAINS) {
  for (const verdictState of NON_PASSING) {
    test(`a ${verdictState} ${domain} verdict refuses with PreMergeGateNotPassing`, () => {
      const outcome = admitWith(snapshotWith(domain, { verdictState }));
      assert.equal(outcome.code, 'PreMergeGateNotPassing');
      assert.equal(outcome.mergeCalls, 0);
    });
  }

  test(`an open ${domain} relation refuses with PreMergeGateOpen`, () => {
    const outcome = admitWith(snapshotWith(domain, { verdictState: 'open' }));
    assert.equal(outcome.code, 'PreMergeGateOpen');
  });

  test(`a pending ${domain} relation refuses with PreMergeGateOpen`, () => {
    const outcome = admitWith(snapshotWith(domain, { verdictState: 'pending' }));
    assert.equal(outcome.code, 'PreMergeGateOpen');
  });

  test(`an incomplete ${domain} relation set refuses with PreMergeGateOpen`, () => {
    const outcome = admitWith(
      snapshotWith(domain, { relationSetComplete: false }),
    );
    assert.equal(outcome.code, 'PreMergeGateOpen');
  });

  test(`a point-class ${domain} relation refuses with ReleaseGateNotPassing`, () => {
    const outcome = admitWith(snapshotWith(domain, { gateClass: 'point' }));
    assert.equal(outcome.code, 'ReleaseGateNotPassing');
  });

  test(`the withdrawn owner form of ${domain} refuses with ReleaseGateNotPassing`, () => {
    const outcome = admitWith(snapshotWith(domain, { ownerForm: true }));
    assert.equal(outcome.code, 'ReleaseGateNotPassing');
  });
}

for (const domain of RELEASE_GATE_DOMAINS.filter((entry) => entry !== 'security')) {
  test(`a formal acceptance of the ${domain} gate refuses with PreMergeGateNotPassing`, () => {
    const outcome = admitWith(
      snapshotWith(domain, { verdictState: 'formally_accepted' }),
    );
    assert.equal(outcome.code, 'PreMergeGateNotPassing');
  });
}

/* --- Authoritative round resolution ------------------------------------ */

test('the authoritative round is the greatest contiguous round', () => {
  const snapshot: ImmutableAggregateGateSnapshot = {
    snapshotDigest: digest('rounds'),
    relations: [
      passingRelation('review', 1),
      passingRelation('review', 2),
      passingRelation('review', 3),
    ],
  };
  const resolution = resolveAuthoritativeRound(snapshot, 'LIN-RELEASE-REVIEW', 'review');
  assert.equal(resolution.status, 'resolved');
  if (resolution.status !== 'resolved') {
    return;
  }
  assert.equal(resolution.round, 3);
});

test('a round declared above a gap is not authoritative', () => {
  const snapshot: ImmutableAggregateGateSnapshot = {
    snapshotDigest: digest('gap'),
    relations: [passingRelation('review', 1), passingRelation('review', 4)],
  };
  const resolution = resolveAuthoritativeRound(snapshot, 'LIN-RELEASE-REVIEW', 'review');
  assert.equal(resolution.status, 'resolved');
  if (resolution.status !== 'resolved') {
    return;
  }
  assert.equal(resolution.round, 1);
});

test('a lineage with no relation is not resolvable', () => {
  const resolution = resolveAuthoritativeRound(
    validGateSnapshot(),
    'LIN-DOES-NOT-EXIST',
    'review',
  );
  assert.equal(resolution.status, 'no_relation');
});

test('a superseded non-passing round does not veto a later passing round', () => {
  const snapshot: ImmutableAggregateGateSnapshot = {
    snapshotDigest: digest('supersession'),
    relations: [
      { ...passingRelation('review', 1), verdictState: 'changes_required' },
      passingRelation('review', 2),
    ],
  };
  const resolution = resolveAuthoritativeRound(snapshot, 'LIN-RELEASE-REVIEW', 'review');
  assert.equal(resolution.status, 'resolved');
  if (resolution.status !== 'resolved') {
    return;
  }
  const admissibility = evaluateRelation(resolution.relation, [], HEAD_OID);
  assert.equal(admissibility.status, 'passing');
});

/* --- The sole security exception --------------------------------------- */

function acceptedSecuritySnapshot(): ImmutableAggregateGateSnapshot {
  return snapshotWith('security', {
    verdictState: 'formally_accepted',
    acceptedRisks: [acceptanceFor(blockingFinding())],
  });
}

test('an exact accepted-blocking-security-risk record admits the release', () => {
  const finding = blockingFinding();
  const result = admit(
    validScenario({
      gateSnapshot: acceptedSecuritySnapshot(),
      securitySnapshot: securitySnapshotOf([finding]),
    }),
  );
  assert.equal(result.status, 'admitted', JSON.stringify(result).slice(0, 400));
});

test('a High severity record is admissible for a High finding', () => {
  const finding = blockingFinding({ severity: 'high', findingId: 'F-REL-HIGH' });
  const result = admit(
    validScenario({
      gateSnapshot: snapshotWith('security', {
        verdictState: 'formally_accepted',
        acceptedRisks: [acceptanceFor(finding)],
      }),
      securitySnapshot: securitySnapshotOf([finding]),
    }),
  );
  assert.equal(result.status, 'admitted');
});

/** One field differs at a time; every case is `SecurityRiskAcceptanceInvalid`. */
const ONE_FIELD_OFF: readonly {
  readonly label: string;
  readonly mutate: (
    record: ReturnType<typeof acceptanceFor>,
  ) => ReturnType<typeof acceptanceFor>;
}[] = [
  {
    label: 'target commit',
    mutate: (record) => ({ ...record, targetCommit: oid('another-target') }),
  },
  {
    label: 'finding identity',
    mutate: (record) => ({ ...record, findingId: 'F-REL-OTHER' }),
  },
  {
    label: 'finding severity',
    mutate: (record) => ({ ...record, findingSeverity: 'high' }),
  },
  {
    label: 'finding evidence digest',
    mutate: (record) => ({
      ...record,
      findingEvidenceDigest: digest('another-evidence'),
    }),
  },
  {
    label: 'security verdict commit',
    mutate: (record) => ({
      ...record,
      securityVerdictCommit: oid('another-verdict'),
    }),
  },
  {
    label: 'security lineage round',
    mutate: (record) => ({ ...record, securityLineageRound: 1 }),
  },
  {
    label: 'security lineage',
    mutate: (record) => ({ ...record, securityLineage: 'LIN-OTHER-SECURITY' }),
  },
  {
    label: 'acceptance scope digest',
    mutate: (record) => ({
      ...record,
      acceptanceScopeDigest: digest('a-broader-scope'),
    }),
  },
  {
    label: 'immutability of the record commit',
    mutate: (record) => ({ ...record, recordCommit: 'refs/heads/main' }),
  },
  {
    label: 'immutability of the acceptance decision commit',
    mutate: (record) => ({ ...record, acceptanceDecisionCommit: 'HEAD' }),
  },
  {
    label: 'authorized human principal',
    mutate: (record) => ({
      ...record,
      acceptedBy: {
        principalId: 'release-merge-executor',
        principalType: 'automation' as never,
        authorizationCommit: oid('human-authorization'),
      },
    }),
  },
  {
    label: 'record schema',
    mutate: (record) => ({
      ...record,
      schema: 'accepted-blocking-security-risk/v2' as never,
    }),
  },
];

for (const entry of ONE_FIELD_OFF) {
  test(`an acceptance whose ${entry.label} differs is SecurityRiskAcceptanceInvalid`, () => {
    const finding = blockingFinding();
    const outcome = admitWith(
      snapshotWith('security', {
        verdictState: 'formally_accepted',
        acceptedRisks: [entry.mutate(acceptanceFor(finding))],
      }),
      securitySnapshotOf([finding]),
    );
    assert.equal(outcome.code, 'SecurityRiskAcceptanceInvalid');
    assert.equal(outcome.mergeCalls, 0);
  });
}

test('a Low or Medium acceptance is SecurityRiskAcceptanceInvalid', () => {
  const finding = blockingFinding({ severity: 'critical' });
  const record = {
    ...acceptanceFor(finding),
    findingSeverity: 'medium' as never,
  };
  const outcome = admitWith(
    snapshotWith('security', {
      verdictState: 'formally_accepted',
      acceptedRisks: [record],
    }),
    securitySnapshotOf([finding]),
  );
  assert.equal(outcome.code, 'SecurityRiskAcceptanceInvalid');
});

test('a missing record for one of two findings is SecurityRiskAcceptanceInvalid', () => {
  const first = blockingFinding({ findingId: 'F-REL-001' });
  const second = blockingFinding({
    findingId: 'F-REL-002',
    evidenceDigest: digest('second-evidence'),
  });
  const outcome = admitWith(
    snapshotWith('security', {
      verdictState: 'formally_accepted',
      acceptedRisks: [acceptanceFor(first)],
    }),
    securitySnapshotOf([first, second]),
  );
  assert.equal(outcome.code, 'SecurityRiskAcceptanceInvalid');
});

test('an extra record with no matching finding is SecurityRiskAcceptanceInvalid', () => {
  const finding = blockingFinding();
  const outcome = admitWith(
    snapshotWith('security', {
      verdictState: 'formally_accepted',
      acceptedRisks: [
        acceptanceFor(finding),
        acceptanceFor(
          blockingFinding({
            findingId: 'F-REL-PHANTOM',
            evidenceDigest: digest('phantom'),
          }),
        ),
      ],
    }),
    securitySnapshotOf([finding]),
  );
  assert.equal(outcome.code, 'SecurityRiskAcceptanceInvalid');
});

test('an acceptance cannot waive another admission predicate', () => {
  // The acceptance scope digest binds exactly the named finding on the named target.
  const finding = blockingFinding();
  const scoped = expectedAcceptanceScopeDigest(finding);
  const broadened = digest('waives-required-checks-too');
  assert.notEqual(scoped, broadened);

  const outcome = admitWith(
    snapshotWith('security', {
      verdictState: 'formally_accepted',
      acceptedRisks: [
        { ...acceptanceFor(finding), acceptanceScopeDigest: broadened },
      ],
    }),
    securitySnapshotOf([finding]),
  );
  assert.equal(outcome.code, 'SecurityRiskAcceptanceInvalid');
});

test('an accepted security risk never discharges a non-security gate', () => {
  const finding = blockingFinding();
  const snapshot = snapshotWith('security', {
    verdictState: 'formally_accepted',
    acceptedRisks: [acceptanceFor(finding)],
  });
  const withFailingQa: ImmutableAggregateGateSnapshot = gateSnapshotOf(
    snapshot.relations.map((relation) =>
      relation.gate === 'qa' && relation.lineageRound === 2
        ? { ...relation, verdictState: 'failed' as GateVerdictState }
        : relation,
    ),
  );

  const outcome = admitWith(withFailingQa, securitySnapshotOf([finding]));
  assert.equal(outcome.code, 'PreMergeGateNotPassing');
});
