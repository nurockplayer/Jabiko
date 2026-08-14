// Generates public/sitemap.xml from the app's routes and grammar database.
// Re-run after route changes with `pnpm build:sitemap`;
// src/domain/sitemap.test.ts guards against drift.
//
// Vite is used only as a TypeScript module loader, matching prerender.mjs. This
// keeps the sitemap on the same source of truth as the app instead of parsing
// TypeScript source text with regular expressions.
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ORIGIN = "https://jabiko.app";
const ROUTES = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/learn", changefreq: "weekly", priority: "0.8" },
  { path: "/challenge", changefreq: "weekly", priority: "0.8" },
  { path: "/mock", changefreq: "weekly", priority: "0.8" },
  { path: "/kanji", changefreq: "weekly", priority: "0.7" },
  { path: "/kana", changefreq: "monthly", priority: "0.7" },
  { path: "/rules", changefreq: "monthly", priority: "0.7" },
  { path: "/grammar", changefreq: "weekly", priority: "0.7" },
  { path: "/about", changefreq: "monthly", priority: "0.5" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/stay-d", changefreq: "monthly", priority: "0.7" },
];

const LEVEL_HUBS = ["n5", "n4", "n3", "n2", "n1"].map((level) => ({
  path: `/grammar/${level}`,
  changefreq: "weekly",
  priority: "0.6",
}));

function urlEntry({ path: routePath, changefreq, priority, lastmod }) {
  const lines = ["  <url>", `    <loc>${ORIGIN}${routePath}</loc>`];
  if (lastmod) lines.push(`    <lastmod>${lastmod}</lastmod>`);
  lines.push(
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    "  </url>",
  );
  return lines.join("\n");
}

const server = await createServer({
  root: ROOT,
  // These domain modules need only Vite's built-in TS transform. Avoid loading
  // the app's React/PWA plugins for this build-time metadata read.
  configFile: false,
  logLevel: "error",
  server: { middlewareMode: true },
  optimizeDeps: { noDiscovery: true },
});

let grammarPatterns;
try {
  const grammarModule = await server.ssrLoadModule("/src/domain/grammarDatabase.ts");
  grammarPatterns = grammarModule.grammarPatterns;
} finally {
  await server.close();
}

const grammarPaths = [
  ...new Set(
    grammarPatterns.map(
      ({ pattern }) => `/grammar/${encodeURIComponent(pattern.replace(/^[〜～]/, ""))}`,
    ),
  ),
];

const entries = [
  ...ROUTES,
  ...LEVEL_HUBS,
  ...grammarPaths.map((routePath) => ({
    path: routePath,
    changefreq: "monthly",
    priority: "0.6",
  })),
];

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...entries.map(urlEntry),
  "</urlset>",
  "",
].join("\n");

writeFileSync(path.join(ROOT, "public/sitemap.xml"), xml);
console.log(
  `wrote public/sitemap.xml — ${ROUTES.length + LEVEL_HUBS.length} routes + ${grammarPaths.length} grammar pages = ${entries.length} URLs`,
);
