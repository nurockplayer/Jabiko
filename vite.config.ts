import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    // PWA: installable + offline (issue #131). registerType "autoUpdate"
    // keeps the service worker fresh without a manual update prompt; the
    // registration script is auto-injected into index.html. Precaches the
    // built chunks (incl. the lazy examBlocks ~1MB) so a returning learner
    // can practise offline; the lazy split is unchanged -- precaching runs
    // in the background after load, the initial render still pulls only the
    // index chunk.
    VitePWA({
      registerType: "autoUpdate",
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
        globPatterns: ["**/*.{js,css,html,svg,png,webp,woff2}"],
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
