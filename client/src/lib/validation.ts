import { z } from "zod";

/**
 * Field rules mirroring the server's (docs/spec/identity.md §6.3), so most
 * mistakes are caught before a round trip. The server stays the authority.
 */

const MAX_EMAIL = 254;
const MIN_PASSWORD = 10;
const MAX_PASSWORD = 72;
const encoder = new TextEncoder();

export const emailField = z
  .string()
  .trim()
  .min(1, "Enter an email address.")
  .max(MAX_EMAIL, `Use at most ${MAX_EMAIL} characters.`)
  .pipe(z.email("Enter a valid email address."));

/** bcrypt's limit is 72 bytes, so multibyte characters count for more. */
export const newPasswordField = z
  .string()
  .min(MIN_PASSWORD, `Use at least ${MIN_PASSWORD} characters.`)
  .max(MAX_PASSWORD, `Use at most ${MAX_PASSWORD} characters.`)
  .refine((value) => encoder.encode(value).length <= MAX_PASSWORD, {
    message: "That password is too long; use fewer special characters.",
  });

/** Signing in only needs a value; the length rules are for new passwords. */
export const currentPasswordField = z
  .string()
  .min(1, "Enter your password.")
  .max(MAX_PASSWORD, `Use at most ${MAX_PASSWORD} characters.`);

export const pinField = z.string().regex(/^[0-9]{6}$/, "Enter exactly 6 digits.");

// Control characters are rejected by the server too.
// oxlint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;

function nameField(max: number, empty: string) {
  return z
    .string()
    .trim()
    .min(1, empty)
    .max(max, `Use at most ${max} characters.`)
    .refine((value) => !CONTROL_CHARS.test(value), "Remove special characters.");
}

export const profileNameField = nameField(40, "Enter a name.");
export const familyNameField = nameField(60, "Enter a family name.");
