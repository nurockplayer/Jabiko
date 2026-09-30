# Tachiko foundation snapshot consumed by Jabiko Learning (SI-1)

Status: exact adoption record required by #832 ("cite the exact Tachiko
authority it consumed"). Jabiko uses this snapshot until an explicit
reconciliation changes it; later Tachiko Sheet changes do **not** silently
mutate Jabiko.

This is a **design-authority** adoption, not a code dependency. Jabiko does not
import Tachiko CSS/React, does not use Figma layer names as runtime API, and
does not create a shared package.

## 1. Sources

| Source | Identity | Verified |
| --- | --- | --- |
| Tachiko Work design principles | `nurockplayer/tachiko-work` `docs/vision/design-principles.md` @ `233f5c5b` | read |
| Tachiko Work visual direction (non-normative) | `docs/product/visual-direction.md` @ `233f5c5b` | read |
| Tachiko Sheet authority index | `nurockplayer/tachiko-sheet` `docs/design/README.md` @ `f44ad23` | read |
| Tachiko Sheet UI quality contract | `docs/design/ui-quality-contract.md` @ `f44ad23` | read |
| Interface Profile v1 role mapping | `docs/design/interface-profile-v1-mapping.json` / `.md` @ `f44ad23` (29 roles; `border.control` amended to `#818798`, node `32:75`, #70) | read |
| #71 canonical Figma system (final receipt) | file `ouZ5nm77N0WneqAsLhzqnL`, index `22:230481`; [receipt](https://github.com/nurockplayer/tachiko-sheet/issues/71#issuecomment-5773219454) | hash-verified exports (below) |
| #71 Foundations + Components receipt | [comment 5772645390](https://github.com/nurockplayer/tachiko-sheet/issues/71#issuecomment-5772645390) | hash-verified exports (below) |

### Hash-verified native Figma exports

When SI-1 was first authored (2026-09-30) the canonical Figma file was not
connected to a qualified bridge, so the approved nodes were inspected through
their **retained native exports and readbacks** listed in the #71 final registry
(`mission-final-registry.json`, SHA-256
`84adf0658ac7adb4b37c7e575686fa8a5e88c2ddb0927cce83f8216a15975343`, matches the
receipt). Each consumed frame's PNG and readback SHA-256 were recomputed and
match the registry:

| Node | Frame | PNG SHA-256 | Readback |
| --- | --- | --- | --- |
| `21:34872` | Foundations | `1d694ed66b08b938ffee9bf4d97e05a3af6382b33a07a04f384e768dfd6cbc97` | match |
| `21:9493` | Components | `35eb277e6b077b8699fc6d7e3cb90a18fbcd15604c34a695d604cb931197f5b5` | match |
| `21:35588` | role-map | `c4d87d8441bd9644643fbfc9526e96e5934d04595b61e49fe3161b9eb79b299a` | match |
| `21:35816` | component-extension | `d40d422e3a05e033e0b7bf8254f56792c1c047fdb77fbdde9c80c1f6ed2bfbb0` | match |
| `22:63519` | states-contract | `f383fdb884e3d41effd5bf669accbb1a4b8cf89f57d49d0631f67a6960a5856b` | match |
| `22:63811` | responsive-guide | `bbfea797d0ca2063546843c13403cad4c8fe0666d362ab8c6e9e75c2938296f4` | match |
| `22:95095` | profile-roles | `bb8309dc5279c5381b2dff3cba36007607627928fe02229d153a08562256026a` | match |
| `22:113818` | profile-tachiko-controls | `38a2354485d29dbd9b005ab4a6a9ff89cf83de3e5dd9a1b8825a95a96c049121` | match |
| `22:194208` | profile-tachiko-forced | `48d92cb8830c0663302ad4391bb1eda34ae3875fc0ef8f75bc5e7dceec7cb913` | match |
| `22:230481` | design-index | `6744c14541b27591539eee9b0d51ec9723202e77ca7b9b1b62deb286cfe029cb` | match |

These exports are evidence of *approved* nodes; they are not an editable
readback of the live file.

**Live check (2026-10-01, read-only).** Through the qualified bridge
(`@gethopp/figma-mcp-bridge` 0.0.22), the connected "Tachiko Sheet — Product
Design" file shows the eight canonical pages, and node `21:36433` reads back
as "APPROVED #71 · grid-guide", matching the #71 registry. The bridge
addresses every connected file by a per-session `unsaved-…` key (#71's own
client did too), so the earlier #832 note that the connected file was
"unsaved" and therefore not canonical was a misreading of that key. Nothing
was written to the Tachiko file; Jabiko's frames live in their own file
(D-01). The hash-verified exports above remain the consumed evidence. See
[DECISIONS.md D-01](DECISIONS.md#d-01).

## 2. Inherited unchanged (cross-product)

| Tachiko rule | Source | Jabiko use |
| --- | --- | --- |
| Semantic roles, not component names, are the contract | #68, mapping.md | `tokens.json` role names |
| Visual priority follows the current task and risk | UQC §1.1 | Session surfaces drop global navigation |
| No incidental geometry shift on hover/focus/selection | UQC §1.2 | Options never move after answering (D-07) |
| State visibility outranks decoration; states are independent dimensions | UQC §1.3, §4 | Verdict ≠ system state ≠ sync state |
| Progressive disclosure hides representation, not capability; no hover-only critical info | UQC §1.5 | Menu, set switcher, margins-to-sheets |
| Transient UI preserves context and returns focus | UQC §1.7, component-extension interaction contract | Dialogs, sheets, set switcher |
| Feedback is truthful and lands near consequence; no toast-only local errors | UQC §1.8 | Marks land on options; errors inline |
| Accessibility and input modality are first-order | UQC §1.9 | §9 of DESIGN.md |
| One behavioral grammar per shared primitive | UQC §1.10 | §6 of DESIGN.md |
| Application chrome ≠ authored content | UQC §2 | UI type vs Japanese content type (D-05) |
| Borders, surfaces, radius, shadow, motion only when they do a job | UQC §6 | No card grids (D-04) |
| Protected state treatments: warning / error / success / disabled / destructive / scrim | role map "Product-owned state" | Values copied exactly (light) |
| Control geometry: 7px control radius, 10px menu radius, 1px borders | role map "Geometry and density" | Same |
| Focus: 3px ring + 2px clearance, never removed | Foundations, role map | Same geometry, Jabiko color |
| Spacing rhythm 4, 8, 12, 16, 24, 32 | role map | Same, extended (Δ) |
| Comfortable pointer controls ≥ 36px | role map | Same; touch raised to 44px (Δ) |
| Effective-width tiers 1024 / 600 / 320 | responsive-guide, FES45 | Same tiers + 1280 marginalia tier (Δ) |
| Ordinary text ≥ 4.5:1; essential controls and focus ≥ 3:1; state text/icons accompany color | role map "Responsive and accessibility intent" | Verified for every declared pair, both themes |
| Forced colors: system colors, real borders/outlines, visible labels; reduced motion requires no animation | Foundations, profile-tachiko-forced | Same |
| Main work regions flat; only transient layers elevated | role map "Surface and state contract" | Same |
| Tabular numerals for numeric data | role map "Typography" | Counts, progress, timers |
| Local/system fonts only; explicit local CJK faces; no distributed fonts | FES45, #838 | Same (system stacks) |
| Evidence labels; design evidence ≠ runtime/AT/device proof | UQC §8–9, authority README | VERIFICATION.md limits |

## 3. Specialized (same role, Jabiko value or scale) — Δ

| Role / rule | Tachiko | Jabiko SI-1 | Why |
| --- | --- | --- | --- |
| `surface.chrome` | `#F8F8FC` (cool porcelain) | `#F6F5F2` | Neutral paper; Jabiko must not look like Sheet |
| `surface.inset` | `#F5F6F9` | `#EFEEEA` | Same |
| `text.primary` / `.secondary` | `#252735` / `#646879` | `#1D1C1A` / `#5F5C57` | Sumi ink, no blue cast |
| `border.subtle` / `.control` | `#DFE2EA` / `#818798` | `#E3E1DB` / `#8C877E` | Neutral; control still ≥ 3:1 |
| `action.primary.*` | violet `#6350D2` | ink `#1D1C1A` | Commands are ink; color is reserved for meaning (D-02) |
| `focus.ring`, `text.link` | violet `#6551CE` / `#5542B5` | ai `#2456B0` | Learner's hand (D-02) |
| Type ramp | data 14/20, title 18/24, label 12/20, meta 11/16 | body 15/24, title 17/24, label 14/20, meta 12/16 + Japanese content roles | Reading product, not dense grid (D-05) |
| Touch targets | ≥ 32/36px commands | ≥ 44px on touch/compact; answers ≥ 56px | #832/#838 touch-safe requirement |
| Spacing | 4…32 | + 48, 64, 96 | Editorial page rhythm |
| Color scheme | light only (`InterfaceProfileV1.colorScheme: "light"`) | light + dark | Jabiko already ships a persisted dark theme |

## 4. Jabiko-only extensions — Δ

`text.tertiary`, `border.strong`, `surface.raised`, `action.secondary.*`,
`learner.mark`, `learner.markForeground`, `learner.tint`, `mark.ink`,
`mark.tint`; verdict marks (〇 × △ dashed-〇 花丸); Japanese content type roles
(`ja.headword`, `ja.prompt`, `ja.option`, `ja.body`, `ja.ruby`); the
text-column + marginalia layout; session surfaces; the answer-sheet option
grammar.

## 5. Not inherited (spreadsheet-only)

Grid lattice and row/column headers (`grid.*`), cell selection/active cell/edit
affordances (`selection.row/header/active.*`), formula/reference color
(`text.reference`), sheet tabs and View inventory, workbook
current/saved/stale presentation, spreadsheet command grouping and ribbon,
report canvas, Sheet profile selector placement, 28px row pitch and the
164px non-grid chrome budget. The Jabiko kana/kanji **lattice** is a genkō
(manuscript-paper) table of characters, not a spreadsheet grid: it has no
selection model, headers, editing or cell addressing.
