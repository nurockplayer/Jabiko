import { describe, expect, it } from "vitest";

// Contract for the #861 learning-loop motion layer. Motion must never change
// geometry (UQC §1.2 / D-07) and must disappear entirely for learners who ask
// for less motion, leaving every state final and complete. Read via node:fs
// (same trick as feedback.test.ts: `?raw` imports are stubbed in tests).
const nodeFsSpecifier = ["node", "fs"].join(":");
const { readFileSync } = (await import(/* @vite-ignore */ nodeFsSpecifier)) as {
  readFileSync: (path: URL, encoding: "utf8") => string;
};
const css = readFileSync(new URL("./learning-loop.css", import.meta.url), "utf8").replace(
  /\/\*[\s\S]*?\*\//g,
  ""
);
const entry = readFileSync(new URL("../styles.css", import.meta.url), "utf8");

type Block = { prelude: string; body: string; parents: string[] };

// Minimal brace-aware walk: every `{ … }` block with its prelude and the
// preludes of the at-rules that enclose it.
function blocks(source: string): Block[] {
  const out: Block[] = [];
  const walk = (text: string, parents: string[]) => {
    let i = 0;
    let start = 0;
    while (i < text.length) {
      if (text[i] === ";") start = i + 1;
      if (text[i] === "{") {
        const prelude = text.slice(start, i).trim();
        let depth = 1;
        let j = i + 1;
        while (j < text.length && depth > 0) {
          if (text[j] === "{") depth += 1;
          if (text[j] === "}") depth -= 1;
          j += 1;
        }
        const body = text.slice(i + 1, j - 1);
        out.push({ prelude, body, parents });
        if (prelude.startsWith("@media") || prelude.startsWith("@supports")) {
          walk(body, [...parents, prelude]);
        }
        i = j;
        start = j;
        continue;
      }
      if (text[i] === "}") start = i + 1;
      i += 1;
    }
  };
  walk(source, []);
  return out;
}

const all = blocks(css);
const declarations = (body: string) =>
  body
    .split(";")
    .map((d) => d.trim())
    .filter((d) => d.includes(":") && !d.includes("{"))
    .map((d) => [d.slice(0, d.indexOf(":")).trim(), d.slice(d.indexOf(":") + 1).trim()] as const);

describe("learning-loop.css motion contract (#861)", () => {
  it("is loaded after the JT-1 shell so it can refine the drill", () => {
    const shell = entry.indexOf('@import "./styles/jt1-shell.css";');
    const loop = entry.indexOf('@import "./styles/learning-loop.css";');
    expect(shell).toBeGreaterThanOrEqual(0);
    expect(loop).toBeGreaterThan(shell);
  });

  it("only animates when the learner has not asked for reduced motion", () => {
    const animated = all.filter(
      (block) =>
        !block.prelude.startsWith("@") &&
        declarations(block.body).some(([property, value]) =>
          (property === "animation" || property === "animation-name") && value !== "none"
        )
    );
    expect(animated.length).toBeGreaterThan(0);
    for (const block of animated) {
      expect(block.parents.some((p) => /prefers-reduced-motion:\s*no-preference/.test(p)), block.prelude).toBe(true);
    }
  });

  it("keyframes move only transform, opacity and stroke drawing — never layout", () => {
    const keyframes = all.filter((block) => block.prelude.startsWith("@keyframes"));
    expect(keyframes.length).toBeGreaterThan(0);
    for (const frames of keyframes) {
      for (const step of blocks(frames.body)) {
        for (const [property] of declarations(step.body)) {
          expect(["transform", "opacity", "stroke-dashoffset"], `${frames.prelude} ${property}`).toContain(property);
        }
      }
    }
  });

  it("turns scroll anchoring off while the drill is shown", () => {
    // When feedback is inserted below the options, Chrome's scroll anchoring
    // would otherwise lock onto a panel or the footer below it and yank the
    // page down by the feedback's height (observed at 390×844 once scrolled).
    const rule = all.find((block) => block.prelude === ":root:has(.drill-panel)");
    expect(rule?.body).toMatch(/overflow-anchor:\s*none/);
  });

  it("cancels the global hover lift on the options and the action row", () => {
    // base.css lifts every hovered button by 1px; under a pointer that made
    // an option or Next hop as the cursor left it to answer.
    const rule = all.find(
      (block) =>
        block.prelude.includes(".drill-panel .choice-option:hover") &&
        block.prelude.includes(".drill-panel .action-row button:hover")
    );
    expect(rule?.body).toMatch(/transform:\s*none/);
  });

  it("never transitions a geometry property", () => {
    const layout = /\b(width|height|top|left|right|bottom|inset|margin|padding|gap|font-size|grid-template)/;
    for (const block of all) {
      for (const [property, value] of declarations(block.body)) {
        if (property === "transition" || property === "transition-property") {
          expect(layout.test(value), `${block.prelude}: ${value}`).toBe(false);
        }
      }
    }
  });
});

// #866 extends the same motion language to Today (ジャビ子's greeting hop) and
// the session (set switcher, verdict labels, the 花丸 stamp). Same contract.
describe.each(["today.css", "session.css"])("%s follows the learning-loop motion contract (#866)", (file) => {
  const source = readFileSync(new URL(`./${file}`, import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  const parsed = blocks(source);

  it("is loaded after the JT-1 shell", () => {
    expect(entry.indexOf(`@import "./styles/${file}";`)).toBeGreaterThan(
      entry.indexOf('@import "./styles/jt1-shell.css";')
    );
  });

  it("only animates when the learner has not asked for reduced motion", () => {
    for (const block of parsed) {
      if (block.prelude.startsWith("@")) continue;
      const animates = declarations(block.body).some(
        ([property, value]) => (property === "animation" || property === "animation-name") && value !== "none"
      );
      if (animates) {
        expect(block.parents.some((p) => /prefers-reduced-motion:\s*no-preference/.test(p)), block.prelude).toBe(true);
      }
    }
  });

  it("keyframes move only transform, opacity and stroke drawing", () => {
    for (const frames of parsed.filter((block) => block.prelude.startsWith("@keyframes"))) {
      for (const step of blocks(frames.body)) {
        for (const [property] of declarations(step.body)) {
          expect(["transform", "opacity", "stroke-dashoffset"], `${frames.prelude} ${property}`).toContain(property);
        }
      }
    }
  });

  it("never transitions a geometry property", () => {
    const layout = /\b(width|height|top|left|right|bottom|inset|margin|padding|gap|font-size|grid-template)/;
    for (const block of parsed) {
      for (const [property, value] of declarations(block.body)) {
        if (property === "transition" || property === "transition-property") {
          expect(layout.test(value), `${block.prelude}: ${value}`).toBe(false);
        }
      }
    }
  });
});
