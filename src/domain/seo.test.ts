import { describe, it, expect } from "vitest";
import { SITE_ORIGIN, VIEW_SEO, seoForView, type SeoView } from "./seo";

const VIEWS: SeoView[] = ["home", "learn", "rules", "kanji", "challenge", "mock", "about"];

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
});
