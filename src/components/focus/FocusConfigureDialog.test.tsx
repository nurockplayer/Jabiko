// FocusConfigureDialog tests (#771): the simple first-version duration
// configuration. No preset system -- two number inputs plus start/cancel, with
// client-side validation guarding the persisted config range.
import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  FocusConfigureDialog,
  type FocusConfigureDialogCopy
} from "./FocusConfigureDialog";

const COPY: FocusConfigureDialogCopy = {
  title: "專注設定",
  focusMinutes: "專注時間（分鐘）",
  breakMinutes: "休息時間（分鐘）",
  start: "開始",
  close: "關閉"
};

function renderDialog(props: Partial<React.ComponentProps<typeof FocusConfigureDialog>> = {}) {
  const returnFocusRef = createRef<HTMLButtonElement>();
  const onStart = vi.fn();
  const onClose = vi.fn();
  render(
    <FocusConfigureDialog
      open={true}
      defaultFocusMinutes={25}
      defaultBreakMinutes={5}
      onStart={onStart}
      onClose={onClose}
      returnFocusRef={returnFocusRef}
      copy={COPY}
      {...props}
    />
  );
  return { onStart, onClose, returnFocusRef };
}

describe("FocusConfigureDialog", () => {
  it("renders the configuration inputs with defaults", () => {
    renderDialog();
    const dialog = screen.getByRole("dialog", { name: COPY.title });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByLabelText(COPY.focusMinutes)).toHaveValue(25);
    expect(screen.getByLabelText(COPY.breakMinutes)).toHaveValue(5);
  });

  it("starts a focus session with custom durations", async () => {
    const user = userEvent.setup();
    const { onStart } = renderDialog();
    await user.clear(screen.getByLabelText(COPY.focusMinutes));
    await user.type(screen.getByLabelText(COPY.focusMinutes), "50");
    await user.clear(screen.getByLabelText(COPY.breakMinutes));
    await user.type(screen.getByLabelText(COPY.breakMinutes), "10");
    await user.click(screen.getByRole("button", { name: COPY.start }));
    expect(onStart).toHaveBeenCalledWith({ focusMinutes: 50, breakMinutes: 10 });
  });

  it("disables start for out-of-range durations", async () => {
    const user = userEvent.setup();
    const { onStart } = renderDialog();
    await user.clear(screen.getByLabelText(COPY.focusMinutes));
    await user.type(screen.getByLabelText(COPY.focusMinutes), "0");
    expect(screen.getByRole("button", { name: COPY.start })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: COPY.start }));
    expect(onStart).not.toHaveBeenCalled();
  });

  it("cancels without starting", async () => {
    const user = userEvent.setup();
    const { onStart, onClose } = renderDialog();
    await user.click(screen.getByRole("button", { name: COPY.close }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onStart).not.toHaveBeenCalled();
  });

  it("renders nothing when closed", () => {
    renderDialog({ open: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
