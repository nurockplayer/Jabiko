import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Stay.D repository assets (#748)", () => {
  it("leaves no production Stay.D property image assets in the repo", () => {
    // #748 removes the photo-led presentation: Jabiko no longer ships Stay.D
    // room/exterior/property media. The local WebP directory must not contain
    // property imagery that nothing references.
    const stayDDir = resolve(process.cwd(), "public", "stay-d");
    if (!existsSync(stayDDir)) return;
    expect(readdirSync(stayDDir)).toEqual([]);
  });
});
