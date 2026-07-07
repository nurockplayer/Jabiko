import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TtsRatePicker } from "./TtsRatePicker";
import { TTS_RATE_DEFAULT } from "../../lib/ttsRate";

function renderPicker(overrides: Partial<Parameters<typeof TtsRatePicker>[0]> = {}) {
  const props = {
    language: "zh-Hant" as const,
    rate: TTS_RATE_DEFAULT,
    onChange: vi.fn(),
    ...overrides
  };
  render(<TtsRatePicker {...props} />);
  return props;
}

describe("TtsRatePicker (#527 speech-rate control)", () => {
  it("marks the preset matching the current rate as pressed", () => {
    renderPicker({ rate: TTS_RATE_DEFAULT });
    expect(screen.getByRole("button", { name: "標準" })).toHaveAttribute("aria-pressed", "true");
  });

  it("calls onChange with a slower rate when a slower preset is chosen", () => {
    const onChange = vi.fn();
    renderPicker({ onChange });
    fireEvent.click(screen.getByRole("button", { name: "慢" }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toBeLessThan(TTS_RATE_DEFAULT);
  });

  it("accepts a custom manual rate via the number input", () => {
    const props = renderPicker();
    fireEvent.change(screen.getByLabelText("自訂"), { target: { value: "1.2" } });
    expect(props.onChange).toHaveBeenCalledWith(1.2);
  });

  it("lets the user type a sub-1 slow rate digit-by-digit without the leading 0 reverting", () => {
    const props = renderPicker();
    const input = screen.getByLabelText("自訂") as HTMLInputElement;
    // Typing "0" is not yet a committable rate (0 is out of range) -- it must
    // NOT be reverted, so the user can go on to type "0.8".
    fireEvent.change(input, { target: { value: "0" } });
    expect(input.value).toBe("0");
    expect(props.onChange).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: "0.8" } });
    expect(props.onChange).toHaveBeenCalledWith(0.8);
  });

  it("does not commit an out-of-range custom value and reconciles the field on blur", () => {
    const props = renderPicker({ rate: TTS_RATE_DEFAULT });
    const input = screen.getByLabelText("自訂") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "99" } });
    expect(props.onChange).not.toHaveBeenCalled();
    expect(input.value).toBe("99"); // draft kept while editing
    fireEvent.blur(input);
    expect(input.value).toBe(""); // reverts to the active preset (empty custom field)
  });

  it("clears the custom draft when a preset is chosen", () => {
    renderPicker({ rate: 1.25 });
    const input = screen.getByLabelText("自訂") as HTMLInputElement;
    expect(input.value).toBe("1.25");
    fireEvent.click(screen.getByRole("button", { name: "標準" }));
    expect(input.value).toBe("");
  });

  it("highlights the custom field when the rate is not one of the presets", () => {
    renderPicker({ rate: 1.25 });
    // no preset button is pressed for an off-preset rate
    expect(screen.getByRole("button", { name: "標準" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "慢" })).toHaveAttribute("aria-pressed", "false");
  });
});
