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
import { ebichiliBody } from "./articleBodies/ebichili";
import { sweetStepBody } from "./articleBodies/sweetStep";
import { tasteExpressionsBody } from "./articleBodies/tasteExpressions";

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
  // A labelled section break splitting the essay (top) from the Japanese-
  // teaching half (bottom). Rendered as a horizontal rule with a centred
  // label; articles.test.ts guards that every vocab block sits below it.
  | { kind: "divider"; label: string }
  | { kind: "cta"; cta: ArticleCta };

export interface BlogArticle extends ArticleMeta {
  body: ReadonlyArray<ArticleBlock>;
}

// Body blocks keyed by slug. Every slug in articleMetas must have an entry
// here (articles.test.ts guards it: an article whose body resolves to []
// fails the non-empty-body check).
const BODIES: Record<string, ReadonlyArray<ArticleBlock>> = {
  "cho-saikyo-tokimeki": [
    {
      kind: "lead",
      text: "先說為什麼挑這首：〈超最強〉不是只有粉絲圈自己很嗨。官方資料把它列成 TikTok 音樂チャート「トップ50」6 週連續第 1、總播放突破 25 億回，還拿下「TikTokトレンド大賞2025」インパクト・ソング部門賞。這些數字不用寫太多，但足夠說明一件事：它真的把推し活的日文，帶到了更大的短影音語境裡。"
    },
    {
      kind: "paragraph",
      text: "超ときめき♡宣伝部的〈超最強〉表面是一首超自信、超撒嬌、一直要求你說她可愛的偶像歌。可是拿來學日文時，最有趣的不是「她好可愛」而已，而是它把推し活本身寫成一套語言：手機相簿、鎖屏、小卡、壓克力吊飾、絨毛娃娃、留言、按讚、ハッシュタグ、レポ、布教。這些都不是抽象戀愛，而是粉絲每天真的會做的事。"
    },
    { kind: "heading", text: "團體與世界觀" },
    {
      kind: "paragraph",
      text: "團名裡的 ときめき 是「心動、怦然」的意思。她們的招呼語「君のハートにロックオン」也很直球：ロックオン 是 lock on，鎖定目標。抓住這個世界觀就夠了——這團不是遠遠站著等你喜歡她，而是主動把心動丟過來，叫你接住。〈超最強〉也延續這種語感，所以歌裡的撒嬌不是軟弱，而是一種很用力的進攻。"
    },
    { kind: "heading", text: "這首歌在唱什麼" },
    {
      kind: "paragraph",
      text: "〈超最強〉不是單純自信，也不是單純自戀。它的視角很妙：偶像不是害羞地問「我可愛嗎」，而是理直氣壯地把粉絲的追星行為一項項點名——設成鎖屏、隨身帶小卡和娃娃、留言按讚寫レポ、用 hashtag 到處布教她。聽起來很任性，但歌裡同時也知道，偶像的可愛是被粉絲的留言、いいね、レポ、現場 call 一點一點養起來的。"
    },
    {
      kind: "paragraph",
      text: "所以 live 裡那聲「かわいい！」不是硬塞互動，而是在完成這首歌的邏輯。粉絲說偶像可愛，偶像因為被這樣肯定而變得更可愛，再把這份可愛還給粉絲。這裡的 かわいい 不是單方面供給，比較像一個來回循環。聽懂這點，再看歌裡的推し活詞彙，就不會只覺得它是在列周邊和 SNS 行為。"
    },
    { kind: "heading", text: "為什麼〈超最強〉很強？" },
    {
      kind: "paragraph",
      text: "〈超最強〉真正厲害的地方，是把粉絲平常覺得有點宅、有點不好意思的行為，全都唱成理直氣壯的可愛——設鎖屏、相簿全是她、把小卡夾進手機殼、帶著娃娃出門、留言按讚寫レポ布教。這些不是粉絲單方面沉迷，而是偶像和粉絲一起完成的循環。粉絲喊「かわいい！」，偶像接住這份肯定，變得更可愛，再把可愛還給粉絲。聽懂這個循環，推し、布教、レス、レポ 這些詞就不只是粉絲圈術語，而是這首歌真正運作的文法。"
    },
    {
      kind: "links",
      label: "官方 MV 與背景資料",
      items: [
        {
          label: "超ときめき♡宣伝部「超最強」官方 MV（YouTube）",
          url: "https://www.youtube.com/watch?v=Yeahpo-0Ub4"
        },
        {
          label: "STARDUST 官方介紹：TikTok 成績與受賞紀錄",
          url: "https://www.stardust.co.jp/talent/section3/sendenbu/"
        },
        {
          label: "テレビ朝日：TikTokトレンド大賞2025 受賞報導",
          url: "https://news.tv-asahi.co.jp/news_geinou/articles/000471077.html"
        },
        {
          label: "avex：TikTok Top50 連續首位與 5 億播放報導",
          url: "https://avexnet.jp/news/1025000"
        }
      ]
    },
    { kind: "divider", label: "日文教學" },
    {
      kind: "callout",
      text: "下面挑的是歌裡值得學的日文「單字與說法」。不整理完整歌詞，也不把它寫成粉絲頁；重點是看這些詞在偶像歌和推し活裡怎麼用。例句都是原創。"
    },
    { kind: "heading", text: "推し活・SNS 生字" },
    {
      kind: "vocab",
      items: [
        {
          word: "推し",
          reading: "おし",
          meaning: "最喜歡、最想應援的對象。",
          note: "整首歌的主角。例：私の推しはいつ見てもかわいい（我推不管什麼時候看都可愛）。"
        },
        {
          word: "推し活",
          reading: "おしかつ",
          meaning: "為喜歡的對象應援、消費、分享、參加活動等一連串行為。",
          note: "不是只有花錢，也包含留言、按讚、寫レポ。例：週末は友達と推し活をする（週末和朋友一起追推）。"
        },
        {
          word: "布教",
          reading: "ふきょう",
          meaning: "本義「傳教」，粉絲圈引申成到處推坑、安利。",
          note: "例：友達に推しを布教しまくってる（一直跟朋友安利我推）。"
        },
        {
          word: "トレカ",
          reading: "トレーディングカード",
          meaning: "小卡（交換卡）。",
          note: "縮寫。例：推しのトレカ、やっと引けた（終於抽到我推的小卡）。"
        },
        {
          word: "アクキー",
          reading: "アクリルキーホルダー",
          meaning: "壓克力鑰匙圈／吊飾。",
          note: "縮寫。例：バッグにアクキーを付けて持ち歩く（把壓克力吊飾掛包包上帶著走）。"
        },
        {
          word: "ぬい",
          reading: "ぬいぐるみ",
          meaning: "絨毛娃娃；粉絲圈常指推し相關的小娃娃。",
          note: "縮寫。例：推しのぬいを連れてカフェに行く（帶著我推的娃娃去咖啡廳）。"
        },
        {
          word: "カメラロール",
          reading: "カメラロール",
          meaning: "手機的「相簿／相機膠卷」。",
          note: "例：カメラロールが推しの写真でいっぱい（相簿全是我推的照片）。"
        },
        {
          word: "ロック画面",
          reading: "ロックがめん",
          meaning: "手機的鎖定畫面（鎖屏）。",
          note: "例：ロック画面はもちろん推し（鎖屏當然是我推）。主畫面則叫「ホーム画面」。"
        },
        {
          word: "ケース",
          reading: "ケース",
          meaning: "（手機）殼；也泛指盒／套。",
          note: "例：透明のスマホケースにトレカを挟む（把小卡夾進透明手機殼）。"
        },
        {
          word: "スマホ",
          reading: "スマートフォン",
          meaning: "智慧型手機。",
          note: "「スマートフォン」的縮寫，日常幾乎只說スマホ。例：スマホばっかり見てる（一直盯著手機）。"
        },
        {
          word: "レス・レポ",
          reading: "レスポンス・レポート",
          meaning: "レス＝偶像的回應／互動；レポ＝（演唱會等的）心得回報。",
          note: "都是英文縮寫。例：昨日のライブのレポを書いた（寫了昨天演唱會的心得）。"
        },
        {
          word: "コメント・いいね・ハッシュタグ",
          reading: "コメント・いいね・ハッシュタグ",
          meaning: "留言・按讚・主題標籤——SNS 應援三件套。",
          note: "例：コメントもいいねもハッシュタグも、全部使って応援する（留言按讚主題標籤全用上應援）。"
        }
      ]
    },
    { kind: "heading", text: "心動・戀愛的擬態語＆外來語" },
    {
      kind: "vocab",
      items: [
        {
          word: "ズッキュン",
          reading: "ズッキュン",
          meaning: "心被射中、瞬間怦然心動的擬態語。",
          note: "很漫畫感的詞。例：不意の笑顔にズッキュンした（被冷不防的笑容電到）。"
        },
        {
          word: "ロックオン",
          reading: "ロックオン",
          meaning: "英文 lock on，鎖定（目標、對象）。",
          note: "例：気になる新商品にロックオンした（鎖定了在意的新商品）。"
        },
        {
          word: "ゾッコン",
          reading: "ゾッコン",
          meaning: "徹底迷上、神魂顛倒（帶點老派俏皮）。",
          note: "例：あの子にゾッコンで毎日会いたい（對那孩子完全著迷、天天想見）。"
        },
        {
          word: "ちやほや",
          reading: "ちやほや",
          meaning: "眾星拱月地捧、寵。",
          note: "常用「ちやほやされる（被捧）」。例：みんなにちやほやされたい（想被大家捧）。"
        },
        {
          word: "かわいがる",
          reading: "かわいがる",
          meaning: "疼愛、寵。",
          note: "例：うちの猫、すごくかわいがってる（超疼我家的貓）。"
        },
        {
          word: "尊い",
          reading: "とうとい",
          meaning: "本義「尊貴」，粉絲圈＝太美好、我不行了。",
          note: "歌裡偶像反過來說粉絲「尊い」很有梗。例：尊すぎて語彙力が消えた（尊到詞窮）。"
        }
      ]
    },
    { kind: "heading", text: "順便學的口語與文法" },
    {
      kind: "vocab",
      items: [
        {
          word: "〜なきゃ",
          reading: "〜なきゃ",
          meaning: "「〜なければ（不…就）」的口語縮約，常省略後半＝「非得…不可」。",
          note: "例：もう行かなきゃ（我得走了）。／そうじゃなきゃダメ（不那樣不行）。"
        },
        {
          word: "むしろ",
          reading: "むしろ",
          meaning: "反倒、與其說…不如說。",
          note: "推翻前面、給出更貼切的說法。例：嫌いじゃない、むしろ好き（不是討厭，反倒喜歡）。"
        },
        {
          word: "過去一",
          reading: "かこいち",
          meaning: "俗語，「有史以來最…／史上第一」。",
          note: "「過去一番」的縮寫。例：今日のライブ、過去一よかった（今天的演唱會是至今最讚的一場）。"
        },
        {
          word: "とか",
          reading: "とか",
          meaning: "口語的「像是…之類的」，舉例或帶點含糊。",
          note: "例：「疲れた」とか言ってサボる（說「好累」之類的偷懶）。"
        },
        {
          word: "〜分",
          reading: "ぶん",
          meaning: "「…的份量／程度」，接動詞後表「做多少就有多少」。",
          note: "例：頑張った分だけ結果が出る（付出多少就有多少回報）。"
        },
        {
          word: "揺るがない",
          reading: "ゆるがない",
          meaning: "不動搖、堅定不移。",
          note: "動詞「揺るぐ」的否定。例：何を言われても決意は揺るがない（不管被說什麼決心都不動搖）。"
        },
        {
          word: "後ろ向き",
          reading: "うしろむき",
          meaning: "字面「面朝後／背對」，引申「消極、負面」。",
          note: "反義「前向き（積極）」。例：後ろ向きに考えないで（別往壞處想）。"
        },
        {
          word: "一言一句",
          reading: "いちごんいっく",
          meaning: "一字一句、每一個字。",
          note: "例：先生の話を一言一句メモした（把老師的話一字一句記下來）。"
        },
        {
          word: "持ちつ持たれつ",
          reading: "もちつもたれつ",
          meaning: "互相扶持、彼此依靠。",
          note: "慣用句。例：友達とは持ちつ持たれつだ（朋友就是互相幫忙）。"
        },
        {
          word: "肌身離さず",
          reading: "はだみはなさず",
          meaning: "貼身不離、隨身帶著（絕不離身）。",
          note: "例：お守りを肌身離さず持ってる（護身符隨身帶著不離身）。"
        },
        {
          word: "挟む",
          reading: "はさむ",
          meaning: "夾（進…之間）。",
          note: "例：本にしおりを挟む（在書裡夾書籤）。／ケースにトレカを挟む（把小卡夾進手機殼）。"
        }
      ]
    },
    {
      kind: "cta",
      cta: { kind: "challenge", mode: "vocab", label: "把單字練熟：去單字讀音刷一輪 →" }
    }
  ],
};

const BODY_OVERRIDES: Partial<Record<string, ReadonlyArray<ArticleBlock>>> = {
  "shiritsu-ebisu-chugaku-ebichili-hajimemashita": ebichiliBody,
  "sweet-steady-sweet-step": sweetStepBody,
  "japanese-taste-texture-expressions": tasteExpressionsBody
};

function withBody(meta: ArticleMeta): BlogArticle {
  return { ...meta, body: BODY_OVERRIDES[meta.slug] ?? BODIES[meta.slug] ?? [] };
}

// Full articles (metadata + body), newest first. Draft articles stay in the
// list (rendered in-app with a 準備中 badge) but are excluded from the sitemap.
export const articles: ReadonlyArray<BlogArticle> = articleMetas.map(withBody);

export const publishedArticles: ReadonlyArray<BlogArticle> = articles.filter((a) => !a.draft);

export function articleBySlug(slug: string): BlogArticle | undefined {
  const meta = articleMetaBySlug(slug);
  return meta ? withBody(meta) : undefined;
}
