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
  "sweet-step-steady": [
    {
      kind: "lead",
      text: "〈SWEET STEP〉是 SWEET STEADY 的一首歌，主題比一般甜歌更有層次——不是無腦的甜，而是一邊承認「其實我也不知道真正的自己是什麼」（會妄想、會逞強、會不坦率、會哭、會累），一邊決定「那就先跳、先喜歡下去，把真正的自己裝飾好、包成禮物送你」。細膩又可愛，歌詞裡的日文點也很有味道。"
    },
    { kind: "heading", text: "這首歌在唱什麼" },
    {
      kind: "paragraph",
      text: "這首拋出一個很妙的問題：大家都說「做自己就好」，但「真正的自己」到底長什麼樣、其實自己也還在摸索。它沒有假裝自我肯定很容易，而是誠實承認這份不確定；然後副歌給的答案不是硬要振作，而是——那就先跳、先把停不下來的「喜歡」放下去，把真正的自己好好裝飾、包起來，當成禮物送到你面前。抓住這個「還在找自己、但想用最可愛的方式被你看見」的基調，聽起來會更有味道。"
    },
    {
      kind: "links",
      label: "先看官方 MV",
      items: [
        {
          label: "SWEET STEADY「SWEET STEP」官方 MV（YouTube）",
          url: "https://www.youtube.com/watch?v=1546cwoU6Wg"
        }
      ]
    },
    {
      kind: "callout",
      text: "下面挑的是歌裡出現的日文「單字與說法」，例句都是原創、跟歌詞無關。想看完整歌詞就點上面的官方 MV 邊聽邊看。"
    },
    { kind: "heading", text: "主題核心：自我摸索的一組詞" },
    {
      kind: "vocab",
      items: [
        {
          word: "ありのまま",
          reading: "ありのまま",
          meaning: "原本的樣子、不加修飾的真實自己。",
          note: "整首歌的題眼。例：ありのままの自分でいたい（想做真實的自己）。"
        },
        {
          word: "妄想",
          reading: "もうそう",
          meaning: "妄想、（不切實際的）幻想。",
          note: "口語常帶點自嘲。例：勝手に妄想が膨らむ（自顧自地越想越多）。"
        },
        {
          word: "反省",
          reading: "はんせい",
          meaning: "反省、檢討自己。",
          note: "例：ちゃんと反省してます（我有好好反省）。"
        },
        {
          word: "取り繕う",
          reading: "とりつくろう",
          meaning: "敷衍掩飾、硬撐場面、裝沒事。",
          note: "例：笑顔で取り繕う（用笑容硬撐過去）。"
        },
        {
          word: "らしくない",
          reading: "らしくない",
          meaning: "不像（某人的）作風、不像平常的樣子。",
          note: "「〜らしい」的否定。例：弱音を吐くなんて君らしくない（說喪氣話不像你）。"
        },
        {
          word: "ダサい",
          reading: "ダサい",
          meaning: "土、遜、不酷。",
          note: "口語形容詞。例：それ、ちょっとダサいかも（那個有點遜）。"
        },
        {
          word: "充分",
          reading: "じゅうぶん",
          meaning: "足夠、充分（也寫「十分」）。",
          note: "例：気持ちだけで充分だよ（有這份心意就夠了）。"
        },
        {
          word: "退屈",
          reading: "たいくつ",
          meaning: "無聊、無趣。",
          note: "例：退屈で死にそう（無聊到不行）。"
        },
        {
          word: "丁度いい",
          reading: "ちょうどいい",
          meaning: "剛剛好、恰到好處。",
          note: "例：辛さが丁度いい（辣度剛剛好）。"
        }
      ]
    },
    { kind: "heading", text: "可愛・閃耀・甜點比喻" },
    {
      kind: "vocab",
      items: [
        {
          word: "キュンとする",
          reading: "キュンとする",
          meaning: "心頭一緊、小鹿亂撞。",
          note: "「キュン」是心揪一下的擬態語。例：その仕草にキュンとした（被那個小動作萌到）。"
        },
        {
          word: "煌めく",
          reading: "きらめく",
          meaning: "閃耀、閃爍。",
          note: "比「光る」更華麗。例：夜空に星が煌めく（星星在夜空閃耀）。"
        },
        {
          word: "飾り付ける",
          reading: "かざりつける",
          meaning: "裝飾、佈置。",
          note: "例：部屋を可愛く飾り付ける（把房間佈置得很可愛）。"
        },
        {
          word: "包み込む",
          reading: "つつみこむ",
          meaning: "整個包住、包覆。",
          note: "例：優しさで包み込む（用溫柔包覆對方）。"
        },
        {
          word: "しゅんわり",
          reading: "しゅんわり",
          meaning: "軟綿綿、輕柔蓬鬆的擬態語。",
          note: "造語感重、很可愛的詞。例：焼きたてのパンがしゅんわり柔らかい（剛烤好的麵包軟綿綿的）。"
        },
        {
          word: "スパイス",
          reading: "スパイス",
          meaning: "香料；引申「調味、增添刺激的東西」。",
          note: "例：適度な緊張はスパイスになる（適度的緊張能成為調味料）。"
        },
        {
          word: "呪文",
          reading: "じゅもん",
          meaning: "咒語。",
          note: "例：呪文を唱える（唸咒語）。歌裡跟南瓜馬車一起用，是童話意象。"
        },
        {
          word: "馬車",
          reading: "ばしゃ",
          meaning: "馬車（灰姑娘的南瓜馬車意象）。",
          note: "例：かぼちゃの馬車に乗る（坐上南瓜馬車）。"
        },
        {
          word: "砂糖",
          reading: "さとう",
          meaning: "砂糖。",
          note: "例：コーヒーに砂糖を入れる（在咖啡裡加糖）。"
        },
        {
          word: "お好み",
          reading: "おこのみ",
          meaning: "喜好、偏好。",
          note: "例：トッピングはお好みでどうぞ（配料請依喜好取用）。「お好み焼き」也是這個詞。"
        },
        {
          word: "フレーバー",
          reading: "フレーバー",
          meaning: "口味、風味（flavor）。",
          note: "例：新しいフレーバーのアイスを試す（試新口味的冰淇淋）。"
        },
        {
          word: "溶け出す",
          reading: "とけだす",
          meaning: "開始融化／溶解出來（複合動詞）。",
          note: "「溶ける＋出す（開始…）」。例：チョコが手の中で溶け出した（巧克力在手裡開始融化）。"
        }
      ]
    },
    { kind: "heading", text: "口語・程度・其他" },
    {
      kind: "vocab",
      items: [
        {
          word: "〜てこ",
          reading: "〜てこ",
          meaning: "「〜ていこう」的口語縮約，「（一起）…下去吧」。",
          note: "很青春的收尾語氣。例：これからも頑張ってこ（今後也一起加油下去吧）。"
        },
        {
          word: "〜ちゃう",
          reading: "〜ちゃう",
          meaning: "「〜てしまう」的口語縮約，表「不小心／乾脆就…了」。",
          note: "例：つい笑っちゃう（忍不住就笑了）。／全部食べちゃった（不小心全吃光了）。"
        },
        {
          word: "ホント・ジブン",
          reading: "ホント・ジブン",
          meaning: "本当・自分刻意用「片假名」寫。",
          note: "把普通漢字詞寫成カタカナ，是歌詞、SNS 常見的「口語、俏皮、強調」語感。例：ホントに嬉しい（真的超開心）。"
        },
        {
          word: "億千万",
          reading: "おくせんまん",
          meaning: "億萬——用來誇飾「多到數不清」。",
          note: "例：億千万の言葉より一つの行動（勝過億萬句話的一個行動）。"
        },
        {
          word: "掻き消す",
          reading: "かきけす",
          meaning: "蓋過、抹去（聲音、痕跡等）。",
          note: "例：波の音が声を掻き消す（浪聲蓋過了說話聲）。"
        },
        {
          word: "まだまだ",
          reading: "まだまだ",
          meaning: "還早得很、還不夠、還有得是。",
          note: "例：まだまだこれから（好戲還在後頭）。"
        },
        {
          word: "もっと",
          reading: "もっと",
          meaning: "更多、再多一點。",
          note: "例：もっと上手くなりたい（想變得更厲害）。"
        }
      ]
    },
    { kind: "heading", text: "現場口上（開場口白）裡的詞" },
    {
      kind: "paragraph",
      text: "她們現場常有一段元氣滿滿的「口上」（開場口白），裡面也藏了實用日文。挑幾個標準詞來學（一樣，例句原創、不照搬口白）。"
    },
    {
      kind: "vocab",
      items: [
        {
          word: "おっとっと",
          reading: "おっとっと",
          meaning: "感嘆詞，快跌倒／失去平衡時的「哎呀、哎喲」。",
          note: "倒飲料喊停時也用。例：おっとっと、危ない（哎呀、差點跌倒）。"
        },
        {
          word: "つまずく",
          reading: "つまずく",
          meaning: "絆倒、跌跤；引申「受挫、卡關」。",
          note: "漢字「躓く」。例：石につまずく（被石頭絆倒）。／途中でつまずく（中途卡關）。"
        },
        {
          word: "手を取る",
          reading: "てをとる",
          meaning: "牽手；「手を取り合う」＝攜手合作。",
          note: "例：みんなで手を取り合って進む（大家攜手前進）。"
        },
        {
          word: "着実",
          reading: "ちゃくじつ",
          meaning: "踏實、穩紮穩打。",
          note: "常用「着実に」。例：着実に前進する（穩紮穩打地前進）。"
        },
        {
          word: "大輪",
          reading: "たいりん",
          meaning: "一大朵（花）。",
          note: "例：大輪のひまわりが咲く（一大朵向日葵綻放）。"
        },
        {
          word: "種",
          reading: "たね",
          meaning: "種子；也指「原因、來源、材料」。",
          note: "例：花の種をまく（播花的種子）。／悩みの種（煩惱的根源）。"
        },
        {
          word: "花を咲かせる",
          reading: "はなをさかせる",
          meaning: "使開花；慣用「開花結果、大放異彩」。",
          note: "例：努力が実って花を咲かせる（努力終於開花結果）。"
        }
      ]
    },
    { kind: "heading", text: "小專欄：副歌那串「跳舞」是多國語言接龍" },
    {
      kind: "paragraph",
      text: "副歌前那串聽起來像亂碼的詞，其實全部都是「跳舞」，用不同語言接龍：Dancin’（英語）→ 踊って（日語）→ baila（西班牙語）→ rince（愛爾蘭語）→ ram＝รำ（泰語）→ büjiglekh＝Бүжиглэх（蒙古語）→ šokis（立陶宛語）。知道這個梗，再聽副歌會突然「原來是這樣！」——也是個很好的日文以外的小知識。"
    },
    {
      kind: "paragraph",
      text: "把這些詞記熟，再去點 MV 邊聽邊對，抒情的副歌會突然變好懂不少。"
    },
    {
      kind: "cta",
      cta: { kind: "challenge", mode: "vocab", label: "把單字練熟：去單字讀音刷一輪 →" }
    }
  ],
  "cho-saikyo-tokimeki": [
    {
      kind: "lead",
      text: "超ときめき♡宣伝部的〈超最強〉表面是一首超自信、撒嬌到爆的應援曲，其實整首都在唱「推し活」——手機相簿、鎖屏、小卡、絨毛娃娃、按讚留言⋯⋯簡直是一本活的日文生字書。這篇挑 20 幾個歌裡出現的日文點來學，讀音、意思、語感都有，例句全原創。"
    },
    { kind: "heading", text: "團體與世界觀" },
    {
      kind: "paragraph",
      text: "超ときめき♡宣伝部（超心動♡宣傳部）是 Stardust Promotion「STAR PLANET」企劃旗下的女子偶像團體，跟桃色幸運草Z、私立恵比寿中学是同門。她們的世界觀很純粹，核心就一個字——「ときめき（心動）」，主打「令人心動的戀愛與青春」，目標是把這份心動傳遞給全世界。連應援口號都很直球：「君のハートにロックオン（瞄準你的心，Lock on！）」。抓住這個「以心動為武器、主動出擊擄獲你」的定位，再聽她們的歌會更有味道。"
    },
    { kind: "heading", text: "這首歌在唱什麼" },
    {
      kind: "paragraph",
      text: "〈超最強〉把那個世界觀開到最大：偶像自封「超最強」（超級無敵）可愛，用超有自信又撒嬌的口吻直接跟粉絲討「快稱讚我」，還一路點名粉絲的追星日常——把她設成手機鎖屏、手機殼夾她的小卡、隨身帶絨毛娃娃⋯⋯甚至反過來說「你（粉絲）才是尊い存在」。正因為主題就是推し活本身，歌詞裡才塞滿了現實中天天用的日文。"
    },
    {
      kind: "links",
      label: "先看官方 MV",
      items: [
        {
          label: "超ときめき♡宣伝部「超最強」官方 MV（YouTube）",
          url: "https://www.youtube.com/watch?v=Yeahpo-0Ub4"
        }
      ]
    },
    {
      kind: "callout",
      text: "下面挑的是歌裡出現的日文「單字與說法」，例句都是原創、跟歌詞無關。想看完整歌詞就點上面的官方 MV 邊聽邊看。"
    },
    { kind: "heading", text: "推し活・SNS 生字" },
    {
      kind: "vocab",
      items: [
        {
          word: "推し",
          reading: "おし",
          meaning: "最喜歡、最想應援的對象。",
          note: "整首歌的主角。延伸閱讀：推し活流行語入門那篇有更完整的一組。"
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
      kind: "paragraph",
      text: "把這些記熟，再去點開 MV 邊聽邊找，你會一直有「啊、這句我懂！」的瞬間——那就是聽力進步最爽的時刻。想把單字讀音也練穩，順手去刷一輪。"
    },
    {
      kind: "cta",
      cta: { kind: "challenge", mode: "vocab", label: "把單字練熟：去單字讀音刷一輪 →" }
    }
  ],
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
