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
    title: "Jabiko · 免費 JLPT 日檢自習室｜N5–N1 文法單字模擬考",
    description:
      "免費、免註冊、開源的 JLPT 日檢自習室：N5〜N1 文法、漢字、單字與依官方題型的整卷模擬考，答錯自動排進間隔重複複習，支援跨裝置同步，打開就能練、免安裝。",
    path: "/"
  },
  learn: {
    title: "分章學習 · JLPT／日檢文法變化 · Jabiko",
    description:
      "從動詞、形容詞變化一路到常用句型，一章一章看規則、例句與最容易踩的陷阱，看完直接練——日檢 N5〜N1 文法打底。",
    path: "/learn"
  },
  rules: {
    title: "日語動詞變化規則速查表 · JLPT／日檢 · Jabiko",
    description:
      "動詞變化、ます／て形、各種接續整理成一頁可查的表，日檢文法複習時掃一眼就好。",
    path: "/rules"
  },
  kanji: {
    title: "漢字音讀速查 · JLPT／日檢 N5–N1 · Jabiko",
    description:
      "依音讀（同音家族）查漢字、確認讀音與例詞，把濁音、長短音一次搞清楚，涵蓋 JLPT／日檢 N5〜N1 漢字。",
    path: "/kanji"
  },
  challenge: {
    title: "JLPT／日檢線上題庫練習 · Jabiko 自習室",
    description:
      "基礎變化、句中填空、句型練習，加上 N1〜N4 日檢備考綜合題庫——自由選等級與題型，線上免費開練。",
    path: "/challenge"
  },
  mock: {
    title: "JLPT／日檢模擬考線上練習 · Jabiko",
    description:
      "依 JLPT／日檢 N1・N2・N3 官方題型分區線上練習：漢字読み、文法、語順組合、讀解，照真實考卷結構逐區攻略。",
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
