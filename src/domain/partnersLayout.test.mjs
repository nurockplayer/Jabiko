import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "src/styles/partners.css"), "utf8");

// Find a rule whose selector starts exactly at the beginning of a line, so a
// composite selector like ".partner-card .stay-d-video-trigger" never shadows
// the standalone ".stay-d-video-trigger" rule.
function rule(name) {
  const start = css.indexOf(`\n${name} {`);
  expect(start, name).toBeGreaterThanOrEqual(0);
  return css.slice(start + 1, css.indexOf("}", start));
}

function narrowBlock() {
  const start = css.indexOf("@media (max-width: 440px) {");
  expect(start).toBeGreaterThanOrEqual(0);
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

describe("partners page layout", () => {
  it("keeps the page a narrow list column, not a landing-page width", () => {
    const page = rule(".partners-page");
    expect(page).toContain("width: min(100%, 720px)");
    expect(page).toContain("flex-direction: column");
  });

  it("keeps the heading at list-page size", () => {
    const heading = rule(".partners-head h1");
    // Upper bound well under the old hero clamp (1.8rem/4.5vw/3rem).
    expect(heading).toMatch(/font-size: clamp\([^)]*1\.8rem\)/);
  });

  it("keeps a partner card close to body size instead of hero size", () => {
    const name = rule(".partner-name");
    // Upper bound at ~1rem: the headline is a sentence, not a page title.
    expect(name).toMatch(/font-size: clamp\([^)]*1\.05rem\)/);
    expect(rule(".partner-body")).toContain("font-size: 0.9rem");
  });

  it("renders partners as an unbulleted card list", () => {
    const list = rule(".partners-list");
    expect(list).toContain("list-style: none");
    expect(list).toContain("display: grid");

    const card = rule(".partner-card");
    expect(card).toContain("border: 1px solid var(--panel-border)");
    expect(card).toContain("min-width: 0");
  });

  it("separates the author's contact block from the partner cards with a rule", () => {
    const contact = rule(".partners-contact");
    expect(contact).toContain("border-top: 1px solid var(--rule)");
    expect(contact).toContain("padding-top");
  });

  it("keeps every tappable target at least 2.75rem tall", () => {
    for (const selector of [".partner-link", ".partners-contact-mail", ".stay-d-video-airbnb"]) {
      expect(rule(selector), selector).toContain("min-height: 2.75rem");
    }
  });

  it("goes full width on narrow screens", () => {
    const narrow = narrowBlock();
    for (const selector of [".partner-link", ".stay-d-video", ".stay-d-video-trigger"]) {
      expect(narrow, selector).toContain(selector);
    }
    expect(narrow).toContain("width: 100%");
  });

  it("carries no leftover rules from the removed Home teaser or landing page", () => {
    for (const dead of [
      ".stay-d-home",
      ".stay-d-page",
      ".stay-d-hero",
      ".stay-d-final",
      ".stay-d-airbnb-primary",
      ".stay-d-section"
    ]) {
      expect(css, dead).not.toContain(`${dead} {`);
    }
  });
});
