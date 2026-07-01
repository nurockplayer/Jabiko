import { describe, expect, it } from "vitest";
import { localizeGrammarNote, type GrammarNoteOverlays } from "./grammarNoteText";
import type { GrammarNote } from "./grammarNotes";

const baseNote: GrammarNote = {
  surface: "ばかりに",
  jlptLevel: "N2",
  meaningZh: "就因為…",
  formation: "動詞普通形＋ばかりに",
  usageZh: "強調負面原因。",
  examples: [{ ja: "言ったばかりに、怒らせた。", zh: "就因為說了，惹火了。" }],
  confusions: ["せいで：單純歸咎", "だけあって：正面評價"]
};

const overlay = (text: object, lang = "en"): GrammarNoteOverlays => ({
  [baseNote.surface]: { [lang]: text }
});

describe("localizeGrammarNote", () => {
  it("returns the source note when there is no overlay for the surface/locale", () => {
    expect(localizeGrammarNote(baseNote, "en", {})).toBe(baseNote);
    expect(localizeGrammarNote(baseNote, "en", overlay({ meaningZh: "x" }, "ja"))).toBe(baseNote);
  });

  it("applies overlay fields, falling back to source per field", () => {
    const out = localizeGrammarNote(
      baseNote,
      "en",
      overlay({ meaningZh: "just because …", usageZh: "Stresses a negative cause." })
    );
    expect(out.meaningZh).toBe("just because …");
    expect(out.usageZh).toBe("Stresses a negative cause.");
    expect(out.formation).toBe("動詞普通形＋ばかりに"); // omitted -> source
  });

  it("localizes example zh by index but keeps the Japanese example", () => {
    const out = localizeGrammarNote(baseNote, "en", overlay({ examplesZh: ["because I said it, I angered him."] }));
    expect(out.examples[0].zh).toBe("because I said it, I angered him.");
    expect(out.examples[0].ja).toBe("言ったばかりに、怒らせた。");
  });

  it("localizes confusions by index with source fallback", () => {
    const out = localizeGrammarNote(baseNote, "en", overlay({ confusions: ["せいで: just blames a cause"] }));
    expect(out.confusions).toEqual(["せいで: just blames a cause", "だけあって：正面評價"]);
  });

  it("never touches surface / jlptLevel", () => {
    const out = localizeGrammarNote(baseNote, "en", overlay({ meaningZh: "m" }));
    expect(out.surface).toBe("ばかりに");
    expect(out.jlptLevel).toBe("N2");
  });
});
