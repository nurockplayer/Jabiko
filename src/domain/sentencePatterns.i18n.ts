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
