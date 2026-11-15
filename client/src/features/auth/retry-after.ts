import { ApiError } from "@/lib/api";

interface FailedRequest {
  error: unknown;
  /** When the request was sent (TanStack Query's `submittedAt`), epoch ms. */
  submittedAt: number;
}

/**
 * When a `429` (`rate_limited` or `pin_locked`) lets the user try again, in
 * epoch ms, derived from the failed request itself so no copy is kept in state.
 * Undefined for any other outcome.
 */
export function retryAt({ error, submittedAt }: FailedRequest): number | undefined {
  if (!(error instanceof ApiError) || error.status !== 429) return undefined;
  const seconds = error.retryAfterSeconds;
  return seconds === undefined ? undefined : submittedAt + seconds * 1000;
}
