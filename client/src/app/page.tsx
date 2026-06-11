"use client"

import Link from "next/link"
import { motion, type Variants } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
    Target, Brain, Gauge, Zap, BarChart3, ShieldCheck,
    ArrowRight, Sparkles, ChevronDown
} from "lucide-react"

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number = 0) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }
    })
}

const features = [
    {
        icon: Gauge,
        title: "Adaptive Difficulty",
        desc: "Questions scale from Level 1 to 5 in real time based on your performance — never too easy, never crushing."
    },
    {
        icon: Brain,
        title: "Focus Mode",
        desc: "Skip a question and the engine locks onto that topic, drilling deeper until you master your weak spots."
    },
    {
        icon: Zap,
        title: "Lifeline Protection",
        desc: "One strategic skip per session lets you bypass a brutal question without hurting your progression."
    },
    {
        icon: BarChart3,
        title: "Interview DNA Report",
        desc: "Post-session diagnostics with a topic-by-topic skill matrix, AI insights, and full solution walkthroughs."
    },
    {
        icon: ShieldCheck,
        title: "Multi-Domain Banks",
        desc: "Curated question banks across IT, Finance, HR and Marketing — practice for the role you actually want."
    },
    {
        icon: Sparkles,
        title: "Instant Feedback",
        desc: "Every answer is verified immediately with clear explanations, so mistakes become lessons on the spot."
    }
]

const steps = [
    { num: "01", title: "Configure", desc: "Pick your domain, difficulty and session length with the interactive gauge." },
    { num: "02", title: "Simulate", desc: "Face a timed, adaptive interview that responds to every answer you give." },
    { num: "03", title: "Analyze", desc: "Decode your Interview DNA report and turn weaknesses into strengths." }
]

export default function Home() {
    return (
        <div className="flex flex-col min-h-screen bg-slate-950 text-white overflow-x-hidden">
            {/* Navbar */}
            <motion.header
                initial={{ y: -60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="fixed top-0 inset-x-0 z-50 px-6 lg:px-12 h-16 flex items-center justify-between backdrop-blur-xl bg-slate-950/60 border-b border-white/5"
            >
                <Link className="flex items-center gap-2 font-bold text-xl" href="/">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
                        <Target className="h-4 w-4" />
                    </span>
                    Emtihaan
                </Link>
                <nav className="flex items-center gap-3">
                    <Link href="/login">
                        <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/10">Login</Button>
                    </Link>
                    <Link href="/signup">
                        <Button className="bg-white text-slate-900 hover:bg-slate-200 font-semibold">Get Started</Button>
                    </Link>
                </nav>
            </motion.header>

            {/* Hero — full viewport */}
            <section className="relative min-h-screen flex flex-col items-center justify-center px-6 bg-grid-dark">
                {/* Floating gradient orbs */}
                <motion.div
                    aria-hidden
                    className="absolute top-1/4 -left-32 h-96 w-96 rounded-full bg-violet-600/30 blur-3xl"
                    animate={{ y: [0, 40, 0], x: [0, 20, 0] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    aria-hidden
                    className="absolute bottom-1/4 -right-32 h-96 w-96 rounded-full bg-indigo-600/30 blur-3xl"
                    animate={{ y: [0, -40, 0], x: [0, -20, 0] }}
                    transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    aria-hidden
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[28rem] w-[28rem] rounded-full bg-fuchsia-600/10 blur-3xl"
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                />

                <div className="relative z-10 max-w-4xl text-center space-y-8">
                    <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-slate-300 backdrop-blur"
                    >
                        <Sparkles className="h-4 w-4 text-yellow-400" />
                        AI-powered adaptive interview engine
                    </motion.div>

                    <motion.h1 variants={fadeUp} initial="hidden" animate="visible" custom={1}
                        className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05]"
                    >
                        Master Your
                        <span className="block bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent animate-gradient-x">
                            Interview Skills
                        </span>
                    </motion.h1>

                    <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={2}
                        className="mx-auto max-w-2xl text-lg md:text-xl text-slate-400"
                    >
                        Practice with an adaptive AI that scales to your level, hunts down your weak
                        topics, and hands you a complete diagnostic report after every session.
                    </motion.p>

                    <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <Link href="/signup">
                            <Button size="lg" className="h-14 px-8 text-lg font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-indigo-900/50 transition-all hover:scale-105 active:scale-95">
                                Start Practicing Free
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <Link href="/login">
                            <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white">
                                I have an account
                            </Button>
                        </Link>
                    </motion.div>

                    {/* Quick stats */}
                    <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4}
                        className="grid grid-cols-3 gap-6 pt-10 max-w-xl mx-auto"
                    >
                        {[
                            { value: "5", label: "Difficulty Levels" },
                            { value: "4", label: "Career Domains" },
                            { value: "∞", label: "Practice Sessions" }
                        ].map((s) => (
                            <div key={s.label} className="text-center">
                                <div className="text-3xl font-extrabold bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">{s.value}</div>
                                <div className="text-xs text-slate-500 uppercase tracking-widest mt-1">{s.label}</div>
                            </div>
                        ))}
                    </motion.div>
                </div>

                {/* Scroll hint */}
                <motion.div
                    aria-hidden
                    className="absolute bottom-8 text-slate-500"
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                >
                    <ChevronDown className="h-6 w-6" />
                </motion.div>
            </section>

            {/* Features */}
            <section className="relative py-24 lg:py-32 px-6 lg:px-12">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-16 space-y-4"
                    >
                        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
                            Built to make you{" "}
                            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">unshakeable</span>
                        </h2>
                        <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                            Every feature is designed around one goal: walking into your real interview with zero surprises.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((f, i) => (
                            <motion.div
                                key={f.title}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.5, delay: (i % 3) * 0.1 }}
                                whileHover={{ y: -6 }}
                                className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur transition-colors hover:border-violet-500/40 hover:bg-white/[0.06]"
                            >
                                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20 group-hover:scale-110 transition-transform">
                                    <f.icon className="h-6 w-6 text-violet-400" />
                                </div>
                                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="relative py-24 px-6 lg:px-12 border-t border-white/5">
                <div className="max-w-5xl mx-auto">
                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center text-3xl md:text-4xl font-extrabold tracking-tight mb-16"
                    >
                        Three steps to interview confidence
                    </motion.h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {steps.map((s, i) => (
                            <motion.div
                                key={s.num}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.15 }}
                                className="relative text-center md:text-left"
                            >
                                <div className="text-6xl font-black text-white/5 mb-2">{s.num}</div>
                                <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">{s.title}</h3>
                                <p className="text-slate-400">{s.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="relative py-24 px-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="relative max-w-4xl mx-auto rounded-3xl overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-600 p-12 md:p-16 text-center"
                >
                    <motion.div
                        aria-hidden
                        className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-3xl"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <h2 className="relative text-3xl md:text-4xl font-extrabold mb-4">Your next interview starts now.</h2>
                    <p className="relative text-indigo-100 text-lg mb-8 max-w-xl mx-auto">
                        Stop rehearsing in your head. Start practicing against an engine that fights back.
                    </p>
                    <Link href="/signup" className="relative inline-block">
                        <Button size="lg" className="h-14 px-10 text-lg font-bold bg-white text-indigo-700 hover:bg-indigo-50 shadow-2xl transition-all hover:scale-105 active:scale-95">
                            Create Free Account
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </Link>
                </motion.div>
            </section>

            <footer className="py-8 px-6 border-t border-white/5 text-center">
                <p className="text-xs text-slate-500">© 2026 Emtihaan — AI Interview Platform. All rights reserved.</p>
            </footer>
        </div>
    )
}
