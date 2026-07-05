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

export const articleMetas: ReadonlyArray<ArticleMeta> = [
  {
    slug: "sweet-step-steady",
    title: "從「SWEET STEP」學日文：ありのままの自我摸索曲",
    description:
      "SWEET STEADY〈SWEET STEP〉唱的是「其實我也不知道真正的自己」——ありのまま、妄想、取り繕う、キュン⋯⋯挑 20 幾個歌裡的日文點來學，例句全原創，完整歌詞看外連。",
    tag: "偶像",
    publishedAt: "2026-07-06"
  },
  {
    slug: "cho-saikyo-tokimeki",
    title: "從「超最強」學日文：超ときめき♡宣伝部的推し活生字",
    description:
      "超ときめき♡宣伝部〈超最強〉根本是推し活生字大補帖——沼、布教、トレカ、ズッキュン⋯⋯挑 20+ 個歌裡的日文點，讀音意思語感一次學，例句全原創，完整歌詞看外連。",
    tag: "偶像",
    publishedAt: "2026-07-06"
  }
];

export const publishedArticleMetas: ReadonlyArray<ArticleMeta> = articleMetas.filter((a) => !a.draft);

export function articleMetaBySlug(slug: string): ArticleMeta | undefined {
  return articleMetas.find((a) => a.slug === slug);
}
