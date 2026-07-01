import type { GrammarNoteOverlays } from "./grammarNoteText";

/**
 * Per-locale text overlays for the grammar-point reference notes, keyed by
 * `surface`. Data-only and imported by the (lazy) GrammarNoteCard, so it rides
 * in the lazy challenge chunk alongside grammarNotes itself — never the eager
 * bundle. Only the Chinese prose is overlaid; Japanese examples and identifiers
 * are never touched. Populated by the study-content translation pass (#400).
 */
export const grammarNoteI18n: GrammarNoteOverlays = {
  "ばかりに": {
    "en": {
      "meaningZh": "just because… (which is exactly what led to a bad outcome)",
      "formation": "plain form of a verb / い-adjective ＋ ばかりに; な-adjective ＋ な / noun ＋ である ＋ ばかりに",
      "usageZh": "Emphasizes that it was precisely this one cause that brought about the (usually negative, regrettable) result that follows, carrying a tone of regret and frustration.",
      "examplesZh": [
        "Just because I said one word too many, I ended up making him angry."
      ],
      "confusions": [
        "だけあって: a positive appraisal (living up to expectations), so the direction is the opposite.",
        "せいで: simply pins the blame on a negative cause, without the 'precisely because of this' emphasis or the note of regret."
      ]
    },
    "ja": {
      "meaningZh": "ほかでもなく～が原因で(よくない結果を招いてしまう)",
      "formation": "動詞・い形容詞の普通形＋ばかりに；な形容詞＋な／名詞＋である＋ばかりに",
      "usageZh": "「まさにこの原因があったからこそ」後件の(多くは否定的で悔やまれる)結果を招いたことを強調し、後悔や無念の気持ちを込めた言い方。",
      "examplesZh": [
        "余計な一言を言ってしまったせいで、彼を怒らせてしまった。"
      ],
      "confusions": [
        "だけあって：肯定的な評価(さすが～だ)を表し、方向が正反対である。",
        "せいで：否定的な原因を単に責めるだけで、「まさにそのために」という強調や悔やむニュアンスはない。"
      ]
    }
  },
  "だけあって": {
    "en": {
      "meaningZh": "as one would expect of…; precisely because… (and so, naturally, excellent)",
      "formation": "noun / plain form of a verb / い-adjective ＋ だけあって; な-adjective ＋ な ＋ だけあって",
      "usageZh": "Expresses that 'precisely because of some status, background, or condition, the result naturally follows,' leading into an appraisal (usually positive and admiring) that lives up to that premise.",
      "examplesZh": [
        "As you'd expect of a first-class hotel, the service is impeccable."
      ],
      "confusions": [
        "ばかりに: a negative consequence tinged with regret, so the direction is the opposite.",
        "おかげで: simply credits some cause, without the nuance of 'living up to its reputation, as one would expect.'"
      ]
    },
    "ja": {
      "meaningZh": "さすが～だけのことはある；まさに～だからこそ(当然のように優れている)",
      "formation": "名詞／動詞・い形容詞の普通形＋だけあって；な形容詞＋な＋だけあって",
      "usageZh": "「ある身分・経歴・条件があるからこそ、結果も当然そうなる」ことを表し、その前提にふさわしい(多くは肯定的で感心させられる)評価が続く。",
      "examplesZh": [
        "さすが一流ホテルだけあって、サービスが行き届いている。"
      ],
      "confusions": [
        "ばかりに：後悔を伴う否定的な結果を表し、方向が正反対である。",
        "おかげで：ある原因のおかげだと単に述べるだけで、「名実相応で当然だ」というニュアンスはない。"
      ]
    }
  },
  "なり": {
    "en": {
      "meaningZh": "the moment… (immediately) …",
      "formation": "dictionary form of a verb ＋ なり",
      "usageZh": "Indicates that the second action follows (often unexpectedly) the instant the first one has just occurred; the subject is the same for both clauses, and the second is often a surprising act witnessed by the speaker.",
      "examplesZh": [
        "The moment he sat down, he began talking a mile a minute, as if a dam had burst."
      ],
      "confusions": [
        "たとたん: 'the moment…,' but なり places more emphasis on the same person's very next action following immediately.",
        "次第: 'as soon as…,' with a more formal, businesslike tone; the second clause is usually a volitional arrangement."
      ]
    },
    "ja": {
      "meaningZh": "～すると(すぐに)～する",
      "formation": "動詞の辞書形＋なり",
      "usageZh": "前の動作が起こった直後、(しばしば意外にも)すぐに後件を行うことを表す。前後は同一主語で、後件は話し手が目撃した意外な行動であることが多い。",
      "examplesZh": [
        "彼は席に着くなり、堰を切ったように話し始めた。"
      ],
      "confusions": [
        "たとたん：「～するとすぐに」だが、「なり」は同一人物が直後に取る次の動作をより強調する。",
        "次第：「～するとすぐに」だが、語感が改まって事務的で、後件は意志的な取り決めであることが多い。"
      ]
    }
  },
  "あげく": {
    "en": {
      "meaningZh": "in the end, after all… (only to end up with a — usually negative — result)",
      "formation": "plain past form of a verb ＋ あげく; noun ＋ の ＋ あげく",
      "usageZh": "Indicates that after a great deal of (prolonged or repeated) trouble and effort, one ends up with some (usually undesirable) result.",
      "examplesZh": [
        "After agonizing over it forever, I ended up going home without buying anything."
      ],
      "confusions": [
        "すえに: 'after … one finally arrives at a result,' but the result can be either good or bad, with a more formal tone.",
        "結果: a neutral statement of the outcome, without the nuance of the hardship of 'going through a lot of trouble.'"
      ]
    },
    "ja": {
      "meaningZh": "～した末に(結局、多くは否定的な結果になる)",
      "formation": "動詞のた形＋あげく；名詞＋の＋あげく",
      "usageZh": "(長時間または繰り返し)さんざん苦労した末に、最終的にある(たいていよくない)結果に至ることを表す。",
      "examplesZh": [
        "さんざん迷ったあげく、結局何も買わずに帰った。"
      ],
      "confusions": [
        "すえに：「～した末に結果を得る」だが、結果は良い場合も悪い場合もあり、語感がより改まっている。",
        "結果：中立的な事実の陳述で、「さんざん苦労した」という苦労のニュアンスはない。"
      ]
    }
  },
  "っぱなし": {
    "en": {
      "meaningZh": "leaving something … (left as it is, unattended — usually implying negligence / a negative sense)",
      "formation": "ます-stem of a verb (drop ます) ＋ っぱなし",
      "usageZh": "Indicates that after doing some action, one leaves it unattended when it ought to be wrapped up, so the state simply persists — often carrying the negative nuance of 'not doing the follow-up that should have been done.'",
      "examplesZh": [
        "I was brushing my teeth with the tap left running."
      ],
      "confusions": [
        "たまま: merely keeps a state unchanged, with a neutral tone; っぱなし carries the reproachful sense of 'left undone when it should have been dealt with.'",
        "ておく: deliberately keeping a state for some purpose — it is intentional, unlike simply leaving something neglected."
      ]
    },
    "ja": {
      "meaningZh": "～したまま(放っておく。多くは不注意・否定的な意味を含む)",
      "formation": "動詞のます形(ますを取る)＋っぱなし",
      "usageZh": "ある動作をした後、始末をつけるべきなのに放置し、その状態がずっと続くことを表す。しばしば「やるべき後始末をしていない」という否定的なニュアンスを伴う。",
      "examplesZh": [
        "水を出しっぱなしにして、歯を磨いていた。"
      ],
      "confusions": [
        "たまま：ある状態をそのまま保つだけで語感は中立的。「っぱなし」は「始末すべきなのにしていない」という非難のニュアンスを帯びる。",
        "ておく：ある目的のために「意図的に」状態を保つもので、意図があり、放置とは異なる。"
      ]
    }
  }
};
