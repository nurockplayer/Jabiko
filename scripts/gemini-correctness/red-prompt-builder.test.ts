import { describe, expect, it } from "vitest";
// @ts-expect-error -- plain .mjs module, no types
import { buildRedPrompt } from "./red-prompt-builder.mjs";

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

const scannedFiles = [
  {
    path: "src/domain/example.ts",
    content: 'import { fallback } from "./helper";\nexport const value = fallback();\n',
    lineCount: 2,
    byteSize: 70,
    truncated: false
  },
  {
    path: "src/domain/helper.ts",
    content: 'export const fallback = () => "stale";\n',
    lineCount: 1,
    byteSize: 43,
    truncated: false
  },
  {
    path: "src/domain/example.test.ts",
    content: 'import { expect, it } from "vitest";\nit("existing", () => expect(true).toBe(true));\n',
    lineCount: 2,
    byteSize: 90,
    truncated: false
  },
  {
    path: "src/domain/unrelated.ts",
    content: 'export const unrelated = "do not reveal";\n',
    lineCount: 1,
    byteSize: 42,
    truncated: false
  },
  {
    path: "src/hooks/useOther.ts",
    content: 'export const other = "do not reveal";\n',
    lineCount: 1,
    byteSize: 38,
    truncated: false
  }
];

describe("buildRedPrompt", () => {
  it("includes only the finding target, existing colocated tests, and imported helpers", () => {
    const result = buildRedPrompt({
      baselineSha: "a".repeat(40),
      finding,
      scannedFiles
    });

    expect(result.prompt).toContain("src/domain/example.ts");
    expect(result.prompt).toContain("src/domain/helper.ts");
    expect(result.prompt).toContain("src/domain/example.test.ts");
    expect(result.prompt).not.toContain("src/domain/unrelated.ts");
    expect(result.prompt).not.toContain("src/hooks/useOther.ts");
    expect(result.manifest).toEqual([
      "src/domain/example.test.ts",
      "src/domain/example.ts",
      "src/domain/helper.ts"
    ]);
  });

  it("requires strict test-only JSON and the finding behavior assertion message", () => {
    const result = buildRedPrompt({
      baselineSha: "b".repeat(40),
      finding,
      scannedFiles
    });

    expect(result.prompt).toContain('"status": "regression-test"');
    expect(result.prompt).toContain(`"testFile": "${finding.reproduction.testFile}"`);
    expect(result.prompt).toContain(`"testName": "${finding.reproduction.testName}"`);
    expect(result.prompt).toContain(finding.expectedBehavior);
    expect(result.prompt).toContain(finding.actualBehavior);
    expect(result.prompt).toMatch(/no shell|must not execute|do not execute/i);
    expect(result.prompt).toMatch(/only.*one.*file|one.*test file/i);
    expect(result.prompt).toMatch(/assertion/i);
    expect(result.prompt).toMatch(/exactly one expect/i);
    expect(result.prompt).toMatch(/directly observe[\s\S]*repository/i);
  });

  it("fails closed if a required production file is absent or truncated", () => {
    expect(() => buildRedPrompt({
      baselineSha: "c".repeat(40),
      finding,
      scannedFiles: scannedFiles.filter(file => file.path !== "src/domain/example.ts")
    })).toThrow(/production|manifest/i);

    expect(() => buildRedPrompt({
      baselineSha: "c".repeat(40),
      finding,
      scannedFiles: scannedFiles.map(file =>
        file.path === "src/domain/example.ts" ? { ...file, truncated: true } : file
      )
    })).toThrow(/truncated/i);
  });
});
