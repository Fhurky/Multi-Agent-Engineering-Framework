/**
 * Canonical JSON serialization and SHA-256 digests.
 *
 * Implements the repository canonical serialization rules recorded in
 * `docs/architecture/runtime/INTERFACE-CONTRACTS.md#canonical-serialization`:
 *
 *   1. UTF-8, no byte order mark.
 *   2. Object keys sorted ascending by UTF-16 code unit.
 *   3. No insignificant whitespace.
 *   4. Numbers in the shortest round-tripping decimal form; no NaN, no infinities.
 *   5. `undefined`-valued properties omitted; explicit `null` retained.
 *   6. LF line endings where a document is line-oriented.
 *
 * `Sha256Hex` values are lowercase hexadecimal SHA-256 digests over that encoding.
 */

import { createHash } from 'node:crypto';
import type { Sha256Hex } from './contracts.ts';

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue | undefined };

/** Thrown only for a defect: a value that canonical JSON cannot represent. */
export class CanonicalJsonError extends Error {}

function encodeString(value: string): string {
  return JSON.stringify(value);
}

function encodeNumber(value: number): string {
  if (!Number.isFinite(value)) {
    throw new CanonicalJsonError(
      'Canonical JSON forbids NaN and infinite numbers.',
    );
  }
  // JSON.stringify already produces the shortest round-tripping decimal form for
  // finite doubles, and normalizes -0 to 0.
  return JSON.stringify(value === 0 ? 0 : value);
}

function encode(value: unknown): string {
  if (value === null) {
    return 'null';
  }

  const kind = typeof value;

  if (kind === 'boolean') {
    return value === true ? 'true' : 'false';
  }
  if (kind === 'number') {
    return encodeNumber(value as number);
  }
  if (kind === 'string') {
    return encodeString(value as string);
  }
  if (kind === 'bigint' || kind === 'function' || kind === 'symbol') {
    throw new CanonicalJsonError(
      `Canonical JSON cannot encode a value of type ${kind}.`,
    );
  }
  if (kind === 'undefined') {
    throw new CanonicalJsonError(
      'Canonical JSON omits undefined properties; it cannot encode a bare undefined.',
    );
  }

  if (Array.isArray(value)) {
    const items = value.map((item) =>
      item === undefined ? 'null' : encode(item),
    );
    return `[${items.join(',')}]`;
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record)
    .filter((key) => record[key] !== undefined)
    .sort();
  const members = keys.map((key) => `${encodeString(key)}:${encode(record[key])}`);
  return `{${members.join(',')}}`;
}

/** Canonical JSON encoding of `value`. */
export function canonicalJson(value: unknown): string {
  return encode(value);
}

/** Lowercase hexadecimal SHA-256 over the canonical JSON encoding of `value`. */
export function sha256Canonical(value: unknown): Sha256Hex {
  return createHash('sha256').update(canonicalJson(value), 'utf8').digest('hex');
}

/** Lowercase hexadecimal SHA-256 over a UTF-8 string. */
export function sha256Utf8(value: string): Sha256Hex {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

/** Lowercase hexadecimal SHA-256 over raw bytes. */
export function sha256Bytes(bytes: Uint8Array): Sha256Hex {
  return createHash('sha256').update(bytes).digest('hex');
}

/**
 * UTF-8 bytes of the canonical JSON encoding of `value`. This is the exact byte string
 * an attestor signs, so verification never re-serializes through a different encoder.
 */
export function canonicalBytes(value: unknown): Uint8Array {
  return new Uint8Array(Buffer.from(canonicalJson(value), 'utf8'));
}

const BASE64_ALPHABET = /^[A-Za-z0-9+/]*={0,2}$/;

/** True when `value` is a non-empty, correctly padded standard base64 string. */
export function isBase64(value: unknown): boolean {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length % 4 === 0 &&
    BASE64_ALPHABET.test(value)
  );
}

/**
 * Strict base64 decoding. A malformed, non-canonical, or non-base64 value returns
 * `null` rather than a silently truncated buffer, so a decode failure is always
 * distinguishable from a valid empty result.
 */
export function decodeBase64(value: unknown): Uint8Array | null {
  if (!isBase64(value)) {
    return null;
  }
  const decoded = Buffer.from(value as string, 'base64');
  if (decoded.toString('base64') !== value) {
    return null;
  }
  return new Uint8Array(decoded);
}

/**
 * Returns a shallow copy of `record` with exactly the one named top-level property
 * absent. The property is removed rather than set to `null`, an empty string, or a
 * placeholder, and no other property is touched. This is the exact projection the
 * `published-head-evidence/v2` self-identifying digests require.
 */
export function omitTopLevel<T extends object, K extends keyof T & string>(
  record: T,
  property: K,
): Omit<T, K> {
  const copy: Record<string, unknown> = {};
  for (const key of Object.keys(record)) {
    if (key === property) {
      continue;
    }
    copy[key] = (record as Record<string, unknown>)[key];
  }
  return copy as Omit<T, K>;
}

/**
 * Computes a self-identifying digest by omitting exactly one top-level property and
 * hashing the canonical JSON of the remainder.
 */
export function selfDigest<T extends object, K extends keyof T & string>(
  record: T,
  property: K,
): Sha256Hex {
  return sha256Canonical(omitTopLevel(record, property));
}

const HEX_64 = /^[0-9a-f]{64}$/;
const OID_40 = /^[0-9a-f]{40}$/;

/** True when `value` is a lowercase 64-character hexadecimal SHA-256 digest. */
export function isSha256Hex(value: unknown): boolean {
  return typeof value === 'string' && HEX_64.test(value);
}

/**
 * True when `value` is a full 40-character lowercase hexadecimal Git object id.
 * A branch name, tag, short SHA, or any other mutable identity is rejected here.
 */
export function isGitOid(value: unknown): boolean {
  return typeof value === 'string' && OID_40.test(value);
}

/** True when `value` parses as an RFC 3339 UTC timestamp. */
export function isIsoTimestamp(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(value)) {
    return false;
  }
  return Number.isFinite(Date.parse(value));
}

/** Milliseconds since the epoch for an RFC 3339 UTC timestamp. */
export function isoToEpochMs(value: string): number {
  return Date.parse(value);
}
