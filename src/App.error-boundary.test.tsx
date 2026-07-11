import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const updateApp = vi.hoisted(() => vi.fn());

vi.mock("./hooks/usePwaUpdate", () => ({
  usePwaUpdate: () => ({ needRefresh: true, updateApp })
}));

vi.mock("./components/UpdateToast", () => ({
  UpdateToast: () => {
    throw new Error("update toast failed");
  }
}));

import App from "./App";

describe("App error boundary", () => {
  beforeEach(() => {
    updateApp.mockClear();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("shows the recovery screen when a header-level component throws", () => {
    render(<App />);

    expect(screen.getByRole("alert")).toHaveTextContent("頁面載入失敗");
  });
});
