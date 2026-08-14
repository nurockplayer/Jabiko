import type { LocaleCode } from "./types";
import type { AppRoute, AppView } from "./routes";

export type NavigationGroup = "primary" | "resource";
export type NavigationId =
  | "home"
  | "learn"
  | "challenge"
  | "mock"
  | "grammar"
  | "rules"
  | "kanji"
  | "kana"
  | "about";
export type NavigationIcon =
  | "home"
  | "learn"
  | "challenge"
  | "mock"
  | "grammar"
  | "rules"
  | "kanji"
  | "kana"
  | "about";
export type NavigationLabelKey =
  | "home"
  | "learn"
  | "challenge"
  | "mockExam"
  | "grammar"
  | "rules"
  | "kanji"
  | "kanaPageTitle"
  | "about";

export interface NavigationDefinition {
  readonly id: NavigationId;
  readonly view: AppView;
  readonly group: NavigationGroup;
  readonly labelKey: NavigationLabelKey;
  readonly icon: NavigationIcon;
  readonly zhHantOnly?: true;
}

export interface ResolvedNavigationEntry extends NavigationDefinition {
  readonly current: boolean;
}

export const NAVIGATION_REGISTRY: readonly NavigationDefinition[] = [
  { id: "home", view: "home", group: "primary", labelKey: "home", icon: "home" },
  { id: "learn", view: "learn", group: "primary", labelKey: "learn", icon: "learn" },
  { id: "challenge", view: "challenge", group: "primary", labelKey: "challenge", icon: "challenge" },
  { id: "mock", view: "mock", group: "primary", labelKey: "mockExam", icon: "mock" },
  { id: "grammar", view: "grammar", group: "primary", labelKey: "grammar", icon: "grammar" },
  { id: "rules", view: "rules", group: "resource", labelKey: "rules", icon: "rules" },
  { id: "kanji", view: "kanji", group: "resource", labelKey: "kanji", icon: "kanji" },
  { id: "kana", view: "kana", group: "resource", labelKey: "kanaPageTitle", icon: "kana" },
  { id: "about", view: "about", group: "resource", labelKey: "about", icon: "about" }
] as const;

function isCurrent(entry: NavigationDefinition, route: AppRoute): boolean {
  if (entry.id === "learn") return route.view === "learn" || route.view === "kana";
  if (entry.id === "about") {
    return route.view === "about" || route.view === "privacy" || route.view === "terms";
  }
  return route.view === entry.view;
}

export function resolveNavigation(route: AppRoute, language: LocaleCode): {
  primary: ResolvedNavigationEntry[];
  resources: ResolvedNavigationEntry[];
  resourcesCurrent: boolean;
} {
  const visible = NAVIGATION_REGISTRY.filter(
    (entry) => !entry.zhHantOnly || language === "zh-Hant"
  ).map((entry) => ({ ...entry, current: isCurrent(entry, route) }));
  const primary = visible.filter((entry) => entry.group === "primary");
  const resources = visible.filter((entry) => entry.group === "resource");
  return { primary, resources, resourcesCurrent: resources.some((entry) => entry.current) };
}
