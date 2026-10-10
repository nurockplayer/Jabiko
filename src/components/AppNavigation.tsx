import {
  BookA,
  Ellipsis,
  BookOpen,
  ClipboardList,
  GraduationCap,
  Handshake,
  Home,
  Info,
  Library,
  MessageCircle,
  Table,
  Target,
  Type,
  type LucideIcon
} from "lucide-react";
import { useEffect, useRef, type MouseEvent } from "react";
import { APP_VIEW_PATHS } from "../domain/routes";
import type {
  NavigationIcon,
  NavigationId,
  NavigationLabelKey,
  ResolvedNavigationEntry
} from "../domain/navigation";
import { MoreMenu, type MoreMenuNavItem, type MoreMenuTools } from "./MoreMenu";

const ICONS: Record<NavigationIcon, LucideIcon> = {
  home: Home,
  challenge: Target,
  learn: GraduationCap,
  grammar: BookOpen,
  conversation: MessageCircle,
  rules: Table,
  kanji: BookA,
  kana: Type,
  mock: ClipboardList,
  about: Info,
  stayD: Handshake
};

const iconStyle = { verticalAlign: "middle", marginRight: "0.2rem" } as const;

export interface ResolvedNavigation {
  primary: ResolvedNavigationEntry[];
  resources: ResolvedNavigationEntry[];
  resourcesCurrent: boolean;
  menu: ResolvedNavigationEntry[];
  menuCurrent: boolean;
}

function menuItems(entries: ResolvedNavigationEntry[], labels: Record<NavigationLabelKey, string>, onSelect: (id: NavigationId) => void): MoreMenuNavItem[] {
  return entries.map((entry) => {
    const Icon = ICONS[entry.icon];
    return {
      key: entry.id,
      label: labels[entry.labelKey],
      icon: <Icon aria-hidden="true" size={16} style={iconStyle} />,
      selected: entry.current,
      onSelect: () => onSelect(entry.id)
    };
  });
}

function handlePrimaryClick(
  event: MouseEvent<HTMLAnchorElement>,
  entry: ResolvedNavigationEntry,
  onSelect: (id: NavigationId) => void
) {
  const ordinarySameWindowClick =
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey &&
    !event.defaultPrevented &&
    (!event.currentTarget.target || event.currentTarget.target === "_self") &&
    !event.currentTarget.hasAttribute("download");
  if (!ordinarySameWindowClick) return;
  event.preventDefault();
  onSelect(entry.id);
}

export function AppNavigation({
  ariaLabel,
  navigation,
  labels,
  resourcesLabel,
  resourcesCurrentLabel,
  onSelect
}: {
  ariaLabel: string;
  navigation: ResolvedNavigation;
  labels: Record<NavigationLabelKey, string>;
  resourcesLabel: string;
  resourcesCurrentLabel: (page: string) => string;
  onSelect: (id: NavigationId) => void;
}) {
  const navigationRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const navigationElement = navigationRef.current;
    const shell = navigationElement?.closest<HTMLElement>(".app-shell");
    if (!navigationElement || !shell || typeof ResizeObserver === "undefined") return;

    const publishOccupiedHeight = (height: number) => {
      if (!Number.isFinite(height) || height <= 0) {
        shell.style.removeProperty("--jt-compact-nav-occupied");
        return;
      }
      const value = `${height}px`;
      if (shell.style.getPropertyValue("--jt-compact-nav-occupied") !== value) {
        shell.style.setProperty("--jt-compact-nav-occupied", value);
      }
    };
    const observer = new ResizeObserver((entries) => {
      const entry = entries.find(({ target }) => target === navigationElement);
      if (!entry) return;
      const borderBox = Array.isArray(entry.borderBoxSize) ? entry.borderBoxSize[0] : entry.borderBoxSize;
      publishOccupiedHeight(borderBox?.blockSize ?? navigationElement.getBoundingClientRect().height);
    });

    observer.observe(navigationElement, { box: "border-box" });
    return () => {
      observer.disconnect();
      shell.style.removeProperty("--jt-compact-nav-occupied");
    };
  }, []);

  const grammarEntry = navigation.primary.find((entry) => entry.id === "grammar");
  const compactResourceEntries = grammarEntry
    ? [grammarEntry, ...navigation.resources]
    : navigation.resources;
  const desktopResourceItems = menuItems(navigation.resources, labels, onSelect);
  const compactResourceItems = menuItems(compactResourceEntries, labels, onSelect);

  return (
    <nav ref={navigationRef} className="view-switch segmented jt1-navigation jt1-primary-nav" aria-label={ariaLabel}>
      {navigation.primary.map((entry) => {
        const Icon = ICONS[entry.icon];
        return (
          <a
            key={entry.id}
            data-nav={entry.id}
            data-wide-only={entry.wideOnly ? "true" : undefined}
            className={entry.current ? "selected" : ""}
            href={APP_VIEW_PATHS[entry.view]}
            aria-current={entry.current ? "page" : undefined}
            onClick={(event) => handlePrimaryClick(event, entry, onSelect)}
          >
            <Icon aria-hidden="true" size={16} style={iconStyle} />
            {labels[entry.labelKey]}
          </a>
        );
      })}
      <MoreMenu
        className="nav-resources-wide"
        triggerLabel={resourcesLabel}
        triggerCurrentLabel={resourcesCurrentLabel}
        items={desktopResourceItems}
      />
      {/* #866: an icon above the label like the other four tabs (the
          popup is announced by aria-haspopup). */}
      <MoreMenu
        className="nav-resources-compact"
        triggerLabel={resourcesLabel}
        triggerCurrentLabel={resourcesCurrentLabel}
        triggerIcon={<Library aria-hidden="true" size={20} />}
        items={compactResourceItems}
      />
    </nav>
  );
}

export function AppHeaderMenu({
  navigation,
  labels,
  triggerLabel,
  triggerCurrentLabel,
  tools,
  onSelect
}: {
  navigation: ResolvedNavigation;
  labels: Record<NavigationLabelKey, string>;
  triggerLabel: string;
  triggerCurrentLabel: (page: string) => string;
  tools: MoreMenuTools;
  onSelect: (id: NavigationId) => void;
}) {
  const items = menuItems(navigation.menu, labels, onSelect);
  return (
    <MoreMenu
      className="jt1-header-menu"
      triggerLabel={triggerLabel}
      triggerCurrentLabel={triggerCurrentLabel}
      items={items}
      tools={tools}
      triggerIcon={<Ellipsis aria-hidden="true" size={20} />}
      visuallyHiddenTriggerLabel
    />
  );
}
