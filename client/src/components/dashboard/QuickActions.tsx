"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Code2, Briefcase, TrendingUp, Users } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuickActionProps {
    onSelect: (config: { domain: string, difficulty: number, duration: number }) => void
}

export function QuickActions({ onSelect }: QuickActionProps) {
    const actions = [
        {
            label: "Frontend Dev",
            icon: Code2,
            domain: "IT",
            difficulty: 3,
            duration: 15,
            color: "text-blue-500",
            bgColor: "bg-blue-50"
        },
        {
            label: "Banking Lead",
            icon: TrendingUp,
            domain: "Finance",
            difficulty: 4,
            duration: 20,
            color: "text-emerald-500",
            bgColor: "bg-emerald-50"
        },
        {
            label: "Product Mgt",
            icon: Briefcase,
            domain: "Marketing", // Mapping PM to Marketing for now as generic
            difficulty: 3,
            duration: 30,
            color: "text-purple-500",
            bgColor: "bg-purple-50"
        },
        {
            label: "HR Specialist",
            icon: Users,
            domain: "HR",
            difficulty: 2,
            duration: 15,
            color: "text-rose-500",
            bgColor: "bg-rose-50"
        }
    ]

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {actions.map((action, i) => (
                <motion.div
                    key={action.label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.2 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ y: -6, scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                >
                    <Card
                        className="cursor-pointer border-2 border-transparent bg-white/90 backdrop-blur hover:border-primary/20 hover:shadow-lg transition-all group overflow-hidden h-full"
                        onClick={() => onSelect({ domain: action.domain, difficulty: action.difficulty, duration: action.duration })}
                    >
                        <div className="p-4 flex flex-col items-center gap-3 text-center">
                            <div className={cn("p-3 rounded-full transition-transform group-hover:scale-110 group-hover:rotate-6", action.bgColor)}>
                                <action.icon className={cn("w-6 h-6", action.color)} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-sm text-slate-700">{action.label}</h3>
                                <div className="flex justify-center gap-1">
                                    <Badge variant="secondary" className="text-[10px] px-1 h-5">{action.duration}m</Badge>
                                    <Badge variant="outline" className="text-[10px] px-1 h-5">Lvl {action.difficulty}</Badge>
                                </div>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            ))}
        </div>
    )
}
