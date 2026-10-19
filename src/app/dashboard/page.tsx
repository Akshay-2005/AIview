"use client";

import { useEffect, useState } from "react";
import { Brain, Mic, FileText, TrendingUp, Clock, ChevronRight, LogOut, Plus, Award } from "lucide-react";
import Link from "next/link";

interface User {
  id: string;
  name: string;
  email: string;
  profileComplete: boolean;
}

interface Session {
  id: string;
  company: string;
  role: string;
  score: number;
  tier: string;
  date: string;
  duration: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("aiview_user");
    if (!stored) { window.location.href = "/auth"; return; }
    const u = JSON.parse(stored);
    setUser(u);
    if (!u.profileComplete) { window.location.href = "/onboarding"; return; }

    // Load sessions from localStorage
    const storedSessions = localStorage.getItem("aiview_sessions");
    if (storedSessions) setSessions(JSON.parse(storedSessions));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("aiview_token");
    localStorage.removeItem("aiview_user");
    window.location.href = "/auth";
  };

  if (!user) return null;

  const avgScore = sessions.length > 0
    ? Math.round(sessions.reduce((sum, s) => sum + s.score, 0) / sessions.length)
    : null;

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60 bg-slate-950/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold tracking-tight">AIview</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-400 text-sm hidden sm:block">
            Hey, <span className="text-white font-semibold">{user.name.split(" ")[0]}</span> 👋
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* Welcome + Start CTA */}
        <div className="relative p-8 rounded-2xl bg-gradient-to-br from-indigo-950/80 to-purple-950/60 border border-indigo-800/40 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl" />
          <div className="relative">
            <h1 className="text-2xl font-bold text-white mb-1">
              Welcome back, {user.name.split(" ")[0]}!
            </h1>
            <p className="text-slate-400 text-sm mb-6">
              {sessions.length === 0
                ? "You haven't done any mock interviews yet. Start your first one!"
                : `You've completed ${sessions.length} mock interview${sessions.length > 1 ? "s" : ""}. Keep going!`}
            </p>
            <Link
              href="/setup"
              id="dashboard-start-btn"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition"
            >
              <Plus className="w-4 h-4" /> New Mock Interview
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Interviews", value: sessions.length || 0, icon: <Mic className="w-4 h-4" />, color: "indigo" },
            { label: "Avg Score", value: avgScore ? `${avgScore}/100` : "—", icon: <TrendingUp className="w-4 h-4" />, color: "emerald" },
            { label: "Best Score", value: sessions.length > 0 ? `${Math.max(...sessions.map(s => s.score))}/100` : "—", icon: <Award className="w-4 h-4" />, color: "amber" },
            { label: "Practice Time", value: sessions.length > 0 ? `${sessions.length * 15}m` : "0m", icon: <Clock className="w-4 h-4" />, color: "purple" },
          ].map((stat, i) => (
            <div key={i} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className={`inline-flex p-2 rounded-lg mb-3 ${
                stat.color === "indigo" ? "bg-indigo-950/60 text-indigo-400" :
                stat.color === "emerald" ? "bg-emerald-950/60 text-emerald-400" :
                stat.color === "amber" ? "bg-amber-950/60 text-amber-400" :
                "bg-purple-950/60 text-purple-400"
              }`}>
                {stat.icon}
              </div>
              <div className="text-2xl font-bold text-white mb-0.5">{stat.value}</div>
              <div className="text-xs text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Past Sessions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-lg">Past Interviews</h2>
            {sessions.length > 0 && (
              <Link href="/setup" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                New interview <ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </div>

          {sessions.length === 0 ? (
            <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800 border-dashed text-center">
              <Mic className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No interviews yet</p>
              <p className="text-slate-600 text-xs mt-1">Complete your first mock to see results here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-600 transition">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-950/60 border border-indigo-800/40 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <div className="text-white font-semibold text-sm">{s.role}</div>
                      <div className="text-xs text-slate-500">{s.company} · {s.date} · {s.duration}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`text-lg font-bold ${
                      s.score >= 80 ? "text-emerald-400" :
                      s.score >= 65 ? "text-indigo-400" :
                      s.score >= 50 ? "text-amber-400" : "text-rose-400"
                    }`}>
                      {s.score}/100
                    </div>
                    <Link
                      href={`/scorecard?session=${s.id}`}
                      className="text-xs text-slate-500 hover:text-white flex items-center gap-1 transition"
                    >
                      View <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
