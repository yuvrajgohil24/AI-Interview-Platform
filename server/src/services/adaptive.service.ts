import { Attempt } from '@prisma/client';

export class AdaptiveService {
  /**
   * Determine the next difficulty level based on recent performance.
   * Simple logic:
   * - Last correct -> +1 difficulty (max 5)
   * - Last wrong -> Same or -1 (min 1)
   * - Last skip -> -1 heavily (min 1) and flag for focus
   */
  getNextDifficulty(currentDiff: number, lastAttempt: Attempt | null): number {
    if (!lastAttempt) return currentDiff; // Start of session

    if (lastAttempt.skipped) {
      return Math.max(1, currentDiff - 1);
    }

    if (lastAttempt.isCorrect) {
      return Math.min(5, currentDiff + 1);
    } else {
      return Math.max(1, currentDiff - 1);
    }
  }

  /**
   * Check if we should trigger Focused Practice Mode.
   * Logic: 
   * - If last question was skipped -> Focus on that topic.
   * - IF the skip was done using a LIFELINE (indicated by selectedOption === "LIFELINE_SKIP") -> DO NOT focus.
   */
  shouldTriggerFocus(lastAttempt: Attempt | null): string | null {
    if (!lastAttempt) return null;

    // If user used a lifeline to skip the context, we return null to avoid focusing
    if (lastAttempt.selectedOption === "LIFELINE_SKIP") {
      return null;
    }

    if (lastAttempt.skipped) {
      return lastAttempt.topic;
    }
    return null;
  }
}
