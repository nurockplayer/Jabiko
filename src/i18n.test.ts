import { describe, expect, it } from "vitest";
import { copy } from "./i18n";

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
