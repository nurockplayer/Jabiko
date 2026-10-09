import { describe, expect, it } from "vitest";

const nodeFsSpecifier = ["node", "fs"].join(":");
const { readFileSync } = (await import(/* @vite-ignore */ nodeFsSpecifier)) as {
  readFileSync: (path: URL, encoding: "utf8") => string;
};
const compatibility = readFileSync(new URL("./jt1-compat.css", import.meta.url), "utf8");
const challenge = readFileSync(new URL("./challenge.css", import.meta.url), "utf8");
const focus = readFileSync(new URL("./focus.css", import.meta.url), "utf8");
const kanji = readFileSync(new URL("./kanji.css", import.meta.url), "utf8");
const mock = readFileSync(new URL("./mock.css", import.meta.url), "utf8");
const grammar = readFileSync(new URL("./grammar.css", import.meta.url), "utf8");
const conversation = readFileSync(new URL("./conversation.css", import.meta.url), "utf8");
const learning = readFileSync(new URL("./learning.css", import.meta.url), "utf8");
const layout = readFileSync(new URL("./layout.css", import.meta.url), "utf8");

describe("JT-1 legacy compatibility contrast recipes", () => {
  it("uses a primary action pair for legacy selected fills in both themes", () => {
    expect(challenge).toMatch(/\.segmented button\.selected\s*\{[^}]*background:\s*var\(--jt-action-primary-background\)[^}]*color:\s*var\(--jt-action-primary-foreground\)/s);
    expect(challenge).toMatch(/\.tts-rate-custom\.selected input\s*\{[^}]*background:\s*var\(--jt-action-primary-background\)[^}]*color:\s*var\(--jt-action-primary-foreground\)/s);
    expect(focus).toMatch(/\.focus-break-primary\s*\{[^}]*background:\s*var\(--jt-action-primary-background\)[^}]*color:\s*var\(--jt-action-primary-foreground\)/s);
    expect(grammar).toMatch(/\.gi-filter-btn\.active\s*\{[^}]*background:\s*var\(--jt-action-primary-background\)[^}]*color:\s*var\(--jt-action-primary-foreground\)/s);
    expect(grammar).toMatch(/\.gp-level\s*\{[^}]*background:\s*var\(--jt-action-primary-background\)[^}]*color:\s*var\(--jt-action-primary-foreground\)/s);
    expect(grammar).toMatch(/\.gi-level-badge\s*\{[^}]*background:\s*var\(--jt-action-primary-background\)[^}]*color:\s*var\(--jt-action-primary-foreground\)/s);
    expect(grammar).toMatch(/\.gi-level-enter\s*\{[^}]*background:\s*var\(--jt-action-primary-background\)[^}]*color:\s*var\(--jt-action-primary-foreground\)/s);
    expect(conversation).toMatch(/\.conversation-primary\s*\{[^}]*background:\s*var\(--jt-action-primary-background\)[^}]*color:\s*var\(--jt-action-primary-foreground\)/s);
    expect(learning).toMatch(/\.inline-drill-button\s*\{[^}]*background:\s*var\(--jt-action-primary-background\)[^}]*color:\s*var\(--jt-action-primary-foreground\)/s);
    expect(layout).toMatch(/\.update-toast-button\s*\{[^}]*background:\s*var\(--jt-action-primary-background\)[^}]*color:\s*var\(--jt-action-primary-foreground\)/s);
  });

  it("keeps legacy accent ink readable over content and selected fills on grammar and mock surfaces", () => {
    expect(compatibility).toMatch(/--matcha-dark:\s*var\(--jt-accent-foreground\)/);
    expect(compatibility).toMatch(/--selected-text:\s*var\(--jt-inverse-foreground\)/);
    expect(grammar).toMatch(/background:\s*var\(--jt-action-primary-background\)/);
    expect(mock).toMatch(/\.mock-section-head \.eyebrow\s*\{[^}]*color:\s*var\(--matcha-dark\)/s);
    expect(kanji).toMatch(/\.kanji-card-onyomi\s*\{[^}]*color:\s*var\(--matcha-dark\)/s);
    expect(challenge).toMatch(/\.mode-card-count\s*\{[^}]*color:\s*var\(--matcha-dark\)/s);
  });
});
