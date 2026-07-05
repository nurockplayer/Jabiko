import { describe, expect, it } from "vitest";
// Raw import (typed via vite/client) reads the committed sitemap without pulling
// in @types/node, so `tsc --noEmit` stays happy.
import sitemapXml from "../../public/sitemap.xml?raw";
import { grammarPatterns } from "./grammarDatabase";

// Drift guard for the generated public/sitemap.xml (#479): if a grammar pattern
// is added/removed, this fails until `pnpm build:sitemap` is re-run, so the
// long-tail grammar pages never silently drop out of search discovery.
describe("sitemap.xml drift guard (#479)", () => {
  it("lists every grammar-point page", () => {
    const missing: string[] = [];
    for (const p of grammarPatterns) {
      const surface = p.pattern.replace(/^[〜～]/, "");
      const url = `https://jabiko.app/grammar/${encodeURIComponent(surface)}`;
      if (!sitemapXml.includes(`<loc>${url}</loc>`)) missing.push(surface);
    }
    expect(missing, `sitemap missing grammar pages (run pnpm build:sitemap): ${missing.join(", ")}`).toEqual([]);
  });

  it("includes the core static routes + the grammar index", () => {
    for (const route of ["/", "/learn", "/challenge", "/mock", "/kanji", "/rules", "/grammar", "/about"]) {
      expect(sitemapXml).toContain(`<loc>https://jabiko.app${route}</loc>`);
    }
  });
});
