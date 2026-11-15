import createClient from "openapi-fetch";
import { ApiError } from "./error";
import type { paths } from "./schema";

/**
 * Typed client for the Cadence API. The base URL is relative so the browser
 * always talks to its own origin (Vite proxies `/api` in dev), and
 * `credentials: "include"` sends the httpOnly session cookies.
 */
export const api = createClient<paths>({
  baseUrl: "/api",
  credentials: "include",
});

/** What openapi-fetch resolves to: success results have no `error` key. */
type FetchResult =
  | { data: unknown; error?: never; response: Response }
  | { data?: never; error: unknown; response: Response };

type Success<R extends FetchResult> = Extract<R, { error?: never }>;

function isSuccess<R extends FetchResult>(result: R): result is Success<R> {
  return !("error" in result) && result.response.ok;
}

/**
 * Resolves to the response data, or throws an {@link ApiError} for any
 * non-2xx response so TanStack Query treats it as a failed query.
 * Network failures reject with the underlying fetch error.
 */
export async function unwrap<R extends FetchResult>(
  request: Promise<R>,
): Promise<Success<R>["data"]> {
  const result = await request;
  if (isSuccess(result)) return result.data;
  throw new ApiError(result.response.status, result.error);
}
