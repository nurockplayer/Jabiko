import { describe, expect, it } from "vitest";
// @ts-expect-error -- plain .mjs module, no types
import { buildGreenPrompt } from "./green-prompt-builder.mjs";

const finding = {
  schemaVersion: 1,
  status: "finding",
  title: "empty queue fallback",
  confidence: 0.95,
  category: "boundary-condition",
  evidence: [
    {
      file: "src/domain/example.ts",
      startLine: 1,
      endLine: 3,
      reason: "the empty branch returns a stale value"
    }
  ],
  expectedBehavior: "an empty queue returns the safe fallback",
  actualBehavior: "an empty queue returns the stale value",
  reproduction: {
    testFile: "src/domain/example.regression.test.ts",
    testName: "returns the safe fallback for an empty queue"
  },
  productionFiles: ["src/domain/example.ts"],
  risk: "low"
};

const redResult = {
  schemaVersion: 1,
  status: "red-confirmed",
  baselineSha: "a".repeat(40),
  testFile: "src/domain/example.regression.test.ts",
  testName: "returns the safe fallback for an empty queue",
  failureKind: "assertion",
  sanitizedSummary: "returns the safe fallback for an empty queue: Expected behavior: an empty queue returns the safe fallback | Actual behavior: an empty queue returns the stale value",
  patchSha256: "b".repeat(64),
  replayConfirmed: true
};

const regressionTestSource = `import { expect, it } from "vitest";
import { readEmptyQueue } from "./example";

it("returns the safe fallback for an empty queue", () => {
  expect(
    readEmptyQueue(),
    "Expected behavior: an empty queue returns the safe fallback | Actual behavior: an empty queue returns the stale value",
  ).toBe("safe");
});
`;

const scannedFiles = [
  {
    path: "src/domain/example.regression.test.ts",
    content: regressionTestSource,
    lineCount: regressionTestSource.split("\n").length,
    byteSize: Buffer.byteLength(regressionTestSource, "utf8"),
    truncated: false
  },
  {
    path: "src/domain/example.ts",
    content: 'import { fallback } from "./helper";\nexport function readEmptyQueue() {\n  return fallback();\n}\n',
    lineCount: 4,
    byteSize: 80,
    truncated: false
  },
  {
    path: "src/domain/helper.ts",
    content: 'export const fallback = "safe";\n',
    lineCount: 1,
    byteSize: 30,
    truncated: false
  },
  {
    path: "src/domain/unrelated.ts",
    content: 'export const unrelated = "do not reveal";\n',
    lineCount: 1,
    byteSize: 42,
    truncated: false
  }
];

const redTestFailure = {
  stdout: "",
  stderr: "AssertionError: Expected behavior: an empty queue returns the safe fallback | Actual behavior: an empty queue returns the stale value"
};

describe("buildGreenPrompt", () => {
  it("includes only the finding target, its import closure, and the regression test", () => {
    const result = buildGreenPrompt({
      finding,
      redResult,
      regressionTestSource,
      scannedFiles,
      redTestFailure
    });

    expect(result.prompt).toContain("src/domain/example.ts");
    expect(result.prompt).toContain("src/domain/helper.ts");
    expect(result.prompt).toContain("src/domain/example.regression.test.ts");
    expect(result.prompt).not.toContain("src/domain/unrelated.ts");
    expect(result.manifest).toEqual([
      "src/domain/example.regression.test.ts",
      "src/domain/example.ts",
      "src/domain/helper.ts"
    ]);
    expect(result.manifest).toContain("src/domain/example.ts");
    expect(result.manifest).toContain("src/domain/helper.ts");
    expect(result.manifest).toContain("src/domain/example.regression.test.ts");
  });

  it("requires strict repair-diff JSON with the exact candidate shape", () => {
    const result = buildGreenPrompt({
      finding,
      redResult,
      regressionTestSource,
      scannedFiles,
      redTestFailure
    });

    expect(result.prompt).toContain('"status": "repair-diff"');
    expect(result.prompt).toContain('"diff": "<unified git diff of production files only>"');
    expect(result.prompt).toContain('"rootCause":');
    expect(result.prompt).toContain('"fixSummary":');
    expect(result.prompt).toMatch(/no shell|must not execute|do not execute/i);
    expect(result.prompt).toContain("3 production files");
    expect(result.prompt).toContain("250 added+deleted lines");
  });

  it("includes the RED replay confirmation, regression test source, and failure evidence", () => {
    const result = buildGreenPrompt({
      finding,
      redResult,
      regressionTestSource,
      scannedFiles,
      redTestFailure
    });

    expect(result.prompt).toContain(redResult.patchSha256);
    expect(result.prompt).toContain(redResult.baselineSha);
    expect(result.prompt).toContain("replayConfirmed");
    expect(result.prompt).toContain("export function readEmptyQueue");
    expect(result.prompt).toContain("AssertionError");
    expect(result.prompt).toContain(finding.expectedBehavior);
    expect(result.prompt).toContain(finding.actualBehavior);
  });

  it("states that only finding production files may be modified", () => {
    const result = buildGreenPrompt({
      finding,
      redResult,
      regressionTestSource,
      scannedFiles,
      redTestFailure
    });

    expect(result.prompt).toMatch(/only.*production|modify\s*only|must not modify/i);
    expect(result.prompt).toMatch(/do not\s*.*test/i);
  });

  it("rejects a non-finding input", () => {
    expect(() => buildGreenPrompt({
      finding: { ...finding, status: "no-finding" },
      redResult,
      regressionTestSource,
      scannedFiles,
      redTestFailure
    })).toThrow(/finding/i);
  });

  it("rejects a redResult that is not red-confirmed", () => {
    expect(() => buildGreenPrompt({
      finding,
      redResult: { ...redResult, status: "rejected" },
      regressionTestSource,
      scannedFiles,
      redTestFailure
    })).toThrow(/red-confirmed/i);
  });

  it("rejects a redResult that does not match the finding reproduction", () => {
    expect(() => buildGreenPrompt({
      finding,
      redResult: {
        ...redResult,
        testFile: "src/domain/other.regression.test.ts"
      },
      regressionTestSource,
      scannedFiles,
      redTestFailure
    })).toThrow(/test/i);
  });
});
