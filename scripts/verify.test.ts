import { describe, expect, it } from "vitest";
// @ts-expect-error -- plain .mjs tooling module, no types
import { collectChangedPaths, commandsFor } from "./verify.mjs";

describe("collectChangedPaths", () => {
  it("unions branch commits and working-tree changes, dedupes, sorts", () => {
    const fakeExec = (cmd: string) => {
      if (cmd.includes("git diff")) return "src/domain/a.ts\nsrc/components/B.tsx\n";
      if (cmd.includes("git ls-files")) return "src/components/B.tsx\nsrc/domain/c.test.ts\n";
      return null;
    };
    expect(collectChangedPaths(fakeExec, "origin/main")).toEqual([
      "src/components/B.tsx",
      "src/domain/a.ts",
      "src/domain/c.test.ts"
    ]);
  });

  it("returns [] when git reports nothing", () => {
    const fakeExec = () => null;
    expect(collectChangedPaths(fakeExec, "main")).toEqual([]);
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
