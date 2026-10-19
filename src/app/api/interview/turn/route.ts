// AIview (Powered by PrepPilot Engine)
// Next.js App Router API Route: /api/interview/turn
// Real AI-powered conversational turn with Groq/Llama-3.3 cascade

import { NextRequest, NextResponse } from "next/server";
import { analyzeSpokenAnomalies } from "@/lib/ai/resilience";

// Rate limiter
const RATE_LIMIT_CACHE = new Map<string, { count: number; resetTime: number }>();
function checkRateLimit(key: string, limit = 20, windowMs = 60000): boolean {
  const now = Date.now();
  const record = RATE_LIMIT_CACHE.get(key);
  if (!record || now > record.resetTime) {
    RATE_LIMIT_CACHE.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  if (record.count >= limit) return false;
  record.count++;
  return true;
}

async function callGroq(
  messages: { role: string; content: string }[],
  maxTokens = 250
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!res.ok) throw new Error(`Groq error: ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content as string;
}

export async function POST(req: NextRequest) {
  const turnStart = Date.now();

  try {
    // Rate limit
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ message: "Rate limit exceeded" }, { status: 429 });
    }

    const body = await req.json();
    const {
      transcriptText,
      durationSeconds = 0,
      longestPauseSeconds = 0,
      fillerWordsFound = [],
      wordsPerMinute = 0,
      conversationHistory = [],
      questionNumber = 1,
      totalQuestions = 5,
      company = "ACCENTURE",
      role = "Associate Software Engineer",
      jdText = "",
      resumeText = "",
    } = body;

    if (!transcriptText || transcriptText.trim().length < 1) {
      return NextResponse.json({ message: "transcriptText is required" }, { status: 400 });
    }

    // Anomaly guard (freeze / ramble)
    const anomaly = analyzeSpokenAnomalies(transcriptText, durationSeconds, longestPauseSeconds);
    if (!anomaly.isAcceptable) {
      return NextResponse.json({
        interviewerSpokenText: anomaly.interviewerSpokenAction,
        sessionComplete: false,
        latencyMs: Date.now() - turnStart,
      });
    }

    const isLastQuestion = questionNumber >= totalQuestions;

    // Build AI messages
    const systemPrompt = `You are Alex, a strict but fair technical interviewer at "${company}" for the role "${role}".
${jdText ? `JD Context: ${jdText.slice(0, 500)}` : ""}
${resumeText ? `Candidate Resume (excerpt): ${resumeText.slice(0, 500)}` : ""}

RULES:
- This is question ${questionNumber} of ${totalQuestions}
- Evaluate the candidate's answer for depth, STAR structure, and quantification
- If they mention a technology without explanation, probe it: "How exactly did you implement X?"
- If filler words detected (${fillerWordsFound.join(", ")}), silently note it but don't mention it yet
- Keep your next question to 2-3 sentences maximum
- ${isLastQuestion ? "This is the FINAL question. Ask a closing scenario or culture fit question, then end with 'Thank you, that concludes our interview.'" : `Ask the next logical question in sequence.`}
- NEVER reveal scores or give feedback during the interview
- Respond ONLY with your next question. No preamble.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: transcriptText },
    ];

    let nextQuestion: string;
    try {
      nextQuestion = await callGroq(messages);
    } catch {
      // Fallback questions if API unavailable
      const fallbacks = [
        "Tell me about a challenging technical problem you solved in your project. Walk me through your approach step by step.",
        "How would you design a simple URL shortener? What components would you include?",
        "Tell me about a time you had a conflict with a teammate. How did you resolve it?",
        "What data structure would you use to implement an LRU cache, and why?",
        "Where do you see yourself in 3 years, and how does this role fit that plan?",
      ];
      nextQuestion = fallbacks[Math.min(questionNumber - 1, fallbacks.length - 1)];
    }

    const sessionComplete = isLastQuestion;

    // Compute preliminary score from telemetry
    let preliminaryScore = 70;
    if (wordsPerMinute >= 130 && wordsPerMinute <= 160) preliminaryScore += 5;
    if (fillerWordsFound.length === 0) preliminaryScore += 5;
    if (transcriptText.length > 100) preliminaryScore += 5;
    if (transcriptText.toLowerCase().includes("%") || transcriptText.toLowerCase().includes("reduced") || transcriptText.toLowerCase().includes("improved")) preliminaryScore += 5;

    return NextResponse.json({
      interviewerSpokenText: nextQuestion,
      sessionComplete,
      preliminaryScore: Math.min(100, preliminaryScore),
      latencyMs: Date.now() - turnStart,
      telemetry: { wpm: wordsPerMinute, fillers: fillerWordsFound.length, duration: durationSeconds },
    });
  } catch (err: unknown) {
    console.error("[Turn Handler Error]:", err);
    return NextResponse.json(
      {
        interviewerSpokenText: "I see. Let's move to the next part of the interview. Can you tell me about a technical challenge you faced recently?",
        sessionComplete: false,
        latencyMs: Date.now() - turnStart,
      },
      { status: 200 } // Return 200 with fallback so interview continues
    );
  }
}
