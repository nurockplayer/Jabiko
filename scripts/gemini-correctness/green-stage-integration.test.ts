import { describe, expect, it } from "vitest";
// @ts-expect-error -- plain .mjs module, no types
import { parseRedResultArtifact } from "./green-stage.mjs";

describe("parseRedResultArtifact", () => {
  it("accepts a red-confirmed result", () => {
    expect(parseRedResultArtifact(JSON.stringify({
      schemaVersion: 1,
      status: "red-confirmed",
      baselineSha: "a".repeat(40),
      testFile: "src/domain/example.regression.test.ts",
      testName: "returns the safe fallback",
      failureKind: "assertion",
      sanitizedSummary: "summary",
      patchSha256: "b".repeat(64),
      replayConfirmed: true
    }))).toMatchObject({
      schemaVersion: 1,
      status: "red-confirmed",
      baselineSha: "a".repeat(40)
    });
  });

  it.each([
    ["a rejected status", JSON.stringify({
      schemaVersion: 1,
      status: "rejected",
      baselineSha: "a".repeat(40)
    })],
    ["a no-finding envelope", JSON.stringify({
      valid: true,
      result: { schemaVersion: 1, status: "no-finding" }
    })],
    ["non-JSON content", "not json"],
    ["a null input", null],
    ["an empty string", ""]
  ])("rejects %s", (_label, content) => {
    expect(parseRedResultArtifact(content)).toBeNull();
  });
});
