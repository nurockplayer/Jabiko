import { describe, expect, it } from "vitest";

const nodeFsSpecifier = ["node", "fs"].join(":");
const { readFileSync } = (await import(/* @vite-ignore */ nodeFsSpecifier)) as {
  readFileSync: (path: URL, encoding: "utf8") => string;
};
const css = readFileSync(new URL("./jt1-shell.css", import.meta.url), "utf8");
const challengeCss = readFileSync(new URL("./challenge.css", import.meta.url), "utf8");

describe("JT-1 shell contracts", () => {
  it("keeps the header and five-entry compact bar within the accepted geometry", () => {
    expect(css).toMatch(/\.app-heading\s*\{[^}]*height:\s*var\(--jt-bar-height\)/s);
    expect(css).toMatch(/\.jt1-primary-nav\s*\{[^}]*height:\s*auto[^}]*min-height:\s*calc\(var\(--jt-tabbar-height\)\s*\+\s*env\(safe-area-inset-bottom\)\)/s);
    expect(css).toMatch(/\.jt1-primary-nav\s*\{[^}]*height:\s*var\(--jt-bar-height\)/s);
    expect(css).toMatch(/\.app-heading\s*\{[^}]*display:\s*grid[^}]*grid-template-columns:[^}]*minmax\(0,\s*1fr\)[^}]*height:\s*var\(--jt-bar-height\)/s);
    expect(css).not.toMatch(/\.jt1-primary-nav\s*\{[^}]*position:\s*sticky/s);
    expect(css).toMatch(/@media\s*\(min-width:\s*1024px\)/);
    expect(css).toMatch(/min-width:\s*0/);
  });

  it("keeps the compact bar as five columns and anchors the header menu inside the viewport", () => {
    expect(css).toMatch(/\.app-shell \.jt1-primary-nav\s*\{[^}]*display:\s*grid[^}]*grid-template-columns:\s*repeat\(5,\s*minmax\(0,\s*1fr\)\)/s);
    expect(css).toMatch(/\.app-shell \.jt1-header-menu \.nav-more-panel\s*\{[^}]*left:\s*auto[^}]*right:\s*0/s);
  });

  it("keeps PWA update notices above compact navigation and clears the session nav gap", () => {
    expect(css).toMatch(/\.app-shell\s*\{[^}]*padding-bottom:\s*var\(--jt-compact-nav-occupied, calc\(var\(--jt-tabbar-height\) \+ env\(safe-area-inset-bottom\)\)\)/s);
    expect(css).toMatch(/\.app-shell \.update-toast\s*\{[^}]*bottom:\s*calc\(var\(--jt-compact-nav-occupied, calc\(var\(--jt-tabbar-height\) \+ env\(safe-area-inset-bottom\)\)\) \+ 1rem\)/s);
    expect(css).toMatch(/\.jt1-primary-nav \.nav-resources-compact \.nav-more-panel\s*\{[^}]*bottom:\s*calc\(var\(--jt-compact-nav-occupied/s);
    expect(css).toMatch(/\.jt1-primary-nav\s*\{[^}]*height:\s*auto[^}]*min-height:\s*calc\(var\(--jt-tabbar-height\)/s);
    expect(css).toMatch(/\.app-shell\[data-session-route="true"\][^{]*\{[^}]*padding-bottom:\s*1\.5rem/s);
    expect(css).toMatch(/:has\(\.conversation-panel\[data-session-surface="true"\]\)[^{]*\{[^}]*padding-bottom:\s*1\.5rem/s);
  });

  it("uses the accepted accent, focus, disabled, and current-page states", () => {
    expect(css).toMatch(/\[aria-current="page"\][^{]*\{[^}]*border-bottom:\s*2px/s);
    expect(css).toMatch(/:focus-visible\s*\{[^}]*outline:\s*var\(--jt-focus-ring-width\)[^}]*offset:\s*var\(--jt-focus-ring-offset\)/s);
    expect(css).toMatch(/:disabled\s*\{[^}]*cursor:\s*not-allowed/s);
  });

  it("suppresses bottom navigation on challenge and active conversation sessions while retaining its menu", () => {
    expect(css).toContain('.app-shell[data-session-route="true"]');
    expect(css).toContain('.app-shell:has(.conversation-panel[data-session-surface="true"])');
    expect(css).toContain(".jt1-header-menu");
    expect(css).toMatch(/\.jt1-primary-nav\s*\{[^}]*position:\s*fixed/s);
  });

  it("uses the D25 quiet toolbar colors and 2px spacing", () => {
    expect(css).toMatch(/\.app-shell \.jt1-header-tools\s*\{[^}]*gap:\s*2px/s);
    expect(css).toMatch(/\.app-shell \.jt1-header-tools button\s*\{[^}]*color:\s*var\(--jt-text-secondary\)/s);
    expect(css).toMatch(/\.app-shell \.jt1-header-tools button:hover:not\(:disabled\),\s*\.app-shell \.jt1-header-menu > \.nav-more-trigger:hover:not\(:disabled\)\s*\{[^}]*background:\s*var\(--jt-action-tonal-background\)[^}]*border-color:\s*transparent[^}]*color:\s*var\(--jt-text-primary\)/s);
    expect(css).toMatch(/\.app-shell \.jt1-header-tools button:active:not\(:disabled\),\s*\.app-shell \.jt1-header-menu > \.nav-more-trigger:active:not\(:disabled\)\s*\{[^}]*background:\s*var\(--jt-action-tonal-hover\)[^}]*border-color:\s*transparent/s);
  });

  it("keeps resting chrome quiet and uses the accepted compact label and icon sizes", () => {
    expect(css).toMatch(/\.jt1-header-tools \.focus-toggle/);
    expect(css).toMatch(/\.jt1-header-tools \.furigana-toggle\s*\{[^}]*background:\s*transparent[^}]*border-color:\s*transparent/s);
    expect(css).toMatch(/\.jt1-header-tools \.furigana-toggle\.active\s*\{[^}]*background:\s*var\(--jt-accent-background\)/s);
    expect(css).toMatch(/\.jt1-primary-nav > a svg\s*\{[^}]*height:\s*20px[^}]*width:\s*20px/s);
    expect(css).toMatch(/\.jt1-primary-nav > a,\s*\.jt1-primary-nav \.nav-resources-compact\s*\{[^}]*font-size:\s*0\.75rem[^}]*line-height:\s*1rem/s);
  });

  it("keeps a selected Resources trigger on an accessible tonal surface", () => {
    expect(css).toMatch(/\.app-shell \.jt1-primary-nav \.nav-more-trigger\.selected\s*\{[^}]*background:\s*var\(--jt-surface-chrome\)[^}]*border-bottom-color:\s*var\(--jt-accent-foreground\)[^}]*color:\s*var\(--jt-accent-foreground\)/s);
    expect(css).toMatch(/\.app-shell \.jt1-primary-nav \.nav-more-trigger\.selected:hover:not\(:disabled\)\s*\{[^}]*background:\s*var\(--jt-action-tonal-hover\)[^}]*color:\s*var\(--jt-accent-foreground\)/s);
    expect(css).toMatch(/\.app-shell \.jt1-primary-nav \.nav-more-trigger\.selected:active:not\(:disabled\)\s*\{[^}]*background:\s*var\(--jt-action-tonal-pressed\)[^}]*color:\s*var\(--jt-accent-foreground\)/s);
  });

  it("gives the session exit a solid accepted keyboard focus ring", () => {
    const focusRule = challengeCss.match(/\.drill-panel \.session-exit:focus-visible\s*\{([^}]*)\}/s);
    expect(focusRule).not.toBeNull();
    const declarations = focusRule?.[1] ?? "";
    expect(declarations).toMatch(/outline:\s*var\(--jt-focus-ring-width\) solid var\(--jt-focus-ring\)/);
    expect(declarations).toMatch(/outline-offset:\s*var\(--jt-focus-ring-offset\)/);
    expect(declarations).toMatch(/box-shadow:\s*none/);
  });

  it("keeps the fixed compact navigation opaque and separated from scrolled content", () => {
    expect(css).toMatch(/\.app-shell \.jt1-primary-nav\s*\{[^}]*background:\s*var\(--jt-surface-chrome\)[^}]*border-top:\s*1px solid var\(--jt-border-subtle\)/s);
    expect(css).toMatch(/\.jt1-primary-nav\s*\{[^}]*position:\s*fixed/s);
  });

  it("preserves the enabled furigana on-state during hover and press", () => {
    const activeHover = css.match(
      /\.app-shell \.jt1-header-tools \.furigana-toggle\.active:hover:not\(:disabled\),\s*\.app-shell \.jt1-header-tools \.furigana-toggle\.active:active:not\(:disabled\)\s*\{([^}]*)\}/s
    );
    expect(activeHover).not.toBeNull();
    const activeHoverDeclarations = activeHover?.[1] ?? "";
    expect(activeHoverDeclarations).toMatch(/background:\s*var\(--jt-accent-background\)/);
    expect(activeHoverDeclarations).toMatch(/border-color:\s*var\(--jt-selection-edge\)/);
    expect(activeHoverDeclarations).toMatch(/color:\s*var\(--jt-accent-foreground\)/);
  });
});
