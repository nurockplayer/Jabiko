// Per-view SEO metadata for the SPA.
//
// Jabiko is a client-rendered single-page app: index.html ships ONE static
// <title>/<meta description>, so every in-app route (/mock, /learn, …) would
// otherwise look identical to a crawler. Google renders JS and reads the final
// DOM, so updating these tags per view (via useSeoMeta) lets each route surface
// its own title/description/canonical in search results.
//
// Pure data + a small resolver -> trivially testable, no DOM here.
import { articleMetaBySlug } from "./articlesMeta";
import { APP_VIEW_PATHS, type AppView } from "./routes";

/** Production origin; canonical URLs are absolute so crawlers dedupe cleanly. */
export const SITE_ORIGIN = "https://jabiko.app";

interface PageSeo {
  title: string;
  description: string;
  /** Static path from the shared app route contract. */
  path: string;
}

export const VIEW_SEO: Record<AppView, PageSeo> = {
  home: {
    title: "Jabiko · JLPT 日檢自習室｜N5–N1 文法單字題型練習",
    description:
      "免費、免註冊的 JLPT 日檢自習室：N5〜N1 文法、漢字、單字與依官方題型分區練習，答錯自動排進間隔重複複習，支援跨裝置同步，打開就能練、免安裝。",
    path: APP_VIEW_PATHS.home
  },
  learn: {
    title: "分章學習 · JLPT／日檢文法變化 · Jabiko",
    description:
      "從動詞、形容詞變化一路到常用句型，一章一章看規則、例句與最容易踩的陷阱，看完直接練——日檢 N5〜N1 文法打底。",
    path: APP_VIEW_PATHS.learn
  },
  rules: {
    title: "日語動詞變化規則速查表 · JLPT／日檢 · Jabiko",
    description:
      "動詞變化、ます／て形、各種接續整理成一頁可查的表，日檢文法複習時掃一眼就好。",
    path: APP_VIEW_PATHS.rules
  },
  kanji: {
    title: "漢字音讀速查 · JLPT／日檢 N5–N1 · Jabiko",
    description:
      "依音讀（同音家族）查漢字、確認讀音與例詞，把濁音、長短音一次搞清楚，涵蓋 JLPT／日檢 N5〜N1 漢字。",
    path: APP_VIEW_PATHS.kanji
  },
  kana: {
    title: "五十音表（平假名・片假名對照）· 附發音 · Jabiko",
    description:
      "完整五十音表：平假名、片假名對照，清音、濁音・半濁音、拗音分區，每格附羅馬拼音與發音播放，看完可直接進假名認讀練習。",
    path: APP_VIEW_PATHS.kana
  },
  challenge: {
    title: "JLPT／日檢線上題庫練習 · Jabiko 自習室",
    description:
      "基礎變化、句中填空、句型練習，加上 N1〜N4 日檢備考綜合題庫——自由選等級與題型，線上免費開練。",
    path: APP_VIEW_PATHS.challenge
  },
  mock: {
    title: "JLPT／日檢題型分區練習 · Jabiko",
    description:
      "依 JLPT／日檢 N1・N2・N3 官方題型分區線上練習：漢字読み、文法、語順組合、讀解，照真實考卷結構逐區攻略。",
    path: APP_VIEW_PATHS.mock
  },
  about: {
    title: "關於 Jabiko · JLPT 自習室",
    description:
      "Jabiko 的名字由來與作者介紹——一個免費、和朋友一起做的 JLPT 自習網站。",
    path: APP_VIEW_PATHS.about
  },
  privacy: {
    title: "隱私政策｜Jabiko",
    description:
      "了解 Jabiko 在瀏覽器、Google 登入、跨裝置同步、匿名使用分析與回報功能中如何處理資料。",
    path: APP_VIEW_PATHS.privacy
  },
  terms: {
    title: "使用條款｜Jabiko",
    description:
      "Jabiko 的服務範圍、合理使用規則、內容責任、程式碼與原創內容權利，以及外部服務說明。",
    path: APP_VIEW_PATHS.terms
  },
  grammar: {
    title: "JLPT 文型資料庫 · 日檢文法索引 · Jabiko",
    description:
      "JLPT N5–N1 文型一覽：全部文型、接續規則、用法與例句。支援搜尋、等級瀏覽與影視例句篩選——JLPT 文法攻略。",
    path: APP_VIEW_PATHS.grammar
  },
  blog: {
    title: "文章｜流行語・推し活・時下日文 · Jabiko",
    description:
      "課本不教、但你天天會撞到的時下日文——流行語、推し活、日劇動漫、從歌詞學日文，原創筆記邊讀邊練。",
    path: APP_VIEW_PATHS.blog
  }
};

export interface ResolvedSeo {
  title: string;
  description: string;
  /** Absolute canonical URL for the view. */
  canonical: string;
}

/**
 * Resolve a view's title/description and its absolute canonical URL. The
 * `/grammar/<surface>` route is dynamic (#281): its metadata is built from the
 * surface so each grammar-point page surfaces its own title/canonical to
 * crawlers. The grammar overview (/grammar with no surface) has its own SEO
 * entry distinct from HOME.
 */
export function seoForView(
  view: AppView,
  grammarSurface?: string | null,
  blogSlug?: string | null
): ResolvedSeo {
  // /blog/<slug> (#483): per-article title + description so each article
  // surfaces its own metadata. Falls back to the blog index SEO for an
  // unknown slug. Article metadata is the lightweight ./articlesMeta (no
  // article body), so this stays off the heavy content chunk.
  if (view === "blog" && blogSlug) {
    const article = articleMetaBySlug(blogSlug);
    if (article) {
      return {
        title: `${article.title} · Jabiko 文章`,
        description: article.description,
        canonical: `${SITE_ORIGIN}/blog/${encodeURIComponent(article.slug)}`
      };
    }
  }

  if (view === "grammar" && grammarSurface) {
    // JLPT level route (e.g., /grammar/n5): show index-page metadata, not
    // a grammar-point title.
    if (/^[Nn][1-5]$/.test(grammarSurface)) {
      const level = grammarSurface.toUpperCase();
      return {
        title: `JLPT ${level} 文型索引 · JLPT／日檢文法 · Jabiko`,
        description: `JLPT ${level} 日檢文法文型一覽：全部文型、接續、用法與例句，看完直接練——N5–N1 文法逐級攻略。`,
        canonical: `${SITE_ORIGIN}/grammar/${level.toLowerCase()}`
      };
    }
    return {
      title: `${grammarSurface} 的意思與用法 · JLPT／日檢文法 · Jabiko`,
      description: `日檢文法「${grammarSurface}」的意思、接續、用法與例句，看完直接練——JLPT 文法逐點攻略。`,
      canonical: `${SITE_ORIGIN}/grammar/${encodeURIComponent(grammarSurface)}`
    };
  }

  const entry = VIEW_SEO[view === "grammar" ? "grammar" : view];
  return {
    title: entry.title,
    description: entry.description,
    canonical: SITE_ORIGIN + entry.path
  };
}
