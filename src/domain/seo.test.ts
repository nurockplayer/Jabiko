import { describe, it, expect } from "vitest";
import { SITE_ORIGIN, VIEW_SEO, seoForView } from "./seo";
import type { AppView } from "./routes";

// The static-route views (every AppView except the dynamic "grammar" route).
// "blog" has a static index entry (VIEW_SEO.blog) plus a dynamic /blog/<slug>
// variant, tested separately below like grammar.
const VIEWS: Exclude<AppView, "grammar">[] = [
  "home",
  "learn",
  "rules",
  "kanji",
  "kana",
  "challenge",
  "mock",
  "about",
  "privacy",
  "terms",
  "stayD",
  "blog"
];

describe("seo", () => {
  it("has an entry for every view", () => {
    const allViews: AppView[] = [...VIEWS, "grammar"];
    for (const view of allViews) {
      expect(VIEW_SEO[view], view).toBeDefined();
    }
    expect(Object.keys(VIEW_SEO).sort()).toEqual([...allViews].sort());
  });

  it("keeps the brand in the home title and a meaningful description", () => {
    const home = seoForView("home");
    expect(home.title).toMatch(/Jabiko/);
    expect(home.description.length).toBeGreaterThan(20);
  });

  it("gives every view a distinct title and description (no shared SPA meta)", () => {
    const allViews: AppView[] = [...VIEWS, "grammar"];
    const titles = new Set(allViews.map((v) => seoForView(v).title));
    const descriptions = new Set(allViews.map((v) => seoForView(v).description));
    expect(titles.size).toBe(allViews.length);
    expect(descriptions.size).toBe(allViews.length);
  });

  it("builds an absolute canonical URL rooted at the production origin", () => {
    expect(SITE_ORIGIN).toBe("https://jabiko.app");
    expect(seoForView("home").canonical).toBe("https://jabiko.app/");
    expect(seoForView("mock").canonical).toBe("https://jabiko.app/mock");
    expect(seoForView("kanji").canonical).toBe("https://jabiko.app/kanji");
    expect(seoForView("stayD").canonical).toBe("https://jabiko.app/stay-d");
    expect(seoForView("stayD").title).toBe(
      "Stay.D 東京住宿推薦｜像生活一樣感受東京 · Jabiko"
    );
  });

  it("keeps descriptions within a sane SEO length (<=160 chars)", () => {
    const allViews: AppView[] = [...VIEWS, "grammar"];
    for (const view of allViews) {
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

  it("falls back to grammar-index metadata if a grammar view arrives with no surface", () => {
    expect(seoForView("grammar").title).toContain("文型資料庫");
    expect(seoForView("grammar").canonical).toBe(`${SITE_ORIGIN}/grammar`);
  });

  // The /blog/<slug> route is dynamic (#483): per-article title/description/
  // canonical from the (lightweight) article metadata.
  describe("blog article routes", () => {
    it("builds per-article metadata for a /blog/<slug> route", () => {
      const resolved = seoForView("blog", null, "cho-saikyo-tokimeki");
      expect(resolved.title).toContain("超最強");
      expect(resolved.title).toMatch(/Jabiko/);
      expect(resolved.description.length).toBeGreaterThan(20);
      expect(resolved.description.length).toBeLessThanOrEqual(160);
      expect(resolved.canonical).toBe(`${SITE_ORIGIN}/blog/cho-saikyo-tokimeki`);
    });

    it("falls back to the blog index SEO for an unknown slug", () => {
      const resolved = seoForView("blog", null, "does-not-exist");
      expect(resolved.canonical).toBe(`${SITE_ORIGIN}/blog`);
      expect(resolved.title).toContain("文章");
    });

    it("uses the blog index SEO for the bare /blog route", () => {
      expect(seoForView("blog").canonical).toBe(`${SITE_ORIGIN}/blog`);
      expect(seoForView("blog").title).toContain("文章");
    });
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
