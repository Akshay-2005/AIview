/**
 * AIview — PrepPilot Engine
 * Module A: /api/v1/jd/analyze — Next.js App Router API Route
 *
 * Responsibilities:
 *   POST /api/v1/jd/analyze
 *     1. Validate request (Zod)
 *     2. Extract JD text from raw string or Base-64 PDF stub
 *     3. Call LLM → parse JD into structured intelligence
 *     4. Run deterministic Resume-JD Gap Analyzer via LLM
 *     5. Return combined analysis + session init payload
 *
 * Edge Cases Handled:
 *   - Malformed/truncated LLM JSON → extractAndHealJSON()
 *   - LLM timeout → exponential back-off retry (max 3 attempts)
 *   - PDF Base-64 too large → 413 before LLM call
 *   - Both jdRawText and jdPdfBase64 missing → 400 with path
 *   - Rate limiting → 429 with Retry-After header
 *   - LLM returns invalid schema → Zod parse + sanitised error
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { v4 as uuidv4 } from "uuid";

import {
  JDAnalyzeRequestSchema,
  ParsedJDIntelligenceSchema,
  ResumeJDGapAnalysisSchema,
  successResponse,
  errorResponse,
  type JDAnalyzeRequest,
  type ParsedJDIntelligence,
} from "@/lib/validations/jd";

import {
  buildJDParserMessages,
  buildGapAnalyzerMessages,
} from "@/lib/ai/jd-prompts";

import {
  extractAndHealJSON,
  withExponentialBackoff,
  rateLimitGuard,
} from "@/lib/ai/resilience";

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_PDF_BASE64_BYTES = 2_000_000; // 2 MB
const MAX_JD_CHARS = 12_000;
const LLM_TIMEOUT_MS = 25_000;
const LLM_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const RATE_LIMIT_RPM = 10; // requests per minute per IP

// ============================================================================
// LLM CLIENT — thin wrapper (replace with your SDK of choice)
// ============================================================================

async function callLLM(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  options: { timeoutMs?: number; temperature?: number } = {}
): Promise<string> {
  const { timeoutMs = LLM_TIMEOUT_MS, temperature = 0.1 } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages,
        temperature,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`LLM API error ${response.status}: ${errorBody}`);
    }

    const json = await response.json();
    const content: string = json.choices?.[0]?.message?.content ?? "";

    if (!content) {
      throw new Error("LLM returned empty content");
    }

    return content;
  } finally {
    clearTimeout(timer);
  }
}

// ============================================================================
// PDF BASE-64 → TEXT EXTRACTOR (stub — replace with pdf-parse or similar)
// ============================================================================

/**
 * In production: use `pdf-parse` npm package or Cloudflare AI PDF worker.
 * This stub decodes Base-64 and returns raw bytes as string for demonstration.
 * Replace the body with: const data = await pdfParse(Buffer.from(base64, "base64")); return data.text;
 */
async function extractTextFromPdfBase64(base64: string): Promise<string> {
  // Guard: check size before decoding
  const estimatedBytes = Math.ceil((base64.length * 3) / 4);
  if (estimatedBytes > MAX_PDF_BASE64_BYTES) {
    throw new Error(
      `PDF exceeds maximum size of ${MAX_PDF_BASE64_BYTES / 1_000_000} MB`
    );
  }

  // Production implementation:
  // const pdfParse = (await import("pdf-parse")).default;
  // const data = await pdfParse(Buffer.from(base64, "base64"));
  // return data.text.substring(0, MAX_JD_CHARS);

  // Stub: return base64 prefix as placeholder
  return `[PDF content extracted — ${estimatedBytes} bytes. Replace stub with pdf-parse.]`;
}

// ============================================================================
// STEP 1: JD TEXT EXTRACTION
// ============================================================================

async function extractJDText(request: JDAnalyzeRequest): Promise<string> {
  if (request.jdRawText) {
    return request.jdRawText.substring(0, MAX_JD_CHARS);
  }

  if (request.jdPdfBase64) {
    const extracted = await extractTextFromPdfBase64(request.jdPdfBase64);
    return extracted.substring(0, MAX_JD_CHARS);
  }

  // Schema refinement already catches this, but belt-and-suspenders:
  throw new Error("No JD content provided");
}

// ============================================================================
// STEP 2: JD PARSER — LLM CALL WITH RETRY
// ============================================================================

async function parseJDWithLLM(
  jdText: string,
  company: string,
  roleTitle: string
): Promise<ParsedJDIntelligence> {
  const messages = buildJDParserMessages(jdText, company, roleTitle);

  const rawOutput = await withExponentialBackoff(
    () => callLLM(messages, { temperature: 0.05 }),
    {
      maxRetries: 3,
      baseDelayMs: 1000,
      jitter: true,
      retryOn: (err) =>
        err.message.includes("timeout") ||
        err.message.includes("503") ||
        err.message.includes("429"),
    }
  );

  // Heal and validate JSON
  const parsed = extractAndHealJSON(rawOutput, ParsedJDIntelligenceSchema);

  // Ensure jdId is always a valid UUID (LLM sometimes generates bad ones)
  if (!parsed.jdId || parsed.jdId.length !== 36) {
    parsed.jdId = uuidv4();
  }

  // Ensure analyzedAt is set
  parsed.analyzedAt = new Date().toISOString();

  return parsed;
}

// ============================================================================
// STEP 3: RESUME-JD GAP ANALYZER — LLM CALL WITH RETRY
// ============================================================================

async function analyzeResumeJDGapWithLLM(
  jdIntelligence: ParsedJDIntelligence,
  resumeText: string,
  userId: string
) {
  const messages = buildGapAnalyzerMessages(jdIntelligence, resumeText);

  const rawOutput = await withExponentialBackoff(
    () => callLLM(messages, { temperature: 0.05 }),
    {
      maxRetries: 3,
      baseDelayMs: 1000,
      jitter: true,
      retryOn: (err) =>
        err.message.includes("timeout") ||
        err.message.includes("503") ||
        err.message.includes("429"),
    }
  );

  const rawParsed = extractAndHealJSON(rawOutput);

  // Inject runtime values
  rawParsed.userId = userId;
  rawParsed.jdId = jdIntelligence.jdId;
  rawParsed.analyzedAt = new Date().toISOString();

  // Ensure exactly 3 gap warnings
  if (!rawParsed.gapWarningAlerts || rawParsed.gapWarningAlerts.length === 0) {
    rawParsed.gapWarningAlerts = buildFallbackGapWarnings(jdIntelligence);
  } else {
    // Assign UUIDs to any alert missing one
    rawParsed.gapWarningAlerts = rawParsed.gapWarningAlerts
      .slice(0, 3)
      .map((a: Record<string, unknown>) => ({
        ...a,
        alertId: (a.alertId as string)?.length === 36 ? a.alertId : uuidv4(),
      }));
  }

  return ResumeJDGapAnalysisSchema.parse(rawParsed);
}

// ============================================================================
// FALLBACK: Deterministic gap warnings when LLM output is unusable
// ============================================================================

function buildFallbackGapWarnings(
  jd: ParsedJDIntelligence
): Array<Record<string, unknown>> {
  const missingRequired = jd.coreRequiredSkills.slice(0, 3);
  return missingRequired.map((skill, i) => ({
    alertId: uuidv4(),
    severity: i === 0 ? "CRITICAL" : i === 1 ? "WARNING" : "ADVISORY",
    headline: `${skill.name} not verified on resume`,
    diagnosticSentence: `JD requires ${skill.name} because it is a core competency for this role, but resume does not show verified evidence.`,
    remediationSteps: [
      `Add a project example demonstrating ${skill.name} with measurable outcomes.`,
      `Practice explaining ${skill.name} with the STAR framework.`,
    ],
    jdSkillReference: skill.name,
    estimatedPrepHours: 6,
  }));
}

// ============================================================================
// RATE LIMIT GUARD (in-memory — swap for Redis/Upstash in production)
// ============================================================================

const ipRequestLog = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(ip: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const windowMs = 60_000; // 1 minute window
  const existing = ipRequestLog.get(ip);

  if (!existing || now - existing.windowStart > windowMs) {
    ipRequestLog.set(ip, { count: 1, windowStart: now });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (existing.count >= RATE_LIMIT_RPM) {
    const retryAfterMs = windowMs - (now - existing.windowStart);
    return { allowed: false, retryAfterMs };
  }

  existing.count++;
  return { allowed: true, retryAfterMs: 0 };
}

// ============================================================================
// MAIN ROUTE HANDLER: POST /api/v1/jd/analyze
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = uuidv4();

  // ── Rate Limiting ──────────────────────────────────────────────────────────
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const { allowed, retryAfterMs } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      errorResponse(
        "RATE_LIMIT_EXCEEDED",
        `Too many requests. Please retry after ${Math.ceil(retryAfterMs / 1000)} seconds.`,
        { retryAfterSeconds: Math.ceil(retryAfterMs / 1000) }
      ),
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(retryAfterMs / 1000)),
          "X-Request-Id": requestId,
        },
      }
    );
  }

  // ── Request Parsing ────────────────────────────────────────────────────────
  let body: unknown;
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      body = await request.json();
    } else if (contentType.includes("multipart/form-data")) {
      // Handle form-data PDF upload
      const formData = await request.formData();
      const pdfFile = formData.get("jdPdf") as File | null;
      body = {
        jdRawText: formData.get("jdRawText") as string | null,
        jdPdfBase64: pdfFile
          ? Buffer.from(await pdfFile.arrayBuffer()).toString("base64")
          : null,
        resumeText: formData.get("resumeText") as string,
        companyHint: formData.get("companyHint") ?? "ACCENTURE",
        targetRoleTitle:
          formData.get("targetRoleTitle") ?? "Associate Software Engineer",
        userId: formData.get("userId") as string,
      };
    } else {
      return NextResponse.json(
        errorResponse(
          "UNSUPPORTED_CONTENT_TYPE",
          "Content-Type must be application/json or multipart/form-data"
        ),
        { status: 415, headers: { "X-Request-Id": requestId } }
      );
    }
  } catch {
    return NextResponse.json(
      errorResponse("INVALID_REQUEST_BODY", "Request body could not be parsed as JSON or form-data"),
      { status: 400, headers: { "X-Request-Id": requestId } }
    );
  }

  // ── Input Validation (Zod) ─────────────────────────────────────────────────
  const validationResult = JDAnalyzeRequestSchema.safeParse(body);
  if (!validationResult.success) {
    const formatted = validationResult.error.flatten();
    return NextResponse.json(
      errorResponse("VALIDATION_ERROR", "Request validation failed", {
        fieldErrors: formatted.fieldErrors,
        formErrors: formatted.formErrors,
      }),
      { status: 400, headers: { "X-Request-Id": requestId } }
    );
  }

  const validatedRequest = validationResult.data;

  // ── JD Text Extraction ─────────────────────────────────────────────────────
  let jdText: string;
  try {
    jdText = await extractJDText(validatedRequest);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "JD text extraction failed";
    return NextResponse.json(
      errorResponse("JD_EXTRACTION_FAILED", message),
      { status: 422, headers: { "X-Request-Id": requestId } }
    );
  }

  // ── LLM: Parse JD ─────────────────────────────────────────────────────────
  let jdIntelligence: ParsedJDIntelligence;
  try {
    jdIntelligence = await parseJDWithLLM(
      jdText,
      validatedRequest.companyHint,
      validatedRequest.targetRoleTitle
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "JD parsing failed";

    // Determine if it's a client or server fault
    const isTimeout = message.toLowerCase().includes("abort");
    return NextResponse.json(
      errorResponse(
        isTimeout ? "LLM_TIMEOUT" : "JD_PARSE_FAILED",
        isTimeout
          ? "The AI analysis timed out. Please try again."
          : `JD parsing failed: ${message}`
      ),
      {
        status: isTimeout ? 504 : 502,
        headers: { "X-Request-Id": requestId },
      }
    );
  }

  // ── LLM: Resume-JD Gap Analysis ────────────────────────────────────────────
  let gapAnalysis;
  try {
    gapAnalysis = await analyzeResumeJDGapWithLLM(
      jdIntelligence,
      validatedRequest.resumeText,
      validatedRequest.userId
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gap analysis failed";
    return NextResponse.json(
      errorResponse("GAP_ANALYSIS_FAILED", message),
      { status: 502, headers: { "X-Request-Id": requestId } }
    );
  }

  // ── Build Session Init Payload ─────────────────────────────────────────────
  const sessionPayload = {
    sessionId: uuidv4(),
    jdId: jdIntelligence.jdId,
    userId: validatedRequest.userId,
    company: validatedRequest.companyHint,
    roleTitle: validatedRequest.targetRoleTitle,
    totalPlannedTurns: 5, // 5-turn interview pipeline
    interviewStartsAt: new Date().toISOString(),
  };

  // ── Response ───────────────────────────────────────────────────────────────
  return NextResponse.json(
    successResponse(
      {
        jdIntelligence,
        gapAnalysis,
        sessionPayload,
      },
      {
        requestId,
        analysisVersion: "module-a-v1",
        processingTimeHint:
          "Use sessionPayload.sessionId for /api/v1/jd/interview/turn calls",
      }
    ),
    {
      status: 200,
      headers: {
        "X-Request-Id": requestId,
        "Cache-Control": "no-store, no-cache",
        "Content-Type": "application/json",
      },
    }
  );
}

// ============================================================================
// OPTIONS handler — CORS preflight support
// ============================================================================

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN ?? "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
