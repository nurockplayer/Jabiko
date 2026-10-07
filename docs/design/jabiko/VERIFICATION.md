# JT-1 verification record

What was checked, how, the results, and what this design evidence does not
prove (Tachiko UQC §8–9 evidence discipline). Machine-readable results:
`verification/report.json` (design checks) and `verification/figma-report.json`
(Figma parity).

## 1. Design checks — `tools/verify.mjs`

Environment: Chromium from the repository's Playwright, DPR 1,
`reducedMotion: reduce`, locale zh-TW; widths < 1024 emulate a touch device.
macOS system faces (the harness downloads nothing).

| Check | Scope | Result |
| --- | --- | --- |
| Token parity: every `tokens.json` color equals the harness custom property | 36 roles × 2 themes | **72/72** |
| Tachiko parity: every role sourced `tachiko`/`tachiko-protected` equals the FOUNDATION.md §2 snapshot | 30 roles | **30/30** |
| Contrast: every declared pair meets its minimum | 35 pairs × 2 themes | **70/70** |
| Board checks: no horizontal overflow; exactly one visible h1; ≥ 44px targets below 1024px (touch; inline links in running text exempt); Japanese carriers inside `lang="ja"`; every visible control has an accessible name independent of width-hidden text; 3px focus ring on the first 14 Tab stops (1440); bar text never wraps and bar controls never overlap | 12 boards × 51 states × 5 widths (320, 390, 768, 1280, 1440); < 1024 emulated as touch | **255/255** |
| D-07 geometry: the four options **and Next** keep identical boxes in `q`, `correct`, `wrong`, `revealed` | 5 widths × {short, long} × {zh-Hant, en} | **20/20** |
| D-07 fold: at 390×844 the verdict line ends above the fixed action row | `session?state=wrong` | **pass** |
| Forced colours: selected controls that receive keyboard focus still draw a ≥ 3px ring at ≥ 3:1 against the composited fill | settings, first-run levels, kanji selection (1440) × forced light / dark | **6/6** (min 11.3:1 / 8.73:1) |
| Disabled precedence (D-25): every disabled (native or `aria-disabled`) command — primary included — or toggle and every child resolves to the disabled ink, and (outside forced colours) to the disabled fill: transparent for quiet/off toggles, `surface.inset` otherwise including on+disabled; a focused on+disabled control in forced colours draws a 3px ring ≥ 3:1 against its own background | `components`, `session?state=wrong` × light, dark, forced light, forced dark | **8/8** (10 controls, 21 elements per mode; forced ring 21:1) |
| Captures | light, dark, forced colors, English overlay, long-content fixture | **95** renders |

Specimen boards (`index`, `foundation`, `components`) are exempt from the
target and focus checks because they show forced states side by side.

Defects the checks caught during authoring and that were fixed: dark
`action.primary.hover` at 4.2:1 (now darker, 6.21:1); segmented controls,
breadcrumbs, related links and footer links under 44px on phones; the
session bar's count colliding with the furigana toggle at 320px (title now
truncates); a 6px overflow at 768px from a JLPT section row with more cells
than columns; the set switcher state missing its h1.

## 2. Figma — `tools/figma/*`

File: **"Jabiko — Tachiko Design Authority"** (new, created by the founder
2026-10-05; not the historical Shu-ire file, never the Tachiko Sheet canonical
file). Transport: official `@gethopp/figma-mcp-bridge` 0.0.22, bulk editable
`import_html_layers` (html-figma 0.3.1 bundle, SHA-256 pinned in
`tools/figma/policy.mjs`).

| Check | Result |
| --- | --- |
| Frames imported, one per capture scene, named `JT-1 CANDIDATE · <board> · <state> · <viewport>` | **95/95**, every serialized layer imported |
| Serializer completeness (fail-closed): unmatched text / missing text / elements moved by preparation | **0 / 0 / 0** for every scene |
| Readback: TEXT layers equal the serialized count; fonts equal the serialized `fontName` | **5,250** text layers; fonts match on every frame |
| Image fills (no raster substitutes) | **0** |
| Every solid paint is a `tokens.json` colour (either theme) or mascot art (forced-colours frames exempt) | pass |
| Native export size equals frame size; export byte-stable | pass (95/95) |
| Visual diff vs. the like-for-like Chromium capture (share of pixels with channel delta > 48; limit 0.05) | max **0.0322**, median **0.0122** |
| Offline parity (`tools/figma/verify.mjs`) | **95/95**, 0 failures |
| Live parity (`verify.mjs --live`: every frame read back; name, size and readback hash equal the registry) | **95/95** |

**Page layout.** The file is on Figma's Starter plan (three pages) and the
bridge cannot rename or delete pages, so — by the founder's choice — the
system boards (index, foundations, components) are on the page created as
"00 Index", every surface board is on the page created as "01 Foundations" in
labelled rows (10 Today … 70 Shell & System), and "Page 1" is the archive.
The founder renames the two pages by hand ("00 System", "10 Surfaces");
`figma-registry.json` records page **IDs**, which survive renaming.

**Defects the Figma pass caught and fixed in the harness** (each followed by a
clean re-import of all frames from one harness state): the modal scrim and the
toast button border used `color-mix()`, which the importer cannot read
(scrim missing; off-palette `#010101`) — now explicit colours from the
`scrim` and `inverse` tokens; native checkboxes imported as the text "on" —
now a drawn checkbox over a real input; the set switcher was `absolute` and
painted under the fixed scrim in Figma — now a fixed overlay.

**Re-import for D-25 (2026-10-08).** After the action-language revision all
95 frames were re-imported with `import.mjs --replace` (the superseded frames
were moved to "Page 1" and renamed "ARCHIVED · NOT AUTHORITY · …"), then
re-registered: 95/95 imported, 0 image fills, visual diff max **0.0322**,
median **0.0122**; offline and live parity **95/95**.

**Pending:** the shareable file key/URL (`policy.mjs` `FIGMA_FILE.key`/`url`)
are recorded once the founder shares the link; frames are renamed
"JT-1 APPROVED · …" only after the founder accepts JT-1.

## 3. Independent review

- **Direction challenge (Codex, before building).** Findings adopted:
  per-surface composition instead of "the Japanese sentence is always the
  hero" (Today leads with the start action, World with the current moment);
  assessment needs more than two states (target, revealed, Small Talk △ with
  independent dimensions); a per-capability compact-entry map; cross-route
  navigation as links with `aria-current`, not a tablist; an explicit
  whitelist of inherited Tachiko roles; World must distinguish empty from
  failed content and give the training handoff a stale-return fallback;
  D-07 must be an explicit replacement of #473 with long-content evidence.
- **Package review, round 1 (Codex, read-only, after building).** Verdict
  "Blocking findings: 5". Dispositions:
  1. *Set configuration missing* (level ranges, 基礎變化 type / answer mode /
     levels / focus / verb groups / target form; switcher missing N1/N2/N4,
     cloze, vocab) — **fixed**: settings "這一組" section with every
     conditional `ModePicker` control (`session?state=settings-basic`), full
     `MODE_GROUPS` switcher, CAPABILITIES rows added.
  2. *Kanji selection and detail removed as "spreadsheet semantics"* —
     **fixed**: selection, in-cell speak, detail row, remembered position and
     existing ←/→ behavior restored (`reference?state=selected`, DESIGN §6.17);
     FOUNDATION §5 wording corrected.
  3. *Next moved after answering; the check skipped it* — **fixed**: action
     row directly under the options (fixed bottom on compact); the geometry
     check now compares all five boxes; focus-to-Next stated.
  4. *World empty vs invalid progress; replay unauthorized* — **fixed**:
     three outcomes (`empty`, `error`, `progress-error`) with an explicit load
     status required; replay removed ("已完成").
  5. *Compact toggles lost accessible names* — **fixed**: `aria-label` on
     focus/furigana toggles everywhere; a new accessible-name check runs on
     every board and width.
  6. *Invented completion rule; perfect-run copy mentioned mistakes* —
     **fixed** (real `isLearningBlockComplete` rule, "參考" chapters, separate
     perfect copy).
  7. *Automation attributes differed* — **fixed**: container `data-selected`
     = answer text, option `data-selected="true"`, `data-result` values
     unchanged, presentation states on `data-jt-verdict`; recall Next enabled.
  8. *Figma evidence pending* — see §2.
- **Package review, round 2 (fresh Codex reviewer).** Round-1 items 2, 3
  (for the supplied fixtures), 4 and 5 VERIFIED; items 1, 6, 7 partially.
  Verdict "Blocking findings: 2". Dispositions:
  1. *Verdict label could re-wrap option text; translation inserted above
     the options* — **fixed**: verdict slot reserved before answering
     (80px, 96px in English) with short labels; prompt translation moved into
     the feedback block; the geometry check now runs short and long content
     (`?fixture=long`) in zh-Hant and English at every width (20/20).
  2. *Kanji N2/N1 filter missing* — **fixed** (全部, N5–N1).
  3. *Range selector and target forms only described* — **fixed**:
     `settings-range` renders the real 題庫範圍 selector; 目標形 lists the full
     inventory with the compatibility rule stated.
  4. *`data-result="unanswered"` omitted* — **fixed** in board and A6.
  5. *Learn completion copy restricted to the chapter* — **fixed** ("在任何練習裡").
  6. *Tablet touch targets* — **fixed**: 44px floors also under
     `(pointer: coarse)`; 768px is now touch-emulated and target-checked.
  7. *Stale anatomy order; author note visible in the World frame* —
     **fixed**.
- **Package review, round 3 (fresh Codex reviewer).** Round-2 items 1, 2, 5,
  6, 7 VERIFIED; 3 and 4 partially. Verdict "Blocking findings: 2".
  Dispositions:
  1. *Settings inventories exceeded production* (副詞/寒暄語, missing 必要過去,
     range options outside `VOCAB_LEVEL_RANGE_OPTIONS`, a range selector for the
     comprehensive bank) — **fixed**: inventories now equal `ModePicker` /
     `usePracticeSession` / `levelRange.ts`; length hidden for daily as today.
  2. *Custom length/rate had no input state* — **fixed**: presets plus labelled
     自訂 number fields, a selected-custom state and the rate draft rule
     (`session?state=settings-custom`, DESIGN §7.2).
  3. *`unanswered` missing on recall; long fixture kept short-fixture
     attributes* — **fixed**.
  4. *World feedback showed three of five dimensions* — **fixed** (all five).
- **Package review, round 4 (fresh Codex reviewer).** All four round-3 items
  VERIFIED; independent recalculation of colour parity (66/66), contrast
  (60/60) and Tachiko mapping roles (19/19) passed. Verdict "Blocking
  findings: 2". Dispositions:
  1. *No compact path to the session tally/mistakes; endless sessions never
     reach completion* — **fixed**: the progress readout is a button opening
     本次 on every width (`session?state=summary`, endless "第 7 題").
  2. *World feedback announced unlocks before the moment completed* —
     **fixed**: retryable response feedback shows no progress; a separate
     `complete` state shows the applied transition (D-22).
  3. *Automation identity in specimens* — **fixed**: exam
     `data-question-type` = promptLabel, recall has an id and `targetForm`, the
     long fixture has its own id; CAPABILITIES states ids are illustrative.
  4. *Forced colours missed checked radios* — **fixed**: outline for checked
     radios, current links, selected cells, custom fields and pressed toggles;
     a forced-colours settings capture was added.
  The reviewer also noted that the keyboard check covers outline styling on
  Tab stops only, not modal containment or radio arrow keys; that remains an
  implementation acceptance item (§5).
- **Package review, round 5 (fresh Codex reviewer).** All four round-4
  items VERIFIED; parity 66/66, contrast 60/60, Tachiko roles 19/19
  independently recalculated. Verdict "Blocking findings: 1":
  1. *Forced-colours selection outline overrode the keyboard focus ring* —
     **fixed**: selection uses the system selection fill
     (`Highlight`/`HighlightText`), focus keeps a 3px `CanvasText` outline; a
     new forced-colours focus check tabs through selected controls on three
     boards (3/3).
  Should-fix items fixed: the endless summary no longer shows a finite
  progress edge; the session anatomy text names the progress-button path and
  the verdict-first feedback order.
- **Package review, round 6 (fresh Codex reviewer).** All round-5 items
  VERIFIED. Verdict "Blocking findings: 1":
  1. *Forced-colours focus ring inside a selection fill measured ≈ 1.9:1
     (CanvasText on Highlight)* — **fixed**: inside a selection fill the
     inset ring is `HighlightText` (offset −4px); the forced-colours check
     now also measures ring contrast against the composited fill in light and
     dark forced themes (6/6; minimum 11.3:1 light, 8.73:1 dark).
  Should-fix: the focus-coverage wording in DESIGN §9 now states the bounded
  evidence; README capture count corrected.
- **Package review, round 7 (fresh Codex reviewer).** All round-6 items
  VERIFIED (the reviewer's sandbox could not start a browser, so it verified
  the committed evidence and implementation rather than re-running it).
  Final sweep: **"No blocking findings."** Polish applied afterwards: the
  "上次看到" label now uses the 12/16 CJK floor; DESIGN §9 says "every product
  board". Notes kept as implementation acceptance items: full Tab traversal,
  modal containment, radio arrow keys, selected custom fields under forced
  colours.

- **Action-language revision D-25 (founder feedback: actions "read too much
  like Bootstrap 4"), round 8 (fresh Codex challenger).** Verdict "Blocking 3":
  1. *Two primaries in typed recall* — **fixed**: the primary follows the
     phase (DESIGN §6.1); before a verdict the session row has no primary,
     after it 下一題 is primary; 下一題 keeps a 132px minimum box so the swap
     never moves it (geometry check now selects `#next`, still five boxes,
     20/20).
  2. *"On" overrode "disabled"* — fixed in round 9 (below).
  3. *Enter keycap shown before Enter works* — **fixed**: keycap and
     `aria-keyshortcuts` only after a verdict, matching production
     `handleDrillKeyDown`.
  Non-blocking, all applied: Today hero pair is primary + quiet (no two filled
  rectangles); border rule narrowed to command buttons and the grammar pager
  made quiet; toggle contract restated as "inset edge is the shape mark";
  bar icon buttons in secondary ink; deviation record lists sizing changes.
- **Round 9 (Codex).** Items 1 and 3 VERIFIED; hero pairing VERIFIED. Held on
  disabled precedence (aria-disabled and toggle children not covered) —
  **fixed** with one consolidated rule block after the toggle rules for both
  disabled attributes, in normal and forced colours, plus an aria-disabled
  specimen row; stale "state word" prose and "large tonal" corrected.
- **Round 10 (Codex, cascade audit of 80 combinations).** Prose items
  VERIFIED; disabled precedence still NOT RESOLVED: `:is()` wrapping did not
  raise specificity enough, so the furigana glyph and state word kept their
  on/off ink, and forced-colour disabled ink lost to authored ink; a focused
  on+disabled control kept a `HighlightText` ring on `Canvas`. **Fixed** by
  specificity (a `:root` prefix and an explicit child list) rather than source
  order, and a `CanvasText` ring for that case. Because a reading of the
  cascade had been wrong twice, the rule is now **measured**: `verify.mjs`
  checks computed ink of every disabled control and child in four modes and
  the forced focus ring (8/8). Mutation check: re-breaking the child rule
  makes it fail with exactly the round-10 symptoms (6/8).
- **Round 11 (fresh Codex, final sweep of D-25).** Rounds 8–10 blockers
  VERIFIED. **"Blocking findings: 0".** Design judgment: primary-plus-quiet
  heroes and quiet toolbar controls answer the Bootstrap critique; the
  hierarchy reads as intentional. Polish applied: the disabled check now also
  covers primary commands and asserts fills; large-quiet weight (500) and
  "quiet next chapter" stated explicitly.

## 4. Review log summary

| Round | Reviewer | Verdict | Outcome |
| --- | --- | --- | --- |
| 0 | Codex (direction challenge) | — | composition per surface, assessment states, capability map, link navigation, World states |
| 1 | Codex | Blocking 5 | all fixed |
| 2 | Codex (fresh) | Blocking 2 | all fixed |
| 3 | Codex (fresh) | Blocking 2 | all fixed |
| 4 | Codex (fresh) | Blocking 2 | all fixed |
| 5 | Codex (fresh) | Blocking 1 | fixed |
| 6 | Codex (fresh) | Blocking 1 | fixed |
| 7 | Codex (fresh) | **No blocking findings** | polish applied |
| 8 | Codex (fresh, D-25 actions) | Blocking 3 | 2 fixed, 1 fixed in round 9 |
| 9 | Codex | Blocking 1 | fixed in round 10 |
| 10 | Codex | Blocking 1 | fixed; now a measured check |
| 11 | Codex (fresh, final D-25 sweep) | **No blocking findings** | polish applied |

These are independent *agent* reviews of the design package. JT-1 still
needs the founder's acceptance (including the REVIEW-CONFIRM items D-07, D-14,
D-22) before frames are renamed "JT-1 APPROVED".

## 5. What design evidence does not prove

Static boards and Figma frames do not prove runtime correctness, screen-reader
output, CJK IME behavior on real keyboards, software-keyboard layout on
devices, platform font fallback (Windows/Android Mincho), 200% text zoom in
the app, or performance and lazy-loading. Those are acceptance gates of
#838/#834/#836 (DESIGN.md §10.3). Sample counts, names, places and lines on
the boards are illustrative unless CAPABILITIES.md names their source.

