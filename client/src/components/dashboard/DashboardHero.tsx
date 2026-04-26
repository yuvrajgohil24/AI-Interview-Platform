"use client"

import { Button } from "@/components/ui/button"
import { Sparkles, ArrowRight, Zap } from "lucide-react"

interface DashboardHeroProps {
    userName: string
}

export function DashboardHero({ userName }: DashboardHeroProps) {
    return (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 to-indigo-600 p-8 md:p-12 text-white shadow-2xl">
            {/* Background patterns */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />

            <div className="relative z-10 flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
                <div className="space-y-4 max-w-2xl">
                    <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-indigo-100 backdrop-blur-sm">
                        <Sparkles className="mr-2 h-4 w-4 text-yellow-300" />
                        <span>Daily Challenge Available</span>
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                        Welcome back, {userName}!
                    </h1>
                    <p className="text-lg text-indigo-100">
                        Ready to push your limits? Your AI outcome simulator is calibrated and ready for a new session.
                    </p>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row shadow-sm">
                    {/* CTA Button */}
                    <Button size="lg" className="h-14 bg-white text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 font-bold text-lg px-8 rounded-xl shadow-xl transition-all hover:scale-105 active:scale-95">
                        <Zap className="mr-2 h-5 w-5 fill-indigo-600" />
                        Start Daily Challenge
                    </Button>
                </div>
            </div>
        </div>
    )
}
