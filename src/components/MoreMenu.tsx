import { useCallback, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, Globe, Languages, LogIn, LogOut, MessageCircle, SunMoon, Timer, Trash2 } from "lucide-react";

// #608: the mobile nav keeps five primary entries; the rest of the site lives
// behind this 更多 menu -- secondary views first, then the header tools
// (language / furigana / theme / feedback / auth) under a labelled divider.
// Desktop never shows the trigger (CSS), but the component is always mounted
// so the behaviour is identical wherever the breakpoint puts it.

export interface MoreMenuNavItem {
  key: string;
  label: string;
  icon: ReactNode;
  selected: boolean;
  onSelect: () => void;
}

export interface MoreMenuTools {
  heading: string;
  /** Focus Mode (#771) — mobile mirror of the header pill. */
  focus?: { label: string; onOpen: () => void };
  /** Absent when only one UI language is launched (mirrors the header). */
  language?: { label: string; onOpen: () => void };
  furigana: { label: string; pressed: boolean; onToggle: () => void };
  theme: { label: string; onToggle: () => void };
  feedback: { label: string; onOpen: () => void };
  /** Absent when Supabase isn't configured (mirrors the header auth block). */
  auth?: {
    signedInAs: string | null;
    hint: string | null;
    signInLabel: string;
    signOutLabel: string;
    onSignIn: () => void;
    onSignOut: () => void;
    /** #693: text action to open the shared delete-history dialog (#693).
     *  Receives the trigger button so App can record it as the return-focus
     *  target. Only rendered while signed in. */
    deleteHistoryLabel: string;
    onDeleteHistory: (trigger: HTMLButtonElement) => void;
  };
}

export function MoreMenu({
  triggerLabel,
  triggerCurrentLabel,
  resourcesHeading,
  items,
  tools,
  className = "nav-more"
}: {
  triggerLabel: string;
  /** Accessible name for the collapsed trigger while a folded view is active,
   *  e.g. 更多（目前：文章）-- the trigger is then the only place the current
   *  location can show (PR #628 review). */
  triggerCurrentLabel: (page: string) => string;
  resourcesHeading?: string;
  items: MoreMenuNavItem[];
  tools?: MoreMenuTools;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  // role="menu" is a single tab stop: only the focused entry keeps tabIndex 0
  // (roving tabindex), tracked by its data-menu-key.
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  const selectedItem = items.find((item) => item.selected) ?? null;

  // The menu's focusables in the exact order they are rendered (items first,
  // then the tools block). Opening and roving both derive their keys from this
  // so a key always resolves to the same DOM element.
  const toolKeys: string[] = [
    tools?.focus ? "tool-focus" : null,
    tools?.language ? "tool-language" : null,
    tools ? "tool-furigana" : null,
    tools ? "tool-theme" : null,
    tools ? "tool-feedback" : null,
    tools?.auth ? "tool-auth" : null,
    tools?.auth?.signedInAs ? "tool-delete-history" : null
  ].filter((key): key is string => key !== null);

  const allKeys = useCallback(() => [...items.map((item) => item.key), ...toolKeys], [items, toolKeys]);

  // Opening is an event-driven transition: the event handler seeds the first
  // key and flips `open` together, so the focus effect never has to write
  // state (the Hooks v7 set-state-in-effect rule). Moving focus is left to the
  // layout effect below -- it is scoped to this menu's own root and lands in
  // the same commit, where an extra document-wide rAF focus could both pick a
  // sibling menu's identically-keyed item and land after a following arrow key.
  const openMenu = useCallback(() => {
    setFocusKey(allKeys()[0] ?? null);
    setOpen(true);
  }, [allKeys]);

  // Every close path (click, Escape, Tab, outside press, action select) funnels
  // through here so the focus key is always cleared with `open`.
  const closeMenu = useCallback((options: { returnFocus: boolean }) => {
    setOpen(false);
    setFocusKey(null);
    if (options.returnFocus) triggerRef.current?.focus();
  }, []);

  // Menu-button pattern: the open effect only moves focus once the panel has
  // committed -- it never writes state.
  useLayoutEffect(() => {
    if (!open) return;
    const focused = rootRef.current?.querySelector<HTMLButtonElement>(
      `[data-menu-key="${focusKey}"]`
    );
    if (focused) focused.focus();
  }, [open, focusKey]);

  // A press anywhere outside closes the menu without swallowing the press.
  useLayoutEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        closeMenu({ returnFocus: false });
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, closeMenu]);

  const closeAnd = (action: () => void) => () => {
    action();
    closeMenu({ returnFocus: false });
  };

  const onPanelKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu({ returnFocus: true });
      return;
    }
    if (event.key === "Tab") {
      // Menu pattern: Tab leaves the menu. Close and put focus back on the
      // trigger so the default Tab continues from there (no preventDefault).
      closeMenu({ returnFocus: true });
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp" && event.key !== "Home" && event.key !== "End") {
      return;
    }
    const focusables = [
      ...(rootRef.current?.querySelectorAll<HTMLButtonElement>("[role^='menuitem']") ?? [])
    ];
    if (focusables.length === 0) return;
    event.preventDefault();
    const current = focusables.indexOf(document.activeElement as HTMLButtonElement);
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? focusables.length - 1
          : event.key === "ArrowDown"
            ? (current + 1) % focusables.length
            : (current - 1 + focusables.length) % focusables.length;
    const target = focusables[next];
    if (target) {
      setFocusKey(target.dataset.menuKey ?? null);
      target.focus();
    }
  };

  // Effective roving key for rendering: the tracked key while it still exists,
  // otherwise the first legal key. Read from props/state only -- never written
  // back to state from an effect, so a key that disappears mid-open falls back
  // cleanly to the first legal key on the next render.
  const effectiveFocusKey = focusKey && allKeys().includes(focusKey) ? focusKey : (allKeys()[0] ?? null);

  // Roving-tabindex helper: only the focused entry is tabbable.
  const rove = (key: string) => (effectiveFocusKey === key ? 0 : -1);

  return (
    <div className={className} ref={rootRef}>
      <button
        type="button"
        ref={triggerRef}
        className={`nav-more-trigger${selectedItem ? " selected" : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={selectedItem ? triggerCurrentLabel(selectedItem.label) : undefined}
        onClick={() => {
          if (open) {
            closeMenu({ returnFocus: false });
          } else {
            openMenu();
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && !open) {
            event.preventDefault();
            openMenu();
          }
        }}
      >
        {triggerLabel}
        <ChevronDown aria-hidden="true" size={16} />
      </button>
      {open ? (
        <div
          className="nav-more-panel"
          role="menu"
          id={panelId}
          aria-label={triggerLabel}
          onKeyDown={onPanelKeyDown}
        >
          {resourcesHeading ? (
            <p className="nav-more-heading" aria-hidden="true">
              {resourcesHeading}
            </p>
          ) : null}
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              role="menuitem"
              data-menu-key={item.key}
              tabIndex={rove(item.key)}
              className={`nav-more-item${item.selected ? " selected" : ""}`}
              aria-current={item.selected ? "page" : undefined}
              onClick={closeAnd(item.onSelect)}
            >
              {item.icon}
              {item.label}
            </button>
          ))}

          {tools ? (
            <>
              <div className="nav-more-divider" role="separator" aria-hidden="true" />
              <p className="nav-more-heading" aria-hidden="true">
                {tools.heading}
              </p>

          {tools.focus ? (
            <button
              type="button"
              role="menuitem"
              data-menu-key="tool-focus"
              tabIndex={rove("tool-focus")}
              className="nav-more-item"
              onClick={closeAnd(tools.focus.onOpen)}
            >
              <Timer aria-hidden="true" size={16} />
              {tools.focus.label}
            </button>
          ) : null}
          {tools.language ? (
            <button
              type="button"
              role="menuitem"
              data-menu-key="tool-language"
              tabIndex={rove("tool-language")}
              className="nav-more-item"
              onClick={closeAnd(tools.language.onOpen)}
            >
              <Globe aria-hidden="true" size={16} />
              {tools.language.label}
            </button>
          ) : null}
          <button
            type="button"
            role="menuitemcheckbox"
            data-menu-key="tool-furigana"
            tabIndex={rove("tool-furigana")}
            className="nav-more-item"
            aria-checked={tools.furigana.pressed}
            onClick={closeAnd(tools.furigana.onToggle)}
          >
            <Languages aria-hidden="true" size={16} />
            {tools.furigana.label}
          </button>
          <button
            type="button"
            role="menuitem"
            data-menu-key="tool-theme"
            tabIndex={rove("tool-theme")}
            className="nav-more-item"
            onClick={closeAnd(tools.theme.onToggle)}
          >
            <SunMoon aria-hidden="true" size={16} />
            {tools.theme.label}
          </button>
          <button
            type="button"
            role="menuitem"
            data-menu-key="tool-feedback"
            tabIndex={rove("tool-feedback")}
            className="nav-more-item"
            onClick={closeAnd(tools.feedback.onOpen)}
          >
            <MessageCircle aria-hidden="true" size={16} />
            {tools.feedback.label}
          </button>

          {tools.auth ? (
            <>
              {tools.auth.signedInAs ? (
                <button
                  type="button"
                  role="menuitem"
                  data-menu-key="tool-auth"
                  tabIndex={rove("tool-auth")}
                  className="nav-more-item"
                  onClick={closeAnd(tools.auth.onSignOut)}
                >
                  <LogOut aria-hidden="true" size={16} />
                  {tools.auth.signOutLabel}
                </button>
              ) : (
                <button
                  type="button"
                  role="menuitem"
                  data-menu-key="tool-auth"
                  tabIndex={rove("tool-auth")}
                  className="nav-more-item"
                  onClick={closeAnd(tools.auth.onSignIn)}
                >
                  <LogIn aria-hidden="true" size={16} />
                  {tools.auth.signInLabel}
                </button>
              )}
              {tools.auth.signedInAs ? (
                <button
                  type="button"
                  role="menuitem"
                  data-menu-key="tool-delete-history"
                  tabIndex={rove("tool-delete-history")}
                  className="nav-more-item nav-more-danger"
                  onClick={(event) => {
                    // Action first, then close (the menu's closeAnd contract):
                    // App records the persistent 更多 trigger as the return-focus
                    // target and opens the shared dialog; closeMenu collapses
                    // this panel (its items unmount, so the item button itself
                    // can never be a focus target again).
                    const target = triggerRef.current ?? event.currentTarget;
                    tools.auth!.onDeleteHistory(target);
                    closeMenu({ returnFocus: false });
                  }}
                >
                  <Trash2 aria-hidden="true" size={16} />
                  {tools.auth.deleteHistoryLabel}
                </button>
              ) : null}
              {tools.auth.signedInAs || tools.auth.hint ? (
                <p className="nav-more-hint">
                  {tools.auth.signedInAs ? <span>{tools.auth.signedInAs}</span> : null}
                  {tools.auth.hint ? <span>{tools.auth.hint}</span> : null}
                </p>
              ) : null}
            </>
          ) : null}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
