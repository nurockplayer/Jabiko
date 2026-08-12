import { canonicalArticleSlug } from "./articlesMeta";

// Single source of truth for top-level app views and their static paths.
// Dynamic grammar and blog routes extend their respective base paths below.
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
  grammar: "/grammar",
  blog: "/blog"
} as const;

export type AppView = keyof typeof APP_VIEW_PATHS;

export interface AppRoute {
  view: AppView;
  grammarSurface: string | null;
  blogSlug: string | null;
}

export function staticRoute(view: AppView): AppRoute {
  return { view, grammarSurface: null, blogSlug: null };
}

export function grammarRoute(surface?: string | null): AppRoute {
  return { view: "grammar", grammarSurface: surface ?? null, blogSlug: null };
}

export function blogRoute(slug?: string | null): AppRoute {
  return { view: "blog", grammarSurface: null, blogSlug: slug ?? null };
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

/** Parse a pathname into the state consumed by the App shell. */
export function parseRoute(pathname: string): AppRoute {
  const grammar = pathname.match(/^\/grammar\/(.+)$/);
  if (grammar) {
    return grammarRoute(decodePathSegment(grammar[1]));
  }

  const blog = pathname.match(/^\/blog\/(.+)$/);
  if (blog) {
    return blogRoute(canonicalArticleSlug(decodePathSegment(blog[1])));
  }

  const view = (Object.keys(APP_VIEW_PATHS) as AppView[]).find(
    (candidate) => APP_VIEW_PATHS[candidate] === pathname
  );
  return staticRoute(view ?? "home");
}

/** Serialize App route state back to its canonical pathname. */
export function serializeRoute(route: AppRoute): string {
  if (route.view === "grammar" && route.grammarSurface) {
    return `${APP_VIEW_PATHS.grammar}/${encodeURIComponent(route.grammarSurface)}`;
  }
  if (route.view === "blog" && route.blogSlug) {
    return `${APP_VIEW_PATHS.blog}/${encodeURIComponent(route.blogSlug)}`;
  }
  return APP_VIEW_PATHS[route.view];
}
