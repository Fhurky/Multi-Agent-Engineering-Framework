/** Test-only adapter that supplies the offline authenticated authority fixture. */
export * from '../../admission.ts';

import { admit as productionAdmit } from '../../admission.ts';
import { resolveReleaseExecutorCapability } from '../../composition-capability.ts';
import type {
  ReleaseAdmissionInput,
  ReleaseAdmissionResult,
  ReleaseAuthorityPort,
  ReleaseExecutorCapability,
} from '../../contracts.ts';

export function admit(input: ReleaseAdmissionInput): ReleaseAdmissionResult {
  const fixture =
    typeof input === 'object' && input !== null
      ? (input as ReleaseAdmissionInput & {
          readonly authority?: ReleaseAuthorityPort | null;
          readonly capability?: ReleaseExecutorCapability | null;
        })
      : null;
  const capability = fixture?.capability ?? null;
  const capabilityRecord = resolveReleaseExecutorCapability(capability);
  // Existing adversarial fixtures replace the structural authority field. Refuse that
  // mismatch instead of silently continuing with the capability's authenticated port.
  const suppliedAuthority = fixture?.authority ?? null;
  return productionAdmit(
    input,
    capabilityRecord !== null && suppliedAuthority === capabilityRecord.authority
      ? capability
      : null,
  );
}
