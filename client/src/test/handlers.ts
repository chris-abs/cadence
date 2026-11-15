import { http, HttpResponse, type PathParams } from "msw";
import type { components, paths } from "@/lib/api";
import { apiUrl } from "./api-url";
import { identityHandlers } from "./mock-api";

export { apiUrl };

type Schemas = components["schemas"];
type ErrorBody = Schemas["Error"];

/** Ready-made responses; tests swap them in with `server.use(...)`. */
export const health = {
  ok: () =>
    http.get<PathParams, never, Schemas["Health"]>(apiUrl("/healthz"), () =>
      HttpResponse.json({ status: "ok" }),
    ),
  databaseDown: () =>
    http.get<PathParams, never, ErrorBody>(apiUrl("/healthz"), () =>
      HttpResponse.json(
        { error: { code: "database_unavailable", message: "Database unavailable" } },
        { status: 503 },
      ),
    ),
  networkError: () => http.get(apiUrl("/healthz"), () => HttpResponse.error()),
};

type Method = "get" | "post" | "put" | "delete";

/** Any contract endpoint answering with a contract error. */
export function apiError(
  method: Method,
  path: keyof paths,
  status: number,
  error: ErrorBody["error"],
) {
  const headers: Record<string, string> = {};
  if (error.retryAfterSeconds) headers["Retry-After"] = String(error.retryAfterSeconds);
  return http[method]<PathParams, never, ErrorBody>(apiUrl(path), () =>
    HttpResponse.json({ error }, { status, headers }),
  );
}

/** Error responses for the identity endpoints; the happy paths come from the stateful mock. */
export const identity = {
  loginRateLimited: (retryAfterSeconds: number) =>
    apiError("post", "/auth/login", 429, {
      code: "rate_limited",
      message: "Too many attempts.",
      retryAfterSeconds,
    }),
  registerValidationFailed: (fields: Record<string, string>) =>
    apiError("post", "/auth/register", 422, {
      code: "validation_failed",
      message: "Some fields need attention.",
      fields,
    }),
  /** Any endpoint answering that the profile session has gone (e.g. expired). */
  profileSessionExpired: (method: Method, path: keyof paths) =>
    apiError(method, path, 401, {
      code: "profile_session_required",
      message: "Choose a profile to continue.",
    }),
  familySessionExpired: (method: Method, path: keyof paths) =>
    apiError(method, path, 401, {
      code: "family_session_required",
      message: "Sign this device in to your family.",
    }),
};

/** Default happy-path handlers installed for every test. */
export const handlers = [health.ok(), ...identityHandlers];
