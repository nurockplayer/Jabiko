import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FuriganaSegment } from "../domain/furigana";
import { FuriganaContext } from "./furiganaContext";
import { LearningFuriganaBoundary } from "./LearningFuriganaBoundary";
import { LearningRuby } from "./LearningRuby";

const { loadLearningMap } = vi.hoisted(() => ({
  loadLearningMap: vi.fn()
}));

vi.mock("../domain/furiganaLearningLoader", () => ({
  loadLearningMap
}));

const formula = "書く → 書きます";
const formulaMap: Record<string, FuriganaSegment[]> = {
  [formula]: [
    { t: "書", r: "か" },
    { t: "く → " },
    { t: "書", r: "か" },
    { t: "きます" }
  ]
};

function renderBoundary(enabled: boolean) {
  return render(
    <FuriganaContext.Provider value={{ enabled }}>
      <LearningFuriganaBoundary>
        <code><LearningRuby text={formula} /></code>
      </LearningFuriganaBoundary>
    </FuriganaContext.Provider>
  );
}

describe("LearningFuriganaBoundary (#618)", () => {
  beforeEach(() => {
    loadLearningMap.mockReset();
  });

  it("does not request learning data while furigana is off", () => {
    const { container } = renderBoundary(false);
    expect(loadLearningMap).not.toHaveBeenCalled();
    expect(container.querySelector("rt")).toBeNull();
    expect(container.textContent).toContain(formula);
  });

  it("renders plain text immediately, then adds ruby after the map loads", async () => {
    let resolveMap!: (map: Record<string, FuriganaSegment[]>) => void;
    loadLearningMap.mockReturnValue(
      new Promise<Record<string, FuriganaSegment[]>>((resolve) => {
        resolveMap = resolve;
      })
    );

    const { container } = renderBoundary(true);
    expect(container.querySelector("rt")).toBeNull();
    expect(container.textContent).toContain(formula);

    resolveMap(formulaMap);
    await waitFor(() => {
      expect(container.querySelectorAll("rt")).toHaveLength(2);
    });
  });

  it("fails soft when the lazy import rejects", async () => {
    loadLearningMap.mockRejectedValue(new Error("chunk unavailable"));
    const { container } = renderBoundary(true);

    await waitFor(() => {
      expect(loadLearningMap).toHaveBeenCalledTimes(1);
    });
    expect(container.querySelector("rt")).toBeNull();
    expect(container.textContent).toContain(formula);
  });
});
