import { describe, expect, it } from "vitest";
// @ts-expect-error -- plain .mjs module, no types
import { getDefaultProtectedPaths } from "./policy.mjs";
// @ts-expect-error -- plain .mjs module, no types
import { validateGreenRepairCandidate } from "./green-validator.mjs";

const fakeSecret = "fixture-secret-value-12345";

function finding(overrides = {}) {
  return {
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
    risk: "low",
    ...overrides
  };
}

function singleFileDiff(body = "") {
  const content =
    'export function readEmptyQueue() {\n  return "stale";\n}\n';
  return (
    "diff --git a/src/domain/example.ts b/src/domain/example.ts\n" +
    "--- a/src/domain/example.ts\n" +
    "+++ b/src/domain/example.ts\n" +
    "@@ -1,3 +1,3 @@\n" +
    content.split("\n").slice(0, 2).map(line => ` ${line}`).join("\n") +
    "\n" +
    '-  return "stale";\n' +
    '+  return "safe";\n' +
    " }\n" +
    body
  );
}

function candidate(overrides = {}) {
  return {
    schemaVersion: 1,
    status: "repair-diff",
    diff: singleFileDiff(),
    rootCause: "the empty branch returns a stale value instead of the fallback",
    fixSummary: "return the safe fallback when the queue is empty",
    ...overrides
  };
}

function validOptions() {
  return {
    finding: finding(),
    sensitiveValues: [fakeSecret],
    allowlist: ["src/domain/**"],
    protectedPaths: []
  };
}

describe("validateGreenRepairCandidate", () => {
  it("accepts a minimal single-file repair diff", () => {
    const result = validateGreenRepairCandidate(candidate(), validOptions());
    expect(result.valid).toBe(true);
    expect(result.result).toMatchObject({
      schemaVersion: 1,
      status: "repair-diff",
      changedFiles: 1,
      totalAdditions: 1,
      totalDeletions: 1,
      files: ["src/domain/example.ts"]
    });
  });

  it("accepts a multi-file repair within the finding productionFiles", () => {
    const multi = finding({ productionFiles: ["src/domain/example.ts", "src/domain/helper.ts"] });
    const diff =
      "diff --git a/src/domain/example.ts b/src/domain/example.ts\n" +
      "--- a/src/domain/example.ts\n" +
      "+++ b/src/domain/example.ts\n" +
      "@@ -1 +1 @@\n" +
      '-return "stale";\n' +
      '+return "safe";\n' +
      "diff --git a/src/domain/helper.ts b/src/domain/helper.ts\n" +
      "--- a/src/domain/helper.ts\n" +
      "+++ b/src/domain/helper.ts\n" +
      "@@ -1 +1 @@\n" +
      "-export const helper = 1;\n" +
      "+export const helper = 2;\n";
    const result = validateGreenRepairCandidate(candidate({ diff }), {
      ...validOptions(),
      finding: multi
    });
    expect(result.valid).toBe(true);
    expect(result.result.files).toEqual(["src/domain/example.ts", "src/domain/helper.ts"]);
  });

  it.each([
    ["schemaVersion mismatch", { schemaVersion: 2 }],
    ["status mismatch", { status: "regression-test" }],
    ["missing diff", { diff: undefined }],
    ["missing rootCause", { rootCause: undefined }],
    ["missing fixSummary", { fixSummary: undefined }],
    ["unknown field", { extra: "nope" }],
    ["empty diff string", { diff: "" }],
    ["non-string diff", { diff: 42 }]
  ])("rejects a candidate with %s", (_label, overrides) => {
    const result = validateGreenRepairCandidate(candidate(overrides), validOptions());
    expect(result.valid).toBe(false);
  });

  it("rejects an empty rootCause or fixSummary string", () => {
    expect(validateGreenRepairCandidate(
      candidate({ rootCause: "   " }),
      validOptions()
    ).valid).toBe(false);
    expect(validateGreenRepairCandidate(
      candidate({ fixSummary: "" }),
      validOptions()
    ).valid).toBe(false);
  });

  it("rejects a regression-test or existing-test file in the diff", () => {
    const diff =
      "diff --git a/src/domain/example.regression.test.ts b/src/domain/example.regression.test.ts\n" +
      "--- a/src/domain/example.regression.test.ts\n" +
      "+++ b/src/domain/example.regression.test.ts\n" +
      "@@ -1 +1 @@\n" +
      "-x\n" +
      "+y\n";
    const result = validateGreenRepairCandidate(candidate({ diff }), validOptions());
    expect(result.valid).toBe(false);
  });

  it("rejects a file outside the finding productionFiles (scope escape)", () => {
    const diff =
      "diff --git a/src/domain/other.ts b/src/domain/other.ts\n" +
      "--- a/src/domain/other.ts\n" +
      "+++ b/src/domain/other.ts\n" +
      "@@ -1 +1 @@\n" +
      "-x\n" +
      "+y\n";
    const result = validateGreenRepairCandidate(candidate({ diff }), validOptions());
    expect(result.valid).toBe(false);
  });

  it.each([
    ["a protected path", "src/domain/types.ts"],
    ["package.json", "package.json"],
    ["pnpm-lock.yaml", "pnpm-lock.yaml"],
    ["a workflow", ".github/workflows/ci.yml"],
    ["a supabase migration", "supabase/migrations/1.sql"]
  ])("rejects %s even when the finding lists it", (_label, filePath) => {
    const diff =
      `diff --git a/${filePath} b/${filePath}\n` +
      `--- a/${filePath}\n` +
      `+++ b/${filePath}\n` +
      "@@ -1 +1 @@\n" +
      "-x\n" +
      "+y\n";
    const result = validateGreenRepairCandidate(candidate({ diff }), {
      ...validOptions(),
      protectedPaths: getDefaultProtectedPaths(),
      finding: finding({ productionFiles: [filePath] })
    });
    expect(result.valid).toBe(false);
  });

  it("rejects more than the GREEN production-file budget", () => {
    const files = Array.from({ length: 4 }, (_, index) =>
      `src/domain/module-${index}.ts`
    );
    const diff = files.map(filePath =>
      `diff --git a/${filePath} b/${filePath}\n` +
      `--- a/${filePath}\n` +
      `+++ b/${filePath}\n` +
      "@@ -1 +1 @@\n" +
      "-x\n" +
      "+y\n"
    ).join("");
    const result = validateGreenRepairCandidate(candidate({ diff }), {
      ...validOptions(),
      finding: finding({ productionFiles: files })
    });
    expect(result.valid).toBe(false);
  });

  it("rejects a diff that exceeds the GREEN line budget", () => {
    const added = Array.from({ length: 251 }, () => "+line\n").join("");
    const diff =
      "diff --git a/src/domain/example.ts b/src/domain/example.ts\n" +
      "--- a/src/domain/example.ts\n" +
      "+++ b/src/domain/example.ts\n" +
      "@@ -1 +1,252 @@\n" +
      " context\n" +
      added;
    const result = validateGreenRepairCandidate(candidate({ diff }), validOptions());
    expect(result.valid).toBe(false);
  });

  it.each([
    ["a deleted file", "deleted file mode 100644\n"],
    ["a rename", "similarity index 90%\nrename from a.ts\nrename to b.ts\n"],
    ["a binary file", "GIT binary patch\nliteral 5\n"],
    ["a submodule change", "Subproject commit 0123456789abcdef0123456789abcdef01234567\n"]
  ])("rejects a diff containing %s", (_label, marker) => {
    const result = validateGreenRepairCandidate(
      candidate({ diff: singleFileDiff(marker) }),
      validOptions()
    );
    expect(result.valid).toBe(false);
  });

  it("rejects a symlink file mode in the diff", () => {
    const diff = singleFileDiff(
      "new file mode 120000\n"
    );
    const result = validateGreenRepairCandidate(candidate({ diff }), validOptions());
    expect(result.valid).toBe(false);
  });

  it.each([
    [".skip", "  it.skip(\"x\", () => {});"],
    [".only", "  describe.only(\"x\", () => {});"],
    ["@ts-ignore", "  // @ts-ignore"],
    ["@ts-nocheck", "  // @ts-nocheck"],
    ["@ts-expect-error", "  // @ts-expect-error"],
    ["eslint-disable", "  /* eslint-disable no-any */"],
    ["istanbul ignore", "  /* istanbul ignore next */"]
  ])("rejects an escape-hatch marker in the diff: %s", (_label, marker) => {
    const diff =
      "diff --git a/src/domain/example.ts b/src/domain/example.ts\n" +
      "--- a/src/domain/example.ts\n" +
      "+++ b/src/domain/example.ts\n" +
      "@@ -1 +1,2 @@\n" +
      '-return "stale";\n' +
      `+${marker}\n` +
      '+return "safe";\n';
    const result = validateGreenRepairCandidate(candidate({ diff }), validOptions());
    expect(result.valid).toBe(false);
  });

  it("rejects an added uncommented `any` type annotation", () => {
    const diff =
      "diff --git a/src/domain/example.ts b/src/domain/example.ts\n" +
      "--- a/src/domain/example.ts\n" +
      "+++ b/src/domain/example.ts\n" +
      "@@ -1 +1,2 @@\n" +
      '-return "stale";\n' +
      "+function f(): any {\n" +
      '+return "safe";\n' +
      "}\n";
    const result = validateGreenRepairCandidate(candidate({ diff }), validOptions());
    expect(result.valid).toBe(false);
  });

  it("rejects whitespace-only churn between added and removed lines", () => {
    const diff =
      "diff --git a/src/domain/example.ts b/src/domain/example.ts\n" +
      "--- a/src/domain/example.ts\n" +
      "+++ b/src/domain/example.ts\n" +
      "@@ -1 +1 @@\n" +
      '-  return "safe";\n' +
      '+return "safe";\n';
    const result = validateGreenRepairCandidate(candidate({ diff }), validOptions());
    expect(result.valid).toBe(false);
  });

  it("rejects EOL churn that introduces carriage returns", () => {
    const diff =
      "diff --git a/src/domain/example.ts b/src/domain/example.ts\n" +
      "--- a/src/domain/example.ts\n" +
      "+++ b/src/domain/example.ts\n" +
      "@@ -1 +1 @@\n" +
      '-return "stale";\r\n' +
      '+return "safe";\r\n';
    const result = validateGreenRepairCandidate(candidate({ diff }), validOptions());
    expect(result.valid).toBe(false);
  });

  it("rejects a diff whose path is not a safe relative repository path", () => {
    for (const unsafePath of ["/etc/passwd", "../../outside.ts", "src/domain/link -> /etc"]) {
      const diff =
        `diff --git a/${unsafePath} b/${unsafePath}\n` +
        `--- a/${unsafePath}\n` +
        `+++ b/${unsafePath}\n` +
        "@@ -1 +1 @@\n" +
        "-x\n" +
        "+y\n";
      const result = validateGreenRepairCandidate(candidate({ diff }), validOptions());
      expect(result.valid).toBe(false);
    }
  });

  it("rejects a diff containing sensitive content", () => {
    const diff =
      "diff --git a/src/domain/example.ts b/src/domain/example.ts\n" +
      "--- a/src/domain/example.ts\n" +
      "+++ b/src/domain/example.ts\n" +
      "@@ -1 +1 @@\n" +
      "-x\n" +
      `+const key = "${fakeSecret}";\n`;
    const result = validateGreenRepairCandidate(candidate({ diff }), validOptions());
    expect(result.valid).toBe(false);
  });
});
