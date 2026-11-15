import type { components } from "./schema";

export type ErrorBody = components["schemas"]["Error"];

/** The two 401 codes that say which session is missing (spec §3): login vs the picker. */
export const SESSION_CODES = {
  family: "family_session_required",
  profile: "profile_session_required",
} as const;

export type MissingSession = keyof typeof SESSION_CODES;

/** A non-2xx response from the API, normalised from the contract's Error schema. */
export class ApiError extends Error {
  override readonly name = "ApiError";
  readonly status: number;
  readonly code: string;
  readonly fields: Readonly<Record<string, string>>;
  /** Seconds until a retry can succeed; set with `429 rate_limited` and `pin_locked`. */
  readonly retryAfterSeconds: number | undefined;

  constructor(status: number, body: unknown, retryAfterHeader?: string | null) {
    const detail = isErrorBody(body) ? body.error : undefined;
    super(detail?.message ?? `Request failed with status ${status}`);
    this.status = status;
    this.code = detail?.code ?? "unknown";
    this.fields = detail?.fields ?? {};
    this.retryAfterSeconds = detail?.retryAfterSeconds ?? parseRetryAfter(retryAfterHeader);
  }

  /** Which session the server asked for, or undefined for any other error. */
  get missingSession(): MissingSession | undefined {
    if (this.status !== 401) return undefined;
    if (this.code === SESSION_CODES.family) return "family";
    if (this.code === SESSION_CODES.profile) return "profile";
    return undefined;
  }
}

/** `Retry-After` in seconds; the API never sends the HTTP-date form. */
function parseRetryAfter(value: string | null | undefined): number | undefined {
  if (value == null) return undefined;
  const seconds = Number(value);
  return Number.isInteger(seconds) && seconds > 0 ? seconds : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Guards against bodies that are not ours, e.g. a proxy error page. */
export function isErrorBody(value: unknown): value is ErrorBody {
  if (!isRecord(value) || !isRecord(value.error)) return false;
  const { code, message, fields, retryAfterSeconds } = value.error;
  return (
    typeof code === "string" &&
    typeof message === "string" &&
    (fields === undefined ||
      (isRecord(fields) && Object.values(fields).every((v) => typeof v === "string"))) &&
    (retryAfterSeconds === undefined || typeof retryAfterSeconds === "number")
  );
}

/** Which session a failed request asked for, if it failed for that reason. */
export function missingSession(error: unknown): MissingSession | undefined {
  return error instanceof ApiError ? error.missingSession : undefined;
}
