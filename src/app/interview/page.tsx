import ActiveInterviewConsole from "@/components/interview/ActiveInterviewConsole";
import { Brain } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Interview Session — AIview PrepPilot",
  description: "Real-time AI mock interview console with WPM tracking, STAR coaching, and empathy scaffolding.",
};

export default function InterviewPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Top Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Brain className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-white font-bold tracking-tight">AIview</span>
        </Link>
        <span className="text-xs text-slate-500">Powered by PrepPilot Engine</span>
      </nav>

      {/* Console */}
      <div className="max-w-5xl mx-auto py-8 px-4">
        <ActiveInterviewConsole />
      </div>
    </div>
  );
}
