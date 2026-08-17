// FocusActiveDialog tests (#771): the menu behind the active countdown pill,
// letting the learner end Focus Mode mid-cycle (skip/end must always be
// reachable).
import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FocusActiveDialog, type FocusActiveDialogCopy } from "./FocusActiveDialog";

const COPY: FocusActiveDialogCopy = {
  title: "專注進行中",
  remainingLabel: "剩餘時間",
  cycleLabel: (cycle: number) => `第 ${cycle} 輪`,
  endMode: "結束專注模式",
  close: "關閉"
};

function renderDialog(props: Partial<React.ComponentProps<typeof FocusActiveDialog>> = {}) {
  const returnFocusRef = createRef<HTMLButtonElement>();
  const onEnd = vi.fn();
  const onClose = vi.fn();
  render(
    <FocusActiveDialog
      open={true}
      cycle={2}
      remainingMs={15 * 60_000}
      onEnd={onEnd}
      onClose={onClose}
      returnFocusRef={returnFocusRef}
      copy={COPY}
      {...props}
    />
  );
  return { onEnd, onClose, returnFocusRef };
}

describe("FocusActiveDialog", () => {
  it("shows the current cycle and remaining time", () => {
    renderDialog();
    expect(screen.getByRole("dialog", { name: COPY.title })).toBeInTheDocument();
    expect(screen.getByText(COPY.cycleLabel(2))).toBeInTheDocument();
    expect(screen.getByText("15:00")).toBeInTheDocument();
  });

  it("ends Focus Mode from the active menu", async () => {
    const user = userEvent.setup();
    const { onEnd } = renderDialog();
    await user.click(screen.getByRole("button", { name: COPY.endMode }));
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it("closes without ending", async () => {
    const user = userEvent.setup();
    const { onEnd, onClose } = renderDialog();
    await user.click(screen.getByRole("button", { name: COPY.close }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onEnd).not.toHaveBeenCalled();
  });

  it("renders nothing when closed", () => {
    renderDialog({ open: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
