import type { paths } from "@/lib/api";

/** Matches a contract path on any origin, e.g. `apiUrl("/healthz")`. */
export function apiUrl(path: keyof paths): string {
  return `*/api${path}`;
}
