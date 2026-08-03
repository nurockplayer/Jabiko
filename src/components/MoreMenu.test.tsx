import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { describe, expect, it, vi } from "vitest";
import { MoreMenu, type MoreMenuNavItem, type MoreMenuTools } from "./MoreMenu";

// #608: on phones the nav keeps five primary entries; everything else lives in
// this 更多 menu -- secondary views on top, the header tools (language /
// furigana / theme / feedback / auth) below a labelled divider. Menu semantics
// (aria-expanded, roving focus, Escape) are pinned here at the component level;
// App.test.tsx covers the wiring.

function makeItems(overrides: Partial<MoreMenuNavItem>[] = []): MoreMenuNavItem[] {
  const base: MoreMenuNavItem[] = [
    { key: "rules", label: "規則表", icon: null, selected: false, onSelect: vi.fn() },
    { key: "kanji", label: "漢字", icon: null, selected: false, onSelect: vi.fn() },
    { key: "about", label: "關於", icon: null, selected: false, onSelect: vi.fn() }
  ];
  overrides.forEach((patch, index) => Object.assign(base[index], patch));
  return base;
}

function makeTools(overrides: Partial<MoreMenuTools> = {}): MoreMenuTools {
  return {
    heading: "設定與工具",
    language: { label: "切換語言", onOpen: vi.fn() },
    furigana: { label: "顯示註音", pressed: false, onToggle: vi.fn() },
    theme: { label: "深色模式", onToggle: vi.fn() },
    feedback: { label: "意見回饋", onOpen: vi.fn() },
    auth: {
      signedInAs: null,
      hint: null,
      signInLabel: "登入",
      signOutLabel: "登出",
      onSignIn: vi.fn(),
      onSignOut: vi.fn()
    },
    ...overrides
  };
}

function renderMenu(items = makeItems(), tools = makeTools()) {
  const view = render(
    <MoreMenu
      triggerLabel="更多"
      triggerCurrentLabel={(page) => `更多（目前：${page}）`}
      items={items}
      tools={tools}
    />
  );
  return { items, tools, view };
}

function menuItems(): HTMLButtonElement[] {
  return [...screen.getByRole("menu").querySelectorAll<HTMLButtonElement>("[role^='menuitem']")];
}

describe("MoreMenu (#608)", () => {
  it("starts closed and opens into a menu with every given entry plus the tools", async () => {
    const user = userEvent.setup();
    const { tools } = renderMenu();

    const trigger = screen.getByRole("button", { name: "更多" });
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const menu = screen.getByRole("menu", { name: "更多" });
    for (const label of ["規則表", "漢字", "關於"]) {
      expect(within(menu).getByRole("menuitem", { name: label })).toBeInTheDocument();
    }
    expect(within(menu).getByText(tools.heading)).toBeInTheDocument();
    expect(within(menu).getByRole("menuitem", { name: "切換語言" })).toBeInTheDocument();
    expect(within(menu).getByRole("menuitemcheckbox", { name: "顯示註音" })).toBeInTheDocument();
    expect(within(menu).getByRole("menuitem", { name: "深色模式" })).toBeInTheDocument();
    expect(within(menu).getByRole("menuitem", { name: "意見回饋" })).toBeInTheDocument();
    expect(within(menu).getByRole("menuitem", { name: "登入" })).toBeInTheDocument();
  });

  it("marks the selected view with aria-current and reflects the furigana state", async () => {
    const user = userEvent.setup();
    renderMenu(
      makeItems([{}, { selected: true }]),
      makeTools({ furigana: { label: "顯示註音", pressed: true, onToggle: vi.fn() } })
    );

    // With 漢字 selected the collapsed trigger already names the current page.
    await user.click(screen.getByRole("button", { name: "更多（目前：漢字）" }));
    const menu = screen.getByRole("menu");
    expect(within(menu).getByRole("menuitem", { name: "漢字" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(within(menu).getByRole("menuitem", { name: "規則表" })).not.toHaveAttribute(
      "aria-current"
    );
    expect(within(menu).getByRole("menuitemcheckbox", { name: "顯示註音" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
  });

  it("runs the entry's action and closes on click", async () => {
    const user = userEvent.setup();
    const { items } = renderMenu();

    await user.click(screen.getByRole("button", { name: "更多" }));
    await user.click(screen.getByRole("menuitem", { name: "漢字" }));

    expect(items[1].onSelect).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "更多" })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });

  it("focuses the first entry on open, moves focus with the arrow keys", async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole("button", { name: "更多" }));
    expect(screen.getByRole("menuitem", { name: "規則表" })).toHaveFocus();

    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "ArrowDown" });
    expect(screen.getByRole("menuitem", { name: "漢字" })).toHaveFocus();

    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "ArrowUp" });
    expect(screen.getByRole("menuitem", { name: "規則表" })).toHaveFocus();
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    renderMenu();

    const trigger = screen.getByRole("button", { name: "更多" });
    await user.click(trigger);
    expect(screen.getByRole("menu")).toBeInTheDocument();

    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  // PR #628 review: while a folded view is active the collapsed trigger is the
  // only place the current location can show -- it takes the selected style and
  // names the current page.
  it("marks the collapsed trigger selected and names the current page", () => {
    renderMenu(makeItems([{}, { selected: true }]));

    const trigger = screen.getByRole("button", { name: "更多（目前：漢字）" });
    expect(trigger.className).toContain("selected");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("keeps the plain trigger name and no selected style when nothing inside is active", () => {
    renderMenu();

    const trigger = screen.getByRole("button", { name: "更多" });
    expect(trigger.className).not.toContain("selected");
  });

  // PR #628 review: role="menu" implies a single tab stop -- only the focused
  // item is tabbable, the rest sit at tabIndex -1.
  it("roves tabindex with the focus (single tab stop)", async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole("button", { name: "更多" }));
    let items = menuItems();
    expect(items[0].tabIndex).toBe(0);
    expect(items.slice(1).every((item) => item.tabIndex === -1)).toBe(true);

    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "ArrowDown" });
    items = menuItems();
    expect(items[0].tabIndex).toBe(-1);
    expect(items[1].tabIndex).toBe(0);
    expect(items[1]).toHaveFocus();

    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "End" });
    items = menuItems();
    expect(items[items.length - 1].tabIndex).toBe(0);
    expect(items[items.length - 1]).toHaveFocus();

    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "Home" });
    items = menuItems();
    expect(items[0].tabIndex).toBe(0);
    expect(items[0]).toHaveFocus();
  });

  it("Tab closes the menu and hands focus back to the trigger", async () => {
    const user = userEvent.setup();
    renderMenu();

    const trigger = screen.getByRole("button", { name: "更多" });
    await user.click(trigger);
    expect(screen.getByRole("menu")).toBeInTheDocument();

    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "Tab" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes on an outside pointer press", async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole("button", { name: "更多" }));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("fires the tool callbacks (language picker, sign-in) and closes after", async () => {
    const user = userEvent.setup();
    const { tools } = renderMenu();

    await user.click(screen.getByRole("button", { name: "更多" }));
    await user.click(screen.getByRole("menuitem", { name: "切換語言" }));
    expect(tools.language?.onOpen).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "更多" }));
    await user.click(screen.getByRole("menuitem", { name: "登入" }));
    expect(tools.auth?.onSignIn).toHaveBeenCalledTimes(1);
  });

  it("shows sign-out (with the signed-in name) instead of sign-in when logged in", async () => {
    const user = userEvent.setup();
    renderMenu(
      makeItems(),
      makeTools({
        auth: {
          signedInAs: "花雪",
          hint: "已同步",
          signInLabel: "登入",
          signOutLabel: "登出",
          onSignIn: vi.fn(),
          onSignOut: vi.fn()
        }
      })
    );

    await user.click(screen.getByRole("button", { name: "更多" }));
    const menu = screen.getByRole("menu");
    expect(within(menu).getByRole("menuitem", { name: "登出" })).toBeInTheDocument();
    expect(within(menu).queryByRole("menuitem", { name: "登入" })).not.toBeInTheDocument();
    expect(within(menu).getByText(/花雪/)).toBeInTheDocument();
    expect(within(menu).getByText("已同步")).toBeInTheDocument();
  });

  // #684: MoreMenu must not synchronously call setFocusKey() inside the open
  // effect -- the React Hooks v7 `set-state-in-effect` rule flags any state
  // write from an effect. Opening is an event-driven transition, so focusKey
  // is seeded by the same event handlers that flip `open`. These tests pin the
  // behaviour contract (first entry focused + roving tabindex, focus returned
  // on close, outside-close without swallowing the press, action-before-close)
  // so the refactor to event-sourced focus stays behaviour-neutral.

  it("seeds the first entry as the roving key and focuses it on trigger click (#684)", async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole("button", { name: "更多" }));
    const items = menuItems();
    expect(items[0].tabIndex).toBe(0);
    expect(items.slice(1).every((item) => item.tabIndex === -1)).toBe(true);
    expect(items[0]).toHaveFocus();
  });

  it("opens on ArrowDown from the closed trigger with the first entry focused (#684)", () => {
    renderMenu();

    const trigger = screen.getByRole("button", { name: "更多" });
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(screen.getByRole("menu")).toBeInTheDocument();
    const items = menuItems();
    expect(items[0].tabIndex).toBe(0);
    expect(items[0]).toHaveFocus();
  });

  it("clears the focus key and returns focus to the trigger on close (#684)", async () => {
    const user = userEvent.setup();
    renderMenu();

    const trigger = screen.getByRole("button", { name: "更多" });
    await user.click(trigger);
    expect(screen.getByRole("menuitem", { name: "規則表" })).toHaveFocus();

    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();

    // Re-opening must seed a fresh roving key, never a stale one.
    await user.click(trigger);
    const items = menuItems();
    expect(items[0].tabIndex).toBe(0);
    expect(items.slice(1).every((item) => item.tabIndex === -1)).toBe(true);
  });

  it("closes on Tab without preventing default traversal (#684)", () => {
    renderMenu();

    const trigger = screen.getByRole("button", { name: "更多" });
    fireEvent.click(trigger);
    expect(screen.getByRole("menu")).toBeInTheDocument();

    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "Tab" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes on an outside pointer press and does not swallow the press (#684)", async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole("button", { name: "更多" }));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("runs the nav/tool action first, then closes (#684)", async () => {
    const user = userEvent.setup();
    const { items, tools } = renderMenu();

    await user.click(screen.getByRole("button", { name: "更多" }));
    await user.click(screen.getByRole("menuitem", { name: "深色模式" }));
    expect(tools.theme.onToggle).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "更多" }));
    await user.click(screen.getByRole("menuitem", { name: "關於" }));
    expect(items[2].onSelect).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("keeps exactly one tabbable entry when items change while open and the current key disappears (#684)", async () => {
    const user = userEvent.setup();
    const { view } = renderMenu();

    await user.click(screen.getByRole("button", { name: "更多" }));
    expect(screen.getByRole("menuitem", { name: "規則表" })).toHaveFocus();

    // Remove the currently-focused first entry mid-open: the effective roving
    // key falls back to the first still-legal key.
    view.rerender(
      <MoreMenu
        triggerLabel="更多"
        triggerCurrentLabel={(page) => `更多（目前：${page}）`}
        items={makeItems().slice(1)}
        tools={makeTools()}
      />
    );
    const items = menuItems();
    expect(items[0].tabIndex).toBe(0);
    expect(items.filter((item) => item.tabIndex === 0)).toHaveLength(1);
  });

  it("wraps roving with ArrowDown/ArrowUp and honours Home/End (#684)", async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole("button", { name: "更多" }));
    const items = menuItems();
    const last = items[items.length - 1];

    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "ArrowUp" });
    expect(last).toHaveFocus();

    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "ArrowDown" });
    expect(items[0]).toHaveFocus();

    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "End" });
    expect(last).toHaveFocus();

    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "Home" });
    expect(items[0]).toHaveFocus();
  });

  it("does not double-focus or warn under StrictMode (#684)", async () => {
    const user = userEvent.setup();
    render(
      <StrictMode>
        <MoreMenu
          triggerLabel="更多"
          triggerCurrentLabel={(page) => `更多（目前：${page}）`}
          items={makeItems()}
          tools={makeTools()}
        />
      </StrictMode>
    );

    await user.click(screen.getByRole("button", { name: "更多" }));
    expect(screen.getByRole("menuitem", { name: "規則表" })).toHaveFocus();
  });
});
