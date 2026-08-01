import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

// ESLint 9 flat config (#663). Baseline scope: repo-wide lint gate that must
// stay behaviour-neutral on the existing codebase.
//
// react-hooks: v7's `flat.recommended` ships the React Compiler rule set
// (refs, set-state-in-effect, purity, immutability, ...) whose reports would
// force restructuring deliberately-designed render-phase refs / effect
// setState in the current code. Those rules are deliberately NOT enabled here
// (tracked in a follow-up issue); we enable the classic rules-of-hooks +
// exhaustive-deps only. exhaustive-deps is "error" so lint cannot pass with
// stale deps silently degrading a drill/review hook.
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
    plugins: {
      "react-hooks": reactHooks
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
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
