import { describe, it, expect } from "vitest";
import { learningBlocks, isLearningBlockComplete } from "./learningBlocks";

const byId = (id: string) => {
  const block = learningBlocks.find((b) => b.id === id);
  if (!block) throw new Error(`no learning block ${id}`);
  return block;
};

describe("isLearningBlockComplete", () => {
  it("a conjugation chapter completes once all its required forms are answered correctly", () => {
    const masu = byId("masu");
    expect(isLearningBlockComplete([], masu)).toBe(false);
    const attempts = (masu.requiredForms ?? []).map((targetForm) => ({ isCorrect: true, targetForm }));
    expect(isLearningBlockComplete(attempts, masu)).toBe(true);
  });

  it("the verb-types reference chapter is always complete (reading material)", () => {
    expect(isLearningBlockComplete([], byId("verb-types"))).toBe(true);
  });

  it("a sentence-pattern chapter completes via a correct pattern-drill attempt", () => {
    const tek = byId("te-kudasai");
    expect(isLearningBlockComplete([], tek)).toBe(false);
    expect(
      isLearningBlockComplete(
        [{ isCorrect: true, targetForm: "te", questionId: "pattern-te-kudasai-001" }],
        tek
      )
    ).toBe(true);
    // a wrong attempt (or one for another pattern) does not complete it
    expect(
      isLearningBlockComplete(
        [{ isCorrect: false, targetForm: "te", questionId: "pattern-te-kudasai-002" }],
        tek
      )
    ).toBe(false);
    expect(
      isLearningBlockComplete(
        [{ isCorrect: true, targetForm: "te", questionId: "pattern-to-omou-001" }],
        tek
      )
    ).toBe(false);
  });

  it("the seven sentence-pattern chapters now count as trackable (drillable) chapters", () => {
    const trackable = learningBlocks.filter(
      (b) => b.group === "basic" && b.completionMode !== "reference"
    );
    // 11 conjugation + 7 sentence-pattern; only verb-types stays reference.
    expect(trackable.length).toBe(18);
    expect(trackable.some((b) => b.id === "te-kudasai")).toBe(true);
    expect(byId("verb-types").completionMode).toBe("reference");
  });
});
