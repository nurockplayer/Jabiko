import { describe, it, expect } from "vitest";
// Vite ?raw import (typed via vite/client) -- reads the shipped sitemap as a
// string without pulling node:fs into the test's type-check (@types/node isn't
// installed).
import sitemapXml from "../../public/sitemap.xml?raw";
import { articleMetas, publishedArticleMetas } from "./articlesMeta";

// Drift guard (#483): the sitemap is hand-maintained, so this catches a
// published article that was added to articlesMeta but forgotten in
// public/sitemap.xml (a silent SEO gap), and a draft that leaked in.
describe("sitemap blog coverage", () => {
  it("lists the /blog index", () => {
    expect(sitemapXml).toContain("<loc>https://jabiko.app/blog</loc>");
  });

  it("lists every PUBLISHED article", () => {
    for (const article of publishedArticleMetas) {
      expect(sitemapXml, article.slug).toContain(
        `<loc>https://jabiko.app/blog/${article.slug}</loc>`
      );
    }
  });

  it("excludes DRAFT articles", () => {
    const drafts = articleMetas.filter((a) => a.draft);
    for (const draft of drafts) {
      expect(sitemapXml, draft.slug).not.toContain(
        `<loc>https://jabiko.app/blog/${draft.slug}</loc>`
      );
    }
  });
});
