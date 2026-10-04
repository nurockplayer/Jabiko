# JT-1 verification record

What was checked, how, the results, and what this design evidence does not
prove (Tachiko UQC §8–9 evidence discipline). Machine-readable results:
`verification/report.json` (design checks) and `verification/figma-report.json`
(Figma parity).

## 1. Design checks — `tools/verify.mjs`

Environment: Chromium from the repository's Playwright, DPR 1,
`reducedMotion: reduce`, locale zh-TW; widths < 600 emulate a touch phone.
macOS system faces (the harness downloads nothing).

| Check | Scope | Result |
| --- | --- | --- |
| Token parity: every `tokens.json` color equals the harness custom property | 33 roles × 2 themes | **66/66** |
| Tachiko parity: every role sourced `tachiko`/`tachiko-protected` equals the FOUNDATION.md §2 snapshot | 30 roles | **30/30** |
| Contrast: every declared pair meets its minimum | 30 pairs × 2 themes | **60/60** |
| Board checks: no horizontal overflow; exactly one visible h1; ≥ 44px targets below 600px (inline links in running text exempt); Japanese carriers inside `lang="ja"`; every visible control has an accessible name independent of width-hidden text; 3px focus ring on the first 14 Tab stops (1440); bar text never wraps and bar controls never overlap | 12 boards × 47 states × 5 widths (320, 390, 768, 1280, 1440) | **235/235** |
| D-07 geometry: the four options **and Next** keep identical boxes in `q`, `correct`, `wrong`, `revealed` | 5 widths | **5/5** |
| D-07 fold: at 390×844 the verdict line ends above the fixed action row | `session?state=wrong` | **pass** |
| Captures | light, dark, forced colors, English overlay | **87** renders |

Specimen boards (`index`, `foundation`, `components`) are exempt from the
target and focus checks because they show forced states side by side.

Defects the checks caught during authoring and that were fixed: dark
`action.primary.hover` at 4.2:1 (now darker, 6.21:1); segmented controls,
breadcrumbs, related links and footer links under 44px on phones; the
session bar's count colliding with the furigana toggle at 320px (title now
truncates); a 6px overflow at 768px from a JLPT section row with more cells
than columns; the set switcher state missing its h1.

## 2. Figma — `tools/figma/*`

Pending the import into the dedicated Jabiko file (see README). The serializer
has been run over all 82 scenes: every scene serialized with **0 unmatched
text, 0 missing text and 0 elements moved** by preparation (fail-closed).

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
- **Package review, round 2.** See §5.

## 4. What design evidence does not prove

Static boards and Figma frames do not prove runtime correctness, screen-reader
output, CJK IME behavior on real keyboards, software-keyboard layout on
devices, platform font fallback (Windows/Android Mincho), 200% text zoom in
the app, or performance and lazy-loading. Those are acceptance gates of
#838/#834/#836 (DESIGN.md §10.3). Sample counts, names, places and lines on
the boards are illustrative unless CAPABILITIES.md names their source.

## 5. Review log

(Filled in below as reviews complete.)
