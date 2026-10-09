// Shared scene registry for Jabiko JT-1 design tooling. verify.mjs checks
// BOARDS and captures CAPTURES into ../renders; figma/serialize.mjs and
// figma/import.mjs turn the same CAPTURES into editable Figma frames, so the
// committed renders and the Figma frames are 1:1.

export const VIEWPORTS = {
  "320x640": [320, 640],
  "390x844": [390, 844],
  "768x1024": [768, 1024],
  "1280x800": [1280, 800],
  "1440x900": [1440, 900]
};

// Specimen boards show forced states and compact specimens side by side; they
// are checked for overflow, headings and contrast but not for touch targets.
export const SPECIMEN_BOARDS = new Set(["index.html", "foundation.html", "components.html"]);

export const BOARDS = [
  ["index.html", [""]],
  ["foundation.html", [""]],
  ["components.html", [""]],
  ["today.html", ["returning", "first"]],
  ["session.html", ["q", "correct", "wrong", "revealed", "recall", "settings", "settings-basic", "settings-range", "settings-custom", "summary", "complete", "perfect", "empty", "loading", "error"]],
  ["sets.html", ["switcher", "mock"]],
  ["learn.html", [""]],
  ["grammar.html", ["index", "point"]],
  ["reference.html", ["page", "selected", "sheet"]],
  ["talk.html", ["intro", "respond", "feedback", "complete"]],
  ["world.html", ["home", "moment", "feedback", "complete", "handoff", "handoff-stale", "empty", "error", "progress-error"]],
  ["system.html", ["menu-guest", "menu-user", "language", "delete", "focus-config", "focus-break", "offline", "update", "feedback", "route-error"]]
];

// [board?query, viewport, fullPage, mode]
export const CAPTURES = [
  ["index.html", "1440x900", true],
  ["foundation.html", "1440x900", true],
  ["foundation.html?theme=dark", "1440x900", true],
  ["components.html", "1440x900", true],
  ["components.html?theme=dark", "1440x900", true],
  ["components.html", "1440x900", true, "forced"],

  ["today.html", "1440x900", true],
  ["today.html", "768x1024", true],
  ["today.html", "390x844", true],
  ["today.html", "320x640", false],
  ["today.html?state=first", "1440x900", false],
  ["today.html?state=first", "390x844", true],
  ["today.html?theme=dark", "1440x900", false],
  ["today.html?theme=dark", "390x844", false],

  ["session.html?state=q", "1440x900", false],
  ["session.html?state=q", "390x844", false],
  ["session.html?state=correct", "1440x900", false],
  ["session.html?state=wrong", "1440x900", false],
  ["session.html?state=wrong", "1280x800", false],
  ["session.html?state=wrong", "768x1024", false],
  ["session.html?state=wrong", "390x844", false],
  ["session.html?state=wrong", "390x844", true],
  ["session.html?state=wrong", "320x640", false],
  ["session.html?state=wrong&lang=en", "1440x900", false],
  ["session.html?state=wrong&theme=dark", "1440x900", false],
  ["session.html?state=wrong&theme=dark", "390x844", false],
  ["session.html?state=wrong", "1440x900", false, "forced"],
  ["session.html?state=revealed", "390x844", false],
  ["session.html?state=recall", "1440x900", false],
  ["session.html?state=recall", "390x844", false],
  ["session.html?state=settings", "390x844", false],
  ["session.html?state=settings-basic", "390x844", false],
  ["session.html?state=settings-basic", "1440x900", false],
  ["session.html?state=settings-range", "390x844", false],
  ["session.html?state=settings-custom", "390x844", false],
  ["session.html?state=summary", "390x844", false],
  ["session.html?state=settings-basic", "390x844", false, "forced"],
  ["session.html?state=wrong&fixture=long", "390x844", true],
  ["session.html?state=wrong&fixture=long", "768x1024", false],
  ["session.html?state=complete", "1440x900", false],
  ["session.html?state=complete", "390x844", true],
  ["session.html?state=perfect", "390x844", false],
  ["session.html?state=empty", "390x844", false],
  ["session.html?state=loading", "390x844", false],
  ["session.html?state=error", "390x844", false],

  ["sets.html?state=switcher", "1440x900", false],
  ["sets.html?state=switcher", "390x844", false],
  ["sets.html?state=mock", "1440x900", true],
  ["sets.html?state=mock", "390x844", true],

  ["learn.html", "1440x900", true],
  ["learn.html", "768x1024", false],
  ["learn.html", "390x844", true],
  ["grammar.html?state=index", "1440x900", false],
  ["grammar.html?state=index", "390x844", true],
  ["grammar.html?state=point", "1440x900", true],
  ["grammar.html?state=point", "390x844", true],
  ["reference.html?state=page", "1440x900", false],
  ["reference.html?state=page", "390x844", false],
  ["reference.html?state=selected", "1440x900", false],
  ["reference.html?state=selected", "390x844", true],
  ["reference.html?state=sheet", "390x844", false],

  ["talk.html?state=intro", "1440x900", false],
  ["talk.html?state=intro", "390x844", true],
  ["talk.html?state=respond", "1440x900", false],
  ["talk.html?state=respond", "390x844", false],
  ["talk.html?state=feedback", "1440x900", true],
  ["talk.html?state=feedback", "390x844", true],
  ["talk.html?state=complete", "390x844", false],

  ["world.html?state=home", "1440x900", true],
  ["world.html?state=home", "768x1024", false],
  ["world.html?state=home", "390x844", true],
  ["world.html?state=home&theme=dark", "1440x900", false],
  ["world.html?state=moment", "390x844", false],
  ["world.html?state=feedback", "1440x900", true],
  ["world.html?state=feedback", "390x844", true],
  ["world.html?state=complete", "390x844", false],
  ["world.html?state=complete", "1440x900", false],
  ["world.html?state=handoff", "1440x900", false],
  ["world.html?state=handoff", "390x844", false],
  ["world.html?state=handoff-stale", "390x844", false],
  ["world.html?state=empty", "390x844", false],
  ["world.html?state=error", "390x844", false],
  ["world.html?state=progress-error", "390x844", false],

  ["system.html?state=menu-guest", "1440x900", false],
  ["system.html?state=menu-guest", "390x844", false],
  ["system.html?state=menu-user", "1440x900", false],
  ["system.html?state=language", "390x844", false],
  ["system.html?state=delete", "390x844", false],
  ["system.html?state=focus-config", "390x844", false],
  ["system.html?state=focus-break", "1440x900", false],
  ["system.html?state=focus-break", "390x844", false],
  ["system.html?state=offline", "390x844", false],
  ["system.html?state=update", "390x844", false],
  ["system.html?state=feedback", "390x844", false],
  ["system.html?state=route-error", "390x844", false]
];

// Figma page for each board file. The JT-1 file is on Figma's Starter plan
// (three pages; the bridge cannot rename or delete pages), so the system
// boards share "00 Index" and every surface lives on "01 Foundations" in
// labelled board rows (BOARD_LABELS). "Page 1" is the archive. The founder
// renames the two pages by hand ("00 System", "10 Surfaces"); the registry
// records page IDs, which survive renaming.
export const FIGMA_PAGES = {
  "index.html": "00 Index",
  "foundation.html": "00 Index",
  "components.html": "00 Index",
  "today.html": "01 Foundations",
  "session.html": "01 Foundations",
  "sets.html": "01 Foundations",
  "learn.html": "01 Foundations",
  "grammar.html": "01 Foundations",
  "reference.html": "01 Foundations",
  "talk.html": "01 Foundations",
  "world.html": "01 Foundations",
  "system.html": "01 Foundations"
};

export const FIGMA_ARCHIVE_PAGE = "Page 1";

// Row label drawn above each board's frames.
export const BOARD_LABELS = {
  "index.html": "00 Index",
  "foundation.html": "01 Foundations",
  "components.html": "02 Components",
  "today.html": "10 Today",
  "session.html": "20 Practice session",
  "sets.html": "30 Sets & JLPT sections",
  "learn.html": "40 Learn",
  "grammar.html": "41 Grammar",
  "reference.html": "42 Reference",
  "talk.html": "50 Small Talk",
  "world.html": "60 World",
  "system.html": "70 Shell & System"
};

export function captureName(board, vp, mode, fullPage) {
  const [file, query = ""] = board.split("?");
  const q = query ? `-${query.replace(/[=&]/g, "-")}` : "";
  return `${file.replace(/\.html$/, "")}${q}${mode ? `-${mode}` : ""}-${vp}${fullPage && needsFullSuffix(board, vp, mode) ? "-full" : ""}`;
}

// The same board/viewport is captured both as a viewport and a full page only
// for the session wrong state at 390 (fold evidence vs. whole answer flow).
function needsFullSuffix(board, vp, mode) {
  return CAPTURES.filter(([b, v, , m]) => b === board && v === vp && m === mode).length > 1;
}

// Human-readable scene label used for Figma frame names.
export function sceneLabel(board, vp, mode, fullPage) {
  const [file, query = ""] = board.split("?");
  const params = new URLSearchParams(query);
  const bits = [file.replace(/\.html$/, "")];
  bits.push(params.get("state") || "default");
  if (params.get("theme")) bits.push(params.get("theme"));
  if (params.get("lang")) bits.push(params.get("lang"));
  if (params.get("fixture")) bits.push(`${params.get("fixture")} content`);
  if (mode) bits.push(`${mode} colors`);
  if (fullPage && needsFullSuffix(board, vp, mode)) bits.push("full page");
  return `${bits.join(" · ")} · ${vp.replace("x", "×")}`;
}
