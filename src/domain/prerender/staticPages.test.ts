import { describe, expect, it } from "vitest";
// Raw imports (typed via vite/client) keep @types/node out of the app build,
// same trick as sitemap.test.ts.
import TEMPLATE from "../../../index.html?raw";
import sitemapXml from "../../../public/sitemap.xml?raw";
import {
  applyHead,
  buildStaticPages,
  escapeHtml,
  isSafePathSegment,
  pageFilePath
} from "./staticPages";
import { grammarPatterns } from "../grammarDatabase";
import { publishedArticleMetas } from "../articlesMeta";

describe("escapeHtml", () => {
  it("escapes the five HTML-special characters", () => {
    expect(escapeHtml(`<a href="x" & 'y'>`)).toBe(
      "&lt;a href=&quot;x&quot; &amp; &#39;y&#39;&gt;"
    );
  });
});

describe("pageFilePath", () => {
  it("maps the root to index.html", () => {
    expect(pageFilePath("/")).toBe("index.html");
  });

  it("maps a static route to a flat .html file (Pages pretty URL, no 308)", () => {
    expect(pageFilePath("/grammar")).toBe("grammar.html");
  });

  it("keeps Japanese segments decoded for the filesystem", () => {
    expect(pageFilePath("/grammar/てもいい")).toBe("grammar/てもいい.html");
  });
});

describe("isSafePathSegment", () => {
  it("accepts Japanese pattern surfaces", () => {
    expect(isSafePathSegment("〜てもいい")).toBe(true);
    expect(isSafePathSegment("〜ざるを得ない")).toBe(true);
  });

  it("rejects segments with filesystem-hostile characters", () => {
    for (const bad of ["a/b", "a\\b", "a?b", "a*b", "a:b", 'a"b', "a<b", "a|b", ".."]) {
      expect(isSafePathSegment(bad)).toBe(false);
    }
  });
});

describe("applyHead", () => {
  const page = {
    path: "/grammar/〜てもいい",
    title: "〜てもいい 的意思與用法 · Jabiko",
    description: "測試用描述文字。",
    canonical: "https://jabiko.app/grammar/%E3%80%9C%E3%81%A6%E3%82%82%E3%81%84%E3%81%84",
    bodyHtml: "<main><h1>〜てもいい</h1></main>"
  };

  it("replaces title, description, canonical and og/twitter tags", () => {
    const html = applyHead(TEMPLATE, page);
    expect(html).toContain("<title>〜てもいい 的意思與用法 · Jabiko</title>");
    expect(html).not.toContain("<title>Jabiko · JLPT 日檢自習室");
    expect(html).toContain(`<link rel="canonical" href="${page.canonical}" />`);
    // og + twitter pairs all carry the page title/description now.
    expect(html.match(/測試用描述文字。/g)?.length).toBeGreaterThanOrEqual(3);
    expect(html).toContain(`property="og:url" content="${page.canonical}"`);
  });

  it("injects the static body into #root", () => {
    const html = applyHead(TEMPLATE, page);
    expect(html).toContain('<div id="root"><main><h1>〜てもいい</h1></main></div>');
  });

  it("escapes HTML-special characters in metadata values", () => {
    const html = applyHead(TEMPLATE, { ...page, title: 'A"B<C>' });
    expect(html).toContain("<title>A&quot;B&lt;C&gt;</title>");
  });
});

describe("buildStaticPages", () => {
  const pages = buildStaticPages();
  const byPath = new Map(pages.map((p) => [p.path, p]));

  it("covers every top-level view", () => {
    for (const route of [
      "/",
      "/learn",
      "/rules",
      "/kanji",
      "/challenge",
      "/mock",
      "/about",
      "/grammar",
      "/blog"
    ]) {
      expect(byPath.has(route), route).toBe(true);
    }
  });

  it("covers the five JLPT level indexes", () => {
    for (const level of ["n1", "n2", "n3", "n4", "n5"]) {
      const page = byPath.get(`/grammar/${level}`);
      expect(page, level).toBeDefined();
      expect(page!.title).toContain(level.toUpperCase());
    }
  });

  it("covers every grammar point with its content in the body", () => {
    const grammarPages = pages.filter(
      (p) => p.path.startsWith("/grammar/") && !/^\/grammar\/n[1-5]$/.test(p.path)
    );
    expect(grammarPages.length).toBe(grammarPatterns.length);

    // Route surface strips the leading 〜 (matches app links + sitemap).
    const temoii = byPath.get("/grammar/てもいい");
    expect(temoii).toBeDefined();
    const pattern = grammarPatterns.find((p) => p.pattern === "〜てもいい")!;
    expect(temoii!.bodyHtml).toContain(escapeHtml(pattern.meaningZh));
    expect(temoii!.bodyHtml).toContain(escapeHtml(pattern.formation));
    expect(temoii!.bodyHtml).toContain(escapeHtml(pattern.examples[0].japanese));
    // Related patterns become real crawlable links.
    expect(temoii!.bodyHtml).toContain('<a href="/grammar/');
  });

  it("links every grammar point from the grammar index (crawler discovery)", () => {
    const index = byPath.get("/grammar")!;
    const linkCount = index.bodyHtml.match(/<a href="\/grammar\//g)?.length ?? 0;
    expect(linkCount).toBeGreaterThanOrEqual(grammarPatterns.length);
  });

  it("covers the blog index and every published article", () => {
    const blogIndex = byPath.get("/blog")!;
    for (const meta of publishedArticleMetas) {
      expect(blogIndex.bodyHtml).toContain(`/blog/${encodeURIComponent(meta.slug)}`);
      const article = byPath.get(`/blog/${meta.slug}`);
      expect(article, meta.slug).toBeDefined();
      expect(article!.title).toContain(meta.title);
    }
  });

  it("gives every page a nav, an h1 and an absolute canonical", () => {
    for (const page of pages) {
      expect(page.canonical.startsWith("https://jabiko.app"), page.path).toBe(true);
      expect(page.bodyHtml.includes('<a href="/">'), page.path).toBe(true);
      expect(page.bodyHtml.includes("<h1>"), page.path).toBe(true);
    }
  });

  it("covers every URL in the committed sitemap (drift guard)", () => {
    const locs = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs.length).toBeGreaterThan(0);
    for (const loc of locs) {
      const route = decodeURIComponent(new URL(loc).pathname);
      const normalized = route !== "/" && route.endsWith("/") ? route.slice(0, -1) : route;
      expect(byPath.has(normalized), loc).toBe(true);
    }
  });
});
