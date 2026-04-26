"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { PlayCircle, History, Trophy, Target, LogOut, Gauge, LayoutDashboard } from "lucide-react"
import SpeedometerDifficulty from "@/components/SpeedometerDifficulty"
import { DashboardHero } from "@/components/dashboard/DashboardHero"
import { QuickActions } from "@/components/dashboard/QuickActions"

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
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="border-b bg-white shadow-sm px-6 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2 font-bold text-xl text-primary">
          <Target className="h-6 w-6" />
          Emtihaan
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600">Welcome, {user.name}</span>
          <Button variant="ghost" size="sm" onClick={() => {
            localStorage.removeItem("token")
            localStorage.removeItem("user")
            router.push("/login")
          }}>
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-8 space-y-8">

        {/* Hero Section */}
        <DashboardHero userName={user.name.split(' ')[0]} />

        {/* Quick Actions */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-slate-500" />
            <h2 className="text-lg font-bold text-slate-700">Quick Start Presets</h2>
          </div>
          <QuickActions onSelect={applyQuickConfig} />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Config Card */}
          <Card className="lg:col-span-2 shadow-lg border-t-4 border-t-primary">
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
              <Button size="lg" className="w-full text-lg h-12" onClick={startInterview} disabled={loading}>
                {loading ? "Initializing AI..." : "Begin Simulation"}
              </Button>
            </CardFooter>
          </Card>

          {/* Stats Column */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  Total Sessions
                  <History className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">0</div>
                <p className="text-xs text-muted-foreground mt-1">Ready to start?</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  Avg. Accuracy
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">-%</div>
                <p className="text-xs text-muted-foreground mt-1">Practice to improve</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-indigo-100 flex items-center justify-between">
                  Current Streak
                  <Trophy className="h-4 w-4 text-yellow-300" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">0 Days</div>
                <p className="text-xs text-indigo-200 mt-1">Consult consistency!</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
