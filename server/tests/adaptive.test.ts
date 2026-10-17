import { describe, it, expect } from 'vitest';
import { AdaptiveService } from '../src/services/adaptive.service';

const svc = new AdaptiveService();

const attempt = (over: Record<string, any> = {}): any => ({
  id: 'a', sessionId: 's', topic: 'DBMS', subTopic: null, questionContent: '{}',
  difficulty: 3, selectedOption: 'A', isCorrect: true, skipped: false, timeTaken: 10,
  createdAt: new Date(), ...over
});

describe('getNextDifficulty', () => {
  it('keeps the starting difficulty with no history', () => {
    expect(svc.getNextDifficulty(3, null)).toBe(3);
  });
  it('raises difficulty after a correct answer, capped at 5', () => {
    expect(svc.getNextDifficulty(3, attempt())).toBe(4);
    expect(svc.getNextDifficulty(5, attempt())).toBe(5);
  });
  it('lowers difficulty after a wrong answer or skip, floored at 1', () => {
    expect(svc.getNextDifficulty(3, attempt({ isCorrect: false }))).toBe(2);
    expect(svc.getNextDifficulty(3, attempt({ isCorrect: false, skipped: true, selectedOption: null }))).toBe(2);
    expect(svc.getNextDifficulty(1, attempt({ isCorrect: false }))).toBe(1);
  });
  it('leaves difficulty unchanged after a lifeline skip', () => {
    expect(svc.getNextDifficulty(4, attempt({ isCorrect: false, skipped: true, selectedOption: 'LIFELINE_SKIP' }))).toBe(4);
  });
});

describe('shouldTriggerFocus', () => {
  it('does nothing without history or after a correct answer', () => {
    expect(svc.shouldTriggerFocus([])).toBeNull();
    expect(svc.shouldTriggerFocus([attempt()])).toBeNull();
  });
  it('focuses on the topic of a skipped question', () => {
    expect(svc.shouldTriggerFocus([attempt({ skipped: true, isCorrect: false, selectedOption: null })])).toBe('DBMS');
  });
  it('never focuses after a lifeline skip', () => {
    expect(svc.shouldTriggerFocus([attempt({ skipped: true, isCorrect: false, selectedOption: 'LIFELINE_SKIP' })])).toBeNull();
  });
  it('focuses after two wrong answers in the same topic only', () => {
    const wrong = (topic: string) => attempt({ isCorrect: false, topic });
    expect(svc.shouldTriggerFocus([wrong('DBMS'), wrong('DBMS')])).toBe('DBMS');
    expect(svc.shouldTriggerFocus([wrong('DBMS'), wrong('OS')])).toBeNull();
    expect(svc.shouldTriggerFocus([wrong('DBMS'), attempt()])).toBeNull();
  });
});
