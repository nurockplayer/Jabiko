import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AppBreadcrumbs } from "./AppBreadcrumbs";
import {
  buildBreadcrumbs,
  shouldInterceptCrumbClick,
  type BreadcrumbLabels
} from "../domain/breadcrumbs";
import { grammarRoute, parseRoute, serializeRoute, staticRoute } from "../domain/routes";

const labels: BreadcrumbLabels = {
  nav: "目前位置",
  home: "首頁",
  learn: "學習",
  grammar: "文型",
  about: "關於",
  kanaTable: "五十音表",
  privacy: "隱私政策",
  terms: "使用條款"
};

function setup(path: string) {
  const model = buildBreadcrumbs(parseRoute(path), labels)!;
  const onNavigate = vi.fn();
  const view = render(<AppBreadcrumbs model={model} onNavigate={onNavigate} />);
  return { model, onNavigate, view };
}

describe("AppBreadcrumbs rendering", () => {
  it("renders an accessible nav with an ordered list and the current page marked", () => {
    const { model } = setup("/grammar/n5");

    const nav = screen.getByRole("navigation", { name: model.label });
    expect(nav).toBeInTheDocument();
    const list = nav.querySelector("ol");
    expect(list).not.toBeNull();
    expect(nav.querySelectorAll("ol > li")).toHaveLength(3);

    const current = screen.getByText("N5");
    expect(current.tagName).toBe("SPAN");
    expect(current).toHaveAttribute("aria-current", "page");
  });

  it("renders parent crumbs as real anchors serialized to canonical hrefs", () => {
    setup("/grammar/n5");

    const home = screen.getByRole("link", { name: "首頁" });
    expect(home).toHaveAttribute("href", serializeRoute(staticRoute("home")));
    const grammar = screen.getByRole("link", { name: "文型" });
    expect(grammar).toHaveAttribute("href", serializeRoute(grammarRoute()));
  });

  it("hides separators from screen readers", () => {
    const { view } = setup("/privacy");
    const separators = view.container.querySelectorAll('[aria-hidden="true"]');
    expect(separators.length).toBeGreaterThan(0);
  });

  it("marks the grammar surface crumb with the Japanese language override", () => {
    setup("/grammar/%E3%80%9C%E3%81%A6%E3%82%82%E3%81%84%E3%81%84");
    expect(screen.getByText("〜てもいい")).toHaveAttribute("lang", "ja");
  });

  it("does not render an anchor for the current crumb", () => {
    setup("/kana");
    expect(screen.queryByRole("link", { name: "五十音表" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(2); // Home + Learn only
  });
});

describe("AppBreadcrumbs SPA navigation", () => {
  it("navigates in-app on an unmodified left click", async () => {
    const user = userEvent.setup();
    const { onNavigate } = setup("/grammar/n5");

    await user.click(screen.getByRole("link", { name: "文型" }));
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledWith(grammarRoute());
  });

  it("keeps modifier / non-left clicks native (no SPA interception)", async () => {
    // Native (unprevented) anchor clicks make jsdom attempt navigation and log
    // "Not implemented: navigation"; absorb that expected noise.
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const { onNavigate } = setup("/grammar/n5");
    const grammarLink = screen.getByRole("link", { name: "文型" });

    // Ctrl+click (open in new tab) and middle click must NOT call onNavigate.
    fireEvent.click(grammarLink, { ctrlKey: true });
    expect(onNavigate).not.toHaveBeenCalled();
    fireEvent.click(grammarLink, { button: 1 });
    expect(onNavigate).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

describe("shouldInterceptCrumbClick (#729)", () => {
  const plain = { button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false };

  it("intercepts a plain left click", () => {
    expect(shouldInterceptCrumbClick({ ...plain, defaultPrevented: false })).toBe(true);
  });

  it("never intercepts when the default is already prevented", () => {
    expect(shouldInterceptCrumbClick({ ...plain, defaultPrevented: true })).toBe(false);
  });

  it("preserves modifier-click (new tab / window) semantics", () => {
    for (const mod of [
      { metaKey: true },
      { ctrlKey: true },
      { shiftKey: true },
      { altKey: true }
    ] as const) {
      expect(shouldInterceptCrumbClick({ ...plain, ...mod, defaultPrevented: false })).toBe(false);
    }
  });

  it("preserves middle-click (button 1) semantics", () => {
    expect(
      shouldInterceptCrumbClick({ ...plain, button: 1, defaultPrevented: false })
    ).toBe(false);
  });
});
