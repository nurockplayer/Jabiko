import { describe, expect, it } from "vitest";
import { grammarNotes, lookupGrammarNote } from "./grammarNotes";

describe("lookupGrammarNote", () => {
  it("returns the full note for a seeded grammar point", () => {
    const note = lookupGrammarNote("ばかりに");
    expect(note).not.toBeNull();
    expect(note?.surface).toBe("ばかりに");
    expect(note?.meaningZh.length).toBeGreaterThan(0);
    expect(note?.formation.length).toBeGreaterThan(0);
    expect(note?.usageZh.length).toBeGreaterThan(0);
    expect(note?.examples.length).toBeGreaterThan(0);
    expect(note?.examples[0]?.ja.length).toBeGreaterThan(0);
    expect(note?.examples[0]?.zh.length).toBeGreaterThan(0);
  });

  it("returns null for a point with no note yet (no error)", () => {
    expect(lookupGrammarNote("これは存在しない文法")).toBeNull();
    expect(lookupGrammarNote("")).toBeNull();
  });

  it("keys every entry by its own surface (consistent map)", () => {
    for (const [key, note] of Object.entries(grammarNotes)) {
      expect(note.surface).toBe(key);
      // confusions list each name a different pattern, never empty strings
      expect(note.confusions.every((c) => c.trim().length > 0)).toBe(true);
    }
  });
});
