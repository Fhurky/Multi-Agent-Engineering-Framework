/**
 * Live control-plane fixtures — DECLARED AND UNEXECUTED.
 *
 * The approved "Required evidence and validation fixtures" list includes two families
 * that cannot be executed from this repository today, and that this task must not fake
 * or provision:
 *
 *   7. Live protected-branch tests with both App identities: failing checks block;
 *      neither App bypasses; task integration can only squash into the integration
 *      branch; release can only merge the integration pull request into `main`; direct
 *      and force pushes fail.
 *  11. A live attestor boundary test proving neither executor process nor the opaque
 *      merge client can obtain the observer credential, invoke Administration or
 *      ruleset endpoints, mutate policy, issue an attestation, or suppress revocation,
 *      and that the attestor port cannot call a merge endpoint.
 *
 * Blocking state, read from the approved architecture and this task's record rather
 * than from any live probe performed here:
 *
 *   - `main` and `integration/autonomous-runtime` are unprotected and the repository
 *     ruleset list is empty.
 *   - No required check is pinned to an expected App source and no bypass-actor set is
 *     configured.
 *   - The two least-privilege executor GitHub Apps and their token broker do not exist.
 *   - The external evidence store does not exist.
 *   - No `RepositoryPolicyAttestor` with its pinned observer principal set, signing
 *     key, trust root, and revocation service is provisioned.
 *
 * Provisioning any of the above is a HUMAN-004 third-exception control-plane action and
 * is outside this task's authority. These fixtures therefore remain declared and
 * skipped. This session performed, requested, configured, and simulated none of it, and
 * queried no policy or credential surface.
 *
 * Each fixture below is registered with `todo` so a runner reports it as an explicit
 * unexecuted obligation rather than as a pass. TASK-055 owns their validation once the
 * human-controlled control plane exists.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

const BLOCKED_REASON =
  'Blocked: the human-controlled control plane is absent. Provisioning it is a ' +
  'HUMAN-004 third-exception action and is outside this task and this role. ' +
  'Never fake, stub, or provision it to make this fixture pass.';

interface BlockedFixture {
  readonly id: string;
  readonly requirement: string;
  readonly proves: string;
}

/** Approved fixture list item 7. */
const LIVE_PROTECTED_BRANCH: readonly BlockedFixture[] = [
  {
    id: 'live-protected-branch/failing-check-blocks',
    requirement: 'Required checks pinned to their expected App sources on `main`',
    proves: 'A deliberately failing required check blocks the release merge identity.',
  },
  {
    id: 'live-protected-branch/no-bypass',
    requirement: 'A configured bypass-actor set that excludes both executor Apps',
    proves: 'Neither executor App can bypass branch protection or a ruleset.',
  },
  {
    id: 'live-protected-branch/release-scope',
    requirement: 'Protection on `main` with pull-request-only updates',
    proves:
      'The release identity can merge only the integration pull request into `main`.',
  },
  {
    id: 'live-protected-branch/task-scope',
    requirement: 'Protection on `integration/autonomous-runtime`',
    proves:
      'The task identity can only squash into the integration branch and can never name `main`.',
  },
  {
    id: 'live-protected-branch/direct-push-fails',
    requirement: 'No force push or deletion, and no bypass actors',
    proves: 'A direct push to `main` from either identity fails at the server.',
  },
  {
    id: 'live-protected-branch/force-push-fails',
    requirement: 'No force push or deletion, and no bypass actors',
    proves: 'A force push to `main` from either identity fails at the server.',
  },
];

/** Approved fixture list item 11. */
const LIVE_ATTESTOR_BOUNDARY: readonly BlockedFixture[] = [
  {
    id: 'live-attestor/credential-isolation',
    requirement: 'A provisioned RepositoryPolicyAttestor and its observer principals',
    proves:
      'Neither executor process nor the opaque merge client can obtain the observer credential.',
  },
  {
    id: 'live-attestor/no-administration-endpoint',
    requirement: 'Least-privilege executor Apps and their token broker',
    proves:
      'Neither executor identity can invoke an Administration or ruleset endpoint.',
  },
  {
    id: 'live-attestor/no-policy-mutation',
    requirement: 'A provisioned attestor with a signing path and no mutation operation',
    proves: 'Neither executor can mutate policy or issue an attestation.',
  },
  {
    id: 'live-attestor/no-revocation-suppression',
    requirement: 'A provisioned revocation and status channel',
    proves: 'Neither executor can suppress or replay a revocation.',
  },
  {
    id: 'live-attestor/attestor-cannot-merge',
    requirement: 'A provisioned attestor broker',
    proves: 'The attestor port cannot call a merge endpoint.',
  },
];

const ALL_BLOCKED = [...LIVE_PROTECTED_BRANCH, ...LIVE_ATTESTOR_BOUNDARY];

for (const fixture of ALL_BLOCKED) {
  test(
    `${fixture.id} — UNEXECUTED: ${fixture.proves}`,
    { todo: BLOCKED_REASON },
    () => {
      // Deliberately unsatisfiable. Executing this fixture requires the
      // human-controlled control plane described above. It must never be replaced by a
      // stub, a mock that asserts a live protection exists, or any provisioning step.
      // The failure is what keeps the obligation visible; the `todo` marker is what
      // keeps it from being mistaken for a verified result.
      throw new Error(`${fixture.id} is UNEXECUTED. ${BLOCKED_REASON}`);
    },
  );
}

test('the blocked live fixtures are declared, enumerated, and never faked', () => {
  assert.equal(LIVE_PROTECTED_BRANCH.length, 6);
  assert.equal(LIVE_ATTESTOR_BOUNDARY.length, 5);
  assert.equal(ALL_BLOCKED.length, 11);

  const ids = ALL_BLOCKED.map((fixture) => fixture.id);
  assert.equal(new Set(ids).size, ids.length);

  for (const fixture of ALL_BLOCKED) {
    assert.ok(fixture.requirement.length > 0, fixture.id);
    assert.ok(fixture.proves.length > 0, fixture.id);
  }
});

test('the blocked reason names the owning authority and forbids substitution', () => {
  assert.match(BLOCKED_REASON, /human-controlled control plane is absent/);
  assert.match(BLOCKED_REASON, /HUMAN-004 third-exception action/);
  assert.match(BLOCKED_REASON, /Never fake, stub, or provision it/);
});
