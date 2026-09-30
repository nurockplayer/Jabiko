# Jabiko Learning design authority — Shu-ire (朱入れ) SI-1

Status: **proposed canonical design authority** for the Jabiko Learning
(Training) redesign, submitted for independent review. Once accepted, #838
implements it; implementation must not redesign it independently. If
implementation exposes a genuinely new design choice, bring it back here as a
revision (SI-2, …) instead of improvising in code.

> The page is the learner's; the red ink is Jabiko's.

**Figma (canonical for visual presentation):**
[Jabiko Learning — Shu-ire](https://www.figma.com/design/h4XBtIaL5XYsBOxGVTHmc4/Jabiko-Learning-%E2%80%94-Shu-ire).
Its 59 frames are named `SI-1 CANDIDATE · <board> · <state> · <viewport>`
until independent review accepts SI-1 (D-01).

![Practice session after a wrong answer, 1440×900](renders/session-state-wrong-1440x900.png)

## Contents

| File | What it is |
| --- | --- |
| [DESIGN.md](DESIGN.md) | The specification: thesis, tokens and usage rules, mark system, components with state tables, every surface, localization, accessibility, implementation guidance and acceptance checklist |
| [DECISIONS.md](DECISIONS.md) | Consequential decisions (D-01 … D-21) with reasons, rejected alternatives and REVIEW-CONFIRM items |
| [AUDIT.md](AUDIT.md) | Current-product capability inventory and protected contracts the redesign must keep; why the old presentation is retired |
| [FOUNDATION-SNAPSHOT.md](FOUNDATION-SNAPSHOT.md) | Exact Tachiko authority consumed (node IDs, hash-verified exports), inherited / specialized / excluded rules |
| [tokens.json](tokens.json) | Canonical values: color roles (light + dark), contrast requirements, type roles, spacing, geometry, elevation, motion, breakpoints |
| [figma-registry.json](figma-registry.json) | The canonical Figma frames: file, pages, and per frame its node ID, name, size, layer/text/font/paint readback, visual diff and SHA-256 of source, capture, export and readback |
| [reference/](reference/) | Design harness the Figma frames are imported from: `shu-ire.css` (executable recipes), `harness.js`, and boards `cover`, `specimen`, `today`, `session`, `sets`, `learn`, `grammar`, `reference`, `talk`, `system` (states via `?state=`), plus `index.html` |
| [renders/](renders/) | 59 committed harness renders (320, 390, 1280, 1440; light, dark, forced colors, English) and, in `renders/figma/`, the 59 native Figma exports |
| [tools/](tools/) | `verify.mjs` (parity, contrast, board checks, captures), `scenes.mjs` (scene list shared by all tools), `capture.mjs`, `static-server.mjs`; `figma/` (bridge client, serializer, importer, registry writer, Figma parity check) |
| [verification/](verification/) | `report.json` (last design verification) and `figma-report.json` (last Figma parity check) |
| [VERIFICATION.md](VERIFICATION.md) | What was verified, how, results, and what design evidence does not prove |

## Authority precedence (for Jabiko Learning presentation)

1. Jabiko product and learning semantics — #810, #830/#831
   ([product boundary](../../jabiko-life-product-boundary.md)), accepted
   children, CLAUDE.md invariants (language isolation, contentGuard, layering).
2. The Tachiko foundation snapshot in FOUNDATION-SNAPSHOT.md (cross-product
   rules only).
3. SI-1 itself (D-01): `tokens.json` for values; the Figma file for visual
   presentation; DESIGN.md for rules and behavior; DECISIONS.md for
   rationale; the harness boards and renders as the import source and
   reference evidence.
4. Production implementation (#838 and follow-ups).

The design authorizes presentation changes only. It does not authorize route,
learning-behavior, data, analytics, ad-policy or localization-rule changes
(AUDIT §2); where DESIGN.md names a small domain change (navigation grouping,
retiring `doneSpot`, an additive language-source helper) that change still
goes through TDD in #838.

## Reviewing

1. Read DESIGN.md §1 (thesis), then walk the Figma file page by page (or skim
   `renders/`, or open `reference/index.html`).
2. Check the REVIEW-CONFIRM decisions in DECISIONS.md: **D-03** (one-hue
   marks, 〇 in vermilion for correct), **D-07** (feedback below marked options,
   superseding #473's DOM order), **D-14** (seasonal topic on Today).
3. Use the #832 review contract: design-authority reconciliation (reuses, does
   not duplicate Tachiko; no spreadsheet semantics), product/learning,
   accessibility, originality (all marks, layouts and icons here are original;
   the only reused art is Jabiko's own mascot).

## Reproducing

```bash
pnpm install --frozen-lockfile
node docs/design/learning/tools/verify.mjs
```

The script starts a local static server for this directory, runs every check
in Chromium via the repository's Playwright, regenerates `renders/`, and
writes `verification/report.json`. To look at a single board:

```bash
node docs/design/learning/tools/capture.mjs --out /tmp/si 'session.html?state=wrong@390x844'
```

The Figma parity check needs no Figma connection; it checks the registry,
`renders/figma/` and the harness digest:

```bash
node docs/design/learning/tools/figma/verify.mjs
```

Re-importing after a harness change uses the official bridge
(`@gethopp/figma-mcp-bridge` 0.0.22) with its plugin open in the Jabiko file.
`FIGMA_FILE_KEY` is the per-session key that `bridge.mjs list_files` reports,
not the file key in the URL:

```bash
export FIGMA_BRIDGE_DIR=<npx dir of @gethopp/figma-mcp-bridge@0.0.22> FIGMA_WORK_DIR=<scratch dir>
export HTML_FIGMA_BUNDLE=<html-figma 0.3.1 bundle, SHA-256 pinned in tools/figma/policy.mjs>
node docs/design/learning/tools/figma/serialize.mjs
FIGMA_FILE_KEY=<bridge key> node docs/design/learning/tools/figma/import.mjs --replace
node docs/design/learning/tools/figma/registry.mjs
FIGMA_FILE_KEY=<bridge key> node docs/design/learning/tools/figma/verify.mjs --live
```

Nothing under `docs/design/learning/` is imported by `src/`.
