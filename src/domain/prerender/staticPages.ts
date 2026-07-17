// Build-time prerender content (#478, GEO/P0).
//
// Non-Google AI crawlers execute ZERO JavaScript (GPTBot / ClaudeBot /
// PerplexityBot / Bingbot-in-practice), so the SPA's raw HTML shell — one
// <title> and an empty <div id="root"> — is all they ever see. This module
// builds, for every public route, the static head metadata plus a plain-HTML
// body (real text + real <a> links) that the postbuild script bakes into
// dist/. React's createRoot() replaces the #root children wholesale on
// hydration, so browsers with JS never see a mismatch — the static body is
// strictly a crawler/first-paint artifact.
//
// Pure data -> strings; no fs, no DOM. The I/O lives in scripts/prerender.mjs.
// NOT imported by the app (build-time only), so it adds zero bundle weight.
import { SITE_ORIGIN, VIEW_SEO, seoForView } from "../seo";
import type { AppView } from "../routes";
import { grammarPatterns, type GrammarPattern } from "../grammarDatabase";
import { publishedArticleMetas } from "../articlesMeta";
import { publishedArticles, type ArticleBlock } from "../articles";
import { KANA_TABLE, type KanaGroup, type KanaScript } from "../kana";
import type { JlptLevel } from "../types";
import { legalDocumentFor, type LegalPageKind } from "../legalContent";

export interface StaticPage {
  /** Decoded URL path, e.g. "/grammar/〜てもいい". */
  path: string;
  title: string;
  description: string;
  /** Absolute canonical URL (percent-encoded where needed). */
  canonical: string;
  /** Static HTML injected into <div id="root"> for non-JS crawlers. */
  bodyHtml: string;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Whether a decoded path segment is safe as a directory name on every
 *  filesystem we build on (NTFS is the strictest: \ / : * ? " < > |). */
export function isSafePathSegment(segment: string): boolean {
  if (segment.length === 0 || segment === "." || segment === "..") return false;
  return !/[\\/:*?"<>|]/.test(segment);
}

/** Map a decoded route path to its file path under dist/. Flat `<route>.html`
 *  (not `<route>/index.html`): Cloudflare Pages serves `/about.html` at
 *  `/about` with no trailing-slash 308, so sitemap URLs stay byte-identical,
 *  and sirv's extension resolution gives the same behaviour locally. */
export function pageFilePath(routePath: string): string {
  if (routePath === "/") return "index.html";
  return `${routePath.replace(/^\//, "")}.html`;
}

function replaceMetaContent(html: string, attr: "name" | "property", key: string, value: string): string {
  const pattern = new RegExp(`(<meta\\s+${attr}="${key}"\\s+content=")[\\s\\S]*?("\\s*\\/>)`);
  return html.replace(pattern, `$1${escapeHtml(value)}$2`);
}

/**
 * Bake a page's metadata + static body into the built index.html template.
 * Replaces title / description / canonical / og / twitter tags and injects
 * the crawler-visible body into the (empty) #root container.
 */
export function applyHead(template: string, page: StaticPage): string {
  let html = template;
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(page.title)}</title>`);
  html = replaceMetaContent(html, "name", "description", page.description);
  html = html.replace(
    /(<link rel="canonical" href=")[^"]*(" \/>)/,
    `$1${page.canonical}$2`
  );
  html = replaceMetaContent(html, "property", "og:url", page.canonical);
  html = replaceMetaContent(html, "property", "og:title", page.title);
  html = replaceMetaContent(html, "property", "og:description", page.description);
  html = replaceMetaContent(html, "name", "twitter:title", page.title);
  html = replaceMetaContent(html, "name", "twitter:description", page.description);
  html = html.replace('<div id="root"></div>', `<div id="root">${page.bodyHtml}</div>`);
  return html;
}

// ---------------------------------------------------------------------------
// Body builders
// ---------------------------------------------------------------------------

const NAV_LINKS: ReadonlyArray<{ href: string; label: string }> = [
  { href: "/", label: "首頁" },
  { href: "/learn", label: "分章學習" },
  { href: "/rules", label: "規則速查表" },
  { href: "/kanji", label: "漢字音讀" },
  { href: "/grammar", label: "文型資料庫" },
  { href: "/blog", label: "文章" },
  { href: "/challenge", label: "題庫練習" },
  { href: "/mock", label: "題型練習" },
  { href: "/about", label: "關於" },
  { href: "/privacy", label: "隱私政策" },
  { href: "/terms", label: "使用條款" }
];

const LEVELS: JlptLevel[] = ["N5", "N4", "N3", "N2", "N1"];

/** Navigable surface for a pattern: the leading 〜/～ is stripped, matching
 *  how the app's grammar index links (onOpenPattern) and the sitemap. */
export function navigableSurface(pattern: string): string {
  return pattern.replace(/^[〜～]/, "");
}

function grammarHref(surface: string): string {
  return `/grammar/${encodeURIComponent(navigableSurface(surface))}`;
}

function nav(): string {
  const items = NAV_LINKS.map(
    (link) => `<a href="${link.href}">${escapeHtml(link.label)}</a>`
  ).join(" · ");
  return `<header><nav>${items}</nav></header>`;
}

function wrap(h1: string, inner: string): string {
  return `${nav()}<main><h1>${escapeHtml(h1)}</h1>${inner}</main>`;
}

function paragraph(text: string): string {
  return `<p>${escapeHtml(text)}</p>`;
}

function grammarPointBody(pattern: GrammarPattern, byId: Map<string, GrammarPattern>): string {
  const parts: string[] = [];
  if (pattern.reading) parts.push(paragraph(`讀音：${pattern.reading}`));
  parts.push(`<p>JLPT 等級：<a href="/grammar/${pattern.level.toLowerCase()}">${pattern.level}</a></p>`);
  parts.push(`<h2>意思</h2>${paragraph(pattern.meaningZh)}`);
  parts.push(`<h2>接續</h2>${paragraph(pattern.formation)}`);
  if (pattern.examples.length > 0) {
    const items = pattern.examples
      .map(
        (example) =>
          `<li><span lang="ja">${escapeHtml(example.japanese)}</span> — ${escapeHtml(example.meaningZh)}</li>`
      )
      .join("");
    parts.push(`<h2>例句</h2><ul>${items}</ul>`);
  }
  const related = pattern.relatedPatternIds
    .map((id) => byId.get(id))
    .filter((entry): entry is GrammarPattern => Boolean(entry));
  if (related.length > 0) {
    const items = related
      .map((entry) => `<li><a href="${grammarHref(entry.pattern)}">${escapeHtml(entry.pattern)}</a> — ${escapeHtml(entry.meaningZh)}</li>`)
      .join("");
    parts.push(`<h2>相近文型</h2><ul>${items}</ul>`);
  }
  parts.push(`<p><a href="/grammar">回文型資料庫</a> · <a href="/challenge">進題庫練習</a></p>`);
  return wrap(`${pattern.pattern}（JLPT ${pattern.level} 文法）`, parts.join(""));
}

function grammarIndexBody(level?: JlptLevel): string {
  const pool = level ? grammarPatterns.filter((p) => p.level === level) : grammarPatterns;
  const levelLinks = LEVELS.map(
    (l) => `<a href="/grammar/${l.toLowerCase()}">JLPT ${l} 文型</a>`
  ).join(" · ");
  const items = pool
    .map(
      (pattern) =>
        `<li><a href="${grammarHref(pattern.pattern)}">${escapeHtml(pattern.pattern)}</a>（${pattern.level}）— ${escapeHtml(pattern.meaningZh)}</li>`
    )
    .join("");
  const heading = level ? `JLPT ${level} 文型索引` : "JLPT 文型資料庫（N5–N1）";
  const intro = level
    ? `JLPT ${level} 的文型一覽：意思、接續、用法與例句，點進各文型看完整說明。`
    : VIEW_SEO.grammar.description;
  return wrap(heading, `${paragraph(intro)}<p>${levelLinks}</p><ul>${items}</ul>`);
}

function articleText(block: ArticleBlock): string {
  switch (block.kind) {
    case "lead":
    case "paragraph":
    case "callout":
      return paragraph(block.text);
    case "heading":
      return `<h2>${escapeHtml(block.text)}</h2>`;
    case "vocab": {
      const items = block.items
        .map(
          (item) =>
            `<li><span lang="ja">${escapeHtml(item.word)}（${escapeHtml(item.reading)}）</span>：${escapeHtml(item.meaning)}${item.note ? ` — ${escapeHtml(item.note)}` : ""}</li>`
        )
        .join("");
      return `<ul>${items}</ul>`;
    }
    case "links": {
      const items = block.items
        .map((item) => `<li><a href="${escapeHtml(item.url)}" rel="noopener">${escapeHtml(item.label)}</a></li>`)
        .join("");
      return `<ul>${items}</ul>`;
    }
    case "lyricPoint":
      // Deliberately render only the original commentary, never the lyric
      // fragment — the static HTML must stay clear of reproduced lyrics.
      return block.points.map((point) => paragraph(point)).join("");
    case "divider":
      return `<h2>${escapeHtml(block.label)}</h2>`;
    case "cta":
      return "";
  }
}

function blogIndexBody(): string {
  const items = publishedArticleMetas
    .map(
      (meta) =>
        `<li><a href="/blog/${encodeURIComponent(meta.slug)}">${escapeHtml(meta.title)}</a> — ${escapeHtml(meta.description)}</li>`
    )
    .join("");
  return wrap("Jabiko 文章｜課本不教的日文，這裡補", `${paragraph(VIEW_SEO.blog.description)}<ul>${items}</ul>`);
}

function homeBody(): string {
  const sections = [
    `<li><a href="/grammar">JLPT 文型資料庫</a>：${grammarPatterns.length} 個文型的意思、接續與例句</li>`,
    `<li><a href="/learn">分章學習</a>：動詞變化到常用句型，一章一章打底</li>`,
    `<li><a href="/challenge">題庫練習</a>：N1〜N5 綜合題庫、備考模式與弱點複習</li>`,
    `<li><a href="/mock">題型練習</a>：照 JLPT 官方題型分區逐區攻略</li>`,
    `<li><a href="/kanji">漢字音讀速查</a>、<a href="/rules">規則速查表</a></li>`,
    `<li><a href="/blog">文章</a>：流行語、推し活、從歌詞學日文</li>`
  ].join("");
  const levelLinks = LEVELS.map(
    (l) => `<a href="/grammar/${l.toLowerCase()}">JLPT ${l} 文法</a>`
  ).join(" · ");
  return wrap(
    "Jabiko · JLPT 日檢自習室",
    `${paragraph(VIEW_SEO.home.description)}<ul>${sections}</ul><p>${levelLinks}</p>`
  );
}

// #619: the /kana page's whole value to a crawler IS the chart, so render the
// full tables (kana + romaji, grouped like the app) instead of a description.
function kanaBody(): string {
  const scripts: Array<{ script: KanaScript; label: string }> = [
    { script: "hiragana", label: "平假名" },
    { script: "katakana", label: "片假名" }
  ];
  const groupSections: Array<{ groups: KanaGroup[]; label: string }> = [
    { groups: ["seion"], label: "清音" },
    { groups: ["dakuon", "handakuon"], label: "濁音・半濁音" },
    { groups: ["youon"], label: "拗音" }
  ];
  const parts: string[] = [paragraph(VIEW_SEO.kana.description)];
  for (const { script, label } of scripts) {
    parts.push(`<h2>${escapeHtml(label)}</h2>`);
    for (const section of groupSections) {
      const cells = KANA_TABLE.filter(
        (entry) => entry.script === script && section.groups.includes(entry.group)
      )
        .map(
          (entry) =>
            `<li><span lang="ja">${escapeHtml(entry.kana)}</span>（${escapeHtml(entry.romaji)}）</li>`
        )
        .join("");
      parts.push(`<h3>${escapeHtml(section.label)}</h3><ul>${cells}</ul>`);
    }
  }
  parts.push(`<p><a href="/learn">進分章學習</a> · <a href="/challenge">練假名認讀</a></p>`);
  return wrap("五十音表（平假名・片假名對照）", parts.join(""));
}

function simpleViewBody(view: AppView): string {
  const entry = VIEW_SEO[view];
  return wrap(entry.title.split(" · ")[0], `${paragraph(entry.description)}<p><a href="/">回 Jabiko 首頁</a></p>`);
}

function legalPageBody(page: LegalPageKind): string {
  const document = legalDocumentFor("zh-Hant", page);
  const sections = document.sections
    .map((section) => {
      const paragraphs = section.paragraphs?.map(paragraph).join("") ?? "";
      const items = section.items
        ? `<ul>${section.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
        : "";
      return `<section><h2>${escapeHtml(section.title)}</h2>${paragraphs}${items}</section>`;
    })
    .join("");
  return wrap(
    document.title,
    `${paragraph(document.intro)}${paragraph(document.updatedLabel)}${sections}`
  );
}

// ---------------------------------------------------------------------------

export function buildStaticPages(): StaticPage[] {
  const pages: StaticPage[] = [];
  const byId = new Map(grammarPatterns.map((pattern) => [pattern.id, pattern]));

  const push = (view: AppView, path: string, bodyHtml: string, surface?: string, slug?: string) => {
    const seo = seoForView(view, surface ?? null, slug ?? null);
    pages.push({ path, title: seo.title, description: seo.description, canonical: seo.canonical, bodyHtml });
  };

  push("home", "/", homeBody());
  for (const view of ["learn", "rules", "kanji", "challenge", "mock", "about"] as const) {
    push(view, VIEW_SEO[view].path, simpleViewBody(view));
  }
  for (const view of ["privacy", "terms"] as const) {
    push(view, VIEW_SEO[view].path, legalPageBody(view));
  }
  push("kana", "/kana", kanaBody());
  push("grammar", "/grammar", grammarIndexBody());
  for (const level of LEVELS) {
    push("grammar", `/grammar/${level.toLowerCase()}`, grammarIndexBody(level), level.toLowerCase());
  }
  for (const pattern of grammarPatterns) {
    const surface = navigableSurface(pattern.pattern);
    if (!isSafePathSegment(surface)) {
      // eslint-disable-next-line no-console
      console.warn(`[prerender] skip unsafe surface: ${surface}`);
      continue;
    }
    push("grammar", `/grammar/${surface}`, grammarPointBody(pattern, byId), surface);
  }
  push("blog", "/blog", blogIndexBody());
  for (const article of publishedArticles) {
    const inner = article.body.map(articleText).join("");
    const bodyHtml = wrap(article.title, `${paragraph(article.description)}${inner}<p><a href="/blog">更多文章</a></p>`);
    push("blog", `/blog/${article.slug}`, bodyHtml, undefined, article.slug);
  }

  return pages;
}
