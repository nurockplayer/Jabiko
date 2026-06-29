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
});
