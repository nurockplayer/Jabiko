# Japanese Conjugation Trainer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first usable Jabiko MVP: a Vite + React + TypeScript drill app for Japanese verb and adjective conjugation.

**Architecture:** Replace the initial Python starter with a static frontend app. Grammar rules live in testable TypeScript modules, practice question generation lives in a separate engine, and React components only render controls, prompts, feedback, and review state.

**Tech Stack:** Vite, React, TypeScript, Vitest, Testing Library, LocalStorage.

---

## File Structure

- Create `package.json`: pnpm scripts and required frontend/test dependencies.
- Create `index.html`, `src/main.tsx`, `src/App.tsx`: Vite app entry and main UI.
- Create `src/domain/types.ts`: vocabulary, form, question, and attempt types.
- Create `src/domain/vocabulary.ts`: curated MVP verbs and adjectives.
- Create `src/domain/conjugation.ts`: deterministic conjugation and answer validation.
- Create `src/domain/practice.ts`: question selection, scoring, and mistake review helpers.
- Create `src/domain/storage.ts`: LocalStorage wrapper with in-memory fallback.
- Create `src/domain/*.test.ts`: unit tests for grammar, validation, practice, and storage behavior.
- Create `src/styles.css`: responsive notebook-like tool UI.
- Modify `.gitignore`: Node, build, coverage, and existing Python ignores.
- Modify `README.md`: project purpose, commands, and scope.
- Delete `.python-version`, `main.py`, `pyproject.toml`: replace unused Python starter with frontend scaffold.

## Task 1: Frontend Scaffold

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Modify: `.gitignore`
- Modify: `README.md`
- Delete: `.python-version`
- Delete: `main.py`
- Delete: `pyproject.toml`

- [ ] **Step 1: Add Vite/React package metadata**

Create `package.json` with scripts:

```json
{
  "name": "jabiko",
  "version": "0.1.0",
  "private": true,
  "packageManager": "pnpm@10.33.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^5.1.1",
    "vite": "^7.2.7",
    "typescript": "^5.9.3",
    "react": "^19.2.1",
    "react-dom": "^19.2.1",
    "lucide-react": "^0.561.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.1",
    "@types/react": "^19.2.7",
    "@types/react-dom": "^19.2.3",
    "jsdom": "^27.3.0",
    "vitest": "^4.0.15"
  }
}
```

- [ ] **Step 2: Add TypeScript and Vite config**

Create strict TS configs and `vite.config.ts` with React and jsdom test environment.

- [ ] **Step 3: Replace Python starter**

Delete `.python-version`, `main.py`, and `pyproject.toml`. Update `.gitignore` with Node build artifacts while preserving Python ignores.

- [ ] **Step 4: Install dependencies**

Run: `rtk pnpm install`
Expected: `pnpm-lock.yaml` is created with no install failure.

## Task 2: Grammar Core With TDD

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/domain/conjugation.test.ts`
- Create: `src/domain/conjugation.ts`

- [ ] **Step 1: Write failing grammar tests**

Cover:

- `書く` -> `書いて`, `書いた`, `書かない`.
- `行く` -> `行って`, `行った`.
- `飲む` -> `飲んで`, `飲んだ`.
- `話す` -> `話して`, `話した`.
- `買う` -> `買って`, `買った`, `買わない`.
- `食べる` -> `食べて`, `食べた`, `食べない`, `食べます`.
- `する` -> `して`, `した`, `しない`, `します`.
- `来る` -> `来て`, `来た`, `来ない`, `来ます`.
- `高い` -> `高くない`, `高かった`, `高くなかった`.
- `静か` -> `静かではない`, `静かだった`, `静かではなかった`.
- validation trims spaces and optional `。`.

Run: `rtk pnpm test -- src/domain/conjugation.test.ts`
Expected: fail because modules do not exist.

- [ ] **Step 2: Implement minimal grammar module**

Implement typed form generation, irregular tables, godan ending maps, adjective forms, explanations, and `validateAnswer`.

- [ ] **Step 3: Verify grammar tests pass**

Run: `rtk pnpm test -- src/domain/conjugation.test.ts`
Expected: all grammar tests pass.

## Task 3: Vocabulary And Practice Engine With TDD

**Files:**
- Create: `src/domain/vocabulary.ts`
- Create: `src/domain/practice.test.ts`
- Create: `src/domain/practice.ts`
- Create: `src/domain/storage.test.ts`
- Create: `src/domain/storage.ts`

- [ ] **Step 1: Write failing practice/storage tests**

Cover:

- Filters questions by part of speech, verb group, and selected forms.
- Produces expected answers through the grammar module.
- Records incorrect answers as review items.
- LocalStorage wrapper falls back to memory when storage throws.

Run: `rtk pnpm test -- src/domain/practice.test.ts src/domain/storage.test.ts`
Expected: fail because modules do not exist.

- [ ] **Step 2: Implement vocabulary and practice helpers**

Add the curated MVP vocabulary from the design spec. Implement deterministic question building, session scoring helpers, and storage wrapper.

- [ ] **Step 3: Verify practice/storage tests pass**

Run: `rtk pnpm test -- src/domain/practice.test.ts src/domain/storage.test.ts`
Expected: all practice and storage tests pass.

## Task 4: React Study Tool UI

**Files:**
- Create: `src/App.test.tsx`
- Create: `src/App.tsx`
- Create: `src/main.tsx`
- Create: `src/styles.css`

- [ ] **Step 1: Write failing UI tests**

Cover:

- App renders the practice tool immediately.
- User can submit a correct answer and see success feedback.
- User can submit a wrong answer and see the correct form plus explanation.
- Mistake review appears after answering incorrectly.

Run: `rtk pnpm test -- src/App.test.tsx`
Expected: fail because UI files do not exist.

- [ ] **Step 2: Implement React UI**

Build a compact notebook-inspired interface with controls, question prompt, answer input, feedback panel, progress, and mistake review.

- [ ] **Step 3: Verify UI tests pass**

Run: `rtk pnpm test -- src/App.test.tsx`
Expected: UI tests pass.

## Task 5: Build And Manual Verification

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Run full test suite**

Run: `rtk pnpm test`
Expected: all tests pass.

- [ ] **Step 2: Run production build**

Run: `rtk pnpm build`
Expected: TypeScript and Vite build pass.

- [ ] **Step 3: Start dev server and inspect**

Run: `rtk pnpm dev -- --host 127.0.0.1`
Expected: app loads locally with no blank screen.

- [ ] **Step 4: Update README**

Document commands and the MVP scope.
