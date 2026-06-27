import { describe, expect, it } from "vitest";
import {
  computeReviewStates,
  countUpcoming,
  getDueQuestions,
  SRS_INTERVAL_DAYS,
  SRS_MAX_BOX
} from "./srs";
import type { Attempt, PracticeQuestion, VocabularyItem } from "./types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function makeAttempt(
  questionId: string,
  isCorrect: boolean,
  timestamp: number
): Attempt {
  return {
    questionId,
    vocabularyId: questionId.split(":")[0] ?? questionId,
    targetForm: "te",
    prompt: "",
    expectedAnswers: ["ok"],
    submittedAnswer: isCorrect ? "ok" : "no",
    isCorrect,
    timestamp,
    responseTimeMs: 100
  };
}

function makeQuestion(id: string): PracticeQuestion {
  const vocab: VocabularyItem = {
    id: id.split(":")[0] ?? id,
    surface: id,
    reading: id,
    meaningZh: "test",
    partOfSpeech: "verb",
    group: "godan",
    lesson: null,
    tags: [],
    examples: []
  };
  return {
    id,
    vocabulary: vocab,
    targetForm: "te",
    expectedAnswers: ["ok"],
    explanation: ""
  };
}

describe("computeReviewStates", () => {
  it("returns an empty map when no attempts have been made", () => {
    expect(computeReviewStates([])).toEqual(new Map());
  });

  it("ignores items that have only correct attempts", () => {
    // A question answered correctly first try never enters the review
    // queue. SRS is for things you got WRONG; new-card seeding is the
    // practice modes' job.
    const states = computeReviewStates([
      makeAttempt("q1", true, 1000),
      makeAttempt("q1", true, 2000)
    ]);
    expect(states.size).toBe(0);
  });

  it("seeds a first-wrong item in box 0 with a relearn rest before it's due", () => {
    const states = computeReviewStates([makeAttempt("q1", false, 5000)]);
    const state = states.get("q1");
    expect(state).toBeDefined();
    expect(state!.box).toBe(0);
    expect(state!.lastAttemptAt).toBe(5000);
    // Box 0 rests SRS_INTERVAL_DAYS[0] days (~1 hour) instead of resurfacing
    // immediately -- otherwise the learner just memorises the answer in the
    // same session rather than recalling it.
    expect(state!.dueAt).toBe(5000 + SRS_INTERVAL_DAYS[0] * MS_PER_DAY);
  });

  it("promotes one box per correct attempt up to the cap", () => {
    // wrong -> right -> right -> right ... should hit box 3 then 4 then cap.
    const states = computeReviewStates([
      makeAttempt("q1", false, 1000),
      makeAttempt("q1", true, 2000),
      makeAttempt("q1", true, 3000),
      makeAttempt("q1", true, 4000),
      makeAttempt("q1", true, 5000),
      makeAttempt("q1", true, 6000), // would be box 5 if uncapped
      makeAttempt("q1", true, 7000) // still capped
    ]);
    const state = states.get("q1")!;
    expect(state.box).toBe(SRS_MAX_BOX);
    expect(state.lastAttemptAt).toBe(7000);
    expect(state.dueAt).toBe(7000 + SRS_INTERVAL_DAYS[SRS_MAX_BOX] * MS_PER_DAY);
  });

  it("resets to box 0 on a wrong attempt regardless of prior box", () => {
    const states = computeReviewStates([
      makeAttempt("q1", false, 1000),
      makeAttempt("q1", true, 2000), // box 1
      makeAttempt("q1", true, 3000), // box 2
      makeAttempt("q1", true, 4000), // box 3
      makeAttempt("q1", false, 5000) // RESET
    ]);
    const state = states.get("q1")!;
    expect(state.box).toBe(0);
    expect(state.lastAttemptAt).toBe(5000);
    // Reset goes back to the box-0 relearn rest, not "due now".
    expect(state.dueAt).toBe(5000 + SRS_INTERVAL_DAYS[0] * MS_PER_DAY);
  });

  it("sorts unordered input chronologically before replay", () => {
    // Same outcome as the ordered case above, but feed attempts in
    // reverse to verify the function doesn't trust input order.
    const states = computeReviewStates([
      makeAttempt("q1", true, 3000),
      makeAttempt("q1", false, 1000),
      makeAttempt("q1", true, 2000)
    ]);
    const state = states.get("q1")!;
    expect(state.box).toBe(2);
  });

  it("tracks multiple items independently", () => {
    const states = computeReviewStates([
      makeAttempt("q1", false, 1000),
      makeAttempt("q2", false, 1500),
      makeAttempt("q1", true, 2000)
    ]);
    expect(states.get("q1")!.box).toBe(1);
    expect(states.get("q2")!.box).toBe(0);
  });
});

describe("getDueQuestions", () => {
  const pool = [makeQuestion("q1"), makeQuestion("q2"), makeQuestion("q3")];

  it("returns an empty queue when no attempts have been made", () => {
    expect(getDueQuestions([], pool, 10000)).toEqual([]);
  });

  it("rests a just-missed item until its box-0 interval, then makes it due", () => {
    const attempts = [makeAttempt("q1", false, 5000)];
    const due = 5000 + SRS_INTERVAL_DAYS[0] * MS_PER_DAY;
    // NOT due right after the miss (no same-session answer-cramming) ...
    expect(getDueQuestions(attempts, pool, 5000)).toEqual([]);
    expect(getDueQuestions(attempts, pool, due - 1)).toEqual([]);
    // ... due once the box-0 relearn rest elapses.
    expect(getDueQuestions(attempts, pool, due)).toEqual([pool[0]]);
  });

  it("defers a correctly-answered question past its box-1 interval", () => {
    // wrong at 1500, right at 2300 -> box 1, due at 2300 + box-1 interval.
    const attempts = [
      makeAttempt("q1", false, 1500),
      makeAttempt("q1", true, 2300)
    ];
    const due = 2300 + SRS_INTERVAL_DAYS[1] * MS_PER_DAY;
    expect(getDueQuestions(attempts, pool, due - 1)).toEqual([]);
    expect(getDueQuestions(attempts, pool, due)).toEqual([pool[0]]);
  });

  it("re-includes the question once the interval elapses (overdue)", () => {
    // wrong at 1500, right at 2300 (box 1). Well past the interval -> overdue.
    const attempts = [
      makeAttempt("q1", false, 1500),
      makeAttempt("q1", true, 2300)
    ];
    const now = 2300 + (SRS_INTERVAL_DAYS[1] + 2) * MS_PER_DAY;
    expect(getDueQuestions(attempts, pool, now)).toEqual([pool[0]]);
  });

  it("re-adds a missed-after-promotion item to box 0 (rests, then due)", () => {
    // Promote to box 2, then miss again -> back to box 0's relearn rest.
    const attempts = [
      makeAttempt("q1", false, 1000),
      makeAttempt("q1", true, 2000),
      makeAttempt("q1", true, 3000),
      makeAttempt("q1", false, 4000)
    ];
    expect(getDueQuestions(attempts, pool, 4000)).toEqual([]); // resting
    expect(
      getDueQuestions(attempts, pool, 4000 + SRS_INTERVAL_DAYS[0] * MS_PER_DAY)
    ).toEqual([pool[0]]);
  });

  it("orders due items most-overdue first", () => {
    // q1 missed older, q2 missed more recently. Both box 0; check once both
    // have passed the box-0 rest. q1 is more overdue (smaller dueAt) -> first.
    const attempts = [
      makeAttempt("q1", false, 1000),
      makeAttempt("q2", false, 5000)
    ];
    const now = 5000 + SRS_INTERVAL_DAYS[0] * MS_PER_DAY + 1000;
    const queue = getDueQuestions(attempts, pool, now);
    expect(queue.map((q) => q.id)).toEqual(["q1", "q2"]);
  });

  it("returns at most one entry per question id", () => {
    const attempts = [
      makeAttempt("q1", false, 1000),
      makeAttempt("q1", false, 2000),
      makeAttempt("q1", false, 3000)
    ];
    const now = 3000 + SRS_INTERVAL_DAYS[0] * MS_PER_DAY;
    expect(getDueQuestions(attempts, pool, now)).toEqual([pool[0]]);
  });

  it("excludes items whose pool entry is missing", () => {
    // An attempt for a question id not present in pool should NOT
    // throw; it just doesn't appear in the result.
    const attempts = [makeAttempt("unknown", false, 1000)];
    expect(getDueQuestions(attempts, pool, 5000)).toEqual([]);
  });
});

describe("countUpcoming", () => {
  it("counts items scheduled to become due within the window", () => {
    // q1 -> box 1 (due ~SRS_INTERVAL_DAYS[1] days from 2300)
    // q2 -> box 2 (due ~SRS_INTERVAL_DAYS[2] days from 4000)
    const attempts = [
      makeAttempt("q1", false, 1500),
      makeAttempt("q1", true, 2300),
      makeAttempt("q2", false, 1000),
      makeAttempt("q2", true, 2000),
      makeAttempt("q2", true, 4000)
    ];
    // From t=0, a window just past box-1's interval catches q1 but not q2.
    expect(countUpcoming(attempts, SRS_INTERVAL_DAYS[1] + 1, 0)).toBe(1);
    // A wide window catches both.
    expect(countUpcoming(attempts, SRS_INTERVAL_DAYS[2] + 2, 0)).toBe(2);
  });

  it("excludes items already due (those go to getDueQuestions)", () => {
    const attempts = [makeAttempt("q1", false, 1000)];
    // Pick now AFTER q1's box-0 due time so it's already due -> NOT counted
    // as "upcoming".
    const now = 1000 + SRS_INTERVAL_DAYS[0] * MS_PER_DAY + 1;
    expect(countUpcoming(attempts, 7, now)).toBe(0);
  });
});
