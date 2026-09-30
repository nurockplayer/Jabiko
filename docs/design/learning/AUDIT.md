# Jabiko Learning — current-product audit (input to Shu-ire SI-1)

Status: input evidence for [DESIGN.md](DESIGN.md). Audited at `main`
`5f1c7dee8f12b7b50baa676f1b6147eb5af26bdf` (2026-09-30), dev build, Chromium,
zh-TW locale, 1440×900 and 390×844 (DPR 1), plus answered-question, grammar
point and Small Talk run states. Baseline captures were taken locally and are
not committed (they describe the visual system being retired, not authority).

This document records **what the redesign must keep** (capabilities and
contracts) and **why the current presentation is being replaced**. It is not a
spec for the new design.

## 1. Capability inventory (must remain reachable)

Every row is an existing, user-reachable capability. The redesign may move,
regroup, restyle or progressively disclose any of them; it may not remove,
rename away, or hide one without a discoverable path.

| Area | Capability | Route / owner | Where it lives in SI-1 |
| --- | --- | --- | --- |
| Today | First-run level choice (5 bands: starter, N4・N5, N3・N4, N2・N3, N1・N2) | `/` · `HomePanel`, `levelPreference` | Today sheet, first-run state |
| Today | Daily-set CTA with #532 level gate (asks for a level first, then continues) | `/` → `/challenge` | Today sheet primary action |
| Today | Persistent target-level chip + re-pick (#526) | `/` | Today sheet composition line |
| Today | Review-due banner, continue next chapter, next-step suggestion | `/` | "接著做" index |
| Today | Home cards: Learn, Practice, Vocab reading (starter-aware), JLPT question types, Weakness review, Bookmarks, Small Talk | `/` | "全部練習" index |
| Today | Quick links: grammar DB, kanji, conjugation table, kana chart | `/` | "查資料" index |
| Today | Progress: attempts, chapters, streak, due, mastered, **points** (focal number), accuracy ring, per-level accuracy, 14-day trend, weakest question types | `/` · `stats`, `points`, `analytics/*` | Right margin record + "你的紀錄" |
| Today | Content stats line (`contentStats.ts`) | `/` | Colophon |
| Today | Stay.D partner line (locale-gated, `promo_click` analytics) | `/` · `stayD` | Labelled partner line |
| Today | Footer: wish, bug report, donate, share, legal links | `/` | Footer |
| Practice | Daily set, weakness review, bookmarks | `/challenge` · `practiceMode.MODE_GROUPS` | Set switcher "每日" |
| Practice | 綜合考題庫 + N1–N4 備考 bands | `/challenge` | Set switcher "備考題庫" |
| Practice | Pattern, cloze, vocab reading, basic conjugation (typed recall) | `/challenge` | Set switcher "專項練習" |
| Practice | Deep links `/challenge?mode=&level=` | `challengeDeepLink.ts` | Unchanged |
| Practice | Session length (10/20/30/50/all/custom), TTS rate (normal/slow/slower/custom) | `SessionLengthPicker`, `TtsRatePicker` | Session settings (margin on wide, sheet on compact) |
| Practice | Reset session | `ModePicker` | Left margin / set switcher |
| Practice | Choice answering, keyboard 1–4 + Enter, reveal answer, next/skip | `DrillPanel`, `handleDrillKeyDown` | Session sheet |
| Practice | Typed recall with IME-safe Enter (composition Enter never submits) | `DrillPanel` recall form | Session sheet, recall state |
| Practice | Feedback: verdict, accepted answer(s), explanation, distractor glosses, example + translation, JLPT level tag (post-answer only), grammar note toggle, "study this grammar point" (opens separately, preserves session), bookmark, per-question report | `FeedbackPanel` | Feedback block under marked options |
| Practice | Session tally, accuracy, this-session mistakes | `ScoreReport`, `ReviewList` | Right margin / completion |
| Practice | Completion: counts, perfect-run badge, again/exit, share, feedback, `jabiko.app` watermark | `DrillPanel` done state | Completion sheet (花丸 for perfect) |
| Practice | Empty states: review empty, bookmarks empty, nothing to practise | `DrillPanel` | Empty state |
| Practice | Automation contract: `.drill-panel` `data-question-id`, `data-question-type`, `data-selected`, `data-result`, `data-expected-answer`; options `data-selected`, `data-result` (`correct` / `wrong` / `target`) | `DrillPanel` | **Preserved verbatim** |
| JLPT types | Level N1–N5, section list with counts, unavailable sections | `/mock` · `mockExam.ts` | JLPT sections page |
| Learn | Chapter list by group, completion, recommended-after, chapter body (explanation, examples, pitfalls), drills, kana drills | `/learn` · `learningBlocks` | Learn TOC + chapter |
| Grammar | Level hubs `/grammar/n1..n5`, search, video-example filter, importance filter | `/grammar`, `/grammar/:level` | Grammar index |
| Grammar | Point page: surface h1, level, meaning, formation (zh-Hant only), examples, media examples, related, curated notes, common mistakes, prev/next pager | `/grammar/:surface` | Grammar entry |
| Reference | Kanji onyomi lookup: search, 音讀/訓讀, level filter, ←/→ navigation, load more | `/kanji` | Kanji lattice |
| Reference | Conjugation cheat sheet, kana chart (+ kana drill) | `/rules`, `/kana` | Reference sheet destinations |
| Small Talk | Seasonal discovery (now / coming soon / recent), scenes by length, brief (situation, roles, relationship, objective, instruction), partner line (TTS), response choice, 5-dimension curated feedback, composition (answer/add/ask), retry/continue, completion, change scene | `/conversation` · `conversationSession` | Small Talk intro + script run |
| Shell | Language picker (launched: zh-Hant, ja, en) | `LanguagePicker`, `useLanguage` | Menu → language dialog |
| Shell | Furigana toggle (persisted, default off) | `useFurigana` | Top bar / session bar toggle |
| Shell | Light/dark theme (persisted `jabiko.theme`, default light) | `useTheme` | Menu → appearance |
| Shell | Focus Mode (configure, active, break summary, optional policy-gated ad) | `useFocusMode`, `focus/*` | Top bar focus chip; dialogs; break surface |
| Shell | Google sign-in, sync hint/errors, sign out, delete practice history (confirmed, irreversible) | `useAuth`, `DeletePracticeHistoryDialog` | Menu account block |
| Shell | Feedback form (wish / bug / other, anonymous) | `FeedbackForm` | Menu + footer |
| Shell | PWA update toast, route error boundary (reload / clear cache / home), asset recovery | `UpdateToast`, `RouteErrorBoundary`, `assetRecovery` | Toast; error page |
| Shell | Breadcrumbs, About, Privacy, Terms, Partners, Stay.D page | various | Footer + menu |

## 2. Protected contracts (the redesign does not change these)

- **Routes and deep links**: `APP_VIEW_PATHS` in `src/domain/routes.ts`, grammar
  surface routes, canonical lowercase level paths, the retired-route fallback.
- **Learning behavior**: scoring, answer normalization, SRS, review queue,
  session pools, completion rules, level ranges, kana/reading prompt furigana
  exclusion (`isReadingPrompt`, `allowsOptionFurigana`).
- **Language isolation** (CLAUDE.md): `*Zh` fields, `formation`, `lineZh`,
  `contextZh` render only in `zh-Hant` unless routed through
  `pickLocalized()` / `pickLocalizedOptional()`; `isZhHant` is the only gate;
  `LAUNCHED_LANGUAGES` and `LocaleCode` unchanged.
- **Data**: localStorage keys, attempt store, Supabase sync and RLS, delete-history
  semantics, focus storage.
- **Analytics**: event names and allowlisted payload keys in
  `src/lib/analytics.ts` (including `promo_click.placement` values); no new
  tracking for redesign metrics.
- **Ads**: `docs/adsense.md` fail-closed contract; the only placement is
  `focus-break`; focus sessions stay ad-free.
- **Bundle discipline**: exam bank, furigana data and article bodies stay in lazy
  chunks.
- **SEO**: document titles/meta from `seo.ts`, prerender, sitemap.
- **Automation data attributes** listed in §1.

## 3. Why the current presentation is retired

Observed, not inferred:

1. **Borrowed "cozy Japan" styling instead of product meaning.** Warm cream
   paper (`--app-bg #f4ead8`), sage/matcha buttons, a generated watercolor desk
   hero, and a rotation of torii / daruma / omamori / lantern / tea-cup spot
   illustrations. None of it says anything about practising Japanese; it
   signals "Japan-themed template".
2. **Everything is the same card.** Level options, CTAs, home destinations,
   practice modes, JLPT sections, kanji and chapter rows are all rounded,
   bordered, lightly shadowed cards with icon + title + description + meta +
   arrow. Equal weight everywhere means no hierarchy.
3. **Chrome competes with the task.** Five utility pills plus six navigation
   pills sit above every page, including mid-question. The practice screen puts
   a long mode list and a settings column beside the question; on phones the
   whole mode list follows the question.
4. **The question is not the hero.** The prompt floats inside a radial glow
   with small pill chips; answer options are small bordered tiles; the
   verdict appears as a tinted green/red panel that shoves the options down
   after answering (#473's DOM order). A wrong answer is styled like a system
   error.
5. **Semantic color drift.** Unavailable JLPT sections use a red warning
   triangle (an error signal) for "準備中"; conversation "needs work" uses error
   red; teal, matcha, vermilion, gold and green all act as accents.
6. **Brand voice leaks.** An English eyebrow ("YOUR JLPT SELF-STUDY ROOM.")
   appears in every locale; decorative emoji (🎉) appear in state text.
7. **Mobile is a squeezed desktop.** Navigation wraps into two rows of pills;
   there is no persistent, thumb-reachable navigation.

What is worth keeping: the product's copy discipline (short, factual Chinese
labels), the mascot ジャビ子 as identity, Mincho for large Japanese prompts, the
existing accessibility work (focus return, IME-safe Enter, `lang="ja"` on
Japanese, one h1 per view) and the automation data attributes.
