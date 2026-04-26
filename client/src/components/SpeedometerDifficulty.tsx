"use client"

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn } from "@/lib/utils"

interface SpeedometerDifficultyProps {
    value: number // 1 to 5
    onChange: (value: number) => void
    className?: string
}

const SpeedometerDifficulty = ({ value, onChange, className }: SpeedometerDifficultyProps) => {
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    const rotation = useMemo(() => {
        return (value - 3) * 45
    }, [value])

    const getColor = (v: number) => {
        if (v <= 1) return '#10b981' // Emerald-500
        if (v <= 2) return '#84cc16' // Lime-500
        if (v <= 3) return '#f59e0b' // Amber-500
        if (v <= 4) return '#f97316' // Orange-500
        return '#ef4444' // Red-500
    }

    const getLabel = (v: number) => {
        if (v <= 1) return 'Novice'
        if (v <= 2) return 'Beginner'
        if (v <= 3) return 'Intermediate'
        if (v <= 4) return 'Advanced'
        return 'Expert'
    }

    if (!mounted) return <div className="h-64 flex items-center justify-center text-slate-400 animate-pulse">Loading Gauge...</div>

    return (
        <div className={cn("flex flex-col items-center gap-4 py-8 px-4 bg-slate-50/50 rounded-3xl border border-slate-100 shadow-inner w-full max-w-sm mx-auto", className)}>
            <div className="relative w-full max-w-[280px] aspect-[1.6/1] flex items-center justify-center group">
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
                        stroke="#e2e8f0"
                        strokeWidth="10"
                        strokeLinecap="round"
                    />
                    <path
                        d="M 20 100 A 80 80 0 0 1 180 100"
                        fill="none"
                        stroke="url(#gauge-gradient)"
                        strokeWidth="10"
                        strokeLinecap="round"
                        className="opacity-70 transition-all duration-500"
                    />
                </svg>

                <motion.div
                    className="absolute bottom-6 origin-bottom flex flex-col items-center z-10"
                    initial={false}
                    animate={{ rotate: rotation }}
                    transition={{ type: "spring", stiffness: 80, damping: 12 }}
                    style={{ height: '80px', bottom: '20px' }}
                >
                    <div
                        className="w-1.5 h-16 rounded-full shadow-lg relative"
                        style={{ backgroundColor: '#1e293b' }}
                    >
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-white/20 rounded-full" />
                    </div>
                    <div className="w-8 h-8 bg-slate-900 rounded-full border-[3px] border-white shadow-xl z-10 -mt-3 flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    </div>
                </motion.div>

                <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1.5 pb-1">
                    {[1, 2, 3, 4, 5].map((v) => (
                        <button
                            key={v}
                            onClick={() => onChange(v)}
                            className={cn(
                                "w-11 h-11 rounded-full border-2 transition-all duration-500 flex flex-col items-center justify-center font-bold text-sm bg-white shadow-sm ring-offset-2 hover:ring-2 hover:ring-slate-200 active:scale-95",
                                value === v
                                    ? "shadow-lg scale-110 -translate-y-3 z-30"
                                    : "opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0 z-20"
                            )}
                            style={{
                                borderColor: value === v ? getColor(v) : 'transparent',
                                color: value === v ? getColor(v) : '#475569'
                            }}
                        >
                            <span className="text-[9px] opacity-40 font-bold leading-none mb-0.5">LVL</span>
                            <span className="leading-none text-base font-black">{v}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="text-center space-y-2 mt-4">
                <div className="px-5 py-2 rounded-full bg-white shadow-sm border border-slate-100 inline-block min-w-[140px]">
                    <motion.h3
                        key={value}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-lg font-black tracking-tight uppercase"
                        style={{ color: getColor(value) }}
                    >
                        {getLabel(value)}
                    </motion.h3>
                </div>
                <p className="text-[10px] text-slate-400 font-bold tracking-[0.2em] uppercase">Target Challenge Rating</p>
            </div>
        </div>
    )
}

export default SpeedometerDifficulty
