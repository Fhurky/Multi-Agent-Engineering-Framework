/**
 * Shared nominal-capability registry.
 *
 * This file is an internal package subpath. The release-control package does not
 * export it. Only the separately deployed runtime-host package may call `seal`; the
 * application side imports the consumer-only facade in `composition-capability.ts`.
 */

import type {
  ImmutableAuthorityPortIdentity,
  ImmutableMergePortIdentity,
  ImmutableReleaseCapabilityBinding,
  ReleaseAuthorityPort,
  ReleaseExecutorCapability,
  ReleasePullRequestMergePort,
} from './contracts.ts';
import { hasControlCharacters, isSha256Hex } from './canonical-json.ts';

export interface ExternallyProvisionedReleaseExecutorPorts {
  readonly authority: ReleaseAuthorityPort;
  readonly mergePort: ReleasePullRequestMergePort;
  readonly authorityIdentity: ImmutableAuthorityPortIdentity;
  readonly mergePortIdentity: ImmutableMergePortIdentity;
  readonly capabilityBinding: ImmutableReleaseCapabilityBinding;
}

export interface ReleaseExecutorCapabilityRecord {
  readonly authority: ReleaseAuthorityPort;
  readonly mergePort: ReleasePullRequestMergePort;
  readonly authorityIdentity: ImmutableAuthorityPortIdentity;
  readonly mergePortIdentity: ImmutableMergePortIdentity;
  readonly capabilityBinding: ImmutableReleaseCapabilityBinding;
}

const sealedCapabilities = new WeakMap<object, ReleaseExecutorCapabilityRecord>();

function identityTextValid(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && !hasControlCharacters(value);
}

/**
 * Host-only seal. The deployable application package neither exports this subpath nor
 * contains the runtime-host issuer. It deliberately accepts one already provisioned
 * host record and no caller authenticator or callback.
 */
export function sealExternallyProvisionedReleaseExecutorCapability(
  provisioned: ExternallyProvisionedReleaseExecutorPorts,
): ReleaseExecutorCapability | null {
  const {
    authority,
    mergePort,
    authorityIdentity,
    mergePortIdentity,
    capabilityBinding,
  } = provisioned;
  if (
    typeof authority !== 'object' || authority === null ||
    typeof mergePort !== 'object' || mergePort === null ||
    !identityTextValid(authorityIdentity.resolverId) ||
    !isSha256Hex(authorityIdentity.resolverIdentityDigest) ||
    !identityTextValid(mergePortIdentity.brokerId) ||
    !isSha256Hex(mergePortIdentity.portIdentityDigest) ||
    !identityTextValid(capabilityBinding.compositionRootId) ||
    !isSha256Hex(capabilityBinding.bindingDigest)
  ) {
    return null;
  }

  const capability = Object.freeze({
    schema: 'release-executor-capability/v2' as const,
  }) as ReleaseExecutorCapability;
  sealedCapabilities.set(capability, Object.freeze({
    authority,
    mergePort,
    authorityIdentity: Object.freeze({ ...authorityIdentity }),
    mergePortIdentity: Object.freeze({ ...mergePortIdentity }),
    capabilityBinding: Object.freeze({ ...capabilityBinding }),
  }));
  return capability;
}

export function resolveSealedReleaseExecutorCapability(
  capability: ReleaseExecutorCapability | null | undefined,
): ReleaseExecutorCapabilityRecord | null {
  if (
    typeof capability !== 'object' || capability === null ||
    capability.schema !== 'release-executor-capability/v2' ||
    !Object.isFrozen(capability)
  ) {
    return null;
  }
  return sealedCapabilities.get(capability) ?? null;
}
