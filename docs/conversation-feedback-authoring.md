# Conversation feedback authoring

This document defines how to annotate deterministic curated response cases for
Conversation-first practice. The curriculum terms and canonical conversation-skill IDs remain
owned by [`conversation-learning-model.md`](conversation-learning-model.md); this rubric does not
create another skill taxonomy.

## Author one context-bound case at a time

Each `CuratedConversationResponse` needs:

- a stable `id` and the Japanese response being annotated;
- non-empty `situation`, `relationship`, and `discourse` context;
- one language-quality stage;
- one continuation category;
- one register/context-fit category;
- zero or more response-composition signals; and
- optional developer-facing `authorRationale` by feedback dimension.

`authorRationale` supports content review. It is not localized learner-facing copy and must not be
rendered directly. A presentation layer must use the applicable localized content contract.

Do not make one candidate sentence a universal answer. Author multiple context-bound cases when
several responses are acceptable. Matching learner production to a case belongs to the curated
exercise runtime; this rubric evaluates the selected case deterministically and does not impose
exact-string-only scoring.

## Language quality

The stable stages are cumulative:

| Stage | Result |
| --- | --- |
| `not_understandable` | The intended meaning is not reasonably recoverable. |
| `understandable` | Meaning is recoverable, but grammar or wording still needs work. |
| `correct` | Grammar and wording are acceptable for the task, but contextual naturalness can improve. |
| `natural` | The wording is natural for the declared situation, relationship, and discourse context. |

Never annotate `natural` without enough context to justify it. The same Japanese response may be
`natural` in one discourse context and `correct` in another. `natural` is not a context-free rank
across all possible sentences.

## Continuation and register/context fit

Continuation is independent from language quality:

| Category | Meaning |
| --- | --- |
| `dead_end` | The response gives the partner no useful next conversational move. |
| `opens_thread` | The response gives the partner a clear way to continue. |
| `enriches_thread` | The response contributes relevant material and creates additional useful continuation paths. |

A short direct answer can still open a thread. A longer response is not automatically richer.
Annotate the conversational effect in the declared context, not character count.

Register/context fit is either `fits` or `mismatch`. Judge it separately from grammatical
correctness. A grammatically correct response can still mismatch the declared social distance or
situation.

## Response composition

`answer`, `add`, and `ask` are optional composition features. They describe how this response is
built; they are not canonical conversation-skill IDs and a good response does not need all three.

Each feature references the canonical skill that expresses its function in this case. For example:

- a direct personal `answer` can reference `share`;
- an `ask` that follows up on the partner can reference `expand`;
- an `ask` that returns responsibility to the partner can reference `bounce`; and
- an `ask` that requests clarification can reference `repair`.

The type is generic over the canonical skill ID so the scenario contract can supply that bounded
type without this module duplicating it.

## Determinism, analytics, and future evaluation

`evaluateCuratedConversationResponse()` derives all five dimension statuses from the annotation;
it performs no network or AI call. Re-evaluating the same case produces the same result.

`toConversationFeedbackAnalytics()` returns only bounded source, quality, status, and composition
identifiers. It excludes response IDs, Japanese response text, context, author rationale, and
canonical skill references.

`ConversationFeedbackEvaluator` is the extension seam for a future bounded evaluator. The current
adapter remains deterministic and curated. Future AI evaluation must return the same explicit
multidimensional result and must not replace this rubric with one opaque score.
