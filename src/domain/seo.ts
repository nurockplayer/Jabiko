// Per-view SEO metadata for the SPA.
//
// Jabiko is a client-rendered single-page app: index.html ships ONE static
// <title>/<meta description>, so every in-app route (/mock, /learn, …) would
// otherwise look identical to a crawler. Google renders JS and reads the final
// DOM, so updating these tags per view (via useSeoMeta) lets each route surface
// its own title/description/canonical in search results.
//
// Pure data + a small resolver -> trivially testable, no DOM here.

/** Top-level views that have their own URL (mirrors App's AppView / VIEW_PATHS). */
export type SeoView = "home" | "learn" | "rules" | "kanji" | "challenge" | "mock" | "about";

/** Production origin; canonical URLs are absolute so crawlers dedupe cleanly. */
export const SITE_ORIGIN = "https://jabiko.pages.dev";

interface PageSeo {
  title: string;
  description: string;
  /** Path at SITE_ORIGIN. Keep in sync with App's VIEW_PATHS. */
  path: string;
}

export const VIEW_SEO: Record<SeoView, PageSeo> = {
  home: {
    title: "Jabiko · JLPT 自習室",
    description:
      "免費的 JLPT 自習網站：N5〜N1 文法、漢字、單字與整卷模擬考，間隔重複自動盯錯題、章節式教學，打開就能練。",
    path: "/"
  },
  learn: {
    title: "分章學習 · Jabiko JLPT 自習室",
    description:
      "從動詞、形容詞變化一路到常用句型，一章一章看規則、例句與最容易踩的陷阱，看完直接進對應練習。",
    path: "/learn"
  },
  rules: {
    title: "日語變化規則速查表 · Jabiko",
    description: "動詞變化、ます／て形、各種接續整理成一頁可查的表，需要時掃一眼就好。",
    path: "/rules"
  },
  kanji: {
    title: "漢字音讀速查 · Jabiko 自習室",
    description:
      "依音讀（同音家族）查漢字、確認讀音與例詞，把濁音、長短音一次搞清楚，涵蓋 N5〜N1 漢字。",
    path: "/kanji"
  },
  challenge: {
    title: "練習題庫 · Jabiko JLPT 自習室",
    description:
      "基礎變化、句中填空、句型練習，加上 N1〜N4 備考綜合題庫——自由選等級與題型，想練哪一塊就練哪一塊。",
    path: "/challenge"
  },
  mock: {
    title: "JLPT 模擬考 · Jabiko 自習室",
    description:
      "依 JLPT N1／N2／N3 官方題型分區練習：漢字読み、文法、語順組合、讀解，照真實考卷結構逐區攻略。",
    path: "/mock"
  },
  about: {
    title: "關於 Jabiko · JLPT 自習室",
    description:
      "Jabiko 的名字由來與作者介紹——一個免費、開源、和朋友一起做的 JLPT 自習網站。",
    path: "/about"
  }
};

export interface ResolvedSeo {
  title: string;
  description: string;
  /** Absolute canonical URL for the view. */
  canonical: string;
}

/** Resolve a view's title/description and its absolute canonical URL. */
export function seoForView(view: SeoView): ResolvedSeo {
  const entry = VIEW_SEO[view];
  return {
    title: entry.title,
    description: entry.description,
    canonical: SITE_ORIGIN + entry.path
  };
}
