/**
 * The approved bounded retry policy, `merge-retry/v1`.
 *
 * At most three total mutation attempts including the first; deterministic exponential
 * delays of 1, 4, and 16 seconds before eligible subsequent observations; a 120-second
 * total wall-clock budget; and respect for a server `Retry-After`.
 *
 * Only transport interruption, rate limiting, and GitHub 5xx responses are eligible.
 * A conflict, 4xx policy rejection, stale immutable identity, missing check, changed
 * policy, ambiguous state without reconciliation, or verification failure is never
 * retried as a mutation.
 *
 * Retry-After interpretation, stated so a reviewer can check it: the effective delay
 * is never shorter than the deterministic delay and never shorter than the server's
 * request. A server value the 120-second budget cannot accommodate exhausts the policy
 * instead of extending it.
 */

export const MERGE_RETRY_POLICY_ID = 'merge-retry/v1';

/** Maximum total mutation attempts, including the first. */
export const MAX_MUTATION_ATTEMPTS = 3;

/** Deterministic delays before attempts 2 and 3, in milliseconds. */
export const DETERMINISTIC_DELAYS_MS: readonly number[] = Object.freeze([
  1_000, 4_000, 16_000,
]);

/** Total wall-clock budget for the whole retry sequence, in milliseconds. */
export const TOTAL_BUDGET_MS = 120_000;

export type RetryableFailure = 'transport' | 'rate_limit' | 'server_error';

export type RetryDecision =
  | { readonly status: 'retry'; readonly attempt: number; readonly delayMs: number }
  | { readonly status: 'exhausted'; readonly reason: string };

/**
 * Decides whether another mutation attempt is permitted.
 *
 * @param completedAttempts attempts already made, including the first
 * @param elapsedMs         wall-clock milliseconds consumed so far
 * @param retryAfterSeconds server-supplied `Retry-After`, or null
 */
export function nextRetryDecision(
  completedAttempts: number,
  elapsedMs: number,
  retryAfterSeconds: number | null,
): RetryDecision {
  if (completedAttempts >= MAX_MUTATION_ATTEMPTS) {
    return { status: 'exhausted', reason: 'attempt_budget_consumed' };
  }
  if (elapsedMs >= TOTAL_BUDGET_MS) {
    return { status: 'exhausted', reason: 'wall_clock_budget_consumed' };
  }

  const deterministic =
    DETERMINISTIC_DELAYS_MS[completedAttempts - 1] ??
    DETERMINISTIC_DELAYS_MS[DETERMINISTIC_DELAYS_MS.length - 1] ??
    0;

  const serverDelay =
    retryAfterSeconds === null || !Number.isFinite(retryAfterSeconds)
      ? 0
      : Math.max(0, Math.ceil(retryAfterSeconds * 1000));

  const delayMs = Math.max(deterministic, serverDelay);

  if (elapsedMs + delayMs > TOTAL_BUDGET_MS) {
    return { status: 'exhausted', reason: 'delay_exceeds_wall_clock_budget' };
  }

  return { status: 'retry', attempt: completedAttempts + 1, delayMs };
}

/** Only these three failure classes are eligible for a mutation retry. */
export function isRetryableFailure(value: unknown): value is RetryableFailure {
  return value === 'transport' || value === 'rate_limit' || value === 'server_error';
}
