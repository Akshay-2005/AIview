/**
 * AIview — PrepPilot Engine
 * Module B: Answer Guard & Edge Case Handler
 *
 * Detects and handles:
 *   1. Candidate RAMBLING  — answer >350 words with low information density
 *   2. SILENCE / MINIMAL   — empty, one-word, or <15-word answers
 *   3. TRUNCATED JD        — JD too short, boilerplate-only, or malformed
 *   4. INCOHERENT ANSWER   — repetition ratio too high (copy-pasted / looping)
 *
 * Each guard returns a typed GuardResult with:
 *   - triggered: boolean
 *   - severity:  'block' | 'warn' | 'nudge'
 *   - nudge:     Empathy-first prompt to recover the session
 *   - sanitized: cleaned version of the input (if applicable)
 */

// ============================================================================
// TYPES
// ============================================================================

export type GuardSeverity = "block" | "warn" | "nudge";

export interface GuardResult {
  triggered: boolean;
  guardName: string;
  severity: GuardSeverity;
  /** Metric that tripped the guard — for telemetry display */
  metric: string;
  /** Human-readable diagnostic for the UI (shown in telemetry panel) */
  diagnostic: string;
  /** What the AI interviewer should say to the candidate */
  interviewerNudge: string;
  /** Sanitized / truncated version of the input safe for LLM processing */
  sanitizedInput: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const RAMBLING_WORD_THRESHOLD = 350;
const RAMBLING_DENSITY_THRESHOLD = 0.28; // unique meaningful words / total words
const SILENCE_WORD_THRESHOLD = 15;
const REPETITION_RATIO_THRESHOLD = 0.55; // if >55% of words are repeats
const JD_MINIMUM_CHARS = 100;
const JD_MINIMUM_UNIQUE_KEYWORDS = 5;
const LLM_SAFE_ANSWER_WORDS = 280; // Truncate rambling to this for LLM

/** Words that carry no information density (stop words + filler) */
const STOP_WORDS = new Set([
  "i", "me", "my", "myself", "we", "our", "ours", "you", "your", "he", "she",
  "they", "it", "this", "that", "these", "those", "am", "is", "are", "was",
  "were", "be", "been", "being", "have", "has", "had", "do", "does", "did",
  "will", "would", "could", "should", "may", "might", "shall", "can", "a",
  "an", "the", "and", "but", "or", "nor", "for", "so", "yet", "at", "by",
  "from", "in", "into", "of", "on", "to", "with", "about", "just", "very",
  "also", "like", "so", "yeah", "um", "uh", "basically", "actually",
  "literally", "right", "okay", "ok", "well", "then", "now",
]);

/** JD boilerplate phrases that indicate a non-substantive upload */
const JD_BOILERPLATE_PATTERNS = [
  /equal opportunity employer/i,
  /we are hiring/i,
  /^\s*job description\s*$/im,
  /lorem ipsum/i,
  /\[company name\]/i,
  /\[job title\]/i,
];

// ============================================================================
// UTILITIES
// ============================================================================

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

function countMeaningfulWords(tokens: string[]): number {
  return tokens.filter((t) => !STOP_WORDS.has(t)).length;
}

function computeRepetitionRatio(tokens: string[]): number {
  if (tokens.length === 0) return 0;
  const unique = new Set(tokens).size;
  return 1 - unique / tokens.length;
}

function truncateToWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ") + " [...]";
}

// ============================================================================
// GUARD 1: RAMBLING DETECTION
// ============================================================================

/**
 * Triggers when:
 *   - Word count > RAMBLING_WORD_THRESHOLD (350 words)
 *   AND
 *   - Information density < RAMBLING_DENSITY_THRESHOLD (too many filler/stop words)
 *
 * Severity: 'warn' if 350–500 words, 'block' if >500 words with low density
 */
export function detectRambling(answer: string): GuardResult {
  const tokens = tokenize(answer);
  const wordCount = tokens.length;
  const meaningfulCount = countMeaningfulWords(tokens);
  const density =
    wordCount > 0 ? meaningfulCount / wordCount : 1;

  const isVerbose = wordCount > RAMBLING_WORD_THRESHOLD;
  const isLowDensity = density < RAMBLING_DENSITY_THRESHOLD;
  const isSevere = wordCount > 500 && isLowDensity;

  const triggered = isVerbose && isLowDensity;

  const nudges = [
    `I appreciate the detail — let me ask you to zoom in on the most important part. In 2 sentences, what was the single biggest technical challenge you faced, and what measurable outcome did you achieve?`,
    `That's a comprehensive overview. To help me evaluate your impact specifically, can you give me one concrete metric — a number, percentage, or time saved — from that work?`,
    `I want to make sure I understand your key contribution. In 30 seconds, what would you say was your specific role in solving that problem, and what changed because of your work?`,
  ];

  const nudgeIndex = isSevere ? 2 : wordCount > 420 ? 1 : 0;

  return {
    triggered,
    guardName: "RAMBLING",
    severity: isSevere ? "block" : "warn",
    metric: `${wordCount} words, ${Math.round(density * 100)}% density`,
    diagnostic: `Answer is ${wordCount} words with ${Math.round(density * 100)}% information density (threshold: >${RAMBLING_WORD_THRESHOLD} words + <${Math.round(RAMBLING_DENSITY_THRESHOLD * 100)}% density)`,
    interviewerNudge: triggered ? nudges[nudgeIndex] : "",
    sanitizedInput: triggered
      ? truncateToWords(answer, LLM_SAFE_ANSWER_WORDS)
      : answer,
  };
}

// ============================================================================
// GUARD 2: SILENCE / MINIMAL ANSWER DETECTION
// ============================================================================

/**
 * Triggers when:
 *   - Answer is empty / whitespace-only → severity 'block'
 *   - Answer is 1–4 words → severity 'block'
 *   - Answer is 5–14 words → severity 'warn'
 *
 * Provides empathy-first nudges — never shames the candidate.
 */
export function detectSilence(
  answer: string,
  questionType: "TECHNICAL" | "BEHAVIORAL" | "GENERAL" = "GENERAL"
): GuardResult {
  const trimmed = answer.trim();
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;

  const isEmpty = wordCount === 0;
  const isOneWord = wordCount >= 1 && wordCount <= 4;
  const isMinimal = wordCount >= 5 && wordCount < SILENCE_WORD_THRESHOLD;

  const triggered = isEmpty || isOneWord || isMinimal;
  const isBlocked = isEmpty || isOneWord;

  const technicalNudges = [
    `It's okay to take a moment — sometimes thinking out loud helps. Start with what you do know about this topic, even if it's just how you'd approach solving it step by step.`,
    `Let me rephrase that to give you a foothold: if you were explaining this to a junior colleague who just started, where would you begin?`,
  ];

  const behavioralNudges = [
    `Take your time. Think of a specific project or team situation — doesn't have to be perfect. Walk me through what happened and what you did.`,
    `Let me make this more concrete: can you recall a time in your final year project where things didn't go as planned? What did you do?`,
  ];

  const generalNudges = [
    `No rush at all — take a breath. Start with whatever comes to mind first about this.`,
    `Sometimes it helps to start with a simple statement: "The way I understand this is..." — go ahead.`,
  ];

  const nudgePool =
    questionType === "TECHNICAL"
      ? technicalNudges
      : questionType === "BEHAVIORAL"
      ? behavioralNudges
      : generalNudges;

  const nudgeIndex = isEmpty ? 0 : wordCount <= 4 ? 0 : 1;

  return {
    triggered,
    guardName: "SILENCE",
    severity: isBlocked ? "block" : "warn",
    metric: `${wordCount} words`,
    diagnostic: isEmpty
      ? "No answer detected — candidate did not respond"
      : `Answer is only ${wordCount} words (minimum: ${SILENCE_WORD_THRESHOLD} for evaluation)`,
    interviewerNudge: triggered ? nudgePool[nudgeIndex % nudgePool.length] : "",
    sanitizedInput: answer,
  };
}

// ============================================================================
// GUARD 3: INCOHERENT / HIGH REPETITION DETECTION
// ============================================================================

/**
 * Triggers when candidate copy-pastes, repeats themselves, or is clearly
 * submitting filler content. Repetition ratio > 55% with >80 words.
 */
export function detectRepetition(answer: string): GuardResult {
  const tokens = tokenize(answer);
  const wordCount = tokens.length;

  if (wordCount < 40) {
    // Too short to meaningfully compute repetition — let silence guard handle
    return {
      triggered: false,
      guardName: "REPETITION",
      severity: "nudge",
      metric: `${wordCount} words (too short to check)`,
      diagnostic: "Answer too short for repetition analysis",
      interviewerNudge: "",
      sanitizedInput: answer,
    };
  }

  const repetitionRatio = computeRepetitionRatio(tokens);
  const triggered =
    repetitionRatio > REPETITION_RATIO_THRESHOLD && wordCount > 80;

  return {
    triggered,
    guardName: "REPETITION",
    severity: "warn",
    metric: `${Math.round(repetitionRatio * 100)}% repetition`,
    diagnostic: `Answer has ${Math.round(repetitionRatio * 100)}% repeated tokens (threshold: ${Math.round(REPETITION_RATIO_THRESHOLD * 100)}%)`,
    interviewerNudge: triggered
      ? `I noticed some overlap in your answer — let's focus this down. In one sentence, what was YOUR specific contribution to that outcome? Start with 'I specifically...'`
      : "",
    sanitizedInput: answer,
  };
}

// ============================================================================
// GUARD 4: TRUNCATED / MALFORMED JD DETECTION
// ============================================================================

export interface JDGuardResult {
  isValid: boolean;
  severity: "block" | "warn" | "ok";
  issues: string[];
  /** UI message shown to the user uploading the JD */
  userFacingMessage: string;
  /** Sanitized JD text safe to send to LLM (or null if blocked) */
  sanitizedJD: string | null;
}

/**
 * Validates a JD before sending to LLM.
 * Catches: too short, boilerplate-only, encoding artifacts, missing key sections.
 */
export function validateJD(rawJD: string): JDGuardResult {
  const issues: string[] = [];
  const trimmed = rawJD.trim();

  // 1. Empty / too short
  if (trimmed.length < JD_MINIMUM_CHARS) {
    return {
      isValid: false,
      severity: "block",
      issues: ["JD text is too short to analyze"],
      userFacingMessage:
        "The job description you uploaded appears to be empty or too short. Please paste the full JD text (minimum 100 characters) or upload a different PDF.",
      sanitizedJD: null,
    };
  }

  // 2. Boilerplate-only JD
  const boilerplateMatches = JD_BOILERPLATE_PATTERNS.filter((p) =>
    p.test(trimmed)
  );
  const lineCount = trimmed.split("\n").filter((l) => l.trim().length > 10).length;

  if (boilerplateMatches.length > 0 && lineCount < 8) {
    issues.push(
      `Detected boilerplate pattern(s): ${boilerplateMatches.map((p) => p.source).join(", ")}`
    );
  }

  // 3. Encoding artifacts (garbled PDF extraction)
  const garbleRatio =
    (trimmed.match(/[^\x20-\x7E\n\r\t]/g) ?? []).length / trimmed.length;
  if (garbleRatio > 0.12) {
    return {
      isValid: false,
      severity: "block",
      issues: [
        `PDF extraction produced garbled text (${Math.round(garbleRatio * 100)}% non-ASCII)`,
      ],
      userFacingMessage:
        "The PDF couldn't be read cleanly — it may be scanned or image-based. Please try copying and pasting the JD text directly instead of uploading the PDF.",
      sanitizedJD: null,
    };
  }

  // 4. Missing required JD sections
  const hasRequirements =
    /requir|skill|qualif|experience|must have/i.test(trimmed);
  const hasRole =
    /role|position|responsib|duties|job|engineer|develop|analyst/i.test(
      trimmed
    );

  if (!hasRequirements) {
    issues.push("JD appears to be missing a requirements/skills section");
  }
  if (!hasRole) {
    issues.push("JD does not appear to describe a specific role or responsibilities");
  }

  // 5. Unique keyword count — prevent pure-boilerplate passing
  const tokens = tokenize(trimmed);
  const uniqueMeaningful = new Set(
    tokens.filter((t) => !STOP_WORDS.has(t) && t.length > 3)
  );
  if (uniqueMeaningful.size < JD_MINIMUM_UNIQUE_KEYWORDS) {
    issues.push(
      `Only ${uniqueMeaningful.size} unique meaningful keywords found (minimum: ${JD_MINIMUM_UNIQUE_KEYWORDS})`
    );
  }

  const isBlocked = issues.length >= 3;
  const isWarning = issues.length >= 1 && !isBlocked;

  // Sanitize: strip encoding artifacts, normalize whitespace
  const sanitized = trimmed
    .replace(/[^\x20-\x7E\n\r\t]/g, " ")
    .replace(/\s{3,}/g, "\n\n")
    .substring(0, 12_000);

  return {
    isValid: !isBlocked,
    severity: isBlocked ? "block" : isWarning ? "warn" : "ok",
    issues,
    userFacingMessage:
      isBlocked
        ? `The uploaded JD could not be parsed: ${issues.join("; ")}. Please paste the full job description text manually.`
        : isWarning
        ? `JD uploaded with ${issues.length} warning(s): ${issues.join("; ")}. The analysis may be less precise — consider adding a more complete JD.`
        : "JD validated successfully.",
    sanitizedJD: sanitized,
  };
}

// ============================================================================
// ORCHESTRATOR: Run all guards on a candidate answer
// ============================================================================

export interface AnswerGuardReport {
  /** Should the answer be blocked from LLM evaluation? */
  shouldBlock: boolean;
  /** Should we display a nudge to the interviewer? */
  shouldNudge: boolean;
  /** The nudge to inject as the AI interviewer's response */
  primaryNudge: string;
  /** Sanitized answer safe for LLM */
  llmSafeAnswer: string;
  /** All guard results for telemetry panel */
  guardResults: GuardResult[];
  /** Live telemetry metrics for the UI */
  telemetry: {
    wordCount: number;
    informationDensity: number;
    repetitionRatio: number;
    guardsFired: string[];
  };
}

export function runAnswerGuards(
  answer: string,
  questionType: "TECHNICAL" | "BEHAVIORAL" | "GENERAL" = "GENERAL"
): AnswerGuardReport {
  const tokens = tokenize(answer);
  const wordCount = tokens.length;
  const meaningfulCount = countMeaningfulWords(tokens);
  const density = wordCount > 0 ? meaningfulCount / wordCount : 1;
  const repetitionRatio = computeRepetitionRatio(tokens);

  const silenceResult = detectSilence(answer, questionType);
  const ramblingResult = detectRambling(answer);
  const repetitionResult = detectRepetition(answer);

  const allResults = [silenceResult, ramblingResult, repetitionResult];
  const triggered = allResults.filter((r) => r.triggered);
  const blockers = triggered.filter((r) => r.severity === "block");

  // Priority: block > warn > nudge
  const primaryResult = blockers[0] ?? triggered[0] ?? null;

  // For LLM: use silence guard's sanitized (unchanged) unless rambling, use rambling truncation
  const llmSafeAnswer = ramblingResult.triggered
    ? ramblingResult.sanitizedInput
    : answer;

  return {
    shouldBlock: blockers.length > 0,
    shouldNudge: triggered.length > 0,
    primaryNudge: primaryResult?.interviewerNudge ?? "",
    llmSafeAnswer,
    guardResults: allResults,
    telemetry: {
      wordCount,
      informationDensity: Math.round(density * 100),
      repetitionRatio: Math.round(repetitionRatio * 100),
      guardsFired: triggered.map((r) => r.guardName),
    },
  };
}
