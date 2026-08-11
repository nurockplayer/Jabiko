import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "src/styles/stay-d.css"), "utf8");

describe("stay-d editorial layout (#748)", () => {
  it("keeps the Home promo single-column with a full-width primary CTA at 320-390px", () => {
    // #748 removes the photo-led two-column card. The editorial block is a
    // stacked column whose actions wrap, so a 320/390 px viewport has no
    // horizontal overflow.
    const promoStart = css.indexOf(".stay-d-promo {");
    expect(promoStart).toBeGreaterThanOrEqual(0);
    const promo = css.slice(promoStart, css.indexOf("}", promoStart));
    expect(promo).toMatch(/flex-direction:\s*column/);

    const narrow = css.indexOf("@media (max-width: 440px) {");
    expect(narrow).toBeGreaterThanOrEqual(0);
    const narrowBlock = css.slice(narrow, css.indexOf("}", css.indexOf("}", narrow) + 1) + 1);
    expect(narrowBlock).toMatch(/\.stay-d-airbnb-primary\b[^}]*width:\s*100%/s);
  });

  it("keeps the video trigger and player contained within the viewport", () => {
    const triggerStart = css.indexOf(".stay-d-video-trigger {");
    expect(triggerStart).toBeGreaterThanOrEqual(0);
    const trigger = css.slice(triggerStart, css.indexOf("}", triggerStart));
    expect(trigger).toMatch(/max-width:\s*100%/);

    const frameStart = css.indexOf(".stay-d-video-frame {");
    expect(frameStart).toBeGreaterThanOrEqual(0);
    const frame = css.slice(frameStart, css.indexOf("}", frameStart));
    expect(frame).toMatch(/width:\s*100%/);
    expect(frame).toMatch(/aspect-ratio:\s*16 \/ 9/);
  });

  it("keeps the /stay-d hero copy and final CTA full-width-safe at narrow widths", () => {
    const heroStart = css.indexOf(".stay-d-hero {");
    expect(heroStart).toBeGreaterThanOrEqual(0);
    const hero = css.slice(heroStart, css.indexOf("}", heroStart));
    expect(hero).toMatch(/flex-direction:\s*column/);
    expect(hero).toMatch(/min-width:\s*0/);

    const finalStart = css.indexOf(".stay-d-final {");
    expect(finalStart).toBeGreaterThanOrEqual(0);
    const final = css.slice(finalStart, css.indexOf("}", finalStart));
    expect(final).toMatch(/flex-wrap:\s*wrap|flex-direction:\s*column/);
  });
});
