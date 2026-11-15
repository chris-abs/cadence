// @vitest-environment node
/// <reference types="node" />
// Reads the contract file itself (Node, in the test runner only), so drift fails CI.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PROFILE_COLOURS } from "@/components/profile-colours";
import { coloursMatchContract } from "./profile-colour-contract";

/** The `ProfileColour` enum values as written in the contract. */
function contractColours(): string[] {
  const contract = readFileSync(new URL("../../../../api/openapi.yaml", import.meta.url), "utf8");
  const block = /ProfileColour:\s*\n\s*type: string\s*\n\s*enum:\s*\[([^\]]*)\]/.exec(contract);
  if (!block?.[1]) throw new Error("ProfileColour enum not found in api/openapi.yaml");
  return block[1]
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

describe("profile colours", () => {
  it("are exactly the contract's ProfileColour enum, in the same order", () => {
    expect(coloursMatchContract).toBe(true);
    expect([...PROFILE_COLOURS]).toEqual(contractColours());
  });
});
