import { describe, expect, it } from "vitest";
// Raw import (typed via vite/client) reads the committed sitemap without pulling
// in @types/node, so `tsc --noEmit` stays happy.
import sitemapXml from "../../public/sitemap.xml?raw";
import { grammarPatterns } from "./grammarDatabase";
import { articleMetas, publishedArticleMetas } from "./articlesMeta";
import { buildStaticPages } from "./prerender/staticPages";

// Helper: extract the <url> block containing a given <loc> value.
function urlBlockFor(loc: string): string | undefined {
  const idx = sitemapXml.indexOf(`<loc>${loc}</loc>`);
  if (idx < 0) return undefined;
  const start = sitemapXml.lastIndexOf("<url>", idx);
  const end = sitemapXml.indexOf("</url>", idx);
  return sitemapXml.slice(start, end + "</url>".length);
}

// Drift guard for the generated public/sitemap.xml (#479 grammar / #483 blog):
// if a grammar pattern or a published article is added/removed, this fails
// until `pnpm build:sitemap` is re-run, so the long-tail pages never silently
// drop out of search discovery.
describe("sitemap.xml drift guard (#479 / #483)", () => {
  it("matches the prerendered public route set in both directions", () => {
    const locs = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
    const sitemapPaths = locs.map((loc) => decodeURIComponent(new URL(loc).pathname));
    const prerenderPaths = buildStaticPages().map((page) => page.path);

    expect(new Set(sitemapPaths).size, "sitemap contains duplicate URLs").toBe(locs.length);
    expect([...sitemapPaths].sort()).toEqual([...prerenderPaths].sort());
  });

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
    for (const route of ["/", "/learn", "/challenge", "/mock", "/kanji", "/kana", "/rules", "/grammar", "/about", "/blog"]) {
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

// #584-B: grammar level hub pages + per-page trusted lastmod.
describe("sitemap grammar level hubs and lastmod (#584-B)", () => {
  it("includes the five grammar level hub pages (/grammar/n5 … /grammar/n1)", () => {
    for (const level of ["n1", "n2", "n3", "n4", "n5"]) {
      expect(sitemapXml).toContain(`<loc>https://jabiko.app/grammar/${level}</loc>`);
    }
  });

  it("uses the publishedAt date as lastmod for every blog article", () => {
    for (const article of publishedArticleMetas) {
      const block = urlBlockFor(`https://jabiko.app/blog/${article.slug}`);
      expect(block, article.slug).toBeDefined();
      expect(block!).toContain(`<lastmod>${article.publishedAt}</lastmod>`);
    }
  });

  it("uses the most recent publishedAt as lastmod for the /blog index", () => {
    const latest = publishedArticleMetas.reduce(
      (max, a) => (a.publishedAt > max ? a.publishedAt : max),
      ""
    );
    const block = urlBlockFor("https://jabiko.app/blog");
    expect(block).toBeDefined();
    expect(block!).toContain(`<lastmod>${latest}</lastmod>`);
  });

  it("omits lastmod for static routes that have no reliable content date", () => {
    for (const route of ["/", "/learn", "/challenge", "/mock", "/kanji", "/kana", "/rules", "/grammar", "/about"]) {
      const block = urlBlockFor(`https://jabiko.app${route}`);
      expect(block, route).toBeDefined();
      expect(block!, `${route} should not contain <lastmod>`).not.toContain("<lastmod>");
    }
  });

  it("omits lastmod for grammar level hubs (/grammar/n1 … /grammar/n5)", () => {
    for (const level of ["n1", "n2", "n3", "n4", "n5"]) {
      const block = urlBlockFor(`https://jabiko.app/grammar/${level}`);
      expect(block, level).toBeDefined();
      expect(block!, `/grammar/${level} should not contain <lastmod>`).not.toContain("<lastmod>");
    }
  });

  it("omits lastmod for grammar detail pages (no reliable per-page date)", () => {
    // Reuse the same URL construction as "lists every grammar-point page" to
    // avoid drift between the two guards.
    const locs: string[] = [];
    for (const p of grammarPatterns) {
      const surface = p.pattern.replace(/^[〜～]/, "");
      locs.push(`https://jabiko.app/grammar/${encodeURIComponent(surface)}`);
    }
    expect(locs.length).toBeGreaterThan(0);
    for (const loc of locs) {
      const block = urlBlockFor(loc);
      expect(block, loc).toBeDefined();
      expect(block!, `${loc} should not contain <lastmod>`).not.toContain("<lastmod>");
    }
  });
});
