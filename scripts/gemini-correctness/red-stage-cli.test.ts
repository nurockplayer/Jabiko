import { afterEach, beforeEach, describe, expect, it } from "vitest";
// @ts-expect-error -- plain .mjs module, no types
import {
  extractValidatedFinding,
  parseRedStageArgs,
  resolveFindingInputPath
} from "./red-stage.mjs";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

let fixtureRoot = "";

describe("RED stage CLI input", () => {
  beforeEach(() => {
    fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "jabiko-red-cli-"));
    fs.mkdirSync(
      path.join(fixtureRoot, ".tmp", "gemini-correctness"),
      { recursive: true }
    );
  });
  afterEach(() => {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  });

  it("resolves only the fixed regular finding artifact", () => {
    const findingPath = path.join(
      fixtureRoot,
      ".tmp",
      "gemini-correctness",
      "finding.json"
    );
    fs.writeFileSync(findingPath, "{}\n");

    expect(resolveFindingInputPath(fixtureRoot)).toBe(fs.realpathSync(findingPath));
  });

  it.each(["symlink", "dangling symlink"])("rejects a %s finding artifact", kind => {
    const findingPath = path.join(
      fixtureRoot,
      ".tmp",
      "gemini-correctness",
      "finding.json"
    );
    const target = path.join(fixtureRoot, "outside.json");
    if (kind === "symlink") fs.writeFileSync(target, "{}\n");
    fs.symlinkSync(target, findingPath);

    expect(resolveFindingInputPath(fixtureRoot)).toBeNull();
  });

  it("rejects a .tmp directory symlink", () => {
    fs.rmSync(path.join(fixtureRoot, ".tmp"), { recursive: true });
    const outside = path.join(fixtureRoot, "outside");
    fs.mkdirSync(path.join(outside, "gemini-correctness"), { recursive: true });
    fs.writeFileSync(
      path.join(outside, "gemini-correctness", "finding.json"),
      "{}\n"
    );
    fs.symlinkSync(outside, path.join(fixtureRoot, ".tmp"));

    expect(resolveFindingInputPath(fixtureRoot)).toBeNull();
  });
});

describe("parseRedStageArgs", () => {
  it("accepts only a bounded Gemini model identifier", () => {
    expect(parseRedStageArgs(["--model", "gemini-2.5-flash"]))
      .toEqual({ model: "gemini-2.5-flash" });
  });

  it.each([
    ["--command", "sh -c true"],
    ["--candidate", "/tmp/model-output.json"],
    ["--finding", "../../finding.json"],
    ["--model", "https://attacker.invalid/model"],
    ["--unknown"]
  ])("rejects unsupported or unsafe argv starting with %s", (...argv) => {
    expect(() => parseRedStageArgs(argv)).toThrow();
  });
});

describe("extractValidatedFinding", () => {
  const finding = { schemaVersion: 1, status: "finding" };

  it("accepts a raw finding or the exact successful #635 discovery envelope", () => {
    expect(extractValidatedFinding(finding)).toBe(finding);
    expect(extractValidatedFinding({ valid: true, result: finding })).toBe(finding);
  });

  it("rejects failed or extended discovery envelopes", () => {
    expect(extractValidatedFinding({ valid: false, result: finding })).toBeNull();
    expect(extractValidatedFinding({
      valid: true,
      result: finding,
      command: "sh -c true"
    })).toBeNull();
  });
});
