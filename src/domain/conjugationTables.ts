// Pure reference data for the 規則表 view.
//
// Designed as data-not-logic so the view is mostly a renderer: each
// ConjugationTable has a stable shape (title / caption / columns /
// rows), translations live in i18n, and the rows themselves are
// language-agnostic (Japanese forms work across zh / en / ko readers).
//
// v1 scope (tracking PR copy):
//   - 動詞分類
//   - 動詞 ます形 by group
//   - 動詞 一類 て形 / た形 音便
//   - 一類例外動詞 (る-ending godan verbs)
//
// v2 candidates (not in this PR):
//   - 可能・意向・受身・使役 quick lookup
//   - い形容詞 / な形容詞 / 名詞 variation
//   - 必要過去 step-by-step
//   - Sentence-pattern quick lookup (てください / なくてもいい / etc.)
import type { LocaleCode } from "./types";

export interface ConjugationTable {
  /** Stable id used as React key. */
  id: string;
  /** Title shown above the table (Japanese-mixed Chinese; not translated). */
  title: string;
  /** One-line caption under the title. */
  caption: string;
  /** Column headers, left-to-right. */
  columns: string[];
  /** Row data; each row's length must equal columns.length. */
  rows: Array<readonly string[]>;
  /** Optional pitfall bullets shown under the table. */
  pitfalls?: string[];
}

/** The translatable text layer of a table (#427) -- everything but the id. */
type ConjugationTableText = Pick<
  ConjugationTable,
  "title" | "caption" | "columns" | "rows" | "pitfalls"
>;

/** Per-table, per-locale overlays; the data lives in conjugationTables.i18n.ts. */
export type ConjugationTableOverlays = Record<string, Partial<Record<LocaleCode, ConjugationTableText>>>;

/**
 * Swap a table's text layer to `locale` when an overlay exists; zh-Hant (and
 * any locale without an overlay) falls back to the base table. The overlay
 * data is passed in so the heavy i18n module can stay dynamically imported
 * by the view (RulesPanel is an eager route).
 */
export function localizeConjugationTable(
  table: ConjugationTable,
  locale: LocaleCode,
  overlays: ConjugationTableOverlays
): ConjugationTable {
  const overlay = overlays[table.id]?.[locale];
  return overlay ? { ...table, ...overlay } : table;
}

const verbGroups: ConjugationTable = {
  id: "verb-groups",
  title: "動詞 三類分類",
  caption: "先依字典形結尾判類，再套變化規則。る 結尾不一定是二類。",
  columns: ["分類", "判別重點", "例字", "ます形"],
  rows: [
    ["一類（五段）", "う段結尾 (-u/-ku/-su/-tsu/-nu/-bu/-mu/-ru/-gu)", "書く・話す・読む・帰る", "書きます・話します・読みます・帰ります"],
    ["二類（一段）", "結尾「る」前面是 い段 / え段", "見る・起きる・食べる・寝る", "見ます・起きます・食べます・寝ます"],
    ["三類（不規則）", "只有兩個，直接記", "する・来る", "します・来ます（きます）"]
  ],
  pitfalls: [
    "「帰る・走る・入る・切る・要る・知る・限る」字尾是る但是一類，要走音便。",
    "「N + する」型動詞（勉強する／練習する）一律當三類處理。",
    "「来る」變化讀音常變：来ます=きます、来て=きて、来ない=こない、来られる=こられる。"
  ]
};

const masuForm: ConjugationTable = {
  id: "masu-form",
  title: "ます形",
  caption: "敬語句尾的基本形，也是 たい / ながら / ことができる 等的接續基礎。",
  columns: ["分類", "規則", "例"],
  rows: [
    ["一類", "字尾換 い段 + ます", "書く → 書きます／読む → 読みます／話す → 話します／買う → 買います"],
    ["二類", "去る + ます", "食べる → 食べます／見る → 見ます／起きる → 起きます"],
    ["三類", "不規則", "する → します／来る → 来ます（きます）"]
  ],
  pitfalls: [
    "う 結尾不是換あ段、是換 い段（買う → 買います，不是「買あます」）。",
    "二類不走音便，直接去る加ます。"
  ]
};

const teTaForm: ConjugationTable = {
  id: "te-ta-form",
  title: "一類動詞 て形・た形（音便速查）",
  caption: "一類動詞最難的就是音便；先把這張表背熟，後面所有 てください／てしまう／たことがある 都直接套。",
  columns: ["結尾", "て形", "た形", "例"],
  rows: [
    ["く", "いて", "いた", "書く → 書いて／書いた"],
    ["ぐ", "いで", "いだ", "泳ぐ → 泳いで／泳いだ"],
    ["す", "して", "した", "話す → 話して／話した"],
    ["う・つ・る", "って", "った", "買う → 買って／買った 待つ → 待って／待った 帰る → 帰って／帰った"],
    ["む・ぶ・ぬ", "んで", "んだ", "読む → 読んで／読んだ 遊ぶ → 遊んで／遊んだ 死ぬ → 死んで／死んだ"],
    ["二類", "去る + て / た", "—", "食べる → 食べて／食べた"],
    ["三類", "不規則", "—", "する → して／した 来る → 来て（きて）／来た（きた）"]
  ],
  pitfalls: [
    "「行く」是一類的例外：行って／行った（不是「行いて／行いた」）。",
    "二類不走音便，直接去る加て／た，別套五種音便。",
    "「死ぬ」是唯一以ぬ結尾的一類動詞，記住「死んで」就涵蓋了。"
  ]
};

const exceptionGodan: ConjugationTable = {
  id: "exception-godan",
  title: "一類例外動詞（る 結尾陷阱）",
  caption: "看到「-iる／-eる」就反射想成二類，會把這幾個常用動詞變錯。記下列表，遇到時走一類音便。",
  columns: ["動詞", "讀音", "意思", "て形"],
  rows: [
    ["帰る", "かえる", "回去", "帰って"],
    ["入る", "はいる", "進入", "入って"],
    ["走る", "はしる", "跑", "走って"],
    ["切る", "きる", "剪／切", "切って"],
    ["要る", "いる", "需要", "要って"],
    ["知る", "しる", "知道", "知って"],
    ["限る", "かぎる", "限定", "限って"],
    ["減る", "へる", "減少", "減って"],
    ["蹴る", "ける", "踢", "蹴って"]
  ],
  pitfalls: [
    "判斷邏輯：這些動詞「字典形是る結尾」但其實是一類，所以走「う・つ・る → って」的音便。",
    "對比二類「着る」（穿）→ 着て；「切る」是一類→ 切って，兩個常被混淆。"
  ]
};

const advancedForms: ConjugationTable = {
  id: "advanced-forms",
  title: "動詞 進階形 速查（可能・意向・受身・使役）",
  caption: "四種進階形的規則放在一張表上對齊看，比分散在四章好記。",
  columns: ["形", "一類", "二類", "三類"],
  rows: [
    [
      "可能形",
      "う段→え段 + る　書く → 書ける",
      "去る + られる　食べる → 食べられる",
      "する → できる／来る → 来られる"
    ],
    [
      "意向形",
      "う段→お段 + う　書く → 書こう",
      "去る + よう　食べる → 食べよう",
      "する → しよう／来る → 来よう"
    ],
    [
      "受身形",
      "う段→あ段 + れる　書く → 書かれる",
      "去る + られる　食べる → 食べられる",
      "する → される／来る → 来られる"
    ],
    [
      "使役形",
      "う段→あ段 + せる　書く → 書かせる",
      "去る + させる　食べる → 食べさせる",
      "する → させる／来る → 来させる"
    ]
  ],
  pitfalls: [
    "二類受身 ＝ 可能形 同形（食べられる），只能靠上下文判斷誰是誰。",
    "う 結尾的一類：受身要變わ（買う → 買われる、不是「買あれる」）；使役同樣（買わせる）。",
    "口語的「ら抜き言葉」（見れる／食べれる）正式場合與考試請寫足られる。",
    "使役被動（被迫做）＝ させられる：書く → 書かされる ／ 書かせられる。"
  ]
};

const conditionalBa: ConjugationTable = {
  id: "conditional-ba",
  title: "假定形（ば形）完整轉換",
  caption:
    "「如果…就…」的ば形，動詞、否定、形容詞、名詞一張表看完。最容易被教錯的是な形容詞和名詞：它們直接接「なら」，不是「なければ」。",
  columns: ["詞類", "規則", "例"],
  rows: [
    ["一類動詞", "最後一字う段 → え段 + ば", "書く → 書けば／飲む → 飲めば／買う → 買えば"],
    ["二類動詞", "去る + れば", "食べる → 食べれば／見る → 見れば"],
    ["三類動詞", "不規則", "する → すれば／来る → 来れば（くれば）"],
    ["動詞否定", "ない形去い + ければ", "行かない → 行かなければ"],
    ["い形容詞", "去い + ければ", "高い → 高ければ／いい → よければ"],
    ["な形容詞", "直接 + なら", "静か → 静かなら"],
    ["名詞", "直接 + なら", "学生 → 学生なら"]
  ],
  pitfalls: [
    "な形容詞・名詞不能直接接「なければ」：肯定條件直接接「なら」（×静かなければ、○静かなら）；否定條件先變「ではない」再變「でなければ」（静かでなければ）。",
    "「いい」要走「よ」：よければ（×いければ）。",
    "上表變出來的都是肯定條件；「如果不…」一律先變否定再變ば形：動詞・い形 ない → なければ（高くなければ）、な形・名詞 ではない → でなければ。",
    "ば／たら／なら／と 四種「如果」的用法分工，見學習頁「ば / たら / なら / と（四種條件）」章。"
  ]
};

const adjectiveNounVariation: ConjugationTable = {
  id: "adjective-noun-variation",
  title: "形容詞・名詞 變化四格",
  caption: "普通形四格（現在肯定／現在否定／過去肯定／過去否定）一次對齊。い形容詞和「な形容詞 + 名詞」是兩條完全不同的線。",
  columns: ["詞類", "現在肯定", "現在否定", "過去肯定", "過去否定"],
  rows: [
    ["い形容詞", "高い", "高くない", "高かった", "高くなかった"],
    ["な形容詞", "静かだ", "静かではない", "静かだった", "静かではなかった"],
    ["名詞句", "学生だ", "学生ではない", "学生だった", "学生ではなかった"]
  ],
  pitfalls: [
    "な形容詞和名詞的「肯定句尾だ」常被漏掉（×「静か」→ ○「静かだ」）。後接 と思う／と言う 時更明顯。",
    "い形容詞否定過去 ＝「く + なかった」（高くなかった），不是「い 再加った」。",
    "「いい／よい」的變化要走「よ」：よくない／よかった／よくなかった。",
    "口語常用「じゃない」代替「ではない」（静かじゃない），考試請寫足ではない。"
  ]
};

const obligationPast: ConjugationTable = {
  id: "obligation-past",
  title: "必要過去 step-by-step（〜なければならなかった）",
  caption: "「以前必須做某件事」的長句。動詞直接做；形容詞和名詞要先轉成「-くなる／-になる」這個動詞化過程，再做必要過去。",
  columns: ["詞類", "step 1", "step 2", "完整例"],
  rows: [
    [
      "動詞",
      "做 ない形",
      "ない → なければならなかった",
      "書く → 書か → 書かなければならなかった"
    ],
    [
      "い形容詞",
      "去い + くなる",
      "くなる → くならなければならなかった",
      "高い → 高く → 高くならなければならなかった"
    ],
    [
      "な形容詞",
      "加に + なる",
      "になる → にならなければならなかった",
      "静か → 静かに → 静かにならなければならなかった"
    ],
    [
      "名詞",
      "加に + なる",
      "になる → にならなければならなかった",
      "学生 → 学生に → 学生にならなければならなかった"
    ]
  ],
  pitfalls: [
    "形容詞 / 名詞 不能直接接「なければならなかった」，一定要先「-くなる / -になる」轉成動詞化。",
    "過去點放在最後的「ならなかった」，不是放在前面（×「ならなかなければ」、○「ならなければならなかった」）。",
    "「Vない → なければ」是把ない去い加ければ：書かない → 書かなければ。"
  ]
};

const sentencePatterns: ConjugationTable = {
  id: "sentence-patterns",
  title: "句型 cheat sheet（請求／必要／授受／引用）",
  caption: "N5-N4 必背、考試常出的 10 個基礎句型放在一張表。前置接續寫清楚，作答時就不用回去翻變化。",
  columns: ["句型", "意思", "前置接續", "例"],
  rows: [
    ["てください", "請...", "Vて", "書く → 書いてください"],
    ["てもいい", "可以...（許可）", "Vて", "食べる → 食べてもいい（ですか）"],
    ["てはいけない", "不可以...（禁止）", "Vて", "入る → 入ってはいけません"],
    ["なくてもいい", "不必...", "Vない去い + くてもいい", "書かない → 書かなくてもいい"],
    ["なければならない", "必須...", "Vない去い + ければならない", "書かない → 書かなければならない"],
    ["てもらう", "我請別人為我做", "Vて（に 標記做的人）", "友達に 教えてもらった"],
    ["てくれる", "別人主動為我做", "Vて（が 標記做的人）", "友達が 教えてくれた"],
    ["てあげる", "我（為內側）對別人做", "Vて（に 標記受方）", "弟に 教えてあげた"],
    ["と思う", "我認為...（意見）", "普通形 + と", "雨だ + と → 雨だと思う"],
    ["と言う", "說...（引用）", "普通形 + と", "行く + と → 行くと言った"]
  ],
  pitfalls: [
    "授受視角是這四個句型最大的坑：「別人為我做」是てくれる家族，不能用てあげる。",
    "對上位 / 長輩用敬語：てもらう → ていただく；てくれる → てくださる。",
    "と思う／と言う 接續吃普通形，な形容詞・名詞要保留だ（雨だと思う、学生だと言った）。",
    "「ないでください」（請不要...）比「てはいけません」（禁止）軟，請對方時用前者比較自然。"
  ]
};

export const CONJUGATION_TABLES: ConjugationTable[] = [
  verbGroups,
  masuForm,
  teTaForm,
  exceptionGodan,
  advancedForms,
  conditionalBa,
  adjectiveNounVariation,
  obligationPast,
  sentencePatterns
];
