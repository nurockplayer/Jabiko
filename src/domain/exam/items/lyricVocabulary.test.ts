import { describe, expect, it } from "vitest";
import type { PracticeQuestion } from "../../types";
import { n1Items } from "./n1";
import { n2Items } from "./n2";
import { n3Items } from "./n3";

const expectedItems = new Map([
  ["n1-syn-toritsukurou", "取り繕う"],
  ["n2-syn-kokorogaodoru", "心が躍る"],
  ["n1-vocab-kakikesu", "掻き消す"],
  ["n2-vocab-tsutsumikomu", "包み込む"],
  ["n2-syn-senakawoosu", "背中を押す"],
  ["n1-syn-yuiitsumuni", "唯一無二"],
  ["n1-syn-nekomoshakushimo", "猫も杓子も"],
  ["n1-syn-shoumenkitte", "正面切って"],
  ["n2-syn-tairin", "大輪"],
  ["n3-vocab-kazaritsukeru", "飾り付ける"]
]);

const allItems: PracticeQuestion[] = [...n1Items, ...n2Items, ...n3Items];

describe("lyric-inspired vocabulary batch", () => {
  it("adds one original exam item for every selected vocabulary point", () => {
    const itemsById = new Map(allItems.map((item) => [item.id, item]));

    for (const [id, surface] of expectedItems) {
      expect(itemsById.get(id)?.vocabulary.surface).toBe(surface);
    }
  });

  it("keeps every new item to one answer among four distinct choices", () => {
    const itemsById = new Map(allItems.map((item) => [item.id, item]));

    for (const id of expectedItems.keys()) {
      const item = itemsById.get(id);
      expect(item).toBeDefined();
      expect(item?.options).toHaveLength(4);
      expect(new Set(item?.options)).toHaveLength(4);
      expect(item?.expectedAnswers).toHaveLength(1);
      expect(item?.options).toContain(item?.expectedAnswers[0]);
    }
  });
});
