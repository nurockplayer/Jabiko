import { describe, expect, it } from "vitest";
import { localizeLearningBlock, type LearningBlockText } from "./learningBlockText";
import type { LearningBlock } from "./learningBlocks";
import type { LocaleCode } from "./types";

const baseBlock: LearningBlock = {
  id: "test-block",
  group: "basic",
  category: "測試分類",
  kicker: "測試",
  title: "測試標題",
  subtitle: "高く / 静かに", // Japanese -- must never be translated
  explanation: "測試解說",
  examples: [
    { formula: "高い -> 高く", note: "註解一" },
    { formula: "静か -> 静かに", note: "註解二" },
    { formula: "学生 -> 学生に" } // example with no note
  ],
  pitfalls: ["陷阱一", "陷阱二"],
  drillNote: "練習提示",
  requiredForms: ["adverbial"]
};

const overlayFor = (
  text: LearningBlockText,
  lang: LocaleCode = "en"
): Record<string, Partial<Record<LocaleCode, LearningBlockText>>> => ({
  [baseBlock.id]: { [lang]: text }
});

describe("localizeLearningBlock", () => {
  it("returns the source block unchanged when there is no overlay for the id/locale", () => {
    expect(localizeLearningBlock(baseBlock, "en", {})).toBe(baseBlock);
    expect(localizeLearningBlock(baseBlock, "en", overlayFor({ title: "x" }, "ja"))).toBe(baseBlock);
  });

  it("applies overlay text fields for the locale", () => {
    const out = localizeLearningBlock(
      baseBlock,
      "en",
      overlayFor({
        category: "Adjective / Noun modification",
        kicker: "Basic modification",
        title: "Tell く and に apart first",
        explanation: "Use く for i-adjectives.",
        drillNote: "Practice note"
      })
    );
    expect(out.category).toBe("Adjective / Noun modification");
    expect(out.kicker).toBe("Basic modification");
    expect(out.title).toBe("Tell く and に apart first");
    expect(out.explanation).toBe("Use く for i-adjectives.");
    expect(out.drillNote).toBe("Practice note");
  });

  it("falls back to the source per field when the overlay omits it or is blank", () => {
    const out = localizeLearningBlock(
      baseBlock,
      "en",
      overlayFor({ title: "Only the title", kicker: "   " })
    );
    expect(out.title).toBe("Only the title");
    expect(out.category).toBe("測試分類"); // omitted -> source
    expect(out.kicker).toBe("測試"); // blank -> source
    expect(out.explanation).toBe("測試解說");
  });

  it("localizes example notes by index and never invents a note the source lacks", () => {
    const out = localizeLearningBlock(
      baseBlock,
      "en",
      overlayFor({ notes: ["note one", null, "should be ignored"] })
    );
    expect(out.examples[0].note).toBe("note one");
    expect(out.examples[1].note).toBe("註解二"); // null -> source
    expect(out.examples[2].note).toBeUndefined(); // source had no note -> stays absent
    expect(out.examples[0].formula).toBe("高い -> 高く"); // Japanese formula untouched
  });

  it("localizes pitfalls by index with source fallback", () => {
    const out = localizeLearningBlock(baseBlock, "en", overlayFor({ pitfalls: ["pitfall one"] }));
    expect(out.pitfalls).toEqual(["pitfall one", "陷阱二"]);
  });

  it("never touches Japanese/logic fields", () => {
    const out = localizeLearningBlock(
      baseBlock,
      "en",
      overlayFor({ title: "T", subtitle: "should be ignored" } as LearningBlockText)
    );
    expect(out.subtitle).toBe("高く / 静かに");
    expect(out.id).toBe("test-block");
    expect(out.group).toBe("basic");
    expect(out.requiredForms).toEqual(["adverbial"]);
  });
});
