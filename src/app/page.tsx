import Link from "next/link";
import { Mic, Brain, Zap, Shield, TrendingUp, ChevronRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">AIview</span>
          <span className="text-[10px] text-indigo-400 font-semibold bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-800/50 ml-1">PrepPilot</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/auth" className="hidden sm:flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition">
            Sign In
          </Link>
          <Link
            href="/auth"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition shadow-lg shadow-indigo-600/30"
          >
            Get Started <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Background Glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[600px] h-40 bg-cyan-600/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-700/40 text-indigo-300 text-xs font-semibold mb-8">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Sub-500ms Edge AI Loop · PrepPilot Engine
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-[1.1] tracking-tight mb-6">
            Ace Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">
              Engineering Interview
            </span>
            {" "}with AI
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
            AIview simulates real placement interviews with live WPM tracking, STAR structure coaching,
            buzzword skepticism, and empathy scaffolding — built for Tier-2/3 engineering students.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth"
              id="hero-start-btn"
              className="flex items-center gap-2 px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base shadow-2xl shadow-indigo-600/40 transition active:scale-95"
            >
              <Mic className="w-5 h-5" />
              Start Free Mock Interview
            </Link>
            <Link
              href="/scorecard"
              className="flex items-center gap-2 px-8 py-4 rounded-xl border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-semibold text-base transition"
            >
              View Sample Scorecard <ChevronRight className="w-4 h-4" />
            </Link>
          </div>


        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Everything You Need to Crack Placements
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Built with real pilot data from 30 Tier-2/3 engineering students. Every feature is tuned to real interview failures.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              icon: <Mic className="w-5 h-5" />,
              color: "indigo",
              title: "Real-Time WPM Speedometer",
              desc: "Live cadence indicator benchmarks your delivery against the 130–160 WPM target zone for optimal interview pacing.",
            },
            {
              icon: <Zap className="w-5 h-5" />,
              color: "amber",
              title: "Vocal Filler Counter",
              desc: 'Dynamically flags "basically", "like", "actually" as you speak. Keeping fillers under 2/min boosts credibility.',
            },
            {
              icon: <TrendingUp className="w-5 h-5" />,
              color: "emerald",
              title: "STAR Structure Engine",
              desc: "Real-time visual confirmation as Situation, Task, Action, and Quantified Results are detected in your answer.",
            },
            {
              icon: <Brain className="w-5 h-5" />,
              color: "purple",
              title: "Buzzword Skepticism",
              desc: 'Probes unexplained terms like "Redis" and "microservices" to expose depth vs. buzzword padding in real-time.',
            },
            {
              icon: <Shield className="w-5 h-5" />,
              color: "cyan",
              title: "Empathy Scaffolding",
              desc: "Auto-triggers a supportive nudge after 4s of silence, reducing cognitive freeze without burning AI tokens.",
            },
            {
              icon: <Shield className="w-5 h-5" />,
              color: "rose",
              title: "5-Axis JD Scorecard",
              desc: "Post-interview composite score across Technical, STAR, Clarity, Role Relevance, and Behavioral dimensions.",
            },
          ].map((feat, i) => {
            const colorMap: Record<string, string> = {
              indigo: "bg-indigo-950/50 border-indigo-800/40 text-indigo-400",
              amber: "bg-amber-950/50 border-amber-800/40 text-amber-400",
              emerald: "bg-emerald-950/50 border-emerald-800/40 text-emerald-400",
              purple: "bg-purple-950/50 border-purple-800/40 text-purple-400",
              cyan: "bg-cyan-950/50 border-cyan-800/40 text-cyan-400",
              rose: "bg-rose-950/50 border-rose-800/40 text-rose-400",
            };
            return (
              <div
                key={i}
                className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-600 transition group"
              >
                <div className={`inline-flex p-2.5 rounded-lg border mb-4 ${colorMap[feat.color]}`}>
                  {feat.icon}
                </div>
                <h3 className="text-white font-bold text-base mb-2">{feat.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Tech Stack Strip */}
      <section className="border-y border-slate-800/60 bg-slate-900/30 py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs text-slate-500 uppercase tracking-widest font-semibold mb-8">Powered by</p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400 font-medium">
            {["Next.js 15 App Router", "Groq · Llama 3.3", "Claude Haiku", "Gemini Flash", "PostgreSQL + Prisma", "Whisper Edge ASR", "Zod v3"].map(
              (tech) => (
                <span key={tech} className="px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700">
                  {tech}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-700/40 text-emerald-300 text-xs font-semibold mb-6">
            ₹99 per session · No subscription required
          </div>
          <h2 className="text-4xl font-extrabold text-white mb-4">Ready to practice?</h2>
          <p className="text-slate-400 mb-8">Jump into a live mock interview right now. No sign-up needed to try the demo.</p>
          <Link
            href="/auth"
            id="cta-start-btn"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base shadow-2xl shadow-indigo-600/40 transition active:scale-95"
          >
            <Mic className="w-5 h-5" /> Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-8 px-6 text-center text-xs text-slate-600">
        <p>© 2026 AIview · PrepPilot Engine · Built for India&apos;s engineering students</p>
      </footer>
    </div>
  );
}
