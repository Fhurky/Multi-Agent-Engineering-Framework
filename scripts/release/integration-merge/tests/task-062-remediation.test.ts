import test from 'node:test';
import assert from 'node:assert/strict';

import { admit as productionAdmit } from '../admission.ts';
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
