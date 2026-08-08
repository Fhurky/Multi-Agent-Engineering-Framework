import test from 'node:test';
import assert from 'node:assert/strict';

import { admit as productionAdmit } from '../admission.ts';
import { admit } from './helpers/admission.ts';
import { selfDigest } from '../canonical-json.ts';
import {
  createReleaseExecutorCompositionRoot,
  resolveReleaseExecutorCapability,
} from '../composition-capability.ts';
import type {
  ReleaseAuthorityPort,
  ReleasePullRequestMergePort,
} from '../contracts.ts';
import {
  AUTHORITY_PORT_IDENTITY,
  MERGE_PORT_IDENTITY,
  RELEASE_CAPABILITY_BINDING,
  authenticatedDiffFor,
  oid,
  validScenario,
} from './helpers/fixtures.ts';

test('F-061-01: same-identity resolver and merge objects cannot construct the nominal capability', () => {
  const scenario = validScenario();
  const trustedAuthority = scenario.authority!;
  const trustedMergePort = scenario.mergePort!;
  const maliciousAuthority: ReleaseAuthorityPort = {
    identity: AUTHORITY_PORT_IDENTITY,
    resolveArtifact: trustedAuthority.resolveArtifact.bind(trustedAuthority),
    resolvePassingGate: trustedAuthority.resolvePassingGate.bind(trustedAuthority),
    resolveTrustRoot: trustedAuthority.resolveTrustRoot.bind(trustedAuthority),
    resolveAuthorizedHuman:
      trustedAuthority.resolveAuthorizedHuman.bind(trustedAuthority),
    enumerateAdmissionUniverse:
      trustedAuthority.enumerateAdmissionUniverse.bind(trustedAuthority),
    resolveIssuerStatus: trustedAuthority.resolveIssuerStatus.bind(trustedAuthority),
    authenticateExecutionEvidence:
      trustedAuthority.authenticateExecutionEvidence.bind(trustedAuthority),
    resolveHumanDecision:
      trustedAuthority.resolveHumanDecision.bind(trustedAuthority),
    resolveAcceptedRisk: trustedAuthority.resolveAcceptedRisk.bind(trustedAuthority),
  };
  let maliciousCalls = 0;
  const maliciousMergePort: ReleasePullRequestMergePort = {
    async mergeIntegrationPullRequestIntoMain() {
      maliciousCalls += 1;
      return { outcome: 'unsupported' };
    },
  };

  const independentlyProvisionedRoot = createReleaseExecutorCompositionRoot({
    authenticateAuthorityPort(candidate) {
      return candidate === trustedAuthority ? AUTHORITY_PORT_IDENTITY : null;
    },
    authenticateMergePort(candidate) {
      return candidate === trustedMergePort ? MERGE_PORT_IDENTITY : null;
    },
    authenticateComposition(candidateAuthority, candidateMergePort) {
      return candidateAuthority === trustedAuthority &&
        candidateMergePort === trustedMergePort
        ? RELEASE_CAPABILITY_BINDING
        : null;
    },
  });

  assert.equal(
    independentlyProvisionedRoot.bind(maliciousAuthority, maliciousMergePort),
    null,
  );
  const structuralForgery = Object.freeze({
    schema: 'release-executor-capability/v1',
  });
  assert.equal(resolveReleaseExecutorCapability(structuralForgery as never), null);

  const result = productionAdmit(scenario, structuralForgery as never);
  assert.equal(result.status, 'refused');
  if (result.status === 'refused') {
    assert.equal(result.refusal.code, 'AuthorityNotActivated');
  }
  assert.equal(maliciousCalls, 0);
});

test('F-061-01: the sealed capability resolves to the exact callable objects', () => {
  const scenario = validScenario();
  const record = resolveReleaseExecutorCapability(scenario.capability);
  assert.ok(record !== null);
  assert.equal(record.authority, scenario.authority);
  assert.equal(record.mergePort, scenario.mergePort);
  assert.deepEqual(record.authorityIdentity, AUTHORITY_PORT_IDENTITY);
  assert.deepEqual(record.mergePortIdentity, MERGE_PORT_IDENTITY);
  assert.deepEqual(record.capabilityBinding, RELEASE_CAPABILITY_BINDING);
});

test('F-061-02: a caller list that omits a protected authenticated diff path is rejected', () => {
  const authenticatedDiff = authenticatedDiffFor([
    'src/backend/release.ts',
    'AGENTS.md',
  ]);
  const result = admit(validScenario({
    changedPaths: ['src/backend/release.ts'],
    authenticatedDiff,
  }));
  assert.equal(result.status, 'refused');
  if (result.status === 'refused') {
    assert.equal(result.refusal.code, 'SourceRecordInvalid');
  }
});

test('F-061-02: protected admission is evaluated from the authenticated diff universe', () => {
  const paths = ['src/backend/release.ts', 'AGENTS.md'];
  const result = admit(validScenario({
    changedPaths: paths,
    authenticatedDiff: authenticatedDiffFor(paths),
  }));
  assert.equal(result.status, 'refused');
  if (result.status === 'refused') {
    assert.equal(result.refusal.code, 'ProtectedPathChange');
  }
});

test('F-061-02: incomplete pagination refuses even when the outer evidence is resealed', () => {
  const complete = authenticatedDiffFor(
    ['src/backend/a.ts', 'src/backend/b.ts'],
    { pageSize: 1 },
  );
  const withoutEvidence = {
    ...complete,
    pages: complete.pages.slice(0, 1),
    evidenceDigest: '',
  };
  const incomplete = {
    ...withoutEvidence,
    evidenceDigest: selfDigest(withoutEvidence, 'evidenceDigest'),
  };
  const result = admit(validScenario({
    changedPaths: ['src/backend/a.ts', 'src/backend/b.ts'],
    authenticatedDiff: incomplete,
  }));
  assert.equal(result.status, 'refused');
  if (result.status === 'refused') {
    assert.equal(result.refusal.code, 'SourceRecordInvalid');
  }
});

test('F-061-02: base/head mismatch and canonical-byte substitution refuse', () => {
  const paths = ['src/backend/release.ts'];
  const wrongSubject = authenticatedDiffFor(paths, { headOid: oid('another-head') });
  const subjectResult = admit(validScenario({
    changedPaths: paths,
    authenticatedDiff: wrongSubject,
  }));
  assert.equal(subjectResult.status, 'refused');

  const complete = authenticatedDiffFor(paths);
  const withoutEvidence = {
    ...complete,
    canonicalEntriesBytes: `${complete.canonicalEntriesBytes} `,
    evidenceDigest: '',
  };
  const tampered = {
    ...withoutEvidence,
    evidenceDigest: selfDigest(withoutEvidence, 'evidenceDigest'),
  };
  const bytesResult = admit(validScenario({
    changedPaths: paths,
    authenticatedDiff: tampered,
  }));
  assert.equal(bytesResult.status, 'refused');
});

test('F-061-02: rename and deletion paths are complete and ambiguity fails closed', () => {
  const renameAndDelete = authenticatedDiffFor([], {
    entries: [
      {
        ordinal: 0,
        changeKind: 'renamed',
        oldPath: 'AGENTS.md',
        newPath: 'docs/archive/AGENTS.md',
        oldBlobOid: oid('agents-old'),
        newBlobOid: oid('agents-new'),
      },
      {
        ordinal: 1,
        changeKind: 'deleted',
        oldPath: '.githooks/pre-push',
        newPath: null,
        oldBlobOid: oid('hook-old'),
        newBlobOid: null,
      },
    ],
  });
  const paths = [
    'AGENTS.md',
    'docs/archive/AGENTS.md',
    '.githooks/pre-push',
  ];
  const protectedResult = admit(validScenario({
    changedPaths: paths,
    authenticatedDiff: renameAndDelete,
  }));
  assert.equal(protectedResult.status, 'refused');
  if (protectedResult.status === 'refused') {
    assert.equal(protectedResult.refusal.code, 'ProtectedPathChange');
  }

  const ambiguous = authenticatedDiffFor([], {
    entries: [{
      ordinal: 0,
      changeKind: 'renamed',
      oldPath: 'src/backend/old.ts',
      newPath: null,
      oldBlobOid: oid('old'),
      newBlobOid: oid('new'),
    }],
  });
  const ambiguousResult = admit(validScenario({
    changedPaths: ['src/backend/old.ts'],
    authenticatedDiff: ambiguous,
  }));
  assert.equal(ambiguousResult.status, 'refused');
  if (ambiguousResult.status === 'refused') {
    assert.equal(ambiguousResult.refusal.code, 'SourceRecordInvalid');
  }
});
