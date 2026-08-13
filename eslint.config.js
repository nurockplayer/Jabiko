import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

// ESLint 9 flat config (#663). Baseline scope: repo-wide lint gate that must
// stay behaviour-neutral on the existing codebase.
//
// react-hooks: the full `flat.recommended` preset from the installed
// eslint-plugin-react-hooks v7 is enabled (rules-of-hooks, exhaustive-deps,
// refs, set-state-in-effect, purity, immutability,
// preserve-manual-memoization, static-components, ...). The only deviation is
// exhaustive-deps upgraded from the preset's "warn" to "error" (#687), so lint
// cannot pass with stale deps silently degrading a drill/review hook.
export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "dev-dist/**",
      "coverage/**",
      ".tmp/**",
      ".vite/**",
      "node_modules/**",
      ".git/**",
      ".planning/**",
      ".claude/**",
      ".superpowers/**",
      ".omc/**",
      "memory/**",
      "supabase/**"
    ]
  },
  {
    files: ["**/*.{ts,tsx,mjs,js}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node
      }
    }
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    ...reactHooks.configs.flat.recommended,
    rules: {
      ...reactHooks.configs.flat.recommended.rules,
      // flat.recommended ships exhaustive-deps as "warn"; #687 contract keeps
      // it at "error" (allowed severity upgrade, not a downgrade).
      "react-hooks/exhaustive-deps": "error"
    }
  },
  {
    files: ["**/*.tsx"],
    ...reactRefresh.configs.vite,
    // GrammarPointPage deliberately co-exports a pure helper (cleanExplanation)
    // so its tests can assert the answer-explanation stripping (#339) without a
    // separate module. allowExportNames lets that one named export through
    // while keeping every other non-component export flagged.
    rules: {
      ...reactRefresh.configs.vite.rules,
      "react-refresh/only-export-components": [
        "error",
        { allowExportNames: ["cleanExplanation"] }
      ]
    }
  }
);
