import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ApiError } from "@/lib/api";

/** Where a server field name lands in a form; unmapped names fall back to the form error. */
export type FieldMap<T extends FieldValues> = Partial<Record<string, Path<T>>>;

/**
 * Puts a `422 validation_failed` response's per-field messages on the form's
 * fields. Returns the messages no field could take (show them as the form
 * error), or undefined when the error was not a field validation error.
 */
export function applyFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fieldMap: FieldMap<T>,
): string[] | undefined {
  if (!(error instanceof ApiError) || error.code !== "validation_failed") return undefined;
  const unplaced: string[] = [];
  let first = true;
  for (const [serverField, message] of Object.entries(error.fields)) {
    const field = fieldMap[serverField];
    if (field) {
      setError(field, { type: "server", message }, { shouldFocus: first });
      first = false;
    } else {
      unplaced.push(message);
    }
  }
  return unplaced;
}

/** A message for any failed request, for a form-level error banner. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return "Could not reach Cadence. Check the connection and try again.";
}
