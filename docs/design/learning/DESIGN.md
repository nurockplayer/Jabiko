# Jabiko Learning — Shu-ire (朱入れ) design specification, SI-1

Status: **canonical design authority for Jabiko Learning (Training side)**,
revision SI-1, proposed for independent review. Production implementation is
#838 and must implement this authority rather than redesign it. Read
[README.md](README.md) for precedence and review, [DECISIONS.md](DECISIONS.md)
for why, [AUDIT.md](AUDIT.md) for what must be preserved, and
[FOUNDATION-SNAPSHOT.md](FOUNDATION-SNAPSHOT.md) for the exact Tachiko rules
inherited.

Values live in [`tokens.json`](tokens.json); executable recipes live in
[`reference/shu-ire.css`](reference/shu-ire.css); every surface below has a
reference board in [`reference/`](reference/) and committed renders in
[`renders/`](renders/). When prose and a token value disagree, `tokens.json`
wins; when a board and this document disagree on behavior, this document wins
and the board is a defect.

Normative words: **must / must not** are acceptance requirements; **should**
is the default that needs a recorded reason to deviate; **may** is optional.

---

## 1. Thesis

> **The page is the learner's; the red ink is Jabiko's.**

朱入れ (shu-ire) is the Japanese word for correcting work in vermilion ink.
Jabiko Learning is a place where a learner answers Japanese and gets it
marked. The design is built from that single act:

- **The sheet.** Japanese text is the content. It is set large, in Mincho, on
  white paper, with nothing competing with it.
- **The learner's hand (ai).** What the learner chooses, focuses and sets is
  drawn in indigo, like a pencil mark on an answer sheet.
- **The marker's hand (shu).** Everything Jabiko *evaluates* — correct,
  incorrect, needs work, due for review, score, a perfect set — is drawn in
  vermilion with the marks every Japanese learner already knows: 〇 × △ 花丸.
- **Ink for everything else.** Structure, labels and commands are sumi black.
  There is no decorative color.

Everything that made the old UI feel templated — cream paper, sage buttons,
card grids, a watercolor hero, Japan-motif spot illustrations — is gone,
because none of it carried meaning.

### Principles

1. **Answer first.** On any practice surface the Japanese prompt and its
   options are the largest, calmest thing on screen. Chrome recedes (Tachiko
   UQC §1.1).
2. **Color is a statement.** Ai means "you did this"; shu means "Jabiko judged
   this". If neither is true, it is ink.
3. **Marks, not alarms.** A wrong answer is information, not an error. System
   problems use Tachiko's protected states; learning verdicts never do.
4. **Typeset, don't containerize.** Hierarchy comes from type, rules and
   position. Boxes are for controls and temporary layers.
5. **Nothing moves under your thumb.** Hover, focus and answering never shift
   the options or the Next button (Tachiko UQC §1.2).
6. **Hide representation, never capability.** Menus, sheets and margins are
   allowed; losing a path to an existing capability is not (UQC §1.5).
7. **Truthful everywhere.** Counts, sync state, availability ("準備中") and
   language metadata say exactly what is true.

## 2. Foundation

Jabiko adopts the Tachiko foundation snapshot in
[FOUNDATION-SNAPSHOT.md](FOUNDATION-SNAPSHOT.md): semantic role contract,
protected state treatments, control geometry (7px control radius, 10px overlay
radius, 1px borders), 3px focus ring with 2px clearance, 4-8-12-16-24-32 spacing,
effective-width tiers 1024/600/320, contrast floors, forced-colors and
reduced-motion behavior, and the UI quality contract. This document specifies
only the **Jabiko delta** (marked Δ) and how the inherited rules apply to
Jabiko surfaces. Spreadsheet-only rules are not inherited (snapshot §5).

## 3. Tokens

### 3.1 Color roles

Full values for light and dark are in `tokens.json`. Usage rules:

| Role | Use for | Never use for |
| --- | --- | --- |
| `surface.app` / `surface.content` | Page and sheet paper | — |
| `surface.chrome` Δ | Hover wash, example-sentence well, focus break background | Section backgrounds or cards |
| `surface.inset` Δ | Notes: pitfalls, common mistakes, neutral status notice | Interactive controls |
| `surface.raised` Δ | Menus, sheets, dialogs, toasts (with elevation) | Page content |
| `text.primary` | Body, Japanese content, names | — |
| `text.secondary` | Descriptions, instructions, secondary labels | Disabled state |
| `text.tertiary` Δ | Metadata, counts, ruby (furigana) | Anything the learner must read to act |
| `text.disabled` | Genuinely unavailable controls | Read-only facts, answered options, "準備中" |
| `text.link` | Inline links | Buttons |
| `border.subtle` | Hairline rules between rows/sections, lattice cells, option rest border | Control boundaries that must be perceivable |
| `border.control` | Editable/selectable control boundaries, unselected answer bubbles | Decorative frames |
| `border.strong` Δ | Section head rule, question head rule, current-location underline | Selection |
| `action.primary.*` | The one primary command per view | More than one command per view group |
| `action.secondary.*` Δ | Hover/pressed wash on secondary controls and options | — |
| `focus.ring` | Keyboard focus only (3px + 2px clearance) | Selection or verdict |
| `learner.mark` / `learner.markForeground` / `learner.tint` Δ | Chosen answer bubble, learner's own Small Talk line, pressed toggles, selected segments and list rows | Verdicts, navigation location |
| `mark.ink` / `mark.tint` Δ | Verdict marks and labels, score numerals, review-due counts, points, practised-day stamps, completion | Buttons, links, focus, navigation, errors, warnings, decoration |
| `state.*` (protected) | System warnings, errors, success (sync, send, save) | Learning verdicts |
| `scrim` | Behind modal layers | — |

Rules:

- **C1.** One primary command per view region. Primary is ink; there is no
  colored primary.
- **C2.** Shu appears only where Jabiko evaluates the learner (list above). A
  count is shu only if it is a consequence of evaluation (review due, correct
  count, points); a setting (session length 20) is ink.
- **C3.** Ai appears only where the learner acted or chose.
- **C4.** Every color signal has a non-color twin: glyph, label, weight,
  underline, position or `aria-*` state.
- **C5.** Contrast floors (verified in `verification/report.json`, both
  themes): ordinary text ≥ 4.5:1 on every surface it appears on; control
  boundaries, focus ring, bubbles, marks and the current-location rule ≥ 3:1.

### 3.2 Typography

Families (system/local only; no font files are distributed):

- **UI** — `system-ui, -apple-system, "Segoe UI"` + explicit local CJK faces;
  `:lang(ja)` prefers Hiragino Sans / Yu Gothic UI / Noto Sans JP;
  `:lang(zh-Hant)` prefers PingFang TC / Noto Sans TC / Microsoft JhengHei.
- **Japanese content, Mincho** Δ — Hiragino Mincho ProN, Yu Mincho, Noto Serif
  JP / CJK JP, Source Han Serif JP, serif. **Only at ≥ 18px.**
- **Japanese content, Gothic** Δ — Hiragino Sans, Yu Gothic, Noto Sans JP /
  CJK JP, Meiryo. Used for Japanese below 18px and for long responses.

| Role | Size / line | Weight | Compact (< 600) | Use |
| --- | --- | --- | --- | --- |
| `ui.display` | 28/36 | 600 | 24/32 | Page title |
| `ui.section` | 20/28 | 600 | — | Section heads, dialog titles |
| `ui.title` | 17/24 | 600 | — | Index row names, set names |
| `ui.body` Δ | 15/24 | 400 | — | Explanations, descriptions (CJK comfort) |
| `ui.label` | 14/20 | 500 | — | Buttons, nav, fields |
| `ui.meta` | 12/16 | 400, tabular | — | Counts, dates, metadata |
| `ui.kicker` Δ | 12/16 | 600, +0.04em | — | Section eyebrows ("今日練習", "常見陷阱") |
| `ja.headword` Δ | 48/60 Mincho | 500 | 40/52 | Single-word prompt, grammar headword |
| `ja.prompt` Δ | 26/44 Mincho | 400 | 22/38 | Sentence prompt, partner line (24/40) |
| `ja.option` Δ | 20/30 Mincho | 400 | 18/28 | Answer options |
| `ja.body` Δ | 17/30 Gothic | 400 | — | Example sentences, Japanese explanations, long responses |
| `ja.ruby` Δ | 0.5em Gothic, `text.tertiary` | 400 | — | Furigana |

Rules:

- **T1.** Every element containing Japanese learning content carries
  `lang="ja"` (itself or an ancestor). Verified per board.
- **T2.** Japanese prompts use `word-break: auto-phrase` (where supported),
  `line-break: strict`, `text-wrap: pretty`: no orphaned final syllable, no
  break inside a phrase when the browser can avoid it.
- **T3.** The underlined target in reading questions uses a 2px underline at
  7px offset in `text.primary` (not color).
- **T4.** Numbers that change or compare (counts, progress, timers,
  percentages) use tabular numerals.
- **T5.** Kicker text is short and in the UI language; do not render
  English eyebrows in other locales.

### 3.3 Space, geometry, elevation, motion

- Spacing: 4, 8, 12, 16, 24, 32 (Tachiko) + 48, 64, 96 Δ for page rhythm.
- Radius: controls 7px; overlays 10px; bubbles round; sheets and sections 0.
- Borders: 1px. Answer bubble border 1.5px.
- Controls: pointer 36px min height; **touch / compact 44 × 44px minimum**
  for every standalone target (running-prose links excepted); answer options
  ≥ 56px.
- Bars: top bar 56px (52px compact); session bar 56px; bottom tab bar 60px +
  safe area.
- Elevation: none on page content; `overlay` for menus/popovers/toasts;
  `dialog` for dialogs and sheets.
- Motion: `state` 120ms, `layer` 180ms in / 120ms out, `mark` 260ms stroke
  draw; easing `cubic-bezier(0.2, 0, 0, 1)`. Reduced motion: all 0ms, marks
  render complete. Nothing requires motion to be understood.

### 3.4 Breakpoints

| Tier | Width | Layout |
| --- | --- | --- |
| compact | 320–599 | One column; bottom tab bar; sheets for switchers; sticky session actions; options one column |
| medium | 600–1023 | One column up to 760px; bottom tab bar; options may use 2 columns |
| wide | 1024–1279 | Top bar with navigation; text column + right margin |
| wide + margins Δ | ≥ 1280 | Left margin + text column + right margin (marginalia) |

At 320px nothing scrolls horizontally (verified).

## 4. Layout system

### 4.1 Surface kinds

1. **Index surfaces** — Today, JLPT sections, Grammar index, Small Talk intro,
   Reference pages. Global top bar (+ bottom tab bar below 1024). Content is
   typeset lists under section heads.
2. **Reading surfaces** — Learn chapter, Grammar entry. Global chrome; text
   column with marginalia.
3. **Session surfaces** — Practice session (`/challenge`), a running Small
   Talk scene. Session bar replaces global chrome; no bottom tab bar
   (DECISIONS D-06).
4. **Overlays** — menus, set switcher, reference sheet, dialogs, toasts, focus
   break.

### 4.2 Column and margins

- Text column max 680px (sessions, chapters, entries); index column max
  760px; page max 1216px with 24px gutters (16px compact).
- Left margin 216px (≥ 1280): set info, table of contents, sibling entries.
- Right margin 260–280px (≥ 1024): tally, mistakes, settings, prerequisites,
  related.
- Margins hold **context**, never the only path to a capability. Below their
  tier, their content moves into a sheet (set switcher, TOC) or a trailing
  section.

### 4.3 Top bar (index and reading surfaces)

Brand lockup (JabikoMark 30px + "Jabiko" + locale descriptor
"JLPT 自習室" / "JLPT Study Room", descriptor hidden < 1024) · primary
navigation (≥ 1024) · focus chip · furigana toggle · menu button. Current
location: `text.primary`, weight 700, 2px `border.strong` underline,
`aria-current="page"`. Sticky, `surface.app`, bottom hairline.

### 4.4 Bottom tab bar (< 1024)

Five tabs: 今日 · 練習 · 學習 · 會話 · 資料. Icon 22px + label 11/14. Current tab:
`text.primary`, weight 700, 2px underline under the glyph,
`aria-current="page"`. 資料 opens the reference sheet (it is not a route).
Hidden on session surfaces. Respects `env(safe-area-inset-bottom)`.

### 4.5 Session bar

Left: exit (×, label "離開練習，回到今日") and the set switcher button (set name
+ chevron; truncates with ellipsis). Center (≥ 1024): progress ledger (one tick
per question; answered ticks show verdict: filled shu = correct, outlined shu
= incorrect; current tick ink; plus "7 / 20"). Compact: "7 / 20" text plus a 2px
ink progress line under the bar. Right: furigana toggle, session settings
(sliders icon → length + speech rate), menu.

## 5. The mark system (evaluation layer)

Geometry (40 × 40 viewBox, round caps and joins, `mark.ink`):

| Mark | Glyph | Geometry | Stroke | Meaning | Label (zh-Hant / en) |
| --- | --- | --- | --- | --- | --- |
| maru | 〇 | Open circle r = 15, from −58° clockwise to 278° (24° gap at one o'clock) | 3 | Correct | 正解 / Correct |
| batsu | × | Two diagonals (11.5, 11.5)–(28.5, 28.5), then (28.5, 11.5)–(11.5, 28.5) | 3 | Incorrect (learner's choice) | 你的答案 / Your answer; verdict 答錯 / Not quite |
| revealed | dashed 〇 | Maru path, dash 6 / gap 5 | 2.4 | Answer shown without being earned | 答案 / Answer shown |
| sankaku | △ | (20, 7.5) (32.5, 30.5) (7.5, 30.5) | 2.6 | Needs work (formative) | 再加強 / Needs work |
| hanamaru | 花丸 | Spiral + six-lobed scalloped ring | 2.2 | Perfect set only | 花丸 · 全對 / Perfect |

Exact path data: `reference/harness.js` `MARKS`. The marks are original
drawings for Jabiko.

Rules:

- **M1.** A mark is never the only signal: it always has an adjacent text
  label, or it is `aria-hidden` and the label carries the meaning.
- **M2.** Shu circles only ever point at the correct answer.
- **M3.** The learner's wrong choice keeps its ai fill; it gets a × tag, not a
  red box, and never the error notice family.
- **M4.** Marks draw in (`mark` motion) once, when they first appear; they do
  not loop or re-animate on re-render. Reduced motion: drawn complete.
- **M5.** In forced colors, marks and labels use `CanvasText`; the chosen
  bubble uses `Highlight`/`HighlightText`.
- **M6.** Revealed answers are never counted or shown as earned (dashed, no
  〇 label).

## 6. Components

Components follow one behavioral grammar (Tachiko UQC §1.10). State tables list
only states that exist.

### 6.1 Button

Variants: **primary** (ink fill, white label; one per region), **secondary**
(white, `border.control`), **ghost** (no border; secondary actions inside
content), **large** (48px, 16/24 semibold; the one decisive action of a
surface). Icon 16px left or right with 8px gap.

| State | Treatment |
| --- | --- |
| Rest | As variant |
| Hover (pointer) | Primary → `action.primary.hover`; others → `action.secondary.hover` |
| Pressed | Primary → `action.primary.pressed`; others → `action.secondary.pressed` |
| Focus-visible | 3px `focus.ring`, 2px offset |
| Disabled | `surface.chrome` fill, `border.subtle`, `text.disabled`; `disabled` attribute |
| Busy | Keeps label + clock icon + "…"; `aria-busy="true"`; suppresses repeat dispatch; never implies success |

Destructive confirm button (delete history only): `state.error.ink` fill,
white label, enabled only after the irreversible-consequence checkbox.

### 6.2 Icon button

36 × 36 (44 × 44 touch), icon 20px, `text.secondary`; must have an accessible
name. Used for exit, menu, speak, settings, share.

### 6.3 Toggle (persistent setting)

For furigana (and toggles like "有影視例句"). `aria-pressed`. Pressed:
`learner.mark` border, `learner.tint` fill, state word in ai ("開"/"關"). The
furigana glyph is a Mincho 「ふ」. When space collapses the text label, the
toggle stays ≥ 44 × 44 and keeps its accessible name.

### 6.4 Segmented control

Level (N1–N5), importance, reading type, appearance, feedback kind, session
length. `role="group"` + buttons with `aria-pressed` (or radiogroup
semantics where exclusive and arrow-key navigable). Selected: `learner.tint`,
`learner.mark` label, 2px ai bottom rule, weight 700. Labels never wrap.

### 6.5 Field and search

Label above (never placeholder-only). 40px (44 touch), 16px text so mobile
browsers do not zoom. Search has a leading icon. Invalid: Tachiko pattern —
error text adjacent and connected (`aria-describedby`), invalid border
`state.error.ink`. Japanese input fields set `lang="ja"`,
`autocomplete="off"`, `spellcheck="false"`.

### 6.6 Index row

The workhorse of index surfaces: a full-width link/button with **name**
(`ui.title`; Japanese names in Mincho) · **description** (`text.secondary`) ·
**meta** (tabular `text.tertiary` + arrow). ≥ 56px tall. Hover wash, inset
focus ring. Rows sit in a list under a `border.strong` rule with
`border.subtle` separators. Compact: description drops under the name; meta
stays right. Unavailable rows: `aria-disabled="true"`, not focusable as a
link target that does nothing, name in `text.secondary`, a "準備中" status word
(§6.14) and a one-line reason.

### 6.7 Section head

`ui.section` title, optional Mincho Japanese label in `text.tertiary`,
optional right-aligned meta. 48px above, 12px below.

### 6.8 Answer option (answer-sheet grammar)

`button` with a numbered bubble (28px circle, 1.5px `border.control`,
numeral = keyboard shortcut) and the option text in `ja.option`. ≥ 56px,
`border.subtle`, 7px radius. Layout: one column on compact; two columns ≥ 600
only when every option fits (short kana/kanji); sentence options always one
column.

| State | Bubble | Row | Extra | Data attributes (preserved) |
| --- | --- | --- | --- | --- |
| Rest | outline, numeral `text.secondary` | `border.subtle` | — | — |
| Hover | — | `action.secondary.hover`, `border.control` | — | — |
| Focus-visible | — | 3px ai ring | — | — |
| Chosen, correct | ai fill, white numeral | ai border | shu 〇 drawn around bubble; tag "〇 正解" | `data-selected="true" data-result="correct"` |
| Chosen, incorrect | ai fill, white numeral | ai border | tag "× 你的答案" | `data-selected="true" data-result="wrong"` |
| Correct answer after miss | outline | — | shu 〇 around bubble; tag "正解" | `data-result="target"` |
| Revealed | outline | — | dashed shu 〇; tag "正解" | `data-result="target"` |
| Other options after verdict | unchanged | unchanged, **full contrast** | — | — |

After a verdict all options are `aria-disabled`/`disabled` but keep full
contrast (they are read-only facts, not unavailable controls). Nothing about
an option's size or position changes between rest and verdict.

Small Talk responses reuse the option recipe in `ja.body` Gothic with an
**empty** bubble (no numeral: Small Talk has no number shortcuts).

### 6.9 Progress ledger

See §4.5. `aria-label` "進度"; the visible "7 / 20" text is the accessible
value; ticks are `aria-hidden`.

### 6.10 Tally

Three (or four) `dl` pairs: label `ui.meta` `text.tertiary`, value 22/28
tabular. Correct counts and accuracy that result from evaluation may be shu
(C2).

### 6.11 Verdict line and feedback block

Under the marked options, separated by a hairline:

1. **Verdict line** — mark (28px, draws in) + label (`ui.section` weight 700,
   shu) · "正解：<answer>" (Japanese in Gothic bold) · post-answer JLPT level
   tag (right; never shown before answering).
2. **Explanation** — `ui.body` 15/26, localized via `pickLocalized` with
   truthful `lang` (D-21).
3. **Distractor gloss** — kicker "其他選項讀起來是" / pattern meanings; each
   Japanese option in Gothic.
4. **Example** — when the example differs from the prompt: Japanese in
   `ja.body` + translation, in a `surface.chrome` well with a 2px ink left
   rule. When the example *is* the prompt sentence, show only its
   translation next to the speak button under the prompt (no duplicate).
5. **Grammar note** toggle and "深入學習這個文法 →" (opens separately,
   preserving the session), where the current rules show them.
6. **Tools** — bookmark (toggle, `aria-pressed`), report (ghost).

The block is `aria-live="polite"` so the verdict is announced; focus stays
where the learner is (Next remains the Enter target).

### 6.12 Notices (protected Tachiko states)

Glyph + text + tint, 7px radius: warning (offline, pending sync), error
(send/load failures, with an inline recovery action), success (sync done),
neutral (loading). Errors attach to the affected context; a toast is never the
only indication of a local failure.

### 6.13 Dialog, sheet, menu, toast

- **Dialog**: `role="dialog"`/`alertdialog`, `aria-modal`, labelled; 10px
  radius, `surface.raised`, `dialog` elevation, scrim. Initial focus on the
  meaningful field or the least destructive action; Tab contained; Escape and
  Cancel restore the previous focus and context (Tachiko component
  contract).
- **Sheet** (compact): bottom-anchored, grip, max 86vh, same focus rules.
- **Menu**: 10px radius, `overlay` elevation, 40px rows (44 touch),
  arrow-key navigation, Enter activates, Escape returns focus to the trigger,
  no focus trap. Destructive items in `state.error.ink` with an icon and "…"
  (they open a confirm).
- **Toast**: ink background, used only for global, non-local events (PWA
  update). Above the tab bar on compact.

### 6.14 Status word

Small outlined label (`border.subtle`, 12/18, `text.secondary`): "準備中",
"高頻", "目前". Neutral by design; not a warning.

### 6.15 Lattice (kana, kanji)

Genkō-style grid of hairline cells (`border.subtle`), `auto-fill` of 112px
cells (3 columns at 320–599). Cell: character in Mincho 34/44, reading rows
(音 / 訓) in Japanese Gothic, gloss in `text.secondary`. Cells are buttons
with inset focus rings. No selection model, headers or editing (not a
spreadsheet grid).

### 6.16 Stamp card

14 day cells (7 per row), each: shu 〇 if the learner practised that day,
blank if not; date numeral below; today outlined in `border.strong`. Each
cell's accessible text states the date and whether practice happened.

### 6.17 Script line (Small Talk)

Two-column grid: speaker label (13/20, `text.secondary`, right-aligned; above
the line on compact) · line in Mincho 24/40 (22/36 compact) with a speak
button. The learner's line is set in `learner.mark`. The script container is
`role="log"`.

### 6.18 Feedback dimensions and composition (Small Talk)

`dl` rows: dimension name · status with mark (〇 達成 / △ 再加強). Composition
chips 回答 → 補充 → 提問 (Answer → Add → Ask): present features are ink with a
filled dot, absent ones `text.secondary` with an empty dot; arrows are
decorative.

### 6.19 Keycap hint

`kbd` caps (1px `border.control`, 2px bottom) inside a `ui.meta` hint. Shown
only for pointer devices (`pointer: coarse` hides it) and only for shortcuts
that exist.

## 7. Surfaces

Each surface lists structure (DOM = reading order), states and responsive
behavior. Boards: `reference/<file>.html?state=<state>`.

### 7.1 Today — `/` (board `today.html`, states `returning`, `first`)

Order:

1. **Masthead** — h1 "Jabiko · JLPT 自習室" (`ui.label` weight 600,
   `text.secondary`) and today's date ("9月30日（三）") right-aligned.
2. **Today's sheet** (between a strong top rule and a subtle bottom rule):
   - *Returning*: kicker 今日練習; headline "先複習 **3** 題，再練 20 題" (review
     due in shu, set size ink; if nothing is due: "今天練 20 題"); composition
     line "弱點複習 3 → 混合 20 · 文法・語順・漢字読み"; level chip
     "目標 N3・N4 · 變更" (expands the band picker in place, #526); primary
     large button 開始今日練習 →; secondary 只複習錯題（3）when anything is due.
   - *First run* (no preference and no history): kicker "免費 · 免註冊 ·
     N5〜N1"; headline "先選你的程度，今天就開始。"; steps ① 選程度 ② 今日練習
     ③ 答錯自動複習 (current step filled ink); five level buttons (完全新手 ·
     從零開始, 初級 · N4・N5, 中初級 · N3・N4, 中級 · N2・N3, 高級 · N1・N2);
     note + 使用說明 link; primary 開始今日練習. #532: activating the primary
     without a level moves focus to the level group and shows the existing
     `role="alert"` hint; choosing a level then continues into the daily set.
3. **Record margin** (right margin ≥ 1024; directly after the sheet below
   1024): stamp card "最近 14 天"; numbers: 連續天數, 待複習 (shu), 已作答,
   正確率, 已掌握, 點數 (shu, focal). First run shows three factual lines about
   what Jabiko offers instead.
4. **接著做** (returning only): next incomplete chapter, one current seasonal
   topic (D-14), bookmarks — index rows.
5. **Partner line** (locale-gated as today): kicker 合作夥伴, one line, link.
   Keeps its `promo_click` placement identifier.
6. **全部練習**: index rows for 今日練習, 備考題庫, JLPT 題型, 專項練習, 動詞變化,
   學習章節 (progress "12 / 48 章" only with history), 日常會話; then a
   separate list 查資料: 文型資料庫, 漢字音讀, 活用速查表, 五十音表.
7. **你的紀錄** (with history): per-level accuracy bars, three weakest
   question types (hairline bars, ink fill, value right).
8. **Colophon**: content stats line from `contentStats.ts`.
9. **Footer**: 許願功能, 回報問題, 小額贊助, 分享 Jabiko, legal, 關於.

Compact: single column in the order above; stacked full-width actions;
level buttons 2 columns with 完全新手 spanning.

### 7.2 Practice session — `/challenge` (board `session.html`)

States: `q` question · `correct` · `wrong` · `revealed` · `recall` typed recall ·
`complete` · `perfect` · `empty` review/bookmarks empty · `loading` · `error`.

Structure (wide ≥ 1280): session bar; left margin "這一組" (set name,
description, 換一組, 重設本次); sheet; right margin "本次" (tally), "本次答錯"
(missed list: surface · your answer → answer), "本次設定" (length · speech rate
+ 調整). 1024–1279: no left margin (set info lives in the switcher). < 1024:
no margins; settings through the session-bar sliders button (sheet).

Sheet anatomy:

1. **Question head**: h1 "問題" + question type in Mincho (the `promptLabel`
   or target-form label), strong rule under. The question number lives only
   in the session bar.
2. **Instruction** (`text.secondary`), localized.
3. **Prompt**: sentence prompts in `ja.prompt` with the target underlined
   (T3); single-word prompts as a headword block (part of speech · reading
   line when shown today · `ja.headword` · meaning when shown today). Furigana
   follows the global toggle except where current rules exclude it (reading
   prompts, reading options).
4. **Aids**: 朗讀 (speak), 提示 (hint; before answering only). After answering,
   the prompt translation appears here when the example equals the prompt.
5. **Options** (§6.8), `aria-label="選項"`.
6. **Keycap hint** (pointer only, before answering): 1–4 選答 · Enter 下一題.
7. **Feedback block** (§6.11) after answering.
8. **Actions**: 看答案 (secondary; disabled after a verdict) and 下一題 →
   (primary, always enabled; Enter). Compact: sticky bottom bar, full-width
   halves.

Typed recall (`recall`): headword block with the dictionary form, "動詞 II 類
· たべる", target form in an outlined label ("改成 て形"); labelled input
(`lang="ja"`, placeholder "請輸入答案" — never an example answer) + 送出;
hint "Enter 送出 · 選字中的 Enter 只會確定選字，不會送出" (existing IME rule).

Completion (`complete`, `perfect`): head "今日練習 · 完成"; big mark + score
("〇 **18** / 20", shu numerator) or 花丸 + "花丸 · 全對" label for a perfect
set; h1 "今日練習完成" / "20 題全對"; body (existing daily/review/generic
copy); tally; list of this session's misses; 再來一組 (primary), 回到今日;
share + 意見回饋; `jabiko.app` watermark (share screenshots). Margins other
than set info hide.

Empty (`empty`): factual message ("目前沒有待複習的錯題。" + rule) and the
existing actions (go to the comprehensive bank, back to Today).

Loading (`loading`): neutral notice "準備題目中…" (`role="status"`) and static
placeholders the size of the prompt and options (no shimmer). Error
(`error`): error notice stating the likely cause and that records are safe;
重新載入 (primary) and 回到今日. Asset-recovery reload behavior is unchanged.

### 7.3 Set switcher (board `sets.html`, state `switcher`)

Opened from the session-bar set button or "換一組". Wide: anchored dialog
(560px) under the button; compact: sheet. Title 換一組練習 + consequence line.
Groups exactly as `MODE_GROUPS`: 每日 (今日練習, 弱點複習, 我的收藏), 備考題庫
(綜合考題庫, N1–N4 備考), 專項練習 (句型練習, 句中填空, 單字讀音, 基礎變化), each
row with description and count. Current row: ai left rule + tint + "目前".
Footer: 依 JLPT 題型練習 → (`/mock`) and 關閉. Selecting a row starts that set
exactly as today's picker does.

### 7.4 JLPT sections — `/mock` (board `sets.html`, state `mock`)

Kicker "練習 · JLPT 題型", h1 "依官方題型逐區練習", description, level segmented
control. Sections as index rows: "問題 N" · Japanese section name (Mincho) ·
Chinese/English label · count →. Group heads (文字・語彙 / 文法 / 讀解) and "問題
N" numbering are shown only if derivable from the mock-exam blueprint
(`mockExam.ts` order/group); if not, omit them rather than invent them.
Unavailable sections: §6.6 unavailable row with "準備中".

### 7.5 Learn — `/learn` (board `learn.html`)

Wide: left margin table of contents grouped by category (入門, N5 文法, …):
completed chapters carry a small shu 〇; current chapter has an ink left rule
and weight 700; "已完成 4 / 48 章" below. Compact: a "章節目錄 · 4 / 48" button
opens the TOC sheet.

Chapter: kicker "入門 · 第 4 課"; h1 chapter title; subtitle in Mincho
(Japanese). Explanation 16/28, max 40em. 例句: rows of Japanese formula
(Mincho 20/32) · note · speak. 常見陷阱: inset note with numbered items.
Actions: primary drill for the chapter ("練這一章：…" using the existing drill
labels), secondary next chapter. Right margin: 建議先看 (`recommendedAfter`,
with 〇 if complete), 完成條件 (the chapter's existing completion rule in plain
words). Chapter content and localization follow `learningBlockText` rules.

### 7.6 Grammar — `/grammar`, `/grammar/:level`, `/grammar/:surface` (board `grammar.html`)

Index (level hub): breadcrumbs; h1 "JLPT N3 文型"; level segmented control
(links to the canonical lowercase level routes); search; 有影視例句 toggle;
importance segment (全部 / 高頻 / 理解即可); live count (`role="status"`).
Entries: pattern in Mincho 20/30 · meaning · importance word · formation line
(Japanese Gothic, zh-Hant only).

Entry (SEO landing): breadcrumbs; h1 = pattern surface (`ja.headword`,
`lang="ja"`), level label, importance word; meaning (`ui.section` weight 600);
`meaningJa` in Mincho; 接續 (zh-Hant only per language isolation); 例句 rows
(Mincho 22/36 + translation + speak); curated note usage/examples; 常見錯誤 only
when data exists; media examples only when present; related patterns (right
margin); prev/next pager. Left margin (≥ 1280): neighboring entries in
database order. No per-pattern practice button or per-pattern stats (not
current capabilities).

### 7.7 Reference — `/kanji`, `/rules`, `/kana`, reference sheet (board `reference.html`)

Kanji: kicker "資料 · 漢字音讀", h1, description; search; 音讀/訓讀 segment;
level segment; keycap hint (←/→). Groups by reading: reading in Mincho 24 +
"音讀み" + count; lattice (§6.15); "載入更多（還有 N 字）" full-width
secondary. `/rules` and `/kana` follow the same page head and use typeset
tables (hairline rules, Japanese in Gothic/Mincho per T-rules) and the kana
lattice respectively.

Reference sheet (compact 資料 tab): 文型資料庫, 漢字音讀, 活用速查表, 五十音表 as
index rows with a Mincho Japanese label; current destination marked with
`aria-current`.

### 7.8 Small Talk — `/conversation` (board `talk.html`)

Intro (`intro`): kicker "會話 · SMALL TALK", h1 (proposed "把話接下去"),
intro line. 最近適合聊的季節話題: rows with a phase word (現在 / 即將到來 /
最近, outlined ink), topic, date, one line; empty copy unchanged. Scenes grouped
by length 短 / 中 / 長 (each head explains the job), each row: situation,
role · topic, length. Selected scene row: ai left rule + tint,
`aria-pressed`. Brief (right column ≥ 1024, after the list below; receives
focus on selection as today): length · topic kicker, topic heading (no
invented titles), 情境, 你的角色 / 對方, 關係與語氣, 這次要練, primary
開始這個情境.

Run (`respond`, `feedback`, `complete`) is a session surface: exit (to the
intro), "會話 · 短" title, furigana, menu. Head: topic + length · roles;
situation line; script (§6.17). Respond: kicker 你的回應 + instruction;
responses (§6.8 Small Talk variant). Feedback (heading receives focus as
today): dimensions (§6.18), composition, actions 換個說法再試一次 (primary) /
繼續. Complete: 完成 + summary + practised moves + 再練一次 / 換情境. Footer
note: curated, offline, no AI scoring, no speech recognition.

### 7.9 Shell, menu and account (board `system.html`)

Menu (states `menu-guest`, `menu-user`): account block first — guest: "作答紀錄
存在這台裝置" + existing sign-in hint + Google 登入 (primary); signed in: name +
sync status line (success ink + check, or syncing/error text) — then 介面語言
(current value), 外觀 (淺色/深色 segment), 專注模式, 意見回饋, 關於 Jabiko,
合作夥伴 (locale-gated), and for signed-in users 登出 and 刪除練習紀錄… (danger).
Compact: full-width popover under the bar.

Language dialog (`language`): radiogroup of launched languages in their own
script + code, no flags; note that Japanese content is unaffected.

Delete practice history (`delete`): `alertdialog` with the existing
description verbatim, the "我了解此操作不可復原" checkbox (≥ 44px label), 取消
and a destructive 刪除 enabled only when checked; busy "刪除中…"; success and
failure messages as today.

Feedback form (`feedback`): kind segment (許願功能 / 回報問題 / 其他), labelled
textarea (anonymous), inline error that keeps the draft, 再試一次.

### 7.10 Focus mode (board `system.html`, states `focus-config`, `focus-break`)

Top-bar focus chip: idle "專注"; active shows remaining time (tabular) and
`data-active`. Configure dialog: 專注時間 / 休息時間 (minutes, numeric), note
"專注期間不顯示任何廣告", 開始. Break surface: full-surface `surface.chrome`
dialog: kicker 專注模式, h1 休息一下, clock (72px light tabular, `role="timer"`
with a spoken label), rest prompt, summary tally (本次專注, 作答, 正確率,
今日累計), 開始下一輪 (primary), 略過休息, 結束專注模式 (ghost). The ad slot, if and
only if every `docs/adsense.md` condition passes, sits below the controls,
labelled "廣告", visually separated; otherwise it does not exist (no empty
box).

### 7.11 System states (board `system.html`, `session.html`)

- **Offline** (`offline`): warning notice at the top of the current surface:
  what still works, that answers are stored locally and sync later.
- **Update** (`update`): toast "有新版本可用。" + 更新.
- **Route error** (`route-error`): error notice + h1 "這一頁沒有順利打開" +
  existing body + 重新整理 / 清除快取後重載 / 回首頁.
- **Loading / load error / empty**: §7.2.

## 8. Content, language and localization rules

- **L1.** Language isolation is unchanged (CLAUDE.md): `*Zh`, `formation`,
  `lineZh`, `contextZh` render only when `isZhHant`, unless routed through
  `pickLocalized()` / `pickLocalizedOptional()` with a valid overlay. Boards
  are authored in zh-Hant; `session.html?lang=en` shows the English overlay
  path for a real item.
- **L2.** Fallback content carries truthful `lang` (D-21).
- **L3.** Language changes affect UI and overlay content only; Japanese
  learning content never changes with UI language.
- **L4.** New or changed copy is added to every launched locale via the i18n
  files and passes `check:i18n`; zh-Hant strings in the boards are proposals
  for that change. No English eyebrows in other locales, no decorative emoji.
- **L5.** Furigana, TTS (rate, voices), and reading-prompt exclusions keep
  current behavior. Ruby uses `ja.ruby`.
- **L6.** Answers never leak: no level tag, hint text or example that reveals
  the answer before a verdict; placeholders never contain example answers.

## 9. Accessibility (must not weaken the Tachiko floor)

- **Landmarks**: `header` (bar), `nav` (primary; tab bar; TOC), `main`,
  `aside` (margins), `footer`. One h1 per view (D-09); logical h2/h3.
- **Keyboard map**: Tab order follows DOM = reading order. Practice: 1–4
  choose, Enter next, Enter never submits during IME composition; kanji ←/→.
  Menus: arrows, Enter, Escape. Dialogs: contained Tab, Escape closes and
  restores focus. No new shortcuts are introduced by this design.
- **Focus**: 3px `focus.ring` + 2px clearance on every focusable element
  (inset −3px inside bars, rows and lattice cells so it is never clipped).
  Verified by keyboard traversal on every board.
- **Targets**: ≥ 44 × 44 on touch/compact (verified at 320 and 390), answer
  options ≥ 56px.
- **Contrast**: C5 (verified).
- **Non-color**: C4 and M1.
- **Live regions**: verdict block `aria-live="polite"`; counts/filters
  `role="status"`; errors `role="alert"`; timer `role="timer"`.
- **Reflow**: 320px without horizontal scroll (verified); text zoom to 200%
  must not clip (implementation check in #838).
- **Forced colors**: Tachiko behavior; marks and labels in `CanvasText`, chosen
  bubble `Highlight`; ledger ticks in `CanvasText`/`GrayText` (render:
  `renders/session-state-wrong-forced-1440x900.png`).
- **Reduced motion**: all transitions 0ms; marks drawn complete (verified).
- **Language**: `html lang` = UI language; Japanese carriers `lang="ja"`
  (verified); fallback content per D-21.

## 10. Implementation guidance for #838

This section is binding on *what*, advisory on *how*.

1. **Tokens first.** Create one token layer in `src/styles` (e.g.
   `tokens.css`) that declares the `tokens.json` roles as private custom
   properties for `:root` and `:root[data-theme="dark"]`, and a small
   unit test that asserts parity with `docs/design/learning/tokens.json`
   (mirroring `tools/verify.mjs`). Retire the old palette variables instead of
   aliasing them forever.
2. **Recipes, not a new framework.** Port the recipes in
   `reference/shu-ire.css` into the existing `src/styles/*` modules as the
   surfaces are rebuilt; do not import the reference file.
3. **Preserve behavior seams.** Keep `DrillPanel`'s DOM data attributes,
   `nextButtonRef`, keyboard handling, IME guard and feedback semantics.
   Changing the feedback DOM order (D-07) requires updating
   `DrillPanel.test.tsx` expectations RED-first and citing D-07.
4. **Domain changes are small and tested**: `navigation.ts` grouping (D-08),
   retiring `doneSpot.ts` (D-10), an additive localized-with-source helper
   (D-21), optional mock-section grouping metadata (§7.4).
5. **Tests that encode old visuals** (`src/styles/home.test.ts`,
   `src/styles/feedback.test.ts`, App h1 assertions) are updated to the new
   contracts with RED first: e.g. points remain the shu focal number (C2);
   long option text still wraps.
6. **Remove, don't keep**: `hero.webp`, spot illustrations, the old
   `--paper/--matcha/--teal/--vermilion/--indigo` palette, the how-it-works
   dismiss storage key usage, flag rendering in the picker (dependency
   removal is a separate reviewed change).
7. **Unchanged**: routes, analytics events/payloads, ad gating, SEO titles and
   prerender, lazy chunks (the redesign adds no eager imports of exam data,
   furigana data or article bodies).
8. **Sequence** (fits #838's "no CSS explosion"): tokens + shell (top bar,
   tab bar, menu) → Today → session (question, feedback, completion) → set
   switcher + `/mock` → Learn → Grammar → Reference → Small Talk → system
   states; each step keeps unported screens working inside a compatibility
   wrapper that uses the new tokens.

### Acceptance checklist (design conformance for #838)

- [ ] Every capability in AUDIT §1 is reachable at 320, 390, 1280 and 1440.
- [ ] `tools/verify.mjs`-equivalent token parity and contrast pass in the
      app build.
- [ ] Marks follow §5 exactly; verdicts never use error/warning styling.
- [ ] Options and Next do not move after answering (D-07).
- [ ] Session surfaces hide global navigation and keep exit/menu reachable.
- [ ] One h1 per view; Today h1 = product title; SEO titles unchanged.
- [ ] 44px touch targets; 3px focus ring everywhere; reduced motion; forced
      colors; `lang="ja"` on Japanese content.
- [ ] Language isolation and furigana rules unchanged; new copy in all
      launched locales.
- [ ] No decorative illustration, card grid, gradient or non-semantic color.

## 11. Out of scope and open items

- WORLD (game) profile, NPC/scene art, game HUD — remains #832.
- `/game` entry label — waits for the naming decision (D-08).
- Editable Figma import of these boards — optional follow-up (D-01).
- Learner evidence for the shu 〇-for-correct convention in `en` (D-03).
- Removing the `flag-icons` dependency — separate reviewed change (D-11).
