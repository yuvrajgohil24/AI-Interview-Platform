"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Target, Sparkles, ArrowRight } from "lucide-react"

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")
        try {
            const res = await api.post("/auth/login", { email, password })
            localStorage.setItem("token", res.data.token)
            localStorage.setItem("user", JSON.stringify(res.data.user))
            router.push("/dashboard")
        } catch (err: any) {
            setError(err.response?.data?.error || "Login failed")
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Brand panel — full-height animated gradient */}
            <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-violet-700 via-indigo-700 to-slate-900 p-12 text-white">
                <motion.div
                    aria-hidden
                    className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-fuchsia-500/20 blur-3xl"
                    animate={{ y: [0, 40, 0] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    aria-hidden
                    className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl"
                    animate={{ y: [0, -40, 0] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                />

                <Link href="/" className="relative z-10 flex items-center gap-2 font-bold text-2xl">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
                        <Target className="h-5 w-5" />
                    </span>
                    Emtihaan
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="relative z-10 space-y-6"
                >
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm backdrop-blur">
                        <Sparkles className="h-4 w-4 text-yellow-300" />
                        Welcome back, challenger
                    </div>
                    <h1 className="text-4xl xl:text-5xl font-extrabold leading-tight">
                        Pick up where<br />you left off.
                    </h1>
                    <p className="text-indigo-200 text-lg max-w-md">
                        Your adaptive interview engine remembers your level. Jump back in and keep climbing.
                    </p>
                </motion.div>

                <p className="relative z-10 text-sm text-indigo-300">© 2026 Emtihaan</p>
            </div>

            {/* Form panel */}
            <div className="flex items-center justify-center p-8 bg-slate-50">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full max-w-md space-y-8"
                >
                    <div className="space-y-2">
                        <Link href="/" className="lg:hidden flex items-center gap-2 font-bold text-xl text-indigo-600 mb-6">
                            <Target className="h-6 w-6" /> Emtihaan
                        </Link>
                        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Login</h2>
                        <p className="text-slate-500">Enter your credentials to access your account.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-1.5">
                            <label htmlFor="email" className="text-sm font-semibold text-slate-700">Email</label>
                            <Input id="email" className="h-12" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</label>
                            <Input id="password" className="h-12" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>

                        {error && (
                            <motion.p
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-red-500 text-sm font-medium"
                            >
                                {error}
                            </motion.p>
                        )}

                        <Button className="w-full h-12 text-base font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all hover:scale-[1.02] active:scale-[0.98]" type="submit" disabled={loading}>
                            {loading ? "Signing in..." : <>Login <ArrowRight className="ml-2 h-4 w-4" /></>}
                        </Button>
                    </form>

                    <p className="text-sm text-slate-500 text-center">
                        Don&apos;t have an account?{" "}
                        <Link href="/signup" className="font-semibold text-indigo-600 hover:text-indigo-500 underline-offset-4 hover:underline">Sign up</Link>
                    </p>
                </motion.div>
            </div>
        </div>
    )
}
