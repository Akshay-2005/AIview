"use client";

import { useState } from "react";
import { Brain, ChevronRight, Loader2, Mic } from "lucide-react";

const COMPANIES = [
  { key: "TCS_DIGITAL", name: "TCS Digital", icon: "🔵" },
  { key: "ACCENTURE", name: "Accenture", icon: "🟣" },
  { key: "INFOSYS_SP", name: "Infosys SP", icon: "🟦" },
  { key: "COGNIZANT_GENC", name: "Cognizant GenC", icon: "🔷" },
  { key: "WIPRO_ELITE", name: "Wipro Elite", icon: "🟢" },
  { key: "CUSTOM", name: "Other / Custom", icon: "⚪" },
];

const TIERS = [
  { key: "TIER_1", label: "Tier 1 (IIT/NIT/BITS)" },
  { key: "TIER_2", label: "Tier 2 (State Govt. University)" },
  { key: "TIER_3", label: "Tier 3 (Private / Autonomous)" },
  { key: "OFF_CAMPUS_AUTONOMOUS", label: "Off-Campus / Distance" },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    collegeName: "",
    educationTier: "TIER_3",
    degree: "B.Tech Computer Science",
    graduationYear: 2026,
    targetCompanies: [] as string[],
    spokenComfortRating: 3,
    vernacularLanguage: "",
  });

  const toggleCompany = (key: string) => {
    setForm((f) => ({
      ...f,
      targetCompanies: f.targetCompanies.includes(key)
        ? f.targetCompanies.filter((c) => c !== key)
        : [...f.targetCompanies, key],
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const user = JSON.parse(localStorage.getItem("aiview_user") || "{}");
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("aiview_token")}`,
        },
        body: JSON.stringify({ ...form, userId: user.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save profile");
      // Update local user
      localStorage.setItem("aiview_user", JSON.stringify({ ...user, profileComplete: true }));
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-lg">AIview</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Let&apos;s calibrate your profile</h1>
          <p className="text-slate-400 text-sm mt-1">
            This helps AIview ask the right questions for your target role
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                  step >= s
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-500"
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div className={`w-12 h-0.5 ${step > s ? "bg-indigo-600" : "bg-slate-800"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl">

          {/* Step 1: College Info */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-white font-bold text-lg">Your College Background</h2>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">College / University Name</label>
                <input
                  type="text"
                  value={form.collegeName}
                  onChange={(e) => setForm({ ...form, collegeName: e.target.value })}
                  placeholder="e.g. VIT Vellore, RGPV Bhopal"
                  className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">College Tier</label>
                <div className="grid grid-cols-1 gap-2">
                  {TIERS.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setForm({ ...form, educationTier: t.key })}
                      className={`px-4 py-2.5 rounded-lg border text-sm text-left transition ${
                        form.educationTier === t.key
                          ? "bg-indigo-950/60 border-indigo-600 text-white"
                          : "bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-500"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Degree</label>
                  <input
                    type="text"
                    value={form.degree}
                    onChange={(e) => setForm({ ...form, degree: e.target.value })}
                    placeholder="B.Tech CSE"
                    className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Graduation Year</label>
                  <select
                    value={form.graduationYear}
                    onChange={(e) => setForm({ ...form, graduationYear: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 transition"
                  >
                    {[2024, 2025, 2026, 2027, 2028].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Target Companies */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-white font-bold text-lg">Target Companies</h2>
              <p className="text-slate-400 text-sm">Select all companies you&apos;re preparing for (multi-select)</p>

              <div className="grid grid-cols-2 gap-3">
                {COMPANIES.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => toggleCompany(c.key)}
                    className={`px-4 py-3 rounded-xl border text-sm font-semibold text-left flex items-center gap-2 transition ${
                      form.targetCompanies.includes(c.key)
                        ? "bg-indigo-950/60 border-indigo-600 text-white"
                        : "bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    <span className="text-base">{c.icon}</span>
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>

              {form.targetCompanies.length === 0 && (
                <p className="text-xs text-amber-400">Please select at least one company</p>
              )}
            </div>
          )}

          {/* Step 3: Speaking Comfort */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-white font-bold text-lg">Speaking Confidence</h2>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">
                  How comfortable are you speaking in English interviews?
                </label>
                <div className="space-y-2">
                  {[
                    { val: 1, label: "Very uncomfortable — I freeze often" },
                    { val: 2, label: "Uncomfortable — I struggle with fluency" },
                    { val: 3, label: "Neutral — I manage but have fillers" },
                    { val: 4, label: "Comfortable — I speak reasonably well" },
                    { val: 5, label: "Very confident — I speak clearly and fluently" },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setForm({ ...form, spokenComfortRating: opt.val })}
                      className={`w-full px-4 py-3 rounded-lg border text-sm text-left flex items-center gap-3 transition ${
                        form.spokenComfortRating === opt.val
                          ? "bg-indigo-950/60 border-indigo-600 text-white"
                          : "bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-500"
                      }`}
                    >
                      <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold shrink-0">
                        {opt.val}
                      </span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Primary Vernacular Language (optional)
                </label>
                <input
                  type="text"
                  value={form.vernacularLanguage}
                  onChange={(e) => setForm({ ...form, vernacularLanguage: e.target.value })}
                  placeholder="e.g. Hindi, Tamil, Telugu"
                  className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500 transition"
                />
                <p className="text-xs text-slate-600 mt-1">Helps AIview adapt its empathy scaffolding style</p>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-700/50 text-rose-300 text-sm">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Nav buttons */}
          <div className="flex items-center justify-between mt-8">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                className="px-5 py-2.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white text-sm font-semibold transition"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 1 && !form.collegeName.trim()) { setError("Please enter your college name"); return; }
                  if (step === 2 && form.targetCompanies.length === 0) { setError("Please select at least one company"); return; }
                  setError("");
                  setStep((s) => (s + 1) as 1 | 2 | 3);
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition shadow-lg shadow-indigo-600/30"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                id="onboarding-submit-btn"
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-bold transition shadow-lg shadow-emerald-600/30"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <Mic className="w-4 h-4" />
                {loading ? "Saving..." : "Start Practicing"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
