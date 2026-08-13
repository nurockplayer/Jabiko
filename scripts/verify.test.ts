import { describe, expect, it } from "vitest";
// @ts-expect-error -- plain .mjs tooling module, no types
import { collectChangedPaths, commandsFor } from "./verify.mjs";
// @ts-expect-error -- plain .mjs tooling module, no types
import { selectVerification } from "./select-verification.mjs";

describe("collectChangedPaths", () => {
  // fakeGit maps each of the three git queries to a controllable result.
  // Order matters: the staged query contains "--cached" AND "git diff", so
  // "--cached" must be matched before "git diff".
  const fakeGit = (branch: string | null, staged: string | null, worktree: string | null) =>
    (cmd: string) => {
      if (cmd.includes("--cached")) return staged;
      if (cmd.includes("git diff")) return branch;
      if (cmd.includes("git ls-files")) return worktree;
      return null;
    };

  it("unions branch + staged + worktree sources, dedupes, sorts", () => {
    const exec = fakeGit("a.ts\nb.ts\n", "b.ts\nc.ts\n", "c.ts\nd.ts\n");
    expect(collectChangedPaths(exec, "origin/main")).toEqual(["a.ts", "b.ts", "c.ts", "d.ts"]);
  });

  it("detects a staged-only production change", () => {
    const exec = fakeGit("", "src/components/MoreMenu.tsx\n", "");
    expect(collectChangedPaths(exec, "origin/main")).toEqual(["src/components/MoreMenu.tsx"]);
  });

  it("detects a staged-only i18n change and final L3 retains check:i18n", () => {
    const exec = fakeGit("", "src/locales/en.ts\n", "");
    const changed = collectChangedPaths(exec, "origin/main");
    expect(changed).toEqual(["src/locales/en.ts"]);
    const plan = selectVerification(changed, { forceL3: true });
    expect(plan.level).toBe("L3");
    expect(plan.commands).toEqual(["lint", "test", "build", "check:i18n"]);
  });

  it("returns [] for a genuinely clean tree (all three empty)", () => {
    const exec = fakeGit("", "", "");
    expect(collectChangedPaths(exec, "origin/main")).toEqual([]);
  });

  it("throws when the base diff fails (missing/invalid base) — fail safe", () => {
    const exec = fakeGit(null, "", "");
    expect(() => collectChangedPaths(exec, "main")).toThrow(/base ref/i);
  });

  it("throws when staged enumeration fails — fail safe", () => {
    const exec = fakeGit("", null, "");
    expect(() => collectChangedPaths(exec, "main")).toThrow(/staged/i);
  });

  it("throws when working-tree enumeration fails — fail safe", () => {
    const exec = fakeGit("", "", null);
    expect(() => collectChangedPaths(exec, "main")).toThrow(/ls-files/i);
  });

  it("passes --no-renames to both git diff commands (rename sides preserved)", () => {
    const calls: string[] = [];
    const exec = (cmd: string) => {
      calls.push(cmd);
      if (cmd.includes("--cached")) return "";
      if (cmd.includes("git diff")) return "src/App.tsx\nsrc/moved/App.tsx\n";
      if (cmd.includes("git ls-files")) return "";
      return null;
    };
    const paths = collectChangedPaths(exec, "origin/main");
    expect(paths).toEqual(["src/App.tsx", "src/moved/App.tsx"]);
    const diffCmds = calls.filter((c) => c.includes("git diff"));
    expect(diffCmds.length).toBe(2); // branch + staged
    for (const c of diffCmds) expect(c).toContain("--no-renames");
  });

  it("handles a staged rename (both old and new paths)", () => {
    const exec = fakeGit("", "src/i18n.ts\ndocs/foo.md\n", "");
    expect(collectChangedPaths(exec, "origin/main")).toEqual(["docs/foo.md", "src/i18n.ts"]);
  });
});

describe("commandsFor", () => {
  const exists = (p: string) => !p.includes("Missing");

  it("L1: single vitest run over existing tests, no gate", () => {
    const plan = { level: "L1", tests: ["src/domain/a.test.ts", "src/domain/Missing.test.ts"], commands: [] };
    const items = commandsFor(plan, { exists });
    expect(items).toEqual([{ kind: "vitest", files: ["src/domain/a.test.ts"] }]);
  });

  it("L2: vitest over affected tests, then gate scripts", () => {
    const plan = {
      level: "L2",
      tests: ["src/domain/contentStats.test.ts"],
      commands: ["check:exam", "check:i18n"]
    };
    const items = commandsFor(plan, { exists });
    expect(items).toEqual([
      { kind: "vitest", files: ["src/domain/contentStats.test.ts"] },
      { kind: "gate", cmd: "check:exam" },
      { kind: "gate", cmd: "check:i18n" }
    ]);
  });

  it("L3: full gates in canonical order (lint → test → build → path gates)", () => {
    const plan = { level: "L3", tests: [], commands: ["lint", "test", "build", "check:i18n"] };
    const items = commandsFor(plan, { exists });
    expect(items).toEqual([
      { kind: "gate", cmd: "lint" },
      { kind: "gate", cmd: "test" },
      { kind: "gate", cmd: "build" },
      { kind: "gate", cmd: "check:i18n" }
    ]);
  });

  it("L1 with no existing tests yields no commands (nothing to run)", () => {
    const plan = { level: "L1", tests: ["src/domain/Missing.test.ts"], commands: [] };
    expect(commandsFor(plan, { exists })).toEqual([]);
  });
});
