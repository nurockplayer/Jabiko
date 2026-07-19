import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  // Build id so an anonymous feedback report (#654) maps to a deploy.
  // Cloudflare Pages sets CF_PAGES_COMMIT_SHA at build; "dev" locally / in tests.
  define: {
    __APP_BUILD__: JSON.stringify((process.env.CF_PAGES_COMMIT_SHA ?? "dev").slice(0, 8))
  },
  plugins: [
    react(),
    // PWA: installable + offline (issue #131). registerType "prompt" (#327):
    // a returning learner with an installed SW gets a non-intrusive "new
    // version" toast (usePwaUpdate + UpdateToast) instead of being silently
    // reloaded mid-drill -- the old "auto-inject bare registerSW.js" never
    // reloaded the running page at all, so users were stuck on the old build
    // until they opened an incognito tab. Precaches the built chunks (incl. the
    // lazy examBlocks chunk, now several MB with i18n overlays) so a returning
    // learner can practise offline; the
    // lazy split is unchanged -- precaching runs in the background after load,
    // the initial render still pulls only the index chunk.
    VitePWA({
      registerType: "prompt",
      includeAssets: ["icon.svg", "apple-touch-icon.png", "hero.webp", "og-image.png"],
      manifest: {
        name: "Jabiko · JLPT 自習室",
        short_name: "Jabiko",
        description: "JLPT N1–N5 文法、漢字、單字、模擬考一處練到熟。間隔重複弱點複習、整卷模擬。",
        lang: "zh-Hant",
        theme_color: "#647c5c",
        background_color: "#fdfdf7",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "/pwa-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          },
          { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }
        ]
      },
      workbox: {
        // Client-side routes (/about, /mock, …) have no precached file; serve
        // the app shell for navigations so deep links / refresh work offline
        // too (the host's public/_redirects covers the online first-load).
        navigateFallback: "index.html",
        // The origin-migration bridge (#jabiko-app-domain) must be served as
        // its real static file, not the app shell — jabiko.app iframes it on
        // the OLD origin to pull the visitor's localStorage across the move.
        navigateFallbackDenylist: [/^\/migration-bridge/],
        // Code/markup only here; static images (icons / hero / og) are
        // precached via includeAssets above. Keeping them out of
        // globPatterns avoids duplicate precache entries for the same URL.
        globPatterns: ["**/*.{js,css,html,woff2}"],
        // Exclude on-demand furigana data from initial precache (#599, #618).
        // These chunks load only in the matching view with furigana enabled;
        // precaching them would merely shift their cost to SW installation.
        globIgnores: ["**/furiganaExplanationData*", "**/furiganaLearningData*"],
        // The lazy examBlocks chunk holds every exam item + its per-locale
        // content overlays (#400), so it grows with each language we translate
        // (~3.6MB at en, heading toward ~6MB once ja lands). Lift the precache
        // size cap so it stays available offline. NOTE: once several more
        // locales are translated this chunk gets large to precache for every
        // user -- revisit per-locale code-splitting / runtime caching then.
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024
      }
    })
  ],
  test: {
    globals: true,
    projects: [
      {
        extends: true,
        test: {
          name: "domain-node",
          environment: "node",
          setupFiles: "./src/test/setupNode.ts",
          include: [
            "src/domain/**/*.test.ts",
            "functions/**/*.test.mjs",
            "scripts/**/*.test.ts"
          ],
          exclude: [
            "src/domain/bookmarks.test.ts",
            "src/domain/levelPreference.test.ts",
            "src/domain/originMigration.test.ts",
            "src/domain/diagnostics.test.ts"
          ]
        }
      },
      {
        extends: true,
        test: {
          name: "jsdom",
          environment: "jsdom",
          setupFiles: "./src/test/setup.ts",
          include: [
            "src/App*.test.tsx",
            "src/components/**/*.test.{ts,tsx}",
            "src/hooks/**/*.test.{ts,tsx}",
            "src/i18n.test.ts",
            "src/lib/**/*.test.{ts,tsx}",
            "src/domain/bookmarks.test.ts",
            "src/domain/levelPreference.test.ts",
            "src/domain/originMigration.test.ts",
            "src/domain/diagnostics.test.ts"
          ]
        }
      }
    ]
  }
});
