import { describe, expect, it } from "vitest";
import { NAVIGATION_REGISTRY, resolveNavigation } from "./navigation";
import { grammarRoute, staticRoute } from "./routes";

describe("navigation registry (#727)", () => {
  it("has deterministic, duplicate-free primary and resource order", () => {
    expect(NAVIGATION_REGISTRY.map((entry) => entry.id)).toEqual([
      "home",
      "learn",
      "challenge",
      "mock",
      "grammar",
      "stayD",
      "rules",
      "kanji",
      "kana",
      "about"
    ]);
    expect(new Set(NAVIGATION_REGISTRY.map((entry) => entry.id)).size).toBe(
      NAVIGATION_REGISTRY.length
    );
  });

  // The zhHantOnly gate is still part of the registry contract (it kept the
  // retired 文章 entry zh-Hant-only); no entry uses it today, so every locale
  // sees the same resource list.
  it("shows the same resources in every locale while no entry is gated", () => {
    expect(NAVIGATION_REGISTRY.some((entry) => entry.zhHantOnly)).toBe(false);
    for (const locale of ["zh-Hant", "ja", "en"] as const) {
      expect(resolveNavigation(staticRoute("home"), locale).resources.map((item) => item.id), locale)
        .toEqual(["rules", "kanji", "kana", "about"]);
    }
  });

  it("puts the partnership tab at the end of the primary row where Stay.D has copy", () => {
    for (const locale of ["zh-Hant", "ja", "en"] as const) {
      expect(resolveNavigation(staticRoute("home"), locale).primary.map((item) => item.id), locale)
        .toEqual(["home", "learn", "challenge", "mock", "grammar", "stayD"]);
    }
  });

  it("hides the partnership tab in locales that have no Stay.D copy", () => {
    for (const locale of ["ko", "vi", "th", "id", "my"] as const) {
      const nav = resolveNavigation(staticRoute("home"), locale);
      expect(nav.primary.some((item) => item.id === "stayD"), locale).toBe(false);
    }
  });

  it("marks the partnership tab current on the /stay-d route", () => {
    const nav = resolveNavigation(staticRoute("stayD"), "zh-Hant");
    expect(nav.primary.find((item) => item.id === "stayD")?.current).toBe(true);
  });

  it("resolves nested primary and resource ancestors", () => {
    const grammar = resolveNavigation(grammarRoute("〜てもいい"), "zh-Hant");
    expect(grammar.primary.find((item) => item.id === "grammar")?.current).toBe(true);

    const kana = resolveNavigation(staticRoute("kana"), "zh-Hant");
    expect(kana.primary.find((item) => item.id === "learn")?.current).toBe(true);
    expect(kana.resources.find((item) => item.id === "kana")?.current).toBe(true);
    expect(kana.resourcesCurrent).toBe(true);

    const legal = resolveNavigation(staticRoute("privacy"), "en");
    expect(legal.resources.find((item) => item.id === "about")?.current).toBe(true);
    expect(legal.resourcesCurrent).toBe(true);
  });
});
