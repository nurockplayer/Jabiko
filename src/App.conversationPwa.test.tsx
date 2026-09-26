import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import App from "./App";

const sw = vi.hoisted(() => ({
  update: vi.fn(() => Promise.resolve()),
  options: {} as { onNeedRefresh?: () => void }
}));

vi.mock("virtual:pwa-register", () => ({
  registerSW: (options: typeof sw.options) => {
    sw.options = options;
    return sw.update;
  }
}));

function setHidden(hidden: boolean) {
  Object.defineProperty(document, "hidden", { configurable: true, value: hidden });
  act(() => document.dispatchEvent(new Event("visibilitychange")));
}

afterEach(() => {
  setHidden(false);
  localStorage.clear();
  window.history.replaceState({}, "", "/");
  sw.update.mockClear();
});

it("preserves an active conversation across background updates and applies the update after leaving", async () => {
  setHidden(false);
  localStorage.setItem("jabiko.lang", "zh-Hant");
  window.history.replaceState({}, "", "/conversation");
  const user = userEvent.setup();
  render(<App />);
  await screen.findByRole("heading", { name: "日常會話練習室", level: 2 }, { timeout: 15000 });
  await user.click(screen.getByRole("button", { name: /月台上的電子看板/ }));
  await user.click(screen.getByRole("button", { name: "開始這個情境" }));

  act(() => sw.options.onNeedRefresh?.());
  setHidden(true);
  expect(sw.update).not.toHaveBeenCalled();
  expect(screen.getByText("電車、遅れてるみたいですね。")).toBeInTheDocument();

  setHidden(false);
  await user.click(screen.getByRole("button", { name: "繼續" }));
  await user.click(screen.getByRole("button", { name: "そうですね。" }));
  setHidden(true);
  act(() => sw.options.onNeedRefresh?.());
  expect(sw.update).not.toHaveBeenCalled();
  expect(screen.getByRole("heading", { name: "回饋" })).toBeInTheDocument();

  setHidden(false);
  await user.click(screen.getByRole("button", { name: "首頁" }));
  expect(sw.update).toHaveBeenCalledExactlyOnceWith(true);
});
