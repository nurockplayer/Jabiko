// FocusControl tests (#771): the compact app-chrome control. Idle it opens the
// configuration dialog; while active it becomes a live countdown pill that
// opens the active-session menu. Must stay keyboard accessible and carry a
// meaningful accessible name in both states.
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FocusControl } from "./FocusControl";

const COPY = {
  label: "專注",
  startLabel: "開始專注",
  endLabel: "結束專注",
  remainingAria: (clock: string) => `專注剩餘 ${clock}`
};

function renderControl(props: Partial<React.ComponentProps<typeof FocusControl>> = {}) {
  const onOpenConfigure = vi.fn();
  const onOpenActiveMenu = vi.fn();
  render(
    <FocusControl
      phase="idle"
      remainingMs={0}
      onOpenConfigure={onOpenConfigure}
      onOpenActiveMenu={onOpenActiveMenu}
      copy={COPY}
      {...props}
    />
  );
  return { onOpenConfigure, onOpenActiveMenu };
}

describe("FocusControl", () => {
  it("renders the idle entry point and opens the configuration dialog", async () => {
    const user = userEvent.setup();
    const { onOpenConfigure, onOpenActiveMenu } = renderControl();
    const button = screen.getByRole("button", { name: COPY.label });
    expect(button).toBeInTheDocument();
    await user.click(button);
    expect(onOpenConfigure).toHaveBeenCalledTimes(1);
    expect(onOpenActiveMenu).not.toHaveBeenCalled();
  });

  it("becomes a countdown while a focus session is active", () => {
    renderControl({ phase: "focus", remainingMs: 24 * 60_000 + 59 * 1000 });
    expect(screen.getByText("24:59")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "專注剩餘 24:59" })).toBeInTheDocument();
  });

  it("opens the active-session menu from the countdown", async () => {
    const user = userEvent.setup();
    const { onOpenActiveMenu } = renderControl({
      phase: "focus",
      remainingMs: 10 * 60_000
    });
    await user.click(screen.getByRole("button"));
    expect(onOpenActiveMenu).toHaveBeenCalledTimes(1);
  });

  it("shows a break countdown too", () => {
    renderControl({ phase: "break", remainingMs: 3 * 60_000 });
    expect(screen.getByText("03:00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "專注剩餘 03:00" })).toBeInTheDocument();
  });
});
