import { describe, it, expect } from 'vitest';
import { AIService } from '../src/services/ai.service';

describe('AIService without an API key', () => {
  const ai = new AIService();
  const ctx = (previous: any[] = []) => ({ domain: 'HR', targetDifficulty: 4, previousAttempts: previous });

  it('reports itself as unconfigured and refuses open-answer work', async () => {
    expect(ai.isConfigured).toBe(false);
    await expect(ai.generateOpenQuestion(ctx())).rejects.toThrow();
  });

  it('falls back to the bank, applies the target difficulty, and avoids repeats', async () => {
    const seen: string[] = [];
    for (let i = 0; i < 9; i++) {
      const previous = seen.map(text => ({ questionContent: JSON.stringify({ question: text }) }));
      const q = await ai.generateQuestion(ctx(previous));
      expect(q.difficulty).toBe(4);
      expect(seen).not.toContain(q.question);
      seen.push(q.question);
    }
  });
});
