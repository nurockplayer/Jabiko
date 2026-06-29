import { describe, expect, it } from "vitest";
import { copy, type Language } from "./i18n";

// Recursively collect the structural "shape" of a copy object as a sorted set
// of key-paths. Nested plain objects (feedbackKind, typeBandLabels,
// questionTypeLabels, levelRangeOptions, levelOnboarding, modeOptions,
// partOfSpeech, verbGroups, focusOptions, targetForms) recurse; arrays
// (learningSteps, lessonCardFocus) compare by length only -- the per-language
// string content differs, only the count is a contract. Functions and strings
// are leaves. This catches a translator dropping or inventing a key in any
// locale, including deeply nested ones, which a partial typecheck might miss.
function collectKeyPaths(value: unknown, prefix = ""): string[] {
  if (Array.isArray(value)) {
    return [`${prefix}[len=${value.length}]`];
  }
  if (value !== null && typeof value === "object") {
    const paths: string[] = [];
    for (const key of Object.keys(value as Record<string, unknown>)) {
      const childPrefix = prefix ? `${prefix}.${key}` : key;
      paths.push(...collectKeyPaths((value as Record<string, unknown>)[key], childPrefix));
    }
    return paths.sort();
  }
  return [prefix];
}

// Scope-copy guard (#94). The app spans N5 (basic conjugation) → N1, and the
// 綜合考題庫 exam pool covers N1–N3 (N4/N5 live only in the examN4 preset, not
// the default pool). vocab (単字讀音) is N1/N2 only (jlptVocabulary = n1+n2),
// so its "N1/N2" labels stay correct. These assertions stop the old
// "N1・N2 only" scope claims from drifting back into user-facing copy.
describe("i18n scope copy (#94)", () => {
  const zh = copy["zh-Hant"];

  it("appTagline spans N5–N1, not just N1・N2", () => {
    expect(zh.appTagline).not.toContain("N1・N2");
    expect(zh.appTagline).toContain("N5〜N1");
  });

  it("exam mode subtitle reflects the N1–N3 default pool", () => {
    expect(zh.modeOptions.exam.subtitle).not.toContain("N1/N2 為主");
    expect(zh.modeOptions.exam.subtitle).toContain("N1〜N3");
  });

  it("homeHeroIntro drops the stale 'N1 / N2' endpoint phrasing", () => {
    expect(zh.homeHeroIntro).not.toContain("N1 / N2");
  });
});

// Key-completeness guard (#299). zh-Hant is the source of truth for the copy
// shape; every other locale must have exactly the same key-paths (no missing,
// no extra) so a partial translation can never reach the UI as `undefined`.
describe("i18n locale key completeness (#299)", () => {
  const reference = collectKeyPaths(copy["zh-Hant"]);
  const referenceSet = new Set(reference);
  const otherLanguages = (Object.keys(copy) as Language[]).filter((lang) => lang !== "zh-Hant");

  for (const lang of otherLanguages) {
    it(`${lang} has exactly the same key structure as zh-Hant`, () => {
      const langPaths = collectKeyPaths(copy[lang]);
      const langSet = new Set(langPaths);

      const missing = reference.filter((path) => !langSet.has(path));
      const extra = langPaths.filter((path) => !referenceSet.has(path));

      expect(missing, `${lang} is missing keys vs zh-Hant`).toEqual([]);
      expect(extra, `${lang} has extra keys not in zh-Hant`).toEqual([]);
    });
  }
});
