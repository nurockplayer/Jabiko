import { describe, expect, it } from "vitest";

const nodeFsSpecifier = ["node", "fs"].join(":");
const { readFileSync } = (await import(/* @vite-ignore */ nodeFsSpecifier)) as {
  readFileSync: (path: URL, encoding: "utf8") => string;
};
const tokens = JSON.parse(readFileSync(new URL("../../docs/design/jabiko/tokens.json", import.meta.url), "utf8")) as {
  color: Record<string, Record<string, { value: string; opacity?: number }>>;
  geometry: Record<string, { value: number }>;
  typography: { families: Record<string, string> };
};
const css = readFileSync(new URL("./jt1-tokens.css", import.meta.url), "utf8");
const lightBlock = css.match(/:root\s*\{([^}]*)\}/)?.[1] ?? "";
const darkBlock = css.match(/:root\[data-theme="dark"\]\s*\{([^}]*)\}/)?.[1] ?? "";

function kebab(value: string): string {
  return value.replaceAll(".", "-").replaceAll(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

describe("JT-1 token layer parity", () => {
  it.each(["light", "dark"] as const)("copies every accepted %s color role", (theme) => {
    for (const [role, token] of Object.entries(tokens.color[theme]!)) {
      const block = theme === "light" ? lightBlock : darkBlock;
      expect(block, `${theme} ${role}`).toContain(`--jt-${kebab(role)}: ${token.value};`);
      if (token.opacity !== undefined) {
        expect(block, `${theme} ${role} opacity`).toContain(`--jt-${kebab(role)}-opacity: ${token.opacity};`);
      }
    }
  });

  it("keeps the shell's typography and geometry tokens exact", () => {
    expect(lightBlock).toContain(`--jt-font-ui: ${tokens.typography.families.ui};`);
    expect(lightBlock).toContain(`--jt-font-cjk: ${tokens.typography.families["cjk.zh-Hant"]};`);
    expect(lightBlock).toContain(`--jt-font-ja: ${tokens.typography.families["cjk.ja"]};`);
    expect(lightBlock).toContain(`--jt-font-ja-mincho: ${tokens.typography.families["ja.mincho"]};`);
    expect(css).toContain(":root:lang(ja) {");
    expect(css).toContain("--jt-font-cjk: var(--jt-font-ja);");
    expect(css).toContain(`--jt-bar-height: ${tokens.geometry["bar.height"]?.value}px;`);
    expect(css).toContain(`--jt-tabbar-height: ${tokens.geometry["tabbar.height"]?.value}px;`);
    expect(css).toContain(`--jt-focus-ring-width: ${tokens.geometry["focus.ring.width"]?.value}px;`);
    expect(css).toContain(`--jt-focus-ring-offset: ${tokens.geometry["focus.ring.offset"]?.value}px;`);
  });
});
