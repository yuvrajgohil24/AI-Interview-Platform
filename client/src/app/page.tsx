import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
    return (
        <div className="flex flex-col min-h-screen">
            <header className="px-4 lg:px-6 h-14 flex items-center border-b">
                <Link className="flex items-center justify-center font-bold text-xl" href="#">
                    Emtihaan
                </Link>
                <nav className="ml-auto flex gap-4 sm:gap-6">
                    <Link className="text-sm font-medium hover:underline underline-offset-4" href="/login">
                        Login
                    </Link>
                </nav>
            </header>
            <main className="flex-1">
                <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-black text-white">
                    <div className="container px-4 md:px-6">
                        <div className="flex flex-col items-center space-y-4 text-center">
                            <div className="space-y-2">
                                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                                    Master Your Interview Skills
                                </h1>
                                <p className="mx-auto max-w-[700px] text-gray-400 md:text-xl">
                                    Practice with our AI-powered adaptive interview platform. Get real-time feedback and detailed performance reports.
                                </p>
                            </div>
                            <div className="space-x-4">
                                <Link href="/signup">
                                    <Button className="bg-white text-black hover:bg-gray-200" size="lg">Get Started</Button>
                                </Link>
                                <Link href="/login">
                                    <Button variant="outline" size="lg" className="text-black border-black hover:bg-black hover:text-white">Login</Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
                <p className="text-xs text-gray-500">© 2024 AI Interview Platform. All rights reserved.</p>
            </footer>
        </div>
    )
}
