// The absolute-beginner starter deck (#533, beginner zone #531): the first
// ~95 words a zero-base learner meets, drilled kana-only (surface === reading)
// right after the gojuon chapters and BEFORE any kanji instruction.
//
// Deck rules (locked by starterVocabulary.test.ts):
//   - surface is pure kana (ぁ-ん / ァ-ヶ / ー), reading === surface;
//   - meanings are PAIRWISE DISTINCT -- the meaning drill draws distractors
//     from this same deck, so two words sharing a meaning string would be a
//     double solution (e.g. すみません vs ごめんなさい are deliberately
//     glossed apart);
//   - every word carries en+ja meaning overlays so the deck is data-ready
//     for a localized meaning drill (the answer/option pipeline itself still
//     compares meaningZh verbatim -- an existing app-wide behaviour);
//   - ids are stable ASCII (they key SRS / mistake-pool history, #525).
//
// This deck is intentionally SEPARATE from vocabulary.ts (the conjugation
// deck): nothing here feeds the 基礎變化 drills, and only the meaning drill
// consumes it (via sessionPools' starter branch).
import type { VocabularyItem } from "./types";

export const STARTER_CATEGORIES = [
  "greetings",
  "numbers",
  "time",
  "people",
  "things",
  "verbs",
  "adjectives",
  "kosoado"
] as const;

export type StarterCategory = (typeof STARTER_CATEGORIES)[number];

type StarterSpec = [
  id: string,
  surface: string,
  meaningZh: string,
  en: string,
  ja: string,
  partOfSpeech: VocabularyItem["partOfSpeech"],
  group?: VocabularyItem["group"]
];

const DECK: Record<StarterCategory, StarterSpec[]> = {
  greetings: [
    ["starter-ohayou", "おはよう", "早安", "good morning", "朝のあいさつ", "expression"],
    ["starter-konnichiwa", "こんにちは", "你好（白天）", "hello (daytime)", "昼のあいさつ", "expression"],
    ["starter-konbanwa", "こんばんは", "你好（晚上）", "good evening", "夜、人に会ったときのあいさつ", "expression"],
    ["starter-arigatou", "ありがとう", "謝謝", "thank you", "感謝のことば", "expression"],
    [
      "starter-sumimasen",
      "すみません",
      "不好意思（呼喚／輕道歉）",
      "excuse me (to get attention); sorry",
      "謝るときや人を呼ぶときのことば",
      "expression"
    ],
    [
      "starter-gomennasai",
      "ごめんなさい",
      "對不起（認錯）",
      "I'm sorry (admitting fault)",
      "自分が悪いと認めて謝ることば",
      "expression"
    ],
    ["starter-sayounara", "さようなら", "再見", "goodbye", "別れのあいさつ", "expression"],
    ["starter-oyasuminasai", "おやすみなさい", "晚安（睡前）", "good night", "寝る前のあいさつ", "expression"],
    [
      "starter-itadakimasu",
      "いただきます",
      "開動了（飯前）",
      "said before eating",
      "食事の前のあいさつ",
      "expression"
    ],
    [
      "starter-gochisousama",
      "ごちそうさま",
      "吃飽了、多謝款待（飯後）",
      "said after eating",
      "食事の後のあいさつ",
      "expression"
    ],
    [
      "starter-hajimemashite",
      "はじめまして",
      "初次見面",
      "nice to meet you",
      "初対面のあいさつ",
      "expression"
    ],
    [
      "starter-onegaishimasu",
      "おねがいします",
      "拜託了、麻煩你",
      "please (requesting)",
      "人に頼むときのことば",
      "expression"
    ],
    ["starter-hai", "はい", "是、對", "yes", "肯定の返事", "expression"],
    ["starter-iie", "いいえ", "不、不是", "no", "否定の返事", "expression"]
  ],
  numbers: [
    ["starter-ichi", "いち", "一", "one", "数字の 1", "noun"],
    ["starter-ni", "に", "二", "two", "数字の 2", "noun"],
    ["starter-san", "さん", "三", "three", "数字の 3", "noun"],
    ["starter-yon", "よん", "四", "four", "数字の 4", "noun"],
    ["starter-go", "ご", "五", "five", "数字の 5", "noun"],
    ["starter-roku", "ろく", "六", "six", "数字の 6", "noun"],
    ["starter-nana", "なな", "七", "seven", "数字の 7", "noun"],
    ["starter-hachi", "はち", "八", "eight", "数字の 8", "noun"],
    ["starter-kyuu", "きゅう", "九", "nine", "数字の 9", "noun"],
    ["starter-juu", "じゅう", "十", "ten", "数字の 10", "noun"],
    ["starter-hyaku", "ひゃく", "百", "hundred", "数字の 100", "noun"]
  ],
  time: [
    ["starter-kyou", "きょう", "今天", "today", "この日", "noun"],
    ["starter-ashita", "あした", "明天", "tomorrow", "今日の次の日", "noun"],
    ["starter-kinou", "きのう", "昨天", "yesterday", "今日の前の日", "noun"],
    ["starter-ima", "いま", "現在", "now", "この瞬間", "noun"],
    ["starter-asa", "あさ", "早上", "morning", "一日のはじめの時間", "noun"],
    ["starter-hiru", "ひる", "中午", "noon", "正午ごろ", "noun"],
    ["starter-yoru", "よる", "晚上", "night", "日が沈んだあとの時間", "noun"],
    ["starter-mainichi", "まいにち", "每天", "every day", "どの日も", "noun"],
    ["starter-jikan", "じかん", "時間", "time", "時の長さ", "noun"],
    ["starter-tokei", "とけい", "時鐘、手錶", "clock; watch", "時刻を知る道具", "noun"]
  ],
  people: [
    ["starter-watashi", "わたし", "我", "I; me", "自分を指すことば", "noun"],
    ["starter-anata", "あなた", "你", "you", "相手を指すことば", "noun"],
    ["starter-sensei", "せんせい", "老師", "teacher", "教える人", "noun"],
    ["starter-tomodachi", "ともだち", "朋友", "friend", "親しい人", "noun"],
    ["starter-kazoku", "かぞく", "家人", "family", "親や兄弟など", "noun"],
    ["starter-okaasan", "おかあさん", "媽媽", "mother", "母を呼ぶことば", "noun"],
    ["starter-otousan", "おとうさん", "爸爸", "father", "父を呼ぶことば", "noun"],
    ["starter-kodomo", "こども", "小孩", "child", "おさない人", "noun"],
    ["starter-otoko", "おとこ", "男人", "man", "男性", "noun"],
    ["starter-onna", "おんな", "女人", "woman", "女性", "noun"],
    ["starter-hito", "ひと", "人", "person", "人間", "noun"],
    ["starter-namae", "なまえ", "名字", "name", "人や物の呼び名", "noun"]
  ],
  things: [
    ["starter-mizu", "みず", "水", "water", "飲んだり洗ったりする液体", "noun"],
    ["starter-gohan", "ごはん", "飯、餐", "rice; meal", "食事・米のめし", "noun"],
    ["starter-ie", "いえ", "房子", "house", "住む建物", "noun"],
    ["starter-gakkou", "がっこう", "學校", "school", "勉強する所", "noun"],
    ["starter-hon", "ほん", "書", "book", "読む物", "noun"],
    ["starter-kuruma", "くるま", "汽車", "car", "道路を走る乗り物", "noun"],
    ["starter-densha", "でんしゃ", "電車", "train", "線路を走る乗り物", "noun"],
    ["starter-inu", "いぬ", "狗", "dog", "ワンとなく動物", "noun"],
    ["starter-neko", "ねこ", "貓", "cat", "ニャーとなく動物", "noun"],
    ["starter-kaban", "かばん", "包包", "bag", "物を入れて持ち歩く物", "noun"],
    ["starter-keitai", "けいたい", "手機", "mobile phone", "持ち歩く電話", "noun"],
    ["starter-okane", "おかね", "錢", "money", "買い物に使う物", "noun"]
  ],
  verbs: [
    ["starter-taberu", "たべる", "吃", "to eat", "食事をする", "verb", "ichidan"],
    ["starter-nomu", "のむ", "喝", "to drink", "水などを口に入れる", "verb", "godan"],
    ["starter-iku", "いく", "去", "to go", "ある場所へ向かう", "verb", "godan"],
    ["starter-kuru", "くる", "來", "to come", "こちらへ向かう", "verb", "irregular"],
    ["starter-miru", "みる", "看、觀看", "to see; to watch", "目で物の形や様子を知る", "verb", "ichidan"],
    ["starter-kiku", "きく", "聽、問", "to listen; to ask", "耳で聞く・たずねる", "verb", "godan"],
    ["starter-hanasu", "はなす", "說、講", "to speak", "ことばを口に出す", "verb", "godan"],
    ["starter-yomu", "よむ", "閱讀（文字）", "to read", "文字を目で追う", "verb", "godan"],
    ["starter-kaku", "かく", "寫", "to write", "文字をしるす", "verb", "godan"],
    ["starter-kau", "かう", "買", "to buy", "お金を払って手に入れる", "verb", "godan"],
    ["starter-neru", "ねる", "睡覺", "to sleep", "眠る", "verb", "ichidan"],
    ["starter-okiru", "おきる", "起床", "to get up", "眠りから覚めて起き上がる", "verb", "ichidan"]
  ],
  adjectives: [
    ["starter-ookii", "おおきい", "大的", "big", "サイズが上", "i_adjective"],
    ["starter-chiisai", "ちいさい", "小的", "small", "サイズが下", "i_adjective"],
    ["starter-takai", "たかい", "高的、貴的", "high; expensive", "高さ・値段が上", "i_adjective"],
    ["starter-yasui", "やすい", "便宜的", "cheap", "値段が下", "i_adjective"],
    ["starter-atsui", "あつい", "熱的", "hot", "温度が高い", "i_adjective"],
    ["starter-samui", "さむい", "寒冷的（天氣）", "cold (weather)", "気温が低い", "i_adjective"],
    ["starter-oishii", "おいしい", "好吃的", "delicious", "味がいい", "i_adjective"],
    ["starter-tanoshii", "たのしい", "愉快的", "fun; enjoyable", "気分が明るくなる", "i_adjective"],
    ["starter-ii", "いい", "好的、良好的", "good", "望ましい", "i_adjective"],
    ["starter-warui", "わるい", "壞的", "bad", "望ましくない", "i_adjective"],
    ["starter-atarashii", "あたらしい", "新的", "new", "できたばかり", "i_adjective"],
    ["starter-furui", "ふるい", "舊的", "old (things)", "時間がたっている", "i_adjective"]
  ],
  kosoado: [
    ["starter-kore", "これ", "這個（靠近自己）", "this (near me)", "自分の近くの物", "noun"],
    ["starter-sore", "それ", "那個（靠近對方）", "that (near you)", "相手の近くの物", "noun"],
    ["starter-are", "あれ", "那個（在遠處）", "that (over there)", "どちらからも遠い物", "noun"],
    ["starter-koko", "ここ", "這裡", "here", "自分のいる場所", "noun"],
    ["starter-doko", "どこ", "哪裡", "where", "場所をたずねることば", "noun"],
    ["starter-nani", "なに", "什麼", "what", "物事をたずねることば", "noun"],
    ["starter-dare", "だれ", "誰", "who", "人をたずねることば", "noun"],
    ["starter-itsu", "いつ", "什麼時候", "when", "時をたずねることば", "noun"],
    ["starter-ikura", "いくら", "多少錢", "how much", "値段をたずねることば", "noun"],
    ["starter-dou", "どう", "怎麼樣", "how; what about", "様子をたずねることば", "adverb"],
    ["starter-dore", "どれ", "哪個", "which one", "いくつかの中から選んでたずねることば", "noun"],
    ["starter-soko", "そこ", "那裡（靠近對方）", "there (near you)", "相手のいる場所", "noun"]
  ]
};

function toItem(spec: StarterSpec, category: StarterCategory): VocabularyItem {
  const [id, surface, meaningZh, en, ja, partOfSpeech, group] = spec;
  return {
    id,
    surface,
    reading: surface,
    meaningZh,
    meaningI18n: { en, ja },
    partOfSpeech,
    group: group ?? null,
    lesson: null,
    tags: ["starter", category],
    examples: [],
    level: "N5"
  };
}

export const starterVocabulary: VocabularyItem[] = STARTER_CATEGORIES.flatMap((category) =>
  DECK[category].map((spec) => toItem(spec, category))
);
