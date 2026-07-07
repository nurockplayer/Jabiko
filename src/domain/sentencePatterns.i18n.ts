import type { LocalizedText } from "./types";

/**
 * Per-locale overlays for the sentence-pattern drills, keyed by item id. Threaded
 * onto the PracticeQuestion by `toPracticeQuestion` (sentencePatterns.ts), so the
 * existing pickLocalized read path in ExamPrompt / FeedbackPanel renders them --
 * no component change needed. sentencePatterns only loads inside the lazy
 * challenge flow, so this data stays out of the eager bundle.
 *
 * Only the Chinese prose is overlaid; the Japanese prompt / answer / options are
 * never touched. Populated by the study-content translation pass (#400).
 */
export type SentencePatternOverlay = {
  hintI18n?: LocalizedText;
  promptContextI18n?: LocalizedText;
  explanationI18n?: LocalizedText;
};

/** The (constant) drill instruction, localized once for every pattern item. */
export const patternInstructionI18n: LocalizedText = {
  en: "Choose the sentence pattern that best fits the context.",
  ja: "文脈に最も自然な文型を選びましょう。"
};

export const sentencePatternI18n: Record<string, SentencePatternOverlay> = {
  "pattern-starter-desu-001": {
    "hintI18n": {
      "en": "Answering a question about what you are.",
      "ja": "自分の身分についての質問に答える。"
    },
    "promptContextI18n": {
      "en": "\"Are you a student?\" \"Yes, I am a student now.\"",
      "ja": "「学生ですか。」「はい、わたしは今、学生です。」"
    },
    "explanationI18n": {
      "en": "The question is affirmative (「がくせいですか」), and 「はい」 agrees with it — so present affirmative 「です」; 「じゃありません」 would contradict the 「はい」. 「いま」 (now) rules out the past 「でした」. ※がくせい = student.",
      "ja": "相手は肯定形で「がくせいですか」と聞いている。「はい」はそれに同意する返事なので、現在肯定の「です」。「じゃありません」は「はい」と矛盾する。「いま」があるので過去の「でした」も合わない。"
    }
  },
  "pattern-starter-desu-002": {
    "hintI18n": {
      "en": "Correcting someone's mistaken idea about what you are.",
      "ja": "相手の勘違いを訂正する。"
    },
    "promptContextI18n": {
      "en": "\"Are you a teacher?\" \"No, I am not a teacher.\"",
      "ja": "「先生ですか。」「いいえ、わたしは先生じゃありません。」"
    },
    "explanationI18n": {
      "en": "The question is affirmative (「せんせいですか」) and 「いいえ」 denies it → present negative 「じゃありません」. 「です」 contradicts the 「いいえ」; 「じゃありませんでした」 is PAST negative but the question asks about now; 「ですか」 asks a question.",
      "ja": "相手は肯定形で「せんせいですか」と聞き、「いいえ」でそれを打ち消す → 現在否定の「じゃありません」。「です」は「いいえ」と矛盾。「じゃありませんでした」は過去否定で、現在を聞く質問と合わない。「ですか」は質問の文末。"
    }
  },
  "pattern-starter-desu-003": {
    "hintI18n": {
      "en": "Talking about yesterday's weather.",
      "ja": "きのうの天気について話す。"
    },
    "promptContextI18n": {
      "en": "\"It rained yesterday (yesterday was rainy).\"",
      "ja": "「きのうは雨でした。」"
    },
    "explanationI18n": {
      "en": "「きのう」 (yesterday) is in the past; the past affirmative of a noun sentence is 「でした」. 「です」 is present, 「じゃありません」 is present negative, 「ですか」 is a question. ※あめ = rain.",
      "ja": "「きのう」は過去のこと。名詞文の過去肯定は「でした」。「です」は現在、「じゃありません」は現在否定、「ですか」は疑問文。"
    }
  },
  "pattern-starter-desu-004": {
    "hintI18n": {
      "en": "Correcting someone's impression of yesterday's weather.",
      "ja": "きのうの天気についての印象を訂正する。"
    },
    "promptContextI18n": {
      "en": "\"Did it rain yesterday?\" \"No, it didn't rain.\"",
      "ja": "「きのうは雨でしたか。」「いいえ、雨じゃありませんでした。」"
    },
    "explanationI18n": {
      "en": "The question is affirmative (「あめでしたか」) and 「いいえ」 denies it, AND 「きのう」 is past → past negative 「じゃありませんでした」. 「でした」 would contradict the 「いいえ」; 「じゃありません」 is present negative, clashing with the past-tense question.",
      "ja": "相手は肯定形で「あめでしたか」と聞き、「いいえ」でそれを打ち消す＋「きのう」は過去 → 過去否定の「じゃありませんでした」。「でした」は「いいえ」と矛盾、「じゃありません」は現在否定で過去の質問と合わない。"
    }
  },
  "pattern-starter-desu-005": {
    "hintI18n": {
      "en": "Pointing at an animal in the distance and checking with the listener.",
      "ja": "遠くの動物を指して、相手に確かめる。"
    },
    "promptContextI18n": {
      "en": "\"Um... is that a dog?\" \"Yes, it is.\"",
      "ja": "「あのう、あれは犬ですか。」「はい、そうです。」"
    },
    "explanationI18n": {
      "en": "The other person answers 「はい、そうです」 — only a QUESTION gets an answer, so the sentence must end in 「ですか」. With plain 「です」 you'd be telling them, and no 「はい」 would follow.",
      "ja": "相手が「はい、そうです」と答えている——返事が返ってくるのは質問だから、文末は「ですか」。「です」なら断定になり、「はい」の返事は続かない。"
    }
  },
  "pattern-starter-desu-006": {
    "hintI18n": {
      "en": "Talking about tomorrow's schedule.",
      "ja": "あしたの予定について話す。"
    },
    "promptContextI18n": {
      "en": "\"Tomorrow is a day off.\"",
      "ja": "「あしたは休みです。」"
    },
    "explanationI18n": {
      "en": "「あした」 (tomorrow) hasn't happened yet; Japanese noun sentences use the present form 「です」 for the future too. 「でした」/「じゃありませんでした」/「でしたか」 all carry past tense, contradicting 「あした」. ※やすみ = day off.",
      "ja": "「あした」はまだ起きていないこと。日本語の名詞文は未来も現在形「です」で表す。「でした」「じゃありませんでした」「でしたか」はいずれも過去で「あした」と矛盾。"
    }
  },
  "pattern-starter-desu-007": {
    "hintI18n": {
      "en": "The opening line when meeting someone for the first time.",
      "ja": "初対面のあいさつの場面。"
    },
    "promptContextI18n": {
      "en": "\"Nice to meet you. My name is Tanaka.\"",
      "ja": "「はじめまして。わたしの名前は田中です。」"
    },
    "explanationI18n": {
      "en": "「はじめまして」 is the first-meeting greeting, followed by introducing your own name = present affirmative 「です」. You wouldn't introduce yourself with a negative or a question.",
      "ja": "「はじめまして」は初対面のあいさつ。続けて自分の名前を紹介する＝現在肯定の「です」。自己紹介で否定や疑問は使わない。"
    }
  },
  "pattern-starter-desu-008": {
    "hintI18n": {
      "en": "Explaining which bag is actually yours.",
      "ja": "どのかばんが自分のものかを説明する。"
    },
    "promptContextI18n": {
      "en": "\"This is not my bag. Mine is that one over there.\"",
      "ja": "「これはわたしのかばんじゃありません。わたしのはあれです。」"
    },
    "explanationI18n": {
      "en": "The second sentence says \"mine is THAT one (あれ)\", so the first must DENY that this one is yours → 「じゃありません」. With 「です」 the two sentences would contradict each other.",
      "ja": "二文目で「わたしのはあれです」と言っているので、一文目は「これがわたしのだ」を打ち消しているはず →「じゃありません」。「です」だと二つの文が矛盾する。"
    }
  },
  "pattern-starter-particles-001": {
    "hintI18n": {
      "en": "Describing your own daily habit.",
      "ja": "自分の毎日の習慣について話す。"
    },
    "promptContextI18n": {
      "en": "\"I drink water every day.\"",
      "ja": "「わたしは毎日水を飲みます。」"
    },
    "explanationI18n": {
      "en": "「わたし」 is the TOPIC of the sentence (what it's about), marked with 「は」. 「を」 marks the object of an action (already there: みずを); 「に」 marks a time or destination; 「で」 marks where an action happens.",
      "ja": "「わたし」はこの文の主題なので「は」。「を」は動作の対象（すでに「みずを」がある）、「に」は時点や行き先、「で」は動作の場所。"
    }
  },
  "pattern-starter-particles-002": {
    "hintI18n": {
      "en": "Saying one thing you do in the morning.",
      "ja": "朝にすることをひとつ言う。"
    },
    "promptContextI18n": {
      "en": "\"In the morning, (I) drink water.\"",
      "ja": "「朝、水を飲みます。」"
    },
    "explanationI18n": {
      "en": "「みず」 is the object of 「のみます」 (drink); objects take 「を」. 「が」 marks the doer of the action, and the water isn't doing the drinking; 「に」 marks a time or direction, 「へ」 direction only — none can mark what you drink.",
      "ja": "「みず」は「のみます」の対象なので「を」。「が」は動作をする側に付くが、水は飲む側ではない。「に」は時点や方向、「へ」は方向だけで、飲む対象には付かない。"
    }
  },
  "pattern-starter-particles-003": {
    "hintI18n": {
      "en": "Saying where you'll go tomorrow.",
      "ja": "あした行く場所を言う。"
    },
    "promptContextI18n": {
      "en": "\"Tomorrow (I'm) going to school.\"",
      "ja": "「あした、学校に行きます。」"
    },
    "explanationI18n": {
      "en": "The destination of 「いきます」 (go) takes 「に」. 「を」 marks an object; 「で」 marks where an action takes place (doing something AT a place), not where you're heading; 「と」 means \"together with someone\". ※「へ」 also works for direction; this item's options use 「に」.",
      "ja": "「いきます」の行き先は「に」。「を」は対象、「で」は動作の場所（〜で何かをする）で行き先ではない、「と」は「誰かと一緒に」。※方向は「へ」も使えるが、この問題の選択肢では「に」。"
    }
  },
  "pattern-starter-particles-004": {
    "hintI18n": {
      "en": "Asking which person is coming.",
      "ja": "来る予定の人をたずねる。"
    },
    "promptContextI18n": {
      "en": "\"Who is coming?\"",
      "ja": "「だれが来ますか。」"
    },
    "explanationI18n": {
      "en": "A question-word subject (だれ, なに) takes 「が」 — and remember: 「は」 can't go here, because 「は」 must attach to something both speakers already know, while \"who\" is exactly the unknown being asked. 「を」 marks an object, 「に」 a time or direction, 「で」 the place of an action — none fits the subject slot.",
      "ja": "疑問詞（だれ・なに）が主語のときは「が」。ついでに覚えておく：ここに「は」は使えない——「は」の前は双方すでに知っている話題でなければならず、「だれ」はまさに未知だから聞いている。「を」は対象、「に」は時点や方向、「で」は動作の場所で、主語の位置には入らない。"
    }
  },
  "pattern-starter-particles-005": {
    "hintI18n": {
      "en": "Telling the listener what you've spotted.",
      "ja": "見つけたものを相手に伝える。"
    },
    "promptContextI18n": {
      "en": "\"There's a dog over there.\"",
      "ja": "「そこに犬がいます。」"
    },
    "explanationI18n": {
      "en": "When stating that something EXISTS with 「います／あります」, the newly-introduced thing takes 「が」. 「を」 marks the object of an action, but 「います」 isn't an action; 「へ」 marks direction; 「いぬで います」 isn't a sentence — 「〜でいます」 only works in state expressions like 「元気でいます」.",
      "ja": "「います／あります」で「何かがある・いる」と初めて言うとき、その物には「が」。「を」は動作の対象だが「います」は動作ではない。「へ」は方向。「いぬで います」は文にならない——「〜でいます」は「元気でいます」のような状態の言い方だけ。"
    }
  },
  "pattern-starter-particles-006": {
    "hintI18n": {
      "en": "Talking about an evening activity.",
      "ja": "夜にすることについて話す。"
    },
    "promptContextI18n": {
      "en": "\"At night, (I) read books.\"",
      "ja": "「夜、本を読みます。」"
    },
    "explanationI18n": {
      "en": "「ほん」 is the object of 「よみます」 (read) → 「を」. 「が」 marks the doer of the action, and the book isn't doing anything; 「に」/「へ」 mark direction or time.",
      "ja": "「ほん」は「よみます」の対象なので「を」。「が」は動作をする側に付くが、本は動作しない。「に」「へ」は方向・時点。"
    }
  },
  "pattern-starter-particles-007": {
    "hintI18n": {
      "en": "Saying your plan for tomorrow.",
      "ja": "あした、おしゃべりする相手のことを言う。"
    },
    "promptContextI18n": {
      "en": "\"Tomorrow I'll talk with a friend.\"",
      "ja": "「あした、わたしは友だちと話します。」"
    },
    "explanationI18n": {
      "en": "The person you talk WITH takes 「と」 — chatting is mutual. The subject slot is already taken by 「わたしは」, so 「が」 can't fit; 「を」 can't mark the person you talk with — it marks what is spoken (にほんごを はなします \"speak Japanese\"); 「へ」 marks direction. ※「ともだちに はなします」 is also possible but feels one-directional (talking TO); this item's options use 「と」.",
      "ja": "「はなします」の相手は「と」——おしゃべりはお互いにするもの。主語はすでに「わたしは」なので「が」は入らない。「を」は話す相手には付かず、話す内容に付く（にほんごを はなします）。「へ」は方向。※「ともだちに はなします」も言えるが一方向に「話しかける」感じ。この問題の選択肢では「と」。"
    }
  },
  "pattern-starter-particles-008": {
    "hintI18n": {
      "en": "Saying where you eat.",
      "ja": "ごはんを食べる場所を言う。"
    },
    "promptContextI18n": {
      "en": "\"(I) eat meals at home.\"",
      "ja": "「家でごはんを食べます。」"
    },
    "explanationI18n": {
      "en": "The place where an ACTION happens takes 「で」 — eating at home is an action. 「に」 marks where something exists or a destination (いえに います、いえに かえります); with action verbs the location takes 「で」. This is the key に/で split.",
      "ja": "「動作をする場所」は「で」——家で「食べる」のは動作。「に」は存在の場所や行き先（いえに います、いえに かえります）。動作動詞の場所は「で」。に／で の一番大事な使い分け。"
    }
  },
  "pattern-n5-sonzai-001": {
    "hintI18n": {
      "en": "Telling the listener what's in the room.",
      "ja": "部屋に何がいるかを相手に伝える。"
    },
    "promptContextI18n": {
      "en": "\"There's a cat in the room.\"",
      "ja": "「部屋に猫がいます。」"
    },
    "explanationI18n": {
      "en": "「〜に 〜が います」 is the fixed existence pattern: the newly-introduced thing takes 「が」. 「を」 marks an action's object, but います isn't an action; 「へ」 marks direction; 「で」 marks where an ACTION happens and can't attach to existence. ※へや = room.",
      "ja": "「〜に 〜が います」は存在文の決まった形：初めて登場するものには「が」。「を」は動作の対象だが います は動作ではない。「へ」は方向。「で」は動作の場所で、存在の います には付かない。"
    }
  },
  "pattern-n5-sonzai-002": {
    "hintI18n": {
      "en": "Saying what's on the desk.",
      "ja": "机の上に何があるかを言う。"
    },
    "promptContextI18n": {
      "en": "\"There's a book on the desk.\"",
      "ja": "「机の上に本があります。」"
    },
    "explanationI18n": {
      "en": "Existence 「〜に 〜が あります」: the book is newly introduced, so 「が」. 「で」 marks the place of an action and doesn't fit 「あります」 (existence). ※つくえ = desk, うえ = top/on.",
      "ja": "存在文「〜に 〜が あります」：本は初めて登場するものなので「が」。「で」は動作の場所で、存在の「あります」には合わない。"
    }
  },
  "pattern-n5-sonzai-003": {
    "hintI18n": {
      "en": "Answering where the dog is.",
      "ja": "犬がどこにいるかを答える。"
    },
    "promptContextI18n": {
      "en": "\"The dog is in the yard.\"",
      "ja": "「犬は庭にいます。」"
    },
    "explanationI18n": {
      "en": "The place where something EXISTS takes 「に」 — the dog IS in the yard, it isn't DOING something there. 「で」 goes with action verbs (にわで あそびます); this is the key に/で split. ※にわ = yard.",
      "ja": "「存在する場所」は「に」——犬は庭に「いる」のであって、庭で何かを「する」のではない。「で」は動作動詞と使う（にわで あそびます）。に／で の一番大事な使い分け。"
    }
  },
  "pattern-n5-sonzai-004": {
    "hintI18n": {
      "en": "Saying who's in the classroom.",
      "ja": "教室に誰がいるかを言う。"
    },
    "promptContextI18n": {
      "en": "\"There are students in the classroom.\"",
      "ja": "「教室に学生がいます。」"
    },
    "explanationI18n": {
      "en": "Living, moving beings (people/animals) take 「います」; things and plants take 「あります」. Students are people → 「います」. ※きょうしつ = classroom, がくせい = student.",
      "ja": "生きて動くもの（人・動物）は「います」、物と植物は「あります」。学生は人 →「います」。"
    }
  },
  "pattern-n5-sonzai-005": {
    "hintI18n": {
      "en": "Saying what's inside the bag.",
      "ja": "かばんの中に何があるかを言う。"
    },
    "promptContextI18n": {
      "en": "\"There's a phone in the bag.\"",
      "ja": "「かばんの中に携帯があります。」"
    },
    "explanationI18n": {
      "en": "A phone is a thing (not alive), so existence uses 「あります」. 「います」 is reserved for people and animals. ※なか = inside.",
      "ja": "携帯は物（生きていない）ので、存在は「あります」。「います」は人と動物のためのもの。"
    }
  },
  "pattern-n5-sonzai-006": {
    "hintI18n": {
      "en": "Asking where the restroom is.",
      "ja": "トイレの場所をたずねる。"
    },
    "promptContextI18n": {
      "en": "\"Excuse me, where is the restroom?\"",
      "ja": "「すみません、トイレはどこにありますか。」"
    },
    "explanationI18n": {
      "en": "Asking \"where\" = asking about the place of existence, and places take 「に」. 「トイレは どこに ありますか」 is the set phrase for asking directions. 「へ」 marks direction, not a static location; 「を」 marks an object; the topic 「は」 already took 「が」's slot. ※トイレ = restroom.",
      "ja": "「どこにあるか」＝存在の場所を聞いている。場所は「に」。「トイレは どこに ありますか」は道をたずねる決まり文句。「へ」は方向で、静的な存在の場所には使わない。「を」は対象。主題の「は」があるので「が」は入らない。"
    }
  },
  "pattern-n5-sonzai-007": {
    "hintI18n": {
      "en": "Saying the cat isn't home right now (it went out).",
      "ja": "今、猫が家にいないことを言う（外に出ている）。"
    },
    "promptContextI18n": {
      "en": "\"The cat isn't home right now.\"",
      "ja": "「今、猫は家にいません。」"
    },
    "explanationI18n": {
      "en": "A cat is an animal → the negative of います, 「いません」. 「ありません」 negates things; 「いました」 is past, contradicting 「いま」 (now). The hint says the cat is out, so affirmative 「います」 is wrong too.",
      "ja": "猫は動物 → います の否定「いません」。「ありません」は物の否定。「いました」は過去で「いま」と矛盾。ヒントで猫はいないと言っているので肯定の「います」も違う。"
    }
  },
  "pattern-n5-sonzai-008": {
    "hintI18n": {
      "en": "Answering \"where's the book?\"",
      "ja": "「本はどこ？」に答える。"
    },
    "promptContextI18n": {
      "en": "\"The book is on the desk.\"",
      "ja": "「本は机の上にあります。」"
    },
    "explanationI18n": {
      "en": "This is the LOCATION sentence: known thing (ほんは) + place に + あります. A book is a thing → 「あります」. 「〜は 〜に あります」 answers where; 「〜に 〜が あります」 introduces existence — the two shapes are a pair. ※つくえ = desk, うえ = top/on.",
      "ja": "これは「所在文」：既知のもの（ほんは）＋場所に＋あります。本は物 →「あります」。「〜は 〜に あります」は場所を答える形、「〜に 〜が あります」は存在を紹介する形。二つでペア。"
    }
  },
  "pattern-n5-ichi-001": {
    "hintI18n": {
      "en": "Saying where the phone is: INSIDE the bag.",
      "ja": "携帯の場所を言う：かばんの「中」。"
    },
    "promptContextI18n": {
      "en": "\"The phone is inside the bag.\"",
      "ja": "「携帯はかばんの中にあります。」"
    },
    "explanationI18n": {
      "en": "Positions are said as 「noun + の + position word + に」: かばんの なかに = inside the bag. なか = inside, うえ = on/above, した = under, まえ = in front.",
      "ja": "位置は「名詞＋の＋位置のことば＋に」：かばんの なかに＝かばんの中。なか＝中、うえ＝上、した＝下、まえ＝前。"
    }
  },
  "pattern-n5-ichi-002": {
    "hintI18n": {
      "en": "Saying where the cat is: UNDER the desk.",
      "ja": "猫の場所を言う：机の「下」。"
    },
    "promptContextI18n": {
      "en": "\"The cat is under the desk.\"",
      "ja": "「猫は机の下にいます。」"
    },
    "explanationI18n": {
      "en": "した = under. 「つくえの したに」 = under the desk. 「つくえの なか」 refers to the inside of the desk's storage (drawers, where textbooks go), not the space beneath it; うしろ = behind. ※つくえ = desk.",
      "ja": "した＝下。「つくえの したに」＝机の下。「つくえの なか」は引き出しなど収納の内部（教科書をしまう所）で、机の下の空間ではない。うしろ＝後ろ。"
    }
  },
  "pattern-n5-ichi-003": {
    "hintI18n": {
      "en": "Saying where the book is: ON the desk.",
      "ja": "本の場所を言う：机の「上」。"
    },
    "promptContextI18n": {
      "en": "\"The book is on the desk.\"",
      "ja": "「本は机の上にあります。」"
    },
    "explanationI18n": {
      "en": "うえ = on/above. English says \"on the desk\" with a preposition; Japanese uses the structure 「noun + の + position word」: 「つくえの うえに」. Things on a surface always take うえ.",
      "ja": "うえ＝上。日本語は「名詞＋の＋位置のことば」の形で言う：「つくえの うえに」。面の上にある物はいつも うえ。"
    }
  },
  "pattern-n5-ichi-004": {
    "hintI18n": {
      "en": "Saying where the school is: IN FRONT OF the station.",
      "ja": "学校の場所を言う：駅の「前」。"
    },
    "promptContextI18n": {
      "en": "\"The school is in front of the station.\"",
      "ja": "「学校は駅の前にあります。」"
    },
    "explanationI18n": {
      "en": "まえ = in front, うしろ = behind. 「えきの まえ」 (in front of the station) is one of the most common ways to describe a location. ※えき = station.",
      "ja": "まえ＝前、うしろ＝後ろ。「えきの まえ」は場所の説明でいちばんよく使う言い方のひとつ。"
    }
  },
  "pattern-n5-ichi-005": {
    "hintI18n": {
      "en": "Saying where the restroom is: NEXT TO the room (adjacent).",
      "ja": "トイレの場所を言う：部屋の「隣」（すぐ横に並んで）。"
    },
    "promptContextI18n": {
      "en": "\"The restroom is next to the room.\"",
      "ja": "「トイレは部屋の隣にあります。」"
    },
    "explanationI18n": {
      "en": "となり = next to (adjacent, side by side). Japanese also has 「よこ」 (beside): となり stresses being adjacent in a row (next door), よこ just means to the side. ※トイレ = restroom, へや = room.",
      "ja": "となり＝隣（並んで隣接）。「よこ」も横の意味だが、となり は並んで隣り合うこと（隣室）、よこ は横の方向だけを言う。"
    }
  },
  "pattern-n5-ichi-006": {
    "hintI18n": {
      "en": "Saying where the bank is: BEHIND the supermarket.",
      "ja": "銀行の場所を言う：スーパーの「後ろ」。"
    },
    "promptContextI18n": {
      "en": "\"The bank is behind the supermarket.\"",
      "ja": "「銀行はスーパーの後ろにあります。」"
    },
    "explanationI18n": {
      "en": "うしろ = behind. まえ/うしろ come as a pair and are the staple of giving directions. ※ぎんこう = bank, スーパー = supermarket.",
      "ja": "うしろ＝後ろ。まえ／うしろ はペアで、道案内の定番。"
    }
  },
  "pattern-n5-ichi-007": {
    "hintI18n": {
      "en": "Saying the book in your own hand is yours.",
      "ja": "自分の手にある本が自分のものだと言う。"
    },
    "promptContextI18n": {
      "en": "\"(Looking at the book in my hand) This book is mine.\"",
      "ja": "「（自分の手にある本を見て）この本はわたしのです。」"
    },
    "explanationI18n": {
      "en": "「この + noun」 = near me. これ stands alone (これは ほんです); この must be followed by a noun (この ほん). In my own hand → この. ※て = hand.",
      "ja": "「この＋名詞」＝自分の近く。これ は単独で使い（これは ほんです）、この の後ろには必ず名詞（この ほん）。自分の手の中 → この。"
    }
  },
  "pattern-n5-ichi-008": {
    "hintI18n": {
      "en": "Asking if the umbrella in the listener's hand is theirs.",
      "ja": "相手の手にある傘が相手のものかをたずねる。"
    },
    "promptContextI18n": {
      "en": "\"(Looking at the umbrella in your hand) Is that umbrella yours?\"",
      "ja": "「（相手の手にある傘を見て）その傘はあなたのですか。」"
    },
    "explanationI18n": {
      "en": "「その + noun」 = near the listener. The umbrella is in their hand → その. あの = far from both; どの = which (question). ※かさ = umbrella, あいて = the other person.",
      "ja": "「その＋名詞」＝相手の近く。傘は相手の手の中 → その。あの＝どちらからも遠い、どの＝疑問。"
    }
  },
  "pattern-n5-joshi2-001": {
    "hintI18n": { "en": "Saying which city you're going to tomorrow.", "ja": "あした行く都市を言う。" },
    "promptContextI18n": { "en": "\"Tomorrow I'm going to Tokyo.\"", "ja": "「あした、東京へ行きます。」" },
    "explanationI18n": {
      "en": "Direction of movement takes 「へ」 (read e). 「に」 also works for direction — へ stresses the heading, に the arrival point; this item's options use 「へ」. 「を」 marks an object; 「と」 means \"with someone\". ※とうきょう = Tokyo.",
      "ja": "移動の方向は「へ」（e と読む）。方向は「に」も使える——へ は「向かう方向」、に は「到達点」の感じ。この問題の選択肢では「へ」。「を」は対象、「と」は「誰かと」。"
    }
  },
  "pattern-n5-joshi2-002": {
    "hintI18n": { "en": "Saying how you get to school.", "ja": "学校までどうやって行くかを言う。" },
    "promptContextI18n": { "en": "\"I go to school by bus.\"", "ja": "「バスで学校へ行きます。」" },
    "explanationI18n": {
      "en": "Transport and means take 「で」: バスで = by bus. 「に」 doesn't fit here (バスに のります \"board the bus\" is the に usage); direction is already covered by 「がっこうへ」. ※バス = bus.",
      "ja": "乗り物・手段は「で」：バスで。「に」はここでは合わない（バスに のります〈乗車〉が に の使い方）。方向はすでに「がっこうへ」がある。"
    }
  },
  "pattern-n5-joshi2-003": {
    "hintI18n": { "en": "Saying what you eat with.", "ja": "何を使ってごはんを食べるかを言う。" },
    "promptContextI18n": { "en": "\"I eat with chopsticks.\"", "ja": "「はしでごはんを食べます。」" },
    "explanationI18n": {
      "en": "Tools take 「で」: はしで = with chopsticks. The object 「ごはんを」 is already in the sentence; 「に」 marks a time or arrival point and 「へ」 only direction — neither can mark a tool. ※はし = chopsticks.",
      "ja": "道具は「で」：はしで。対象の「ごはんを」はもう文の中にある。「に」は時点や到達点、「へ」は方向だけで、道具には付かない。"
    }
  },
  "pattern-n5-joshi2-004": {
    "hintI18n": { "en": "Listing the two things you bought yesterday (the full list).", "ja": "きのう買った二つの物を言う（全部で二つ）。" },
    "promptContextI18n": { "en": "\"Yesterday I bought bread and eggs.\"", "ja": "「きのう、パンとたまごを買いました。」" },
    "explanationI18n": {
      "en": "\"And\" that lists EVERYTHING takes 「と」: パンと たまご = bread and eggs (that's all). If you're only giving examples (there's more), use 「や」. 「を」 already follows たまご. ※パン = bread, たまご = egg.",
      "ja": "名詞を「全部」挙げる「と」：パンと たまご（それで全部）。例を挙げるだけ（ほかにもある）なら「や」。「を」はもう たまご の後ろにある。"
    }
  },
  "pattern-n5-joshi2-005": {
    "hintI18n": { "en": "Naming some of the things in the bag (not an exhaustive list).", "ja": "かばんの中の物をいくつか言う（全部ではない）。" },
    "promptContextI18n": { "en": "\"There are books, pens and so on in the bag.\"", "ja": "「かばんの中に本やペンなどがあります。」" },
    "explanationI18n": {
      "en": "Giving examples while implying there's more takes 「や」, usually paired with sentence-final 「など」 (and so on): ほんや ペンなど. A complete list uses 「と」 (which doesn't pair with など). ※ペン = pen.",
      "ja": "「例をいくつか挙げて、ほかにもあると匂わせる」のが「や」。文末の「など」とよくペアになる：ほんや ペンなど。全部言い切るなら「と」（など とはペアにならない）。"
    }
  },
  "pattern-n5-joshi2-006": {
    "hintI18n": { "en": "Asking the price of all of them together.", "ja": "全部あわせた値段を聞く。" },
    "promptContextI18n": { "en": "\"How much are the apples altogether?\"", "ja": "「りんごは全部でいくらですか。」" },
    "explanationI18n": {
      "en": "Totals take 「で」: ぜんぶで いくら = how much all together. Neither 「を」, 「に」 nor 「も」 can turn ぜんぶ into a totalling unit. ※りんご = apple, ぜんぶ = all.",
      "ja": "合計は「で」：ぜんぶで いくら。「を」「に」「も」では「ぜんぶ」を合計の単位にできない。"
    }
  },
  "pattern-n5-joshi2-007": {
    "hintI18n": { "en": "Saying where you study.", "ja": "どこで勉強するかを言う。" },
    "promptContextI18n": { "en": "\"I study at the library.\"", "ja": "「図書館で勉強します。」" },
    "explanationI18n": {
      "en": "\"Doing an action somewhere\" takes 「で」 — studying is an action. 「へ」 is for heading somewhere (としょかんへ いきます); 「が」 would make the library the one studying, which is nonsense. ※としょかん = library, べんきょうします = to study.",
      "ja": "「ある場所で動作する」は「で」——勉強は動作。「へ」はどこかへ向かうとき（としょかんへ いきます）。「が」だと図書館が勉強する主語になってしまう。"
    }
  },
  "pattern-n5-joshi2-008": {
    "hintI18n": { "en": "Saying where you're going with a friend on Sunday.", "ja": "日曜日に友だちとどこへ行くかを言う。" },
    "promptContextI18n": { "en": "\"On Sunday I'm going to the park with a friend.\"", "ja": "「日曜日、友だちと公園へ行きます。」" },
    "explanationI18n": {
      "en": "Direction of movement takes 「へ」. 「で」 marks where an action happens — こうえんで あそびます (play AT the park); going TO the park is movement. ※にちようび = Sunday, こうえん = park.",
      "ja": "移動の方向は「へ」。「で」は動作の場所——こうえんで あそびます なら で。公園へ「行く」のは移動。"
    }
  },
  "pattern-n5-joshi3-001": {
    "hintI18n": { "en": "Saying whose bag this is.", "ja": "このかばんが誰のものかを言う。" },
    "promptContextI18n": { "en": "\"This is my bag.\"", "ja": "「これはわたしのかばんです。」" },
    "explanationI18n": {
      "en": "Possession links with 「の」: わたしの かばん = my bag. 「は」/「が」 mark topics/subjects and would break the phrase; 「を」 marks an action's object.",
      "ja": "所有は「の」でつなぐ：わたしの かばん。「は」「が」は主題／主語に付くもので、ここに入れると文が壊れる。「を」は動作の対象。"
    }
  },
  "pattern-n5-joshi3-002": {
    "hintI18n": { "en": "Answering whose pen it is (without repeating \"pen\").", "ja": "ペンの持ち主を答える（「ペン」を繰り返さずに）。" },
    "promptContextI18n": { "en": "\"Whose pen is this?\" \"It's Tanaka's.\"", "ja": "「これは誰のペンですか。」「田中さんのです。」" },
    "explanationI18n": {
      "en": "「の」 can stand in for a noun already mentioned: たなかさんの（です） = Tanaka's (pen) — no need to say ペン again. This is の's stand-in usage. ※ペン = pen.",
      "ja": "「の」は前に出た名詞の代わりになれる：たなかさんの（です）＝田中さんの〈ペン〉。「ペン」をもう一度言わなくていい。の の「代用」の使い方。"
    }
  },
  "pattern-n5-joshi3-003": {
    "hintI18n": { "en": "Going on to introduce your younger brother.", "ja": "続けて弟の身分を紹介する。" },
    "promptContextI18n": { "en": "\"I'm a student. My brother is a student too.\"", "ja": "「わたしは学生です。弟も学生です。」" },
    "explanationI18n": {
      "en": "\"Too/also\" takes 「も」: the previous sentence said I'm a student, and the brother is one TOO → おとうとも. 「も」 replaces は/が directly; 「に」/「を」/「へ」 can't fill the subject slot. ※おとうと = younger brother.",
      "ja": "「〜も」は「も」：前の文で自分が学生だと言い、弟「も」そうだ → おとうとも。「も」は は/が の位置をそのまま置き換える。「に」「を」「へ」は主語の位置に入らない。"
    }
  },
  "pattern-n5-joshi3-004": {
    "hintI18n": { "en": "Saying there's not a single person in the classroom.", "ja": "教室に誰一人いないことを言う。" },
    "promptContextI18n": { "en": "\"There's no one in the classroom.\"", "ja": "「教室に誰もいません。」" },
    "explanationI18n": {
      "en": "Question word + 「も」 + negative = total negation: だれも いません (no one's there), なにも ありません (there's nothing). This sentence STATES that nobody is there, so だれも + negative; 「だれか」 (someone) belongs to other shapes like だれか いませんか?",
      "ja": "「疑問詞＋も＋否定」＝全否定：だれも いません、なにも ありません。この文は「誰もいない」と述べているので だれも＋否定。「だれか」は だれか いませんか？ のような別の形で使う。"
    }
  },
  "pattern-n5-joshi3-005": {
    "hintI18n": { "en": "Asking the listener to pick one of two.", "ja": "相手に二つから一つ選んでもらう。" },
    "promptContextI18n": { "en": "\"Coffee or tea — which would you like?\"", "ja": "「コーヒーかお茶、どちらがいいですか。」" },
    "explanationI18n": {
      "en": "\"A or B (pick one)\" takes 「か」: コーヒーか おちゃ. 「や」 gives examples (implying more), which contradicts 「どちら」 (which of the two). ※コーヒー = coffee, おちゃ = tea.",
      "ja": "「AかB（二択）」は「か」：コーヒーか おちゃ。「や」は例を挙げる言い方（ほかにもある）なので、「どちら（二つのうちどれ）」と矛盾する。"
    }
  },
  "pattern-n5-joshi3-006": {
    "hintI18n": { "en": "Saying the school's opening hours.", "ja": "学校の始まりと終わりの時間を言う。" },
    "promptContextI18n": { "en": "\"School runs from 9 to 3.\"", "ja": "「学校は9時から3時までです。」" },
    "explanationI18n": {
      "en": "\"From ~ to ~\" = 「〜から〜まで」: ９じから ３じまで. から marks the start, まで the end — まで is already at the end of the sentence, so the blank is the start. ※〜じ = ~ o'clock.",
      "ja": "「〜から〜まで」：９じから ３じまで。起点が から、終点が まで——文末にもう まで があるので、空欄は起点。"
    }
  },
  "pattern-n5-joshi3-007": {
    "hintI18n": { "en": "Saying where the walk starts and ends.", "ja": "歩く区間の始まりと終わりを言う。" },
    "promptContextI18n": { "en": "\"I walk from home to the station.\"", "ja": "「家から駅まで歩きます。」" },
    "explanationI18n": {
      "en": "「〜から〜まで」 works for places too: いえから えきまで = from home to the station. 「で」 marks where an action happens (not a start point); the 「を」 of passage (みちを あるきます) marks the path walked, not the origin. ※あるきます = to walk.",
      "ja": "「〜から〜まで」は場所にも使う：いえから えきまで。「で」は動作の場所（起点ではない）。通過の「を」（みちを あるきます）は歩く道に付くもので、起点には付かない。"
    }
  },
  "pattern-n5-joshi3-008": {
    "hintI18n": { "en": "Saying there's one student in the classroom and no one else.", "ja": "教室に学生が一人いて、ほかには誰もいないと言う。" },
    "promptContextI18n": { "en": "\"There's only one student in the classroom.\"", "ja": "「教室に学生が一人だけいます。」" },
    "explanationI18n": {
      "en": "\"Only\" takes 「だけ」: ひとりだけ = just one person. 「ひとりも」 demands a negative (ひとりも いません = not a single person), contradicting the affirmative 「います」. ※ひとり = one person.",
      "ja": "「〜だけ」：ひとりだけ。「ひとりも」は否定とセット（ひとりも いません）なので、肯定の「います」と矛盾する。"
    }
  },
  "pattern-n5-hikaku-001": {
    "hintI18n": { "en": "Talking about the price difference between the bus and the train.", "ja": "バスと電車の値段の違いの話。" },
    "promptContextI18n": { "en": "\"The bus is cheaper than the train.\"", "ja": "「バスは電車より安いです。」" },
    "explanationI18n": {
      "en": "「AはBより〜」 = A is more ~ than B: the standard of comparison (the train) takes 「より」. 「が」 and 「を」 mark subjects/objects and 「の」 is possessive — none of them build a comparison. ※バス = bus.",
      "ja": "「AはBより〜」：比較の基準（電車）の後ろに「より」。「が」「を」は主語・対象のマーカー、「の」は所有で、どれも比較の文は作れない。"
    }
  },
  "pattern-n5-hikaku-002": {
    "hintI18n": { "en": "Saying the train is the faster of the two.", "ja": "二つの乗り物のうち、速いのは電車だと言う。" },
    "promptContextI18n": { "en": "\"The train is faster.\"", "ja": "「電車のほうが速いです。」" },
    "explanationI18n": {
      "en": "「〜のほうが〜」 = ~ is more ~: 「ほう」 (that side / one of two) is always followed by 「が」. 「を」「に」「で」 can't attach to this pattern. ※はやい = fast.",
      "ja": "「〜のほうが〜」：「ほう（一方）」の後ろは「が」で固定。「を」「に」「で」はこの文型につながらない。"
    }
  },
  "pattern-n5-hikaku-003": {
    "hintI18n": { "en": "Asking about the listener's drink preference.", "ja": "相手に飲み物の好みを尋ねる。" },
    "promptContextI18n": { "en": "\"Coffee or tea — which do you like better?\"", "ja": "「コーヒーとお茶と、どちらが好きですか。」" },
    "explanationI18n": {
      "en": "A question word (どちら, だれ, なに) as subject takes 「が」 — 「は」 marks an already-known topic, and \"which one\" is exactly the unknown being asked, so this neutral question doesn't use 「は」. The object of すき is also fixed as が. 「で」 and 「の」 make no sentence here.",
      "ja": "疑問詞（どちら、だれ、なに）が主語のときは「が」。「は」の前は既知の話題が来るもので、「どちら」はまさに尋ねたい未知——だからこの中立の質問に「は」は使わない。すき の対象も が で固定。「で」「の」はここでは文にならない。"
    }
  },
  "pattern-n5-hikaku-004": {
    "hintI18n": { "en": "Answering which of the two you prefer.", "ja": "二つから自分の好みを答える。" },
    "promptContextI18n": { "en": "\"Which do you like better?\" \"I prefer tea.\"", "ja": "「どちらが好きですか。」「お茶のほうが好きです。」" },
    "explanationI18n": {
      "en": "Answering with 「〜のほうが」: the noun links to 「ほう」 with 「の」 — おちゃの ほうが. 「が」 only appears after ほう; putting 「を」 or 「と」 here breaks the sentence.",
      "ja": "「〜のほうが」で答える：名詞と「ほう」は「の」でつなぐ——おちゃの ほうが。「が」は ほう の後ろに来るもので、「を」「と」をここに置くと文が壊れる。"
    }
  },
  "pattern-n5-hikaku-005": {
    "hintI18n": { "en": "Naming your favorite among all sports.", "ja": "いちばん好きなスポーツを言う。" },
    "promptContextI18n": { "en": "\"Among sports, I like soccer the best.\"", "ja": "「スポーツの中でサッカーがいちばん好きです。」" },
    "explanationI18n": {
      "en": "The superlative's range takes 「で」: 「〜のなかで 〜が いちばん〜」 = the most ~ within ~. 「に」 marks time/place and 「を」 marks objects; 「が」 already sits after サッカー. ※スポーツ = sports, サッカー = soccer.",
      "ja": "最上級の範囲は「で」：「〜のなかで 〜が いちばん〜」。「に」は時間・場所、「を」は対象。「が」はもう サッカー の後ろにある。"
    }
  },
  "pattern-n5-hikaku-006": {
    "hintI18n": { "en": "Saying who is the tallest in the class.", "ja": "いちばん背が高い人はだれかを言う。" },
    "promptContextI18n": { "en": "\"Tanaka is the tallest in the class.\"", "ja": "「クラスで田中さんがいちばん背が高いです。」" },
    "explanationI18n": {
      "en": "「(range)で いちばん〜」: クラスで = within the class. 「に」 and 「へ」 mark location/direction, 「を」 marks objects — none of them mean \"comparing within a range\". ※クラス = class, せ = height.",
      "ja": "「（範囲）で いちばん〜」：クラスで＝クラスという範囲の中で。「に」「へ」は場所・方向、「を」は対象で、「範囲の中での比較」の意味にならない。"
    }
  },
  "pattern-n5-hikaku-007": {
    "hintI18n": { "en": "Talking about the temperature difference between today and yesterday.", "ja": "今日と昨日の気温の違いの話。" },
    "promptContextI18n": { "en": "\"Today is colder than yesterday.\"", "ja": "「今日は昨日より寒いです。」" },
    "explanationI18n": {
      "en": "The standard of comparison takes 「より」: きのうより = than yesterday. 「ほど」 also follows a standard but demands a negative (きのうほど さむくない = not as cold as yesterday), contradicting the affirmative さむいです.",
      "ja": "比較の基準には「より」：きのうより。「ほど」も基準に付くが必ず否定とセット（きのうほど さむくない）なので、文末の肯定「さむいです」と矛盾する。"
    }
  },
  "pattern-n5-hikaku-008": {
    "hintI18n": { "en": "Offering two fruits and asking the listener to pick one.", "ja": "二つの果物から一つ選んでもらう。" },
    "promptContextI18n": { "en": "\"An apple or a mandarin — which do you like?\"", "ja": "「りんごとみかんと、どちらが好きですか。」" },
    "explanationI18n": {
      "en": "「AとBと」 lays out exactly two options, so the pick-one-of-two question word is 「どちら」. 「なに」 (what) is open-ended, contradicting the two listed choices; だれ asks about people, どこ about places. ※みかん = mandarin orange.",
      "ja": "「AとBと」は選択肢が二つだと明示しているので、二択の疑問詞は「どちら」。「なに」はオープンな聞き方で、挙げた二つと矛盾。だれ は人、どこ は場所。"
    }
  },
  "pattern-n5-suki-dekiru-001": {
    "hintI18n": { "en": "Saying how you feel about cats.", "ja": "猫への気持ちを言う。" },
    "promptContextI18n": { "en": "\"I like cats.\"", "ja": "「私は猫が好きです。」" },
    "explanationI18n": {
      "en": "The object of 「すき／きらい」 takes 「が」: ねこが すきです. Instinct from English or Chinese reaches for a direct object (を), but Japanese marks what you like with が — one of N5's most important switches. 「に」「へ」「と」 don't attach here.",
      "ja": "「すき／きらい」の対象は「が」：ねこが すきです。中国語や英語の感覚では を を使いたくなるが、日本語では好きな対象を が で標示する——N5 でいちばん大事な切り替えのひとつ。「に」「へ」「と」はつながらない。"
    }
  },
  "pattern-n5-suki-dekiru-002": {
    "hintI18n": { "en": "Saying your little brother plays soccer very well.", "ja": "弟はサッカーがうまいと言う。" },
    "promptContextI18n": { "en": "\"My little brother is good at soccer.\"", "ja": "「弟はサッカーが上手です。」" },
    "explanationI18n": {
      "en": "\"Good at\" is 「じょうず」: サッカーが じょうずです. 「へた」 = bad at and 「きらい」 = dislike — the hint says he plays well, so both point the wrong way; 「たかい」 (tall/expensive) doesn't fit. ※じょうず = good at, へた = bad at.",
      "ja": "「上手」は じょうず：サッカーが じょうずです。「へた」は不得意、「きらい」は嫌い——ヒントは「うまい」と言っているので方向が逆。「たかい」は高いでつながらない。"
    }
  },
  "pattern-n5-suki-dekiru-003": {
    "hintI18n": { "en": "Asking whether the listener understands Japanese.", "ja": "相手の日本語の理解を尋ねる。" },
    "promptContextI18n": { "en": "\"Do you understand Japanese?\"", "ja": "「日本語がわかりますか。」" },
    "explanationI18n": {
      "en": "The object of 「わかる」 (understand) takes 「が」: にほんごが わかります. \"Understand Japanese\" tempts you toward 「を」, but わかる is fixed with 「が」 — same family as すき and できる. ※にほんご = Japanese (the language).",
      "ja": "「わかる」の対象は「が」：にほんごが わかります。「日本語を」と言いたくなるが、わかる は が で固定——すき、できる と同じ仲間。"
    }
  },
  "pattern-n5-suki-dekiru-004": {
    "hintI18n": { "en": "Saying Tanaka can cook.", "ja": "田中さんの料理の腕の話。" },
    "promptContextI18n": { "en": "\"Tanaka can cook.\"", "ja": "「田中さんは料理ができます。」" },
    "explanationI18n": {
      "en": "The object of 「できる」 (can) also takes 「が」: りょうりが できます. 「を」 marks the object of an action verb, but できる states an ability — the family rule is が. ※りょうり = cooking.",
      "ja": "「できる」の対象も「が」：りょうりが できます。「を」は動作動詞の対象マーカーだが、できる は能力の叙述なので、この仲間のルールどおり が。"
    }
  },
  "pattern-n5-suki-dekiru-005": {
    "hintI18n": { "en": "Saying you can swim.", "ja": "泳げると言う。" },
    "promptContextI18n": { "en": "\"I can swim.\"", "ja": "「私は泳ぐことができます。」" },
    "explanationI18n": {
      "en": "\"Can do ~\" = dictionary form + 「ことが できる」: およぐ ことが できます. The verb is first turned into a noun with 「こと」, then takes 「が できる」. ※およぐ = to swim.",
      "ja": "「辞書形＋ことが できる」＝〜できる：およぐ ことが できます。動詞をまず「こと」で名詞化してから「が できる」につなぐ。"
    }
  },
  "pattern-n5-suki-dekiru-006": {
    "hintI18n": { "en": "Saying your big brother isn't much of a singer.", "ja": "兄の歌はうまくないと言う。" },
    "promptContextI18n": { "en": "\"My big brother is bad at singing.\"", "ja": "「兄は歌が下手です。」" },
    "explanationI18n": {
      "en": "「へた」 (bad at), like じょうず, takes 「が」 for its object: うたが へたです. 「の」 is possessive; 「へ」 and 「と」 mark direction/accompaniment — none attach here. ※あに = (my) older brother, うた = song.",
      "ja": "「へた」も じょうず と同じく対象は「が」：うたが へたです。「の」は所有、「へ」「と」は方向・同伴で、どれもつながらない。"
    }
  },
  "pattern-n5-suki-dekiru-007": {
    "hintI18n": { "en": "Asking whether Kenji can read kanji.", "ja": "健二さんの漢字力を尋ねる。" },
    "promptContextI18n": { "en": "\"Can Kenji read kanji?\"", "ja": "「健二さんは漢字を読むことができますか。」" },
    "explanationI18n": {
      "en": "The whole action 「かんじを よむ こと」 (the act of reading kanji) is the object of できる → takes 「が」. The 「かんじを」 inside belongs to よむ — a different slot; each does its own job. ※かんじ = kanji.",
      "ja": "「かんじを よむ こと（漢字を読むという行為）」全体が できる の対象 →「が」。文中の「かんじを」は よむ の対象で、置き場所が違う——それぞれ別の仕事。"
    }
  },
  "pattern-n5-suki-dekiru-008": {
    "hintI18n": { "en": "Adding that you feel the same about cats as about dogs.", "ja": "犬と同じ気持ちを、続けて猫について言う。" },
    "promptContextI18n": { "en": "\"I like dogs. I like cats too.\"", "ja": "「私は犬が好きです。猫も好きです。」" },
    "explanationI18n": {
      "en": "The previous sentence says you like dogs, and you \"also\" like cats → 「も」 takes over the が slot: ねこも すきです. This is the も from Particles III, revisited in a likes sentence.",
      "ja": "前の文で犬が好きだと言い、猫「も」好き →「も」が が の位置をそのまま引き継ぐ：ねこも すきです。助詞IIIで学んだ も を、好きの文で復習。"
    }
  },
  "pattern-n5-sasoi-001": {
    "hintI18n": { "en": "Reaching out about lunch together.", "ja": "一緒に昼ご飯をと、相手に声をかける。" },
    "promptContextI18n": { "en": "\"Won't you have lunch together?\" \"Sounds good — let's eat.\"", "ja": "「一緒に昼ご飯を食べませんか。」「いいですね。食べましょう。」" },
    "explanationI18n": {
      "en": "Inviting with a question uses 「ませんか」 = won't you ~? — it leaves the decision with the listener, who accepts with 「ましょう」 (that's exactly the reply 「いいですね。たべましょう」). 「ました」「ません」「ませんでした」 are plain past/negative statements — none fit an invitation dialogue. ※いっしょに = together, ひるごはん = lunch.",
      "ja": "疑問で誘うのが「ませんか」——決定権を相手に渡し、相手は「ましょう」で受ける（返事の「いいですね。たべましょう」がまさにそれ）。「ました」「ません」「ませんでした」は過去/否定のただの叙述で、誘いの対話につながらない。"
    }
  },
  "pattern-n5-sasoi-002": {
    "hintI18n": { "en": "You've been invited — say yes.", "ja": "誘われた側。OKの返事をする。" },
    "promptContextI18n": { "en": "\"Want to see a movie tomorrow?\" \"Sounds good — let's watch it.\"", "ja": "「明日映画を見ませんか。」「いいですね。見ましょう。」" },
    "explanationI18n": {
      "en": "Accepting an invitation uses 「ましょう」: いいですね、みましょう. 「ませんか」 is how the inviter asks — the accepter doesn't ask back; 「みません」 is a refusal, contradicting 「いいですね」; 「みました」 is past. ※えいが = movie.",
      "ja": "誘いを受けるときは「ましょう」：いいですね、みましょう。「ませんか」は誘う側の聞き方で、受ける側は聞き返さない。「みません」は断りで「いいですね」と矛盾、「みました」は過去形。"
    }
  },
  "pattern-n5-sasoi-003": {
    "hintI18n": { "en": "Their bag looks heavy — offer to help.", "ja": "相手の荷物が重そう。こちらから手を貸すと言い出す。" },
    "promptContextI18n": { "en": "\"That luggage looks heavy — shall I carry half?\"", "ja": "「荷物が重いですね。私が半分持ちましょうか。」" },
    "explanationI18n": {
      "en": "Offering to help uses 「ましょうか」 = shall I ~?: わたしが はんぶん もちましょうか. 「ませんか」 would invite the OTHER person to do it, clashing with わたしが (I'll do it) in the sentence; 「ました」「ません」 are past/negative — not offers. ※にもつ = luggage, おもい = heavy, はんぶん = half, もちます = to carry.",
      "ja": "手伝いの申し出は「ましょうか」：わたしが はんぶん もちましょうか。「ませんか」は相手にやってもらう誘い方で、文中の わたしが と衝突する。「ました」「ません」は過去/否定で、申し出にならない。"
    }
  },
  "pattern-n5-sasoi-004": {
    "hintI18n": { "en": "Saying what you're going to the department store for.", "ja": "デパートへ行って何をするかを言う。" },
    "promptContextI18n": { "en": "\"I'm going to the department store to buy a bag.\"", "ja": "「デパートへかばんを買いに行きます。」" },
    "explanationI18n": {
      "en": "ます-stem + 「に いきます」 = go to do something: かいます → かい + に いきます = go to buy. 「を」 is already used in かばんを; 「で」 and 「へ」 can't follow a verb stem. ※デパート = department store.",
      "ja": "ます形の語幹＋「に いきます」＝〜しに行く：かいます→かい＋に いきます。「を」はすでに かばんを で使っている。「で」「へ」は動詞の語幹には付かない。"
    }
  },
  "pattern-n5-sasoi-005": {
    "hintI18n": { "en": "Saying what tonight's restaurant trip is for.", "ja": "レストランへ行って何をするかを言う。" },
    "promptContextI18n": { "en": "\"I'm going to a restaurant to eat dinner.\"", "ja": "「レストランへ晩ご飯を食べに行きます。」" },
    "explanationI18n": {
      "en": "What attaches to 「に いきます」 is the ます-stem: たべます → たべ + に. 「たべるに」「たべたに」「たべてに」 are all wrong attachments — the dictionary, た, and て forms can't take the purpose に directly. ※レストラン = restaurant, ばんごはん = dinner.",
      "ja": "「に いきます」に付くのは ます形の語幹：たべます→たべ＋に。「たべるに」「たべたに」「たべてに」はどれも誤り——辞書形・た形・て形は目的の に に直接つながらない。"
    }
  },
  "pattern-n5-sasoi-006": {
    "hintI18n": { "en": "Tomorrow doesn't work for them — float another day.", "ja": "明日はだめそうなので、別の日を出してみる。" },
    "promptContextI18n": { "en": "\"Tomorrow's a bit...\" \"Then how about Saturday?\"", "ja": "「明日はちょっと……。」「じゃあ、土曜日はどうですか。」" },
    "explanationI18n": {
      "en": "Suggesting and asking an opinion uses 「〜は どうですか」 = how about ~?: じゃあ、どようびは どうですか. 「を」「へ」「の」 don't connect to どうですか. ※どようび = Saturday; 「〜は ちょっと……」 is the set phrase for a soft refusal.",
      "ja": "提案して意見を聞くのは「〜は どうですか」：じゃあ、どようびは どうですか。「を」「へ」「の」は どうですか につながらない。「〜は ちょっと……」はやんわり断る定型表現。"
    }
  },
  "pattern-n5-sasoi-007": {
    "hintI18n": { "en": "Saying what your friend came over to do yesterday.", "ja": "昨日、友だちが家に来て何をしたかを言う。" },
    "promptContextI18n": { "en": "\"Yesterday a friend came over to hang out.\"", "ja": "「昨日、友だちがうちへ遊びに来ました。」" },
    "explanationI18n": {
      "en": "「Vに きます」 = come to do something: あそびに きました = came over to hang out. Same pattern as 「かいに いきます」 — go and come both take ます-stem + に. 「を」「と」「へ」 can't follow the stem. ※あそびます = to play / hang out, うち = home (colloquial).",
      "ja": "「Vに きます」＝〜しに来る：あそびに きました。「かいに いきます」と同じ文型で、行く/来る どちらも ます形の語幹＋に。「を」「と」「へ」は語幹につながらない。"
    }
  },
  "pattern-n5-sasoi-008": {
    "hintI18n": { "en": "The room is stuffy — offer to get some air moving.", "ja": "部屋の空気がこもっているので、風を通そうと言い出す。" },
    "promptContextI18n": { "en": "\"The air in here is stale. Shall I open the window?\"", "ja": "「部屋の空気が悪いですね。窓を開けましょうか。」" },
    "explanationI18n": {
      "en": "Offering to act uses 「ましょうか」: stale air means you'd OPEN the window → あけましょうか. 「しめましょうか」 (shall I close it?) would only make it stuffier; 「あけません」 = won't open; 「しめました」 is past and the wrong direction too. ※へや = room, くうき = air, まど = window, あけます = to open, しめます = to close.",
      "ja": "自分から動く申し出は「ましょうか」：空気がこもっているなら窓を「開ける」→あけましょうか。「しめましょうか」はもっとこもる逆方向、「あけません」は「開けない」、「しめました」は過去のうえ逆方向。"
    }
  },
  "pattern-n5-onegai-001": {
    "hintI18n": { "en": "At the fruit shop, asking for three apples.", "ja": "果物屋で、りんごを三つ買うと店の人に言う。" },
    "promptContextI18n": { "en": "\"Excuse me, three of these apples, please.\"", "ja": "「すみません、このりんごを三つください。」" },
    "explanationI18n": {
      "en": "Shopping and ordering use 「Nを (quantity) ください」 = please give me ~: りんごを みっつ ください. The counter (みっつ) goes right before ください with no particle. 「あります」「います」 are incompatible with 「を」 (you'd say りんごが あります); 「でした」 is a past-tense statement — not how you ask for something. ※みっつ = three (things).",
      "ja": "買い物・注文は「Nを（数量）ください」：りんごを みっつ ください。数量詞（みっつ）は助詞なしで ください の直前。「あります」「います」は「を」と両立しない（りんごが あります）。「でした」は過去の断定で、買い物の頼み方にならない。"
    }
  },
  "pattern-n5-onegai-002": {
    "hintI18n": { "en": "Saying you want new shoes.", "ja": "新しい靴を手に入れたい、という気持ちを言う。" },
    "promptContextI18n": { "en": "\"I want new shoes.\"", "ja": "「新しい靴がほしいです。」" },
    "explanationI18n": {
      "en": "「〜が ほしい」 = to want ~: the object takes 「が」 — くつが ほしいです. Same が-family as すき, じょうず, and できる. 「の」「に」「へ」 don't attach. ※くつ = shoes.",
      "ja": "「〜が ほしい」：対象は「が」——くつが ほしいです。すき、じょうず、できる と同じ が の仲間。「の」「に」「へ」はつながらない。"
    }
  },
  "pattern-n5-onegai-003": {
    "hintI18n": { "en": "Telling someone with a fever to get to bed early.", "ja": "熱がある人に、今日は早く休むよう言い聞かせる。" },
    "promptContextI18n": { "en": "\"You have a fever — you'd better go to bed early today.\"", "ja": "「熱がありますから、今日は早く寝たほうがいいです。」" },
    "explanationI18n": {
      "en": "Advice uses た-form + 「ほうがいいです」 = you'd better ~: ねた ほうがいいです. 「ないほうがいい」 advises against and 「てはいけません」 forbids — banning sleep with a fever points entirely the wrong way; 「なくてもいい」 waives necessity, also clashing with urging someone to rest. ※ねつ = fever.",
      "ja": "アドバイスは た形＋「ほうがいいです」：ねた ほうがいいです。「ないほうがいい」は「するな」方向、「てはいけません」は禁止——熱があるのに寝かせないのは真逆。「なくてもいい」は不要の意味で、休むよう勧める場面と矛盾する。"
    }
  },
  "pattern-n5-onegai-004": {
    "hintI18n": { "en": "Someone with a cold wants a bath — the family steps in.", "ja": "風邪の人がお風呂に入りたがり、家族が止めに入る。" },
    "promptContextI18n": { "en": "\"You have a cold — better not take a bath today.\"", "ja": "「風邪ですから、今日はお風呂に入らないほうがいいです。」" },
    "explanationI18n": {
      "en": "Advising against uses ない-form + 「ほうがいいです」 = better not ~: はいらない ほうがいいです. 「はいったほうがいい」 goes the opposite way; 「てもいい」 is permission; 「ましょうか」 is an offer — none fit stopping someone. ※かぜ = a cold, おふろに はいります = to take a bath.",
      "ja": "「しないほうがいい」は ない形＋「ほうがいいです」：はいらない ほうがいいです。「はいったほうがいい」は逆方向、「てもいい」は許可、「ましょうか」は申し出で、止める場面に合わない。"
    }
  },
  "pattern-n5-onegai-005": {
    "hintI18n": { "en": "The librarian wants everyone quiet.", "ja": "図書館員が静かにしてほしいと注意する。" },
    "promptContextI18n": { "en": "\"This is a library — please don't talk loudly.\"", "ja": "「図書館ですから、大きい声で話さないでください。」" },
    "explanationI18n": {
      "en": "ない-form + 「でください」 = please don't ~: はなさないで ください. A library needs quiet — 「はなしてください」 (please talk) points the wrong way; 「てもいい」 and 「ましょう」 contradict the request for quiet. ※こえ = voice, はなします = to talk.",
      "ja": "ない形＋「でください」：はなさないで ください。図書館は静かにする場所——「はなしてください」は逆方向、「てもいい」「ましょう」は静かにという要求と矛盾する。"
    }
  },
  "pattern-n5-onegai-006": {
    "hintI18n": { "en": "Buying stamps and specifying how many.", "ja": "切手を買うとき、枚数を伝える。" },
    "promptContextI18n": { "en": "\"Excuse me, five of these stamps, please.\"", "ja": "「すみません、この切手を五枚ください。」" },
    "explanationI18n": {
      "en": "The object of 「Nを (quantity) ください」 takes 「を」: きってを ごまい ください. The quantity (ごまい) goes after を and before ください. 「が ください」 isn't a sentence; 「へ」「の」 don't attach either. ※きって = stamp, 〜まい = counter for flat things.",
      "ja": "「Nを（数量）ください」の対象は「を」：きってを ごまい ください。数量（ごまい）は を の後、ください の前。「が ください」は文にならない。「へ」「の」もつながらない。"
    }
  },
  "pattern-n5-onegai-007": {
    "hintI18n": { "en": "Asking what they'd like for their birthday.", "ja": "誕生日プレゼントの希望を聞く。" },
    "promptContextI18n": { "en": "\"What do you want for your birthday?\"", "ja": "「誕生日に何がほしいですか。」" },
    "explanationI18n": {
      "en": "The object of 「ほしい」 takes 「が」, question words included: なにが ほしいですか. 「は」 marks an already-known topic, and \"what\" is exactly the unknown being asked — this neutral question doesn't use 「は」; 「も」 would make なにも, which demands a negative; 「の」 doesn't attach. ※たんじょうび = birthday.",
      "ja": "「ほしい」の対象は「が」。疑問詞でも同じ：なにが ほしいですか。「は」の前は既知の話題が来るもので、「なに」はまさに尋ねたい未知——この中立の質問に「は」は使わない。「も」だと「なにも」＝否定とセット。「の」はつながらない。"
    }
  },
  "pattern-n5-onegai-008": {
    "hintI18n": { "en": "A warning sign about this stretch of water.", "ja": "この水辺についての注意書き。" },
    "promptContextI18n": { "en": "\"This spot is dangerous — no swimming, please.\"", "ja": "「ここは危ないですから、泳がないでください。」" },
    "explanationI18n": {
      "en": "A danger warning uses 「ないでください」 = please don't ~: およがないで ください. The topic already declares THIS spot dangerous, so 「およいでください」「ましょう」「ませんか」 — all urging people into the water — contradict 「あぶない」. ※あぶない = dangerous, およぎます = to swim.",
      "ja": "危険の警告は「ないでください」：およがないで ください。主題が「ここは危ない」と明言しているので、「およいでください」「ましょう」「ませんか」はどれも泳がせる方向で「あぶない」と矛盾する。"
    }
  },
  "pattern-n5-riyuu-001": {
    "hintI18n": { "en": "Explaining why you missed school.", "ja": "学校を休んだわけを説明する。" },
    "promptContextI18n": { "en": "\"Why did you miss school?\" \"Because I had a fever.\"", "ja": "「どうして学校を休みましたか。」「熱があったからです。」" },
    "explanationI18n": {
      "en": "Answering 「どうして」 (why) uses the fixed shape 「〜からです」: ねつが あったからです. 「ので」 can't attach directly to です (×のでです); 「が」 and 「まで」 don't connect either. ※やすみます = to take a day off.",
      "ja": "「どうして」への答えは「〜からです」で固定：ねつが あったからです。「ので」は です に直接つながらない（×のでです）。「が」「まで」も接続できない。"
    }
  },
  "pattern-n5-riyuu-002": {
    "hintI18n": { "en": "Tomorrow's a day off — suggest going somewhere.", "ja": "明日は休み。それを踏まえてどこかへ誘う。" },
    "promptContextI18n": { "en": "\"Tomorrow's a day off, so shall we go somewhere?\"", "ja": "「明日は休みなので、どこかへ行きませんか。」" },
    "explanationI18n": {
      "en": "A noun needs な before 「ので」: やすみ + な + ので = やすみなので. 「だので」 is a wrong attachment (だ and ので don't combine); a bare noun + ので (×やすみので) fails too; and から takes だ after a noun (やすみだから) — 「なから」 doesn't exist. ※どこか = somewhere.",
      "ja": "名詞に「ので」を付けるときは な を挟む：やすみ＋な＋ので。「だので」は誤接続（だ と ので は連結できない）。名詞に直接 ので（×やすみので）も不可。から なら やすみだから——「なから」という形はない。"
    }
  },
  "pattern-n5-riyuu-003": {
    "hintI18n": { "en": "Japanese is hard — and fun all the same.", "ja": "日本語は難しい。それでも面白い、という話。" },
    "promptContextI18n": { "en": "\"Japanese is difficult, but it's interesting.\"", "ja": "「日本語は難しいですが、面白いです。」" },
    "explanationI18n": {
      "en": "Sentence-medial 「が」 marks contrast = although ~, but ~: むずかしいですが、おもしろいです — used when the two halves point in opposite directions. 「を」「の」「に」 can't follow です. ※むずかしい = difficult, おもしろい = interesting.",
      "ja": "文中の「が」は逆接＝〜だが：むずかしいですが、おもしろいです——前後が逆方向のときのつなぎ。「を」「の」「に」は です の後ろに付かない。"
    }
  },
  "pattern-n5-riyuu-004": {
    "hintI18n": { "en": "Stopping a passerby to ask the way.", "ja": "道で人に声をかけて場所を聞く。" },
    "promptContextI18n": { "en": "\"Excuse me, where is the station?\"", "ja": "「すみませんが、駅はどこですか。」" },
    "explanationI18n": {
      "en": "The buffer before a request is 「が」: すみませんが、〜 = excuse me, (but) ~. This が isn't contrast — it just eases the topic in. 「から」「ので」 give reasons, and 「すみません」 isn't a reason; 「でも」 works at the head of a sentence, not after ません. ※えき = station.",
      "ja": "切り出しのクッションは「が」：すみませんが、〜。この が は逆接ではなく、話をやわらかく持ち出すためのもの。「から」「ので」は理由——「すみません」は理由ではない。「でも」は文頭に置く語で、ません の後ろには付かない。"
    }
  },
  "pattern-n5-riyuu-005": {
    "hintI18n": { "en": "Rain or no rain, you're heading out.", "ja": "雨は降っている。それでも出かける。" },
    "promptContextI18n": { "en": "\"It's raining. But I'm going out anyway.\"", "ja": "「雨が降っています。でも、出かけます。」" },
    "explanationI18n": {
      "en": "When the two sentences pull in opposite directions (raining → going out anyway), use 「でも」 = but. 「だから」 (so) follows the causal grain — wrong direction; 「そして」 (and) and 「それから」 (and then) just line events up and can't express \"anyway\". ※あめ = rain, ふります = to fall (rain/snow), でかけます = to go out.",
      "ja": "前後が逆方向（雨→それでも出かける）なら「でも」。「だから」は因果に沿う語で方向が逆。「そして」「それから」は並列・順接で、「それでも」の逆接は表せない。"
    }
  },
  "pattern-n5-riyuu-006": {
    "hintI18n": { "en": "Test tomorrow — tonight is for studying, no way around it.", "ja": "明日は試験。今晩は勉強するしかない。" },
    "promptContextI18n": { "en": "\"There's a test tomorrow. So I'll study tonight.\"", "ja": "「明日テストがあります。だから、今晩勉強します。」" },
    "explanationI18n": {
      "en": "Cause followed by its natural consequence takes 「だから」 = so. 「でも」「しかし」 mark contrast (a test, \"but\" studying? — wrong direction); 「まだ」 (still/yet) is an adverb and can't sit at the head of a sentence as a connector. ※テスト = test, こんばん = tonight.",
      "ja": "前件が原因、後件が当然の結果なら「だから」。「でも」「しかし」は逆接（テストがあるのに「でも」勉強？方向が逆）。「まだ」は副詞で、文頭に置いて接続詞のようには使えない。"
    }
  },
  "pattern-n5-riyuu-007": {
    "hintI18n": { "en": "Short on time — settling how to get there.", "ja": "時間がない。移動手段を決める。" },
    "promptContextI18n": { "en": "\"We have no time, so let's take a taxi.\"", "ja": "「時間がありませんから、タクシーで行きましょう。」" },
    "explanationI18n": {
      "en": "A mid-sentence reason takes 「から」: じかんが ありませんから = because there's no time, (so) let's taxi. 「まで」「を」「へ」 simply can't attach after ません — the sentence breaks. ※タクシー = taxi.",
      "ja": "文中の理由は「から」：じかんが ありませんから、タクシーで行きましょう。「まで」「を」「へ」は ません の後ろに付けず、文がそこで壊れる。"
    }
  },
  "pattern-n5-riyuu-008": {
    "hintI18n": { "en": "Curious what drives their Japanese study.", "ja": "日本語を勉強している動機を知りたい。" },
    "promptContextI18n": { "en": "\"Why are you studying Japanese?\" \"Because I want to go to Japan.\"", "ja": "「どうして日本語を勉強していますか。」「日本へ行きたいですから。」" },
    "explanationI18n": {
      "en": "The reply is 「〜ですから」 (because ~), so the question must ask for a reason: 「どうして」 = why. 「いつ」 (when) and 「どこ」 (where) don't match an answer about motivation; 「なに」 asks for a thing — the sentence already has the object にほんごを. ※べんきょうします = to study, 〜たいです = want to ~.",
      "ja": "答えが「〜ですから」なので、質問は理由を聞く「どうして」しかない。「いつ」「どこ」は時間・場所で、「日本へ行きたいから」という答えと噛み合わない。「なに」は物を聞く語だが、文にはもう にほんごを がある。"
    }
  },
  "pattern-n5-toki-001": {
    "hintI18n": { "en": "What you do when you're free.", "ja": "手が空いたらすることの話。" },
    "promptContextI18n": { "en": "\"When I'm free, I listen to music.\"", "ja": "「暇なとき、音楽を聞きます。」" },
    "explanationI18n": {
      "en": "「〜とき」 = when ~: ひまな とき = when I'm free. 「ところ」 mostly means a place (「ひまなところ」 is unnatural here); 「こと」 (a matter) and 「もの」 (a thing) leave the phrase stranded at the head of the sentence, unconnected to \"listen to music\". ※ひま（な） = free (time), おんがく = music.",
      "ja": "「〜とき」：ひまな とき。「ところ」は主に場所（ここでの「ひまなところ」は不自然）。「こと」「もの」は入れると文頭に浮いてしまい、後ろの「音楽を聞きます」につながらない。"
    }
  },
  "pattern-n5-toki-002": {
    "hintI18n": { "en": "The set phrase said before a meal.", "ja": "食事の前に言うあの一言。" },
    "promptContextI18n": { "en": "\"When (about) to eat, you say いただきます.\"", "ja": "「ご飯を食べるとき、『いただきます』と言います。」" },
    "explanationI18n": {
      "en": "The tense before とき shows whether the action is done: いただきます is said BEFORE eating — action not yet complete → dictionary form たべる とき. 「たべた とき」 is after finishing — that's when you say 「ごちそうさま」; て/ます forms can't attach to とき.",
      "ja": "とき の前の時制は動作が完了したかどうか：「いただきます」は食べる「前」——未完了なので辞書形 たべる とき。「たべた とき」は食べ終わった後で、そのときの挨拶は「ごちそうさま」。て形・ます形は とき に付かない。"
    }
  },
  "pattern-n5-toki-003": {
    "hintI18n": { "en": "Lunch is taken care of, you reply.", "ja": "昼はもう済ませた、と返事する。" },
    "promptContextI18n": { "en": "\"Did you eat lunch?\" \"Yes, I already ate.\"", "ja": "「昼ご飯を食べましたか。」「はい、もう食べました。」" },
    "explanationI18n": {
      "en": "Completion uses 「もう〜ました」 = already did: もう たべました. 「まだ」 pairs with the incomplete (まだ たべていません) and clashes with ました; 「いつ」 is a question word; 「とても」 (very) modifies degree, not completion.",
      "ja": "完了は「もう〜ました」：もう たべました。「まだ」は未完了（まだ たべていません）とセットで、ました と矛盾。「いつ」は疑問詞、「とても」は程度の語で完了に合わない。"
    }
  },
  "pattern-n5-toki-004": {
    "hintI18n": { "en": "A progress report on that assignment.", "ja": "レポートの進み具合を答える。" },
    "promptContextI18n": { "en": "\"Is the report done?\" \"No, not yet.\"", "ja": "「レポートはできましたか。」「いいえ、まだできていません。」" },
    "explanationI18n": {
      "en": "Not-yet uses 「まだ〜ていません」: まだ できていません. 「まだ できました」 contradicts itself; 「できます」 is ability or future; and dropping another question 「できましたか」 into an answer doesn't work. ※レポート = report.",
      "ja": "未完了は「まだ〜ていません」：まだ できていません。「まだ できました」は自己矛盾。「できます」は能力か未来。答えの中に質問形「できましたか」を入れても文にならない。"
    }
  },
  "pattern-n5-toki-005": {
    "hintI18n": { "en": "The forecast's take on tomorrow.", "ja": "天気予報が伝える明日の天気。" },
    "promptContextI18n": { "en": "\"According to the forecast, it will probably rain tomorrow.\"", "ja": "「天気予報によると、明日は雨が降るでしょう。」" },
    "explanationI18n": {
      "en": "Conjecture uses 「でしょう」 = probably ~: あめが ふるでしょう. The dictionary form ふる can't take 「ですか」 directly (you'd say ふりますか); 「ましょう」 proposes, 「でした」 is past — neither attaches. ※てんきよほう = weather forecast, 〜によると = according to ~, ふります = to fall (rain/snow).",
      "ja": "推量は「でしょう」：あめが ふるでしょう。辞書形 ふる に「ですか」は直接付かない（ふりますか と言う）。「ましょう」は提案、「でした」は過去で、どちらも接続できない。"
    }
  },
  "pattern-n5-toki-006": {
    "hintI18n": { "en": "Going along with their guess about tomorrow's cold.", "ja": "明日も寒そうだね、という相手に同調する。" },
    "promptContextI18n": { "en": "\"Will tomorrow be cold too?\" \"Yeah, probably.\"", "ja": "「明日も寒いでしょうか。」「ええ、寒いでしょう。」" },
    "explanationI18n": {
      "en": "Answering a guess with your own guess: ええ、さむいでしょう = yeah, probably cold. 「ですか」 dies on the leading 「ええ」 — you don't commit and then ask back; 「ましたか」「ませんか」 don't even attach — an い-adjective's past is 「さむかったです」 and its negative question 「さむくありませんか」. ※さむい = cold.",
      "ja": "推量には推量で答える：ええ、さむいでしょう。「ですか」は頭の「ええ」と矛盾——同意してから聞き返さない。「ましたか」「ませんか」はそもそも接続不可——い形容詞の過去は「さむかったです」、否定疑問は「さむくありませんか」。"
    }
  },
  "pattern-n5-toki-007": {
    "hintI18n": { "en": "You've climbed Mt. Fuji before.", "ja": "富士山に登った経験がある、という話。" },
    "promptContextI18n": { "en": "\"I have climbed Mt. Fuji.\"", "ja": "「私は富士山に登ったことがあります。」" },
    "explanationI18n": {
      "en": "Experience uses た-form + 「ことが あります」 = have done ~: のぼった ことが あります. This pattern takes 「が」 — 「を」「に」「で」 make no sentence here. ※ふじさん = Mt. Fuji, のぼります = to climb.",
      "ja": "経験は た形＋「ことが あります」：のぼった ことが あります。この文型は「が」——「を」「に」「で」をここに置くと文にならない。"
    }
  },
  "pattern-n5-toki-008": {
    "hintI18n": { "en": "Asked about sushi experience, you shake your head.", "ja": "すしの経験を聞かれて、首を横に振る。" },
    "promptContextI18n": { "en": "\"Have you ever eaten sushi?\" \"No, not even once.\"", "ja": "「すしを食べたことがありますか。」「いいえ、一度もありません。」" },
    "explanationI18n": {
      "en": "「いちども」 (not even once) demands a negative: いちども ありません. 「あります」「ありました」「たべました」 are all affirmative and clash with いちども — the same rule as だれも/なにも + negative. ※すし = sushi, いちども = (not) even once.",
      "ja": "「いちども」は否定とセット：いちども ありません。「あります」「ありました」「たべました」は肯定で いちども と矛盾——だれも/なにも＋否定と同じルール。"
    }
  },
  "pattern-n5-keiyoushi-001": {
    "hintI18n": { "en": "Complimenting how big this bag is.", "ja": "このかばんの大きさをほめる。" },
    "promptContextI18n": { "en": "\"This is a very big bag.\"", "ja": "「これはとても大きいかばんです。」" },
    "explanationI18n": {
      "en": "An い-adjective modifies a noun directly: おおきい かばん. 「おおきいな」 wrongly imports the な-adjective rule; 「おおきく」 is the adverbial form used before verbs; the の in 「おおきいの」 is superfluous.",
      "ja": "い形容詞は名詞に直接付く：おおきい かばん。「おおきいな」は な形容詞の規則の誤用。「おおきく」は動詞に続く連用形。「おおきいの」の の は余計。"
    }
  },
  "pattern-n5-keiyoushi-002": {
    "hintI18n": { "en": "Introducing your quiet hometown.", "ja": "住んでいる静かな町を紹介する。" },
    "promptContextI18n": { "en": "\"This is a quiet town.\"", "ja": "「ここは静かな町です。」" },
    "explanationI18n": {
      "en": "A な-adjective takes な before a noun: しずかな まち. 「しずかい」 mistakes it for an い-adjective; bare 「しずか」 is missing the な; 「しずかの」 is the NOUN linker — it only works if しずか is a noun (say, the name Shizuka), never for the adjective. ※まち = town.",
      "ja": "な形容詞は名詞の前に な：しずかな まち。「しずかい」は い形容詞との混同。「しずか」だけでは な が足りない。「しずかの」は名詞用のつなぎ——しずか を名詞（人名など）として使うときだけ成立し、形容詞にはこの接続はない。"
    }
  },
  "pattern-n5-keiyoushi-003": {
    "hintI18n": { "en": "Recommending this place: cheap and tasty.", "ja": "この店を勧める：安くてうまい。" },
    "promptContextI18n": { "en": "\"This place's food is cheap and tasty.\"", "ja": "「この店の料理は安くて、おいしいです。」" },
    "explanationI18n": {
      "en": "Chaining い-adjectives: drop い, add くて — やすい → やすくて. 「やすいに」 is a form that doesn't exist; 「やすいくて」 forgot to drop the い; 「やすくで」 garbles くて. ※みせ = shop.",
      "ja": "い形容詞の並列は い を取って くて：やすい→やすくて。「やすいに」は存在しない形。「やすいくて」は い を取り忘れ。「やすくで」は くて の崩れ形。"
    }
  },
  "pattern-n5-keiyoushi-004": {
    "hintI18n": { "en": "Tanaka: energetic and kind.", "ja": "田中さんは元気で親切、という紹介。" },
    "promptContextI18n": { "en": "\"Tanaka is energetic and kind.\"", "ja": "「田中さんは元気で、親切です。」" },
    "explanationI18n": {
      "en": "な-adjectives chain with で: げんきで、しんせつです. 「げんきくて」 borrows the い-adjective くて; 「げんきいで」 and 「げんきなで」 are forms that don't exist — な is for linking to a NOUN; chaining takes plain で. ※げんき（な） = energetic, しんせつ（な） = kind.",
      "ja": "な形容詞の並列は で：げんきで、しんせつです。「げんきくて」は い形容詞の くて の誤用。「げんきいで」「げんきなで」は存在しない形——な は名詞につなぐときのもので、並列はそのまま で。"
    }
  },
  "pattern-n5-keiyoushi-005": {
    "hintI18n": { "en": "The payoff of practicing handwriting daily.", "ja": "毎日の練習の成果の話。" },
    "promptContextI18n": { "en": "\"Practicing every day made my handwriting beautiful.\"", "ja": "「毎日練習したので、字がきれいになりました。」" },
    "explanationI18n": {
      "en": "\"Become ~\" with a な-adjective: + に なります — きれいに なりました. きれい ends in い but is a な-adjective; 「きれいく」 is exactly the classic mistake (mixing in the い-adjective's くなります). 「で」「の」 don't attach to なります. ※じ = handwriting, れんしゅうします = to practice.",
      "ja": "な形容詞の「〜になる」：きれいに なりました。きれい は い で終わるが な形容詞で、「きれいく」はまさに定番の間違い（い形容詞の くなります との混同）。「で」「の」は なります につながらない。"
    }
  },
  "pattern-n5-keiyoushi-006": {
    "hintI18n": { "en": "How it feels outside after dark.", "ja": "夜になってからの外の気温の話。" },
    "promptContextI18n": { "en": "\"After night fell, it got cold outside.\"", "ja": "「夜になって、外が寒くなりました。」" },
    "explanationI18n": {
      "en": "\"Become ~\" with an い-adjective: drop い + く なります — さむい → さむく なりました. 「に」 belongs to な-adjectives (しずかに なります); 「で」「い」 don't attach to なります. ※そと = outside.",
      "ja": "い形容詞の「〜になる」は い を取って く：さむい→さむく なりました。「に」は な形容詞用（しずかに なります）。「で」「い」は なります につながらない。"
    }
  },
  "pattern-n5-keiyoushi-007": {
    "hintI18n": { "en": "This room: spacious and bright.", "ja": "この部屋は広くて明るい、という話。" },
    "promptContextI18n": { "en": "\"This room is spacious and bright.\"", "ja": "「この部屋は広くて、明るいです。」" },
    "explanationI18n": {
      "en": "い-adjective chaining once more: ひろい → ひろくて、あかるいです. 「いて」「くで」「いくて」 are all nonexistent attachments — remember the formula: drop い + くて. ※ひろい = spacious, あかるい = bright.",
      "ja": "い形容詞の並列をもう一度：ひろい→ひろくて、あかるいです。「いて」「くで」「いくて」はどれも存在しない接続——公式は「い を取って くて」。"
    }
  },
  "pattern-n5-keiyoushi-008": {
    "hintI18n": { "en": "The weather took a turn for the better.", "ja": "天気が回復した、という話。" },
    "promptContextI18n": { "en": "\"The weather got better yesterday.\"", "ja": "「昨日は天気がよくなりました。」" },
    "explanationI18n": {
      "en": "「いい」 (good) uses the よ stem for its negative, past, and change forms: よく なります, よくない, よかった (the base form stays いい/よい). 「いく」「いいく」 inflect いい directly — neither exists; 「よい なりました」 is missing the く. ※てんき = weather.",
      "ja": "「いい」の否定・過去・変化は よ 系：よく なります、よくない、よかった（基本形は いい／よい のまま）。「いく」「いいく」は いい を直接活用させた存在しない形。「よい なりました」は く が抜けてつながらない。"
    }
  },
  "pattern-n5-josuushi-001": {
    "hintI18n": { "en": "Two students in the classroom.", "ja": "教室にいる学生の人数。" },
    "promptContextI18n": { "en": "\"There are two students in the classroom.\"", "ja": "「教室に学生が二人います。」" },
    "explanationI18n": {
      "en": "People take 「〜人（にん）」, but one and two are irregular: ひとり, ふたり. 「ににん」 force-applies the rule and is wrong; 「ふたつ」 counts things, not people; 「にまい」 counts thin flat objects.",
      "ja": "人は「〜人（にん）」で数えるが、一人・二人は特殊読み：ひとり、ふたり。「ににん」は規則の押し付けで誤り。「ふたつ」は物、「にまい」は薄い平たい物を数える語。"
    }
  },
  "pattern-n5-josuushi-002": {
    "hintI18n": { "en": "Buying three pencils.", "ja": "鉛筆を三本買った話。" },
    "promptContextI18n": { "en": "\"I bought three pencils.\"", "ja": "「鉛筆を三本買いました。」" },
    "explanationI18n": {
      "en": "Long thin things take 「〜本」, and 三本 voices: さんぼん. 「さんほん」 skips the sound change; 「さんぽん」 uses the p-sound (that's for いっぽん, ろっぽん); 「みっぽん」 doesn't exist. ※えんぴつ = pencil.",
      "ja": "細長い物は「〜本」。三本は濁音化して さんぼん。「さんほん」は音変化なしの誤り。「さんぽん」は半濁音（いっぽん・ろっぽん用）。「みっぽん」は存在しない。"
    }
  },
  "pattern-n5-josuushi-003": {
    "hintI18n": { "en": "Buying two shirts.", "ja": "シャツを二枚買った話。" },
    "promptContextI18n": { "en": "\"I bought two shirts.\"", "ja": "「シャツを二枚買いました。」" },
    "explanationI18n": {
      "en": "Thin flat things (shirts, paper, plates) take 「〜枚（まい）」: にまい. 「〜本」 counts long thin things, 「〜台」 machines and vehicles, 「〜匹」 small animals — all the wrong category. ※シャツ = shirt.",
      "ja": "薄くて平たい物（シャツ・紙・皿）は「〜枚」：にまい。「〜本」は細長い物、「〜台」は機械・車、「〜匹」は小動物で、どれも類別違い。"
    }
  },
  "pattern-n5-josuushi-004": {
    "hintI18n": { "en": "One cat at home.", "ja": "家で飼っている猫は一匹。" },
    "promptContextI18n": { "en": "\"We have one cat at home.\"", "ja": "「うちに猫が一匹います。」" },
    "explanationI18n": {
      "en": "Small animals take 「〜匹（ひき）」, and 一匹 geminates with a p-sound: いっぴき. 「いちひき」 skips the sound change; 「いっぽん」 counts long thin things; 「ひとまい」 is the wrong category AND the wrong reading (it's いちまい).",
      "ja": "小動物は「〜匹」。一匹は促音＋半濁音で いっぴき。「いちひき」は音変化なしの誤り。「いっぽん」は細長い物用。「ひとまい」は類別も読みも誤り（正しくは いちまい）。"
    }
  },
  "pattern-n5-josuushi-005": {
    "hintI18n": { "en": "Your weekly Japanese-study routine.", "ja": "週に何回勉強するかの話。" },
    "promptContextI18n": { "en": "\"I study Japanese twice a week.\"", "ja": "「1週間に2回、日本語を勉強します。」" },
    "explanationI18n": {
      "en": "Counting occurrences uses 「〜回（かい）」: １しゅうかんに にかい = twice a week. 「〜枚」「〜台」「〜冊」 count objects — studying Japanese isn't something you hold in your hand. ※〜かい = ~ times.",
      "ja": "動作の回数は「〜回」：１しゅうかんに にかい。「〜枚」「〜台」「〜冊」は物を数える語——勉強は手に持てる物ではない。"
    }
  },
  "pattern-n5-josuushi-006": {
    "hintI18n": { "en": "Your little brother's age.", "ja": "弟の年齢の話。" },
    "promptContextI18n": { "en": "\"My little brother is eight.\"", "ja": "「弟は八歳です。」" },
    "explanationI18n": {
      "en": "Age takes 「〜歳（さい）」, and 八歳 geminates: はっさい. 「はちさい」 skips the sound change; 「〜冊」 counts books and 「〜枚」 flat things — nothing to do with age. Also remember: 一歳 いっさい and 十歳 じゅっさい geminate too.",
      "ja": "年齢は「〜歳」。八歳は促音化して はっさい。「はちさい」は音変化なしの誤り。「〜冊」は本、「〜枚」は薄い物で年齢に無関係。ついでに：一歳 いっさい、十歳 じゅっさい も促音化。"
    }
  },
  "pattern-n5-josuushi-007": {
    "hintI18n": { "en": "Picking out five mandarins at the stand.", "ja": "みかんを五つ買う場面。" },
    "promptContextI18n": { "en": "\"Five mandarins, please.\"", "ja": "「みかんを五つください。」" },
    "explanationI18n": {
      "en": "The quantity goes straight before the verb: みかんを いつつ ください — the を already sits after みかん. 「いつつを」「いつつの」「いつつに」 all overdo it: in the 「noun を + quantity + verb」 order, no を・の・に follows the quantity word.",
      "ja": "数量詞は動詞の直前にそのまま：みかんを いつつ ください——を はもう みかん の後ろにある。「いつつを」「いつつの」「いつつに」は蛇足で、「名詞を＋数量詞＋動詞」の語順では数量詞の後ろに を・の・に を付けない。"
    }
  },
  "pattern-n5-josuushi-008": {
    "hintI18n": { "en": "How many books you hauled home from the library.", "ja": "図書館で借りた本の数。" },
    "promptContextI18n": { "en": "\"I borrowed two books at the library.\"", "ja": "「図書館で本を二冊借りました。」" },
    "explanationI18n": {
      "en": "Books take 「〜冊（さつ）」: にさつ. 「〜本」 — despite the kanji — counts long thin things (umbrellas, bottles, pencils); 「〜枚」 counts flat things; 「ふたさつ」 is a nonexistent reading — 二冊 is only にさつ; the ふた- series belongs to 〜つ and ふたり. ※かります = to borrow.",
      "ja": "本は「〜冊」：にさつ。「〜本」は漢字は同じでも細長い物用（傘・瓶・鉛筆）。「〜枚」は薄い物。「ふたさつ」という読みは存在しない——二冊は にさつ だけで、ふた系は 〜つ と ふたり のもの。"
    }
  },
  "pattern-n5-teido-001": {
    "hintI18n": { "en": "Your verdict on this movie.", "ja": "この映画の感想を言う。" },
    "promptContextI18n": { "en": "\"This movie isn't very interesting.\"", "ja": "「この映画はあまり面白くないです。」" },
    "explanationI18n": {
      "en": "In a plain statement like this, 「あまり」 pairs with a negative = not very ~: あまり おもしろくないです. The other three are affirmative and can't ride with あまり — see あまり, hunt for ない.",
      "ja": "この手の叙述文では「あまり」は否定と呼応する＝あまり〜ない：あまり おもしろくないです。ほかの三つは肯定で あまり と組めない——あまり を見たら ない を探す。"
    }
  },
  "pattern-n5-teido-002": {
    "hintI18n": { "en": "Answering whether you drink.", "ja": "お酒を飲むかどうかの質問に答える。" },
    "promptContextI18n": { "en": "\"Do you drink?\" \"No — not at all.\"", "ja": "「お酒を飲みますか。」「いいえ、ぜんぜん飲みません。」" },
    "explanationI18n": {
      "en": "「ぜんぜん」 pairs with a negative = not at all ~: ぜんぜん のみません. The leading 「いいえ」 has already said no — 「のみます」「のみました」「のみたいです」 are all affirmative and contradict it outright. Degree scale: あまり = not much, ぜんぜん = not at all. ※おさけ = alcohol.",
      "ja": "「ぜんぜん」は否定とセット：ぜんぜん のみません。頭の「いいえ」がもう否定している——「のみます」「のみました」「のみたいです」は肯定で真っ向から矛盾。程度の比較：あまり＝あまり〜ない、ぜんぜん＝まったく〜ない。"
    }
  },
  "pattern-n5-teido-003": {
    "hintI18n": { "en": "When you get up each morning.", "ja": "毎朝何時に起きるかの話。" },
    "promptContextI18n": { "en": "\"I get up around seven every morning.\"", "ja": "「毎朝7時ごろ起きます。」" },
    "explanationI18n": {
      "en": "Approximate clock time takes 「ごろ」 = around ~: ７じごろ おきます. 「が」「を」「へ」 can't attach to a clock time. Also remember: approximate AMOUNTS take 「ぐらい」 (じゅっぷんぐらい). ※まいあさ = every morning, おきます = to get up.",
      "ja": "時刻のおよそは「ごろ」：７じごろ おきます。「が」「を」「へ」は時刻に付かない。あわせて：数量のおよそは「ぐらい」（じゅっぷんぐらい）。"
    }
  },
  "pattern-n5-teido-004": {
    "hintI18n": { "en": "How long the walk to the station takes.", "ja": "駅まで歩いてかかる時間の話。" },
    "promptContextI18n": { "en": "\"It takes about ten minutes to walk to the station.\"", "ja": "「駅まで歩いて10分ぐらいかかります。」" },
    "explanationI18n": {
      "en": "Approximate amounts and durations take 「ぐらい」 = about ~: じゅっぷんぐらい かかります. 「ごろ」 only attaches to points of time (７じごろ), never to a duration like \"ten minutes\"; 「まで」「から」 mark endpoints. ※かかります = to take (time).",
      "ja": "数量・時間の長さのおよそは「ぐらい」：じゅっぷんぐらい かかります。「ごろ」は時刻の一点にだけ付き（７じごろ）、「十分間」のような長さには付かない。「まで」「から」は起点・終点。"
    }
  },
  "pattern-n5-teido-005": {
    "hintI18n": { "en": "How often Tanaka hits the library.", "ja": "田中さんが図書館へ行く頻度の話。" },
    "promptContextI18n": { "en": "\"Tanaka often goes to the library — as many as three times a week.\"", "ja": "「田中さんはよく図書館へ行きます。毎週3回も行きます。」" },
    "explanationI18n": {
      "en": "Three times a week (with an emphatic も = as many as) is high frequency → 「よく」 = often. 「まいにち」 (every day) directly contradicts \"three times a week\"; 「ときどき」 (sometimes) doesn't match the rate either; in a plain frequency statement like this, 「あまり」 demands a negative, but いきます is affirmative.",
      "ja": "週3回（しかも「も」付き＝そんなに）は高頻度→「よく」。「まいにち」は「毎週3回」と真っ向から矛盾。「ときどき」もこの頻度に合わない。この手の頻度の叙述文では「あまり」は否定とセットだが、後ろは肯定の いきます。"
    }
  },
  "pattern-n5-teido-006": {
    "hintI18n": { "en": "How often you watch movies.", "ja": "映画を見る頻度の話。" },
    "promptContextI18n": { "en": "\"I watch movies occasionally — about three times a year.\"", "ja": "「私はときどき映画を見ます。1年に3回ぐらいです。」" },
    "explanationI18n": {
      "en": "Only three times a YEAR is low frequency → 「ときどき」 = sometimes. 「いつも」 (always), 「まいにち」 (every day), and 「よく」 (often) all contradict that rate — frequency adverbs must match the actual count.",
      "ja": "年にたった3回は低頻度→「ときどき」。「いつも」「まいにち」「よく」はどれもその回数と矛盾する——頻度の副詞は実際の回数に合わせる。"
    }
  },
  "pattern-n5-teido-007": {
    "hintI18n": { "en": "Your big brother's cooking habits.", "ja": "兄の料理の習慣の話。" },
    "promptContextI18n": { "en": "\"My big brother doesn't cook much.\"", "ja": "「兄はあまり料理をしません。」" },
    "explanationI18n": {
      "en": "In plain statements, 「あまり」 pairs with a negative in verb sentences too: あまり しません = doesn't do much. 「します」「しました」「したいです」 are affirmative and can't ride with あまり — the same rule as あまり おもしろくない.",
      "ja": "叙述文では動詞文でも「あまり」は否定と呼応：あまり しません。「します」「しました」「したいです」は肯定で あまり と組めない——あまり おもしろくない と同じルール。"
    }
  },
  "pattern-n5-teido-008": {
    "hintI18n": { "en": "Your regular swimming schedule.", "ja": "プールに通うペースの話。" },
    "promptContextI18n": { "en": "\"I swim at the pool twice a week.\"", "ja": "「1週間に2回、プールで泳ぎます。」" },
    "explanationI18n": {
      "en": "Rates are said as period + 「に」 + count: １しゅうかんに ２かい = twice a week. This に distributes the count over the period. 「を」「へ」「と」 don't attach to a period word. ※プール = swimming pool.",
      "ja": "頻度は「期間＋に＋回数」：１しゅうかんに ２かい。この に は期間への割り当てを表す。「を」「へ」「と」は期間の語に付かない。"
    }
  },
  "pattern-n4-ndesu-001": {
    "hintI18n": { "en": "Your friend looks pale — check on them.", "ja": "相手の様子がおかしいので声をかける。" },
    "promptContextI18n": { "en": "\"You look pale — what's wrong?\"", "ja": "「顔色が悪いですね。どうしたんですか。」" },
    "explanationI18n": {
      "en": "Pressing for an explanation of something you see uses 「〜んですか」: どうしたんですか = what's wrong? The preceding した is a plain form, so 「ですか」「ますか」「でしたか」 can't attach — among these four options only んですか parses. ※顔色 = complexion.",
      "ja": "目の前の様子について説明を求めるのが「〜んですか」：どうしたんですか。直前の「した」は普通形なので、「ですか」「ますか」「でしたか」は接続できない——この四択で文になるのは んですか だけ。"
    }
  },
  "pattern-n4-ndesu-002": {
    "hintI18n": { "en": "Explaining why you were late.", "ja": "遅れた事情を説明する。" },
    "promptContextI18n": { "en": "\"Why were you late?\" \"The train stopped.\"", "ja": "「どうして遅れたんですか。」「電車が止まったんです。」" },
    "explanationI18n": {
      "en": "Answering a 「どうして〜んですか」 probe uses 「〜んです」 to explain: 電車が止まったんです. 止まった is plain, so 「です」「ます」「ましょう」 can't attach. The pair: んですか ⇄ んです. ※遅れる = to be late.",
      "ja": "「どうして〜んですか」への答えは「〜んです」で事情を説明：電車が止まったんです。「止まった」は普通形なので「です」「ます」「ましょう」は接続不可。問いと答えはセット：んですか⇄んです。"
    }
  },
  "pattern-n4-ndesu-003": {
    "hintI18n": { "en": "Setting the scene before asking for moving help.", "ja": "手伝いを頼む前に事情を切り出す。" },
    "promptContextI18n": { "en": "\"I'm moving tomorrow — could you give me a hand?\"", "ja": "「明日引っ越しなんですが、手伝ってくれませんか。」" },
    "explanationI18n": {
      "en": "Cushioning a request uses 「〜んですが」; a noun needs な before んです: 引っ越し + な + んですが. 「引っ越しんですが」 is missing the な; 「だんですが」「のんですが」 are attachments that don't exist — this is the same な as in なので. ※引っ越し = moving house, 手伝う = to help.",
      "ja": "頼みごとの前置きは「〜んですが」。名詞は な を挟む：引っ越し＋な＋んですが。「引っ越しんですが」は な 抜け。「だんですが」「のんですが」は存在しない接続——なので と同じ な。"
    }
  },
  "pattern-n4-ndesu-004": {
    "hintI18n": { "en": "Explaining why you bought a cake.", "ja": "ケーキを買った理由を説明する。" },
    "promptContextI18n": { "en": "\"It's my birthday today — that's why I bought a cake.\"", "ja": "「今日は誕生日なんです。だからケーキを買いました。」" },
    "explanationI18n": {
      "en": "Explaining the background of your own action uses 「〜んです」: 誕生日なんです = (you see,) it's my birthday. The な is already in the prompt; the other three options can't follow な — this な is the same family as なので and なのに.",
      "ja": "自分の行動の背景説明は「〜んです」：誕生日なんです。空欄の前にもう な がある——ほかの三つは な の後ろにつながらない。この な は なので・なのに と同じ仲間。"
    }
  },
  "pattern-n4-ndesu-005": {
    "hintI18n": { "en": "Your friend's carrying a big bag — ask where to.", "ja": "大きいかばんを持つ友だちに聞いてみる。" },
    "promptContextI18n": { "en": "\"(Seeing the big bag) Where are you off to?\"", "ja": "「（大きいかばんを見て）どこへ行くんですか。」" },
    "explanationI18n": {
      "en": "Asking with interest about what you see uses 「〜んですか」: どこへ行くんですか. 行く is the dictionary form — 「ですか」「ましたか」「でしたか」 can't attach; a neutral question would be 行きますか.",
      "ja": "目にした様子への関心をこめて聞くのが「〜んですか」：どこへ行くんですか。「行く」は辞書形で、「ですか」「ましたか」「でしたか」は接続できない——中立に聞くなら 行きますか。"
    }
  },
  "pattern-n4-ndesu-006": {
    "hintI18n": { "en": "Explaining why you were absent.", "ja": "休んだ事情を説明する。" },
    "promptContextI18n": { "en": "\"Why were you off?\" \"I was sick.\"", "ja": "「どうして休んだんですか。」「病気だったんです。」" },
    "explanationI18n": {
      "en": "A noun's past form attaches to んです with no な: 病気だった + んです. 「病気だったなんです」 has a superfluous な; 「だったです」「だったでした」 aren't sentences. Summary: present = 病気なんです, past = 病気だったんです.",
      "ja": "名詞の過去形は な なしで んです に接続：病気だった＋んです。「病気だったなんです」は な が余計。「だったです」「だったでした」は文にならない。整理：現在＝病気なんです、過去＝病気だったんです。"
    }
  },
  "pattern-n4-ndesu-007": {
    "hintI18n": { "en": "Opening a question to your teacher.", "ja": "先生に質問を切り出す。" },
    "promptContextI18n": { "en": "\"Sensei, I have a question — is now a good time?\"", "ja": "「先生、質問があるんですが、今いいですか。」" },
    "explanationI18n": {
      "en": "The cushion before speaking up: a verb's plain form attaches directly to 「んですが」 — 質問があるんですが. 「あるですが」 isn't a sentence (you'd say ありますが); 「あるなんですが」 adds a な that belongs only to nouns and な-adjectives; 「あるました」 isn't a form.",
      "ja": "切り出しの前置き：動詞の普通形は「んですが」に直接——質問があるんですが。「あるですが」は文にならない（ありますが と言う）。「あるなんですが」の な は名詞・な形容詞専用。「あるました」は形として存在しない。"
    }
  },
  "pattern-n4-ndesu-008": {
    "hintI18n": { "en": "Confirming your friend's study-abroad plan.", "ja": "留学の予定を確かめられて答える。" },
    "promptContextI18n": { "en": "\"You're studying abroad in Japan?\" \"Yes — I leave next year.\"", "ja": "「日本へ留学するんですか。」「はい、来年行くんです。」" },
    "explanationI18n": {
      "en": "Asked with 「〜んですか」, you answer in kind with 「〜んです」: 来年行くんです. 「行くです」「行くます」「行くでした」 are all non-sentences — after the dictionary form, only んです among these four parses. ※留学 = studying abroad.",
      "ja": "「〜んですか」と聞かれたら「〜んです」で受ける：来年行くんです。「行くです」「行くます」「行くでした」はどれも文にならない——辞書形の後ろでこの四択なら んです だけ。"
    }
  },
  "pattern-n4-suiryou-001": {
    "hintI18n": { "en": "Reading the sky.", "ja": "空模様を見て一言。" },
    "promptContextI18n": { "en": "\"The sky's dark — it might rain.\"", "ja": "「空が暗いですね。雨が降るかもしれません。」" },
    "explanationI18n": {
      "en": "Possibility uses 「〜かもしれません」 = might ~: 雨が降るかもしれません. 「かしれません」 lost the も; 「かもしりません」 garbles しれ into しり; 「かもしれました」 — no such past form exists. Memorize it as one fixed chunk. ※暗い = dark.",
      "ja": "可能性は「〜かもしれません」：雨が降るかもしれません。「かしれません」は も 抜け。「かもしりません」は しれ→しり の崩れ。「かもしれました」という過去形はない——固定形としてまるごと覚える。"
    }
  },
  "pattern-n4-suiryou-002": {
    "hintI18n": { "en": "Chatting about tomorrow's weather in plain style.", "ja": "普通体で明日の天気の話。" },
    "promptContextI18n": { "en": "\"It'll probably clear up tomorrow.\"", "ja": "「明日はたぶん晴れるだろう。」" },
    "explanationI18n": {
      "en": "「だろう」 is the plain-style counterpart of でしょう = probably: 晴れるだろう. Attaching 「だ」「だった」「ではない」 directly to the dictionary form makes no sentence — of the だ family, only だろう follows a plain verb. ※晴れる = to clear up.",
      "ja": "「だろう」は でしょう の普通体：晴れるだろう。辞書形に「だ」「だった」「ではない」を直接付けても文にならない——だ 系で動詞普通形に付くのは だろう だけ。"
    }
  },
  "pattern-n4-suiryou-003": {
    "hintI18n": { "en": "Homework troubles.", "ja": "宿題の悩みをこぼす。" },
    "promptContextI18n": { "en": "\"My homework won't get done and I'm stuck.\"", "ja": "「宿題が終わらなくて、困っています。」" },
    "explanationI18n": {
      "en": "A negative cause uses 「〜なくて」: 終わらない → 終わらなくて = because it won't finish (I'm stuck). 「終わるなくて」 bolts ない onto the dictionary form; 「終わらなくで」 is misspelled; 「終わないで」 dropped the ら. When the result is a feeling or state (困る), the cause takes なくて. ※宿題 = homework.",
      "ja": "原因の否定は「〜なくて」：終わらない→終わらなくて。「終わるなくて」は辞書形に ない 系を無理付け。「終わらなくで」は綴りの崩れ。「終わないで」は ら 抜け。後件が感情・状態（困る）のとき、原因は なくて。"
    }
  },
  "pattern-n4-suiryou-004": {
    "hintI18n": { "en": "Explaining what put you at ease.", "ja": "安心した理由を言う。" },
    "promptContextI18n": { "en": "\"I heard I passed, and felt relieved.\"", "ja": "「合格の知らせを聞いて、安心しました。」" },
    "explanationI18n": {
      "en": "The cause of a feeling (安心, びっくり, うれしい…) uses the て form: 知らせを聞いて、安心しました. 「聞くて」「聞きて」 are wrong sound changes; 「聞いで」 uses the いで that belongs to ぐ-verbs (泳ぐ→泳いで) — く-verbs take いて (聞く→聞いて). ※合格 = passing, 知らせ = news/notice, 安心する = to feel relieved.",
      "ja": "感情（安心・びっくり・うれしい…）の原因は て形：知らせを聞いて、安心しました。「聞くて」「聞きて」は誤った音便。「聞いで」の いで は ぐ 動詞用（泳ぐ→泳いで）——く 動詞は いて（聞く→聞いて）。"
    }
  },
  "pattern-n4-suiryou-005": {
    "hintI18n": { "en": "Guessing who that person is.", "ja": "あの人の身分を推測する。" },
    "promptContextI18n": { "en": "\"That person might be a student.\"", "ja": "「あの人は学生かもしれません。」" },
    "explanationI18n": {
      "en": "A noun attaches to かもしれない bare — だ drops: 学生かもしれません. 「学生だかもしれません」 keeps the だ and is wrong; 「なかもしれません」 imports んです's な; 「のかもしれません」 straight after a noun has a stray の (学生なのかもしれません is a different, valid shape). Contrast: んです wants な, かも attaches bare.",
      "ja": "名詞は かもしれない に裸で付く——だ は落とす：学生かもしれません。「学生だかもしれません」は だ が残った誤り。「なかもしれません」は んです の な の混入。「のかもしれません」は名詞直後だと の が余計（「学生なのかもしれません」なら別の正しい形）。対照：んです は な、かも は裸。"
    }
  },
  "pattern-n4-suiryou-006": {
    "hintI18n": { "en": "Guessing whether the shop is open, plain style.", "ja": "店が開いているか普通体で推測。" },
    "promptContextI18n": { "en": "\"That shop's probably closed today.\"", "ja": "「たぶんあの店は休みだろう。」" },
    "explanationI18n": {
      "en": "Nouns also attach to だろう bare: 休みだろう. 「なだろう」 imports んです's な; 「休みのだろう」 has a stray の (休みなのだろう is a different valid shape); 「いだろう」 is no form. Before かも, だろう, でしょう: present-tense だ always drops (past だった stays: 休みだっただろう).",
      "ja": "名詞は だろう にも裸で付く：休みだろう。「なだろう」は んです の な の混入。「休みのだろう」は の が余計（「休みなのだろう」なら別の形）。「いだろう」は形にならない。かも・だろう・でしょう の前では現在形の だ は必ず落とす（過去の だった は残る：休みだっただろう）。"
    }
  },
  "pattern-n4-suiryou-007": {
    "hintI18n": { "en": "Guessing how an old friend is doing.", "ja": "しばらく会っていない友だちの近況を推測。" },
    "promptContextI18n": { "en": "\"She's probably doing fine.\"", "ja": "「彼女はたぶん元気でしょう。」" },
    "explanationI18n": {
      "en": "な-adjectives attach to でしょう bare — no だ, no な: 元気でしょう. 「なでしょう」「だでしょう」 overdo it; 「元気のでしょう」 has a stray の. The family rule: かもしれない, だろう, でしょう — present-tense nouns and な-adjectives attach bare (past だった stays: 元気だったでしょう).",
      "ja": "な形容詞は でしょう に裸で付く——だ も な も不要：元気でしょう。「なでしょう」「だでしょう」は蛇足。「元気のでしょう」は の が余計。この一家のルール：かもしれない・だろう・でしょう——名詞・な形容詞の現在形は裸接続（過去の だった は残る：元気だったでしょう）。"
    }
  },
  "pattern-n4-suiryou-008": {
    "hintI18n": { "en": "Why your stomach is growling.", "ja": "おなかがすいたわけを言う。" },
    "promptContextI18n": { "en": "\"I skipped breakfast and now I'm hungry.\"", "ja": "「朝ごはんを食べなくて、おなかがすきました。」" },
    "explanationI18n": {
      "en": "The negative cause once more: 食べない → 食べなくて = because I didn't eat (I'm hungry). 「食べなくで」「食べずて」「食べないくて」 are all nonexistent forms — formula: drop the い of ない, add くて.",
      "ja": "原因の否定をもう一度：食べない→食べなくて。「食べなくで」「食べずて」「食べないくて」はどれも存在しない形——公式は「ない の い を取って くて」。"
    }
  },
  "pattern-n4-ishi-001": {
    "hintI18n": { "en": "This is the year you quit smoking.", "ja": "今年こそ禁煙、という決意。" },
    "promptContextI18n": { "en": "\"This year I'm going to quit smoking (that's my intention).\"", "ja": "「今年こそ、たばこをやめようと思っています。」" },
    "explanationI18n": {
      "en": "Declaring an intention uses the volitional + と思っています: やめようと思っています. やめる is group 2, so the volitional is stem + よう (やめよう); 「やめろう」 wrongly imports the group-1 る-verb pattern (帰る→帰ろう) — group 1 shifts the final vowel to the お row + う; 「やめしょう」「やめるう」 don't exist. ※たばこをやめる = to quit smoking.",
      "ja": "意志の表明は意向形＋と思っています：やめようと思っています。やめる は二類なので意向形は語幹＋よう。「やめろう」は一類る動詞（帰る→帰ろう）のやり方の誤用——一類は語尾をお段＋う。「やめしょう」「やめるう」は存在しない。"
    }
  },
  "pattern-n4-ishi-002": {
    "hintI18n": { "en": "Next year's work plans.", "ja": "来年の仕事の予定を語る。" },
    "promptContextI18n": { "en": "\"I plan to work in Japan next year.\"", "ja": "「来年、日本で働くつもりです。」" },
    "explanationI18n": {
      "en": "Plans use dictionary form + 「つもりだ」: 働くつもりです. つもり is a noun and never conjugates — 「つもる (積もる)」 is a different verb (snow piles up), and 「つもれ」「つもら」 treat it as a verb; none makes a sentence here. ※働く = to work.",
      "ja": "つもりは「辞書形＋つもりだ」：働くつもりです。つもり は名詞で活用しない——「つもる（積もる）」は別の動詞、「つもれ」「つもら」は動詞扱いした崩れ形で、どれも文にならない。"
    }
  },
  "pattern-n4-ishi-003": {
    "hintI18n": { "en": "No car purchase this year — that's the plan.", "ja": "今年は車を買わない、という自分の予定。" },
    "promptContextI18n": { "en": "\"I don't plan to buy a car this year.\"", "ja": "「今年は車を買わないつもりです。」" },
    "explanationI18n": {
      "en": "\"Plan NOT to\" = ない form + つもり: 買わないつもりです — the negation rides on the verb. 「もり」 is no word; 「ためです」 states a purpose and 「ほうです」 a general tendency — neither matches stating this year's plan. Only つもり fits.",
      "ja": "「しないつもり」＝ない形＋つもり：買わないつもりです——否定は前の動詞に付ける。「もり」は語にならない。「ためです」は目的、「ほうです」は普段の傾向で、「今年の自分の予定を述べる」場面に合わない——ここは つもり だけ。"
    }
  },
  "pattern-n4-ishi-004": {
    "hintI18n": { "en": "A new habit you committed to.", "ja": "自分で決めた新しい習慣。" },
    "promptContextI18n": { "en": "\"For my health, I decided to run every morning.\"", "ja": "「健康のために、毎朝走ることにしました。」" },
    "explanationI18n": {
      "en": "A decision you make yourself uses 「〜ことにする」: 走ることにしました. 「ものに」「ところに」「ぶりに」 can't express a decision. Note: 「ようにする」 (make an effort to) is a different pattern. ※健康 = health.",
      "ja": "自分の決定は「〜ことにする」：走ることにしました。「ものに」「ところに」「ぶりに」では決定の意味が出ない。なお「ようにする」（努力する）は別の文型。"
    }
  },
  "pattern-n4-ishi-005": {
    "hintI18n": { "en": "The company's staffing announcement.", "ja": "会社が発表した人事。" },
    "promptContextI18n": { "en": "\"(The company decided) I'm transferring to Osaka next month.\"", "ja": "「来月から、大阪に転勤することになりました。」" },
    "explanationI18n": {
      "en": "Decisions made by the outside (company, rules, others) use 「〜ことになる」: 転勤することになりました — I'm not choosing to transfer; it was arranged. Contrast with 004: you decide = ことにする, they decide = ことになる. 「ものに」「ままに」「とおりに」 don't attach. ※転勤 = job transfer.",
      "ja": "外部（会社・規則・他人）の決定は「〜ことになる」：転勤することになりました——自分の意志ではなく決められた。004 と対照：自分＝ことにする、外部＝ことになる。「ものに」「ままに」「とおりに」はつながらない。"
    }
  },
  "pattern-n4-ishi-006": {
    "hintI18n": { "en": "Reading out the flight information.", "ja": "フライト情報を読み上げる。" },
    "promptContextI18n": { "en": "\"The plane is scheduled to depart at 3 p.m.\"", "ja": "「飛行機は午後3時に出発する予定です。」" },
    "explanationI18n": {
      "en": "Schedules use 「〜予定だ」: 出発する予定です. 「つもり」 needs a willful agent — a plane doesn't \"intend\" to depart; 「気持ち」「考え」 are likewise human notions and don't fit a flight announcement. ※飛行機 = airplane, 予定 = schedule, 出発 = departure.",
      "ja": "スケジュールは「〜予定だ」：出発する予定です。「つもり」は意志の主体が要る——飛行機は自分で「つもり」を持たない。「気持ち」「考え」も人間のもので、フライト案内の場面に合わない。"
    }
  },
  "pattern-n4-ishi-007": {
    "hintI18n": { "en": "Passing along office gossip.", "ja": "聞いた人事のうわさを伝える。" },
    "promptContextI18n": { "en": "\"I hear Tanaka intends to quit the company.\"", "ja": "「田中さんは会社をやめるつもりらしいです。」" },
    "explanationI18n": {
      "en": "Reporting someone ELSE's intention uses 「つもりらしい」: やめるつもりらしいです. 「よう」「ましょう」 are volitional/polite-hortative and 「なさい」 is a command — none can precede らしい; to relay another person's plan you nominalize it as つもり. ※会社をやめる = to quit one's job.",
      "ja": "他人の意志の伝聞は「つもりらしい」：やめるつもりらしいです。「よう」「ましょう」は意向形/勧誘、「なさい」は命令で、どれも らしい には接続できない——他人の予定は つもり に名詞化してから伝える。"
    }
  },
  "pattern-n4-ishi-008": {
    "hintI18n": { "en": "A standing rule you keep for yourself.", "ja": "守り続けている自分ルール。" },
    "promptContextI18n": { "en": "\"I've made it a rule not to eat sweets.\"", "ja": "「甘いものは食べないことにしています。」" },
    "explanationI18n": {
      "en": "「〜ことにしている」 = a decision you keep observing: 食べないことにしています — the idiom for personal rules. 「ことへ」「ことか」「ことの」 can't attach to している. ※甘いもの = sweets.",
      "ja": "「〜ことにしている」＝決めてからずっと続けている：食べないことにしています——自分ルールの定番表現。「ことへ」「ことか」「ことの」は している につながらない。"
    }
  },
  "pattern-n4-meirei-001": {
    "hintI18n": { "en": "A fire — shout at everyone to get out.", "ja": "火事の現場、外へ走れと叫ぶ。" },
    "promptContextI18n": { "en": "\"Fire! Run!\"", "ja": "「火事だ！早く逃げろ！」" },
    "explanationI18n": {
      "en": "The emergency imperative: group-2 verbs = stem + ろ — 逃げろ! 「逃げるな」 is a prohibition (don't run) — exactly backwards in a fire; 「逃げず」 is written \"without fleeing\" and 「逃げまい」 means \"won't / probably won't flee\" — neither is a command. ※火事 = fire, 逃げる = to flee.",
      "ja": "緊急時の命令形：二類＝語幹＋ろ——逃げろ！「逃げるな」は禁止で火事の場面では正反対。「逃げず」は書き言葉の「逃げないで」、「逃げまい」は「逃げないつもり/逃げないだろう」——どちらも命令ではない。"
    }
  },
  "pattern-n4-meirei-002": {
    "hintI18n": { "en": "The coach barking at the team.", "ja": "コーチが選手に飛ばす一声。" },
    "promptContextI18n": { "en": "Coach: \"Run faster!\"", "ja": "コーチ：「もっと速く走れ！」" },
    "explanationI18n": {
      "en": "Group-1 (godan) imperative = final vowel to the え row: 走る → 走れ. 「走りろ」 wrongly imports the group-2 ろ; 「走るれ」「走りれ」 don't exist. Contrast: only group 2 takes ろ (逃げろ, 食べろ). ※コーチ = coach.",
      "ja": "一類（五段）の命令形＝語尾をえ段に：走る→走れ。「走りろ」は二類の ろ の誤用。「走るれ」「走りれ」は存在しない。対照：ろ を使うのは二類だけ（逃げろ、食べろ）。"
    }
  },
  "pattern-n4-meirei-003": {
    "hintI18n": { "en": "The rule on the park signboard.", "ja": "公園の看板の決まり文句。" },
    "promptContextI18n": { "en": "(Park sign) \"No dumping.\"", "ja": "（公園の看板）「ここにごみを捨てるな。」" },
    "explanationI18n": {
      "en": "Prohibition = dictionary form + な: 捨てるな = don't dump. 「捨てるれ」「捨てりれ」 don't exist; 「なさい」 takes the ます-stem (捨てなさい) — dictionary form + なさい (捨てるなさい) is no sentence. ※看板 = signboard, 捨てる = to throw away.",
      "ja": "禁止形＝辞書形＋な：捨てるな。「捨てるれ」「捨てりれ」は存在しない。「なさい」は ます形の語幹に付く（捨てなさい）——辞書形＋なさい（捨てるなさい）は文にならない。"
    }
  },
  "pattern-n4-meirei-004": {
    "hintI18n": { "en": "Mom hurrying the kid along.", "ja": "母親が子どもをせかす。" },
    "promptContextI18n": { "en": "Mom: \"Go do your homework.\"", "ja": "お母さん：「早く宿題をしなさい。」" },
    "explanationI18n": {
      "en": "The gentle command is ます-stem + なさい: します → し + なさい = しなさい. 「するなさい」「しるなさい」「したなさい」 all attach wrongly — only the ます-stem goes before なさい. The standard parent-to-child / teacher-to-student register.",
      "ja": "柔らかい命令は「ます形の語幹＋なさい」：します→し＋なさい。「するなさい」「しるなさい」「したなさい」はどれも接続が誤り——なさい の前は ます形の語幹だけ。親→子、先生→生徒の定番の口調。"
    }
  },
  "pattern-n4-meirei-005": {
    "hintI18n": { "en": "Late-night self-talk: time to go.", "ja": "夜遅く、そろそろ帰らないと、という独り言。" },
    "promptContextI18n": { "en": "\"It's late — I've got to get home.\"", "ja": "「もう遅い。早く帰らなきゃ。」" },
    "explanationI18n": {
      "en": "The colloquial obligation contraction 「〜なきゃ」 = なければ(ならない): 帰らなきゃ = gotta go home. 「ないきゃ」「なちゃ」「なけば」 are all broken forms. Its sibling is 「なくちゃ」 (= なくては) — both are common; learn them as a pair.",
      "ja": "口語の義務の縮約「〜なきゃ」＝なければ（ならない）：帰らなきゃ。「ないきゃ」「なちゃ」「なけば」は崩れた偽形。相方は「なくちゃ」（＝なくては）——どちらもよく使うのでペアで覚える。"
    }
  },
  "pattern-n4-meirei-006": {
    "hintI18n": { "en": "The doctor's instruction to your father.", "ja": "医者が父に出した指示。" },
    "promptContextI18n": { "en": "\"The doctor told my father to quit drinking.\"", "ja": "「医者は父にお酒をやめるように言いました。」" },
    "explanationI18n": {
      "en": "Relaying an order or instruction uses 「〜ように言う」: やめるように言いました = (the doctor) told (him) to quit. 「ままに」「とおりに」「ばかりに」 can't express an instruction. ※医者 = doctor.",
      "ja": "指示の伝達は「〜ように言う」：やめるように言いました。「ままに」「とおりに」「ばかりに」では指示の意味が出ない。"
    }
  },
  "pattern-n4-meirei-007": {
    "hintI18n": { "en": "What your senpai snapped at you.", "ja": "先輩に言われた一言。" },
    "promptContextI18n": { "en": "\"My senpai told me: 'Practice more!'\"", "ja": "「先輩に『もっと練習しろ』と言われました。」" },
    "explanationI18n": {
      "en": "する's imperative is しろ: 練習しろ! 「しりろ」「すろ」「さろ」 don't exist — する is irregular, so its imperative is memorized (spoken しろ; written test instructions use the literary せよ; some dialects have せえ). ※先輩 = senior.",
      "ja": "する の命令形は しろ：練習しろ！「しりろ」「すろ」「さろ」は存在しない——する は不規則動詞で、命令形は暗記（口語 しろ、書面の指示は文語 せよ、方言には せえ も）。"
    }
  },
  "pattern-n4-meirei-008": {
    "hintI18n": { "en": "The red inverted-triangle sign at the intersection.", "ja": "交差点の赤い逆三角形の標識の文字。" },
    "promptContextI18n": { "en": "(Road sign) \"Stop.\"", "ja": "（道路標識）「止まれ。」" },
    "explanationI18n": {
      "en": "Road signs use the imperative: 止まれ = stop (group 1, final vowel to え). Japan's stop sign is a red inverted triangle whose Japanese text reads 止まれ (newer signs add STOP in English). 「止まるな」 prohibits stopping — no intersection sign says that; 「止まりろ」「止まるれ」 don't exist. ※道路標識 = road sign.",
      "ja": "道路標識は命令形：止まれ（一類・語尾え段）。日本の一時停止標識は赤い逆三角形で、日本語表記は「止まれ」（新しい標識には STOP が併記される）。「止まるな」は停止の禁止で、交差点の標識にはあり得ない。「止まりろ」「止まるれ」は存在しない。"
    }
  },
  "pattern-n4-shushoku-001": {
    "hintI18n": { "en": "This book joined your shelf yesterday.", "ja": "この本を手に入れたのは昨日。" },
    "promptContextI18n": { "en": "\"This is the book I bought yesterday.\"", "ja": "「これはきのう買った本です。」" },
    "explanationI18n": {
      "en": "Parking a sentence before a noun = a noun-modifying clause, and its verb is plain: きのう買った本 = the book I bought yesterday. 「買う本」 is a book you WILL buy — clashing with きのう; 「買います」 is polite, and polite forms generally can't enter a modifier clause (always wrong on tests); 「買って本」 is no sentence.",
      "ja": "名詞の前に文をまるごと置く＝名詞修飾節。動詞は普通形：きのう買った本。「買う本」は「これから買う本」で きのう と矛盾。「買います」は敬体で、修飾節には原則入らない（試験では常に誤り）。「買って本」は文にならない。"
    }
  },
  "pattern-n4-shushoku-002": {
    "hintI18n": { "en": "Pointing out who's singing over there.", "ja": "あそこで歌っているのが誰かを言う。" },
    "promptContextI18n": { "en": "\"The person singing over there is Tanaka.\"", "ja": "「あそこで歌っている人は田中さんです。」" },
    "explanationI18n": {
      "en": "Inside the clause, plain forms only: 歌っている人 = the person singing. 「歌っています人」 shoves a polite form into the clause — generally no sentence, always wrong on tests (ultra-formal letters are another world); 「歌いますの」「歌ってる人の」 are scrambles. ※歌う = to sing.",
      "ja": "節の中は普通形：歌っている人。「歌っています人」は敬体を修飾節に入れた形——原則文にならず、試験では常に誤り（超改まった書簡は別世界）。「歌いますの」「歌ってる人の」は崩れ形。"
    }
  },
  "pattern-n4-shushoku-003": {
    "hintI18n": { "en": "Whose cooking is on the table.", "ja": "この料理を作ったのは誰かを言う。" },
    "promptContextI18n": { "en": "\"This is a dish my mother made.\"", "ja": "「これは母が作った料理です。」" },
    "explanationI18n": {
      "en": "The clause's subject takes 「が」: 母が作った料理. 「から」 would mean \"a dish made FROM mother\" and 「で」 \"a dish made USING mother\" — both nonsense; 「を」's slot is already taken by 料理. Two bonus notes: the topic marker は can't enter a modifier clause (use が), and the clause's が can swap with の (母の作った料理), an elegant equivalent.",
      "ja": "節内の主語は「が」：母が作った料理。「から」だと「母から作った料理」、「で」だと「母で作った料理」で意味が壊れる。「を」の席は 料理 が使用中。おまけ二つ：主題の は は修飾節に入れない（が を使う）。節内の が は の と交替できる（母の作った料理）。"
    }
  },
  "pattern-n4-shushoku-004": {
    "hintI18n": { "en": "A new shop opened by the station — name included.", "ja": "駅前の新しい店を、名前つきで紹介。" },
    "promptContextI18n": { "en": "\"A shop called Sakura opened in front of the station.\"", "ja": "「駅前に『さくら』という店ができました。」" },
    "explanationI18n": {
      "en": "Introducing something by name uses 「〜という＋noun」: 「さくら」という店 = a shop called Sakura. 「にいう」「でいう」「がいう」 aren't this pattern — the chunk is fixed as と + いう. ※駅前 = in front of the station.",
      "ja": "名前を添えて紹介するのは「〜という＋名詞」：「さくら」という店。「にいう」「でいう」「がいう」はこの文型ではない——と＋いう で固定。"
    }
  },
  "pattern-n4-shushoku-005": {
    "hintI18n": { "en": "Next week's hotel is already booked.", "ja": "来週のホテルはもう手配済み。" },
    "promptContextI18n": { "en": "\"The hotel we're staying at next week is already booked.\"", "ja": "「来週泊まるホテルは、もう予約しました。」" },
    "explanationI18n": {
      "en": "The clause's tense tracks its OWN event, not the main clause: the stay is next week, not yet happened → dictionary form 泊まるホテル (only the booking is done). 「泊まった」 clashes with 来週; 「泊まりますの」 is a polite-form scramble; 「泊まって」 is no sentence. ※泊まる = to stay (overnight), 予約 = reservation.",
      "ja": "節の時制は「その出来事」基準で、主文に引きずられない：宿泊は来週でまだ先→辞書形 泊まるホテル（済んだのは予約だけ）。「泊まった」は来週と矛盾。「泊まりますの」は敬体の崩れ形。「泊まって」は文にならない。"
    }
  },
  "pattern-n4-shushoku-006": {
    "hintI18n": { "en": "Off to see a friend.", "ja": "友だちに会いに行く話。" },
    "promptContextI18n": { "en": "\"I'm going to see a friend who still lives in Osaka.\"", "ja": "「大阪に今も住んでいる友だちに会いに行きます。」" },
    "explanationI18n": {
      "en": "\"A friend living in Osaka\" = a stative modifier clause: 住んでいる友だち. 「住んでいます」 is polite and generally can't modify (always wrong on tests); 「住んでいるの友だち」 has a stray の; 「住んでいた」 is \"used to live\" — flatly contradicting the clause's 今も (still now).",
      "ja": "「大阪に住んでいる友だち」＝状態の修飾節。「住んでいます」は敬体で修飾節には原則入らない（試験では誤り）。「住んでいるの友だち」は の が余計。「住んでいた」は「昔住んでいた」で、節内の「今も」と真っ向から矛盾する。"
    }
  },
  "pattern-n4-shushoku-007": {
    "hintI18n": { "en": "Passing along Tanaka's message.", "ja": "田中さんの伝言を伝える。" },
    "promptContextI18n": { "en": "\"Tanaka was saying he'll take next week off.\"", "ja": "「田中さんは来週休むと言っていました。」" },
    "explanationI18n": {
      "en": "Reporting what someone said uses 「〜と言っていました」 — the standard quote marker is と (colloquial speech also has って): 休むと言っていました. 「を」「に」「が」 can't mark quoted content. と言っていた carries more of a \"relaying this to you\" tone than と言った.",
      "ja": "人の発言の伝達は「〜と言っていました」——標準の引用マーカーは と（話し言葉には って もある）：休むと言っていました。「を」「に」「が」は引用内容に付けられない。と言っていた は と言った より「あなたに伝えている」響きが出る。"
    }
  },
  "pattern-n4-shushoku-008": {
    "hintI18n": { "en": "Explaining a Japanese word.", "ja": "日本語の単語をひとつ解説。" },
    "promptContextI18n": { "en": "\"『さくら』 is the name of this flower.\"", "ja": "「『さくら』というのは、この花の名前です。」" },
    "explanationI18n": {
      "en": "Definitions use 「〜というのは」 = \"so-called ~ / what ~ means\": 「さくら」というのは. The same という as in 004, plus のは to open a definition. 「はいう」「でいう」「をいう」 don't work in this pattern — the chunk is fixed with と.",
      "ja": "定義は「〜というのは」：「さくら」というのは。004 と同じ という に のは を付けると定義文の頭になる。「はいう」「でいう」「をいう」はこの文型では成立しない——と で固定。"
    }
  },
  "pattern-n4-kansetsu-001": {
    "hintI18n": { "en": "Asked about the party, you're still on the fence.", "ja": "パーティーの話を振られたが、まだ迷っている。" },
    "promptContextI18n": { "en": "\"I haven't decided whether to go to the party.\"", "ja": "「パーティーに行くかどうか、まだ決めていません。」" },
    "explanationI18n": {
      "en": "\"Whether ~\" = 「〜かどうか」: 行くかどうか = whether to go. The chunk is fixed as か + どうか; 「を」「に」「で」 all break it. ※パーティー = party, 決める = to decide.",
      "ja": "「〜かどうか」＝〜するかしないか：行くかどうか。か＋どうか で固定のかたまり。「を」「に」「で」を入れると壊れる。"
    }
  },
  "pattern-n4-kansetsu-002": {
    "hintI18n": { "en": "Fishing for the meeting's start time.", "ja": "会議の開始時刻を尋ねる。" },
    "promptContextI18n": { "en": "\"Do you know when the meeting starts?\"", "ja": "「会議がいつ始まるか、知っていますか。」" },
    "explanationI18n": {
      "en": "The clause already has a question word (いつ), so the indirect question takes plain 「〜か」: いつ始まるか. 「かどうか」 is only for yes/no clauses WITHOUT a question word — 「いつ始まるかどうか」 is wrong; 「ので」「まで」 can't build an indirect question. ※会議 = meeting.",
      "ja": "節内にもう疑問詞（いつ）があるので、間接疑問は「〜か」：いつ始まるか。「かどうか」は疑問詞の「ない」Yes/No 型専用——「いつ始まるかどうか」は誤り。「ので」「まで」では間接疑問にならない。"
    }
  },
  "pattern-n4-kansetsu-003": {
    "hintI18n": { "en": "The keys are... somewhere.", "ja": "かぎの置き場所が思い出せない。" },
    "promptContextI18n": { "en": "\"I forgot where I put the keys.\"", "ja": "「かぎをどこに置いたか、忘れてしまいました。」" },
    "explanationI18n": {
      "en": "Question word (どこ) + 「〜か」 = the indirect question: どこに置いたか忘れました. 「かどうか」 can't co-occur with a question word; 「まで」「より」 don't attach. ※かぎ = key, 置く = to put.",
      "ja": "疑問詞（どこ）＋「〜か」＝間接疑問：どこに置いたか忘れました。「かどうか」は疑問詞と併用できない。「まで」「より」はつながらない。"
    }
  },
  "pattern-n4-kansetsu-004": {
    "hintI18n": { "en": "Checking the forecast for tomorrow.", "ja": "明日の天気を予報で確かめる。" },
    "promptContextI18n": { "en": "\"I'll check the forecast to see whether it'll be sunny tomorrow.\"", "ja": "「明日晴れるかどうか、天気予報を見て確認します。」" },
    "explanationI18n": {
      "en": "A yes/no clause with no question word takes 「〜かどうか」: 晴れるかどうか = whether it'll clear up. 「かどうして」「がどうか」「をどうか」 are all non-sentences — the only fixed pairing is か + どうか. ※晴れる = to clear up, 天気予報 = weather forecast, 確認 = to check.",
      "ja": "疑問詞のない Yes/No 型は「〜かどうか」：晴れるかどうか。「かどうして」「がどうか」「をどうか」はどれも文にならない——固定の組み合わせは か＋どうか だけ。"
    }
  },
  "pattern-n4-kansetsu-005": {
    "hintI18n": { "en": "Why is Tanaka fuming? Anyone know?", "ja": "田中さんの怒りの理由を探る。" },
    "promptContextI18n": { "en": "\"Does anyone know why Tanaka is angry?\"", "ja": "「田中さんがどうして怒っているか、だれか知りませんか。」" },
    "explanationI18n": {
      "en": "Question word (どうして) + 「〜か」: どうして怒っているか. The rule once more: question word → か, none → かどうか — 「どうして〜かどうか」 is wrong. 「ので」「のに」 mark reason/contrast, not indirect questions. ※怒る = to get angry.",
      "ja": "疑問詞（どうして）＋「〜か」：どうして怒っているか。ルール再確認：疑問詞あり→か、なし→かどうか——「どうして〜かどうか」は誤り。「ので」「のに」は理由/逆接で間接疑問にならない。"
    }
  },
  "pattern-n4-kansetsu-006": {
    "hintI18n": { "en": "Is that story even true?", "ja": "その話、信じていいのか。" },
    "promptContextI18n": { "en": "\"I don't know whether that story is true.\"", "ja": "「その話が本当かどうか、分かりません。」" },
    "explanationI18n": {
      "en": "Nouns and な-adjectives attach to 「かどうか」 bare — だ drops: 本当かどうか. Filling in 「な」「だ」「の」 gives 本当などうか / 本当だどうか / 本当のどうか — all missing the か, none a sentence. Standard form = noun directly + かどうか (colloquial Japanese has a separate 「〜だか」, but at N4 learn the bare attachment). ※本当 = true.",
      "ja": "名詞・な形容詞は「かどうか」に裸で付く——だ は落とす：本当かどうか。「な」「だ」「の」を入れると 本当などうか／本当だどうか／本当のどうか——どれも か が欠けて文にならない。標準形＝名詞＋かどうか（話し言葉には「〜だか」もあるが、N4 は裸接続で覚える）。"
    }
  },
  "pattern-n4-kansetsu-007": {
    "hintI18n": { "en": "Asking for their arrival time.", "ja": "到着時刻を教えてもらう。" },
    "promptContextI18n": { "en": "\"Please tell me what time you're coming.\"", "ja": "「何時に来るか、教えてください。」" },
    "explanationI18n": {
      "en": "The inside of an indirect question stays plain + か: 何時に来るか教えてください. 「来るますか」 is broken attachment — polite forms generally stay out of indirect questions; the politeness lives in the final 教えてください. 「より」「なか」 can't build an indirect question. ※何時 = what time.",
      "ja": "間接疑問の中身は普通形＋か：何時に来るか教えてください。「来るますか」は接続の破綻——敬体は原則、間接疑問の中に入れない。丁寧さは文末の 教えてください で足りる。「より」「なか」では間接疑問にならない。"
    }
  },
  "pattern-n4-kansetsu-008": {
    "hintI18n": { "en": "Pushing someone to make up their mind.", "ja": "早く決めてと迫る。" },
    "promptContextI18n": { "en": "\"Going or not — decide already.\"", "ja": "「行くか行かないか、早く決めてください。」" },
    "explanationI18n": {
      "en": "「〜か〜ないか」 is かどうか spelled out: 行くか行かないか = go or not go. The second か can't become 「を」「で」「まで」 — both halves need か to pair up.",
      "ja": "「〜か〜ないか」は かどうか の展開形：行くか行かないか。二つ目の か は「を」「で」「まで」に変えられない——両側とも か でペアになる。"
    }
  },
  "pattern-te-kudasai-001": {
    "hintI18n": {
      "en": "A manager gives a subordinate a work deadline.",
      "ja": "上司が部下に仕事の期限を指示する。"
    },
    "promptContextI18n": {
      "en": "Manager to subordinate: \"Hand in the materials by next week.\"",
      "ja": "上司が部下に：「来週までに資料を出してください。」"
    },
    "explanationI18n": {
      "en": "This is a work instruction from a manager to a subordinate — a request → 「てください」. 「てもいい」 asks for or grants permission; 「てはいけない」 is a prohibition; 「なくてもいい」 means it isn't necessary.",
      "ja": "上司が部下に出す仕事の指示で、依頼なので →「てください」。「てもいい」は許可を求める／与える表現、「てはいけない」は禁止、「なくてもいい」は不要という意味。"
    }
  },
  "pattern-te-kudasai-002": {
    "hintI18n": {
      "en": "A student asks a teacher whether they may use something.",
      "ja": "学生が先生に、あるものを使ってよいか尋ねる。"
    },
    "promptContextI18n": {
      "en": "Student to teacher: \"Excuse me, may I use the dictionary?\"",
      "ja": "学生が先生に：「すみません、辞書を使ってもいいですか？」"
    },
    "explanationI18n": {
      "en": "Asking for permission, made into a question with 「か」 → 「てもいい+か」. 「てください」 asks the other person to do something; 「てはいけません」 is a prohibition; 「なくてもいい」 means it isn't necessary.",
      "ja": "許可を求め、「か」を付けて疑問にしている →「てもいい+か」。「てください」は相手にしてもらう依頼、「てはいけません」は禁止、「なくてもいい」は不要という意味。"
    }
  },
  "pattern-te-kudasai-003": {
    "hintI18n": {
      "en": "A library notice about eating and drinking inside the building.",
      "ja": "館内での飲食についての図書館の掲示。"
    },
    "promptContextI18n": {
      "en": "Library notice: \"Please do not eat or drink inside the library.\"",
      "ja": "図書館の掲示：「館内での飲食はご遠慮ください。」"
    },
    "explanationI18n": {
      "en": "A prohibition rule for a public place → 「てはいけません」. 「てもいい」 grants permission; 「てください」 asks the other person to do something; 「なくてもいい」 means it isn't necessary.",
      "ja": "公共の場での禁止の規定 →「てはいけません」。「てもいい」は許可、「てください」は相手にしてもらう依頼、「なくてもいい」は不要という意味。"
    }
  },
  "pattern-te-kudasai-004": {
    "hintI18n": {
      "en": "Speaking to a friend on the train about how loud they are being.",
      "ja": "電車の中で、声の大きさについて友達に話す。"
    },
    "promptContextI18n": {
      "en": "Reminding a friend on the train: \"Please talk a little more quietly, okay?\"",
      "ja": "電車の中で友達に注意する：「もう少し小さい声で話してくださいね。」"
    },
    "explanationI18n": {
      "en": "A polite request between friends → 「てください」 (softened with 「ね」). 「てはいけません」 is too heavy for a friend; 「てもいい」 and 「なくてもいい」 don't fit a request.",
      "ja": "友達同士の丁寧な依頼 →「てください」（「ね」で語気を和らげている）。「てはいけません」は友達には重すぎ、「てもいい」「なくてもいい」は依頼の語気に合わない。"
    }
  },
  "pattern-te-kudasai-005": {
    "hintI18n": {
      "en": "A patient asks a doctor about drinking alcohol.",
      "ja": "患者が飲酒について医者に尋ねる。"
    },
    "promptContextI18n": {
      "en": "Patient to doctor: \"May I drink alcohol?\"",
      "ja": "患者が医者に：「お酒を飲んでもいいですか？」"
    },
    "explanationI18n": {
      "en": "The patient is asking the doctor for permission to drink → 「てもいいですか」. 「てください」 would mean the doctor is telling the patient to drink; 「てはいけません」 is the doctor prohibiting it; 「なくてもいい」 is the doctor saying it isn't necessary to drink.",
      "ja": "患者が医者に飲酒の許可を求めている →「てもいいですか」。「てください」は医者が患者に飲むよう言う表現、「てはいけません」は医者による禁止、「なくてもいい」は医者が飲む必要はないと言う表現。"
    }
  },
  "pattern-te-kudasai-006": {
    "hintI18n": {
      "en": "The content of a sign in a parking lot.",
      "ja": "駐車場の看板の内容。"
    },
    "promptContextI18n": {
      "en": "Parking lot sign: \"No parking here.\"",
      "ja": "駐車場の標識：「ここに駐車してはいけません。」"
    },
    "explanationI18n": {
      "en": "A clear prohibition sign → 「てはいけません」. The other options mean, respectively, may park (てもいい), please park (てください), and need not park (なくてもいい).",
      "ja": "はっきりとした禁止の標示 →「てはいけません」。他の選択肢はそれぞれ、止めてもよい（てもいい）、止めてほしい（てください）、止めなくてよい（なくてもいい）という意味。"
    }
  },
  "pattern-te-kudasai-007": {
    "hintI18n": {
      "en": "A shop clerk guides a customer to write their name on a form.",
      "ja": "店員が客に、用紙へ名前を書くよう案内する。"
    },
    "promptContextI18n": {
      "en": "Clerk to customer: \"Sorry to trouble you, but please write your name here.\"",
      "ja": "店員が客に：「お手数ですが、こちらにお名前を書いてください。」"
    },
    "explanationI18n": {
      "en": "The clerk is politely asking the customer to write their name → 「てください」 (made more polite with 「お手数ですが」). None of the other options fit the tone of asking the other person to do something.",
      "ja": "店員が客に丁寧に名前を書くよう依頼している →「てください」（「お手数ですが」を付けてより丁寧に）。他の選択肢はいずれも「相手にしてもらう」語気に合わない。"
    }
  },
  "pattern-te-kudasai-008": {
    "hintI18n": {
      "en": "A mother's safety words to her child about fire.",
      "ja": "母親が子供に、火についての安全を伝える言葉。"
    },
    "promptContextI18n": {
      "en": "Mother to child: \"It's dangerous, so don't touch the fire.\"",
      "ja": "母親が子供に：「危ないから、火に触ってはいけません。」"
    },
    "explanationI18n": {
      "en": "A safety warning to protect the child → the strong prohibition 「てはいけません」. The other options mean, respectively, permission, a request, and that it isn't necessary.",
      "ja": "子供を守るための安全上の警告 →強い禁止の「てはいけません」。他の選択肢はそれぞれ、許可、依頼、不要という意味。"
    }
  },
  "pattern-nakute-mo-ii-001": {
    "hintI18n": {
      "en": "Deciding about medicine after the fever has gone down.",
      "ja": "熱が下がった後の服薬の判断。"
    },
    "promptContextI18n": {
      "en": "The fever has already gone down, so tomorrow I don't have to take the medicine.",
      "ja": "もう熱が下がったから、明日は薬を飲まなくてもいい。"
    },
    "explanationI18n": {
      "en": "The cause 「熱が下がった」 (the fever went down) leads to \"no longer need to take it\" → 「なくてもいい」. 「なければならない」 means \"must\" (the opposite situation); 「てはいけない」 means \"must not\" (wrong here medically); 「てもいい」 means \"may drink\" (too weak in meaning).",
      "ja": "前提の「熱が下がった」を受けて、後件は「もう飲む必要はない」を表す →「なくてもいい」。「なければならない」は「必須」（状況が逆）、「てはいけない」は「不可」（医療上おかしい）、「てもいい」は「飲んでもよい」（意味が弱すぎる）。"
    }
  },
  "pattern-nakute-mo-ii-002": {
    "hintI18n": {
      "en": "Arranging bedtime the night before an exam.",
      "ja": "試験の前夜の就寝の段取り。"
    },
    "promptContextI18n": {
      "en": "There's an exam tomorrow, so today I have to go to bed early.",
      "ja": "明日は試験があるから、今日は早く寝なければならない。"
    },
    "explanationI18n": {
      "en": "The clause 「試験がある」 is a strong reason → \"must go to bed early\" uses 「なければならない」. 「なくてもいい」 means it isn't necessary; 「てはいけない」 is a prohibition; 「てもいい」 is too weak in nuance.",
      "ja": "前件の「試験がある」が強い動機 →「早く寝なければならない」で「必須」を表す。「なくてもいい」は不要、「てはいけない」は禁止、「てもいい」はニュアンスが弱すぎる。"
    }
  },
  "pattern-nakute-mo-ii-003": {
    "hintI18n": {
      "en": "Whether to come into the office on the weekend.",
      "ja": "週末に出社するかどうか。"
    },
    "promptContextI18n": {
      "en": "You don't have to come to the office on weekends.",
      "ja": "土日はオフィスに来なくてもいいです。"
    },
    "explanationI18n": {
      "en": "「土日」 indicates days off, so the natural meaning is \"don't have to come\" → 「なくてもいい」. 「なければならない」 means \"must\"; 「てはいけない」 forbids coming; 「てください」 requests coming.",
      "ja": "「土日」は休みの日を表し、自然な意味は「来る必要はない」 →「なくてもいい」。「なければならない」は必須、「てはいけない」は来ることの禁止、「てください」は来るよう依頼する表現。"
    }
  },
  "pattern-nakute-mo-ii-004": {
    "hintI18n": {
      "en": "The relationship between a license and driving.",
      "ja": "免許と運転の関係。"
    },
    "promptContextI18n": {
      "en": "If you have a license, you may drive a car.",
      "ja": "免許を持っていれば、車を運転してもいい。"
    },
    "explanationI18n": {
      "en": "「免許を持っていれば」 states the condition, and the clause expresses \"under this condition it is permitted\" → 「てもいい」. 「なくてもいい」 means \"don't have to drive\"; 「なければならない」 means \"must drive\"; 「てはいけない」 means \"must not drive\" (contradicts the first clause).",
      "ja": "「免許を持っていれば」で条件を示し、後件は「その条件で許可される」を表す →「てもいい」。「なくてもいい」は「運転しなくてよい」、「なければならない」は「運転しなければならない」、「てはいけない」は「運転してはいけない」（前件と矛盾）。"
    }
  },
  "pattern-nakute-mo-ii-005": {
    "hintI18n": {
      "en": "Advice about coming to work when you're sick.",
      "ja": "病気のときの出勤についての助言。"
    },
    "promptContextI18n": {
      "en": "When you're sick, you don't have to force yourself to come to work.",
      "ja": "病気の時は、無理して仕事に来なくてもいいです。"
    },
    "explanationI18n": {
      "en": "「無理して」 carries a negative nuance, and the clause means \"you don't have to push yourself\" → 「なくてもいい」. 「なければならない」 means \"must come\" (the reverse); 「てはいけない」 means \"must not come\"; 「てもいい」 means \"may come\".",
      "ja": "「無理して」は否定的な色合いを持ち、後件の意味は「無理をする必要はない」 →「なくてもいい」。「なければならない」は「来なければならない」（逆）、「てはいけない」は「来てはいけない」、「てもいい」は「来てもよい」。"
    }
  },
  "pattern-nakute-mo-ii-006": {
    "hintI18n": {
      "en": "The cost of borrowing books at a library.",
      "ja": "図書館で本を借りるときの費用。"
    },
    "promptContextI18n": {
      "en": "When you borrow books at the library, you don't have to pay any money.",
      "ja": "図書館では本を借りる時、お金を払わなくてもいい。"
    },
    "explanationI18n": {
      "en": "Borrowing books at a library is usually free → \"don't have to pay\" uses 「なくてもいい」. 「なければならない」 means \"must pay\"; 「てはいけない」 means \"must not pay\" (makes no sense); 「てもいい」 means \"may pay\" (weak in meaning).",
      "ja": "図書館の貸し出しは通常無料 →「払う必要はない」で「なくてもいい」。「なければならない」は「払わなければならない」、「てはいけない」は「払ってはいけない」（筋が通らない）、「てもいい」は「払ってもよい」（意味が弱い）。"
    }
  },
  "pattern-nakute-mo-ii-007": {
    "hintI18n": {
      "en": "Getting your textbook ready before class.",
      "ja": "授業が始まる前の教科書の準備。"
    },
    "promptContextI18n": {
      "en": "Before class starts, you must always have your textbook ready.",
      "ja": "授業が始まる前に、必ず教科書を準備しなければならない。"
    },
    "explanationI18n": {
      "en": "「必ず」 (always / without fail) directly signals a strong obligation → 「なければならない」. The other options don't fit the compulsory feel of 「必ず」.",
      "ja": "「必ず」が強い義務を直接示す →「なければならない」。他の選択肢は「必ず」の強制感に合わない。"
    }
  },
  "pattern-nakute-mo-ii-008": {
    "hintI18n": {
      "en": "Deciding what to wear to a casual party.",
      "ja": "カジュアルなパーティーの服装の判断。"
    },
    "promptContextI18n": {
      "en": "The party is a casual occasion with no particular dress code, so you don't have to wear a suit.",
      "ja": "パーティーはカジュアルな場で、特に服装の決まりもないので、スーツを着なくてもいい。"
    },
    "explanationI18n": {
      "en": "「ドレスコードは特になく」 (no particular dress code) is a strong \"you don't have to\" signal → 「なくてもいい」. 「なければならない」 and 「着るしかない」 mean \"must / have no choice but to wear\" (clash with the first clause); 「てはいけない」 means \"must not wear\" (over-prohibiting).",
      "ja": "「ドレスコードは特になく」が強い「不要」のサイン →「なくてもいい」。「なければならない」「着るしかない」は「着なければならない／着るしかない」（前件と衝突）、「てはいけない」は「着てはいけない」（過度の禁止）。"
    }
  },
  "pattern-te-morau-001": {
    "hintI18n": {
      "en": "An interaction between me and my younger sister when she's having trouble with schoolwork.",
      "ja": "妹が勉強で困っているときの、私と妹のやり取り。"
    },
    "promptContextI18n": {
      "en": "My little sister didn't understand her homework, so I taught her.",
      "ja": "妹は宿題が分からなかったので、私は妹に教えてあげた。"
    },
    "explanationI18n": {
      "en": "\"I\" do something for my younger sister, who is lower in position → 「てあげる」. 「てくれる」 is someone doing something for me; 「てもらう」 is me having someone do something; 「ていただく」 is the humble form of 「てもらう」.",
      "ja": "「私」が目下の妹にしてあげる →「てあげる」。「てくれる」は他人が私にしてくれる、「てもらう」は私が他人にしてもらう、「ていただく」は「てもらう」の謙譲語。"
    }
  },
  "pattern-te-morau-002": {
    "hintI18n": {
      "en": "An interaction with a friend about heavy luggage and getting to the airport.",
      "ja": "重い荷物と空港への送迎をめぐる、友達とのやり取り。"
    },
    "promptContextI18n": {
      "en": "Because the luggage was heavy, my friend carried it to the airport for me.",
      "ja": "重い荷物だったから、友達が空港まで運んでくれた。"
    },
    "explanationI18n": {
      "en": "Someone else (a friend) does something for me → 「てくれる」. 「てあげる」 is me doing something for someone else; 「てもらう」 requires marking the doer with 「に」; 「差し上げる」 is the humble form of 「あげる」, used when doing something for a superior (a friend is a peer, so it doesn't apply).",
      "ja": "他人（友達）が私にしてくれる →「てくれる」。「てあげる」は私が他人にしてあげる、「てもらう」は動作主を「に」で示す必要がある、「差し上げる」は「あげる」の謙譲語で目上の人にする場合に使う（友達は同輩なので不適）。"
    }
  },
  "pattern-te-morau-003": {
    "hintI18n": {
      "en": "How the teacher handled my composition.",
      "ja": "先生が私の作文をどう扱ったか。"
    },
    "promptContextI18n": {
      "en": "The teacher carefully corrected my composition for me.",
      "ja": "先生は私の作文を丁寧に直してくださった。"
    },
    "explanationI18n": {
      "en": "A superior (the teacher) does something for \"me\" → 「てくださる」 (the respectful form of 「てくれる」). 「てあげる」 is me doing something for someone else; 「てもらう」 needs a 私に先生 structure; 「差し上げる」 is me doing something for a superior.",
      "ja": "目上（先生）が「私」にしてくださる →「てくださる」（「てくれる」の尊敬語）。「てあげる」は私が他人にしてあげる、「てもらう」は「私に先生」の構造が必要、「差し上げる」は私が目上にする表現。"
    }
  },
  "pattern-te-morau-004": {
    "hintI18n": {
      "en": "An arrangement between me and my older brother about a ride to the station.",
      "ja": "駅までの送りをめぐる、私と兄との段取り。"
    },
    "promptContextI18n": {
      "en": "I asked my older brother to take me to Tokyo Station.",
      "ja": "兄に頼んで、東京駅まで送ってもらった。"
    },
    "explanationI18n": {
      "en": "「兄に頼んで」 shows \"I actively asked\" → 「てもらう」. 「てくれる」 is someone acting on their own initiative; 「てあげる」 is me doing something for someone else; 「てくださる」 is a superior acting on their own initiative.",
      "ja": "「兄に頼んで」は「私が自ら頼んだ」を表す →「てもらう」。「てくれる」は他人が自発的にする、「てあげる」は私が他人にしてあげる、「てくださる」は目上が自発的にする表現。"
    }
  },
  "pattern-te-morau-005": {
    "hintI18n": {
      "en": "Guiding a lost child to the station.",
      "ja": "道に迷った子供を駅まで案内する。"
    },
    "promptContextI18n": {
      "en": "There was a child lost on the street, so I took them to the station.",
      "ja": "道に迷っている子供がいたので、駅まで案内してあげた。"
    },
    "explanationI18n": {
      "en": "\"I\" do a kind act for someone younger (a child) → 「てあげる」. 「てくれる」 is someone doing something for me (wrong direction, ×); 「てもらう」 is me asking someone to do something (×); 「差し上げる」 is the humble form of 「あげる」 (used when doing something for a superior), unnatural for an ordinary child (×). Only 「あげた」 is natural.",
      "ja": "「私」が目下（子供）に善行をする →「てあげる」。「てくれる」は他人が私にしてくれる（×方向が逆）、「てもらう」は私が他人にしてもらう（×）、「差し上げる」は「あげる」の謙譲語（目上の人にする場合に使う）で、一般の子供には不自然（×）。「あげた」のみ自然。"
    }
  },
  "pattern-te-morau-006": {
    "hintI18n": {
      "en": "A mother preparing a lunchbox for the family every day.",
      "ja": "母親が毎日家族のためにお弁当を用意する。"
    },
    "promptContextI18n": {
      "en": "My mom makes me a lunchbox every morning.",
      "ja": "母が毎朝、お弁当を作ってくれる。"
    },
    "explanationI18n": {
      "en": "A family member (mother) does something for \"me\" → 「てくれる」 (no honorific language for family). 「てあげる」 is me doing something for someone else; 「てもらう」 is actively asking someone; 「てくださる」 is too respectful for one's own family.",
      "ja": "家族（母）が「私」にしてくれる →「てくれる」（家族には敬語を使わない）。「てあげる」は私が他人にしてあげる、「てもらう」は自ら他人に頼む、「てくださる」は身内には敬いすぎ。"
    }
  },
  "pattern-te-morau-007": {
    "hintI18n": {
      "en": "An arrangement with the section chief about next week's meeting materials.",
      "ja": "来週の会議資料をめぐる課長との段取り。"
    },
    "promptContextI18n": {
      "en": "I plan to ask the section chief to look over next week's meeting materials.",
      "ja": "来週の会議の資料を、課長に見ていただくつもりです。"
    },
    "explanationI18n": {
      "en": "A superior (the section chief) does something for \"me,\" and I actively request it → 「ていただく」 (the humble form of 「てもらう」). 「てもらう」 is impolite toward a superior; 「てくださる」 is a superior acting on their own initiative and doesn't take 「に」; 「てくれる」 is too casual toward a superior.",
      "ja": "目上（課長）が「私」にしてくれ、かつ私が自ら依頼する →「ていただく」（「てもらう」の謙譲語）。「てもらう」は目上に対して礼を欠く、「てくださる」は目上が自発的にしてくれる表現で「に」を取らない、「てくれる」は目上に対して砕けすぎ。"
    }
  },
  "pattern-te-morau-008": {
    "hintI18n": {
      "en": "Reading time with the children every night.",
      "ja": "毎晩子供たちと過ごす読書の時間。"
    },
    "promptContextI18n": {
      "en": "Reading to my children every night is my joy.",
      "ja": "子供たちに本を読んであげるのは、毎晩の楽しみだ。"
    },
    "explanationI18n": {
      "en": "\"I\" do something for the lower-in-position children → 「てあげる」. 「てくれる」 is someone doing something for me; 「てもらう」 is asking someone to do something; 「差し上げる」 is used for a superior and is excessive for children.",
      "ja": "「私」が目下の子供にしてあげる →「てあげる」。「てくれる」は他人が私にしてくれる、「てもらう」は他人に頼む、「差し上げる」は目上に使う表現で、子供には過剰。"
    }
  },
  "pattern-to-omou-001": {
    "hintI18n": {
      "en": "His words about tomorrow's exam.",
      "ja": "明日の試験についての彼の発言。"
    },
    "promptContextI18n": {
      "en": "He said there's an exam tomorrow.",
      "ja": "彼は明日試験があると言った。"
    },
    "explanationI18n": {
      "en": "The 「と」 that follows an indirectly quoted content before 「と言う」 is the quotative particle. 「が」 marks the subject; 「に」 marks direction or a target; 「で」 marks means or location. All four are particles, but only 「と」 can mark quoted content (in casual speech it can become 「って」).",
      "ja": "間接引用の内容の後に来る「と言う」の「と」は引用の助詞。「が」は主語を示し、「に」は方向や対象を示し、「で」は方法や場所を示す。四つとも助詞だが、引用の内容を示せるのは「と」のみ（口語では「って」に言い換えられる）。"
    }
  },
  "pattern-to-omou-002": {
    "hintI18n": {
      "en": "A guess about tomorrow's weather.",
      "ja": "明日の天気についての推測。"
    },
    "promptContextI18n": {
      "en": "I think it will rain tomorrow.",
      "ja": "明日は雨が降ると思います。"
    },
    "explanationI18n": {
      "en": "An indirect quote / opinion takes the plain form before it → 「降る」. 「降ります」 is the ます-form (× used with 「と思う」); 「降りだ」 doesn't exist; 「降って」 is the て-form (can't attach to 「と思う」).",
      "ja": "間接引用・意見の前は「普通形」を取る →「降る」。「降ります」はます形（×「と思う」との併用）、「降りだ」は存在しない、「降って」はて形（「と思う」に接続できない）。"
    }
  },
  "pattern-to-omou-003": {
    "hintI18n": {
      "en": "His plan about going to Hokkaido.",
      "ja": "北海道へ行くことについての彼の意向。"
    },
    "promptContextI18n": {
      "en": "I hear he plans to go to Hokkaido tomorrow.",
      "ja": "彼は明日北海道に行くと思っているらしい。"
    },
    "explanationI18n": {
      "en": "「と思う」 takes the plain form before it → 「行く」 (plain, non-past affirmative). 「行きます」 is the ます-form (× with an indirect quote / と思う); 「行った」 is the past tense (clashes with the future sense of 「明日」); 「行って」 is the て-form (can't attach directly to と).",
      "ja": "「と思う」の前は普通形を取る →「行く」（普通形・非過去肯定）。「行きます」はます形（×間接引用／と思う）、「行った」は過去形（「明日」の未来感と衝突）、「行って」はて形（と に直接接続できない）。"
    }
  },
  "pattern-to-omou-004": {
    "hintI18n": {
      "en": "A judgment about how hard this problem is.",
      "ja": "この問題の難しさについての判断。"
    },
    "promptContextI18n": {
      "en": "I think this problem is very hard.",
      "ja": "この問題はとても難しいと思う。"
    },
    "explanationI18n": {
      "en": "The 「と思う」 in an opinion sentence takes an い-adjective before it → 「難しい」 attaches directly (an い-adjective is itself the plain form). 「難しいだ」 is wrong (い-adjectives don't add だ); 「難しく」 and 「難しくて」 are other inflected forms.",
      "ja": "意見文の「と思う」の前はい形容詞を取る →「難しい」を直接接続する（い形容詞自体が普通形）。「難しいだ」は誤り（い形にだは付かない）、「難しく」「難しくて」は他の活用形。"
    }
  },
  "pattern-to-omou-005": {
    "hintI18n": {
      "en": "My little sister's words about new clothes.",
      "ja": "新しい服についての妹の発言。"
    },
    "promptContextI18n": {
      "en": "My little sister said she wants new clothes.",
      "ja": "妹は新しい服を買いたいと言った。"
    },
    "explanationI18n": {
      "en": "Indirectly quoting \"my sister's wish\" → takes the plain form 「買いたい」 (たい is itself an い-adjective). 「買いたいです」 is the です／ます style (rarely mixed with と言った); 「買いたいだ」 doesn't exist; 「買って」 is the て-form.",
      "ja": "「妹の願望」を間接引用する →普通形「買いたい」を接続する（たい自体がい形容詞）。「買いたいです」はですます体（と言った との併用はまれ）、「買いたいだ」は存在しない、「買って」はて形。"
    }
  },
  "pattern-to-omou-006": {
    "hintI18n": {
      "en": "The location my brother just mentioned.",
      "ja": "兄がさっき言っていた居場所。"
    },
    "promptContextI18n": {
      "en": "My older brother just said he's in front of the station now.",
      "ja": "兄はさっき、今駅前にいると言ってた。"
    },
    "explanationI18n": {
      "en": "「って」 is the casual contraction of 「と」, and pairs naturally with 「言ってた」 (the colloquial form of 言っていた). 「は」 is the topic particle, 「が」 is the subject particle, and 「で」 is the means/location particle — none can mark quoted content.",
      "ja": "「って」は「と」の口語的な短縮で、「言ってた」（言っていた の口語）と自然に組み合わさる。「は」は話題の助詞、「が」は主語の助詞、「で」は方法／場所の助詞で、いずれも引用の内容を示せない。"
    }
  },
  "pattern-to-omou-007": {
    "hintI18n": {
      "en": "An opinion about the atmosphere of that shop.",
      "ja": "あの店の雰囲気についての見方。"
    },
    "promptContextI18n": {
      "en": "I think that shop is very quiet.",
      "ja": "あの店は静かだと思う。"
    },
    "explanationI18n": {
      "en": "A な-adjective needs だ at the end of a plain-form sentence → 「静かだ」. 「静か」 is missing the だ (×); 「静かで」 is the て-form (can't attach directly to と思う); 「静かに」 is the adverbial form (needs to attach to a verb).",
      "ja": "な形容詞は普通形の文末に「だ」を付ける必要がある →「静かだ」。「静か」はだが欠けている（×）、「静かで」はて形（と思う に直接接続できない）、「静かに」は連用形（動詞に接続する）。"
    }
  },
  "pattern-to-omou-008": {
    "hintI18n": {
      "en": "A guess about that person's identity.",
      "ja": "あの人の身分についての推測。"
    },
    "promptContextI18n": {
      "en": "I think that person is definitely a student.",
      "ja": "私はあの人がきっと学生だと思う。"
    },
    "explanationI18n": {
      "en": "A noun ending in plain form before 「と思う」 needs だ → 「学生だ」. 「学生な」 is the attributive form of a な-adjective (nouns have no な-form, invalid); 「学生で」 is the て-form (can't attach directly to と); 「学生の」 is the possessive (attaches to a noun, can't attach directly to と思う).",
      "ja": "名詞を普通形の文末にして「と思う」に接続するには「だ」を付ける必要がある →「学生だ」。「学生な」はな形容詞の連体形（名詞にな形はなく無効）、「学生で」はて形（と に直接接続できない）、「学生の」は所有格（名詞に接続し、と思う に直接接続できない）。"
    }
  },
  "pattern-mae-ato-001": {
    "hintI18n": {
      "en": "In the morning, about to leave for work, still standing at the entrance, ready to step out of the house.",
      "ja": "朝、会社へ出かけようとしていて、まだ玄関に立ち、家を出ようとしているところ。"
    },
    "promptContextI18n": {
      "en": "Before going to work, I locked the door of the house.",
      "ja": "会社へ行くまえに、家のかぎをかけました。"
    },
    "explanationI18n": {
      "en": "Locking your own front door must happen before leaving home; 「Vるまえに」 means doing something else 'before' a certain action happens. 「行ってから」, 「行ったあとで」, and 「行ったとき」 all indicate the person has already left or arrived at the company, so they can no longer lock their own door — a time contradiction.",
      "ja": "自宅のかぎをかけるのは必ず家を出る前に起こる。「Vるまえに」はある動作が起こる『前』に別のことを先にすることを表す。「行ってから」「行ったあとで」「行ったとき」はいずれも人がすでに家を出た、または会社に着いた状態を表し、もう自宅のかぎをかけられず、時間的に矛盾する。"
    }
  },
  "pattern-mae-ato-002": {
    "hintI18n": {
      "en": "A child has just come back from playing outside, their hands are a bit dirty, and there's a cake on the table waiting to be eaten.",
      "ja": "子供が外遊びから帰ってきたばかりで手が少し汚れており、テーブルにはこれから食べるケーキが置いてある。"
    },
    "promptContextI18n": {
      "en": "Wash your hands, then eat the cake.",
      "ja": "手をあらってから、ケーキを食べてください。"
    },
    "explanationI18n": {
      "en": "The meaning is to finish washing your hands and then eat right after; 「Vてから」 means finishing the first action and 'then' going on to the next. 「あらうまえに」 would mean eating before washing your hands — unhygienic; 「あらうとき」 and 「あらいながら」 would mean eating while washing your hands — unreasonable.",
      "ja": "文意は手を洗い終えて、すぐに食べに行くこと。「Vてから」は前項を終えて『それから』後項をすることを表す。「あらうまえに」は手を洗わずに先に食べることで不衛生、「あらうとき」「あらいながら」は手を洗いながら食べることになり不合理。"
    }
  },
  "pattern-mae-ato-003": {
    "hintI18n": {
      "en": "On the station platform, the train hasn't arrived yet, and feeling a bit hungry, they walk over to the kiosk.",
      "ja": "駅のホームで、列車はまだ入ってきておらず、少しお腹が空いたので売店へ向かう。"
    },
    "promptContextI18n": {
      "en": "Before boarding the train, I bought bread on the platform.",
      "ja": "電車に乗るまえに、ホームでパンを買いました。"
    },
    "explanationI18n": {
      "en": "Buying bread on the platform must happen before boarding; 「Vるまえに」 means doing something before an action happens. 「乗ってから」, 「乗ったあとで」, and 「乗ったとき」 all indicate the person is already on the train and can't go back to the platform to buy — a time contradiction.",
      "ja": "ホームでパンを買うのは必ず乗車する前に起こる。「Vるまえに」は動作が起こる前に何かを先にすることを表す。「乗ってから」「乗ったあとで」「乗ったとき」はいずれも人がすでに電車に乗った状態を表し、ホームに戻って買えず、時間的に矛盾する。"
    }
  },
  "pattern-mae-ato-004": {
    "hintI18n": {
      "en": "The family has just finished dinner, the dishes are still on the table, and the mother reminds the child of the next thing to do.",
      "ja": "家族が夕食を食べ終えたばかりで、食器がまだテーブルにあり、母親が子供に次にすべきことを促す。"
    },
    "promptContextI18n": {
      "en": "After finishing your meal, brush your teeth right away.",
      "ja": "ごはんを食べたあとで、すぐ歯をみがきましょう。"
    },
    "explanationI18n": {
      "en": "Brushing your teeth is something done 'after finishing' the meal; 「Vたあとで」 means doing something else after an action is done, paired with 「すぐ (right away)」. 「食べるまえに」 would be brushing before the meal — reversed in time; 「食べるとき」 and 「食べながら」 would mean brushing while eating — unreasonable.",
      "ja": "歯をみがくのは食事を『終えた後』にすること。「Vたあとで」はある動作を終えてから別のことをすることを表し、「すぐ（すぐに）」と合う。「食べるまえに」は食事前に歯をみがくことで時間が逆、「食べるとき」「食べながら」は食べながらみがくことになり不合理。"
    }
  },
  "pattern-nagara-tari-001": {
    "hintI18n": {
      "en": "The weather has been very unstable lately — hot one moment, cold the next — and it's a bit hard on the body.",
      "ja": "最近、天気がとても不安定で、暑くなったり寒くなったりして、体が少しついていけない。"
    },
    "promptContextI18n": {
      "en": "Lately the weather is hot one moment and cold the next, which is bad for the body.",
      "ja": "最近は天気が暑かったり、寒かったりして、体によくない。"
    },
    "explanationI18n": {
      "en": "The second clause 「寒かったりして」 already uses 「たり」, listing the two alternating states 'hot and cold' as a pair, using 「Aたり、Bたり」. 「暑くて」 is a connective, 「暑いし」 adds a reason, and 「暑いと」 is a condition — none can pair with the following 「たり」 to express alternation.",
      "ja": "後件の「寒かったりして」がすでに「たり」を使い、前後で『暑いや寒い』の二つの交互の状態を対にして挙げている。「Aたり、Bたり」を使う。「暑くて」は接続、「暑いし」は理由の追加、「暑いと」は条件で、いずれも後の「たり」と対にして交互を表せない。"
    }
  },
  "pattern-nagara-tari-002": {
    "hintI18n": {
      "en": "Describing the fixed routine completed in time order from waking up in the morning to leaving for work.",
      "ja": "朝起きてから出勤するまでの間に、時間の前後に沿って行う決まった流れを述べる。"
    },
    "promptContextI18n": {
      "en": "I got up in the morning, washed my face, and then went to work.",
      "ja": "朝起きて、顔を洗って、それから会社へ行きます。"
    },
    "explanationI18n": {
      "en": "The 「それから」 in the sentence marks the time order of 'wash face first, then leave'; sequential actions use 「て」. 「洗いながら」 is doing things at the same time, 「洗ったり」 gives examples, and 「洗うし」 adds a reason — none express sequence.",
      "ja": "文中の「それから」が『先に顔を洗い、次に出かける』という時間順を示し、動作の接続には「て」を使う。「洗いながら」は同時にすること、「洗ったり」は例を挙げること、「洗うし」は理由の追加で、いずれも前後を表さない。"
    }
  },
  "pattern-nagara-tari-003": {
    "hintI18n": {
      "en": "Explaining that a shop draws you back often for more than one reason.",
      "ja": "ある店によく通う背景に、理由が一つではない状況を説明する。"
    },
    "promptContextI18n": {
      "en": "This shop is cheap and the food is good too, so I come often.",
      "ja": "この店は安いし、料理もおいしいから、よく来ます。"
    },
    "explanationI18n": {
      "en": "The sentence's ending 「〜から、よく来ます」 stacks the two reasons 'cheap' and 'delicious', using 「し」. 「ながら」, 「たり」, and 「て」 are not for listing reasons; and 「安い」 is an adjective, so the other three can't attach to it either.",
      "ja": "文末の「〜から、よく来ます」が「安い」「おいしい」という二つの理由を積み重ねており、「し」を使う。「ながら」「たり」「て」は理由を列挙するものではなく、しかも「安い」は形容詞なので後の三つも接続できない。"
    }
  },
  "pattern-nagara-tari-004": {
    "hintI18n": {
      "en": "Describing how the younger brother keeps his eyes on his phone screen while walking, and so often runs into trouble.",
      "ja": "弟が歩いているときにスマホの画面から目を離さず、そのためよく問題を起こす様子を描く。"
    },
    "promptContextI18n": {
      "en": "My younger brother looks at his phone while walking, so he often bumps into people.",
      "ja": "弟は歩きながらスマホを見るので、よく人にぶつかります。"
    },
    "explanationI18n": {
      "en": "'Walking' and 'looking at the phone' are carried out simultaneously by the same person, using 「ながら」 (attached to the ます-stem 「歩き」). 「たり」 gives examples, 「て」 would mean finishing walking first and then looking, and 「し」 adds a reason — none fit.",
      "ja": "「歩く」と「スマホを見る」を同一人物が同時に並行して行うため、「ながら」を使う（ます形語幹「歩き」に接続）。「たり」は例を挙げること、「て」は歩き終えてから見ることになり、「し」は理由の追加で、いずれも合わない。"
    }
  },
  "pattern-nagara-tari-005": {
    "hintI18n": {
      "en": "Describing a series of errands at a department store before finally heading home.",
      "ja": "デパートでいくつか用事を済ませてから帰宅するまでの一連の行程を述べる。"
    },
    "promptContextI18n": {
      "en": "At the department store I bought shoes, ate a meal, and then went home.",
      "ja": "デパートでくつを買って、ごはんを食べて帰りました。"
    },
    "explanationI18n": {
      "en": "The earlier 「買って」 already uses the connective form; the whole sentence is the time order 'buy shoes → eat → go home', using 「て」. 「食べたり」 gives examples, 「食べながら」 is simultaneous, and 「食べるし」 adds a reason — none fit this timeline.",
      "ja": "前の「買って」がすでに接続形を使っており、文全体は「くつを買う→ごはんを食べる→帰る」という時間順で、「て」を使う。「食べたり」は例を挙げること、「食べながら」は同時、「食べるし」は理由の追加で、いずれもこの時間の流れに接続できない。"
    }
  },
  "pattern-nagara-tari-006": {
    "hintI18n": {
      "en": "Before proposing to go play at the park, laying out several conditions in one's favor.",
      "ja": "公園で遊ぼうと提案する前に、まず自分に有利な条件をいくつか並べる。"
    },
    "promptContextI18n": {
      "en": "The weather is nice today and the homework is done too, so let's go play at the park.",
      "ja": "今日は天気もいいし、宿題も終わったから、公園で遊びましょう。"
    },
    "explanationI18n": {
      "en": "The 「〜から、遊びましょう」 in the sentence is preceded by the two favorable reasons 'the weather is nice' and 'the homework is done', using 「し」. 「ながら」 is simultaneous, 「たり」 gives examples, and 「で」 is a suspensive connective — none list reasons; and 「いい」 is an adjective, so the other three can't attach to it either.",
      "ja": "文中の「〜から、遊びましょう」の前に「天気がいい」「宿題が終わった」という二つの有利な理由が来ており、「し」を使う。「ながら」は同時、「たり」は例を挙げること、「で」は中止の接続で、いずれも理由を列挙するものではなく、しかも「いい」は形容詞なので後の三つも接続できない。"
    }
  },
  "pattern-te-aux-001": {
    "hintI18n": {
      "en": "Walking down the street and spotting a restaurant you've never been to before; it looks nice, so you suggest to a friend coming here next time.",
      "ja": "街を歩いていて今まで行ったことのないレストランを見つけ、外観がとても良いので、友達に今度ここに来ようと提案する。"
    },
    "promptContextI18n": {
      "en": "This shop looks delicious, so let's go in and try it next time.",
      "ja": "この店、おいしそうだから、今度入ってみよう。"
    },
    "explanationI18n": {
      "en": "For a shop you've never visited, paired with 「今度」, the nuance of 'giving it a try' uses the volitional 「てみよう」 of the trial marker 「〜てみる」. 「ておこう」 is preparing in advance for the future, 「てしまおう」 is finishing something off or with regret, and 「ている」 is an ongoing state — none fit.",
      "ja": "行ったことのない店に対し、「今度」と合わせて『試してみる』という語気を出すには、試みを表す「〜てみる」の意向形「てみよう」を使う。「ておこう」は将来のための準備、「てしまおう」は何かをやり切るか後悔、「ている」は継続の状態で、いずれも合わない。"
    }
  },
  "pattern-te-aux-002": {
    "hintI18n": {
      "en": "A family member asks where the older brother is, and the person answering points to the next room, describing what the brother is doing right now.",
      "ja": "家族が兄はどこにいるかと尋ね、答える人が隣の部屋を指して、兄の今この瞬間の動作を描く。"
    },
    "promptContextI18n": {
      "en": "My older brother is watching TV in the next room right now.",
      "ja": "兄は今、となりの部屋でテレビを見ている。"
    },
    "explanationI18n": {
      "en": "With 「今」 and describing an action someone is doing at this moment, use the progressive 「〜ている」. 「てみる」 is a trial, 「ておく」 is preparing in advance, and 「てしまう」 is completion or regret — none can express something ongoing right now.",
      "ja": "「今」に加えて、ある人が今この瞬間に継続して行っている動作を描くには、進行を表す「〜ている」を使う。「てみる」は試み、「ておく」は事前の準備、「てしまう」は完了か後悔で、いずれも現在の継続を表せない。"
    }
  },
  "pattern-te-aux-003": {
    "hintI18n": {
      "en": "The cake was supposed to be saved for the family, but you snap out of it and realize you've eaten it all, and quickly apologize.",
      "ja": "家族に残すはずだったケーキを、ふと気づくと全部食べてしまっていて、慌てて相手に謝る。"
    },
    "promptContextI18n": {
      "en": "Oh no, I ate the whole cake by myself, sorry.",
      "ja": "あ、ケーキを全部一人で食べてしまった。ごめん。"
    },
    "explanationI18n": {
      "en": "Eating up all the cake that should have been saved and apologizing is an unintended, regrettable 'completion', using 「〜てしまう」, which echoes 「ごめん」. 「てみた」 is a trial, 「ておいた」 is preparing in advance, and 「ていた」 is a past state — none can convey regret.",
      "ja": "残すべきケーキを全部食べ切って謝るのは、本意でない後悔の『完了』で、「〜てしまう」を使い、「ごめん」と呼応する。「てみた」は試み、「ておいた」は事前の準備、「ていた」は当時の状態で、いずれも後悔を伝えられない。"
    }
  },
  "pattern-te-aux-004": {
    "hintI18n": {
      "en": "Explaining to someone asking for directions the layout of the road in front of you: this road runs all the way to the station without breaking off along the way.",
      "ja": "道を尋ねる人に、目の前のこの道の向きを説明する。この道は駅までずっと通じており、途中で途切れない。"
    },
    "promptContextI18n": {
      "en": "This road continues all the way to the station.",
      "ja": "この道は、駅までずっと続いている。"
    },
    "explanationI18n": {
      "en": "Paired with 「ずっと」 to describe the 'established state' of the road currently running all the way to the station, use the state-marking 「〜ている」. 「てみる」 is a trial, 「ておく」 is preparing in advance, and 「てしまう」 is completion or regret — none can describe this kind of extending state.",
      "ja": "「ずっと」と合わせて、道が現在、駅まで一続きに続いている『既成の状態』を描くには、状態を表す「〜ている」を使う。「てみる」は試み、「ておく」は事前の準備、「てしまう」は完了か後悔で、いずれもこの延伸する状態を描けない。"
    }
  }
};
