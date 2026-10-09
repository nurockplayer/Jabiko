import { describe, expect, it } from "vitest";
import { NAVIGATION_REGISTRY, resolveNavigation } from "./navigation";
import { grammarRoute, staticRoute } from "./routes";

describe("navigation registry (#727)", () => {
  it("has deterministic, duplicate-free primary, resource, and menu order", () => {
    expect(NAVIGATION_REGISTRY.map((entry) => entry.id)).toEqual([
      "home", "challenge", "learn", "grammar", "conversation", "rules", "kanji", "kana", "mock", "stayD", "about"
    ]);
    expect(new Set(NAVIGATION_REGISTRY.map((entry) => entry.id)).size).toBe(NAVIGATION_REGISTRY.length);
  });

  it("keeps shared resource references and header-menu links available in every launched locale", () => {
    expect(NAVIGATION_REGISTRY.some((entry) => entry.zhHantOnly)).toBe(false);
    for (const locale of ["zh-Hant", "ja", "en"] as const) {
      const navigation = resolveNavigation(staticRoute("home"), locale);
      expect(navigation.resources.map((item) => item.id), locale).toEqual(["rules", "kanji", "kana"]);
      expect(navigation.menu.map((item) => item.id), locale).toEqual(["mock", "stayD", "about"]);
    }
  });

  it("keeps the accepted desktop order and compact Resources source set", () => {
    for (const locale of ["zh-Hant", "ja", "en"] as const) {
      const navigation = resolveNavigation(staticRoute("home"), locale);
      expect(navigation.primary.map((item) => item.id), locale)
        .toEqual(["home", "challenge", "learn", "grammar", "conversation"]);
      expect(navigation.primary.find((item) => item.id === "grammar")?.wideOnly, locale).toBe(true);
      expect(navigation.resources.map((item) => item.id), locale).toEqual(["rules", "kanji", "kana"]);
    }
  });

  it("resolves Practice for challenge and mock, with exact current locations", () => {
    for (const locale of ["zh-Hant", "ja", "en"] as const) {
      const conversation = resolveNavigation(staticRoute("conversation"), locale);
      expect(conversation.primary.find((item) => item.id === "conversation")?.current, locale).toBe(true);

      const challenge = resolveNavigation(staticRoute("challenge"), locale);
      expect(challenge.primary.find((item) => item.id === "challenge")?.current, locale).toBe(true);

      const mock = resolveNavigation(staticRoute("mock"), locale);
      expect(mock.primary.find((item) => item.id === "challenge")?.current, locale).toBe(true);
      expect(mock.menu.find((item) => item.id === "mock")?.current, locale).toBe(true);
      expect(mock.menuCurrent, locale).toBe(true);
    }
  });

  it("hides the partnership menu item in locales that have no Stay.D copy", () => {
    for (const locale of ["ko", "vi", "th", "id", "my"] as const) {
      const navigation = resolveNavigation(staticRoute("home"), locale);
      expect(navigation.menu.some((item) => item.id === "stayD"), locale).toBe(false);
    }
  });

  it("marks Stay.D, Kana, Grammar, and legal parent locations current", () => {
    const stayD = resolveNavigation(staticRoute("stayD"), "zh-Hant");
    expect(stayD.menu.find((item) => item.id === "stayD")?.current).toBe(true);
    expect(stayD.menuCurrent).toBe(true);

    const grammar = resolveNavigation(grammarRoute("〜てもいい"), "zh-Hant");
    expect(grammar.primary.find((item) => item.id === "grammar")?.current).toBe(true);

    const kana = resolveNavigation(staticRoute("kana"), "zh-Hant");
    expect(kana.primary.find((item) => item.id === "learn")?.current).toBe(false);
    expect(kana.resources.find((item) => item.id === "kana")?.current).toBe(true);
    expect(kana.resourcesCurrent).toBe(true);

    const legal = resolveNavigation(staticRoute("privacy"), "en");
    expect(legal.menu.find((item) => item.id === "about")?.current).toBe(true);
    expect(legal.menuCurrent).toBe(true);
  });
});
