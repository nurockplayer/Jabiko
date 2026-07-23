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
  it("fails closed without restoring when the post-run snapshot cannot be captured", () => {
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

    const result = runGuardedTargetedVitest(
      {},
      {
        snapshot,
        targetedRunner: vi.fn(() => ({ exitCode: 1 })),
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

describe("runRedStage integration", () => {
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

  it.each([
    ["tracked production", "tamperProductionOnReplay"],
    ["stored patch", "tamperPatchOnReplay"]
  ])("rejects replay-side mutation of %s and restores baseline", async (
    _label,
    helperName
  ) => {
    const baselineSha = git(["rev-parse", "HEAD"]);
    const hostileCandidate = candidate();
    hostileCandidate.source = hostileCandidate.source
      .replace(
        'import { readEmptyQueue } from "./example";',
        `import { readEmptyQueue, ${helperName} } from "./example";`
      )
      .replace(
        "  expect(\n",
        `  ${helperName}();\n  expect(\n`
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
    expect(replayRedArtifacts({
      repoRoot: fixtureRoot,
      finding: finding(),
      environment: process.env,
      ...expectations
    }).valid).toBe(false);
    expect(git(["status", "--porcelain=v1", "--untracked-files=all"])).toBe("");

    fs.writeFileSync(resultPath, JSON.stringify({
      ...originalResult,
      patchSha256: "f".repeat(64)
    }));
    expect(replayRedArtifacts({
      repoRoot: fixtureRoot,
      finding: finding(),
      environment: process.env,
      ...expectations
    }).valid).toBe(false);
    expect(git(["status", "--porcelain=v1", "--untracked-files=all"])).toBe("");

    const tamperedPatch = originalPatch.replace('.toBe("safe")', '.toBe("tampered")');
    fs.writeFileSync(patchPath, tamperedPatch);
    fs.writeFileSync(resultPath, JSON.stringify({
      ...originalResult,
      patchSha256: createHash("sha256").update(tamperedPatch).digest("hex")
    }));
    expect(replayRedArtifacts({
      repoRoot: fixtureRoot,
      finding: finding(),
      environment: process.env,
      ...expectations
    }).valid).toBe(false);
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
});
