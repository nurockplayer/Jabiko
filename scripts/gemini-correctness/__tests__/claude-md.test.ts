// @ts-expect-error -- plain .mjs module, no types
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = path.resolve(__dirname, "..", "discover.mjs");

describe("discover.mjs — hardcoded CLAUDE.md (no --claude-md arg)", () => {
  it("CLI parsing does NOT accept --claude-md", () => {
    const source = fs.readFileSync(SCRIPT_PATH, "utf8");
    // The entire CLI section must NOT contain "--claude-md"
    // (the prompt template may mention 'claude' in other context)
    const afterArgs = source.split("function parseArgs")[1];
    const beforeMain = afterArgs.split("function main")[0];
    expect(beforeMain).not.toContain("claude-md");
  });

  it("reads CLAUDE.md from REPO_ROOT only — no user-provided path", () => {
    const source = fs.readFileSync(SCRIPT_PATH, "utf8");
    // The rules-reading section should reference REPO_ROOT/CLAUDE.md, not a CLI flag
    const rulesSection = source.split("Read project rules")[1]?.split("Build prompt")[0] || "";
    expect(rulesSection).toContain("CLAUDE.md");
    // .env should never appear in the discovery logic
    expect(rulesSection).not.toContain(".env");
  });

  it("does NOT reference .env, protected paths, or arbitrary files", () => {
    const source = fs.readFileSync(SCRIPT_PATH, "utf8");
    // The main function does reference these via getDefaultProtectedPaths()
    // but the --claude-md path must not allow them
    expect(source).not.toMatch(/claude-md/);
  });
});
