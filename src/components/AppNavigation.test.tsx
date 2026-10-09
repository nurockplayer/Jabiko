import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { resolveNavigation } from "../domain/navigation";
import { staticRoute } from "../domain/routes";
import { AppHeaderMenu, AppNavigation } from "./AppNavigation";
import type { MoreMenuTools } from "./MoreMenu";

const labels = {
  today: "今日", practice: "練習", learn: "學習", conversation: "會話", grammar: "文型",
  mockExam: "模擬考", rules: "規則表", kanji: "漢字", kanaPageTitle: "五十音",
  about: "關於", navPartnership: "合作推廣"
} as const;
const tools: MoreMenuTools = {
  heading: "設定與工具",
  furigana: { label: "顯示註音", pressed: false, onToggle: vi.fn() },
  theme: { label: "深色模式", onToggle: vi.fn() },
  feedback: { label: "意見回饋", onOpen: vi.fn() }
};

function renderNavigation(view: "home" | "challenge" | "mock" | "conversation" | "kana" = "home") {
  const onSelect = vi.fn();
  const navigation = resolveNavigation(staticRoute(view), "zh-Hant");
  const result = render(
    <>
      <AppHeaderMenu
        navigation={navigation} labels={labels} triggerLabel="更多"
        triggerCurrentLabel={(page) => `更多（目前：${page}）`} tools={tools} onSelect={onSelect}
      />
      <AppNavigation
        ariaLabel="學習流程" navigation={navigation} labels={labels} resourcesLabel="資料"
        resourcesCurrentLabel={(page) => `資料（目前：${page}）`} onSelect={onSelect}
      />
    </>
  );
  return { onSelect, container: result.container, unmount: result.unmount };
}

describe("AppNavigation (#727)", () => {
  it("renders the five compact destinations in accepted desktop order", () => {
    renderNavigation();
    const nav = screen.getByRole("navigation", { name: "學習流程" });
    expect(within(nav).getAllByRole("link").map((link) => link.textContent)).toEqual([
      "今日", "練習", "學習", "文型", "會話"
    ]);
    expect(within(nav).getByRole("link", { name: "文型" })).toHaveAttribute("data-wide-only", "true");
    expect(nav.querySelectorAll(".nav-resources-wide, .nav-resources-compact")).toHaveLength(2);
    const headerMenu = screen.getByRole("button", { name: "更多" });
    expect(headerMenu.querySelector(".lucide-ellipsis")).toBeInTheDocument();
    expect(headerMenu.querySelector(".jt1-visually-hidden")).toHaveTextContent("更多");
  });

  it("keeps Grammar with references in compact Resources and Mock/About/Stay.D in header More", async () => {
    const user = userEvent.setup();
    const { container } = renderNavigation();
    const compactTrigger = container.querySelector<HTMLButtonElement>(".nav-resources-compact button")!;
    await user.click(compactTrigger);
    const resources = screen.getByRole("menu", { name: "資料" });
    expect(within(resources).getAllByRole("menuitem").map((item) => item.textContent)).toEqual([
      "文型", "規則表", "漢字", "五十音"
    ]);
    fireEvent.keyDown(within(resources).getByRole("menuitem", { name: "規則表" }), { key: "Escape" });

    await user.click(container.querySelector<HTMLButtonElement>(".jt1-header-menu button")!);
    const more = screen.getByRole("menu", { name: "更多" });
    expect(within(more).getAllByRole("menuitem").slice(0, 3).map((item) => item.textContent)).toEqual([
      "模擬考", "合作推廣", "關於"
    ]);
    expect(within(more).getByText("設定與工具")).toBeInTheDocument();
  });

  it("uses unchanged route anchors and intercepts only ordinary same-window clicks", () => {
    const { onSelect } = renderNavigation();
    const practice = screen.getByRole("link", { name: "練習" });
    expect(practice).toHaveAttribute("href", "/challenge");
    fireEvent.click(practice, { button: 0 });
    expect(onSelect).toHaveBeenCalledWith("challenge");

    onSelect.mockClear();
    expect(fireEvent.click(practice, { button: 0, ctrlKey: true })).toBe(true);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("marks Practice current for Mock, and Conversation plus Learn ancestry correctly", () => {
    const { container } = renderNavigation("mock");
    expect(screen.getByRole("link", { name: "練習" })).toHaveAttribute("aria-current", "page");
    expect(container.querySelector(".jt1-header-menu .nav-more-trigger")).toHaveAttribute("aria-label", "更多（目前：模擬考）");
  });

  it("marks Conversation current and preserves Learn plus Kana ancestry", () => {
    const { unmount } = renderNavigation("conversation");
    expect(screen.getByRole("link", { name: "會話" })).toHaveAttribute("aria-current", "page");
    unmount();

    const { container } = renderNavigation("kana");
    expect(screen.getByRole("link", { name: "學習" })).not.toHaveAttribute("aria-current");
    expect(container.querySelector(".nav-resources-compact .nav-more-trigger")).toHaveAttribute("aria-label", "資料（目前：五十音）");
  });

  it("publishes the compact bar's measured clearance and removes it with the observer", () => {
    let callback: ResizeObserverCallback | undefined;
    const disconnect = vi.fn();
    class MockResizeObserver {
      constructor(next: ResizeObserverCallback) { callback = next; }
      observe() {}
      unobserve() {}
      disconnect = disconnect;
    }
    vi.stubGlobal("ResizeObserver", MockResizeObserver);
    const navigation = resolveNavigation(staticRoute("home"), "zh-Hant");
    const result = render(
      <div className="app-shell">
        <AppNavigation
          ariaLabel="學習流程" navigation={navigation} labels={labels} resourcesLabel="資料"
          resourcesCurrentLabel={(page) => `資料（目前：${page}）`} onSelect={vi.fn()}
        />
      </div>
    );
    const shell = result.container.querySelector<HTMLElement>(".app-shell")!;
    const nav = result.container.querySelector<HTMLElement>(".jt1-primary-nav")!;

    expect(callback).toBeDefined();
    callback?.([{
      target: nav,
      borderBoxSize: [{ blockSize: 68, inlineSize: 320 }],
      contentBoxSize: [{ blockSize: 68, inlineSize: 320 }],
      contentRect: nav.getBoundingClientRect()
    } as unknown as ResizeObserverEntry], {} as ResizeObserver);
    expect(shell.style.getPropertyValue("--jt-compact-nav-occupied")).toBe("68px");

    callback?.([{
      target: nav,
      borderBoxSize: [{ blockSize: 74, inlineSize: 320 }],
      contentBoxSize: [{ blockSize: 74, inlineSize: 320 }],
      contentRect: nav.getBoundingClientRect()
    } as unknown as ResizeObserverEntry], {} as ResizeObserver);
    expect(shell.style.getPropertyValue("--jt-compact-nav-occupied")).toBe("74px");

    callback?.([{
      target: nav,
      borderBoxSize: [{ blockSize: 0, inlineSize: 320 }],
      contentBoxSize: [{ blockSize: 0, inlineSize: 320 }],
      contentRect: nav.getBoundingClientRect()
    } as unknown as ResizeObserverEntry], {} as ResizeObserver);
    expect(shell.style.getPropertyValue("--jt-compact-nav-occupied")).toBe("");

    result.unmount();
    expect(shell.style.getPropertyValue("--jt-compact-nav-occupied")).toBe("");
    expect(disconnect).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });

  it("opens header menus with focus in the correct panel and returns focus on Escape", async () => {
    const user = userEvent.setup();
    const { container } = renderNavigation();
    const moreTrigger = container.querySelector<HTMLButtonElement>(".jt1-header-menu button")!;
    moreTrigger.focus();
    await user.keyboard("{ArrowDown}");
    const menu = await screen.findByRole("menu", { name: "更多" });
    await waitFor(() => expect(screen.getByRole("menuitem", { name: "模擬考" })).toHaveFocus());
    await user.keyboard("{Escape}");
    expect(moreTrigger).toHaveFocus();
    expect(menu).not.toBeInTheDocument();
  });
});
