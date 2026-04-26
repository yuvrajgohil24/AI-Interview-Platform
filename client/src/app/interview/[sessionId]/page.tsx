"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Clock, AlertCircle, Zap, CheckCircle2 } from "lucide-react"

export default function InterviewPage({ params }: { params: { sessionId: string } }) {
    const router = useRouter()
    const { sessionId } = params

    const [loading, setLoading] = useState(true)
    const [questionData, setQuestionData] = useState<any>(null)
    const [context, setContext] = useState<any>(null)
    const [selectedOption, setSelectedOption] = useState<string | null>(null)
    const [timeLeft, setTimeLeft] = useState(60)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Lifeline state
    const [showLifeline, setShowLifeline] = useState(false)
    const [lifelineUsed, setLifelineUsed] = useState(false) // from API context

    const timerRef = useRef<NodeJS.Timeout | null>(null)

    const fetchQuestion = useCallback(async () => {
        setLoading(true)
        try {
            const res = await api.get(`/interview/${sessionId}/next`)
            // Check for completion
            if (res.data.completed) {
                await api.post(`/interview/${sessionId}/end`)
                router.push(`/report/${sessionId}`)
                return
            }

            setQuestionData(res.data.question)
            setContext(res.data.context)
            setLifelineUsed(res.data.context?.lifelineUsed || false)
            setShowLifeline(res.data.context?.isFocusedMode && !res.data.context?.lifelineUsed) // Only allow skip context if IN focus mode

            setSelectedOption(null)
            setTimeLeft(60) // Reset timer
        } catch (error) {
            console.error("Failed to fetch next question", error)
        } finally {
            setLoading(false)
        }
    }, [sessionId, router])

    useEffect(() => {
        fetchQuestion()
    }, [fetchQuestion])

    // Timer
    useEffect(() => {
        if (loading || isSubmitting) return;
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    handleSkip() // Auto skip
                    return 0
                }
                return prev - 1
            })
        }, 1000)
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [loading, isSubmitting])

    const handleSubmit = async () => {
        if (!selectedOption) return
        setIsSubmitting(true)
        try {
            await api.post(`/interview/${sessionId}/submit`, {
                questionData,
                selectedOption,
                timeTaken: 60 - timeLeft,
                skipped: false
            })
            await fetchQuestion()
        } catch (error) {
            console.error(error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleSkip = async () => {
        setIsSubmitting(true)
        try {
            await api.post(`/interview/${sessionId}/submit`, {
                questionData,
                selectedOption: null,
                timeTaken: 60 - timeLeft,
                skipped: true
            })
            await fetchQuestion()
        } catch (error) {
            console.error(error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleLifeline = async () => {
        if (!confirm("Use your one-time lifeline to skip this context?")) return
        setIsSubmitting(true)
        try {
            await api.post(`/interview/${sessionId}/lifeline/skip`, {
                questionData
            })
            await fetchQuestion() // Refresh (will get new question)
        } catch (err) {
            alert("Failed to use lifeline")
        } finally {
            setIsSubmitting(false)
        }
    }

    if ((loading && !questionData) || !context) {
        return <div className="flex justify-center items-center h-screen text-lg font-medium text-slate-500 animate-pulse">Initializing Question...</div>
    }

    const progressPercent = context.progress ? (context.progress.current / context.progress.total) * 100 : 0

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Top Bar with Timer and Progress */}
            <div className="w-full bg-white shadow-sm sticky top-0 z-10 p-4">
                <div className="max-w-4xl mx-auto space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <span className="font-bold text-lg text-slate-700">Question {context.progress?.current} / {context.progress?.total}</span>
                            <Badge variant={context?.difficulty <= 2 ? "secondary" : context?.difficulty >= 4 ? "destructive" : "default"}>
                                Difficulty: {context?.difficulty}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2 font-mono font-bold text-xl text-primary bg-primary/10 px-4 py-1 rounded-full">
                            <Clock className="w-5 h-5" />
                            00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
                        </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-500 ease-in-out" style={{ width: `${progressPercent}%` }} />
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center p-4 md:p-8 max-w-4xl mx-auto w-full">
                {/* Context Awareness Banner */}
                {context?.isFocusedMode && (
                    <div className="w-full mb-6 bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-lg shadow-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="font-bold">Focused Practice Mode Active</p>
                            <p className="text-sm opacity-90">We're digging deeper into {context.topic} to help you master it.</p>
                        </div>
                        {showLifeline && (
                            <Button size="sm" variant="destructive" onClick={handleLifeline} className="whitespace-nowrap shrink-0 ml-4 shadow-sm hover:shadow-md transition-all">
                                <Zap className="w-4 h-4 mr-1" /> Use Lifeline
                            </Button>
                        )}
                    </div>
                )}

                {/* Question Card */}
                <Card className="w-full shadow-lg border-0 ring-1 ring-slate-200/60 overflow-hidden flex flex-col min-h-[500px]">
                    <CardHeader className="bg-slate-50/50 border-b pb-8">
                        <h2 className="text-xl md:text-2xl font-medium leading-relaxed text-slate-800">
                            {questionData?.question}
                        </h2>
                        <div className="text-sm text-muted-foreground mt-2">{questionData?.topic} • {questionData?.subTopic}</div>
                    </CardHeader>

                    <CardContent className="flex-1 p-6 space-y-4">
                        <div className="grid grid-cols-1 gap-3">
                            {questionData?.options.map((option: string, idx: number) => {
                                const optionLabel = ["A", "B", "C", "D"][idx];
                                const isSelected = selectedOption === optionLabel;
                                return (
                                    <div
                                        key={idx}
                                        onClick={() => setSelectedOption(optionLabel)}
                                        className={`
                      p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 group relative
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
                                            {isSelected && <CheckCircle2 className="ml-auto w-5 h-5 text-primary" />}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>

                    <CardFooter className="flex justify-between border-t p-6 bg-slate-50/30">
                        <Button variant="ghost" size="lg" className="text-slate-500 hover:text-slate-700" onClick={() => handleSkip()}>
                            Skip Question
                        </Button>
                        <Button size="lg" className="min-w-[150px] text-lg shadow-lg hover:shadow-xl hover:translate-y-[-1px] transition-all" onClick={handleSubmit} disabled={!selectedOption || isSubmitting}>
                            {isSubmitting ? "Submitting..." : "Submit Answer"}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
