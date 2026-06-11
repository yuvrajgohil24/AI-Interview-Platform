"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, type Variants } from "framer-motion"
import api from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertTriangle, ArrowRight, Home, Zap, Loader2 } from "lucide-react"

// Animated number that counts up from 0 when mounted
function CountUp({ value, duration = 1.2 }: { value: number, duration?: number }) {
    const [display, setDisplay] = useState(0)

    useEffect(() => {
        let start: number | null = null
        let raf: number
        const step = (t: number) => {
            if (start === null) start = t
            const p = Math.min((t - start) / (duration * 1000), 1)
            // ease-out cubic
            setDisplay(Math.round(value * (1 - Math.pow(1 - p, 3))))
            if (p < 1) raf = requestAnimationFrame(step)
        }
        raf = requestAnimationFrame(step)
        return () => cancelAnimationFrame(raf)
    }, [value, duration])

    return <>{display}</>
}

const sectionVariants: Variants = {
    hidden: { opacity: 0, y: 28 },
    visible: (i: number = 0) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }
    })
}

export default function ReportPage({ params }: { params: { sessionId: string } }) {
    const router = useRouter()
    const [data, setData] = useState<any>(null)

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const res = await api.get(`/interview/${params.sessionId}/report`)
                setData(res.data)
            } catch (error) {
                console.error(error)
            }
        }
        fetchReport()
    }, [params.sessionId])

    if (!data) {
        return (
            <div className="flex flex-col gap-4 justify-center items-center min-h-screen bg-slate-950 text-white">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}>
                    <Loader2 className="w-10 h-10 text-violet-400" />
                </motion.div>
                <motion.p
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                    className="text-lg font-medium text-slate-300"
                >
                    Generating DNA Analysis...
                </motion.p>
            </div>
        )
    }

    const metrics = [
        { label: "Accuracy", value: data.summary.accuracy, suffix: "%", accent: "border-t-green-500" },
        { label: "Answered Correctly", value: data.summary.correctAnswers, suffix: `/${data.summary.totalQuestions}`, accent: "border-t-blue-500" },
        { label: "Skipped", value: data.summary.skippedCount, suffix: "", accent: "border-t-orange-500" },
        { label: "Performance Score", value: data.summary.correctAnswers * 10, suffix: "", accent: "border-t-purple-500" }
    ]

    return (
        <div className="relative min-h-screen bg-slate-50 p-8 overflow-x-hidden">
            {/* Decorative background */}
            <div aria-hidden className="pointer-events-none fixed inset-0 bg-grid-light opacity-50" />
            <div aria-hidden className="pointer-events-none fixed -top-40 -right-40 h-96 w-96 rounded-full bg-violet-200/40 blur-3xl" />
            <div aria-hidden className="pointer-events-none fixed -bottom-40 -left-40 h-96 w-96 rounded-full bg-indigo-200/40 blur-3xl" />

            <div className="relative max-w-5xl mx-auto space-y-10">

                {/* Header */}
                <motion.header
                    variants={sectionVariants}
                    initial="hidden"
                    animate="visible"
                    custom={0}
                    className="text-center space-y-4 pt-4"
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                        className="inline-block"
                    >
                        <Badge variant="outline" className="px-3 py-1 text-sm border-primary text-primary bg-primary/5 uppercase tracking-wide">Session Complete</Badge>
                    </motion.div>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
                        Your Interview{" "}
                        <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">DNA</span>
                    </h1>
                    <p className="text-slate-500 max-w-2xl mx-auto text-lg">Detailed analysis of your performance, identifying strengths and areas for improvement.</p>
                </motion.header>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {metrics.map((m, i) => (
                        <motion.div
                            key={m.label}
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                            whileHover={{ y: -4 }}
                        >
                            <Card className={`border-t-4 ${m.accent} shadow-sm bg-white/90 backdrop-blur h-full hover:shadow-md transition-shadow`}>
                                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{m.label}</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="text-4xl font-extrabold text-slate-900 flex items-baseline gap-1">
                                        <CountUp value={m.value} />
                                        {m.suffix && <span className="text-xl font-normal text-slate-400">{m.suffix}</span>}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* AI Insights & Skill Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <motion.div variants={sectionVariants} initial="hidden" animate="visible" custom={3} className="md:col-span-2">
                        <Card className="bg-slate-900 text-white border-0 shadow-xl overflow-hidden relative h-full">
                            <motion.div
                                aria-hidden
                                className="absolute top-0 right-0 p-32 bg-blue-500/20 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                            />
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Zap className="h-5 w-5 text-yellow-400" />
                                    AI Performance Insights
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 relative z-10">
                                {data.dnaAnalysis.map((insight: string, idx: number) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.5, delay: 0.6 + idx * 0.15 }}
                                        className="flex items-start gap-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/5"
                                    >
                                        {idx === 0 ? <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" /> :
                                            idx === 1 ? <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" /> :
                                                <ArrowRight className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />}
                                        <p className="text-slate-100">{insight}</p>
                                    </motion.div>
                                ))}
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div variants={sectionVariants} initial="hidden" animate="visible" custom={4} className="md:col-span-1">
                        <Card className="shadow-sm bg-white/90 backdrop-blur h-full">
                            <CardHeader>
                                <CardTitle>Skill Matrix</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {data.topicPerformance.map((topic: any, idx: number) => (
                                        <div key={idx} className="space-y-1">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="font-medium">{topic.topic}</span>
                                                <span className={`font-bold ${topic.strength === 'Strong' ? 'text-green-600' : topic.strength === 'Weak' ? 'text-red-500' : 'text-slate-600'}`}>
                                                    {topic.accuracy}%
                                                </span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <motion.div
                                                    className={`h-full rounded-full ${topic.strength === 'Strong' ? 'bg-green-500' : topic.strength === 'Weak' ? 'bg-red-500' : 'bg-blue-400'}`}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${topic.accuracy}%` }}
                                                    transition={{ duration: 1, delay: 0.8 + idx * 0.12, ease: [0.22, 1, 0.36, 1] }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Detailed Solutions for Wrong Answers */}
                {data.wrongAnswers && data.wrongAnswers.length > 0 && (
                    <motion.div variants={sectionVariants} initial="hidden" animate="visible" custom={5}>
                        <Card className="shadow-sm bg-white/90 backdrop-blur">
                            <CardHeader>
                                <CardTitle>Review & Solutions</CardTitle>
                                <CardDescription>Analyze your mistakes to improve for next time.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Accordion type="single" collapsible className="w-full">
                                    {data.wrongAnswers.map((item: any, idx: number) => (
                                        <AccordionItem key={idx} value={`item-${idx}`}>
                                            <AccordionTrigger className="hover:no-underline px-2">
                                                <div className="flex items-start text-left gap-3">
                                                    <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                                    <span className="text-slate-800 font-medium">{item.question}</span>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="px-4 pb-4 pt-2 text-slate-600 space-y-3 bg-slate-50/50 rounded-b-lg">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                                    <div className="p-3 bg-red-50 border border-red-100 rounded-md">
                                                        <p className="text-xs font-bold text-red-800 uppercase mb-1">Your Answer</p>
                                                        <p className="text-slate-800">{item.userAnswer || "Skipped / None"}</p>
                                                    </div>
                                                    <div className="p-3 bg-green-50 border border-green-100 rounded-md">
                                                        <p className="text-xs font-bold text-green-800 uppercase mb-1">Correct Answer</p>
                                                        <p className="text-slate-800">{item.correctAnswer}</p>
                                                    </div>
                                                </div>
                                                <div className="p-4 bg-blue-50 border border-blue-100 rounded-md mt-2">
                                                    <div className="flex items-center gap-2 mb-2 text-blue-800 font-bold text-sm">
                                                        <Zap className="w-4 h-4" /> AI Explanation
                                                    </div>
                                                    <p className="text-slate-700 leading-relaxed">{item.explanation}</p>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                <motion.div
                    variants={sectionVariants}
                    initial="hidden"
                    animate="visible"
                    custom={6}
                    className="flex justify-center pb-10"
                >
                    <Button size="lg" className="px-8 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all hover:scale-105 active:scale-95" onClick={() => router.push('/dashboard')}>
                        <Home className="mr-2 w-4 h-4" /> Back to Dashboard
                    </Button>
                </motion.div>
            </div>
        </div>
    )
}
