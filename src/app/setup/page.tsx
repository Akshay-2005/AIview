"use client";

import { useState } from "react";
import { Brain, ChevronRight, FileText, Loader2, Mic } from "lucide-react";
import Link from "next/link";

const COMPANIES = [
  { key: "TCS_DIGITAL", name: "TCS Digital", icon: "🔵", role: "Associate Software Engineer" },
  { key: "ACCENTURE", name: "Accenture ASE", icon: "🟣", role: "Associate Software Engineer" },
  { key: "INFOSYS_SP", name: "Infosys SP", icon: "🟦", role: "Systems Engineer" },
  { key: "COGNIZANT_GENC", name: "Cognizant GenC", icon: "🔷", role: "Programmer Analyst" },
  { key: "WIPRO_ELITE", name: "Wipro Elite", icon: "🟢", role: "Project Engineer" },
  { key: "CUSTOM", name: "Custom / Other", icon: "⚪", role: "Software Engineer" },
];

export default function SetupPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<typeof COMPANIES[0] | null>(null);
  const [jdText, setJdText] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [customRole, setCustomRole] = useState("");

  const handleLaunch = async () => {
    setLoading(true);
    setError("");
    try {
      const user = JSON.parse(localStorage.getItem("aiview_user") || "{}");
      // Store setup context for the interview page
      const setupData = {
        company: selectedCompany?.key || "CUSTOM",
        companyName: selectedCompany?.name || "Custom",
        role: customRole || selectedCompany?.role || "Software Engineer",
        jdText: jdText.trim(),
        resumeText: resumeText.trim(),
        userId: user.id,
        sessionId: crypto.randomUUID(),
        startedAt: new Date().toISOString(),
      };
      localStorage.setItem("aiview_current_session", JSON.stringify(setupData));
      window.location.href = "/interview/live";
    } catch {
      setError("Failed to start session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60 bg-slate-950/90 backdrop-blur-xl sticky top-0 z-40">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Brain className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-white font-bold tracking-tight">AIview</span>
        </Link>
        <span className="text-xs text-slate-500">Interview Setup</span>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-10 justify-center">
          {[
            { n: 1, label: "Company" },
            { n: 2, label: "Job Description" },
            { n: 3, label: "Your Resume" },
          ].map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition ${
                  step >= s.n ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-500"
                }`}>
                  {s.n}
                </div>
                <span className={`text-[10px] font-medium ${step >= s.n ? "text-indigo-400" : "text-slate-600"}`}>
                  {s.label}
                </span>
              </div>
              {i < 2 && <div className={`w-16 h-0.5 mb-5 ${step > s.n ? "bg-indigo-600" : "bg-slate-800"}`} />}
            </div>
          ))}
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl">

          {/* Step 1: Select Company */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-white font-bold text-xl mb-1">Which company are you preparing for?</h2>
                <p className="text-slate-400 text-sm">AIview will tailor questions to match that company&apos;s actual interview pattern</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {COMPANIES.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setSelectedCompany(c)}
                    className={`px-4 py-4 rounded-xl border text-left flex items-center gap-3 transition ${
                      selectedCompany?.key === c.key
                        ? "bg-indigo-950/60 border-indigo-600 text-white"
                        : "bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    <span className="text-xl">{c.icon}</span>
                    <div>
                      <div className="font-semibold text-sm">{c.name}</div>
                      <div className="text-xs text-slate-500">{c.role}</div>
                    </div>
                  </button>
                ))}
              </div>

              {selectedCompany?.key === "CUSTOM" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Custom Role Title
                  </label>
                  <input
                    type="text"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    placeholder="e.g. Backend Engineer, Data Analyst"
                    className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 2: JD */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-white font-bold text-xl mb-1">Paste the Job Description</h2>
                <p className="text-slate-400 text-sm">
                  Copy the JD from the company&apos;s website. AIview will extract required skills and tailor questions.
                  {jdText.length === 0 && " (You can skip this and use a generic template)"}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Job Description Text
                  </label>
                  <span className={`text-xs ${jdText.length > 7000 ? "text-rose-400" : "text-slate-600"}`}>
                    {jdText.length}/8000
                  </span>
                </div>
                <textarea
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  rows={12}
                  maxLength={8000}
                  placeholder={`Paste the full job description here...\n\nExample:\nRole: Associate Software Engineer\nSkills Required: Java, Spring Boot, SQL, REST APIs, Git\nResponsibilities:\n- Develop and maintain backend microservices\n- Write unit tests and participate in code reviews\n...`}
                  className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500 transition resize-none font-mono"
                />
              </div>

              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-950/30 border border-amber-700/30">
                <FileText className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300">
                  <strong>Tip:</strong> The more detailed the JD, the more targeted your interview. Include skills, responsibilities, and qualifications.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Resume */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-white font-bold text-xl mb-1">Paste your Resume</h2>
                <p className="text-slate-400 text-sm">
                  AIview will use your resume to generate resume-trap questions and identify buzzwords to probe.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Resume Text
                  </label>
                  <span className={`text-xs ${resumeText.length > 5000 ? "text-rose-400" : "text-slate-600"}`}>
                    {resumeText.length}/6000
                  </span>
                </div>
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  rows={14}
                  maxLength={6000}
                  placeholder={`Paste your resume text here...\n\nExample:\nRahul Sharma | rahul@email.com | github.com/rahul\n\nEDUCATION\nB.Tech Computer Science, RGPV Bhopal (2022-2026), CGPA: 7.8\n\nPROJECTS\nE-Commerce Portal (Team of 3)\n- Built REST APIs using Spring Boot with Redis caching\n- Deployed on AWS EC2, handled 200+ concurrent users\n\nSKILLS: Java, Python, SQL, Spring Boot, Redis, Git, REST APIs`}
                  className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500 transition resize-none font-mono"
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-700/50 text-rose-300 text-sm">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            {step > 1 ? (
              <button
                onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                className="px-5 py-2.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white text-sm font-semibold transition"
              >
                Back
              </button>
            ) : (
              <Link href="/dashboard" className="px-5 py-2.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white text-sm font-semibold transition">
                Cancel
              </Link>
            )}

            {step < 3 ? (
              <button
                onClick={() => {
                  if (step === 1 && !selectedCompany) { setError("Please select a company"); return; }
                  setError("");
                  setStep((s) => (s + 1) as 1 | 2 | 3);
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition shadow-lg shadow-indigo-600/30"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleLaunch}
                disabled={loading}
                id="setup-launch-btn"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold text-sm transition shadow-lg shadow-emerald-600/30"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
                {loading ? "Preparing..." : "Launch Interview"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
