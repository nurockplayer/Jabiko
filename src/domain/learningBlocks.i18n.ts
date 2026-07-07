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
  }
};
