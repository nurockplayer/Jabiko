import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
// Raw import (typed via vite/client) lets the #678 regression test read the
// hook source without pulling @types/node into the app build — same trick as
// src/domain/prerender/staticPages.test.ts.
import usePwaUpdateSource from "./usePwaUpdate.ts?raw";

// Capture registerSW's options + hand back a spy updateSW, so tests can fire
// onNeedRefresh / onRegisteredSW like the real virtual:pwa-register would.
const updateSW = vi.fn(() => Promise.resolve());
let swOptions: {
  onNeedRefresh?: () => void;
  onRegisteredSW?: (url: string, registration: { update: () => Promise<void> } | undefined) => void;
} = {};

vi.mock("virtual:pwa-register", () => ({
  registerSW: (options: typeof swOptions) => {
    swOptions = options;
    return updateSW;
  }
}));

import { usePwaUpdate } from "./usePwaUpdate";

function setHidden(hidden: boolean) {
  Object.defineProperty(document, "hidden", { configurable: true, value: hidden });
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: hidden ? "hidden" : "visible"
  });
}

function fireVisibilityChange(hidden: boolean) {
  setHidden(hidden);
  act(() => {
    document.dispatchEvent(new Event("visibilitychange"));
  });
}

describe("usePwaUpdate safe-window auto apply", () => {
  beforeEach(() => {
    updateSW.mockClear();
    swOptions = {};
    setHidden(false);
  });

  afterEach(() => {
    setHidden(false);
  });

  it("surfaces needRefresh for the toast when an update arrives", () => {
    const { result } = renderHook(() => usePwaUpdate("home"));
    expect(result.current.needRefresh).toBe(false);
    act(() => swOptions.onNeedRefresh?.());
    expect(result.current.needRefresh).toBe(true);
  });

  it("applies immediately when the update arrives while the tab is hidden on a safe view", () => {
    renderHook(() => usePwaUpdate("home"));
    setHidden(true);
    act(() => swOptions.onNeedRefresh?.());
    expect(updateSW).toHaveBeenCalledWith(true);
  });

  it("applies when the tab goes hidden on a safe view with an update waiting", () => {
    renderHook(() => usePwaUpdate("learn"));
    act(() => swOptions.onNeedRefresh?.());
    expect(updateSW).not.toHaveBeenCalled();
    fireVisibilityChange(true);
    expect(updateSW).toHaveBeenCalledWith(true);
  });

  it("never auto-applies mid-practice (safeViewKey null), even when hidden", () => {
    renderHook(() => usePwaUpdate(null));
    act(() => swOptions.onNeedRefresh?.());
    setHidden(true);
    act(() => swOptions.onNeedRefresh?.());
    fireVisibilityChange(true);
    expect(updateSW).not.toHaveBeenCalled();
  });

  it("applies when leaving practice for a safe view with an update waiting", () => {
    const { rerender } = renderHook(({ key }: { key: string | null }) => usePwaUpdate(key), {
      initialProps: { key: null as string | null }
    });
    act(() => swOptions.onNeedRefresh?.());
    expect(updateSW).not.toHaveBeenCalled();
    rerender({ key: "home" });
    expect(updateSW).toHaveBeenCalledWith(true);
  });

  it("applies on a safe-to-safe view change with an update waiting", () => {
    const { rerender } = renderHook(({ key }: { key: string | null }) => usePwaUpdate(key), {
      initialProps: { key: "learn" as string | null }
    });
    act(() => swOptions.onNeedRefresh?.());
    expect(updateSW).not.toHaveBeenCalled();
    rerender({ key: "home" });
    expect(updateSW).toHaveBeenCalledWith(true);
  });

  it("does not apply while the user stays visible on the same view (toast only)", () => {
    const { result, rerender } = renderHook(({ key }: { key: string | null }) => usePwaUpdate(key), {
      initialProps: { key: "learn" as string | null }
    });
    act(() => swOptions.onNeedRefresh?.());
    rerender({ key: "learn" });
    expect(updateSW).not.toHaveBeenCalled();
    expect(result.current.needRefresh).toBe(true);
  });

  it("checks for a new SW when the tab becomes visible again", () => {
    renderHook(() => usePwaUpdate("home"));
    const registration = { update: vi.fn(() => Promise.resolve()) };
    act(() => swOptions.onRegisteredSW?.("/sw.js", registration));
    fireVisibilityChange(true);
    registration.update.mockClear();
    fireVisibilityChange(false);
    expect(registration.update).toHaveBeenCalled();
  });
});

// #678: React Hooks v7 `refs` rule forbids writing a ref during render. The SW
// callbacks and visibilitychange listener read safeKeyRef.current (the
// latest-value bridge), so it must be synced from safeViewKey in a layout
// effect after commit — never in the component body. This asserts that
// structural contract directly; a stray render-phase write regresses the ESLint
// `react-hooks/refs` gate even though the observable behaviour is unchanged.
describe("usePwaUpdate ref-sync contract (#678)", () => {
  it("never writes safeKeyRef.current in the component body", () => {
    const fnIdx = usePwaUpdateSource.indexOf("function usePwaUpdate");
    // The component body is everything up to the first effect; safeKeyRef must
    // only be written inside the layout effect, never during render.
    const layoutIdx = usePwaUpdateSource.indexOf("useLayoutEffect", fnIdx);
    const body = usePwaUpdateSource.slice(
      fnIdx,
      layoutIdx === -1
        ? usePwaUpdateSource.indexOf("useEffect(() => {", fnIdx)
        : layoutIdx
    );
    expect(body).not.toContain("safeKeyRef.current =");
  });

  it("syncs safeKeyRef from safeViewKey in a layout effect after commit", () => {
    const fnIdx = usePwaUpdateSource.indexOf("function usePwaUpdate");
    expect(usePwaUpdateSource.slice(fnIdx)).toMatch(
      /useLayoutEffect\(\(\) => \{\s*safeKeyRef\.current = safeViewKey;\s*\}, \[safeViewKey\]\)/
    );
  });
});
