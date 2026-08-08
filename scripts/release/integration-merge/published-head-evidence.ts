/**
 * `published-head-evidence/v2` — exact published-head owner evidence.
 *
 * The bundle has two non-interchangeable phases. The author phase exists only after
 * the final content commit and before publication. The control phase can exist only
 * after the exact target is pushed and the pull request exists or is updated; remote
 * head, pull-request head, no-later-content, and exact-head check facts belong only
 * there.
 *
 * All three self-identifying digests omit exactly one named top-level property during
 * canonical hashing. The property is absent, not `null`, empty, or a placeholder, and
 * no other property is omitted. Verification repeats the same projection and compares
 * lowercase hexadecimal bytes exactly.
 *
 * `ExactHeadCheckEvidence` records the observed state, not a desired state. A truthful
 * `absent` record can make the bundle structurally complete; the separate required
 * check predicate still refuses. Absence is never success.
 */

import {
  isGitOid,
  isIsoTimestamp,
  isSha256Hex,
  isoToEpochMs,
  selfDigest,
} from './canonical-json.ts';
import type {
  AuthorPrePublicationEvidence,
  ControlPostPublicationEvidence,
  ExactHeadCheckEvidence,
  GitOid,
  NoLaterContentProof,
  PublishedHeadCommandEvidence,
  PublishedHeadEvidenceBundle,
  CompletePublishedHeadEvidenceBundle,
  Sha256Hex,
} from './contracts.ts';

export type PublishedHeadEvidenceRefusalCode =
  | 'PublishedHeadEvidenceIncomplete'
  | 'PublishedHeadEvidenceMismatch'
  | 'PublishedHeadVerificationFailed';

export type PublishedHeadEvidenceValidation =
  | {
      readonly status: 'complete';
      readonly bundle: CompletePublishedHeadEvidenceBundle;
      readonly bundleDigest: Sha256Hex;
    }
  | {
      readonly status: 'refused';
      readonly code: PublishedHeadEvidenceRefusalCode;
      readonly reason: string;
    };

function refuse(
  code: PublishedHeadEvidenceRefusalCode,
  reason: string,
): PublishedHeadEvidenceValidation {
  return { status: 'refused', code, reason };
}

function isRecordObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Recomputes `evidenceId` by omitting exactly that one top-level property. */
export function commandEvidenceId(
  command: PublishedHeadCommandEvidence,
): Sha256Hex {
  return selfDigest(command, 'evidenceId');
}

/** Recomputes `canonicalAuthorEvidenceDigest` by omitting exactly that property. */
export function authorEvidenceDigest(
  author: AuthorPrePublicationEvidence,
): Sha256Hex {
  return selfDigest(author, 'canonicalAuthorEvidenceDigest');
}

/** Recomputes `canonicalBundleDigest` by omitting exactly that property. */
export function bundleDigest(
  bundle: CompletePublishedHeadEvidenceBundle,
): Sha256Hex {
  return selfDigest(bundle, 'canonicalBundleDigest');
}

const COMMAND_REQUIRED_FIELDS = [
  'schema',
  'evidenceId',
  'phase',
  'producer',
  'targetCommit',
  'branch',
  'workingDirectory',
  'startedAtUtc',
  'endedAtUtc',
  'executable',
  'arguments',
  'renderedCommand',
  'materialArguments',
  'resolvedBases',
  'headBefore',
  'headAfter',
  'expectedExitCode',
  'exitCode',
  'actualResult',
] as const;

function validateCommand(
  command: PublishedHeadCommandEvidence,
  phase: 'author_pre_publication' | 'control_post_publication',
  targetCommit: string,
  branch: string,
): PublishedHeadEvidenceValidation | null {
  if (!isRecordObject(command)) {
    return refuse('PublishedHeadEvidenceIncomplete', 'command_not_an_object');
  }

  const record = command as unknown as Record<string, unknown>;
  for (const field of COMMAND_REQUIRED_FIELDS) {
    if (record[field] === undefined || record[field] === null) {
      return refuse(
        'PublishedHeadEvidenceIncomplete',
        `command_field_missing:${field}`,
      );
    }
  }

  if (command.schema !== 'published-head-command-evidence/v2') {
    return refuse('PublishedHeadEvidenceIncomplete', 'command_schema_mismatch');
  }
  if (command.phase !== phase) {
    return refuse('PublishedHeadEvidenceMismatch', 'command_phase_mismatch');
  }
  if (
    typeof command.producer.role !== 'string' ||
    command.producer.role === '' ||
    typeof command.producer.executionSessionId !== 'string' ||
    command.producer.executionSessionId === ''
  ) {
    return refuse('PublishedHeadEvidenceIncomplete', 'command_producer_incomplete');
  }
  if (!isGitOid(command.targetCommit)) {
    return refuse('PublishedHeadEvidenceIncomplete', 'command_target_not_full_oid');
  }
  if (command.targetCommit !== targetCommit) {
    return refuse('PublishedHeadEvidenceMismatch', 'command_target_mismatch');
  }
  if (command.branch !== branch) {
    return refuse('PublishedHeadEvidenceMismatch', 'command_branch_mismatch');
  }
  if (typeof command.workingDirectory !== 'string' || command.workingDirectory === '') {
    return refuse(
      'PublishedHeadEvidenceIncomplete',
      'command_working_directory_missing',
    );
  }
  if (!isIsoTimestamp(command.startedAtUtc) || !isIsoTimestamp(command.endedAtUtc)) {
    return refuse('PublishedHeadEvidenceIncomplete', 'command_timing_missing');
  }
  if (isoToEpochMs(command.endedAtUtc) < isoToEpochMs(command.startedAtUtc)) {
    return refuse('PublishedHeadEvidenceIncomplete', 'command_timing_inverted');
  }
  if (typeof command.executable !== 'string' || command.executable === '') {
    return refuse('PublishedHeadEvidenceIncomplete', 'command_executable_missing');
  }
  if (!Array.isArray(command.arguments)) {
    return refuse('PublishedHeadEvidenceIncomplete', 'command_arguments_missing');
  }
  if (!isGitOid(command.headBefore) || !isGitOid(command.headAfter)) {
    return refuse('PublishedHeadEvidenceIncomplete', 'command_head_not_full_oid');
  }
  // The author runs with HEAD equal to the target; head before, head after, and the
  // enclosing target must be identical.
  if (
    command.headBefore !== targetCommit ||
    command.headAfter !== targetCommit
  ) {
    return refuse('PublishedHeadEvidenceMismatch', 'command_head_moved');
  }
  if (
    !Number.isSafeInteger(command.expectedExitCode) ||
    !Number.isSafeInteger(command.exitCode)
  ) {
    return refuse('PublishedHeadEvidenceIncomplete', 'command_exit_code_missing');
  }
  if (
    typeof command.actualResult.summary !== 'string' ||
    command.actualResult.summary === ''
  ) {
    return refuse('PublishedHeadEvidenceIncomplete', 'command_result_missing');
  }
  if (
    command.actualResult.outputDigest === null &&
    (command.actualResult.derivation === null ||
      command.actualResult.derivation === '')
  ) {
    return refuse(
      'PublishedHeadEvidenceIncomplete',
      'command_result_lacks_digest_and_derivation',
    );
  }
  if (
    command.actualResult.outputDigest !== null &&
    !isSha256Hex(command.actualResult.outputDigest)
  ) {
    return refuse('PublishedHeadEvidenceIncomplete', 'command_output_digest_invalid');
  }
  if (commandEvidenceId(command) !== command.evidenceId) {
    return refuse('PublishedHeadEvidenceMismatch', 'command_evidence_id_mismatch');
  }
  // An exit code other than the declared expected code is a verification failure,
  // not an incomplete record.
  if (command.exitCode !== command.expectedExitCode) {
    return refuse(
      'PublishedHeadVerificationFailed',
      `command_unexpected_exit_code:${command.exitCode}`,
    );
  }

  return null;
}

function declaredChecksCovered(
  declaredCheckIds: readonly string[],
  commands: readonly PublishedHeadCommandEvidence[],
): string | null {
  for (const checkId of declaredCheckIds) {
    const covered = commands.some(
      (command) => command.materialArguments['checkId'] === checkId,
    );
    if (!covered) {
      return checkId;
    }
  }
  return null;
}

function sameStringRecord(
  left: Readonly<Record<string, string>>,
  right: Readonly<Record<string, string>>,
): boolean {
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }
  for (let index = 0; index < leftKeys.length; index += 1) {
    const key = leftKeys[index] as string;
    if (rightKeys[index] !== key) {
      return false;
    }
    if (left[key] !== right[key]) {
      return false;
    }
  }
  return true;
}

function validateExactHeadChecks(
  checks: ExactHeadCheckEvidence,
  targetCommit: string,
): PublishedHeadEvidenceValidation | null {
  if (!isRecordObject(checks)) {
    return refuse('PublishedHeadEvidenceIncomplete', 'exact_head_checks_missing');
  }
  if (checks.targetCommit !== targetCommit) {
    return refuse('PublishedHeadEvidenceMismatch', 'exact_head_checks_target_mismatch');
  }
  if (!isIsoTimestamp(checks.queriedAtUtc)) {
    return refuse('PublishedHeadEvidenceIncomplete', 'exact_head_checks_no_timestamp');
  }
  if (!Array.isArray(checks.checks)) {
    return refuse('PublishedHeadEvidenceIncomplete', 'exact_head_checks_no_list');
  }
  if (!Number.isSafeInteger(checks.totalCount) || checks.totalCount < 0) {
    return refuse('PublishedHeadEvidenceIncomplete', 'exact_head_checks_no_total');
  }
  if (checks.totalCount !== checks.checks.length) {
    return refuse('PublishedHeadEvidenceMismatch', 'exact_head_checks_count_mismatch');
  }

  const allSuccessful =
    checks.checks.length > 0 &&
    checks.checks.every((check) => check.conclusion === 'success');

  // `totalCount: 0` or an empty rollup is `absent`. Any present non-success terminal
  // or in-progress check is `present_nonpassing`. Only a non-empty set whose members
  // all concluded `success` is `present_successful`.
  const observedState: ExactHeadCheckEvidence['state'] =
    checks.checks.length === 0
      ? 'absent'
      : allSuccessful
        ? 'present_successful'
        : 'present_nonpassing';

  if (checks.state !== observedState) {
    return refuse(
      'PublishedHeadEvidenceMismatch',
      `exact_head_checks_state_not_observed:${checks.state}`,
    );
  }

  return null;
}

/**
 * The three distinct proof kinds a no-later-content proof must carry. Each is bound to
 * its own successful command record with a reproducible result digest and material
 * arguments that name the fact the proof asserts.
 */
export const NO_LATER_CONTENT_PROOF_KINDS = [
  'local_branch_head',
  'remote_branch_head',
  'pull_request_head',
] as const;

export type NoLaterContentProofKind = (typeof NO_LATER_CONTENT_PROOF_KINDS)[number];

function validateProofKinds(
  proofCommands: readonly PublishedHeadCommandEvidence[],
  proof: NoLaterContentProof,
): PublishedHeadEvidenceValidation | null {
  const observedHeads: Readonly<Record<NoLaterContentProofKind, string>> = {
    local_branch_head: proof.localBranchHeadOid,
    remote_branch_head: proof.remoteBranchHeadOid,
    pull_request_head: proof.pullRequestHeadOid,
  };
  const observedCounts: Readonly<Record<NoLaterContentProofKind, number>> = {
    local_branch_head: proof.commitsAfterTarget.localBranch,
    remote_branch_head: proof.commitsAfterTarget.remoteBranch,
    pull_request_head: proof.commitsAfterTarget.pullRequestHead,
  };

  for (const kind of NO_LATER_CONTENT_PROOF_KINDS) {
    const matches = proofCommands.filter(
      (command) => command.materialArguments['proofKind'] === kind,
    );
    if (matches.length !== 1) {
      // One distinct command per proof kind. A single command cannot self-digest all
      // three claims, and two commands cannot both stand for one of them.
      return refuse(
        'PublishedHeadEvidenceIncomplete',
        `no_later_content_proof_kind_not_distinct:${kind}`,
      );
    }
    const command = matches[0] as PublishedHeadCommandEvidence;
    if (command.actualResult.outputDigest === null) {
      return refuse(
        'PublishedHeadEvidenceIncomplete',
        `no_later_content_proof_result_not_reproducible:${kind}`,
      );
    }
    if (command.materialArguments['observedHeadOid'] !== observedHeads[kind]) {
      return refuse(
        'PublishedHeadEvidenceMismatch',
        `no_later_content_proof_head_unbound:${kind}`,
      );
    }
    if (command.materialArguments['commitsAfterTarget'] !== observedCounts[kind]) {
      return refuse(
        'PublishedHeadEvidenceMismatch',
        `no_later_content_proof_count_unbound:${kind}`,
      );
    }
    if (
      kind === 'remote_branch_head' &&
      command.materialArguments['remoteRef'] !== proof.remoteRef
    ) {
      return refuse(
        'PublishedHeadEvidenceMismatch',
        'no_later_content_proof_remote_ref_unbound',
      );
    }
    if (
      kind === 'pull_request_head' &&
      command.materialArguments['pullRequestNumber'] !== proof.pullRequestNumber
    ) {
      return refuse(
        'PublishedHeadEvidenceMismatch',
        'no_later_content_proof_pull_request_unbound',
      );
    }
  }

  return null;
}

function phaseProducerIdentities(
  commands: readonly PublishedHeadCommandEvidence[],
): readonly string[] {
  return [
    ...new Set(
      commands.map(
        (command) => `${command.producer.role} ${command.producer.executionSessionId}`,
      ),
    ),
  ];
}

/**
 * The two phases must come from two distinct producer sessions. Without this, one
 * producer can manufacture both phases and self-digest arbitrary proof claims, which is
 * precisely what the two-phase split exists to prevent.
 */
function validatePhaseProducers(
  author: AuthorPrePublicationEvidence,
  control: ControlPostPublicationEvidence,
): PublishedHeadEvidenceValidation | null {
  const authorIdentities = phaseProducerIdentities(author.commands);
  const controlIdentities = phaseProducerIdentities(control.commands);

  if (authorIdentities.length !== 1 || controlIdentities.length !== 1) {
    return refuse(
      'PublishedHeadEvidenceIncomplete',
      'phase_producer_not_a_single_session',
    );
  }

  const authorSessions = new Set(
    author.commands.map((command) => command.producer.executionSessionId),
  );
  for (const command of control.commands) {
    if (authorSessions.has(command.producer.executionSessionId)) {
      return refuse(
        'PublishedHeadEvidenceMismatch',
        'phase_producer_sessions_not_independent',
      );
    }
  }
  if (authorIdentities[0] === controlIdentities[0]) {
    return refuse(
      'PublishedHeadEvidenceMismatch',
      'phase_producer_sessions_not_independent',
    );
  }

  return null;
}

/**
 * Total validation of a `published-head-evidence/v2` bundle. Never throws.
 * A bundle without its control phase is `PublishedHeadEvidenceIncomplete`, not
 * implicitly successful.
 */
export function validatePublishedHeadEvidence(
  bundle: PublishedHeadEvidenceBundle | null | undefined,
): PublishedHeadEvidenceValidation {
  if (!isRecordObject(bundle)) {
    return refuse('PublishedHeadEvidenceIncomplete', 'bundle_absent');
  }
  if (bundle.schema !== 'published-head-evidence/v2') {
    return refuse('PublishedHeadEvidenceIncomplete', 'bundle_schema_mismatch');
  }
  if (!isGitOid(bundle.targetCommit)) {
    return refuse('PublishedHeadEvidenceIncomplete', 'bundle_target_not_full_oid');
  }
  if (typeof bundle.branch !== 'string' || bundle.branch === '') {
    return refuse('PublishedHeadEvidenceIncomplete', 'bundle_branch_missing');
  }

  const author = bundle.author as AuthorPrePublicationEvidence;

  if (!isRecordObject(author)) {
    return refuse('PublishedHeadEvidenceIncomplete', 'author_phase_absent');
  }
  if (author.phase !== 'author_pre_publication') {
    return refuse('PublishedHeadEvidenceIncomplete', 'author_phase_mismatch');
  }
  if (author.targetCommit !== bundle.targetCommit) {
    return refuse('PublishedHeadEvidenceMismatch', 'author_target_mismatch');
  }
  if (author.branch !== bundle.branch) {
    return refuse('PublishedHeadEvidenceMismatch', 'author_branch_mismatch');
  }
  if (!Array.isArray(author.authoredParents) || author.authoredParents.length === 0) {
    return refuse('PublishedHeadEvidenceIncomplete', 'author_parents_missing');
  }
  for (const parent of author.authoredParents) {
    if (!isGitOid(parent)) {
      return refuse('PublishedHeadEvidenceIncomplete', 'author_parent_not_full_oid');
    }
  }
  if (!Array.isArray(author.declaredCheckIds) || author.declaredCheckIds.length === 0) {
    return refuse('PublishedHeadEvidenceIncomplete', 'author_declared_checks_missing');
  }
  if (!Array.isArray(author.commands) || author.commands.length === 0) {
    return refuse('PublishedHeadEvidenceIncomplete', 'author_commands_missing');
  }
  if (!isIsoTimestamp(author.completedAtUtc)) {
    return refuse('PublishedHeadEvidenceIncomplete', 'author_completed_at_missing');
  }

  for (const command of author.commands) {
    const failure = validateCommand(
      command,
      'author_pre_publication',
      bundle.targetCommit,
      bundle.branch,
    );
    if (failure !== null) {
      return failure;
    }
  }

  const uncoveredAuthorCheck = declaredChecksCovered(
    author.declaredCheckIds,
    author.commands,
  );
  if (uncoveredAuthorCheck !== null) {
    return refuse(
      'PublishedHeadEvidenceIncomplete',
      `author_declared_check_omitted:${uncoveredAuthorCheck}`,
    );
  }

  if (authorEvidenceDigest(author) !== author.canonicalAuthorEvidenceDigest) {
    return refuse('PublishedHeadEvidenceMismatch', 'author_digest_mismatch');
  }

  if (bundle.status !== 'complete' || bundle.control === null) {
    // The author phase alone is a structurally valid record of pre-publication work
    // and is never an admissible bundle.
    return refuse('PublishedHeadEvidenceIncomplete', 'control_phase_absent');
  }

  const control = bundle.control as ControlPostPublicationEvidence;

  if (!isRecordObject(control)) {
    return refuse('PublishedHeadEvidenceIncomplete', 'control_phase_absent');
  }
  if (control.phase !== 'control_post_publication') {
    return refuse('PublishedHeadEvidenceIncomplete', 'control_phase_mismatch');
  }
  if (control.targetCommit !== bundle.targetCommit) {
    return refuse('PublishedHeadEvidenceMismatch', 'control_target_mismatch');
  }
  if (control.branch !== bundle.branch) {
    return refuse('PublishedHeadEvidenceMismatch', 'control_branch_mismatch');
  }
  if (control.authorEvidenceDigest !== author.canonicalAuthorEvidenceDigest) {
    return refuse('PublishedHeadEvidenceMismatch', 'control_author_digest_mismatch');
  }
  if (
    !sameStringRecord(
      author.resolvedBases as Readonly<Record<string, string>>,
      control.resolvedBases as Readonly<Record<string, string>>,
    )
  ) {
    return refuse('PublishedHeadEvidenceMismatch', 'resolved_bases_mismatch');
  }
  if (
    author.declaredCheckIds.length !== control.declaredCheckIds.length ||
    author.declaredCheckIds.some(
      (checkId, index) => control.declaredCheckIds[index] !== checkId,
    )
  ) {
    return refuse('PublishedHeadEvidenceMismatch', 'declared_check_set_mismatch');
  }
  if (!Array.isArray(control.commands) || control.commands.length === 0) {
    return refuse('PublishedHeadEvidenceIncomplete', 'control_commands_missing');
  }
  if (!isIsoTimestamp(control.completedAtUtc)) {
    return refuse('PublishedHeadEvidenceIncomplete', 'control_completed_at_missing');
  }
  if (isoToEpochMs(control.completedAtUtc) < isoToEpochMs(author.completedAtUtc)) {
    return refuse('PublishedHeadEvidenceMismatch', 'control_precedes_author');
  }

  for (const command of control.commands) {
    const failure = validateCommand(
      command,
      'control_post_publication',
      bundle.targetCommit,
      bundle.branch,
    );
    if (failure !== null) {
      return failure;
    }
  }

  const proof = control.noLaterContent;
  if (!isRecordObject(proof)) {
    return refuse('PublishedHeadEvidenceIncomplete', 'no_later_content_proof_missing');
  }
  if (proof.targetCommit !== bundle.targetCommit) {
    return refuse('PublishedHeadEvidenceMismatch', 'no_later_content_target_mismatch');
  }
  if (proof.branch !== bundle.branch) {
    return refuse('PublishedHeadEvidenceMismatch', 'no_later_content_branch_mismatch');
  }
  if (typeof proof.remoteRef !== 'string' || proof.remoteRef === '') {
    return refuse('PublishedHeadEvidenceIncomplete', 'no_later_content_remote_missing');
  }
  if (!Number.isSafeInteger(proof.pullRequestNumber) || proof.pullRequestNumber < 1) {
    return refuse(
      'PublishedHeadEvidenceIncomplete',
      'no_later_content_pull_request_missing',
    );
  }
  if (
    !isGitOid(proof.localBranchHeadOid) ||
    !isGitOid(proof.remoteBranchHeadOid) ||
    !isGitOid(proof.pullRequestHeadOid)
  ) {
    return refuse('PublishedHeadEvidenceIncomplete', 'no_later_content_head_not_oid');
  }
  if (
    proof.localBranchHeadOid !== bundle.targetCommit ||
    proof.remoteBranchHeadOid !== bundle.targetCommit ||
    proof.pullRequestHeadOid !== bundle.targetCommit
  ) {
    return refuse('PublishedHeadEvidenceMismatch', 'observed_head_not_target');
  }
  if (
    proof.commitsAfterTarget.localBranch !== 0 ||
    proof.commitsAfterTarget.remoteBranch !== 0 ||
    proof.commitsAfterTarget.pullRequestHead !== 0
  ) {
    return refuse('PublishedHeadEvidenceMismatch', 'later_content_commit_present');
  }
  if (!isIsoTimestamp(proof.observedAtUtc)) {
    return refuse('PublishedHeadEvidenceIncomplete', 'no_later_content_no_timestamp');
  }
  if (
    !Array.isArray(proof.proofCommandEvidenceIds) ||
    proof.proofCommandEvidenceIds.length === 0
  ) {
    return refuse('PublishedHeadEvidenceIncomplete', 'no_later_content_no_proof_commands');
  }
  const proofCommands: PublishedHeadCommandEvidence[] = [];
  for (const evidenceId of proof.proofCommandEvidenceIds) {
    const command = control.commands.find(
      (candidate) => candidate.evidenceId === evidenceId,
    );
    if (command === undefined) {
      return refuse(
        'PublishedHeadEvidenceIncomplete',
        'no_later_content_proof_command_absent',
      );
    }
    proofCommands.push(command);
  }

  const proofFailure = validateProofKinds(proofCommands, proof);
  if (proofFailure !== null) {
    return proofFailure;
  }

  const producerFailure = validatePhaseProducers(author, control);
  if (producerFailure !== null) {
    return producerFailure;
  }

  // The control phase carries its own publication-query commands rather than a rerun
  // of the author's local set: remote head, pull-request head, no-later-content, and
  // exact-head check facts belong only to this phase because they cannot exist before
  // publication. It shares the author's declared check set, which is compared above.

  const checkFailure = validateExactHeadChecks(
    control.exactHeadChecks,
    bundle.targetCommit,
  );
  if (checkFailure !== null) {
    return checkFailure;
  }

  const complete = bundle as CompletePublishedHeadEvidenceBundle;
  const digest = bundleDigest(complete);
  if (digest !== complete.canonicalBundleDigest) {
    return refuse('PublishedHeadEvidenceMismatch', 'bundle_digest_mismatch');
  }

  return { status: 'complete', bundle: complete, bundleDigest: digest };
}

/* ------------------------------------------------------------------------- *
 * Semantic binding to executor-known identities
 * ------------------------------------------------------------------------- */

/**
 * The exact remote ref and resolved-base names and values admission expects. They are
 * derived from executor-known constants and the pinned manifest, never read out of the
 * bundle that is being validated.
 */
export interface PublishedHeadEvidenceExpectations {
  readonly targetCommit: GitOid;
  readonly branch: string;
  readonly remoteRef: string;
  readonly pullRequestNumber: number;
  readonly resolvedBases: Readonly<Record<string, GitOid>>;
}

/**
 * Binds a structurally complete bundle to the identities the executor already knows.
 *
 * An arbitrary non-empty remote ref, an unbound resolved-base label, or a resolved base
 * whose value is not the expected commit is a mismatch. Recomputing the canonical bundle
 * digest over the altered bundle does not help, because these values are compared with
 * executor-known expectations rather than with the bundle's own declarations.
 */
export function bindPublishedHeadEvidence(
  bundle: CompletePublishedHeadEvidenceBundle,
  expectations: PublishedHeadEvidenceExpectations,
): PublishedHeadEvidenceValidation | null {
  if (bundle.targetCommit !== expectations.targetCommit) {
    return refuse('PublishedHeadEvidenceMismatch', 'bundle_target_not_expected_head');
  }
  if (bundle.branch !== expectations.branch) {
    return refuse('PublishedHeadEvidenceMismatch', 'bundle_branch_not_expected_branch');
  }
  if (bundle.control.noLaterContent.remoteRef !== expectations.remoteRef) {
    return refuse('PublishedHeadEvidenceMismatch', 'remote_ref_not_expected_ref');
  }
  if (
    bundle.control.noLaterContent.pullRequestNumber !== expectations.pullRequestNumber
  ) {
    return refuse(
      'PublishedHeadEvidenceMismatch',
      'proof_pull_request_not_expected_pull_request',
    );
  }

  const expectedNames = Object.keys(expectations.resolvedBases).sort();
  for (const phase of [bundle.author.resolvedBases, bundle.control.resolvedBases]) {
    const names = Object.keys(phase).sort();
    if (names.length !== expectedNames.length) {
      return refuse('PublishedHeadEvidenceMismatch', 'resolved_base_names_not_expected');
    }
    for (let index = 0; index < expectedNames.length; index += 1) {
      const name = expectedNames[index] as string;
      if (names[index] !== name) {
        return refuse(
          'PublishedHeadEvidenceMismatch',
          `resolved_base_name_not_expected:${names[index]}`,
        );
      }
      if (phase[name] !== expectations.resolvedBases[name]) {
        return refuse(
          'PublishedHeadEvidenceMismatch',
          `resolved_base_value_not_expected:${name}`,
        );
      }
    }
  }

  for (const command of [...bundle.author.commands, ...bundle.control.commands]) {
    const names = Object.keys(command.resolvedBases).sort();
    if (names.length !== expectedNames.length) {
      return refuse(
        'PublishedHeadEvidenceMismatch',
        'command_resolved_base_names_not_expected',
      );
    }
    for (const name of expectedNames) {
      if (command.resolvedBases[name] !== expectations.resolvedBases[name]) {
        return refuse(
          'PublishedHeadEvidenceMismatch',
          `command_resolved_base_value_not_expected:${name}`,
        );
      }
    }
  }

  return null;
}
