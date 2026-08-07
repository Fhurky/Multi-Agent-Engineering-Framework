/**
 * Required-check and protected-path fixtures.
 *
 * Only `success` passes. `neutral`, `skipped`, `timed_out`, `cancelled`, missing,
 * stale, unknown, and wrong-publisher results all refuse. The protected-path set has
 * no override variant.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { admit } from '../admission.ts';
import { evaluateRequiredChecks } from '../required-checks.ts';
import {
  findProtectedPathChanges,
  isProtectedPath,
  protectedPathSet,
} from '../protected-paths.ts';
import { RecordingMergePort } from './helpers/fakes.ts';
import {
  HEAD_OID,
  REQUIRED_CHECK_APP_ID,
  oid,
  validRequiredChecks,
  validScenario,
} from './helpers/fixtures.ts';

function admitWithChecks(
  observed: ReturnType<typeof validRequiredChecks>['observed'],
): string {
  const port = new RecordingMergePort();
  const result = admit(
    validScenario({
      requiredChecks: { ...validRequiredChecks(), observed },
    }),
  );
  assert.equal(port.callCount, 0);
  assert.equal(result.status, 'refused');
  if (result.status !== 'refused') {
    return 'unexpected';
  }
  return result.refusal.code;
}

test('the fixture check set is all successful', () => {
  const evaluation = evaluateRequiredChecks(validRequiredChecks(), HEAD_OID);
  assert.equal(evaluation.status, 'all_successful');
});

const NON_SUCCESS_CONCLUSIONS = [
  'neutral',
  'skipped',
  'timed_out',
  'cancelled',
  'failure',
  'action_required',
  'stale',
  'some_unknown_future_value',
] as const;

for (const conclusion of NON_SUCCESS_CONCLUSIONS) {
  test(`a required check concluding ${conclusion} refuses`, () => {
    const observed = validRequiredChecks().observed.map((run, index) =>
      index === 0 ? { ...run, conclusion } : run,
    );
    assert.equal(admitWithChecks(observed), 'RequiredCheckNotSuccessful');
  });
}

test('an in-progress required check refuses', () => {
  const observed = validRequiredChecks().observed.map((run, index) =>
    index === 0 ? { ...run, status: 'in_progress' as const, conclusion: null } : run,
  );
  assert.equal(admitWithChecks(observed), 'RequiredCheckNotSuccessful');
});

test('a required check with no conclusion refuses', () => {
  const observed = validRequiredChecks().observed.map((run, index) =>
    index === 0 ? { ...run, conclusion: null } : run,
  );
  assert.equal(admitWithChecks(observed), 'RequiredCheckNotSuccessful');
});

test('a missing required context refuses with RequiredCheckMissing', () => {
  assert.equal(
    admitWithChecks(validRequiredChecks().observed.slice(0, 1)),
    'RequiredCheckMissing',
  );
});

test('zero check runs refuses with RequiredCheckMissing', () => {
  assert.equal(admitWithChecks([]), 'RequiredCheckMissing');
});

test('a wrong publisher refuses with RequiredCheckPublisherMismatch', () => {
  const observed = validRequiredChecks().observed.map((run, index) =>
    index === 0 ? { ...run, appId: REQUIRED_CHECK_APP_ID + 1 } : run,
  );
  assert.equal(admitWithChecks(observed), 'RequiredCheckPublisherMismatch');
});

test('a check observation read for another commit is never transferable', () => {
  const evaluation = evaluateRequiredChecks(validRequiredChecks(), oid('another-head'));
  assert.equal(evaluation.status, 'refused');
  if (evaluation.status !== 'refused') {
    return;
  }
  assert.equal(evaluation.code, 'RequiredCheckMissing');
  assert.equal(evaluation.reason, 'observation_target_mismatch');
});

test('an empty required-context configuration fails closed', () => {
  const evaluation = evaluateRequiredChecks(
    { targetCommit: HEAD_OID, requiredContexts: [], observed: [] },
    HEAD_OID,
  );
  assert.equal(evaluation.status, 'refused');
  if (evaluation.status !== 'refused') {
    return;
  }
  assert.equal(evaluation.reason, 'no_required_contexts_declared');
});

/* --- Protected paths ---------------------------------------------------- */

const PROTECTED_SAMPLES = [
  'AGENTS.md',
  'CLAUDE.md',
  'config/agents/settings.yaml',
  '.agents/devops/ROLE.md',
  '.agents/ROUTING.md',
  '.githooks/pre-push',
  'scripts/orchestration/validate-write-scope.ps1',
  'scripts/orchestration/claim-task.ps1',
  'scripts/setup/install-git-hooks.ps1',
  'scripts/ci/validate-framework.ps1',
  'scripts/ci/test-orchestration.ps1',
  'scripts/security/check-repository.ps1',
  '.github/workflows/ci.yml',
  '.github/workflows/security.yml',
  '.github/CODEOWNERS',
  '.gitattributes',
  '.gitignore',
  '.worktreeinclude',
] as const;

for (const path of PROTECTED_SAMPLES) {
  test(`a release diff touching ${path} refuses with ProtectedPathChange`, () => {
    const port = new RecordingMergePort();
    const result = admit(
      validScenario({ changedPaths: ['README.md', path] }),
    );
    assert.equal(port.callCount, 0);
    assert.equal(result.status, 'refused');
    if (result.status !== 'refused') {
      return;
    }
    assert.equal(result.refusal.code, 'ProtectedPathChange');
  });
}

test('a Windows-style separator cannot evade the protected-path comparison', () => {
  assert.ok(isProtectedPath('.agents\\devops\\ROLE.md'));
  assert.ok(isProtectedPath('scripts\\orchestration\\claim-task.ps1'));
  assert.ok(isProtectedPath('./AGENTS.md'));
});

test('ordinary product paths are not protected', () => {
  for (const path of [
    'src/orchestrator/state/index.ts',
    'docs/architecture/runtime/COMPONENT-BOUNDARIES.md',
    'scripts/release/integration-merge/index.ts',
    'README.md',
  ]) {
    assert.equal(isProtectedPath(path), false, path);
  }
});

test('the protected-path set is exposed read-only and has no override variant', () => {
  const before = protectedPathSet();
  assert.ok(Object.isFrozen(before.exact));
  assert.ok(Object.isFrozen(before.prefixes));
  assert.throws(() => {
    (before.exact as string[]).push('README.md');
  });
  assert.deepEqual(protectedPathSet().exact, before.exact);
});

test('every protected path in a diff is reported, in input order', () => {
  const findings = findProtectedPathChanges([
    'README.md',
    'AGENTS.md',
    'src/index.ts',
    '.githooks/pre-push',
  ]);
  assert.deepEqual(
    findings.map((finding) => finding.path),
    ['AGENTS.md', '.githooks/pre-push'],
  );
});
