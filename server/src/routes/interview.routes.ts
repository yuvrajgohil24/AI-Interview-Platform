import { Router } from 'express';
import { z } from 'zod';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { AIService, QuestionData } from '../services/ai.service';
import { AdaptiveService } from '../services/adaptive.service';

const router = Router();

const MCQ_TIME_LIMIT_SEC = 60;
const OPEN_TIME_LIMIT_SEC = 180; // writing an answer takes longer than picking an option
const questionTimeLimit = (mode: string) => (mode === "OPEN" ? OPEN_TIME_LIMIT_SEC : MCQ_TIME_LIMIT_SEC);
const PASS_SCORE = 6; // OPEN answers graded >= 6/10 count as correct
const TIMEOUT_GRACE_SEC = 5; // network latency allowance before a late answer counts as skipped
const LIFELINE_SKIP = "LIFELINE_SKIP";

const startSchema = z.object({
  domain: z.enum(["IT", "Finance", "Marketing", "HR"]),
  mode: z.enum(["MCQ", "OPEN"]).default("MCQ"),
  difficulty: z.union([z.string(), z.number()])
    .transform(v => String(v))
    .refine(v => ["Easy", "Medium", "Hard", "1", "2", "3", "4", "5"].includes(v), "Invalid difficulty"),
  questionCount: z.coerce.number().int().min(1).max(50).default(15),
  duration: z.coerce.number().int().min(1).max(120).default(30)
});

const submitSchema = z.object({
  selectedOption: z.enum(["A", "B", "C", "D"]).nullish(),
  answerText: z.string().trim().max(2000).optional(),
  skipped: z.boolean().optional()
});

const pageSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

// Attempt columns the dashboard needs — skips the heavy questionContent blob
const attemptSummary = {
  id: true, topic: true, difficulty: true, isCorrect: true,
  skipped: true, selectedOption: true, timeTaken: true, createdAt: true
} as const;

// Question generation hits a paid LLM — cap it per user
const generationLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => req.userId || ipKeyGenerator(req.ip),
  message: { error: "Too many requests, slow down" }
});
const aiService = new AIService();
const adaptiveService = new AdaptiveService();

// Fetch a session only if it belongs to the requesting user (prevents IDOR)
const getOwnedSession = (sessionId: string, userId: string) =>
  prisma.session.findFirst({
    where: { id: sessionId, userId },
    include: { attempts: true }
  });

// Strip the answer and explanation before the question leaves the server
const sanitizeQuestion = (q: QuestionData) => ({
  question: q.question,
  type: q.type || "MCQ",
  options: q.options,
  topic: q.topic,
  subTopic: q.subTopic,
  difficulty: q.difficulty
});

const isTimeExpired = (session: { startTime: Date, timeLimit: number }) =>
  Date.now() - new Date(session.startTime).getTime() > session.timeLimit * 60 * 1000;

const completeSession = (sessionId: string) =>
  prisma.session.update({
    where: { id: sessionId },
    data: { status: "COMPLETED", endTime: new Date(), currentQuestion: null }
  });

router.post('/start', authenticate, async (req: any, res) => {
  try {
    const parsed = startSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
    const { domain, mode, difficulty, questionCount, duration } = parsed.data;

    if (mode === "OPEN" && !aiService.isConfigured) {
      return res.status(503).json({ error: "Open-answer mode needs the AI service, which is not configured" });
    }

    const session = await prisma.session.create({
      data: {
        userId: req.userId,
        domain,
        mode,
        difficulty,
        targetQuestionCount: questionCount,
        timeLimit: duration,
        status: "STARTED"
      }
    });
    res.json({ sessionId: session.id });
  } catch (error) {
    res.status(500).json({ error: "Failed to start session" });
  }
});

router.get('/sessions', authenticate, async (req: any, res) => {
  try {
    const { page, limit } = pageSchema.parse(req.query);
    const sessions = await prisma.session.findMany({
      where: { userId: req.userId },
      include: { attempts: { select: attemptSummary } },
      orderBy: { startTime: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });
    res.json(sessions);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid pagination" });
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

router.get('/:sessionId/next', authenticate, generationLimiter, async (req: any, res) => {
  try {
    const { sessionId } = req.params;

    const session = await getOwnedSession(sessionId, req.userId);
    if (!session) return res.status(404).json({ error: "Session not found" });

    if (session.status === "COMPLETED") return res.json({ completed: true, reason: "ended" });

    // Check question-count and time limits; finalize server-side so abandoned
    // or expired sessions don't linger in STARTED forever.
    if (session.attempts.length >= session.targetQuestionCount) {
      if (session.status !== "COMPLETED") await completeSession(sessionId);
      return res.json({ completed: true, reason: "questions" });
    }
    if (isTimeExpired(session)) {
      if (session.status !== "COMPLETED") await completeSession(sessionId);
      return res.json({ completed: true, reason: "time" });
    }

    const sortedAttempts = session.attempts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const lastAttempt = sortedAttempts[0] || null;

    // Calculate new difficulty and focus
    // Map Easy/Medium/Hard or use numeric value from session
    let initialDiff = 3;
    if (session.difficulty === 'Easy') initialDiff = 1;
    else if (session.difficulty === 'Medium') initialDiff = 3;
    else if (session.difficulty === 'Hard') initialDiff = 5;
    else if (!isNaN(parseInt(session.difficulty))) initialDiff = parseInt(session.difficulty);

    let currentDiff = lastAttempt ? lastAttempt.difficulty : initialDiff;
    const nextDiff = adaptiveService.getNextDifficulty(currentDiff, lastAttempt);

    // Determine if we should trigger focus mode
    // Logic: Trigger focus if last question was skipped, UNLESS lifeline was just used
    let focusTopic = adaptiveService.shouldTriggerFocus(sortedAttempts);

    // Reuse the in-flight question if one is pending (e.g. page refresh),
    // otherwise generate a new one and store it server-side.
    let question: QuestionData;
    let servedAt = session.questionServedAt;
    if (session.currentQuestion) {
      question = JSON.parse(session.currentQuestion);
    } else {
      const generationContext = {
        domain: session.domain,
        targetDifficulty: nextDiff,
        topicFocus: focusTopic || undefined,
        previousAttempts: session.attempts
      };
      try {
        question = session.mode === "OPEN"
          ? await aiService.generateOpenQuestion(generationContext)
          : await aiService.generateQuestion(generationContext);
      } catch (genError) {
        console.error("[ai] open question generation failed:", genError);
        return res.status(503).json({ error: "Couldn't generate a question right now. Please try again." });
      }
      // Only store if nobody else did while we were generating (concurrent /next calls);
      // the loser discards its question and serves the stored one.
      const now = new Date();
      const claimed = await prisma.session.updateMany({
        where: { id: sessionId, currentQuestion: null },
        data: { currentQuestion: JSON.stringify(question), questionServedAt: now }
      });
      if (claimed.count === 1) {
        servedAt = now;
      } else {
        const fresh = await prisma.session.findUnique({ where: { id: sessionId } });
        if (!fresh?.currentQuestion) return res.status(409).json({ error: "Please retry" });
        question = JSON.parse(fresh.currentQuestion);
        servedAt = fresh.questionServedAt;
      }
    }

    const elapsedSec = servedAt ? (Date.now() - servedAt.getTime()) / 1000 : 0;
    const questionTimeLeft = Math.max(0, Math.ceil(questionTimeLimit(session.mode) - elapsedSec));

    res.json({
      question: sanitizeQuestion(question),
      context: {
        difficulty: question.difficulty,
        topic: focusTopic ? focusTopic : question.topic,
        isFocusedMode: !!focusTopic,
        progress: { current: session.attempts.length + 1, total: session.targetQuestionCount },
        lifelineUsed: session.lifelineUsed,
        questionTimeLeft,
        timeLeftMs: Math.max(0, session.timeLimit * 60 * 1000 - (Date.now() - new Date(session.startTime).getTime()))
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate question" });
  }
});

router.post('/:sessionId/submit', authenticate, async (req: any, res) => {
  try {
    const { sessionId } = req.params;
    const parsed = submitSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid answer" });
    const { selectedOption, answerText, skipped: clientSkipped } = parsed.data;

    const session = await getOwnedSession(sessionId, req.userId);
    if (!session) return res.status(404).json({ error: "Session not found" });
    if (session.status === "COMPLETED") return res.status(409).json({ error: "Session already ended" });
    if (!session.currentQuestion) return res.status(400).json({ error: "No question pending" });

    if (session.attempts.length >= session.targetQuestionCount || isTimeExpired(session)) {
      await completeSession(sessionId);
      return res.status(409).json({ error: "Session already ended" });
    }

    // Grade against the server-side copy — the client never sees the answer
    const questionData: QuestionData = JSON.parse(session.currentQuestion);

    // Timing comes from the server clock, not the client
    const elapsedSec = session.questionServedAt
      ? (Date.now() - session.questionServedAt.getTime()) / 1000
      : 0;
    const timeLimit = questionTimeLimit(session.mode);
    const timedOut = elapsedSec > timeLimit + TIMEOUT_GRACE_SEC;
    const isOpen = session.mode === "OPEN";
    const skipped = !!clientSkipped || timedOut || (isOpen ? !answerText : !selectedOption);

    let isCorrect = false;
    let evaluation: { score: number; feedback: string } | null = null;
    if (!skipped && isOpen) {
      // Grade before consuming the question: if the AI call fails the user can retry
      try {
        evaluation = await aiService.evaluateAnswer(questionData, answerText!);
      } catch (evalError) {
        console.error("[ai] answer evaluation failed:", evalError);
        return res.status(503).json({ error: "Couldn't grade your answer right now. Please try again." });
      }
      isCorrect = evaluation.score >= PASS_SCORE;
    } else if (!skipped) {
      isCorrect = selectedOption === questionData.correctOption;
    }

    // Claim the pending question atomically so a double-submit can't record two attempts
    const recorded = await prisma.$transaction(async tx => {
      const claimed = await tx.session.updateMany({
        where: { id: sessionId, currentQuestion: session.currentQuestion },
        data: { currentQuestion: null, questionServedAt: null }
      });
      if (claimed.count !== 1) return false;
      await tx.attempt.create({
        data: {
          sessionId,
          topic: questionData.topic,
          subTopic: questionData.subTopic,
          difficulty: questionData.difficulty,
          questionContent: JSON.stringify(questionData),
          selectedOption: skipped || isOpen ? null : selectedOption,
          answerText: skipped || !isOpen ? null : answerText,
          score: evaluation?.score ?? null,
          feedback: evaluation?.feedback ?? null,
          isCorrect,
          skipped,
          timeTaken: Math.min(timeLimit, Math.round(elapsedSec))
        }
      });
      return true;
    });
    if (!recorded) return res.status(409).json({ error: "Question already answered" });

    res.json({
      success: true,
      isCorrect,
      explanation: questionData.explanation,
      ...(evaluation && { score: evaluation.score, feedback: evaluation.feedback })
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to submit answer" });
  }
});

router.post('/:sessionId/lifeline/skip', authenticate, async (req: any, res) => {
  try {
    const { sessionId } = req.params;

    const session = await getOwnedSession(sessionId, req.userId);
    if (!session) return res.status(404).json({ error: "Session not found" });
    if (session.status === "COMPLETED") return res.status(409).json({ error: "Session already ended" });
    if (session.lifelineUsed) return res.status(400).json({ error: "Lifeline already used" });

    // Claim the lifeline atomically so concurrent requests can't spend it twice
    const claimed = await prisma.session.updateMany({
      where: { id: sessionId, lifelineUsed: false },
      data: { lifelineUsed: true, currentQuestion: null, questionServedAt: null }
    });
    if (claimed.count !== 1) return res.status(400).json({ error: "Lifeline already used" });

    // Record the pending question as a special skip attempt so it enters history
    // without triggering focus mode
    if (session.currentQuestion) {
      const questionData: QuestionData = JSON.parse(session.currentQuestion);
      await prisma.attempt.create({
        data: {
          sessionId,
          topic: questionData.topic,
          subTopic: questionData.subTopic,
          difficulty: questionData.difficulty,
          questionContent: JSON.stringify(questionData),
          selectedOption: LIFELINE_SKIP,
          isCorrect: false,
          skipped: true,
          timeTaken: 0
        }
      });
    }

    res.json({ success: true, message: "Context skipped. Lifeline consumed." });

  } catch (error) {
    res.status(500).json({ error: "Failed to use lifeline" });
  }
});

router.post('/:sessionId/end', authenticate, async (req: any, res) => {
  try {
    const { sessionId } = req.params;

    const session = await prisma.session.findFirst({ where: { id: sessionId, userId: req.userId } });
    if (!session) return res.status(404).json({ error: "Session not found" });

    if (session.status !== "COMPLETED") await completeSession(sessionId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to end session" });
  }
});

// Aggregate stats for the dashboard: totals, average accuracy, daily streak
router.get('/history', authenticate, async (req: any, res) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { userId: req.userId, status: "COMPLETED" },
      include: { attempts: { select: attemptSummary } },
      orderBy: { startTime: 'desc' }
    });

    const sessionSummaries = sessions.map(s => {
      const counted = s.attempts.filter(a => a.selectedOption !== LIFELINE_SKIP);
      const total = counted.length;
      const correct = counted.filter(a => a.isCorrect).length;
      return {
        id: s.id,
        domain: s.domain,
        startTime: s.startTime,
        totalQuestions: total,
        correctAnswers: correct,
        accuracy: total > 0 ? Math.round((correct / total) * 100) : 0
      };
    });

    const graded = sessionSummaries.filter(s => s.totalQuestions > 0);
    const avgAccuracy = graded.length > 0
      ? Math.round(graded.reduce((sum, s) => sum + s.accuracy, 0) / graded.length)
      : null;

    // Streak: consecutive calendar days (ending today or yesterday) with >= 1 completed session
    const dayKey = (d: Date) => {
      const dt = new Date(d);
      return `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;
    };
    const activeDays = new Set(sessions.filter(s => s.attempts.length > 0).map(s => dayKey(s.startTime)));
    let streak = 0;
    const cursor = new Date();
    if (!activeDays.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1); // streak survives until today is missed
    while (activeDays.has(dayKey(cursor))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    res.json({
      totalSessions: sessions.length,
      avgAccuracy,
      streak,
      recentSessions: sessionSummaries.slice(0, 5)
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to load history" });
  }
});

router.get('/:sessionId/report', authenticate, async (req: any, res) => {
  try {
    const { sessionId } = req.params;
    const session = await getOwnedSession(sessionId, req.userId);

    if (!session) return res.status(404).json({ error: "Session not found" });

    // Lifeline skips are a free pass — they shouldn't count against the user's stats
    const attempts = session.attempts.filter(a => a.selectedOption !== LIFELINE_SKIP);
    const total = attempts.length;
    if (total === 0) return res.json({ total: 0 });

    const correct = attempts.filter(a => a.isCorrect).length;
    const skipped = attempts.filter(a => a.skipped).length;
    const accuracy = total > 0 ? (correct / total) * 100 : 0;

    // Topic breakdown
    const topicStats: Record<string, { total: number, correct: number }> = {};
    const wrongAnswers: any[] = []; // Collect wrong answers for review

    attempts.forEach(a => {
      // Parse content to get text/explanation
      let content: any;
      try { content = JSON.parse(a.questionContent as string); } catch { return; }

      if (!topicStats[a.topic]) topicStats[a.topic] = { total: 0, correct: 0 };
      topicStats[a.topic].total++;
      if (a.isCorrect) {
        topicStats[a.topic].correct++;
      } else if (!a.skipped) {
        // Add to wrong answers list (skip skipped ones or include them? User asked for "solutions of each wrong question")
        wrongAnswers.push({
          question: content.question,
          userAnswer: a.answerText ?? a.selectedOption,
          correctAnswer: content.type === "OPEN"
            ? (content.keyPoints || []).join("; ")
            : content.correctOption,
          explanation: content.explanation,
          topic: a.topic,
          ...(content.type === "OPEN" && { score: a.score, feedback: a.feedback })
        });
      }
    });

    const topicPerformance = Object.entries(topicStats).map(([topic, stats]) => ({
      topic,
      accuracy: Math.round((stats.correct / stats.total) * 100),
      strength: (stats.correct / stats.total) > 0.7 ? "Strong" : (stats.correct / stats.total) < 0.4 ? "Weak" : "Average"
    }));

    const ranked = [...topicPerformance].sort((a, b) => b.accuracy - a.accuracy);
    const best = ranked[0];
    const worst = ranked[ranked.length - 1];

    res.json({
      summary: {
        totalQuestions: total,
        correctAnswers: correct,
        skippedCount: skipped,
        accuracy: Math.round(accuracy),
        timeSpent: session.endTime ? (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000 : 0
      },
      topicPerformance,
      wrongAnswers, // Send the details
      // Minimal "DNA" text generation logic for mvp
      dnaAnalysis: [
        accuracy > 80 ? "You have strong fundamental knowledge." : "You should review core concepts.",
        skipped > 2 ? "You tend to avoid difficult questions." : "You attempt most challenges.",
        ...(topicPerformance.length > 1
          ? [
              `Strongest area: ${best.topic} (${best.accuracy}%).`,
              `Needs the most work: ${worst.topic} (${worst.accuracy}%).`
            ]
          : best ? [`Your performance in ${best.topic} is ${best.strength}.`] : [])
      ]
    });

  } catch (error) {
    res.status(500).json({ error: "Failed to generate report" });
  }
});

export default router;
