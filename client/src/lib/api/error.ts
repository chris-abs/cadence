import type { components } from "./schema";

export type ErrorBody = components["schemas"]["Error"];

/** A non-2xx response from the API, normalised from the contract's Error schema. */
export class ApiError extends Error {
  override readonly name = "ApiError";
  readonly status: number;
  readonly code: string;
  readonly fields: Readonly<Record<string, string>>;

  constructor(status: number, body: unknown) {
    const detail = isErrorBody(body) ? body.error : undefined;
    super(detail?.message ?? `Request failed with status ${status}`);
    this.status = status;
    this.code = detail?.code ?? "unknown";
    this.fields = detail?.fields ?? {};
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Guards against bodies that are not ours, e.g. a proxy error page. */
export function isErrorBody(value: unknown): value is ErrorBody {
  if (!isRecord(value) || !isRecord(value.error)) return false;
  const { code, message, fields } = value.error;
  return (
    typeof code === "string" &&
    typeof message === "string" &&
    (fields === undefined ||
      (isRecord(fields) && Object.values(fields).every((v) => typeof v === "string")))
  );
}
