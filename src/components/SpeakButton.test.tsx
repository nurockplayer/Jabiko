import { render, screen, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SpeakButton } from "./SpeakButton";
import { writeTtsRate } from "../lib/ttsRate";

// The reported TTS bug (爆音 / 缺失一小段 / 卡頓): Chrome drops the start of an
// utterance when speak() runs in the same tick as cancel(). So when the engine
// is idle we must speak immediately WITHOUT cancel (no clip, no latency); only
// when something is already playing do we cancel and defer the new speak.

type MockSynth = {
  speaking: boolean;
  pending: boolean;
  utterances: MockUtterance[];
  speak: ReturnType<typeof vi.fn>;
  cancel: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
  resume: ReturnType<typeof vi.fn>;
  getVoices: () => unknown[];
};

type MockUtterance = {
  text: string;
  lang: string;
  rate: number;
  voice: unknown;
  emit: (type: "end" | "error") => void;
};

function setupSynth({ speaking = false, pending = false } = {}): MockSynth {
  const utterances: MockUtterance[] = [];
  class MockUtteranceImpl implements MockUtterance {
    lang = "";
    rate = 1;
    voice: unknown = null;
    private listeners = new Map<string, Set<() => void>>();

    constructor(public text: string) {
      utterances.push(this);
    }

    addEventListener(type: string, listener: () => void) {
      const listeners = this.listeners.get(type) ?? new Set<() => void>();
      listeners.add(listener);
      this.listeners.set(type, listeners);
    }

    removeEventListener(type: string, listener: () => void) {
      this.listeners.get(type)?.delete(listener);
    }

    emit(type: "end" | "error") {
      for (const listener of this.listeners.get(type) ?? []) listener();
    }
  }

  const synth: MockSynth = {
    speaking,
    pending,
    utterances,
    speak: vi.fn(() => {
      synth.speaking = true;
      synth.pending = false;
    }),
    cancel: vi.fn(function (this: MockSynth) {
      synth.speaking = false;
      synth.pending = false;
    }),
    pause: vi.fn(),
    resume: vi.fn(),
    getVoices: () => []
  };
  (window as unknown as { speechSynthesis: MockSynth }).speechSynthesis = synth;
  (window as unknown as { SpeechSynthesisUtterance: unknown }).SpeechSynthesisUtterance = MockUtteranceImpl;
  return synth;
}

describe("SpeakButton", () => {
  let now = Date.UTC(2300, 0, 1);

  beforeEach(() => {
    vi.useFakeTimers();
    now += 1_000;
    vi.setSystemTime(now);
  });
  afterEach(() => {
    vi.useRealTimers();
    window.localStorage.removeItem("jabiko.ttsRate");
    delete (window as unknown as { speechSynthesis?: unknown }).speechSynthesis;
    delete (window as unknown as { SpeechSynthesisUtterance?: unknown }).SpeechSynthesisUtterance;
  });

  it("speaks immediately without cancel when the engine is idle (no clipped start)", () => {
    const synth = setupSynth({ speaking: false });
    render(<SpeakButton text="ねこ" language="zh-Hant" />);
    fireEvent.click(screen.getByRole("button"));
    expect(synth.speak).toHaveBeenCalledTimes(1);
    expect(synth.cancel).not.toHaveBeenCalled();
  });

  it("cancels then defers speak when already speaking (avoids the cancel→speak clip)", () => {
    const synth = setupSynth({ speaking: true });
    render(<SpeakButton text="ねこ" language="zh-Hant" />);
    fireEvent.click(screen.getByRole("button"));
    expect(synth.cancel).toHaveBeenCalledTimes(1);
    // The new utterance must NOT be spoken in the same tick as cancel.
    expect(synth.speak).not.toHaveBeenCalled();
    vi.advanceTimersByTime(200);
    expect(synth.speak).toHaveBeenCalledTimes(1);
  });

  it("waits through the cancellation cooldown and speaks only the latest rapid request", () => {
    const synth = setupSynth({ speaking: true });
    render(
      <>
        <SpeakButton text="ねこ" language="zh-Hant" />
        <SpeakButton text="いぬ" language="zh-Hant" />
      </>
    );
    const [first, second] = screen.getAllByRole("button");

    fireEvent.click(first);
    fireEvent.click(second);

    expect(synth.speak).not.toHaveBeenCalled();
    vi.advanceTimersByTime(129);
    expect(synth.speak).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(synth.speak).toHaveBeenCalledTimes(1);
    expect((synth.speak.mock.calls[0][0] as MockUtterance).text).toBe("いぬ");
  });

  it("cancels active playback when its owning button unmounts", () => {
    const synth = setupSynth({ speaking: false });
    const { unmount } = render(<SpeakButton text="ねこ" language="zh-Hant" />);

    fireEvent.click(screen.getByRole("button"));
    unmount();

    expect(synth.cancel).toHaveBeenCalledTimes(1);
  });

  it("cancels its active utterance when the button text changes", () => {
    const synth = setupSynth({ speaking: false });
    const { rerender } = render(<SpeakButton text="ねこ" language="zh-Hant" />);

    fireEvent.click(screen.getByRole("button"));
    rerender(<SpeakButton text="いぬ" language="zh-Hant" />);

    expect(synth.cancel).toHaveBeenCalledTimes(1);
  });

  it("clears its pending restart when the button text changes", () => {
    const synth = setupSynth({ speaking: true });
    const { rerender } = render(<SpeakButton text="ねこ" language="zh-Hant" />);

    fireEvent.click(screen.getByRole("button"));
    rerender(<SpeakButton text="いぬ" language="zh-Hant" />);
    vi.advanceTimersByTime(200);

    expect(synth.cancel).toHaveBeenCalledTimes(2);
    expect(synth.speak).not.toHaveBeenCalled();
  });

  it("does not cancel a newer button's playback when its own text changes", () => {
    const synth = setupSynth({ speaking: false });
    const { rerender } = render(
      <>
        <SpeakButton text="ねこ" language="zh-Hant" />
        <SpeakButton text="いぬ" language="zh-Hant" />
      </>
    );
    const [first, second] = screen.getAllByRole("button");
    fireEvent.click(first);
    fireEvent.click(second);

    rerender(
      <>
        <SpeakButton text="うさぎ" language="zh-Hant" />
        <SpeakButton text="いぬ" language="zh-Hant" />
      </>
    );

    // The second button must hand off the active first utterance once. The
    // first button's text cleanup must not add a second cancellation.
    expect(synth.cancel).toHaveBeenCalledTimes(1);
  });

  it("keeps the newer owner active when a cancelled utterance later ends", () => {
    const synth = setupSynth({ speaking: false });
    const { rerender } = render(
      <>
        <SpeakButton text="ねこ" language="zh-Hant" />
        <SpeakButton text="いぬ" language="zh-Hant" />
      </>
    );
    const [first, second] = screen.getAllByRole("button");
    fireEvent.click(first);
    fireEvent.click(second);
    vi.advanceTimersByTime(130);

    synth.utterances[0].emit("end");
    rerender(
      <>
        <SpeakButton text="ねこ" language="zh-Hant" />
        <SpeakButton text="うさぎ" language="zh-Hant" />
      </>
    );

    // One cancel hands off the first utterance; the second proves the newer
    // owner stayed active despite the stale first utterance's end event.
    expect(synth.cancel).toHaveBeenCalledTimes(2);
  });

  it("does not cancel another button's playback when speech access fails", () => {
    const synth = setupSynth({ speaking: false });
    render(
      <>
        <SpeakButton text="ねこ" language="zh-Hant" />
        <SpeakButton text="いぬ" language="zh-Hant" />
      </>
    );
    const [first, second] = screen.getAllByRole("button");
    fireEvent.click(first);
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      get: () => {
        throw new Error("unavailable");
      }
    });

    fireEvent.click(second);

    expect(synth.cancel).not.toHaveBeenCalled();
  });

  it("keeps the stored speech rate on the utterance", () => {
    const synth = setupSynth({ speaking: false });
    writeTtsRate(0.7);
    render(<SpeakButton text="ねこ" language="zh-Hant" />);

    fireEvent.click(screen.getByRole("button"));

    expect((synth.speak.mock.calls[0][0] as { lang: string; rate: number })).toMatchObject({
      lang: "ja-JP",
      rate: 0.7
    });
  });

  it("renders nothing when speech synthesis is unavailable", () => {
    // no setupSynth: window.speechSynthesis undefined
    const { container } = render(<SpeakButton text="ねこ" language="zh-Hant" />);
    expect(container.firstChild).toBeNull();
  });
});
