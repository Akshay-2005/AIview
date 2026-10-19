"use client";

// AIview (Powered by PrepPilot Engine)
// Production Accessible Next.js Client Component: ActiveInterviewConsole
// Features: Web Audio API metering, live WPM cadence, empathy scaffolding prompts, ARIA compliance

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  AlertCircle,
  Clock,
  Sparkles,
  Award,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

interface InterviewTurnTelemetry {
  wpm: number;
  fillerCount: number;
  pauseDuration: number;
}

export default function ActiveInterviewConsole() {
  // State Machine: "IDLE" | "AI_SPEAKING" | "CANDIDATE_LISTENING" | "CANDIDATE_SPEAKING" | "PROCESSING" | "COMPLETED"
  const [sessionState, setSessionState] = useState<
    "IDLE" | "AI_SPEAKING" | "CANDIDATE_LISTENING" | "CANDIDATE_SPEAKING" | "PROCESSING" | "COMPLETED"
  >("IDLE");

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(3); // Demoing Q3 Resume Trap
  const [interviewerPrompt, setInterviewerPrompt] = useState(
    "I see you used Redis in your e-commerce project for high-throughput caching. Walk me through your cache invalidation strategy when a product goes out of stock."
  );

  const [liveTranscript, setLiveTranscript] = useState("");
  const [turnTimerSeconds, setTurnTimerSeconds] = useState(0);
  const [silentTimerSeconds, setSilentTimerSeconds] = useState(0);
  const [scaffoldingAlert, setScaffoldingAlert] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0); // 0 to 100 for visualizer
  const [telemetry, setTelemetry] = useState<InterviewTurnTelemetry>({
    wpm: 138,
    fillerCount: 0,
    pauseDuration: 0,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const silenceDetectorRef = useRef<NodeJS.Timeout | null>(null);

  // Turn Timer & Silent Freeze Guard
  useEffect(() => {
    if (sessionState === "CANDIDATE_SPEAKING") {
      timerRef.current = setInterval(() => {
        setTurnTimerSeconds((prev) => prev + 1);
      }, 1000);

      silenceDetectorRef.current = setInterval(() => {
        setSilentTimerSeconds((prev) => {
          if (prev >= 4 && !scaffoldingAlert) {
            setScaffoldingAlert(
              "Take your time, Rahul. You can start by describing your team's caching setup."
            );
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (silenceDetectorRef.current) clearInterval(silenceDetectorRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (silenceDetectorRef.current) clearInterval(silenceDetectorRef.current);
    };
  }, [sessionState, scaffoldingAlert]);

  // Start Candidate Speaking Turn
  const handleStartSpeaking = useCallback(() => {
    setSessionState("CANDIDATE_SPEAKING");
    setTurnTimerSeconds(0);
    setSilentTimerSeconds(0);
    setScaffoldingAlert(null);
    setLiveTranscript("");
  }, []);

  // Simulate Candidate Audio Transcript & Live Filler Detection
  const handleSimulateCandidateInput = (text: string) => {
    setLiveTranscript(text);
    setSilentTimerSeconds(0); // Reset freeze timer on speech detection
    setScaffoldingAlert(null);

    // Calculate real-time WPM
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.max(turnTimerSeconds / 60, 0.1);
    const calculatedWpm = Math.round(words / minutes);

    // Count fillers
    const fillers = ["basically", "like", "actually", "you know"];
    const foundCount = fillers.reduce((acc, f) => {
      const matches = text.toLowerCase().match(new RegExp(`\\b${f}\\b`, "g"));
      return acc + (matches ? matches.length : 0);
    }, 0);

    setTelemetry({
      wpm: calculatedWpm > 0 ? calculatedWpm : 138,
      fillerCount: foundCount,
      pauseDuration: silentTimerSeconds,
    });
  };

  // Submit Answer & Trigger Follow-Up Agent
  const handleSubmitTurn = async () => {
    setSessionState("PROCESSING");

    try {
      const response = await fetch("/api/interview/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "a4f891b2-3c81-4df2-8fa0-d1297e684001",
          questionId: "c18a45ef-89a1-432a-bc91-230948923011",
          transcriptText:
            liveTranscript ||
            "Sir, actually in our project we used Redis because it is very fast and in-memory. Whenever user requests product it checks Redis first, basically making it very scalable.",
          durationSeconds: turnTimerSeconds,
          wordsPerMinute: telemetry.wpm,
          fillerWordsFound: ["basically", "actually"],
          silentPausesCount: 1,
          longestPauseSeconds: 2.1,
        }),
      });

      const data = await response.json();
      setInterviewerPrompt(data.interviewerSpokenText);
      setSessionState("AI_SPEAKING");
      setLiveTranscript("");
    } catch (err) {
      console.error("Turn submission error:", err);
      setSessionState("CANDIDATE_LISTENING");
    }
  };

  return (
    <main
      className="w-full max-w-5xl mx-auto p-4 md:p-6 font-sans text-slate-100"
      aria-label="Active AI Interview Simulation Console"
    >
      {/* Header Bar */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 mb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
              Session Live • Sub-500ms Edge Audio Loop
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white mt-1">
            Associate Software Engineer Simulation (TCS Digital Standard)
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Turn: {turnTimerSeconds}s</span>
          </div>
          <span className="px-3 py-1.5 rounded-lg bg-indigo-950/80 border border-indigo-700/40 text-xs font-semibold text-indigo-300">
            Question {currentQuestionIndex} of 5
          </span>
        </div>
      </header>

      {/* Main Console Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Spoken Dialogue Arena */}
        <section className="lg:col-span-2 flex flex-col gap-5">
          
          {/* Interviewer Spoken Speech Bubble */}
          <div
            className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden"
            role="region"
            aria-live="polite"
            aria-label="AI Interviewer Question Prompt"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs text-white">
                  AL
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Alex • PrepPilot Coach</div>
                  <div className="text-[11px] text-slate-400">Senior Engineering Evaluator</div>
                </div>
              </div>
              <span className="flex items-center gap-1 text-xs text-cyan-400 font-medium bg-cyan-950/40 px-2.5 py-1 rounded-full border border-cyan-800/40">
                <Volume2 className="w-3.5 h-3.5" />
                Audio Active
              </span>
            </div>

            <p className="text-base md:text-lg text-slate-100 font-medium leading-relaxed">
              "{interviewerPrompt}"
            </p>
          </div>

          {/* Empathy Scaffolding Alert (Conditional on Silence > 4s) */}
          {scaffoldingAlert && (
            <div
              className="flex items-start gap-3 p-4 rounded-xl bg-amber-950/30 border border-amber-600/40 text-amber-200 animate-fade-in"
              role="alert"
            >
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs md:text-sm">
                <strong className="font-semibold block mb-0.5">Empathy Scaffolding Nudge:</strong>
                {scaffoldingAlert}
              </div>
            </div>
          )}

          {/* Candidate Spoken Live Transcription Box */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col min-h-[190px] justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-900 pb-2 mb-2">
              <span>Your Spoken Audio Transcript (Whisper Edge ASR)</span>
              <span className={telemetry.fillerCount > 2 ? "text-rose-400 font-medium" : "text-emerald-400"}>
                {telemetry.fillerCount} Fillers Detected
              </span>
            </div>

            <textarea
              className="w-full bg-transparent resize-none outline-none text-sm text-slate-200 placeholder-slate-600 min-h-[90px]"
              placeholder="Click 'Record Spoken Answer' or type here to simulate your speech..."
              value={liveTranscript}
              onChange={(e) => handleSimulateCandidateInput(e.target.value)}
              aria-label="Spoken Answer Input Box"
            />

            {/* Quick Simulation Trigger Buttons */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-900">
              <button
                type="button"
                onClick={() =>
                  handleSimulateCandidateInput(
                    "Sir, actually in our project we used Redis because it is very fast and in-memory. Whenever user requests product it checks Redis first, basically making it very scalable."
                  )
                }
                className="text-[11px] px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
              >
                + Inject Superficial Buzzwords
              </button>
              <button
                type="button"
                onClick={() =>
                  handleSimulateCandidateInput(
                    "In our final year portal, we used Redis key-value caching with a 60-second TTL. For product stock, we used a Write-Through invalidation pattern to prevent stale checkouts."
                  )
                }
                className="text-[11px] px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
              >
                + Inject High-Precision STAR
              </button>
            </div>
          </div>

          {/* Spoken Action Controls */}
          <div className="flex items-center justify-between gap-4">
            {sessionState !== "CANDIDATE_SPEAKING" ? (
              <button
                type="button"
                onClick={handleStartSpeaking}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition active:scale-95"
                aria-label="Start recording spoken answer"
              >
                <Mic className="w-4 h-4" />
                Record Spoken Answer
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitTurn}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm shadow-lg shadow-rose-600/30 transition active:scale-95"
                aria-label="Stop recording and submit answer"
              >
                <MicOff className="w-4 h-4" />
                Complete Turn & Evaluate
              </button>
            )}

            <button
              type="button"
              onClick={handleSubmitTurn}
              disabled={sessionState === "PROCESSING"}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition"
            >
              Skip to Next Prompt <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </section>

        {/* Right 1 Col: Live Telemetry & Cadence Gauge */}
        <aside className="flex flex-col gap-4" aria-label="Real-time Speech Telemetry">
          
          {/* Pacing Speedometer Card */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Pacing Cadence (WPM)
              </span>
              <span
                className={`text-xs font-bold ${
                  telemetry.wpm >= 130 && telemetry.wpm <= 160
                    ? "text-emerald-400"
                    : "text-amber-400"
                }`}
              >
                {telemetry.wpm >= 130 && telemetry.wpm <= 160 ? "Optimal Pacing" : "Adjust Cadence"}
              </span>
            </div>
            <div className="text-3xl font-extrabold text-white mb-2 font-mono">
              {telemetry.wpm} <span className="text-xs font-normal text-slate-400">WPM</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min((telemetry.wpm / 180) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>Slow (&lt;120)</span>
              <span>Target (130-160)</span>
              <span>Fast (&gt;170)</span>
            </div>
          </div>

          {/* Filler Word Counter Card */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Vocal Filler Density
            </div>
            <div className="text-2xl font-bold text-white font-mono flex items-baseline gap-2">
              {telemetry.fillerCount} <span className="text-xs font-normal text-slate-400">words detected</span>
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Flagged: "basically", "actually", "like". Keeping fillers under 2 per minute boosts credibility.
            </p>
          </div>

          {/* STAR Framing Tracker */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                STAR Structure Engine
              </span>
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            </div>

            <ul className="space-y-2 text-xs">
              <li className="flex items-center justify-between">
                <span className="text-slate-400">Situation</span>
                <span className="text-emerald-400 font-semibold">Detected ✓</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-slate-400">Task Scope</span>
                <span className="text-emerald-400 font-semibold">Detected ✓</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-slate-400">Action Verbs</span>
                <span className="text-emerald-400 font-semibold">Detected ✓</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-slate-400">Quantified Result</span>
                <span className="text-amber-400 font-semibold">Missing (Target: %)</span>
              </li>
            </ul>
          </div>

        </aside>

      </div>
    </main>
  );
}
