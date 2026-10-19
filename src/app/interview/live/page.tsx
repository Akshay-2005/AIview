"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic, MicOff, Volume2, AlertCircle, Clock, Sparkles, ChevronRight, Brain, Loader2,
} from "lucide-react";
import Link from "next/link";

interface SessionSetup {
  company: string;
  companyName: string;
  role: string;
  jdText: string;
  resumeText: string;
  userId: string;
  sessionId: string;
  startedAt: string;
}

interface Telemetry {
  wpm: number;
  fillerCount: number;
  silentSeconds: number;
}

const FILLER_WORDS = ["basically", "like", "actually", "you know", "um", "uh", "so", "right", "okay"];

export default function LiveInterviewPage() {
  const [setup, setSetup] = useState<SessionSetup | null>(null);
  const [state, setState] = useState<"LOADING" | "AI_SPEAKING" | "LISTENING" | "RECORDING" | "PROCESSING" | "DONE">("LOADING");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions] = useState(5);
  const [aiPrompt, setAiPrompt] = useState("");
  const [transcript, setTranscript] = useState("");
  const [scaffolding, setScaffolding] = useState<string | null>(null);
  const [telemetry, setTelemetry] = useState<Telemetry>({ wpm: 0, fillerCount: 0, silentSeconds: 0 });
  const [turnTimer, setTurnTimer] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<{ role: string; content: string }[]>([]);
  const [starStatus, setStarStatus] = useState({ S: false, T: false, A: false, R: false });

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const silenceRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Load session setup from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("aiview_current_session");
    if (!stored) { window.location.href = "/setup"; return; }
    const s: SessionSetup = JSON.parse(stored);
    setSetup(s);
    startSession(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startSession = async (s: SessionSetup) => {
    setState("LOADING");
    try {
      const res = await fetch("/api/interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: s.sessionId,
          company: s.company,
          role: s.role,
          jdText: s.jdText,
          resumeText: s.resumeText,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to start");
      setAiPrompt(data.openingQuestion);
      setHistory([{ role: "assistant", content: data.openingQuestion }]);
      setQuestionIndex(1);
      setState("AI_SPEAKING");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to connect to AI. Check your API key.");
      setState("DONE");
    }
  };

  // Turn timer
  useEffect(() => {
    if (state === "RECORDING") {
      timerRef.current = setInterval(() => setTurnTimer((t) => t + 1), 1000);
      silenceRef.current = setInterval(() => {
        setTelemetry((t) => {
          const newSilent = t.silentSeconds + 1;
          if (newSilent >= 4 && !scaffolding) {
            setScaffolding("Take your time. Start with: 'In my project, I worked on...'");
          }
          return { ...t, silentSeconds: newSilent };
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (silenceRef.current) clearInterval(silenceRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (silenceRef.current) clearInterval(silenceRef.current);
    };
  }, [state, scaffolding]);

  // Real-time transcript analysis
  const analyzeTranscript = useCallback((text: string) => {
    const words = text.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const minutes = Math.max(turnTimer / 60, 0.05);
    const wpm = Math.round(wordCount / minutes);

    const fillerCount = words.filter(w =>
      FILLER_WORDS.some(f => w.toLowerCase().includes(f))
    ).length;

    const lower = text.toLowerCase();
    setStarStatus({
      S: lower.includes("situation") || lower.includes("project") || lower.includes("when") || lower.includes("time"),
      T: lower.includes("task") || lower.includes("responsible") || lower.includes("goal") || lower.includes("needed"),
      A: lower.includes("i ") || lower.includes("implemented") || lower.includes("used") || lower.includes("built") || lower.includes("created"),
      R: lower.includes("result") || lower.includes("%") || lower.includes("reduced") || lower.includes("improved") || lower.includes("users"),
    });

    setTelemetry({ wpm, fillerCount, silentSeconds: 0 });
    setScaffolding(null);
  }, [turnTimer]);

  // Web Speech API real-time transcription
  const startMic = useCallback(async () => {
    setTranscript("");
    setTurnTimer(0);
    setScaffolding(null);
    setStarStatus({ S: false, T: false, A: false, R: false });
    setState("RECORDING");

    // Web Speech API for live transcription
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-IN";

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let fullText = "";
        for (let i = 0; i < event.results.length; i++) {
          fullText += event.results[i][0].transcript + " ";
        }
        setTranscript(fullText.trim());
        analyzeTranscript(fullText.trim());
      };
      recognition.start();
      recognitionRef.current = recognition;
    }

    // Audio level visualizer
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const tick = () => {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setAudioLevel(Math.min(100, avg * 2));
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();

      // MediaRecorder for audio blob (optional - for server-side Whisper later)
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.start(100);
      mediaRecorderRef.current = recorder;
    } catch {
      // Mic not available — continue with typed input only
    }
  }, [analyzeTranscript]);

  const stopMic = useCallback(() => {
    recognitionRef.current?.stop();
    mediaRecorderRef.current?.stop();
    cancelAnimationFrame(animFrameRef.current);
    setAudioLevel(0);
  }, []);

  const submitTurn = useCallback(async () => {
    if (!setup) return;
    stopMic();
    setState("PROCESSING");

    const finalTranscript = transcript || "No response provided.";

    try {
      const newHistory = [...history, { role: "user", content: finalTranscript }];

      const res = await fetch("/api/interview/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: setup.sessionId,
          questionId: crypto.randomUUID(),
          transcriptText: finalTranscript,
          durationSeconds: turnTimer,
          wordsPerMinute: telemetry.wpm,
          fillerWordsFound: FILLER_WORDS.filter(f => finalTranscript.toLowerCase().includes(f)),
          silentPausesCount: Math.floor(telemetry.silentSeconds / 4),
          longestPauseSeconds: telemetry.silentSeconds,
          conversationHistory: newHistory,
          questionNumber: questionIndex,
          totalQuestions,
          company: setup.company,
          role: setup.role,
          jdText: setup.jdText,
          resumeText: setup.resumeText,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to process");

      if (data.sessionComplete || questionIndex >= totalQuestions) {
        // Save session result to localStorage
        const sessions = JSON.parse(localStorage.getItem("aiview_sessions") || "[]");
        sessions.unshift({
          id: setup.sessionId,
          company: setup.companyName,
          role: setup.role,
          score: data.preliminaryScore || 70,
          tier: "STRONG_CONTENDER",
          date: new Date().toLocaleDateString("en-IN"),
          duration: `${Math.floor(turnTimer / 60) + questionIndex * 3}m`,
        });
        localStorage.setItem("aiview_sessions", JSON.stringify(sessions));
        setState("DONE");
        return;
      }

      const updatedHistory = [...newHistory, { role: "assistant", content: data.interviewerSpokenText }];
      setHistory(updatedHistory);
      setAiPrompt(data.interviewerSpokenText);
      setQuestionIndex((q) => q + 1);
      setTranscript("");
      setState("AI_SPEAKING");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error processing response");
      setState("LISTENING");
    }
  }, [setup, transcript, history, turnTimer, telemetry, questionIndex, totalQuestions, stopMic]);

  if (!setup && state === "LOADING") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (state === "DONE") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-emerald-950/60 border border-emerald-600/40 flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Interview Complete!</h1>
          <p className="text-slate-400 text-sm mb-8">
            Great job! Your scorecard is being generated.
          </p>
          {error && <p className="text-rose-400 text-sm mb-4">{error}</p>}
          <div className="flex flex-col gap-3">
            <Link
              href="/scorecard"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-lg shadow-indigo-600/30"
            >
              <Sparkles className="w-4 h-4" /> View Scorecard
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-sm font-semibold transition text-center"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 font-sans">
      {/* Nav */}
      <nav className="flex items-center justify-between px-4 py-3 border-b border-slate-800/60 bg-slate-950/90 backdrop-blur-xl sticky top-0 z-40">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Brain className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-white font-bold text-sm">AIview</span>
        </Link>
        <div className="flex items-center gap-3">
          {state === "RECORDING" && (
            <span className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              Recording
            </span>
          )}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <Clock className="w-3 h-3 text-amber-400" />
            {turnTimer}s
          </div>
          <span className="px-2.5 py-1.5 rounded-lg bg-indigo-950/80 border border-indigo-700/40 text-xs font-semibold text-indigo-300">
            Q {questionIndex}/{totalQuestions}
          </span>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-4 md:p-6">
        {/* Company badge */}
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {setup?.companyName} · {setup?.role}
          </span>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-emerald-400 font-semibold">LIVE</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Interview Arena */}
          <section className="lg:col-span-2 space-y-5">

            {/* AI Question */}
            <div
              className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl"
              role="region"
              aria-live="polite"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs text-white">
                    AL
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Alex · PrepPilot AI</div>
                    <div className="text-[11px] text-slate-400">Senior Evaluation Coach</div>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-xs text-cyan-400 font-medium bg-cyan-950/40 px-2.5 py-1 rounded-full border border-cyan-800/40">
                  <Volume2 className="w-3 h-3" />
                  {state === "LOADING" ? "Connecting..." : "Audio Active"}
                </span>
              </div>

              {state === "LOADING" ? (
                <div className="flex items-center gap-3 py-4">
                  <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                  <span className="text-slate-400 text-sm">Preparing your personalized interview...</span>
                </div>
              ) : (
                <p className="text-base md:text-lg text-slate-100 font-medium leading-relaxed">
                  &quot;{aiPrompt}&quot;
                </p>
              )}
            </div>

            {/* Scaffolding Alert */}
            {scaffolding && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-950/30 border border-amber-600/40 text-amber-200 animate-fade-in" role="alert">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <strong className="font-semibold block mb-0.5">Empathy Nudge:</strong>
                  {scaffolding}
                </div>
              </div>
            )}

            {/* Audio visualizer */}
            {state === "RECORDING" && (
              <div className="flex items-center gap-1 h-8">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-full bg-indigo-500 transition-all duration-75"
                    style={{
                      height: `${Math.max(8, (audioLevel / 100) * 32 * (0.5 + Math.random() * 0.5))}px`,
                      opacity: 0.6 + (audioLevel / 200),
                    }}
                  />
                ))}
              </div>
            )}

            {/* Transcript Box */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 min-h-[160px] flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-900 pb-2 mb-2">
                <span>Live Transcript</span>
                <span className={telemetry.fillerCount > 2 ? "text-rose-400" : "text-emerald-400"}>
                  {telemetry.fillerCount} filler{telemetry.fillerCount !== 1 ? "s" : ""}
                </span>
              </div>
              <textarea
                className="w-full bg-transparent resize-none outline-none text-sm text-slate-200 placeholder-slate-600 min-h-[80px] flex-1"
                placeholder={
                  state === "LISTENING"
                    ? "Click 'Start Speaking' to begin..."
                    : state === "RECORDING"
                    ? "Listening... speak now. Or type your answer here."
                    : state === "PROCESSING"
                    ? "Processing your answer..."
                    : ""
                }
                value={transcript}
                onChange={(e) => {
                  setTranscript(e.target.value);
                  analyzeTranscript(e.target.value);
                }}
                disabled={state !== "RECORDING"}
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-700/50 text-rose-300 text-sm">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-4">
              {state === "AI_SPEAKING" && (
                <button
                  onClick={() => setState("LISTENING")}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition"
                >
                  I&apos;m Ready to Answer
                </button>
              )}

              {state === "LISTENING" && (
                <button
                  onClick={startMic}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition active:scale-95"
                >
                  <Mic className="w-4 h-4" />
                  Start Speaking
                </button>
              )}

              {state === "RECORDING" && (
                <button
                  onClick={submitTurn}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-600/30 transition active:scale-95"
                >
                  <MicOff className="w-4 h-4" />
                  Submit Answer
                </button>
              )}

              {state === "PROCESSING" && (
                <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 text-slate-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI is evaluating...
                </div>
              )}

              {(state === "RECORDING" || state === "LISTENING") && (
                <button
                  onClick={submitTurn}
                  disabled={state === "PROCESSING"}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition"
                >
                  Skip <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </section>

          {/* Right: Telemetry */}
          <aside className="space-y-4">

            {/* WPM */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pacing (WPM)</span>
                <span className={`text-xs font-bold ${telemetry.wpm >= 130 && telemetry.wpm <= 160 ? "text-emerald-400" : telemetry.wpm > 0 ? "text-amber-400" : "text-slate-500"}`}>
                  {telemetry.wpm >= 130 && telemetry.wpm <= 160 ? "Optimal" : telemetry.wpm > 160 ? "Too Fast" : telemetry.wpm > 0 ? "Too Slow" : "—"}
                </span>
              </div>
              <div className="text-3xl font-extrabold text-white mb-2 font-mono">
                {telemetry.wpm || "—"} <span className="text-xs font-normal text-slate-400">WPM</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((telemetry.wpm / 180) * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>&lt;120 slow</span><span>130–160 target</span><span>&gt;170 fast</span>
              </div>
            </div>

            {/* Fillers */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Filler Words</div>
              <div className="text-2xl font-bold text-white font-mono">
                {telemetry.fillerCount} <span className="text-xs font-normal text-slate-400">detected</span>
              </div>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                &quot;basically&quot;, &quot;like&quot;, &quot;actually&quot;, &quot;um&quot; — keep under 2/min
              </p>
            </div>

            {/* STAR tracker */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">STAR Structure</span>
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <ul className="space-y-2 text-xs">
                {[
                  { label: "Situation", key: "S" as const },
                  { label: "Task", key: "T" as const },
                  { label: "Action", key: "A" as const },
                  { label: "Result (quantified)", key: "R" as const },
                ].map((item) => (
                  <li key={item.key} className="flex items-center justify-between">
                    <span className="text-slate-400">{item.label}</span>
                    <span className={starStatus[item.key] ? "text-emerald-400 font-semibold" : "text-slate-600"}>
                      {starStatus[item.key] ? "Detected ✓" : "Missing"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Progress */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Progress</div>
              <div className="flex gap-1.5">
                {Array.from({ length: totalQuestions }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-2 rounded-full ${
                      i < questionIndex - 1 ? "bg-emerald-500" :
                      i === questionIndex - 1 ? "bg-indigo-500 animate-pulse" :
                      "bg-slate-800"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">{questionIndex} of {totalQuestions} questions</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
