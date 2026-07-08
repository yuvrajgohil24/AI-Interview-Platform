"use client"

import React, { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from "@/lib/utils"
import { Sparkles, Trophy, Zap, Clock, Percent, ShieldCheck } from "lucide-react"

interface SpeedometerDifficultyProps {
    value: number // 1 to 5
    onChange: (value: number) => void
    className?: string
}

const difficultyMeta: Record<number, { title: string, subtitle: string, duration: string, rate: string, color: string, description: string }> = {
    1: {
        title: "Novice",
        subtitle: "Perfect for: Fresh graduates & Interns",
        duration: "15 mins",
        rate: "85%",
        color: "#10b981", // Emerald
        description: "Focuses on foundational concepts, syntax definitions, and basic problem-solving approaches."
    },
    2: {
        title: "Beginner",
        subtitle: "Perfect for: Junior developers (0-1 year)",
        duration: "20 mins",
        rate: "76%",
        color: "#84cc16", // Lime
        description: "Covers standard algorithms, basic system design awareness, and day-to-day coding scenarios."
    },
    3: {
        title: "Intermediate",
        subtitle: "Perfect for: Mid-level engineers (1-3 years)",
        duration: "25 mins",
        rate: "68%",
        color: "#f59e0b", // Amber
        description: "Tests edge cases, optimization trade-offs, architecture patterns, and debugging complexities."
    },
    4: {
        title: "Advanced",
        subtitle: "Perfect for: Senior engineers (3-5 years)",
        duration: "35 mins",
        rate: "52%",
        color: "#f97316", // Orange
        description: "Challenging real-world scalability issues, concurrent operations, and system bottlenecks."
    },
    5: {
        title: "Expert",
        subtitle: "Perfect for: Principal & Staff roles",
        duration: "45 mins",
        rate: "38%",
        color: "#ef4444", // Red
        description: "Rigorous deep dives into distributed consensus, kernel-level optimizations, and fault tolerance."
    }
}

const SpeedometerDifficulty = ({ value, onChange, className }: SpeedometerDifficultyProps) => {
    const [mounted, setMounted] = React.useState(false)
    const [hoveredValue, setHoveredValue] = React.useState<number | null>(null)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    const activeVal = hoveredValue !== null ? hoveredValue : value
    const meta = difficultyMeta[activeVal] || difficultyMeta[3]

    const rotation = useMemo(() => {
        return (activeVal - 3) * 45
    }, [activeVal])

    if (!mounted) return <div className="h-72 flex items-center justify-center text-slate-400 animate-pulse">Loading Adaptive Gauge...</div>

    return (
        <div className={cn("flex flex-col items-center gap-6 py-8 px-6 bg-gradient-to-b from-white to-slate-50/80 rounded-3xl border border-slate-200/80 shadow-sm w-full mx-auto relative overflow-hidden transition-all duration-300", className)}>
            {/* Top decorative badge */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-semibold border border-indigo-100">
                <Sparkles className="w-3.5 h-3.5" />
                Adaptive AI Engine
            </div>

            <div className="relative w-full max-w-[280px] aspect-[1.6/1] flex items-center justify-center mt-2">
                <svg viewBox="0 0 200 120" className="w-full h-full drop-shadow-sm">
                    <defs>
                        <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="30%" stopColor="#84cc16" />
                            <stop offset="50%" stopColor="#f59e0b" />
                            <stop offset="70%" stopColor="#f97316" />
                            <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                    </defs>
                    <path
                        d="M 20 100 A 80 80 0 0 1 180 100"
                        fill="none"
                        stroke="#f1f5f9"
                        strokeWidth="12"
                        strokeLinecap="round"
                    />
                    <path
                        d="M 20 100 A 80 80 0 0 1 180 100"
                        fill="none"
                        stroke="url(#gauge-gradient)"
                        strokeWidth="12"
                        strokeLinecap="round"
                        className="opacity-80 transition-all duration-500"
                    />
                </svg>

                {/* Animated Needle */}
                <motion.div
                    className="absolute bottom-6 origin-bottom flex flex-col items-center z-10 pointer-events-none"
                    initial={false}
                    animate={{ rotate: rotation }}
                    transition={{ type: "spring", stiffness: 90, damping: 14 }}
                    style={{ height: '80px', bottom: '20px' }}
                >
                    <div
                        className="w-1.5 h-16 rounded-full shadow-md relative"
                        style={{ backgroundColor: '#0f172a' }}
                    >
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-white/30 rounded-full" />
                    </div>
                    <div className="w-8 h-8 bg-slate-900 rounded-full border-[3px] border-white shadow-xl z-10 -mt-3 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse" />
                    </div>
                </motion.div>

                {/* Interactive Level Buttons */}
                <div className="absolute inset-x-0 bottom-0 flex justify-center gap-2 pb-1 z-20">
                    {[1, 2, 3, 4, 5].map((v) => {
                        const isSelected = value === v
                        const isHovered = hoveredValue === v
                        return (
                            <button
                                key={v}
                                onClick={() => onChange(v)}
                                onMouseEnter={() => setHoveredValue(v)}
                                onMouseLeave={() => setHoveredValue(null)}
                                className={cn(
                                    "w-11 h-11 rounded-full border-2 transition-all duration-300 flex flex-col items-center justify-center font-bold text-sm bg-white shadow-sm ring-offset-2 hover:ring-2 hover:ring-indigo-200 active:scale-95",
                                    isSelected
                                        ? "shadow-md scale-110 -translate-y-2.5 z-30 ring-2 ring-indigo-500/30 font-black"
                                        : isHovered 
                                            ? "scale-105 -translate-y-1 z-20 ring-1 ring-slate-300"
                                            : "opacity-70 grayscale-[0.3] hover:opacity-100 hover:grayscale-0 z-10"
                                    )}
                                style={{
                                    borderColor: isSelected ? difficultyMeta[v].color : isHovered ? difficultyMeta[v].color : '#e2e8f0',
                                    color: isSelected ? difficultyMeta[v].color : isHovered ? difficultyMeta[v].color : '#64748b'
                                }}
                            >
                                <span className="text-[9px] opacity-50 font-bold leading-none mb-0.5 tracking-tighter">LVL</span>
                                <span className="leading-none text-base font-extrabold">{v}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Dynamic Level Metadata Display */}
            <div className="w-full space-y-3 pt-2 text-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeVal}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="space-y-2.5"
                    >
                        <div className="inline-block px-5 py-1.5 rounded-full bg-slate-900 shadow-md border border-slate-800">
                            <span className="text-base font-black uppercase tracking-wider text-white" style={{ color: meta.color }}>
                                {meta.title}
                            </span>
                        </div>

                        <p className="text-xs font-bold text-slate-700 bg-slate-100/80 py-1.5 px-3 rounded-xl inline-block border border-slate-200/60 shadow-xs">
                            {meta.subtitle}
                        </p>

                        <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                            {meta.description}
                        </p>

                        <div className="flex justify-center gap-4 pt-1 border-t border-slate-100 max-w-xs mx-auto">
                            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                                <span>Est. {meta.duration}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                                <Percent className="w-3.5 h-3.5 text-emerald-500" />
                                <span>{meta.rate} success</span>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Confidence Boost Toggle */}
                <div className="pt-2">
                    <button
                        onClick={() => {
                            if (value < 5) onChange(value + 1)
                        }}
                        disabled={value >= 5}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100/80 border border-indigo-200/60 rounded-xl px-4 py-2 transition-all inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed group shadow-xs hover:shadow-sm"
                    >
                        <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500 group-hover:scale-110 transition-transform" />
                        <span>Feel lucky? Try Level {Math.min(5, value + 1)} challenge</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default SpeedometerDifficulty
