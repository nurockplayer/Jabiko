import { describe, expect, it } from "vitest";
// Raw import (typed via vite/client) reads the committed sitemap without pulling
// in @types/node, so `tsc --noEmit` stays happy.
import sitemapXml from "../../public/sitemap.xml?raw";
import { grammarPatterns } from "./grammarDatabase";
import { articleMetas, publishedArticleMetas } from "./articlesMeta";

// Drift guard for the generated public/sitemap.xml (#479 grammar / #483 blog):
// if a grammar pattern or a published article is added/removed, this fails
// until `pnpm build:sitemap` is re-run, so the long-tail pages never silently
// drop out of search discovery.
describe("sitemap.xml drift guard (#479 / #483)", () => {
  it("lists every grammar-point page", () => {
    const missing: string[] = [];
    for (const p of grammarPatterns) {
      const surface = p.pattern.replace(/^[〜～]/, "");
      const url = `https://jabiko.app/grammar/${encodeURIComponent(surface)}`;
      if (!sitemapXml.includes(`<loc>${url}</loc>`)) missing.push(surface);
    }
    expect(missing, `sitemap missing grammar pages (run pnpm build:sitemap): ${missing.join(", ")}`).toEqual([]);
  });

  it("includes the core static routes + the grammar index + the blog index", () => {
    for (const route of ["/", "/learn", "/challenge", "/mock", "/kanji", "/rules", "/grammar", "/about", "/blog"]) {
      expect(sitemapXml).toContain(`<loc>https://jabiko.app${route}</loc>`);
    }
  });

  it("lists every PUBLISHED blog article", () => {
    for (const article of publishedArticleMetas) {
      expect(sitemapXml, article.slug).toContain(
        `<loc>https://jabiko.app/blog/${article.slug}</loc>`
      );
    }
  });

  it("excludes DRAFT blog articles", () => {
    for (const draft of articleMetas.filter((a) => a.draft)) {
      expect(sitemapXml, draft.slug).not.toContain(
        `<loc>https://jabiko.app/blog/${draft.slug}</loc>`
      );
    }
  });
});
