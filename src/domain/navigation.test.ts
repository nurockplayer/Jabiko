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

  it("keeps the shared reference entries in every launched locale", () => {
    expect(NAVIGATION_REGISTRY.some((entry) => entry.zhHantOnly)).toBe(false);
    for (const locale of ["zh-Hant", "ja", "en"] as const) {
      expect(
        resolveNavigation(staticRoute("home"), locale).resources.map((item) => item.id).slice(-4),
        locale
      ).toEqual(["rules", "kanji", "kana", "about"]);
    }
  });

  it("keeps primary navigation learning-only and exposes partnership with the resources", () => {
    for (const locale of ["zh-Hant", "ja", "en"] as const) {
      expect(resolveNavigation(staticRoute("home"), locale).primary.map((item) => item.id), locale)
        .toEqual(["home", "learn", "challenge", "mock", "grammar"]);
      expect(resolveNavigation(staticRoute("home"), locale).resources.map((item) => item.id), locale)
        .toEqual(["stayD", "rules", "kanji", "kana", "about"]);
    }
  });

  it("hides the partnership tab in locales that have no Stay.D copy", () => {
    for (const locale of ["ko", "vi", "th", "id", "my"] as const) {
      const nav = resolveNavigation(staticRoute("home"), locale);
      expect(nav.primary.some((item) => item.id === "stayD"), locale).toBe(false);
      expect(nav.resources.some((item) => item.id === "stayD"), locale).toBe(false);
    }
  });

  it("marks the partnership resource current on the /stay-d route", () => {
    const nav = resolveNavigation(staticRoute("stayD"), "zh-Hant");
    expect(nav.resources.find((item) => item.id === "stayD")?.current).toBe(true);
    expect(nav.resourcesCurrent).toBe(true);
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
