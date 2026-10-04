# Tachiko foundation consumed by Jabiko JT-1

Status: exact adoption record (#850, carrying forward the #832 requirement to
"cite the exact Tachiko authority it consumed"). Jabiko uses this snapshot
until an explicit reconciliation changes it; later Tachiko Sheet changes do
**not** silently move Jabiko. `tools/verify.mjs` holds `tokens.json` to the
values in §2 (`tachikoParity`).

This is a **design-authority** adoption, not a code dependency: Jabiko does not
import Tachiko CSS/React, does not use Figma layer names as runtime API, and
does not create a shared package.

## 1. Sources

| Source | Identity | How it was consumed |
| --- | --- | --- |
| Tachiko Sheet design authority index | `nurockplayer/tachiko-sheet` `docs/design/README.md` @ `0e6a052` | read |
| UI quality contract (UQC) | `docs/design/ui-quality-contract.md` @ `0e6a052` | read; rules cited by § below |
| Interface Profile v1 role mapping | `docs/design/interface-profile-v1-mapping.json` / `.md` @ `0e6a052` (29 roles) | values copied for the roles in §2 |
| `border.control` amendment | Figma node `32:75`, #70 [PASS receipt](https://github.com/nurockplayer/tachiko-sheet/issues/70#issuecomment-5799633002) — `#818798` | value copied |
| #71 canonical Figma system | file `ouZ5nm77N0WneqAsLhzqnL`, index `22:230481`; [final receipt](https://github.com/nurockplayer/tachiko-sheet/issues/71#issuecomment-5773219454) | native exports inspected (below) |
| #71 Foundations | node `21:34872` (Foundations), `21:35588` (role map), `21:9493` (Components), `21:35816` (task controls / interaction contract) | native exports inspected |
| #71 responsive / states | `22:63811` (responsive guide), `22:63519` (states contract) | native exports inspected |
| #69 Phase A profiles | `22:95095` (profile roles), `22:95494` (profile home), `22:194208` (forced colors); [receipt](https://github.com/nurockplayer/tachiko-sheet/issues/69#issuecomment-5773208632) | native exports inspected |

The canonical Tachiko file was not written to. Its approved nodes were
inspected through the native exports and readbacks retained by #71
(`/Users/tachikoma/.codex/artifacts/tachiko-sheet-71/resume-20260922`,
registry `mission-final-registry.json`, SHA-256
`84adf0658ac7adb4b37c7e575686fa8a5e88c2ddb0927cce83f8216a15975343` as in the
receipt). The hash verification of those exports performed for PR #849
(`FOUNDATION-SNAPSHOT.md` there) still applies; nothing in the Tachiko
authority changed between 2026-09-30 and this adoption.

**Which Tachiko profile.** Of the three built-in Interface Profiles (#69),
Jabiko adopts the values of the **Tachiko** profile (the product default), not
Familiar Spreadsheet or Minimal-Focus. Profile *selection* (the Appearance
popover) is a Sheet feature and is not inherited (§5).

## 2. Inherited unchanged — values

| Jabiko role (`tokens.json`) | Tachiko role | Value |
| --- | --- | --- |
| `surface.app` | `surface.app` | `#FFFFFF` |
| `surface.chrome` | `surface.chrome` | `#F8F8FC` |
| `surface.chrome.tint` | `surface.chrome.tint` | `#F0EDFD` |
| `surface.content` | `surface.content` | `#FFFFFF` |
| `surface.inset` | `surface.inset` | `#F5F6F9` |
| `surface.sunken` | Foundations `surface/header` | `#ECEEF4` |
| `text.primary` | `text.primary` | `#252735` |
| `text.secondary` | `text.secondary` | `#646879` |
| `text.onTint` | `text.onTint` | `#5B6072` |
| `text.disabled` | Foundations `text/disabled` (protected) | `#9094A1` |
| `text.link` | `text.link` | `#5542B5` |
| `border.subtle` | `border.subtle` | `#DFE2EA` |
| `border.control` | `border.control` (node `32:75`) | `#818798` |
| `action.primary.background` / `.hover` / `.pressed` / `.foreground` | same | `#6350D2` / `#5541C2` / `#4936AB` / `#FFFFFF` |
| `accent.foreground` / `accent.background` | same | `#5542B5` / `#F0EDFD` |
| `selection.edge` | `selection.active.border` (used for *selected item* edges only, never cells) | `#6551CE` |
| `focus.ring` | `focus.ring` | `#6551CE` |
| `status.warning.*`, `status.error.*`, `status.success.*` | Foundations protected state treatments | `#865015`/`#FFF3DD`, `#A02D42`/`#FFF0F3`, `#206C4E`/`#E9F6F0` |
| `inverse.background` / `.foreground` | Components tooltip specimen | `#252735` / `#FFFFFF` |
| `scrim` | protected modal scrim | `#252735` (Jabiko opacity 0.32) |

Roles from the 29-role map that Jabiko does **not** consume: `grid.canvas`,
`grid.line.horizontal`, `grid.line.vertical`, `grid.header.background`,
`grid.header.foreground`, `selection.row.background`,
`selection.header.background`, `selection.header.foreground`,
`selection.active.background`, `text.reference` (spreadsheet-only, §5).

## 3. Inherited unchanged — rules

| Tachiko rule | Source | How Jabiko applies it |
| --- | --- | --- |
| Semantic roles, not component names, are the contract | #68, mapping.md | `tokens.json` role names; recipes in `reference/jabiko.css` are private |
| Visual priority follows the current task and risk | UQC §1.1 | Session surfaces replace global navigation; Today leads with the start action; World leads with the current moment |
| No incidental geometry shift | UQC §1.2 | Options and Next never move after answering (D-07, checked by `verify.mjs` geometry) |
| State visibility outranks decoration; states are independent | UQC §1.3, §4 | Assessment ≠ system state ≠ sync state; Small Talk dimensions independent |
| Progressive disclosure hides representation, not capability | UQC §1.5 | Every capability mapped in CAPABILITIES.md with its compact entry |
| Transient UI preserves context and returns focus | UQC §1.7; task controls `21:35816` | Dialogs, sheets, switcher, menus |
| Feedback is truthful and lands near consequence | UQC §1.8 | Marks on the judged option; errors inline with recovery |
| Accessibility and input modality are first-order | UQC §1.9 | DESIGN.md §9 |
| One behavioral grammar per shared primitive | UQC §1.10 | DESIGN.md §6 |
| Application chrome ≠ authored content | UQC §2 | Chrome type vs Japanese content type (D-05) |
| Borders, surfaces, radius, shadow, motion only when they do a job | UQC §6 | No card grids (D-04); flat main regions; overlays only elevated |
| Labels above fields; error adjacent; menus arrow/Enter/Escape; modal focus contained; busy suppresses repeat; unknown never offers blind retry | task controls `21:35816` interaction contract | Same |
| Control geometry: 7px control radius, 10px overlay radius, 1px borders | role map "Geometry and density" | Same |
| Focus: 3px ring + 2px clearance, never removed | Foundations `21:34872` | Same; inset inside bars, rows, lattices |
| Spacing rhythm 4, 8, 12, 16, 24, 32 | Foundations | Same, extended (§4) |
| Comfortable density: 36px pointer controls; data 14/20, labels 12/20 | profile-roles "Finite recipe" | Jabiko is comfortable density; chrome type unchanged |
| Effective-width tiers 1024 / 600 / 320 | responsive guide `22:63811` | Same three tiers |
| Ordinary text ≥ 4.5:1; essential boundaries and focus ≥ 3:1; state text/icon accompanies color | role map "Responsive and accessibility intent" | 60 declared pairs verified in both themes |
| Forced colors: system colors, real borders/outlines, visible labels; reduced motion requires no animation | Foundations, `22:194208` | Same (`renders/*-forced-*`) |
| Main work regions flat; only transient layers elevated | role map "Surface and state contract" | Same |
| Tabular numerals for numeric data | role map "Typography" | Counts, progress, readouts, timers |
| Local/system fonts only; explicit local CJK faces; nothing downloaded | profile "system-local" typography; FES45 | Same (system stacks; Figma uses Inter/Noto stand-ins) |
| Evidence labels; design evidence ≠ runtime/AT/device proof | UQC §8–9, README "What design authority does not prove" | VERIFICATION.md limits |

## 4. Specialized or extended by Jabiko (Δ) — each justified in DECISIONS.md

| Area | Tachiko | Jabiko JT-1 | Decision |
| --- | --- | --- | --- |
| Meta text | 11/16 | 12/16 floor for CJK legibility | D-05 |
| Touch targets | 32/36px commands | 44px when coarse pointer or < 600px; answer options ≥ 56px | D-06 |
| Spacing | 4…32 | + 48, 64 (page/section rhythm of a reading product) | D-06 |
| Color scheme | light only (`colorScheme: "light"`) | light + dark (existing persisted `jabiko.theme`) | D-12 |
| Learning verdicts | — | `assess.correct` / `assess.miss` / `assess.partial` + glyphs | D-03 |
| Japanese content type | — | `ja.prompt`, `ja.headword`, `ja.option`, `ja.line`, `ja.body`, `ja.ruby`, `read.body` | D-05 |
| Navigation presentation | ViewTab state grammar (selected = accent ink + 2px underline) | same grammar on cross-route links; bottom tab bar below 1024 | D-08 |
| Layout | Sheet shell (header + grid + Views + status) | column ≤ 720 + 320 aside; single column below 1024 | D-16 |

## 5. Not inherited (spreadsheet-only)

Grid lattice and row/column headers; cell selection, active cell, editing
affordances and the 28px row pitch; formula/reference color; sheet tabs and the
View inventory; workbook current/saved/stale/dirty presentation and the
SaveIndicator; spreadsheet command grouping and ribbon; report canvas; the
Appearance/Interface Profile selector and its placement; the 164px non-grid
chrome budget. The Jabiko kana/kanji **lattice** is a dictionary of characters
on manuscript-paper rules, not a spreadsheet grid: choosing a character to
read its detail (an existing capability) is kept; there are no headers,
ranges, editing or cell addressing.
The Tachiko brand sprout and brand purple/orange are Tachiko's identity and are
not used; Jabiko's identity is its own mascot (D-10).
