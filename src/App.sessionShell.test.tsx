import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const updateApp = vi.hoisted(() => vi.fn());
vi.mock("./hooks/usePwaUpdate", () => ({
  usePwaUpdate: () => ({ needRefresh: true, updateApp })
}));

import App from "./App";

afterEach(() => {
  window.history.replaceState({}, "", "/");
  localStorage.clear();
});

describe("App session shell marker", () => {
  it("keeps a single desktop header row with navigation and a main skip target", () => {
    render(<App />);
    const header = document.querySelector(".app-heading");
    const navigation = document.querySelector(".jt1-primary-nav");
    expect(header?.tagName).toBe("HEADER");
    expect(header?.contains(navigation)).toBe(true);
    expect(document.querySelector(".jt1-skip-link")).toHaveAttribute("href", "#main-content");
    expect(document.querySelector("main#main-content")).toHaveAttribute("tabindex", "-1");
  });

  it("marks the challenge route as a session surface for compact shell navigation", () => {
    window.history.replaceState({}, "", "/challenge");
    render(<App />);
    expect(document.querySelector(".app-shell")).toHaveAttribute("data-session-route", "true");
  });

  it("keeps the PWA update toast mounted as it clears the compact navigation", () => {
    render(<App />);
    expect(document.querySelector(".update-toast")).toBeInTheDocument();
  });

  it("leaves the mock section picker navigable", () => {
    window.history.replaceState({}, "", "/mock");
    render(<App />);
    expect(document.querySelector(".app-shell")).not.toHaveAttribute("data-session-route");
  });
});
