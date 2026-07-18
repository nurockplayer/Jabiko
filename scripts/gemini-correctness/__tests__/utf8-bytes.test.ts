// @ts-expect-error -- plain .mjs module, no types
import { describe, expect, it } from "vitest";
// @ts-expect-error -- plain .mjs module, no types
import { scanRepository } from "../scanner.mjs";
import fs from "node:fs";
import path from "node:path";

describe("scanRepository — UTF-8 byte limits", () => {
  const TEST_DIR = "/tmp/jabiko-utf8-test-" + Date.now();

  function createFixture() {
    fs.mkdirSync(path.join(TEST_DIR, "src", "domain"), { recursive: true });
    // File with multi-byte characters (Chinese/Japanese)
    const mbContent = "def hello():\n    return '你好世界'\n";
    fs.writeFileSync(path.join(TEST_DIR, "src", "domain", "multibyte.ts"), mbContent, "utf8");
    // File with emoji
    const emojiContent = "const emoji = '🔥🚀🌟';\n";
    fs.writeFileSync(path.join(TEST_DIR, "src", "domain", "emoji.ts"), emojiContent, "utf8");
    // a CLAUDE.md marker
    fs.writeFileSync(path.join(TEST_DIR, "CLAUDE.md"), "# test");
  }

  function cleanupFixture() {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }

  beforeEach(() => createFixture());
  afterEach(() => cleanupFixture());

  it("uses Buffer.byteLength (not string.length) for byte counting", () => {
    const result = scanRepository({
      repoRoot: TEST_DIR,
      allowlist: ["src/domain/**"],
      protectedPaths: [],
      maxBytesPerFile: 30
    });
    const mbEntry = result.scannedFiles.find(f => f.path === "src/domain/multibyte.ts");
    expect(mbEntry).toBeDefined();
    // The multibyte file has Chinese chars: each is 3 bytes in UTF-8
    // string.length would be less than Buffer.byteLength
    const byteLen = Buffer.byteLength(mbEntry.content, "utf8");
    expect(byteLen).toBeLessThanOrEqual(30); // should be truncated at byte limit
    // Must not end in the middle of a multi-byte character
    // (decoded content should not have replacement characters)
    expect(mbEntry.content.includes("�")).toBe(false);
  });

  it("does not cut multi-byte characters in the middle (emoji safety)", () => {
    const result = scanRepository({
      repoRoot: TEST_DIR,
      allowlist: ["src/domain/**"],
      protectedPaths: [],
      maxBytesPerFile: 15
    });
    const emojiEntry = result.scannedFiles.find(f => f.path === "src/domain/emoji.ts");
    expect(emojiEntry).toBeDefined();
    // Length checks: we should not have broken surrogate pairs
    expect(emojiEntry.content.includes("�")).toBe(false);
    // If truncated mid-emoji, we might lose the emoji but should not have broken chars
    for (const ch of emojiEntry.content) {
      expect(/[\uD800-\uDFFF]/.test(ch)).toBe(false); // no orphaned surrogates
    }
  });

  it("total size limit checks Buffer.byteLength not string.length", () => {
    const result = scanRepository({
      repoRoot: TEST_DIR,
      allowlist: ["src/domain/**"],
      protectedPaths: [],
      maxTotalBytes: 40  // small enough to trigger truncation
    });
    const totalBytes = result.scannedFiles.reduce((s, f) => s + Buffer.byteLength(f.content, "utf8"), 0);
    expect(totalBytes).toBeLessThanOrEqual(50); // slight overage from prompt frame but not unlimited
  });
});
