import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef, useState, type RefObject } from "react";
import { describe, expect, it, vi } from "vitest";
import { DeletePracticeHistoryDialog, type DeletePracticeHistoryDialogProps } from "./DeletePracticeHistoryDialog";
import type { HistoryDeletionStatus } from "../hooks/useProgressAttempts";
import { copy, LAUNCHED_LANGUAGES } from "../i18n";

// #693: the deletion-protocol confirmation dialog wired into the account
// entries (desktop heading-auth + mobile 更多 menu). A destructive action needs
// a double-confirm: the checkbox gates confirm, and while `deleting` every
// control is locked so a repeat operation can never fire. Contract tests for
// the raw component (open/close/confirm/error), independent of App wiring.

type Copy = DeletePracticeHistoryDialogProps["copy"];

function makeCopy(overrides: Partial<Copy> = {}): Copy {
  return {
    title: "刪除練習紀錄",
    description:
      "這會刪除此帳號已同步的練習作答紀錄，並清除此裝置的練習紀錄與弱點／複習進度。帳號、收藏、語言與外觀設定不會刪除，此操作不可復原。",
    confirmLabel: "刪除",
    confirmDeleting: "刪除中…",
    cancelLabel: "取消",
    closeLabel: "關閉視窗",
    checkboxLabel: "我了解此操作不可復原",
    success: "練習紀錄已刪除",
    error: "刪除失敗，請再試一次。",
    ...overrides
  };
}

function deferred<T>(): { promise: Promise<T>; resolve: (v: T) => void; reject: (e: unknown) => void } {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// The component is controlled by `open` + `status`; the harness mirrors App's
// wiring: confirm flips status to deleting, then deleted/error per the result,
// and onClose collapses `open`.
function Harness({
  onConfirm = vi.fn(),
  onClose = vi.fn()
}: {
  onConfirm?: () => Promise<boolean>;
  onClose?: () => void;
}) {
  const [open, setOpen] = useState(true);
  const [status, setStatus] = useState<HistoryDeletionStatus>("idle");
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const props: DeletePracticeHistoryDialogProps = {
    open,
    status,
    onConfirm: async () => {
      setStatus("deleting");
      const ok = await onConfirm();
      setStatus(ok ? "deleted" : "error");
      return ok;
    },
    onClose: () => {
      onClose();
      setOpen(false);
    },
    returnFocusRef: triggerRef as RefObject<HTMLButtonElement | null>,
    copy: makeCopy()
  };
  return (
    <>
      <button type="button" ref={triggerRef} onClick={() => setOpen(true)}>
        trigger
      </button>
      <DeletePracticeHistoryDialog {...props} />
    </>
  );
}

describe("DeletePracticeHistoryDialog (#693)", () => {
  it("renders the destructive-confirmation content when open", () => {
    render(<Harness />);

    const dialog = screen.getByRole("dialog", { name: "刪除練習紀錄" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(
      screen.getByText(
        "這會刪除此帳號已同步的練習作答紀錄，並清除此裝置的練習紀錄與弱點／複習進度。帳號、收藏、語言與外觀設定不會刪除，此操作不可復原。"
      )
    ).toBeInTheDocument();
    // The confirm button is disabled until the checkbox is ticked.
    expect(screen.getByRole("button", { name: "刪除" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "取消" })).toBeEnabled();
  });

  it("gates confirm on the checkbox — tick enables, uncheck disables", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const confirm = screen.getByRole("button", { name: "刪除" });
    const checkbox = screen.getByRole("checkbox", { name: "我了解此操作不可復原" });
    expect(confirm).toBeDisabled();

    await user.click(checkbox);
    expect(confirm).toBeEnabled();

    await user.click(checkbox);
    expect(confirm).toBeDisabled();
  });

  it("confirm fires once and, on success, closes and reports success", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn(async () => true);
    const onClose = vi.fn();
    render(<Harness onConfirm={onConfirm} onClose={onClose} />);

    await user.click(screen.getByRole("checkbox", { name: "我了解此操作不可復原" }));
    await user.click(screen.getByRole("button", { name: "刪除" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("never calls confirm before the checkbox is ticked", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn(async () => true);
    render(<Harness onConfirm={onConfirm} />);

    // Disabled button ignores clicks entirely.
    await user.click(screen.getByRole("button", { name: "刪除" }));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("on failure keeps the dialog open and shows a retryable error; success never renders", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn(async () => false);
    const onClose = vi.fn();
    render(<Harness onConfirm={onConfirm} onClose={onClose} />);

    await user.click(screen.getByRole("checkbox", { name: "我了解此操作不可復原" }));
    await user.click(screen.getByRole("button", { name: "刪除" }));

    // Dialog stays open, error shows, no success text anywhere, close not called.
    expect(screen.getByRole("dialog", { name: "刪除練習紀錄" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("刪除失敗，請再試一次。");
    expect(screen.queryByText("練習紀錄已刪除")).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();

    // Retry is possible: the error resets and confirm can be clicked again.
    expect(screen.getByRole("button", { name: "刪除" })).toBeEnabled();
  });

  it("reopens with a fresh confirmation and error state after a failed attempt", async () => {
    const user = userEvent.setup();
    render(<Harness onConfirm={vi.fn(async () => false)} />);

    await user.click(screen.getByRole("checkbox", { name: "我了解此操作不可復原" }));
    await user.click(screen.getByRole("button", { name: "刪除" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("刪除失敗，請再試一次。");

    await user.click(screen.getByRole("button", { name: "取消" }));
    await user.click(screen.getByRole("button", { name: "trigger" }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "我了解此操作不可復原" })).not.toBeChecked();
    expect(screen.getByRole("button", { name: "刪除" })).toBeDisabled();
  });

  it("lock: while deleting, confirm/cancel/close are all disabled and Escape is inert", async () => {
    const user = userEvent.setup();
    const gate = deferred<boolean>();
    const onConfirm = vi.fn(() => gate.promise);
    const onClose = vi.fn();
    render(<Harness onConfirm={onConfirm} onClose={onClose} />);

    await user.click(screen.getByRole("checkbox", { name: "我了解此操作不可復原" }));
    await user.click(screen.getByRole("button", { name: "刪除" }));
    // The delete is now in flight: label swaps to 刪除中… and everything locks.
    expect(await screen.findByRole("button", { name: "刪除中…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "取消" })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "我了解此操作不可復原" })).toBeDisabled();

    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(onConfirm).toHaveBeenCalledTimes(1);

    // Resolve: the success path closes the dialog.
    gate.resolve(true);
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it("cancel closes without side effects", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "取消" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("Escape closes when idle", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("focuses the dialog on open and returns focus to the trigger on close", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);

    const dialog = screen.getByRole("dialog", { name: "刪除練習紀錄" });
    // Initial focus lands inside the dialog.
    expect(dialog.contains(document.activeElement)).toBe(true);

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "trigger" })).toHaveFocus();
  });

  it("moves focus to the error region when a failed confirm lands", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn(async () => false);
    render(<Harness onConfirm={onConfirm} />);

    await user.click(screen.getByRole("checkbox", { name: "我了解此操作不可復原" }));
    await user.click(screen.getByRole("button", { name: "刪除" }));

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("刪除失敗，請再試一次。");
    expect(alert.contains(document.activeElement)).toBe(true);
  });

  it("traps Tab focus within the dialog while open", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    // Enable confirm so both controls are focusable.
    await user.click(screen.getByRole("checkbox", { name: "我了解此操作不可復原" }));

    const dialog = screen.getByRole("dialog", { name: "刪除練習紀錄" });
    const buttons = [...dialog.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")];
    expect(buttons.length).toBeGreaterThanOrEqual(2);
    const first = buttons[0];
    const last = buttons[buttons.length - 1];

    // Shift+Tab from the first focusable wraps to the last.
    first.focus();
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(last);

    // Tab from the last focusable wraps back to the first.
    last.focus();
    await user.tab();
    expect(document.activeElement).toBe(first);
  });
});

// #693 copy guard: every launched locale ships non-empty delete-history copy,
// and a non-zh-Hant locale never falls back to the Chinese text for any key.
describe("delete-history copy across launched locales (#693)", () => {
  const zh = copy["zh-Hant"];
  const keys = [
    "deleteHistoryLabel",
    "deleteHistoryTitle",
    "deleteHistoryDescription",
    "deleteHistoryConfirm",
    "deleteHistoryConfirming",
    "deleteHistoryCancel",
    "deleteHistoryClose",
    "deleteHistoryCheckbox",
    "deleteHistorySuccess",
    "deleteHistoryError"
  ] as const;

  for (const lang of LAUNCHED_LANGUAGES) {
    it(`${lang} ships non-empty delete-history copy and no zh-Hant fallback`, () => {
      for (const key of keys) {
        const value = copy[lang][key];
        expect(value, `${lang}.${key}`).toBeTruthy();
        if (lang !== "zh-Hant") {
          // The Chinese source is never echoed verbatim into another locale
          // (ja shares kanji legitimately, so compare to the full sentence --
          // the actual UI description/checkbox/success strings differ).
          expect(value, `${lang}.${key} fell back to zh-Hant`).not.toBe(zh[key]);
        }
      }
    });
  }
});
