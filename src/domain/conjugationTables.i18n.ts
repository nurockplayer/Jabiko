// AUTO-GENERATED 規則表 text-layer translations (#427 Phase C): full en/ja
// mirrors of each ConjugationTable's title/caption/columns/rows/pitfalls,
// produced by the translation loop (translate -> adversarial verify).
// Japanese example cells are intentionally identical to the zh source.
// Edit individual strings only for corrections; keep dimensions in sync
// with conjugationTables.ts (the drift test enforces this).
import type { ConjugationTableOverlays } from "./conjugationTables";

export const conjugationTableI18n: ConjugationTableOverlays = {
  "verb-groups": {
    en: {
      title: "Verb classification: the three groups",
      caption: "First identify the group from the dictionary-form ending, then apply the conjugation rules. A る ending does not always mean group II (ichidan).",
      columns: ["Group", "How to identify", "Example verbs", "ます form"],
      rows: [
        ["Group I (godan)", "Ends in う段 (-u/-ku/-su/-tsu/-nu/-bu/-mu/-ru/-gu)", "書く・話す・読む・帰る", "書きます・話します・読みます・帰ります"],
        ["Group II (ichidan)", "Ends in 「る」 preceded by い段 / え段", "見る・起きる・食べる・寝る", "見ます・起きます・食べます・寝ます"],
        ["Group III (irregular)", "Only two verbs — just memorize them", "する・来る", "します・来ます（きます）"],
      ],
      pitfalls: [
        "「帰る・走る・入る・切る・要る・知る・限る」 end in る but are group I (godan) — they take the sound changes (音便).",
        "「N + する」-type verbs (勉強する／練習する) are always treated as group III (irregular).",
        "The reading of 「来る」 often changes as it conjugates: 来ます=きます、来て=きて、来ない=こない、来られる=こられる.",
      ]
    },
    ja: {
      title: "動詞の3グループ分類",
      caption: "まず辞書形の語尾でグループを見分けてから、活用のルールを当てはめます。「る」で終わっても一段動詞（グループ2）とは限りません。",
      columns: ["グループ", "見分けるポイント", "例", "ます形"],
      rows: [
        ["五段動詞（グループ1）", "語尾がう段 (-u/-ku/-su/-tsu/-nu/-bu/-mu/-ru/-gu)", "書く・話す・読む・帰る", "書きます・話します・読みます・帰ります"],
        ["一段動詞（グループ2）", "語尾「る」の前が い段 / え段", "見る・起きる・食べる・寝る", "見ます・起きます・食べます・寝ます"],
        ["不規則動詞（グループ3）", "2つだけなので、そのまま覚える", "する・来る", "します・来ます（きます）"],
      ],
      pitfalls: [
        "「帰る・走る・入る・切る・要る・知る・限る」は語尾が「る」ですが五段動詞（グループ1）なので、音便で活用します。",
        "「N + する」型の動詞（勉強する／練習する）は、すべて不規則動詞（グループ3）として扱います。",
        "「来る」は活用形によって読み方が変わります：来ます=きます、来て=きて、来ない=こない、来られる=こられる。",
      ]
    }
  },
  "masu-form": {
    en: {
      title: "ます form",
      caption: "The basic polite sentence ending, and the attachment base for たい / ながら / ことができる and more.",
      columns: ["Group", "Rule", "Examples"],
      rows: [
        ["Group I (godan)", "Change the final syllable to い段 + ます", "書く → 書きます／読む → 読みます／話す → 話します／買う → 買います"],
        ["Group II (ichidan)", "Drop る + ます", "食べる → 食べます／見る → 見ます／起きる → 起きます"],
        ["Group III (irregular)", "Irregular", "する → します／来る → 来ます（きます）"],
      ],
      pitfalls: [
        "Verbs ending in う change to い段, not あ段 (買う → 買います, not 「買あます」).",
        "Group II (ichidan) verbs take no sound changes (音便) — just drop る and add ます.",
      ]
    },
    ja: {
      title: "ます形",
      caption: "丁寧な文末の基本の形で、たい / ながら / ことができる などの接続のベースにもなります。",
      columns: ["グループ", "ルール", "例"],
      rows: [
        ["五段動詞（グループ1）", "語尾を い段 に変えて + ます", "書く → 書きます／読む → 読みます／話す → 話します／買う → 買います"],
        ["一段動詞（グループ2）", "る を取って + ます", "食べる → 食べます／見る → 見ます／起きる → 起きます"],
        ["不規則動詞（グループ3）", "不規則", "する → します／来る → 来ます（きます）"],
      ],
      pitfalls: [
        "語尾が「う」のときは あ段 ではなく い段 に変えます（買う → 買います。「買あます」ではありません）。",
        "一段動詞（グループ2）に音便はありません。そのまま る を取って ます を付けます。",
      ]
    }
  },
  "te-ta-form": {
    en: {
      title: "Group I (godan) verbs: て form・た form (音便 quick reference)",
      caption: "The sound changes (音便) are the hardest part of group I (godan) verbs. Memorize this table first, and every later pattern — てください／てしまう／たことがある — plugs straight in.",
      columns: ["Ending", "て form", "た form", "Examples"],
      rows: [
        ["く", "いて", "いた", "書く → 書いて／書いた"],
        ["ぐ", "いで", "いだ", "泳ぐ → 泳いで／泳いだ"],
        ["す", "して", "した", "話す → 話して／話した"],
        ["う・つ・る", "って", "った", "買う → 買って／買った 待つ → 待って／待った 帰る → 帰って／帰った"],
        ["む・ぶ・ぬ", "んで", "んだ", "読む → 読んで／読んだ 遊ぶ → 遊んで／遊んだ 死ぬ → 死んで／死んだ"],
        ["Group II (ichidan)", "Drop る + て / た", "—", "食べる → 食べて／食べた"],
        ["Group III (irregular)", "Irregular", "—", "する → して／した 来る → 来て（きて）／来た（きた）"],
      ],
      pitfalls: [
        "「行く」 is the group I (godan) exception: 行って／行った (not 「行いて／行いた」).",
        "Group II (ichidan) verbs take no 音便 — just drop る and add て／た; do not apply the five sound-change patterns.",
        "「死ぬ」 is the only group I (godan) verb ending in ぬ — remembering 「死んで」 covers it.",
      ]
    },
    ja: {
      title: "五段動詞（グループ1）の て形・た形（音便早見表）",
      caption: "五段動詞（グループ1）でいちばん難しいのが音便です。まずこの表をしっかり覚えれば、あとの てください／てしまう／たことがある はすべてそのまま使えます。",
      columns: ["語尾", "て形", "た形", "例"],
      rows: [
        ["く", "いて", "いた", "書く → 書いて／書いた"],
        ["ぐ", "いで", "いだ", "泳ぐ → 泳いで／泳いだ"],
        ["す", "して", "した", "話す → 話して／話した"],
        ["う・つ・る", "って", "った", "買う → 買って／買った 待つ → 待って／待った 帰る → 帰って／帰った"],
        ["む・ぶ・ぬ", "んで", "んだ", "読む → 読んで／読んだ 遊ぶ → 遊んで／遊んだ 死ぬ → 死んで／死んだ"],
        ["一段動詞（グループ2）", "る を取って + て / た", "—", "食べる → 食べて／食べた"],
        ["不規則動詞（グループ3）", "不規則", "—", "する → して／した 来る → 来て（きて）／来た（きた）"],
      ],
      pitfalls: [
        "「行く」は五段動詞（グループ1）の例外です：行って／行った（「行いて／行いた」ではありません）。",
        "一段動詞（グループ2）に音便はありません。そのまま る を取って て／た を付けます。5種類の音便を当てはめないでください。",
        "「死ぬ」は ぬ で終わる唯一の五段動詞（グループ1）です。「死んで」を覚えれば、それでカバーできます。",
      ]
    }
  },
  "exception-godan": {
    en: {
      title: "Group I (godan) exception verbs (the る-ending trap)",
      caption: "Reflexively treating every 「-iる／-eる」 verb as group II (ichidan) will make you conjugate these common verbs wrong. Memorize this list, and apply the group I (godan) 音便 when you meet them.",
      columns: ["Verb", "Reading", "Meaning", "て form"],
      rows: [
        ["帰る", "かえる", "to go home / return", "帰って"],
        ["入る", "はいる", "to enter", "入って"],
        ["走る", "はしる", "to run", "走って"],
        ["切る", "きる", "to cut", "切って"],
        ["要る", "いる", "to need", "要って"],
        ["知る", "しる", "to know", "知って"],
        ["限る", "かぎる", "to limit / be limited to", "限って"],
        ["減る", "へる", "to decrease", "減って"],
        ["蹴る", "ける", "to kick", "蹴って"],
      ],
      pitfalls: [
        "The logic: these verbs end in る in dictionary form but are actually group I (godan), so they take the 「う・つ・る → って」 sound change.",
        "Compare group II (ichidan) 「着る」 (to wear) → 着て with group I (godan) 「切る」 → 切って — the two are often confused.",
      ]
    },
    ja: {
      title: "五段動詞（グループ1）の例外動詞（「る」終わりのひっかけ）",
      caption: "「-iる／-eる」を見て反射的に一段動詞（グループ2）だと思うと、これらのよく使う動詞を間違えて活用してしまいます。このリストを覚えて、出てきたら五段動詞（グループ1）の音便で活用しましょう。",
      columns: ["動詞", "読み方", "意味", "て形"],
      rows: [
        ["帰る", "かえる", "もとの場所に戻る", "帰って"],
        ["入る", "はいる", "外から中へ進む", "入って"],
        ["走る", "はしる", "速く駆ける", "走って"],
        ["切る", "きる", "はさみや刃物で分ける", "切って"],
        ["要る", "いる", "必要である", "要って"],
        ["知る", "しる", "知識・情報を持つ", "知って"],
        ["限る", "かぎる", "範囲を限定する", "限って"],
        ["減る", "へる", "少なくなる", "減って"],
        ["蹴る", "ける", "足で強く打つ", "蹴って"],
      ],
      pitfalls: [
        "見分け方：これらの動詞は「辞書形が る で終わる」のに実は五段動詞（グループ1）なので、「う・つ・る → って」の音便で活用します。",
        "一段動詞（グループ2）の「着る」→ 着て と、五段動詞（グループ1）の「切る」→ 切って は、よく混同されるので注意しましょう。",
      ]
    }
  },
  "advanced-forms": {
    en: {
      title: "Advanced verb forms quick reference (可能・意向・受身・使役)",
      caption: "The rules for all four advanced forms lined up in one table — easier to remember than spread across four chapters.",
      columns: ["Form", "Group I (godan)", "Group II (ichidan)", "Group III (irregular)"],
      rows: [
        ["可能形", "う段→え段 + る　書く → 書ける", "Drop る + られる　食べる → 食べられる", "する → できる／来る → 来られる"],
        ["意向形", "う段→お段 + う　書く → 書こう", "Drop る + よう　食べる → 食べよう", "する → しよう／来る → 来よう"],
        ["受身形", "う段→あ段 + れる　書く → 書かれる", "Drop る + られる　食べる → 食べられる", "する → される／来る → 来られる"],
        ["使役形", "う段→あ段 + せる　書く → 書かせる", "Drop る + させる　食べる → 食べさせる", "する → させる／来る → 来させる"],
      ],
      pitfalls: [
        "For group II (ichidan), the 受身形 and 可能形 are identical (食べられる) — only context tells you which is which.",
        "Group I (godan) verbs ending in う: the 受身形 changes う to わ (買う → 買われる, not 「買あれる」); same for the 使役形 (買わせる).",
        "Colloquial 「ら抜き言葉」 (見れる／食べれる): in formal settings and on the exam, write the full られる.",
        "Causative-passive (being made to do) = させられる: 書く → 書かされる ／ 書かせられる.",
      ]
    },
    ja: {
      title: "動詞の応用形 早見表（可能・意向・受身・使役）",
      caption: "4つの応用形のルールを1つの表に並べて見比べると、4つの章に分かれているより覚えやすいです。",
      columns: ["形", "五段動詞（グループ1）", "一段動詞（グループ2）", "不規則動詞（グループ3）"],
      rows: [
        ["可能形", "う段→え段 + る　書く → 書ける", "る を取って + られる　食べる → 食べられる", "する → できる／来る → 来られる"],
        ["意向形", "う段→お段 + う　書く → 書こう", "る を取って + よう　食べる → 食べよう", "する → しよう／来る → 来よう"],
        ["受身形", "う段→あ段 + れる　書く → 書かれる", "る を取って + られる　食べる → 食べられる", "する → される／来る → 来られる"],
        ["使役形", "う段→あ段 + せる　書く → 書かせる", "る を取って + させる　食べる → 食べさせる", "する → させる／来る → 来させる"],
      ],
      pitfalls: [
        "一段動詞（グループ2）は受身形と可能形が同じ形（食べられる）なので、どちらの意味かは文脈で判断するしかありません。",
        "「う」で終わる五段動詞（グループ1）：受身形は わ に変わります（買う → 買われる、「買あれる」ではありません）。使役形も同じです（買わせる）。",
        "話し言葉では「ら抜き言葉」（見れる／食べれる）も使われますが、正式な場面や試験では られる をきちんと書きましょう。",
        "使役受身（強制されてする）＝ させられる：書く → 書かされる ／ 書かせられる。",
      ]
    }
  },
  "adjective-noun-variation": {
    en: {
      title: "Adjectives and nouns: the four-cell conjugation grid",
      caption: "The four plain-form (普通形) cells (present affirmative / present negative / past affirmative / past negative) aligned at once. い adjectives and the 「な adjective / noun」 group follow two completely different tracks.",
      columns: ["Word class", "Present affirmative", "Present negative", "Past affirmative", "Past negative"],
      rows: [
        ["い adjective", "高い", "高くない", "高かった", "高くなかった"],
        ["な adjective", "静かだ", "静かではない", "静かだった", "静かではなかった"],
        ["Noun sentence", "学生だ", "学生ではない", "学生だった", "学生ではなかった"],
      ],
      pitfalls: [
        "The affirmative sentence-final だ of な adjectives and nouns is often dropped (×「静か」→ ○「静かだ」). It matters even more before と思う／と言う.",
        "The past negative of い adjectives = 「く + なかった」 (高くなかった) — not keeping い and adding った.",
        "「いい／よい」 conjugates on 「よ」: よくない／よかった／よくなかった.",
        "Colloquial speech often uses 「じゃない」 instead of 「ではない」 (静かじゃない); on the exam, write the full ではない.",
      ]
    },
    ja: {
      title: "形容詞・名詞の活用 4つの形",
      caption: "普通形の4つの形（現在肯定／現在否定／過去肯定／過去否定）を一度に並べて確認します。い形容詞と「な形容詞 + 名詞」は、まったく別の2つのルールです。",
      columns: ["品詞", "現在肯定", "現在否定", "過去肯定", "過去否定"],
      rows: [
        ["い形容詞", "高い", "高くない", "高かった", "高くなかった"],
        ["な形容詞", "静かだ", "静かではない", "静かだった", "静かではなかった"],
        ["名詞文", "学生だ", "学生ではない", "学生だった", "学生ではなかった"],
      ],
      pitfalls: [
        "な形容詞と名詞の「肯定の文末の だ」は落としがちです（×「静か」→ ○「静かだ」）。後ろに と思う／と言う が続くときは特に注意しましょう。",
        "い形容詞の否定過去 ＝「く + なかった」（高くなかった）です。「い に った を付ける」形ではありません。",
        "「いい／よい」の活用は「よ」を使います：よくない／よかった／よくなかった。",
        "話し言葉では「ではない」の代わりに「じゃない」（静かじゃない）をよく使いますが、試験では ではない をきちんと書きましょう。",
      ]
    }
  },
  "obligation-past": {
    en: {
      title: "Past obligation step-by-step (〜なければならなかった)",
      caption: "The long pattern for \"had to do something (in the past)\". Verbs convert directly; adjectives and nouns must first go through the verbalizing step 「-くなる／-になる」, then take the past obligation.",
      columns: ["Word class", "step 1", "step 2", "Full example"],
      rows: [
        ["Verb", "Form the ない form", "ない → なければならなかった", "書く → 書か → 書かなければならなかった"],
        ["い adjective", "Drop い + くなる", "くなる → くならなければならなかった", "高い → 高く → 高くならなければならなかった"],
        ["な adjective", "Add に + なる", "になる → にならなければならなかった", "静か → 静かに → 静かにならなければならなかった"],
        ["Noun", "Add に + なる", "になる → にならなければならなかった", "学生 → 学生に → 学生にならなければならなかった"],
      ],
      pitfalls: [
        "Adjectives / nouns cannot attach directly to 「なければならなかった」 — they must first be verbalized with 「-くなる / -になる」.",
        "The past tense sits on the final 「ならなかった」, not earlier in the chain (×「ならなかなければ」、○「ならなければならなかった」).",
        "「Vない → なければ」 means dropping い from ない and adding ければ: 書かない → 書かなければ.",
      ]
    },
    ja: {
      title: "義務の過去 step-by-step（〜なければならなかった）",
      caption: "「以前、何かをしなければならなかった」という長い文です。動詞はそのまま作れますが、形容詞と名詞はまず「-くなる／-になる」で動詞の形に変えてから、義務の過去を作ります。",
      columns: ["品詞", "step 1", "step 2", "完全な例"],
      rows: [
        ["動詞", "ない形を作る", "ない → なければならなかった", "書く → 書か → 書かなければならなかった"],
        ["い形容詞", "い を取って + くなる", "くなる → くならなければならなかった", "高い → 高く → 高くならなければならなかった"],
        ["な形容詞", "に を付けて + なる", "になる → にならなければならなかった", "静か → 静かに → 静かにならなければならなかった"],
        ["名詞", "に を付けて + なる", "になる → にならなければならなかった", "学生 → 学生に → 学生にならなければならなかった"],
      ],
      pitfalls: [
        "形容詞 / 名詞 は「なければならなかった」に直接つなげられません。必ず先に「-くなる / -になる」で動詞の形に変えます。",
        "過去の意味は最後の「ならなかった」に置きます。前には置きません（×「ならなかなければ」、○「ならなければならなかった」）。",
        "「Vない → なければ」は、ない の い を取って ければ を付けます：書かない → 書かなければ。",
      ]
    }
  },
  "sentence-patterns": {
    en: {
      title: "Sentence-pattern cheat sheet (requests / obligation / giving-receiving / quotation)",
      caption: "The 10 must-memorize N5-N4 basic patterns that show up constantly on the exam, in one table. With the required preceding form spelled out, you won't have to flip back to the conjugation rules while answering.",
      columns: ["Pattern", "Meaning", "Attaches to", "Example"],
      rows: [
        ["てください", "Please ...", "Vて", "書く → 書いてください"],
        ["てもいい", "May ... (permission)", "Vて", "食べる → 食べてもいい（ですか）"],
        ["てはいけない", "Must not ... (prohibition)", "Vて", "入る → 入ってはいけません"],
        ["なくてもいい", "Don't have to ...", "Vない (drop い) + くてもいい", "書かない → 書かなくてもいい"],
        ["なければならない", "Must ...", "Vない (drop い) + ければならない", "書かない → 書かなければならない"],
        ["てもらう", "I have someone do something for me", "Vて (doer marked with に)", "友達に 教えてもらった"],
        ["てくれる", "Someone does something for me (of their own accord)", "Vて (doer marked with が)", "友達が 教えてくれた"],
        ["てあげる", "I (or my in-group) do something for someone else", "Vて (recipient marked with に)", "弟に 教えてあげた"],
        ["と思う", "I think ... (opinion)", "普通形 + と", "雨だ + と → 雨だと思う"],
        ["と言う", "Say ... (quotation)", "普通形 + と", "行く + と → 行くと言った"],
      ],
      pitfalls: [
        "Point of view is the biggest trap in these four giving-receiving patterns: \"someone does something for me\" is the てくれる family — never てあげる.",
        "Toward superiors / elders use the honorific versions: てもらう → ていただく; てくれる → てくださる.",
        "と思う／と言う attach to the 普通形 (plain form); な adjectives and nouns must keep だ (雨だと思う、学生だと言った).",
        "「ないでください」 (please don't ...) is softer than 「てはいけません」 (prohibition); when asking someone, the former sounds more natural.",
      ]
    },
    ja: {
      title: "文型 cheat sheet（依頼／義務／授受／引用）",
      caption: "N5-N4で必ず覚える、試験によく出る基礎文型10個を1つの表にまとめました。前に付く接続をはっきり書いてあるので、解答のときに活用を調べ直す必要がありません。",
      columns: ["文型", "意味", "接続", "例"],
      rows: [
        ["てください", "お願いする（依頼）", "Vて", "書く → 書いてください"],
        ["てもいい", "〜してもかまわない（許可）", "Vて", "食べる → 食べてもいい（ですか）"],
        ["てはいけない", "〜したらだめ（禁止）", "Vて", "入る → 入ってはいけません"],
        ["なくてもいい", "〜しなくてもかまわない", "Vない の い を取って + くてもいい", "書かない → 書かなくてもいい"],
        ["なければならない", "〜する必要がある", "Vない の い を取って + ければならない", "書かない → 書かなければならない"],
        ["てもらう", "自分が頼んで、人にしてもらう", "Vて（する人は に で示す）", "友達に 教えてもらった"],
        ["てくれる", "人が自分のために、進んでしてくれる", "Vて（する人は が で示す）", "友達が 教えてくれた"],
        ["てあげる", "自分（や身内）が人にしてあげる", "Vて（受ける人は に で示す）", "弟に 教えてあげた"],
        ["と思う", "〜と考える（自分の意見）", "普通形 + と", "雨だ + と → 雨だと思う"],
        ["と言う", "〜と話す（引用）", "普通形 + と", "行く + と → 行くと言った"],
      ],
      pitfalls: [
        "授受の文型でいちばんの落とし穴は視点です：「人が自分のためにする」は てくれる の仲間を使い、てあげる は使えません。",
        "目上の人には敬語を使います：てもらう → ていただく；てくれる → てくださる。",
        "と思う／と言う の前は普通形です。な形容詞・名詞は だ を残します（雨だと思う、学生だと言った）。",
        "「ないでください」（〜しないでほしいというお願い）は「てはいけません」（禁止）よりやわらかい言い方です。相手にお願いするときは「ないでください」のほうが自然です。",
      ]
    }
  },
};
