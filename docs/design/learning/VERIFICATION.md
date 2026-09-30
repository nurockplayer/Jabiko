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
| — D-07 fold | wrong answer at 390×844: verdict line bottom 647px above sticky actions top 775px | pass |
| Review renders | 58 PNGs incl. dark, forced colors (emulated), English | generated |

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
