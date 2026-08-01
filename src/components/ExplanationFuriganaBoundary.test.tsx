import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ExplanationFuriganaBoundary } from "./ExplanationFuriganaBoundary";
import { FuriganaContext } from "./furiganaContext";
import { RubyText } from "./RubyText";
import { Ruby } from "./Ruby";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("ExplanationFuriganaBoundary (#599)", () => {
  it("renders children immediately even before the map loads", () => {
    render(
      <ExplanationFuriganaBoundary>
        <div>test content</div>
      </ExplanationFuriganaBoundary>
    );
    expect(screen.getByText("test content")).toBeInTheDocument();
  });

  it("does not load explanation data when furigana is OFF", () => {
    // The point is the boundary won't trigger dynamic import when not enabled.
    // We verify by checking render output: no ruby <rt> for explanation keys.
    const { container } = render(
      <FuriganaContext.Provider value={{ enabled: false }}>
        <ExplanationFuriganaBoundary>
          <RubyText text="正解「学校」：這裡記住讀音。" />
        </ExplanationFuriganaBoundary>
      </FuriganaContext.Provider>
    );
    // No ruby annotations
    expect(container.querySelectorAll("rt")).toHaveLength(0);
    // Plain text still visible
    expect(container.textContent).toContain("正解「学校」：這裡記住讀音。");
  });

  it("works with RubyText inside producing ruby when data is available via the loader", async () => {
    // Mount with furigana enabled; after the loader resolves, ruby appears.
    // Dynamic import works in test environment via jsdom.
    const { container } = render(
      <FuriganaContext.Provider value={{ enabled: true }}>
        <ExplanationFuriganaBoundary>
          <RubyText text="正解「学校」：這裡記住讀音。" />
        </ExplanationFuriganaBoundary>
      </FuriganaContext.Provider>
    );

    // Wait for the effect to fire and the dynamic import to resolve
    // The loader resolves to the real generated data
    await vi.waitFor(() => {
      const rts = container.querySelectorAll("rt");
      expect(rts.length).toBeGreaterThan(0);
    });
  });

  it("falls back to plain text without crashing on render with no ruby data", () => {
    // Explanation key that's not in the map — should render as plain text.
    const { container } = render(
      <FuriganaContext.Provider value={{ enabled: true }}>
        <ExplanationFuriganaBoundary>
          <Ruby text="学校" />
        </ExplanationFuriganaBoundary>
      </FuriganaContext.Provider>
    );
    expect(container.textContent).toContain("学校");
  });

  it("loads explanation data at most once across remounts", async () => {
    // We can't easily test dynamic import dedup without mocking,
    // but the module-level cache in the loader is verified by
    // furiganaExplanationLoader.test.ts (same-promise dedup).
    // This test verifies the boundary doesn't crash on remount.
    const { unmount } = render(
      <FuriganaContext.Provider value={{ enabled: true }}>
        <ExplanationFuriganaBoundary>
          <RubyText text="正解「学校」：這裡記住讀音。" />
        </ExplanationFuriganaBoundary>
      </FuriganaContext.Provider>
    );
    unmount();

    const { container: c2 } = render(
      <FuriganaContext.Provider value={{ enabled: true }}>
        <ExplanationFuriganaBoundary>
          <RubyText text="正解「食べる」：這裡記住讀音。" />
        </ExplanationFuriganaBoundary>
      </FuriganaContext.Provider>
    );
    await vi.waitFor(() => {
      expect(c2.querySelectorAll("rt").length).toBeGreaterThan(0);
    });
  });
});
