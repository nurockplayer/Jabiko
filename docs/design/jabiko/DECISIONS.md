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

*Amended by [D-26](#d-26) (#861) for the Training loop:* verdict marks are
drawn, feedback settles, questions turn, the meter fills, and ジャビ子 acts
out each verdict. Confetti, idle loops and press-scale on controls stay out.

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
motion (the one-shot completion arrival and ジャビ子 beat of D-26 are the
bounded exception). Review should treat any of these surviving in #838/#834 as a
conformance defect.

## D-24 — Scope boundary

JT-1 authorizes presentation only. It does not change routes, learning
behavior, data, analytics, ad policy, localization rules, or promote `/game`.
Where DESIGN.md names a small domain change (navigation grouping, retiring
`doneSpot`, an additive language-source helper, an explicit World load status
separating definition-invalid / state-invalid / valid-empty),
that change still goes through TDD in its implementation issue.

## D-25 — Action language: commands are fills, choices are outlines {#d-25}

**Decision.** Jabiko keeps Tachiko's command *grammar* (one primary per
surface; hover/pressed/focus/disabled/busy; busy keeps its label; 7px radius;
3px focus ring) and changes its *expression*:

1. **Border = a value lives here.** Fields, select buttons, answer options and
   segmented controls, checkbox and radio indicators keep `border.control`.
   Command buttons never have a resting border; navigation rows and pagers
   use hairline separators and a hover fill.
2. **Emphasis by fill, not outline.** Primary (solid violet) → tonal (neutral
   fill, the default) → quiet (no fill until hovered). Destructive is tonal red
   at entry points and solid only in the final confirmation.
3. **One strong action, then words.** A hero pair is a large primary plus a
   large *quiet* alternative — never two filled rectangles side by side — and
   the primary follows the phase: before a verdict the answer options are the
   job and the session row has no primary; after it, 下一題 is the primary.
4. **States stay distinct from emphasis.** "On" (`aria-pressed`) uses the
   selection grammar (accent tint + inset edge, the shape mark; plus the
   開/關 word on the furigana toggle where width allows); "open"
   (`aria-expanded`) uses the neutral fill. Neither can be mistaken for a
   primary command. Disabled outranks on/open (an on+disabled command keeps a
   disabled-ink edge).
5. **Bars and the header are quiet toolbars.** Every bar control is a quiet
   command or toggle with secondary-ink icons; a hairline separates the
   product switch from the tools.
6. **The shortcut lives on the command, only while it works.** After a
   verdict 下一題 carries its Enter keycap (`aria-keyshortcuts`) on keyboard
   devices — matching production, where Enter → next is handled only once
   feedback exists.
7. Large hero is 48px (was 44).

New Jabiko-owned roles: `action.tonal.background` / `.hover` / `.pressed`
(light `#ECEEF4`/`#E2E5ED`/`#D7DBE5`, dark `#2C2E3A`/`#363948`/`#404354`),
each verified ≥ 4.5:1 with `text.primary`. Quiet hover in bars uses
`action.tonal.background` because `surface.inset` is not visible on
`surface.chrome` (1.01:1).

**Why.** The founder's review found the JT-1 actions "read like Bootstrap 4":
a filled primary beside a 1px dark outlined secondary, and outlined boxes in
the top-right corner. That pairing is the framework default — the outline
gives the secondary the same visual weight as an input, so the hero pair and
the header looked like a form. Tachiko Sheet's outlined secondary suits a
dense spreadsheet whose commands sit beside many fields; Jabiko's surfaces are
a reading column with one job, where outlines should be reserved for things
the learner chooses (options, levels) so a bordered thing always means "pick
me". Tonal and quiet commands also let the learning content — not the
chrome — be the most visible thing on a surface (UQC §1.1, §6).

Codex challenged the first cut (review round 8): it still read as a generic
filled + tonal recipe on Today, had two primaries in typed recall, let "on"
override "disabled", and advertised Enter before Enter worked. Points 3, 4
and 6 are the answers.

**Rejected.** Pill-shaped buttons (breaks Tachiko's 7px control radius and
D-23's "no pill chips"); accent-tinted secondary (collides with the "on"
state and the selected-segment treatment); shadows or gradients on primary
(D-23, UQC §6); press-scale motion (geometry shift, UQC §1.2); a tint-only
"on" state (the tint alone is ~1.05:1 against chrome; the inset edge is
required).

**Deviation from Tachiko.** Presentation and sizing: the secondary variant
is a fill instead of an outline, bar controls have no resting border, three
tonal roles are added, the large size is 48px with 22px padding, and the
default padding/icon gap are 16/8 (quiet 10). Unchanged: every shared role
value, the 7px radius, the focus ring, and the behavioral contract (states,
busy, one primary) (FOUNDATION.md §4).

## D-26 — Learning-loop motion language (amends D-17) **REVIEW-CONFIRM** {#d-26}

Owner directive #861 (2026-10-10): make the real Training loop feel alive
and rewarding, inspired by Duolingo's *principles* (immediate
acknowledgement, clear feedback, earned celebration) without copying its
assets, characters or choreography. Opus 5.5 holds the motion-design call
for this slice.

**Decision.** The Training loop (`DrillPanel`) gets one motion vocabulary
taken from a Japanese study desk instead of a game: press → **acknowledge**
(the pressed fill, ≤ 90ms); answer → **丸付け**, the D-03 verdict drawn on the
option itself the way a teacher marks a paper (〇 stroke drawn in 320ms on
the right answer; on a miss a × on the pick, then the 〇 on the answer 220ms
later, leading the eye from "yours" to "the answer"; a dashed 〇 fades in for
a reveal), then the explanation **settles** in below it (240ms, 140ms
behind the mark); ジャビ子 **reacts once in its own app-mark tile** (D-10): a
small hop with happy eyes for 正解, a thoughtful head tilt for a miss, a
double hop on completion; Next → **turn**: the new prompt and options rise
6px into place (260ms, options staggered 30ms) and are brought into view if
the learner is scrolled away; a 4px **meter** under "n / N" fills to the
true answered / total (420ms); completion → **arrival**: the result rows
settle in one after another, and a perfect run's badge is stamped.

Constraints, enforced by `src/styles/learning-loop.test.ts` and the
DrillPanel tests: keyframes touch only `transform`, `opacity` and
`stroke-dashoffset`, nothing transitions a layout property, and every
animation sits behind `prefers-reduced-motion: no-preference`. With reduced
motion every state renders final (complete marks, visible feedback, instant
scroll). Nothing loops, blocks input or waits on an animation. The meaning
never rides on motion or colour alone (glyph shape + the existing polite
live region).

**Also made real in the same slice.** D-07 (feedback below the options and
the action row; the row docked to the viewport bottom below 600px for
multiple choice, in flow for typed recall) and D-03's marks on the judged
options. Measured on the same seeded run: on `main` all four answers moved
the options/Next and each new prompt opened 77–945px above the viewport; on
this slice none move, and each new step opens in view. Two browser behaviours
had to be neutralised to keep that promise: scroll anchoring (off while the
drill is shown, otherwise the page jumps by the feedback's height) and the
panel's mount transform (removed where the dock lives, otherwise the
`position: fixed` row is fixed to the panel).

**Why amend D-17.** D-17 allowed only layer and fill transitions and named
"verdict stroke animation" and "celebration" as out. That protected JT-1
from template motion, but it also left the loop mute: the verdict was a
silent colour swap and the moment of getting it right felt the same as a
page reload. The amendment keeps D-17/D-23's intent: no confetti,
particles, glows, bounce loops, sound, overlays, or press-scale on controls
(D-25). It allows motion that *carries the learning message* (which option
is right, where to look next, how far along you are) and one restrained
character beat.

**Rejected.** Duolingo-style bottom verdict sheet with sound and full-width
colour flood (copies a distinctive layout; also moves Next); shaking the
wrong option (punitive, a geometry jiggle under the finger); option scale on
press or verdict (D-25 geometry rule); confetti/sparkles on completion
(D-23); a count-up on the score (the number would be wrong for a moment,
and a screen reader can catch a partial value); brush-textured 花丸 (D-03:
decorative, fragile at small sizes; the 〇 here is a plain 2.2px vector
stroke that only overshoots its start slightly and turns `CanvasText` in
forced colours); invented streak/XP feedback (#861: no invented progress).

**Revision 2 (owner review of PR #862, 2026-10-10).** The owner kept the
direction, asked that the explanation never hide behind the dock, and asked
for ジャビ子 with more personality, emotion and life — "Duolingo-level
liveliness, without holding the animation back". So:

- *Explanation peek.* After the mark lands (420ms), the view scrolls just
  enough to show the first 120px of the explanation above the dock, but never
  so far that the marked options slide under the header. Measured: 120px
  shown at every step (mobile and desktop); option and Next boxes still move
  0px in layout. The view scroll is deliberate and happens after the
  options are disabled, so it cannot cause a mis-tap. It is instant under
  reduced motion.
- *Verdict button.* After answering, the 看答案 slot (always disabled at that
  point) becomes the verdict: ジャビ子 + 正解 / 再想一下 / 先記這題 + 看解說. It
  opens the full explanation and moves focus there; Enter on it never skips
  the question. Same cell, so Next does not move.
- *ジャビ子 as a character* (`JabikoBuddy`, the brand figure without its
  badge): a face per mood (happy ^ ^ with an open smile, oops > < with a
  sweat drop, thinking eyes-up), and acting in squash-and-stretch.
  - 正解: anticipation squash, jump with stretch, squash landing; the
    book-hat pages flap like wings and the shadow shrinks.
  - Miss: head shake and slump, then a determined bounce.
  - Reveal: a long curious tilt.
  - Energy follows the *real* run of correct answers in this session (never
    shown as a number): 3 in a row adds a spin, 5 a double jump.
  - ジャビ子 speaks Japanese interjections, which are learning content and
    are not localized: いいね！ → すごい！ → さすが！, どんまい！ on a miss,
    なるほど… on a reveal. The action-row bubble is a passing remark (pops,
    holds 1.3s, leaves).
  - Completion replaces the retired spot art (D-10) with ジャビ子 cheering,
    scaled by the set's real accuracy: かんぺき！ / よくできました！ /
    がんばったね！
  This extends D-10 for the Training loop: the mascot now appears in the
  action row and on the completion card, besides the app-mark tile.
- Reduced motion keeps every face and the completion line, and drops the
  acting and the passing bubble.

**Limits.** Typed recall gets the turn, meter, verdict button and peek, but
no marks (it has no options). A long verdict title (ja "この問題は
チェックしておこう") is ellipsized in the button; the full text is in the
explanation heading and in the button's accessible name. Founder visual
acceptance of this amendment is pending.

## D-27 — Today leads with ジャビ子 and one job (JT-2, amends D-04, D-10, D-13) **REVIEW-CONFIRM** {#d-27}

Owner directive #866 (2026-10-10): Opus 5.5 leads UI/UX for the whole
product, may revise JT-1 where it blocks a better learner experience, and
must keep learning, data and accessibility contracts.

**What was wrong.** Today stacked two design languages: JT-1 rows on top,
then the legacy marketing page (illustration, a second headline, a seven-card
grid, pill links). The primary action refused to start for a new visitor
("先選擇你的程度…"), the review queue was rendered as a red error alert with
a warning triangle (it is learning, not system state — D-03, C4), and the
real momentum (streak, today's count) was at the very bottom.

**Decision.**

1. **One hero, one job.** Today opens with a single filled panel
   (`accent.background`, 16px radius — the only filled panel on the page):
   ジャビ子 greets in Japanese with a localized gloss, the h2 "今天想練什麼？",
   the real momentum (local-day streak, answered today — readouts, only when
   non-zero), the one primary command 開始今日練習 (56px, ≤ 30rem wide), a
   quiet second action (review queue → continue chapter → next step, the old
   banner priority) and the target-level line with 變更.
2. **No CTA that says no.** A brand-new visitor sees the five level choices
   in the hero instead of the CTA, under "選一個程度，馬上開始第一輪。答錯的題目會自動
   排進複習。" (the old dismissible strip, folded in). A choice starts the
   first round in one tap — except 完全新手, who lands on lesson 1 (五十音)
   because nobody can answer kana questions before learning kana (#532
   learn-landing kept). A returning learner without a level keeps the #532
   gate (the picker opens, the choice continues into the session).
3. **ジャビ子 speaks** (`domain/todayGreeting.ts`): はじめまして！ (new),
   その調子！ (practised today, streak > 1), おかえり！ (practised today),
   おはよう／こんにちは／こんばんは (otherwise; the gloss nudges a live streak
   that still needs today). Lines are Japanese learning content and are not
   localized, like D-26's interjections. "Today" is the learner's local
   calendar day, not UTC; the stats strip shows the same local streak so the
   page never shows two different numbers. Extends D-10: the mascot appears
   on Today. It hops once on arrival (D-26 keyframes); static with reduced
   motion.
4. **Rows with kanji keycaps.** Practice and Conversation & story are row
   lists (hairlines, 64px rows, title + one line + count + chevron). Each row
   leads with a 40px keycap holding one Mincho kanji the learner can read
   (学 活 読 試 復 栞 練 / 話 町) — wayfinding that is itself Japanese, not an
   icon in a tinted circle (D-23 kept). The keycap takes the accent on
   hover/focus.
5. **Order of the page.** Hero → 練習 rows → Stay.D partner line (still after
   the primary learning controls, #745) → 會話與故事 rows → 查資料 links (words,
   not pills) → 學習進度 dashboard → 關於 Jabiko (the illustration, the free/
   no-signup kicker, intro, content counts, guide link) → footer.

**Rejected.** A daily-goal ring (no such goal exists in the data; #861 bans
invented progress); keeping the marketing hero above the fold for SEO (the
prerendered h2 and intro remain on the page, below the job); a mascot
illustration banner (D-23); defaulting a new visitor to a level so the CTA
can always start (#532: the wrong pool for most visitors).

**Evidence.** HomePanel/App tests (one-tap start, starter learn-landing,
returning gate, hero readouts, review-not-alert, page order),
`todayGreeting.test.ts` (local-day streak incl. a UTC-boundary case, in both
the runner's zone and UTC), navigation acceptance reflow at 320px/200% text
in zh-Hant/ja/en × light/dark.

## D-28 — The practice session: one column, phase-following command, 花丸 (JT-2, implements D-18/D-25, closes #864) **REVIEW-CONFIRM** {#d-28}

**What was wrong.** On phones the 13-set picker, session length, speech rate
and score panels rendered *under the question*; on desktop they filled two
side columns. 下一題 (and 再來一組) were filled with the miss red — the legacy
`--vermilion` maps to `assess.miss` in `jt1-compat.css` — so the session's
main action looked like an error and was the loudest control before the
learner answered. The question had three stacked headers (首頁, 第 n/N pill +
type chip, meter) and a radial glow behind the prompt (D-23). The picker's
heading said 今日練習 for every set.

**Decision.**

1. **Session bar** (D-18, inside the drill): 首頁 exit (icon-only < 400px,
   name kept) · the *current* set's name as a button that opens the set
   list · n / N. The meter fills the bar's bottom hairline; the JLPT section
   (漢字読み, 文法形式選擇…) is the prompt's eyebrow under it. The button is
   named by its action (換練習) and described by the set, so it never
   collides with the set's own button in the list.
2. **The set list is a popover at every width**, anchored under the bar and
   overlaying the question (not pushing it); choose, Esc or an outside tap
   closes it and focus returns to the bar. Sets are rows (name + line +
   count), the current one in the selection grammar.
3. **One column + aside.** The drill is a ≤ 720px column; on ≥ 981px a
   280px sticky aside holds 本次 (tally, accuracy, this pass's mistakes) and,
   below a hairline, the compact settings. Below 981px the aside follows the
   drill.
4. **Phase-following primary (D-25 made real).** `.next-button` is the
   violet primary everywhere (fixes the miss-red mapping at its source);
   in the drill 下一題 is tonal before a verdict and primary after
   (`data-emphasis`). 看答案 is quiet.
5. **Options per JT-1 §5**: content surface, 1px control border, 10px radius,
   1–4 keycaps on fine pointers, no tint after the verdict (the edge, the
   D-26 mark and the label carry it); unmarked options step back to
   secondary ink. **#864:** each judged option gets its word on the top edge
   — 正解 / 你的答案 / 答案 (8 locales) — like a teacher's margin note. It is
   CSS generated content with empty alt text from `data-verdict-label`, so it
   takes no room (nothing moves) and the option's text and accessible name
   stay the choice (#862 contract); the live region already announces the
   verdict.
6. **Explanation**: neutral inset surface with a 3px assessment rule on the
   leading edge (no tinted panel); bookmark/report are quiet commands that
   wrap.
7. **花丸.** A perfect set is stamped with a 花丸 — spiral + petals drawn as
   two pen strokes, then pressed like a rubber stamp onto the card's corner
   (in the flow < 480px), in a teacher's red (`--jt-hanko`, brand art like
   C7, not an assessment or status role). It completes the 丸付け language
   of D-26 with something every Japanese learner recognises, instead of
   confetti. Reduced motion: the finished stamp, no drawing.
8. ジャビ子's passing remark in the dock is an accent-filled floating bubble,
   so crossing the explanation reads as speech rather than a rendering bug.

**Rejected.** A bottom sheet with a scrim for the set list (heavier than the
job; a popover keeps the question visible behind it); keeping the desktop
left column (two always-visible columns compete with the question);
tinted option fills (JT-1 §5, D-23); putting the verdict word inside the
option text (breaks #862's text/name contract and re-wraps long options).

**Evidence.** DrillPanel tests (bar, switcher a11y, `data-emphasis`, labels for
miss/correct/reveal in zh-Hant/en/ja, 花丸 only on a perfect set), the motion
contract extended to `today.css` and `session.css`, navigation acceptance
41/41 (e2e now opens 換練習 before touching set controls; the answered
option is measured on the content surface).

## D-29 — Conversations read as conversations; the World leads with a person (JT-2, implements D-19/D-22) **REVIEW-CONFIRM** {#d-29}

**What was wrong.** The Small Talk list was ~21 bordered boxes whose text
started at a different x on every row (a grid inside a `button`, whose global
`justify-content: center` centred the whole text block). Choosing a scene put
its brief and Start button *after the entire list*. A run showed only the
current line under a generic 對方的話, so it never read as a conversation;
feedback said 達成 in link colour; commands were pills outside D-25. The 日常
World header wrapped into two ragged rows of underlined links, the person was
a grey line, and 可開始的場景 headed an empty space.

**Decision.**

1. **Scene rows** (hairlines, like Today): a 短 / 中 / 長 Mincho keycap, the
   situation, and "對象：{partner role}" — who you will talk to. The brief opens
   **directly under the chosen row** (a stable keyed fragment, so the row
   keeps its identity and focus), in the accent field, with the roles as a
   two-column list, the objective in weight, and Start. A seasonal card's
   brief opens under the cards; a single World scene keeps it at the end.
2. **A script** (D-19 made real): lines already said stay above the current
   turn — speaker, then the Japanese line; the learner's in accent ink under
   「你」. A line joins the script only when the conversation moves past it (a
   partner line followed by another, or a reply the learner continues with);
   a retried reply never does, and the current line is never repeated. On
   completion the whole exchange is there to reread. Presentation state only
   — the engine is untouched.
3. **The partner is named**: the current line is headed by the partner's role,
   with the 對方的話 caption kept; the line is set in Mincho at reading size.
4. **Feedback** marks each dimension 〇 (met, `assess.correct`) or △ (could be
   stronger, `assess.partial`) as a glyph plus the word (A4), never ×.
5. **Commands** follow D-25: Start / 換個說法再試一次 / 再跑一次 are primary
   fills, the alternative beside them is quiet; a lone alternative is tonal.
6. **Completion**: ジャビ子 cheers 「おつかれさま！」, the closing a friend would
   say, consistent with the practice completion (D-28).
7. **World home**: a one-line quiet toolbar (two rows on phones; the day label
   moves to the page eyebrow there); the current moment is the page's one
   filled panel — the person first (a monogram of their name, name, who they
   are, the relationship stage), the place, the objective, one Start; the
   main story as five stops on a line (filled when done, the text keeps the
   count). 可開始的場景 only appears when there are scenes under it.

**Rejected.** Chat bubbles (D-19); a length filter (the 21 rows scan well with
keycaps, and 短/中/長 buttons would collide with the rows' accessible names);
inventing scene titles (the catalog has none in learner language — the
situation is the honest title); an avatar illustration per NPC (D-23; the
monogram carries identity).

**Evidence.** ConversationPanel tests (brief follows its row, partner on rows,
script order and no-repeat, retry not scripted, 〇/△ glyphs aria-hidden with
the word), World/App suites green, reflow stress 48/48 (`/`, `/challenge`,
`/conversation`, `/game` at 320px/200% text, system + wide fallback font,
zh-Hant/ja/en, new + returning).
