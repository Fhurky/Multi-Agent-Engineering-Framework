/** Test-only adapter that supplies the offline authenticated authority fixture. */
export * from '../../admission.ts';

import { admit as productionAdmit } from '../../admission.ts';
import type {
  ReleaseAdmissionInput,
  ReleaseAdmissionResult,
  ReleaseAuthorityPort,
} from '../../contracts.ts';

export function admit(input: ReleaseAdmissionInput): ReleaseAdmissionResult {
  const authority =
    typeof input === 'object' && input !== null
      ? (input as ReleaseAdmissionInput & {
          readonly authority?: ReleaseAuthorityPort | null;
        }).authority ?? null
      : null;
  return productionAdmit(input, authority);
}
