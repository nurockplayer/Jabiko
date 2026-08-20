import {
  BookA,
  BookOpen,
  ClipboardList,
  GraduationCap,
  Handshake,
  Home,
  Info,
  Table,
  Target,
  Type,
  type LucideIcon
} from "lucide-react";
import type {
  NavigationIcon,
  NavigationId,
  NavigationLabelKey,
  ResolvedNavigationEntry
} from "../domain/navigation";
import { MoreMenu, type MoreMenuNavItem, type MoreMenuTools } from "./MoreMenu";

const ICONS: Record<NavigationIcon, LucideIcon> = {
  home: Home,
  learn: GraduationCap,
  challenge: Target,
  mock: ClipboardList,
  grammar: BookOpen,
  rules: Table,
  kanji: BookA,
  kana: Type,
  about: Info,
  stayD: Handshake
};

const iconStyle = { verticalAlign: "middle", marginRight: "0.2rem" } as const;

export interface ResolvedNavigation {
  primary: ResolvedNavigationEntry[];
  resources: ResolvedNavigationEntry[];
  resourcesCurrent: boolean;
}

export function AppNavigation({
  ariaLabel,
  navigation,
  labels,
  resourcesLabel,
  resourcesCurrentLabel,
  moreLabel,
  moreCurrentLabel,
  tools,
  onSelect
}: {
  ariaLabel: string;
  navigation: ResolvedNavigation;
  labels: Record<NavigationLabelKey, string>;
  resourcesLabel: string;
  resourcesCurrentLabel: (page: string) => string;
  moreLabel: string;
  moreCurrentLabel: (page: string) => string;
  tools: MoreMenuTools;
  onSelect: (id: NavigationId) => void;
}) {
  const resourceItems: MoreMenuNavItem[] = navigation.resources.map((entry) => {
    const Icon = ICONS[entry.icon];
    return {
      key: entry.id,
      label: labels[entry.labelKey],
      icon: <Icon aria-hidden="true" size={16} style={iconStyle} />,
      selected: entry.current,
      onSelect: () => onSelect(entry.id)
    };
  });

  return (
    <nav className="view-switch segmented" aria-label={ariaLabel}>
      {navigation.primary.map((entry) => {
        const Icon = ICONS[entry.icon];
        return (
          <button
            key={entry.id}
            type="button"
            data-nav={entry.id}
            className={entry.current ? "selected" : ""}
            aria-current={entry.current ? "page" : undefined}
            onClick={() => onSelect(entry.id)}
          >
            <Icon aria-hidden="true" size={16} style={iconStyle} />
            {labels[entry.labelKey]}
          </button>
        );
      })}
      <MoreMenu
        className="nav-resources"
        triggerLabel={resourcesLabel}
        triggerCurrentLabel={resourcesCurrentLabel}
        items={resourceItems}
      />
      <MoreMenu
        triggerLabel={moreLabel}
        triggerCurrentLabel={moreCurrentLabel}
        resourcesHeading={resourcesLabel}
        items={resourceItems}
        tools={tools}
      />
    </nav>
  );
}
