# Jabiko design authority JT-1 — specification

Status: **JT-1 CANDIDATE** (#850). Canonical once independent review accepts
it (DECISIONS.md D-01). Values: `tokens.json`. Visual presentation: the Figma
frames in `figma-registry.json`. Rules and behavior: this file. Reasons:
DECISIONS.md. Capability coverage: CAPABILITIES.md. Tachiko snapshot:
FOUNDATION.md.

Board references below are `reference/<board>.html?state=<state>`; every
listed state is rendered in `renders/` and imported as a Figma frame.

## 1. Thesis

> **Tachiko foundation, Jabiko voice.**

Jabiko shares Tachiko's ink, surfaces, geometry, focus and state grammar
unchanged, and composes them around a learner's job — start today's set,
read a Japanese sentence and answer it, keep a conversation going, step into a
place and talk to someone — instead of around a grid.

### Principles

1. **The current job is the loudest thing.** One primary action per surface;
   sessions drop global navigation (UQC §1.1).
2. **Shared roles are shared literally.** A role Jabiko has in common with
   Tachiko carries Tachiko's value; Jabiko adds roles only for learning
   meaning (assessment) and Japanese content.
3. **Assessment is not system state.** A wrong answer is a mark on an option,
   not an error.
4. **Nothing moves under the learner's finger.** States never shift geometry.
5. **Content is set as content.** Japanese at reading sizes in Mincho, with
   `lang="ja"`, ruby and phrase-aware breaking.
6. **Rows, not cards.** Hierarchy comes from type, rules and order.
7. **Every capability has a path on every width** (CAPABILITIES.md).
8. **Nothing decorative.** See the anti-template ledger (D-23).

## 2. Foundation

See FOUNDATION.md for exactly what is inherited (values §2, rules §3), what is
specialized (§4) and what is excluded as spreadsheet-only (§5).

## 3. Tokens and usage rules

### 3.1 Color

Values in `tokens.json` (`color.light`, `color.dark`). Usage rules:

- **C1 Surfaces.** `surface.app` is the page; `surface.chrome` is the header,
  session bar, tab bar, sticky action row and footer; `surface.content` is
  controls, options, dialogs; `surface.inset` is hover fill, notes and
  placeholders; `surface.sunken` is tracks, keycaps and key squares;
  `surface.chrome.tint` is the return-to-World bar only.
- **C2 Accent (violet).** `action.primary.*` fills the one primary command per
  surface. `accent.foreground`/`accent.background` mark *current* and
  *selected* (nav item, segment, toggle on, current row, chosen level) and the
  learner's own lines in a script, progress fills, and the single focal
  readout (points). Accent is never decoration.
- **C3 Assessment.** `assess.correct`, `assess.miss`, `assess.partial` only for
  learning verdicts (§5). Never for system state.
- **C4 Protected states.** `status.warning|error|success.*` only for system
  state (offline, load failure, sync, deletion result, field errors), always
  with an icon and text.
- **C5 Contrast.** Every pair in `contrastRequirements` holds in both themes
  (ordinary text ≥ 4.5:1, essential boundaries and focus ≥ 3:1).
  `text.disabled` is used only on disabled controls.
- **C6 Non-color.** Every state carried by color also has text, a glyph, an
  underline, an edge or a shape.
- **C7 Brand art.** The mascot keeps its own colors (`#28385a`, `#f0a49c`,
  `#fdf6ea`) in both themes; they appear nowhere else.

### 3.2 Typography

Families: system UI stack with locale CJK faces (zh-Hant: PingFang TC → Noto
Sans TC → Microsoft JhengHei; ja: Hiragino Sans → Yu Gothic → Noto Sans JP);
Mincho stack for Japanese ≥ 18px. Nothing downloaded. Roles and sizes in
`tokens.json` `typography` (D-05). Rules:

- **T1** Chrome text never uses Mincho; Japanese learning content never uses
  chrome roles above 16px.
- **T2** Every element whose text is Japanese learning content has
  `lang="ja"` (verified by `verify.mjs`).
- **T3** Prompt targets are underlined (2px, 8px offset), never colored.
- **T4** Numbers in counts, progress, readouts, timers use tabular numerals.
- **T5** Ruby: 0.5em, `ruby-position: over`, never below 9px rendered; follows
  the furigana toggle except where current rules exclude it.
- **T6** Line length: `read.body` max 40em; prompts wrap within the column.

### 3.3 Space, geometry, layers, motion

Scale 4, 8, 12, 16, 24, 32 (Tachiko) + 48, 64. Gutters 16 / 24 / 32.
Control radius 7, overlay radius 10, keycap/tag radius 4, app mark 8.
Controls 36px (fine pointer) / 44px (coarse pointer or < 600px); options ≥ 56.
Bars 56px. Main regions are flat; only menus, popovers, dialogs, sheets and
toasts are elevated (`elevation.overlay`). Motion per D-17; reduced motion
removes all transitions.

### 3.4 Breakpoints

| Tier | Width | Layout |
| --- | --- | --- |
| compact | < 600 | one column, 16px gutter, bottom tab bar, 44px targets, sheets for transient UI, sticky session actions |
| medium | 600–1023 | one column ≤ 720px centered, 24px gutter, bottom tab bar |
| wide | ≥ 1024 | header items, 720px column + 320px aside (Learn: 240px TOC + column), 32px gutter |
| floor | 320 | no horizontal page scroll |

Evidence viewports: 320×640, 390×844, 768×1024, 1280×800, 1440×900.

## 4. Layout system

### 4.1 Surface kinds

| Kind | Chrome | Used by |
| --- | --- | --- |
| Index | header (+ tab bar < 1024), footer | Today, Learn, Grammar, Reference, Small Talk intro, `/mock` |
| Session | session bar only | `/challenge` practice, Small Talk run, World moment |
| World | World header (identity · 預覽, 回到練習, furigana, menu) | World home, empty, error |
| Training-from-World | header + return bar + tab bar | any Training surface entered from a World handoff |
| Break | minimal header (identity, 結束專注模式) | Focus break |

### 4.2 Header (index surfaces)

56px, `surface.chrome`, bottom hairline, sticky. Left: app mark (32px tile)
+ "Jabiko" (16/24 600) + product line (12px, `text.secondary`, hidden < 600).
Middle (≥ 1024): nav items (D-08) — links, 14/20 500, `text.secondary`; hover
`text.primary` + inset fill; current `accent.foreground` 600 + 2px underline
on the bar edge; focus ring inset. 資料 is a menu button with chevron. Right:
World product link (≥ 1024), focus toggle, furigana toggle, menu icon
button. A "跳到主要內容" skip link is the first focusable element.

### 4.3 Bottom tab bar (< 1024)

56px + safe area, `surface.chrome`, top hairline, five equal items (icon 20 +
label 12/16). Current: `accent.foreground` 600 + 2px indicator on the top
edge. It never appears on session surfaces.

### 4.4 Session bar

Grid `[left 1fr] [progress auto] [right 1fr]` (< 600: `1fr auto auto`).
Left: exit icon button (aria-label names the destination) + title button
(opens the set switcher; chevron). Center: 160px meter (4px, `surface.sunken`
track, accent fill) + "7 / 20" (600, tabular; total in `text.secondary`).
Right: furigana toggle (glyph only < 600), settings (practice), menu.
< 600: meter becomes a 2px edge on the bar's bottom border.

### 4.5 Column and aside

Main column ≤ 720px; aside 320px; 64px gap; aside sticky under the bar on
wide. Aside headings are 12/20 600 `text.secondary`. Below 1024 the aside
content is placed in DOM order where it belongs (Today: after the set) or
moves to a sheet (session settings, switcher, Learn TOC).

## 5. Assessment system (Jabiko-owned)

| State | Option treatment | Label (zh-Hant) | Announced |
| --- | --- | --- | --- |
| unanswered | 1px `border.control`; key square `surface.sunken` | — | option text + key |
| correct · chosen | inset `assess.correct` edge (1px inset + 1px border = 2px), key square filled `assess.correct` | 〇 正解 | verdict line "答對了" via live region |
| correct · not chosen (`target`) | same as correct | 〇 正解 | — |
| miss (`wrong`) | inset `assess.miss` edge, key filled `assess.miss` | × 你的答案 | verdict line "答錯了 · 正解 X" |
| revealed | dashed `assess.correct` border | dashed 〇 答案 | "已看答案 · 答案 X" |
| other after verdict (`idle`) | unchanged border, text `text.secondary` | — | — |

- **A1** Options are `disabled` after a verdict (as today), keep their DOM
  order and never move; focus moves to Next (D-07).
- **A2** The verdict line sits at the top of the feedback block: glyph (24px)
  + word (16/24 600, assessment color) + answer(s) + level tag (post-answer
  only) right-aligned.
- **A3** Multiple accepted answers list as "正解 X・Y".
- **A4** Small Talk/World dimensions: 〇 做到了 (`assess.correct`) or △ 可以再加強
  (`assess.partial`) per dimension, each with a one-line reason; never ×.
- **A5** Forced colors: verdict options get a 2px `CanvasText` border (dashed
  for revealed); labels and glyphs carry the meaning.
- **A6** Automation attributes stay exactly as today:
  `.drill-panel[data-selected]` = the chosen answer text,
  `[data-result]` = `unanswered` | `correct` | `wrong` | `revealed`,
  `[data-expected-answer]`; the chosen option `data-selected="true"`, options
  `data-result` = `correct` | `wrong` | `target` (the correct option on a miss
  or a reveal). The extra presentation states (`idle`, `revealed` on the
  option) use a separate presentation hook — the harness uses
  `data-jt-verdict` — never new values in `data-result`.

## 6. Components

All shared primitives follow one behavioral grammar (UQC §1.10). "Tachiko"
means the Tachiko component spec applies unchanged; Jabiko rows are new.

### 6.1 Button — Tachiko

Variants: primary (`action.primary.*`), secondary (1px `border.control`,
`surface.content`), ghost (no border), destructive (solid `status.error.ink`,
used only in confirmations). Sizes: default (`--control-h`), large (44px,
15/20 600 — the one hero action per surface). States: default · hover
(inset / primary.hover) · pressed (sunken / primary.pressed) · focus (3px +
2px) · disabled (`surface.inset`, `border.subtle`, `text.disabled`) · busy
(keeps a label such as "準備中…", `aria-busy`, ignores repeat activation). Icon
18px leading or trailing (arrow trailing on forward actions).
< 600: stacked actions are full width (`jt-actions-stack`).

### 6.2 Icon button — Tachiko

44×44 hit area, 20px icon, `aria-label` always; hover inset fill.

### 6.3 Navigation item / tab bar item — Tachiko tab grammar, Jabiko meaning

See §4.2–4.3. Links with `aria-current="page"`; never `role="tab"`.

### 6.4 Toggle — Tachiko

Persistent settings (`aria-pressed`): furigana, focus mode. Off: bordered
control; on: `accent.background`, `selection.edge` border, accent ink, state
word "開/關" (hidden < 600, glyph keeps an accessible name). Focus toggle
shows remaining time ("18:42", tabular) while active.

### 6.5 Segmented control — Tachiko

Single choice, `role="radiogroup"`/`radio` (or links with `aria-current` when
each segment is a route, e.g. grammar levels). Selected: `accent.background`
+ 1px inset `selection.edge` + accent ink 600. Horizontal scroll inside the
control if it cannot fit; 44px segments < 600.

### 6.6 Select button — Tachiko CollectionSelect grammar

"目標 N3・N4 ▾": key in `text.secondary`, value in `text.primary`; opens the
picker in place (Today level) or a popover.

### 6.7 Field, search, checkbox — Tachiko labeled field

Label above (12/20 500); 1px `border.control`; hover `text.secondary`
border; focus ring; invalid `status.error.ink` border + adjacent error text
with icon, linked by `aria-describedby`; the draft is kept. Japanese answer
fields set `lang="ja"`, `autocomplete="off"`, `autocapitalize="off"`,
`spellcheck="false"`, a neutral placeholder ("請輸入答案"), and IME-safe Enter
(composition Enter never submits). Checkbox rows are ≥ 44px labels.

### 6.8 Index row — Jabiko layout of Tachiko text roles

Grid `title (8–13em) · description · meta · chevron`, ≥ 56px, hairline
divider aligned to the column (hover fill bleeds 8px). Compact: title over
description, meta + chevron right. States: hover inset; current/selected
(`aria-current`/`aria-pressed`): `accent.background` + 2px left
`selection.edge` + meta in accent ("目前"); unavailable: secondary title +
"— 準備中" status word, not focusable. Rows are links or buttons, never both.

### 6.9 Readouts, day strip, bars — Tachiko readout grammar

Readout: label 12/20 500 secondary over value 28/32 600 tabular (unit 14px
secondary). Inline variant: label + 14px value in a wrapping row. One focal
readout per surface in accent ink. Day strip: 14 equal cells, 16px tall,
practised = accent fill, not practised = `surface.sunken`, today outlined in
`text.primary`; date range under it; whole strip `role="img"` with a spoken
summary. Bars: label · 6px track · value (tabular, right-aligned); no value
inside the bar.

### 6.10 Notice and note

Notice — Tachiko protected: icon + text on the state background, 7px radius,
optional actions; `role="status"` for offline/info-like system states,
`role="alert"` only for failures that need action. Note — Jabiko neutral
information (`surface.inset`, ⓘ secondary) for preview disclaimers and
grammar-note expansion; never for state.

### 6.11 Answer option — Jabiko

Grid `key 24 · text · verdict slot (reserved 80px; 96px in en)`, ≥ 56px, 12px/14px padding, 7px radius,
1px `border.control`, `surface.content`. Key square 24px radius 4,
`surface.sunken`, digit 12px 600. Text: `ja.option` Mincho 20/28 with
`lang="ja"`; UI-language options (meaning choice) use 16/24 chrome type and no
`lang="ja"`. Long text wraps (`overflow-wrap: anywhere`); the verdict slot is
reserved before answering (empty) at the right, vertically centered, so a label appearing never re-wraps the text. Layout: 2×2 grid ≥ 600 when all
options are short (≤ 12 characters), otherwise one column; always one column
< 600 and for Small Talk/World responses. States: rest · hover (inset) ·
pressed (sunken) · focus (ring) · §5 verdict states (disabled; focus moves
to Next). Activation commits immediately (click,
tap, key 1–4).

### 6.12 Verdict line and feedback block — Jabiko

Feedback block: 24px below the action row, top hairline, then: verdict line
(§5 A2) → translation of the prompt when the
example equals the prompt (14px secondary) → explanation (`read.body`) → "其他選項讀起來是" gloss list
(Japanese 500 · gloss secondary) → example sentences when present (`ja.line` +
translation + speak) → actions row: 收藏此題 (toggle, `aria-pressed`), 文型說明
(toggle, `aria-expanded`, expands a note) and 看這個文型 (opens the point
separately; the session is kept; external icon + visually hidden note) when
the item has a grammar point, 回報此題 (ghost). Region `aria-live="polite"`.

### 6.13 Session action row

看答案 (secondary; disabled after a verdict) and 下一題 → (primary, always
enabled, including typed recall; Enter). ≥ 600: right-aligned directly under
the options (before the keycap hint and the feedback block). < 600: fixed to
the viewport bottom on `surface.chrome` with two equal buttons; the main
region reserves its height so nothing hides behind it.

### 6.14 Script line, dimension, moves, brief — Jabiko

Script line: grid `speaker 5.5em · line · speak`, 16px vertical padding,
hairline dividers; speaker 12/20 600 secondary (learner: accent); line
`ja.line` Mincho (learner: accent ink); optional gloss 14px secondary; < 600
the speaker label sits above the line. Dimension: glyph · name + state word ·
reason. Moves: 回答 → 補充 → 提問 as small outlined labels; done = accent
background + check. Brief: the one bordered content panel (10px radius,
20px padding) with a facts list (`dt` secondary) and the start action;
receives focus when a scene is selected.

### 6.15 World pieces — Jabiko

Monogram: 36px (48px in the current-moment block) circle, `surface.sunken`,
first kanji of the name in Mincho 600, `aria-hidden` (the name is text
next to it). Relationship stage: N segments 14×4px, reached = accent,
`role="img"` with "第 n 階段，共 N 階段" and the stage's context text visible.
Place section: Mincho 22/32 600 name + category meta; moment rows (monogram ·
who + what · action); locked: lock icon + the real condition. Current-moment
block: kicker "現在", place h1 Mincho 40/52 (32/44 < 600), context line with
weather icon, person block between hairlines with the opening line in
`ja.line`, objective, primary "開始對話" + length meta.

### 6.16 Return bar — Jabiko

Under the header on a Training surface entered from World: ≥ 44px,
`surface.chrome.tint`, `text.onTint`, world icon, "從「place・person」過來練習",
link "回到對話 →" (accent 600). Stale variant: info icon, explanation, "回到日常 →".
It persists across Training navigation until the learner returns or
dismisses it from the menu (#836 decides persistence).

### 6.17 Kanji lattice — Jabiko

A dictionary of characters on manuscript-paper rules (1px `border.subtle`),
cells ≥ 112×104: glyph Mincho 28/36, "音 … · 訓 …" 12/16 Japanese Gothic,
meaning 12/16. Cells are **buttons with `aria-pressed`** (choose a character
to read about it), exactly as today:

- **Selected**: `accent.background` + inset 2px `selection.edge`, glyph and
  meaning in accent; an in-place speak button (the active reading type) at
  the cell's top-right.
- **Detail row**: directly after the selected cell, spanning the full lattice
  width, `surface.inset`, `aria-live="polite"`: large glyph (Mincho 56/64),
  音読み and 訓読み lines, meaning + speak, 例詞 list (surface Mincho ·
  reading · meaning · speak).
- **Remembered position**: when nothing is selected, the last-read cell shows
  "上次看到" (accent 11px label).
- **Keyboard**: ← / → walk characters in display order across reading groups
  (global listener, ignored in text fields and with modifiers), stop at both
  ends, reveal the next batch past the load-more boundary, and move focus to
  the newly selected cell (scroll "nearest").

This is a dictionary selection, not spreadsheet cell selection: there are no
headers, ranges, editing or addressing.

### 6.18 Overlays — Tachiko

Menu/popover: 320px, 10px radius, `border.subtle`, `elevation.overlay`,
8px padding, groups separated by hairlines, items 40px (44 < 600), danger
item in `status.error.ink`; arrows/Enter/Escape, focus returns to the
trigger. Dialog: centered, ≤ 480px, 24px padding, title 16/24 600, actions
right (cancel then primary); focus contained; Escape closes (not for
alertdialog confirmations in progress). Sheet (< 600): the same dialog docked
to the bottom with top radii and safe-area padding (`data-sheet`). Scrim
`scrim` at 0.32 (dark 0.56). Toast: `inverse.*`, 10px radius, bottom center
(above the tab bar < 1024), one action, `role="status"`; never the only signal
of a local error.

### 6.19 Keycap hint, tag, status word

Keycap: 22×20, 1px border with 2px bottom, 12px 500. Hints are hidden on
coarse pointers and < 600. Tag: outlined 20px label (level "N3"), never
filled. Status word: "— 準備中" 12px secondary.

## 7. Surfaces

### 7.1 Today `/` — `today` (`returning`, `first`, dark)

Structure and order per D-13. Headline 32/40 600 with the due count in accent
(26/34 < 600). Actions: large primary "開始今日練習 →" + large secondary
"只複習錯題（n）" (only when anything is due). First run: kicker "免費 · 免註冊 ·
N5〜N1", headline "先選你的程度，今天就開始", three steps (current filled
accent), five level buttons as a radiogroup (5 columns ≥ 1024; 2 columns with
the first spanning below), hint + 使用說明, primary. #532: activating the
primary without a level moves focus to the level group and shows the existing
`role="alert"` hint. The World row in 全部練習 carries the "預覽" meta.

### 7.2 Practice session `/challenge` — `session`

States: `q`, `correct`, `wrong`, `revealed`, `recall`, `settings`, `settings-basic`, `settings-range`, `settings-custom`, `complete`,
`perfect`, `empty`, `loading`, `error`. Anatomy: h1 "問題 + question type
(Mincho)" → instruction (secondary) → prompt (`ja.prompt`, target
underlined) or headword block → aids (朗讀; 提示 before answering) → options → action row (fixed bottom
< 600) → keycap hint (before answering, fine pointer
only) → feedback block (prompt translation first). Aside (≥ 1024): 這一組 (name,
description, 換一組, 重設本次), 本次 (已答, 答對), 本次答錯 (surface · ~~your
answer~~ → answer), 本次設定 (length · rate + 調整). Below 1024 the same
capabilities live in the title button (switcher), the settings sheet and
completion. On wide widths 調整 opens the same settings as a dialog.

Settings (`session?state=settings`, `settings-basic`, `settings-range`,
`settings-custom`): first "這一組：<set>" with exactly the conditional controls
the current mode has today (`ModePicker`, `usePracticeSession`), never more:

- **単字讀音 only**: 題庫範圍 single choice from `VOCAB_LEVEL_RANGE_OPTIONS`
  (全部 · N1＋N2 · N2＋N3 · N4＋N5). The comprehensive bank has no range control —
  its level is the N1〜N4 備考 preset.
- **基礎變化**: 練習類型 (動詞 · い形容詞 · な形容詞 · 名詞 · 混合); 答題方式
  (選項 / 自己輸入) for verbs where the current rule allows it; 題庫範圍
  multi-select N1–N5 (全部 clears; levels without items disabled with a
  reason); 練習重點 from the available focus options (verbs: 單一形 · 核心動詞變化 ·
  て/た比較 · 否定整理 · 普通形整理 · 必要過去; non-verbs add く/に修飾 and drop the
  verb-only ones); 動詞類別 multi-select (verbs only); 目標形 select (single-form
  focus only; the compatible subset of the target-form inventory).
- Other sets show "沒有額外設定".

A note says changing these restarts the set. Then **每組題數**: presets 10 · 20 ·
30 · 50 · 全部 (shown for every set except daily, review and bookmarks, as
today) plus a labelled 自訂 number field (1–999, numeric keypad); **朗讀語速**:
標準 · 慢 · 更慢 plus 自訂 (0.5–1.5, step 0.05, decimal keypad). When the
effective value is custom, no preset is pressed and the 自訂 field is marked
selected (accent border/fill). The rate field keeps the learner's draft
("0", "0.") and applies it only once it parses in range; on blur an
out-of-range draft reverts to the effective rate (`TtsRatePicker`). Then 換一組練習
and 重設本次 (stating what is cleared). Multi-select groups are `role="group"`
with `aria-pressed` segments (`data-multi`); single choices are radiogroups;
preset rows are `aria-pressed` groups as today.

Typed recall: part of speech + reading meta, headword (dictionary form),
target form as an outlined label ("改成 て形"), labelled field + 送出, hint
"Enter 送出。選字中的 Enter 只會確定選字，不會送出。".

Completion: kicker "今日練習 · 完成", h1, score 48/56 tabular ("18 / 20"),
perfect adds "〇 全對" in `assess.correct` (no 花丸, no confetti), body copy
(existing daily/review/generic; the perfect run never mentions mistakes), inline readouts (答對, 答錯, 正確率, 連續天數),
再來一組 (primary) / 回到今日, this session's mistakes, share + 意見回饋 +
`jabiko.app` watermark. Empty: factual h1 + rule + existing actions. Loading:
`role="status"` "準備題目中…" + static placeholders at the size of prompt and
options (no shimmer). Error: protected error notice (cause + records are
safe) + 重新載入 / 回到今日.

### 7.3 Set switcher — `sets?state=switcher`

From the session title or 換一組. Wide: anchored dialog (560px) under the
bar; compact: sheet. Title "換一組練習" + consequence line (already-answered
items stay in the record). Groups exactly as `MODE_GROUPS`: 每日 (今日練習,
弱點複習, 我的收藏), 備考題庫 (綜合考題庫, N1 備考, N2 備考, N3 備考, N4 備考),
專項練習 (句型練習, 句中填空, 単字讀音, 基礎變化), as button rows with the existing
subtitle and count; current row `aria-current` + "目前". Choosing a set that
has configuration starts it with its last settings; they are changed in the
settings sheet. Footer: 依 JLPT 題型練習 → and 關閉. Counts on boards are
illustrative.

### 7.4 JLPT sections `/mock` — `sets?state=mock`

Kicker "練習 · JLPT 題型", h1 "依官方題型逐區練習", level segmented control,
grouped rows "問題 N · Japanese section name (Mincho) · description · count".
Group heads and "問題 N" numbering only where `mockExam.ts` provides them;
otherwise omitted (stated on the board). Unavailable: §6.8.

### 7.5 Learn `/learn` — `learn`

Wide: 240px sticky TOC (group heads, chapters; completed chapters show a
small `assess.correct` 〇; current `aria-current` with accent background;
"已完成 n / 48 章"), then the chapter column. Compact: "章節目錄 · n / 48"
button → TOC sheet. Chapter: kicker "group · 第 n 課", h1, Japanese subtitle
(Mincho, `lang="ja"`), explanation (`read.body`), formula block (inset with a
2px `border.control` left rule), 例句 rows (`ja.line` + translation + speak),
常見陷阱 numbered list, primary "練這一章：…" + secondary next chapter, then
建議先看 and 完成條件: the chapter's actual rule from `isLearningBlockComplete` in plain words (e.g. "把「て形」答對一次"); reference chapters show "參考" in the TOC and no 完成條件.

### 7.6 Grammar — `grammar` (`index`, `point`)

Level hub: breadcrumbs (44px < 600), h1 "JLPT N3 文型", description, level
link-segment (canonical lowercase routes), search, importance segment, video
filter checkbox, live count (`role="status"`), pattern rows (Mincho 20/28
pattern · meaning + formation line (zh-Hant only, Japanese Gothic) ·
importance · chevron). Point (SEO landing): breadcrumbs, level tag +
importance word, h1 = pattern (`ja.headword`), meaning (18/28 600),
`meaningJa` (Mincho secondary), 接續 (zh-Hant only), 例句 (`ja.line` 22/36),
curated notes, 常見錯誤 only when data exists, media examples when present,
pager (previous/next), aside 相關文型. No per-pattern practice or stats (not
current capabilities).

### 7.7 Reference — `reference` (`page`, `selected`, `sheet`)

Kanji: kicker "資料 · 漢字音讀", h1, description, search, 音讀/訓讀 and level
segments, keycap hint (←/→), reading groups (reading Mincho 24 + "音讀み · n 字")
with the kanji lattice (§6.17: remembered position in `page`, selected cell +
detail row in `selected`), full-width "載入更多（還有 n 字）", and the existing
search-empty message when nothing matches. `/rules` and `/kana` use
the same page head with typeset tables and the kana lattice. Compact 資料
sheet: four rows with a Mincho Japanese sublabel; current `aria-current`.

### 7.8 Small Talk `/conversation` — `talk`

Intro: kicker "會話 · Small Talk", h1 "把話接下去", intro line; seasonal rows
with phase word (即將到來 / 現在 in accent, 最近 in secondary) and date;
scenes grouped 短 / 中 / 長 with a one-line job per group; rows are buttons
(`aria-pressed`); brief panel in the aside (after the list < 1024) receiving
focus on selection. Run (session surface): topic h1 (20/28), meta (length ·
roles · register), situation; script; 你的回應 + instruction + response options
(list, `ja.option` 18/30); feedback: question-style heading ("這樣回，對方接得下去嗎？",
focus target as today), explanation, five dimensions, moves, 換個說法再試一次
(primary) / 繼續. Complete: summary, moves practised, 再練一次 / 換情境. Footer
note: curated, offline, no AI scoring, no speech recognition.

### 7.9 World `/game` — `world` (D-22)

States: `home`, `moment`, `feedback`, `handoff`, `handoff-stale`, `empty`,
`error` (definition invalid), `progress-error` (saved progress invalid).
Completed moments show "已完成" without an action (no replay, D-22). Home per §6.15 and D-22, aside 認識的人 + 想先練一下？ (Small Talk link).
Moment: session bar titled "place・person", the same script and response
components, then feedback with the person's reaction as the heading,
dimensions, the unlock result ("和佐藤さん熟了一點 · 「学校」開放了", check icon,
accent 600), the optional handoff row (reason + "可略過" + secondary link),
繼續 (primary) / 換個說法再試一次. Handoff: the normal Training surface with the
return bar (§6.16). Empty and error per D-22.

### 7.10 Shell and menu — `system` (`menu-guest`, `menu-user`, `language`, `delete`, `feedback`)

Menu (popover; full width minus 16px < 600): account block first — guest:
"作答紀錄存在這台裝置…" + "使用 Google 登入" (primary); signed in: monogram,
name, sync line (success ink + check, or syncing/error text) — then 介面語言
(current value), 外觀 (淺色/深色 segment), 專注模式; 日常世界 (預覽), 意見回饋,
關於 Jabiko, 合作夥伴 (locale-gated); signed in: 登出, 刪除練習紀錄… (danger).
Language: radio choices in their own script + code, no flags, note that
Japanese content does not change. Delete: `alertdialog`, existing description
verbatim, "我了解此操作不可復原" checkbox, 取消 + destructive 刪除 enabled only
when checked, busy "刪除中…", existing success/failure messages. Feedback:
kind segment (許願功能 / 回報問題 / 其他), labelled anonymous textarea, inline
error that keeps the draft, 再試一次.

### 7.11 Focus mode — `system` (`focus-config`, `focus-break`)

Header toggle (idle "專注"; active remaining time). Configure: 專注時間 /
休息時間 (minutes, numeric) + "專注期間不顯示任何廣告" + 開始. Break: minimal
header with 結束專注模式, kicker "專注模式 · 第 n 輪", h1 "休息一下", clock
72/80 light tabular (`role="timer"` with a spoken label; 56/64 < 600), prompt,
inline readouts (本次專注, 作答, 正確率, 今日累計), 開始下一輪 / 略過休息. The ad
slot exists only when every `docs/adsense.md` condition passes, labelled
"廣告" below the controls; otherwise no box is rendered.

### 7.12 System states — `system` (`offline`, `update`, `route-error`), `session` (`loading`, `error`)

Offline: warning notice under the header stating what still works and that
answers sync later (`role="status"`). Update: toast "有新版本可用。" + 更新.
Route error: h1 "這一頁沒有順利打開", error notice, 重新整理 / 清除快取後重載 /
回首頁. Asset-recovery behavior unchanged.

## 8. Content, language and localization

- **L1** Language isolation unchanged (CLAUDE.md; CAPABILITIES §2).
- **L2** Fallback content carries truthful `lang` (D-21).
- **L3** UI language changes chrome and overlay content only; Japanese
  learning content never changes with it.
- **L4** New copy enters every launched locale via i18n files and passes
  `check:i18n`; boards are zh-Hant proposals (`session?state=wrong&lang=en`
  shows the English overlay path). No English eyebrows elsewhere; no emoji.
- **L5** Furigana, TTS and reading-prompt exclusions keep current behavior.
- **L6** No answer leaks: no level tag, hint text, example or placeholder that
  reveals the answer before a verdict.

## 9. Accessibility (never below the Tachiko floor)

- **Landmarks**: header, nav (primary; tab bar; TOC; breadcrumbs), main,
  aside, footer; one h1 per view (D-09); logical h2/h3; skip link.
- **Keyboard**: DOM order = reading order (Today's record follows the set;
  asides follow their owner). Practice: 1–4 answer, Enter next, Enter never
  submits during IME composition; kanji ←/→. Menus: arrows, Enter, Escape.
  Dialogs/sheets: contained Tab, Escape closes, focus returns to the trigger.
  No new shortcuts.
- **Focus**: 3px `focus.ring` + 2px offset on every focusable element; inset
  (−3px) inside bars, rows, lattices, menu items and choices (verified by
  keyboard traversal on every board at 1440).
- **Names**: every control has an accessible name that does not depend on
  text hidden at the current width (the focus and furigana toggles carry
  `aria-label`; the active focus toggle includes the remaining time) —
  verified on every board and width.
- **Targets**: ≥ 44×44 on coarse pointers and < 600 (verified at 320 and 390,
  inline text links in running text exempt per WCAG 2.5.8); options ≥ 56.
- **Contrast/non-color**: C5, C6 (60/60 pairs).
- **Live regions**: verdict and Small Talk feedback `aria-live="polite"`;
  counts/filters/loading `role="status"`; failures `role="alert"`; timer
  `role="timer"`; day strip and stage meters `role="img"` with summaries.
- **Reflow**: 320px without horizontal scroll (verified); 200% text zoom must
  not clip (#838 check).
- **Forced colors**: system colors, real borders on controls and notices,
  2px `CanvasText` verdict edges, `Highlight` for current/selected/progress
  (`renders/*-forced-*`).
- **Reduced motion**: no transitions or animation.
- **Language**: `html lang` = UI language; Japanese carriers `lang="ja"`.

## 10. Implementation guidance

Binding on *what*, advisory on *how*.

### 10.1 Training (#838)

1. **Tokens first.** One token layer in `src/styles` declaring the
   `tokens.json` roles as private custom properties for `:root` and
   `:root[data-theme="dark"]`, plus a unit test asserting parity with
   `docs/design/jabiko/tokens.json` (the same check as `tools/verify.mjs`).
   Retire the old palette (`--paper`, matcha, teal, vermilion, …) instead of
   aliasing it.
2. **Recipes, not a framework.** Port the recipes in
   `reference/jabiko.css` into `src/styles/*` as surfaces are rebuilt; do not
   import the reference file; no shared Tachiko package.
3. **Preserve behavior seams**: `DrillPanel` data attributes,
   `nextButtonRef`, keyboard handling, IME guard, feedback semantics. D-07
   changes the feedback DOM order: update `DrillPanel.test.tsx` RED-first
   citing D-07.
4. **Small, tested domain changes**: navigation grouping (D-08), retiring
   `doneSpot.ts` (D-10), an additive localized-with-source helper (D-21),
   optional mock-section grouping metadata (§7.4).
5. **Tests that encode old visuals** (`src/styles/*.test.ts`, App h1
   assertions) move to the new contracts RED-first.
6. **Remove, don't keep**: `hero.webp`, spot illustrations, the old palette,
   flag rendering in the picker (dependency removal is a separate change).
7. **Unchanged**: routes, analytics, ad gating, SEO, prerender, lazy chunks.
8. **Sequence**: tokens + shell (header, tab bar, menu) → Today → session →
   switcher + `/mock` → Learn → Grammar → Reference → Small Talk → system
   states; unported screens run inside a compatibility wrapper on the new
   tokens; no permanent second navigation.

### 10.2 World shell (#834) and return (#836)

1. Scope World styles under the game route's lazy chunk; reuse the same
   token layer (no second token set).
2. Shell: World header (§4.1), current-moment block, place sections,
   relationship aside, session surface for moments; all from §6.
3. Load status: an explicit status that separates valid-empty,
   definition-invalid and state-invalid (D-22); never infer from an empty
   array, and never modify progress on a state error.
4. Preview: keep the note and "預覽" until a playable slice ships; no fake
   progress or release claims.
5. #836: return bar and stale fallback (§6.16); the handoff is optional and
   skippable; language selection preserved across products.

### 10.3 Acceptance checklist (design conformance)

- [ ] Every row of CAPABILITIES.md §1 reachable at 320, 390, 768, 1280, 1440.
- [ ] Token parity and contrast checks pass in the app build (both themes).
- [ ] Shared roles equal FOUNDATION.md §2; no extra hues outside assessment.
- [ ] Verdicts follow §5; never notice/error styling; options and Next do not
      move after answering (D-07).
- [ ] Session surfaces hide global navigation; exit, switcher, settings and
      menu reachable on every width.
- [ ] One h1 per view; Today h1 = product title; SEO unchanged.
- [ ] 44px targets on touch/compact; 3px focus everywhere; reduced motion;
      forced colors; `lang="ja"` on Japanese content.
- [ ] Language isolation and furigana rules unchanged; new copy in every
      launched locale.
- [ ] Nothing from the anti-template ledger (D-23).
- [ ] World: empty vs error distinguishable; preview truthful; handoff
      optional; stale return safe.

## 11. Out of scope and open items

- World character/illustration art authority (monograms until then).
- Public label for the World product (D-22 proposal "日常").
- Figma variables/text styles/components: the qualified bridge cannot author
  them; values stay in `tokens.json` (D-01). A later pass may add them.
- `/rules` and `/kana` full table specimens (they reuse §6 recipes; boards
  show the reference sheet and kanji lattice).
- Physical-device, screen-reader and IME evidence (#838/#834 acceptance).
