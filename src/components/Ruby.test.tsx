import type { ReactNode } from "react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Ruby } from "./Ruby";
import { FuriganaContext } from "./furiganaContext";
import { furiganaData } from "../domain/furiganaData";

// A sentence known to be in the pre-baked data, with at least one kanji run
// (学校 -> がっこう). The first test guards that assumption.
const SENTENCE = "ここは学校だ。";

function renderWithToggle(ui: ReactNode, enabled: boolean) {
  return render(<FuriganaContext.Provider value={{ enabled }}>{ui}</FuriganaContext.Provider>);
}

describe("Ruby", () => {
  it("the fixture sentence really is in the pre-baked data (guards the suite)", () => {
    expect(furiganaData[SENTENCE]).toBeDefined();
  });

  it("renders plain text with furigana disabled (no <rt>)", () => {
    const { container } = renderWithToggle(<Ruby text={SENTENCE} />, false);
    expect(container.querySelector("rt")).toBeNull();
    expect(container.textContent).toBe(SENTENCE);
  });

  it("renders <ruby>/<rt> readings when enabled", () => {
    const { container } = renderWithToggle(<Ruby text={SENTENCE} />, true);
    const readings = Array.from(container.querySelectorAll("rt")).map((node) => node.textContent);
    expect(readings).toContain("がっこう");
    expect(container.textContent).toContain("学校");
  });

  it("renders plain text when plain is set, even with furigana enabled (#134 reading guard)", () => {
    const { container } = renderWithToggle(<Ruby text={SENTENCE} plain />, true);
    expect(container.querySelector("rt")).toBeNull();
    expect(container.textContent).toBe(SENTENCE);
  });

  it("renders plain text for a sentence with no pre-baked entry", () => {
    const unknown = "これは登録されていない文です。";
    expect(furiganaData[unknown]).toBeUndefined();
    const { container } = renderWithToggle(<Ruby text={unknown} />, true);
    expect(container.querySelector("rt")).toBeNull();
    expect(container.textContent).toBe(unknown);
  });

  it("defaults to plain text with no provider (default context is off)", () => {
    const { container } = render(<Ruby text={SENTENCE} />);
    expect(container.querySelector("rt")).toBeNull();
    expect(container.textContent).toBe(SENTENCE);
  });
});
