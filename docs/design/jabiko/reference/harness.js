// Jabiko JT-1 reference harness.
//
// DESIGN TOOLING, NOT PRODUCTION CODE. Renders shared chrome (header, tab
// bar, session bar, footer), the original line icons, the assessment marks
// and state/theme/language switching through the query string
// (?state=, ?theme=dark, ?lang=en). Production (#838, #834) implements the
// same recipes in React; nothing here is imported by src/.

// Original 24×24 line icons, 1.75 stroke, round caps (Tachiko icon grammar:
// one family, optical 20px in controls).
const ICONS = {
  today: "M4 6.5h16v13H4zM4 10h16M8.5 3.5v4M15.5 3.5v4",
  practice: "M5 5h14v14H5zM8.5 9.5l2 2 4-4M8.5 15.5h7",
  learn: "M4 5.5c3-1 5.5-1 8 1 2.5-2 5-2 8-1v13c-3-1-5.5-1-8 1-2.5-2-5-2-8-1zM12 6.5v13",
  grammar: "M7 4h10v16H7zM10 8h4M10 12h4M10 16h2",
  talk: "M4 5h16v11h-9l-4 3.5V16H4zM8 9.5h8M8 12.5h5",
  reference: "M5 4h5v16H5zM10 4h5v16h-5zM16 5l3.5 1-3.5 14",
  world: "M12 3.5c3.6 0 6.5 2.8 6.5 6.4 0 4.6-6.5 10.6-6.5 10.6S5.5 14.5 5.5 9.9c0-3.6 2.9-6.4 6.5-6.4zM12 7.4a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z",
  chevron: "M7 10l5 5 5-5",
  chevronRight: "M10 7l5 5-5 5",
  arrow: "M5 12h14M13.5 6.5 19 12l-5.5 5.5",
  back: "M19 12H5M10.5 6.5 5 12l5.5 5.5",
  close: "M6.5 6.5l11 11M17.5 6.5l-11 11",
  speaker: "M4.5 9.5v5h3.5l4.5 4v-13l-4.5 4zM16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11",
  eye: "M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12zM12 9.25a2.75 2.75 0 1 0 0 5.5 2.75 2.75 0 0 0 0-5.5z",
  bookmark: "M6.5 4h11v16l-5.5-3.8L6.5 20z",
  flag: "M5.5 20.5V4M5.5 4.5h11l-2.2 4 2.2 4h-11",
  search: "M10.5 4.5a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM15 15l4.5 4.5",
  menu: "M4 7h16M4 12h16M4 17h16",
  timer: "M12 8.5V13l3 1.8M9.5 2.5h5M12 4.5a8 8 0 1 0 0 16 8 8 0 0 0 0-16z",
  globe: "M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM3.5 12h17M12 3.5c2.8 2.8 2.8 14.2 0 17M12 3.5c-2.8 2.8-2.8 14.2 0 17",
  check: "M5 12.5l4.5 4.5L19 7.5",
  warning: "M12 4 21 19.5H3zM12 10v4.5M12 17h.01",
  error: "M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM12 8v5M12 16h.01",
  info: "M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM12 11v5.5M12 8h.01",
  refresh: "M4.5 12a7.5 7.5 0 0 1 13-5.1L19.5 9M19.5 4.5V9H15M19.5 12a7.5 7.5 0 0 1-13 5.1L4.5 15M4.5 19.5V15H9",
  user: "M12 4.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5",
  moon: "M19.5 14.5A7.5 7.5 0 1 1 9.5 4.5a6 6 0 0 0 10 10z",
  trash: "M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 12.5h9l1-12.5",
  sliders: "M4 7.5h9M17 7.5h3M15 5.5v4M4 16.5h3M11 16.5h9M9 14.5v4",
  share: "M12 15V3.5M7.5 8 12 3.5 16.5 8M5 13v7h14v-7",
  heart: "M12 19.5s-7-4.3-7-9.5a4 4 0 0 1 7-2.6 4 4 0 0 1 7 2.6c0 5.2-7 9.5-7 9.5z",
  message: "M4.5 5h15v10.5H9l-4.5 4z",
  offline: "M3.5 3.5l17 17M9 9.2A7.5 7.5 0 0 0 5.5 11.5M12 6a11 11 0 0 1 8.5 4M3.5 9.5A12.5 12.5 0 0 1 6.5 7.5M12 18h.01M9.2 15a4 4 0 0 1 5.6 0",
  lock: "M6.5 11h11v9h-11zM9 11V8.5a3 3 0 0 1 6 0V11",
  play: "M8 5.5l11 6.5-11 6.5z",
  keyboard: "M3.5 7h17v10h-17zM7 10.5h.01M10.5 10.5h.01M14 10.5h.01M17.5 10.5h.01M8 14h8",
  external: "M14 4.5h5.5V10M19.5 4.5 11 13M17.5 14v5.5h-13v-13H10",
  clock: "M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM12 7.5V12l3 2",
  sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8",
  rain: "M7 15.5a4.5 4.5 0 1 1 1.6-8.7A5.5 5.5 0 0 1 19 9a3.5 3.5 0 0 1-.5 6.5M8.5 18l-1 2.5M12.5 18l-1 2.5M16.5 18l-1 2.5"
};

export function icon(name, cls = "jt-icon") {
  const d = ICONS[name];
  if (!d) throw new Error(`Unknown harness icon: ${name}`);
  const fill = name === "play" ? "currentColor" : "none";
  return `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="${fill}" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
}

// Assessment marks (DESIGN.md §5): geometric glyphs in the same line
// language as the icons. Meaning always travels with a text label.
//   o   — correct (〇)
//   x   — the learner's incorrect choice (×)
//   tri — formative "could go further" (△), Small Talk only
//   ring — revealed answer (dashed 〇), never counted as earned
const MARKS = {
  o: '<circle cx="12" cy="12" r="7.5" stroke-width="2.25"/>',
  x: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11" stroke-width="2.25"/>',
  tri: '<path d="M12 4.75 20 18.75H4z" stroke-width="2.1"/>',
  ring: '<circle cx="12" cy="12" r="7.5" stroke-width="1.75" stroke-dasharray="3 2.6"/>'
};

export function mark(kind, cls = "jt-mark") {
  const body = MARKS[kind];
  if (!body) throw new Error(`Unknown mark: ${kind}`);
  return `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

// ジャビ子 — Jabiko's existing mascot, reproduced from
// src/components/JabikoMark.tsx (brand art keeps its own colors in both themes).
export const BRAND_MARK = `<svg viewBox="0 0 64 64" role="img" aria-label="Jabiko"><rect x="0" y="0" width="64" height="64" fill="#fdf6ea"/><g transform="translate(6.4 5) scale(0.8)"><path d="M16 54c2-6 9-9 16-9s14 3 16 9v4H16Z" fill="#f0a49c" stroke="#28385a" stroke-width="3" stroke-linejoin="round"/><rect x="8.5" y="31" width="8" height="13" rx="4" fill="#f0a49c" stroke="#28385a" stroke-width="3"/><rect x="47.5" y="31" width="8" height="13" rx="4" fill="#f0a49c" stroke="#28385a" stroke-width="3"/><rect x="14" y="24" width="36" height="29" rx="14" fill="#fdf6ea" stroke="#28385a" stroke-width="3"/><path d="M32 12C26 9 19 9.5 15 11v10c4-1.5 11-2 17 1.5Z" fill="#fdf6ea" stroke="#28385a" stroke-width="2.6" stroke-linejoin="round"/><path d="M32 12c6-3 13-2.5 17-1v10c-4-1.5-11-2-17 1.5Z" fill="#fdf6ea" stroke="#28385a" stroke-width="2.6" stroke-linejoin="round"/><rect x="18.5" y="13.5" width="9" height="5.6" rx="0.8" fill="none" stroke="#f0a49c" stroke-width="1.3"/><path d="M21.5 13.5v5.6M24.5 13.5v5.6M18.5 16.3h9" stroke="#f0a49c" stroke-width="1.1"/><path d="M36 14.6h9.5M36 16.8h9.5M36 19h7" stroke="#f0a49c" stroke-width="1.5" stroke-linecap="round"/><circle cx="22" cy="42" r="3" fill="#f0a49c"/><circle cx="42" cy="42" r="3" fill="#f0a49c"/><circle cx="26" cy="38" r="3" fill="#28385a"/><circle cx="38" cy="38" r="3" fill="#28385a"/><path d="M27.5 43q4.5 4 9 0" fill="none" stroke="#28385a" stroke-width="2.6" stroke-linecap="round"/></g></svg>`;

const T = {
  "zh-Hant": {
    product: "JLPT 自習室", home: "Jabiko 首頁",
    today: "今日", practice: "練習", learn: "學習", grammar: "文型", talk: "會話", reference: "資料",
    world: "日常", preview: "預覽", worldLink: "前往日常（預覽）",
    focus: "專注", focusMode: "專注模式", remaining: "剩", furigana: "振假名", on: "開", off: "關", menu: "選單與設定", primary: "主要導覽",
    skip: "跳到主要內容"
  },
  en: {
    product: "JLPT Study Room", home: "Jabiko home",
    today: "Today", practice: "Practice", learn: "Learn", grammar: "Grammar", talk: "Small Talk", reference: "Reference",
    world: "Everyday", preview: "Preview", worldLink: "Go to Everyday (preview)",
    focus: "Focus", focusMode: "Focus mode", remaining: "remaining", furigana: "Furigana", on: "On", off: "Off", menu: "Menu and settings", primary: "Primary",
    skip: "Skip to main content"
  }
};

export function params() {
  const q = new URLSearchParams(location.search);
  return {
    state: q.get("state") || "",
    theme: q.get("theme") === "dark" ? "dark" : "light",
    lang: q.get("lang") === "en" ? "en" : "zh-Hant"
  };
}

export function t(key) {
  return T[params().lang][key];
}

export function applyTheme() {
  const { theme, lang } = params();
  document.documentElement.dataset.theme = theme;
  document.documentElement.lang = lang;
}

const appmark = () => `<span class="jt-appmark">${BRAND_MARK}</span>`;

// Header for index and reading surfaces (≥ 1024 tabs; < 1024 tab bar).
// Navigation items are links with aria-current (cross-route navigation),
// not an ARIA tablist (DESIGN.md §6.3).
export function header(current, { furigana = false, focusActive = "" } = {}) {
  const tab = (id, href) =>
    `<a class="jt-tab" href="${href}"${current === id ? ' aria-current="page"' : ""}><span class="jt-tab-hit"></span>${t(id)}</a>`;
  return `<a class="jt-skip" href="#main">${t("skip")}</a>
  <header class="jt-header">
    <a class="jt-brand" href="today.html" aria-label="${t("home")}">${appmark()}<span class="jt-brand-word">Jabiko</span><span class="jt-brand-product">${t("product")}</span></a>
    <nav class="jt-tabs" aria-label="${t("primary")}">
      ${tab("today", "today.html")}${tab("practice", "session.html")}${tab("learn", "learn.html")}${tab("grammar", "grammar.html")}${tab("talk", "talk.html")}
      <button class="jt-tab" type="button" aria-haspopup="menu" aria-expanded="false"${current === "reference" ? ' data-current="true"' : ""}><span class="jt-tab-hit"></span>${t("reference")}${icon("chevron", "jt-icon-sm")}</button>
    </nav>
    <div class="jt-header-tools">
      <a class="jt-product-link jt-hide-medium" href="world.html">${icon("world")}<span>${t("world")}</span><span class="jt-preview-word">${t("preview")}</span></a>
      <button class="jt-toggle" type="button" aria-pressed="${focusActive ? "true" : "false"}" aria-label="${focusActive ? `${t("focusMode")}，${t("remaining")} ${focusActive}` : t("focusMode")}">${icon("timer")}<span class="jt-toggle-label" aria-hidden="true">${focusActive || t("focus")}</span></button>
      ${furiToggle(furigana)}
      <button class="jt-iconbtn" type="button" aria-label="${t("menu")}" aria-haspopup="menu" aria-expanded="false">${icon("menu")}</button>
    </div>
  </header>`;
}

export function tabbar(current) {
  const tab = (id, href, ic) =>
    `<a href="${href}"${current === id ? ' aria-current="page"' : ""}>${icon(ic)}<span>${t(id)}</span></a>`;
  return `<nav class="jt-tabbar" aria-label="${t("primary")}">
    ${tab("today", "today.html", "today")}${tab("practice", "session.html", "practice")}${tab("learn", "learn.html", "learn")}${tab("talk", "talk.html", "talk")}${tab("reference", "reference.html?state=sheet", "reference")}
  </nav>`;
}

export function footer() {
  return `<footer class="jt-footer"><div class="jt-footer-inner">
    <a href="#">許願功能</a><a href="#">回報問題</a><a href="#">小額贊助</a><a href="#">分享 Jabiko</a>
    <span class="jt-footer-legal"><a href="#">關於</a><a href="#">隱私權政策</a><a href="#">使用條款</a></span>
  </div></footer>`;
}

// World header: product identity + explicit return to Learning (#834).
export function worldHeader() {
  return `<a class="jt-skip" href="#main">${t("skip")}</a>
  <header class="jt-header">
    <a class="jt-brand" href="world.html" aria-label="Jabiko ${t("world")}">${appmark()}<span class="jt-brand-word">Jabiko</span><span class="jt-brand-product">${t("world")} · ${t("preview")}</span></a>
    <div class="jt-header-tools">
      <a class="jt-product-link" href="today.html">${icon("back")}<span>回到練習</span></a>
      ${furiToggle(false)}
      <button class="jt-iconbtn" type="button" aria-label="${t("menu")}" aria-haspopup="menu" aria-expanded="false">${icon("menu")}</button>
    </div>
  </header>`;
}

// Furigana toggle: the visible label may collapse to the glyph on phones, so
// the accessible name never depends on it (DESIGN.md §6.4).
export function furiToggle(on) {
  return `<button class="jt-toggle" type="button" aria-pressed="${on}" aria-label="${t("furigana")}"><span class="jt-furi" lang="ja" aria-hidden="true">ふ</span><span class="jt-toggle-label" aria-hidden="true">${t("furigana")}</span><span class="jt-toggle-state jt-hide-compact" aria-hidden="true">${on ? t("on") : t("off")}</span></button>`;
}

// Replace <i data-icon="name"> and <i data-mark="kind"> placeholders.
export function hydrate(root = document) {
  for (const el of root.querySelectorAll("i[data-icon]")) el.outerHTML = icon(el.dataset.icon, el.className || "jt-icon");
  for (const el of root.querySelectorAll("i[data-mark]")) el.outerHTML = mark(el.dataset.mark, el.className || "jt-mark");
}

// Show only elements whose data-state list contains the current state.
export function showState(defaultState) {
  const state = params().state || defaultState;
  document.documentElement.dataset.boardState = state;
  for (const el of document.querySelectorAll("[data-state]")) {
    el.hidden = !el.dataset.state.split(/\s+/).includes(state);
  }
  return state;
}

// Language overlay spans: <span data-l="zh-Hant">…</span><span data-l="en">…</span>.
export function applyLang() {
  const { lang } = params();
  for (const el of document.querySelectorAll("[data-l]")) el.hidden = el.dataset.l !== lang;
}

export function boot({ current, defaultState, chrome = "app", furigana = false, focusActive = "" }) {
  applyTheme();
  const state = showState(defaultState);
  // A hidden placeholder (data-state not matching) means this state has no global chrome.
  const live = (el) => (el && !el.hidden ? el : null);
  const top = live(document.getElementById("chrome-top"));
  const bottom = live(document.getElementById("chrome-bottom"));
  if (top && chrome === "app") top.outerHTML = header(current, { furigana, focusActive });
  if (top && chrome === "world") top.outerHTML = worldHeader();
  if (bottom && chrome === "app") bottom.outerHTML = tabbar(current);
  const foot = document.getElementById("chrome-footer");
  if (foot) foot.outerHTML = footer();
  hydrate();
  applyLang();
  return state;
}
