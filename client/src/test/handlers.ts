import { http, HttpResponse, type PathParams } from "msw";
import type { components, paths } from "@/lib/api";

type Schemas = components["schemas"];

/** Matches a contract path on any origin, e.g. `apiUrl("/healthz")`. */
export function apiUrl(path: keyof paths): string {
  return `*/api${path}`;
}

/** Ready-made responses; tests swap them in with `server.use(...)`. */
export const health = {
  ok: () =>
    http.get<PathParams, never, Schemas["Health"]>(apiUrl("/healthz"), () =>
      HttpResponse.json({ status: "ok" }),
    ),
  databaseDown: () =>
    http.get<PathParams, never, Schemas["Error"]>(apiUrl("/healthz"), () =>
      HttpResponse.json(
        { error: { code: "database_unavailable", message: "Database unavailable" } },
        { status: 503 },
      ),
    ),
  networkError: () => http.get(apiUrl("/healthz"), () => HttpResponse.error()),
};

/** Default happy-path handlers installed for every test. */
export const handlers = [health.ok()];
