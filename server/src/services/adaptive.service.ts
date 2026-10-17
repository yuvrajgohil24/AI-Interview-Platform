import { Attempt } from '@prisma/client';

const LIFELINE_SKIP = "LIFELINE_SKIP";

export class AdaptiveService {
  /**
   * Determine the next difficulty level based on recent performance.
   * - Last correct -> +1 difficulty (max 5)
   * - Last wrong or skipped -> -1 (min 1)
   * - Lifeline skip -> unchanged (it's a free pass, not a signal about ability)
   */
  getNextDifficulty(currentDiff: number, lastAttempt: Attempt | null): number {
    if (!lastAttempt) return currentDiff; // Start of session
    if (lastAttempt.selectedOption === LIFELINE_SKIP) return currentDiff;

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
   * Check if we should trigger Focused Practice Mode on a topic.
   * `attempts` must be sorted newest-first.
   * - Last question skipped (not via lifeline) -> focus on that topic.
   * - Last two real attempts both wrong in the same topic -> focus on that topic.
   * - A lifeline skip never triggers focus.
   */
  shouldTriggerFocus(attempts: Attempt[]): string | null {
    const last = attempts[0];
    if (!last || last.selectedOption === LIFELINE_SKIP) return null;

    if (last.skipped) return last.topic;

    const previous = attempts.slice(1).find(a => a.selectedOption !== LIFELINE_SKIP);
    if (!last.isCorrect && previous && !previous.isCorrect && previous.topic === last.topic) {
      return last.topic;
    }
    return null;
  }
}
