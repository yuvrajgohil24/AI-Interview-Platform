"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertTriangle, ArrowRight, Home, Zap } from "lucide-react"

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

    if (!data) return <div className="flex justify-center p-20 text-slate-500">Generating DNA Analysis...</div>

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-5xl mx-auto space-y-10">

                {/* Header */}
                <header className="text-center space-y-4 pt-4">
                    <Badge variant="outline" className="px-3 py-1 text-sm border-primary text-primary bg-primary/5 uppercase tracking-wide">Session Complete</Badge>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">Your Interview DNA</h1>
                    <p className="text-slate-500 max-w-2xl mx-auto text-lg">Detailed analysis of your performance, identifying strengths and areas for improvement.</p>
                </header>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="border-t-4 border-t-green-500 shadow-sm">
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Accuracy</CardTitle></CardHeader>
                        <CardContent>
                            <div className="text-4xl font-extrabold text-slate-900 flex items-baseline gap-1">
                                {data.summary.accuracy}<span className="text-xl font-normal text-slate-400">%</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-t-4 border-t-blue-500 shadow-sm">
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Answered Correctly</CardTitle></CardHeader>
                        <CardContent>
                            <div className="text-4xl font-extrabold text-slate-900">{data.summary.correctAnswers}<span className="text-xl text-slate-300">/{data.summary.totalQuestions}</span></div>
                        </CardContent>
                    </Card>
                    <Card className="border-t-4 border-t-orange-500 shadow-sm">
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Skipped</CardTitle></CardHeader>
                        <CardContent>
                            <div className="text-4xl font-extrabold text-slate-900">{data.summary.skippedCount}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-t-4 border-t-purple-500 shadow-sm">
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Performance Score</CardTitle></CardHeader>
                        <CardContent>
                            <div className="text-4xl font-extrabold text-slate-900">{data.summary.correctAnswers * 10}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* AI Insights & Skill Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="md:col-span-2 bg-slate-900 text-white border-0 shadow-xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-32 bg-blue-500/20 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Zap className="h-5 w-5 text-yellow-400" />
                                AI Performance Insights
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 relative z-10">
                            {data.dnaAnalysis.map((insight: string, idx: number) => (
                                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/5">
                                    {idx === 0 ? <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" /> :
                                        idx === 1 ? <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" /> :
                                            <ArrowRight className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />}
                                    <p className="text-slate-100">{insight}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-1 shadow-sm">
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
                                            <div className={`h-full rounded-full ${topic.strength === 'Strong' ? 'bg-green-500' : topic.strength === 'Weak' ? 'bg-red-500' : 'bg-blue-400'}`} style={{ width: `${topic.accuracy}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Detailed Solutions for Wrong Answers */}
                {data.wrongAnswers && data.wrongAnswers.length > 0 && (
                    <Card className="shadow-sm">
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
                )}

                <div className="flex justify-center pb-10">
                    <Button size="lg" className="px-8" onClick={() => router.push('/dashboard')}>
                        <Home className="mr-2 w-4 h-4" /> Back to Dashboard
                    </Button>
                </div>
            </div>
        </div>
    )
}
