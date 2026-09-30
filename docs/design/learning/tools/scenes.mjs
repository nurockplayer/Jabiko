// Shared scene registry for Shu-ire SI-1 design tooling. verify.mjs checks
// BOARDS and captures CAPTURES into ../renders; figma/serialize.mjs and
// figma/import.mjs turn the same CAPTURES into editable Figma frames, so the
// committed renders and the Figma frames are 1:1.

export const VIEWPORTS = { "320x640": [320, 640], "390x844": [390, 844], "1280x800": [1280, 800], "1440x900": [1440, 900] };

export const BOARDS = [
  ["today.html", ["returning", "first"]],
  ["session.html", ["q", "correct", "wrong", "revealed", "recall", "complete", "perfect", "empty", "loading", "error"]],
  ["sets.html", ["switcher", "mock"]],
  ["learn.html", [""]],
  ["grammar.html", ["index", "point"]],
  ["reference.html", ["page", "sheet"]],
  ["talk.html", ["intro", "respond", "feedback", "complete"]],
  ["system.html", ["menu-guest", "menu-user", "language", "delete", "focus-config", "focus-break", "offline", "update", "feedback", "route-error"]]
];

// [board?query, viewport, fullPage, mode]
export const CAPTURES = [
  ["cover.html", "1440x900", true],
  ["specimen.html", "1440x900", true],
  ["specimen.html?theme=dark", "1440x900", true],
  ["today.html", "1440x900", true],
  ["today.html", "390x844", true],
  ["today.html", "320x640", false],
  ["today.html?state=first", "1440x900", false],
  ["today.html?state=first", "390x844", true],
  ["today.html?theme=dark", "1440x900", false],
  ["session.html", "1440x900", false],
  ["session.html", "390x844", false],
  ["session.html?state=correct", "1440x900", false],
  ["session.html?state=wrong", "1440x900", false],
  ["session.html?state=wrong", "1280x800", false],
  ["session.html?state=wrong", "390x844", true],
  ["session.html?state=wrong", "320x640", false],
  ["session.html?state=wrong&lang=en", "1440x900", false],
  ["session.html?state=wrong&theme=dark", "1440x900", false],
  ["session.html?state=wrong&theme=dark", "390x844", false],
  ["session.html?state=wrong", "1440x900", false, "forced"],
  ["session.html?state=revealed", "390x844", false],
  ["session.html?state=recall", "390x844", false],
  ["session.html?state=complete", "1440x900", false],
  ["session.html?state=complete", "390x844", true],
  ["session.html?state=perfect", "390x844", false],
  ["session.html?state=empty", "390x844", false],
  ["session.html?state=loading", "390x844", false],
  ["session.html?state=error", "390x844", false],
  ["sets.html", "1440x900", false],
  ["sets.html", "390x844", false],
  ["sets.html?state=mock", "1440x900", true],
  ["sets.html?state=mock", "390x844", true],
  ["learn.html", "1440x900", true],
  ["learn.html", "390x844", true],
  ["grammar.html", "1440x900", false],
  ["grammar.html", "390x844", true],
  ["grammar.html?state=point", "1440x900", false],
  ["grammar.html?state=point", "390x844", true],
  ["reference.html", "1440x900", false],
  ["reference.html", "390x844", false],
  ["reference.html?state=sheet", "390x844", false],
  ["talk.html", "1440x900", false],
  ["talk.html", "390x844", true],
  ["talk.html?state=respond", "390x844", false],
  ["talk.html?state=feedback", "1440x900", false],
  ["talk.html?state=feedback", "390x844", true],
  ["talk.html?state=complete", "390x844", false],
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

// Figma page for each board file.
export const FIGMA_PAGES = {
  "cover.html": "00 Index",
  "specimen.html": "01 Foundations",
  "today.html": "10 Today",
  "session.html": "20 Practice session",
  "sets.html": "30 Sets & JLPT sections",
  "learn.html": "40 Learn · Grammar · Reference",
  "grammar.html": "40 Learn · Grammar · Reference",
  "reference.html": "40 Learn · Grammar · Reference",
  "talk.html": "50 Small Talk",
  "system.html": "60 Shell & System"
};

export function captureName(board, vp, mode) {
  const [file, query = ""] = board.split("?");
  const q = query ? `-${query.replace(/[=&]/g, "-")}` : "";
  return `${file.replace(/\.html$/, "")}${q}${mode ? `-${mode}` : ""}-${vp}`;
}

// Human-readable scene label used for Figma frame names.
export function sceneLabel(board, vp, mode) {
  const [file, query = ""] = board.split("?");
  const params = new URLSearchParams(query);
  const bits = [file.replace(/\.html$/, "")];
  bits.push(params.get("state") || "default");
  if (params.get("theme")) bits.push(params.get("theme"));
  if (params.get("lang")) bits.push(params.get("lang"));
  if (mode) bits.push(`${mode} colors`);
  return `${bits.join(" · ")} · ${vp.replace("x", "×")}`;
}
