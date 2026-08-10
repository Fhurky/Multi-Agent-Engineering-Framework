/** Authenticated, complete, immutable base-to-head diff validation. */

import type {
  AuthenticatedImmutableDiff,
  AuthenticatedImmutableDiffEntry,
  AuthenticatedImmutableDiffResolution,
  GitOid,
  ImmutableDiffArtifactRef,
} from './contracts.ts';
import {
  canonicalJson,
  hasControlCharacters,
  isGitOid,
  isSha256Hex,
  selfDigest,
  sha256Canonical,
  sha256Utf8,
} from './canonical-json.ts';

export interface ImmutableDiffExpectation {
  readonly repositoryId: string;
  readonly baseOid: GitOid;
  readonly headOid: GitOid;
}

function artifactIdentityProjection(source: ImmutableDiffArtifactRef): unknown {
  return {
    kind: source.kind,
    commit: source.commit,
    path: source.path,
    digest: source.digest,
    producedByExecutor: source.producedByExecutor,
    producer: source.producer,
    repositoryId: source.repositoryId,
    baseOid: source.baseOid,
    headOid: source.headOid,
    canonicalBytesDigest: source.canonicalBytesDigest,
  };
}

export function immutableDiffArtifactIdentityDigest(
  source: ImmutableDiffArtifactRef,
): string {
  return sha256Canonical(artifactIdentityProjection(source));
}

export function validateImmutableDiffResolution(
  value: unknown,
  source: ImmutableDiffArtifactRef,
  expected: ImmutableDiffExpectation,
): ImmutableDiffValidation {
  if (!isRecordObject(value)) {
    return { status: 'invalid', reason: 'immutable_diff_object_unresolved' };
  }
  const resolution = value as unknown as AuthenticatedImmutableDiffResolution;
  if (
    source.kind !== 'authenticated-immutable-diff' ||
    source.repositoryId !== expected.repositoryId ||
    source.baseOid !== expected.baseOid || source.headOid !== expected.headOid ||
    !isGitOid(source.commit) || typeof source.path !== 'string' || source.path.length === 0 ||
    !isSha256Hex(source.digest) || !isSha256Hex(source.canonicalBytesDigest) ||
    source.producedByExecutor !== false ||
    source.producer.principalType === 'merge_executor' ||
    !isGitOid(source.producer.authorizationCommit) ||
    source.artifactIdentityDigest !== immutableDiffArtifactIdentityDigest(source)
  ) {
    return { status: 'invalid', reason: 'immutable_diff_source_identity_invalid' };
  }
  if (
    resolution.producerAuthorized !== true ||
    !isGitOid(resolution.authorizationEvidenceCommit) ||
    canonicalJson(resolution.source) !== canonicalJson(source) ||
    canonicalJson(resolution.producer) !== canonicalJson(source.producer) ||
    typeof resolution.canonicalBytes !== 'string' ||
    resolution.canonicalBytes !== canonicalJson(resolution.diff) ||
    sha256Utf8(resolution.canonicalBytes) !== source.canonicalBytesDigest ||
    sha256Canonical(resolution.diff) !== source.digest
  ) {
    return { status: 'invalid', reason: 'immutable_diff_object_authentication_invalid' };
  }
  return validateAuthenticatedImmutableDiff(resolution.diff, expected);
}

export type ImmutableDiffValidation =
  | {
      readonly status: 'valid';
      readonly diff: AuthenticatedImmutableDiff;
      readonly changedPaths: readonly string[];
    }
  | { readonly status: 'invalid'; readonly reason: string };

function isRecordObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function repositoryPathValid(value: unknown): value is string {
  if (
    typeof value !== 'string' || value.length === 0 ||
    hasControlCharacters(value) || value.includes('\\') ||
    value.startsWith('/') || value.endsWith('/')
  ) {
    return false;
  }
  const segments = value.split('/');
  return segments.every(
    (segment) => segment.length > 0 && segment !== '.' && segment !== '..',
  );
}

function entryDefect(value: unknown, expectedOrdinal: number): string | null {
  if (!isRecordObject(value)) {
    return 'entry_not_an_object';
  }
  const entry = value as unknown as AuthenticatedImmutableDiffEntry;
  if (entry.ordinal !== expectedOrdinal) {
    return 'entry_ordinal_not_contiguous';
  }
  const oldPathValid = entry.oldPath === null || repositoryPathValid(entry.oldPath);
  const newPathValid = entry.newPath === null || repositoryPathValid(entry.newPath);
  if (!oldPathValid || !newPathValid) {
    return 'entry_path_invalid';
  }
  const oldBlobValid = entry.oldBlobOid === null || isGitOid(entry.oldBlobOid);
  const newBlobValid = entry.newBlobOid === null || isGitOid(entry.newBlobOid);
  if (!oldBlobValid || !newBlobValid) {
    return 'entry_blob_oid_invalid';
  }

  switch (entry.changeKind) {
    case 'added':
      return entry.oldPath === null && entry.oldBlobOid === null &&
        entry.newPath !== null && entry.newBlobOid !== null
        ? null
        : 'added_transition_ambiguous';
    case 'deleted':
      return entry.oldPath !== null && entry.oldBlobOid !== null &&
        entry.newPath === null && entry.newBlobOid === null
        ? null
        : 'deleted_transition_ambiguous';
    case 'modified':
      return entry.oldPath !== null && entry.oldPath === entry.newPath &&
        entry.oldBlobOid !== null && entry.newBlobOid !== null
        ? null
        : 'modified_transition_ambiguous';
    case 'renamed':
      return entry.oldPath !== null && entry.newPath !== null &&
        entry.oldPath !== entry.newPath && entry.oldBlobOid !== null &&
        entry.newBlobOid !== null
        ? null
        : 'renamed_transition_ambiguous';
    default:
      return 'entry_change_kind_unknown';
  }
}

/** Exact UTF-8 text whose bytes are authenticated for the entry universe. */
export function canonicalImmutableDiffEntriesBytes(
  entries: readonly AuthenticatedImmutableDiffEntry[],
): string {
  return canonicalJson({
    schema: 'authenticated-immutable-diff-entries/v1',
    entries,
  });
}

export function canonicalImmutableDiffEntriesDigest(
  entries: readonly AuthenticatedImmutableDiffEntry[],
): string {
  return sha256Utf8(canonicalImmutableDiffEntriesBytes(entries));
}

export function validateAuthenticatedImmutableDiff(
  value: unknown,
  expected: ImmutableDiffExpectation,
): ImmutableDiffValidation {
  if (!isRecordObject(value)) {
    return { status: 'invalid', reason: 'immutable_diff_absent' };
  }
  const diff = value as unknown as AuthenticatedImmutableDiff;
  if (
    diff.schema !== 'authenticated-immutable-diff/v2' ||
    diff.repositoryId !== expected.repositoryId ||
    diff.baseOid !== expected.baseOid || diff.headOid !== expected.headOid ||
    diff.comparison !== 'base_to_head'
  ) {
    return { status: 'invalid', reason: 'immutable_diff_subject_mismatch' };
  }
  if (
    diff.complete !== true || diff.renameDetection !== 'complete' ||
    diff.deletionDetection !== 'complete'
  ) {
    return { status: 'invalid', reason: 'immutable_diff_incomplete' };
  }
  if (!Array.isArray(diff.entries) || !Array.isArray(diff.pages)) {
    return { status: 'invalid', reason: 'immutable_diff_collections_invalid' };
  }

  const occupiedPaths = new Set<string>();
  for (let index = 0; index < diff.entries.length; index += 1) {
    const entry = diff.entries[index];
    const defect = entryDefect(entry, index);
    if (defect !== null) {
      return { status: 'invalid', reason: defect };
    }
    for (const path of new Set([entry!.oldPath, entry!.newPath])) {
      if (path === null) {
        continue;
      }
      if (occupiedPaths.has(path)) {
        return { status: 'invalid', reason: 'immutable_diff_path_ambiguous' };
      }
      occupiedPaths.add(path);
    }
  }

  if (diff.pages.length === 0) {
    return { status: 'invalid', reason: 'immutable_diff_pagination_absent' };
  }
  let nextEntry = 0;
  for (let index = 0; index < diff.pages.length; index += 1) {
    const page = diff.pages[index];
    if (
      !isRecordObject(page) || page.page !== index + 1 ||
      page.pageCount !== diff.pages.length || page.entryStart !== nextEntry ||
      !Number.isSafeInteger(page.entryCount) || page.entryCount < 0 ||
      (page.entryCount === 0 && !(diff.entries.length === 0 && diff.pages.length === 1)) ||
      page.entryStart + page.entryCount > diff.entries.length ||
      !isSha256Hex(page.entriesDigest) || !isSha256Hex(page.responseDigest)
    ) {
      return { status: 'invalid', reason: 'immutable_diff_pagination_invalid' };
    }
    const pageEntries = diff.entries.slice(
      page.entryStart,
      page.entryStart + page.entryCount,
    );
    if (
      page.entriesDigest !== sha256Canonical(pageEntries) ||
      page.responseDigest !== selfDigest(page, 'responseDigest')
    ) {
      return { status: 'invalid', reason: 'immutable_diff_page_digest_invalid' };
    }
    nextEntry += page.entryCount;
  }
  if (nextEntry !== diff.entries.length) {
    return { status: 'invalid', reason: 'immutable_diff_pagination_incomplete' };
  }

  const expectedBytes = canonicalImmutableDiffEntriesBytes(diff.entries);
  if (
    diff.canonicalEntriesBytes !== expectedBytes ||
    diff.canonicalEntriesDigest !== sha256Utf8(expectedBytes)
  ) {
    return { status: 'invalid', reason: 'immutable_diff_canonical_bytes_mismatch' };
  }
  return {
    status: 'valid',
    diff,
    changedPaths: [...occupiedPaths].sort(),
  };
}
