// FocusBreakOverlay tests (#771): the soft-strict full-screen break surface.
// It must show remaining break time + a useful session summary, keep Skip break
// / End Focus Mode always available, never trap the learner, and degrade
// gracefully when summary data is absent (e.g. non-question learning surface).
import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FocusBreakOverlay, type FocusBreakOverlayCopy } from "./FocusBreakOverlay";

vi.mock("../ads/AdSensePlacement", () => ({
  AdSensePlacement: ({ eligible, label }: { eligible: boolean; label: string }) =>
    eligible ? <aside aria-label={label}>provider boundary</aside> : null
}));

const COPY: FocusBreakOverlayCopy = {
  title: "休息一下",
  restPrompt: "放鬆一下，伸展或喝口水，再繼續下一輪。",
  skipBreak: "略過休息",
  nextCycle: "開始下一輪",
  endMode: "結束專注模式",
  summaryFocus: "本次專注",
  summaryQuestions: "作答",
  summaryAccuracy: "正確率",
  summaryToday: "今日累計",
  advertisement: "廣告"
};

const SUMMARY = { focusDurationMin: 25, answered: 12, accuracy: 75, dayFocusedMin: 50 };

function renderOverlay(props: Partial<React.ComponentProps<typeof FocusBreakOverlay>> = {}) {
  const returnFocusRef = createRef<HTMLButtonElement>();
  const onSkip = vi.fn();
  const onEnd = vi.fn();
  render(
    <FocusBreakOverlay
      open={true}
      breakRemainingMs={5 * 60_000}
      breakDone={false}
      summary={SUMMARY}
      onSkip={onSkip}
      onEnd={onEnd}
      returnFocusRef={returnFocusRef}
      copy={COPY}
      {...props}
    />
  );
  return { onSkip, onEnd, returnFocusRef };
}

describe("FocusBreakOverlay", () => {
  it("renders the break surface with remaining time, summary, and skip/end actions", () => {
    renderOverlay();
    expect(screen.getByRole("dialog", { name: COPY.title })).toBeInTheDocument();
    expect(screen.getByText("05:00")).toBeInTheDocument();
    expect(screen.getByText(COPY.restPrompt)).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
    const skip = screen.getByRole("button", { name: COPY.skipBreak });
    const end = screen.getByRole("button", { name: COPY.endMode });
    expect(skip).toBeInTheDocument();
    expect(end).toBeInTheDocument();
  });

  it("skips straight to the next cycle", async () => {
    const user = userEvent.setup();
    const { onSkip, onEnd } = renderOverlay();
    await user.click(screen.getByRole("button", { name: COPY.skipBreak }));
    expect(onSkip).toHaveBeenCalledTimes(1);
    expect(onEnd).not.toHaveBeenCalled();
  });

  it("ends Focus Mode from the break surface", async () => {
    const user = userEvent.setup();
    const { onEnd } = renderOverlay();
    await user.click(screen.getByRole("button", { name: COPY.endMode }));
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it("switches to the next-cycle action once the break is done", () => {
    renderOverlay({ breakDone: true, breakRemainingMs: 0 });
    expect(screen.getByRole("button", { name: COPY.nextCycle })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: COPY.skipBreak })).not.toBeInTheDocument();
    expect(screen.getByText("00:00")).toBeInTheDocument();
  });

  it("keeps skip/end usable when the break is done", async () => {
    const user = userEvent.setup();
    const { onSkip, onEnd } = renderOverlay({ breakDone: true, breakRemainingMs: 0 });
    await user.click(screen.getByRole("button", { name: COPY.nextCycle }));
    expect(onSkip).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: COPY.endMode }));
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it("omits the summary section when no session data is available", () => {
    renderOverlay({ summary: null });
    expect(screen.queryByText(COPY.summaryFocus)).not.toBeInTheDocument();
    expect(screen.queryByText(COPY.summaryQuestions)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: COPY.skipBreak })).toBeInTheDocument();
    expect(screen.queryByRole("complementary", { name: COPY.advertisement })).not.toBeInTheDocument();
  });

  it("offers only the allowlisted Focus Break placement when substantive summary content exists", () => {
    renderOverlay();
    const ad = screen.getByRole("complementary", { name: COPY.advertisement });
    const summary = screen.getByText(COPY.summaryFocus).closest("dl");
    const actions = screen.getByRole("button", { name: COPY.skipBreak }).closest("div");
    expect(summary).not.toBeNull();
    expect(actions).not.toBeNull();
    expect(ad.compareDocumentPosition(summary as Node) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(
      (summary as Node).compareDocumentPosition(actions as Node) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it("is soft-strict: Escape does not dismiss the break surface", async () => {
    const user = userEvent.setup();
    renderOverlay();
    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog", { name: COPY.title })).toBeInTheDocument();
  });

  it("focuses the dialog on open", () => {
    renderOverlay();
    expect(screen.getByRole("dialog")).toHaveFocus();
  });

  it("renders nothing when closed", () => {
    renderOverlay({ open: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
