import { describe, it, expect } from "vitest";
import { SITE_ORIGIN, VIEW_SEO, seoForView, type SeoView } from "./seo";

// The static-route views (every SeoView except the dynamic "grammar" route).
const VIEWS: Exclude<SeoView, "grammar">[] = [
  "home",
  "learn",
  "rules",
  "kanji",
  "challenge",
  "mock",
  "about"
];

describe("seo", () => {
  it("has an entry for every view", () => {
    for (const view of VIEWS) {
      expect(VIEW_SEO[view], view).toBeDefined();
    }
    expect(Object.keys(VIEW_SEO).sort()).toEqual([...VIEWS].sort());
  });

  it("keeps the brand in the home title and a meaningful description", () => {
    const home = seoForView("home");
    expect(home.title).toMatch(/Jabiko/);
    expect(home.description.length).toBeGreaterThan(20);
  });

  it("gives every view a distinct title and description (no shared SPA meta)", () => {
    const titles = new Set(VIEWS.map((v) => seoForView(v).title));
    const descriptions = new Set(VIEWS.map((v) => seoForView(v).description));
    expect(titles.size).toBe(VIEWS.length);
    expect(descriptions.size).toBe(VIEWS.length);
  });

  it("builds an absolute canonical URL rooted at the production origin", () => {
    expect(SITE_ORIGIN).toBe("https://jabiko.pages.dev");
    expect(seoForView("home").canonical).toBe("https://jabiko.pages.dev/");
    expect(seoForView("mock").canonical).toBe("https://jabiko.pages.dev/mock");
    expect(seoForView("kanji").canonical).toBe("https://jabiko.pages.dev/kanji");
  });

  it("keeps descriptions within a sane SEO length (<=160 chars)", () => {
    for (const view of VIEWS) {
      expect(seoForView(view).description.length, view).toBeLessThanOrEqual(160);
    }
  });

  // The /grammar/<surface> route is dynamic (#281): its title/description/
  // canonical are built from the surface rather than a VIEW_SEO entry.
  it("builds per-surface metadata for a grammar-point route", () => {
    const resolved = seoForView("grammar", "ばかりに");
    expect(resolved.title).toContain("ばかりに");
    expect(resolved.title).toMatch(/Jabiko/);
    expect(resolved.description).toContain("ばかりに");
    expect(resolved.canonical).toBe(`${SITE_ORIGIN}/grammar/${encodeURIComponent("ばかりに")}`);
  });

  it("falls back to home metadata if a grammar view arrives with no surface", () => {
    expect(seoForView("grammar").canonical).toBe(seoForView("home").canonical);
  });

  // /grammar/n5 – /grammar/n1 are level-index routes (#437), not grammar-point
  // pages; they should show level-specific index metadata rather than point SEO.
  describe("grammar level routes", () => {
    const LEVELS = ["n5", "n4", "n3", "n2", "n1"];

    it("builds level-index metadata for a level-slug surface", () => {
      const resolved = seoForView("grammar", "n5");
      expect(resolved.title).toContain("N5");
      expect(resolved.title).toMatch(/文型/);
      expect(resolved.description).toContain("N5");
      expect(resolved.description).toMatch(/JLPT/);
      expect(resolved.canonical).toBe(`${SITE_ORIGIN}/grammar/n5`);
    });

    it("gives every level a distinct title", () => {
      const titles = new Set(LEVELS.map((l) => seoForView("grammar", l).title));
      expect(titles.size).toBe(LEVELS.length);
    });

    it("builds an absolute canonical URL for each level", () => {
      for (const level of LEVELS) {
        const resolved = seoForView("grammar", level);
        expect(resolved.canonical).toBe(`${SITE_ORIGIN}/grammar/${level}`);
      }
    });

    it("prefers level-index SEO over grammar-point SEO for level-like surfaces", () => {
      const resolved = seoForView("grammar", "n5");
      expect(resolved.title).toContain("N5");
      expect(resolved.title).toContain("文型");
      expect(resolved.description).toContain("N5");
      expect(resolved.description).toMatch(/JLPT/);
      expect(resolved.title).not.toContain("的意思與用法");
    });
  });
});
