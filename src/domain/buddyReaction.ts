import type { Attempt } from "./types";

// How ジャビ子 reacts to a verdict in the Training loop (#861, D-26). The
// figure itself lives in components/JabikoBuddy; this is the rule for which
// mood, how much energy and which line.

export type BuddyMood = "happy" | "oops" | "thinking" | "cheer";
export type BuddyEnergy = 1 | 2 | 3;

// Correct answers in a row at the end of this session's attempts.
export function trailingCorrect(attempts: readonly Attempt[]): number {
  let streak = 0;
  for (let i = attempts.length - 1; i >= 0 && attempts[i].isCorrect; i -= 1) streak += 1;
  return streak;
}

// A real run of correct answers raises the energy of the reaction: 3 in a row
// adds a spin, 5 in a row a double jump. Never shown as a number.
export function buddyEnergy(streak: number): BuddyEnergy {
  if (streak >= 5) return 3;
  if (streak >= 3) return 2;
  return 1;
}

// The completion cheer follows the set's real accuracy.
export function completionEnergy(isPerfect: boolean, accuracy: number): BuddyEnergy {
  if (isPerfect) return 3;
  return accuracy >= 70 ? 2 : 1;
}

// What ジャビ子 says, in Japanese interjections: these are part of what the
// learner is learning, so they are not localized. Stronger as the real run
// grows; a miss is met with encouragement, never blame.
const LINES: Record<BuddyMood, readonly [string, string, string]> = {
  happy: ["いいね！", "すごい！", "さすが！"],
  oops: ["どんまい！", "どんまい！", "どんまい！"],
  thinking: ["なるほど…", "なるほど…", "なるほど…"],
  cheer: ["がんばったね！", "よくできました！", "かんぺき！"]
};

export function buddyLine(mood: BuddyMood, energy: BuddyEnergy): string {
  return LINES[mood][energy - 1];
}
