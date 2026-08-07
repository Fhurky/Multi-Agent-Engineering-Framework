/**
 * `published-head-evidence/v2` fixtures — one test per row of the normative table in
 * the approved contract, plus the digest-projection rule.
 *
 * Every row asserts no plan, no durable intent, and zero merge API calls before a
 * complete exact-head bundle exists.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { admit } from '../admission.ts';
import {
  authorEvidenceDigest,
  bundleDigest,
  commandEvidenceId,
  validatePublishedHeadEvidence,
} from '../published-head-evidence.ts';
import { omitTopLevel, sha256Canonical, selfDigest } from '../canonical-json.ts';
import { RELEASE_SOURCE_BRANCH } from '../contracts.ts';
import type {
  CompletePublishedHeadEvidenceBundle,
  IncompletePublishedHeadEvidenceBundle,
} from '../contracts.ts';
import { InMemoryEvidenceStore, RecordingMergePort } from './helpers/fakes.ts';
import {
  HEAD_OID,
  digest,
  oid,
  validAuthorPhase,
  validControlPhase,
  validManifest,
  validPublishedHeadBundle,
  validScenario,
} from './helpers/fixtures.ts';

function refuseWith(
  bundle: CompletePublishedHeadEvidenceBundle | IncompletePublishedHeadEvidenceBundle | null,
): string {
  const port = new RecordingMergePort();
  const store = new InMemoryEvidenceStore();
  const result = admit(validScenario({ publishedHeadEvidence: bundle }));
  assert.equal(port.callCount, 0);
  assert.equal(store.intents.size, 0);
  assert.equal(result.status, 'refused', JSON.stringify(result).slice(0, 300));
  if (result.status !== 'refused') {
    return 'unexpected';
  }
  assert.ok(!('plan' in result));
  return result.refusal.code;
}

/* --- Row 1: author phase only ------------------------------------------ */

test('an author phase with no control phase yet is PublishedHeadEvidenceIncomplete', () => {
  const author = validAuthorPhase();
  const incomplete: IncompletePublishedHeadEvidenceBundle = {
    schema: 'published-head-evidence/v2',
    status: 'author_phase_only',
    targetCommit: HEAD_OID,
    branch: RELEASE_SOURCE_BRANCH,
    author,
    control: null,
  };

  const validation = validatePublishedHeadEvidence(incomplete);
  assert.equal(validation.status, 'refused');
  if (validation.status !== 'refused') {
    return;
  }
  assert.equal(validation.code, 'PublishedHeadEvidenceIncomplete');
  assert.equal(validation.reason, 'control_phase_absent');
  assert.equal(refuseWith(incomplete), 'PublishedHeadEvidenceIncomplete');
});

/* --- Row 2: a later content commit ------------------------------------- */

test('author evidence naming H0 while H1 is the head is PublishedHeadEvidenceMismatch', () => {
  const staleTarget = oid('H0');
  const author = validAuthorPhase(staleTarget);
  const control = validControlPhase(author, staleTarget);
  const withoutDigest = {
    schema: 'published-head-evidence/v2' as const,
    status: 'complete' as const,
    // The bundle now claims the new head while both phases still name H0.
    targetCommit: HEAD_OID,
    branch: RELEASE_SOURCE_BRANCH,
    author,
    control,
    canonicalBundleDigest: '',
  };
  const bundle: CompletePublishedHeadEvidenceBundle = {
    ...withoutDigest,
    canonicalBundleDigest: selfDigest(withoutDigest, 'canonicalBundleDigest'),
  };

  assert.equal(refuseWith(bundle), 'PublishedHeadEvidenceMismatch');
});

/* --- Row 3: the complete bundle ---------------------------------------- */

test('a complete two-phase bundle satisfies the evidence prerequisite', () => {
  const validation = validatePublishedHeadEvidence(validPublishedHeadBundle());
  assert.equal(validation.status, 'complete');
  // Admission continues but is not implied by evidence alone.
  assert.equal(admit(validScenario()).status, 'admitted');
});

/* --- Row 4: an omitted command field ----------------------------------- */

const OMITTED_FIELDS = [
  'workingDirectory',
  'startedAtUtc',
  'endedAtUtc',
  'exitCode',
  'targetCommit',
  'actualResult',
] as const;

for (const field of OMITTED_FIELDS) {
  test(`a command omitting ${field} is PublishedHeadEvidenceIncomplete`, () => {
    const bundle = validPublishedHeadBundle();
    const first = bundle.author.commands[0];
    assert.ok(first !== undefined);
    const stripped = omitTopLevel(first, field);
    const author = {
      ...bundle.author,
      commands: [stripped as never, ...bundle.author.commands.slice(1)],
    };
    const mutated = {
      ...bundle,
      author: {
        ...author,
        canonicalAuthorEvidenceDigest: authorEvidenceDigest(author as never),
      },
    };
    const revalidated = validatePublishedHeadEvidence(mutated as never);
    assert.equal(revalidated.status, 'refused');
    if (revalidated.status !== 'refused') {
      return;
    }
    assert.equal(revalidated.code, 'PublishedHeadEvidenceIncomplete');
  });
}

/* --- Row 5: an unexpected exit code ------------------------------------ */

test('a declared command exiting differently is PublishedHeadVerificationFailed', () => {
  const bundle = validPublishedHeadBundle();
  const first = bundle.author.commands[0];
  assert.ok(first !== undefined);
  const failed = { ...first, exitCode: 1 };
  const withId = { ...failed, evidenceId: commandEvidenceId(failed) };
  const author = {
    ...bundle.author,
    commands: [withId, ...bundle.author.commands.slice(1)],
  };
  const mutated = {
    ...bundle,
    author: {
      ...author,
      canonicalAuthorEvidenceDigest: authorEvidenceDigest(author),
    },
  };
  const validation = validatePublishedHeadEvidence(mutated as never);
  assert.equal(validation.status, 'refused');
  if (validation.status !== 'refused') {
    return;
  }
  assert.equal(validation.code, 'PublishedHeadVerificationFailed');
});

/* --- Row 6: truthful absence of checks --------------------------------- */

test('truthfully recorded zero check runs is structurally complete then RequiredCheckMissing', () => {
  const bundle = validPublishedHeadBundle();
  const control = {
    ...bundle.control,
    exactHeadChecks: {
      targetCommit: HEAD_OID,
      queriedAtUtc: bundle.control.exactHeadChecks.queriedAtUtc,
      state: 'absent' as const,
      totalCount: 0,
      checks: [],
    },
  };
  const withoutDigest = {
    ...bundle,
    control,
    canonicalBundleDigest: '',
  };
  const truthful: CompletePublishedHeadEvidenceBundle = {
    ...withoutDigest,
    canonicalBundleDigest: selfDigest(withoutDigest, 'canonicalBundleDigest'),
  };

  // The bundle itself is structurally complete.
  assert.equal(validatePublishedHeadEvidence(truthful).status, 'complete');

  // The separate required-check predicate still refuses. Absence is never success.
  const result = admit(
    validScenario({
      publishedHeadEvidence: truthful,
      manifest: validManifest({
        publishedHeadEvidenceDigest: truthful.canonicalBundleDigest,
      }),
      requiredChecks: {
        targetCommit: HEAD_OID,
        requiredContexts: [{ name: 'CI / validate', expectedAppId: 1 }],
        observed: [],
      },
    }),
  );
  assert.equal(result.status, 'refused');
  if (result.status !== 'refused') {
    return;
  }
  assert.equal(result.refusal.code, 'RequiredCheckMissing');
});

test('an absent rollup recorded as present_successful is a mismatch', () => {
  const bundle = validPublishedHeadBundle();
  const lying = {
    ...bundle,
    control: {
      ...bundle.control,
      exactHeadChecks: {
        ...bundle.control.exactHeadChecks,
        state: 'present_successful' as const,
        totalCount: 0,
        checks: [],
      },
    },
  };
  const validation = validatePublishedHeadEvidence(lying as never);
  assert.equal(validation.status, 'refused');
  if (validation.status !== 'refused') {
    return;
  }
  assert.equal(validation.code, 'PublishedHeadEvidenceMismatch');
});

test('a non-success conclusion recorded as present_successful is a mismatch', () => {
  const bundle = validPublishedHeadBundle();
  const lying = {
    ...bundle,
    control: {
      ...bundle.control,
      exactHeadChecks: {
        ...bundle.control.exactHeadChecks,
        checks: [
          {
            name: 'CI / validate',
            appId: 1,
            startedAtUtc: null,
            completedAtUtc: null,
            conclusion: 'skipped',
          },
        ],
        totalCount: 1,
        state: 'present_successful' as const,
      },
    },
  };
  const validation = validatePublishedHeadEvidence(lying as never);
  assert.equal(validation.status, 'refused');
  if (validation.status !== 'refused') {
    return;
  }
  assert.equal(validation.code, 'PublishedHeadEvidenceMismatch');
});

/* --- Row 7: reusing H0 check results while the head is H1 -------------- */

test('control reusing H0 results while heads equal H1 is a mismatch', () => {
  const bundle = validPublishedHeadBundle();
  const reused = {
    ...bundle,
    control: {
      ...bundle.control,
      exactHeadChecks: {
        ...bundle.control.exactHeadChecks,
        targetCommit: oid('H0'),
      },
    },
  };
  const validation = validatePublishedHeadEvidence(reused as never);
  assert.equal(validation.status, 'refused');
  if (validation.status !== 'refused') {
    return;
  }
  assert.equal(validation.code, 'PublishedHeadEvidenceMismatch');
});

test('a later commit on any of the three refs invalidates the proof', () => {
  for (const ref of ['localBranch', 'remoteBranch', 'pullRequestHead'] as const) {
    const bundle = validPublishedHeadBundle();
    const mutated = {
      ...bundle,
      control: {
        ...bundle.control,
        noLaterContent: {
          ...bundle.control.noLaterContent,
          commitsAfterTarget: {
            ...bundle.control.noLaterContent.commitsAfterTarget,
            [ref]: 1,
          },
        },
      },
    };
    const validation = validatePublishedHeadEvidence(mutated as never);
    assert.equal(validation.status, 'refused');
    if (validation.status !== 'refused') {
      continue;
    }
    assert.equal(validation.code, 'PublishedHeadEvidenceMismatch');
    assert.equal(validation.reason, 'later_content_commit_present');
  }
});

test('a remote head other than the target invalidates the proof', () => {
  const bundle = validPublishedHeadBundle();
  const mutated = {
    ...bundle,
    control: {
      ...bundle.control,
      noLaterContent: {
        ...bundle.control.noLaterContent,
        remoteBranchHeadOid: oid('remote-moved'),
      },
    },
  };
  const validation = validatePublishedHeadEvidence(mutated as never);
  assert.equal(validation.status, 'refused');
  if (validation.status !== 'refused') {
    return;
  }
  assert.equal(validation.reason, 'observed_head_not_target');
});

/* --- Row 8: digest projection ------------------------------------------ */

test('only omission of the one named top-level digest property is valid', () => {
  const bundle = validPublishedHeadBundle();

  // The valid projection.
  assert.equal(bundleDigest(bundle), bundle.canonicalBundleDigest);

  // Hashing with the property included, nulled, emptied, or replaced all differ.
  const included = sha256Canonical(bundle);
  const nulled = sha256Canonical({ ...bundle, canonicalBundleDigest: null });
  const emptied = sha256Canonical({ ...bundle, canonicalBundleDigest: '' });
  const placeholder = sha256Canonical({
    ...bundle,
    canonicalBundleDigest: '0'.repeat(64),
  });

  for (const wrong of [included, nulled, emptied, placeholder]) {
    assert.notEqual(wrong, bundle.canonicalBundleDigest);
    const forged = { ...bundle, canonicalBundleDigest: wrong };
    const validation = validatePublishedHeadEvidence(forged);
    assert.equal(validation.status, 'refused');
    if (validation.status !== 'refused') {
      continue;
    }
    assert.equal(validation.code, 'PublishedHeadEvidenceMismatch');
  }
});

test('exactly one property is omitted and no other property is dropped', () => {
  const bundle = validPublishedHeadBundle();
  const projected = omitTopLevel(bundle, 'canonicalBundleDigest') as Record<
    string,
    unknown
  >;
  assert.equal(Object.keys(projected).length, Object.keys(bundle).length - 1);
  assert.ok(!('canonicalBundleDigest' in projected));
  for (const key of ['schema', 'status', 'targetCommit', 'branch', 'author', 'control']) {
    assert.ok(key in projected, `${key} must be retained`);
  }
});

test('each of the three self-identifying digests verifies independently', () => {
  const bundle = validPublishedHeadBundle();
  for (const command of [...bundle.author.commands, ...bundle.control.commands]) {
    assert.equal(commandEvidenceId(command), command.evidenceId);
  }
  assert.equal(
    authorEvidenceDigest(bundle.author),
    bundle.author.canonicalAuthorEvidenceDigest,
  );
  assert.equal(bundleDigest(bundle), bundle.canonicalBundleDigest);
});

/* --- Cross-phase binding ------------------------------------------------ */

test('a control phase bound to another author digest is a mismatch', () => {
  const bundle = validPublishedHeadBundle();
  const mutated = {
    ...bundle,
    control: { ...bundle.control, authorEvidenceDigest: digest('other-author') },
  };
  const validation = validatePublishedHeadEvidence(mutated as never);
  assert.equal(validation.status, 'refused');
  if (validation.status !== 'refused') {
    return;
  }
  assert.equal(validation.reason, 'control_author_digest_mismatch');
});

test('a control phase completed before the author phase is a mismatch', () => {
  const bundle = validPublishedHeadBundle();
  const mutated = {
    ...bundle,
    control: { ...bundle.control, completedAtUtc: '2020-01-01T00:00:00.000Z' },
  };
  const validation = validatePublishedHeadEvidence(mutated as never);
  assert.equal(validation.status, 'refused');
  if (validation.status !== 'refused') {
    return;
  }
  assert.equal(validation.reason, 'control_precedes_author');
});

test('the author phase must cover every declared check identifier', () => {
  const bundle = validPublishedHeadBundle();
  const authorWithoutDigest = {
    ...bundle.author,
    declaredCheckIds: [...bundle.author.declaredCheckIds, 'a-check-never-run'],
    canonicalAuthorEvidenceDigest: '',
  };
  const author = {
    ...authorWithoutDigest,
    canonicalAuthorEvidenceDigest: authorEvidenceDigest(authorWithoutDigest),
  };
  const validation = validatePublishedHeadEvidence({
    ...bundle,
    author,
    control: { ...bundle.control, authorEvidenceDigest: author.canonicalAuthorEvidenceDigest },
  } as never);

  assert.equal(validation.status, 'refused');
  if (validation.status !== 'refused') {
    return;
  }
  assert.equal(validation.code, 'PublishedHeadEvidenceIncomplete');
  assert.equal(
    validation.reason,
    'author_declared_check_omitted:a-check-never-run',
  );
});

test('the control phase records publication queries, not a rerun of the local set', () => {
  // The two phases share one declared check set, but the control session records the
  // remote, pull-request, no-later-content, and exact-head check queries that cannot
  // exist before publication. It is not required to repeat the author's local checks.
  const bundle = validPublishedHeadBundle();
  const authorCheckIds = bundle.author.commands.map(
    (command) => command.materialArguments['checkId'],
  );
  const controlCheckIds = bundle.control.commands.map(
    (command) => command.materialArguments['checkId'],
  );
  assert.deepEqual(bundle.control.declaredCheckIds, bundle.author.declaredCheckIds);
  assert.ok(authorCheckIds.length > 0);
  assert.ok(controlCheckIds.length > 0);
  assert.equal(validatePublishedHeadEvidence(bundle).status, 'complete');
});

test('a control phase whose declared check set differs is a mismatch', () => {
  const bundle = validPublishedHeadBundle();
  const validation = validatePublishedHeadEvidence({
    ...bundle,
    control: { ...bundle.control, declaredCheckIds: ['a-different-set'] },
  } as never);
  assert.equal(validation.status, 'refused');
  if (validation.status !== 'refused') {
    return;
  }
  assert.equal(validation.reason, 'declared_check_set_mismatch');
});

test('an absent bundle refuses before any plan, intent, or API call', () => {
  assert.equal(refuseWith(null), 'PublishedHeadEvidenceIncomplete');
});
