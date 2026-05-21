# Night Training Room Style Design

## Purpose

Refresh Jabiko's visual style because the current palette feels muddy and unfocused. The app should keep its compact study-tool structure, but use the selected "night training room" direction so practice feels sharper, faster, and more memorable.

## Visual Direction

Use dark mode as the primary expression:

- Deep green-black app background.
- Subtle grid and radial light so the screen feels like a focused training surface, not a plain dark page.
- Dark translucent panels with restrained borders.
- Warm orange for primary actions and urgent progress.
- Teal and sky blue for selected controls, target chips, and informational states.
- Soft green for correct answers.
- Warm orange-red for incorrect answers.

Light mode remains available, but should be a low-glare counterpart of the same system rather than a separate notebook palette.

## Scope

Included:

- Update CSS color tokens.
- Refine panel, button, chip, choice, feedback, and card styling to fit the new palette.
- Preserve current layout, copy, practice behavior, keyboard flow, and LocalStorage theme behavior.
- Avoid new dependencies.

Excluded:

- React component refactors.
- New features or practice modes.
- Changes to conjugation logic, vocabulary, or localization data.

## UX Requirements

- First screen remains the actual learning/practice interface, not a landing page.
- Japanese prompt text must stay highly legible on mobile and desktop.
- Correct, incorrect, and revealed feedback must be visually distinct.
- Buttons and selectable controls must have strong enough contrast in both themes.
- Mobile layout must not introduce overlap or clipped text.

## Verification

Run the existing test suite and visually inspect the app in the browser. Check both learning and challenge views, at least one mobile-sized viewport, and both dark and light theme states.
