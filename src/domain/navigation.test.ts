import { describe, expect, it } from "vitest";
import { NAVIGATION_REGISTRY, resolveNavigation } from "./navigation";
import { blogRoute, grammarRoute, staticRoute } from "./routes";

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
      "blog",
      "about"
    ]);
    expect(new Set(NAVIGATION_REGISTRY.map((entry) => entry.id)).size).toBe(
      NAVIGATION_REGISTRY.length
    );
  });

  it("keeps blog zh-Hant-only without changing other resources", () => {
    expect(resolveNavigation(staticRoute("home"), "zh-Hant").resources.map((item) => item.id))
      .toEqual(["rules", "kanji", "kana", "blog", "about"]);
    expect(resolveNavigation(staticRoute("home"), "ja").resources.map((item) => item.id))
      .toEqual(["rules", "kanji", "kana", "about"]);
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

    const article = resolveNavigation(blogRoute("an-article"), "zh-Hant");
    expect(article.resources.find((item) => item.id === "blog")?.current).toBe(true);
  });
});
