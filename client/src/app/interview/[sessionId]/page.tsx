"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, AlertCircle, Zap, CheckCircle2, Loader2 } from "lucide-react"

export default function InterviewPage() {
    const router = useRouter()
    const { sessionId } = useParams<{ sessionId: string }>()

    const [loading, setLoading] = useState(true)
    const [questionData, setQuestionData] = useState<any>(null)
    const [context, setContext] = useState<any>(null)
    const [selectedOption, setSelectedOption] = useState<string | null>(null)
    const [answerText, setAnswerText] = useState("")
    const [timeLeft, setTimeLeft] = useState(60)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Lifeline state — available once per session, any time (skipping with it never triggers focus mode)
    const [lifelineUsed, setLifelineUsed] = useState(false) // from API context

    const [error, setError] = useState<string | null>(null)

    const loadQuestion = useCallback(async () => {
        try {
            const res = await api.get(`/interview/${sessionId}/next`)
            // Check for completion (question count reached or session time expired)
            if (res.data.completed) {
                router.push(`/report/${sessionId}`)
                return
            }

            setQuestionData(res.data.question)
            setContext(res.data.context)
            setLifelineUsed(res.data.context?.lifelineUsed || false)

            setSelectedOption(null)
            setAnswerText("")
            // The server owns the clock, so a refresh can't reset the question timer
            setTimeLeft(res.data.context?.questionTimeLeft ?? 60)
        } catch (err: any) {
            console.error("Failed to fetch next question", err)
            if (err?.response?.status === 404) router.push("/dashboard")
            else setError(err?.response?.data?.error || "Couldn't load your next question.")
        } finally {
            setLoading(false)
        }
    }, [sessionId, router])

    // For event handlers: show the loading state, then load
    const fetchQuestion = useCallback(() => {
        setLoading(true)
        setError(null)
        return loadQuestion()
    }, [loadQuestion])

    useEffect(() => {
        // Initial data fetch; state is only set after the request resolves
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadQuestion()
    }, [loadQuestion])

    // 409 means the session ended (time/count) or the answer was already recorded — move on
    const handleSubmitError = async (err: any) => {
        if (err?.response?.status === 409) {
            await fetchQuestion()
        } else {
            console.error(err)
            setError(err?.response?.data?.error || "Couldn't submit your answer. Please try again.")
        }
    }

    const isOpen = questionData?.type === "OPEN"
    const canSubmit = isOpen ? answerText.trim().length > 0 : !!selectedOption

    const handleSubmit = async () => {
        if (!canSubmit || isSubmitting) return
        setIsSubmitting(true)
        try {
            await api.post(`/interview/${sessionId}/submit`, isOpen
                ? { answerText: answerText.trim(), skipped: false }
                : { selectedOption, skipped: false })
            await fetchQuestion()
        } catch (err) {
            await handleSubmitError(err)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleSkip = async () => {
        if (isSubmitting) return
        setIsSubmitting(true)
        try {
            await api.post(`/interview/${sessionId}/submit`, {
                selectedOption: null,
                skipped: true
            })
            await fetchQuestion()
        } catch (err) {
            await handleSubmitError(err)
        } finally {
            setIsSubmitting(false)
        }
    }

    // Timer — one tick per second; the auto-skip runs as an effect, not inside a state updater
    useEffect(() => {
        if (loading || isSubmitting) return
        if (timeLeft <= 0) {
            // Auto skip when time runs out (deferred so the effect itself doesn't set state)
            const expire = setTimeout(() => handleSkip(), 0)
            return () => clearTimeout(expire)
        }
        const tick = setTimeout(() => setTimeLeft(prev => prev - 1), 1000)
        return () => clearTimeout(tick)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeLeft, loading, isSubmitting])

    const handleLifeline = async () => {
        if (!confirm("Use your one-time lifeline to skip this question without triggering Focus Mode?")) return
        setIsSubmitting(true)
        try {
            await api.post(`/interview/${sessionId}/lifeline/skip`)
            await fetchQuestion() // Refresh (will get new question)
        } catch (err: any) {
            setError(err?.response?.data?.error || "Failed to use lifeline")
        } finally {
            setIsSubmitting(false)
        }
    }

    // Fatal load error with nothing on screen: offer a retry instead of spinning forever
    if (error && !questionData) {
        return (
            <div className="flex flex-col gap-4 justify-center items-center h-screen bg-slate-950 text-white p-6 text-center">
                <AlertCircle className="w-10 h-10 text-red-400" />
                <p className="text-lg font-medium text-slate-200" role="alert">{error}</p>
                <div className="flex gap-3">
                    <Button onClick={fetchQuestion}>Try again</Button>
                    <Button variant="outline" className="text-slate-900" onClick={() => router.push("/dashboard")}>Back to dashboard</Button>
                </div>
            </div>
        )
    }

    if ((loading && !questionData) || !context) {
        return (
            <div className="flex flex-col gap-4 justify-center items-center h-screen bg-slate-950 text-white">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                >
                    <Loader2 className="w-10 h-10 text-violet-400" />
                </motion.div>
                <motion.p
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                    className="text-lg font-medium text-slate-300"
                >
                    Calibrating your next question...
                </motion.p>
            </div>
        )
    }

    const progressPercent = context.progress ? (context.progress.current / context.progress.total) * 100 : 0
    const timerUrgent = timeLeft <= 10

    return (
        <div className="relative min-h-screen bg-slate-50 flex flex-col overflow-x-hidden">
            {/* Decorative background */}
            <div aria-hidden className="pointer-events-none fixed inset-0 bg-grid-light opacity-50" />
            <div aria-hidden className="pointer-events-none fixed -top-40 -left-40 h-96 w-96 rounded-full bg-violet-200/40 blur-3xl" />
            <div aria-hidden className="pointer-events-none fixed -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-200/40 blur-3xl" />

            {/* Top Bar with Timer and Progress */}
            <motion.div
                initial={{ y: -64, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full bg-white/85 backdrop-blur-xl shadow-sm sticky top-0 z-20 p-4"
            >
                <div className="max-w-4xl mx-auto space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <AnimatePresence mode="popLayout">
                                <motion.span
                                    key={context.progress?.current}
                                    initial={{ y: -12, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: 12, opacity: 0 }}
                                    className="font-bold text-lg text-slate-700"
                                >
                                    Question {context.progress?.current} / {context.progress?.total}
                                </motion.span>
                            </AnimatePresence>
                            <Badge variant={context?.difficulty <= 2 ? "secondary" : context?.difficulty >= 4 ? "destructive" : "default"}>
                                Difficulty: {context?.difficulty}
                            </Badge>
                        </div>
                        <motion.div
                            animate={timerUrgent ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                            transition={timerUrgent ? { duration: 1, repeat: Infinity } : {}}
                            className={`flex items-center gap-2 font-mono font-bold text-xl px-4 py-1 rounded-full transition-colors ${
                                timerUrgent ? "text-red-600 bg-red-100" : "text-primary bg-primary/10"
                            }`}
                        >
                            <Clock className="w-5 h-5" />
                            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
                        </motion.div>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-violet-500 to-indigo-600 rounded-full"
                            initial={false}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        />
                    </div>
                </div>
            </motion.div>

            <div className="relative flex-1 flex flex-col items-center p-4 md:p-8 max-w-4xl mx-auto w-full">
                {error && (
                    <div role="alert" className="w-full mb-6 bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg flex items-center justify-between gap-3">
                        <span className="text-sm font-medium">{error}</span>
                        <Button size="sm" variant="outline" onClick={fetchQuestion}>Reload question</Button>
                    </div>
                )}

                {/* Context Awareness Banner */}
                <AnimatePresence>
                    {context?.isFocusedMode && (
                        <motion.div
                            initial={{ opacity: 0, y: -16, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: "auto" }}
                            exit={{ opacity: 0, y: -16, height: 0 }}
                            transition={{ duration: 0.4 }}
                            className="w-full mb-6 bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-lg shadow-sm flex items-start gap-3"
                        >
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="font-bold">Focused Practice Mode Active</p>
                                <p className="text-sm opacity-90">We&apos;re digging deeper into {context.topic} to help you master it.</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Question Card — animated transition between questions */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={context.progress?.current ?? questionData?.question}
                        initial={{ opacity: 0, x: 60 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -60 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="w-full"
                    >
                        <Card className="w-full shadow-lg border-0 ring-1 ring-slate-200/60 overflow-hidden flex flex-col min-h-[500px] bg-white/95 backdrop-blur">
                            <CardHeader className="bg-slate-50/50 border-b pb-8">
                                <h2 className="text-xl md:text-2xl font-medium leading-relaxed text-slate-800">
                                    {questionData?.question}
                                </h2>
                                <div className="text-sm text-muted-foreground mt-2">{questionData?.topic} • {questionData?.subTopic}</div>
                            </CardHeader>

                            <CardContent className="flex-1 p-6 space-y-4">
                                {isOpen && (
                                    <div className="space-y-2">
                                        <label htmlFor="answer" className="text-sm font-semibold text-slate-600">Your answer</label>
                                        <textarea
                                            id="answer"
                                            value={answerText}
                                            onChange={(e) => setAnswerText(e.target.value)}
                                            maxLength={2000}
                                            rows={9}
                                            disabled={isSubmitting}
                                            placeholder="Explain your answer in your own words. Cover the key concepts, trade-offs, and an example if you can."
                                            className="w-full rounded-xl border-2 border-slate-100 bg-white p-4 text-base text-slate-800 focus:border-primary focus:outline-none"
                                        />
                                        <p className="text-xs text-slate-400 text-right">{answerText.length} / 2000</p>
                                    </div>
                                )}
                                <div className={isOpen ? "hidden" : "grid grid-cols-1 gap-3"} role="radiogroup" aria-label="Answer options">
                                    {questionData?.options.map((option: string, idx: number) => {
                                        const optionLabel = ["A", "B", "C", "D"][idx];
                                        const isSelected = selectedOption === optionLabel;
                                        return (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, y: 16 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.35, delay: 0.1 + idx * 0.07 }}
                                                whileHover={{ scale: 1.01 }}
                                                whileTap={{ scale: 0.99 }}
                                                role="radio"
                                                aria-checked={isSelected}
                                                tabIndex={0}
                                                onClick={() => setSelectedOption(optionLabel)}
                                                onKeyDown={(e) => {
                                                    if (e.key === " " || e.key === "Enter") {
                                                        e.preventDefault()
                                                        setSelectedOption(optionLabel)
                                                    }
                                                }}
                                                className={`
                          p-5 rounded-xl border-2 cursor-pointer transition-colors duration-200 group relative
                          ${isSelected
                                                        ? 'border-primary bg-primary/5 shadow-md'
                                                        : 'border-slate-100 bg-white hover:border-primary/30 hover:bg-slate-50'}
                        `}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`
                                 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors
                                 ${isSelected ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-primary/20 group-hover:text-primary'}
                             `}>
                                                        {optionLabel}
                                                    </div>
                                                    <span className={`text-base ${isSelected ? 'font-medium text-slate-900' : 'text-slate-700'}`}>{option}</span>
                                                    {isSelected && (
                                                        <motion.span
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            transition={{ type: "spring", stiffness: 400, damping: 18 }}
                                                            className="ml-auto"
                                                        >
                                                            <CheckCircle2 className="w-5 h-5 text-primary" />
                                                        </motion.span>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )
                                    })}
                                </div>
                            </CardContent>

                            <CardFooter className="flex justify-between border-t p-6 bg-slate-50/30">
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="lg" className="text-slate-500 hover:text-slate-700" disabled={isSubmitting} onClick={() => handleSkip()}>
                                        Skip Question
                                    </Button>
                                    {!lifelineUsed && (
                                        <Button
                                            variant="outline"
                                            size="lg"
                                            onClick={handleLifeline}
                                            disabled={isSubmitting}
                                            className="border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800 transition-all"
                                            title="One-time skip that won't trigger Focus Mode"
                                        >
                                            <Zap className="w-4 h-4 mr-1 fill-amber-500 text-amber-500" /> Lifeline
                                        </Button>
                                    )}
                                </div>
                                <Button size="lg" className="min-w-[150px] text-lg shadow-lg hover:shadow-xl hover:translate-y-[-1px] transition-all bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500" onClick={handleSubmit} disabled={!canSubmit || isSubmitting}>
                                    {isSubmitting ? (isOpen ? "Grading..." : "Submitting...") : "Submit Answer"}
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )
}
