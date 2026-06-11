"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, type Variants } from "framer-motion"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlayCircle, History, Trophy, Target, LogOut, LayoutDashboard } from "lucide-react"
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

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ name: string } | null>(null)

  // Config state
  const [domain, setDomain] = useState("IT")
  const [difficulty, setDifficulty] = useState(3)
  const [questionCount, setQuestionCount] = useState("15")
  const [duration, setDuration] = useState("30")

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/login")
    } else {
      setUser(JSON.parse(userData))
    }
  }, [router])

  const applyQuickConfig = (config: { domain: string, difficulty: number, duration: number }) => {
    setDomain(config.domain)
    setDifficulty(config.difficulty)
    setDuration(config.duration.toString())
    // Optional: Scroll to start section or show a toast
    window.scrollTo({ top: 400, behavior: 'smooth' })
  }

  const startInterview = async () => {
    setLoading(true)
    try {
      const res = await api.post('/interview/start', {
        domain,
        difficulty: difficulty.toString(),
        questionCount: parseInt(questionCount),
        duration: parseInt(duration)
      })
      router.push(`/interview/${res.data.sessionId}`)
    } catch (error) {
      console.error("Failed to start", error)
      alert("Failed to start interview session")
    } finally {
      setLoading(false)
    }
  }

  if (!user) return <div className="min-h-screen bg-slate-50" />

  return (
    <div className="relative min-h-screen bg-slate-50 overflow-x-hidden">
      {/* Decorative background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-grid-light opacity-60" />
      <div aria-hidden className="pointer-events-none fixed -top-40 -right-40 h-96 w-96 rounded-full bg-violet-200/40 blur-3xl" />
      <div aria-hidden className="pointer-events-none fixed -bottom-40 -left-40 h-96 w-96 rounded-full bg-indigo-200/40 blur-3xl" />

      {/* Navbar */}
      <motion.nav
        initial={{ y: -56, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-xl shadow-sm px-6 lg:px-12 py-3 flex justify-between items-center"
      >
        <div className="flex items-center gap-2 font-bold text-xl text-primary">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-white">
            <Target className="h-4 w-4" />
          </span>
          Emtihaan
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600 hidden sm:inline">Welcome, {user.name}</span>
          <Button variant="ghost" size="sm" onClick={() => {
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
          <DashboardHero userName={user.name.split(' ')[0]} />
        </motion.div>

        {/* Quick Actions */}
        <motion.section variants={sectionVariants} initial="hidden" animate="visible" custom={1} className="space-y-4">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-slate-500" />
            <h2 className="text-lg font-bold text-slate-700">Quick Start Presets</h2>
          </div>
          <QuickActions onSelect={applyQuickConfig} />
        </motion.section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Config Card */}
          <motion.div variants={sectionVariants} initial="hidden" animate="visible" custom={2} className="lg:col-span-2">
            <Card className="shadow-lg border-t-4 border-t-primary bg-white/90 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlayCircle className="h-6 w-6 text-primary" />
                  Start New Session
                </CardTitle>
                <CardDescription>Configure your adaptive interview settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  {/* Left Side: Selects */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-slate-600 font-semibold">Interview Domain</Label>
                      <Select value={domain} onValueChange={setDomain}>
                        <SelectTrigger className="h-12 border-slate-200">
                          <SelectValue placeholder="Select Domain" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IT">IT & Software</SelectItem>
                          <SelectItem value="Finance">Finance & Banking</SelectItem>
                          <SelectItem value="Marketing">Marketing</SelectItem>
                          <SelectItem value="HR">Human Resources</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-600 font-semibold">Question Count</Label>
                      <Select value={questionCount} onValueChange={setQuestionCount}>
                        <SelectTrigger className="h-12 border-slate-200">
                          <SelectValue placeholder="Questions" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 Questions (Demo)</SelectItem>
                          <SelectItem value="15">15 Questions</SelectItem>
                          <SelectItem value="30">30 Questions</SelectItem>
                          <SelectItem value="45">45 Questions</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-600 font-semibold">Session Duration</Label>
                      <Select value={duration} onValueChange={setDuration}>
                        <SelectTrigger className="h-12 border-slate-200">
                          <SelectValue placeholder="Duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10 Minutes</SelectItem>
                          <SelectItem value="20">20 Minutes</SelectItem>
                          <SelectItem value="30">30 Minutes</SelectItem>
                          <SelectItem value="45">45 Minutes</SelectItem>
                          <SelectItem value="60">60 Minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Right Side: Speedometer */}
                  <div className="flex flex-col items-center justify-center p-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 min-h-[300px]">
                    <Label className="mb-4 text-slate-400 uppercase tracking-widest text-[10px] font-bold">Adjust Difficulty</Label>
                    <SpeedometerDifficulty
                      value={difficulty}
                      onChange={setDifficulty}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  size="lg"
                  className="w-full text-lg h-12 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-indigo-200"
                  onClick={startInterview}
                  disabled={loading}
                >
                  {loading ? "Initializing AI..." : "Begin Simulation"}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>

          {/* Stats Column */}
          <div className="space-y-6">
            {[
              {
                title: "Total Sessions", icon: History, value: "0", note: "Ready to start?", custom: 3
              },
              {
                title: "Avg. Accuracy", icon: Target, value: "-%", note: "Practice to improve", custom: 4
              }
            ].map((stat) => (
              <motion.div key={stat.title} variants={sectionVariants} initial="hidden" animate="visible" custom={stat.custom}>
                <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                  <Card className="bg-white/90 backdrop-blur hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                        {stat.title}
                        <stat.icon className="h-4 w-4 text-muted-foreground" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{stat.value}</div>
                      <p className="text-xs text-muted-foreground mt-1">{stat.note}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            ))}

            <motion.div variants={sectionVariants} initial="hidden" animate="visible" custom={5}>
              <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                <Card className="relative overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0 shadow-lg">
                  <motion.div
                    aria-hidden
                    className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-white/10 blur-2xl"
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-indigo-100 flex items-center justify-between">
                      Current Streak
                      <Trophy className="h-4 w-4 text-yellow-300" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">0 Days</div>
                    <p className="text-xs text-indigo-200 mt-1">Consistency is key!</p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
