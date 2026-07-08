import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { verifyToken } from '../utils/auth';
import { AIService, QuestionData } from '../services/ai.service';
import { AdaptiveService } from '../services/adaptive.service';

const router = Router();
const aiService = new AIService();
const adaptiveService = new AdaptiveService();

// Middleware to populate user
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ error: "Invalid token" });
  req.userId = decoded.userId;
  next();
};

// Fetch a session only if it belongs to the requesting user (prevents IDOR)
const getOwnedSession = (sessionId: string, userId: string) =>
  prisma.session.findFirst({
    where: { id: sessionId, userId },
    include: { attempts: true }
  });

// Strip the answer and explanation before the question leaves the server
const sanitizeQuestion = (q: QuestionData) => ({
  question: q.question,
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
    const { domain, difficulty, questionCount, duration } = req.body;
    const session = await prisma.session.create({
      data: {
        userId: req.userId,
        domain,
        difficulty: difficulty.toString(),
        targetQuestionCount: questionCount || 15,
        timeLimit: duration || 30,
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
    const sessions = await prisma.session.findMany({
      where: { userId: req.userId },
      include: { attempts: true },
      orderBy: { startTime: 'desc' }
    });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

router.get('/:sessionId/next', authenticate, async (req: any, res) => {
  try {
    const { sessionId } = req.params;

    const session = await getOwnedSession(sessionId, req.userId);
    if (!session) return res.status(404).json({ error: "Session not found" });

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
    let focusTopic = adaptiveService.shouldTriggerFocus(lastAttempt);

    // Reuse the in-flight question if one is pending (e.g. page refresh),
    // otherwise generate a new one and store it server-side.
    let question: QuestionData;
    if (session.currentQuestion) {
      question = JSON.parse(session.currentQuestion);
    } else {
      question = await aiService.generateQuestion({
        domain: session.domain,
        targetDifficulty: nextDiff,
        topicFocus: focusTopic || undefined,
        previousAttempts: session.attempts
      });
      await prisma.session.update({
        where: { id: sessionId },
        data: { currentQuestion: JSON.stringify(question) }
      });
    }

    res.json({
      question: sanitizeQuestion(question),
      context: {
        difficulty: question.difficulty,
        topic: focusTopic ? focusTopic : question.topic,
        isFocusedMode: !!focusTopic,
        progress: { current: session.attempts.length + 1, total: session.targetQuestionCount },
        lifelineUsed: session.lifelineUsed,
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
    const { selectedOption, timeTaken, skipped } = req.body;

    const session = await getOwnedSession(sessionId, req.userId);
    if (!session) return res.status(404).json({ error: "Session not found" });
    if (!session.currentQuestion) return res.status(400).json({ error: "No question pending" });

    // Grade against the server-side copy — the client never sees the answer
    const questionData: QuestionData = JSON.parse(session.currentQuestion);
    const isCorrect = !skipped && selectedOption === questionData.correctOption;

    await prisma.attempt.create({
      data: {
        sessionId,
        topic: questionData.topic,
        subTopic: questionData.subTopic,
        difficulty: questionData.difficulty,
        questionContent: JSON.stringify(questionData),
        selectedOption: selectedOption || null,
        isCorrect,
        skipped: !!skipped,
        timeTaken: typeof timeTaken === 'number' ? timeTaken : 0
      }
    });

    // Clear the pending question so /next generates a fresh one
    await prisma.session.update({
      where: { id: sessionId },
      data: { currentQuestion: null }
    });

    res.json({ success: true, isCorrect, explanation: questionData.explanation });

  } catch (error) {
    res.status(500).json({ error: "Failed to submit answer" });
  }
});

router.post('/:sessionId/lifeline/skip', authenticate, async (req: any, res) => {
  try {
    const { sessionId } = req.params;

    const session = await getOwnedSession(sessionId, req.userId);
    if (!session) return res.status(404).json({ error: "Session not found" });
    if (session.lifelineUsed) return res.status(400).json({ error: "Lifeline already used" });

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
          selectedOption: "LIFELINE_SKIP",
          isCorrect: false,
          skipped: true,
          timeTaken: 0
        }
      });
    }

    await prisma.session.update({
      where: { id: sessionId },
      data: { lifelineUsed: true, currentQuestion: null }
    });

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
      include: { attempts: true },
      orderBy: { startTime: 'desc' }
    });

    const sessionSummaries = sessions.map(s => {
      const total = s.attempts.length;
      const correct = s.attempts.filter(a => a.isCorrect).length;
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
    const activeDays = new Set(sessions.map(s => dayKey(s.startTime)));
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

    const total = session.attempts.length;
    if (total === 0) return res.json({ total: 0 });

    const correct = session.attempts.filter(a => a.isCorrect).length;
    const skipped = session.attempts.filter(a => a.skipped).length;
    const accuracy = total > 0 ? (correct / total) * 100 : 0;

    // Topic breakdown
    const topicStats: Record<string, { total: number, correct: number }> = {};
    const wrongAnswers: any[] = []; // Collect wrong answers for review

    session.attempts.forEach(a => {
      // Parse content to get text/explanation
      const content = JSON.parse(a.questionContent as string);

      if (!topicStats[a.topic]) topicStats[a.topic] = { total: 0, correct: 0 };
      topicStats[a.topic].total++;
      if (a.isCorrect) {
        topicStats[a.topic].correct++;
      } else if (!a.skipped) {
        // Add to wrong answers list (skip skipped ones or include them? User asked for "solutions of each wrong question")
        wrongAnswers.push({
          question: content.question,
          userAnswer: a.selectedOption,
          correctAnswer: content.correctOption,
          explanation: content.explanation,
          topic: a.topic
        });
      }
    });

    const topicPerformance = Object.entries(topicStats).map(([topic, stats]) => ({
      topic,
      accuracy: Math.round((stats.correct / stats.total) * 100),
      strength: (stats.correct / stats.total) > 0.7 ? "Strong" : (stats.correct / stats.total) < 0.4 ? "Weak" : "Average"
    }));

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
        "Your performance in " + (topicPerformance[0]?.topic || "General") + " is " + (topicPerformance[0]?.strength || "Not assessed")
      ]
    });

  } catch (error) {
    res.status(500).json({ error: "Failed to generate report" });
  }
});

export default router;
