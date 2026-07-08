import type { LearningBlockOverlays } from "./learningBlockText";

/**
 * Per-locale text overlays for the study chapters (學習 view), keyed by block id.
 *
 * This module is HEAVY (it grows with every language) and is DATA-ONLY on
 * purpose: `LearningPanel` imports it dynamically (`import("./learningBlocks.i18n")`)
 * so the translations load with the Learn view rather than riding in the eager
 * home bundle. The read-path helpers live in the data-free `learningBlockText`
 * module so the panel can reference them without pulling this record in.
 *
 * Populated by the study-content translation pass (#400 follow-up). Only the
 * learner-facing Chinese prose is overlaid; Japanese teaching material and all
 * logic fields are never touched.
 */
export const learningBlockI18n: LearningBlockOverlays = {
  "kana-hiragana": {
    "en": {
      "category": "Starter",
      "kicker": "Lesson 0",
      "title": "Gojuon · Hiragana",
      "explanation":
        "Hiragana is the phonetic alphabet every Japanese sentence is built on. Start by memorizing the 46 seion, one row at a time (あ row, か row, ...) -- each row has at most 5 sounds. Dakuon (が) are just a seion with two dots at the top right, handakuon (ぱ) take a small circle, and yōon (きゃ) glue a consonant to a small ゃゅょ. The readings are very regular; only a few need special care: し=shi, ち=chi, つ=tsu, ふ=fu.",
      "notes": [
        "あ row (the vowels)",
        "か row",
        "さ row: し is shi",
        "た row: watch ち and つ",
        "な row",
        "は row: ふ is fu",
        "ま row",
        "や row (only three)",
        "ら row",
        "わ row + the moraic ん",
        "Dakuon: two dots at the top right (first of each row)",
        "Handakuon: only the ぱ row",
        "Yōon: consonant + small ゃゅょ"
      ],
      "pitfalls": [
        "Learn the look-alikes early: ぬ/め, ね/れ/わ, る/ろ, は/ほ, き/さ/ち",
        "じ and ぢ are both ji, ず and づ are both zu (じ/ず are the usual spellings; ぢ/づ appear in only a few words)",
        "Small ゃゅょ differ from full-size やゆよ: きや kiya ≠ きゃ kya"
      ]
    },
    "ja": {
      "category": "入門",
      "kicker": "第0課",
      "title": "五十音・ひらがな",
      "explanation":
        "ひらがなは日本語の文の土台になる表音文字。まず清音46字を一行ずつ（あ行、か行……）覚える。各行は最大5音。濁音（が）は右上に点々、半濁音（ぱ）は小さい丸を付けるだけ。拗音（きゃ）は子音＋小さいゃゅょの組み合わせ。読みはとても規則的だが、し=shi、ち=chi、つ=tsu、ふ=fu だけは特に注意。",
      "notes": [
        "あ行（母音）",
        "か行",
        "さ行：し は shi",
        "た行：ち・つ に注意",
        "な行",
        "は行：ふ は fu",
        "ま行",
        "や行（三つだけ）",
        "ら行",
        "わ行＋撥音ん",
        "濁音：右上に点々（各行の最初の字）",
        "半濁音：ぱ行だけ",
        "拗音：子音＋小さいゃゅょ"
      ],
      "pitfalls": [
        "形の似た字を先に区別：ぬ/め、ね/れ/わ、る/ろ、は/ほ、き/さ/ち",
        "じ と ぢ はどちらも ji、ず と づ はどちらも zu（ふつうは じ/ず を使い、ぢ/づ は一部の語だけ）",
        "小さい ゃゅょ と大きい やゆよ は別物：きや kiya ≠ きゃ kya"
      ]
    }
  },
  "kana-katakana": {
    "en": {
      "category": "Starter",
      "kicker": "Lesson 0",
      "title": "Gojuon · Katakana",
      "explanation":
        "Katakana maps one-to-one onto hiragana with identical readings, and is used for loanwords (コーヒー coffee), foreign names and places, sound effects, and emphasis. Since the pairing is fixed (あ↔ア, き↔キ), the way to learn it is to match against the hiragana you already know. Katakana strokes are straighter and squarer; a few look-alike sets (シ/ツ, ソ/ン) trip up every beginner, so mind them while drilling.",
      "notes": [
        "ア row",
        "カ row",
        "サ row: mind シ's stroke direction",
        "タ row: ツ looks like シ",
        "ナ row",
        "ハ row",
        "マ row",
        "ヤ row",
        "ラ row",
        "ワ row + ン: ン looks like ソ",
        "Loanwords are written in katakana"
      ],
      "pitfalls": [
        "シ (shi) / ツ (tsu): シ's dots lean horizontal, ツ's lean vertical",
        "ソ (so) / ン (n): ソ's stroke sweeps top-down, ン's sweeps bottom-up",
        "ク/ワ/フ, コ/ユ, チ/テ are also common look-alike sets"
      ]
    },
    "ja": {
      "category": "入門",
      "kicker": "第0課",
      "title": "五十音・カタカナ",
      "explanation":
        "カタカナはひらがなと一対一で対応し、読みも同じ。外来語（コーヒー）、外国の人名・地名、擬音語・擬態語、強調などに使う。対応関係は固定（あ↔ア、き↔キ）なので、覚えたひらがなと結び付けて学ぶのが近道。カタカナは画がまっすぐで角ばっており、シ/ツ、ソ/ン などの似た字は初学者全員が通る道。認識練習では特に注意。",
      "notes": [
        "ア行",
        "カ行",
        "サ行：シ の向きに注意",
        "タ行：ツ は シ と似ている",
        "ナ行",
        "ハ行",
        "マ行",
        "ヤ行",
        "ラ行",
        "ワ行＋ン：ン は ソ と似ている",
        "外来語はカタカナで書く"
      ],
      "pitfalls": [
        "シ（shi）/ ツ（tsu）：シ の点は横向き、ツ の点は縦向き",
        "ソ（so）/ ン（n）：ソ は上から下へ、ン は下から上へはらう",
        "ク/ワ/フ、コ/ユ、チ/テ もよくある似た字の組"
      ]
    }
  },
  "starter-vocab": {
    "en": {
      "category": "Starter",
      "kicker": "Lesson 0",
      "title": "Starter Vocabulary",
      "explanation":
        "Once you can read kana, stock up on a first batch of immediately useful words: greetings, numbers, time words, the people and things around you, and the most common verbs and adjectives. Every word here is written in kana only -- no kanji needed. The example sentences in the grammar chapters ahead are built almost entirely from these words.",
      "notes": [
        "Greetings: your first spoken steps",
        "Numbers: shopping and telling time both rely on them",
        "Time words",
        "People and forms of address",
        "Everyday nouns",
        "The most common verbs",
        "Common adjectives",
        "Ko-so-a-do: pointing at things, asking where"
      ],
      "pitfalls": [
        "すみません (getting attention / a light apology) and ごめんなさい (owning up and apologizing) are used in different situations",
        "これ／それ／あれ split by distance: near me → これ, near you → それ, far from both → あれ",
        "たかい means both \"tall/high\" and \"expensive\" -- judge from context"
      ]
    },
    "ja": {
      "category": "入門",
      "kicker": "第0課",
      "title": "基礎単語",
      "explanation":
        "仮名が読めるようになったら、まず「すぐ使える」単語をひとまとめに覚える：あいさつ、数字、時間のことば、身の回りの人と物、いちばんよく使う動詞と形容詞。ここの単語はすべて仮名書きなので、漢字を知らなくても練習できる。この先の文法章の例文は、ほぼこれらの単語でできている。",
      "notes": [
        "あいさつ：口に出す第一歩",
        "数字：買い物にも時間にも必要",
        "時間のことば",
        "人と呼び方",
        "身の回りの名詞",
        "最頻出の動詞",
        "よく使う形容詞",
        "こそあど：物を指す・場所をたずねる"
      ],
      "pitfalls": [
        "すみません（呼びかけ・軽い謝罪）と ごめんなさい（非を認めて謝る）は場面が違う",
        "これ／それ／あれ は「どちらに近いか」で使い分け：自分の近く→これ、相手の近く→それ、どちらからも遠い→あれ",
        "たかい には「高い」と「（値段が）高い」の両方の意味がある。文脈で判断"
      ]
    }
  },
  "starter-desu": {
    "en": {
      "category": "Starter",
      "kicker": "Lesson 0",
      "title": "The Basic Sentence AはBです",
      "explanation":
        "Japanese's most basic sentence: 「AはBです」 = \"A is B\". は marks the topic you're talking about (read wa), and です sits at the end. To say \"is not\", swap です for じゃありません; for the past, でした; to ask a question, add か for ですか. Master these four endings and you can start speaking in full sentences.",
      "notes": [
        "A is B: I am a student",
        "Negative: (I'm) not a teacher",
        "Past: it rained yesterday",
        "Past negative: it didn't rain yesterday",
        "Question: is that a dog?",
        "Introducing yourself"
      ],
      "pitfalls": [
        "The topic は is read wa, not ha — writing は but saying wa is a fixed rule",
        "\"Tomorrow\" hasn't happened yet but still takes です: あしたは やすみです (no future tense)",
        "In speech じゃありません often becomes じゃないです — same meaning"
      ]
    },
    "ja": {
      "category": "入門",
      "kicker": "第0課",
      "title": "基本文 AはBです",
      "explanation":
        "日本語のいちばん基本の文：「AはBです」。は は話題を示し（wa と読む）、です は文末に置く。「〜ではない」は じゃありません、過去は でした、質問は か を付けて ですか。この四つの文末を身につければ、文で話し始められる。",
      "notes": [
        "AはB：わたしは学生です",
        "否定：先生ではありません",
        "過去：きのうは雨でした",
        "過去否定：きのうは雨ではありませんでした",
        "疑問：あれは犬ですか",
        "自己紹介"
      ],
      "pitfalls": [
        "主題の は は ha ではなく wa と読む——書くのは は、読むのは wa という決まり",
        "「あした」のことも です を使う：あしたは休みです（未来形はない）",
        "話し言葉では じゃありません を じゃないです とも言う。意味は同じ"
      ]
    }
  },
  "starter-particles": {
    "en": {
      "category": "Starter",
      "kicker": "Lesson 0",
      "title": "Particle Basics は・を・に・が",
      "explanation":
        "Particles are little words glued after nouns that tell you what the noun is doing in the sentence. The first four to know: は = topic (who the sentence is about), を = the object of an action (what you eat or drink), に = destination or point in time (where you're going), が = a newly-introduced subject (there IS something / WHO does it). Add で for where an action happens and と for \"together with\", and everyday sentences all snap together.",
      "notes": [
        "は topic + を object: I drink water",
        "に destination: go to school",
        "が introduces: there's a dog over there",
        "A question-word subject can only take が",
        "で place of action: eat at home",
        "と together: chat with a friend"
      ],
      "pitfalls": [
        "\"Doing an action somewhere\" takes で; \"existing somewhere / going somewhere\" takes に: いえで たべます vs いえに います",
        "A question word (だれ・なに) as subject only takes が, never は",
        "を only marks the object of an action; in modern Japanese it sounds the same as お"
      ]
    },
    "ja": {
      "category": "入門",
      "kicker": "第0課",
      "title": "助詞の基本 は・を・に・が",
      "explanation":
        "助詞は名詞の後ろに付く小さな語で、「その名詞が文の中で何をしているか」を示す。まず覚える四つ：は＝主題（この文は誰の話か）、を＝動作の対象（何を食べる・飲む）、に＝行き先や時点（どこへ行く）、が＝初めて登場する主語（何がある・誰がする）。さらに場所の で（どこでする）と一緒の と（誰と）を足せば、日常の文はほぼ組み立てられる。",
      "notes": [
        "は主題＋を対象：わたしは水を飲みます",
        "に行き先：学校に行きます",
        "が登場：そこに犬がいます",
        "疑問詞の主語は が だけ",
        "で動作の場所：家で食べます",
        "と一緒：友だちと話します"
      ],
      "pitfalls": [
        "「ある場所で動作する」は で、「ある場所に存在する／行く」は に：いえで たべます vs いえに います",
        "疑問詞（だれ・なに）が主語のときは が だけ。は は使えない",
        "を は動作の対象だけに付く。現代語では お と同じ発音"
      ]
    }
  },
  "n5-sonzai": {
    "en": {
      "category": "N5 Grammar",
      "kicker": "N5 Patterns",
      "title": "Existence: あります・います",
      "explanation":
        "The pattern for saying \"there is / it's at\". Two verbs split the work: things and plants take あります, people and animals take います. The two sentence shapes come as a pair: to introduce that something exists, use 「場所に 〜が あります/います」; to answer where a known thing is, use 「〜は 場所に あります/います」. The place of existence always takes に — で is for where an ACTION happens, the single most important に/で split.",
      "notes": [
        "Existence: there's a cat in the room (animal → います)",
        "Existence: there's a book on the desk (thing → あります)",
        "Location: answering \"where's the book?\"",
        "The set phrase for asking directions",
        "Negatives: isn't there / there's none"
      ],
      "pitfalls": [
        "います is only for living, moving beings (people/animals); plants and things take あります",
        "Existence takes に, actions take で: にわに います (is in the yard) vs にわで あそびます (plays in the yard)",
        "First mention uses 〜が あります; a known topic uses 〜は 〜に あります — don't swap が/は"
      ]
    },
    "ja": {
      "category": "N5文法",
      "kicker": "N5文型",
      "title": "存在文 あります・います",
      "explanation":
        "「何がある・どこにいる」を言う文型。動詞は二つで分担：物と植物は あります、人と動物は います。文の形はペアで覚える：「何かがある」と紹介するなら「場所に 〜が あります/います」、「どこにあるか」を答えるなら「〜は 場所に あります/います」。存在の場所は必ず に——「ある場所で動作する」なら で。に／で の一番大事な分かれ目。",
      "notes": [
        "存在文：部屋に猫がいます（動物→います）",
        "存在文：机の上に本があります（物→あります）",
        "所在文：「本はどこ？」に答える",
        "道をたずねる決まり文句",
        "否定：いません／ありません"
      ],
      "pitfalls": [
        "います は生きて動くもの（人・動物）だけ。植物と物は あります",
        "存在は に、動作は で：にわに います vs にわで あそびます",
        "初めての紹介は「〜が あります」、既知の話題は「〜は 〜に あります」——が/は を入れ替えない"
      ]
    }
  },
  "n5-ichi": {
    "en": {
      "category": "N5 Grammar",
      "kicker": "N5 Patterns",
      "title": "Position Words + この・その",
      "explanation":
        "Positions are said as 「noun + の + position word + に」: かばんの なかに (inside the bag), つくえの うえに (on the desk). The common position words: うえ/した/なか/まえ/うしろ/となり/よこ/ちかく. For demonstratives, this chapter covers the noun-attached forms: この/その/あの + noun (これ/それ/あれ stand alone; この must be followed by a noun). The distance split matches the これ series: near me → この, near you → その, far from both → あの.",
      "notes": [
        "なか = inside",
        "うえ = on/above, した = under",
        "まえ = in front, うしろ = behind",
        "となり = next door, よこ = beside, ちかく = nearby",
        "この + noun: near me",
        "その + noun: near you"
      ],
      "pitfalls": [
        "この/その/あの must be followed by a noun; standing alone, switch to これ/それ/あれ",
        "となり = adjacent in a row (next door), よこ = to the side, ちかく = in the vicinity — three different ranges",
        "\"On the desk\" is つくえの うえ — things on a surface always take うえ, don't drop it"
      ]
    },
    "ja": {
      "category": "N5文法",
      "kicker": "N5文型",
      "title": "位置のことばと この・その",
      "explanation":
        "位置は「名詞の＋位置のことば＋に」で言う：かばんの なかに、つくえの うえに。よく使う位置のことば：うえ/した/なか/まえ/うしろ/となり/よこ/ちかく。指示詞はここで「名詞に付く形」を学ぶ：この/その/あの＋名詞（これ/それ/あれ は単独で使う。この の後ろには必ず名詞）。距離の使い分けは これ系と同じ：自分の近く→この、相手の近く→その、どちらからも遠い→あの。",
      "notes": [
        "なか＝中",
        "うえ＝上、した＝下",
        "まえ＝前、うしろ＝後ろ",
        "となり＝隣、よこ＝横、ちかく＝近く",
        "この＋名詞：自分の近く",
        "その＋名詞：相手の近く"
      ],
      "pitfalls": [
        "この/その/あの の後ろには必ず名詞。単独なら これ/それ/あれ に替える",
        "となり＝並んで隣接、よこ＝横の方向、ちかく＝近辺——範囲が違う",
        "「机の上」は つくえの うえ。面の上にある物はいつも うえ を付けて言う"
      ]
    }
  },
  "n5-joshi2": {
    "en": {
      "category": "N5 Grammar",
      "kicker": "N5 Patterns",
      "title": "Particles II: へ・で・と・や",
      "explanation":
        "The starter chapter covered は/を/に/が; this one adds movement and means. へ (read e) = direction of movement. で does triple duty: place of an action (としょかんで), means/tool (バスで, はしで), and totals (ぜんぶで). と = \"and\" listing EVERYTHING (パンと たまご); や = \"and\" giving EXAMPLES, usually paired with sentence-final など (ほんや ペンなど). The と/や split is one of N5's favourite test points.",
      "notes": [
        "へ: direction of movement (read e)",
        "で: transport, means",
        "で: place of an action",
        "で: totals",
        "と: listing everything",
        "や: examples (more exists)"
      ],
      "pitfalls": [
        "Direction へ/に are often interchangeable: へ stresses the heading, に the arrival point",
        "と = the full list; や = examples only (usually with など) — tests use など as the giveaway",
        "The particle へ is read e, not he (same rule family as は read wa)"
      ]
    },
    "ja": {
      "category": "N5文法",
      "kicker": "N5文型",
      "title": "助詞II へ・で・と・や",
      "explanation":
        "入門の章では は/を/に/が を学んだ。この章は移動と手段の助詞を足す。へ（e と読む）＝移動の方向。で は三役：動作の場所（としょかんで）、手段・道具（バスで、はしで）、合計（ぜんぶで）。と＝名詞を「全部」挙げる「と」（パンと たまご）。や＝「例を挙げる」和で、文末の など とよくペアになる（ほんや ペンなど）。と／や の違いは N5 の定番の出題ポイント。",
      "notes": [
        "へ：移動の方向（e と読む）",
        "で：乗り物・手段",
        "で：動作の場所",
        "で：合計",
        "と：全部挙げる",
        "や：例を挙げる（ほかにもある）"
      ],
      "pitfalls": [
        "方向の へ/に は入れ替え可能なことが多い：へ は「向かう方向」、に は「到達点」",
        "と＝リストを全部言い切る；や＝例だけ（など とセット）——試験では など がヒント",
        "助詞の へ は he ではなく e と読む（は を wa と読むのと同じ仲間）"
      ]
    }
  },
  "n5-joshi3": {
    "en": {
      "category": "N5 Grammar",
      "kicker": "N5 Patterns",
      "title": "Particles III: の・も・か・から〜まで",
      "explanation":
        "The remaining everyday N5 particles in one place. の = possessive \"'s\" (わたしの かばん) and can also stand in for a noun already mentioned (たなかさんの です = Tanaka's [pen]). も = \"also\", replacing は/が directly; question word + も + negative = total negation (だれも いません). か between nouns = \"or\" (コーヒーか おちゃ). 〜から〜まで = \"from ~ to ~\" for both time and place. だけ = \"only\".",
      "notes": [
        "の: possessive",
        "の: standing in for a mentioned noun",
        "も: also",
        "Question word + も + negative = total negation",
        "か: or (pick one of two)",
        "から〜まで: from ~ to ~",
        "だけ: only"
      ],
      "pitfalls": [
        "も replaces は/が directly — never はも or がも",
        "だれも/なにも take a negative; \"someone/something\" is だれか/なにか with an affirmative",
        "だけ works with affirmatives; しか also means \"only\" but demands a negative (an N4 topic)"
      ]
    },
    "ja": {
      "category": "N5文法",
      "kicker": "N5文型",
      "title": "助詞III の・も・か・から〜まで",
      "explanation":
        "残りの N5 常用助詞をまとめて。の＝「の」（わたしの かばん）。前に出た名詞の代わりにもなる（たなかさんの です＝田中さんの〈ペン〉）。も＝「も」、は/が の位置をそのまま置き換える。「疑問詞＋も＋否定」＝全否定（だれも いません）。名詞の間の か＝「か（二択）」（コーヒーか おちゃ）。〜から〜まで＝時間にも場所にも使える。だけ＝「だけ」。",
      "notes": [
        "の：所有",
        "の：前の名詞の代わり",
        "も：〜も",
        "疑問詞＋も＋否定＝全否定",
        "か：または（二択）",
        "から〜まで：〜から〜まで",
        "だけ：〜だけ"
      ],
      "pitfalls": [
        "も は は/が をそのまま置き換える——「はも」「がも」とは言わない",
        "だれも/なにも は否定と使う。「誰か/何か」は だれか/なにか＋肯定",
        "だけ は肯定でよい。「しか」も「だけ」の意味だが必ず否定とセット（N4 で学ぶ）"
      ]
    }
  },
  "n5-hikaku": {
    "en": {
      "category": "N5 Grammar",
      "kicker": "N5 Patterns",
      "title": "Comparison: より・ほうが・いちばん",
      "explanation":
        "The comparison trio. (1) 「AはBより〜」 = A is more ~ than B (より follows the standard of comparison). (2) 「〜のほうが〜」 = ~ is more ~; it's also how you answer 「AとBと、どちらが〜」. (3) The superlative 「(range)で 〜が いちばん〜」 = the most ~ within ~. Two iron rules: the pick-one-of-two question word is どちら (not なに), and a question-word subject only takes が.",
      "notes": [
        "A is more ~ than B",
        "Pick-one-of-two question",
        "Answering: ~ is more ~",
        "Superlative: range + で",
        "ほど + negative: not as ~ as"
      ],
      "pitfalls": [
        "ほど also follows a comparison standard, but demands a negative (〜ほど〜ない)",
        "\"Which (of two)\" is どちら; どれ/なに are for three or more",
        "The superlative range takes で: クラスで, 日本で, スポーツのなかで"
      ]
    },
    "ja": {
      "category": "N5文法",
      "kicker": "N5文型",
      "title": "比較 より・ほうが・いちばん",
      "explanation":
        "比較の三点セット。①「AはBより〜」＝AはBより〜（より は比較の基準の後ろ）。②「〜のほうが〜」——「AとBと、どちらが〜」への答え方でもある。③最上級「（範囲）で 〜が いちばん〜」。鉄則二つ：二択の疑問詞は どちら（なに ではない）、疑問詞が主語なら助詞は が だけ。",
      "notes": [
        "AはBより〜",
        "二択の質問",
        "答え方：〜のほうが〜",
        "最上級：範囲＋で",
        "ほど＋否定：〜ほど〜ない"
      ],
      "pitfalls": [
        "ほど も比較の基準に付くが、必ず否定とセット（〜ほど〜ない）",
        "「どちら」は二択。三つ以上は どれ/なに",
        "最上級の範囲は で：クラスで、日本で、スポーツのなかで"
      ]
    }
  },
  "n5-suki-dekiru": {
    "en": {
      "category": "N5 Grammar",
      "kicker": "N5 Patterns",
      "title": "Likes & Ability: 〜が すき・できる",
      "explanation":
        "The family of patterns for \"I like ~ / I can ~\", united by one thing: the object takes 「が」. すき/きらい (like/dislike), じょうず/へた (good at/bad at), わかる (understand), できる (can). Chinese and English instincts reach for を (like \"the cat\"), but this family fixes on が — one of N5's most important switches. To say you can DO something, nominalize the verb with 「こと」 first: およぐ ことが できます.",
      "notes": [
        "Like: object takes が",
        "Good at",
        "Understand",
        "Can (noun)",
        "Can do ~: verb + ことが できる"
      ],
      "pitfalls": [
        "This family's object takes が, not を: ×にほんごを わかります",
        "Colloquial 「〜をすき」 exists, but tests and writing use が",
        "きらい looks like an い-adjective but is a な-adjective (きらいな 人)"
      ]
    },
    "ja": {
      "category": "N5文法",
      "kicker": "N5文型",
      "title": "好き・できる 〜が の仲間",
      "explanation":
        "「好き・できる」を言う文型ファミリー。共通点は対象が「が」になること：すき/きらい、じょうず/へた、わかる、できる。中国語や英語の感覚では を を使いたくなるが、この仲間は が で固定——N5 でいちばん大事な切り替えのひとつ。動詞で「〜できる」と言うなら、まず「こと」で名詞化：およぐ ことが できます。",
      "notes": [
        "好き：対象は が",
        "上手",
        "わかる",
        "できる（名詞）",
        "〜できる：動詞＋ことが できる"
      ],
      "pitfalls": [
        "この仲間の対象は が。×にほんごを わかります",
        "話し言葉の「〜をすき」はあるが、試験と書き言葉は が",
        "きらい は い形容詞に見えるが な形容詞（きらいな 人）"
      ]
    }
  },
  "n5-sasoi": {
    "en": {
      "category": "N5 Grammar",
      "kicker": "N5 Patterns",
      "title": "Invitations & Offers: ませんか・ましょう",
      "explanation":
        "The trio for reaching out: 「ませんか」 = won't you ~? (a question — the decision stays with the listener); 「ましょう」 = let's ~ (a proposal, or the way to accept an invitation); 「ましょうか」 = shall I ~? (offering to help). Alongside them: ます-stem + 「に いきます/きます」 = go/come to do something (かいに いきます = go to buy), and the suggestion 「〜は どうですか」 = how about ~?",
      "notes": [
        "Invite: won't you ~?",
        "Accept: let's ~",
        "Offer to help: shall I ~?",
        "Purpose of movement: stem + に",
        "Suggest: how about ~?"
      ],
      "pitfalls": [
        "ませんか asks the listener; ましょう is your side proposing/accepting — don't flip the direction",
        "「に いきます」 attaches to the ます-stem (かい, たべ), not the dictionary or て form",
        "Answering an invitation: yes → 「ましょう」; declining → 「ちょっと……」 (not a blunt いいえ)"
      ]
    },
    "ja": {
      "category": "N5文法",
      "kicker": "N5文型",
      "title": "誘い・申し出 ませんか・ましょう",
      "explanation":
        "誘いの三点セット：「ませんか」＝〜しない？（疑問文。決定権は相手に）；「ましょう」＝〜しよう（提案、または誘いを受けるときの返事）；「ましょうか」＝〜しようか？（手伝いの申し出）。あわせて：ます形の語幹＋「に いきます/きます」＝〜しに行く/来る（かいに いきます）、提案の「〜は どうですか」。",
      "notes": [
        "誘う：〜ませんか",
        "受ける：〜ましょう",
        "申し出：〜ましょうか",
        "移動の目的：語幹＋に",
        "提案：〜は どうですか"
      ],
      "pitfalls": [
        "ませんか は相手に聞く形、ましょう は自分側の提案/受諾——方向を逆にしない",
        "「に いきます」に付くのは ます形の語幹（かい、たべ）。辞書形・て形は不可",
        "誘いへの返事：OK →「ましょう」、断る →「ちょっと……」（いいえ と直言しない）"
      ]
    }
  },
  "n5-onegai": {
    "en": {
      "category": "N5 Grammar",
      "kicker": "N5 Patterns",
      "title": "Requests & Advice: ください・ほうがいい",
      "explanation":
        "The set for asking and advising. Shopping/ordering: 「Nを (quantity) ください」 — the counter goes right before ください with no particle. Wanting things: 「〜が ほしいです」 (object takes が, same family as すき). Advice: た-form + 「ほうがいいです」 = you'd better ~, ない-form + 「ほうがいいです」 = you'd better not ~. Asking someone not to do: ない-form + 「でください」.",
      "notes": [
        "Please give me ~: no particle on the counter",
        "Want: object takes が",
        "Advice to do: た-form + ほうがいい",
        "Advice not to: ない-form",
        "Please don't ~"
      ],
      "pitfalls": [
        "ほうがいい: the \"do it\" direction takes the た-form (ねた), the \"don't\" direction the ない-form (はいらない)",
        "The object of ほしい takes が, not を — the same colloquial trap as をすき",
        "ないでください (please don't) ≠ なくてもいいです (you don't have to)"
      ]
    },
    "ja": {
      "category": "N5文法",
      "kicker": "N5文型",
      "title": "依頼とアドバイス ください・ほうがいい",
      "explanation":
        "頼む・勧めるための文型セット。買い物・注文：「Nを（数量）ください」——数量詞は助詞なしで ください の直前。ほしい物：「〜が ほしいです」（対象は が。すき と同じ仲間）。アドバイス：た形＋「ほうがいいです」＝〜したほうがいい、ない形＋「ほうがいいです」＝〜しないほうがいい。してほしくないこと：ない形＋「でください」。",
      "notes": [
        "〜をください：数量に助詞なし",
        "ほしい：対象は が",
        "した方がいい：た形",
        "しない方がいい：ない形",
        "〜ないでください"
      ],
      "pitfalls": [
        "ほうがいい：「する」方向は た形（ねた）、「しない」方向は ない形（はいらない）",
        "ほしい の対象は が。を は をすき と同じ話し言葉の罠",
        "ないでください（しないで）≠ なくてもいいです（しなくていい）"
      ]
    }
  },
  "n5-riyuu": {
    "en": {
      "category": "N5 Grammar",
      "kicker": "N5 Patterns",
      "title": "Reasons & Contrast: から・ので・が",
      "explanation":
        "The basics of joining two clauses. Reasons: 「〜から」 (the answer to どうして is always 「〜からです」); 「〜ので」 sounds more objective and soft — nouns and な-adjectives take な before ので (やすみなので) but だ before から (やすみだから). Contrast: sentence-medial 「〜が」 = although ~, but ~; it also softens openers (すみませんが、〜). Sentence-initial connectors come as a set of four: だから (so), でも (but), そして (and), それから (and then).",
      "notes": [
        "Answering どうして: 〜からです",
        "Noun attachment: なので vs だから",
        "Contrast: although ~, but ~",
        "Prefacing が",
        "The four connectors"
      ],
      "pitfalls": [
        "から and ので mean nearly the same (ので is more objective), but nouns attach differently: だから / なので",
        "「〜のでです」 is not a sentence — answer どうして with 「〜からです」",
        "Medial が and initial でも both mark contrast, but they can't swap positions"
      ]
    },
    "ja": {
      "category": "N5文法",
      "kicker": "N5文型",
      "title": "理由と逆接 から・ので・が",
      "explanation":
        "二つの文をつなぐ基本。理由：「〜から」（どうして への答えは「〜からです」で固定）；「〜ので」はより客観的で柔らかい——名詞・な形容詞は な＋ので（やすみなので）、から なら だ＋から（やすみだから）。逆接：文中の「〜が」＝〜だが。前置きの「すみませんが、〜」もこの が。文頭の接続詞は四点セット：だから、でも、そして、それから。",
      "notes": [
        "どうして の答え：〜からです",
        "名詞の接続：なので vs だから",
        "逆接：〜が",
        "前置きの が",
        "接続詞四点セット"
      ],
      "pitfalls": [
        "から と ので はほぼ同義（ので はやや客観的）だが、名詞への付き方が違う：だから／なので",
        "「〜のでです」は文にならない——どうして には「〜からです」",
        "文中の が と文頭の でも は同じ逆接でも位置を交換できない"
      ]
    }
  },
  "n5-toki": {
    "en": {
      "category": "N5 Grammar",
      "kicker": "N5 Patterns",
      "title": "Time & Experience: とき・もう・でしょう",
      "explanation":
        "Patterns for time, state, and experience. 「〜とき」 = when ~: the tense before とき shows whether the action is complete — ごはんを たべる とき (before eating) vs たべた とき (after). The done/not-done pair: 「もう〜ました」 = already did, 「まだ〜ていません」 = not yet. Conjecture: 「〜でしょう」 = probably ~ (how every weather forecast ends). Experience: た-form + 「ことが あります」 = have done ~; the negative reply pairs with 「いちども〜ません」 = not even once.",
      "notes": [
        "When ~",
        "Tense before とき = action complete or not",
        "Already ~ / not yet ~",
        "Conjecture: probably ~",
        "Experience: have done ~"
      ],
      "pitfalls": [
        "The negative of まだ is 「まだ〜ていません」, not 「まだ〜ませんでした」",
        "でしょう follows the plain form (ふるでしょう); 「ふるですか」 is not a sentence",
        "いちども, だれも, なにも — the whole も family demands a negative"
      ]
    },
    "ja": {
      "category": "N5文法",
      "kicker": "N5文型",
      "title": "時間と経験 とき・もう・でしょう",
      "explanation":
        "時間・状態・経験の文型セット。「〜とき」：とき の前の時制は動作が完了したかどうかで決まる——ごはんを たべる とき（食べる前）vs たべた とき（食べた後）。完了/未完了のペア：「もう〜ました」／「まだ〜ていません」。推量：「〜でしょう」（天気予報の定番の結び）。経験：た形＋「ことが あります」＝〜したことがある。否定の返事は「いちども〜ません」。",
      "notes": [
        "〜とき",
        "とき の前の時制＝完了かどうか",
        "もう〜ました／まだ〜ていません",
        "推量：〜でしょう",
        "経験：〜たことがある"
      ],
      "pitfalls": [
        "まだ の否定は「まだ〜ていません」。「まだ〜ませんでした」ではない",
        "でしょう は普通形に付く（ふるでしょう）。「ふるですか」は文にならない",
        "いちども・だれも・なにも——「も」の仲間は否定とセット"
      ]
    }
  },
  "n5-keiyoushi": {
    "en": {
      "category": "N5 Grammar",
      "kicker": "N5 Patterns",
      "title": "Adjectives: Linking & Change",
      "explanation":
        "Three ways to USE an adjective. (1) Modifying a noun: い-adjectives attach directly (おおきい かばん), な-adjectives take な (しずかな まち). (2) Chaining (both ~ and ~): い-adjectives drop い and take くて (やすくて おいしい), な-adjectives take で (げんきで しんせつ). (3) Change (become ~): い-adjectives drop い + く なります, な-adjectives + に なります. The two adjectives everyone fumbles: きれい ends in い but is a な-adjective; いい inflects entirely on the よ stem (よく, よくない, よかった).",
      "notes": [
        "Modify a noun: い direct, な + な",
        "Chain い-adj: drop い + くて",
        "Chain な-adj: + で",
        "Become ~: く / に + なります",
        "いい → よく なりました"
      ],
      "pitfalls": [
        "い-adjectives never take な (×おおきいな); な-adjectives never become -い (×しずかい)",
        "きれい, ゆうめい, きらい end in い but are な-adjectives — change uses に (×きれいく)",
        "いい keeps only its dictionary form; everything else uses よ: よくて, よくない, よかった, よく なります"
      ]
    },
    "ja": {
      "category": "N5文法",
      "kicker": "N5文型",
      "title": "形容詞の接続と変化",
      "explanation":
        "形容詞の三つの使い方。①名詞修飾：い形容詞は直接（おおきい かばん）、な形容詞は な を挟む（しずかな まち）。②並列：い形容詞は い を取って くて（やすくて おいしい）、な形容詞は で（げんきで しんせつ）。③変化：い形容詞は く なります、な形容詞は に なります。要注意の二語：きれい は い で終わるが な形容詞；いい の活用はすべて よ 系（よく、よくない、よかった）。",
      "notes": [
        "名詞修飾：い形は直接、な形は＋な",
        "い形の並列：〜くて",
        "な形の並列：〜で",
        "変化：く／に＋なります",
        "いい → よく なりました"
      ],
      "pitfalls": [
        "い形に な は付かない（×おおきいな）。な形は い にならない（×しずかい）",
        "きれい・ゆうめい・きらい は い で終わる な形容詞——変化は に（×きれいく）",
        "いい は辞書形だけ。あとは よ 系：よくて、よくない、よかった、よく なります"
      ]
    }
  },
  "n5-josuushi": {
    "en": {
      "category": "N5 Grammar",
      "kicker": "N5 Patterns",
      "title": "Counters & Quantity",
      "explanation":
        "Japanese counts with counter words matched to the category: 〜つ (generic small things), 〜人 (people — ひとり and ふたり are irregular), 〜枚 (thin flat things), 〜本 (long thin things — note that books use 〜冊, not 〜本), 〜台 (machines/vehicles), 〜匹 (small animals), 〜回 (times), 〜歳 (age). Three sound-change habits: 1, 6, 8, 10 often geminate (いっぴき, はっさい); 3 often voices (さんぼん). Word-order rule: the quantity goes right before the verb with NO particle — りんごを みっつ ください.",
      "notes": [
        "People: ひとり, ふたり irregular",
        "Long thin things: 三本 = さんぼん",
        "Small animals: 一匹 = いっぴき",
        "Books: 〜冊, not 〜本",
        "No particle after the quantity"
      ],
      "pitfalls": [
        "Sound changes are the test point: いっぽん/さんぼん/ろっぽん, いっぴき/さんびき, はっさい/じゅっさい",
        "A \"book\" is counted with 〜冊 — ほんを いっぽん is a different (and comic) claim",
        "The quantity attaches straight to the verb: ×みっつを ください"
      ]
    },
    "ja": {
      "category": "N5文法",
      "kicker": "N5文型",
      "title": "助数詞と数量の言い方",
      "explanation":
        "ものを数えるときは類別に合った助数詞を選ぶ：〜つ（小物全般）、〜人（人。ひとり・ふたり は特殊読み）、〜枚（薄く平たい物）、〜本（細長い物——「本」を数えるのは〜冊）、〜冊（本）、〜台（機械・車）、〜匹（小動物）、〜回（回数）、〜歳（年齢）。音変化三つの癖：1・6・8・10 は促音化しやすい（いっぴき、はっさい）、3 は濁音化しやすい（さんぼん）。語順のルール：数量詞は動詞の直前、助詞は付けない——りんごを みっつ ください。",
      "notes": [
        "人：ひとり・ふたり は特殊",
        "細長い物：三本＝さんぼん",
        "小動物：一匹＝いっぴき",
        "本は〜冊",
        "数量詞に助詞は付けない"
      ],
      "pitfalls": [
        "音変化が出題ポイント：いっぽん/さんぼん/ろっぽん、いっぴき/さんびき、はっさい/じゅっさい",
        "書物の「本」は〜冊で数える——ほんを いっぽん は別の意味になる",
        "数量詞は動詞の直前に：×みっつを ください"
      ]
    }
  },
  "n5-teido": {
    "en": {
      "category": "N5 Grammar",
      "kicker": "N5 Patterns",
      "title": "Degree & Frequency: あまり・よく",
      "explanation":
        "The adverb system for degree and frequency. The negative-pairing pair: 「あまり〜ない」 = not very ~ and 「ぜんぜん〜ない」 = not at all ~ — spot either word and the sentence must end in a negative. The approximation pair: 「ごろ」 attaches to clock times (７じごろ), 「ぐらい」 to amounts and durations (じゅっぷんぐらい). Frequency adverbs from high to low: いつも > よく > ときどき > たまに > あまり(+neg) > ぜんぜん(+neg). Concrete rates use period + に + count: １しゅうかんに ２かい = twice a week.",
      "notes": [
        "Not very ~: pairs with a negative",
        "Not at all ~: pairs with a negative",
        "ごろ = clock time, ぐらい = amount",
        "The frequency ladder",
        "Period + に + count"
      ],
      "pitfalls": [
        "あまり and ぜんぜん demand a negative — ×あまり おもしろいです",
        "ごろ only attaches to points of time: ×じゅっぷんごろ (durations take ぐらい)",
        "Frequency adverbs must match the actual rate: three times a YEAR is not よく"
      ]
    },
    "ja": {
      "category": "N5文法",
      "kicker": "N5文型",
      "title": "程度と頻度 あまり・よく",
      "explanation":
        "程度と頻度の副詞システム。否定と呼応するペア：「あまり〜ない」＝あまり〜ない、「ぜんぜん〜ない」＝まったく〜ない——この二語を見たら文末は必ず否定。概数のペア：「ごろ」は時刻に（７じごろ）、「ぐらい」は数量・長さに（じゅっぷんぐらい）。頻度の副詞は高い順に：いつも＞よく＞ときどき＞たまに＞あまり（＋否定）＞ぜんぜん（＋否定）。具体的な頻度は「期間＋に＋回数」：１しゅうかんに ２かい。",
      "notes": [
        "あまり〜ない",
        "ぜんぜん〜ない",
        "ごろ＝時刻、ぐらい＝数量",
        "頻度のはしご",
        "期間＋に＋回数"
      ],
      "pitfalls": [
        "あまり・ぜんぜん は否定とセット——×あまり おもしろいです",
        "ごろ は時刻専用：×じゅっぷんごろ（長さは ぐらい）",
        "頻度の副詞は実際の回数に合わせる：年3回は よく ではない"
      ]
    }
  },
  "n4-ndesu": {
    "en": {
      "category": "N4 Grammar",
      "kicker": "N4 Patterns",
      "title": "The Explanatory 〜んです",
      "explanation":
        "N4's highest-frequency tone system. 「〜んです」 is not a plain です — it carries an explaining stance: pressing about something unusual you see (どうしたんですか), giving the background of your own actions (誕生日なんです), or cushioning a request (質問があるんですが…). Attachment: verbs and い-adjectives take the plain form directly (行くんです, 痛いんです); nouns and な-adjectives in the present take な (引っ越しなんです); past だった attaches bare (病気だったんです). Question and answer pair up: 〜んですか is answered with 〜んです.",
      "notes": [
        "Pressing for an explanation",
        "Answering: giving the reason",
        "Noun + な + んです; が = cushion",
        "Past だった attaches bare",
        "The request cushion んですが"
      ],
      "pitfalls": [
        "Plain form + です/ます is no sentence: ×行くです — either 行きます or 行くんです",
        "Nouns/な-adjectives take な: 学生なんです — but past だったんです drops it",
        "んですか needs a visible trigger; without one it sounds like an interrogation — neutral questions use ますか"
      ]
    },
    "ja": {
      "category": "N4文法",
      "kicker": "N4文型",
      "title": "説明の「んです」",
      "explanation":
        "N4 で最も頻度が高いモダリティ。「〜んです」はただの です ではなく「説明」の態度を帯びる：目の前の様子への追及（どうしたんですか）、自分の行動の背景説明（誕生日なんです）、依頼の前置き（質問があるんですが…）。接続：動詞・い形容詞は普通形に直接（行くんです）；名詞・な形容詞の現在肯定は な を挟む（引っ越しなんです）；過去 だった には直接（病気だったんです）。問いと答えはセット：〜んですか には 〜んです で返す。",
      "notes": [
        "様子への追及",
        "答え：理由の説明",
        "名詞＋な＋んです。が は前置き",
        "だった には直接",
        "依頼の前置き んですが"
      ],
      "pitfalls": [
        "普通形＋です/ます は文にならない：×行くです——行きます か 行くんです",
        "名詞・な形容詞は な：学生なんです。ただし過去は だったんです",
        "んですか はきっかけがあってこそ。なければ詰問に聞こえる——中立の質問は ますか"
      ]
    }
  },
  "n4-suiryou": {
    "en": {
      "category": "N4 Grammar",
      "kicker": "N4 Patterns",
      "title": "Conjecture & Causes: かもしれない・て",
      "explanation":
        "The certainty ladder: 〜かもしれない (might — 50% or less) < 〜だろう/でしょう (probably). だろう is the plain-form counterpart of でしょう. Shared attachment rule: nouns and な-adjectives attach BARE, dropping だ — 学生かもしれない, 休みだろう, 元気でしょう (contrast んです, which wants な). The other half is causal て: reasons for feelings and states use て/なくて — 知らせを聞いて安心した, 宿題が終わらなくて困っている. Negative formula: drop the い of ない, add くて.",
      "notes": [
        "Might: かもしれない",
        "だろう = plain でしょう",
        "Nouns attach bare, だ drops",
        "て = cause of a feeling",
        "Negative cause: なくて"
      ],
      "pitfalls": [
        "Before かも/だろう/でしょう, だ always drops: ×学生だかもしれない",
        "But んです wants な: 学生なんです — keep the two rule-sets apart",
        "Negative causes take なくて (states/feelings); ないで is \"doing B without doing A\""
      ]
    },
    "ja": {
      "category": "N4文法",
      "kicker": "N4文型",
      "title": "推量と原因 かもしれない・て",
      "explanation":
        "確信度のはしご：〜かもしれない（五分以下）＜〜だろう/でしょう（たぶん）。だろう は でしょう の普通体。共通の接続ルール：名詞・な形容詞は裸で付き、だ は落とす——学生かもしれない、休みだろう、元気でしょう（んです は な が要るのと対照的）。もう一つの柱は「て形の原因用法」：感情・状態の理由は て/なくて——知らせを聞いて安心した、終わらなくて困っている。否定の公式：ない の い を取って くて。",
      "notes": [
        "かもしれない",
        "だろう＝でしょう の普通体",
        "名詞は裸接続、だ は落とす",
        "て＝感情の原因",
        "否定の原因：なくて"
      ],
      "pitfalls": [
        "かも/だろう/でしょう の前で だ は必ず落ちる：×学生だかもしれない",
        "んです は な が要る：学生なんです——二つのルールを混ぜない",
        "原因の否定は なくて（状態・感情）。ないで は「Aしないで B する」の付帯状況"
      ]
    }
  },
  "n4-ishi": {
    "en": {
      "category": "N4 Grammar",
      "kicker": "N4 Patterns",
      "title": "Intention & Decision: つもり・ことにする",
      "explanation":
        "Three ways to say \"I plan to\", differing in strength and setting: volitional + と思っています = declaring an intention right now (やめようと思っています); 「〜つもりだ」 = a plan you hold — its negative goes on the verb (買わないつもり), and someone else's plan is reported as つもりらしい; 「〜予定だ」 = a schedule — inanimate things (planes, meetings) can only take 予定, since つもり needs a willful agent. The decision pair: you decide = 「〜ことにする」, someone/something else decides = 「〜ことになる」; a decision you keep observing = 「〜ことにしている」.",
      "notes": [
        "Intention: volitional + と思う",
        "つもり and its negative",
        "Schedules: inanimate → 予定",
        "ことにする vs ことになる",
        "ことにしている = standing rule"
      ],
      "pitfalls": [
        "Group-2 volitional = stem + よう (やめよう); ろう belongs to group-1 る-verbs (帰ろう)",
        "つもり is a noun and never conjugates; someone else's plan = つもりらしい (volitionals can't take らしい)",
        "ことにする (you) / ことになる (the outside) — ask who made the call"
      ]
    },
    "ja": {
      "category": "N4文法",
      "kicker": "N4文型",
      "title": "意志と決定 つもり・ことにする",
      "explanation":
        "「〜するつもり」の言い分け三つ：意向形＋と思っています＝いまの意志表明（やめようと思っています）；「〜つもりだ」＝抱えている予定で、否定は前の動詞に付く（買わないつもり）。他人の予定は つもりらしい で伝える。「〜予定だ」＝スケジュール——無生物（飛行機・会議）は 予定 しか使えない（つもり は意志の主体が要る）。決定のペア：自分で決める＝「〜ことにする」、外から決まる＝「〜ことになる」；決めて続けている＝「〜ことにしている」。",
      "notes": [
        "意志：意向形＋と思う",
        "つもり とその否定",
        "スケジュール：無生物は 予定",
        "ことにする vs ことになる",
        "ことにしている＝自分ルール"
      ],
      "pitfalls": [
        "二類の意向形＝語幹＋よう（やめよう）。ろう は一類る動詞のもの（帰ろう）",
        "つもり は名詞で活用しない。他人の予定＝つもりらしい（意向形に らしい は付かない）",
        "ことにする（自分）／ことになる（外部）——決めたのは誰か"
      ]
    }
  },
  "n4-meirei": {
    "en": {
      "category": "N4 Grammar",
      "kicker": "N4 Patterns",
      "title": "Commands & Prohibition: しろ・するな",
      "explanation":
        "The command ladder, blunt to soft: the imperative (group 1 = final vowel to え: 走れ; group 2 = stem + ろ: 逃げろ; する→しろ, 来る→こい) → 「〜なさい」 (ます-stem + なさい, the parent/teacher register) → て-form requests (from N5). Prohibition = dictionary form + な (捨てるな). Colloquial obligation contractions: 「〜なきゃ」 (= なければ) and 「〜なくちゃ」 (= なくては). Relayed orders use 「〜ように言う」. You rarely bark imperatives yourself, but signs (止まれ), emergencies (逃げろ), and quotations (しろと言われた) all run on them.",
      "notes": [
        "Imperative: group-2 ろ, group-1 え row",
        "Prohibition: dictionary form + な",
        "Soft command: ます-stem + なさい",
        "なきゃ / なくちゃ contractions",
        "Relayed order: ように言う"
      ],
      "pitfalls": [
        "なさい takes the ます-stem (しなさい); dictionary form + なさい (×するなさい) is no sentence",
        "な has two faces: dictionary form + な = don't (行くな); ます-stem + な = go on (行きな) — opposites",
        "する's imperative is しろ (written tests use the literary せよ)"
      ]
    },
    "ja": {
      "category": "N4文法",
      "kicker": "N4文型",
      "title": "命令と禁止 しろ・するな",
      "explanation":
        "命令のはしご（強→柔）：命令形（一類＝語尾え段：走れ；二類＝語幹＋ろ：逃げろ；する→しろ、来る→こい）→「〜なさい」（ます形の語幹＋なさい。親や先生の口調）→ て形の依頼（N5）。禁止＝辞書形＋な（捨てるな）。口語の義務の縮約：「〜なきゃ」（＝なければ）と「〜なくちゃ」（＝なくては）。指示の伝達は「〜ように言う」。命令形を自分で使う場面は少ないが、標識（止まれ）・緊急（逃げろ）・引用（しろと言われた）はみなこれ。",
      "notes": [
        "命令形：二類ろ・一類え段",
        "禁止：辞書形＋な",
        "柔らかい命令：〜なさい",
        "なきゃ／なくちゃ",
        "伝達：ように言う"
      ],
      "pitfalls": [
        "なさい は ます形の語幹に付く（しなさい）。辞書形＋なさい（×するなさい）は文にならない",
        "な の二つの顔：辞書形＋な＝禁止（行くな）、ます語幹＋な＝促し（行きな）——正反対",
        "する の命令形は しろ（書面の指示では文語の せよ）"
      ]
    }
  },
  "n4-shushoku": {
    "en": {
      "category": "N4 Grammar",
      "kicker": "N4 Patterns",
      "title": "Noun-Modifying Clauses: 〜した＋noun",
      "explanation":
        "N4's biggest syntactic leap: parking a whole sentence in front of a noun as its modifier — きのう買った本 (the book I bought yesterday), 大阪に住んでいる友だち (a friend living in Osaka). Three iron rules: (1) inside the clause use plain forms — polite ます/です can't enter; (2) the clause's tense tracks whether ITS OWN event happened, not the main clause — 来週泊まるホテルは、もう予約しました (the stay hasn't happened → dictionary form, even though the booking is past); (3) the clause's subject takes が (母が作った料理), interchangeable with の (母の作った料理). Introduce names with 「〜という＋noun」 (さくらという店); define terms with 「〜というのは」.",
      "notes": [
        "Plain forms inside the clause",
        "Clause tense = the event's own tense",
        "Clause subject: が (or の)",
        "Introducing: 〜という + noun",
        "Defining: 〜というのは"
      ],
      "pitfalls": [
        "Polite forms can't modify: ×歌っています人 → 歌っている人",
        "は can't enter a modifier clause — its subject takes が (or の)",
        "Clause tense is independent: bought yesterday = 買った, staying next week = 泊まる"
      ]
    },
    "ja": {
      "category": "N4文法",
      "kicker": "N4文型",
      "title": "名詞修飾節 〜した＋名詞",
      "explanation":
        "N4 最大の構文ジャンプ：文をまるごと名詞の前に置いて修飾する——きのう買った本、大阪に住んでいる友だち。鉄則三つ：①節の中は普通形。ます/です は入れない。②節の時制は「その出来事」が起きたかどうかで決まり、主文に引きずられない——来週泊まるホテルは、もう予約しました。③節内の主語は が（母が作った料理）で、の と交替できる（母の作った料理）。名前の紹介は「〜という＋名詞」、定義は「〜というのは」。",
      "notes": [
        "節の中は普通形",
        "節の時制は出来事基準",
        "節内主語は が（／の）",
        "紹介：〜という＋名詞",
        "定義：〜というのは"
      ],
      "pitfalls": [
        "敬体は修飾節に入れない：×歌っています人→歌っている人",
        "は は修飾節に入れない——節内主語は が（または の）",
        "節の時制は独立：昨日買った＝買った、来週泊まる＝泊まる"
      ]
    }
  },
  "n4-kansetsu": {
    "en": {
      "category": "N4 Grammar",
      "kicker": "N4 Patterns",
      "title": "Indirect Questions: かどうか・〜か",
      "explanation":
        "Embedding a question inside a sentence = an indirect question, and the split is a single line: if the clause HAS a question word (いつ, どこ, だれ, どうして…) use 「〜か」 — いつ始まるか知っていますか; a yes/no clause WITHOUT one uses 「〜かどうか」 — 行くかどうか、まだ決めていません (expanded form: 行くか行かないか). Attachment follows the conjecture family: nouns and な-adjectives attach bare, だ drops (本当かどうか); the inside stays plain — polite forms can't enter (×来るですか → 来るか); politeness lives at the end of the sentence.",
      "notes": [
        "No question word → かどうか",
        "Question word → か",
        "Nouns attach bare, だ drops",
        "Plain forms inside",
        "Expanded: 〜か〜ないか"
      ],
      "pitfalls": [
        "Question word + かどうか is wrong: ×いつ来るかどうか → いつ来るか",
        "Polite forms inside fail: ×来ますか教えて → 来るか教えて",
        "Nouns drop だ before かどうか: ×本当だかどうか"
      ]
    },
    "ja": {
      "category": "N4文法",
      "kicker": "N4文型",
      "title": "間接疑問 かどうか・〜か",
      "explanation":
        "質問を文の中に埋め込むのが間接疑問。線引きは一本だけ：節内に疑問詞（いつ・どこ・だれ・どうして…）が「ある」なら「〜か」——いつ始まるか知っていますか；疑問詞の「ない」Yes/No 型は「〜かどうか」——行くかどうか、まだ決めていません（展開形＝行くか行かないか）。接続は推量の仲間と同じ：名詞・な形容詞は裸接続で だ を落とす（本当かどうか）；中身は普通形——敬体は入れない（×来るですか→来るか）。丁寧さは文末に置けば足りる。",
      "notes": [
        "疑問詞なし→かどうか",
        "疑問詞あり→か",
        "名詞は裸接続、だ を落とす",
        "中身は普通形",
        "展開形：〜か〜ないか"
      ],
      "pitfalls": [
        "疑問詞＋かどうか は誤り：×いつ来るかどうか→いつ来るか",
        "中の敬体は文にならない：×来ますか教えて→来るか教えて",
        "名詞は だ を落とす：×本当だかどうか"
      ]
    }
  },
  "n4-fukugou": {
    "en": {
      "category": "N4 Grammar",
      "kicker": "N4 Patterns",
      "title": "Compound Verbs: 〜はじめる・〜方",
      "explanation":
        "Gluing two verbs into one = a compound verb, with the ます-stem up front. The four stages: 〜はじめる (start), 〜だす (sudden start, pairs with 急に), 〜つづける (keep doing), 〜おわる (finish) — watch transitivity: はじめる/つづける are transitive (you do it), はじまる/つづく are intransitive (it happens) — don't glue the wrong one. The direction pair: 〜ていく (away from the speaker) / 〜てくる (toward the speaker) — the same pair also marks time drift (変わってきた = has been changing up to now, 変わっていく = will keep changing). Two derivations: ます-stem + 方 (かた) = how to ~ (読み方); い-adjective minus い + さ = a noun (高さ).",
      "notes": [
        "Sudden start: 〜だす",
        "Start / keep doing (transitive)",
        "Direction: いく away, くる toward",
        "ます-stem + 方 = method",
        "Drop い + さ = noun"
      ],
      "pitfalls": [
        "Don't glue the intransitive: ×習いはじまる → 習いはじめる (はじまる is for 会議がはじまる)",
        "急に / 突然 pair with 〜だす; a plain start uses 〜はじめる",
        "For the temporal ていく/てくる, think direction: toward now = てきた, toward the future = ていく"
      ]
    },
    "ja": {
      "category": "N4文法",
      "kicker": "N4文型",
      "title": "複合動詞 〜はじめる・〜方",
      "explanation":
        "動詞二つを一語に貼り合わせる＝複合動詞。前半は ます形の語幹。段階の四点セット：〜はじめる（開始）、〜だす（急な開始。急に とセット）、〜つづける（継続）、〜おわる（完了）——自他に注意：はじめる/つづける は他動（自分がする）、はじまる/つづく は自動（事が起こる）。方向のペア：〜ていく（話し手から離れる）/〜てくる（話し手へ向かう）——時間の推移にも使う（変わってきた＝今まで、変わっていく＝これから）。語形成二つ：ます語幹＋方（読み方）；い形容詞の い を取って さ（高さ）。",
      "notes": [
        "急な開始：〜だす",
        "開始・継続（他動）",
        "方向：いく／くる",
        "ます語幹＋方＝やり方",
        "い を取って さ＝名詞化"
      ],
      "pitfalls": [
        "自他を貼り間違えない：×習いはじまる→習いはじめる",
        "急に・突然 は 〜だす と、ふつうの開始は 〜はじめる",
        "時間の ていく/てくる は方向で考える：今へ＝てきた、これから＝ていく"
      ]
    }
  },
  "n4-henka": {
    "en": {
      "category": "N4 Grammar",
      "kicker": "N4 Patterns",
      "title": "Change: ようになる・くする・まま",
      "explanation":
        "The full change system. 「〜ようになる」 = come to (be able to) ~: with a potential verb it's an ability change (泳げるようになった), with a plain verb a habit change (早く起きるようになった); negative change = drop the い of ない + くなる (来なくなった). 「〜ようにする」 = make an effort to ~, neighbor to ことにする (resolve to). Transitive change — making something ~: い-adjective + くする (明るくする), な-adjective/noun + にする (静かにする); contrast N5's self-change くなる/になる. 「〜まま」 = leaving things as they are: た-form + まま (つけたまま寝た), ない-form + まま (消さないまま出かけた).",
      "notes": [
        "Ability change: potential + ようになる",
        "Effort: ようにする",
        "Making it ~: く / に + する",
        "Negative change: なく + なる",
        "As-is: た/ない form + まま"
      ],
      "pitfalls": [
        "ようにする = keep trying, ことにする = made up your mind — often interchangeable; read the context",
        "Change markers pair up: い-adj → く, な-adj/noun → に (for both する and なる)",
        "Before まま: a done state takes た (つけたまま), an undone one ない (消さないまま)"
      ]
    },
    "ja": {
      "category": "N4文法",
      "kicker": "N4文型",
      "title": "変化 ようになる・くする・まま",
      "explanation":
        "変化のフルセット。「〜ようになる」＝〜（できる）ようになる：可能動詞なら能力の変化（泳げるようになった）、一般動詞なら習慣の変化（早く起きるようになった）；否定の変化は ない の い を取って くなる（来なくなった）。「〜ようにする」＝〜するよう努める。ことにする（決心）とはお隣さん。他動の変化：い形容詞＋くする（明るくする）、な形容詞・名詞＋にする（静かにする）；N5 の くなる/になる（自変）と対。「〜まま」＝そのままの状態で：た形＋まま（つけたまま寝た）、ない形＋まま（消さないまま出かけた）。",
      "notes": [
        "能力の変化：可能動詞＋ようになる",
        "努力：ようにする",
        "〜にする・〜くする",
        "否定の変化：なく＋なる",
        "そのまま：た/ない形＋まま"
      ],
      "pitfalls": [
        "ようにする＝努力、ことにする＝決心——交換できる場面も多い。文脈で読む",
        "変化のマーカー：い形→く、な形・名詞→に（する にも なる にも）",
        "まま の前：した状態は た形、していない状態は ない形"
      ]
    }
  },
  "n4-jikan": {
    "en": {
      "category": "N4 Grammar",
      "kicker": "N4 Patterns",
      "title": "Time: 間・までに・おきに",
      "explanation":
        "Fine-tuning time. 「〜間 (あいだ)」 = a whole span, with a durative predicate (夏休みの間ずっと家にいた); 「〜間に」 = one point within that span, with a punctual event (寝ている間に電話が来た) — the difference is whether the predicate lasts or happens once. The deadline pair: 「〜までに」 = finish before a time (a one-shot action: 金曜日までに出す); 「〜まで」 = last until a time (a durative action: 来るまで待つ). Also: 「〜おきに」 = at fixed intervals (6時間おきに); 「noun + 中 (ちゅう)」 = in progress (電話中, 工事中).",
      "notes": [
        "Whole span: 間 + durative",
        "One point: 間に + punctual",
        "までに (deadline) vs まで (until)",
        "Fixed interval: おきに",
        "In progress: noun + 中"
      ],
      "pitfalls": [
        "間 (durative predicate) vs 間に (one-time event) — look at the following action",
        "までに (deadline + one-shot) vs まで (last until) — 出す takes までに, 待つ takes まで",
        "おきに is an interval; the \"each portion\" 〜ずつ is different — don't mix them"
      ]
    },
    "ja": {
      "category": "N4文法",
      "kicker": "N4文型",
      "title": "時間 間・までに・おきに",
      "explanation":
        "時間の細かい使い分け。「〜間（あいだ）」＝ひとまとまりの期間、継続する述語（夏休みの間ずっと家にいた）。「〜間に」＝その期間の中の一点、一回の出来事（寝ている間に電話が来た）——述語が続くか一回かの違い。期限のペア：「〜までに」＝ある時までに終える（一回の動作：金曜日までに出す）、「〜まで」＝ある時まで続く（継続動作：来るまで待つ）。ほかに：「〜おきに」＝一定の間隔（6時間おきに）、「名詞＋中（ちゅう）」＝進行中（電話中・工事中）。",
      "notes": [
        "ひとまとまり：間＋継続",
        "一点：間に＋一回",
        "までに（期限）vs まで（継続）",
        "一定間隔：おきに",
        "進行中：名詞＋中"
      ],
      "pitfalls": [
        "間（継続の述語）vs 間に（一回の出来事）——後ろの動作で見分ける",
        "までに（期限＋一回）vs まで（〜まで続く）——出す は までに、待つ は まで",
        "おきに は間隔。均等配分の「〜ずつ」とは別物"
      ]
    }
  },
  "n4-juju": {
    "en": {
      "category": "N4 Grammar",
      "kicker": "N4 Patterns",
      "title": "Giving & Requests: くれる・いただく",
      "explanation":
        "The direction system for giving and receiving, plus honorific tiers. Three axes: あげる (my side gives out), くれる (someone gives my side), もらう (my side receives — the subject is the receiver). Stepping up in politeness: あげる→さしあげる (humble, giving to a superior), くれる→くださる (honorific, a superior gives me), もらう→いただく (humble, receiving from a superior). Direction is read from subject + recipient: 先生が私に → くださる; 私が先生に (give) → さしあげる; 私が先生に (receive) → いただく. The deferential request = 「〜ていただけませんか」 = couldn't you ~ for me (the humble potential of もらう).",
      "notes": [
        "Someone gives me: くれる",
        "I receive: もらう (subject = receiver)",
        "A superior gives me: くださる",
        "To/from a superior: さしあげる/いただく",
        "Deferential request"
      ],
      "pitfalls": [
        "くれる/くださる = other → my side; あげる/さしあげる = my side → other — don't flip the arrow",
        "The subject of もらう/いただく is the RECEIVER: 私は先生にいただいた",
        "やる is for juniors/plants/animals — rude to a superior; use さしあげる"
      ]
    },
    "ja": {
      "category": "N4文法",
      "kicker": "N4文型",
      "title": "授受と依頼 くれる・いただく",
      "explanation":
        "やり・もらいの方向システムと敬語の段階。三本の軸：あげる（自分側が出す）、くれる（相手が自分側に）、もらう（自分側が受け取る＝主語は受け手）。敬語の段：あげる→さしあげる（謙譲、目上へ）、くれる→くださる（尊敬、目上が私に）、もらう→いただく（謙譲、目上から受け取る）。方向は主語＋相手で読む：先生が私に→くださる、私が先生に（あげる）→さしあげる、私が先生に（もらう）→いただく。丁重な依頼＝「〜ていただけませんか」（もらう の謙譲・可能形）。",
      "notes": [
        "相手が私に：くれる",
        "私が受け取る：もらう（主語＝受け手）",
        "目上が私に：くださる",
        "目上へ／から：さしあげる・いただく",
        "丁重な依頼"
      ],
      "pitfalls": [
        "くれる/くださる＝相手→自分側、あげる/さしあげる＝自分側→相手——矢印を逆にしない",
        "もらう/いただく の主語は「受け取る人」：私は先生にいただいた",
        "やる は目下・動植物用。目上には失礼——さしあげる を使う"
      ]
    }
  },
  "n4-chikaku": {
    "en": {
      "category": "N4 Grammar",
      "kicker": "N4 Patterns",
      "title": "Perception & Limits: 見える・しか",
      "explanation":
        "Perception: 「見える／聞こえる」 = something reaches your eyes/ears unbidden (窓から海が見える), distinct from the potential 「見られる／聞ける」 = you get the chance/ability to see/hear (予約すれば見られる). Sensations use 「〜がする」 = 匂い・音・味・気がする. Limiting and comparison: 「〜ほど〜ない」 = not as ~ as (昨日ほど寒くない — always ends negative); 「〜しか〜ない」 = only ~ (100円しかない — always ends negative, opposite of だけ which takes affirmatives); 「〜ずつ」 = ~ apiece (一つずつ).",
      "notes": [
        "Reaches the senses: 見える",
        "Get to see: potential 見られる",
        "Sensation: がする",
        "Not as ~ as: ほど〜ない",
        "Only しか / apiece ずつ"
      ],
      "pitfalls": [
        "見える/聞こえる (spontaneous) ≠ 見られる/聞ける (opportunity, ability)",
        "ほど〜ない and しか〜ない always end in a negative",
        "しか (with a negative) vs だけ (with an affirmative): しかない / だけある"
      ]
    },
    "ja": {
      "category": "N4文法",
      "kicker": "N4文型",
      "title": "知覚と限定 見える・しか",
      "explanation":
        "知覚：「見える／聞こえる」＝意志によらず自然に目・耳に入る（窓から海が見える）。可能形「見られる／聞ける」＝機会・条件があって見られる/聞ける（予約すれば見られる）とは別。感覚は「〜がする」＝匂い・音・味・気がする。限定と比較：「〜ほど〜ない」＝〜ほど〜ない（昨日ほど寒くない。必ず否定で終わる）、「〜しか〜ない」＝〜だけ（100円しかない。必ず否定で終わり、肯定と組む だけ と対）、「〜ずつ」＝均等に（一つずつ）。",
      "notes": [
        "自然に入る：見える",
        "見る機会：可能形 見られる",
        "感覚：がする",
        "〜ほど〜ない",
        "しか／ずつ"
      ],
      "pitfalls": [
        "見える/聞こえる（自然）≠ 見られる/聞ける（機会・能力）",
        "ほど〜ない、しか〜ない は必ず否定で終わる",
        "しか（否定と）vs だけ（肯定と）：しかない／だけある"
      ]
    }
  },
  "adverbial": {
    "en": {
      "category": "Modifying Adjectives / Nouns",
      "title": "First, tell く and に apart",
      "explanation": "Drop い from an i-adjective and add く to modify a verb; na-adjectives and nouns take に first. The に used later in the \"obligation-past\" pattern grows out of this too, so nail down this step first.",
      "kicker": "Basic Modification",
      "notes": [
        "An i-adjective takes く when it modifies a verb.",
        "The negative and negative-past both build off the く form.",
        "A na-adjective takes に when it modifies a verb.",
        "At the end of a sentence it behaves like a noun clause.",
        "A noun + に is common for status or direction.",
        "A noun clause takes だった in the past."
      ],
      "pitfalls": [
        "The negative past of an i-adjective is くなかった, not かった made negative again.",
        "The past of a na-adjective is だった; don't leave the な in and then add た."
      ]
    },
    "ja": {
      "category": "形容詞・名詞の修飾",
      "title": "まずは く / に を区別",
      "explanation": "い形容詞は い を取って く をつけて動詞を修飾する。な形容詞と名詞はまず に をつける。あとで「必要の過去」で使う に もここから派生するので、この段階でしっかり土台を作っておく。",
      "kicker": "基本の修飾",
      "notes": [
        "い形容詞が動詞を修飾するときは く を使う",
        "否定も否定過去も、まず く にしてから変える",
        "な形容詞が動詞を修飾するときは に を使う",
        "文末は名詞句のようになる",
        "名詞＋に は身分や方向によく使う",
        "名詞句の文末の過去は だった を使う"
      ],
      "pitfalls": [
        "い形容詞の否定過去は くなかった で、かった をさらに否定するのではない",
        "な形容詞の過去は だった で、な を残したまま た をつけない"
      ]
    }
  },
  "negative": {
    "en": {
      "category": "Verb Conjugation",
      "title": "The ない-form family",
      "explanation": "Line up ない, ないで, なくて, and なかった as one chain. Every negative extension (connecting, past) starts by making the ない form, then conjugates from ない.",
      "kicker": "The ない-Form, Organized",
      "notes": [
        "Group 1 verbs shift to the あ-row first; verbs ending in う become わ.",
        "The negative te-form: it's not built from the te-form.",
        "The negative connective: often used to give a reason or describe a state.",
        "The negative past: it's not built from the た-form."
      ],
      "pitfalls": [
        "Don't build the negative from the te-form — build it from the ない form.",
        "A Group 1 verb ending in う becomes わない (買う → 買わない), not あない."
      ]
    },
    "ja": {
      "category": "動詞の活用",
      "title": "ない形ファミリー",
      "explanation": "ない、ないで、なくて、なかった を一本の線につなげて覚える。否定の派生（接続・過去）はすべて、まず ない形 を作ってから、ない を変えていく。",
      "kicker": "ない形の整理",
      "notes": [
        "一類動詞はまず あ段 に換える。う で終わるものは わ になる",
        "否定のて形。て形から否定を作るのではない",
        "否定の接続。理由や状態を続けるときによく使う",
        "否定の過去。た形から否定を作るのではない"
      ],
      "pitfalls": [
        "否定は て形 からではなく、ない形 から変える",
        "う で終わる一類動詞は わない になる（買う → 買わない）。あない ではない"
      ]
    }
  },
  "teTa": {
    "en": {
      "category": "Verb Conjugation",
      "title": "Verb te-form / た-form (key Group 1 sound changes)",
      "explanation": "Once you know the sound changes for Group 1 verbs (く→いて, ぐ→いで, す→して, う・つ・る→って, む・ぶ・ぬ→んで), you can plug them into any pattern directly.",
      "kicker": "Sound Changes, Organized",
      "notes": [
        "Ending in く: いて / いた.",
        "Ending in ぐ: いで / いだ.",
        "Ending in す: して / した.",
        "Ending in う・つ・る: って / った.",
        "Ending in む・ぶ・ぬ: んで / んだ."
      ],
      "pitfalls": [
        "For Group 2 verbs, just drop る and add て / た (食べる → 食べて / 食べた) — no sound change.",
        "帰る ends in る but is Group 1, so it takes the sound change (帰る → 帰って / 帰った)."
      ]
    },
    "ja": {
      "category": "動詞の活用",
      "title": "動詞のて形・た形（一類の音便が要点）",
      "explanation": "一類動詞の音便（く→いて、ぐ→いで、す→して、う・つ・る→って、む・ぶ・ぬ→んで）に慣れれば、どんな文型にもそのまま当てはめられる。",
      "kicker": "音便の整理",
      "notes": [
        "く で終わる：いて／いた",
        "ぐ で終わる：いで／いだ",
        "す で終わる：して／した",
        "う・つ・る で終わる：って／った",
        "む・ぶ・ぬ で終わる：んで／んだ"
      ],
      "pitfalls": [
        "二類動詞は る を取って て／た をつけるだけ（食べる → 食べて／食べた）で、音便はない",
        "「帰る」は る で終わるが一類なので、音便になる（帰る → 帰って／帰った）"
      ]
    }
  },
  "obligationPast": {
    "en": {
      "category": "Advanced Patterns",
      "title": "Obligation in the past",
      "explanation": "Push \"must (なければならない)\" into the past (なければならなかった). Verbs go straight in; adjectives and nouns must first become \"-くなる / -になる\" before you form the obligation-past.",
      "kicker": "Putting It Together",
      "notes": [
        "Verb: first make the ない form 書かない, then swap ない for なければならなかった.",
        "I-adjective: first make 高くなる, then put it into the obligation-past.",
        "Na-adjective: first add に to make 静かになる.",
        "Noun: this is the form that trips people up the most."
      ],
      "pitfalls": [
        "Adjectives and nouns must first become \"-くなる / -になる\" before adding the obligation-past.",
        "The past marker goes in the final ならなかった, not earlier in the phrase."
      ]
    },
    "ja": {
      "category": "応用文型",
      "title": "必要の過去",
      "explanation": "「必要（なければならない）」を過去（なければならなかった）に移す。動詞はそのまま作る。形容詞と名詞はまず「-くなる / -になる」にしてから必要の過去を作る。",
      "kicker": "総合応用",
      "notes": [
        "動詞：まず ない形「書かない」を作り、ない を なければならなかった に換える",
        "い形容詞：まず 高くなる を作り、それから必要の過去に変える",
        "な形容詞：まず に をつけて 静かになる にする",
        "名詞：ここが一番つまずきやすい型"
      ],
      "pitfalls": [
        "形容詞・名詞はまず「-くなる / -になる」にしてから必要の表現をつける",
        "過去は最後の ならなかった に置く。前に置くのではない"
      ]
    }
  },
  "verb-types": {
    "en": {
      "category": "Verb Conjugation",
      "title": "How to sort the three verb groups",
      "explanation": "Japanese verbs fall into three groups, and every conjugation starts by identifying the group from the \"dictionary form + context,\" then applying the rule. Ending in る doesn't automatically mean Group 2 — sort the group correctly first and the later conjugations will follow.",
      "kicker": "Basic Sorting",
      "notes": [
        "A verb ending in a う-row sound is usually Group 1.",
        "Ending in む follows the Group 1 pattern.",
        "An え-row sound before る → usually Group 2.",
        "An い-row sound before る → usually Group 2.",
        "Group 3: just memorize it.",
        "Group 3; read as きます (not くます)."
      ],
      "pitfalls": [
        "帰る, 走る, 入る, and 切る all end in る but are Group 1, so they take the sound change.",
        "N + する verbs like 勉強する and 練習する behave like する, so treat them as Group 3.",
        "When sorting, look at the whole dictionary form, not just the final character."
      ]
    },
    "ja": {
      "category": "動詞の活用",
      "title": "動詞三グループの見分け方",
      "explanation": "日本語の動詞は三グループに分かれる。どの活用もまず「辞書形＋文脈」でグループを判別してから規則を当てはめる。る で終わっても二類とはかぎらないので、まず正しく分類すれば、あとの活用も正しくついてくる。",
      "kicker": "基本の判別",
      "notes": [
        "う段 で終わるものはたいてい一類",
        "む で終わるものは一類",
        "え段 の る の前がある → たいてい二類",
        "い段 の る の前がある → たいてい二類",
        "三類：そのまま覚える",
        "三類。きます と読む（くます ではない）"
      ],
      "pitfalls": [
        "「帰る」「走る」「入る」「切る」は る で終わるが一類なので、音便になる",
        "「勉強する」「練習する」のような N ＋する も する と同類で、三類として扱う",
        "判別するときは辞書形全体を見て、語尾一文字だけを見ないこと"
      ]
    }
  },
  "masu": {
    "en": {
      "category": "Verb Conjugation",
      "title": "The ます-form",
      "explanation": "This is the basic polite sentence ending, and it's also the base that たい, ながら, ことができる, and others attach to (V ます-form = V continuative form). For Group 1, change the last character to the い-row and add ます; for Group 2, drop る and add ます; for Group 3, just memorize it.",
      "kicker": "Basic Polite Speech",
      "notes": [
        "Group 1: く becomes き + ます.",
        "Group 1: む becomes み + ます.",
        "Group 2: drop る + ます.",
        "Group 2.",
        "Group 3.",
        "Group 3; read as きます."
      ],
      "pitfalls": [
        "う doesn't shift to the あ-row; it shifts to the い-row (買う → 買います, not 買あます).",
        "Group 2 takes no sound change — just drop る and add ます.",
        "In the ます-form, 来る is read き, not く (the same reading as in the te-form 来て)."
      ]
    },
    "ja": {
      "category": "動詞の活用",
      "title": "ます形",
      "explanation": "敬語の文末の基本形であり、あとの たい、ながら、ことができる などの接続の基礎でもある（V ます形 ＝ V 連用形）。一類動詞は語尾を い段 に換えて＋ます。二類は る を取って＋ます。三類はそのまま覚える。",
      "kicker": "基本の敬語",
      "notes": [
        "一類：く を き に換えて＋ます",
        "一類：む を み に換えて＋ます",
        "二類：る を取って＋ます",
        "二類",
        "三類",
        "三類。きます と読む"
      ],
      "pitfalls": [
        "う で終わるものは あ段 ではなく い段 に換える（買う → 買います。買あます ではない）",
        "二類は音便にならず、る を取って ます をつけるだけでよい",
        "「来る」はます形のとき き と読む。く ではない（て形 来て の読み方と同じ）"
      ]
    }
  },
  "plain": {
    "en": {
      "category": "Sentence Skeleton",
      "title": "The four plain-form slots",
      "explanation": "The plain form is dictionary form + ない / た / なかった — four slots. Same-level patterns (と思う, と言う, んです, つもり) all attach to the plain form. Remember that \"present affirmative\" is just the dictionary form itself.",
      "kicker": "The Plain Form, Organized",
      "notes": [
        "Verb: dictionary / ない / た / なかった.",
        "I-adjective: drop い, then add the endings.",
        "Na-adjective.",
        "Nouns take the same form as na-adjectives."
      ],
      "pitfalls": [
        "The affirmative sentence-ending of a na-adjective or noun needs だ (静かだ / 学生だ), not a direct attachment to the following clause.",
        "\"Plain form + んです\" is a common way to express emphasis or a reason; without だ it breaks down.",
        "Conjunctions and quotative と思う / と言う take the plain form, not the ます-form."
      ]
    },
    "ja": {
      "category": "文型の骨組み",
      "title": "普通形の四マス",
      "explanation": "普通形は 辞書形＋ない／た／なかった の四マス。同じ層の文型（と思う、と言う、んです、つもり）はすべて普通形に接続する。「現在肯定」は辞書形そのものだと覚えておく。",
      "kicker": "普通形の整理",
      "notes": [
        "動詞：辞書／ない／た／なかった",
        "い形容詞：い を取ってからつける",
        "な形容詞",
        "名詞は な形容詞と同型"
      ],
      "pitfalls": [
        "な形容詞と名詞の肯定の文末には だ をつける（静かだ／学生だ）。直接あとの句につなげない",
        "「普通形 ＋ んです」はよくある「強調 / 理由」の表現で、だ がないとつまずく",
        "接続詞や引用の と思う / と言う はすべて普通形をとり、ます形ではない"
      ]
    }
  },
  "potential": {
    "en": {
      "category": "Verb Conjugation",
      "title": "Potential form (V られる)",
      "explanation": "\"Can do something.\" For Group 1, change the last character to the え-row and add る; for Group 2, drop る and add られる; for Group 3, する → できる, 来る → 来られる. The original を often becomes が (本を読む → 本が読める).",
      "kicker": "Expressing Ability",
      "notes": [
        "Group 1: く becomes け + る.",
        "Group 1: む becomes め + る.",
        "Group 2: drop る + られる.",
        "Group 2; note it's not 見れる (ら-dropping).",
        "Group 3: irregular.",
        "Group 3; read as こられる."
      ],
      "pitfalls": [
        "In casual speech people say 見れる / 食べれる (ら-dropped speech), but in formal writing and on exams you should write 見られる / 食べられる.",
        "を in the sentence often becomes が: 本を読む → 本が読める.",
        "Memorize する as できる, not しられる."
      ]
    },
    "ja": {
      "category": "動詞の活用",
      "title": "可能形 (V られる)",
      "explanation": "「〜できる」。一類動詞は語尾を え段 に換えて＋る。二類は る を取って＋られる。三類：する → できる、来る → 来られる。もとの「を」はよく「が」になる（本を読む → 本が読める）。",
      "kicker": "能力の表現",
      "notes": [
        "一類：く を け に換えて＋る",
        "一類：む を め に換えて＋る",
        "二類：る を取って＋られる",
        "二類。「見れる」（ら抜き）ではないことに注意",
        "三類：不規則",
        "三類。こられる と読む"
      ],
      "pitfalls": [
        "話し言葉では「見れる／食べれる」（ら抜き言葉）と言うが、正式な書き言葉や試験では「見られる／食べられる」と書く",
        "文中の「を」はよく「が」になる：本を読む → 本が読める",
        "「する」は「できる」と覚える。「しられる」ではない"
      ]
    }
  },
  "volitional": {
    "en": {
      "category": "Verb Conjugation",
      "title": "Volitional form (V よう)",
      "explanation": "Expresses \"let's...\" or \"I intend to.\" For Group 1, change the last character to the お-row and add う; for Group 2, drop る and add よう; for Group 3, する → しよう, 来る → 来よう. Often paired with と思う / とする to show a personal decision or that you're about to do something.",
      "kicker": "Intention / Invitation",
      "notes": [
        "Group 1: く becomes こ + う.",
        "Group 1: む becomes も + う.",
        "Group 2: drop る + よう.",
        "Group 2.",
        "Group 3.",
        "Group 3; read as こよう."
      ],
      "pitfalls": [
        "The ます-form becomes ましょう while the volitional becomes こう / よう; don't mix the two up.",
        "ようとする means \"be just about to do (but get interrupted)\" — a common pairing.",
        "Casual invitation: 行こう, 食べよう; in writing or formally to outsiders: ましょう."
      ]
    },
    "ja": {
      "category": "動詞の活用",
      "title": "意向形 (V よう)",
      "explanation": "「〜しよう」（勧誘）や「自分がしたい」という意志を表す。一類動詞は語尾を お段 に換えて＋う。二類は る を取って＋よう。三類：する → しよう、来る → 来よう。よく と思う／とする と組んで、自分の決意やちょうどしようとしていることを表す。",
      "kicker": "意志・勧誘",
      "notes": [
        "一類：く を こ に換えて＋う",
        "一類：む を も に換えて＋う",
        "二類：る を取って＋よう",
        "二類",
        "三類",
        "三類。こよう と読む"
      ],
      "pitfalls": [
        "ます形は ましょう になり、意向形は こう／よう になる。この二つを混同しない",
        "「ようとする」は「ちょうどしようとする（が、さえぎられる）」で、よくある組み合わせ",
        "話し言葉の勧誘：行こう、食べよう。書き言葉や目上の人への丁寧な言い方：ましょう"
      ]
    }
  },
  "passive": {
    "en": {
      "category": "Verb Conjugation",
      "title": "Passive form (V られる)",
      "explanation": "\"Be ...ed.\" For Group 1, change the last character to the あ-row and add れる; for Group 2, drop る and add られる; for Group 3, する → される, 来る → 来られる. The agent is marked with に (先生に叱られた).",
      "kicker": "The Passive",
      "notes": [
        "Group 1: る becomes ら + れる.",
        "Group 1: む becomes ま + れる.",
        "Group 2: identical in form to the potential — tell them apart from context.",
        "Group 3.",
        "Group 3 (the \"adversative passive\": bothered by someone coming)."
      ],
      "pitfalls": [
        "For Group 2, the passive and the potential look identical (食べられる) — distinguish them from context.",
        "A Group 1 verb ending in う becomes わ: 買う → 買われる (not 買あれる).",
        "に marks the agent and を marks the thing acted upon: 先生に名前を呼ばれた."
      ]
    },
    "ja": {
      "category": "動詞の活用",
      "title": "受身形 (V られる)",
      "explanation": "「〜される」。一類動詞は語尾を あ段 に換えて＋れる。二類は る を取って＋られる。三類：する → される、来る → 来られる。動作主は「に」で示す（先生に叱られた）。",
      "kicker": "受身の表現",
      "notes": [
        "一類：る を ら に換えて＋れる",
        "一類：む を ま に換えて＋れる",
        "二類：可能形と同じ形で、文脈で判別する",
        "三類",
        "三類（「迷惑の受身」：人に来られて困る）"
      ],
      "pitfalls": [
        "二類の受身と可能形は形が同じ（食べられる）なので、文脈で判別する",
        "う で終わる一類動詞は わ になる：買う → 買われる（買あれる ではない）",
        "「に」で動作主を、「を」で受ける対象を示す：先生に名前を呼ばれた"
      ]
    }
  },
  "causative": {
    "en": {
      "category": "Verb Conjugation",
      "title": "Causative form (V せる/させる)",
      "explanation": "\"Make X do / let X do.\" For Group 1, change the last character to the あ-row and add せる; for Group 2, drop る and add させる; for Group 3, する → させる, 来る → 来させる. Whether it's forcing or permitting is decided by the particle (に / を) and the context.",
      "kicker": "Making / Letting",
      "notes": [
        "Group 1: く becomes か + せる.",
        "Group 1: む becomes ま + せる.",
        "Group 2: drop る + させる.",
        "Group 2.",
        "Group 3.",
        "Group 3; read as こさせる."
      ],
      "pitfalls": [
        "A Group 1 verb ending in う becomes わ: 手伝う → 手伝わせる.",
        "The particle hints at the causee's role (息子に行かせる / 息子を行かせる), but \"forcing vs. permitting\" is read mainly from context, not from the particle alone.",
        "させられる is the causative-passive \"be made to do\" — a frequent exam point."
      ]
    },
    "ja": {
      "category": "動詞の活用",
      "title": "使役形 (V せる/させる)",
      "explanation": "「X に〜させる／X に無理やり〜させる」。一類動詞は語尾を あ段 に換えて＋せる。二類は る を取って＋させる。三類：する → させる、来る → 来させる。強制か許可かは助詞（に／を）と文脈で決まる。",
      "kicker": "強制／許可",
      "notes": [
        "一類：く を か に換えて＋せる",
        "一類：む を ま に換えて＋せる",
        "二類：る を取って＋させる",
        "二類",
        "三類",
        "三類。こさせる と読む"
      ],
      "pitfalls": [
        "う で終わる一類動詞は わ になる：手伝う → 手伝わせる",
        "助詞は使役の対象の役割を示す（息子に行かせる／息子を行かせる）が、「強制か許可か」は主に文脈で読み取り、助詞だけで決まるのではない",
        "「させられる」は使役受身「無理やり〜させられる」で、よく出題される"
      ]
    }
  },
  "desiderative": {
    "en": {
      "category": "Verb Conjugation",
      "title": "たい・たがる (desire)",
      "explanation": "For the first person, use V ます-form + たい (conjugates like an i-adjective); for the third person, use V ます-form + たがる (conjugates like a verb). The grammar and conjugation logic differ, so memorize them separately.",
      "kicker": "Expressing Desire",
      "notes": [
        "First person: conjugates like an i-adjective.",
        "Group 2: drop る to get the ます stem 食べ, then add たい.",
        "Third person: conjugates like a verb (がる / がっている).",
        "For a third person's present desire, ている is common."
      ],
      "pitfalls": [
        "私は行きたがる is wrong; use たい for your own desire.",
        "For someone else's present desire, たがっている (a concrete, right-now feeling) is more common; たがる tends to express a general tendency.",
        "を can become が: 水を飲みたい / 水が飲みたい (the latter is more colloquial)."
      ]
    },
    "ja": {
      "category": "動詞の活用",
      "title": "たい・たがる（願望）",
      "explanation": "一人称は V ます形 ＋ たい（い形容詞の活用）、三人称は V ます形 ＋ たがる（動詞の活用）を使う。文法も活用のしくみも違うので分けて覚える。",
      "kicker": "願望の表現",
      "notes": [
        "一人称：い形容詞の活用",
        "二類：る を取って ます stem「食べ」にし、たい をつける",
        "三人称：動詞の活用（がる／がっている）",
        "三人称の今の願望には ている をよく使う"
      ],
      "pitfalls": [
        "「私は行きたがる」は誤り。自分の願望には「たい」を使う",
        "他人の今の願望には「たがっている」（具体的な今）をよく使い、「たがる」はどちらかというと一般的な傾向を表す",
        "「を」は「が」に変わりうる：水を飲みたい／水が飲みたい（後者のほうが口語的）"
      ]
    }
  },
  "te-kudasai": {
    "en": {
      "category": "Patterns",
      "title": "てください / てもいい / てはいけない",
      "explanation": "Three must-know N5 te-form patterns: asking someone to do something (てください), asking for permission (てもいい), and a strong prohibition (てはいけない). Nail down the te-form sound changes first, then just learn the difference between the three endings and plug them in.",
      "kicker": "Request / Permission",
      "drillNote": "* The top button drills this chapter's pattern judgment directly; the bottom button adds practice on the underlying te-form sound changes.",
      "notes": [
        "Ask the other person to do this action.",
        "Asking for permission; adding ですか is more polite.",
        "Strong prohibition (a rule or warning).",
        "Dropping ですか turns it into a statement of \"you may do this.\""
      ],
      "pitfalls": [
        "All three patterns need the V te-form up front; master the te-form sound changes (いて / いで / して / って / んで) first so you can attach them correctly.",
        "ないでください (please don't do) is softer than てはいけません (prohibited), so the former is more natural when asking someone.",
        "もいい often drops ですか to become a statement — use context to tell asking for permission from granting it."
      ]
    },
    "ja": {
      "category": "文型",
      "title": "てください / てもいい / てはいけない",
      "explanation": "N5 で必ず覚える三つの V て形 文型：相手に依頼する（てください）、許可を求める（てもいい）、強い禁止（てはいけない）。まず て形 の音便をしっかり覚え、それから三つの文末の違いを覚えれば、そのまま当てはめられる。",
      "kicker": "依頼 / 許可",
      "drillNote": "※ 上のボタンはこの章の文型判別を直接練習。下のボタンは前提となる「て形」の音便を追加で練習。",
      "notes": [
        "相手にこの動作をしてもらう",
        "許可を求める。「ですか」をつけるとより丁寧",
        "強い禁止（規則・警告）",
        "「ですか」を省いて「してよい」という叙述にする"
      ],
      "pitfalls": [
        "三つの文型はすべて V て形 を前に必要とする。まず て形 の音便（いて／いで／して／って／んで）を覚えてこそ正しく接続できる",
        "「ないでください」（〜しないでください）は「てはいけません」（禁止）より柔らかく、相手に頼むときは前者のほうが自然",
        "「もいい」はよく「ですか」を省いて叙述になるので、許可を求めているのか許可を与えているのか、文脈で見分ける"
      ]
    }
  },
  "nakute-mo-ii": {
    "en": {
      "category": "Patterns",
      "title": "なくてもいい (don't have to)",
      "explanation": "Expresses \"you don't have to / there's no need to.\" For verbs, take the V ない-form and swap ない for なくてもいい; for adjectives, use \"-くなくてもいい\"; for nouns, use \"-でなくてもいい.\"",
      "kicker": "Not Necessary",
      "drillNote": "* The top button drills \"don't have to vs. must\" judgment directly; the bottom button adds practice on the underlying ない-form family.",
      "notes": [
        "Verb: ない-form + なくてもいい.",
        "Group 3 verb: just memorize it.",
        "I-adjective: drop い and add -くなくてもいい.",
        "Noun / na-adjective: -でなくてもいい."
      ],
      "pitfalls": [
        "The opposite is なければならない (must do); keep \"don't have to\" and \"must\" straight.",
        "Nouns use でなくてもいい (not ではないでもいい).",
        "In speech the です after いい is often dropped, but formal writing should include it."
      ]
    },
    "ja": {
      "category": "文型",
      "title": "なくてもいい（〜しなくてよい）",
      "explanation": "「しなくてもよい、する必要がない」を表す。動詞は Vない形 の ない を なくてもいい に換える。形容詞は「-くなくてもいい」、名詞は「-でなくてもいい」を使う。",
      "kicker": "不必要",
      "drillNote": "※ 上のボタンは「不必要 vs 必須」の判別を直接練習。下のボタンは前提となる「ない形ファミリー」を追加で練習。",
      "notes": [
        "動詞：ない形 ＋ なくてもいい",
        "三類動詞：そのまま覚える",
        "い形容詞：い を取って -くなくてもいい をつける",
        "名詞 / な形容詞：-でなくてもいい"
      ],
      "pitfalls": [
        "反対は「なければならない」（しなければならない）なので、「不必要」と「必須」を区別する",
        "名詞は「でなくてもいい」を使う（「ではないでもいい」ではない）",
        "話し言葉ではよく「いい」のあとの「です」を省くが、正式な書き言葉ではつける"
      ]
    }
  },
  "te-morau": {
    "en": {
      "category": "Patterns",
      "title": "てもらう / てくれる / てあげる",
      "explanation": "Japanese's distinctive \"giving and receiving\" expressions, each with a different viewpoint: てあげる is \"I (the in-group) do something for someone else,\" てくれる is \"someone does something for me,\" and てもらう is \"I actively ask someone to help me.\" Getting the viewpoint wrong is the biggest pitfall of this pattern.",
      "kicker": "Giving and Receiving",
      "drillNote": "* The top button drills giving-and-receiving viewpoint judgment directly; the bottom button adds practice on the underlying te-form.",
      "notes": [
        "Someone does it for me: a friend teaches (for my benefit).",
        "I actively ask someone to do it: I ask a friend to teach me (and receive it).",
        "I do it for someone else: I teach (for my younger brother's benefit).",
        "いただく is the humble form of もらう, used toward a superior."
      ],
      "pitfalls": [
        "When someone does something for me, always use the てくれる family, never てあげる (easy to mix up).",
        "Toward superiors or elders, use ていただく (= humble てもらう) or てくださる (= respectful てくれる).",
        "Particle pairing: てもらう / てあげる use に to mark the doer; てくれる uses が."
      ]
    },
    "ja": {
      "category": "文型",
      "title": "てもらう / てくれる / てあげる",
      "explanation": "日本語特有の「授受」表現で、視点によって使い分ける。「てあげる」は「自分（内側）が他人にしてあげる」、「てくれる」は「他人が自分にしてくれる」、「てもらう」は「自分から進んで他人に頼んでしてもらう」。視点を取り違えるのがこの文型の最大の落とし穴。",
      "kicker": "授受表現",
      "drillNote": "※ 上のボタンは授受の視点判別を直接練習。下のボタンは前提となる「て形」を追加で練習。",
      "notes": [
        "他人が自分にしてくれる：友達が（自分のために）教えてくれる",
        "自分から進んで頼む：友達に教えてもらう（そして受け取る）",
        "自分が他人にしてあげる：自分が（弟のために）教えてあげる",
        "「いただく」は「もらう」の謙譲で、目上の人に使う"
      ],
      "pitfalls": [
        "他人が自分にしてくれることは一律「てくれる」ファミリーを使い、「てあげる」は使えない（混同しやすい）",
        "目上・年長者には「ていただく」（＝てもらう の謙譲）や「てくださる」（＝てくれる の尊敬）を使う",
        "助詞の組み合わせ：てもらう／てあげる は「に」で動作をする人を示し、てくれる は「が」で示す"
      ]
    }
  },
  "to-omou": {
    "en": {
      "category": "Patterns",
      "title": "と思う / と言う (quoting / opinion)",
      "explanation": "Use と to mark the quoted content, then attach 思う (think) or 言う (say). Opinions and indirect quotes usually use the plain form (雨だと思う); with a direct quote you can keep the original words inside the quotation marks, e.g. 「行きます」と言った is also valid. Overall, drilling the plain form is the surest way to avoid mistakes.",
      "kicker": "Quoting / Opinion",
      "drillNote": "* The top button drills quoting / opinion judgment directly; the bottom button adds practice on the underlying plain form.",
      "notes": [
        "Personal opinion: I think it'll rain tomorrow.",
        "Direct quote: you can use the plain 行く or the original 行きます.",
        "The plain form of an i-adjective attaches directly to と.",
        "Na-adjectives and nouns must keep the だ."
      ],
      "pitfalls": [
        "Indirect quotes and personal opinions use the plain form (✗ 雨ですと思う, ✓ 雨だと思う).",
        "Na-adjectives and nouns need だ (✗ 静かと思う → ✓ 静かだと思う).",
        "In speech と can become って: 行くって言った."
      ]
    },
    "ja": {
      "category": "文型",
      "title": "と思う / と言う（引用・意見）",
      "explanation": "「と」で引用内容を示し、そのあとに「思う」（考える）や「言う」（言う）を続ける。意見や間接引用はふつう普通形を使う（雨だと思う）。直接引用のときは引用符の中に元の言葉を残せるので、たとえば「行きます」と言った も正しい。全体として、普通形をしっかり練習しておくのが一番間違えにくい。",
      "kicker": "引用 / 意見",
      "drillNote": "※ 上のボタンは引用 / 意見の判別を直接練習。下のボタンは前提となる「普通形」を追加で練習。",
      "notes": [
        "個人の意見：明日は雨が降ると思う",
        "直接引用：普通形「行く」も、原文の「行きます」も使える",
        "い形容詞の普通形はそのまま と に接続する",
        "な形容詞・名詞は「だ」を残す"
      ],
      "pitfalls": [
        "間接引用 / 個人の意見は普通形を使う（×「雨ですと思う」、○「雨だと思う」）",
        "な形容詞と名詞は「だ」をつける（×「静かと思う」→ ○「静かだと思う」）",
        "話し言葉では「と」を「って」と言える：「行くって言った」"
      ]
    }
  },
  "mae-ato": {
    "en": {
      "category": "Patterns",
      "title": "まえに / あとで / てから (sequence of events)",
      "explanation": "Three patterns for expressing time order. Vるまえに = \"before\" something, and the part before it is always the dictionary form; Vたあとで = \"after\" something, and takes the た-form before it; Vてから = finishing the first action \"and then\" doing the next, stressing immediate succession. To decide, first see whether the second clause happens before or after the first, then remember that まえに takes the dictionary form and あとで takes the た-form.",
      "kicker": "Sequence of Events",
      "drillNote": "* The top button drills sequence-of-events judgment directly; the bottom button adds practice on the underlying te-form / た-form sound changes.",
      "notes": [
        "Brush your teeth before bed; まえに takes the dictionary form.",
        "Take a walk after eating; あとで takes the た-form.",
        "Wash your hands, then eat; てから stresses immediate succession.",
        "まえに doesn't take the た-form and あとで doesn't take the dictionary form."
      ],
      "pitfalls": [
        "まえに always takes the dictionary form, even if the whole sentence is past tense (✗ 行ったまえに → ✓ 行くまえに).",
        "あとで takes the た-form (✗ 食べるあとで → ✓ 食べたあとで).",
        "Both てから and たあとで mean \"after,\" but てから stresses more strongly that you do the second action immediately after finishing the first."
      ]
    },
    "ja": {
      "category": "文型",
      "title": "まえに / あとで / てから（前後の順序）",
      "explanation": "「時間の前後」を表す三つの文型。「Vるまえに」＝あることの『前に』で、前は常に辞書形。「Vたあとで」＝あることの『後で』で、前は た形。「Vてから」＝前の動作を終えてから『続けて』行い、すぐ続くことを強調する。判別するときは、後の文が前項の前に起きるか後に起きるかをまず見て、それから まえに は辞書形、あとで は た形に接続することに注意する。",
      "kicker": "前後の順序",
      "drillNote": "※ 上のボタンは前後の順序の判別を直接練習。下のボタンは前提となる「て形 / た形」の音便を追加で練習。",
      "notes": [
        "寝る前に歯をみがく。まえに の前は辞書形",
        "ごはんを食べたあとで散歩する。あとで の前は た形",
        "手を洗ってからご飯を食べる。てから はすぐ続くことを強調",
        "まえに は た形に、あとで は辞書形に接続しない"
      ],
      "pitfalls": [
        "まえに の前は一律辞書形で、文全体が過去でも同じ（× 行ったまえに → ○ 行くまえに）",
        "あとで の前は た形を使う（× 食べるあとで → ○ 食べたあとで）",
        "てから と たあとで はどちらも「後で」を表すが、てから は『前項を終えてすぐ後項を行う』ことをより強調する"
      ]
    }
  },
  "nagara-tari": {
    "en": {
      "category": "Patterns",
      "title": "ながら / たり / て / し (linking actions)",
      "explanation": "Four ways to link two or more actions or reasons. V ます-stem + ながら = one person doing two things \"at the same time\"; Vたり〜Vたりする = listing a few representative actions; Vて = connecting in \"time order\"; 〜し = listing \"and, on top of that\" a reason (can attach to adjectives). To decide, see whether it's simultaneous, listing, sequence, or stacking up reasons.",
      "kicker": "Listing / Simultaneous",
      "drillNote": "* The top button drills choice-of-linker judgment directly; the bottom button adds practice on the underlying te-form sound changes.",
      "notes": [
        "Study while listening to music; one person doing both at once.",
        "Do some reading, some music-listening; listing representative actions.",
        "Get up → wash your face → head out; time order.",
        "Cheap and tasty too; listing plus a reason, can attach to an adjective."
      ],
      "pitfalls": [
        "ながら takes the ます-stem before it (歩きながら, not 歩くながら), and must be the same subject doing both at once.",
        "たり is used in pairs (〜たり〜たりする) and usually gives examples rather than an exhaustive list.",
        "し can attach to an adjective (安いし); ながら / て cannot attach directly to an i-adjective."
      ]
    },
    "ja": {
      "category": "文型",
      "title": "ながら / たり / て / し（動作の連接）",
      "explanation": "二つ以上の動作や理由をつなぐ四つの方法。「Vます語幹＋ながら」＝同一人が『同時に』二つのことをする。「Vたり〜Vたりする」＝代表的な動作をいくつか列挙する。「Vて」＝『時間順』に接続する。「〜し」＝『理由を加えて』並列する（形容詞にも接続できる）。判別するときは、同時か、列挙か、順序か、それとも理由を積み重ねているのかを見る。",
      "kicker": "並列・同時",
      "drillNote": "※ 上のボタンは連接方法の判別を直接練習。下のボタンは前提となる「て形」の音便を追加で練習。",
      "notes": [
        "音楽を聞きながら勉強する。同一人が同時に行う",
        "本を読んだり音楽を聞いたりする。代表的な動作を列挙",
        "起きて、顔を洗って、出かける。時間順",
        "安いし、おいしい。理由を加えて並列。形容詞にも接続できる"
      ],
      "pitfalls": [
        "ながら の前は ます形語幹（歩きながら。歩くながら ではない）で、必ず同一主語が同時に行う",
        "たり は対で使う（〜たり〜たりする）。ふつうは『例示』であって全部ではない",
        "し は形容詞に接続できる（安いし）。ながら / て は い形容詞に直接接続できない"
      ]
    }
  },
  "te-aux": {
    "en": {
      "category": "Patterns",
      "title": "てみる / ておく / てしまう / ている (て + auxiliary verb)",
      "explanation": "Attaching an auxiliary verb after Vて adds a different nuance to the action: てみる = \"try it and see\"; ておく = do it \"in advance\" and leave it ready; てしまう = \"finish\" doing something, or express \"regret / by accident\"; ている = an action \"in progress\" or an \"ongoing state.\" Master the te-form sound changes first, then learn the nuance differences among the four auxiliaries.",
      "kicker": "Auxiliary Verbs",
      "drillNote": "* The top button drills auxiliary-verb nuance judgment directly; the bottom button adds practice on the underlying te-form sound changes.",
      "notes": [
        "Try eating a new dish; giving it a go.",
        "Book the hotel in advance before the trip; preparing ahead.",
        "Left my wallet on the train; regret / by accident.",
        "It's raining right now; in progress / a state."
      ],
      "pitfalls": [
        "てしまう often expresses \"regret / by accident,\" contracting to 〜ちゃう in speech (食べちゃった).",
        "ておく contracts to 〜とく in speech (買っとく).",
        "ている can mean in progress, but also a resulting state (結婚している = the state of being married, not in the act of getting married)."
      ]
    },
    "ja": {
      "category": "文型",
      "title": "てみる / ておく / てしまう / ている（て＋補助動詞）",
      "explanation": "「Vて」のあとに補助動詞を続けて、動作にさまざまなニュアンスを加える。「てみる」＝『試してみる』。「ておく」＝『前もって』しておく。「てしまう」＝ものごとを『やり終える』、または『残念・うっかり』を表す。「ている」＝動作が『進行中』、または『継続する状態』。まず て形 の音便を覚え、それから四つの補助動詞のニュアンスの違いを覚える。",
      "kicker": "補助動詞",
      "drillNote": "※ 上のボタンは補助動詞のニュアンス判別を直接練習。下のボタンは前提となる「て形」の音便を追加で練習。",
      "notes": [
        "新しい料理を食べてみる。試す",
        "旅行の前にホテルを予約しておく。前もって準備する",
        "電車に財布を忘れてしまった。残念・うっかり",
        "今、雨が降っている。進行・状態"
      ],
      "pitfalls": [
        "てしまう はよく『残念・うっかり』を表し、話し言葉では「〜ちゃう」に縮まる（食べちゃった）",
        "ておく は話し言葉で「〜とく」に縮まる（買っとく）",
        "ている は進行も表すが、結果の状態も表す（結婚している＝既婚の状態で、結婚しているところ ではない）"
      ]
    }
  },
  "n3-jouken": {
    "en": {
      "category": "N3 Grammar",
      "title": "ば / たら / なら / と (four conditionals)",
      "explanation": "All four can translate as \"if / as soon as,\" but they divide the labor. と: an inevitable, natural result (rules, machines, routes), and the second clause can't take intention, a command, or a request. ば: a general condition or hypothesis, stressing that the first clause is the condition for the second. たら: the most all-purpose and the most common in speech — \"after doing A, then B\" or \"if A, then B\"; the second clause can take a command or a past discovery. なら: gives a premise or suggestion in response to a topic the other person raised (\"if you're going to...\"), and the first clause can even happen later than the second.",
      "kicker": "Four Kinds of \"If\"",
      "drillNote": "* This chapter is a grammar overview; use the button to drill the N3 grammar-form multiple-choice bank and get comfortable as you go.",
      "notes": [
        "と: an inevitable, natural law (no intention in the second clause).",
        "ば: a general condition.",
        "ば: adjectives use ば too.",
        "たら: after A, then B; the second clause can be a command.",
        "なら: gives a suggestion in response to what the other person said."
      ],
      "pitfalls": [
        "The と clause can't take intention, a command, a request, or an invitation (✗ 春になると、花を植えよう) → use たら / ば instead.",
        "When unsure which to use, たら is usually safest — it has the widest coverage and is the most colloquial.",
        "なら gives a premise \"regarding that thing you mentioned\" and often echoes the other person; with なら the first clause can happen later than the second (日本へ行くなら、ガイドブックを先に買う).",
        "When the first clause is an action verb and the second takes intention or a command, ば sounds unnatural — use たら instead (東京へ行ったら、連絡して)."
      ]
    },
    "ja": {
      "category": "N3 文法",
      "title": "ば / たら / なら / と（四つの条件）",
      "explanation": "四つとも「もし／〜すると」と訳せるが、違いは役割分担にある。「と」：必然的・自然な結果（法則、機械、路線）で、後の文に意志・命令・依頼はつかない。「ば」：一般的な条件・仮定で、前項が後項成立の条件であることを強調する。「たら」：最も汎用的で口語で最もよく使う、「A を終えてから B」や「もし A なら B」で、後の文に命令や過去の発見をつけられる。「なら」：相手が話題にしたことに対して前提や助言を与える（「〜するなら」）で、前の文が後の文より後に起きることさえある。",
      "kicker": "四つの「もし」",
      "drillNote": "※ この章は文法の整理。ボタンで N3 文法の形式選択問題を練習し、練習しながら慣れていく。",
      "notes": [
        "と：必然・自然の法則（後の文に意志は使わない）",
        "ば：一般的な条件",
        "ば：形容詞も ば を使う",
        "たら：A を終えてから B。後の文に命令もつく",
        "なら：相手の言った話題に対して助言を与える"
      ],
      "pitfalls": [
        "「と」の後の文には意志・命令・依頼・勧誘をつけられない（×春になると、花を植えよう）→ たら／ば に変える",
        "どれを使うか迷ったら「たら」がたいてい一番安全で、最も広くカバーし、最も口語的",
        "「なら」は「あなたの言ったそのことについて」前提を与えるもので、よく相手の話に呼応する。なら の前の文は後の文より後に起きることもある（日本へ行くなら、ガイドブックを先に買う）",
        "前項が動作動詞で、後の文にさらに意志／命令がつくとき、「ば」は不自然になるので「たら」に変える（東京へ行ったら、連絡して）"
      ]
    }
  },
  "n3-suiryou": {
    "en": {
      "category": "N3 Grammar",
      "title": "そうだ / ようだ / らしい / みたい (conjecture / hearsay)",
      "explanation": "All express \"conjecture / hearsay,\" differing in the \"basis\" and the \"tone.\" そうだ (appearance): a judgment from the immediate look of things, \"about to... / looks like...,\" attaching to the ます-form or an adjective stem. そうだ (hearsay): \"I hear that,\" attaching to the plain form — a different attachment from the appearance one. ようだ: an inference from evidence you've observed yourself (more objective, leans written). らしい: an inference or hearsay based on outside information or signs (can also mean \"having the qualities of,\" as in 男らしい). みたい: the colloquial version of ようだ, attaching directly to the plain form or a noun.",
      "kicker": "Looks Like / I Hear / Seems",
      "drillNote": "* This chapter is a grammar overview; use the button to drill the N3 grammar-form multiple-choice bank and get comfortable as you go.",
      "notes": [
        "そう (appearance): judging from the look, about to rain. Attaches to the ます-form.",
        "そう (hearsay): I hear. Attaches to the plain form.",
        "ようだ: inferring from evidence.",
        "らしい: based on information heard.",
        "みたい: the colloquial ようだ."
      ],
      "pitfalls": [
        "Appearance そう attaches to the ます-form / stem (降りそう); hearsay そう attaches to the plain form (降るそうだ) — tell them apart by the attachment.",
        "The appearance form of いい and ない is よさそう / なさそう (not いそう / なそう).",
        "ようだ leans toward your own evidence-based inference and is more written; らしい leans toward outside hearsay; みたい is the most common in speech.",
        "Noun / na-adjective attachment: ようだ = 学生のようだ・元気なようだ; みたい = 学生みたい・元気みたい (attaches directly, na-adjective adds no だ)."
      ]
    },
    "ja": {
      "category": "N3 文法",
      "title": "そうだ / ようだ / らしい / みたい（推量・伝聞）",
      "explanation": "どれも「推測／伝聞」を表すが、違いは「根拠」と「語気」にある。「そうだ（様態）」：今の外観から判断して「今にも…／…そうだ」。ます形・形容詞語幹に接続。「そうだ（伝聞）」：聞いたところによると、で普通形に接続し、接続の仕方が様態と違う。「ようだ」：自分が観察した証拠にもとづく推断（やや客観的で書き言葉寄り）。「らしい」：外部の情報や兆候にもとづく推断／伝聞（「…らしい様子」も表す、例：男らしい）。「みたい」：ようだ の口語版で、普通形／名詞に直接接続する。",
      "kicker": "見える・聞くところによると・らしい",
      "drillNote": "※ この章は文法の整理。ボタンで N3 文法の形式選択問題を練習し、練習しながら慣れていく。",
      "notes": [
        "そう（様態）：外観を見て今にも降りそう。ます形に接続",
        "そう（伝聞）：聞いたところによると。普通形に接続",
        "ようだ：証拠にもとづいて推断する",
        "らしい：聞いた情報にもとづく",
        "みたい：ようだ の口語"
      ],
      "pitfalls": [
        "様態の「そう」はます形／語幹に接続（降りそう）、伝聞の「そう」は普通形に接続（降るそうだ）——接続を見てどちらか判別する",
        "「いい」「ない」の様態は よさそう／なさそう（いそう／なそう ではない）",
        "「ようだ」は自分の証拠にもとづく推断寄りで書き言葉寄り、「らしい」は外部の伝聞寄り、口語で最もよく使うのは「みたい」",
        "名詞・な形の接続：ようだ＝学生のようだ・元気なようだ、みたい＝学生みたい・元気みたい（直接接続し、な形に だ をつけない）"
      ]
    }
  },
  "n3-gyakusetsu": {
    "en": {
      "category": "N3 Grammar",
      "title": "のに / ても / けど (adversative)",
      "explanation": "All three mean \"although... but...,\" with different nuances. のに: an adversative carrying surprise, dissatisfaction, or regret (you expected A but got B, with emotion), attaching to the plain form (na-adjectives / nouns use なのに). ても: the concessive condition \"even if...,\" with verbs taking the te-form, i-adjectives + くても, and na-adjectives / nouns + でも; a question word + ても = \"no matter.\" けど (けれど / が): the most neutral, colloquial \"but\" — the lightest in tone and the most commonly used.",
      "kicker": "Contrast / Concession",
      "drillNote": "* This chapter is a grammar overview; use the button to drill the N3 grammar-form multiple-choice bank and get comfortable as you go.",
      "notes": [
        "のに: worked hard yet... (regret / surprise).",
        "ても: even if... (concessive condition).",
        "けど: a neutral \"but.\"",
        "Question word + ても: no matter how..."
      ],
      "pitfalls": [
        "のに carries emotion (surprise / dissatisfaction), and its second clause can't take a command or intention (✗ 高いのに、買え) → use けど / が for that.",
        "The na-adjective / noun attachment for のに is なのに (静かなのに / 学生なのに), not だのに.",
        "ても attaches by word type: verb te-form + も (行っても / しても), i-adjective + くても (高くても), na-adjective / noun + でも (静かでも / 学生でも).",
        "Tone: が is more formal (writing / formal speech), けど is more colloquial, and けれど(も) sits between the two."
      ]
    },
    "ja": {
      "category": "N3 文法",
      "title": "のに / ても / けど（逆接）",
      "explanation": "三つとも「…のに…」を表すが、ニュアンスが違う。「のに」：意外・不満・残念を帯びた逆接（A を予期したのに B、感情を含む）で、普通形に接続（な形／名詞は なのに）。「ても」：逆接条件「たとえ…でも」で、動詞は て形、い形＋くても、な形／名詞＋でも に接続。疑問詞＋ても＝どんなに…でも。「けど（けれど／が）」：最も中立で口語的な「でも」で、語気が最も軽く、最もよく使う。",
      "kicker": "逆接・譲歩",
      "drillNote": "※ この章は文法の整理。ボタンで N3 文法の形式選択問題を練習し、練習しながら慣れていく。",
      "notes": [
        "のに：頑張ったのに…（残念・意外）",
        "ても：たとえ…でも（逆接条件）",
        "けど：中立的な「でも」",
        "疑問詞＋ても：どんなに…しても"
      ],
      "pitfalls": [
        "「のに」は感情（意外・不満）を帯び、後の文に命令・意志をつけない（×高いのに、買え）→ そういうときは けど／が に変える",
        "「のに」のな形・名詞の接続は なのに（静かなのに／学生なのに）で、だのに ではない",
        "「ても」の接続は品詞で分かれる：動詞て形＋も（行っても／しても）、い形＋くても（高くても）、な形・名詞＋でも（静かでも／学生でも）",
        "語気：「が」はやや正式（書き言葉・正式な話し言葉）、「けど」はやや口語的、「けれど（も）」はその中間"
      ]
    }
  },
  "n3-jita": {
    "en": {
      "category": "N3 Grammar",
      "title": "Intransitive / transitive verbs (paired)",
      "explanation": "Many verbs come in pairs: intransitive (物が〜, focusing on the event/change itself or the resulting state, without naming who did it) vs. transitive (人が物を〜, someone deliberately doing it). The particles differ: intransitive takes が, transitive takes を. For states: intransitive + ている = a plain state (窓が開いている); transitive + てある = a state someone deliberately left behind (窓が開けてある).",
      "kicker": "Intransitive / Transitive Verbs",
      "drillNote": "* This chapter is a grammar overview; use the button to drill the N3 grammar-form multiple-choice bank and get comfortable as you go.",
      "notes": [
        "が vs. を.",
        "つく / つける.",
        "く→かす.",
        "れる→る.",
        "ている (state) vs. てある (deliberately left)."
      ],
      "pitfalls": [
        "Don't flip the particles: intransitive takes が, transitive takes を (✗ ドアを開く, ✗ ドアが開ける).",
        "〜てある is always preceded by a transitive verb (indicating \"someone deliberately did it\"); 〜ている is preceded by an intransitive verb = a plain state.",
        "There's no single formula for the pairs; common patterns (く→ける, る→す...) are a guide, but you still have to memorize each pair."
      ]
    },
    "ja": {
      "category": "N3 文法",
      "title": "自動詞 / 他動詞（ペア）",
      "explanation": "多くの動詞はペアになっている：自動詞（物が〜、発生・変化そのものや結果の状態に重点を置き、誰がしたかを言わない）vs 他動詞（人が物を〜、誰かが意図的に行う）。助詞が違う：自動詞は「が」、他動詞は「を」。状態表現：自動詞＋ている＝単なる状態（窓が開いている）、他動詞＋てある＝誰かが意図的にして残した状態（窓が開けてある）。",
      "kicker": "自他動詞",
      "drillNote": "※ この章は文法の整理。ボタンで N3 文法の形式選択問題を練習し、練習しながら慣れていく。",
      "notes": [
        "が vs を",
        "つく／つける",
        "く→かす",
        "れる→る",
        "ている（状態） vs てある（意図的に残す）"
      ],
      "pitfalls": [
        "助詞を取り違えない：自動詞は が、他動詞は を（×ドアを開く ×ドアが開ける）",
        "「〜てある」の前は必ず他動詞（「誰かが意図的にした」を表す）。「〜ている」の前は自動詞＝単なる状態",
        "ペアに単一の公式はない。よくある規則（く→ける、る→す…）は参考になるが、やはり一組ずつ覚える必要がある"
      ]
    }
  },
  "n3-mokuteki": {
    "en": {
      "category": "N3 Grammar",
      "title": "ように / ために / ため (purpose / cause)",
      "explanation": "Express \"purpose\" and \"cause.\" Purpose ように: preceded by the potential form, a non-volitional verb, or a negative (わかるように, 忘れないように), often with different subjects or unintentional. Purpose ために: preceded by a volitional verb's dictionary form or a noun + の (合格するために, 健康のために), usually with the same subject and deliberate. Cause ため(に): attaches to the plain form or noun + の, meaning \"because...\" (大雨のため中止), and leans written.",
      "kicker": "Purpose / Cause",
      "drillNote": "* This chapter is a grammar overview; use the button to drill the N3 grammar-form multiple-choice bank and get comfortable as you go.",
      "notes": [
        "ように: attaches to the potential form, \"so that (people) can...\"",
        "ように: attaches to a change / non-volitional verb.",
        "ために: a volitional verb, \"in order to...\"",
        "Noun + のために.",
        "ため: cause (written)."
      ],
      "pitfalls": [
        "Purpose: volitional verb → ために (合格するために); potential / non-volitional / negative → ように (わかるように, 遅れないように).",
        "ように often has different subjects before and after, or is unintentional; ために usually has the same subject and is deliberate (though subjects can differ too, e.g. 子どもが留学するために、親が貯金する).",
        "ため(に) can also express cause (\"because...\"); use the attachment and context to tell purpose from cause, and note the cause usage leans written."
      ]
    },
    "ja": {
      "category": "N3 文法",
      "title": "ように / ために / ため（目的・原因）",
      "explanation": "「目的」と「原因」を表す。目的の「ように」：前に可能形・無意志・否定が接続する（わかるように、忘れないように）。前後で主語が違ったり、意図的でないことが多い。目的の「ために」：前に意志動詞の辞書形または名詞の が接続する（合格するために、健康のために）。前後で主語が一致し、意図的なことが多い。原因の「ため（に）」：普通形／名詞の に接続し、「…のために」を表す（大雨のため中止）。書き言葉寄り。",
      "kicker": "目的・原因",
      "drillNote": "※ この章は文法の整理。ボタンで N3 文法の形式選択問題を練習し、練習しながら慣れていく。",
      "notes": [
        "ように：可能形に接続。…できるように",
        "ように：変化・無意志に接続",
        "ために：意志動詞。…のために",
        "名詞＋のために",
        "ため：原因（書き言葉）"
      ],
      "pitfalls": [
        "目的：意志動詞→ために（合格するために）。可能形・無意志・否定→ように（わかるように、遅れないように）",
        "「ように」は前後で主語が違ったり意図的でないことが多い。「ために」は前後で主語が一致し意図的なことが多い（主語が違うこともある、例：子どもが留学するために、親が貯金する）",
        "「ため（に）」は原因（…のために）も表すので、接続と文脈で目的か原因かを見分ける。原因の用法は書き言葉寄り"
      ]
    }
  },
  "n3-keigo": {
    "en": {
      "category": "N3 Grammar",
      "title": "Intro to keigo (respectful / humble / polite)",
      "explanation": "The three classes of keigo. Polite (丁寧語): です / ます, basic courtesy toward the listener. Respectful (尊敬語): elevates the other person's actions (来る・行く・いる → いらっしゃる, 食べる → 召し上がる, 見る → ご覧になる, 言う → おっしゃる, する → なさる; for regular verbs, お + ます-form + になる). Humble (謙譲語): lowers your own (or your side's) actions to elevate the other person (行く・来る → 伺う・参る, 食べる → いただく, 見る → 拝見する, 言う → 申す / 申し上げる, する → いたす; for regular verbs, お + ます-form + する).",
      "kicker": "Respectful / Humble / Polite",
      "drillNote": "* This chapter is a grammar overview; use the button to drill the N3 grammar-form multiple-choice bank and get comfortable as you go.",
      "notes": [
        "Respectful: 来る / 行く / いる (the other person).",
        "Humble: go / visit (yourself).",
        "Humble: 見る (yourself).",
        "Respectful vs. humble (eating).",
        "Regular verbs: お + ます-form + になる (respectful) / + する (humble)."
      ],
      "pitfalls": [
        "Check who the subject is: use respectful to elevate \"the other person's action\" and humble to lower \"your own action\" (✗ 自分がいらっしゃる, ✗ 先生が伺う).",
        "Avoid double keigo: お召し上がりになる is overdone, since 召し上がる is already respectful.",
        "Suru-verb nouns: respectful ご + noun + になる, humble ご + noun + する (ご説明); but native and idiomatic words often use お (お電話する・お返事する)."
      ]
    },
    "ja": {
      "category": "N3 文法",
      "title": "敬語入門（尊敬語 / 謙譲語 / 丁寧語）",
      "explanation": "敬語は三種類。丁寧語：です／ます、聞き手への基本的な礼儀。尊敬語：「相手」の動作を高める（来る・行く・いる→いらっしゃる、食べる→召し上がる、見る→ご覧になる、言う→おっしゃる、する→なさる。一般動詞は お＋ます形＋になる）。謙譲語：「自分／自分の側」の動作を低めて相手を高める（行く・来る→伺う・参る、食べる→いただく、見る→拝見する、言う→申す／申し上げる、する→いたす。一般動詞は お＋ます形＋する）。",
      "kicker": "尊敬・謙譲・丁寧",
      "drillNote": "※ この章は文法の整理。ボタンで N3 文法の形式選択問題を練習し、練習しながら慣れていく。",
      "notes": [
        "尊敬語：来る／行く／いる（相手）",
        "謙譲語：行く／訪問（自分）",
        "謙譲語：見る（自分）",
        "尊敬 vs 謙譲（食べる）",
        "一般動詞：お＋ます形＋になる（尊敬）／＋する（謙譲）"
      ],
      "pitfalls": [
        "主語が誰かを見る：「相手の動作」を高めるには尊敬、「自分の動作」を低めるには謙譲（×自分がいらっしゃる ×先生が伺う）",
        "二重敬語を避ける：「お召し上がりになる」はやりすぎで、召し上がる 自体がすでに尊敬",
        "サ変名詞：尊敬は ご＋名詞＋になる、謙譲は ご＋名詞＋する（ご説明）。ただし和語・慣用ではよく お を使う（お電話する・お返事する）"
      ]
    }
  },
  "n3-tokoro": {
    "en": {
      "category": "N3 Grammar",
      "title": "〜ところ (the timing of an action)",
      "explanation": "Here ところ marks the temporal stage of an action (abstract time, not a place). Dictionary form + ところ = about to do it (imminent, not yet started). ている + ところ = in the middle of doing it (in progress). た + ところ = just finished doing it (the action just ended). Often used with 今 / ちょうど.",
      "kicker": "About To / In the Middle / Just Now",
      "drillNote": "* This chapter is a grammar overview; use the button to drill the N3 grammar-form multiple-choice bank and get comfortable as you go.",
      "notes": [
        "Dictionary form + ところ: about to (not yet).",
        "ている + ところ: in progress.",
        "た + ところ: just finished.",
        "た + ところ; often paired with ちょうど / 今."
      ],
      "pitfalls": [
        "Tell the three stages apart by the verb form before it: dictionary form (about to) / ている (in progress) / た (just finished).",
        "たところ means the action just ended, very recently; たばかり is a subjective \"just barely,\" and the actual gap can be longer.",
        "The ところ here is an abstract point in time, not the ところ (place) of location."
      ]
    },
    "ja": {
      "category": "N3 文法",
      "title": "〜ところ（動作の時間点）",
      "explanation": "ここでの「ところ」は動作の時間的な段階を表す（抽象的な時間で、場所ではない）。辞書形＋ところ＝ちょうどしようとする（もうすぐ、まだ始めていない）。ている＋ところ＝しているところ（進行中）。た＋ところ＝したばかり（動作がちょうど終わった）。よく「今・ちょうど」と一緒に使う。",
      "kicker": "ちょうど〜する・〜している・〜したばかり",
      "drillNote": "※ この章は文法の整理。ボタンで N3 文法の形式選択問題を練習し、練習しながら慣れていく。",
      "notes": [
        "辞書形＋ところ：ちょうどしようとする（まだ）",
        "ている＋ところ：進行中",
        "た＋ところ：ちょうど終わったばかり",
        "た＋ところ。よく ちょうど／今 と組む"
      ],
      "pitfalls": [
        "三つの段階は前の動詞の形で分ける：辞書形（しようとする）／ている（している）／た（終わったばかり）",
        "「たところ」は動作がちょうど終わって時間がとても近い。「たばかり」は主観的な「たった今」で、実際にはやや間があってもよい",
        "ここの「ところ」は抽象的な時間点で、場所の「ところ（場所）」ではない"
      ]
    }
  },
  "n3-bakari": {
    "en": {
      "category": "N3 Grammar",
      "title": "〜ばかり (たばかり / てばかり / noun + ばかり)",
      "explanation": "Three common uses of ばかり. Vた + ばかり = just did (the action finished not long ago, with a subjective \"not long ago\"). Vて + ばかり(いる) = only, always (usually negative, doing nothing but one thing). Noun + ばかり = nothing but, all (the tone depends on context — often negative but not always).",
      "kicker": "Just Did / Always / Nothing But",
      "drillNote": "* This chapter is a grammar overview; use the button to drill the N3 grammar-form multiple-choice bank and get comfortable as you go.",
      "notes": [
        "Vた + ばかり: just...",
        "Vて + ばかり: always... (usually negative).",
        "Noun + ばかり: nothing but...",
        "Noun + ばかり: leaning toward, all."
      ],
      "pitfalls": [
        "たばかり ≠ たところ: たところ is objectively just-finished and very recent; たばかり is a subjective \"just barely,\" and the actual gap can be longer (去年来たばかり works too).",
        "てばかり(いる) usually carries a negative, complaining tone (though not always).",
        "The tone of noun + ばかり depends on context (いい人ばかり is positive); there's also \"quantity + ばかり = about\" (十人ばかり)."
      ]
    },
    "ja": {
      "category": "N3 文法",
      "title": "〜ばかり（たばかり / てばかり / 名詞ばかり）",
      "explanation": "「ばかり」の三つのよくある用法。Vた＋ばかり＝したばかり（動作が終わって間もない、主観的な「まだ間もない」を帯びる）。Vて＋ばかり（いる）＝ばかり、いつも（多くは否定的で、あることしかしない）。名詞＋ばかり＝ばかり、全部（語気は文脈によるが、よく否定的だが必ずしもそうではない）。",
      "kicker": "したばかり・いつも・ばかり",
      "drillNote": "※ この章は文法の整理。ボタンで N3 文法の形式選択問題を練習し、練習しながら慣れていく。",
      "notes": [
        "Vた＋ばかり：したばかり…",
        "Vて＋ばかり：いつも…（多くは否定的）",
        "名詞＋ばかり：…ばかり",
        "名詞＋ばかり：偏って、全部"
      ],
      "pitfalls": [
        "「たばかり」≠「たところ」：たところ は客観的にちょうど終わって時間がとても近い。たばかり は主観的な「したばかり」で、実際にはやや間があってもよい（去年来たばかり も可）",
        "「てばかり（いる）」は多くの場合、否定的・不満の語気を帯びる（必然ではない）",
        "名詞＋ばかり の語気は文脈で決まる（いい人ばかり は肯定的）。ほかに「数量＋ばかり＝およそ」もある（十人ばかり）"
      ]
    }
  },
  "n3-hazu-wake": {
    "en": {
      "category": "N3 Grammar",
      "title": "〜はず / 〜わけ (reasoning / logic)",
      "explanation": "Both express \"inference based on logic.\" はず: based on a reason or common sense, \"by rights it should...\" (a conjecture the speaker is confident about); はずがない = impossible. わけ has several uses: 〜わけだ = no wonder / in other words (a natural conclusion drawn from a premise); わけではない = it's not that... (partial negation); わけにはいかない = can't (for reasons of circumstance or propriety).",
      "kicker": "Ought To / No Wonder",
      "drillNote": "* This chapter is a grammar overview; use the button to drill the N3 grammar-form multiple-choice bank and get comfortable as you go.",
      "notes": [
        "はず: by rights it should...",
        "はずがない: impossible.",
        "わけだ: no wonder...",
        "わけではない: it's not that...",
        "わけにはいかない: can't, given the circumstances."
      ],
      "pitfalls": [
        "はず is a conjecture based on reasoning, not your own wish (彼は行きたいはずだ = he should want to go ✓; but ✗ 私は行きたいはず).",
        "はずがない / わけがない = impossible; わけではない = it's not that (partial negation) — different meanings, don't mix them up.",
        "わけだ needs a premise to sound natural (deriving a natural B from A)."
      ]
    },
    "ja": {
      "category": "N3 文法",
      "title": "〜はず / 〜わけ（推論・道理）",
      "explanation": "どちらも「道理にもとづく推論」を表す。「はず」：理由や常識にもとづいて「道理から言って…のはず」（話者に確信のある推測）。「はずがない」＝ありえない。「わけ」は用法が多い：「〜わけだ」＝どうりで／つまり（前提から導かれる当然の結論）、「わけではない」＝…わけではない（部分否定）、「わけにはいかない」＝（道理から）…できない。",
      "kicker": "はずだ・道理",
      "drillNote": "※ この章は文法の整理。ボタンで N3 文法の形式選択問題を練習し、練習しながら慣れていく。",
      "notes": [
        "はず：道理から言って…のはず",
        "はずがない：ありえない",
        "わけだ：どうりで…",
        "わけではない：…わけではない",
        "わけにはいかない：道理から…できない"
      ],
      "pitfalls": [
        "「はず」は理由にもとづく推測で、自分の願望ではない（「彼は行きたいはずだ」＝彼は行きたいはず○。ただし ×「私は行きたいはず」）",
        "「はずがない／わけがない」＝ありえない、「わけではない」＝…わけではない（部分否定）で、意味が違うので混同しない",
        "「わけだ」は前提があってこそ自然（A から当然の B を導く）"
      ]
    }
  },
  "n3-yasui-sugiru": {
    "en": {
      "category": "N3 Grammar",
      "title": "〜やすい / 〜にくい / 〜すぎる (degree)",
      "explanation": "All three attach to the verb ます-form (drop ます). 〜やすい = easy to... (書きやすい). 〜にくい = hard to... (読みにくい). 〜すぎる = too much... (excessive, often negative), and also attaches to adjective stems (高すぎる・静かすぎる). Conjugation: やすい / にくい work like i-adjectives (やすかった); すぎる works like a Group 2 verb (すぎた).",
      "kicker": "Ease / Excess",
      "drillNote": "* This chapter is a grammar overview; use the button to drill the N3 grammar-form multiple-choice bank and get comfortable as you go.",
      "notes": [
        "ます-form + やすい: easy to.",
        "ます-form + にくい: hard to.",
        "ます-form + すぎる: too much (verb).",
        "I-adjective stem + すぎる.",
        "Na-adjective stem + すぎる."
      ],
      "pitfalls": [
        "All three attach to the verb ます-form (drop ます): 書く → 書き + やすい / にくい / すぎる.",
        "すぎる also attaches to adjective stems (高すぎる / 静かすぎる), carrying a \"too much, not good\" nuance.",
        "The すぎる of いい is usually よすぎる (not いすぎる); for ない it's なさすぎる."
      ]
    },
    "ja": {
      "category": "N3 文法",
      "title": "〜やすい / 〜にくい / 〜すぎる（程度）",
      "explanation": "三つとも動詞ます形（ますを取る）に接続する。〜やすい＝…しやすい（書きやすい）。〜にくい＝…しにくい（読みにくい）。〜すぎる＝…すぎる（やりすぎで、多くは否定的）で、形容詞語幹にも接続する（高すぎる・静かすぎる）。活用：やすい／にくい は い形容詞のよう（やすかった）、すぎる は二類動詞のよう（すぎた）。",
      "kicker": "難易・過度",
      "drillNote": "※ この章は文法の整理。ボタンで N3 文法の形式選択問題を練習し、練習しながら慣れていく。",
      "notes": [
        "ます形＋やすい：しやすい",
        "ます形＋にくい：しにくい",
        "ます形＋すぎる：…すぎる（動詞）",
        "い形語幹＋すぎる",
        "な形語幹＋すぎる"
      ],
      "pitfalls": [
        "三つとも動詞ます形（ますを取る）に接続する：書く→書き＋やすい／にくい／すぎる",
        "「すぎる」は形容詞語幹にも接続し（高すぎる／静かすぎる）、「やりすぎ、よくない」の語感を帯びる",
        "「いい」の すぎる はふつう よすぎる（いすぎる ではない）。「ない」は なさすぎる"
      ]
    }
  },
  "n3-garu": {
    "en": {
      "category": "N3 Grammar",
      "title": "〜がる / 〜たがる (third-person emotion / desire)",
      "explanation": "Adjectives of feeling or desire like 嬉しい・寒い・ほしい・〜たい are, when stated directly, usually used for the first person or to confirm directly with the person themselves (私は寒い / 寒い?); to describe a third person's feeling or desire, use がる (or 〜そう / 〜と言っている). Adjective stem + がる (寒い → 寒がる, ほしい → ほしがる); 〜たい → 〜たがる (行きたい → 行きたがる). がる is a verb, and 〜ている is common for describing a present state.",
      "kicker": "Describing Others' Feelings",
      "drillNote": "* This chapter is a grammar overview; use the button to drill the N3 grammar-form multiple-choice bank and get comfortable as you go.",
      "notes": [
        "ほしい → ほしがる (が → を).",
        "寒い → 寒がる.",
        "〜たい → 〜たがる.",
        "嬉しい → 嬉しがる."
      ],
      "pitfalls": [
        "Saying 弟は寒い / 弟はほしい directly is unnatural (such direct statements of feeling are usually for the first person); use がる / たがる for others.",
        "The object of ほしがる / 〜たがる often changes が to を (水を欲しがる / 本を読みたがる).",
        "がる is a verb, and 〜ている is common for describing a present state (ほしがっている / 行きたがっている)."
      ]
    },
    "ja": {
      "category": "N3 文法",
      "title": "〜がる / 〜たがる（第三者の感情・願望）",
      "explanation": "「嬉しい・寒い・ほしい・〜たい」のような感情や願望を表す形容詞は、直接述べるときはふつう一人称、または本人に直接確認する場合に使う（私は寒い／寒い？）。第三者の感情／願望を言うには「がる」（または〜そう／〜と言っている）を使う。形容詞語幹＋がる（寒い→寒がる、ほしい→ほしがる）。〜たい→〜たがる（行きたい→行きたがる）。「がる」は動詞で、今の状態を描写するときはよく〜ている を使う。",
      "kicker": "他人の感情を描写する",
      "drillNote": "※ この章は文法の整理。ボタンで N3 文法の形式選択問題を練習し、練習しながら慣れていく。",
      "notes": [
        "ほしい→ほしがる（が→を）",
        "寒い→寒がる",
        "〜たい→〜たがる",
        "嬉しい→嬉しがる"
      ],
      "pitfalls": [
        "「弟は寒い／弟はほしい」と直接言うのは不自然（この種の感情の直接叙述はふつう一人称に使う）。他人のことを言うには がる／たがる を使う",
        "「ほしがる／〜たがる」の対象はよく が を を に変える（水を欲しがる／本を読みたがる）",
        "「がる」は動詞で、今の状態を描写するときはよく〜ている を使う（ほしがっている／行きたがっている）"
      ]
    }
  },
  "n3-jikan-kikan": {
    "en": {
      "category": "N3 Grammar",
      "kicker": "Span / Range / Frequency",
      "title": "最中に / 途中で / から〜にかけて / ごとに・おきに",
      "explanation": "A set for talking about time more precisely. Beyond 「〜間に」 (a point within a span, learned at N4), there are sharper options. 「〜最中に」 = right in the middle of doing something, often with a sudden or intruding event (食事の最中に電話が来た) — more sharply \"at that very moment\" than 間に. 「〜途中で／途中に」 = in the course of / on the way (帰る途中でパンを買った). 「〜から〜にかけて」 = roughly across from A to B (time or space, vaguer than から〜まで, stressing one continuous stretch: 夜から朝にかけて雨). The frequency pair everyone gets tested on: 「〜ごとに」 = every (the unit included, 三日ごと = every three days, day 1 → day 4); 「〜おきに」 = at intervals of, with the gap skipped (三日おき = a three-day gap, day 1 → day 5).",
      "drillNote": "* This chapter is a grammar overview; use the button to drill the N3 grammar-form multiple-choice bank and get comfortable as you go.",
      "notes": [
        "最中に: right at that moment (sudden event).",
        "途中で: in the course of, on the way.",
        "途中に: a midway location.",
        "から〜にかけて: roughly A-to-B range.",
        "ごとに: every (unit included)."
      ],
      "pitfalls": [
        "ごとに (三日ごと: day 1 → day 4, a 3-day period) vs おきに (三日おき: a 3-day gap between, day 1 → day 5) — one day apart, a favourite exam trap.",
        "から〜にかけて is a rough \"from A to B\" stretch; use から〜まで for clear start/end points (にかけて can take a time endpoint but still feels approximate, not exact or exhaustive).",
        "最中に only takes an ongoing action, and the main clause is usually a sudden or intruding event; a plain \"when\" is still とき／間に."
      ]
    },
    "ja": {
      "category": "N3 文法",
      "kicker": "期間・範囲・頻度",
      "title": "最中に / 途中で / から〜にかけて / ごとに・おきに",
      "explanation": "時間を細かく言うためのセット。「〜間に」（期間内の一点、N4で学習）のほかに、より正確な言い方がある。「〜最中に」＝何かをしているまさにその最中で、突発・割り込みの出来事が続くことが多い（食事の最中に電話が来た）。間に より「ちょうどその瞬間」を強調。「〜途中で／途中に」＝過程の途中・道すがら（帰る途中でパンを買った）。「〜から〜にかけて」＝だいたい A から B にかけての一続き（時間・空間。から〜まで より曖昧で、連続したひと続きを強調：夜から朝にかけて雨）。頻度のペアが最頻出：「〜ごとに」＝〜ごと（その単位を含む、三日ごと＝1日目→4日目）；「〜おきに」＝〜おき（間を飛ばす、三日おき＝間に3日あけて、1日目→5日目）。",
      "drillNote": "※ この章は文法の整理。ボタンで N3 文法の形式選択問題を練習し、練習しながら慣れていく。",
      "notes": [
        "最中に：まさにその瞬間（突発の出来事）",
        "途中で：過程の途中・道すがら",
        "途中に：中間の位置",
        "から〜にかけて：だいたい A〜B の範囲",
        "ごとに：〜ごと（単位を含む）"
      ],
      "pitfalls": [
        "ごとに（三日ごと：1日目→4日目、3日周期）vs おきに（三日おき：間に3日、1日目→5日目）——1日違い、試験の定番",
        "から〜にかけて は「だいたい A から B」の一続き。明確な起点・終点は から〜まで（にかけて は時刻の端点も置けるが語感はやはり曖昧で、正確・網羅を保証しない）",
        "最中に は「進行中」の事にだけ付き、主節はたいてい突発・割り込み。ふつうの「〜のとき」は とき／間に"
      ]
    }
  },
  "n3-jikan-keiki": {
    "en": {
      "category": "N3 Grammar",
      "kicker": "Trigger / Sequence",
      "title": "たとたん / たびに / ついでに / てはじめて / てからでないと",
      "explanation": "Trigger and ordering between actions. 「〜たとたん(に)」 = the instant ~ (sudden, unexpected, uncontrolled; ドアを開けたとたん、猫が飛び出した) — the two events are near-simultaneous and the second is unforeseen. 「〜たびに」 = every time ~ (each occurrence; 会うたびにけんかする). 「〜ついでに」 = while doing A, also do B (taking the opportunity; 買い物のついでに、郵便局に寄った). 「〜てはじめて」 = only after ~ (realizing for the first time; 親になってはじめて、親のありがたさがわかった). 「〜てからでないと／てからでなければ」 = unless you first ~ (a prerequisite; 手を洗ってからでないと、食べられない).",
      "drillNote": "* This chapter is a grammar overview; use the button to drill the N3 grammar-form multiple-choice bank and get comfortable as you go.",
      "notes": [
        "たとたん: the instant ~ (sudden, unexpected).",
        "たびに: every time ~.",
        "ついでに: while at it, also.",
        "てはじめて: only after ~ (realizing).",
        "てからでないと: unless you first ~."
      ],
      "pitfalls": [
        "The たとたん main clause is usually a sudden, unexpected result and can't take the speaker's volition, command, request, or plan (×〜しよう／〜してください) — use 「たら」 for those.",
        "With ついでに, A is the main goal and B is just tacked on; reversing the priority sounds off.",
        "てはじめて carries an \"I didn't get it before, now I do\" epiphany, often with わかった／気づいた; plain time-sequence is just てから."
      ]
    },
    "ja": {
      "category": "N3 文法",
      "kicker": "契機・順序",
      "title": "たとたん / たびに / ついでに / てはじめて / てからでないと",
      "explanation": "動作どうしの契機と前後関係。「〜たとたん(に)」＝〜した瞬間に…（突然・意外・不可抗；ドアを開けたとたん、猫が飛び出した）——二つの出来事がほぼ同時で、後件は予想外。「〜たびに」＝〜するたびに…（毎回そうなる；会うたびにけんかする）。「〜ついでに」＝Aをする機会にBもする（買い物のついでに、郵便局に寄った）。「〜てはじめて」＝〜して初めて…（初めて実感する；親になってはじめて、親のありがたさがわかった）。「〜てからでないと／てからでなければ」＝まず〜しないと…できない（前提条件；手を洗ってからでないと、食べられない）。",
      "drillNote": "※ この章は文法の整理。ボタンで N3 文法の形式選択問題を練習し、練習しながら慣れていく。",
      "notes": [
        "たとたん：〜した瞬間（突然・意外）",
        "たびに：〜するたびに",
        "ついでに：ついでにBも",
        "てはじめて：〜して初めて（実感）",
        "てからでないと：まず〜しないと"
      ],
      "pitfalls": [
        "たとたん の主節は突然・意外の結果が多く、話者の意志・命令・依頼・予定は付かない（×〜しよう／〜してください）——それらは「たら」",
        "ついでに は A が主目的で B はついで。主従が逆だと不自然",
        "てはじめて は「今まで分からず、経てやっと分かる」実感を伴い、わかった／気づいた と共起。単なる時間順は てから"
      ]
    }
  },
  "n3-fukugou-aspect": {
    "en": {
      "category": "N3 Grammar",
      "kicker": "Stages of an Action",
      "title": "かける / きる / っぱなし / 一方だ / 直す / ようとする",
      "explanation": "A whole set for what stage an action is at (attachments differ: かける/きる/っぱなし/直す take the ます-stem; 一方だ takes the dictionary form; (よ)うとする takes the volitional). 「〜かける／〜かけの」 = halfway, about to start (言いかけてやめた = broke off mid-sentence; 食べかけのパン = half-eaten bread). 「〜きる」 = do thoroughly, to the end (使いきる = use up); 「〜きれる／〜きれない」 = (can't) finish (食べきれない = can't finish eating). 「〜っぱなし」 = (1) leave as is (電気をつけっぱなし = left the light on) or (2) keep doing without a break (立ちっぱなし = kept standing, often a burden). 「〜一方だ」 = dictionary form + 一方だ, keeps heading one way (a one-directional trend, often negative: 物価は上がる一方だ = prices just keep rising). 「〜直す」 = redo (書き直す = rewrite). 「〜(よ)うとする」 = volitional + とする, be about to / try to (帰ろうとした時); 「〜(よ)うとしない」 = for a willful subject \"refuses to\" (話を聞こうとしない), for a non-volitional one \"shows no sign of ~ing\" (雨がやもうとしない = the rain won't let up).",
      "drillNote": "* This chapter is a grammar overview; use the button to drill the N3 grammar-form multiple-choice bank and get comfortable as you go.",
      "notes": [
        "かける: halfway done.",
        "きる: do it thoroughly.",
        "きれない: can't finish.",
        "っぱなし: leave as is / keep doing.",
        "一方だ: one-way trend (often negative)."
      ],
      "pitfalls": [
        "Attachments: かける/きる/っぱなし/直す take the ます-stem; 一方だ takes the dictionary form; (よ)うとする takes the volitional — not all ます-stem.",
        "っぱなし has two senses: (1) leave-as-is (つけっぱなし, left when you should've dealt with it — negative) and (2) unbroken action (立ちっぱなし = kept standing, often a burden); a plain neutral \"kept state\" is 〜たまま.",
        "(よ)うとしない: with a person = won't/refuses to (often frustrated); with a non-volitional thing = shows no sign of changing (雨がやもうとしない)."
      ]
    },
    "ja": {
      "category": "N3 文法",
      "kicker": "動作の段階",
      "title": "かける / きる / っぱなし / 一方だ / 直す / ようとする",
      "explanation": "動作がどの段階かを表すセット（接続は別々：かける/きる/っぱなし/直す は ます形の語幹、一方だ は辞書形、(よ)うとする は意向形）。「〜かける／〜かけの」＝途中まで・し始める（言いかけてやめた；食べかけのパン）。「〜きる」＝すっかりし終える・し尽くす（使いきる）；「〜きれる／〜きれない」＝し終えられる（ない）（食べきれない）。「〜っぱなし」＝①放置する（電気をつけっぱなし）②切れ目なく続ける（立ちっぱなし、負担を伴うことが多い）。「〜一方だ」＝辞書形＋一方だ、一方向に進み続ける（多くマイナス：物価は上がる一方だ）。「〜直す」＝やり直す（書き直す）。「〜(よ)うとする」＝意向形＋とする、〜しようとする（帰ろうとした時）；「〜(よ)うとしない」＝意志ある人なら「どうしても〜しない」（話を聞こうとしない）、無意志の物なら「〜する気配がない」（雨がやもうとしない）。",
      "drillNote": "※ この章は文法の整理。ボタンで N3 文法の形式選択問題を練習し、練習しながら慣れていく。",
      "notes": [
        "かける：途中まで",
        "きる：すっかりし終える",
        "きれない：し終えられない",
        "っぱなし：放置／続ける",
        "一方だ：一方向の傾向（多く負）"
      ],
      "pitfalls": [
        "接続：かける/きる/っぱなし/直す は ます形語幹、一方だ は辞書形、(よ)うとする は意向形——全部 ます形ではない",
        "っぱなし は二種：①放置（つけっぱなし、片づけるべきなのに放置、負）②切れ目なく続ける（立ちっぱなし、負担を伴う）。単なる中性の「状態保持」は 〜たまま",
        "（よ）うとしない：人＝どうしても〜しない（不満を伴う）、無意志の物＝〜する気配がない（雨がやもうとしない）"
      ]
    }
  },
  "n3-gimu": {
    "en": {
      "category": "N3 Grammar",
      "kicker": "Obligation / Natural / No Need",
      "title": "べきだ / ことはない / ないこともない / こと / 必要がある",
      "explanation": "The set for \"should / no need to / have to.\" 「〜べきだ／〜べきではない」 = (morally/logically) should / shouldn't (謝るべきだ = ought to apologize) — an assertion carrying the speaker's judgment; attaches to the dictionary form, and する takes 「すべき」 or 「するべき」. 「〜ことはない」 = there's no need to (心配することはない = no need to worry) — reassuring or dissuading. 「〜ないことはない／〜ないこともない」 = it's not that you can't (a double negative = partial, reserved affirmation: 食べられないことはない = it's not that I can't eat it — I sort of can). 「〜こと」 (sentence-final) = a rule/instruction (廊下を走らないこと = no running in the hall). 「〜必要がある」 = there is a need to (予約する必要がある).",
      "drillNote": "* This chapter is a grammar overview; use the button to drill the N3 grammar-form multiple-choice bank and get comfortable as you go.",
      "notes": [
        "べきだ: (logically) should.",
        "ことはない: no need to.",
        "ないこともない: it's not that you can't.",
        "こと: a rule (sentence-final).",
        "必要がある: there's a need to."
      ],
      "pitfalls": [
        "べきだ is a \"logically ought to\" assertion (a judgment); 「必要がある」 is an objective \"there's a need\" — different tone.",
        "ことはない (no need, dissuading) ≠ Vることがある (sometimes happens) ≠ Vたことがある (have once done) — the attachment and the meaning both differ.",
        "ないことはない is a double-negative \"reserved yes\" (sort of possible, not entirely impossible), soft — not a strong affirmation."
      ]
    },
    "ja": {
      "category": "N3 文法",
      "kicker": "義務・当然・不要",
      "title": "べきだ / ことはない / ないこともない / こと / 必要がある",
      "explanation": "「〜すべき／〜しなくていい／〜しなければ」の評価と義務のセット。「〜べきだ／〜べきではない」＝（道理として）〜すべき／すべきでない（謝るべきだ）——話し手の判断を伴う主張。辞書形に付き、する は「すべき」か「するべき」。「〜ことはない」＝〜する必要はない（心配することはない）——相手を慰める・とめる。「〜ないことはない／〜ないこともない」＝〜しないわけではない（二重否定＝部分肯定・留保：食べられないことはない）。「〜こと」（文末）＝規則・指示（廊下を走らないこと）。「〜必要がある」＝〜する必要がある（予約する必要がある）。",
      "drillNote": "※ この章は文法の整理。ボタンで N3 文法の形式選択問題を練習し、練習しながら慣れていく。",
      "notes": [
        "べきだ：（道理として）すべき",
        "ことはない：〜する必要はない",
        "ないこともない：しないわけではない",
        "こと：規則（文末）",
        "必要がある：〜する必要がある"
      ],
      "pitfalls": [
        "べきだ は「道理としてすべき」という主張（判断）。「必要がある」は客観的な「必要がある」——ニュアンスが違う",
        "ことはない（必要ない・とめる）≠ Vることがある（時々ある）≠ Vたことがある（経験）——接続も意味も違う",
        "ないことはない は二重否定の「留保つきの肯定」（なんとか可能、まったく不可能ではない）で控えめ。強い肯定ではない"
      ]
    }
  },
  "n3-teido-hikaku": {
    "en": {
      "category": "N3 Grammar",
      "kicker": "Degree / Comparison",
      "title": "ほど / ほど〜はない / くらい / に比べて",
      "explanation": "Degree and comparison — \"how much / to what extent / compared to.\" 「〜ほど」 = to the extent of (死ぬほど疲れた = dead tired; 三日ほど休む = rest about three days) — marks a degree, whether an exaggerated figure of speech or a plain objective amount. 「〜ほど〜はない／〜くらい〜はない」 = nothing is more ~ than (a superlative: 富士山ほど美しい山はない) — ほど takes the top standard, and 「〜はない／いない」 denies that anything more ~ exists. 「〜くらい／〜ぐらい」 = about, to the degree of (子どもでもわかるくらい簡単 = so simple even a child gets it) — more colloquial, approximate, for examples or a bare minimum; ほど leans toward \"reaching a standard.\" 「〜に比べて」 = compared with (去年に比べて、今年は暑い).",
      "drillNote": "* This chapter is a grammar overview; use the button to drill the N3 grammar-form multiple-choice bank and get comfortable as you go.",
      "notes": [
        "ほど: to the extent of.",
        "ほど〜はない: superlative (nothing more ~).",
        "くらい: to the degree of.",
        "に比べて: compared with."
      ],
      "pitfalls": [
        "「Nほど〜Nはない」 = nothing of the same kind is more ~ than N (superlative); 「AはBほど〜ない」 = A isn't as ~ as B (comparison-negative, from N4) — same ほど, judge by the pattern.",
        "In the superlative, the noun before 「〜はない／いない」 is the compared set being denied (美しい山はない / 速い人はいない); the noun before ほど is the top standard, not the subject.",
        "くらい／ぐらい lean colloquial / approximate / example / \"bare minimum\" (死ぬくらい疲れた is fine); ほど leans toward reaching a standard. に比べて / と比べて both work — に as the baseline, と as the thing held up for contrast."
      ]
    },
    "ja": {
      "category": "N3 文法",
      "kicker": "程度・比較",
      "title": "ほど / ほど〜はない / くらい / に比べて",
      "explanation": "「どのくらい／どれほど／〜に比べて」の程度と比較。「〜ほど」＝〜くらいの程度（死ぬほど疲れた；三日ほど休む）——誇張したたとえのことも、客観的な量のこともある。「〜ほど〜はない／〜くらい〜はない」＝〜より〜なものはない（最上級：富士山ほど美しい山はない）——ほど が最高の基準を取り、「〜はない／いない」がそれ以上〜なものの存在を否定。「〜くらい／〜ぐらい」＝だいたい・〜の程度（子どもでもわかるくらい簡単）——口語・おおよそ・例示・最低限より。ほど は「基準に達する」寄り。「〜に比べて」＝〜と比べて（去年に比べて、今年は暑い）。",
      "drillNote": "※ この章は文法の整理。ボタンで N3 文法の形式選択問題を練習し、練習しながら慣れていく。",
      "notes": [
        "ほど：〜くらいの程度",
        "ほど〜はない：最上級（〜より〜はない）",
        "くらい：〜の程度",
        "に比べて：〜と比べて"
      ],
      "pitfalls": [
        "「Nほど〜Nはない」＝同類でN より〜なものはない（最上級）；「AはBほど〜ない」＝A は B ほど〜ではない（比較の否定、N4）——同じ ほど、文型で見分ける",
        "最上級の「〜はない／いない」の前は否定される比較の集合（美しい山はない／速い人はいない）。ほど の前の名詞は最高の基準で、主語ではない",
        "くらい／ぐらい は口語・おおよそ・例示・最低限寄り（死ぬくらい疲れた も可）。ほど は基準に達する寄り。に比べて／と比べて はどちらも可、に は基準、と は対照"
      ]
    }
  },
  "n3-kyouchou": {
    "en": {
      "category": "N3 Grammar",
      "kicker": "Emphasis / Focus",
      "title": "こそ / さえ・でさえ / など・なんか・なんて / だけで",
      "explanation": "A set that singles out one element for emphasis. 「〜こそ」 = precisely, exactly (今度こそ成功する = this time for sure; こちらこそ). 「〜さえ／〜でさえ」 = even, going so far as (子どもでさえ知っている = even a child knows) — spotlight an unexpected, extreme, or minimal case to imply the rest goes without saying. 「〜など／〜なんか／〜なんて」 = ~ and the like: など leans written / listing, なんか colloquial (disdain or self-deprecation), なんて colloquial (disdain, or heading a whole clause of surprise: 合格するなんて！). 「〜だけで」 = just by ~ (見ただけで泣いた = cried just from looking).",
      "drillNote": "* This chapter is a grammar overview; use the button to drill the N3 grammar-form multiple-choice bank and get comfortable as you go.",
      "notes": [
        "こそ: precisely, this time for sure.",
        "でさえ: even (unexpected/extreme example).",
        "なんか: ~ and the like (colloquial).",
        "だけで: just by ~."
      ],
      "pitfalls": [
        "The focus 「さえ」 (even) vs the conditional (only if ~): the conditional is 「Xさえ + conditional」 (さえ〜ば / さえすれば / でさえあれば) — look for the \"only if\" shape, not just a ば.",
        "など／なんか／なんて aren't a simple neutral→scornful line: など leans written / listing (can also belittle or be humble), なんか is colloquial (disdain or self-deprecation), なんて is colloquial (disdain, quoting a whole clause, or surprise).",
        "こそ is positive emphasis (this very one); でさえ cites an unexpected/extreme example; だけで is \"just from this alone\" — three different kinds of emphasis."
      ]
    },
    "ja": {
      "category": "N3 文法",
      "kicker": "強調・取り立て",
      "title": "こそ / さえ・でさえ / など・なんか・なんて / だけで",
      "explanation": "ある要素を「特に取り立てて」強調するセット。「〜こそ」＝まさに〜、〜こそ（今度こそ成功する；こちらこそ）。「〜さえ／〜でさえ」＝〜さえ・〜すら（子どもでさえ知っている）——意外・極端・最低限の例を取り立て、他は言うまでもないと示す。「〜など／〜なんか／〜なんて」＝〜など：など は書き言葉・列挙寄り、なんか は口語（軽視や謙遜）、なんて は口語（軽視、文を丸ごと引用、意外も：合格するなんて！）。「〜だけで」＝〜だけで（見ただけで泣いた）。",
      "drillNote": "※ この章は文法の整理。ボタンで N3 文法の形式選択問題を練習し、練習しながら慣れていく。",
      "notes": [
        "こそ：まさに・今度こそ",
        "でさえ：〜さえ（意外・極端な例）",
        "なんか：〜など（口語）",
        "だけで：〜だけで"
      ],
      "pitfalls": [
        "取り立ての「さえ」（〜さえ）と条件（〜さえ〜ば）は別物——条件は「Xさえ＋条件形」（さえ〜ば／さえすれば／でさえあれば）。「〜さえ〜ば＝〜しさえすれば」の形かどうかを見る、ば の有無だけではない",
        "など／なんか／なんて は単純な中立→軽蔑ではない：など は書き言葉・列挙寄り（軽視・謙遜も）、なんか は口語（軽視・謙遜）、なんて は口語（軽視・丸ごと引用・意外）",
        "こそ は肯定の強調（まさにこれ）、でさえ は意外・極端な例、だけで は「これだけで」——三種の違う強調"
      ]
    }
  },
  "n3-kooo-fukushi": {
    "en": {
      "category": "N3 Grammar",
      "kicker": "Adverb Agreement",
      "title": "決して / なかなか / 別に〜ない / 今にも〜そうだ",
      "explanation": "Some adverbs demand a particular ending — \"agreement,\" a staple of reading and grammar questions. Negative agreement: 「決して〜ない」 = absolutely not, by no means (a strong negation: 決して忘れない / 決して悪い人ではない); 「なかなか〜ない」 = won't ~ easily, just won't ~ (expected but not happening: バスがなかなか来ない); 「別に〜ない」 = not particularly, nothing much (別に問題ない). Aspect agreement: 「今にも〜そうだ」 = about to ~ any moment (今にも雨が降りそうだ). See the adverb up front and you can predict the ending.",
      "drillNote": "* This chapter is a grammar overview; use the button to drill the N3 grammar-form multiple-choice bank and get comfortable as you go.",
      "notes": [
        "決して〜ない: absolutely not.",
        "なかなか〜ない: won't ~ easily.",
        "別に〜ない: not particularly.",
        "今にも〜そうだ: about to ~ any moment."
      ],
      "pitfalls": [
        "「決して」 almost always pairs with a negative; 「なかなか」 and 「別に」 depend on the ending — they carry a specific nuance when negative and mean something else when affirmative (below).",
        "なかなか + affirmative = quite, rather (なかなかおいしい); なかなか + negative = won't ~ easily. 別に + negative = not particularly (the colloquial 別にいい／別に is this same 別に) — judge by the ending.",
        "今にも〜そうだ = \"about to happen (a predictable change right before your eyes: rain, collapsing, crying…),\" taking the ます-stem (降りそう／倒れそう); different from the hearsay そうだ (plain form)."
      ]
    },
    "ja": {
      "category": "N3 文法",
      "kicker": "副詞の呼応",
      "title": "決して / なかなか / 別に〜ない / 今にも〜そうだ",
      "explanation": "ある副詞が出ると文末が特定の形になる——これが「呼応」で、読解・文法の定番。否定の呼応：「決して〜ない」＝決して〜ない・断じて〜ない（強い否定：決して忘れない／決して悪い人ではない）；「なかなか〜ない」＝なかなか〜ない（期待しても起こらない：バスがなかなか来ない）；「別に〜ない」＝特に〜ない（別に問題ない）。様態の呼応：「今にも〜そうだ」＝今にも〜しそうだ（今にも雨が降りそうだ）。前の副詞を見たら文末を予測する。",
      "drillNote": "※ この章は文法の整理。ボタンで N3 文法の形式選択問題を練習し、練習しながら慣れていく。",
      "notes": [
        "決して〜ない：断じて〜ない",
        "なかなか〜ない：なかなか〜ない",
        "別に〜ない：特に〜ない",
        "今にも〜そうだ：今にも〜しそう"
      ],
      "pitfalls": [
        "「決して」はほぼ必ず否定と呼応。「なかなか」「別に」は文末しだい——否定では特定の語感、肯定では別の意味（下）",
        "なかなか＋肯定＝かなり・けっこう（なかなかおいしい）；なかなか＋否定＝なかなか〜ない。別に＋否定＝特に〜ない（口語の「別にいい／別に」も同じ 別に）——文末で見分ける",
        "今にも〜そうだ は「今にも（目の前の変化が）起こりそう」（雨・倒れる・泣く…）で ます形の語幹に付く（降りそう／倒れそう）。伝聞の そうだ（普通形接続）とは別"
      ]
    }
  },
  "n3-heiretsu": {
    "en": {
      "category": "N3 Grammar",
      "kicker": "Coordination / Addition",
      "title": "だけでなく〜も / はもちろん / も〜ば〜も",
      "explanation": "A set for coordinating and adding items. 「〜だけでなく〜も」 = not only ~ but also (英語だけでなく、中国語も話せる = can speak not only English but Chinese). 「〜はもちろん(〜も)」 = ~ of course, and also (漢字はもちろん、ひらがなも書けない = can't even write hiragana, let alone kanji) — the first item is taken for granted, the second is the point. 「〜も〜ば〜も／〜も〜なら〜も」 = both ~ and ~ (頭もよければ、性格もいい = both smart and good-natured) — 「ば／なら」 strings two parallel items together.",
      "drillNote": "* This chapter is a grammar overview; use the button to drill the N3 grammar-form multiple-choice bank and get comfortable as you go.",
      "notes": [
        "だけでなく〜も: not only ~ but also.",
        "はもちろん: ~ of course (and also).",
        "も〜ば〜も: both ~ and ~.",
        "〜し: (near) listing reasons / coordination."
      ],
      "pitfalls": [
        "はもちろん takes the first item as a given, with the weight on the second (even ~); だけでなく is a plain \"not only A but also B.\"",
        "The ば in も〜ば〜も isn't a conditional — it strings two parallel items (頭もよ『ければ』…); don't read it as a hypothesis.",
        "For \"not only,\" だけでなく (neutral) / ばかりでなく (a touch written, see the ばかり chapter) / のみならず (written) differ in register."
      ]
    },
    "ja": {
      "category": "N3 文法",
      "kicker": "並列・添加",
      "title": "だけでなく〜も / はもちろん / も〜ば〜も",
      "explanation": "二つを並べる・付け足すセット。「〜だけでなく〜も」＝〜だけでなく〜も（英語だけでなく、中国語も話せる）。「〜はもちろん(〜も)」＝〜はもちろん〜も（漢字はもちろん、ひらがなも書けない）——前は当然、後ろが重点。「〜も〜ば〜も／〜も〜なら〜も」＝〜も〜し〜も（頭もよければ、性格もいい）——「ば／なら」で二つの並列項をつなぐ。",
      "drillNote": "※ この章は文法の整理。ボタンで N3 文法の形式選択問題を練習し、練習しながら慣れていく。",
      "notes": [
        "だけでなく〜も：〜だけでなく〜も",
        "はもちろん：〜はもちろん〜も",
        "も〜ば〜も：〜も〜し〜も",
        "〜し：（近義）理由の列挙・並列"
      ],
      "pitfalls": [
        "はもちろん は前を当然とし、重点は後ろ（〜も）。だけでなく は素直に「AだけでなくBも」",
        "も〜ば〜も の「ば」は条件ではなく、二つの並列項をつなぐ（頭もよ『ければ』…）。仮定と読まない",
        "「〜だけでなく」は中立、「〜ばかりでなく」はやや書き言葉（ばかり章）、「〜のみならず」は書き言葉——語体が違う"
      ]
    }
  },
  "n3-joutai": {
    "en": {
      "category": "N3 Grammar",
      "kicker": "State / Appearance",
      "title": "だらけ / ずに / がする",
      "explanation": "A set for describing states and appearances. 「〜だらけ」 = full of, covered in (noun + だらけ, usually negative: 泥だらけ = covered in mud; 間違いだらけ = riddled with mistakes). 「〜ずに」 = without ~ing (the written-style ないで: 何も言わずに帰った = left without saying anything) — note that する becomes 「せずに」. 「〜がする」 = there's (a sense of) ~ (perception: 音・匂い・味・気・感じ がする; いい匂いがする = there's a nice smell; 気がする = I have a feeling) — you met 音・匂い at N4; here's the full set.",
      "drillNote": "* This chapter is a grammar overview; use the button to drill the N3 grammar-form multiple-choice bank and get comfortable as you go.",
      "notes": [
        "だらけ: full of ~ (often negative).",
        "ずに: without ~ing (written ないで).",
        "する → せずに (irregular).",
        "がする: a sense of ~ (perception)."
      ],
      "pitfalls": [
        "だらけ takes a noun and is almost always negative (泥・間違い・借金だらけ); a neutral \"full of\" is 「〜でいっぱい」.",
        "ずに = ないで (written style); the する form is 「せずに」, not 「しずに」.",
        "The object of がする takes が (匂いがする); 「気がする」 = have a feeling / a hunch (plain form + 気がする)."
      ]
    },
    "ja": {
      "category": "N3 文法",
      "kicker": "状態・様子",
      "title": "だらけ / ずに / がする",
      "explanation": "状態・様子を描くセット。「〜だらけ」＝〜だらけ（名詞＋だらけ、多くマイナス：泥だらけ；間違いだらけ）。「〜ずに」＝〜しないで（書き言葉の ないで：何も言わずに帰った）——する は「せずに」。「〜がする」＝〜がする（知覚：音・匂い・味・気・感じ がする；いい匂いがする；気がする）——N4 で音・匂いを学習、ここで全体をそろえる。",
      "drillNote": "※ この章は文法の整理。ボタンで N3 文法の形式選択問題を練習し、練習しながら慣れていく。",
      "notes": [
        "だらけ：〜だらけ（多く負）",
        "ずに：〜しないで（書き言葉）",
        "する→せずに（不規則）",
        "がする：知覚"
      ],
      "pitfalls": [
        "だらけ は名詞に付き、ほぼマイナス（泥・間違い・借金だらけ）。中立の「いっぱい」は「〜でいっぱい」",
        "ずに＝ないで（書き言葉）。する の形は「せずに」、「しずに」ではない",
        "がする の対象は が（匂いがする）。「気がする」＝なんとなくそう思う（普通形＋気がする）"
      ]
    }
  },
  "n3-ganbou": {
    "en": {
      "category": "N3 Grammar",
      "kicker": "Wish / Request",
      "title": "てほしい / といい・ばいい / ように (request/advice)",
      "explanation": "A set for wanting someone to act, or expressing a wish. 「〜てほしい」 = want (someone else) to ~ (unlike 〜たい, your own wish: 手伝ってほしい = I want you to help; the negative is 〜ないでほしい). 「〜といい／〜ばいい／〜たらいい」 = it'd be good if ~, I hope ~ (雨が降るといい; どうすればいい? = what should I do?). 「〜ように」 (request/advice) = tell someone to ~ (followed by a reporting verb like 言う・頼む・注意する: 早く来るように言った = told them to come early; 忘れ物をしないように注意した) — same form as the purpose ように (忘れないようにメモする, see n3-mokuteki); tell them apart by whether a reporting verb or your own willed action follows.",
      "drillNote": "* This chapter is a grammar overview; use the button to drill the N3 grammar-form multiple-choice bank and get comfortable as you go.",
      "notes": [
        "てほしい: want (someone else) to ~.",
        "といい: I hope ~ (wish).",
        "ばいい: what to do (advice).",
        "ように + 言う: telling someone to ~."
      ],
      "pitfalls": [
        "「〜たい」 is your own wish to do; 「〜てほしい」 is wanting someone else to do — different subjects, don't mix them.",
        "といい／ばいい／たらいい all express a wish or suggestion; \"what should I do\" is usually 「どうすればいい／どうしたらいい」.",
        "ように + a reporting verb (言う／頼む／注意する) = request/advice (telling someone to ~); Vる／Vない ように + your own willed action = purpose/prevention (忘れないようにメモする) — tell them apart by what follows."
      ]
    },
    "ja": {
      "category": "N3 文法",
      "kicker": "願望・依頼",
      "title": "てほしい / といい・ばいい / ように（依頼・忠告）",
      "explanation": "人に〜してほしい、あるいは願望を表すセット。「〜てほしい」＝（相手に）〜してほしい（自分の願望の〜たい とは別：手伝ってほしい。否定は〜ないでほしい）。「〜といい／〜ばいい／〜たらいい」＝〜といい・〜ばいい（雨が降るといい；どうすればいい？）。「〜ように」（依頼・忠告）＝〜するように（後ろに言う・頼む・注意する などの伝達動詞：早く来るように言った；忘れ物をしないように注意した）——目的・防止の ように（忘れないようにメモする、n3-mokuteki）と同形、後ろが伝達動詞か自分の意志動作かで見分ける。",
      "drillNote": "※ この章は文法の整理。ボタンで N3 文法の形式選択問題を練習し、練習しながら慣れていく。",
      "notes": [
        "てほしい：（相手に）〜してほしい",
        "といい：〜といい（願望）",
        "ばいい：どうすればいい（助言）",
        "ように＋言う：〜するように（依頼）"
      ],
      "pitfalls": [
        "「〜たい」は自分がしたい、「〜てほしい」は相手にしてほしい——主体が違う",
        "といい／ばいい／たらいい はどれも願望・提案。「どうしたらいいか」は「どうすればいい／どうしたらいい」",
        "ように＋伝達動詞（言う／頼む／注意する）＝依頼・忠告；Vる／Vないように＋自分の意志動作＝目的・防止（忘れないようにメモする）——後ろで見分ける"
      ]
    }
  }
};
