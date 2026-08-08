/**
 * The single pull-request merge port.
 *
 * This is structurally the only external mutation the module can express. There is no
 * generic HTTP operation, no Git ref update, no `git push`, no `ALLOW_MAIN_PUSH`, no
 * force, no hook bypass, no administrator override, no required-check mutation, no
 * branch-protection or ruleset mutation, no gate mutation, no task-ownership mutation,
 * and no lock-release mechanism.
 *
 * The base branch and merge method are literal types bound at the request constructor,
 * so no caller can retarget the port at another ref or method. The release executor's
 * permission to merge into `main` therefore does not collide with the direct-push
 * prohibition: it invokes an ordinary protected pull-request merge, and branch rules
 * and required checks decide the server-side result.
 */

import {
  RELEASE_BASE_BRANCH,
  RELEASE_MERGE_METHOD,
} from './contracts.ts';
import type {
  ReleaseMergePortResult,
  ReleaseMergeRequest,
  ReleaseMergePlan,
  ReleasePullRequestMergePort,
} from './contracts.ts';

/**
 * The complete operation surface of the merge port. The negative-capability tests
 * enumerate this list rather than sampling it.
 */
export const RELEASE_MERGE_PORT_OPERATIONS: readonly string[] = Object.freeze([
  'mergeIntegrationPullRequestIntoMain',
]);

/**
 * The only constructor of a merge request. It derives every field from an admitted
 * plan, so a request cannot exist without one.
 */
export function buildReleaseMergeRequest(
  plan: ReleaseMergePlan,
): ReleaseMergeRequest {
  return {
    pullRequestNumber: plan.pullRequestNumber,
    expectedHeadOid: plan.headOid,
    baseBranch: RELEASE_BASE_BRANCH,
    mergeMethod: RELEASE_MERGE_METHOD,
    idempotencyKey: plan.idempotencyKey,
  };
}

/**
 * The default port for a dormant executor.
 *
 * The executor is not activated, the human-controlled control plane is not
 * provisioned, and no credential exists. This implementation performs no input or
 * output of any kind and returns `unsupported` for every call, which the execution
 * phase maps to `UnsupportedOperation`.
 */
export class DormantReleaseMergePort implements ReleasePullRequestMergePort {
  async mergeIntegrationPullRequestIntoMain(
    _request: ReleaseMergeRequest,
  ): Promise<ReleaseMergePortResult> {
    return { outcome: 'unsupported' };
  }
}
