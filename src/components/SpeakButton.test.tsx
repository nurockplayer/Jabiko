import { render, screen, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SpeakButton } from "./SpeakButton";

// The reported TTS bug (爆音 / 缺失一小段 / 卡頓): Chrome drops the start of an
// utterance when speak() runs in the same tick as cancel(). So when the engine
// is idle we must speak immediately WITHOUT cancel (no clip, no latency); only
// when something is already playing do we cancel and defer the new speak.

type MockSynth = {
  speaking: boolean;
  pending: boolean;
  speak: ReturnType<typeof vi.fn>;
  cancel: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
  resume: ReturnType<typeof vi.fn>;
  getVoices: () => unknown[];
};

function setupSynth({ speaking = false } = {}): MockSynth {
  const synth: MockSynth = {
    speaking,
    pending: false,
    speak: vi.fn(),
    cancel: vi.fn(function (this: MockSynth) {
      synth.speaking = false;
    }),
    pause: vi.fn(),
    resume: vi.fn(),
    getVoices: () => []
  };
  (window as unknown as { speechSynthesis: MockSynth }).speechSynthesis = synth;
  (window as unknown as { SpeechSynthesisUtterance: unknown }).SpeechSynthesisUtterance =
    class {
      text: string;
      lang = "";
      rate = 1;
      voice: unknown = null;
      constructor(t: string) {
        this.text = t;
      }
      addEventListener() {}
      removeEventListener() {}
    };
  return synth;
}

describe("SpeakButton", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
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

  it("renders nothing when speech synthesis is unavailable", () => {
    // no setupSynth: window.speechSynthesis undefined
    const { container } = render(<SpeakButton text="ねこ" language="zh-Hant" />);
    expect(container.firstChild).toBeNull();
  });
});
