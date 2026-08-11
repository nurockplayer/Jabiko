import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { STAY_D_HOME_IMAGE } from "./stayD";
import { STAY_D_PAGE_IMAGES } from "./stayDPage";

describe("Stay.D repository assets (#744)", () => {
  it("ships every configured WebP locally and keeps each file below 200 KiB", () => {
    const sources = [
      STAY_D_HOME_IMAGE.src,
      ...STAY_D_HOME_IMAGE.srcSet
        .split(",")
        .map((candidate) => candidate.trim().split(/\s+/)[0]),
      ...STAY_D_PAGE_IMAGES.map((image) => image.src)
    ];

    for (const src of new Set(sources)) {
      const assetPath = resolve(process.cwd(), "public", src.slice(1));
      expect(existsSync(assetPath), src).toBe(true);
      expect(statSync(assetPath).size, src).toBeLessThan(200 * 1024);
    }
  });
});
