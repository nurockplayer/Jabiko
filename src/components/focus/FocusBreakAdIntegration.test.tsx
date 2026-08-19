import { createRef } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FocusBreakOverlay, type FocusBreakOverlayCopy } from "./FocusBreakOverlay";

const adMocks = vi.hoisted(() => ({
  getAdSensePlacement: vi.fn(),
  loadAdSenseScript: vi.fn(),
  readAdConsent: vi.fn(),
  requestAdSenseFill: vi.fn()
}));

vi.mock("../../lib/adsense", () => adMocks);

const COPY: FocusBreakOverlayCopy = {
  title: "Take a break",
  restPrompt: "Rest before the next round.",
  skipBreak: "Skip break",
  nextCycle: "Start next round",
  endMode: "End Focus Mode",
  summaryFocus: "Focus time",
  summaryQuestions: "Answered",
  summaryAccuracy: "Accuracy",
  summaryToday: "Today total",
  advertisement: "Advertisement"
};

function renderBreak() {
  const onSkip = vi.fn();
  const onEnd = vi.fn();
  render(
    <FocusBreakOverlay
      open={true}
      breakRemainingMs={300_000}
      breakDone={false}
      summary={{ focusDurationMin: 25, answered: 8, accuracy: 75, dayFocusedMin: 25 }}
      adEligible={true}
      onSkip={onSkip}
      onEnd={onEnd}
      returnFocusRef={createRef<HTMLButtonElement>()}
      copy={COPY}
    />
  );
  return { onSkip, onEnd };
}

async function useBothControls(onSkip: ReturnType<typeof vi.fn>, onEnd: ReturnType<typeof vi.fn>) {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: COPY.skipBreak }));
  await user.click(screen.getByRole("button", { name: COPY.endMode }));
  expect(onSkip).toHaveBeenCalledTimes(1);
  expect(onEnd).toHaveBeenCalledTimes(1);
}

describe("Focus Break AdSense integration", () => {
  beforeEach(() => {
    adMocks.getAdSensePlacement.mockReturnValue({
      placement: "focus-break",
      publisherId: "ca-pub-1234567890123456",
      slotId: "1234567890"
    });
    adMocks.readAdConsent.mockResolvedValue(true);
    adMocks.loadAdSenseScript.mockResolvedValue(undefined);
    adMocks.requestAdSenseFill.mockReturnValue(undefined);
  });

  afterEach(() => vi.clearAllMocks());

  it("keeps skip and end independent when the ad initializes", async () => {
    const { onSkip, onEnd } = renderBreak();
    await screen.findByRole("complementary", { name: COPY.advertisement });
    await waitFor(() => expect(adMocks.requestAdSenseFill).toHaveBeenCalledTimes(1));
    await useBothControls(onSkip, onEnd);
  });

  it("keeps skip and end independent when consent blocks the ad", async () => {
    adMocks.readAdConsent.mockResolvedValue(false);
    const { onSkip, onEnd } = renderBreak();
    await waitFor(() => expect(adMocks.readAdConsent).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("complementary", { name: COPY.advertisement })).not.toBeInTheDocument();
    expect(adMocks.loadAdSenseScript).not.toHaveBeenCalled();
    await useBothControls(onSkip, onEnd);
  });

  it("keeps skip and end independent and removes the slot when script loading fails", async () => {
    adMocks.loadAdSenseScript.mockRejectedValue(new Error("blocked"));
    const { onSkip, onEnd } = renderBreak();
    await waitFor(() => expect(adMocks.loadAdSenseScript).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(
        screen.queryByRole("complementary", { name: COPY.advertisement })
      ).not.toBeInTheDocument()
    );
    await useBothControls(onSkip, onEnd);
  });
});
