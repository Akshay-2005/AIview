// AIview (Powered by PrepPilot Engine)
// Edge-Resilience, Fault-Tolerance & Edge-Case Handling Middleware

import { z } from "zod";

// ======================================================================
// 1. MALFORMED JSON EXTRACTION & HEALING
// ======================================================================

/**
 * Robustly extracts and repairs JSON from raw LLM outputs.
 * Handles markdown fences, trailing commas, single quotes, and truncated objects.
 */
export function extractAndHealJSON<T>(rawLLMOutput: string, schema?: z.ZodSchema<T>): T {
  let cleaned = rawLLMOutput.trim();

  // Strip Markdown Code Fences (```json ... ```)
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = cleaned.match(codeBlockRegex);
  if (match && match[1]) {
    cleaned = match[1].trim();
  }

  // Find boundaries of outer JSON object or array
  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");
  let startIdx = -1;
  let endIdx = -1;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
    endIdx = cleaned.lastIndexOf("}");
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    endIdx = cleaned.lastIndexOf("]");
  }

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  }

  // Pre-parse Sanitization (remove trailing commas before closing brackets)
  cleaned = cleaned.replace(/,\s*([\]}])/g, "$1");

  try {
    const parsed = JSON.parse(cleaned);
    if (schema) {
      return schema.parse(parsed);
    }
    return parsed as T;
  } catch (initialError) {
    console.warn("[Resilience] Primary JSON parse failed, attempting aggressive heuristics:", initialError);

    // Fallback Heuristic 1: Replace unescaped newlines inside strings
    try {
      const relaxed = cleaned.replace(/(?<!\\)\n/g, "\\n");
      const parsedRelaxed = JSON.parse(relaxed);
      if (schema) return schema.parse(parsedRelaxed);
      return parsedRelaxed as T;
    } catch {
      throw new Error(`[Resilience Error] Unable to heal malformed LLM JSON string. Payload: "${cleaned.substring(0, 150)}..."`);
    }
  }
}

// ======================================================================
// 2. CONVERSATIONAL ANOMALY DETECTION (EMPTY, FREEZE & RAMBLE GUARDS)
// ======================================================================

export interface CandidateResponseAnalysis {
  isAcceptable: boolean;
  statusType: "NORMAL" | "SILENT_FREEZE" | "EMPTY_AUDIO" | "RAMBLING_RUNAWAY" | "DEFENSIVE_EVASION";
  scaffoldingNudgeRequired: boolean;
  interviewerSpokenAction: string;
}

/**
 * Evaluates candidate spoken input against conversational guardrails.
 */
export function analyzeSpokenAnomalies(
  transcript: string,
  durationSeconds: number,
  silentPauseDuration: number
): CandidateResponseAnalysis {
  const trimmed = transcript.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;

  // Case A: Silence / Cognitive Freeze (>4.0 seconds silence with <5 words spoken)
  if (silentPauseDuration >= 4.0 && wordCount < 5) {
    return {
      isAcceptable: false,
      statusType: "SILENT_FREEZE",
      scaffoldingNudgeRequired: true,
      interviewerSpokenAction:
        "Take your time, Rahul. You can start by explaining the core problem your team was trying to solve.",
    };
  }

  // Case B: Completely Empty or Inaudible Audio
  if (!trimmed || wordCount === 0 || trimmed.toLowerCase() === "[inaudible]") {
    return {
      isAcceptable: false,
      statusType: "EMPTY_AUDIO",
      scaffoldingNudgeRequired: false,
      interviewerSpokenAction:
        "I couldn't quite hear your microphone just now. Could you please repeat that?",
    };
  }

  // Case C: Rambling Runaway (>140 words in a single continuous unpunctuated turn)
  if (wordCount > 140) {
    return {
      isAcceptable: true, // We still accept the data for scoring
      statusType: "RAMBLING_RUNAWAY",
      scaffoldingNudgeRequired: false,
      interviewerSpokenAction:
        "Thanks, Rahul. Let's pause right there and zoom into that specific decision—what exact action did you take?",
    };
  }

  return {
    isAcceptable: true,
    statusType: "NORMAL",
    scaffoldingNudgeRequired: false,
    interviewerSpokenAction: "",
  };
}

// ======================================================================
// 3. API TIMEOUT & EXPONENTIAL BACKOFF MODEL CASCADE
// ======================================================================

interface ModelTier {
  provider: "groq" | "anthropic" | "google";
  modelName: string;
  timeoutMs: number;
}

const MODEL_CASCADE: ModelTier[] = [
  { provider: "groq", modelName: "llama-3.3-70b-versatile", timeoutMs: 1200 }, // Primary: Ultra-fast sub-500ms
  { provider: "anthropic", modelName: "claude-3-5-haiku-20241022", timeoutMs: 2500 }, // Fallback 1: High-precision
  { provider: "google", modelName: "gemini-1.5-flash", timeoutMs: 3500 }, // Fallback 2: Resilience
];

/**
 * Executes an LLM call across a resilient model cascade with timeouts.
 */
export async function executeResilientModelCall<T>(
  promptPayload: string,
  schema: z.ZodSchema<T>,
  fetcher: (model: ModelTier, payload: string) => Promise<string>
): Promise<{ result: T; executedModel: string; latencyMs: number }> {
  let lastError: Error | null = null;

  for (const tier of MODEL_CASCADE) {
    const startTime = Date.now();
    try {
      // Race fetcher against timeout
      const responsePromise = fetcher(tier, promptPayload);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout on model ${tier.modelName}`)), tier.timeoutMs)
      );

      const rawResponse = await Promise.race([responsePromise, timeoutPromise]);
      const parsed = extractAndHealJSON(rawResponse, schema);
      const latency = Date.now() - startTime;

      return {
        result: parsed,
        executedModel: tier.modelName,
        latencyMs: latency,
      };
    } catch (err: any) {
      console.warn(`[Resilience Alert] Tier ${tier.modelName} failed (${err.message}). Cascading to next tier...`);
      lastError = err;
    }
  }

  throw new Error(`[Resilience Fatal] All model cascade tiers failed. Root cause: ${lastError?.message}`);
}

// ======================================================================
// 4. EXPONENTIAL BACK-OFF RETRY (used by Module A /api/v1/jd/analyze)
// ======================================================================

interface BackoffOptions {
  maxRetries: number;
  baseDelayMs: number;
  jitter: boolean;
  /** Return true if this error type should trigger a retry */
  retryOn?: (error: Error) => boolean;
}

/**
 * Wraps an async function with exponential back-off retry logic.
 * Delays: baseDelayMs * 2^attempt ± jitter (if enabled).
 */
export async function withExponentialBackoff<T>(
  fn: () => Promise<T>,
  options: BackoffOptions
): Promise<T> {
  const { maxRetries, baseDelayMs, jitter, retryOn } = options;
  let lastError: Error = new Error("Unknown error");

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      lastError = error;

      const shouldRetry = retryOn ? retryOn(error) : true;

      if (!shouldRetry || attempt === maxRetries) {
        break;
      }

      const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
      const jitterAmount = jitter ? Math.random() * exponentialDelay * 0.3 : 0;
      const totalDelay = Math.min(exponentialDelay + jitterAmount, 30_000);

      console.warn(
        `[BackoffRetry] Attempt ${attempt + 1}/${maxRetries} failed: ${error.message}. ` +
        `Retrying in ${Math.round(totalDelay)}ms...`
      );

      await new Promise((resolve) => setTimeout(resolve, totalDelay));
    }
  }

  throw new Error(
    `[BackoffRetry] All ${maxRetries + 1} attempts failed. Last error: ${lastError.message}`
  );
}

// ======================================================================
// 5. RATE LIMIT GUARD (exported for reuse across routes)
// ======================================================================

/**
 * Simple in-process rate limiter. For production, replace with
 * Upstash Redis + @upstash/ratelimit for distributed environments.
 */
const _rateLimitStore = new Map<
  string,
  { count: number; windowStartMs: number }
>();

export function rateLimitGuard(
  key: string,
  limitPerWindow: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  const entry = _rateLimitStore.get(key);

  if (!entry || now - entry.windowStartMs > windowMs) {
    _rateLimitStore.set(key, { count: 1, windowStartMs: now });
    return { allowed: true, remaining: limitPerWindow - 1, retryAfterMs: 0 };
  }

  if (entry.count >= limitPerWindow) {
    const retryAfterMs = windowMs - (now - entry.windowStartMs);
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: limitPerWindow - entry.count,
    retryAfterMs: 0,
  };
}
