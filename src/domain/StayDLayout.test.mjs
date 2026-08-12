import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "src/styles/stay-d.css"), "utf8");

// Find a rule whose selector starts exactly at the beginning of a line, so a
// composite selector like ".stay-d-home .stay-d-video-trigger" never shadows
// the standalone ".stay-d-video-trigger" rule.
function rule(name) {
  const start = css.indexOf(`\n${name} {`);
  expect(start, name).toBeGreaterThanOrEqual(0);
  return css.slice(start + 1, css.indexOf("}", start));
}

function narrowBlock() {
  const start = css.indexOf("@media (max-width: 440px) {");
  expect(start).toBeGreaterThanOrEqual(0);
  // Match the balanced @media { ... } block by counting braces.
  let depth = 0;
  for (let i = start; i < css.length; i += 1) {
    if (css[i] === "{") depth += 1;
    if (css[i] === "}") {
      depth -= 1;
      if (depth === 0) return css.slice(start, i + 1);
    }
  }
  throw new Error("unterminated @media block");
}

describe("stay-d editorial layout (#750)", () => {
  it("turns the Home recommendation into a quiet editorial footer section", () => {
    const home = rule(".stay-d-home");
    // Page-adjacent background instead of a tinted ad panel.
    expect(home).toMatch(/background:\s*(transparent|var\(--app-bg\))/);
    // No large card border / shadow / radius on the Home block.
    expect(home).not.toMatch(/border:\s*1px solid/);
    expect(home).not.toMatch(/box-shadow/);
    expect(home).not.toMatch(/border-radius/);
    // Quiet separation: a single top rule (like the home footer).
    expect(home).toMatch(/border-top:\s*1px solid/);
    expect(home).toMatch(/padding-top:\s*1\.3rem/);
    // The copy column stays readable instead of spanning the full width.
    const copy = rule(".stay-d-home-copy");
    expect(copy).toMatch(/max-width:\s*(40|42|44)rem/);
  });

  it("shrinks the Home headline to editorial size", () => {
    const headline = rule(".stay-d-home-headline");
    // Must be smaller than the #749 promo headline clamp
    // (1.15rem / 2.2vw / 1.45rem) so the footer reads lightweight (#750).
    expect(headline).toMatch(/font-size:\s*clamp\(1\.1rem,\s*2\.1vw,\s*1\.35rem\)/);
    // Sanity: still a headline, not body-size text.
    const lower = headline.match(/clamp\(([0-9.]+)rem/);
    expect(Number(lower?.[1])).toBeGreaterThanOrEqual(1);
  });

  it("keeps the Home actions lightweight (no heavy filled conversion buttons)", () => {
    const actions = rule(".stay-d-home-actions");
    expect(actions).toMatch(/flex-wrap:\s*wrap/);
    // CodeRabbit P2: with the video expanded the actions row is tall, so the
    // Airbnb link must stay pinned to the top (flex-start), not jump to the
    // vertical center of the whole video block.
    expect(actions).toMatch(/align-items:\s*flex-start/);

    const primary = rule(".stay-d-home-airbnb");
    // Text/outline link, not a filled vermilion block.
    expect(primary).not.toMatch(/background:\s*var\(--vermilion\)/);
    expect(primary).not.toMatch(/background:\s*var\(--gold\)/);
    expect(primary).toMatch(/font-size:\s*0\.9rem/);

    // CodeRabbit P2: when the video is expanded the wrapper must keep the
    // shared grow (flex: 1 1 24rem / min-width: min(100%, 20rem)) so the
    // player gets the full remaining row width. No Home override should
    // shrink the shared .stay-d-video wrapper.
    expect(css.indexOf("\n.stay-d-home .stay-d-video {")).toBe(-1);
    const baseVideo = rule(".stay-d-video");
    expect(baseVideo).toMatch(/flex:\s*1 1 24rem/);
    expect(baseVideo).toMatch(/min-width:\s*min\(100%,\s*20rem\)/);

    const trigger = rule(".stay-d-home .stay-d-video-trigger");
    expect(trigger).toMatch(/color:\s*var\(--teal-dark\)/);
    expect(trigger).toMatch(/font-weight:\s*7\d0/);
    expect(trigger).toMatch(/text-align:\s*left/);
    // CodeRabbit P2: the Home video action must drop the global <button>
    // frame (border/radius) so it reads as a borderless text action,
    // consistent with the adjacent Airbnb text link.
    expect(trigger).toMatch(/border:\s*none/);
    // Radius must be reset to 0, not carry an actual pill radius.
    expect(trigger).toMatch(/border-radius:\s*0/);
    expect(trigger).not.toMatch(/border-radius:\s*(?!0\b)\S/);

    // CodeRabbit P2: on hover the global button:hover:not(:disabled) shadow
    // + lift would reappear -- the Home hover rule must reset both.
    const hoverStart = css.indexOf("\n.stay-d-home .stay-d-video-trigger:hover");
    expect(hoverStart).toBeGreaterThanOrEqual(0);
    const hoverBlock = css.slice(hoverStart, css.indexOf("}", hoverStart));
    expect(hoverBlock).toMatch(/box-shadow:\s*none/);
    expect(hoverBlock).toMatch(/transform:\s*none/);
  });

  it("keeps the Home promo single-column and full-width actions at 320-390px", () => {
    const home = rule(".stay-d-home");
    expect(home).toMatch(/flex-direction:\s*column/);

    const narrow = narrowBlock();
    // Only horizontal padding is cleared at narrow widths; the divider's
    // top padding must stay so the kicker keeps its separation gap.
    expect(narrow).toMatch(/\.stay-d-home\b[^}]*padding-inline:\s*0/s);
    expect(narrow).not.toMatch(/\.stay-d-home\b[^}]*padding:\s*0[^;]*;/s);
    expect(narrow).toMatch(/\.stay-d-home-actions\b[^}]*flex-direction:\s*column/s);
    // The Home primary + video actions go full width in the narrow media block.
    expect(narrow).toMatch(/\.stay-d-home-airbnb,[\s\S]*?width:\s*100%/);
  });

  it("keeps the video trigger and player contained within the viewport", () => {
    const trigger = rule(".stay-d-video-trigger");
    expect(trigger).toMatch(/max-width:\s*100%/);

    const frame = rule(".stay-d-video-frame");
    expect(frame).toMatch(/width:\s*100%/);
    expect(frame).toMatch(/aspect-ratio:\s*16 \/ 9/);
  });

  it("keeps the /stay-d hero copy and final CTA full-width-safe at narrow widths", () => {
    const hero = rule(".stay-d-hero");
    expect(hero).toMatch(/flex-direction:\s*column/);
    expect(hero).toMatch(/min-width:\s*0/);

    const final = rule(".stay-d-final");
    expect(final).toMatch(/flex-wrap:\s*wrap|flex-direction:\s*column/);
  });
});
