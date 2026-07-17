import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
  render(<MoreMenu triggerLabel="更多" items={items} tools={tools} />);
  return { items, tools };
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

    await user.click(screen.getByRole("button", { name: "更多" }));
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
});
