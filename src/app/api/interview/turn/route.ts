// AIview (Powered by PrepPilot Engine)
// Next.js App Router API Route: /api/interview/turn
// Handles real-time conversational turns, anomaly detection, rate-limiting, and follow-up generation

import { NextRequest, NextResponse } from "next/server";
import { SubmitAnswerSchema } from "@/lib/validations/interview";
import { analyzeSpokenAnomalies } from "@/lib/ai/resilience";

// In-memory rate-limiter for edge testing (Token Bucket: 20 turns / minute per user)
const RATE_LIMIT_CACHE = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(key: string, limit = 20, windowMs = 60000): boolean {
  const now = Date.now();
  const record = RATE_LIMIT_CACHE.get(key);

  if (!record || now > record.resetTime) {
    RATE_LIMIT_CACHE.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const turnStartTime = Date.now();

  try {
    // 1. Rate Limiting Check
    const clientIp = req.headers.get("x-forwarded-for") || "127.0.0.1";
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Too many conversational turns in a short period." },
        { status: 429 }
      );
    }

    // 2. Body Parsing & Zod Validation
    const rawBody = await req.json();
    const parseResult = SubmitAnswerSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid turn payload", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const payload = parseResult.data;

    // 3. Conversational Anomaly Guard (Silent Freeze / Empty Audio / Rambling Runaway)
    const anomalyCheck = analyzeSpokenAnomalies(
      payload.transcriptText,
      payload.durationSeconds,
      payload.longestPauseSeconds
    );

    if (!anomalyCheck.isAcceptable) {
      // Return immediate spoken scaffolding without burning expensive LLM reasoning tokens
      return NextResponse.json({
        turnStatus: anomalyCheck.statusType,
        interviewerSpokenText: anomalyCheck.interviewerSpokenAction,
        isFollowUp: false,
        shouldListen: true,
        latencyMs: Date.now() - turnStartTime,
        telemetry: {
          wpm: payload.wordsPerMinute,
          fillers: payload.fillerWordsFound.length,
          pauseDuration: payload.longestPauseSeconds,
        },
      });
    }

    // 4. Dynamic Follow-Up Evaluation (Simulated Groq LLM Turn)
    // Check if candidate dropped superficial buzzwords
    const lowerText = payload.transcriptText.toLowerCase();
    const hasUnexplainedBuzzword =
      (lowerText.includes("redis") || lowerText.includes("microservice") || lowerText.includes("scalab")) &&
      !lowerText.includes("invalidation") &&
      !lowerText.includes("latency");

    let nextInterviewerPrompt = "";
    let isFollowUpTriggered = false;

    if (hasUnexplainedBuzzword) {
      isFollowUpTriggered = true;
      nextInterviewerPrompt =
        "You mentioned using Redis for scalability—what specific concurrency bottlenecks did you hit when testing product checkouts, and how did your cache handle sudden out-of-stock updates?";
    } else if (anomalyCheck.statusType === "RAMBLING_RUNAWAY") {
      nextInterviewerPrompt = anomalyCheck.interviewerSpokenAction;
    } else {
      nextInterviewerPrompt =
        "Understood. Moving on to how you handle team challenges—tell me about a time when your team missed an internal project deadline. How did you handle the situation?";
    }

    const totalTurnLatency = Date.now() - turnStartTime;

    return NextResponse.json({
      turnStatus: "SUCCESS",
      interviewerSpokenText: nextInterviewerPrompt,
      isFollowUp: isFollowUpTriggered,
      shouldListen: true,
      latencyMs: totalTurnLatency,
      telemetry: {
        wpm: payload.wordsPerMinute,
        fillers: payload.fillerWordsFound.length,
        pauseDuration: payload.longestPauseSeconds,
        turnDuration: payload.durationSeconds,
      },
    });
  } catch (error: any) {
    console.error("[Turn Handler Error]:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error during conversational turn",
        fallbackSpokenPrompt: "I caught that point. Let's proceed to the next technical scenario.",
      },
      { status: 500 }
    );
  }
}
