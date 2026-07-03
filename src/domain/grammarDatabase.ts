// JLPT 文型資料庫（Issue #437）
//
// 為每個文型提供：中文解釋、接續規則、例句、日劇／動漫台詞例句、相近文型、
// 常見錯誤。資料持續擴充中，初期 N5/N4/N2 各一批。
//
// 台詞例句如有不確定，以 `confidence` 如實標記，不偽造 verified 資料。
import type { JlptLevel, ExampleSentence } from "./types";

export type GrammarImportance = "must_know" | "high_frequency" | "understand" | "reference";

export interface MediaLineExample {
  sourceType: "drama" | "anime" | "movie" | "other";
  titleJa: string;
  titleZh?: string;
  episode?: string;
  character?: string;
  lineJa: string;
  lineZh?: string;
  grammarHighlight: string;
  contextZh?: string;
  timestamp?: string;
  confidence: "verified" | "subtitle_verified" | "approximate" | "inspired_by";
  sourceUrl?: string;
}

export interface GrammarPattern {
  /** 唯一識別子（kebab-case） */
  id: string;
  level: JlptLevel;
  /** 文型本體，如「〜てもいい」、「〜にしても」 */
  pattern: string;
  /** 讀音（必要時） */
  reading?: string;
  meaningZh: string;
  meaningJa?: string;
  /** 接續規則，如「動詞て形＋もいい」 */
  formation: string;
  importance: GrammarImportance;
  tags: string[];
  examples: ExampleSentence[];
  /** 日劇／動漫台詞例句（有的話） */
  mediaExamples: MediaLineExample[];
  /** 相近文型的 id（指向 grammarPatterns 中的其他條目） */
  relatedPatternIds: string[];
  commonMistakes?: string[];
  sourceNotes?: string[];
}

// ------ N5 文型 ------

const n5Patterns: GrammarPattern[] = [
  {
    id: "te-mo-ii",
    level: "N5",
    pattern: "〜てもいい",
    meaningZh: "可以做～、～也沒關係",
    meaningJa: "～してもよい／許可を表す",
    formation: "動詞て形＋もいい",
    importance: "must_know",
    tags: ["許可"],
    examples: [
      { japanese: "ここで写真を撮ってもいいですか？", meaningZh: "可以在這裡拍照嗎？" },
      { japanese: "明日は休んでもいいですよ。", meaningZh: "明天休息也沒關係喔。" },
    ],
    mediaExamples: [],
    relatedPatternIds: ["te-wa-ikenai"],
    commonMistakes: [
      "口語中「〜てもいいですか」常省略為「〜ていいですか」",
    ],
  },
  {
    id: "te-wa-ikenai",
    level: "N5",
    pattern: "〜てはいけない",
    meaningZh: "不可以做～、禁止～",
    meaningJa: "～してはならない／禁止を表す",
    formation: "動詞て形＋はいけない",
    importance: "must_know",
    tags: ["禁止"],
    examples: [
      { japanese: "図書館で大きな声で話してはいけません。", meaningZh: "圖書館不可以大聲說話。" },
      { japanese: "ここに車を止めてはいけない。", meaningZh: "這裡不可以停車。" },
    ],
    mediaExamples: [],
    relatedPatternIds: ["te-mo-ii", "nakereba-naranai"],
  },
  {
    id: "nakereba-naranai",
    level: "N5",
    pattern: "〜なければならない",
    meaningZh: "必須做～、非做不可",
    meaningJa: "～する義務がある／必要を表す",
    formation: "動詞ない形（ない→なければ）＋ならない",
    importance: "must_know",
    tags: ["義務", "必要"],
    examples: [
      { japanese: "宿題をしなければならない。", meaningZh: "必須做功課。" },
      { japanese: "明日は早く起きなければなりません。", meaningZh: "明天必須早起。" },
    ],
    mediaExamples: [],
    relatedPatternIds: ["nakute-mo-ii"],
    commonMistakes: [
      "口語常省略為「〜なきゃ（ならない）」",
    ],
  },
  {
    id: "nakute-mo-ii",
    level: "N5",
    pattern: "〜なくてもいい",
    meaningZh: "不用做～、不做也可以",
    meaningJa: "～する必要はない／不要を表す",
    formation: "動詞ない形（ない→なくて）＋もいい",
    importance: "must_know",
    tags: ["不要", "許可"],
    examples: [
      { japanese: "明日は来なくてもいいですよ。", meaningZh: "明天不來也沒關係喔。" },
    ],
    mediaExamples: [],
    relatedPatternIds: ["nakereba-naranai"],
  },
  {
    id: "ta-ho-ga-ii",
    level: "N5",
    pattern: "〜たほうがいい",
    meaningZh: "最好做～",
    meaningJa: "～した方がよい／勧めを表す",
    formation: "動詞た形＋ほうがいい",
    importance: "must_know",
    tags: ["勸告", "建議"],
    examples: [
      { japanese: "早く寝たほうがいいよ。", meaningZh: "最好早點睡喔。" },
    ],
    mediaExamples: [],
    relatedPatternIds: ["nai-ho-ga-ii"],
  },
  {
    id: "nai-ho-ga-ii",
    level: "N5",
    pattern: "〜ないほうがいい",
    meaningZh: "最好不要做～",
    meaningJa: "～しない方がよい／否定的な勧め",
    formation: "動詞ない形＋ほうがいい",
    importance: "must_know",
    tags: ["勸告", "建議"],
    examples: [
      { japanese: "あの人には近づかないほうがいい。", meaningZh: "最好不要靠近那個人。" },
    ],
    mediaExamples: [],
    relatedPatternIds: ["ta-ho-ga-ii"],
  },
  {
    id: "koto-ga-dekiru",
    level: "N5",
    pattern: "〜ことができる",
    meaningZh: "能夠做～、會做～",
    meaningJa: "～する能力がある／可能を表す",
    formation: "動詞辞書形＋ことができる",
    importance: "must_know",
    tags: ["可能", "能力"],
    examples: [
      { japanese: "日本語を話すことができます。", meaningZh: "會說日語。" },
      { japanese: "一人で行くことができますか？", meaningZh: "可以一個人去嗎？" },
    ],
    mediaExamples: [],
    relatedPatternIds: ["tai"],
  },
  {
    id: "tai",
    level: "N5",
    pattern: "〜たい",
    meaningZh: "想要做～",
    meaningJa: "～したい／希望・欲求を表す",
    formation: "動詞ます形（去ます）＋たい",
    importance: "must_know",
    tags: ["希望", "欲望"],
    examples: [
      { japanese: "日本に行きたいです。", meaningZh: "想去日本。" },
      { japanese: "何を食べたい？", meaningZh: "想吃什麼？" },
    ],
    mediaExamples: [],
    relatedPatternIds: ["koto-ga-dekiru"],
  },
  {
    id: "te-kudasai",
    level: "N5",
    pattern: "〜てください",
    meaningZh: "請做～",
    meaningJa: "～してください／依頼を表す",
    formation: "動詞て形＋ください",
    importance: "must_know",
    tags: ["依頼"],
    examples: [
      { japanese: "窓を閉めてください。", meaningZh: "請把窗戶關上。" },
    ],
    mediaExamples: [],
    relatedPatternIds: ["te-mo-ii", "te-wa-ikenai"],
  },
  {
    id: "to-omou",
    level: "N5",
    pattern: "〜と思う",
    meaningZh: "我認為～、我想～",
    meaningJa: "～と考える／意見・思考を表す",
    formation: "動詞・形容詞普通形＋と思う",
    importance: "must_know",
    tags: ["思考", "意見"],
    examples: [
      { japanese: "明日は雨が降ると思います。", meaningZh: "我想明天會下雨。" },
    ],
    mediaExamples: [],
    relatedPatternIds: [],
  },
  {
    id: "kara",
    level: "N5",
    pattern: "〜から",
    meaningZh: "因為～（原因、理由）",
    meaningJa: "～だから／理由・原因を表す",
    formation: "動詞・形容詞普通形＋から",
    importance: "must_know",
    tags: ["原因", "理由"],
    examples: [
      { japanese: "安いから、買いました。", meaningZh: "因為便宜，所以買了。" },
    ],
    mediaExamples: [],
    relatedPatternIds: ["node"],
    commonMistakes: [
      "「〜から」的主觀性比「〜ので」強，正式場合避免用「〜から」表理由",
    ],
  },
  {
    id: "node",
    level: "N5",
    pattern: "〜ので",
    meaningZh: "因為～（較客觀的原因）",
    meaningJa: "～なので／客観的な理由を表す",
    formation: "動詞・形容詞普通形＋ので；名詞・な形容詞＋な＋ので",
    importance: "must_know",
    tags: ["原因", "理由"],
    examples: [
      { japanese: "天気がいいので、散歩に行きます。", meaningZh: "因為天氣很好，所以去散步。" },
    ],
    mediaExamples: [],
    relatedPatternIds: ["kara"],
  },
  {
    id: "yori",
    level: "N5",
    pattern: "〜より",
    meaningZh: "比～更…",
    meaningJa: "～に比べて／比較を表す",
    formation: "名詞＋より",
    importance: "high_frequency",
    tags: ["比較"],
    examples: [
      { japanese: "日本語より英語のほうが簡単です。", meaningZh: "英語比日語簡單。" },
    ],
    mediaExamples: [],
    relatedPatternIds: ["ho-ga"],
  },
  {
    id: "ho-ga",
    level: "N5",
    pattern: "〜ほうが",
    meaningZh: "～比較好、～比較…",
    meaningJa: "～の方が／比較の選択を表す",
    formation: "名詞＋の＋ほう／動詞た形＋ほう",
    importance: "high_frequency",
    tags: ["比較", "選擇"],
    examples: [
      { japanese: "電車のほうが速いです。", meaningZh: "電車比較快。" },
    ],
    mediaExamples: [],
    relatedPatternIds: ["yori"],
  },
  {
    id: "mashou",
    level: "N5",
    pattern: "〜ましょう",
    meaningZh: "～吧（提議、意志）",
    meaningJa: "～しましょう／勧誘・意志を表す",
    formation: "動詞ます形（去ます）＋ましょう",
    importance: "must_know",
    tags: ["勧誘", "意志"],
    examples: [
      { japanese: "一緒に行きましょう。", meaningZh: "一起去吧。" },
    ],
    mediaExamples: [],
    relatedPatternIds: ["tai"],
  },
];

// ------ N4 文型 ------

const n4Patterns: GrammarPattern[] = [
  {
    id: "te-iru",
    level: "N4",
    pattern: "〜ている",
    meaningZh: "正在～；～著（狀態）",
    meaningJa: "現在進行中／状態の継続を表す",
    formation: "動詞て形＋いる",
    importance: "must_know",
    tags: ["進行", "状態"],
    examples: [
      { japanese: "今、勉強しています。", meaningZh: "正在讀書。" },
      { japanese: "あの花が咲いている。", meaningZh: "那朵花開著。" },
    ],
    mediaExamples: [],
    relatedPatternIds: ["te-aru"],
  },
  {
    id: "te-aru",
    level: "N4",
    pattern: "〜てある",
    meaningZh: "已經～好了（刻意做的結果狀態）",
    meaningJa: "意図的な行為の結果状態を表す",
    formation: "他動詞て形＋ある",
    importance: "high_frequency",
    tags: ["状態", "準備"],
    examples: [
      { japanese: "窓が開けてある。", meaningZh: "窗戶開著（有人刻意打開的）。" },
    ],
    mediaExamples: [],
    relatedPatternIds: ["te-iru", "te-oku"],
  },
  {
    id: "te-oku",
    level: "N4",
    pattern: "〜ておく",
    meaningZh: "預先做～（準備）",
    meaningJa: "前もって準備することを表す",
    formation: "動詞て形＋おく",
    importance: "high_frequency",
    tags: ["準備"],
    examples: [
      { japanese: "旅行の前に切符を買っておきます。", meaningZh: "旅行前先買好車票。" },
    ],
    mediaExamples: [],
    relatedPatternIds: ["te-aru", "te-shimau"],
  },
  {
    id: "te-shimau",
    level: "N4",
    pattern: "〜てしまう",
    meaningZh: "做完～（完了）；不小心～（遺憾）",
    meaningJa: "完了／残念な気持ちを込めて",
    formation: "動詞て形＋しまう",
    importance: "high_frequency",
    tags: ["完了", "遺憾"],
    examples: [
      { japanese: "宿題を忘れてしまった。", meaningZh: "不小心忘記做功課了。" },
    ],
    mediaExamples: [],
    relatedPatternIds: ["te-oku"],
  },
  {
    id: "te-miru",
    level: "N4",
    pattern: "〜てみる",
    meaningZh: "試試看～",
    meaningJa: "試しに～する",
    formation: "動詞て形＋みる",
    importance: "high_frequency",
    tags: ["試行"],
    examples: [
      { japanese: "このアプリを使ってみてください。", meaningZh: "請試試看這個應用程式。" },
    ],
    mediaExamples: [],
    relatedPatternIds: [],
  },
  {
    id: "ta-koto-ga-aru",
    level: "N4",
    pattern: "〜たことがある",
    meaningZh: "曾經～過（經驗）",
    meaningJa: "過去の経験を表す",
    formation: "動詞た形＋ことがある",
    importance: "must_know",
    tags: ["経験"],
    examples: [
      { japanese: "富士山に登ったことがあります。", meaningZh: "爬過富士山。" },
    ],
    mediaExamples: [],
    relatedPatternIds: [],
    commonMistakes: [
      "「〜たことがある」問的是經驗的有無，不要與「〜ている」（正在進行）混淆",
    ],
  },
  {
    id: "yasui",
    level: "N4",
    pattern: "〜やすい",
    meaningZh: "容易做～",
    meaningJa: "〜するのが簡単だ／傾向を表す",
    formation: "動詞ます形（去ます）＋やすい",
    importance: "high_frequency",
    tags: ["傾向", "難易"],
    examples: [
      { japanese: "このペンは書きやすいです。", meaningZh: "這枝筆很好寫。" },
    ],
    mediaExamples: [],
    relatedPatternIds: ["nikui"],
  },
  {
    id: "nikui",
    level: "N4",
    pattern: "〜にくい",
    meaningZh: "難以做～",
    meaningJa: "〜するのが難しい／否定傾向",
    formation: "動詞ます形（去ます）＋にくい",
    importance: "high_frequency",
    tags: ["傾向", "難易"],
    examples: [
      { japanese: "この漢字は覚えにくい。", meaningZh: "這個漢字很難記。" },
    ],
    mediaExamples: [],
    relatedPatternIds: ["yasui"],
  },
  {
    id: "sugiru",
    level: "N4",
    pattern: "〜すぎる",
    meaningZh: "太～、過度～",
    meaningJa: "程度が過剰であることを表す",
    formation: "動詞ます形（去ます）＋すぎる／形容詞語幹＋すぎる",
    importance: "high_frequency",
    tags: ["程度", "過剰"],
    examples: [
      { japanese: "食べすぎてお腹が痛い。", meaningZh: "吃太多肚子痛。" },
    ],
    mediaExamples: [],
    relatedPatternIds: [],
  },
  {
    id: "nagara",
    level: "N4",
    pattern: "〜ながら",
    meaningZh: "一邊～一邊～",
    meaningJa: "同時に二つの動作をする",
    formation: "動詞ます形（去ます）＋ながら",
    importance: "must_know",
    tags: ["同時"],
    examples: [
      { japanese: "音楽を聴きながら勉強する。", meaningZh: "一邊聽音樂一邊讀書。" },
    ],
    mediaExamples: [],
    relatedPatternIds: [],
    commonMistakes: [
      "前後主語必須相同，且後項為主動作",
    ],
  },
  {
    id: "ba-hodo",
    level: "N4",
    pattern: "〜ば〜ほど",
    meaningZh: "越～就越～",
    meaningJa: "程度が増すにつれて、別の程度も増す",
    formation: "動詞・形容詞の仮定形＋ば＋同語＋ほど",
    importance: "high_frequency",
    tags: ["比例", "程度"],
    examples: [
      { japanese: "練習すればするほど上手になる。", meaningZh: "越練習越進步。" },
    ],
    mediaExamples: [],
    relatedPatternIds: [],
  },
  {
    id: "shika-nai",
    level: "N4",
    pattern: "〜しか〜ない",
    meaningZh: "只有～、僅～",
    meaningJa: "限定を表す（「だけ」の強調否定的表現）",
    formation: "名詞・數量詞＋しか＋否定形",
    importance: "must_know",
    tags: ["限定"],
    examples: [
      { japanese: "百円しか持っていない。", meaningZh: "只有一百日元。" },
    ],
    mediaExamples: [],
    relatedPatternIds: [],
    commonMistakes: [
      "只能接否定形；肯定句用「だけ」",
    ],
  },
  {
    id: "hazu",
    level: "N4",
    pattern: "〜はず",
    meaningZh: "應該～（預計、推測）",
    meaningJa: "当然の推測・予定を表す",
    formation: "動詞・形容詞連体形＋はず",
    importance: "high_frequency",
    tags: ["推測", "予定"],
    examples: [
      { japanese: "彼はもう着いているはずです。", meaningZh: "他應該已經到了。" },
    ],
    mediaExamples: [],
    relatedPatternIds: ["tsumori"],
  },
  {
    id: "tsumori",
    level: "N4",
    pattern: "〜つもり",
    meaningZh: "打算做～",
    meaningJa: "意志・予定を表す",
    formation: "動詞辞書形＋つもり／ない形＋つもり",
    importance: "high_frequency",
    tags: ["意志", "予定"],
    examples: [
      { japanese: "来年、日本に行くつもりです。", meaningZh: "打算明年去日本。" },
    ],
    mediaExamples: [],
    relatedPatternIds: ["hazu"],
    commonMistakes: [
      "「〜つもり」是主觀意圖；客觀預定用「〜予定」",
    ],
  },
  {
    id: "noni",
    level: "N4",
    pattern: "〜のに",
    meaningZh: "明明～卻～（逆接）",
    meaningJa: "意外・不満を込めた逆接",
    formation: "動詞・形容詞連体形＋のに",
    importance: "high_frequency",
    tags: ["逆接", "不満"],
    examples: [
      { japanese: "たくさん勉強したのに、試験に落ちた。", meaningZh: "明明讀了很多書，卻沒考過。" },
    ],
    mediaExamples: [],
    relatedPatternIds: ["nimo-kakawarazu", "monono"],
    commonMistakes: [
      "「〜のに」帶不滿或意外語氣，客觀事實的逆接用「〜が／〜けど」",
    ],
  },
];

// ------ N2 文型 ------

const n2Patterns: GrammarPattern[] = [
  {
    id: "ni-shitemo",
    level: "N2",
    pattern: "〜にしても",
    meaningZh: "就算～、即使以～來說",
    meaningJa: "〜という立場・状況を考慮しても",
    formation: "名詞＋にしても；動詞辞書形＋にしても",
    importance: "high_frequency",
    tags: ["譲歩", "逆接"],
    examples: [
      { japanese: "値段にしても、場所にしても、このアパートは最高だ。", meaningZh: "不論價格還是地點，這間公寓都是最好的。" },
      { japanese: "忙しいにしても、連絡ぐらいはできるだろう。", meaningZh: "就算再忙，至少聯絡一下總可以吧。" },
    ],
    mediaExamples: [
      {
        sourceType: "drama",
        titleJa: "カルテット",
        titleZh: "四重奏",
        character: "巻真紀（松たか子）",
        lineJa: "悲しいにしても、人生は続くんだ。",
        lineZh: "即使悲傷，人生還是會繼續下去。",
        grammarHighlight: "にしても",
        contextZh: "四人がそれぞれの傷を抱えながらも前に進もうとする場面。",
        confidence: "approximate",
      },
    ],
    relatedPatternIds: ["toshitemo"],
    commonMistakes: [
      "「〜にしても」與「〜としても」的差異：にしても偏「以某立場而言」，としても偏「即使假設某條件成立」",
    ],
  },
  {
    id: "kaneru",
    level: "N2",
    pattern: "〜かねる",
    meaningZh: "難以～、不便～、做不到～",
    meaningJa: "〜するのが難しい／〜できない",
    formation: "動詞ます形（去ます）＋かねる",
    importance: "high_frequency",
    tags: ["不可能", "困難"],
    examples: [
      { japanese: "その質問にはお答えしかねます。", meaningZh: "那個問題我難以回答（不便回答）。" },
      { japanese: "そんなことは私には決めかねます。", meaningZh: "那種事我無法決定。" },
    ],
    mediaExamples: [
      {
        sourceType: "drama",
        titleJa: "半沢直樹",
        titleZh: "半澤直樹",
        character: "半沢直樹（堺雅人）",
        lineJa: "申し訳ございませんが、その条件ではお受けしかねます。",
        lineZh: "非常抱歉，那個條件我們難以接受。",
        grammarHighlight: "かねます",
        contextZh: "半澤拒絕不合理要求的場景。",
        confidence: "approximate",
      },
    ],
    relatedPatternIds: ["nikui"],
    commonMistakes: [
      "「〜かねる」是敬語場合理性的婉拒，不是真的做不到；真的不能做用「〜できない」",
    ],
  },
  {
    id: "warini",
    level: "N2",
    pattern: "〜わりに",
    meaningZh: "雖然～卻～、以～來說算是～",
    meaningJa: "〜にしては／〜の割には",
    formation: "動詞・形容詞連体形＋わりに；名詞＋の＋わりに",
    importance: "high_frequency",
    tags: ["比較", "逆接"],
    examples: [
      { japanese: "あの店は安いわりに美味しい。", meaningZh: "那家店以價格來說算是好吃的。" },
      { japanese: "彼は勉強しないわりに成績がいい。", meaningZh: "他明明不讀書成績卻很好。" },
    ],
    mediaExamples: [
      {
        sourceType: "drama",
        titleJa: "逃げるは恥だが役に立つ",
        titleZh: "月薪嬌妻",
        character: "森山みくり（新垣結衣）",
        lineJa: "年齢のわりに子供っぽいってよく言われるんです。",
        lineZh: "常被人說跟年齡比起來很孩子氣。",
        grammarHighlight: "わりに",
        contextZh: "みくり在跟平匡對話時自我吐槽。",
        confidence: "approximate",
      },
    ],
    relatedPatternIds: ["noni", "ni-shitemo"],
  },
  {
    id: "toshitemo",
    level: "N2",
    pattern: "〜としても",
    meaningZh: "即使～也～",
    meaningJa: "仮に〜しても（仮定条件の逆接）",
    formation: "動詞普通形＋としても；い形容詞普通形＋としても",
    importance: "high_frequency",
    tags: ["仮定", "逆接", "譲歩"],
    examples: [
      { japanese: "雨が降ったとしても、試合は行われます。", meaningZh: "即使下雨，比賽還是會舉行。" },
      { japanese: "間に合わないとしても、行くだけ行ってみよう。", meaningZh: "即使來不及，至少去試試看。" },
    ],
    mediaExamples: [],
    relatedPatternIds: ["ni-shitemo"],
    commonMistakes: [
      "「〜としても」是純粹假設逆接；「〜にしても」可表「從某角度來看」的讓步",
    ],
  },
  {
    id: "monono",
    level: "N2",
    pattern: "〜ものの",
    meaningZh: "雖然～但是～",
    meaningJa: "〜けれども（実際にそうなっていない）",
    formation: "動詞・形容詞普通形＋ものの",
    importance: "high_frequency",
    tags: ["逆接", "譲歩"],
    examples: [
      { japanese: "留学したものの、あまり日本語が上達しなかった。", meaningZh: "雖然去留學了，但日語沒有進步多少。" },
      { japanese: "買ったものの、一度も使っていない。", meaningZh: "雖然買了，但一次也沒用過。" },
    ],
    mediaExamples: [],
    relatedPatternIds: ["noni", "nimo-kakawarazu"],
    commonMistakes: [
      "「〜ものの」暗示結果不如預期或未實現，比「〜が／〜けど」更強調轉折",
    ],
  },
  {
    id: "nimo-kakawarazu",
    level: "N2",
    pattern: "〜にもかかわらず",
    meaningZh: "儘管～卻～",
    meaningJa: "〜であるのに（予想に反して）",
    formation: "名詞＋にもかかわらず；動詞・形容詞普通形＋にもかかわらず",
    importance: "high_frequency",
    tags: ["逆接", "譲歩"],
    examples: [
      { japanese: "雨にもかかわらず、多くの人が集まった。", meaningZh: "儘管下雨，還是聚集了很多人。" },
      { japanese: "何度も注意したにもかかわらず、同じミスを繰り返している。", meaningZh: "儘管提醒了好幾次，還是在犯同樣的錯。" },
    ],
    mediaExamples: [
      {
        sourceType: "drama",
        titleJa: "リーガル・ハイ",
        titleZh: "王牌大律師",
        character: "古美門研介（堺雅人）",
        lineJa: "多くの反対にもかかわらず、彼は自分の信念を貫いた。",
        lineZh: "儘管有許多反對，他仍堅持了自己的信念。",
        grammarHighlight: "にもかかわらず",
        contextZh: "古美門在法庭辯論時的結辯台詞。",
        confidence: "approximate",
      },
    ],
    relatedPatternIds: ["monono", "noni"],
    commonMistakes: [
      "「〜にもかかわらず」比「〜のに」更正式、語氣更強烈",
    ],
  },
  {
    id: "bakari-ni",
    level: "N2",
    pattern: "〜ばかりに",
    meaningZh: "正因為～（才導致不好的結果）",
    meaningJa: "〜が原因で悪い結果になった",
    formation: "動詞・い形容詞普通形＋ばかりに；な形容詞＋な／名詞＋である＋ばかりに",
    importance: "high_frequency",
    tags: ["原因", "後悔"],
    examples: [
      { japanese: "彼の言葉を信じたばかりに、大金を失った。", meaningZh: "就因為相信了他的話，損失了一大筆錢。" },
    ],
    mediaExamples: [],
    relatedPatternIds: ["dake-atte"],
    commonMistakes: [
      "只用在負面結果，不要用於正面原因",
    ],
  },
  {
    id: "dake-atte",
    level: "N2",
    pattern: "〜だけあって",
    meaningZh: "不愧是～、正因為～",
    meaningJa: "〜にふさわしく（肯定的評価）",
    formation: "名詞＋だけあって；動詞・形容詞普通形＋だけあって",
    importance: "high_frequency",
    tags: ["評価", "原因"],
    examples: [
      { japanese: "さすが専門家だけあって、説明がわかりやすい。", meaningZh: "不愧是專家，說明很容易懂。" },
    ],
    mediaExamples: [],
    relatedPatternIds: ["bakari-ni"],
    commonMistakes: [
      "「〜だけあって」用在正面評價，與「〜ばかりに」（負面）方向相反",
    ],
  },
  {
    id: "ageku",
    level: "N2",
    pattern: "〜あげく",
    meaningZh: "～到最後（結果卻不盡人意）",
    meaningJa: "〜した末に（たいてい悪い結果）",
    formation: "動詞た形＋あげく；名詞＋の＋あげく",
    importance: "understand",
    tags: ["結果", "経過"],
    examples: [
      { japanese: "さんざん迷ったあげく、買わずに帰った。", meaningZh: "猶豫了半天，最後沒買就回去了。" },
    ],
    mediaExamples: [],
    relatedPatternIds: [],
    commonMistakes: [
      "「〜あげく」的結果幾乎總是負面或令人失望的",
    ],
  },
  {
    id: "keiyaku",
    level: "N2",
    pattern: "〜に限って",
    meaningZh: "偏偏在～的時候、只有～",
    meaningJa: "特に〜の場合に限り（悪いことが起こる）",
    formation: "名詞＋に限って",
    importance: "understand",
    tags: ["限定", "強調"],
    examples: [
      { japanese: "大事な日に限って、電車が遅れる。", meaningZh: "偏偏在重要的日子，電車就會誤點。" },
    ],
    mediaExamples: [],
    relatedPatternIds: [],
    commonMistakes: [
      "常帶「偏偏在不好的時機發生」的口氣",
    ],
  },
  {
    id: "wokeniwa-ikanai",
    level: "N2",
    pattern: "〜わけにはいかない",
    meaningZh: "不能做～（情理上不允許）",
    meaningJa: "〜するわけにはいかない／〜できない",
    formation: "動詞辞書形＋わけにはいかない",
    importance: "high_frequency",
    tags: ["禁止", "義務"],
    examples: [
      { japanese: "今日は大事な会議があるので、休むわけにはいかない。", meaningZh: "今天有重要會議，不能請假。" },
    ],
    mediaExamples: [],
    relatedPatternIds: ["zaru-wo-enai", "nakereba-naranai"],
    commonMistakes: [
      "「〜わけにはいかない」是社會常識上或情理上不能做，不是物理上的不可能",
    ],
  },
  {
    id: "zaru-wo-enai",
    level: "N2",
    pattern: "〜ざるを得ない",
    meaningZh: "不得不～",
    meaningJa: "〜するしかない／強い義務",
    formation: "動詞ない形（−ない）＋ざるを得ない",
    importance: "high_frequency",
    tags: ["義務", "必然"],
    examples: [
      { japanese: "この状況では、計画を変更せざるを得ない。", meaningZh: "在這種情況下，不得不變更計畫。" },
    ],
    mediaExamples: [],
    relatedPatternIds: ["wokeniwa-ikanai"],
  },
  {
    id: "kawarini",
    level: "N2",
    pattern: "〜かわりに",
    meaningZh: "代替～；作為交換～",
    meaningJa: "〜の代わりに／〜と引き換えに",
    formation: "名詞＋の＋かわりに；動詞辞書形＋かわりに",
    importance: "high_frequency",
    tags: ["代替", "交換"],
    examples: [
      { japanese: "母のかわりに、私が挨拶に行きました。", meaningZh: "代替母親，我去打了招呼。" },
      { japanese: "教えてもらうかわりに、昼をご馳走するよ。", meaningZh: "你教我，我請你吃午餐。" },
    ],
    mediaExamples: [],
    relatedPatternIds: [],
  },
  {
    id: "ni-kanshite",
    level: "N2",
    pattern: "〜に関して",
    meaningZh: "關於～",
    meaningJa: "〜について／〜に関連して",
    formation: "名詞＋に関して",
    importance: "high_frequency",
    tags: ["関系", "話題"],
    examples: [
      { japanese: "この問題に関しては、後日改めて議論しましょう。", meaningZh: "關於這個問題，改天再討論吧。" },
    ],
    mediaExamples: [],
    relatedPatternIds: ["ni-ōjite"],
  },
  {
    id: "ni-taishite",
    level: "N2",
    pattern: "〜に対して",
    meaningZh: "對於～；相對於～",
    meaningJa: "〜に向かって／〜と対照的に",
    formation: "名詞＋に対して",
    importance: "high_frequency",
    tags: ["対象", "対比"],
    examples: [
      { japanese: "お客様に対しては丁寧な言葉を使いましょう。", meaningZh: "對客人要使用禮貌的用語。" },
    ],
    mediaExamples: [],
    relatedPatternIds: ["ni-kanshite"],
  },
  {
    id: "ni-ōjite",
    level: "N2",
    pattern: "〜に応じて",
    meaningZh: "按照～、根據～",
    meaningJa: "〜に応じて／〜に従って",
    formation: "名詞＋に応じて",
    importance: "understand",
    tags: ["対応", "条件"],
    examples: [
      { japanese: "能力に応じて給料が決まります。", meaningZh: "薪水根據能力決定。" },
    ],
    mediaExamples: [],
    relatedPatternIds: ["ni-kanshite"],
  },
  {
    id: "tsūjite",
    level: "N2",
    pattern: "〜を通じて",
    meaningZh: "通過～；在～期間中",
    meaningJa: "〜を経由して／〜の間ずっと",
    formation: "名詞＋を通じて",
    importance: "understand",
    tags: ["手段", "期間"],
    examples: [
      { japanese: "インターネットを通じて世界中と繋がれる。", meaningZh: "透過網路可以與世界連結。" },
    ],
    mediaExamples: [],
    relatedPatternIds: ["ni-taishite"],
  },
  {
    id: "nite",
    level: "N2",
    pattern: "〜において",
    meaningZh: "在～（場合、領域、時代）",
    meaningJa: "〜で／〜の場で（改まった表現）",
    formation: "名詞＋において",
    importance: "understand",
    tags: ["場所", "時"],
    examples: [
      { japanese: "会議において、重要な決定がなされた。", meaningZh: "會議上做了重要決定。" },
    ],
    mediaExamples: [],
    relatedPatternIds: ["ni-kanshite"],
  },
  {
    id: "nakaideha",
    level: "N2",
    pattern: "〜にかけては",
    meaningZh: "在～方面、論～的話",
    meaningJa: "〜の分野では（自信がある）",
    formation: "名詞＋にかけては",
    importance: "understand",
    tags: ["分野", "評価"],
    examples: [
      { japanese: "料理にかけては、彼女の右に出る者はいない。", meaningZh: "在料理方面，沒有人比她厲害。" },
    ],
    mediaExamples: [],
    relatedPatternIds: ["ni-kanshite"],
  },
];

// 全部まとめて
export const grammarPatterns: GrammarPattern[] = [
  ...n5Patterns,
  ...n4Patterns,
  ...n2Patterns,
];
