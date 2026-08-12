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
    // Record the length AND recurse into each element, so a per-element missing
    // sub-key (e.g. a learningSteps entry without `body`) is caught -- a
    // length-only comparison would miss it.
    return [
      `${prefix}[len=${value.length}]`,
      ...value.flatMap((item, index) => collectKeyPaths(item, `${prefix}[${index}]`))
    ];
  }
  if (value !== null && typeof value === "object") {
    const paths: string[] = [];
    for (const key of Object.keys(value as Record<string, unknown>)) {
      const childPrefix = prefix ? `${prefix}.${key}` : key;
      paths.push(...collectKeyPaths((value as Record<string, unknown>)[key], childPrefix));
    }
    return paths.sort();
  }
  // Tag the leaf kind so a function accidentally replaced by a string (or vice
  // versa) in a locale also diverges -- not only a missing/extra key.
  const kind = typeof value === "function" ? "fn" : "scalar";
  return [`${prefix}[${kind}]`];
}

// collectKeyPaths must recurse INTO array elements, not just record the length,
// so a per-element missing sub-key (e.g. a learningSteps entry without `body`)
// is caught -- a length-only comparison would miss it.
describe("collectKeyPaths array recursion", () => {
  it("emits the array length AND each element's sub-key paths", () => {
    const paths = collectKeyPaths({ steps: [{ a: "x", b: "y" }] });
    expect(paths).toContain("steps[len=1]");
    expect(paths).toContain("steps[0].a[scalar]");
    expect(paths).toContain("steps[0].b[scalar]");
  });

  it("catches a per-element missing sub-key (same length, divergent shape)", () => {
    const complete = collectKeyPaths({ steps: [{ a: "x", b: "y" }] });
    // Same array length, but the lone element dropped `b`.
    const missing = collectKeyPaths({ steps: [{ a: "x" }] });
    const diff = complete.filter((path) => !new Set(missing).has(path));
    expect(diff).toContain("steps[0].b[scalar]");
  });

  it("distinguishes a function leaf from a string leaf (catches fn->string swaps)", () => {
    const asFn = collectKeyPaths({ label: () => "x" });
    const asString = collectKeyPaths({ label: "x" });
    expect(asFn).toEqual(["label[fn]"]);
    expect(asString).toEqual(["label[scalar]"]);
  });
});

// Scope-copy guard (#94). The app spans N5 (basic conjugation) → N1, and the
// 綜合考題庫 exam pool covers N1–N3 (N4/N5 live only in the examN4 preset, not
// the default pool). vocab (単字讀音) covers N1–N5 since #666/#667 landed the
// N4/N5 jlpt tiers (#668), so its labels read N1〜N5. These assertions stop the
// old scope claims from drifting back into user-facing copy.
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

  it("vocab mode subtitle + home card span the full N1–N5 reading pool (#668)", () => {
    expect(zh.modeOptions.vocab.subtitle).toContain("N1〜N5");
    expect(zh.homeCardVocabSub).toContain("N1〜N5");
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

  // The base branch ships zh-Hant only, so the per-language loop below registers
  // no cases. This baseline keeps the suite non-empty (Vitest errors on a suite
  // with zero tests) and pins zh-Hant as a non-trivial reference shape; once a
  // locale is added back on a language branch, the loop guards it automatically.
  it("zh-Hant is the reference shape with a non-empty key set", () => {
    expect(reference.length).toBeGreaterThan(0);
  });

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
