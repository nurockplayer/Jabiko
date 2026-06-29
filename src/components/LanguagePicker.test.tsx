import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LanguagePicker } from "./LanguagePicker";
import { copy, type Language } from "../i18n";

const OPTIONS: readonly Language[] = ["zh-Hant", "ja", "en", "th", "id", "ko", "vi", "my"];

describe("LanguagePicker", () => {
  it("renders a modal dialog", () => {
    render(<LanguagePicker current="ja" options={OPTIONS} onChoose={vi.fn()} />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("renders one button per option, labelled with that locale's native name", () => {
    render(<LanguagePicker current="ja" options={OPTIONS} onChoose={vi.fn()} />);

    for (const code of OPTIONS) {
      expect(
        screen.getByRole("button", { name: copy[code].languageName })
      ).toBeInTheDocument();
    }
  });

  it("marks the suggested (current) option with aria-current", () => {
    render(<LanguagePicker current="ja" options={OPTIONS} onChoose={vi.fn()} />);

    const suggested = screen.getByRole("button", { name: copy.ja.languageName });
    expect(suggested).toHaveAttribute("aria-current", "true");

    const other = screen.getByRole("button", { name: copy.ko.languageName });
    expect(other).not.toHaveAttribute("aria-current", "true");
  });

  it("calls onChoose with the picked language", async () => {
    const onChoose = vi.fn();
    const user = userEvent.setup();
    render(<LanguagePicker current="ja" options={OPTIONS} onChoose={onChoose} />);

    await user.click(screen.getByRole("button", { name: copy.ko.languageName }));

    expect(onChoose).toHaveBeenCalledTimes(1);
    expect(onChoose).toHaveBeenCalledWith("ko");
  });

  it("focuses the suggested option on open so Enter commits it", () => {
    render(<LanguagePicker current="vi" options={OPTIONS} onChoose={vi.fn()} />);

    expect(screen.getByRole("button", { name: copy.vi.languageName })).toHaveFocus();
  });

  // Dismissible mode (#326): when opened on demand from the header switcher an
  // onClose is passed, so the user can back out without changing language. The
  // first-visit picker passes no onClose and stays mandatory.
  describe("dismissible mode (onClose)", () => {
    it("shows a close button that calls onClose", async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(
        <LanguagePicker
          current="ja"
          options={OPTIONS}
          onChoose={vi.fn()}
          onClose={onClose}
          closeLabel="關閉"
        />
      );

      await user.click(screen.getByRole("button", { name: "關閉" }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("closes on Escape", () => {
      const onClose = vi.fn();
      render(<LanguagePicker current="ja" options={OPTIONS} onChoose={vi.fn()} onClose={onClose} />);

      fireEvent.keyDown(document, { key: "Escape" });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("closes when the backdrop is clicked but not when the dialog is", async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      const { container } = render(
        <LanguagePicker current="ja" options={OPTIONS} onChoose={vi.fn()} onClose={onClose} />
      );

      await user.click(screen.getByRole("dialog"));
      expect(onClose).not.toHaveBeenCalled();

      await user.click(container.querySelector(".lang-picker-overlay")!);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("has no close button when onClose is omitted (mandatory first-visit)", () => {
      render(<LanguagePicker current="ja" options={OPTIONS} onChoose={vi.fn()} />);

      expect(screen.queryByRole("button", { name: /關閉|close/i })).not.toBeInTheDocument();
    });
  });
});
