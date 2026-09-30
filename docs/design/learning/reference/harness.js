// Jabiko Learning Shu-ire reference harness (SI-1).
//
// DESIGN TOOLING, NOT PRODUCTION CODE. It renders the reference boards:
// shared chrome, original line icons, the verdict mark geometry, and state /
// theme switching through the query string (?state=, ?theme=dark,
// ?lang=en). Production components (#838) implement the same recipes in
// React; nothing here is imported by src/.

const ICON_PATHS = {
  today: "M4 7h16M4 7v12h16V7M4 7V5h16v2M8 3v4M16 3v4M8 12h3v3H8z",
  practice: "M4 20l4-1 11-11-3-3L5 16l-1 4zM14 6l3 3",
  learn: "M3 5h7a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H3zM21 5h-7a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h7z",
  talk: "M4 5h16v10H9l-5 4zM8 9h8M8 12h5",
  reference: "M5 4h4v16H5zM10 4h4v16h-4zM15.5 4.5l3.8 1 -3.9 15 -3.8-1",
  grammar: "M6 4h12v16H6zM9 8h6M9 12h6M9 16h3",
  chevron: "M6 9l6 6 6-6",
  arrow: "M5 12h14M13 6l6 6-6 6",
  back: "M19 12H5M11 6l-6 6 6 6",
  close: "M6 6l12 12M18 6L6 18",
  speaker: "M4 9v6h4l5 4V5L8 9zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  bookmark: "M6 4h12v17l-6-4-6 4z",
  bookmarkFilled: "M6 4h12v17l-6-4-6 4z",
  flag: "M5 21V4M5 4h11l-2 4 2 4H5",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  menu: "M4 7h16M4 12h16M4 17h16",
  timer: "M12 8v5l3 2M9 2h6M12 4a9 9 0 1 0 0 18 9 9 0 0 0 0-18z",
  globe: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18",
  check: "M5 12l5 5 9-10",
  warning: "M12 3l10 18H2zM12 10v5M12 18h.01",
  error: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8v5M12 16h.01",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2",
  refresh: "M4 12a8 8 0 0 1 14-5l2 2M20 4v5h-5M20 12a8 8 0 0 1-14 5l-2-2M4 20v-5h5",
  user: "M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 21c1-4 4-6 8-6s7 2 8 6",
  moon: "M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10z",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13",
  sliders: "M4 7h10M18 7h2M14 5v4M4 17h4M12 17h8M8 15v4",
  share: "M12 3v12M7 8l5-5 5 5M5 14v6h14v-6",
  heart: "M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z",
  message: "M4 5h16v11H8l-4 4z",
  offline: "M3 3l18 18M8.5 8.5A8 8 0 0 0 5 11M12 5a12 12 0 0 1 9 4M2 9a15 15 0 0 1 3-2M12 18h.01M9 15a4 4 0 0 1 6 0",
  play: "M8 5l11 7-11 7z",
  lock: "M6 11h12v9H6zM9 11V8a3 3 0 0 1 6 0v3",
  sparkle: "M12 3v6M12 15v6M3 12h6M15 12h6"
};

export function icon(name, extraClass = "") {
  const d = ICON_PATHS[name];
  if (!d) throw new Error(`Unknown harness icon: ${name}`);
  const fill = name === "bookmarkFilled" ? "currentColor" : "none";
  return `<svg class="${extraClass}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="${fill}" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
}

// Verdict marks. Geometry is part of the canonical design (DESIGN.md §5):
//   o  — maru: an open circle with a 24° gap at one o'clock (a pen mark,
//        not a UI ring).
//   x  — batsu: two strokes, drawn left-to-right then right-to-left.
//   tri — sankaku: needs-work mark for formative Small Talk feedback.
//   hana — hanamaru: a spiral inside a scalloped ring; perfect session only.
//   dashed-o — revealed answer: same circle, dashed, never counted as earned.
const MARKS = {
  o: '<path class="si-stroke" pathLength="100" stroke-width="3" d="M27.95 7.28A15 15 0 0 1 12.05 32.72A15 15 0 0 1 22.09 5.15"/>',
  "dashed-o": '<path pathLength="100" stroke-width="2.4" stroke-dasharray="6 5" d="M27.95 7.28A15 15 0 0 1 12.05 32.72A15 15 0 0 1 22.09 5.15"/>',
  x: '<path class="si-stroke" pathLength="100" stroke-width="3" d="M11.5 11.5L28.5 28.5"/><path class="si-stroke" pathLength="100" stroke-width="3" d="M28.5 11.5L11.5 28.5"/>',
  tri: '<path class="si-stroke" pathLength="100" stroke-width="2.6" d="M20 7.5L32.5 30.5H7.5Z"/>',
  hana:
    '<path class="si-stroke" pathLength="100" stroke-width="2.2" d="M20.6 19.4a1.6 1.6 0 1 1-2.2 1.3a3.6 3.6 0 1 1 5.2 2.6a6 6 0 1 1-1.7-10.9a8.4 8.4 0 1 1-10.1 4.2"/>' +
    '<path class="si-stroke" pathLength="100" stroke-width="2.2" d="M34.5 20A7.6 7.6 0 0 1 27.3 32.6A7.6 7.6 0 0 1 12.7 32.6A7.6 7.6 0 0 1 5.5 20A7.6 7.6 0 0 1 12.7 7.4A7.6 7.6 0 0 1 27.3 7.4A7.6 7.6 0 0 1 34.5 20Z"/>'
};

export function mark(kind, { draw = false, extraClass = "" } = {}) {
  const body = MARKS[kind];
  if (!body) throw new Error(`Unknown mark: ${kind}`);
  return `<svg class="si-mark ${extraClass}" viewBox="0 0 40 40" aria-hidden="true" focusable="false"${draw ? " data-draw" : ""}>${body}</svg>`;
}

// JabikoMark — the existing brand mascot (ジャビ子), reproduced from
// src/components/JabikoMark.tsx so boards show the retained identity.
export const BRAND_MARK = `<svg viewBox="0 0 64 64" role="img" aria-label="Jabiko"><rect x="2" y="2" width="60" height="60" rx="16" fill="#fdf6ea" stroke="#28385a" stroke-width="2.5"/><g transform="translate(6.4 5) scale(0.8)"><path d="M16 54c2-6 9-9 16-9s14 3 16 9v4H16Z" fill="#f0a49c" stroke="#28385a" stroke-width="3" stroke-linejoin="round"/><rect x="8.5" y="31" width="8" height="13" rx="4" fill="#f0a49c" stroke="#28385a" stroke-width="3"/><rect x="47.5" y="31" width="8" height="13" rx="4" fill="#f0a49c" stroke="#28385a" stroke-width="3"/><rect x="14" y="24" width="36" height="29" rx="14" fill="#fdf6ea" stroke="#28385a" stroke-width="3"/><path d="M32 12C26 9 19 9.5 15 11v10c4-1.5 11-2 17 1.5Z" fill="#fdf6ea" stroke="#28385a" stroke-width="2.6" stroke-linejoin="round"/><path d="M32 12c6-3 13-2.5 17-1v10c-4-1.5-11-2-17 1.5Z" fill="#fdf6ea" stroke="#28385a" stroke-width="2.6" stroke-linejoin="round"/><rect x="18.5" y="13.5" width="9" height="5.6" rx="0.8" fill="none" stroke="#f0a49c" stroke-width="1.3"/><path d="M21.5 13.5v5.6M24.5 13.5v5.6M18.5 16.3h9" stroke="#f0a49c" stroke-width="1.1"/><path d="M36 14.6h9.5M36 16.8h9.5M36 19h7" stroke="#f0a49c" stroke-width="1.5" stroke-linecap="round"/><circle cx="22" cy="42" r="3" fill="#f0a49c"/><circle cx="42" cy="42" r="3" fill="#f0a49c"/><circle cx="26" cy="38" r="3" fill="#28385a"/><circle cx="38" cy="38" r="3" fill="#28385a"/><path d="M27.5 43q4.5 4 9 0" fill="none" stroke="#28385a" stroke-width="2.6" stroke-linecap="round"/></g></svg>`;

const NAV = {
  "zh-Hant": {
    desc: "JLPT 自習室",
    today: "今日", practice: "練習", learn: "學習", grammar: "文型", talk: "會話", reference: "資料",
    focus: "專注", furigana: "振假名", furiOn: "開", furiOff: "關", menu: "選單與設定", home: "Jabiko 首頁"
  },
  en: {
    desc: "JLPT Study Room",
    today: "Today", practice: "Practice", learn: "Learn", grammar: "Grammar", talk: "Small Talk", reference: "Reference",
    focus: "Focus", furigana: "Furigana", furiOn: "On", furiOff: "Off", menu: "Menu and settings", home: "Jabiko home"
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

export function applyTheme() {
  const { theme, lang } = params();
  document.documentElement.dataset.theme = theme;
  document.documentElement.lang = lang;
}

export function topbar(current, { furigana = false } = {}) {
  const { lang } = params();
  const t = NAV[lang];
  const item = (id, href) =>
    `<a href="${href}"${current === id ? ' aria-current="page"' : ""}>${t[id]}</a>`;
  return `<header class="si-topbar">
    <a class="si-brand" href="today.html" aria-label="${t.home}">${BRAND_MARK}<span class="si-brand-word">Jabiko</span><span class="si-brand-desc">${t.desc}</span></a>
    <nav class="si-nav" aria-label="Primary">
      ${item("today", "today.html")}${item("practice", "session.html")}${item("learn", "learn.html")}${item("grammar", "grammar.html")}${item("talk", "talk.html")}
      <button type="button" aria-haspopup="menu" aria-expanded="false"${current === "reference" ? ' data-current="true"' : ""}>${t.reference}${icon("chevron")}</button>
    </nav>
    <div class="si-topbar-tools">
      <button class="si-focus-chip" type="button">${icon("timer")}<span class="si-chrome-label">${t.focus}</span></button>
      <button class="si-toggle" type="button" aria-pressed="${furigana}"><span class="si-furi-glyph" lang="ja">ふ</span><span class="si-chrome-label">${t.furigana}</span><span class="si-toggle-state">${furigana ? t.furiOn : t.furiOff}</span></button>
      <button class="si-iconbtn" type="button" aria-label="${t.menu}" aria-haspopup="menu">${icon("menu")}</button>
    </div>
  </header>`;
}

export function bottombar(current) {
  const { lang } = params();
  const t = NAV[lang];
  const tab = (id, href, ic) =>
    `<a href="${href}"${current === id ? ' aria-current="page"' : ""}><span class="si-tab-glyph">${icon(ic)}</span><span>${t[id]}</span></a>`;
  return `<nav class="si-bottombar" aria-label="Primary">
    ${tab("today", "today.html", "today")}${tab("practice", "session.html", "practice")}${tab("learn", "learn.html", "learn")}${tab("talk", "talk.html", "talk")}${tab("reference", "reference.html", "reference")}
  </nav>`;
}

// Replace <i data-icon="name"> and <i data-mark="kind"> placeholders.
export function hydrate(root = document) {
  for (const el of root.querySelectorAll("i[data-icon]")) {
    el.outerHTML = icon(el.dataset.icon, el.className);
  }
  for (const el of root.querySelectorAll("i[data-mark]")) {
    el.outerHTML = mark(el.dataset.mark, { draw: el.hasAttribute("data-draw"), extraClass: el.className });
  }
}

// Show only the elements whose data-state list contains the current state.
export function showState(defaultState) {
  const state = params().state || defaultState;
  document.documentElement.dataset.boardState = state;
  for (const el of document.querySelectorAll("[data-state]")) {
    const states = el.dataset.state.split(/\s+/);
    el.hidden = !states.includes(state);
  }
  return state;
}
