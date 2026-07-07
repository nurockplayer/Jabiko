import { useState } from "react";
import { copy, type Language } from "../../i18n";
import { TTS_RATE_MAX, TTS_RATE_MIN, TTS_RATE_PRESETS } from "../../lib/ttsRate";

// The 語速 (speech-rate) control for the challenge settings sidebar (#527).
// Same shape as SessionLengthPicker: a segmented row of presets plus a 自訂
// number field for a manual rate. Pure presentation over the rate state +
// handler owned by the parent (via useTtsRate). Affects every 讀出來 button
// because SpeakButton reads the stored rate on click.
export function TtsRatePicker({
  language,
  rate,
  onChange
}: {
  language: Language;
  rate: number;
  onChange: (rate: number) => void;
}) {
  const t = copy[language];

  // A rate that isn't one of the presets is a manual choice -- surface it in
  // the 自訂 field so it stays visible/editable and no preset button lights up.
  const isCustom = !TTS_RATE_PRESETS.some((preset) => preset.rate === rate);

  // The custom field keeps its own draft string so a user can type intermediate
  // values ("0", "0.", "0.8") that aren't yet a committable rate -- important
  // because the point of #527 is slowing DOWN, i.e. entering rates below 1 that
  // start with "0". We only lift a value up when it parses in range; a preset
  // click clears the draft. (value bound to `rate` + a `> 0` guard would revert
  // the leading "0" and make sub-1 rates untypable.)
  const [draft, setDraft] = useState(isCustom ? String(rate) : "");

  const pickPreset = (presetRate: number) => {
    setDraft("");
    onChange(presetRate);
  };

  const handleCustomInput = (raw: string) => {
    setDraft(raw);
    // Only lift a value up when it's genuinely in range, so the field's text
    // and the effective rate never disagree (an out-of-range number would be
    // clamped by the parent yet still shown verbatim here). Out-of-range /
    // half-typed drafts are left uncommitted until they parse in range.
    const next = Number(raw);
    if (raw.trim() !== "" && next >= TTS_RATE_MIN && next <= TTS_RATE_MAX) onChange(next);
  };

  const reconcileDraft = () => {
    // On blur, drop an empty / out-of-range draft back to the effective rate so
    // the field never lingers showing a speed that isn't actually in use.
    setDraft(isCustom ? String(rate) : "");
  };

  return (
    <fieldset className="tts-rate-picker">
      <legend>{t.ttsRate}</legend>
      <div className="segmented tts-rate-segmented">
        {TTS_RATE_PRESETS.map((preset) => {
          const active = rate === preset.rate;
          return (
            <button
              key={preset.id}
              type="button"
              className={active ? "selected" : ""}
              aria-pressed={active}
              onClick={() => pickPreset(preset.rate)}
            >
              {t.ttsRatePresets[preset.id]}
            </button>
          );
        })}
      </div>
      <label className={`tts-rate-custom${isCustom ? " selected" : ""}`}>
        <span>{t.ttsRateCustom}</span>
        <input
          type="number"
          min={TTS_RATE_MIN}
          max={TTS_RATE_MAX}
          step={0.05}
          inputMode="decimal"
          aria-label={t.ttsRateCustom}
          placeholder={String(TTS_RATE_PRESETS[0].rate)}
          value={draft}
          onChange={(event) => handleCustomInput(event.target.value)}
          onBlur={reconcileDraft}
        />
      </label>
    </fieldset>
  );
}
