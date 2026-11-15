import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";
import { applyFieldErrors } from "./forms";
import { emailField, newPasswordField, pinField, profileNameField } from "./validation";

describe("applyFieldErrors", () => {
  it("puts server messages on mapped fields and returns the rest", () => {
    const setError = vi.fn<(...args: unknown[]) => void>();
    const error = new ApiError(422, {
      error: {
        code: "validation_failed",
        message: "Invalid",
        fields: { "owner.name": "Too long.", mystery: "Odd." },
      },
    });

    const unplaced = applyFieldErrors(error, setError, { "owner.name": "ownerName" });

    expect(setError).toHaveBeenCalledExactlyOnceWith(
      "ownerName",
      { type: "server", message: "Too long." },
      { shouldFocus: true },
    );
    expect(unplaced).toEqual(["Odd."]);
  });

  it("ignores errors that are not field validation", () => {
    const setError = vi.fn<(...args: unknown[]) => void>();

    expect(applyFieldErrors(new Error("offline"), setError, {})).toBeUndefined();
    expect(setError).not.toHaveBeenCalled();
  });
});

describe("validation (spec §6.3)", () => {
  it("trims emails and rejects bad ones", () => {
    expect(emailField.parse("  jo@example.com ")).toBe("jo@example.com");
    expect(emailField.safeParse("jo@").success).toBe(false);
    expect(emailField.safeParse(`${"a".repeat(250)}@x.io`).success).toBe(false);
  });

  it("needs 10–72 characters and at most 72 bytes for a new password", () => {
    expect(newPasswordField.safeParse("a".repeat(9)).success).toBe(false);
    expect(newPasswordField.safeParse("a".repeat(10)).success).toBe(true);
    expect(newPasswordField.safeParse("a".repeat(73)).success).toBe(false);
    // 25 three-byte characters: 25 characters but 75 bytes.
    expect(newPasswordField.safeParse("€".repeat(25)).success).toBe(false);
  });

  it("needs exactly six digits for a PIN", () => {
    expect(pinField.safeParse("123456").success).toBe(true);
    expect(pinField.safeParse("12345").success).toBe(false);
    expect(pinField.safeParse("12345a").success).toBe(false);
  });

  it("trims profile names to 1–40 characters without control characters", () => {
    expect(profileNameField.parse(" Sam ")).toBe("Sam");
    expect(profileNameField.safeParse("   ").success).toBe(false);
    expect(profileNameField.safeParse("a".repeat(41)).success).toBe(false);
    expect(profileNameField.safeParse("Sa\u0007m").success).toBe(false);
  });
});
