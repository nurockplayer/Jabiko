// Generates public/sitemap.xml from the app's routes + every grammar-point page
// (/grammar/<surface>) in grammarDatabase.ts, so search engines can discover the
// ~93 long-tail grammar pages (they are NOT reachable from the raw-HTML shell).
// Re-run when routes or grammar patterns change: `pnpm build:sitemap`.
// A drift guard (src/domain/sitemap.test.ts) fails if the committed file omits
// any grammar surface, so this can't silently go stale.
//
// Bare regex parse of grammarDatabase.ts (no bundler needed): the 93 data
// entries are the 4-space-indented `pattern: "..."` fields (the 2-space
// `pattern: string;` interface field is excluded by the indent).
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ORIGIN = "https://jabiko.app";
// Bump when regenerating for a content refresh; Google largely ignores lastmod
// for small sites, and the drift guard checks URL presence, not this date.
const LASTMOD = "2026-07-05";

// Static routes (mirrors src/domain/seo.ts view coverage) + the grammar/blog
// indexes.
const ROUTES = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/learn", changefreq: "weekly", priority: "0.8" },
  { path: "/challenge", changefreq: "weekly", priority: "0.8" },
  { path: "/mock", changefreq: "weekly", priority: "0.8" },
  { path: "/kanji", changefreq: "weekly", priority: "0.7" },
  { path: "/rules", changefreq: "monthly", priority: "0.7" },
  { path: "/grammar", changefreq: "weekly", priority: "0.7" },
  { path: "/blog", changefreq: "weekly", priority: "0.7" },
  { path: "/about", changefreq: "monthly", priority: "0.5" },
];

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

// Published blog-article slugs (#483). Bare regex parse of articlesMeta.ts (no
// bundler needed): split the articleMetas array into per-entry chunks, take the
// slug, and skip any entry flagged `draft: true` (drafts stay out of search).
// The drift guard (sitemap.test.ts) cross-checks against the real module, so a
// parse miss here can't silently ship.
function blogArticleSlugs() {
  const src = readFileSync(path.join(ROOT, "src/domain/articlesMeta.ts"), "utf8");
  const arr = src.match(/(?:rawArticleMetas|articleMetas)[^=]*=\s*\[([\s\S]*?)\];/);
  if (!arr) return [];
  const slugs = [];
  for (const chunk of arr[1].split(/\},/)) {
    const slug = chunk.match(/slug:\s*"([^"]+)"/);
    if (slug && !/draft:\s*true/.test(chunk)) slugs.push(slug[1]);
  }
  return slugs;
}

function urlEntry(loc, changefreq, priority) {
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${LASTMOD}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

const surfaces = grammarSurfaces();
const blogSlugs = blogArticleSlugs();
const entries = [
  ...ROUTES.map((r) => urlEntry(ORIGIN + r.path, r.changefreq, r.priority)),
  ...surfaces.map((s) =>
    urlEntry(`${ORIGIN}/grammar/${encodeURIComponent(s)}`, "monthly", "0.6")
  ),
  ...blogSlugs.map((s) =>
    urlEntry(`${ORIGIN}/blog/${encodeURIComponent(s)}`, "monthly", "0.6")
  ),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`;

writeFileSync(path.join(ROOT, "public/sitemap.xml"), xml);
console.log(
  `wrote public/sitemap.xml — ${ROUTES.length} routes + ${surfaces.length} grammar pages + ${blogSlugs.length} blog articles = ${entries.length} URLs`
);
