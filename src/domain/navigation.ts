import type { LocaleCode } from "./types";
import type { AppRoute, AppView } from "./routes";
import { STAY_D_REQUIRED_LOCALES } from "./stayD";

type NavigationGroup = "primary" | "resource" | "menu";
export type NavigationId =
  | "home"
  | "challenge"
  | "learn"
  | "grammar"
  | "conversation"
  | "rules"
  | "kanji"
  | "kana"
  | "mock"
  | "stayD"
  | "about";
export type NavigationIcon = NavigationId;
export type NavigationLabelKey =
  | "today"
  | "practice"
  | "learn"
  | "grammar"
  | "conversation"
  | "rules"
  | "kanji"
  | "kanaPageTitle"
  | "mockExam"
  | "about"
  | "navPartnership";

export interface NavigationDefinition {
  readonly id: NavigationId;
  readonly view: AppView;
  readonly group: NavigationGroup;
  readonly labelKey: NavigationLabelKey;
  readonly icon: NavigationIcon;
  /** Hidden below the wide breakpoint while remaining reachable in Resources. */
  readonly wideOnly?: true;
  readonly zhHantOnly?: true;
  readonly locales?: readonly LocaleCode[];
}

export interface ResolvedNavigationEntry extends NavigationDefinition {
  readonly current: boolean;
}

export const NAVIGATION_REGISTRY: readonly NavigationDefinition[] = [
  { id: "home", view: "home", group: "primary", labelKey: "today", icon: "home" },
  { id: "challenge", view: "challenge", group: "primary", labelKey: "practice", icon: "challenge" },
  { id: "learn", view: "learn", group: "primary", labelKey: "learn", icon: "learn" },
  { id: "grammar", view: "grammar", group: "primary", labelKey: "grammar", icon: "grammar", wideOnly: true },
  { id: "conversation", view: "conversation", group: "primary", labelKey: "conversation", icon: "conversation" },
  { id: "rules", view: "rules", group: "resource", labelKey: "rules", icon: "rules" },
  { id: "kanji", view: "kanji", group: "resource", labelKey: "kanji", icon: "kanji" },
  { id: "kana", view: "kana", group: "resource", labelKey: "kanaPageTitle", icon: "kana" },
  { id: "mock", view: "mock", group: "menu", labelKey: "mockExam", icon: "mock" },
  {
    id: "stayD",
    view: "stayD",
    group: "menu",
    labelKey: "navPartnership",
    icon: "stayD",
    locales: STAY_D_REQUIRED_LOCALES
  },
  { id: "about", view: "about", group: "menu", labelKey: "about", icon: "about" }
] as const;

function isCurrent(entry: NavigationDefinition, route: AppRoute): boolean {
  if (entry.id === "learn") return route.view === "learn";
  if (entry.id === "challenge") return route.view === "challenge" || route.view === "mock";
  if (entry.id === "about") {
    return route.view === "about" || route.view === "privacy" || route.view === "terms";
  }
  return route.view === entry.view;
}

export function resolveNavigation(route: AppRoute, language: LocaleCode): {
  primary: ResolvedNavigationEntry[];
  resources: ResolvedNavigationEntry[];
  resourcesCurrent: boolean;
  menu: ResolvedNavigationEntry[];
  menuCurrent: boolean;
} {
  const visible = NAVIGATION_REGISTRY.filter(
    (entry) =>
      (!entry.zhHantOnly || language === "zh-Hant") &&
      (!entry.locales || entry.locales.includes(language))
  ).map((entry) => ({ ...entry, current: isCurrent(entry, route) }));
  const primary = visible.filter((entry) => entry.group === "primary");
  const resources = visible.filter((entry) => entry.group === "resource");
  const menu = visible.filter((entry) => entry.group === "menu");
  return {
    primary,
    resources,
    resourcesCurrent: resources.some((entry) => entry.current) || primary.some((entry) => entry.id === "grammar" && entry.current),
    menu,
    menuCurrent: menu.some((entry) => entry.current)
  };
}
