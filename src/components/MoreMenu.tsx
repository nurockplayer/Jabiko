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
  items,
  tools
}: {
  triggerLabel: string;
  items: MoreMenuNavItem[];
  tools: MoreMenuTools;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  // Focus the first entry once the panel is in the DOM (menu-button pattern).
  useEffect(() => {
    if (!open) return;
    rootRef.current
      ?.querySelector<HTMLButtonElement>("[role^='menuitem']")
      ?.focus();
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
    focusables[next]?.focus();
  };

  return (
    <div className="nav-more" ref={rootRef}>
      <button
        type="button"
        ref={triggerRef}
        className="nav-more-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
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
            className="nav-more-item"
            onClick={closeAnd(tools.theme.onToggle)}
          >
            <SunMoon aria-hidden="true" size={16} />
            {tools.theme.label}
          </button>
          <button
            type="button"
            role="menuitem"
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
