# Shu-ire SI-1 — verification record

Command: `node docs/design/learning/tools/verify.mjs` (full detail in
[verification/report.json](verification/report.json)).
Environment: macOS (darwin), Node v26.10.0, Chromium 151.0.7922.34 via the
repository's `@playwright/test`, DPR 1, `reducedMotion: reduce`, locale
`zh-TW`; touch emulation below 600px.

## Results

| Check | Scope | Result |
| --- | --- | --- |
| Token ↔ recipe parity | 32 color roles × light/dark: `tokens.json` value equals the harness CSS custom property | **64 / 64 PASS** |
| Contrast (WCAG 2.x) | 33 declared foreground/background pairs × light/dark; text ≥ 4.5:1, non-text ≥ 3:1 | **66 / 66 PASS** (lowest text pair 4.56:1, lowest non-text pair 3.27:1) |
| Board checks | 8 boards, 33 states × 4 viewports (320×640, 390×844, 1280×800, 1440×900) | **132 / 132 PASS** |
| — no horizontal overflow | every board/state/viewport | pass |
| — exactly one visible h1 | every board/state/viewport | pass |
| — touch targets ≥ 44 × 44 | every standalone target at 320 and 390 (running-prose links exempt) | pass |
| — `lang="ja"` on Japanese carriers | prompts, options, headwords, Japanese labels, lattice | pass |
| — visible 3px focus ring | first 12 Tab stops per board/state at 1440 | pass |
| — reduced motion | no verdict stroke animates under `prefers-reduced-motion` | pass |
| — bar text and collisions | no text run in the top bar, session bar or tab bar wraps; no two bar controls overlap | pass |
| — D-07 fold | wrong answer at 390×844: verdict line bottom 647px above sticky actions top 775px | pass |
| Review renders | 59 PNGs incl. dark, forced colors (emulated), English, and the Figma cover | generated |

The first full run failed on real defects that were then fixed in the
recipes, not waived: 56 board/state/viewport combinations (32 after the first
fix pass) had touch targets under 44px (brand link, set switcher, menu rows at 40px, footer and breadcrumb
links, collapsed furigana toggle, the delete-history checkbox label). Earlier
visual review also caught and fixed: verdict labels overriding `[hidden]`,
2-column options squeezing text on phones, an answer-revealing recall
placeholder, a duplicated question counter, invented content (grammar "feel"
notes, per-pattern practice/stats, a Small Talk coaching line, scene titles,
Small Talk number shortcuts) and a 7-day trend that would have dropped the
existing 14-day window.

A second round of defects came out of the Figma stage and was fixed in the
design, not waived. The Figma completeness check found the 320px session bar
squeezing "7 / 20" onto two lines over the furigana toggle, and the new
bar-collision check then found the top bar's 專注 / 振假名 labels stacking
vertically at 320px on every index and reading board: 27 board/state
combinations in all. The compact session furigana toggle also hid its word
with `display: none`, which reduced its accessible name to "ふ". The fixes:
bar controls never wrap; below 360px the top-bar words become visually hidden
names on 44 × 44 targets; the session bar gives the set name the only
shrinkable track (DESIGN.md §4.3, §4.5).

## Figma authority

Canonical file: [Jabiko Learning — Shu-ire](https://www.figma.com/design/h4XBtIaL5XYsBOxGVTHmc4/Jabiko-Learning-%E2%80%94-Shu-ire)
(D-01). Frames, pages and hashes are in [figma-registry.json](figma-registry.json);
the native exports are in [renders/figma/](renders/figma/).

**Pipeline.** The official `@gethopp/figma-mcp-bridge` 0.0.22 (unpatched,
leader on port 1994, plugin open in the file). For each of the 59 scenes,
`tools/figma/serialize.mjs` lays the harness out in Chromium
151.0.7922.34 in the Figma faces and serializes it with the SHA-pinned
html-figma 0.3.1 bundle. `tools/figma/import.mjs` imports it with
`import_html_layers`, reads it back with `get_node` and exports it natively at
scale 1. `tools/figma/registry.mjs` records the result, and
`tools/figma/verify.mjs` checks it.

| Check | Result |
| --- | --- |
| Bridge qualification | Two disposable probes (`session-state-wrong-1440x900`) imported 275/275 layers as editable FRAME/TEXT/VECTOR/RECTANGLE with no image fills, exported, read back and deleted; a font-style probe established the styles Figma offers per face (`tools/figma/policy.mjs`) and was deleted |
| Serialization | 59/59 scenes; 0 unmatched and 0 missing texts (every rendered DOM text run has a layer); 0 elements moved by preparation |
| Import | 59/59 frames on pages 00–60; 11,575 layers imported of 11,575 serialized; 3,203 text layers read back of 3,203 |
| Fonts | readback font of every text layer equals its serialized `fontName`; all within Inter / Noto Sans JP / Noto Sans TC / Noto Serif JP styles Figma offers |
| Paints | 0 image fills; every solid fill and stroke of the 58 non-forced frames is a `tokens.json` color (either theme) or one of the three Jabiko mascot colors |
| Visual | Figma export (scale 1) vs the Chromium capture of the same layout: equal size for all 59; differing pixels (max channel delta > 48) median 1.35%, max 4.22% (`talk · intro · 390×844`); limit 5% |
| Offline parity (`node docs/design/learning/tools/figma/verify.mjs`) | 59/59, 0 failures; fails as intended on a harness edit, a tampered export and a non-token paint |

Visual inspection of the exports (every page; closest look at dark, forced
colors, English, full-page Today / Learn / Mock, the specimen marks, the
dialogs and the sheets) found them faithful. The residual pixel differences
are glyph rasterization and small CJK baseline offsets (below).

Defects found in the pipeline itself and fixed before the accepted import
(each earlier import was deleted, not kept): overlay subtrees under
zero-size wrappers were dropped (dialogs, menus, sheets); the bridge
collapsed weights 500/600 to Regular/Bold; exports silently kept stale files
because the bridge never overwrites; full-page frames took the body height;
Chromium's CJK punctuation trimming broke lines differently from Figma; a
per-line text split mutated the DOM and reflowed some lists; sticky/fixed
bars painted under later content; placeholders took html-figma's fixed grey;
stroke-only mascot lines imported a black fill.

### What the Figma file does not carry

- **Faces.** Inter, Noto Sans JP, Noto Sans TC and Noto Serif JP stand in for
  the system stacks (SF / Hiragino / PingFang). They are the stacks'
  documented fallbacks, but line breaks in the frames follow these faces,
  not any one platform's. Noto Sans JP/TC have no 600 in Figma, so 600
  renders Bold there.
- **CJK spacing.** Figma has no punctuation trimming or CJK/Latin
  autospacing; browsers that trim will set some lines slightly tighter.
- **Baselines.** Figma and Chromium place CJK glyphs in the line box with
  different vertical metrics: up to about 0.1 em (≤ 4px here), varying by face,
  size and line height. Measure vertical rhythm from frame and line boxes, not
  glyph ink.
- **Structure.** No Figma variables, text styles or components (the bridge
  cannot author them; values live in `tokens.json`, and paints are checked
  against it). Wrapped runs in mixed-language text are one layer per rendered
  line. Fixed and sticky bars are top-level layers of each frame. Frames are
  static states; there are no prototype links.
- **Forced colors.** The forced-colors frame shows Chromium's emulated system
  colors.

## Repository gates

Recorded in the PR description with exact commands and results for the final
commit (lint covers `docs/design/learning/**/*.{js,mjs}`).

## What this evidence does not prove

Following Tachiko's evidence discipline: these are browser renders of a
design harness at one Chromium build. They do not certify production
implementation, real-device rendering (iOS Safari, Android Chrome, Windows
fonts — especially Mincho fallbacks), native forced-colors/high-contrast
modes (Chromium emulation only), screen-reader output, IME behavior, text
zoom to 200%, or learner comprehension of the verdict marks (D-03). Those
belong to #838's browser acceptance and to post-launch evidence. Contrast
values are computed from token values; anti-aliasing and thin Mincho strokes
at small sizes are why Mincho is restricted to ≥ 18px.
