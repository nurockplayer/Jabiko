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
