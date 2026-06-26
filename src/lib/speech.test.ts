import { describe, expect, it } from "vitest";
import { pickJapaneseVoice } from "./speech";

// Minimal SpeechSynthesisVoice stand-ins.
function voice(lang: string, name = lang, localService = true): SpeechSynthesisVoice {
  return { lang, name, localService, default: false, voiceURI: name } as SpeechSynthesisVoice;
}

describe("pickJapaneseVoice", () => {
  it("returns null when there is no Japanese voice", () => {
    expect(pickJapaneseVoice([voice("zh-CN"), voice("en-US")])).toBeNull();
  });

  it("picks a ja-JP voice over zh / en (the iOS Chinese-voice bug)", () => {
    const picked = pickJapaneseVoice([voice("zh-CN", "Tingting"), voice("ja-JP", "Kyoko"), voice("en-US")]);
    expect(picked?.lang).toBe("ja-JP");
    expect(picked?.name).toBe("Kyoko");
  });

  it("matches case-insensitively and on the ja- prefix", () => {
    expect(pickJapaneseVoice([voice("JA-JP", "X")])?.lang).toBe("JA-JP");
    expect(pickJapaneseVoice([voice("ja")])?.lang).toBe("ja");
  });

  it("does not mistake non-ja langs (e.g. jamo/java-ish) for Japanese", () => {
    expect(pickJapaneseVoice([voice("jv-ID"), voice("en-JM")])).toBeNull();
  });

  it("prefers a local ja-JP voice over a remote one", () => {
    const remote = voice("ja-JP", "Cloud", false);
    const local = voice("ja-JP", "Kyoko", true);
    expect(pickJapaneseVoice([remote, local])?.name).toBe("Kyoko");
  });
});
