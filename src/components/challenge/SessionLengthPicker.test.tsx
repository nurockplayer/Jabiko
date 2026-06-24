import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SessionLengthPicker } from "./SessionLengthPicker";

describe("SessionLengthPicker", () => {
  it("renders every session-length option, including 全部", () => {
    render(<SessionLengthPicker language="zh-Hant" sessionLength={20} onChange={() => {}} />);
    for (const label of ["10", "20", "30", "50", "全部"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("marks the active length pressed", () => {
    render(<SessionLengthPicker language="zh-Hant" sessionLength={30} onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "30" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "20" })).toHaveAttribute("aria-pressed", "false");
  });

  it("calls onChange with the number, and null for 全部", () => {
    const onChange = vi.fn();
    render(<SessionLengthPicker language="zh-Hant" sessionLength={20} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "50" }));
    fireEvent.click(screen.getByRole("button", { name: "全部" }));
    expect(onChange).toHaveBeenNthCalledWith(1, 50);
    expect(onChange).toHaveBeenNthCalledWith(2, null);
  });
});
