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
    slug: "cho-saikyo-tokimeki",
    title: "從「超最強」學日文：超ときめき♡宣伝部的推し活生字",
    description:
      "超ときめき♡宣伝部〈超最強〉根本是推し活生字大補帖——沼、布教、トレカ、ズッキュン⋯⋯挑 20+ 個歌裡的日文點，讀音意思語感一次學，例句全原創，完整歌詞看外連。",
    tag: "偶像",
    publishedAt: "2026-07-06",
    draft: true
  },
  {
    slug: "oshikatsu-slang-nyumon",
    title: "推し活日文入門：10 個偶像圈一定會遇到的流行語",
    description:
      "推し、尊い、沼、レベチ、神対応⋯⋯追星、看演唱會、逛 SNS 一定會撞到的日文流行語，一次整理讀音、意思與用法，附原創例句。",
    tag: "流行語",
    publishedAt: "2026-07-06"
  },
  {
    slug: "idol-song-nihongo-template",
    title: "從一首偶像曲學日文（範本）",
    description:
      "用一首喜歡的偶像曲，挑幾句歌詞學日文——文法、生字、語感一次帶。這是持續更新的範本，之後會補上實際歌曲。",
    tag: "偶像",
    publishedAt: "2026-07-06",
    draft: true
  }
];

export const publishedArticleMetas: ReadonlyArray<ArticleMeta> = articleMetas.filter((a) => !a.draft);

export function articleMetaBySlug(slug: string): ArticleMeta | undefined {
  return articleMetas.find((a) => a.slug === slug);
}
