import { describe, expect, it } from "vitest";
import { ApiError, missingSession } from "./error";

const body = (code: string, extra: object = {}) => ({ error: { code, message: code, ...extra } });

describe("ApiError", () => {
  it("tells the two missing-session 401s apart", () => {
    expect(new ApiError(401, body("family_session_required")).missingSession).toBe("family");
    expect(new ApiError(401, body("profile_session_required")).missingSession).toBe("profile");
    expect(new ApiError(401, body("invalid_credentials")).missingSession).toBeUndefined();
    expect(missingSession(new Error("x"))).toBeUndefined();
  });

  it("reads retryAfterSeconds from the body, else from Retry-After", () => {
    expect(new ApiError(429, body("pin_locked", { retryAfterSeconds: 30 }), "5")).toMatchObject({
      retryAfterSeconds: 30,
    });
    expect(new ApiError(429, body("rate_limited"), "12").retryAfterSeconds).toBe(12);
    expect(new ApiError(429, body("rate_limited"), "soon").retryAfterSeconds).toBeUndefined();
  });

  it("keeps per-field messages", () => {
    const error = new ApiError(422, body("validation_failed", { fields: { email: "Bad." } }));

    expect(error.fields).toEqual({ email: "Bad." });
  });
});
