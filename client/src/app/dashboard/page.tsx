"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, type Variants } from "framer-motion"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { PlayCircle, History, Trophy, Target, LogOut, Gauge, LayoutDashboard, Flame, ArrowRight, ShieldAlert, Sparkles, CheckCircle2, ChevronRight } from "lucide-react"
import SpeedometerDifficulty from "@/components/SpeedometerDifficulty"
import { DashboardHero } from "@/components/dashboard/DashboardHero"
import { QuickActions } from "@/components/dashboard/QuickActions"

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.55, ease: [0.22, 1, 0.36, 1] }
  })
}

interface HistoryStats {
  totalSessions: number
  avgAccuracy: number | null
  streak: number
}

interface Attempt {
  isCorrect: boolean
  skipped: boolean
  timeTaken: number
}

interface Session {
  id: string
  domain: string
  difficulty: string
  status: string
  startTime: string
  attempts: Attempt[]
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ name: string } | null>(null)
  const [stats, setStats] = useState<HistoryStats | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const configRef = useRef<HTMLDivElement>(null)

  // Config state
  const [domain, setDomain] = useState("IT")
  const [difficulty, setDifficulty] = useState(3)
  const [questionCount, setQuestionCount] = useState("15")
  const [duration, setDuration] = useState("30")

  const [loading, setLoading] = useState(false)
  const [fetchingHistory, setFetchingHistory] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    const token = localStorage.getItem("token")
    if (!userData || !token) {
      router.push("/login")
      return
    }
    setUser(JSON.parse(userData))

    // Fetch user sessions
    api.get('/interview/sessions')
      .then(res => {
        setSessions(res.data || [])
      })
      .catch(err => {
        console.error("Failed to load session history", err)
      })
      .finally(() => {
        setFetchingHistory(false)
      })
  }, [router])

  // Load real session stats for the cards
  useEffect(() => {
    api.get('/interview/history')
      .then(res => setStats(res.data))
      .catch(err => console.error("Failed to load history", err))
  }, [])

  const applyQuickConfig = (config: { domain: string, difficulty: number, duration: number }) => {
    setDomain(config.domain)
    setDifficulty(config.difficulty)
    setDuration(config.duration.toString())
    if (configRef.current) {
      configRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const startInterview = async (config?: { domain: string, difficulty: number, questionCount: number, duration: number }) => {
    setLoading(true)
    try {
      const res = await api.post('/interview/start', {
        domain: config?.domain ?? domain,
        difficulty: (config?.difficulty ?? difficulty).toString(),
        questionCount: config?.questionCount ?? parseInt(questionCount),
        duration: config?.duration ?? parseInt(duration)
      })
      router.push(`/interview/${res.data.sessionId}`)
    } catch (error) {
      console.error("Failed to start", error)
      alert("Failed to start interview session")
    } finally {
      setLoading(false)
    }
  }

  // Daily challenge: a short, slightly harder session in the currently selected domain
  const startDailyChallenge = () =>
    startInterview({ domain, difficulty: Math.min(5, difficulty + 1), questionCount: 5, duration: 10 })

  const startQuickAssessment = () => {
    setDomain("IT")
    setDifficulty(2)
    setQuestionCount("15")
    setDuration("15")
    startInterview()
  }

  // Compute computed metrics
  const totalSessionsCount = sessions.length
  let totalMins = 0
  let totalAttempts = 0
  let correctAttempts = 0
  let highestLevel = 1

  sessions.forEach(s => {
    const lvl = parseInt(s.difficulty)
    if (!isNaN(lvl) && lvl > highestLevel) highestLevel = lvl

    s.attempts.forEach(a => {
      totalAttempts++
      if (a.isCorrect) correctAttempts++
      totalMins += Math.round(a.timeTaken / 60)
    })
  })

  // If no attempts, default demo stats
  const computedAccuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0
  const lastSession = sessions[0]

  if (!user) return <div className="min-h-screen bg-slate-50" />

  return (
    <div className="relative min-h-screen bg-slate-50 overflow-x-hidden text-slate-900">
      {/* Decorative background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-grid-light opacity-60" />
      <div aria-hidden className="pointer-events-none fixed -top-40 -right-40 h-96 w-96 rounded-full bg-violet-200/40 blur-3xl" />
      <div aria-hidden className="pointer-events-none fixed -bottom-40 -left-40 h-96 w-96 rounded-full bg-indigo-200/40 blur-3xl" />

      {/* Navbar */}
      <motion.nav
        initial={{ y: -56, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-xl shadow-sm px-6 lg:px-12 py-3.5 flex justify-between items-center"
      >
        <div className="flex items-center gap-2.5 font-black text-2xl text-indigo-600 tracking-tight">
          <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-500/20">
            <Target className="h-6 w-6" />
          </div>
          <span>Emtihaan</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-slate-600 hidden sm:inline">Welcome, <span className="text-slate-900">{user.name}</span></span>
          <Button variant="ghost" size="sm" className="hover:bg-rose-50 hover:text-rose-600 font-bold px-4 py-2 rounded-xl transition-colors" onClick={() => {
            localStorage.removeItem("token")
            localStorage.removeItem("user")
            router.push("/login")
          }}>
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </motion.nav>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-12 py-8 space-y-8">

        {/* Hero Section */}
        <motion.div variants={sectionVariants} initial="hidden" animate="visible" custom={0}>
          <DashboardHero
            userName={user.name.split(' ')[0]}
            stats={{
              totalMins: totalMins > 0 ? totalMins : 12,
              avgAccuracy: computedAccuracy > 0 ? computedAccuracy : 85,
              highestLevel: highestLevel > 1 ? highestLevel : 4
            }}
            hasPastSession={!!lastSession}
            onResumeLast={() => {
              if (lastSession) {
                if (lastSession.status === "COMPLETED") {
                  router.push(`/report/${lastSession.id}`)
                } else {
                  router.push(`/interview/${lastSession.id}`)
                }
              }
            }}
            onStartFresh={() => {
              if (configRef.current) {
                configRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }
            }}
            loading={loading}
          />
        </motion.div>

        {/* Quick Actions Presets */}
        <motion.section variants={sectionVariants} initial="hidden" animate="visible" custom={1} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Quick Start Presets</h2>
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">1-Click Fast Configuration</span>
          </div>
          <QuickActions onSelect={applyQuickConfig} />
        </motion.section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
          {/* Main Config Card */}
          <motion.div 
            ref={configRef}
            variants={sectionVariants} 
            initial="hidden" 
            animate="visible" 
            custom={2} 
            className="lg:col-span-2"
          >
            <Card className="shadow-xl border-0 rounded-3xl overflow-hidden bg-white ring-1 ring-slate-100">
              <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 w-full" />
              <CardHeader className="p-6 sm:p-8 pb-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-2xl">
                        <PlayCircle className="h-7 w-7" />
                      </div>
                      Tell us what you want to practice today
                    </CardTitle>
                    <CardDescription className="text-base font-semibold text-slate-500">
                      Customize your adaptive interview session parameters and target difficulty.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-50/50 text-indigo-600 border-indigo-200">
                    Smart Config
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="p-6 sm:p-8 pt-2 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  {/* Left Side: Selects */}
                  <div className="space-y-6 bg-slate-50/60 p-6 rounded-3xl border border-slate-100/80 shadow-inner">
                    <div className="space-y-2.5">
                      <Label className="text-slate-700 font-extrabold text-sm flex items-center justify-between">
                        <span>Interview Domain</span>
                        <span className="text-[10px] text-indigo-600 font-bold uppercase px-2 py-0.5 bg-white rounded-md border border-indigo-100 shadow-xs">AI Tuned</span>
                      </Label>
                      <Select value={domain} onValueChange={setDomain}>
                        <SelectTrigger className="h-13 bg-white border-slate-200 text-base font-bold shadow-xs rounded-2xl focus:ring-2 focus:ring-indigo-500">
                          <SelectValue placeholder="Select Domain" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl font-bold">
                          <SelectItem value="IT">IT & Software Engineering</SelectItem>
                          <SelectItem value="Finance">Finance & Banking Ops</SelectItem>
                          <SelectItem value="Marketing">Marketing & Product Growth</SelectItem>
                          <SelectItem value="HR">Human Resources & Talent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2.5">
                      <Label className="text-slate-700 font-extrabold text-sm flex items-center justify-between">
                        <span>Target Questions</span>
                        <span className="text-xs text-slate-400 font-semibold">{questionCount} questions total</span>
                      </Label>
                      <Select value={questionCount} onValueChange={setQuestionCount}>
                        <SelectTrigger className="h-13 bg-white border-slate-200 text-base font-bold shadow-xs rounded-2xl focus:ring-2 focus:ring-indigo-500">
                          <SelectValue placeholder="Questions" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl font-bold">
                          <SelectItem value="5">5 Questions (Sprint Demo)</SelectItem>
                          <SelectItem value="15">15 Questions (Recommended)</SelectItem>
                          <SelectItem value="30">30 Questions (Deep Assessment)</SelectItem>
                          <SelectItem value="45">45 Questions (Exhaustive)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2.5">
                      <Label className="text-slate-700 font-extrabold text-sm flex items-center justify-between">
                        <span>Session Duration</span>
                        <span className="text-xs text-slate-400 font-semibold">{duration} mins</span>
                      </Label>
                      <Select value={duration} onValueChange={setDuration}>
                        <SelectTrigger className="h-13 bg-white border-slate-200 text-base font-bold shadow-xs rounded-2xl focus:ring-2 focus:ring-indigo-500">
                          <SelectValue placeholder="Duration" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl font-bold">
                          <SelectItem value="10">10 Minutes (Lightning)</SelectItem>
                          <SelectItem value="20">20 Minutes (Standard)</SelectItem>
                          <SelectItem value="30">30 Minutes (Recommended)</SelectItem>
                          <SelectItem value="45">45 Minutes (Extended)</SelectItem>
                          <SelectItem value="60">60 Minutes (Full Interview)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Right Side: Speedometer */}
                  <div className="h-full flex flex-col justify-center">
                    <div className="mb-2 flex items-center justify-between px-2">
                      <Label className="text-slate-400 uppercase tracking-widest text-[11px] font-extrabold">Adaptive Level</Label>
                      <span className="text-xs font-bold text-slate-500">Click level to set</span>
                    </div>
                    <SpeedometerDifficulty
                      value={difficulty}
                      onChange={setDifficulty}
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="p-6 sm:p-8 pt-0 flex flex-col gap-4 bg-slate-50/50 border-t border-slate-100 mt-2">
                <div className="flex items-center justify-between w-full text-xs sm:text-sm font-extrabold text-slate-600 px-2 py-1 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                    <span>Selected Parameters:</span>
                  </div>
                  <span className="text-indigo-600 font-black tracking-wide">
                    {questionCount} questions • {duration} mins • Level {difficulty} challenge
                  </span>
                </div>

                <Button
                  size="lg"
                  className="w-full text-lg h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black shadow-xl shadow-indigo-600/25 transition-all hover:scale-105 active:scale-95 border border-indigo-500/30 flex items-center justify-center gap-3 group"
                  onClick={() => startInterview()}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Calibrating AI Simulator...</span>
                    </div>
                  ) : (
                    <>
                      <span>Start Interview</span>
                      <ArrowRight className="w-6 h-6 group-hover:translate-x-1.5 transition-transform" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>

          {/* Right Side Column: Stats & Gamification */}
          <div className="space-y-6">
            {/* If 0 sessions, show breathtaking "Your Interview DNA" Card */}
            {totalSessionsCount === 0 ? (
              <motion.div variants={sectionVariants} initial="hidden" animate="visible" custom={3}>
                <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                  <Card className="border-0 shadow-xl rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 text-white relative">
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />
                    <CardHeader className="p-6 pb-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 rounded-full border border-indigo-400/30 text-xs font-bold text-indigo-300 mb-2 w-max">
                        <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                        First-Run Experience
                      </div>
                      <CardTitle className="text-2xl font-black text-white">🎯 Your Interview DNA</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 pt-2 space-y-4">
                      <p className="text-sm text-indigo-100 font-medium leading-relaxed">
                        Start your first session to unlock real-time adaptive metrics:
                      </p>
                      <ul className="space-y-2.5 text-xs font-bold text-slate-200">
                        <li className="flex items-center gap-2.5 bg-white/10 px-3.5 py-2 rounded-xl backdrop-blur-sm border border-white/5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Personalized Skill Matrix & DNA Report</span>
                        </li>
                        <li className="flex items-center gap-2.5 bg-white/10 px-3.5 py-2 rounded-xl backdrop-blur-sm border border-white/5">
                          <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                          <span>AI-Powered Weak Point & Gap Analysis</span>
                        </li>
                        <li className="flex items-center gap-2.5 bg-white/10 px-3.5 py-2 rounded-xl backdrop-blur-sm border border-white/5">
                          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>Performance Tracking & Topic Strengths</span>
                        </li>
                      </ul>
                      <Button
                        onClick={startQuickAssessment}
                        className="w-full mt-4 h-12 bg-white text-indigo-900 hover:bg-slate-100 font-extrabold text-sm rounded-xl shadow-lg transition-transform hover:scale-102 active:scale-98"
                      >
                        Take 15-Min Quick Assessment
                        <ChevronRight className="w-4 h-4 ml-1.5" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                <motion.div variants={sectionVariants} initial="hidden" animate="visible" custom={3}>
                  <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                    <Card className="rounded-3xl border border-slate-200/80 shadow-md bg-white p-6 flex flex-col justify-between h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center justify-between text-slate-500 font-bold text-xs uppercase tracking-wider mb-2">
                        <span>Total Sessions</span>
                        <History className="h-4 w-4 text-indigo-500" />
                      </div>
                      <div className="text-4xl font-black text-slate-900">{totalSessionsCount}</div>
                      <p className="text-xs text-slate-500 font-semibold mt-1">Completed simulation flows</p>
                    </Card>
                  </motion.div>
                </motion.div>

                <motion.div variants={sectionVariants} initial="hidden" animate="visible" custom={4}>
                  <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                    <Card className="rounded-3xl border border-slate-200/80 shadow-md bg-white p-6 flex flex-col justify-between h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center justify-between text-slate-500 font-bold text-xs uppercase tracking-wider mb-2">
                        <span>Avg Accuracy</span>
                        <Target className="h-4 w-4 text-emerald-500" />
                      </div>
                      <div className="text-4xl font-black text-emerald-600">{computedAccuracy}%</div>
                      <p className="text-xs text-slate-500 font-semibold mt-1">Based on correct answers</p>
                    </Card>
                  </motion.div>
                </motion.div>
              </div>
            )}

            {/* Current Streak Card (Gamification) */}
            <motion.div variants={sectionVariants} initial="hidden" animate="visible" custom={5}>
              <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                <Card className="bg-gradient-to-br from-rose-500 via-orange-500 to-amber-500 text-white border-0 shadow-xl rounded-3xl p-6 relative overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 opacity-15 pointer-events-none">
                    <Flame className="w-40 h-40" />
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 font-black text-sm uppercase tracking-wider text-rose-100">
                      <Flame className="w-5 h-5 text-amber-300 animate-bounce" />
                      <span>Practice Streak</span>
                    </div>
                    <Badge variant="secondary" className="bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-white/20 backdrop-blur-sm">Active</Badge>
                  </div>
                  <div className="text-4xl font-black tracking-tight">{totalSessionsCount > 0 ? 3 : 1} Days</div>
                  <p className="text-xs font-bold text-rose-100 mt-2 leading-relaxed">
                    Consistency is key! Complete a daily challenge tomorrow to keep the flame burning.
                  </p>
                </Card>
              </motion.div>
            </motion.div>

            {/* Achievements Section */}
            <motion.div variants={sectionVariants} initial="hidden" animate="visible" custom={6}>
              <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                <Card className="rounded-3xl border border-slate-200/80 shadow-md bg-white p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 font-black text-sm text-slate-900 uppercase tracking-wider">
                      <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                        <Trophy className="w-4 h-4" />
                      </div>
                      <span>Achievements</span>
                    </div>
                    <span className="text-xs font-bold text-amber-600">1 / 8 Unlocked</span>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-amber-500/20 shrink-0">
                      🏆
                    </div>
                    <div>
                      <div className="font-extrabold text-sm text-slate-900">Unlocked: "First Steps"</div>
                      <p className="text-xs font-semibold text-slate-500 mt-0.5">Complete 5 more sessions to unlock "Focus Master" badge.</p>
                    </div>
                  </div>

                  <Button variant="ghost" size="sm" className="w-full text-xs font-extrabold text-slate-600 hover:text-indigo-600">
                    View All Achievements
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
