# Conversation-first learning model

Status: canonical product/curriculum contract for Issues #810–#818.

This document defines what Jabiko means by conversation-first Japanese learning. It is intentionally a product and curriculum contract, not a runtime implementation plan.

## Product job

Jabiko should help a learner **keep a real Japanese conversation going**.

The primary learning model is:

```text
Situation
  × Relationship
  × Conversation length
  × Difficulty
  × Time / season
  -> Conversation practice
  -> Feedback
  -> Reuse in real life
```

Grammar, vocabulary, conjugation, JLPT knowledge, reading, and listening remain important supporting layers. They are not the top-level ontology for conversation practice.

A conversation exercise must therefore answer all of these questions:

1. Where is this interaction happening and what is going on?
2. Who is speaking to whom, and what is their social distance?
3. What conversational skill is being trained?
4. How much interaction must the learner sustain?
5. What makes this instance difficult?
6. What counts as improvement even when more than one real-world response is valid?

## Core progression principle

Conversation practice should improve production through two complementary progressions.

Language quality:

```text
Understandable -> Correct -> Natural
```

Conversation quality:

```text
Answer -> Add -> Ask
```

The first progression prevents Jabiko from treating imperfect but usable Japanese as equivalent to silence. The second teaches the learner to give the partner material to continue with instead of producing isolated correct answers.

Neither sequence is a universal sentence template. They are teaching models that content and feedback may reference when useful.

## Conversation length classes

`short`, `medium`, and `long` are **different learning jobs**, not aliases for turn counts or text length.

### `short`

**Learning job:** produce one useful conversational move quickly enough to use in real life.

Typical targets:

- open a conversation;
- react;
- ask one follow-up;
- add one useful detail;
- ask back;
- clarify or repair a misunderstanding;
- join an existing conversation;
- exit naturally.

A short exercise may be only one or two learner turns. It succeeds when the learner makes the target move appropriately, not when a minimum character count is reached.

Representative examples:

```text
Partner: 昨日、財布なくしたんですよ。
Target: react + follow-up
Learner: えっ、大丈夫でした？
```

```text
Situation: two classmates enter an elevator
Target: open
Learner: 今日も暑いですね。
```

Short practice is the foundation for later reaction-time training, but v1 does not require a timer.

### `medium`

**Learning job:** sustain one conversational thread across several exchanges and return conversational responsibility to the partner.

Typical targets:

- answer with enough information to continue;
- use `Answer -> Add -> Ask` when appropriate;
- exchange personal information without interrogation-style questioning;
- perform a light topic transition;
- recover after a weak/dead-end turn;
- maintain an appropriate register for the relationship.

A medium exercise normally has several turns, but completion is defined by the intended interaction arc rather than a fixed count.

Representative shape:

```text
Partner: 最近何かハマってるものあります？
Learner: 最近カメラにハマってます。
Learner: 休みの日によく写真を撮りに行きます。
Learner: ○○さんは写真撮ります？
```

### `long`

**Learning job:** manage a sustained interaction in which language is only one part of the task.

Typical targets:

- narrate an experience;
- explain reasons and opinions;
- agree or disagree without breaking rapport;
- negotiate, refuse, or soften a preference;
- move across multiple related topics;
- adapt register as relationship/context changes;
- remember prior information inside the conversation;
- handle longer listening/speaking pressure;
- participate in a complete social objective, such as getting acquainted at an event.

Long practice should eventually support quest-like objectives, for example:

```text
Meetup scenario
- introduce yourself to two people
- learn one person's work or study background
- find one shared interest
- leave one exhausted conversation naturally
- sustain a deeper follow-up with one person
```

A long exercise is not simply a medium exercise with more dialogue lines.

## Canonical conversation skill taxonomy

Downstream domain/content work should use the following bounded identifiers unless this document is explicitly revised.

| Stable ID | Skill | Learner job |
| --- | --- | --- |
| `open` | Open | Start an interaction or introduce a topic naturally. |
| `react` | React | Show surprise, empathy, interest, acknowledgement, or another context-fitting response. |
| `expand` | Follow up / expand | Ask or say something that develops what the partner just contributed. |
| `share` | Share | Provide or add relevant information about oneself or the situation so the partner has material to respond to. |
| `bounce` | Ask back / return the ball | Return conversational responsibility to the partner without turning the exchange into an interview. |
| `transition` | Topic transition | Move from one topic to another with enough continuity to feel natural. |
| `repair` | Repair / clarification | Ask for repetition, meaning, confirmation, or otherwise recover after not understanding. |
| `join` | Join | Enter an existing interaction or group thread appropriately. |
| `exit` | Exit | End or leave an interaction without an abrupt conversational break. |
| `narrate` | Narrate | Tell an event/story with enough sequencing and context for another person to follow. |
| `opinion` | Express opinion | State a view, preference, reason, or evaluation in a socially appropriate way. |
| `agree_disagree` | Agree / disagree | Align or disagree while preserving the intended relationship tone. |
| `negotiate` | Negotiate / refuse | Propose, decline, soften, compromise, or manage conflicting preferences. |
| `register_adapt` | Relationship/register adaptation | Adjust politeness, directness, wording, or style to social distance and context. |

### Taxonomy rules

- A scenario may train more than one skill, but should have one or a small number of primary skills.
- Skills describe **conversation behavior**, not grammar points.
- Do not add a new skill ID merely because a new grammar form or vocabulary category appears.
- Listening, pronunciation, speed, and memory pressure may affect difficulty without becoming conversation skills themselves.
- Content authors should prefer the smallest combination that explains the learning job.
- Every Conversation-first scenario must declare at least one primary canonical skill. If a task only tests whether a proposition was answered correctly and no canonical conversation behavior applies, it belongs in existing language/practice modes rather than this scenario system.

### `Answer -> Add -> Ask` is not a second skill taxonomy

`Answer -> Add -> Ask` is a **response-structure and feedback lens**. Its three terms are not canonical conversation-skill IDs, and downstream code must not add `answer`, `add`, or `ask` to the skill taxonomy solely because this teaching model exists.

The canonical skill describes **what conversational behavior the learner is practicing**. `Answer`, `Add`, and `Ask` describe **how a particular response is composed**. A response-composition feature therefore maps to a canonical skill according to its conversational function:

- **Answer** means the learner addresses what the partner or prompt asked. It is not a skill by itself. A personal or situational answer is normally `share`; a stance or preference can be `opinion`; an account of what happened can be `narrate`; an acknowledgement can be `react`; an acceptance, refusal, or proposal can be `negotiate`.
- **Add** means the learner contributes relevant material beyond the minimum answer. It is `share` when adding learner/situational information and `expand` when developing what the partner contributed; it may also be realized through a more specific behavior such as `narrate` or `opinion`.
- **Ask** means the learner uses a question as a continuation move. It is `bounce` when returning the ball or asking about the partner, `expand` when following up on the partner's contribution, `repair` when clarifying, or `open` when initiating a topic.

Primary skills must describe the intended learning job, not mechanically mirror every response-composition feature. #813 may deterministically represent `Answer` / `Add` / `Ask` as feedback or composition features, but #812 should continue to use only the canonical skill IDs defined above.

A simple direct answer can therefore be a valid Conversation-first move when it realizes a canonical behavior:

```text
Partner: 週末何しました？
Learner: 家でゆっくりしました。
Response feature: Answer
Canonical skill: share
```

A fuller response may combine several composition features while still using the same bounded skill taxonomy:

```text
家でゆっくりしました。                    # Answer -> share
最近ちょっと疲れてたので、Netflixを見てました。 # Add -> share
○○さんは何してました？                  # Ask -> bounce
```

And the same `Ask` feature can map differently when its conversational function changes:

```text
Partner: 週末、鎌倉に行ってきたんですよ。
Learner: どうでした？
Response feature: Ask
Canonical skill: expand
```

The teaching model is optional rather than a requirement that every good response contain all three features.

## Difficulty model

Difficulty is multidimensional. A single JLPT/N-level must not be the source of truth.

Use five compact dimensions conceptually. The exact TypeScript representation belongs to #812, but its semantics should preserve this model.

### 1. Linguistic complexity

- `basic`: frequent vocabulary, short/simple constructions, strong tolerance for learner-like phrasing.
- `intermediate`: broader everyday vocabulary, clause linking, more natural spoken forms, moderate inference.
- `advanced`: nuanced wording, abstract language, denser or more implicit expression.

### 2. Partner support

- `supportive`: partner actively keeps the conversation alive, asks helpful questions, and tolerates pauses.
- `balanced`: normal reciprocal conversation; the learner must contribute material.
- `low_support`: partner gives short/low-energy responses or does not rescue weak turns.

This dimension is deliberately social. A grammatically easy conversation can still be difficult when the partner does little work.

### 3. Relationship distance

- `familiar`: friend, close classmate, close colleague, or similarly low-distance relationship.
- `neutral`: newly met peer, ordinary acquaintance, casual service interaction, or similar middle distance.
- `formal`: teacher, senior, customer/client, unfamiliar older person, or another context where register requires more care.

The concrete relationship/roles should still be recorded separately. This dimension captures the register pressure created by that relationship.

### 4. Topic depth

- `concrete`: weather, food, route, schedule, immediate shared surroundings.
- `personal`: habits, weekend, preferences, work/study experience, personal stories.
- `abstract`: values, social/cultural comparison, reasons, trade-offs, disagreement, broader opinions.

### 5. Interaction pressure

- `low`: one-to-one, clear turns, no urgency, ample context.
- `normal`: ordinary conversational pace, light topic drift, normal reciprocal responsibility.
- `high`: fast turns, interruption, group participation, long listening span, rapid topic change, or another meaningful interaction burden.

### Difficulty rules

- Do not derive one dimension mechanically from another.
- A beginner-friendly exercise can use a socially difficult situation with basic language.
- An advanced learner can practice a low-pressure but abstract conversation.
- UI may later summarize the dimensions into learner-friendly labels, but source data must keep the distinctions available.
- JLPT metadata may be attached as a secondary approximation or prerequisite hint only.

## Relationship and register

Conversation practice must model **who is talking to whom**.

At minimum, scenario design should distinguish concrete roles such as:

- stranger;
- classmate;
- friend;
- colleague;
- senior/junior;
- teacher/student;
- staff/customer;
- host/guest;
- date/romantic interest;
- group participant.

The same proposition can be appropriate in one relationship and awkward in another. Grammar correctness is therefore not enough to judge conversational quality.

For example, the topic "weekend" can be introduced differently depending on relationship:

```text
Friend: 週末何してた？
Classmate/colleague: 週末何してたんですか？
More formal context: 週末は何かされましたか？
```

The curriculum should teach learners to remain themselves in Japanese rather than force every learner into one extroverted speaking style. A quiet but engaged response can be successful if it fits the context and keeps the interaction viable.

## Progression examples by topic

The examples below illustrate how **conversation length and difficulty interact**. They are not canonical content records and should not be copied mechanically into production scenario data.

### Weather

**Short / basic**

```text
Situation: entering class on a very hot day
Skill: open
Learner goal: 今日も暑いですね。
```

**Medium / intermediate**

```text
Start: 最近ずっと暑くないですか？
Develop: 夜も暑くて寝にくいです。
Bounce: ○○さん、エアコンずっとつけてます？
```

Skills: `open`, `share`, `bounce`.

**Long / advanced**

Move from the shared weather experience into summer routines, electricity cost, commuting, and preferences for living in different climates. The learning job is controlled topic drift and opinion exchange, not advanced weather vocabulary.

### Weekend

**Short / basic**

```text
Partner: 週末何しました？
Learner: 家でゆっくりしました。
```

The response is understandable and correct, but the exercise may invite a retry that adds continuation material. Under the mapping above, this direct personal answer exercises `share` and exhibits the `Answer` response feature.

**Medium / intermediate**

```text
家でゆっくりしました。最近ちょっと疲れてたので、Netflixを見てました。
○○さんは何してました？
```

Skills: `share`, `bounce`.

**Long / advanced**

Narrate a weekend event, answer follow-ups, compare preferences, transition into future plans, and handle a mild difference of opinion about how to spend days off.

Skills can include `narrate`, `opinion`, `agree_disagree`, `transition`.

### School / work

**Short / basic**

```text
Partner: 最近忙しくて。
Learner: そうなんですか。大変ですね。
```

Skill: `react`.

**Medium / intermediate**

React, ask whether the busy period has continued for long, share a comparable experience, then ask a follow-up without prying into private details.

Skills: `react`, `expand`, `share`.

**Long / advanced**

Discuss work/study load, priorities, future plans, or work-life balance while adapting directness to a colleague, senior, or newly met peer.

Skills: `opinion`, `agree_disagree`, `register_adapt`, possibly `negotiate`.

### Seasonal event: fireworks festival

The event lifecycle changes the conversational job even when the event identity is the same.

**Before / short / basic**

```text
花火大会、今年どこか行きますか？
```

Skill: `open` or `expand`.

**After / medium / intermediate**

```text
週末、花火大会行きました？
どこで見ました？
人、多くなかったですか？
```

The learner should answer with experience + detail + ask-back rather than only confirm attendance.

**Long / advanced**

Use the event to move into crowds, summer traditions, childhood memories, regional differences, or comparison with celebrations in another country. The conversation may involve `narrate`, `transition`, `opinion`, and `register_adapt`.

Seasonal relevance and lifecycle selection are owned by #816/#817; this document defines only the learning progression.

## Conversation feedback contract

Detailed deterministic feedback belongs to #813, but all conversation content must be compatible with these principles.

### Correctness is not enough

A response can be grammatically correct and still be a conversational dead end:

```text
Partner: 週末、鎌倉に行ってきたんですよ。
Learner: そうですか。
```

A better continuation may be:

```text
いいですね。どうでした？
```

A richer continuation may be:

```text
いいですね！最近行ってないです。人多かったですか？
```

Jabiko should be able to teach the difference without claiming the richer example is the only valid real-world answer.

### Imperfect production can still be useful

Naturalness is always relative to the declared situation, relationship, and discourse context. A `Natural` example is not globally better than every grammatically correct alternative; it shows wording that fits the specific interaction being taught.

For example, given this explicit context:

```text
Partner: 昨日、何してたんですか？
Survival / understandable: 昨日、友達、飲みました。
Correct: 昨日、友達と飲みに行きました。
Natural for this explanatory context: 昨日、友達と飲みに行ってたんです。
```

The learner should be encouraged to produce meaning first, then improve form and context-sensitive naturalness. This does not mean errors should be ignored; it means feedback should preserve the difference between communicative success, linguistic quality, and pragmatic fit.

### Social fit is separate from grammar

A sentence may be natural Japanese but inappropriate for the current relationship/register. `register_adapt` and relationship metadata therefore remain first-class curriculum concepts.

## Curated practice before unrestricted AI

Conversation-first does **not** mean adding one generic AI chat box.

Initial product work should prefer curated scenarios with explicit:

- situation;
- roles/relationship;
- target skills;
- difficulty dimensions;
- finite completion behavior;
- feedback intent;
- retry/improvement behavior.

A later AI evaluator or partner may extend this model, but must not erase it. Open-ended AI conversation should remain bounded by the same curriculum semantics so Jabiko can explain what the learner is practicing and why.

## Relationship to existing Jabiko practice

This conversation model is additive.

Existing JLPT/practice modes continue to answer questions such as:

- Do I recognize this vocabulary?
- Do I know this grammar point?
- Can I retrieve this conjugation?
- Can I answer this exam-format item?

Conversation practice answers a different question:

> Can I use what I know to keep an interaction alive with this person in this situation?

Issue #809's verb-conjugation rapid recall path is therefore complementary and independent. Conversation scenarios may later expose a need for a form such as past, potential, or `て` form, but #810–#818 must not replace, fork, or block #809's practice pipeline.

## Authoring contract for downstream issues

Every production conversation scenario should eventually declare enough information for a reviewer to answer:

1. **Situation:** what is happening?
2. **Roles:** who are the learner and partner?
3. **Relationship:** what social distance/register pressure applies?
4. **Length class:** `short`, `medium`, or `long` according to the learning jobs above?
5. **Primary skills:** which canonical skill IDs are being trained?
6. **Difficulty:** what are the five difficulty dimensions?
7. **Objective:** what should the learner be able to do by the end?
8. **Continuation:** how does the task reward giving the other person something to respond to?
9. **Feedback:** what makes a response understandable, correct, natural, socially fitting, or better for continuation?
10. **Completion:** what interaction arc ends the exercise?

A scenario that cannot answer these questions is probably content exposition rather than conversation training.

## Non-goals of the curriculum contract

This document does not define:

- a generic LLM provider interface;
- speech recognition or pronunciation scoring;
- a public social network;
- exact database persistence;
- exact React component structure;
- exact analytics events;
- a generalized CEFR/JLPT replacement framework;
- exhaustive pragmatics or linguistic annotation;
- a turn-count formula for short/medium/long.

Those concerns should be introduced only when a downstream product requirement needs them.

## Downstream authority boundaries

- #812 owns the typed scenario/content representation of this model.
- #813 owns deterministic conversational feedback semantics.
- #814 owns the first Small Talk Gym runtime.
- #815 owns the first everyday scenario content pack.
- #816 owns deterministic time/event lifecycle relevance.
- #817 owns the first year-round seasonal conversation calendar.
- #818 owns the time-aware discovery surface.
- #819 explores lightweight shared seasonal community mechanics and is design-only until separately approved.

If a downstream implementation finds this model insufficient, change this canonical contract explicitly rather than silently inventing competing terminology in code.
