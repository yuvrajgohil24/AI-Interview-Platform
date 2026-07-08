"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Code2, Briefcase, TrendingUp, Users, ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuickActionProps {
    onSelect: (config: { domain: string, difficulty: number, duration: number }) => void
}

export function QuickActions({ onSelect }: QuickActionProps) {
    const actions = [
        {
            label: "Frontend Dev",
            role: "React / TS",
            icon: Code2,
            domain: "IT",
            difficulty: 3,
            duration: 15,
            color: "text-indigo-600",
            bgColor: "bg-indigo-50/80 border border-indigo-100",
            hoverRing: "hover:border-indigo-500/40 hover:shadow-indigo-500/10"
        },
        {
            label: "Banking Lead",
            role: "Fintech Ops",
            icon: TrendingUp,
            domain: "Finance",
            difficulty: 4,
            duration: 20,
            color: "text-emerald-600",
            bgColor: "bg-emerald-50/80 border border-emerald-100",
            hoverRing: "hover:border-emerald-500/40 hover:shadow-emerald-500/10"
        },
        {
            label: "Product Manager",
            role: "Growth & Strategy",
            icon: Briefcase,
            domain: "Marketing",
            difficulty: 3,
            duration: 30,
            color: "text-amber-600",
            bgColor: "bg-amber-50/80 border border-amber-100",
            hoverRing: "hover:border-amber-500/40 hover:shadow-amber-500/10"
        },
        {
            label: "HR Specialist",
            role: "Talent Acquisition",
            icon: Users,
            domain: "HR",
            difficulty: 2,
            duration: 15,
            color: "text-rose-600",
            bgColor: "bg-rose-50/80 border border-rose-100",
            hoverRing: "hover:border-rose-500/40 hover:shadow-rose-500/10"
        }
    ]

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {actions.map((action, i) => (
                <motion.div
                    key={action.label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.2 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ y: -6, scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="h-full"
                >
                    <Card
                        className={cn(
                            "cursor-pointer border-2 border-slate-200/80 bg-white hover:bg-slate-50/50 shadow-xs hover:shadow-lg transition-all duration-300 group overflow-hidden relative rounded-2xl p-5 flex flex-col justify-between h-full",
                            action.hoverRing
                        )}
                        onClick={() => onSelect({ domain: action.domain, difficulty: action.difficulty, duration: action.duration })}
                    >
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-0 -translate-x-1">
                            <ArrowUpRight className="w-4 h-4 text-slate-400" />
                        </div>

                        <div className="flex items-start gap-4">
                            <div className={cn("p-3.5 rounded-2xl transition-transform duration-300 group-hover:scale-110 shadow-inner", action.bgColor)}>
                                <action.icon className={cn("w-6 h-6", action.color)} />
                            </div>
                            <div className="space-y-1 text-left">
                                <h3 className="font-extrabold text-base text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">{action.label}</h3>
                                <p className="text-xs font-semibold text-slate-500">{action.role}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-4 border-t border-slate-100 mt-4 justify-between">
                            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Preset Target</span>
                            <div className="flex gap-1.5">
                                <Badge variant="secondary" className="text-[10px] px-2 py-0.5 h-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg">{action.duration}m</Badge>
                                <Badge variant="outline" className="text-[10px] px-2 py-0.5 h-5 border-slate-200 text-slate-700 font-bold rounded-lg">Lvl {action.difficulty}</Badge>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            ))}
        </div>
    )
}
