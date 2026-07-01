import { describe, expect, it } from "vitest";
// @ts-expect-error -- plain .mjs tooling module, no types
import {
  validateTranslations,
  applyOverlays,
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
    promptLabel: "文法形式選擇",
    instructionZh: "選最自然的詞語。",
    promptText: "毎日 学校___行きます。",
    promptContextZh: "描述每天上學。",
    hintZh: "說明去某地。",
    expectedAnswer: "に",
    options: ["に", "を", "で", "が"],
    explanation: "答案是に。"
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

describe("findTargets (multi-field)", () => {
  it("finds items with any missing overlay field, respecting limit", () => {
    expect(findTargets(FIXTURE, "en", 10).map((t) => t.id)).toEqual(["x-1", "x-2"]);
    expect(findTargets(FIXTURE, "en", 1).map((t) => t.id)).toEqual(["x-1"]);
  });

  it("collects every translatable field for an item with no overlays", () => {
    const x1 = findTargets(FIXTURE, "en", 1)[0];
    expect(Object.keys(x1.fields).sort()).toEqual(
      ["explanation", "hintZh", "instructionZh", "meaningZh", "promptContextZh"].sort()
    );
    expect(x1.fields.meaningZh).toBe("去");
    expect(x1.fields.instructionZh).toBe("選最自然的詞語。");
  });

  it("skips a field that already has the overlay for the locale, keeps the rest", () => {
    // x-2 has explanationI18n.ja, so for ja: explanation is skipped but the
    // other Chinese fields (which have no ja overlay) are still gaps.
    const x2 = findTargets(FIXTURE, "ja", 10).find((t) => t.id === "x-2");
    expect(x2).toBeDefined();
    expect(Object.keys(x2.fields)).not.toContain("explanation");
    expect(Object.keys(x2.fields).sort()).toEqual(
      ["instructionZh", "meaningZh", "promptContextZh"].sort()
    );
  });

  it("attaches question context (prompt / answer / options) for the prompt", () => {
    const x1 = findTargets(FIXTURE, "en", 1)[0];
    expect(x1.context.expectedAnswer).toBe("に");
    expect(x1.context.promptText).toBe("毎日 学校___行きます。");
    expect(x1.context.options).toContain('"に"');
  });

  it("keeps meaningZh and exampleMeaningZh apart (anchored field match)", () => {
    const withExample = FIXTURE.replace(
      '    meaningZh: "去",',
      '    meaningZh: "去",\n    exampleMeaningZh: "去學校的例句意思",'
    );
    const x1 = findTargets(withExample, "en", 1)[0];
    // Each field is matched at its own anchor -- no cross-contamination in
    // either direction now that exampleMeaningZh is itself translatable.
    expect(x1.fields.meaningZh).toBe("去");
    expect(x1.fields.exampleMeaningZh).toBe("去學校的例句意思");
  });
});

describe("validateTranslations (multi-field)", () => {
  const requested = [
    { id: "x-1", fieldKeys: ["meaningZh", "explanation"] },
    { id: "x-2", fieldKeys: ["meaningZh"] }
  ];
  const good = [
    { id: "x-1", fields: { meaningZh: "to go", explanation: "The answer is ni." } },
    { id: "x-2", fields: { meaningZh: "to see" } }
  ];

  it("accepts a well-formed multi-field response", () => {
    const r = validateTranslations(good, requested);
    expect(r.ok).toBe(true);
    expect(r.items).toHaveLength(2);
    expect(r.items[0].fields.meaningZh).toBe("to go");
  });

  it("rejects a count mismatch", () => {
    expect(validateTranslations([good[0]], requested).ok).toBe(false);
  });

  it("rejects an extra top-level key (protected-field guard)", () => {
    const bad = [{ id: "x-1", fields: { meaningZh: "x", explanation: "y" }, expectedAnswer: "hacked" }, good[1]];
    expect(validateTranslations(bad, requested).ok).toBe(false);
  });

  it("rejects a field-key mismatch (missing a requested field)", () => {
    const bad = [{ id: "x-1", fields: { meaningZh: "x" } }, good[1]]; // explanation missing
    expect(validateTranslations(bad, requested).ok).toBe(false);
  });

  it("rejects an extra (unrequested) field key", () => {
    const bad = [{ id: "x-1", fields: { meaningZh: "x", explanation: "y", hintZh: "z" } }, good[1]];
    expect(validateTranslations(bad, requested).ok).toBe(false);
  });

  it("rejects an unknown id, a duplicate id, an empty value, and a non-array", () => {
    expect(validateTranslations([{ id: "zzz", fields: { meaningZh: "x" } }, good[1]], requested).ok).toBe(false);
    expect(validateTranslations([good[0], good[0]], requested).ok).toBe(false);
    expect(validateTranslations([{ id: "x-1", fields: { meaningZh: "  ", explanation: "y" } }, good[1]], requested).ok).toBe(false);
    expect(validateTranslations({ id: "x-1" }, requested).ok).toBe(false);
  });

  it("rejects a non-object fields value", () => {
    expect(validateTranslations([{ id: "x-1", fields: "nope" }, good[1]], requested).ok).toBe(false);
  });
});

describe("applyOverlays (multi-field)", () => {
  it("inserts fresh overlays after each source field, adds commas, keeps item count", () => {
    const out = applyOverlays(
      FIXTURE,
      [{ id: "x-1", fields: { meaningZh: "to go", instructionZh: "Choose the most natural word." } }],
      "en"
    );
    expect(out).toContain('meaningI18n: { "en": "to go" },');
    expect(out).toContain('instructionI18n: { "en": "Choose the most natural word." },');
    expect(out).toContain('meaningZh: "去",');
    expect(out).toContain('instructionZh: "選最自然的詞語。",');
    expect(splitItemBlocks(out)).toHaveLength(2);
    // protected fields untouched
    expect(out).toContain('expectedAnswer: "に"');
    expect(out).toContain('options: ["に", "を", "で", "が"]');
  });

  it("merges into an existing overlay line, preserving the other locale", () => {
    const out = applyOverlays(FIXTURE, [{ id: "x-2", fields: { explanation: "The answer is miru." } }], "en");
    expect(out).toContain('"en": "The answer is miru."');
    expect(out).toContain('"ja": "答えはみる。"');
    const x2 = splitItemBlocks(out).find((b) => b.lines.some((l) => l.includes('id: "x-2"')));
    expect(x2.lines.filter((l) => l.includes("explanationI18n:"))).toHaveLength(1);
  });

  it("escapes quotes and newlines in a translation", () => {
    const out = applyOverlays(FIXTURE, [{ id: "x-1", fields: { meaningZh: 'a "q"\nb' } }], "en");
    expect(out).toContain('meaningI18n: { "en": "a \\"q\\"\\nb" },');
  });

  it("does not touch items outside the translation set", () => {
    const out = applyOverlays(FIXTURE, [{ id: "x-1", fields: { meaningZh: "to go" } }], "en");
    const x2 = splitItemBlocks(out).find((b) => b.lines.some((l) => l.includes('id: "x-2"')));
    expect(x2.lines.some((l) => l.includes('"en"'))).toBe(false);
  });
});

// A hand-edited/reflowed overlay object that spans several lines must NOT fool
// the gap check into re-translating an existing locale (which would write a
// duplicate object key -> TS1117 build break / corrupt content file).
describe("multi-line overlay safety", () => {
  const MULTILINE = `import { examQuestion } from "../helpers";

export const n5Items = [
  examQuestion({
    id: "m-1",
    level: "N5",
    surface: "行く",
    reading: "いく",
    meaningZh: "去",
    meaningI18n: {
      "ja": "行く",
      "en": "to go"
    },
    promptLabel: "文法形式選擇",
    instructionZh: "選最自然的詞語。",
    promptText: "毎日 学校___行きます。",
    promptContextZh: "描述每天上學。",
    hintZh: "說明去某地。",
    expectedAnswer: "に",
    options: ["に", "を", "で", "が"],
    explanation: "答案是に。"
  })
];
`;

  it("findTargets skips a field whose locale lives in a multi-line overlay", () => {
    const en = findTargets(MULTILINE, "en", 1)[0];
    expect(en).toBeDefined();
    // meaningI18n already has "en" (on its own line) -> not a gap
    expect(Object.keys(en.fields)).not.toContain("meaningZh");
    // ...but the other fields with no overlay still are gaps
    expect(Object.keys(en.fields)).toContain("instructionZh");
  });

  it("findTargets still finds a locale missing from a multi-line overlay", () => {
    const th = findTargets(MULTILINE, "th", 1)[0];
    expect(th.fields.meaningZh).toBe("去"); // no "th" key in the multi-line object
  });

  it("applyOverlays does NOT add a duplicate key for an existing multi-line locale", () => {
    // Even if a caller wrongly asks to re-translate meaningZh for "en",
    // the pre-scan must detect the existing multi-line "en" and skip it.
    const out = applyOverlays(MULTILINE, [{ id: "m-1", fields: { meaningZh: "DUP" } }], "en");
    const enKeys = out.split("\n").filter((l) => /^\s*"en"\s*:/.test(l));
    expect(enKeys).toHaveLength(1); // exactly one "en" -> no duplicate object key
    expect(out).not.toContain('"en": "DUP"');
    expect(splitItemBlocks(out)).toHaveLength(1);
  });
});
