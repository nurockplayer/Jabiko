import { describe, expect, it } from "vitest";
// @ts-expect-error -- plain .mjs tooling module, no types
import {
  validateTranslations,
  applyExplanationOverlay,
  findTargets,
  splitItemBlocks
} from "./ai-translate-content.mjs";

const FIXTURE = `import { examQuestion } from "../helpers";

export const n5Items = [
  examQuestion({
    id: "x-1",
    level: "N5",
    surface: "行く",
    reading: "いく",
    meaningZh: "去",
    promptLabel: "漢字読み",
    instructionZh: "讀音",
    promptText: "「行く」",
    promptContextZh: "去",
    expectedAnswer: "いく",
    options: ["いく", "ゆく", "こう", "ぎょう"],
    explanation: "答案是いく。"
  }),
  examQuestion({
    id: "x-2",
    level: "N5",
    surface: "見る",
    reading: "みる",
    meaningZh: "看",
    promptLabel: "漢字読み",
    instructionZh: "讀音",
    promptText: "「見る」",
    promptContextZh: "看",
    expectedAnswer: "みる",
    options: ["みる", "けん", "げん", "ばい"],
    explanation: "答案是みる。",
    explanationI18n: { "ja": "答えはみる。" }
  })
];
`;

describe("findTargets", () => {
  it("finds items missing the locale overlay, respecting limit", () => {
    expect(findTargets(FIXTURE, "en", 10).map((t) => t.id)).toEqual(["x-1", "x-2"]);
    expect(findTargets(FIXTURE, "en", 1).map((t) => t.id)).toEqual(["x-1"]);
  });
  it("skips items that already have the locale overlay", () => {
    expect(findTargets(FIXTURE, "ja", 10).map((t) => t.id)).toEqual(["x-1"]);
  });
  it("extracts the unescaped source explanation", () => {
    expect(findTargets(FIXTURE, "en", 1)[0].source).toBe("答案是いく。");
  });
});

describe("validateTranslations", () => {
  const ids = ["x-1", "x-2"];
  it("accepts a well-formed response", () => {
    const r = validateTranslations([{ id: "x-1", translation: "a" }, { id: "x-2", translation: "b" }], ids);
    expect(r.ok).toBe(true);
    expect(r.items).toHaveLength(2);
  });
  it("rejects a count mismatch", () => {
    expect(validateTranslations([{ id: "x-1", translation: "a" }], ids).ok).toBe(false);
  });
  it("rejects extra keys (protected-field guard)", () => {
    const r = validateTranslations(
      [{ id: "x-1", translation: "a", expectedAnswer: "hacked" }, { id: "x-2", translation: "b" }],
      ids
    );
    expect(r.ok).toBe(false);
  });
  it("rejects an unknown id", () => {
    expect(validateTranslations([{ id: "x-1", translation: "a" }, { id: "zzz", translation: "b" }], ids).ok).toBe(false);
  });
  it("rejects a duplicate id", () => {
    expect(validateTranslations([{ id: "x-1", translation: "a" }, { id: "x-1", translation: "b" }], ids).ok).toBe(false);
  });
  it("rejects an empty translation", () => {
    expect(validateTranslations([{ id: "x-1", translation: "  " }, { id: "x-2", translation: "b" }], ids).ok).toBe(false);
  });
  it("rejects a non-array", () => {
    expect(validateTranslations({ id: "x-1", translation: "a" }, ids).ok).toBe(false);
  });
});

describe("applyExplanationOverlay", () => {
  it("inserts a fresh overlay after the explanation field (adds the comma) and keeps item count", () => {
    const out = applyExplanationOverlay(FIXTURE, [{ id: "x-1", translation: "The answer is iku." }], "en");
    expect(out).toContain('explanationI18n: { "en": "The answer is iku." },');
    // explanation line for x-1 now ends with a comma
    expect(out).toContain('explanation: "答案是いく。",');
    // protected fields untouched, block count stable
    expect(splitItemBlocks(out)).toHaveLength(2);
    expect(out).toContain('expectedAnswer: "いく"');
    expect(out).toContain('options: ["いく", "ゆく", "こう", "ぎょう"]');
  });

  it("merges into an existing overlay, preserving the other locale", () => {
    const out = applyExplanationOverlay(FIXTURE, [{ id: "x-2", translation: "The answer is miru." }], "en");
    expect(out).toContain('"en": "The answer is miru."');
    expect(out).toContain('"ja": "答えはみる。"'); // existing locale preserved
    // x-2 still one block, single explanationI18n line
    const x2 = splitItemBlocks(out).find((b) => b.lines.some((l) => l.includes('id: "x-2"')));
    const overlayLines = x2.lines.filter((l) => l.includes("explanationI18n:"));
    expect(overlayLines).toHaveLength(1);
  });

  it("escapes quotes and newlines in the translation", () => {
    const out = applyExplanationOverlay(FIXTURE, [{ id: "x-1", translation: 'a "quote"\nnext' }], "en");
    expect(out).toContain('"en": "a \\"quote\\"\\nnext"');
  });

  it("does not touch items not in the translation set", () => {
    const out = applyExplanationOverlay(FIXTURE, [{ id: "x-1", translation: "x" }], "en");
    // x-2 line unchanged (still only ja overlay)
    const x2 = splitItemBlocks(out).find((b) => b.lines.some((l) => l.includes('id: "x-2"')));
    expect(x2.lines.some((l) => l.includes('"en"'))).toBe(false);
  });
});
