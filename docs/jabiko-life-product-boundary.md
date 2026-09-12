# Jabiko Life product boundary

Status: fixed product boundary for Issue #831. `Jabiko Life` is a working
codename, not permanent branding or a public identifier.

This document records the boundary between Jabiko Learning and the future
conversation-driven game product. It does not redefine the conversation
curriculum in [`conversation-learning-model.md`](conversation-learning-model.md)
or Issues #811–#819.

The Issue #832 design prototype and visual-language handoff are documented in
[`design/world-training/README.md`](design/world-training/README.md).

## Fixed decisions

### Two products first

The initial product shape has two separately accessible products:

```text
Jabiko Learning                         Jabiko Life
JLPT / grammar / vocabulary /           conversation-driven
reading / conjugation practice          everyday-life game
              \                         /
               explicit cross-links
```

- Jabiko Learning keeps its existing direct entry and routes.
- Jabiko Life gets a separate explicit entry and bounded top-level context.
- Each product must provide an explicit route to the other.
- The game must not become `/` or the main entry incidentally.

### Small Talk drives the world

Conversation capability is the progression mechanic. Locations, recurring
NPCs, relationships, topics, and situations open when the player performs the
conversation jobs owned by the #810 kernel and exercised by #812–#815. World
framing, location/NPC/relationship state, unlocks, and transitions belong to
the game world; they must not become a competing conversation taxonomy,
feedback rubric, or dialogue runtime.

### Existing practice remains available training

JLPT, grammar, vocabulary, reading, and verb-conjugation practice remain
first-class capabilities. Jabiko Life may expose them as optional contextual
training facilities, recommendations, or drills, reusing their existing
content and runtime contracts rather than forking or rewriting them. Direct
practice must remain reachable for returning learners.

### Visual replacement and protected contracts

Future work may replace Jabiko's current visual system and page composition
completely. That permission does not authorize incidental changes to:

- existing behavioral and runtime contracts;
- learning or content meaning;
- existing routes and deep-link behavior unless separately scoped;
- localization visibility and fallback rules;
- accessibility requirements;
- authentication, account, progress, and data contracts;
- analytics and privacy boundaries.

## Future main-entry promotion gate

Making Jabiko Life the default entry is a separate future decision. It may be
considered only after a playable world and contextual training bridge provide
evidence covering all of these families:

- gameplay comprehension and completion;
- conversation retry and reuse behavior;
- learning transfer and access to training;
- direct-practice discoverability for returning users;
- mobile, keyboard, and accessibility quality;
- performance and lazy-loading behavior;
- account and progress continuity;
- user evidence that the game is a better default entry;
- a simple rollback to the Learning entry.

This document does not authorize a root-route change and does not justify
creating a `/` promotion ticket now. A promotion implementation requires its
own explicit decision after the evidence exists.

## Source-of-truth and implementation boundaries

- **#810 conversation-learning kernel:** conversation curriculum, scenarios,
  feedback, session behavior, and seasonal talk; children #811–#819 retain
  their existing ownership.
- **Jabiko Life game world:** world framing, locations, NPCs, relationships,
  unlocks, and transitions into contextual training.
- **Tachiko Work:** optional authoring, validation, diff, and review source;
  it is not a required Jabiko runtime service.
- **Content artifact:** Jabiko consumes one deterministic, versioned,
  validated content pack; authored meaning has one runtime authority rather
  than parallel Web/Godot/Tachiko owners.
- **Hosts:** React/Web is the first validation host. Godot is deferred to a
  later host or adapter proof after the Web loop is proven.
- **Progress:** Supabase may own authorized player/account progress later;
  it does not own authored content truth, and no persistence work is implied
  here.

## Deferred implementation

This boundary does not authorize route or UI implementation, a visual
language, world/NPC schemas, content batches, a Tachiko Work or Godot adapter,
Supabase schemas, a root-route switch, or a broad roadmap rewrite. Those are
separate scoped decisions and implementation tasks. The codename must not be
used as permanent brand, route, package, analytics, or public API naming
without a separate naming decision.
