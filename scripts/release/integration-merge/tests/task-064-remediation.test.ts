import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { admit as productionAdmit } from '../admission.ts';
import { resolveReleaseExecutorCapability } from '../composition-capability.ts';
import { canonicalJson, selfDigest } from '../canonical-json.ts';
import type {
  AuthenticatedAdmissionUniverse,
  ImmutableDiffArtifactRef,
  ReleaseAuthorityPort,
} from '../contracts.ts';
import { admit } from './helpers/admission.ts';
import {
  authenticatedDiffFor,
  immutableDiffSourceFor,
  oid,
  validScenario,
  withFixtureAuthority,
} from './helpers/fixtures.ts';

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
    resolveImmutableDiff: base.resolveImmutableDiff.bind(base),
    resolveIssuerStatus: base.resolveIssuerStatus.bind(base),
    authenticateExecutionEvidence: base.authenticateExecutionEvidence.bind(base),
    resolveHumanDecision: base.resolveHumanDecision.bind(base),
    resolveAcceptedRisk: base.resolveAcceptedRisk.bind(base),
    ...overrides,
  };
}

function resealUniverse(
  universe: AuthenticatedAdmissionUniverse,
  source: ImmutableDiffArtifactRef,
): AuthenticatedAdmissionUniverse {
  const withoutDigest = {
    ...universe,
    immutableDiffSource: source,
    universeDigest: '',
  };
  return {
    ...withoutDigest,
    universeDigest: selfDigest(withoutDigest, 'universeDigest'),
  };
}

test('F-063-01: release-control package exposes no issuer, authenticator, or host package', async () => {
  const facade = await import('../composition-capability.ts');
  assert.deepEqual(Object.keys(facade).sort(), ['resolveReleaseExecutorCapability']);

  const packageManifest = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
  ) as { readonly exports: Record<string, unknown>; readonly files: readonly string[] };
  assert.deepEqual(Object.keys(packageManifest.exports), ['.']);
  assert.equal(packageManifest.files.some((path) => path.includes('runtime-host')), false);
  assert.equal(packageManifest.files.some((path) => path.includes('tests/')), false);
});

test('F-063-01: direct facade import plus caller objects cannot mint a recognized capability', () => {
  const scenario = validScenario();
  const structuralForgery = Object.freeze({
    schema: 'release-executor-capability/v2',
    authority: scenario.authority,
    mergePort: scenario.mergePort,
    authenticator: {
      authenticateAuthorityPort: () => scenario.authority?.identity,
      authenticateMergePort: () => scenario.activation
        ?.negativeCapabilityTestAttestation.attestedMergePortIdentity,
    },
  });
  assert.equal(resolveReleaseExecutorCapability(structuralForgery as never), null);
  const result = productionAdmit(scenario, structuralForgery as never);
  assert.equal(result.status, 'refused');
  if (result.status === 'refused') {
    assert.equal(result.refusal.code, 'AuthorityNotActivated');
  }
});

test('F-063-02: a caller-local self-consistent subset cannot replace the host-resolved diff', () => {
  const completePaths = ['src/backend/release.ts', 'AGENTS.md'];
  const scenario = validScenario({
    changedPaths: completePaths,
    authenticatedDiff: authenticatedDiffFor(completePaths),
  });
  const fabricated = authenticatedDiffFor(['src/backend/release.ts']);
  const callerSubstitution = {
    ...scenario,
    changedPaths: ['src/backend/release.ts'],
    authenticatedDiff: fabricated,
    authenticatedDiffSource: immutableDiffSourceFor(fabricated, {
      commit: oid('nonexistent-caller-evidence-object'),
      producerId: 'caller-local-receipt-producer',
    }),
  };

  const result = productionAdmit(callerSubstitution, scenario.capability);
  assert.equal(result.status, 'refused');
  if (result.status === 'refused') {
    assert.equal(result.refusal.code, 'SourceRecordInvalid');
  }
});

test('F-063-02: a nonexistent immutable object fails closed at independent resolution', () => {
  const scenario = validScenario({ changedPaths: ['src/backend/release.ts'] });
  const base = scenario.authority!;
  const nonexistentSource = immutableDiffSourceFor(scenario.authenticatedDiff, {
    commit: oid('nonexistent-immutable-diff-object'),
  });
  const authority = authorityOverride(base, {
    enumerateAdmissionUniverse(repositoryId, releaseHeadOid) {
      const universe = base.enumerateAdmissionUniverse(repositoryId, releaseHeadOid);
      return universe === null ? null : resealUniverse(universe, nonexistentSource);
    },
    resolveImmutableDiff: () => null,
  });

  const result = admit(withFixtureAuthority(scenario, authority));
  assert.equal(result.status, 'refused');
  if (result.status === 'refused') {
    assert.equal(result.refusal.code, 'SourceRecordInvalid');
  }
});

test('F-063-02: producer, artifact, base, and head substitutions fail before admission', () => {
  const scenario = validScenario({ changedPaths: ['src/backend/release.ts'] });
  const base = scenario.authority!;
  const baselineSource = scenario.authenticatedDiffSource;
  const sources: readonly ImmutableDiffArtifactRef[] = [
    { ...baselineSource, commit: oid('different-object-commit') },
    {
      ...baselineSource,
      producer: { ...baselineSource.producer, principalId: 'different-producer' },
    },
    immutableDiffSourceFor(authenticatedDiffFor(['src/backend/release.ts'], {
      baseOid: oid('substituted-base'),
    })),
    immutableDiffSourceFor(authenticatedDiffFor(['src/backend/release.ts'], {
      headOid: oid('substituted-head'),
    })),
  ];

  for (const source of sources) {
    const authority = authorityOverride(base, {
      enumerateAdmissionUniverse(repositoryId, releaseHeadOid) {
        const universe = base.enumerateAdmissionUniverse(repositoryId, releaseHeadOid);
        return universe === null ? null : resealUniverse(universe, source);
      },
      resolveImmutableDiff(candidate) {
        if (canonicalJson(candidate) !== canonicalJson(source)) {
          return null;
        }
        return {
          source,
          canonicalBytes: canonicalJson(scenario.authenticatedDiff),
          diff: scenario.authenticatedDiff,
          producer: source.producer,
          producerAuthorized: true,
          authorizationEvidenceCommit: source.producer.authorizationCommit,
        };
      },
    });
    const result = admit(withFixtureAuthority(scenario, authority));
    assert.equal(result.status, 'refused');
    if (result.status === 'refused') {
      assert.equal(result.refusal.code, 'SourceRecordInvalid');
    }
  }
});

test('F-063-02: truncation plus rename/deletion ambiguity fail after immutable resolution', () => {
  const truncated = authenticatedDiffFor(
    ['src/backend/a.ts', 'src/backend/b.ts'],
    { pageSize: 1 },
  );
  const truncatedDiff = { ...truncated, pages: truncated.pages.slice(0, 1) };
  const truncatedResult = admit(validScenario({
    changedPaths: ['src/backend/a.ts', 'src/backend/b.ts'],
    authenticatedDiff: truncatedDiff,
  }));
  assert.equal(truncatedResult.status, 'refused');

  const ambiguous = authenticatedDiffFor([], {
    entries: [
      {
        ordinal: 0,
        changeKind: 'renamed',
        oldPath: 'src/backend/old.ts',
        newPath: null,
        oldBlobOid: oid('old-blob'),
        newBlobOid: oid('new-blob'),
      },
      {
        ordinal: 1,
        changeKind: 'deleted',
        oldPath: null,
        newPath: null,
        oldBlobOid: oid('deleted-old-blob'),
        newBlobOid: null,
      },
    ],
  });
  const ambiguityResult = admit(validScenario({
    changedPaths: ['src/backend/old.ts'],
    authenticatedDiff: ambiguous,
  }));
  assert.equal(ambiguityResult.status, 'refused');
});
