# Technology Stack

**Analysis Date:** 2026-07-07

## Languages

**Primary:**
- TypeScript 5.9 (strict mode) - All application code under `src/`
- JavaScript (ESM / .mjs) - Build scripts under `scripts/`, Cloudflare Functions under `functions/`

**Secondary:**
- SQL (PostgreSQL dialect) - Supabase migrations under `supabase/migrations/`
- CSS - Stylesheet at `src/styles.css`

## Runtime

**Environment:**
- Node.js 22 (CI and local development)
- Browser: modern evergreen with ES2022 + DOM APIs (no IE/polyfill target)

**Package Manager:**
- pnpm 10.33.0 (enforced via `packageManager` field in `package.json`)
- Lockfile: `pnpm-lock.yaml` (committed)
- `onlyBuiltDependencies`: esbuild, sharp, simple-git-hooks

## Frameworks

**Core:**
- React 19.2.1 - UI library, functional components + hooks only, no class components
- Vite 7.2.7 - Build tool and dev server (`vite.config.ts`)
- TypeScript 5.9.3 - Type system, `tsc --noEmit` for type checking (emit handled by Vite)

**Testing:**
- Vitest 4.0.15 - Test runner (`vitest run`)
  - Config: inline in `vite.config.ts` via `defineConfig` from `vitest/config`
  - Environment: `jsdom` 27.3.0
  - Setup: `./src/test/setup.ts` (localStorage defaults, global mocks)
  - Globals enabled (describe, it, expect available without import)
- @testing-library/react 16.3.0 - Component testing
- @testing-library/jest-dom 6.9.1 - DOM matchers
- @testing-library/user-event 14.6.1 - Simulated user interactions

**Build/Dev:**
- @vitejs/plugin-react 5.1.1 - React Fast Refresh + JSX transform
- vite-plugin-pwa 1.3.0 (workbox) - Offline PWA with precaching
- simple-git-hooks 2.13.1 - Pre-commit hook: runs `pnpm build`
- sharp 0.35.1 - Image optimization (hero.webp)
- kuromoji 0.1.2 - Japanese morphological analyzer (used in build scripts for furigana generation)

## Key Dependencies

**Critical:**
- @supabase/supabase-js 2.108.2 - Database client, auth (Google OAuth PKCE), lazy-loaded via dynamic `import()`

**UI:**
- lucide-react 0.561.0 - Icon library (BookOpen, Globe, Moon, Sun, etc.)
- flag-icons 7.5.0 - Country flags for language picker (TW, JP, GB SVG imports)

**Infrastructure:**
- workbox-window 7.4.1 - PWA service worker lifecycle management (register, update prompt)

## Configuration

**TypeScript:**
- `tsconfig.json`: target ES2022, strict mode, module ESNext, moduleResolution Bundler, jsx react-jsx, noEmit
- `tsconfig.node.json`: composite project for `vite.config.ts` only

**Vite:**
- `vite.config.ts`: React plugin, PWA plugin (registerType "prompt", precache js/css/html/woff2, navigateFallback to index.html, 8MB file size cap)
- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_ZARAZ_ENABLED` (not yet on main branch)

**Linting/Formatting:**
- No ESLint or Prettier configuration detected — the project relies on TypeScript strict mode for code quality enforcement

**Pre-commit:**
- simple-git-hooks runs `pnpm build` before each commit

## Platform Requirements

**Development:**
- pnpm 10.33.0, Node.js 22
- `.env` file with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for auth/sync features
- Run `pnpm dev` for local dev server with HMR

**Production:**
- Cloudflare Pages (static hosting + Functions)
- Build: `pnpm build` (runs `tsc --noEmit && vite build`)
- Output: static files in `dist/` served by Cloudflare CDN
- Custom domain: `jabiko.app` (redirected from `jabiko.pages.dev` via Functions middleware)

---

*Stack analysis: 2026-07-07*
