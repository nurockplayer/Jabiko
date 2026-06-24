// Reusable grammar-point reference notes (issue #137): meaning / formation
// / usage / examples / easily-confused points for a 文法点, keyed by its
// `surface` (the exam item's surface, e.g. "ばかりに"). Looked up from the
// post-answer feedback to close the wrong -> learn loop, and reused by the
// #97 exam-prep learning tier -- so this stays a neutral data module with
// NO React / UI / heavy-data imports. It is pulled only inside the lazy
// challenge chunk (via FeedbackPanel), same layer as examBlocks, so it
// never drags weight into the initial bundle.
//
// Content is added in small batches; an un-noted point simply has no entry
// (lookup returns null and the feedback entry point is hidden -- never an
// error). Explanations are original rewrites, not copied from textbooks.
import type { JlptLevel } from "./types";

export type GrammarNoteExample = { ja: string; zh: string };

export type GrammarNote = {
  /** Grammar-point surface; matches the exam item's `vocabulary.surface`. */
  surface: string;
  jlptLevel: JlptLevel | null;
  meaningZh: string;
  /** 接續 — how the pattern attaches to the preceding word. */
  formation: string;
  /** 用法 / 語感 — when and why it's used, the nuance it carries. */
  usageZh: string;
  examples: GrammarNoteExample[];
  /** 易混點 — nearby patterns and how this one differs. */
  confusions: string[];
};

export const grammarNotes: Record<string, GrammarNote> = {
  ばかりに: {
    surface: "ばかりに",
    jlptLevel: "N2",
    meaningZh: "就因為…（才導致不好的結果）",
    formation: "動詞・い形容詞普通形＋ばかりに；な形＋な／名詞＋である＋ばかりに",
    usageZh: "強調『正是因為這個原因』才招致後面（多為負面、令人懊悔）的結果，帶後悔、不甘的語氣。",
    examples: [
      { ja: "よけいな一言を言ったばかりに、彼を怒らせてしまった。", zh: "就因為多說了一句話，把他給惹火了。" }
    ],
    confusions: [
      "だけあって：是正面評價（不愧是…），方向相反",
      "せいで：單純歸咎於負面原因，沒有『正因如此』的強調與懊悔語氣"
    ]
  },
  だけあって: {
    surface: "だけあって",
    jlptLevel: "N2",
    meaningZh: "不愧是…、正因為…（所以理所當然地出色）",
    formation: "名詞／動詞・い形容詞普通形＋だけあって；な形＋な＋だけあって",
    usageZh: "表『正因為有某身分、經歷或條件，結果自然如此』，後接與前提相稱的（多為正面、令人佩服的）評價。",
    examples: [
      { ja: "さすが一流ホテルだけあって、サービスが行き届いている。", zh: "不愧是一流飯店，服務無微不至。" }
    ],
    confusions: [
      "ばかりに：是負面後果、帶懊悔，方向相反",
      "おかげで：單純歸功於某原因，沒有『名實相符、理所當然』的語感"
    ]
  },
  なり: {
    surface: "なり",
    jlptLevel: "N1",
    meaningZh: "一…就（立刻）…",
    formation: "動詞辭書形＋なり",
    usageZh: "表前一個動作才剛發生、緊接著（往往出乎意料地）就做了後項；前後為同一主語，後項常是說話者目睹的意外舉動。",
    examples: [
      { ja: "彼は席に着くなり、堰を切ったように話し始めた。", zh: "他一坐下，就像決堤般滔滔不絕地說了起來。" }
    ],
    confusions: [
      "たとたん：一…就…，但『なり』更強調同一人緊接著的下一個動作",
      "次第：一…就…，語感較鄭重、事務性，後項多為意志性安排"
    ]
  },
  あげく: {
    surface: "あげく",
    jlptLevel: "N2",
    meaningZh: "…到最後（結果卻，多為負面）",
    formation: "動詞た形＋あげく；名詞＋の＋あげく",
    usageZh: "表經過一番（長時間或反覆的）折騰之後，最終落得某個（通常不好的）結果。",
    examples: [
      { ja: "さんざん迷ったあげく、結局何も買わずに帰った。", zh: "猶豫了老半天，結果什麼都沒買就回去了。" }
    ],
    confusions: [
      "すえに：經過…最後得到結果，但結果可正可負、語感較鄭重",
      "結果：中性陳述，沒有『折騰一番』的辛苦語感"
    ]
  },
  っぱなし: {
    surface: "っぱなし",
    jlptLevel: "N2",
    meaningZh: "一直…著（放著不管，多含疏忽／負面）",
    formation: "動詞ます形（去ます）＋っぱなし",
    usageZh: "表某動作做了之後、該收尾卻放著不處理，使狀態一直持續，常帶『沒做該做的後續』的負面語感。",
    examples: [
      { ja: "水を出しっぱなしにして、歯を磨いていた。", zh: "開著水龍頭沒關就在刷牙。" }
    ],
    confusions: [
      "たまま：只是保持某狀態不變、語感中性；『っぱなし』帶『該收而沒收』的責備意味",
      "ておく：為某目的『刻意』保持狀態，是有意圖的，與放任不管不同"
    ]
  }
};

/**
 * Full reference note for a grammar point if the bank has one, else null.
 * Points without a note are not an error -- the feedback entry point is
 * simply hidden, and notes are filled in batch by batch.
 */
export function lookupGrammarNote(surface: string): GrammarNote | null {
  return grammarNotes[surface] ?? null;
}
