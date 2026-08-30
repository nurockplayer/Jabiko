// Single source of truth for top-level app views and their static paths.
// Dynamic grammar routes extend the grammar base path below.
export const APP_VIEW_PATHS = {
  home: "/",
  learn: "/learn",
  rules: "/rules",
  kanji: "/kanji",
  kana: "/kana",
  challenge: "/challenge",
  mock: "/mock",
  about: "/about",
  privacy: "/privacy",
  terms: "/terms",
  stayD: "/stay-d",
  grammar: "/grammar"
} as const;

export type AppView = keyof typeof APP_VIEW_PATHS;

export interface AppRoute {
  view: AppView;
  grammarSurface: string | null;
}

export function staticRoute(view: AppView): AppRoute {
  return { view, grammarSurface: null };
}

export function grammarRoute(surface?: string | null): AppRoute {
  return { view: "grammar", grammarSurface: surface ?? null };
}

function decodePathSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    // Preserve the existing fallback for malformed escapes instead of
    // letting one bad URL prevent the app shell from rendering.
    return segment;
  }
}

/**
 * Parse a pathname into the state consumed by the App shell.
 *
 * Any path that isn't in the table falls back to home. The retired /blog and
 * /blog/<slug> routes (#483, removed 2026-08 when the 文章 section moved to the
 * author's own site) land there through this same fallback -- no special case,
 * no broken view.
 */
export function parseRoute(pathname: string): AppRoute {
  const grammar = pathname.match(/^\/grammar\/(.+)$/);
  if (grammar) {
    return grammarRoute(decodePathSegment(grammar[1]));
  }

  const view = (Object.keys(APP_VIEW_PATHS) as AppView[]).find(
    (candidate) => APP_VIEW_PATHS[candidate] === pathname
  );
  return staticRoute(view ?? "home");
}

/** Serialize App route state back to its canonical pathname. */
export function serializeRoute(route: AppRoute): string {
  if (route.view === "grammar" && route.grammarSurface) {
    const surface = /^[Nn][1-5]$/.test(route.grammarSurface)
      ? route.grammarSurface.toLowerCase()
      : route.grammarSurface;
    return `${APP_VIEW_PATHS.grammar}/${encodeURIComponent(surface)}`;
  }
  return APP_VIEW_PATHS[route.view];
}

/**
 * Whether pathname and route identify the same JLPT level hub even though the
 * pathname still uses a legacy uppercase segment. App uses this to replace
 * that history entry during canonicalization instead of creating a Back loop.
 */
export function isEquivalentGrammarLevelPath(pathname: string, route: AppRoute): boolean {
  const current = parseRoute(pathname);
  if (current.view !== "grammar" || route.view !== "grammar") return false;
  if (!current.grammarSurface || !route.grammarSurface) return false;
  if (!/^[Nn][1-5]$/.test(current.grammarSurface) || !/^[Nn][1-5]$/.test(route.grammarSurface)) {
    return false;
  }
  return current.grammarSurface.toLowerCase() === route.grammarSurface.toLowerCase();
}
