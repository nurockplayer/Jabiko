// Lightweight blog-article metadata (#483): slug / title / description / tag /
// date / draft -- everything EXCEPT the article body.
//
// Split from the (lazy) article bodies in ./articles so eager consumers can
// resolve an article's title & description without pulling the prose into the
// initial bundle: per-article SEO (seo.ts, reached by useSeoMeta in the eager
// App) and the sitemap generator both import from here. The heavy body blocks
// live in ./articles, which only the lazy Blog pages load.
//
// This list is the SOURCE OF TRUTH for the article set + order (newest first);
// ./articles attaches a body to each slug.
export interface ArticleMeta {
  slug: string;
  /** zh-Hant title. */
  title: string;
  /** zh-Hant meta description (SEO); keep <= ~150 chars. */
  description: string;
  /** Short topic tag, e.g. "流行語" / "偶像". */
  tag: string;
  /** ISO date (YYYY-MM-DD). */
  publishedAt: string;
  /** Draft = shown in-app with a 準備中 badge, excluded from the sitemap. */
  draft?: boolean;
}

const BLOG_SLUG_ALIASES: Record<string, string> = {
  "sweet-step-steady": "sweet-steady-sweet-step"
};

const rawArticleMetas: ReadonlyArray<ArticleMeta> = [
  {
    slug: "japanese-country-names",
    title: "為什麼德國叫ドイツ、英國叫イギリス？日文國名的來源與讀法",
    description:
      "整理ドイツ、イギリス、オランダ、アルゼンチン等日文國名的來源，並一次看懂米・英・独等新聞縮寫、中国／韓国的国讀音，以及〜人・〜語・〜製・〜産的用法。",
    tag: "日文冷知識",
    publishedAt: "2026-07-20"
  },
  {
    slug: "japanese-restaurant-ordering-phrases",
    title: "日本店員到底在問什麼？從點餐、加購到結帳的實用回答",
    description:
      "從進店、點餐、套餐與袋子一路到結帳，整理日本餐廳、咖啡店和便利商店常見問句、自然回答與店規注意事項。",
    tag: "旅遊日文",
    publishedAt: "2026-07-13"
  },
  {
    slug: "japanese-taste-texture-expressions",
    title: "日本人吃東西不只說「おいしい」：味道、口感與吃後感的實用日文",
    description:
      "整理あっさり、こってり、サクサク、もちもち等味道與口感日文，也收錄吃完拉麵後對店員說的自然句子。",
    tag: "生活日文",
    publishedAt: "2026-07-13"
  },
  {
    slug: "shiritsu-ebisu-chugaku-ebichili-hajimemashita",
    title: "蝦中是什麼？〈えびチリ、はじめました〉日文筆記",
    description:
      "從私立恵比寿中学簡稱「エビ中」的由來開始，拆解〈えびチリ、はじめました〉裡的町中華、中文、麻將、南美國名、流行甜點與實用口語。",
    tag: "歌詞學日文",
    publishedAt: "2026-07-12"
  },
  {
    slug: "sweet-steady-sweet-step",
    title: "從「SWEET STEP」學日文：在 ありのまま 裡找真正的自己",
    description:
      "SWEET STEADY〈SWEET STEP〉唱的是「其實我也不知道真正的自己」——ありのまま、妄想、取り繕う、キュン⋯⋯挑 20 幾個歌裡的日文點來學，例句全原創，附官方 MV 連結。",
    tag: "偶像",
    publishedAt: "2026-07-06"
  },
  {
    slug: "cho-saikyo-tokimeki",
    title: "從〈超最強〉學日文：偶像把『推し活』唱成一首歌",
    description:
      "從超ときめき♡宣伝部〈超最強〉學推し活、布教、トレカ、レス、尊い、過去一等偶像歌常見日文，理解かわいい call 和推し活的雙向循環。",
    tag: "偶像",
    publishedAt: "2026-07-06"
  }
];

export const articleMetas: ReadonlyArray<ArticleMeta> = rawArticleMetas.map((article) =>
  article.slug === "sweet-steady-sweet-step"
    ? {
        ...article,
        title: "從歌詞學日文系列 SWEET STEADY - SWEET STEP：在 ありのまま 裡找真正的自己",
        description:
          "從 SWEET STEADY〈SWEET STEP〉學 ありのまま、強がる、素直、口上常見詞與偶像歌裡的細膩語感。",
        tag: "歌詞學日文"
      }
    : article
);

export const publishedArticleMetas: ReadonlyArray<ArticleMeta> = articleMetas.filter((a) => !a.draft);

export function canonicalArticleSlug(slug: string): string {
  return BLOG_SLUG_ALIASES[slug] ?? slug;
}

export function articleMetaBySlug(slug: string): ArticleMeta | undefined {
  const canonicalSlug = canonicalArticleSlug(slug);
  return articleMetas.find((a) => a.slug === canonicalSlug);
}
