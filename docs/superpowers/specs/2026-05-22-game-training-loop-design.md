# Game Training Loop Design

## Purpose

Turn Jabiko from a plain drill tool into a game-like Japanese conjugation training room while keeping the current web stack. The product should feel sharper, faster, and more motivating, but the core value remains accurate grammar practice with clear correction.

The design decision is to keep Vite, React, TypeScript, Vitest, and LocalStorage. Jabiko should not move to Unity for this phase because the main interaction is still Japanese text input, answer validation, correction, and review. A web implementation keeps the existing conjugation logic, tests, browser input behavior, mobile accessibility, and deployment flow intact.

## Product Direction

Jabiko becomes a "Japanese training room":

1. The learner enters a focused training mode.
2. Each question is treated like one move or strike.
3. Correct answers build combo, rhythm, and progress.
4. Wrong answers reveal the rule, mark the weakness, and feed future review.
5. A short round summary tells the learner what improved and what to train next.

The experience should feel game-like through pacing, feedback, progression, and recovery loops rather than through a large RPG system.

## Scope

Included:

- Round-based practice loop.
- Combo feedback for consecutive correct answers.
- Per-round score derived from accuracy, combo, and recovery.
- Weakness tracking for missed rules and vocabulary.
- End-of-round results screen.
- Recommended next action based on mistakes.
- Boss-style review round that mixes weak forms.
- UI copy and visual states that match the night training room style.
- LocalStorage persistence only.

Excluded:

- Unity or another full game engine.
- Phaser, Pixi, Three.js, or other rendering libraries.
- Character equipment, map exploration, story mode, gacha, currency, shops, or inventory.
- Accounts, cloud sync, leaderboards, or social features.
- New grammar content unrelated to the current practice loop.

## Core Loop

### Start Training

The first screen remains the actual practice interface. It should offer clear training entry points rather than a marketing page:

- Quick Training: mixed practice based on current settings.
- Focus Training: practice selected word classes and target forms.
- Weakness Review: train items missed in previous rounds.
- Boss Round: a short mixed challenge made from weak rules.

The first implementation can expose these as modes inside the existing practice screen instead of a separate route.

### Answer Question

For each question:

1. Show the base word, reading, meaning, requested target form, and current round progress.
2. Let the learner answer through the existing recognition or production question type.
3. Submit with Enter or the existing submit action.
4. Validate with the existing normalization and conjugation modules.
5. Show immediate feedback.
6. Advance to the next question with Enter or the next action.

Correct feedback should feel like a clean hit. Incorrect feedback should feel like a training correction, not a punishment.

### End Round

At the end of a finite round, show:

- Accuracy.
- Best combo.
- Recovered mistakes.
- Most missed rule family.
- A compact list of missed items.
- Recommended next action.

Endless mode can show a lightweight status panel instead of a final results screen.

## Game Systems

### Combo

Combo increases by 1 for each correct answer and resets to 0 on an incorrect answer.

Combo should be motivational, not the main measure of learning. It should not hide grammar feedback or make the learner rush. Suggested thresholds:

- 3 correct: warm combo state.
- 5 correct: strong combo state.
- 10 correct: peak combo state.

### Score

Score is round-local and simple:

- Correct answer: base points.
- Combo bonus: small bonus based on current streak.
- Recovered item: bonus when an item previously missed in the round is answered correctly later.

Score should not be used as the only success signal. Accuracy and weak rule diagnosis are more important.

### Weakness Tracking

Each incorrect answer should update local weakness signals:

- Vocabulary id.
- Target form.
- Word class.
- Verb group when relevant.
- Rule family when available.
- Timestamp.

Weakness tracking should reuse the existing attempt structure where possible. If new fields are needed, add them in a backwards-compatible way.

### Boss Round

A boss round is a short review round generated from weak signals. It should not introduce a new battle system in the first version.

Initial behavior:

- 5 to 10 questions.
- Prefer recent mistakes.
- Mix rule families that are commonly confused, such as `て形` / `た形`, negative forms, and plain forms.
- End with the same results screen plus a clearer recovered/missed summary.

### Progression

Progression should remain lightweight:

- Round completion count.
- Best combo.
- Recent accuracy.
- Weakness review completion.

No global level system is required in the first game loop version. A visible level or rank can be added later if it proves useful.

## UX Requirements

- The app must still open directly into usable practice.
- UI text stays primarily Traditional Chinese.
- Japanese appears only for prompts, answers, examples, form names, and grammar labels.
- Game feedback must not cover or obscure the correction explanation.
- Keyboard flow remains central: Enter submits and advances.
- Mobile layout must keep prompt, answer controls, feedback, and next action readable without overlap.
- Recognition questions and typed production questions both support the game loop.
- The learner should always understand what mistake was made and what rule fixes it.

## Architecture

### Domain Layer

Keep grammar behavior out of React components.

Recommended additions:

- A round state module that computes combo, score, round progress, and summary.
- A weakness summary helper that groups missed attempts by rule family, target form, and vocabulary.
- A boss round selector that chooses questions from weak signals and current vocabulary.

These helpers should be deterministic and covered by Vitest.

### UI Layer

React components should render:

- Training mode selection.
- Current round status.
- Combo and score indicators.
- Feedback states.
- End-of-round summary.
- Recommended next action.

The UI should consume computed round state rather than duplicating scoring or grouping logic.

### Storage

Continue using LocalStorage.

The game loop can store:

- Recent round summaries.
- Best combo.
- Weakness signals.
- Last selected training mode.

Storage reads should tolerate missing or older data because existing users may already have attempt history in a previous shape.

## Error Handling

- If no weakness data exists, Weakness Review and Boss Round should fall back to a mixed drill and explain the fallback in one short Traditional Chinese message.
- If stored data is malformed, ignore the malformed record and continue with a clean round.
- If a selected filter produces no questions, show a recoverable empty state and offer Quick Training.

## Testing

Add or update tests for:

- Combo increments and resets.
- Score calculation.
- End-of-round summary.
- Weakness grouping.
- Boss round question selection.
- LocalStorage migration or malformed-data tolerance.
- Existing answer normalization.
- Main practice flow with keyboard submit and next.

Existing conjugation tests remain the source of confidence for Japanese grammar correctness.

## Visual Direction

Use the existing night training room direction:

- Dark focused training surface.
- Warm action color for primary actions and progress pressure.
- Teal or sky blue for selected controls and informational state.
- Soft green for correct feedback.
- Warm orange-red for incorrect feedback.

The design should avoid decorative game chrome that reduces readability. Feedback can be animated later, but the first version should prioritize clear state changes and stable layout.

## Implementation Order

1. Add tested round state helpers.
2. Add tested weakness summary and boss selector helpers.
3. Extend storage in a backwards-compatible way.
4. Add round status, combo, and score to the existing practice screen.
5. Add end-of-round results.
6. Add Weakness Review and Boss Round entry points.
7. Polish visual states in the night training room style.
8. Verify desktop and mobile layout in the browser.

## Success Criteria

- A learner can complete a 10-question round and see a meaningful result summary.
- Correct answers visibly build combo.
- Wrong answers still show the accepted answer and rule explanation.
- Missed items can feed a weakness review or boss round.
- The game loop works without new dependencies or a backend.
- Existing grammar and practice tests still pass.
