import { describe, it, expect, vi } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { newUser } from './helpers';

// Deterministic AI: option A is always correct, every question is unique
vi.mock('../src/services/ai.service', () => {
  let n = 0;
  class AIService {
    isConfigured = true;
    async generateQuestion(ctx: any) {
      return {
        question: `Question ${n++}?`,
        options: ['one', 'two', 'three', 'four'],
        correctOption: 'A',
        topic: 'Topic',
        subTopic: 'Sub',
        difficulty: ctx.targetDifficulty,
        explanation: 'Because A.'
      };
    }
    async generateOpenQuestion(ctx: any) {
      return {
        type: 'OPEN', question: `Open ${n++}?`, options: [], correctOption: '',
        topic: 'Topic', subTopic: 'Sub', difficulty: ctx.targetDifficulty,
        keyPoints: ['point one', 'point two'], explanation: 'Model answer.'
      };
    }
    async evaluateAnswer(_q: any, answer: string) {
      return { score: answer.length > 20 ? 8 : 2, feedback: 'ok', missedPoints: [] };
    }
  }
  return { AIService };
});

const start = (agent: any, body: any = {}) =>
  agent
    .post('/api/interview/start')
    .send({ domain: 'IT', difficulty: '3', questionCount: 3, duration: 10, ...body });

describe('interview start', () => {
  it('validates input', async () => {
    const { agent } = await newUser();
    expect((await start(agent, { domain: 'Astrology' })).status).toBe(400);
    expect((await start(agent, { questionCount: 500 })).status).toBe(400);
    expect((await start(agent, { difficulty: undefined })).status).toBe(400);
    expect((await start(agent)).status).toBe(200);
  });
});

describe('MCQ flow', () => {
  it('never leaks the answer, grades server-side, and rejects double submits', async () => {
    const { agent } = await newUser();
    const { sessionId } = (await start(agent)).body;

    const next = await agent.get(`/api/interview/${sessionId}/next`);
    expect(next.status).toBe(200);
    expect(JSON.stringify(next.body)).not.toContain('correctOption');
    expect(JSON.stringify(next.body)).not.toContain('Because A');

    // Refresh returns the same pending question
    const again = await agent.get(`/api/interview/${sessionId}/next`);
    expect(again.body.question.question).toBe(next.body.question.question);

    const [a, b] = await Promise.all([
      agent.post(`/api/interview/${sessionId}/submit`).send({ selectedOption: 'A' }),
      agent.post(`/api/interview/${sessionId}/submit`).send({ selectedOption: 'A' })
    ]);
    expect([a.status, b.status].sort()).toEqual([200, 409]);
    expect(await prisma.attempt.count({ where: { sessionId } })).toBe(1);

    const ok = a.status === 200 ? a : b;
    expect(ok.body.isCorrect).toBe(true);
  });

  it('completes the session when the question count is reached', async () => {
    const { agent } = await newUser();
    const { sessionId } = (await start(agent, { questionCount: 1 })).body;
    await agent.get(`/api/interview/${sessionId}/next`);
    await agent.post(`/api/interview/${sessionId}/submit`).send({ selectedOption: 'B' }).expect(200);
    const done = await agent.get(`/api/interview/${sessionId}/next`);
    expect(done.body.completed).toBe(true);
    await agent.post(`/api/interview/${sessionId}/submit`).send({ selectedOption: 'A' }).expect(409);
  });

  it('treats an answer after the per-question limit as skipped', async () => {
    const { agent } = await newUser();
    const { sessionId } = (await start(agent)).body;
    await agent.get(`/api/interview/${sessionId}/next`);
    await prisma.session.update({
      where: { id: sessionId },
      data: { questionServedAt: new Date(Date.now() - 120_000) }
    });
    const res = await agent.post(`/api/interview/${sessionId}/submit`).send({ selectedOption: 'A' });
    expect(res.status).toBe(200);
    expect(res.body.isCorrect).toBe(false);
    const attempt = await prisma.attempt.findFirst({ where: { sessionId } });
    expect(attempt?.skipped).toBe(true);
  });

  it('hides sessions from other users', async () => {
    const owner = await newUser();
    const intruder = await newUser();
    const { sessionId } = (await start(owner.agent)).body;
    await intruder.agent.get(`/api/interview/${sessionId}/next`).expect(404);
    await intruder.agent.get(`/api/interview/${sessionId}/report`).expect(404);
    await intruder.agent.post(`/api/interview/${sessionId}/submit`).send({ selectedOption: 'A' }).expect(404);
  });
});

describe('lifeline', () => {
  it('can be used once and does not count against stats', async () => {
    const { agent } = await newUser();
    const { sessionId } = (await start(agent)).body;
    await agent.get(`/api/interview/${sessionId}/next`);

    const [a, b] = await Promise.all([
      agent.post(`/api/interview/${sessionId}/lifeline/skip`),
      agent.post(`/api/interview/${sessionId}/lifeline/skip`)
    ]);
    expect([a.status, b.status].sort()).toEqual([200, 400]);

    await agent.get(`/api/interview/${sessionId}/next`);
    await agent.post(`/api/interview/${sessionId}/submit`).send({ selectedOption: 'A' }).expect(200);

    const report = await agent.get(`/api/interview/${sessionId}/report`);
    expect(report.body.summary.totalQuestions).toBe(1);
    expect(report.body.summary.accuracy).toBe(100);
  });
});

describe('written-answer mode', () => {
  it('grades with the AI and reports feedback', async () => {
    const { agent } = await newUser();
    const { sessionId } = (await start(agent, { mode: 'OPEN', questionCount: 2 })).body;

    const q = await agent.get(`/api/interview/${sessionId}/next`);
    expect(q.body.question.type).toBe('OPEN');
    expect(q.body.context.questionTimeLeft).toBeGreaterThan(60);
    expect(JSON.stringify(q.body)).not.toContain('point one');

    const good = await agent
      .post(`/api/interview/${sessionId}/submit`)
      .send({ answerText: 'A detailed answer that covers the concepts well.' });
    expect(good.body.isCorrect).toBe(true);
    expect(good.body.score).toBe(8);

    await agent.get(`/api/interview/${sessionId}/next`);
    const weak = await agent.post(`/api/interview/${sessionId}/submit`).send({ answerText: 'idk' });
    expect(weak.body.isCorrect).toBe(false);

    const report = await agent.get(`/api/interview/${sessionId}/report`);
    expect(report.body.wrongAnswers[0]).toMatchObject({ score: 2, feedback: 'ok' });
  });
});

describe('listing', () => {
  it('paginates sessions and validates the query', async () => {
    const { agent } = await newUser();
    for (let i = 0; i < 3; i++) await start(agent);
    const page = await agent.get('/api/interview/sessions?limit=2&page=1');
    expect(page.body).toHaveLength(2);
    expect((await agent.get('/api/interview/sessions?limit=2&page=2')).body).toHaveLength(1);
    await agent.get('/api/interview/sessions?limit=9999').expect(400);
  });
});
