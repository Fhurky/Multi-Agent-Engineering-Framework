/**
 * Required-check evaluation for the exact immutable release head.
 *
 * Every required GitHub check must exist on that head, have conclusion exactly
 * `success`, and be produced by the configured GitHub App identity. `neutral`,
 * `skipped`, `timed_out`, `cancelled`, missing, stale, and wrong-publisher results
 * never pass. A complete published-head evidence bundle that truthfully records checks
 * as absent does not make them pass.
 */

import type {
  MergeRefusalCode,
  GitOid,
  ReleaseRequiredCheckObservation,
} from './contracts.ts';

export type RequiredCheckEvaluation =
  | { readonly status: 'all_successful'; readonly matchedContexts: number }
  | {
      readonly status: 'refused';
      readonly code: MergeRefusalCode;
      readonly context: string | null;
      readonly reason: string;
    };

function refuse(
  code: MergeRefusalCode,
  context: string | null,
  reason: string,
): RequiredCheckEvaluation {
  return { status: 'refused', code, context, reason };
}

/**
 * Evaluates the observation against its declared required contexts.
 *
 * @param observation observed check runs for one immutable commit
 * @param targetCommit the plan's head OID; a stale observation refuses
 */
export function evaluateRequiredChecks(
  observation: ReleaseRequiredCheckObservation,
  targetCommit: GitOid,
): RequiredCheckEvaluation {
  if (observation === null || typeof observation !== 'object') {
    return refuse('RequiredCheckMissing', null, 'observation_absent');
  }
  if (observation.targetCommit !== targetCommit) {
    // A check result read for another commit is stale, never transferable.
    return refuse('RequiredCheckMissing', null, 'observation_target_mismatch');
  }
  if (
    !Array.isArray(observation.requiredContexts) ||
    observation.requiredContexts.length === 0
  ) {
    // Fail closed: an empty required set is a configuration defect, not a pass.
    return refuse('RequiredCheckMissing', null, 'no_required_contexts_declared');
  }
  if (!Array.isArray(observation.observed) || observation.observed.length === 0) {
    // Absent continuous integration is not passing continuous integration.
    return refuse('RequiredCheckMissing', null, 'zero_check_runs_on_target');
  }

  let matched = 0;

  for (const requirement of observation.requiredContexts) {
    const runs = observation.observed.filter(
      (candidate) => candidate.name === requirement.name,
    );

    if (runs.length === 0) {
      return refuse('RequiredCheckMissing', requirement.name, 'context_absent');
    }

    const wrongPublisher = runs.filter(
      (candidate) => candidate.appId !== requirement.expectedAppId,
    );
    if (wrongPublisher.length > 0) {
      return refuse(
        'RequiredCheckPublisherMismatch',
        requirement.name,
        'context_reported_by_unexpected_app',
      );
    }

    const notSuccessful = runs.filter(
      (candidate) =>
        candidate.status !== 'completed' || candidate.conclusion !== 'success',
    );
    if (notSuccessful.length > 0) {
      const observed = notSuccessful
        .map((candidate) =>
          candidate.status !== 'completed'
            ? candidate.status
            : (candidate.conclusion ?? 'none'),
        )
        .join(',');
      return refuse(
        'RequiredCheckNotSuccessful',
        requirement.name,
        `context_not_successful:${observed}`,
      );
    }

    matched += 1;
  }

  return { status: 'all_successful', matchedContexts: matched };
}
