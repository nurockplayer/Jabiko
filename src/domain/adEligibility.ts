/**
 * A completed timer alone is not substantive publisher content. The Focus
 * Break placement is eligible only when this cycle contains actual learning
 * activity measured by Jabiko's existing attempt delta.
 */
export function isFocusBreakAdEligible(summary: { answered: number }): boolean {
  return summary.answered > 0;
}
