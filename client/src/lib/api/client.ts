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

/** The shape openapi-fetch resolves to: success results carry no `error` key. */
type FetchResult<T> =
  | { data: T; error?: never; response: Response }
  | { data?: never; error: unknown; response: Response };

/**
 * Resolves to the response data, or throws an {@link ApiError} for any
 * non-2xx response so TanStack Query treats it as a failed query.
 * Network failures reject with the underlying fetch error.
 */
export async function unwrap<T>(request: Promise<FetchResult<T>>): Promise<T> {
  const result = await request;
  if ("error" in result || !result.response.ok) {
    throw new ApiError(result.response.status, result.error);
  }
  return result.data;
}
