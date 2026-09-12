import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
// @ts-expect-error -- plain .mjs module, no types
import {
  replayRedArtifacts,
  resetRedWorktree,
  runGuardedTargetedVitest,
  runRedStage
} from "./red-stage.mjs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..", "..");
const testFile = "src/domain/example.regression.test.ts";
const testName = "returns the safe fallback for an empty queue";
const fakeSecret = "fixture-secret-value-12345";

let fixtureRoot = "";

function git(args: string[]) {
  return execFileSync("git", args, {
    cwd: fixtureRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  }).trim();
}

function write(relativePath: string, content: string) {
  const absolutePath = path.join(fixtureRoot, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content);
}

function finding() {
  return {
    schemaVersion: 1,
    status: "finding",
    title: "returns the fallback for an empty queue",
    confidence: 0.95,
    category: "boundary-condition",
    evidence: [
      {
        file: "src/domain/example.ts",
        startLine: 1,
        endLine: 3,
        reason: "The empty branch returns a stale value."
      }
    ],
    expectedBehavior: "an empty queue returns the safe fallback",
    actualBehavior: "an empty queue returns the stale value",
    reproduction: { testFile, testName },
    productionFiles: ["src/domain/example.ts"],
    risk: "low"
  };
}

function candidate() {
  return {
    schemaVersion: 1,
    status: "regression-test",
    testFile,
    testName,
    source: `import { expect, it } from "vitest";
import { readEmptyQueue } from "./example";

it("${testName}", () => {
  expect(
    readEmptyQueue(),
    "Expected behavior: ${finding().expectedBehavior} | Actual behavior: ${finding().actualBehavior}",
  ).toBe("safe");
});
`
  };
}

function initializeFixture() {
  fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "jabiko-red-stage-"));
  git(["init", "-q"]);
  git(["config", "user.email", "fixture@example.test"]);
  git(["config", "user.name", "Fixture"]);
  write(".gitignore", ".tmp/\nnode_modules\n");
  write(
    "package.json",
    JSON.stringify({
      name: "red-stage-fixture",
      private: true,
      type: "module",
      packageManager: "pnpm@10.33.0"
    }, null, 2) + "\n"
  );
  write(
    "src/domain/example.ts",
    'import fs from "node:fs";\n' +
    'import path from "node:path";\n' +
    `export function readEmptyQueue() {\n  return "${fakeSecret}";\n}\n` +
    "export function crashWorker() {\n  process.exit(1);\n}\n" +
    "export function triggerUnhandled() {\n" +
    '  void Promise.reject(new Error("production background failure"));\n' +
    "}\n" +
    "export function tamperProductionOnReplay() {\n" +
    '  const patch = path.join(process.cwd(), ".tmp/gemini-correctness/red-test.patch");\n' +
    "  if (fs.existsSync(patch)) {\n" +
    '    fs.appendFileSync(path.join(process.cwd(), "src/domain/example.ts"), "// replay tamper\\n");\n' +
    "  }\n" +
    "}\n" +
    "export function tamperProductionOnInitial() {\n" +
    '  const patch = path.join(process.cwd(), ".tmp/gemini-correctness/red-test.patch");\n' +
    "  if (!fs.existsSync(patch)) {\n" +
    '    fs.appendFileSync(path.join(process.cwd(), "src/domain/example.ts"), "// initial tamper\\n");\n' +
    "  }\n" +
    "}\n" +
    "export function writeIgnoredFileOnInitial() {\n" +
    '  const patch = path.join(process.cwd(), ".tmp/gemini-correctness/red-test.patch");\n' +
    "  if (!fs.existsSync(patch)) {\n" +
    '    fs.writeFileSync(path.join(process.cwd(), ".tmp/gemini-correctness/hostile.bin"), "pollution");\n' +
    "  }\n" +
    "}\n" +
    "export function tamperGitConfigOnInitial() {\n" +
    '  const patch = path.join(process.cwd(), ".tmp/gemini-correctness/red-test.patch");\n' +
    "  if (!fs.existsSync(patch)) {\n" +
    '    fs.appendFileSync(path.join(process.cwd(), ".git/config"), "\\n[hostile]\\n\\tvalue = true\\n");\n' +
    "  }\n" +
    "}\n" +
    "export function tamperPatchOnReplay() {\n" +
    '  const patch = path.join(process.cwd(), ".tmp/gemini-correctness/red-test.patch");\n' +
    '  if (fs.existsSync(patch)) fs.appendFileSync(patch, "\\n# replay tamper\\n");\n' +
    "}\n" +
    "export function delayedWriteOnInitial() {\n" +
    "  setTimeout(() => {\n" +
    '    fs.writeFileSync(path.join(process.cwd(), "leaked-trace.txt"), "grandchild wrote");\n' +
    "  }, 800);\n" +
    "}\n"
  );
  write(
    "src/domain/example.test.ts",
    'import { expect, it } from "vitest";\nit("keeps existing tests", () => expect(true).toBe(true));\n'
  );
  git([
    "add",
    ".gitignore",
    "package.json",
    "src/domain/example.ts",
    "src/domain/example.test.ts"
  ]);
  git(["commit", "-qm", "fixture baseline"]);
  fs.symlinkSync(path.join(projectRoot, "node_modules"), path.join(fixtureRoot, "node_modules"));
}

describe("runGuardedTargetedVitest", () => {
  it("fails closed without restoring when the post-run snapshot cannot be captured", async () => {
    const before = {
      entries: new Map(),
      repoRoot: "/unused",
      testFile,
      reportPath: "/unused/report.json",
      restorable: true
    };
    const snapshot = vi.fn()
      .mockReturnValueOnce(before)
      .mockImplementationOnce(() => {
        throw new Error("fixture post-run snapshot failure");
      });
    const restoreSnapshot = vi.fn(() => ({ valid: true, mutated: false }));

    const result = await runGuardedTargetedVitest(
      {},
      {
        snapshot,
        targetedRunner: vi.fn(async () => ({ exitCode: 1 })),
        restoreSnapshot
      }
    );

    expect(result).toEqual({
      valid: false,
      error: "failed to capture repository state after targeted Vitest"
    });
    expect(snapshot).toHaveBeenCalledTimes(2);
    expect(restoreSnapshot).not.toHaveBeenCalled();
  });
});

// These cases spawn real git / vitest subprocesses, so wall time tracks
// machine load; the default 5s per-test timeout flakes when the full suite
// runs in parallel. 30s is headroom, not a behavioural change.
describe("runRedStage integration", { timeout: 30_000 }, () => {
  beforeEach(() => initializeFixture());
  afterEach(() => {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  });

  it("proves, preserves, resets, replays, and re-proves one assertion RED", async () => {
    const baselineSha = git(["rev-parse", "HEAD"]);
    const client = {
      generateJson: vi.fn().mockResolvedValue({
        valid: true,
        result: candidate()
      })
    };

    const result = await runRedStage({
      repoRoot: fixtureRoot,
      finding: finding(),
      client,
      environment: {
        ...process.env,
        FIXTURE_SECRET: fakeSecret
      }
    });

    expect(result, result.error).toMatchObject({ valid: true });
    expect(result.result).toMatchObject({
      schemaVersion: 1,
      status: "red-confirmed",
      baselineSha,
      testFile,
      testName,
      failureKind: "assertion",
      replayConfirmed: true
    });
    expect(client.generateJson).toHaveBeenCalledTimes(1);
    expect(git(["status", "--porcelain=v1", "--untracked-files=all"]))
      .toBe(`?? ${testFile}`);

    const artifactDir = path.join(fixtureRoot, ".tmp", "gemini-correctness");
    const patch = fs.readFileSync(path.join(artifactDir, "red-test.patch"), "utf8");
    const log = fs.readFileSync(path.join(artifactDir, "red-test.log"), "utf8");
    const savedResult = JSON.parse(
      fs.readFileSync(path.join(artifactDir, "red-result.json"), "utf8")
    );

    expect(savedResult).toEqual(result.result);
    expect(savedResult.patchSha256).toBe(
      createHash("sha256").update(patch).digest("hex")
    );
    expect(patch).toContain(`b/${testFile}`);
    expect(log).toContain("[initial]");
    expect(log).toContain("[replay]");
    expect(log).not.toContain(fakeSecret);
    expect(log).not.toContain(fixtureRoot);
    expect(log).not.toContain(projectRoot);
    expect(JSON.stringify(savedResult)).not.toContain(fakeSecret);
    expect(JSON.stringify(savedResult)).not.toContain(fixtureRoot);
  });

  it("preserves RED contract fields when GITHUB_SHA matches baselineSha", async () => {
    const baselineSha = git(["rev-parse", "HEAD"]);
    const leakToken = "should-be-redacted-in-log-abc123";
    const client = {
      generateJson: vi.fn().mockResolvedValue({
        valid: true,
        result: candidate()
      })
    };

    const result = await runRedStage({
      repoRoot: fixtureRoot,
      finding: finding(),
      client,
      environment: {
        ...process.env,
        GITHUB_SHA: baselineSha,
        LEAK_TOKEN: leakToken,
        FIXTURE_SECRET: fakeSecret
      }
    });

    expect(result, result.error).toMatchObject({ valid: true });
    expect(result.result).toMatchObject({
      schemaVersion: 1,
      status: "red-confirmed",
      baselineSha,
      testFile,
      testName,
      failureKind: "assertion",
      replayConfirmed: true
    });
    expect(result.result.patchSha256).toMatch(/^[0-9a-f]{64}$/);

    const savedResult = JSON.parse(
      fs.readFileSync(path.join(fixtureRoot, ".tmp/gemini-correctness/red-result.json"), "utf8")
    );
    expect(savedResult.baselineSha).toBe(baselineSha);
    expect(savedResult.patchSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(savedResult)).not.toContain(leakToken);
    expect(JSON.stringify(savedResult)).not.toContain(fakeSecret);
    expect(JSON.stringify(savedResult)).not.toContain(fixtureRoot);

    const log = fs.readFileSync(path.join(fixtureRoot, ".tmp/gemini-correctness/red-test.log"), "utf8");
    expect(log).not.toContain(leakToken);
    expect(log).not.toContain(fakeSecret);
    expect(log).not.toContain(fixtureRoot);
  });

  it("replays successfully when the summary contains a long general environment value", async () => {
    const baselineSha = git(["rev-parse", "HEAD"]);
    const envValue = "production-value-abc"; // length >= 8, not a KEY/TOKEN/SECRET name
    const envTestName = `returns the ${envValue} safe fallback for an empty queue`;
    const longEnvFinding = {
      ...finding(),
      reproduction: { testFile, testName: envTestName },
      expectedBehavior: `an empty queue returns the ${envValue} fallback`,
      actualBehavior: `an empty queue returns a stale ${envValue} value`
    };
    const longEnvCandidate = {
      ...candidate(),
      testName: envTestName,
      source: candidate().source
        .replace(testName, envTestName)
        .replace(
          `Expected behavior: ${finding().expectedBehavior} | Actual behavior: ${finding().actualBehavior}`,
          `Expected behavior: ${longEnvFinding.expectedBehavior} | Actual behavior: ${longEnvFinding.actualBehavior}`
        )
    };
    const client = {
      generateJson: vi.fn().mockResolvedValue({
        valid: true,
        result: longEnvCandidate
      })
    };

    const result = await runRedStage({
      repoRoot: fixtureRoot,
      finding: longEnvFinding,
      client,
      environment: {
        ...process.env,
        NODE_ENV: envValue,
        SOME_LONG_VAR: envValue
      }
    });

    expect(result, result.error).toMatchObject({ valid: true });
    expect(result.result).toMatchObject({
      schemaVersion: 1,
      status: "red-confirmed",
      baselineSha,
      testName: envTestName,
      replayConfirmed: true
    });

    // The env value is not a KEY/TOKEN/SECRET-named secret, so the candidate
    // is accepted, but the output-side redaction (output: true) still treats
    // long env values as sensitive, so the summary and log must be redacted.
    // testName is a preserved RED contract field (needed for exact replay
    // matching), so it intentionally keeps the raw value.
    const savedResult = JSON.parse(
      fs.readFileSync(path.join(fixtureRoot, ".tmp/gemini-correctness/red-result.json"), "utf8")
    );
    expect(savedResult.testName).toBe(envTestName);
    expect(savedResult.sanitizedSummary).not.toContain(envValue);
    expect(savedResult.sanitizedSummary).toContain("REDACTED_KEY");
    const log = fs.readFileSync(path.join(fixtureRoot, ".tmp/gemini-correctness/red-test.log"), "utf8");
    expect(log).not.toContain(envValue);
  });

  it("rejects a genuinely tampered replay summary even after sanitization", async () => {
    const baselineSha = git(["rev-parse", "HEAD"]);
    const envValue = "production-value-abc";
    const longEnvFinding = {
      ...finding(),
      expectedBehavior: `an empty queue returns the ${envValue} fallback`,
      actualBehavior: `an empty queue returns a stale ${envValue} value`
    };
    const longEnvCandidate = {
      ...candidate(),
      source: candidate().source
        .replace(
          `Expected behavior: ${finding().expectedBehavior} | Actual behavior: ${finding().actualBehavior}`,
          `Expected behavior: ${longEnvFinding.expectedBehavior} | Actual behavior: ${longEnvFinding.actualBehavior}`
        )
    };
    const client = {
      generateJson: vi.fn().mockResolvedValue({
        valid: true,
        result: longEnvCandidate
      })
    };

    const stage = await runRedStage({
      repoRoot: fixtureRoot,
      finding: longEnvFinding,
      client,
      environment: { ...process.env, NODE_ENV: envValue, SOME_LONG_VAR: envValue }
    });
    expect(stage, stage.error).toMatchObject({ valid: true });

    const artifactDir = path.join(fixtureRoot, ".tmp", "gemini-correctness");
    const resultPath = path.join(artifactDir, "red-result.json");
    const originalResult = JSON.parse(fs.readFileSync(resultPath, "utf8"));
    const reset = resetRedWorktree({ repoRoot: fixtureRoot, baselineSha, testFile });
    expect(reset.valid).toBe(true);

    fs.writeFileSync(resultPath, JSON.stringify({
      ...originalResult,
      sanitizedSummary: "tampered-summary"
    }));
    expect((await replayRedArtifacts({
      repoRoot: fixtureRoot,
      finding: longEnvFinding,
      environment: { ...process.env, NODE_ENV: envValue, SOME_LONG_VAR: envValue },
      expectedBaselineSha: baselineSha,
      expectedPatchSha256: originalResult.patchSha256,
      expectedSummary: stage.result.sanitizedSummary
    })).valid).toBe(false);
    expect(git(["status", "--porcelain=v1", "--untracked-files=all"])).toBe("");
  });

  it.each([
    ["unstaged production and untracked files", () => {
      write("src/domain/example.ts", "modified production\n");
      write("src/domain/extra.ts", "untracked\n");
    }],
    ["staged and untracked files", () => {
      write("src/domain/staged.ts", "staged\n");
      git(["add", "src/domain/staged.ts"]);
      write("src/domain/extra.ts", "untracked\n");
    }],
    ["an existing test modification", () => {
      write("src/domain/example.test.ts", "modified existing test\n");
    }],
    ["a Windows-separator filename", () => {
      write("hostile\\name.tmp", "untracked\n");
    }]
  ])("rejects and cleans model-side %s", async (_label, sideEffect) => {
    const baselineSha = git(["rev-parse", "HEAD"]);
    const client = {
      generateJson: vi.fn().mockImplementation(async () => {
        sideEffect();
        return { valid: true, result: candidate() };
      })
    };

    const result = await runRedStage({
      repoRoot: fixtureRoot,
      finding: finding(),
      client,
      environment: process.env
    });

    expect(result.valid).toBe(false);
    expect(git(["rev-parse", "HEAD"])).toBe(baselineSha);
    expect(git(["status", "--porcelain=v1", "--untracked-files=all"])).toBe("");
  });

  it("rejects replay-side mutation of stored patch and restores baseline",
    async () => {
    const baselineSha = git(["rev-parse", "HEAD"]);
    const hostileCandidate = candidate();
    hostileCandidate.source = hostileCandidate.source
      .replace(
        'import { readEmptyQueue } from "./example";',
        `import { readEmptyQueue, tamperPatchOnReplay } from "./example";`
      )
      .replace(
        "  expect(\n",
        "  tamperPatchOnReplay();\n  expect(\n"
      );
    const client = {
      generateJson: vi.fn().mockResolvedValue({
        valid: true,
        result: hostileCandidate
      })
    };

    const result = await runRedStage({
      repoRoot: fixtureRoot,
      finding: finding(),
      client,
      environment: process.env
    });

    expect(result.valid).toBe(false);
    expect(git(["rev-parse", "HEAD"])).toBe(baselineSha);
    expect(git(["status", "--porcelain=v1", "--untracked-files=all"])).toBe("");
  });

  it("rejects initial-execution production mutation and restores baseline", async () => {
    const baselineSha = git(["rev-parse", "HEAD"]);
    const hostileCandidate = candidate();
    hostileCandidate.source = hostileCandidate.source
      .replace(
        'import { readEmptyQueue } from "./example";',
        'import { readEmptyQueue, tamperProductionOnInitial } from "./example";'
      )
      .replace(
        "  expect(\n",
        "  tamperProductionOnInitial();\n  expect(\n"
      );
    const client = {
      generateJson: vi.fn().mockResolvedValue({
        valid: true,
        result: hostileCandidate
      })
    };

    const result = await runRedStage({
      repoRoot: fixtureRoot,
      finding: finding(),
      client,
      environment: process.env
    });

    expect(result.valid).toBe(false);
    expect(git(["rev-parse", "HEAD"])).toBe(baselineSha);
    expect(git(["status", "--porcelain=v1", "--untracked-files=all"])).toBe("");
  });

  it("rejects and removes ignored-path pollution from test execution", async () => {
    const hostilePath = path.join(
      fixtureRoot,
      ".tmp",
      "gemini-correctness",
      "hostile.bin"
    );
    const hostileCandidate = candidate();
    hostileCandidate.source = hostileCandidate.source
      .replace(
        'import { readEmptyQueue } from "./example";',
        'import { readEmptyQueue, writeIgnoredFileOnInitial } from "./example";'
      )
      .replace(
        "  expect(\n",
        "  writeIgnoredFileOnInitial();\n  expect(\n"
      );
    const client = {
      generateJson: vi.fn().mockResolvedValue({
        valid: true,
        result: hostileCandidate
      })
    };

    const result = await runRedStage({
      repoRoot: fixtureRoot,
      finding: finding(),
      client,
      environment: process.env
    });

    expect(result.valid).toBe(false);
    expect(fs.existsSync(hostilePath)).toBe(false);
    expect(git(["status", "--porcelain=v1", "--untracked-files=all"])).toBe("");
  });

  it("rejects and restores Git metadata mutation from test execution", async () => {
    const configPath = path.join(fixtureRoot, ".git", "config");
    const originalConfig = fs.readFileSync(configPath, "utf8");
    const hostileCandidate = candidate();
    hostileCandidate.source = hostileCandidate.source
      .replace(
        'import { readEmptyQueue } from "./example";',
        'import { readEmptyQueue, tamperGitConfigOnInitial } from "./example";'
      )
      .replace(
        "  expect(\n",
        "  tamperGitConfigOnInitial();\n  expect(\n"
      );
    const client = {
      generateJson: vi.fn().mockResolvedValue({
        valid: true,
        result: hostileCandidate
      })
    };

    const result = await runRedStage({
      repoRoot: fixtureRoot,
      finding: finding(),
      client,
      environment: process.env
    });

    expect(result.valid).toBe(false);
    expect(fs.readFileSync(configPath, "utf8")).toBe(originalConfig);
    expect(git(["status", "--porcelain=v1", "--untracked-files=all"])).toBe("");
  });

  it.each([
    [
      "import failure",
      () => ({
        ...candidate(),
        source: candidate().source.replace(
          'import { readEmptyQueue } from "./example";',
          'import { readEmptyQueue } from "./missing";'
        )
      }),
      undefined
    ],
    [
      "non-assertion runtime error",
      () => ({
        ...candidate(),
        source: candidate().source.replace(
          "expect(\n    readEmptyQueue(),",
          `const broken: null = null;\n  // ${finding().expectedBehavior} | ${finding().actualBehavior}\n  broken.value;\n  expect(\n    readEmptyQueue(),`
        )
      }),
      undefined
    ],
    [
      "unhandled rejection beside an assertion",
      () => ({
        ...candidate(),
        source: candidate().source
          .replace(
            'import { readEmptyQueue } from "./example";',
            'import { readEmptyQueue, triggerUnhandled } from "./example";'
          )
          .replace(
            "expect(\n    readEmptyQueue(),",
            "triggerUnhandled();\n  expect(\n    readEmptyQueue(),"
          )
      }),
      undefined
    ],
    [
      "process timeout",
      () => ({
        ...candidate(),
        source: candidate().source.replace(
          `it("${testName}", () => {`,
          `it("${testName}", async () => {\n  await new Promise(() => {});`
        )
      }),
      500
    ],
    [
      "worker crash",
      () => ({
        ...candidate(),
        source: candidate().source
          .replace(
            'import { readEmptyQueue } from "./example";',
            'import { crashWorker, readEmptyQueue } from "./example";'
          )
          .replace(
            "expect(\n    readEmptyQueue(),",
            "crashWorker();\n  expect(\n    readEmptyQueue(),"
          )
      }),
      5_000
    ]
  ])("rejects and cleans a %s", async (_label, makeCandidate, testTimeoutMs) => {
    const baselineSha = git(["rev-parse", "HEAD"]);
    const client = {
      generateJson: vi.fn().mockResolvedValue({
        valid: true,
        result: makeCandidate()
      })
    };

    const result = await runRedStage({
      repoRoot: fixtureRoot,
      finding: finding(),
      client,
      environment: process.env,
      testTimeoutMs
    });

    expect(result.valid).toBe(false);
    expect(git(["rev-parse", "HEAD"])).toBe(baselineSha);
    expect(git(["status", "--porcelain=v1", "--untracked-files=all"])).toBe("");
  });

  it("kills the full process tree on timeout so a delayed grandchild cannot pollute the repository", async () => {
    const baselineSha = git(["rev-parse", "HEAD"]);
    const client = {
      generateJson: vi.fn().mockResolvedValue({
        valid: true,
        result: {
          ...candidate(),
          source: candidate().source
            .replace(
              'import { readEmptyQueue } from "./example";',
              'import { delayedWriteOnInitial, readEmptyQueue } from "./example";'
            )
            .replace(
              `it("${testName}", () => {`,
              `it("${testName}", async () => {\n  delayedWriteOnInitial();\n  await new Promise(() => {});`
            )
        }
      })
    };

    const result = await runRedStage({
      repoRoot: fixtureRoot,
      finding: finding(),
      client,
      environment: process.env,
      testTimeoutMs: 500
    });

    expect(result.valid).toBe(false);
    expect(git(["rev-parse", "HEAD"])).toBe(baselineSha);

    // Allow any surviving grandchild enough time to attempt its delayed write.
    await new Promise(resolve => setTimeout(resolve, 1_500));

    expect(git(["status", "--porcelain=v1", "--untracked-files=all"])).toBe("");
    expect(
      fs.existsSync(path.join(fixtureRoot, "leaked-trace.txt"))
    ).toBe(false);
  });

  it("rejects tampered baseline, hash, or coordinated replay content", async () => {
    const baselineSha = git(["rev-parse", "HEAD"]);
    const client = {
      generateJson: vi.fn().mockResolvedValue({
        valid: true,
        result: candidate()
      })
    };
    const stage = await runRedStage({
      repoRoot: fixtureRoot,
      finding: finding(),
      client,
      environment: process.env
    });
    expect(stage, stage.error).toMatchObject({ valid: true });

    const artifactDir = path.join(fixtureRoot, ".tmp", "gemini-correctness");
    const patchPath = path.join(artifactDir, "red-test.patch");
    const resultPath = path.join(artifactDir, "red-result.json");
    const originalPatch = fs.readFileSync(patchPath, "utf8");
    const originalResult = JSON.parse(fs.readFileSync(resultPath, "utf8"));
    const reset = resetRedWorktree({ repoRoot: fixtureRoot, baselineSha, testFile });
    expect(reset.valid).toBe(true);

    const expectations = {
      expectedBaselineSha: baselineSha,
      expectedPatchSha256: originalResult.patchSha256,
      expectedSummary: originalResult.sanitizedSummary
    };

    fs.writeFileSync(resultPath, JSON.stringify({
      ...originalResult,
      baselineSha: "0".repeat(40)
    }));
    expect((await replayRedArtifacts({
      repoRoot: fixtureRoot,
      finding: finding(),
      environment: process.env,
      ...expectations
    })).valid).toBe(false);
    expect(git(["status", "--porcelain=v1", "--untracked-files=all"])).toBe("");

    fs.writeFileSync(resultPath, JSON.stringify({
      ...originalResult,
      patchSha256: "f".repeat(64)
    }));
    expect((await replayRedArtifacts({
      repoRoot: fixtureRoot,
      finding: finding(),
      environment: process.env,
      ...expectations
    })).valid).toBe(false);
    expect(git(["status", "--porcelain=v1", "--untracked-files=all"])).toBe("");

    const tamperedPatch = originalPatch.replace('.toBe("safe")', '.toBe("tampered")');
    fs.writeFileSync(patchPath, tamperedPatch);
    fs.writeFileSync(resultPath, JSON.stringify({
      ...originalResult,
      patchSha256: createHash("sha256").update(tamperedPatch).digest("hex")
    }));
    expect((await replayRedArtifacts({
      repoRoot: fixtureRoot,
      finding: finding(),
      environment: process.env,
      ...expectations
    })).valid).toBe(false);
    expect(git(["status", "--porcelain=v1", "--untracked-files=all"])).toBe("");
  });

  it("redacts rejection errors and artifacts without leaking environment or paths", async () => {
    const shortSecret = "tiny!";
    const client = {
      generateJson: vi.fn().mockResolvedValue({
        valid: false,
        error:
          `failed with ${fakeSecret} and ${shortSecret} ` +
          `at ${fixtureRoot} via ${projectRoot}`
      })
    };
    const result = await runRedStage({
      repoRoot: fixtureRoot,
      finding: finding(),
      client,
      environment: {
        ...process.env,
        FIXTURE_SECRET: fakeSecret,
        API_KEY: shortSecret
      }
    });

    expect(result.valid).toBe(false);
    expect(result.error).not.toContain(fakeSecret);
    expect(result.error).not.toContain(shortSecret);
    expect(result.error).not.toContain(fixtureRoot);
    expect(result.error).not.toContain(projectRoot);
    expect(git(["status", "--porcelain=v1", "--untracked-files=all"])).toBe("");

    const artifactDir = path.join(fixtureRoot, ".tmp", "gemini-correctness");
    for (const artifact of ["red-result.json", "red-test.log"]) {
      const content = fs.readFileSync(path.join(artifactDir, artifact), "utf8");
      expect(content).not.toContain(fakeSecret);
      expect(content).not.toContain(shortSecret);
      expect(content).not.toContain(fixtureRoot);
      expect(content).not.toContain(projectRoot);
    }
  });

  it("rejects unsafe artifact symlinks without writing outside or leaving changes", async () => {
    const artifactDir = path.join(fixtureRoot, ".tmp", "gemini-correctness");
    const outsideLog = path.join(fixtureRoot, "outside-red-test.log");
    fs.mkdirSync(artifactDir, { recursive: true });
    fs.symlinkSync(outsideLog, path.join(artifactDir, "red-test.log"));
    const client = {
      generateJson: vi.fn().mockResolvedValue({
        valid: true,
        result: candidate()
      })
    };

    const result = await runRedStage({
      repoRoot: fixtureRoot,
      finding: finding(),
      client,
      environment: process.env
    });

    expect(result.valid).toBe(false);
    expect(fs.existsSync(outsideLog)).toBe(false);
    expect(git(["status", "--porcelain=v1", "--untracked-files=all"])).toBe("");
  });

  it("replays with the caller's allowlist/protectedPaths instead of reverting to defaults", async () => {
    const policyTestFile = "src/domain/types.regression.test.ts";
    const policyTestName = "replays with the caller path policy";
    const policyFinding = {
      schemaVersion: 1,
      status: "finding",
      title: "replays with the caller path policy",
      confidence: 0.95,
      category: "boundary-condition",
      evidence: [
        { file: "src/domain/types.ts", startLine: 1, endLine: 1, reason: "r" }
      ],
      expectedBehavior: "types returns the safe fallback",
      actualBehavior: "types returns the stale value",
      reproduction: { testFile: policyTestFile, testName: policyTestName },
      productionFiles: ["src/domain/types.ts"],
      risk: "low"
    };
    write(
      "src/domain/types.ts",
      "export function readTypes() { return \"types\"; }\n"
    );
    git(["add", "src/domain/types.ts"]);
    git(["commit", "-qm", "add protected-by-default production file"]);
    const baselineSha = git(["rev-parse", "HEAD"]);

    const policyCandidate = {
      schemaVersion: 1,
      status: "regression-test",
      testFile: policyTestFile,
      testName: policyTestName,
      source: `import { expect, it } from "vitest";
import { readTypes } from "./types";

it("${policyTestName}", () => {
  expect(
    readTypes(),
    "Expected behavior: ${policyFinding.expectedBehavior} | Actual behavior: ${policyFinding.actualBehavior}",
  ).toBe("safe");
});
`
    };
    const client = {
      generateJson: vi.fn().mockResolvedValue({
        valid: true,
        result: policyCandidate
      })
    };

    const result = await runRedStage({
      repoRoot: fixtureRoot,
      finding: policyFinding,
      client,
      environment: process.env,
      allowlist: ["src/domain/**"],
      protectedPaths: []
    });

    expect(result, result.error).toMatchObject({
      valid: true,
      result: { status: "red-confirmed", baselineSha, replayConfirmed: true }
    });
    // The regression test file is the stage's output and intentionally stays
    // untracked, exactly like the "proves, preserves, resets, replays" case.
    expect(git(["status", "--porcelain=v1", "--untracked-files=all"]))
      .toBe(`?? ${policyTestFile}`);
  });
});
