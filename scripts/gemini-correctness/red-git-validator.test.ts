import { afterEach, beforeEach, describe, expect, it } from "vitest";
// @ts-expect-error -- plain .mjs module, no types
import {
  captureCleanBaseline,
  createTestOnlyPatch,
  validateTestOnlyWorktree
} from "./red-validator.mjs";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const TEST_FILE = "src/domain/example.regression.test.ts";
const TEST_SOURCE = `import { expect, it } from "vitest";
it("demonstrates the bug", () => expect("actual").toBe("expected"));
`;

let fixtureRoot = "";

function git(args: string[], cwd = fixtureRoot) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  }).trim();
}

function write(relativePath: string, content: string | Buffer) {
  const absolutePath = path.join(fixtureRoot, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content);
}

function initializeFixture() {
  fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "jabiko-red-git-"));
  git(["init", "-q"]);
  git(["config", "user.email", "fixture@example.test"]);
  git(["config", "user.name", "Fixture"]);
  write(".gitignore", ".tmp/\nnode_modules/\n");
  write("src/domain/example.ts", 'export const value = "actual";\n');
  write(
    "src/domain/example.test.ts",
    'import { expect, it } from "vitest";\nit("existing", () => expect(true).toBe(true));\n'
  );
  git(["add", ".gitignore", "src/domain/example.ts", "src/domain/example.test.ts"]);
  git(["commit", "-qm", "fixture baseline"]);
}

describe("test-only worktree validation", () => {
  beforeEach(() => initializeFixture());
  afterEach(() => {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  });

  it("captures a clean baseline and creates one replayable added-file patch", () => {
    const baseline = captureCleanBaseline({
      repoRoot: fixtureRoot,
      testFile: TEST_FILE
    });
    expect(baseline.valid).toBe(true);

    write(TEST_FILE, TEST_SOURCE);
    const validation = validateTestOnlyWorktree({
      repoRoot: fixtureRoot,
      baselineSha: baseline.baselineSha,
      testFile: TEST_FILE
    });
    expect(validation).toEqual({ valid: true });

    const patch = createTestOnlyPatch({
      repoRoot: fixtureRoot,
      baselineSha: baseline.baselineSha,
      testFile: TEST_FILE
    });
    expect(patch.valid).toBe(true);
    expect(patch.patch).toContain("new file mode");
    expect(patch.patch).toContain(`b/${TEST_FILE}`);
    expect(git(["status", "--porcelain=v1", "--untracked-files=all"])).toBe(`?? ${TEST_FILE}`);
  });

  it.each([
    ["staged file", () => {
      write("src/domain/staged.ts", "staged\n");
      git(["add", "src/domain/staged.ts"]);
    }],
    ["unstaged file", () => {
      write("src/domain/example.ts", "modified\n");
    }],
    ["untracked file", () => {
      write("src/domain/extra.ts", "extra\n");
    }]
  ])("rejects a dirty baseline with a %s", (_label, arrange) => {
    arrange();
    const result = captureCleanBaseline({
      repoRoot: fixtureRoot,
      testFile: TEST_FILE
    });
    expect(result.valid).toBe(false);
  });

  it.each([
    ["a production modification", () => {
      write("src/domain/example.ts", "modified\n");
    }],
    ["an existing test modification", () => {
      write("src/domain/example.test.ts", "modified\n");
    }],
    ["an additional untracked file", () => {
      write("src/domain/extra.ts", "extra\n");
    }],
    ["a staged target", () => {
      git(["add", TEST_FILE]);
    }],
    ["a rename", () => {
      git(["mv", "src/domain/example.test.ts", "src/domain/renamed.test.ts"]);
    }],
    ["a binary file", () => {
      write("src/domain/extra.bin", Buffer.from([0, 1, 2, 3]));
    }]
  ])("rejects %s mixed with the candidate test", (_label, arrange) => {
    const baselineSha = git(["rev-parse", "HEAD"]);
    write(TEST_FILE, TEST_SOURCE);
    arrange();

    const result = validateTestOnlyWorktree({
      repoRoot: fixtureRoot,
      baselineSha,
      testFile: TEST_FILE
    });
    expect(result.valid).toBe(false);
  });

  it("rejects a submodule entry mixed with the candidate test", () => {
    const otherRepo = fs.mkdtempSync(path.join(os.tmpdir(), "jabiko-red-submodule-"));
    try {
      execFileSync("git", ["init", "-q"], { cwd: otherRepo });
      fs.writeFileSync(path.join(otherRepo, "README.md"), "submodule\n");
      execFileSync("git", ["add", "README.md"], { cwd: otherRepo });
      execFileSync(
        "git",
        ["-c", "user.email=fixture@example.test", "-c", "user.name=Fixture", "commit", "-qm", "submodule"],
        { cwd: otherRepo }
      );

      const baselineSha = git(["rev-parse", "HEAD"]);
      write(TEST_FILE, TEST_SOURCE);
      git([
        "-c",
        "protocol.file.allow=always",
        "submodule",
        "add",
        "-q",
        otherRepo,
        "vendor/submodule"
      ]);

      const result = validateTestOnlyWorktree({
        repoRoot: fixtureRoot,
        baselineSha,
        testFile: TEST_FILE
      });
      expect(result.valid).toBe(false);
    } finally {
      fs.rmSync(otherRepo, { recursive: true, force: true });
    }
  });

  it.each([
    ["a symlink", () => fs.symlinkSync("example.ts", path.join(fixtureRoot, TEST_FILE))],
    [
      "a dangling symlink",
      () => fs.symlinkSync("missing-target.ts", path.join(fixtureRoot, TEST_FILE))
    ]
  ])("rejects %s at the candidate path", (_label, arrange) => {
    const baselineSha = git(["rev-parse", "HEAD"]);
    arrange();

    const result = validateTestOnlyWorktree({
      repoRoot: fixtureRoot,
      baselineSha,
      testFile: TEST_FILE
    });
    expect(result.valid).toBe(false);
  });

  it("rejects a candidate path below a symlinked directory", () => {
    const baselineSha = git(["rev-parse", "HEAD"]);
    fs.mkdirSync(path.join(fixtureRoot, "outside"), { recursive: true });
    fs.symlinkSync(
      path.join(fixtureRoot, "outside"),
      path.join(fixtureRoot, "src", "domain", "linked")
    );
    write("outside/example.regression.test.ts", TEST_SOURCE);

    const result = validateTestOnlyWorktree({
      repoRoot: fixtureRoot,
      baselineSha,
      testFile: "src/domain/linked/example.regression.test.ts"
    });
    expect(result.valid).toBe(false);
  });
});
