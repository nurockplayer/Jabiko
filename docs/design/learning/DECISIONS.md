# Jabiko Learning Shu-ire — consequential decisions (SI-1)

Each decision records the choice, the reason, the rejected alternatives and,
where it matters, what evidence or confirmation review should look for.
"Founder" means the direct 2026-09-30 instruction that commissioned this work:
completely redesign Jabiko Learning, treat the current visual system as
disposable, reuse the genuinely cross-product Tachiko foundation without
looking like Tachiko Sheet, preserve learning/behavior/data/accessibility
contracts, and deliver canonical design authority (not production code).

Items marked **REVIEW-CONFIRM** knowingly change a previously accepted UX
decision or product surface and need an explicit yes/no during review.

---

## D-01 — Authority medium: repository-hosted, render-first authority {#d-01}

**Decision.** The canonical authority for Jabiko Learning SI-1 is this
directory: `tokens.json` (values), `reference/shu-ire.css` (executable
recipes), the reference boards, the committed renders, `DESIGN.md` (rules) and
this log. The Tachiko foundation is consumed from the #71 approved nodes via
their hash-verified native exports (FOUNDATION-SNAPSHOT.md).

**Why.** The founder asked for implementation-grade authority preserved in the
repository and opened as a PR. The canonical Tachiko Figma file is still not
connected through the qualified bridge (the #832 blocker), so an editable
Figma deliverable cannot be produced or read back this session. Render-first
HTML/CSS is the authoring path Tachiko Sheet's own authority README accepts
for dense work, and it makes every value mechanically checkable.

**Rejected.** Waiting for Figma (blocks the founder's request indefinitely);
treating the superseded PR #840 prototype as a base (superseded); an unsaved
Figma document (not canonical).

**Consequences.** Importing these boards into Figma later is an optional
follow-up, not a precondition for #838. This PR records the Learning/Training
half of #832's Jabiko profile; the WORLD half remains open in #832.

## D-02 — Three inks with exclusive jobs

**Decision.** Color is reserved for meaning:

- **Sumi (ink)** — text, structure, and every primary command.
- **Ai (indigo)** — the learner's own hand: chosen answer, pressed toggles,
  selected segments, focus ring, links.
- **Shu (vermilion)** — evaluation by Jabiko only: verdict marks, scores,
  due-for-review counts, completion, points.

Protected Tachiko state colors (warning/error/success/disabled/destructive)
keep their meaning and never stand in for learning verdicts.

**Why.** The current UI spends accent color on decoration, so nothing reads as
important. Two actors (learner and marker) are the actual semantics of a
practice product; giving each one ink makes state legible without legends.
Ink commands keep Jabiko visibly distinct from Tachiko Sheet's violet.

**Rejected.** Tachiko violet (reads as Sheet); shu primary buttons (dilutes
the verdict, collides with error); a brand gradient (the "AI template" look
the founder rejected).

## D-03 — 丸付け verdict system: one hue, meaning in glyph + label

**Decision.** Correct = open circle 〇, incorrect = ×, revealed = dashed circle,
needs work (formative Small Talk) = △, perfect set = 花丸. All in shu; every
mark is paired with a text label. A shu circle only ever points at the correct
answer. A wrong answer keeps the learner's ai fill and gets a labelled × tag —
never an error panel.

**Why.** This is how Japanese (and Taiwanese) teachers mark work, so it is
specific to the product and culturally native to the primary audience. Using
one hue removes the red-means-wrong / green-means-right binary, which both
fails color-blind users and makes mistakes feel like system failures.

**Risk / REVIEW-CONFIRM.** A red circle for "correct" is unfamiliar to some
English-locale learners. Mitigation: the label ("Correct") is always present
and the circle is the universally readable 〇. Collect learner evidence after
launch; if it fails, the fallback is to keep glyphs and switch `mark.ink` only
for `en` (a token change, not a redesign).

## D-04 — No card grids

**Decision.** Index surfaces are typeset lists (name · description · meta ·
arrow) separated by hairline rules under a strong section rule. Rounded,
bordered containers are reserved for controls, transient layers (menus,
sheets, dialogs, toasts) and the Small Talk brief.

**Why.** Identical cards for every kind of thing was the main source of the
templated look and the lack of hierarchy (AUDIT §3.2).

## D-05 — Two type systems: chrome vs. Japanese learning content

**Decision.** UI chrome uses the system sans stack with explicit local CJK
faces. Japanese learning content uses Mincho at ≥ 18px (prompts, options,
headwords, partner lines, examples) and Japanese Gothic below 18px. Every
Japanese carrier sets `lang="ja"`; prompts use phrase-aware line breaking
(`word-break: auto-phrase`, `line-break: strict`, `text-wrap: pretty`).

**Why.** Tachiko's rule that application chrome and authored content are
different systems (UQC §2) maps exactly onto Jabiko: the Japanese sentence is
the content. JLPT booklets are set in Mincho, so the prompt reads like the
exam. No font files are distributed.

**Evidence to watch.** Windows without Yu Mincho and Android without Noto
Serif CJK fall back to the platform serif; the fallback must still be a
Japanese-capable face under `lang="ja"` (#16-style device check in #838).

## D-06 — Session surfaces

**Decision.** An active practice session (`/challenge`) and a running Small
Talk scene replace the global top bar and bottom tab bar with a session bar:
exit, set switcher / title, progress ledger, furigana, session settings, menu.

**Why.** Tachiko UQC §1.1: the dominant signal must match the task. Mid-question,
navigation is noise. Every capability stays reachable (exit, menu, switcher).

**Contract.** Exit returns to Today (current `onExit` behavior). The route,
deep links and session state are unchanged; this is presentation only.

## D-07 — Feedback lands on the options; options never move (supersedes #473's DOM order) **REVIEW-CONFIRM**

**Decision.** After answering, the verdict is drawn on the option list itself
(chosen answer, correct answer), the explanation appears directly **below** the
options, and on compact widths the action row is sticky at the bottom.

**Why.** #473's goal — answer and explanation adjacent, no scrolling back — is
kept: the correct answer is now marked in the option list, which sits directly
under the prompt, and the explanation follows it. #473's mechanism (inserting
the feedback panel above the options) moved every option and the Next button
after a tap, which Tachiko UQC §1.2 treats as an incidental geometry shift and
which invites mis-taps. Measured: at 390×844 the prompt, all four marked
options and the verdict line are visible without scrolling
(`renders/session-state-wrong-390x844.png`).

**Rejected.** Keeping #473 order (geometry shift); auto-scrolling (#473
explicitly forbade it).

## D-08 — Navigation information architecture

**Decision.**

- Wide (≥ 1024): top bar with brand, **今日 Today · 練習 Practice · 學習 Learn ·
  文型 Grammar · 會話 Small Talk · 資料 Reference ▾** (kanji, conjugation table,
  kana), then focus chip, furigana toggle, menu.
- Compact/medium (< 1024): top bar with brand, focus, furigana, menu; bottom
  tab bar **今日 · 練習 · 學習 · 會話 · 資料** where 資料 opens a sheet with
  grammar, kanji, conjugation table, kana.
- Practice is current for `/challenge` and `/mock`. Reference (資料) is
  current for `/kanji`, `/rules`, `/kana` (and, on compact, `/grammar`). This
  moves `/kana` from Learn's current state to Reference; Learn chapters still
  link to the kana chart and kana drill.
- Menu holds account/sync, language, appearance, focus, feedback, about,
  partner (locale-gated), sign-out, delete practice history.

**Why.** Six equal pills plus five utility pills gave no hierarchy and wrapped
on phones. Small Talk is the strategic conversation-first capability (#810)
and gets a primary slot; the grammar database remains primary on wide screens
(SEO landing) and one tap away on phones.

**Implementation note.** `NAVIGATION_REGISTRY` (`src/domain/navigation.ts`)
changes grouping (adds `conversation`, `mock` folds into Practice's current
state, `about` and `stayD` move to the menu). That is a domain-layer change
with tests (TDD) in #838; route paths do not change.

**Reserved.** When #834 ships `/game`, it gets an explicit cross-link in the
menu and the Today footer ("World" entry). Its public label waits for the
separate naming decision; the codename "Jabiko Life" is not used in UI.

## D-09 — Heading contract

**Decision.** The brand in the bar is a link ("Jabiko 首頁"), not a heading.
Each view's h1 is its own title (question type in a session, chapter title,
grammar surface, "依官方題型逐區練習", …). Today keeps the product title
("Jabiko · JLPT 自習室") as its h1 for SEO. Document titles and meta from
`seo.ts` are unchanged.

**Why.** Today every view repeats the brand as h1, which says nothing about
the page to assistive tech. GrammarPoint already follows this rule.

## D-10 — Identity: keep the mascot, retire decoration

**Decision.** ジャビ子 (`JabikoMark`, PWA icons) stays as identity — brand
lockup, favicon, PWA. The watercolor hero (`hero.webp`), the spot
illustrations (torii, daruma, omamori, lantern, tea cup, …) and the rotating
completion spot (`doneSpot`) are retired; completion uses the 〇 tally and 花丸.

**Why.** The mascot is Jabiko's own asset with user recognition; the spots are
generic Japan motifs (AUDIT §3.1). No new character art is commissioned here.

**Implementation note.** `src/domain/doneSpot.ts` becomes dead once the
completion screen changes; remove it with its test in #838 (it is
presentation data living in the domain layer).

## D-11 — Language names, not flags

**Decision.** The language picker lists each language in its own script
(繁體中文 · 日本語 · English) with its code; no country flags.

**Why.** Flags denote countries, not languages. Dropping them also allows a
later, separately reviewed removal of the `flag-icons` dependency.

## D-12 — Dark theme retained as a Jabiko delta

**Decision.** Light remains the default; the persisted `jabiko.theme` dark
option stays, with its own verified palette (tokens.json `dark`). The toggle
moves into the menu as a two-state segment.

**Why.** Existing user preference; Tachiko InterfaceProfileV1 is light-only, so
this is explicitly Jabiko-owned.

## D-13 — Today is one sheet, not a dashboard

**Decision.** Today leads with one "today's sheet" (review-first composition,
level chip, one primary action), then "接著做" (continue), the partner line,
the full practice index, and the record. The 14-day activity trend becomes a
stamp card (〇 per practised day) in the right margin; per-level and
weakest-type bars remain in "你的紀錄". The first-run how-it-works banner is
merged into the first-run sheet (① 選程度 ② 今日練習 ③ 答錯自動複習), so its
separate dismiss control is retired.

**Why.** The first thing a returning learner needs is "what do I do now".
The stamp card (radio-exercise attendance card) shows streak and gaps at a
glance without a chart legend.

## D-14 — Today may surface one current seasonal topic

**Decision.** "接著做" may include the top item from the existing deterministic
seasonal discovery (#818). No new ranking, personalization or tracking.

**REVIEW-CONFIRM** — this is a new placement of an existing capability on
Today.

## D-15 — Unavailable is not a warning

**Decision.** Not-yet-available JLPT sections render as a neutral "準備中"
status word with a short reason; they are not styled as disabled controls and
never use the warning/error family.

## D-16 — Marginalia layout

**Decision.** At ≥ 1280px surfaces use a text column (≤ 680px) with a left
margin (set / table of contents) and a right margin (tally, related,
prerequisites). 1024–1279 keeps the right margin; below 1024 margins collapse
into sheets or trailing sections. Nothing critical lives only in a margin.

**Why.** Annotated study sheets are how learners already read; the wide
viewport gains useful context instead of empty space or a third card column.

## D-17 — Motion is for marks and layers only

**Decision.** Only the verdict stroke draw (260ms) and layer enter/exit
(180/120ms) animate. No confetti, bounces or celebratory motion. Reduced motion
renders marks complete and removes transitions.

## D-18 — Scope boundary

**Decision.** SI-1 covers Jabiko Learning (the Training side). It does not
design WORLD scenes, NPCs or game HUD, does not change routes, and does not
promote any entry to `/`.

## D-19 — Small Talk reads as a script, feedback is formative

**Decision.** A run is typeset as a script (speaker label · line), not chat
bubbles; the learner's line is in ai. Feedback dimensions use 〇 (met) and △
(needs work) with labels; composition shows 回答 → 補充 → 提問. No invented
scene titles (the topic label is the heading). Author rationale is shown only
when it exists in the UI language (current content is English-authored, so
it stays hidden in zh-Hant/ja).

**Why.** Chat bubbles would make a curated drill look like an AI chat (#810
explicitly rejects "one generic AI chat box"). △ matches Japanese formative
marking and does not shame a natural-but-dead-end reply.

## D-20 — Copy hygiene

**Decision.** Remove the English eyebrow shown in every locale and decorative
emoji in state copy. New headline copy in the boards ("先複習 N 題，再練 M
題", "把話接下去", "依官方題型逐區練習", …) is proposed zh-Hant; #838 adds it for
every launched locale through the i18n files and `check:i18n`.

## D-21 — Truthful language metadata for fallback content

**Decision.** When `pickLocalized()` falls back to the zh-Hant source in a
`ja` or `en` UI, the rendered element must carry `lang="zh-Hant"`.

**Implementation note.** `pickLocalized()` returns only a string. #838 adds an
additive helper that also returns which locale was used; `pickLocalized()`'s
behavior and fallback chain stay unchanged (CLAUDE.md forbids changing them).
