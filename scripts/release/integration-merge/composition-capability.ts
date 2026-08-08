/**
 * Consumer-only facade for an externally issued release-executor capability.
 *
 * Release-control code can resolve a capability handed to it by the separately
 * deployed runtime host. It cannot import an issuer through the application package,
 * supply an authenticator, or bind authority/merge objects. Seal ownership lives in
 * `runtime-host/`, which is excluded from the application package and import graph.
 */

import type { ReleaseExecutorCapability } from './contracts.ts';
import {
  resolveSealedReleaseExecutorCapability,
} from './capability-registry.ts';
import type {
  ReleaseExecutorCapabilityRecord,
} from './capability-registry.ts';

export type { ReleaseExecutorCapabilityRecord } from './capability-registry.ts';

/** Internal verifier used by activation and execution; structural objects fail. */
export function resolveReleaseExecutorCapability(
  capability: ReleaseExecutorCapability | null | undefined,
): ReleaseExecutorCapabilityRecord | null {
  return resolveSealedReleaseExecutorCapability(capability);
}
