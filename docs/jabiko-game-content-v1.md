# Jabiko game content v1

Status: #837 architecture contract. This document defines the authored-to-runtime boundary for the first Jabiko game world. It is not a production loader, compiler, migration, or content release. The example is design evidence, not #835 production content acceptance.

## Runtime contract

A game client consumes one closed envelope:

```ts
import type { GameWorldDefinition } from "../src/domain/gameWorld";

interface JabikoGameContentEnvelopeV1 {
  profile: "jabiko-game-content/v1";
  world: GameWorldDefinition;
}
```

The envelope contains exactly `profile` and `world`. `world.id` is the stable content-set identity. `GameWorldDefinition` remains the only world model: it already contains locations, NPCs, relationship stages, moments, the new-game seed, and each moment's existing conversation session definition. Do not add a second scenario, dialogue, feedback, or progression model around it.

The runtime meaning is the JSON-compatible value of that envelope. For the first Web delivery, the repository-owned TypeScript definitions may be assembled and validated as a TypeScript object in one lazy application resource; a standalone JSON file is not required. Bounded profile and shape tests plus the existing semantic validators protect this trusted in-repository materialization. No generalized compiler or raw-JSON loader is required before #834/#835. If a future host or producer supplies untrusted raw JSON, decode it against the exact v1 shape before calling typed validators. All hosts consume the same logical envelope and must not read authoring helpers or an alternate source of gameplay meaning.

Only the exact profile string `jabiko-game-content/v1` is supported by this contract. A client or admission step that sees a different profile must reject the world explicitly before gameplay starts. Do not guess, coerce, or partially load a profile it does not understand. A future incompatible contract requires an explicit profile revision.

## What belongs in the pack

The pack contains authored world meaning and its references:

- `GameLocation`, `NpcProfile`, and `RelationshipStage` records;
- `WorldMoment` encounters, objectives, availability, outcomes, unlocks, and relationship updates;
- stable IDs and the exact references between those records;
- `sessionDefinitions`, each of which embeds the existing `ConversationScenario` and its `ConversationSessionResponseBinding[]` curated feedback;
- `initialState`, as an authored seed for a new game only;
- `entryMomentIds`.

Use the existing contracts in `conversationScenario.ts`, `conversationFeedback.ts`, `conversationSession.ts`, and `gameWorld.ts`. Preserve their fields and meanings. In particular, the session definition carries the scenario's steps and the curated response-to-branch-to-feedback bindings. World moments refer to its scenario by stable ID. Do not copy Japanese dialogue or feedback rules into a world-specific shape.

The pack excludes a live `ConversationSessionState`, replies entered by a learner, feedback generated during a session, account identity, saved progress, analytics events, or other player-specific state. `initialState` is the same deterministic starting seed for a new game; persistence later belongs to a separate player-state boundary. Do not add arbitrary scripts, provider prompts, Godot nodes, React state, CSS values, or executable expressions.

IDs are opaque, exact strings. Preserve Unicode code points as authored; do not trim, case-fold, normalize, transliterate, or regenerate IDs during serialization. References remain scoped as declared by the source types: for example, a feedback binding is identified by `(scenarioId, stepId, responseExampleId)`, and a conditional outcome reference by `(momentId, outcomeId)`. Do not flatten a scoped tuple into a new global ID or assume a leaf ID is globally unique.

Array order is authored data. Preserve it for locations, NPCs, relationship stages, session definitions, moments, entries, steps, branches, bindings, unlock lists, and outcomes. Do not sort arrays to make output appear deterministic. An array reorder is a content change and must appear in the artifact diff.

## Encoding, identity, and provenance

For equal admitted envelope values, canonical bytes and the detached artifact digest must be equal. Use RFC 8785 JSON Canonicalization Scheme for JSON primitive and number serialization, which sorts object keys in raw UTF-16 code-unit order. Preserve all array order and string values exactly as authored; do not apply Unicode normalization. Encode the compact canonical JSON as UTF-8 and emit neither a byte-order mark nor a trailing newline. Reject non-JSON values; do not invent string or ID normalization.

Compute SHA-256 over those canonical envelope bytes. Record the digest outside the envelope (for example, `sha256:<64 lowercase hex characters>` in build provenance). Do not put a digest inside the bytes it hashes. `world.id` identifies the content set; the digest identifies its exact canonical runtime meaning. A content edit can keep the same world ID while producing a new digest.

Keep provenance detached from gameplay meaning. A sidecar may record the declared source-input digest, optional source revision, generator/projection profile, validation profile, and canonical envelope digest. The source-input digest is calculated over the declared repository-relative input paths in stable path order and their exact bytes. These fields help reproduce and audit a build; the runtime must not branch on them. Git history, filesystem paths outside the declared repo-relative inputs, build host, wall clock, model/provider, Tachiko internal IDs, and operator identity are not gameplay data.

Formatting or source-comment changes may change source provenance while leaving canonical envelope bytes and the artifact digest unchanged. A gameplay meaning change must change the canonical bytes and digest. Generated runtime output is derived and replaceable: do not hand-edit it. Regeneration from the authoritative source followed by a byte comparison is the drift guard; changing a digest to bless a manual output edit does not satisfy that guard.

## Admission and failure behavior

Before execution, admit the entire envelope in this order:

1. For the repository-owned TypeScript materialization, enforce the exact v1 profile and declared field shape with TypeScript types and bounded profile/shape tests. Validate required IDs, enum values, and object/array structure, and assert that no included scenario has a non-empty `seasonalAssociation`. Reject unknown fields such as `script`, `rewardCoins`, or an undeclared resource/chunk. TypeScript types alone do not decode untrusted JSON; any future external raw-JSON input must first pass a strict decoder for the v1 envelope and nested source types.
2. Run `validateConversationSessionDefinitions` over **every** entry in `world.sessionDefinitions`, including definitions not currently referenced by a moment. This checks scenario graph and curated-response binding contracts for the full admitted catalog.
3. Run `validateGameWorld(world)` for world IDs, reference closure, stages, transition rules, finite reachability, and the authored initial state.
4. Visit every `ConversationLearnerText` in the admitted world and sessions. Require non-empty `textZh` and non-empty `textI18n.en` and `textI18n.ja`. These are the source plus the launched non-source locales for this boundary. Do not rely on `pickLocalized` fallback to satisfy pack completeness.
5. Materialize the resource only if every prior check succeeds.

The existing exported validators accept typed TypeScript values; they are not untrusted-JSON decoders. `validateGameWorld` currently asks the session validator to inspect the subset of definitions bound to moments, so the explicit all-definitions call above is necessary. The current typed validators do not enforce exact object keys, runtime enum decoding, or launched-locale completeness; bounded v1 shape/profile tests and the admission locale check cover those requirements for the repository-owned materialization. A future untrusted JSON input must be strictly decoded first and then checked by these existing semantic validators.

Any malformed structure, unsupported profile, duplicate or missing ID, unresolved reference, invalid graph/transition, or missing required locale rejects the whole world before it runs. Do not silently drop invalid records or start a partial world. The Learning product remains reachable when game content is rejected; content failure must not block the non-game application.

## Responsibility matrix

| Concern | Authority | v1 admission responsibility |
| --- | --- | --- |
| Scenario, dialogue, relationship context, length class, canonical skills, finite steps, and optional event association | #812 and `conversation-learning-model.md` | Decode the declared `ConversationScenario`; validate every session definition. Skills remain the 14 canonical IDs; `answer`, `add`, and `ask` are feedback composition features, not skills. |
| Curated response meaning and continuation/register judgments | #813 and `conversationFeedback.ts` | Preserve curated bindings and validate them through the existing session validator. Do not infer new grades from learner free text. |
| Session progression and retry behavior | #814 and `conversationSession.ts` | Reuse the existing session definition/runtime contract; authored steps are finite. Player session state is created at runtime, not packed. |
| Location, NPC, relationship, world-moment, unlock, seed, and transition meaning | #833 and `gameWorld.ts` | Decode the exact `GameWorldDefinition`, validate all sessions, then run `validateGameWorld`. |
| Localized learner-facing content | Current locale contract and `ConversationLearnerText` | Enforce `textZh` plus non-empty English and Japanese overlays at pack admission. Keep existing locale visibility and fallback behavior unchanged. |
| Seasonal event identity and lifecycle | #816/#817 | No v1 record in this profile has a non-empty seasonal association. Rainy Monday is ordinary weather. Any future association needs an explicit contract extension with closed event-reference resolution; never admit an unresolved event ID. |
| Exact envelope fields, profile support, and canonical bytes | This contract; consumer owns its boundary decoder | Reject undeclared data and unsupported versions before invoking typed semantic validators. |
| Optional portrait or location presentation media | Web or later host | Resolve a host-owned optional mapping by stable NPC/location ID. Missing optional media uses a neutral fallback and does not invalidate the world. No media binary is required in the pack. |
| Optional future content producer | A future bounded adapter, possibly Tachiko Work | Emit the same admitted envelope meaning. It may not extend fields or redefine consumer semantics. Work is not required for authoring, build, test, or runtime. |

These owners are not interchangeable. A validator does not own a rule merely because it can inspect related data. In particular, a generic authoring tool may check schema compatibility, but Jabiko remains authoritative for its learning, feedback, world, locale, privacy, and playable-reference rules.

## Authoring, materialization, and assets

Repository-authored Jabiko definitions are the v1 authoring authority. A deterministic, one-way projection assembles the envelope from those definitions. The runtime pack is derived, and production edits flow back to the repository source rather than being round-tripped from generated output.

The same repository source must build and test without a Tachiko Work checkout, service, plugin, GitHub call, hosted model, Supabase, or network fetch. At runtime, clients need only the normal application assets; they do not call Tachiko, Supabase, GitHub, an LLM, or Godot. A later Work producer is optional dogfood/conformance evidence: it must adapt to this exact envelope and cannot block or broaden v1.

Use one logical world resource behind the game entry. The Web host may lazy-load a validated TypeScript materialization of that resource. Do not require a generic compiler, CMS, network loader, multi-pack registry, or physical chunk scheme before a playable world proves it needs one. Keep the resource outside the eager Learning entry path; #834/#835 must prove actual bundle and first-playable reachability behavior when they implement the host.

`GameWorldDefinition` currently has no asset-binary field. V1 does not add one. A host may keep an optional presentation map keyed by the stable IDs already in the pack, such as `mika -> portrait asset` or `office -> scene art`. Missing optional assets resolve to a neutral host presentation and leave the world valid. Do not put image, audio, video, or font binaries in JSON; never distribute font files through this boundary. Required assets, licensing, or asset lifecycle would need a separately justified extension.

Rain in the illustrative Monday context is ordinary authored weather, not a seasonal event. Do not attach a seasonal association merely because it is rainy; a future association must use an event ID owned by #816/#817. The reused scenario definitions below stay unchanged, including their Japanese, localized prompts, feedback, and branch IDs.

## Illustrative Rainy Monday world

This sketch composes the existing production definitions `weekend-short-movie-plans` and `commute-medium-train-and-bicycle`. It adds only a world frame and a two-step progression. It is not a new scenario batch, and it claims no executed validation for this assembled example.

```ts
import { conversationProductionDefinitions } from "../src/domain/conversationContent/catalog";
import type { ConversationLearnerText } from "../src/domain/conversationScenario";
import type { ConversationSessionDefinition } from "../src/domain/conversationSession";
import type { GameWorldDefinition } from "../src/domain/gameWorld";

const text = (textZh: string, en: string, ja: string): ConversationLearnerText => ({
  textZh,
  textI18n: { en, ja }
});

const existingSession = (scenarioId: string): ConversationSessionDefinition => {
  const definition = conversationProductionDefinitions.find(
    (candidate) => candidate.scenario.id === scenarioId
  );
  if (!definition) throw new Error(`Missing source session: ${scenarioId}`);
  return definition;
};

const world = {
  id: "rainy-monday-example",
  locations: [{
    id: "office",
    name: text("辦公室", "Office", "オフィス"),
    description: text(
      "雨天的星期一早上，熟悉的同事仍在辦公室照常聊天。",
      "A familiar office on a rainy Monday morning; coworkers still chat as usual.",
      "雨の月曜日の朝、いつものように同僚と話せるオフィスです。"
    ),
    category: "other"
  }],
  npcs: [{
    id: "mika",
    displayName: text("美香", "Mika", "美香"),
    presentation: text(
      "常在辦公室和你聊天的同事。",
      "A coworker who often chats with you at the office.",
      "オフィスでよく話す同僚です。"
    ),
    role: "coworker",
    defaultRelationshipContext: text(
      "平常會輕鬆聊天的同事。",
      "A coworker you chat with casually.",
      "普段から気軽に話す同僚です。"
    ),
    relationshipStageIds: ["mika-familiar", "mika-after-weekend-chat"]
  }],
  relationshipStages: [
    {
      id: "mika-familiar",
      npcId: "mika",
      order: 0,
      context: text(
        "你們是會輕鬆聊天的熟悉同事。",
        "You are familiar coworkers who chat casually.",
        "気軽に話す、顔なじみの同僚です。"
      )
    },
    {
      id: "mika-after-weekend-chat",
      npcId: "mika",
      order: 1,
      context: text(
        "聊過週末後，仍以親切有禮的語氣談通勤。",
        "After the weekend chat, you continue in friendly polite Japanese while discussing commutes.",
        "週末の話をしたあとも、親しみのある丁寧な日本語で通勤について話します。"
      )
    }
  ],
  sessionDefinitions: [
    existingSession("weekend-short-movie-plans"),
    existingSession("commute-medium-train-and-bicycle")
  ],
  moments: [
    {
      id: "rainy-monday-weekend-chat",
      locationId: "office",
      npcId: "mika",
      relationshipStageId: "mika-familiar",
      scenarioId: "weekend-short-movie-plans",
      objective: text(
        "接住美香的電影計畫，分享一點自己的近況或自然地追問。",
        "Pick up Mika's movie plan by sharing a little about yourself or asking a natural follow-up.",
        "美香の映画の予定に、自分のことを少し話すか自然な質問を返して応じましょう。"
      ),
      availability: { requiredCompletedMomentIds: [], requiredRelationshipStageIds: [] },
      onCompletion: {
        unlockLocationIds: [],
        unlockMomentIds: ["rainy-monday-commute-chat"],
        relationshipStageUpdates: [{ npcId: "mika", relationshipStageId: "mika-after-weekend-chat" }]
      },
      conditionalOutcomes: []
    },
    {
      id: "rainy-monday-commute-chat",
      locationId: "office",
      npcId: "mika",
      relationshipStageId: "mika-after-weekend-chat",
      scenarioId: "commute-medium-train-and-bicycle",
      objective: text(
        "分享通勤經驗，談到下雨時的路線，並把話題交回同事。",
        "Share commute experiences, discuss rainy-day routes, and return the conversation to your coworker.",
        "通勤の経験を話し、雨の日の道についても触れて、同僚に話題を返しましょう。"
      ),
      availability: {
        requiredCompletedMomentIds: ["rainy-monday-weekend-chat"],
        requiredRelationshipStageIds: ["mika-after-weekend-chat"]
      },
      onCompletion: { unlockLocationIds: [], unlockMomentIds: [], relationshipStageUpdates: [] },
      conditionalOutcomes: [],
      completesArc: true
    }
  ],
  initialState: {
    completedMomentIds: [],
    relationshipStages: { mika: "mika-familiar" },
    unlockedLocationIds: ["office"],
    unlockedMomentIds: ["rainy-monday-weekend-chat"],
    outcomeReferences: []
  },
  entryMomentIds: ["rainy-monday-weekend-chat"]
} satisfies GameWorldDefinition;

const envelope = {
  profile: "jabiko-game-content/v1",
  world
} as const satisfies JabikoGameContentEnvelopeV1;
```

The first completion advances Mika's declared relationship stage and unlocks the unchanged commute scenario; completing that second moment ends this small arc. The first source scenario already describes Monday-morning weekend talk; the second already includes a rainy-route branch. This world frame does not relabel the pleasant-weather or summer-heat scenarios, and it does not add a seasonal association.

## Fourteen contract pressure cases

These are reasoned inputs and expected results for the boundary, not tests executed against a v1 decoder or assembled Rainy Monday output. This specification adds no decoder/compiler. Existing source tests cover the typed scenario, session, feedback, and game-world contracts; a later implementation must make the boundary cases executable.

| # | Concrete input | Expected v1 result |
| --- | --- | --- |
| 1. Determinism and array order | Project the same repository source twice under the same profile; then separately reverse the two `moments` in the illustrative world. | Identical input yields identical canonical bytes and SHA-256. Reversed moments preserve that order and produce different bytes/digest; array order is never silently normalized. |
| 2. Duplicate or missing ID | Duplicate `mika` in `npcs`, or omit the required `id` from the first moment while its references remain. | Reject the complete world for a duplicate ID or a malformed required field; no partially admitted list. |
| 3. Missing conversation or world binding | Keep a session but remove a required response binding, or change the first moment's `scenarioId` to `unknown-scenario`; separately remove its NPC reference. | Reject during all-session or world validation. A scenario, curated feedback, NPC, and moment must close through existing scoped references. |
| 4. Undeclared relationship transition | Set the first moment's `relationshipStageUpdates[0].relationshipStageId` to `mika-close-friend`, which is absent from `relationshipStages`. | Reject with invalid transition/reference; do not infer or create a stage. |
| 5. Missing launched locale | Remove `textI18n.en` from `rainy-monday-commute-chat.objective` while retaining its Chinese source and Japanese translation. | Reject before materialization; a zh fallback is not accepted as English pack content. Apply the same rule to every `ConversationLearnerText`. |
| 6. Unsupported profile | Replace `profile` with `jabiko-game-content/v2` or an unknown string. | Reject explicitly as unsupported. Do not attempt v1 decoding or partial gameplay. |
| 7. Unknown script, reward, or resource | Add `script`, `rewardCoins`, or an undeclared `resources`/chunk field to the envelope or world. | Reject at exact-shape decoding. No executable content, coins, or generic resource inventory is introduced by an extra key. |
| 8. Hand-edited generated output | Change a generated office description after projection, then recompute the detached artifact digest without changing source. | Regeneration from repository source still differs byte-for-byte; fail the drift guard even though the edited bytes have a matching recomputed digest. |
| 9. Optional Work producer | For one fixed source revision, a future adapter produces the same admitted envelope as the repository projection; separately, change that source's moment objective; separately, have the adapter emit a new field. | The equivalent output conforms without Work at runtime. An output that differs from the same fixed source fails producer conformance. An intentional source edit using declared v1 fields is a normal content revision with a new digest, not automatically a profile change. New fields or semantics require contract review. No #277 producer evidence is required for this specification. |
| 10. No-Work build | Build and validate using only repository-authored definitions with Work unavailable and network disabled. | The repository path remains sufficient. This is a required architecture property; this document did not execute that build scenario. |
| 11. Lazy first-playable resource | Inspect the first game entry's bundle/import graph; load the game only after entering it. | The game loads the one logical world resource lazily, while the Learning entry does not eagerly import it. #834/#835 must prove this with actual bundle and first-playable evidence; this specification does not claim that proof. |
| 12. Missing optional portrait | Remove the host-owned portrait mapping for `mika` while retaining the world envelope. | Use the host's neutral presentation for Mika; world validation and unrelated moments remain valid. No asset binary is required. |
| 13. Provenance-only change | Change a source comment or commit revision without changing the projected envelope. | Detached source provenance may change; canonical envelope bytes and artifact digest remain stable. The runtime ignores provenance fields. |
| 14. Gameplay meaning change | Change the rainy office description or a moment's unlock/relationship transition in authoritative source. | Canonical bytes and digest change, and the review diff points to the changed world path. The edit is reviewable as gameplay content, not hidden in regenerated metadata. |

## Next implementation boundary

After this contract is accepted, the smallest useful implementation is to admit one repository-authored world through bounded profile/shape checks, the existing semantic validators, and the launched-locale gate, then make the Web host consume its validated lazy materialization. Add drift evidence and bundle/first-playable proof for that resource. A strict raw-JSON decoder is needed only if a later source or host actually introduces untrusted JSON input. Create or split an implementation child only after acceptance identifies the concrete files and test boundary; do not begin a general compiler or authoring platform here.
