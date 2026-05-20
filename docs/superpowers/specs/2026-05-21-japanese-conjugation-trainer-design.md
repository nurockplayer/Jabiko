# Japanese Conjugation Trainer Design

## Purpose

Build a web app for a learner currently studying Minna no Nihongo to practice Japanese conjugation until the patterns become familiar. The first version focuses on fast, repeated recall for verbs and core adjective forms. Sentence patterns such as `てもらえますか`, `てくれますか`, and `てあげます` are designed as later practice modules that reuse the same vocabulary and conjugation data.

The app should open directly into a usable study experience. It should not start with a marketing page.

## Audience

The primary user is a Traditional Chinese speaker learning beginner Japanese. The interface can use Traditional Chinese explanations, Japanese prompts, kana, romaji only when useful, and optional short English labels only where they make the interface clearer.

The user needs:

- Quick daily practice without setup friction.
- Clear correction when an answer is wrong.
- Rules explained in learner-friendly language.
- Enough structure to match class progress later.
- A path from isolated forms to real sentence patterns.

## Product Shape

The recommended MVP is a "conjugation training field":

1. The learner chooses what to practice.
2. The app gives a base word and target form.
3. The learner types the answer.
4. The app checks the answer immediately.
5. The app explains the transformation and shows an example.
6. The session ends with a short review of weak items.

This keeps the first version valuable even before lessons, accounts, or a large vocabulary database exist.

## MVP Scope

### Included

- Verb groups:
  - Group 1: godan verbs, called "一類動詞" in the UI.
  - Group 2: ichidan verbs, called "二類動詞" in the UI.
  - Group 3: irregular verbs, called "三類動詞" in the UI.
- Verb forms:
  - Dictionary form: 辭書形.
  - Masu form: ます形.
  - Nai form: ない形.
  - Te form: て形.
  - Ta form: た形.
  - Plain non-past affirmative: 普通形・非過去肯定.
  - Plain non-past negative: 普通形・非過去否定.
  - Plain past affirmative: 普通形・過去肯定.
  - Plain past negative: 普通形・過去否定.
- Adjective forms:
  - い形容詞: 肯定、否定、過去、否定過去.
  - な形容詞: 肯定、否定、過去、否定過去.
- Practice modes:
  - Mixed drill.
  - Focus drill by word class and target form.
  - Mistake review for current session.
- Feedback:
  - Correct or incorrect state.
  - Accepted answer display.
  - Short rule explanation.
  - One example sentence.
- Persistence:
  - Local browser storage for recent attempts and weak items.
  - No login in MVP.

### Excluded From MVP

- Full user accounts.
- Cloud sync.
- AI-generated explanations.
- Speech recognition.
- Handwriting input.
- Complete Minna no Nihongo lesson mapping.
- Full JLPT vocabulary database.

These can be added later without changing the core design.

## Later Modules

### Lesson Path

Add a lesson field to vocabulary and patterns so the app can show practice sets like "第14課: て形 + ください" or "第24課: くれます / あげます / もらいます". This module should be data-driven rather than hard-coded.

### Sentence Pattern Practice

Use existing conjugation output as the input to sentence patterns:

- `Vて + ください`
- `Vて + もらえますか`
- `Vて + くれますか`
- `Vて + あげます`
- `Vないで + ください`
- `Vたことがあります`

The first sentence-pattern version should show a short Chinese prompt and require the learner to choose or type the correct Japanese sentence.

### Spaced Review

After enough local attempt history exists, introduce review scheduling. The MVP should store attempt data in a shape that can later support spaced repetition.

## Core User Flows

### Start A Drill

1. User opens the app.
2. Main screen shows practice controls and the first question area.
3. User selects:
   - Word type: verbs, adjectives, or mixed.
   - Verb group: all, 一類, 二類, 三類.
   - Target forms: one or more forms.
   - Question count: 10, 20, or endless.
4. User starts practice.

### Answer A Question

1. App displays the source word, reading, meaning, word type, and requested target form.
2. User types the transformed answer.
3. User submits with Enter or a submit button.
4. App normalizes minor input differences where safe.
5. App marks the answer correct or incorrect.
6. App shows explanation and next action.

### Review Mistakes

1. At the end of a session, app lists missed items.
2. User can retry only missed items.
3. If the user answers a missed item correctly, it is marked as recovered for the session.

## Question Types

### Production

The learner sees:

- Base word: `書く`
- Meaning: `寫`
- Target: `て形`

The learner types:

- `書いて`

This is the main MVP question type because it forces active recall.

### Recognition

The learner chooses the correct transformed form from multiple options. This is useful for beginners but should be secondary because it is easier than production.

### Transformation Explanation

The learner sees the answer and chooses which rule explains it. This can be a later mode for reviewing weak rules.

## Data Model

### Vocabulary Item

Each vocabulary item should include:

- `id`: stable unique key.
- `surface`: Japanese dictionary or base form.
- `reading`: kana reading.
- `meaningZh`: Traditional Chinese meaning.
- `partOfSpeech`: `verb`, `i_adjective`, or `na_adjective`.
- `group`: `godan`, `ichidan`, `irregular`, or null for adjectives.
- `lesson`: optional lesson number.
- `tags`: optional labels such as `daily`, `movement`, `giving_receiving`.
- `forms`: generated or stored accepted forms.
- `examples`: short example sentences.

### Conjugation Rule

Each rule should include:

- `id`: stable unique key.
- `partOfSpeech`: matching word type.
- `group`: matching verb group when relevant.
- `targetForm`: requested output form.
- `descriptionZh`: concise rule explanation.
- `transform`: deterministic function or table lookup.
- `notes`: edge cases and learner hints.

### Attempt

Each attempt should include:

- `vocabularyId`.
- `targetForm`.
- `prompt`.
- `expectedAnswers`.
- `submittedAnswer`.
- `isCorrect`.
- `timestamp`.
- `responseTimeMs`.

The attempt structure is intentionally compatible with later spaced repetition.

## Conjugation Strategy

The app should not rely on string matching alone scattered through UI components. Conjugation logic should live in a dedicated module with small functions and tests.

Recommended structure:

- Vocabulary data stores base forms and metadata.
- Rule functions generate expected forms.
- Irregular forms are handled by explicit tables.
- A validator compares normalized user input to accepted answers.
- UI components only ask for prompts, submit answers, and render feedback.

This keeps Japanese grammar behavior testable and prevents duplicated grammar rules.

## Answer Validation

The first version should be strict enough to train accuracy but friendly enough not to punish harmless input.

Normalize:

- Leading and trailing whitespace.
- Full-width and half-width spaces.
- Optional Japanese period at the end.

Do not normalize:

- Wrong kana.
- Wrong kanji/kana choice unless the form is explicitly listed as an accepted answer.
- Wrong tense or polarity.

Each question can have multiple accepted answers. For example, an item may accept both kanji and kana versions if they are intentionally included.

## UI Design

### Overall Feel

The app should feel like a compact study tool rather than a decorative learning website. The design should be calm, legible, and fast. The visual identity can take cues from a Japanese notebook or flashcard desk: paper-like surfaces, clear ink colors, subtle ruled lines, and small accent colors for correctness and review state.

Avoid a large landing hero. The first viewport should show the actual practice interface.

### Main Layout

Desktop:

- Left rail or top strip for practice settings.
- Main question area in the center.
- Right side or lower panel for explanation and session progress.

Mobile:

- Settings collapse into a compact drawer or segmented controls.
- Question and answer input stay first.
- Feedback appears directly under the answer.

### Primary Screens

#### Practice Screen

Contains:

- Mode selector.
- Form selector.
- Question card.
- Answer input.
- Submit, next, and reveal actions.
- Progress indicator.
- Feedback panel.

#### Rules Screen

Contains:

- Verb group overview.
- Form-specific rule tables.
- Example transformations.
- Links to start a drill for each rule.

#### Review Screen

Contains:

- Current-session mistakes.
- Weak forms summary.
- Retry button.

### Interaction Details

- Pressing Enter submits an answer.
- After feedback, pressing Enter moves to the next question.
- Correct answer state should be visible but not flashy.
- Incorrect answer state should show the correct form and rule immediately.
- The learner should always be able to reveal the answer if stuck.

## Initial Vocabulary Set

Start with a small curated set rather than a large imported list.

Suggested first verbs:

- 一類: `書く`, `聞く`, `行く`, `飲む`, `読む`, `話す`, `待つ`, `帰る`, `買う`, `遊ぶ`, `死ぬ`.
- 二類: `食べる`, `見る`, `起きる`, `寝る`, `借りる`, `浴びる`, `教える`, `覚える`.
- 三類: `する`, `来る`, `勉強する`, `買い物する`.

Suggested first adjectives:

- い形容詞: `高い`, `安い`, `大きい`, `小さい`, `新しい`, `古い`, `忙しい`, `おもしろい`.
- な形容詞: `静か`, `便利`, `元気`, `有名`, `親切`, `暇`, `簡単`.

This gives enough variation to test rules, including common tricky patterns.

## Architecture

The implementation can be a small web app. Since the current project is empty and Python-based, there are two reasonable directions:

### Recommended: Static Frontend First

Use a lightweight frontend app with TypeScript. Keep vocabulary and rules in local data files. This gives the best experience for an interactive trainer and avoids backend complexity before it is needed.

Chosen stack:

- Vite.
- TypeScript.
- React.
- LocalStorage for attempts.
- Vitest for conjugation and validation tests.

### Alternative: Python Backend With Simple Frontend

Use Python for grammar logic and serve a small frontend. This may fit the existing `pyproject.toml`, but it adds backend concerns before the app needs them.

### Decision

Use Vite, React, TypeScript, and Vitest for the first implementation. The existing Python starter files can remain untouched until implementation begins; the implementation plan should either replace them with the frontend project scaffold or explicitly keep them as non-runtime starter files.

## Component Boundaries

### Grammar Module

Owns:

- Form generation.
- Rule explanations.
- Accepted answer lists.
- Edge cases.

Does not own:

- UI state.
- Styling.
- Attempt persistence.

### Practice Engine

Owns:

- Selecting questions.
- Avoiding immediate repeats.
- Tracking session progress.
- Choosing retry questions.

Does not own:

- Conjugation rule implementation.
- Rendering.

### Persistence Module

Owns:

- Loading and saving attempts.
- Deriving weak items from history.
- Future migration from LocalStorage.

Does not own:

- Grammar correctness.
- UI rendering.

### UI Components

Own:

- Controls.
- Question display.
- Feedback display.
- Review summary.

Do not own:

- Conjugation rules.
- Attempt scoring logic beyond calling the validator.

## Error Handling

- If vocabulary data fails to load, show a simple recovery state with a retry action.
- If LocalStorage is unavailable, practice should still work in memory for the current session.
- If a generated form is missing, exclude that question from the drill and log a development warning.
- If the user submits an empty answer, keep focus in the input and show a small prompt to enter an answer.

## Accessibility

- All controls should be reachable by keyboard.
- Answer input should keep focus during drills.
- Feedback should be announced with clear text, not color alone.
- Correct and incorrect colors must meet contrast requirements.
- Japanese text should use a font stack that renders kana and kanji clearly.

## Testing Strategy

### Unit Tests

Prioritize tests for:

- Group 1 te-form and ta-form sound changes.
- Group 1 nai-form vowel changes.
- Group 2 regular transformations.
- Group 3 irregular transformations.
- い形容詞 negative and past forms.
- な形容詞 negative and past forms.
- Answer normalization.

### Integration Tests

Cover:

- Starting a drill.
- Submitting a correct answer.
- Submitting an incorrect answer.
- Revealing an answer.
- Reviewing mistakes.
- LocalStorage fallback behavior.

### Manual Checks

Before calling the first version complete:

- Practice works on desktop and mobile viewport widths.
- Enter key flow feels smooth.
- No Japanese text overlaps or gets clipped.
- Initial vocabulary covers all MVP rule branches.

## Success Criteria

The first version is successful when:

- The learner can complete a 10-question drill without instructions.
- The app correctly checks all included verb and adjective forms.
- Incorrect answers teach the rule instead of only marking failure.
- Mistake review helps repeat weak items immediately.
- The data model can later support lesson paths and sentence patterns.

## Fixed Decisions For Implementation Planning

- Build the MVP as a Vite + React + TypeScript frontend.
- Put conjugation logic in testable TypeScript modules, not inside React components.
- Use LocalStorage only; do not add a backend or login.
- Use Traditional Chinese for learner-facing explanations.
- Do not include romaji in the MVP unless needed later for accessibility.
- Keep the first screen as the practice tool, not a landing page.

The implementation plan should decide the exact file layout and whether the initial Python starter files are removed or left unused.
