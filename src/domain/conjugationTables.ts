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

export const CONJUGATION_TABLES: ConjugationTable[] = [
  verbGroups,
  masuForm,
  teTaForm,
  exceptionGodan
];
