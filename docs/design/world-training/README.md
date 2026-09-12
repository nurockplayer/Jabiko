# World + Training visual language

Status: repository-local, non-production design prototype for Issue #832. It is not a route, runtime contract, asset pipeline, or final art direction.

## Review the prototype

Open [`index.html`](./index.html) as a local file. The authoring toolbar is deliberately outside the learner flow and exposes six screens plus explicit continuity states. The screen controls demonstrate this path:

```text
Entry -> World / Today -> Conversation -> Feedback / Replay
                         |                  |
                         +-> Training handoff -> Training home -> exact scene return
```

`capture.mjs` uses the existing `@playwright/test` Chromium dependency to create the 12 required screenshots listed in [`captures/README.md`](./captures/README.md). No server, external font, asset, service, or dependency is needed. Run it from the repository root with `pnpm exec node docs/design/world-training/capture.mjs` (or with the pinned pnpm 10.33 executable in the integration runtime). It starts with `file://`, hides the author toolbar in capture mode, waits for learner headings, rejects page errors, checks each 390x844 and 1440x900 viewport for overflow and unnamed controls, and exercises keyboard navigation, response feedback, support, and handoff return. The manifest is written as `success` only after all checks pass; otherwise it remains `failed` with the captured reason.

## Direction and family rules

WORLD is scene-first: a small everyday environment carries the visual weight, while a relationship, conversational intent, and one clear next action sit beside it. Chrome is quiet and recedes during the scene. Progress is shown as places, people, topics, and opportunities, never as an economy.

TRAINING is purposeful and direct: a calm facility with immediate JLPT, grammar, vocabulary, reading, and conjugation entry points. It shares paper, moss, coral, and warm yellow accents with WORLD, but uses a clearer tile grid and less environmental illustration. It is an optional place to improve, not a punishment loop.

The prototype intentionally removes persistent HUD bars, currencies, energy, inventory, equipment, minimaps, task cards, notebook/scene/task-panel compositions, bottom navigation, fantasy combat framing, and copied source artwork. Shapes are original CSS environment studies only.

## Typography and hierarchy

- Japanese dialogue uses a readable Mincho-style fallback (`Georgia`, then platform Japanese serif); headings are calm and editorial, never decorative display lettering.
- zh-Hant and English UI use platform sans-serif fallbacks for compact labels and controls. Japanese-learning copy remains original; English is only supporting context.
- Scene hierarchy: environment → partner/relationship → Japanese line → intentful response → optional support.
- Guidance is short and action-oriented. Feedback keeps `Understandable`, `Correct`, `Natural`, `Continuation`, and `Register` visibly independent. `Answer`/`Add`/`Ask` are response-shape evidence only.
- Navigation is a small top-level product switch. Training tiles are direct destinations, not missions.

## Composition and responsive rules

Use an 8px rhythm with generous 18–25px surface radii, 38px desktop page gutters, and 18px mobile gutters. Desktop may pair a scene with a relationship/response column; mobile collapses to scene, dialogue, action, then support in reading order. Touch targets remain at least 44px in future implementation. The prototype is checked at 390x844 and 1440x900; implementation must also test intermediate widths.

WORLD backgrounds, people, and context are the primary assets. TRAINING uses small symbolic marks and one contextual tile. Future character, environment, and icon assets must be original or properly licensed; this prototype freezes neither an asset pipeline nor CSS/game-engine architecture.

## Accessibility and support

Semantic headings, buttons, links, labels, status banners, and reading order are present in the prototype. Focus is visible with a non-color outline; selected controls use text/weight/border as well as color. Success, next-step, warning, loading, error, and offline states use icons, labels, and copy, not color alone. `prefers-reduced-motion: reduce` removes transitions/animation while preserving the complete interaction. No learner information depends on hover.

Furigana belongs immediately above or beside a Japanese line without shrinking the main line below legibility. Audio is a labeled optional control next to the line. Translation, paraphrase, and explanation appear on request or in the feedback record, preserving scene focus. A future implementation must keep support dismissible and keyboard reachable.

## Explicit prototype states

The authoring toolbar selects returning learner, unfinished conversation, completed day, no seasonal item, loading, error, and offline. The rendered banner states what is known and what is unavailable. It makes no login, persistence, network-AI, or cross-device claim. The completed-day and no-seasonal states intentionally avoid inventing rewards or seasonal content.

## Reference-evidence limitation and review gates

The Issue snapshot available for this work did not include the user concept reference images. This artifact therefore relies only on the explicitly listed abstract principles and prohibited motifs in Issues #830/#832. It does not claim screenshot comparison, pixel distance, or clearance of originality.

Independent product-flow, originality/reference-distance, accessibility, and learning-design reviews remain **PENDING**. Those reviews must happen on the frozen captures and exact implementation revision before any production child Issue uses this direction.

## Later implementation handoff

Future bounded Issues may use the six surfaces, state selector copy, responsive composition, and feedback hierarchy as design evidence. They must separately define route ownership, world/content contracts, persistence behavior, localization overlays, asset provenance, and runtime accessibility tests. Do not infer a production route, schema, animation engine, art commission, audio pipeline, or main-entry promotion from this prototype.
