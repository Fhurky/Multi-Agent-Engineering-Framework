/**
 * Separately deployed release-executor runtime host.
 *
 * This package is the sole composition/seal owner. It is not exported by, included in,
 * or importable through the release-control application package. The host receives an
 * already independently provisioned record from its control plane; application code
 * never supplies an authenticator, resolver, concrete merge object, or binding.
 */

import {
  sealExternallyProvisionedReleaseExecutorCapability,
} from '../capability-registry.ts';
import type {
  ExternallyProvisionedReleaseExecutorPorts,
} from '../capability-registry.ts';
import type { ReleaseExecutorCapability } from '../contracts.ts';

export interface ReleaseExecutorRuntimeHost {
  issueCapability(): ReleaseExecutorCapability;
}

/** Called only by the independently controlled host bootstrap. */
export function startReleaseExecutorRuntimeHost(
  provisioned: ExternallyProvisionedReleaseExecutorPorts,
): ReleaseExecutorRuntimeHost {
  const capability = sealExternallyProvisionedReleaseExecutorCapability(provisioned);
  if (capability === null) {
    throw new Error('independently provisioned release-executor ports are invalid');
  }
  let issued = false;
  return Object.freeze({
    issueCapability(): ReleaseExecutorCapability {
      if (issued) {
        throw new Error('release-executor runtime host capability already issued');
      }
      issued = true;
      return capability;
    },
  });
}
