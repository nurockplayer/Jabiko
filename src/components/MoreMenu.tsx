import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ChevronDown, Globe, Languages, LogIn, LogOut, MessageCircle, SunMoon } from "lucide-react";

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
  };
}

export function MoreMenu({
  triggerLabel,
  triggerCurrentLabel,
  items,
  tools
}: {
  triggerLabel: string;
  /** Accessible name for the collapsed trigger while a folded view is active,
   *  e.g. 更多（目前：文章）-- the trigger is then the only place the current
   *  location can show (PR #628 review). */
  triggerCurrentLabel: (page: string) => string;
  items: MoreMenuNavItem[];
  tools: MoreMenuTools;
}) {
  const [open, setOpen] = useState(false);
  // role="menu" is a single tab stop: only the focused entry keeps tabIndex 0
  // (roving tabindex), tracked by its data-menu-key.
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  const selectedItem = items.find((item) => item.selected) ?? null;

  // Focus the first entry once the panel is in the DOM (menu-button pattern).
  useEffect(() => {
    if (!open) {
      setFocusKey(null);
      return;
    }
    const first = rootRef.current?.querySelector<HTMLButtonElement>("[role^='menuitem']");
    if (first) {
      setFocusKey(first.dataset.menuKey ?? null);
      first.focus();
    }
  }, [open]);

  // A press anywhere outside closes the menu without swallowing the press.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const close = () => setOpen(false);
  const closeAnd = (action: () => void) => () => {
    action();
    close();
  };

  const onPanelKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      triggerRef.current?.focus();
      return;
    }
    if (event.key === "Tab") {
      // Menu pattern: Tab leaves the menu. Close and put focus back on the
      // trigger so the default Tab continues from there (no preventDefault).
      close();
      triggerRef.current?.focus();
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

  // Roving-tabindex helper: only the focused entry is tabbable.
  const rove = (key: string) => (focusKey === key ? 0 : -1);

  return (
    <div className="nav-more" ref={rootRef}>
      <button
        type="button"
        ref={triggerRef}
        className={`nav-more-trigger${selectedItem ? " selected" : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={selectedItem ? triggerCurrentLabel(selectedItem.label) : undefined}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && !open) {
            event.preventDefault();
            setOpen(true);
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

          <div className="nav-more-divider" role="separator" aria-hidden="true" />
          <p className="nav-more-heading" aria-hidden="true">
            {tools.heading}
          </p>

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
              {tools.auth.signedInAs || tools.auth.hint ? (
                <p className="nav-more-hint">
                  {tools.auth.signedInAs ? <span>{tools.auth.signedInAs}</span> : null}
                  {tools.auth.hint ? <span>{tools.auth.hint}</span> : null}
                </p>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
