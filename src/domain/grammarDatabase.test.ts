import { describe, expect, it } from "vitest";
import { grammarPatterns } from "./grammarDatabase";

// Integrity guard added with the #554 N1-section cleanup: the DB previously
// carried non-patterns (adverbs), non-existent forms, duplicates, and broken
// related links -- these checks keep the cleaned state from regressing.
describe("grammarDatabase integrity (#554)", () => {
  it("ids are unique", () => {
    const ids = grammarPatterns.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("patterns are unique per level (no duplicate entries like the old ざるを得ない@N1/@N2)", () => {
    const keys = grammarPatterns.map((p) => `${p.pattern}@${p.level}`);
    expect(new Set(keys).size).toBe(keys.length);
    // The known duplicate must be gone: ざるを得ない exists exactly once.
    expect(grammarPatterns.filter((p) => p.pattern.includes("ざるを得ない"))).toHaveLength(1);
  });

  it("every relatedPatternId points at an existing entry", () => {
    const ids = new Set(grammarPatterns.map((p) => p.id));
    for (const p of grammarPatterns) {
      for (const rel of p.relatedPatternIds) {
        expect(ids.has(rel), `${p.id} -> ${rel}`).toBe(true);
      }
    }
  });

  it("the cleaned N1 junk never returns", () => {
    const gone = [
      "makoto-ni",
      "iwaba",
      "nimo-arukedo",
      "koto-to-iu",
      "nimo-aran",
      "shinobu-ni",
      "zaru-wo-enai-n1",
      "nakaideha-n1",
      "to-wa-omoenai"
    ];
    const ids = new Set(grammarPatterns.map((p) => p.id));
    for (const id of gone) expect(ids.has(id), id).toBe(false);
    // And the corrected/level-fixed survivors sit at their audited levels.
    const byId = new Map(grammarPatterns.map((p) => [p.id, p]));
    expect(byId.get("nimo-oyobazu")?.pattern).toBe("〜には及ばない");
    expect(byId.get("nimo-oyobazu")?.level).toBe("N1");
    expect(byId.get("no-mono-da")?.pattern).toBe("〜ものだ");
    expect(byId.get("no-mono-da")?.level).toBe("N3");
    expect(byId.get("koto-kara")?.level).toBe("N2");
    expect(byId.get("to-ieba")?.level).toBe("N3");
    expect(byId.get("to-iu-to")?.level).toBe("N3");
    expect(byId.get("to-wa-kagiranai")?.level).toBe("N3");
    // B項: the five teaching-syllabus N4 items sit at N4, not N3.
    for (const id of ["ta-bakari", "you-ni-naru", "koto-ni-naru", "te-kuru", "te-iku"]) {
      expect(byId.get(id)?.level, id).toBe("N4");
    }
  });
});
