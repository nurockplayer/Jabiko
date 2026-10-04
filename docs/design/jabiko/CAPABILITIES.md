# Capability map and protected contracts (JT-1)

Status: binding input for implementation (#838 Training, #834 World shell,
#836 return path). Audited against `main` `5f1c7de`. The inventory carries
forward PR #849's audit (`docs/design/learning/AUDIT.md` on that branch),
re-checked for JT-1 and extended with the World product and the items the
independent Codex challenge flagged.

**Rule.** Every row is an existing, user-reachable capability (or, for World,
an accepted product boundary). JT-1 may move, regroup, restyle or
progressively disclose any of them; it may not remove one, rename it away, or
hide it without a discoverable path **on every width**. The "Compact entry"
column is the < 1024px path; "Evidence" names the board and state.

## 1. Capability → JT-1 location

### Today `/`

| Capability | Owner | Wide (≥ 1024) | Compact entry | Evidence |
| --- | --- | --- | --- | --- |
| First-run level choice (5 bands) | `HomePanel`, `levelPreference` | Today set, first-run radiogroup | same, 2-column, first band full width | `today?state=first` |
| Daily-set CTA with #532 level gate | `/` → `/challenge` | Primary button in the set | same, full width | `today` |
| Target level chip + re-pick (#526) | `/` | "目標 N3・N4" select button, picker opens in place | same | `today` |
| Review-due count, continue chapter, seasonal topic | `/`, #818 | Headline count; "接著做" rows | same | `today` |
| Practice index (daily, banks, JLPT types, focused, chapters, Small Talk) | `/` | "全部練習" rows | same | `today` |
| World entry | #831 boundary | Header product link "日常 預覽"; row in "全部練習" | Row in "全部練習"; menu item | `today`, `system?state=menu-guest` |
| Reference quick links (grammar, kanji, conjugation, kana) | `/` | "查資料" rows; header 資料 menu | "查資料" rows; 資料 tab sheet | `today`, `reference?state=sheet` |
| Progress: points (focal), streak, due, attempts, accuracy, mastered | `stats`, `points`, `analytics/*` | Aside readouts | Directly after the set (DOM order) | `today` |
| 14-day activity | `analytics/*` | Aside day strip with date range and spoken summary | same, after set | `today` |
| Per-level accuracy, weakest question types | `analytics/*` | "你的紀錄" bars | same | `today` |
| Content stats line | `contentStats.ts` | Colophon | same | `today` |
| Stay.D partner line (locale-gated, `promo_click`) | `stayD` | Labelled line under "接著做" | same; link 44px | `today` |
| Footer: wish, bug, donate, share, legal, about | `/` | Footer | same | `today` |

### Practice `/challenge`, `/mock`

| Capability | Owner | Wide | Compact entry | Evidence |
| --- | --- | --- | --- | --- |
| Daily set, weakness review, bookmarks | `practiceMode.MODE_GROUPS` | Set switcher "每日" (session title button; aside "換一組") | Session title button → switcher sheet; settings sheet "換一組練習" | `sets?state=switcher` |
| 綜合考題庫 + N1 / N2 / N3 / N4 備考 | same | Switcher "備考題庫" (all five presets) | same | `sets?state=switcher` |
| 句型練習, 句中填空, 単字讀音, 基礎變化 | same | Switcher "專項練習" (all four) | same | `sets?state=switcher` |
| JLPT question-type sections, unavailable sections | `/mock`, `mockExam.ts` | JLPT sections page; "準備中" status word | same | `sets?state=mock` |
| Deep links `/challenge?mode=&level=` | `challengeDeepLink.ts` | unchanged | unchanged | — |
| Set configuration: 題庫範圍 (単字讀音 only); for 基礎變化 練習類型, 答題方式 (choice/recall), level multi-select (unavailable levels disabled), 練習重點, 動詞類別 multi-select, 目標形 | `ModePicker` (conditional) | Aside 調整 → settings dialog "這一組" section | Session bar sliders → settings sheet "這一組" | `session?state=settings-basic` (390, 1440), `settings-range` |
| Session length (10/20/30/50/all + custom 1–999) | `SessionLengthPicker` | Aside "本次設定 · 調整" | Session bar sliders → settings sheet | `session?state=settings`, `settings-custom` |
| TTS rate (normal/slow/slower + custom 0.5–1.5 with draft retention) | `TtsRatePicker` | same | same | `session?state=settings`, `settings-custom` |
| Reset session | `ModePicker` | Aside "重設本次" | Settings sheet (states what is cleared) | `session?state=settings` |
| Choice answering, 1–4 + Enter, reveal, next | `DrillPanel` | Options + action row + keycap hint | Options; sticky action row (Enter on hardware keyboards) | `session` states |
| Typed recall, IME-safe Enter | `DrillPanel` recall | Recall form with hint | same; hint visible | `session?state=recall` |
| Furigana toggle; reading prompts/options never get ruby | `useFurigana`, `isReadingPrompt`, `allowsOptionFurigana` | Session bar toggle | same (glyph only, labelled) | `session` |
| Feedback: verdict, accepted answer(s), explanation, distractor glosses, example + translation, level tag (post-answer only) | `FeedbackPanel` | Under the marked options | same | `session?state=wrong`, `components` |
| Grammar note toggle; "study this grammar point" (opens separately, session kept) | `FeedbackPanel` | Feedback action row when the item has a grammar point | same | `components` (feedback actions) |
| Bookmark, per-question report | `FeedbackPanel`, `QuestionReportForm` | Feedback action row | same | `session?state=wrong` |
| Tally (attempts, correct, accuracy, mistake count), this-session mistakes — including endless (全部) sessions that never reach completion | `ScoreReport`, `ReviewList` | Aside "本次", "本次答錯"; the progress button also opens 本次 | Progress button in the session bar → 本次 sheet (works before completion and in endless mode) | `session?state=summary`, `session?state=complete` |
| Completion: counts, perfect run, again/exit, share, feedback, `jabiko.app` watermark | `DrillPanel` done | Result sheet | same | `session?state=complete`, `perfect` |
| Empty (review/bookmarks/nothing to practise), loading, load error | `DrillPanel` | Session surface | same | `session?state=empty\|loading\|error` |
| Automation contract: `.drill-panel` `data-question-id`, `data-question-type` (`promptLabel ?? targetForm`), `data-selected` (answer text), `data-result` (`unanswered`/`correct`/`wrong`/`revealed`), `data-expected-answer`; options `data-selected="true"`, `data-result` (`correct`/`wrong`/`target`) | `DrillPanel` | **Preserved verbatim**; boards carry representative values (ids are illustrative) | same | `session` |

### Learn, Grammar, Reference

| Capability | Owner | Wide | Compact entry | Evidence |
| --- | --- | --- | --- | --- |
| Chapter list by group, completion (per-chapter rule: required forms, pattern/kana/starter drills, implicit history; reference chapters "參考"), recommended-after, chapter body, drills, kana drills | `/learn`, `learningBlocks` | TOC column + chapter | "章節目錄 · n / 48" button → sheet | `learn` |
| Grammar level hubs, search, video filter, importance filter, live count | `/grammar/:level` | Level link-segment, search, filters, rows | same | `grammar?state=index` |
| Grammar point page (SEO): surface h1, level, meaning, formation (zh-Hant only), examples, media, related, notes, common mistakes, pager | `/grammar/:surface` | Article + related aside | Related after article | `grammar?state=point` |
| Kanji onyomi lookup: search, 音/訓, level filter, load more, search-empty | `/kanji` | Kanji lattice page | same; keycap hint hidden on touch | `reference?state=page` |
| Character selection (`aria-pressed`), in-cell speak, detail (音/訓, meaning, speak, 例詞 with reading/meaning/speak), remembered last-read position, ←/→ walking characters across groups and past load-more | `KanjiOnyomiPanel` | Selected cell + full-width detail row | same (44px speak) | `reference?state=selected`, `page` |
| Conjugation cheat sheet, kana chart (+ drill) | `/rules`, `/kana` | Header 資料 menu; Today "查資料" | 資料 tab sheet | `reference?state=sheet` |

### Small Talk `/conversation`

| Capability | Owner | Wide | Compact entry | Evidence |
| --- | --- | --- | --- | --- |
| Seasonal discovery (now / coming / recent) | #818 | "最近適合聊的季節話題" rows with phase word | same | `talk?state=intro` |
| Scenes by length; brief (situation, roles, relationship, objective, instruction) | `conversationSession` | Rows + brief panel (aside), focus moves to brief on selection | Brief follows the list | `talk?state=intro` |
| Partner line + TTS, response choice | same | Script + response options | same | `talk?state=respond` |
| 5-dimension curated feedback (independent), composition answer/add/ask, retry/continue | `conversationFeedback` | Feedback block | same | `talk?state=feedback` |
| Completion, change scene | same | Completion | same | `talk?state=complete` |

### World `/game` (#834 shell; #836 return; content from #833/#835)

| Capability (accepted boundary) | Owner | Wide | Compact entry | Evidence |
| --- | --- | --- | --- | --- |
| Separate product entry and return to Learning | #831, #834 | Header product link both ways | Learning: Today row + menu; World: header "回到練習" | `today`, `world?state=home` |
| Preview labelling (no misleading empty product) | #834 | Note + "預覽" in identity | same | `world?state=home` |
| Current moment: place, time/weather context, NPC, relationship stage, objective, start | #833 domain | "現在" scene block | same | `world?state=home` |
| Other places: available moments, completed moments, locked places with their real unlock condition | #833 | Place sections | same | `world?state=home` |
| Relationship readout | #833 | Aside "認識的人" | After places | `world?state=home` |
| Moment run reusing the Small Talk script/feedback (retryable, no progress claimed); completed transition (relationship stage, unlocks) shown only after the session completes and the world update applies | #810 kernel, #833 (`conversationSession`, `applyCompletedConversationSession`) | Session surface | same | `world?state=moment\|feedback\|complete` |
| Optional, skippable training handoff and return | #836 | Handoff row in feedback; return bar on the Training surface | same | `world?state=feedback\|handoff` |
| Return state no longer valid → safe fallback | #836 | Stale return bar ("回到日常") | same | `world?state=handoff-stale` |
| Valid-empty vs definition-invalid vs saved-progress-invalid | #834 (needs an explicit load status) | Three distinct surfaces; progress never modified | same | `world?state=empty\|error\|progress-error` |
| Completed moments | #833 (`applyCompletedConversationSession` rejects re-completion) | "已完成", no replay action | same | `world?state=home` |

### Shell and system

| Capability | Owner | Wide | Compact entry | Evidence |
| --- | --- | --- | --- | --- |
| Language picker (zh-Hant, ja, en launched) | `LanguagePicker` | Menu → dialog | Menu → sheet | `system?state=language` |
| Light/dark theme (`jabiko.theme`) | `useTheme` | Menu segment | same | `system?state=menu-guest` |
| Focus Mode: configure, active timer, break summary, policy-gated ad | `useFocusMode`, `focus/*`, `docs/adsense.md` | Header toggle (shows remaining time when active); dialog; break surface | Header icon toggle; menu item | `system?state=focus-config\|focus-break` |
| Google sign-in, sync status/errors, sign out | `useAuth` | Menu account block | same | `system?state=menu-guest\|menu-user` |
| Delete practice history (confirmed, irreversible; existing copy verbatim) | `DeletePracticeHistoryDialog` | Menu → alertdialog | same | `system?state=delete` |
| Feedback form (anonymous; draft kept on failure) | `FeedbackForm` | Menu + footer → dialog | sheet | `system?state=feedback` |
| PWA update toast; route error (reload / clear cache / home); offline | `UpdateToast`, `RouteErrorBoundary`, `assetRecovery` | Toast; error page; warning notice | same (toast above tab bar) | `system?state=update\|route-error\|offline` |
| Breadcrumbs, About, Privacy, Terms, Partners, Stay.D page | various | Crumbs; footer; menu | same; crumbs 44px | `grammar`, `today` |

## 2. Protected contracts (JT-1 changes none of these)

- **Routes and deep links**: `APP_VIEW_PATHS` (`src/domain/routes.ts`), grammar
  surface routes, canonical lowercase level paths, retired-route fallback.
  `/game` is added by #834, not by this authority.
- **Learning behavior**: scoring, answer normalization, SRS/review queue,
  session pools, completion rules, level ranges, reading-prompt furigana
  exclusion (`isReadingPrompt`, `allowsOptionFurigana`), Small Talk
  evaluation (`evaluateCuratedConversationResponse`) and World progression
  (`applyCompletedConversationSession`).
- **Language isolation** (CLAUDE.md): `*Zh`, `formation`, `lineZh`,
  `contextZh` render only when `isZhHant`, unless routed through
  `pickLocalized()` / `pickLocalizedOptional()`; `LAUNCHED_LANGUAGES` and
  `LocaleCode` unchanged. Boards are authored in zh-Hant; `formation` appears
  only on zh-Hant boards.
- **Data**: localStorage keys, attempt store, Supabase sync/RLS, delete-history
  semantics, focus storage.
- **Analytics**: event names and allowlisted payload keys (`src/lib/analytics.ts`),
  including `promo_click.placement`; no new tracking for design metrics.
- **Ads**: `docs/adsense.md` fail-closed; the only placement is `focus-break`;
  focus sessions stay ad-free.
- **Bundle discipline**: exam bank, furigana data, article bodies and the
  World/game code stay in lazy chunks.
- **SEO**: titles/meta from `seo.ts`, prerender, sitemap.
- **Automation data attributes** (§1 Practice).

## 3. Why the previous presentations are retired

Current production (observed, `main` `5f1c7de`): borrowed "cozy Japan"
styling (cream paper, matcha buttons, watercolor hero, torii/daruma spot
illustrations); every destination the same rounded card with icon + title +
description + arrow; five utility pills plus six navigation pills above every
page including mid-question; the question floating in a glow with small option
tiles; wrong answers styled as system errors in tinted panels; teal, matcha,
vermilion, gold and green all acting as accents; an English eyebrow in every
locale and decorative emoji; phones as a squeezed desktop. That is the
"AI/SaaS template" character #850 retires.

PR #849 (Shu-ire SI-1) fixed most of the structure but built a parallel
visual system (warm paper, ink-black commands, indigo learner color,
vermilion-only marks, hand-drawn brush marks, marginalia layout) instead of
the Tachiko foundation. JT-1 keeps its product reasoning and replaces its
visual decisions (DECISIONS.md D-00).

Worth keeping from both: the factual zh-Hant copy discipline, the mascot
ジャビ子, Mincho for large Japanese prompts, focus return, IME-safe Enter,
`lang="ja"` on Japanese, one h1 per view, and the automation attributes.
