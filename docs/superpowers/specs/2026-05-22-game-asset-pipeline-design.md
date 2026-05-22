# Game Asset Pipeline Design

## Purpose

Define how Jabiko should use agent-sprite-forge for the game-like training room direction without changing the core web architecture. The goal is to add memorable 2D game visuals to the practice loop while keeping grammar logic, answer validation, scoring, and weak-item review in React and TypeScript.

This document extends:

- `2026-05-22-game-training-loop-design.md`
- `2026-05-22-night-training-room-style-design.md`

## Decision

Use agent-sprite-forge as an asset production pipeline, not as the application runtime.

Jabiko remains:

- Vite
- React
- TypeScript
- Vitest
- LocalStorage

agent-sprite-forge contributes:

- Character and companion sprites.
- Boss round images.
- Correct, incorrect, combo, and recovery effects.
- Badges and result icons.
- Optional non-interactive training room background art.

It should not own:

- Japanese conjugation logic.
- Question generation.
- Answer normalization.
- Score, combo, or weak-item logic.
- Routing, forms, keyboard handling, or UI state.

## Recommended Style

Use `clean_hd` or `pixel_inspired`.

Reasons:

- Jabiko is text-heavy, so Japanese prompts and Traditional Chinese explanations must stay crisp.
- Strong retro pixel art can make the UI feel playful, but it may compete with kana and kanji readability.
- A clean game-asset style fits the existing night training room direction without requiring a full game engine.

Avoid:

- Dense backgrounds behind text.
- Large animated sprites that distract from the question.
- Assets with embedded text, labels, or UI copy.
- One-note purple, dark blue, or orange-heavy palettes that flatten the visual hierarchy.

## Asset Pack V1

### Training Companion

Purpose: make the practice loop feel guided and alive.

Deliverables:

- `companion-idle`
- `companion-correct`
- `companion-incorrect`
- `companion-encourage`

Use `$generate2dsprite` with:

- `asset_type`: `character` or `npc`
- `view`: `3/4`
- `art_style`: `clean_hd` or `pixel_inspired`
- `bundle`: `unit_bundle`

First implementation can use static transparent PNGs. Animation is optional.

### Boss Round Images

Purpose: make weak-form review feel like a special challenge.

Deliverables:

- `boss-te-form`
- `boss-nai-form`
- `boss-plain-form`

Use `$generate2dsprite` with:

- `asset_type`: `creature` or `character`
- `action`: `idle`
- `view`: `3/4`
- `sheet`: `single` or `2x2`
- `art_style`: `clean_hd` or `pixel_inspired`

Each boss should be visual only. The grammar identity must come from UI text, not embedded text inside the image.

### Feedback Effects

Purpose: add game rhythm to answer feedback without hiding the explanation.

Deliverables:

- `fx-correct-hit`
- `fx-combo`
- `fx-incorrect-break`
- `fx-recovery`

Use `$generate2dsprite` with:

- `asset_type`: `fx` or `impact`
- `action`: `impact`
- `view`: `side` or `3/4`
- `bundle`: `single_asset` or small animation sheet

Effects must stay small and should render near status indicators, not over the answer correction area.

### Result Badges

Purpose: make end-of-round results easier to scan.

Deliverables:

- `badge-best-combo`
- `badge-weakness-review`
- `badge-boss-clear`
- `badge-accuracy`

Use `$generate2dsprite` with:

- `asset_type`: `prop`
- `action`: `single`
- `art_style`: `clean_hd` or `pixel_inspired`

Badges should not include text. Labels remain real UI text for localization and accessibility.

### Training Room Background

Purpose: support the night training room mood without turning Jabiko into a map game.

Use `$generate2dmap` only if the UI needs a distinct scene image. Initial mode should be:

- `map_mode`: `baked_scene_mode`
- `visual_model`: `baked_raster`
- `runtime_object_model`: `none`
- `collision_model`: `none`
- `engine_target`: `project-native`

Do not create playable collision, walkable maps, scene hooks, or route maps in V1. Jabiko's first screen remains a practice interface, not an exploration game.

## File Organization

Accepted app assets should live under:

- `src/assets/game/companion/`
- `src/assets/game/bosses/`
- `src/assets/game/fx/`
- `src/assets/game/badges/`
- `src/assets/game/backgrounds/`

Raw generation artifacts and prompt records should live under:

- `docs/superpowers/assets/agent-sprite-forge/<date>-<asset-pack>/`

Each accepted generated asset should keep:

- Final optimized PNG or WebP used by the app.
- Prompt text.
- Pipeline metadata when available.
- Source sheet or raw image when it is needed for future regeneration.

Do not commit large rejected generations. Keep only accepted assets and useful provenance.

## Naming

Use lowercase kebab-case file names:

- `companion-idle.png`
- `companion-correct.png`
- `boss-te-form.png`
- `fx-combo.png`
- `badge-best-combo.png`

If animation sheets are used:

- `companion-idle-sheet.png`
- `companion-idle.gif`
- `companion-idle-meta.json`

## Runtime Integration

React should import accepted assets directly or through a small asset manifest.

Recommended first-pass integration:

- Static PNG/WebP for companion states.
- CSS transitions for showing correct, incorrect, and combo states.
- Small GIF or CSS sprite animation only where it improves feedback.
- Decorative assets marked as decorative for accessibility.
- Meaningful labels kept as real localized UI text.

Avoid adding a runtime animation engine in V1. CSS and normal image rendering are enough.

## Accessibility And Learning Constraints

- Assets must not replace textual correction.
- Wrong answers still show the accepted answer and rule explanation.
- Game art must not overlap Japanese prompts or answer controls.
- Motion should be subtle enough not to distract from reading.
- The app should remain usable if images fail to load.
- UI labels remain Traditional Chinese; Japanese remains for prompts, answers, examples, and grammar names.

## Performance Constraints

- Keep V1 asset count small.
- Prefer optimized PNG or WebP for static assets.
- Avoid large full-screen animated GIFs.
- Lazy-load boss or result assets if they are not visible on first paint.
- Do not add runtime dependencies unless a later implementation plan proves CSS/image rendering is insufficient.

## Implementation Order

1. Generate and review one small visual direction sample.
2. Generate the companion static state set.
3. Generate feedback effects and badges.
4. Generate boss images for the first boss round forms.
5. Add an asset manifest and import assets into the React UI.
6. Add CSS states for companion, feedback, and badges.
7. Add tests only for UI state selection and manifest references, not for visual art quality.
8. Verify desktop and mobile layouts in the browser.

## Success Criteria

- Jabiko gains a clear game-like visual identity without changing runtime architecture.
- The first practice screen remains usable and text-first.
- Assets support combo, correction, boss review, and results without hiding explanations.
- No new runtime dependency is required for V1.
- Generated assets have prompt/provenance records.
- Mobile and desktop layouts do not overlap or clip text.
