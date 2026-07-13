// Generates public/sitemap.xml from the app's routes + every grammar-point page
// (/grammar/<surface>) in grammarDatabase.ts, so search engines can discover the
// ~93 long-tail grammar pages (they are NOT reachable from the raw-HTML shell).
// Re-run when routes or grammar patterns change: `pnpm build:sitemap`.
// A drift guard (src/domain/sitemap.test.ts) fails if the committed file omits
// any grammar surface, so this can't silently go stale.
//
// Bare regex parse of grammarDatabase.ts and articlesMeta.ts (no bundler needed).
//
// lastmod rules (#584-B):
//  - Blog articles use publishedAt from articlesMeta.ts
//  - /blog index uses the newest published article's publishedAt
//  - Static routes without a reliable content date omit <lastmod>
//  - Grammar level hubs and detail pages omit <lastmod> (no per-page date available)
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ORIGIN = "https://jabiko.app";

// Static routes (mirrors src/domain/seo.ts view coverage) + the grammar/blog
// indexes. The five grammar level hubs are listed separately below.
const ROUTES = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/learn", changefreq: "weekly", priority: "0.8" },
  { path: "/challenge", changefreq: "weekly", priority: "0.8" },
  { path: "/mock", changefreq: "weekly", priority: "0.8" },
  { path: "/kanji", changefreq: "weekly", priority: "0.7" },
  { path: "/kana", changefreq: "monthly", priority: "0.7" },
  { path: "/rules", changefreq: "monthly", priority: "0.7" },
  { path: "/grammar", changefreq: "weekly", priority: "0.7" },
  { path: "/blog", changefreq: "weekly", priority: "0.7" },
  { path: "/about", changefreq: "monthly", priority: "0.5" },
];

// Grammar level hub pages (present in prerender but missing from sitemap — #584-B).
const LEVEL_HUBS = ["n5", "n4", "n3", "n2", "n1"].map((level) => ({
  path: `/grammar/${level}`,
  changefreq: "weekly",
  priority: "0.6",
}));

function grammarSurfaces() {
  const src = readFileSync(path.join(ROOT, "src/domain/grammarDatabase.ts"), "utf8");
  const surfaces = new Set();
  for (const m of src.matchAll(/^ {4}pattern:\s*"((?:[^"\\]|\\.)*)"/gm)) {
    // Navigable surface = pattern with a leading 〜/～ stripped (matches how the
    // index links: onOpenPattern(pattern.replace(/^[〜～]/, ""))).
    surfaces.add(m[1].replace(/^[〜～]/, ""));
  }
  return [...surfaces];
}

// Published blog-article slugs with publishedAt dates. Bare regex parse of
// articlesMeta.ts (no bundler needed): split the rawArticleMetas array into
// per-entry chunks, extract slug + publishedAt, and skip any entry flagged
// `draft: true` (drafts stay out of search).
function blogArticles() {
  const src = readFileSync(path.join(ROOT, "src/domain/articlesMeta.ts"), "utf8");
  const arr = src.match(/rawArticleMetas[^=]*=\s*\[([\s\S]*?)\];/);
  if (!arr) return [];
  const articles = [];
  for (const chunk of arr[1].split(/\},/)) {
    const slug = chunk.match(/slug:\s*"([^"]+)"/);
    const publishedAt = chunk.match(/publishedAt:\s*"([^"]+)"/);
    if (slug && publishedAt && !/draft:\s*true/.test(chunk)) {
      articles.push({ slug: slug[1], publishedAt: publishedAt[1] });
    }
  }
  return articles;
}

function urlEntry(loc, changefreq, priority, lastmod) {
  let entry = `  <url>\n    <loc>${loc}</loc>`;
  if (lastmod) entry += `\n    <lastmod>${lastmod}</lastmod>`;
  entry += `\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
  return entry;
}

const surfaces = grammarSurfaces();
const blog = blogArticles();

// /blog index gets the latest published article date as lastmod.
const blogLastmod = blog.reduce((max, a) => (a.publishedAt > max ? a.publishedAt : max), "");

const entries = [
  // Static routes — no lastmod (no reliable content modification date).
  ...ROUTES.filter((r) => r.path !== "/blog").map((r) =>
    urlEntry(ORIGIN + r.path, r.changefreq, r.priority),
  ),
  // /blog index with latest publishedAt as lastmod.
  urlEntry(ORIGIN + "/blog", "weekly", "0.7", blogLastmod),
  // Grammar level hubs — no lastmod.
  ...LEVEL_HUBS.map((h) => urlEntry(ORIGIN + h.path, h.changefreq, h.priority)),
  // Grammar detail pages — no lastmod (no per-page date available).
  ...surfaces.map((s) =>
    urlEntry(`${ORIGIN}/grammar/${encodeURIComponent(s)}`, "monthly", "0.6"),
  ),
  // Blog articles with publishedAt as lastmod.
  ...blog.map((a) =>
    urlEntry(`${ORIGIN}/blog/${encodeURIComponent(a.slug)}`, "monthly", "0.6", a.publishedAt),
  ),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`;

writeFileSync(path.join(ROOT, "public/sitemap.xml"), xml);
const routeCount = ROUTES.length + LEVEL_HUBS.length;
console.log(
  `wrote public/sitemap.xml — ${routeCount} routes + ${surfaces.length} grammar pages + ${blog.length} blog articles = ${entries.length} URLs`,
);
