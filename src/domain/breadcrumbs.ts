import { grammarRoute, staticRoute, type AppRoute } from "./routes";

/**
 * Label set the breadcrumb model resolves against. Kept as plain strings so
 * the builder stays pure (no i18n / DOM coupling) -- the App shell resolves
 * these from `copy[language]` and `legalLabelsFor(language)` (#729).
 */
export interface BreadcrumbLabels {
  /** Accessible name for the breadcrumb <nav> landmark. */
  nav: string;
  home: string;
  learn: string;
  grammar: string;
  about: string;
  kanaTable: string;
  privacy: string;
  terms: string;
}

export interface BreadcrumbCrumb {
  /**
   * Canonical route this crumb navigates to. `null` marks the current
   * (non-clickable) crumb, which carries `aria-current="page"`.
   */
  route: AppRoute | null;
  label: string;
  /** Natural-language override for the crumb text (e.g. "ja" for a 文型 surface). */
  lang?: string;
}

export interface BreadcrumbModel {
  label: string;
  crumbs: readonly BreadcrumbCrumb[];
}

/**
 * Pure breadcrumb-model builder. Renders a breadcrumb only for nested routes
 * with a real parent hierarchy; top-level routes return `null` so the App
 * shell never shows a mechanical "Home > Current" strip. Every parent crumb is
 * a deterministic canonical route (never browser history), so direct loads and
 * in-app navigation produce identical output.
 */
export function buildBreadcrumbs(
  route: AppRoute,
  labels: BreadcrumbLabels
): BreadcrumbModel | null {
  const { view, grammarSurface } = route;

  if (view === "grammar" && grammarSurface !== null) {
    const isLevelRoute = /^[Nn][1-5]$/.test(grammarSurface);
    return {
      label: labels.nav,
      crumbs: [
        { route: staticRoute("home"), label: labels.home },
        { route: grammarRoute(), label: labels.grammar },
        {
          route: null,
          label: isLevelRoute ? grammarSurface.toUpperCase() : grammarSurface,
          lang: isLevelRoute ? undefined : "ja"
        }
      ]
    };
  }

  if (view === "kana") {
    return {
      label: labels.nav,
      crumbs: [
        { route: staticRoute("home"), label: labels.home },
        { route: staticRoute("learn"), label: labels.learn },
        { route: null, label: labels.kanaTable }
      ]
    };
  }

  if (view === "privacy" || view === "terms") {
    return {
      label: labels.nav,
      crumbs: [
        { route: staticRoute("home"), label: labels.home },
        { route: staticRoute("about"), label: labels.about },
        {
          route: null,
          label: view === "privacy" ? labels.privacy : labels.terms
        }
      ]
    };
  }

  return null;
}

/**
 * Breadcrumb click policy: an unmodified left click may be intercepted for SPA
 * navigation; modifier clicks (new tab / window / download), middle clicks and
 * already-prevented events stay native.
 */
export function shouldInterceptCrumbClick(event: {
  defaultPrevented: boolean;
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}): boolean {
  if (event.defaultPrevented || event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  return true;
}
