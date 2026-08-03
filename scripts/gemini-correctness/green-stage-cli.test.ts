import { afterEach, beforeEach, describe, expect, it } from "vitest";
// @ts-expect-error -- plain .mjs module, no types
import { parseGreenStageArgs, resolveGreenInputs } from "./green-stage.mjs";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

let fixtureRoot = "";

describe("parseGreenStageArgs", () => {
  it("accepts only a bounded Gemini model identifier", () => {
    expect(parseGreenStageArgs(["--model", "gemini-2.5-flash"]))
      .toEqual({ model: "gemini-2.5-flash" });
  });

  it.each([
    ["--command", "sh -c true"],
    ["--finding", "../../finding.json"],
    ["--model", "https://attacker.invalid/model"],
    ["--unknown"]
  ])("rejects unsupported or unsafe argv starting with %s", (...argv) => {
    expect(() => parseGreenStageArgs(argv)).toThrow();
  });
});

describe("resolveGreenInputs", () => {
  beforeEach(() => {
    fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "jabiko-green-cli-"));
    fs.mkdirSync(
      path.join(fixtureRoot, ".tmp", "gemini-correctness"),
      { recursive: true }
    );
  });
  afterEach(() => {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  });

  it("resolves only the fixed finding and red-result artifacts", () => {
    const findingPath = path.join(
      fixtureRoot, ".tmp", "gemini-correctness", "finding.json"
    );
    const redPath = path.join(
      fixtureRoot, ".tmp", "gemini-correctness", "red-result.json"
    );
    fs.writeFileSync(findingPath, "{}\n");
    fs.writeFileSync(redPath, "{}\n");

    const result = resolveGreenInputs(fixtureRoot);
    expect(result.valid).toBe(true);
    expect(result.findingPath).toBe(fs.realpathSync(findingPath));
    expect(result.redResultPath).toBe(fs.realpathSync(redPath));
  });

  it("rejects a missing red-result artifact", () => {
    const findingPath = path.join(
      fixtureRoot, ".tmp", "gemini-correctness", "finding.json"
    );
    fs.writeFileSync(findingPath, "{}\n");

    expect(resolveGreenInputs(fixtureRoot).valid).toBe(false);
  });

  it("rejects a symlinked finding artifact", () => {
    const findingPath = path.join(
      fixtureRoot, ".tmp", "gemini-correctness", "finding.json"
    );
    const redPath = path.join(
      fixtureRoot, ".tmp", "gemini-correctness", "red-result.json"
    );
    const target = path.join(fixtureRoot, "outside.json");
    fs.writeFileSync(target, "{}\n");
    fs.writeFileSync(redPath, "{}\n");
    fs.symlinkSync(target, findingPath);

    expect(resolveGreenInputs(fixtureRoot).valid).toBe(false);
  });
});
