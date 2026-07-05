// Blog / 文章 article BODIES (#483). The prose blocks for each article; the
// lightweight metadata (title / description / tag / date / draft) + the
// canonical article list live in ./articlesMeta, which eager consumers (SEO,
// sitemap) import instead so this prose stays off the initial bundle. Only the
// lazy Blog pages import this module.
//
// CONTENT-VISIBILITY: every article is zh-Hant-only content. The whole blog
// view is gated behind `language === "zh-Hant"` in App.tsx (same gate as the
// grammar index), so these strings never render for ja/en users.
//
// Song articles NEVER reproduce copyrighted lyrics: a `lyricPoint` block
// carries a `[歌詞片段]` placeholder the author fills in by hand; the
// surrounding commentary + example sentences are original.
import { articleMetas, articleMetaBySlug, type ArticleMeta } from "./articlesMeta";

export type { ArticleMeta } from "./articlesMeta";

// A challenge deep-link target (maps to openChallenge in App) or a grammar
// point page. Keeps article CTAs pointed at real practice, not dead ends.
export type ArticleCta =
  | { kind: "challenge"; mode: "daily" | "vocab" | "review" | "exam"; label: string }
  | { kind: "grammar"; surface: string; label: string };

export type ArticleBlock =
  | { kind: "lead"; text: string }
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "callout"; text: string }
  // A vocab table: word + reading + gloss + a usage note (may embed an
  // original example sentence).
  | { kind: "vocab"; items: ReadonlyArray<{ word: string; reading: string; meaning: string; note?: string }> }
  // External resource links (opened in a new tab): the official YouTube MV,
  // a legal full-lyrics site (歌ネット / Uta-Net …), etc. We link OUT to full
  // lyrics rather than reproduce them.
  | { kind: "links"; label?: string; items: ReadonlyArray<{ label: string; url: string }> }
  // A lyric-commentary block. `lyric` is a placeholder the author replaces
  // with a short fragment by hand (we never generate lyric text); `points`
  // are the original Japanese-learning notes drawn from it. `timestamp` is an
  // optional "where it appears in the MV" tag, e.g. "01:23".
  | { kind: "lyricPoint"; lyric: string; timestamp?: string; points: ReadonlyArray<string> }
  | { kind: "cta"; cta: ArticleCta };

export interface BlogArticle extends ArticleMeta {
  body: ReadonlyArray<ArticleBlock>;
}

// Body blocks keyed by slug. Every slug in articleMetas must have an entry
// here (articles.test.ts guards it: an article whose body resolves to []
// fails the non-empty-body check).
const BODIES: Record<string, ReadonlyArray<ArticleBlock>> = {
  "oshikatsu-slang-nyumon": [
    {
      kind: "lead",
      text: "只要你有在追日本偶像、聲優或動漫角色，翻 X（Twitter）、看演唱會回報、逛周邊，就會一直撞到一批「課本不會教、但粉絲天天用」的日文。這篇把最核心的 10 個推し活流行語整理好，讀音、意思、語感、例句一次給你。"
    },
    {
      kind: "paragraph",
      text: "「推し活（おしかつ）」就是「為了應援自己喜歡的對象而做的各種活動」——看演出、買周邊、投票、剪影片都算。日本 2024 年的調查裡，每 3～4 個上班族就有 1 個有在推し活，所以這些詞早就不只在小圈子裡，SNS、綜藝、廣告都在用。"
    },
    { kind: "heading", text: "先記這 5 個核心詞" },
    {
      kind: "vocab",
      items: [
        {
          word: "推し",
          reading: "おし",
          meaning: "自己最推、最想應援的對象（偶像／角色／選手）。",
          note: "動詞「推す（おす）」的名詞化。例：私の推しはあの子です（我最推的是那個女生）。"
        },
        {
          word: "推し活",
          reading: "おしかつ",
          meaning: "為了應援推し而做的一切活動的總稱。",
          note: "推し＋活動。例：週末はずっと推し活してた（週末整個都在追星）。"
        },
        {
          word: "尊い",
          reading: "とうとい",
          meaning: "本義「尊貴」，粉絲圈引申成「太美好了、我不行了」的讚嘆。",
          note: "常疊成「尊すぎる」。看到推し的瞬間脫口而出的那種。"
        },
        {
          word: "沼",
          reading: "ぬま",
          meaning: "「沼澤」，比喻一入坑就爬不出來的興趣領域。",
          note: "「沼落ち（ぬまおち）」＝掉進坑。例：気づいたら沼にハマってた（回過神已經深陷其中）。"
        },
        {
          word: "神対応",
          reading: "かみたいおう",
          meaning: "偶像對粉絲超級好的應對，神級待遇。",
          note: "神＝極致。反義是「塩対応（しおたいおう）」＝冷淡對應。"
        }
      ]
    },
    { kind: "heading", text: "SNS 上天天刷到的說法" },
    {
      kind: "vocab",
      items: [
        {
          word: "レベチ",
          reading: "レベチ",
          meaning: "「レベルが違う」的縮寫——等級不同、遙遙領先。",
          note: "誇實力或顏值。例：あの子、可愛さがレベチ（那孩子的可愛程度不是同一個檔次）。"
        },
        {
          word: "エモい",
          reading: "エモい",
          meaning: "來自英文 emotional，形容又美又感傷、觸動情緒。",
          note: "常用在畫面、瞬間、歌。例：この曲、めっちゃエモい（這首歌超有感）。"
        },
        {
          word: "現場",
          reading: "げんば",
          meaning: "演唱會、活動的「現場」。",
          note: "「現場に行く」＝去看演出。粉絲圈超高頻。"
        },
        {
          word: "参戦",
          reading: "さんせん",
          meaning: "本義「參戰」，粉絲圈＝去參加演唱會／活動。",
          note: "例：明日のライブ、参戦します！（明天的演唱會我要去！）"
        },
        {
          word: "供給",
          reading: "きょうきゅう",
          meaning: "官方／偶像釋出的內容（照片、影片、活動）。",
          note: "「供給が多い」＝官方很寵粉；「供給が足りない」＝內容不夠看。"
        }
      ]
    },
    {
      kind: "callout",
      text: "語感提醒：這些幾乎都是「輕鬆、朋友之間」的說法，別用在敬語場合或對長輩、對工作對象。「尊い」「エモい」寫在正式文章裡也會顯得很跳。先聽得懂、SNS 上看得懂，比急著用更重要。"
    },
    {
      kind: "paragraph",
      text: "把這 10 個記熟，你再去翻推し的 X、看 live 回報，會突然看懂一大半。之後我們會陸續補上更多主題——日常口語、綜藝字幕、日劇台詞、從歌詞學日文⋯⋯歡迎在意見回饋許願想看的題目。"
    },
    {
      kind: "cta",
      cta: { kind: "challenge", mode: "daily", label: "想把日文底子練穩？去今日練習刷一輪 →" }
    }
  ],
  "idol-song-nihongo-template": [
    {
      kind: "callout",
      text: "這是一篇「範本」文章：架構與可留用的原創例句都寫好了。做法是——完整歌詞用外部連結帶出去（不轉載），只把要解說的短短幾句貼進 [歌詞片段] 的位置，其餘都是自己的日文解說。這樣既合法（引用／教學用途），內容也是你的原創資產。"
    },
    { kind: "heading", text: "歌曲介紹" },
    {
      kind: "paragraph",
      text: "（在這裡寫：歌名、團體／歌手、發行時間，還有這首歌在唱什麼、氛圍如何、為什麼想用它來教日文。兩三句就好，帶讀者入戲。）"
    },
    {
      kind: "links",
      label: "先聽 & 看完整歌詞",
      items: [
        { label: "官方 MV（YouTube）", url: "https://www.youtube.com/" },
        { label: "完整歌詞（歌ネット等合法歌詞網）", url: "https://www.uta-net.com/" }
      ]
    },
    {
      kind: "callout",
      text: "把上面兩個連結換成這首歌的官方 MV 與合法歌詞頁（如 歌ネット／Uta-Net）。讀者點過去就能邊聽邊看完整歌詞，你只留片段來解說即可。"
    },
    { kind: "heading", text: "挑幾句歌詞來學" },
    {
      kind: "lyricPoint",
      lyric: "[歌詞片段 1]",
      timestamp: "MV 00:00",
      points: [
        "文法：（這句用到的句型，例如「〜たい／〜てしまう／〜ずっと」，用一句話解釋。）",
        "生字：（挑 1～2 個字，標讀音與意思。）",
        "語感：（為什麼這樣寫、換個說法會差在哪。）"
      ]
    },
    {
      kind: "lyricPoint",
      lyric: "[歌詞片段 2]",
      timestamp: "MV 00:00",
      points: [
        "文法：（同上，換一個點。）",
        "生字：（1～2 個。）",
        "語感：（歌詞裡常見的省略／倒裝，說明一下。）"
      ]
    },
    {
      kind: "lyricPoint",
      lyric: "[歌詞片段 3]",
      timestamp: "MV 00:00",
      points: ["文法：（副歌常出現的關鍵句。）", "生字：（1～2 個。）", "語感：（一句收尾。）"]
    },
    { kind: "heading", text: "偶像曲很常出現的日文（原創例句，可直接留用）" },
    {
      kind: "paragraph",
      text: "下面這些字幾乎是 J-pop／偶像曲的常客。先記起來，之後聽任何一首都會一直遇到。例句都是原創、跟任何特定歌曲無關，可以安心留在文章裡。"
    },
    {
      kind: "vocab",
      items: [
        {
          word: "輝き",
          reading: "かがやき",
          meaning: "光輝、閃耀。",
          note: "動詞「輝く」的名詞形。例：君の笑顔が輝いてる（你的笑容在發光）。"
        },
        {
          word: "切ない",
          reading: "せつない",
          meaning: "揪心、又酸又甜的難受。",
          note: "情歌最愛用。例：会えない夜は切ない（見不到面的夜晚很揪心）。"
        },
        {
          word: "かけがえのない",
          reading: "かけがえのない",
          meaning: "無可取代的。",
          note: "接名詞。例：かけがえのない時間（無可取代的時光）。"
        },
        {
          word: "約束",
          reading: "やくそく",
          meaning: "約定。",
          note: "例：あの日の約束を覚えてる（我記得那天的約定）。"
        },
        {
          word: "瞬間",
          reading: "しゅんかん",
          meaning: "瞬間、剎那。",
          note: "例：目が合った瞬間（四目相接的那一瞬間）。"
        },
        {
          word: "涙",
          reading: "なみだ",
          meaning: "眼淚。",
          note: "例：涙が止まらない（眼淚止不住）。"
        }
      ]
    },
    {
      kind: "cta",
      cta: { kind: "challenge", mode: "vocab", label: "把這些單字練熟：去單字讀音刷一輪 →" }
    }
  ]
};

function withBody(meta: ArticleMeta): BlogArticle {
  return { ...meta, body: BODIES[meta.slug] ?? [] };
}

// Full articles (metadata + body), newest first. Draft articles stay in the
// list (rendered in-app with a 準備中 badge) but are excluded from the sitemap.
export const articles: ReadonlyArray<BlogArticle> = articleMetas.map(withBody);

export const publishedArticles: ReadonlyArray<BlogArticle> = articles.filter((a) => !a.draft);

export function articleBySlug(slug: string): BlogArticle | undefined {
  const meta = articleMetaBySlug(slug);
  return meta ? withBody(meta) : undefined;
}
