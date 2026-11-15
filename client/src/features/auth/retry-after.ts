import { ApiError } from "@/lib/api";

/**
 * When a locked-out profile can try again, in epoch ms on this device's clock:
 * the server's relative `lockedForSeconds` counted from when the picker data
 * arrived (`dataUpdatedAt`), so a wrong device clock cannot shift it.
 */
export function lockEnd(
  profile: { lockedForSeconds: number | null },
  receivedAt: number,
): number | undefined {
  return profile.lockedForSeconds === null
    ? undefined
    : receivedAt + profile.lockedForSeconds * 1000;
}

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
