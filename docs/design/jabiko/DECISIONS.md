# Jabiko JT-1 — consequential decisions

Each entry records the decision, why, what was rejected and, where it matters,
what review should confirm. Items marked **REVIEW-CONFIRM** knowingly change a
previously accepted UX decision or add a product placement and need an
explicit yes/no in review.

"Founder" means the #850 direction: rebuild Jabiko from first principles on
the canonical Tachiko Sheet Design System, remove the AI/SaaS-template
character, preserve product and learning contracts, extend the shared system
only where Jabiko genuinely needs learning patterns, belong to the Tachiko
family without looking like Tachiko Sheet with different content.

---

## D-00 — Supersession of #832 and PR #849 {#d-00}

**Decision.** JT-1 is the Jabiko visual-design authority. It supersedes the
visual authority of #832 (the Jabiko Interface Profile lane) and of PR #849
(Shu-ire SI-1). From #849 it **keeps** the product and learning reasoning:
the capability audit, protected contracts, session surfaces, feedback below
the options (D-07), navigation IA (D-08), heading contract (D-09), mascot kept
and decoration retired (D-10), language names (D-11), dark theme as a delta
(D-12), unavailable ≠ warning (D-15), Small Talk as a script (D-19), copy
hygiene (D-20), truthful `lang` (D-21). It **replaces** #849's visual system:
warm paper neutrals, ink-black primary commands, indigo "learner" color,
vermilion-only marks (〇 in red for correct), brush-drawn marks and 花丸,
stamp card, marginalia layout, and its own type ramp.

**Why.** #849 solved the structure but answered "use the Tachiko foundation"
by specializing almost every Tachiko value (neutrals, action, focus, link,
type ramp). The result is a second, parallel design system — what #832 and
#850 prohibit.

**Consequences.** PR #849 stays historical evidence and should be closed
unmerged once JT-1 is accepted. #838 and #834 implement JT-1.

## D-01 — Authority medium {#d-01}

**Decision.** Same split as Tachiko's own precedence:

- **Figma** (file in `figma-registry.json`) is canonical for visual
  presentation: hierarchy, spacing, typography, component states and the
  responsive layout of each surface. Frames are editable layers, named
  `JT-1 CANDIDATE · <board> · <state> · <viewport>` until independent review
  accepts JT-1, then renamed `JT-1 APPROVED · …` and re-registered.
- **This directory** is canonical for exact values (`tokens.json`), behavior,
  accessibility and localization rules (DESIGN.md), capability coverage
  (CAPABILITIES.md), the Tachiko snapshot (FOUNDATION.md) and reasons (this
  file).
- **The reference harness** (`reference/`) is the executable form of the
  recipes and the source the frames are imported from; not an authority of
  its own. `tools/figma/verify.mjs` fails when the harness changes without a
  re-import, and with `--live` when a frame is edited without re-registration.
- **Conflicts**: values → `tokens.json`; visual presentation → Figma frame;
  behavior/rules → DESIGN.md. The losing artifact is a defect.

**Rejected.** Writing into the Tachiko Sheet canonical file (different
product; must not be modified); reusing the Shu-ire file (its frames are the
superseded system; a separate file avoids mixing authorities); screenshots as
image fills (not editable).

## D-02 — Adopt the Tachiko profile values unchanged; differ by composition, not hue {#d-02}

**Decision.** Every role Jabiko shares with Tachiko — surfaces, ink, borders,
primary action, accent, link, selection edge, focus, protected states,
inverse, scrim — carries the approved **Tachiko** profile value exactly
(FOUNDATION.md §2, enforced by `verify.mjs`). Jabiko is distinct from Sheet
through:

1. **What is the hero.** Sheet's hero is a dense grid. Jabiko's surfaces are
   composed around the current job: the start action on Today, a Japanese
   sentence and its answer options in a session, a script in Small Talk, a
   place and a person in World.
2. **Content typography.** Japanese learning content is set in its own type
   system (Mincho at reading sizes, ruby, phrase-aware breaking) — Tachiko's
   chrome/content separation (UQC §2) applied to a language product.
3. **Density.** Comfortable density, touch floor 44px, answers ≥ 56px, a
   720px reading column with one aside — not the 28px row grid.
4. **Learning patterns** Sheet does not have: answer option, assessment marks,
   script lines, formative dimensions, World moments.
5. **Identity**: the mascot ジャビ子, not the Tachiko sprout.

**Why.** Belonging to the family is cheapest and most honest when the shared
roles are literally shared; re-tinting them (#849) made a second system that
reviewers had to reconcile. Distinctness that comes from task composition
survives implementation; distinctness from a palette shift is cosmetic.

**Rejected.** #849's warm neutrals and ink commands (parallel system); the
Minimal-Focus profile (muted violet `#6C5B95` reads as a disabled state next
to assessment colors and is a Sheet user preference, not a product identity);
Tachiko brand orange `#B87036` as a Jabiko accent (3.88:1 on white fails text
contrast, and it is Tachiko's brand, not Jabiko's); any gradient.

## D-03 — Assessment is its own state family {#d-03}

**Decision.** Learning verdicts use three Jabiko roles that are separate from
Tachiko's protected system states:

| Role | Light / dark | Glyph | Used for |
| --- | --- | --- | --- |
| `assess.correct` | `#206C4E` / `#74CFA5` | 〇 circle | the correct option (chosen or not: "正解"; the chosen one also has its key square filled and the verdict line says 答對了); met Small Talk dimensions |
| `assess.miss` | `#B3361C` / `#F4906F` | × | only the learner's incorrect choice ("你的答案") |
| `assess.partial` | `#5B6072` / `#B9BCCB` | △ | a Small Talk dimension that "可以再加強" — formative, not wrong |
| revealed | `assess.correct`, dashed | dashed 〇 | answer shown without answering ("答案"); never counted as earned |

Verdicts are drawn **on the judged option** (inset 2px edge, filled key
square, trailing glyph + label) and in a verdict line under the options.
They never use notice panels, ⚠/ⓘ icons, `role="alert"` or tinted
backgrounds. Every mark carries a text label; color is never the only signal.
Other options after a verdict dim their text to `text.secondary` and stay in
place.

**Why.** Wrong answers are the most frequent "negative" event in the product;
rendering them as system errors (current production) makes practice feel like
failure and collides with real errors. Keeping the universal green/red
direction (unlike #849's all-vermilion) needs no learning for zh/ja/en
learners; choosing **vermilion** for the miss (hue ≈ 10°) rather than Tachiko's
**crimson** error (hue ≈ 350°) plus different placement and glyph keeps the two
families apart. `assess.correct` shares the success ink *value* by design — same
meaning of "good", different role, so a later Tachiko change to success does not
silently change verdicts (and vice versa).

**Rejected.** Protected success/error for verdicts (conflates state
families, UQC §1.3); one-hue marks (#849 D-03: unfamiliar for `en`, and red
〇 reads as error at a glance); hand-drawn brush marks and 花丸 (decorative
motif; illegible at 16px; forced-colors fragile).

## D-04 — Rows, readouts, one panel; no card grids {#d-04}

**Decision.** Index surfaces are typeset rows (title · description · meta ·
chevron) separated by hairlines under a section title — Tachiko Home's
section grammar. Statistics are Tachiko label/value **readouts** with tabular
numerals; one focal value (points) uses accent ink. The only bordered content
container is the Small Talk **brief** (a detail pane); controls, options and
overlays carry their own Tachiko boundaries.

**Why.** Identical cards for every kind of thing were the main source of the
template look and the missing hierarchy.

**Rejected.** KPI tiles, icon cards, bento layouts.

## D-05 — Two type systems: chrome and Japanese content {#d-05}

**Decision.** Chrome uses Tachiko's roles (display 28/36, title 20/28,
heading 16/24, body 14/20, label 12/20) on the local system stack, with one
change: **meta is 12/16** (Tachiko 11/16) because 11px CJK is below a
comfortable legibility floor. Content roles: `read.body` 16/28 for
explanations and chapter text; Japanese at ≥ 18px in Mincho (`ja.prompt`
28/48 → 22/38 compact, `ja.headword` 40/52 → 32/44, `ja.option` 20/28,
`ja.line` 20/34 → 18/30), below 18px in Japanese Gothic (`ja.body` 16/28);
ruby at 0.5em, never below 9px rendered. Every Japanese carrier sets
`lang="ja"`; prompts and lines use `word-break: auto-phrase; line-break:
strict; text-wrap: pretty`.

**Why.** JLPT booklets are set in Mincho, so the prompt reads like the exam;
explanations are long-form reading and need 16/28.

**Evidence to watch.** Windows without Yu Mincho and Android without Noto
Serif CJK fall back to the platform serif; with `lang="ja"` the fallback is
still a Japanese-capable face (device check in #838).

## D-06 — Comfortable density, touch floor, page rhythm {#d-06}

**Decision.** Comfortable density (36px controls on fine pointers); **44px**
for every interactive target on coarse pointers or below 600px; answer
options ≥ 56px; spacing scale adds 48 and 64 for section/page rhythm.

**Why.** Jabiko is used one-handed on phones; Tachiko's 32/36px targets are
for desktop spreadsheet work.

## D-07 — Feedback below the options; nothing moves after answering **REVIEW-CONFIRM** {#d-07}

**Decision.** After answering, the verdict is drawn on the options and the
feedback block appears **below** them. The action row (看答案 / 下一題) sits
directly under the options on wide and medium widths — *above* anything that
appears after answering — and is fixed to the viewport bottom on compact
widths, so the four options **and Next** keep their exact boxes (all five
compared at 320/390/768/1280/1440 by `verify.mjs`). At 390×844 the marked
options and the verdict line are visible above the fixed row without
scrolling. After a verdict the options are `disabled` (as today) and focus
moves to Next (existing `nextButtonRef` behavior); the verdict region is
`aria-live="polite"`, so the verdict and explanation are announced without a
focus jump.

**Why.** #473 placed the feedback panel above the options so answer and
explanation were adjacent. JT-1 keeps that goal — the correct answer is now
marked *in* the option list directly under the prompt — while removing #473's
mechanism, which moved every option and Next after a tap (UQC §1.2 incidental
geometry shift; mis-taps).

**Consequences.** This changes a tested contract: `DrillPanel.test.tsx`
currently asserts feedback-before-options DOM order. #838 updates that test
RED-first citing D-07. Long-content flows to confirm in #838: a 4-line prompt
plus 4 long options at 320px (feedback scrolls into view below; the verdict
line is announced by the live region), browser text zoom 200%, and typed
recall with the software keyboard open (the field and 送出 stay visible; the
sticky row yields to the keyboard).

## D-08 — Navigation {#d-08}

**Decision.**

- ≥ 1024: header with app mark, "Jabiko", product line; items **今日 · 練習 ·
  學習 · 文型 · 會話** as links with `aria-current="page"` (Tachiko tab state
  grammar: accent ink + 2px underline), **資料 ▾** as a disclosure menu button
  (kanji, conjugation table, kana); then the World product link, focus,
  furigana, menu.
- < 1024: header keeps app mark, focus, furigana, menu; a **bottom tab bar**
  今日 · 練習 · 學習 · 會話 · 資料, where 資料 opens a sheet including the grammar
  database.
- 練習 is current for `/challenge` and `/mock`; 資料 for `/kanji`, `/rules`,
  `/kana` (and grammar on compact). About and Stay.D move to the menu and
  footer.
- **World is a product switch, not a tab** (header link ≥ 1024; Today row and
  menu item below).

**Why.** Cross-route navigation is not an ARIA tablist (Codex challenge);
Tachiko's tab *visual* grammar is a shared primitive, its View-inventory
*meaning* is not. Small Talk is the strategic capability (#810) and gets a
primary slot.

**Implementation note.** `NAVIGATION_REGISTRY` (`src/domain/navigation.ts`)
regrouping is a domain change with tests in #838; no route changes.

## D-09 — Heading contract

Brand is a link, never the h1. Each view's h1 is its own subject (question
type, chapter, grammar surface, place name, "依官方題型逐區練習"). Today keeps
the product title "Jabiko · JLPT 自習室" as its h1 (SEO), set quietly above the
set headline. `seo.ts` titles/meta unchanged.

## D-10 — Identity: the mascot in Tachiko's app-mark slot {#d-10}

**Decision.** ジャビ子 (`JabikoMark`) fills the 32px rounded app-mark tile where
Tachiko products put their mark; its art colors stay fixed in both themes.
The watercolor hero, spot illustrations and rotating completion art
(`doneSpot`) are retired. World NPCs are shown as **monograms** (first kanji
of the name, Mincho) until a separate character-art authority exists; no art
is commissioned or imitated here.

**Implementation note.** `src/domain/doneSpot.ts` becomes dead with the new
completion surface; remove it with its test in #838.

## D-11 — Language names, not flags

The picker lists 繁體中文 · 日本語 · English in their own scripts with codes.

## D-12 — Dark theme is a Jabiko delta {#d-12}

**Decision.** Light stays default; the persisted `jabiko.theme` dark option
stays, with values derived from Tachiko's hues (cool ink, violet accent)
in `tokens.json` `color.dark`, every declared pair verified (60/60). Primary
hover/pressed go **darker** in dark mode so the white label keeps ≥ 4.5:1.

**Why.** Existing user preference; InterfaceProfileV1 is light-only, so this
is Jabiko-owned and does not widen the Tachiko contract.

## D-13 — Today leads with the next action {#d-13}

**Decision.** Order: quiet product h1 + date → today's set (headline "先複習
**3** 題，再練 20 題", composition, target level, start / review-only) →
record (14-day strip, readouts; aside on wide, directly after the set below)
→ 接著做 → partner line → 全部練習 + 查資料 → 你的紀錄 → colophon. First run
replaces the set with the level choice (#532 gate) and the record with three
factual lines.

**Why.** Codex: the hero of Today is the start action and the level, not a
sentence. Record follows the set in DOM order so compact users see progress
without scrolling past the index.

## D-14 — One seasonal topic on Today **REVIEW-CONFIRM**

"接著做" may include the top item from the existing deterministic seasonal
discovery (#818). No new ranking, personalization or tracking. New placement of
an existing capability (carried from #849 D-14).

## D-15 — Unavailable is not a warning

Not-yet-available sections render a neutral "— 準備中" status word and a
reason; never warning/error styling, never a disabled-button look.

## D-16 — Column + aside layout {#d-16}

**Decision.** ≥ 1024: a 720px main column and a 320px aside (Tachiko task-panel
pattern: set info, tally, mistakes, settings in sessions; record on Today;
brief in Small Talk; relationships in World; related patterns in Grammar).
Learn uses a 240px TOC column on the left instead. < 1024: one column ≤ 720px;
aside content moves into the flow after its owner or into a sheet (session
settings, set switcher, TOC). Nothing critical lives only in the aside.

**Rejected.** #849 marginalia (two margins at ≥ 1280): a fourth layout tier
and a learning-notebook metaphor that adds width without adding a job.

## D-17 — Motion

Only layer enter/exit (160/120ms) and hover/pressed fills (120ms) animate. No
verdict stroke animation, confetti, bounce or celebration. Reduced motion
renders everything final.

## D-18 — Session surfaces

An active practice session, Small Talk run and World moment replace the global
header and tab bar with a session bar: exit, set/scene title, progress (meter
+ tabular count; in practice a button opening 本次 — tally and mistakes,
reachable on every width and in endless sessions), furigana, settings
(practice only), menu. Below 600px the
meter becomes a 2px edge under the bar and the title truncates (full name in
`aria-label`). Exit returns to the surface that launched it.

## D-19 — Small Talk reads as a script; dimensions are independent

A run is typeset as a script (speaker label · Japanese line · speak), not chat
bubbles; the learner's line is in accent ink. Feedback lists the five existing
dimensions (聽得懂 · 正確 · 自然 · 接得下去 · 場合語氣) each with its own 〇 met /
△ 可以再加強 — so "natural but the topic stops" is representable (Codex
challenge; `conversationFeedback.ts`). Composition shows 回答 → 補充 → 提問. No
AI scoring claim; the footer note states curated, offline, no speech
recognition.

## D-20 — Copy hygiene

No English eyebrows in other locales; no decorative emoji. New board copy
("把話接下去", "這樣回，對方接得下去嗎？", "今天的對話都完成了", …) is proposed
zh-Hant; #838/#834 add it for every launched locale through the i18n files and
`check:i18n`. Existing copy that has a contract (delete-history description,
checkbox) is used verbatim.

## D-21 — Truthful `lang` on fallback content

When `pickLocalized()` falls back to the zh-Hant source in a `ja`/`en` UI, the
element carries `lang="zh-Hant"`. #838 adds an additive helper returning the
locale used; `pickLocalized()` and its fallback chain are unchanged.

## D-22 — World: the current moment first **REVIEW-CONFIRM (label)** {#d-22}

**Decision.**

- **Composition.** World home leads with "現在": the place (Mincho h1), the
  day/weather context, the person (monogram, name, role, relationship stage),
  their opening line, the objective, and one start action. Other places
  follow; available moments are rows; locked places state their real unlock
  condition from the domain (`availability`), never a teaser.
- **Truthfulness.** A preview note and "預覽" in the identity until a playable
  slice exists (#834 preview boundary); progress is described as
  device-local. Sample places/people on the boards are illustrative, not
  authored content.
- **Three outcomes, three surfaces.** "今天的對話都完成了" (valid world, valid
  progress, nothing available), "日常世界沒有順利載入" (the world definition fails
  `validateGameWorld()`), and "讀不到你在日常世界的進度" (valid definition, but the
  saved state is invalid or unreachable). `getAvailableWorldMoments()` returns
  `[]` for all three, and `validateGameWorld()` checks only the definition, so
  #834 needs an explicit load status that separates definition-invalid,
  state-invalid and valid-empty (a small, tested domain addition). The
  progress error never modifies or clears progress; offering "start over" is a
  separate product decision and is not designed here.
- **Feedback ≠ progress.** Response feedback inside a moment is retryable
  and never announces relationship or unlock changes; those appear only on
  the completed-moment surface, after the conversation session completes and
  the world transition has been applied (`conversationSession`,
  `applyCompletedConversationSession` rejects incomplete sessions).
- **No replay.** Completed moments show "已完成" and no action:
  `applyCompletedConversationSession()` rejects re-completing a moment, and a
  non-progressing replay mode is not an authorized capability. The valid-empty
  surface points to Small Talk for more practice instead.
- **Handoff.** Training suggestions are optional and say so ("可略過"); the
  Training surface shows a return bar under the header ("從「…」過來練習 · 回到對話");
  if the original moment no longer exists the bar falls back to "回到日常"
  from the current place (#836 owns the mechanism).
- **No game HUD**: no currency, energy, map chrome or quest log.
- **Label.** The public product label "日常" (Everyday) is a **proposal**; the
  "Jabiko Life" codename is never shown. Final naming is a founder decision.

## D-23 — Anti-template ledger {#d-23}

Not allowed anywhere in Jabiko UI: gradients and glows; glassmorphism; card
grids and bento boxes; icon-in-tinted-circle feature tiles; pill chips for
navigation; centered marketing heroes inside the app; decorative illustration
or stock Japan motifs; emoji in UI copy; sparkle/"magic" iconography; tinted
verdict panels; shadows on in-flow content; more than one accent hue outside
assessment; English eyebrows in non-English locales; confetti or celebration
motion. Review should treat any of these surviving in #838/#834 as a
conformance defect.

## D-24 — Scope boundary

JT-1 authorizes presentation only. It does not change routes, learning
behavior, data, analytics, ad policy, localization rules, or promote `/game`.
Where DESIGN.md names a small domain change (navigation grouping, retiring
`doneSpot`, an additive language-source helper, an explicit World load status
separating definition-invalid / state-invalid / valid-empty),
that change still goes through TDD in its implementation issue.
