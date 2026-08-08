/**
 * Deployment composition boundary for the release executor.
 *
 * Admission and execution never accept a raw authority resolver, merge client, or
 * caller-supplied identity label. A separately controlled composition root
 * authenticates the two concrete object references, binds them together, and seals an
 * opaque capability in this module's private WeakMap. The public executor entry point
 * deliberately does not export the root constructor.
 */

import type {
  ImmutableAuthorityPortIdentity,
  ImmutableMergePortIdentity,
  ImmutableReleaseCapabilityBinding,
  ReleaseAuthorityPort,
  ReleaseExecutorCapability,
  ReleasePullRequestMergePort,
} from './contracts.ts';
import { canonicalJson, hasControlCharacters, isSha256Hex } from './canonical-json.ts';

export interface IndependentlyAuthenticatedReleasePorts {
  readonly authorityIdentity: ImmutableAuthorityPortIdentity;
  readonly mergePortIdentity: ImmutableMergePortIdentity;
  readonly capabilityBinding: ImmutableReleaseCapabilityBinding;
}

/**
 * Implemented by the separately controlled deployment composition root. Its checks
 * must be based on provisioned object identity/certificates, never on `identity`
 * properties returned by either candidate port.
 */
export interface ReleasePortAuthenticator {
  authenticateAuthorityPort(
    authority: ReleaseAuthorityPort,
  ): ImmutableAuthorityPortIdentity | null;
  authenticateMergePort(
    mergePort: ReleasePullRequestMergePort,
  ): ImmutableMergePortIdentity | null;
  authenticateComposition(
    authority: ReleaseAuthorityPort,
    mergePort: ReleasePullRequestMergePort,
    authorityIdentity: ImmutableAuthorityPortIdentity,
    mergePortIdentity: ImmutableMergePortIdentity,
  ): ImmutableReleaseCapabilityBinding | null;
}

export interface ReleaseExecutorCompositionRoot {
  bind(
    authority: ReleaseAuthorityPort,
    mergePort: ReleasePullRequestMergePort,
  ): ReleaseExecutorCapability | null;
}

export interface ReleaseExecutorCapabilityRecord
  extends IndependentlyAuthenticatedReleasePorts {
  readonly authority: ReleaseAuthorityPort;
  readonly mergePort: ReleasePullRequestMergePort;
}

const sealedCapabilities = new WeakMap<object, ReleaseExecutorCapabilityRecord>();

function authorityIdentityValid(value: ImmutableAuthorityPortIdentity): boolean {
  return (
    typeof value.resolverId === 'string' &&
    value.resolverId.length > 0 &&
    !hasControlCharacters(value.resolverId) &&
    isSha256Hex(value.resolverIdentityDigest)
  );
}

function mergeIdentityValid(value: ImmutableMergePortIdentity): boolean {
  return (
    typeof value.brokerId === 'string' &&
    value.brokerId.length > 0 &&
    !hasControlCharacters(value.brokerId) &&
    isSha256Hex(value.portIdentityDigest)
  );
}

function bindingValid(value: ImmutableReleaseCapabilityBinding): boolean {
  return (
    typeof value.compositionRootId === 'string' &&
    value.compositionRootId.length > 0 &&
    !hasControlCharacters(value.compositionRootId) &&
    isSha256Hex(value.bindingDigest)
  );
}

/**
 * Deployment-only root constructor. It is intentionally absent from `index.ts`; the
 * release-control caller receives only the returned nominal capability.
 */
export function createReleaseExecutorCompositionRoot(
  authenticator: ReleasePortAuthenticator,
): ReleaseExecutorCompositionRoot {
  const root = {
    bind(
      authority: ReleaseAuthorityPort,
      mergePort: ReleasePullRequestMergePort,
    ): ReleaseExecutorCapability | null {
      if (
        typeof authority !== 'object' || authority === null ||
        typeof mergePort !== 'object' || mergePort === null
      ) {
        return null;
      }

      const authorityIdentity = authenticator.authenticateAuthorityPort(authority);
      const mergePortIdentity = authenticator.authenticateMergePort(mergePort);
      if (
        authorityIdentity === null ||
        mergePortIdentity === null ||
        !authorityIdentityValid(authorityIdentity) ||
        !mergeIdentityValid(mergePortIdentity)
      ) {
        return null;
      }

      const capabilityBinding = authenticator.authenticateComposition(
        authority,
        mergePort,
        authorityIdentity,
        mergePortIdentity,
      );
      if (capabilityBinding === null || !bindingValid(capabilityBinding)) {
        return null;
      }

      // Reject an authenticator that changes either independently derived identity
      // while composing the pair. Equality here binds the exact independently
      // authenticated values, not properties read from the candidate ports.
      const reboundAuthority = authenticator.authenticateAuthorityPort(authority);
      const reboundMerge = authenticator.authenticateMergePort(mergePort);
      if (
        reboundAuthority === null ||
        reboundMerge === null ||
        canonicalJson(reboundAuthority) !== canonicalJson(authorityIdentity) ||
        canonicalJson(reboundMerge) !== canonicalJson(mergePortIdentity)
      ) {
        return null;
      }

      const capability = Object.freeze({
        schema: 'release-executor-capability/v1' as const,
      }) as ReleaseExecutorCapability;
      sealedCapabilities.set(capability, Object.freeze({
        authority,
        mergePort,
        authorityIdentity: Object.freeze({ ...authorityIdentity }),
        mergePortIdentity: Object.freeze({ ...mergePortIdentity }),
        capabilityBinding: Object.freeze({ ...capabilityBinding }),
      }));
      return capability;
    },
  };
  return Object.freeze(root);
}

/** Internal verifier used by activation and execution; structural objects fail. */
export function resolveReleaseExecutorCapability(
  capability: ReleaseExecutorCapability | null | undefined,
): ReleaseExecutorCapabilityRecord | null {
  if (
    typeof capability !== 'object' ||
    capability === null ||
    capability.schema !== 'release-executor-capability/v1' ||
    !Object.isFrozen(capability)
  ) {
    return null;
  }
  return sealedCapabilities.get(capability) ?? null;
}
