import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
// @ts-expect-error -- plain .mjs module, no types
import { runGreenStage } from "./green-runner.mjs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..", "..");
const TEST_FILE = "src/domain/example.regression.test.ts";
const TEST_NAME = "returns the safe fallback for an empty queue";
const EXPECTED_BEHAVIOR = "an empty queue returns the safe fallback";
const ACTUAL_BEHAVIOR = "an empty queue returns the stale value";
const fakeSecret = "fixture-secret-value-12345";

let fixtureRoot = "";

function git(args: string[]) {
  return execFileSync("git", args, {
    cwd: fixtureRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  }).trim();
}

function gitRaw(args: string[]) {
  return execFileSync("git", args, {
    cwd: fixtureRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
}

function write(relativePath: string, content: string) {
  const absolutePath = path.join(fixtureRoot, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content);
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function regressionTestSource() {
  return `import { expect, it } from "vitest";
import { readEmptyQueue } from "./example";

it("${TEST_NAME}", () => {
  expect(
    readEmptyQueue(),
    "Expected behavior: ${EXPECTED_BEHAVIOR} | Actual behavior: ${ACTUAL_BEHAVIOR}",
  ).toBe("safe");
});
`;
}

function finding() {
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
    expectedBehavior: EXPECTED_BEHAVIOR,
    actualBehavior: ACTUAL_BEHAVIOR,
    reproduction: { testFile: TEST_FILE, testName: TEST_NAME },
    productionFiles: ["src/domain/example.ts"],
    risk: "low"
  };
}

function repairDiff() {
  return [
    "diff --git a/src/domain/example.ts b/src/domain/example.ts",
    "--- a/src/domain/example.ts",
    "+++ b/src/domain/example.ts",
    "@@ -1,3 +1,3 @@",
    " export function readEmptyQueue() {",
    '-  return "stale";',
    '+  return "safe";',
    " }",
    ""
  ].join("\n");
}

function candidate(overrides = {}) {
  return {
    schemaVersion: 1,
    status: "repair-diff",
    diff: repairDiff(),
    rootCause: "the empty branch returns a stale value instead of the fallback",
    fixSummary: "return the safe fallback when the queue is empty",
    ...overrides
  };
}

function redReport() {
  return {
    success: false,
    numTotalTestSuites: 1,
    numPassedTestSuites: 0,
    numFailedTestSuites: 1,
    numPendingTestSuites: 0,
    numTotalTests: 1,
    numPassedTests: 0,
    numFailedTests: 1,
    numPendingTests: 0,
    numTodoTests: 0,
    testResults: [
      {
        name: `${fixtureRoot}/${TEST_FILE}`,
        status: "failed",
        message: "",
        assertionResults: [
          {
            title: TEST_NAME,
            fullName: TEST_NAME,
            status: "failed",
            failureMessages: [
              `AssertionError: Expected behavior: ${EXPECTED_BEHAVIOR} | Actual behavior: ${ACTUAL_BEHAVIOR}\nexpected 'stale' to be 'safe'`
            ]
          }
        ]
      }
    ]
  };
}

function greenReport() {
  return {
    success: true,
    numTotalTestSuites: 1,
    numPassedTestSuites: 1,
    numFailedTestSuites: 0,
    numPendingTestSuites: 0,
    numTotalTests: 1,
    numPassedTests: 1,
    numFailedTests: 0,
    numPendingTests: 0,
    numTodoTests: 0,
    testResults: [
      {
        name: `${fixtureRoot}/${TEST_FILE}`,
        status: "passed",
        message: "",
        assertionResults: [
          {
            title: TEST_NAME,
            fullName: TEST_NAME,
            status: "passed",
            failureMessages: []
          }
        ]
      }
    ]
  };
}

function initializeFixture() {
  fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "jabiko-green-runner-"));
  git(["init", "-q"]);
  git(["config", "user.email", "fixture@example.test"]);
  git(["config", "user.name", "Fixture"]);
  write(".gitignore", ".tmp/\nnode_modules\n");
  write(
    "package.json",
    JSON.stringify({
      name: "green-runner-fixture",
      private: true,
      type: "module",
      packageManager: "pnpm@10.33.0"
    }, null, 2) + "\n"
  );
  write(
    "src/domain/example.ts",
    'export function readEmptyQueue() {\n  return "stale";\n}\n'
  );
  git(["add", ".gitignore", "package.json", "src/domain/example.ts"]);
  git(["commit", "-qm", "fixture baseline"]);
  fs.symlinkSync(path.join(projectRoot, "node_modules"), path.join(fixtureRoot, "node_modules"));
}

function prepareRedArtifacts() {
  const baselineSha = git(["rev-parse", "HEAD"]);
  write(TEST_FILE, regressionTestSource());
  git(["add", "-N", TEST_FILE]);
  const patch = gitRaw([
    "diff",
    "--binary",
    "--no-ext-diff",
    "--no-renames",
    "--",
    TEST_FILE
  ]);
  git(["reset", "-q", "--", TEST_FILE]);
  fs.rmSync(path.join(fixtureRoot, TEST_FILE), { force: true });
  const patchSha256 = sha256(patch);
  const sanitizedSummary =
    `${TEST_NAME}: Expected behavior: ${EXPECTED_BEHAVIOR} | ` +
    `Actual behavior: ${ACTUAL_BEHAVIOR}`;
  write(".tmp/gemini-correctness/red-test.patch", patch);
  write(
    ".tmp/gemini-correctness/red-result.json",
    JSON.stringify({
      schemaVersion: 1,
      status: "red-confirmed",
      baselineSha,
      testFile: TEST_FILE,
      testName: TEST_NAME,
      failureKind: "assertion",
      sanitizedSummary,
      patchSha256,
      replayConfirmed: true
    }, null, 2) + "\n"
  );
  return { baselineSha, patchSha256, sanitizedSummary };
}

function defaultGuardedRunner() {
  return vi.fn()
    .mockResolvedValueOnce({ valid: true, exitCode: 1, report: redReport() })
    .mockResolvedValueOnce({ valid: true, exitCode: 0, report: greenReport() });
}

function passingRunCommand() {
  return vi.fn(async () => ({ exitCode: 0, stdout: "", stderr: "" }));
}

function fakeClient(result) {
  return {
    generateJson: vi.fn().mockResolvedValue(result)
  };
}

describe("runGreenStage — success path (injected runners)", () => {
  beforeEach(() => initializeFixture());
  afterEach(() => {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  });

  it("produces repair-verified with exact diff stats and hashes", async () => {
    const { patchSha256 } = prepareRedArtifacts();
    const guardedRunner = defaultGuardedRunner();
    const runCommand = passingRunCommand();

    const result = await runGreenStage({
      repoRoot: fixtureRoot,
      finding: finding(),
      redResult: {
        schemaVersion: 1,
        status: "red-confirmed",
        baselineSha: git(["rev-parse", "HEAD"]),
        testFile: TEST_FILE,
        testName: TEST_NAME,
        failureKind: "assertion",
        sanitizedSummary:
          `${TEST_NAME}: Expected behavior: ${EXPECTED_BEHAVIOR} | ` +
          `Actual behavior: ${ACTUAL_BEHAVIOR}`,
        patchSha256,
        replayConfirmed: true
      },
      client: fakeClient({ valid: true, result: candidate() }),
      environment: { ...process.env, FIXTURE_SECRET: fakeSecret },
      guardedRunner,
      runCommand
    });

    expect(result, result.error).toMatchObject({ valid: true });
    expect(result.result.status).toBe("repair-verified");
    expect(result.result.baselineSha).toBe(git(["rev-parse", "HEAD"]));
    expect(result.result.findingTitle).toBe(finding().title);
    expect(result.result.testFile).toBe(TEST_FILE);
    expect(result.result.testName).toBe(TEST_NAME);
    expect(result.result.productionFiles).toEqual(["src/domain/example.ts"]);
    expect(result.result.rootCause).toBe(candidate().rootCause);
    expect(result.result.fixSummary).toBe(candidate().fixSummary);
    expect(result.result.checks).toEqual([
      { name: "targeted-test", status: "passed" },
      { name: "lint", status: "passed" },
      { name: "typecheck", status: "passed" },
      { name: "test", status: "passed" },
      { name: "build", status: "passed" }
    ]);
    expect(result.result.changedFiles).toBe(1);
    expect(result.result.changedLines).toBe(2);
    expect(result.result.testPatchSha256).toBe(patchSha256);
    const actualDiff = gitRaw([
      "diff",
      "--binary",
      "--no-ext-diff",
      "--no-renames"
    ]);
    expect(result.result.finalDiffSha256).toBe(sha256(actualDiff));

    expect(guardedRunner).toHaveBeenCalledTimes(2);
    expect(runCommand.mock.calls.map(call => call[0]))
      .toEqual(["lint", "typecheck", "test", "build"]);

    // The repaired production file stays modified and the regression test stays
    // untracked — exactly the diff that would become the PR.
    expect(gitRaw(["status", "--porcelain=v1", "--untracked-files=all"]))
      .toBe(` M src/domain/example.ts\n?? ${TEST_FILE}\n`);
    const artifact = JSON.parse(
      fs.readFileSync(
        path.join(fixtureRoot, ".tmp/gemini-correctness/repair-result.json"),
        "utf8"
      )
    );
    expect(artifact).toEqual(result.result);
    expect(JSON.stringify(artifact)).not.toContain(fakeSecret);
    expect(JSON.stringify(artifact)).not.toContain(fixtureRoot);
  });

  it("redacts secrets and absolute paths from failure errors", async () => {
    const red = prepareRedArtifacts();
    const guardedRunner = defaultGuardedRunner();
    const runCommand = vi.fn(async () => ({
      exitCode: 1,
      stdout: `built with ${fakeSecret}`,
      stderr: `at ${fixtureRoot}`
    }));

    const result = await runGreenStage({
      repoRoot: fixtureRoot,
      finding: finding(),
      redResult: {
        schemaVersion: 1,
        status: "red-confirmed",
        baselineSha: git(["rev-parse", "HEAD"]),
        testFile: TEST_FILE,
        testName: TEST_NAME,
        failureKind: "assertion",
        sanitizedSummary:
          `${TEST_NAME}: Expected behavior: ${EXPECTED_BEHAVIOR} | ` +
          `Actual behavior: ${ACTUAL_BEHAVIOR}`,
        patchSha256: red.patchSha256,
        replayConfirmed: true
      },
      client: fakeClient({ valid: true, result: candidate() }),
      environment: { ...process.env, FIXTURE_SECRET: fakeSecret },
      guardedRunner,
      runCommand
    });

    expect(result.valid).toBe(false);
    expect(result.error).not.toContain(fakeSecret);
    expect(result.error).not.toContain(fixtureRoot);
  });
});

describe("runGreenStage — failure statuses (injected runners)", () => {
  beforeEach(() => initializeFixture());
  afterEach(() => {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  });

  it("fails closed with baseline-mismatch when HEAD differs from redResult.baselineSha", async () => {
    const red = prepareRedArtifacts();
    write("src/domain/example.ts", 'export function readEmptyQueue() {\n  return "x";\n}\n');
    git(["add", "src/domain/example.ts"]);
    git(["commit", "-qm", "drift commit"]);

    const result = await runGreenStage({
      repoRoot: fixtureRoot,
      finding: finding(),
      redResult: {
        schemaVersion: 1,
        status: "red-confirmed",
        baselineSha: red.baselineSha,
        testFile: TEST_FILE,
        testName: TEST_NAME,
        failureKind: "assertion",
        sanitizedSummary: red.sanitizedSummary,
        patchSha256: red.patchSha256,
        replayConfirmed: true
      },
      client: fakeClient({ valid: true, result: candidate() }),
      environment: process.env,
      guardedRunner: defaultGuardedRunner(),
      runCommand: passingRunCommand()
    });

    expect(result.valid).toBe(false);
    expect(result.status).toBe("baseline-mismatch");
    // The worktree keeps the drift commit; the runner never rewrites history.
    expect(git(["rev-parse", "HEAD"])).not.toBe(red.baselineSha);
  });

  it("fails closed with red-replay-failed when the stored patch hash does not match", async () => {
    const red = prepareRedArtifacts();
    const patchPath = path.join(fixtureRoot, ".tmp/gemini-correctness/red-test.patch");
    fs.writeFileSync(patchPath, fs.readFileSync(patchPath, "utf8") + "# tampered\n");

    const result = await runGreenStage({
      repoRoot: fixtureRoot,
      finding: finding(),
      redResult: {
        schemaVersion: 1,
        status: "red-confirmed",
        baselineSha: red.baselineSha,
        testFile: TEST_FILE,
        testName: TEST_NAME,
        failureKind: "assertion",
        sanitizedSummary: red.sanitizedSummary,
        patchSha256: red.patchSha256,
        replayConfirmed: true
      },
      client: fakeClient({ valid: true, result: candidate() }),
      environment: process.env,
      guardedRunner: defaultGuardedRunner(),
      runCommand: passingRunCommand()
    });

    expect(result.valid).toBe(false);
    expect(result.status).toBe("red-replay-failed");
  });

  it("fails closed with red-replay-failed when the replay does not reproduce the RED assertion", async () => {
    const red = prepareRedArtifacts();
    const guardedRunner = vi.fn().mockResolvedValueOnce({
      valid: true,
      exitCode: 0,
      report: greenReport()
    });

    const result = await runGreenStage({
      repoRoot: fixtureRoot,
      finding: finding(),
      redResult: {
        schemaVersion: 1,
        status: "red-confirmed",
        baselineSha: red.baselineSha,
        testFile: TEST_FILE,
        testName: TEST_NAME,
        failureKind: "assertion",
        sanitizedSummary: red.sanitizedSummary,
        patchSha256: red.patchSha256,
        replayConfirmed: true
      },
      client: fakeClient({ valid: true, result: candidate() }),
      environment: process.env,
      guardedRunner,
      runCommand: passingRunCommand()
    });

    expect(result.valid).toBe(false);
    expect(result.status).toBe("red-replay-failed");
  });

  it("fails closed with repair-not-found when Gemini returns no valid repair", async () => {
    const red = prepareRedArtifacts();
    const result = await runGreenStage({
      repoRoot: fixtureRoot,
      finding: finding(),
      redResult: {
        schemaVersion: 1,
        status: "red-confirmed",
        baselineSha: red.baselineSha,
        testFile: TEST_FILE,
        testName: TEST_NAME,
        failureKind: "assertion",
        sanitizedSummary: red.sanitizedSummary,
        patchSha256: red.patchSha256,
        replayConfirmed: true
      },
      client: fakeClient({ valid: false, error: "Gemini HTTP 500: boom" }),
      environment: process.env,
      guardedRunner: defaultGuardedRunner(),
      runCommand: passingRunCommand()
    });

    expect(result.valid).toBe(false);
    expect(result.status).toBe("repair-not-found");
  });

  it("fails closed with diff-policy-rejected when Gemini tampers the regression test", async () => {
    const red = prepareRedArtifacts();
    const tampered = [
      "diff --git a/src/domain/example.regression.test.ts b/src/domain/example.regression.test.ts",
      "--- a/src/domain/example.regression.test.ts",
      "+++ b/src/domain/example.regression.test.ts",
      "@@ -1,3 +1,3 @@",
      " export function readEmptyQueue() {",
      '-  return "stale";',
      '+  return "safe";',
      " }",
      ""
    ].join("\n");
    const result = await runGreenStage({
      repoRoot: fixtureRoot,
      finding: finding(),
      redResult: {
        schemaVersion: 1,
        status: "red-confirmed",
        baselineSha: red.baselineSha,
        testFile: TEST_FILE,
        testName: TEST_NAME,
        failureKind: "assertion",
        sanitizedSummary: red.sanitizedSummary,
        patchSha256: red.patchSha256,
        replayConfirmed: true
      },
      client: fakeClient({ valid: true, result: candidate({ diff: tampered }) }),
      environment: process.env,
      guardedRunner: defaultGuardedRunner(),
      runCommand: passingRunCommand()
    });

    expect(result.valid).toBe(false);
    expect(result.status).toBe("diff-policy-rejected");
  });

  it("fails closed with diff-policy-rejected when Gemini adds an escape hatch", async () => {
    const red = prepareRedArtifacts();
    const escaped = repairDiff().replace(
      '  return "stale";',
      "  // @ts-ignore\n  return \"stale\";"
    );
    const result = await runGreenStage({
      repoRoot: fixtureRoot,
      finding: finding(),
      redResult: {
        schemaVersion: 1,
        status: "red-confirmed",
        baselineSha: red.baselineSha,
        testFile: TEST_FILE,
        testName: TEST_NAME,
        failureKind: "assertion",
        sanitizedSummary: red.sanitizedSummary,
        patchSha256: red.patchSha256,
        replayConfirmed: true
      },
      client: fakeClient({ valid: true, result: candidate({ diff: escaped }) }),
      environment: process.env,
      guardedRunner: defaultGuardedRunner(),
      runCommand: passingRunCommand()
    });

    expect(result.valid).toBe(false);
    expect(result.status).toBe("diff-policy-rejected");
  });

  it("fails closed with needs-human-scope-expansion when Gemini requests it", async () => {
    const red = prepareRedArtifacts();
    const result = await runGreenStage({
      repoRoot: fixtureRoot,
      finding: finding(),
      redResult: {
        schemaVersion: 1,
        status: "red-confirmed",
        baselineSha: red.baselineSha,
        testFile: TEST_FILE,
        testName: TEST_NAME,
        failureKind: "assertion",
        sanitizedSummary: red.sanitizedSummary,
        patchSha256: red.patchSha256,
        replayConfirmed: true
      },
      client: fakeClient({
        valid: true,
        result: { schemaVersion: 1, status: "needs-human-scope-expansion", reason: "needs other files" }
      }),
      environment: process.env,
      guardedRunner: defaultGuardedRunner(),
      runCommand: passingRunCommand()
    });

    expect(result.valid).toBe(false);
    expect(result.status).toBe("needs-human-scope-expansion");
  });

  it("fails closed with targeted-test-failed when the repair does not green the test", async () => {
    const red = prepareRedArtifacts();
    const guardedRunner = vi.fn()
      .mockResolvedValueOnce({ valid: true, exitCode: 1, report: redReport() })
      .mockResolvedValueOnce({ valid: true, exitCode: 1, report: redReport() });

    const result = await runGreenStage({
      repoRoot: fixtureRoot,
      finding: finding(),
      redResult: {
        schemaVersion: 1,
        status: "red-confirmed",
        baselineSha: red.baselineSha,
        testFile: TEST_FILE,
        testName: TEST_NAME,
        failureKind: "assertion",
        sanitizedSummary: red.sanitizedSummary,
        patchSha256: red.patchSha256,
        replayConfirmed: true
      },
      client: fakeClient({ valid: true, result: candidate() }),
      environment: process.env,
      guardedRunner,
      runCommand: passingRunCommand()
    });

    expect(result.valid).toBe(false);
    expect(result.status).toBe("targeted-test-failed");
  });

  it.each([
    ["lint", "exit 1 from lint"],
    ["typecheck", "exit 1 from typecheck"],
    ["test", "exit 1 from test"],
    ["build", "exit 1 from build"]
  ])("fails closed with full-check-failed when %s fails", async (_label, failure) => {
    const red = prepareRedArtifacts();
    const failing = ["lint", "typecheck", "test", "build"];
    const runCommand = vi.fn(async (script) => {
      if (failure.includes(script)) {
        return { exitCode: 1, stdout: "", stderr: failure };
      }
      return { exitCode: 0, stdout: "", stderr: "" };
    });
    void failing;

    const result = await runGreenStage({
      repoRoot: fixtureRoot,
      finding: finding(),
      redResult: {
        schemaVersion: 1,
        status: "red-confirmed",
        baselineSha: red.baselineSha,
        testFile: TEST_FILE,
        testName: TEST_NAME,
        failureKind: "assertion",
        sanitizedSummary: red.sanitizedSummary,
        patchSha256: red.patchSha256,
        replayConfirmed: true
      },
      client: fakeClient({ valid: true, result: candidate() }),
      environment: process.env,
      guardedRunner: defaultGuardedRunner(),
      runCommand
    });

    expect(result.valid).toBe(false);
    expect(result.status).toBe("full-check-failed");
  });

  it("cleans up to baseline and removes green temporary artifacts on failure", async () => {
    const baselineSha = git(["rev-parse", "HEAD"]);
    const red = prepareRedArtifacts();
    const runCommand = vi.fn(async () => ({ exitCode: 1, stdout: "", stderr: "build failed" }));

    const result = await runGreenStage({
      repoRoot: fixtureRoot,
      finding: finding(),
      redResult: {
        schemaVersion: 1,
        status: "red-confirmed",
        baselineSha: red.baselineSha,
        testFile: TEST_FILE,
        testName: TEST_NAME,
        failureKind: "assertion",
        sanitizedSummary: red.sanitizedSummary,
        patchSha256: red.patchSha256,
        replayConfirmed: true
      },
      client: fakeClient({ valid: true, result: candidate() }),
      environment: process.env,
      guardedRunner: defaultGuardedRunner(),
      runCommand
    });

    expect(result.valid).toBe(false);
    expect(result.status).toBe("full-check-failed");
    expect(git(["rev-parse", "HEAD"])).toBe(baselineSha);
    expect(git(["status", "--porcelain=v1", "--untracked-files=all"])).toBe("");
    const artifactDir = path.join(fixtureRoot, ".tmp/gemini-correctness");
    const greenArtifacts = fs.readdirSync(artifactDir);
    expect(greenArtifacts).not.toContain("green-repair.patch");
    expect(greenArtifacts).not.toContain("repair-result.json");
    const resultFile = path.join(artifactDir, "repair-result.json");
    if (fs.existsSync(resultFile)) {
      expect(JSON.stringify(fs.readFileSync(resultFile, "utf8"))).not.toContain(fakeSecret);
    }
  });
});
