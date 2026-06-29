import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    // PWA: installable + offline (issue #131). registerType "prompt" (#327):
    // a returning learner with an installed SW gets a non-intrusive "new
    // version" toast (usePwaUpdate + UpdateToast) instead of being silently
    // reloaded mid-drill -- the old "auto-inject bare registerSW.js" never
    // reloaded the running page at all, so users were stuck on the old build
    // until they opened an incognito tab. Precaches the built chunks (incl. the
    // lazy examBlocks ~1MB) so a returning learner can practise offline; the
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
        // Code/markup only here; static images (icons / hero / og) are
        // precached via includeAssets above. Keeping them out of
        // globPatterns avoids duplicate precache entries for the same URL.
        globPatterns: ["**/*.{js,css,html,woff2}"],
        // The lazy examBlocks chunk is ~1MB; lift the precache size cap so
        // it's available offline.
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024
      }
    })
  ],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts"
  }
});
