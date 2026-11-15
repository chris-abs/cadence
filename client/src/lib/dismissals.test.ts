import { afterEach, describe, expect, it, vi } from "vitest";
import { isDismissed, setDismissed } from "./dismissals";

describe("dismissals", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("remembers and forgets a dismissal per key", () => {
    expect(isDismissed("pin-advice:a")).toBe(false);

    setDismissed("pin-advice:a", true);
    expect(isDismissed("pin-advice:a")).toBe(true);
    expect(isDismissed("pin-advice:b")).toBe(false);

    setDismissed("pin-advice:a", false);
    expect(isDismissed("pin-advice:a")).toBe(false);
  });

  it("treats unavailable storage as never dismissed, without throwing", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    expect(() => {
      setDismissed("pin-advice:a", true);
    }).not.toThrow();
    expect(isDismissed("pin-advice:a")).toBe(false);
  });
});
