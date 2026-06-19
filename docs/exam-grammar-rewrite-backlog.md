# Exam Grammar Rewrite Backlog

Created: 2026-06-19

This backlog is for improving Jabiko's JLPT-style grammar question bank.
The goal is N1/N2 usefulness, original questions, and distractors that are
not trivially eliminated by grammar connection alone.

## Source Policy

Use public sources for:

- JLPT item-type structure.
- Grammar-point coverage.
- Common distractor families.
- Register and topic cues commonly seen in JLPT-style materials.

Do not use public sources for:

- Copying question stems.
- Copying answer choices in the same order.
- Copying explanations.
- Translating official or third-party questions into our bank.
- Reusing the same scenario with only minor noun/verb swaps.

If a source question inspires a new item, rewrite all of these:

- Topic domain.
- Main noun/verb vocabulary.
- Sentence structure.
- Blank location.
- Distractor set order and rationale.
- Explanation wording.

Acceptable inspiration example:

- Source tests a formal policy exception with `ただし`.
- Jabiko item may test a different formal exception in a workplace guideline,
  using an original sentence and a different distractor mix.

Unacceptable:

- Same scenario, same predicate, same option family, only changing one noun.

## Reference Sources

### Official / Primary

- JLPT Sample Questions:
  https://www.jlpt.jp/e/samples/forlearners.html
  - Use for item-type shape only.
  - The page states sample questions show item form and may differ from actual
    test booklets.

- JLPT Composition of Test Sections and Items:
  https://www.jlpt.jp/e/guideline/testsections.html
  - Confirms N1/N2 include:
    - Sentential grammar 1: selecting grammar form.
    - Sentential grammar 2: sentence composition.
    - Text grammar.

- N1 purposes of test items:
  https://www.jlpt.jp/e/guideline/pdf/n1_e_revised.pdf
  - Use the stated purposes:
    - Choose grammar forms that suit sentences.
    - Compose syntactically accurate and meaningful sentences.
    - Judge suitability of sentences for text flow.

- N2 purposes of test items:
  https://www.jlpt.jp/e/guideline/pdf/n2_e.pdf
  - Same use as N1; also useful for balancing grammar with short/mid reading
    flow.

- JLPT Official Practice Workbook:
  https://www.jlpt.jp/e/samples/sampleindex.html
  - Important: official page explicitly warns about copyright/reproduction.
  - Use only to understand density, topic register, and item-type balance.
  - Do not copy or closely paraphrase any workbook question.

- New JLPT Sample Questions:
  https://www.jlpt.jp/e/samples/sample09.html
  - Use as historical item-type reference only.
  - Do not copy question text.

### Grammar Coverage / Secondary

- JLPT Sensei N1 grammar list:
  https://jlptsensei.com/jlpt-n1-grammar-list/
  - Use to cross-check coverage and missing grammar points.
  - Do not copy examples.

- JLPT Sensei N2 grammar list:
  https://jlptsensei.com/jlpt-n2-grammar-list/
  - Use for coverage only.
  - The site itself notes there is no official JLPT grammar list.

- 日本語NET JLPT grammar summary:
  https://nihongokyoshi-net.com/jlpt-grammars/
  - Useful for Japanese explanations and neighboring grammar families.
  - Do not copy example sentences.

- Japanesetest4you N1 grammar list:
  https://japanesetest4you.com/jlpt-n1-grammar-list/
  - Use for coverage comparison and grammar-family grouping only.

- Japanesetest4you N2 grammar list:
  https://japanesetest4you.com/jlpt-n2-grammar-list/
  - Use for coverage comparison and grammar-family grouping only.

- Japanesetest4you N1 grammar tests:
  https://japanesetest4you.com/category/jlpt-n1/jlpt-n1-grammar-test/
  - Use only to observe question style and distractor density.
  - Do not copy stems/options.

- Japanesetest4you N2 grammar tests:
  https://japanesetest4you.com/category/jlpt-n2/jlpt-n2-grammar-test/
  - Use only to observe question style and distractor density.
  - Do not copy stems/options.

## Current Quality Bar

Each new or rewritten grammar item must satisfy all of these:

- Original Japanese prompt.
- No visible N1/N2/N3 label in `promptLabel`.
- `hintZh` describes the situation but does not reveal the answer meaning.
- Four real grammar options.
- At least two distractors are grammatically attachable in the blank.
- At least two distractors are semantically close enough to tempt a learner.
- Explanation says why each wrong option is wrong.
- Prompt uses natural N1/N2-ish domains:
  - workplace policy
  - public announcements
  - academic/research writing
  - news commentary
  - service notices
  - committee decisions
  - social issues
  - study/work life
- Avoid "only one option can connect" questions unless the specific test goal
  is connection, and even then keep one close connection distractor.

Reject an item if:

- The Chinese hint names the answer category, e.g. "逆接", "目的", "義務".
- Wrong choices are nonsense forms.
- The answer can be picked by polarity alone.
- The option set mixes unrelated grammar families.
- The sentence is awkward Japanese.
- The explanation only explains the correct answer and ignores distractors.

## Existing Items To Rework First

These are not necessarily wrong, but they should be hardened because their
distractor families are too broad or the sentence gives away the target too
quickly.

### Rework Batch 1

1. `n2-grammar-nitomonatte`
   - Target: `に伴って`
   - Replace distractor family with:
     `に伴って / につれて / にしたがって / とともに`
   - Required distinction:
     social/institutional change accompanying another change, not just gradual
     change.

2. `n2-grammar-womegutte`
   - Target: `をめぐって`
   - Replace distractor family with:
     `をめぐって / に関して / について / を通じて`
   - Required distinction:
     debate, opposition, dispute, or divided opinions around a topic.

3. `n2-grammar-kanenai`
   - Target: `かねない`
   - Replace distractor family with:
     `かねない / うる / かねる / がたい`
   - Required distinction:
     possible negative result, not neutral possibility or inability.

4. `n2-grammar-zaruwoenai`
   - Target: `ざるを得ない`
   - Replace distractor family with:
     `ざるを得ない / よりほかない / ないではいられない / わけにはいかない`
   - Required distinction:
     no choice due to external circumstances.

5. `n2-grammar-nisakidatte`
   - Target: `に先立って`
   - Replace distractor family with:
     `に先立って / にあたって / に際して / を前にして`
   - Required distinction:
     preparatory action before an event, not occasion/time of doing.

6. `n2-grammar-nimokakawarazu`
   - Target: `にもかかわらず`
   - Replace distractor family with:
     `にもかかわらず / ものの / とはいえ / 反面`
   - Required distinction:
     strong contradiction against expected result.

7. `n1-grammar-toaimatte`
   - Target: `と相まって`
   - Replace distractor family with:
     `と相まって / とともに / に加えて / もさることながら`
   - Required distinction:
     two factors combine and amplify the result.

8. `n1-grammar-yoginaku`
   - Target: `を余儀なくされる`
   - Replace distractor family with:
     `を余儀なくされる / ざるを得ない / よりほかない / ないではすまない`
   - Required distinction:
     passive "is forced into N" by circumstances.

9. `n1-grammar-nakushitewa`
   - Target: `なくしては`
   - Replace distractor family with:
     `なくしては / なしには / ないことには / ずには`
   - Required distinction:
     noun as prerequisite for existence/achievement.

10. `n1-grammar-nisokushite`
    - Target: `に即して`
    - Replace distractor family with:
      `に即して / に基づいて / に沿って / を踏まえて`
    - Required distinction:
      adaptation to actual situation, not merely source basis or policy line.

11. `n1-grammar-wokikkirini`
    - Target: `を皮切りに`
    - Replace distractor family with:
      `を皮切りに / を契機に / を境に / をきっかけに`
    - Required distinction:
      first event in a series, not trigger or turning point.

12. `n1-grammar-toatte`
    - Target: `とあって`
    - Replace distractor family with:
      `とあって / とあれば / となれば / とはいえ`
    - Required distinction:
      because of a special situation, a natural result follows.

## New Question Batches

### Batch N2-A: Change / Progression / Basis

Create one original `文法形式選擇` item for each row.

| Target | Distractor family | Required cue in Japanese prompt |
| --- | --- | --- |
| `につれて` | `につれて / にしたがって / に伴って / とともに` | gradual natural change |
| `にしたがって` | `にしたがって / につれて / に沿って / に応じて` | rule/order/process dependency |
| `に伴って` | `に伴って / とともに / によって / に応じて` | social or institutional change |
| `に基づいて` | `に基づいて / をもとに / に沿って / を踏まえて` | decision from data/rules |
| `に応じて` | `に応じて / に沿って / によって / 次第で` | response varies by condition |
| `に沿って` | `に沿って / に基づいて / に即して / に応じて` | plan/guideline is followed |

### Batch N2-B: Contrast / Concession / Cause

| Target | Distractor family | Required cue in Japanese prompt |
| --- | --- | --- |
| `ものの` | `ものの / とはいえ / 一方で / 反面` | concession after partial success |
| `とはいえ` | `とはいえ / ものの / もっとも / ただし` | acknowledges previous statement but limits it |
| `反面` | `反面 / 一方で / に対して / ものの` | two aspects of same subject |
| `にしては` | `にしては / わりに / くせに / ものの` | unexpected evaluation for a category |
| `せいで` | `せいで / おかげで / ばかりに / ことから` | negative cause |
| `ばかりに` | `ばかりに / せいで / ことから / おかげで` | minor cause leads to regrettable result |

### Batch N2-C: Time / Result / Necessity

| Target | Distractor family | Required cue in Japanese prompt |
| --- | --- | --- |
| `あげく` | `あげく / 末に / 結果 / ところ` | long process leads to bad result |
| `末に` | `末に / あげく / 結果 / 次第` | after consideration/effort |
| `たとたん` | `たとたん / かと思うと / 次第 / ところに` | immediate change after action |
| `ところに` | `ところに / 最中に / ところへ / 折に` | interruption at a timing |
| `わけにはいかない` | `わけにはいかない / わけがない / ことはない / はずがない` | social/moral reason prevents action |
| `ないことには` | `ないことには / ない限り / なしには / なくしては` | cannot proceed unless first action happens |

### Batch N2-D: Degree / Evaluation / Auxiliary Verb Families

| Target | Distractor family | Required cue in Japanese prompt |
| --- | --- | --- |
| `だけあって` | `だけあって / だけに / だけのことはある / だけましだ` | expected positive evaluation |
| `だけに` | `だけに / だけあって / だけのことはある / だけましだ` | because of special condition, feeling is stronger |
| `かねない` | `かねない / うる / かねる / がたい` | potential negative consequence |
| `ぬく` | `ぬく / きる / かける / がち` | perseverance to the end |
| `つつある` | `つつある / 一方だ / ばかりだ / ているところだ` | gradual ongoing change |
| `にすぎない` | `にすぎない / にほかならない / でしかない / とは限らない` | downplaying as "merely" |

### Batch N1-A: Formal Prerequisite / Exclusivity

| Target | Distractor family | Required cue in Japanese prompt |
| --- | --- | --- |
| `あっての` | `あっての / なくしては / ならでは / をおいて` | something exists only thanks to another |
| `をおいて` | `をおいて / ならでは / あっての / なくしては` | no better candidate than X |
| `ならでは` | `ならでは / あっての / をおいて / に限った` | unique quality of X |
| `なくしては` | `なくしては / なしには / あっての / ないことには` | N is indispensable prerequisite |
| `までもない` | `までもない / には及ばない / ことはない / に当たらない` | obvious or unnecessary action |
| `ないまでも` | `ないまでも / までもない / とまではいかないが / とは限らない` | not reaching X but still Y |

### Batch N1-B: Classical / Formal Beku Family

| Target | Distractor family | Required cue in Japanese prompt |
| --- | --- | --- |
| `べく` | `べく / ために / うえで / にあたって` | formal purpose |
| `べくして` | `べくして / べく / べからず / べくもない` | inevitable/natural result |
| `べからず` | `べからず / べく / べきではない / まい` | prohibition in notice-like register |
| `べくもない` | `べくもない / ようがない / かねない / がたい` | impossible even to expect |
| `まじき` | `まじき / べからざる / あるまじき / べきではない` | unacceptable for a role/status |
| `まいとして` | `まいとして / ようとして / ないでいて / ようにして` | determination not to repeat |

### Batch N1-C: Obligation / Causation / Emotional Force

| Target | Distractor family | Required cue in Japanese prompt |
| --- | --- | --- |
| `ずにはすまない` | `ずにはすまない / ずにはおかない / ずにはいられない / ないではおかない` | responsibility/settlement requires action |
| `ずにはおかない` | `ずにはおかない / ずにはすまない / ないではいられない / ざるを得ない` | forcefully causes an outcome |
| `ずにはいられない` | `ずにはいられない / ずにはすまない / ないではおかない / ざるを得ない` | cannot resist emotion/action |
| `にたえない` | `にたえない / に堪えない / に忍びない / にかたくない` | strong emotion or unworthy to see/hear |
| `に忍びない` | `に忍びない / に堪えない / にたえない / にかたくない` | emotionally cannot bear to do |
| `にかたくない` | `にかたくない / にたえない / に忍びない / に足る` | easy to imagine |

### Batch N1-D: Text-Logic Connective Families

These can be `文法形式選擇` or `文章脈絡`. Prefer 3-sentence prompts.

| Target | Distractor family | Required cue in Japanese prompt |
| --- | --- | --- |
| `とあって` | `とあって / とあれば / となれば / とはいえ` | special circumstance causes natural result |
| `とあれば` | `とあれば / とあって / となれば / ときたら` | if such condition is true, action follows |
| `ときたら` | `ときたら / とあって / とあれば / とはいえ` | critical/exasperated evaluation |
| `ものを` | `ものを / ところを / ようものなら / とはいえ` | regret: could have done but did not |
| `ところを` | `ところを / ものを / ところに / ところへ` | despite/in the middle of situation |
| `ようものなら` | `ようものなら / ものなら / としたら / ならまだしも` | hypothetical bad consequence |

### Batch N1-E: Pair / Listing / Expansion

| Target | Distractor family | Required cue in Japanese prompt |
| --- | --- | --- |
| `といい〜といい` | `といい〜といい / であれ〜であれ / だの〜だの / やら〜やら` | two aspects both support evaluation |
| `であれ〜であれ` | `であれ〜であれ / といい〜といい / にしろ〜にしろ / だの〜だの` | regardless of which case |
| `だの〜だの` | `だの〜だの / やら〜やら / といい〜といい / なり〜なり` | listing with criticism/annoyance |
| `もさることながら` | `もさることながら / にとどまらず / のみならず / ばかりか` | A is true; B is even more notable |
| `にとどまらず` | `にとどまらず / のみならず / ばかりか / に限らず` | extends beyond a range |
| `のみならず` | `のみならず / ばかりか / に加えて / にとどまらず` | formal "not only" |

### Batch N1-F: Scope / Condition / Evaluation

| Target | Distractor family | Required cue in Japanese prompt |
| --- | --- | --- |
| `いかんによっては` | `いかんによっては / のいかんを問わず / 次第で / に応じて` | outcome depends on result/content |
| `のいかんを問わず` | `のいかんを問わず / いかんによっては / にかかわらず / を問わず` | regardless of result/content |
| `に至っては` | `に至っては / に至って / に至るまで / にあって` | extreme example in a series |
| `に至るまで` | `に至るまで / に至っては / にわたって / までして` | range reaches even X |
| `きらいがある` | `きらいがある / がちだ / ともすれば / っぽい` | tendency, often negative |
| `ともすれば` | `ともすれば / きらいがある / ともなると / ともあれ` | easily tends to happen |

## Text Grammar Backlog

The official item type is "judge suitability of sentences for text flow".
Current short connectives are useful but too sentence-level. Add compact
3-sentence items without turning them into long reading comprehension.

Each item:

- Prompt length: 80-140 Japanese characters.
- Blank should not be answerable from one neighboring word only.
- Use `promptLabel: "文章脈絡"`.
- `hintZh` should say the document situation, not the logical relation.

Create 10 items:

1. Company notice: rule applies to all staff, then exception.
   - Family: `ただし / なお / もっとも / とはいえ`

2. Research summary: result seems positive, then limitation.
   - Family: `もっとも / ただし / 一方で / とはいえ`

3. Product/service announcement: improvement plus remaining issue.
   - Family: `一方で / 反面 / それに対して / とはいえ`

4. Opinion paragraph: public benefit acknowledged, but implementation burden.
   - Family: `とはいえ / ものの / だからこそ / それどころか`

5. Review/commentary: expectation contradicted by actual result.
   - Family: `ところが / それでも / かえって / もっとも`

6. Policy explanation: data alone is insufficient; field voices matter.
   - Family: `とはいえ / したがって / そのうえ / なお`

7. Work email: request is accepted with condition.
   - Family: `ただし / なお / ちなみに / それなら`

8. Article paragraph: trend is spreading beyond one field.
   - Family: `にとどまらず / のみならず / に限らず / を問わず`

9. Commentary: two causes combine to create stronger result.
   - Family: `と相まって / に伴って / とともに / に加えて`

10. Advisory note: risk exists if action is delayed.
    - Family: `かねない / おそれがある / うる / とは限らない`

## Sentence Composition Backlog

Add star-order style questions for patterns where form selection alone is
too easy. Keep options syntactically plausible enough that the learner must
track chunks.

Create 8 items:

1. `ないことには〜ない`
2. `ざるを得ない`
3. `に伴って`
4. `をめぐって`
5. `なくしては〜ない`
6. `に至っては`
7. `もさることながら`
8. `ずにはすまない`

Rules:

- Correct answer must be a natural full sentence.
- Distractors should be wrong by chunk order, not random word salad.
- At least one distractor should preserve most chunks but misplace the grammar
  unit.

## Authoring Template

Use this object shape:

```ts
examQuestion({
  id: "n2-grammar-...",
  level: "N2",
  surface: "...",
  reading: "...",
  meaningZh: "...",
  promptLabel: "文法形式選擇",
  instructionZh: "句中填空：依文脈選最自然的文法。",
  promptText: "... ___ ...",
  promptContextZh: "...",
  hintZh: "...",
  expectedAnswer: "...",
  options: ["...", "...", "...", "..."],
  explanation: "先說正解功能，再逐一說明三個干擾選項為什麼不合本句。"
})
```

## Claude Task Prompt

Use this prompt when asking Claude to implement a batch:

```md
請修改 Jabiko 的 src/domain/examBlocks.ts，新增或重寫本文件指定的一個 batch。

硬性要求：
- 題目必須 100% 原創，不得抄官方、JLPT workbook、網路題庫或例句。
- 可以參考 docs/exam-grammar-rewrite-backlog.md 的 source list 了解題型與文法 coverage。
- 每題 4 個 options 都必須是真實文法。
- 至少 2 個 distractors 要能在接續上成立。
- explanation 必須逐一說明三個 distractors 為什麼錯。
- hintZh 不得洩漏 meaningZh 的核心語意。
- promptLabel 不得出現 N1/N2/N3。
- 優先 N1/N2，可少量 N3 但不要標示給使用者。

完成後跑：
- node scripts/check-exam-options.mjs
- corepack pnpm test
- corepack pnpm build

不要直接搬網路題目；如果參考公開題，請改變場景、詞彙、句構、選項組合與說明。
```

## Review Checklist

Before merging a grammar batch, review these:

- Does any prompt feel like a direct translation of a public question?
- Can a learner answer only by spotting the one grammatically attachable
  option?
- Are distractors from the same semantic family?
- Does `hintZh` reveal the answer class?
- Is `promptContextZh` allowed to be a full translation only after answer?
- Does explanation teach the minimal-pair difference?
- Are all options in a natural Japanese register?
- Did `check-exam-options.mjs`, test, and build pass?

