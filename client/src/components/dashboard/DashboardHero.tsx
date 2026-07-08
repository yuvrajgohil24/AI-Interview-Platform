"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Sparkles, History, Zap, Trophy, Clock, Target } from "lucide-react"

interface DashboardHeroProps {
    userName: string
    stats?: {
        totalMins: number
        avgAccuracy: number
        highestLevel: number
    }
    onStartFresh?: () => void
    onResumeLast?: () => void
    hasPastSession?: boolean
    loading?: boolean
}

export function DashboardHero({ userName, stats, onStartFresh, onResumeLast, hasPastSession, loading }: DashboardHeroProps) {
    return (
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 md:p-12 text-white shadow-2xl border border-slate-800">
            {/* Animated background orbs */}
            <motion.div
                aria-hidden
                className="absolute top-0 right-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"
                animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.9, 0.6] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                aria-hidden
                className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none"
                animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />

            <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
                <div className="space-y-6 max-w-2xl">
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center rounded-full bg-indigo-500/10 border border-indigo-500/30 px-3.5 py-1.5 text-xs font-semibold text-indigo-300 backdrop-blur-sm shadow-inner"
                    >
                        <motion.span
                            animate={{ rotate: [0, 15, -15, 0] }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                            className="mr-2 inline-flex"
                        >
                            <Sparkles className="h-4 w-4 text-yellow-400" />
                        </motion.span>
                        <span>AI Calibration Complete • Adaptive Engine Active</span>
                    </motion.div>
                    
                    <motion.h1
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, delay: 0.1 }}
                        className="text-4xl font-black tracking-tight sm:text-5xl text-white lg:leading-[1.15]"
                    >
                        Welcome back, <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">{userName}</span>!
                        <span className="block text-2xl sm:text-3xl text-slate-300 mt-2.5 font-bold">Your next breakthrough starts here.</span>
                    </motion.h1>

                    {/* Stats Badges row */}
                    <motion.div 
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, delay: 0.2 }}
                        className="flex flex-wrap gap-3.5 pt-1"
                    >
                        <div className="flex items-center gap-3.5 bg-slate-800/80 border border-slate-700/80 rounded-2xl px-5 py-3.5 backdrop-blur-md shadow-lg">
                            <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                                <Clock className="h-5 w-5 text-indigo-400" />
                            </div>
                            <div>
                                <div className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Practice Time</div>
                                <div className="text-lg font-extrabold text-white">{stats?.totalMins || 12} mins</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3.5 bg-slate-800/80 border border-slate-700/80 rounded-2xl px-5 py-3.5 backdrop-blur-md shadow-lg">
                            <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                <Target className="h-5 w-5 text-emerald-400" />
                            </div>
                            <div>
                                <div className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Avg Accuracy</div>
                                <div className="text-lg font-extrabold text-emerald-300">{stats?.avgAccuracy || 85}%</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3.5 bg-slate-800/80 border border-slate-700/80 rounded-2xl px-5 py-3.5 backdrop-blur-md shadow-lg">
                            <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20">
                                <Trophy className="h-5 w-5 text-amber-400" />
                            </div>
                            <div>
                                <div className="text-xs text-slate-400 font-semibold tracking-wide uppercase">Max Level Reached</div>
                                <div className="text-lg font-extrabold text-amber-300">Level {stats?.highestLevel || 4}</div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-4 pt-4 md:pt-0"
                >
                    {hasPastSession && (
                        <Button
                            size="lg"
                            variant="outline"
                            onClick={onResumeLast}
                            disabled={loading}
                            className="h-14 border-slate-700 bg-slate-800/50 text-slate-200 hover:bg-slate-800 hover:text-white font-bold text-base px-6 rounded-2xl backdrop-blur-md transition-all shadow-lg hover:scale-105 active:scale-95"
                        >
                            <History className="mr-2 h-5 w-5 text-indigo-400" />
                            Resume Last Session
                        </Button>
                    )}
                    <Button
                        size="lg"
                        onClick={onStartFresh}
                        disabled={loading}
                        className="h-14 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base px-8 rounded-2xl shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 border border-indigo-500/40"
                    >
                        <Zap className="mr-2 h-5 w-5 fill-white" />
                        {loading ? "Starting..." : "Start Fresh Session"}
                    </Button>
                </motion.div>
            </div>
        </div>
    )
}
