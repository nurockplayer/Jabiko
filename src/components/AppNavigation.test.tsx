import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { resolveNavigation } from "../domain/navigation";
import { staticRoute } from "../domain/routes";
import { AppNavigation } from "./AppNavigation";
import type { MoreMenuTools } from "./MoreMenu";

const labels = {
  home: "首頁",
  learn: "學習",
  challenge: "挑戰",
  mockExam: "模擬考",
  grammar: "文型",
  rules: "規則表",
  kanji: "漢字",
  kanaPageTitle: "五十音",
  blog: "文章",
  about: "關於"
} as const;

const tools: MoreMenuTools = {
  heading: "設定與工具",
  furigana: { label: "顯示註音", pressed: false, onToggle: vi.fn() },
  theme: { label: "深色模式", onToggle: vi.fn() },
  feedback: { label: "意見回饋", onOpen: vi.fn() }
};

function renderNavigation(view: "home" | "kana" | "kanji" = "home") {
  const onSelect = vi.fn();
  render(
    <AppNavigation
      ariaLabel="學習流程"
      navigation={resolveNavigation(staticRoute(view), "zh-Hant")}
      labels={labels}
      resourcesLabel="資源"
      resourcesCurrentLabel={(page) => `資源（目前：${page}）`}
      moreLabel="更多"
      moreCurrentLabel={(page) => `更多（目前：${page}）`}
      tools={tools}
      onSelect={onSelect}
    />
  );
  return onSelect;
}

describe("AppNavigation (#727)", () => {
  it("renders five primary entries plus desktop Resources and mobile More", () => {
    renderNavigation();
    const nav = screen.getByRole("navigation", { name: "學習流程" });
    for (const name of ["首頁", "學習", "挑戰", "模擬考", "文型"]) {
      expect(within(nav).getByRole("button", { name })).toBeInTheDocument();
    }
    expect(within(nav).getByRole("button", { name: "資源" })).toBeInTheDocument();
    expect(within(nav).getByRole("button", { name: "更多" })).toBeInTheDocument();
    expect(within(nav).queryByRole("button", { name: "規則表" })).not.toBeInTheDocument();
  });

  it("derives both resource menus from the same labels, icons, order and visibility", async () => {
    const user = userEvent.setup();
    renderNavigation();
    await user.click(screen.getByRole("button", { name: "資源" }));
    const desktop = screen.getByRole("menu", { name: "資源" });
    expect(within(desktop).getAllByRole("menuitem").map((item) => item.textContent)).toEqual([
      "規則表", "漢字", "五十音", "文章", "關於"
    ]);
    fireEvent.keyDown(within(desktop).getByRole("menuitem", { name: "規則表" }), { key: "Escape" });

    await user.click(screen.getByRole("button", { name: "更多" }));
    const mobile = screen.getByRole("menu", { name: "更多" });
    expect(within(mobile).getByText("資源")).toBeInTheDocument();
    expect(within(mobile).getByText("設定與工具")).toBeInTheDocument();
    expect(within(mobile).getAllByRole("menuitem").slice(0, 5).map((item) => item.textContent)).toEqual([
      "規則表", "漢字", "五十音", "文章", "關於"
    ]);
  });

  it("marks Learn plus Kana, and Resources plus the exact resource", async () => {
    const user = userEvent.setup();
    renderNavigation("kana");
    expect(screen.getByRole("button", { name: "學習" })).toHaveAttribute("aria-current", "page");
    const resources = screen.getByRole("button", { name: "資源（目前：五十音）" });
    expect(resources.className).toContain("selected");
    await user.click(resources);
    expect(screen.getByRole("menuitem", { name: "五十音" })).toHaveAttribute("aria-current", "page");
  });

  it("routes primary and resource actions through one event API", async () => {
    const user = userEvent.setup();
    const onSelect = renderNavigation();
    await user.click(screen.getByRole("button", { name: "學習" }));
    expect(onSelect).toHaveBeenCalledWith("learn");
    await user.click(screen.getByRole("button", { name: "資源" }));
    await user.click(screen.getByRole("menuitem", { name: "漢字" }));
    expect(onSelect).toHaveBeenCalledWith("kanji");
  });
});
