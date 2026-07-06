// Postbuild prerender (#478, GEO/P0): bake every public route into a real
// static HTML file under dist/, so crawlers that never execute JavaScript
// (GPTBot / ClaudeBot / PerplexityBot / Bingbot in practice) can read titles,
// content and <a> links. Cloudflare Pages serves physical files before the
// SPA fallback, so this is a pure additive layer — the app itself is
// untouched and hydration replaces the static body wholesale.
//
// Page data comes from src/domain/prerender/staticPages.ts (unit-tested,
// enumerates routes from the same domain modules the app uses). This script
// is only the I/O shell: it loads that TS module through Vite's ssrLoadModule
// (no extra runner dependency), applies each page to the built index.html
// template, and writes dist/<route>/index.html.
//
// Run AFTER `vite build` (see package.json "build"). Ordering note: the PWA
// precache manifest is generated during the build, so the extra HTML files
// are NOT precached — correct, since SW navigations use the app shell and
// these files exist for crawlers/first hits only.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");

const template = readFileSync(path.join(DIST, "index.html"), "utf8");

// Vite dev server in middleware mode purely as a TS module loader; closed
// before exit so the process terminates cleanly.
const server = await createServer({
  root: ROOT,
  logLevel: "error",
  server: { middlewareMode: true },
  optimizeDeps: { noDiscovery: true }
});

try {
  const { buildStaticPages, applyHead, pageFilePath } = await server.ssrLoadModule(
    "/src/domain/prerender/staticPages.ts"
  );

  const pages = buildStaticPages();
  let written = 0;
  for (const page of pages) {
    const filePath = path.join(DIST, pageFilePath(page.path));
    mkdirSync(path.dirname(filePath), { recursive: true });
    writeFileSync(filePath, applyHead(template, page), "utf8");
    written += 1;
  }
  console.log(`[prerender] wrote ${written} static pages into dist/`);

  // Sanity: the root page must have crawlable content now.
  const home = readFileSync(path.join(DIST, "index.html"), "utf8");
  if (!home.includes('<div id="root"><header>')) {
    throw new Error("[prerender] home page has no static body — check applyHead");
  }
} finally {
  await server.close();
}
