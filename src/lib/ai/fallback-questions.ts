/**
 * AIview — PrepPilot Engine
 * Module B: Local Rule-Based Fallback Question Bank
 *
 * Activates when LLM is unavailable (timeout, API error, exhausted retries).
 * Provides deterministic, company/role/phase calibrated questions —
 * zero LLM dependency, instant response.
 *
 * Architecture:
 *   1. FALLBACK_QUESTION_BANK  — static structured question registry
 *   2. selectFallbackQuestion  — context-aware question picker
 *   3. getLocalInterviewerResponse — full turn handler without LLM
 *   4. FallbackSessionManager  — stateful fallback session
 */

// ============================================================================
// TYPES
// ============================================================================

export type FallbackPhase =
  | "TECH_CORE"
  | "DATA_STRUCTURES"
  | "DBMS"
  | "SYSTEM_DESIGN"
  | "BEHAVIORAL_STAR"
  | "CULTURAL_FIT"
  | "RESUME_TRAP"
  | "FOLLOW_UP_PROBE";

export type FallbackDifficulty = "EASY" | "MEDIUM" | "HARD";

export interface FallbackQuestion {
  id: string;
  company: string; // "ACCENTURE" | "TCS_DIGITAL" | "ANY"
  phase: FallbackPhase;
  difficulty: FallbackDifficulty;
  questionText: string;
  /** Keywords in a strong answer — used for local STAR scoring */
  expectedKeywords: string[];
  /** Follow-up probe if initial answer is shallow */
  followUpProbe: string;
  /** What structural element is this question primarily testing */
  starFocus: "SITUATION" | "ACTION" | "RESULT" | "ALL";
}

export interface LocalInterviewerTurn {
  nextQuestion: string;
  isFollowUp: boolean;
  followUpReason: string | null;
  sessionComplete: boolean;
  liveTelemetry: {
    starStatus: string;
    fillerCountSoFar: number;
    hasResult: boolean;
    urgencyNudge: string | null;
    fallbackMode: true;
  };
}

// ============================================================================
// FALLBACK QUESTION BANK
// ============================================================================

export const FALLBACK_QUESTION_BANK: FallbackQuestion[] = [
  // ── ACCENTURE CORE ─────────────────────────────────────────────────────────
  {
    id: "ACC-TC-001",
    company: "ACCENTURE",
    phase: "TECH_CORE",
    difficulty: "MEDIUM",
    questionText:
      "Walk me through the most technically challenging feature you built in your final year project. What was the problem, what was your approach, and how did you measure success?",
    expectedKeywords: ["built", "implemented", "reduced", "improved", "ms", "%", "users", "requests"],
    followUpProbe:
      "That's a good overview. What specific metric changed — latency, throughput, error rate — and by how much?",
    starFocus: "ALL",
  },
  {
    id: "ACC-TC-002",
    company: "ACCENTURE",
    phase: "TECH_CORE",
    difficulty: "MEDIUM",
    questionText:
      "Explain the difference between REST and GraphQL. For an Accenture client with a complex data model and a mobile app, which would you recommend and why?",
    expectedKeywords: ["endpoint", "query", "over-fetching", "client", "mobile", "bandwidth"],
    followUpProbe:
      "You mentioned [approach] — have you implemented either of these in a project? Walk me through that decision.",
    starFocus: "ACTION",
  },
  {
    id: "ACC-DS-001",
    company: "ACCENTURE",
    phase: "DATA_STRUCTURES",
    difficulty: "MEDIUM",
    questionText:
      "If you had to design a notification system for an Accenture client with 10,000 simultaneous users, what data structure would you use for the message queue and why?",
    expectedKeywords: ["queue", "priority", "heap", "fifo", "lifo", "dequeue", "enqueue"],
    followUpProbe:
      "What happens when the queue is full? How would you handle backpressure from the producer side?",
    starFocus: "ACTION",
  },
  {
    id: "ACC-DB-001",
    company: "ACCENTURE",
    phase: "DBMS",
    difficulty: "MEDIUM",
    questionText:
      "You're designing a database for an e-commerce client. Orders table has 50 million rows. A product details query is taking 12 seconds. Walk me through how you'd diagnose and fix that.",
    expectedKeywords: ["index", "explain", "query plan", "join", "foreign key", "partition", "cache"],
    followUpProbe:
      "After adding an index, the query dropped from 12 seconds to 3 seconds. But 3 seconds is still too slow for a mobile checkout. What would you do next?",
    starFocus: "ALL",
  },
  {
    id: "ACC-BS-001",
    company: "ACCENTURE",
    phase: "BEHAVIORAL_STAR",
    difficulty: "MEDIUM",
    questionText:
      "Accenture values Client Value Creation. Tell me about a time you delivered something — a project, a feature, a fix — that created real impact for someone else. Walk me through the Situation, your Task, your Action, the Result, and what you Learned.",
    expectedKeywords: ["situation", "task", "action", "result", "learned", "impact", "delivered"],
    followUpProbe:
      "You mentioned the result — can you put a number to it? Even an estimate: how many people benefited, how much time was saved, what improved?",
    starFocus: "ALL",
  },
  {
    id: "ACC-CF-001",
    company: "ACCENTURE",
    phase: "CULTURAL_FIT",
    difficulty: "EASY",
    questionText:
      "Accenture operates across 200+ clients in 120 countries. Describe a situation where you worked with people who had very different perspectives or working styles. How did you navigate that?",
    expectedKeywords: ["team", "different", "perspective", "adapted", "communicated", "resolved", "outcome"],
    followUpProbe:
      "What specifically did you do differently in how you communicated compared to how you'd normally work?",
    starFocus: "ACTION",
  },
  {
    id: "ACC-CF-002",
    company: "ACCENTURE",
    phase: "CULTURAL_FIT",
    difficulty: "EASY",
    questionText:
      "Why Accenture specifically — and not another IT services company? What about Accenture's approach or values resonates with where you want to go professionally?",
    expectedKeywords: ["client", "value", "learning", "technology", "consulting", "impact", "scale"],
    followUpProbe:
      "That's interesting — is there a specific Accenture initiative, practice, or technology focus area that you've looked into in depth?",
    starFocus: "SITUATION",
  },
  {
    id: "ACC-RT-001",
    company: "ACCENTURE",
    phase: "RESUME_TRAP",
    difficulty: "HARD",
    questionText:
      "Your resume mentions [Redis / Microservices / Docker]. Walk me through a specific decision you made in your project where that technology was the right choice over an alternative. What was the trade-off you consciously made?",
    expectedKeywords: ["trade-off", "chose", "alternative", "because", "considered", "compared"],
    followUpProbe:
      "What would have happened if you'd chosen the alternative approach? What would you have gained, and what would you have given up?",
    starFocus: "ACTION",
  },
  {
    id: "ACC-FU-001",
    company: "ACCENTURE",
    phase: "FOLLOW_UP_PROBE",
    difficulty: "MEDIUM",
    questionText:
      "You mentioned [technology/claim from previous answer]. Can you tell me specifically: what input did you give it, what did it process, and what was the measurable output?",
    expectedKeywords: ["input", "process", "output", "measured", "result", "specifically"],
    followUpProbe: "",
    starFocus: "RESULT",
  },

  // ── TCS DIGITAL CORE ───────────────────────────────────────────────────────
  {
    id: "TCS-DS-001",
    company: "TCS_DIGITAL",
    phase: "DATA_STRUCTURES",
    difficulty: "MEDIUM",
    questionText:
      "What is the time complexity of HashMap.get() in Java under normal conditions and when does it degrade to O(n)? Give me a concrete scenario where this degradation matters in production.",
    expectedKeywords: ["O(1)", "O(n)", "hash collision", "linked list", "load factor", "bucket"],
    followUpProbe:
      "How does Java 8's HashMap handle buckets with many collisions differently from earlier versions?",
    starFocus: "ACTION",
  },
  {
    id: "TCS-SD-001",
    company: "TCS_DIGITAL",
    phase: "SYSTEM_DESIGN",
    difficulty: "HARD",
    questionText:
      "Design a URL shortener — walk me through your complete data model, API endpoints, caching layer, and how you'd handle 1 million daily active users.",
    expectedKeywords: ["hash", "redirect", "cache", "TTL", "database", "scale", "CDN", "rate limit"],
    followUpProbe:
      "What happens if two users submit the same long URL at the same time? How does your system avoid generating two different short codes?",
    starFocus: "ALL",
  },

  // ── GENERAL TECH (ANY company) ─────────────────────────────────────────────
  {
    id: "GEN-DB-001",
    company: "ANY",
    phase: "DBMS",
    difficulty: "MEDIUM",
    questionText:
      "Explain ACID properties and give me a concrete example of each from a real or hypothetical e-commerce application.",
    expectedKeywords: ["atomicity", "consistency", "isolation", "durability", "transaction", "rollback"],
    followUpProbe:
      "In a distributed database system, which ACID property is hardest to guarantee across multiple nodes and why?",
    starFocus: "ALL",
  },
  {
    id: "GEN-TC-001",
    company: "ANY",
    phase: "TECH_CORE",
    difficulty: "EASY",
    questionText:
      "Walk me through what happens end-to-end when a user submits a form on a React frontend connected to a Node.js backend — from the browser click to the database write.",
    expectedKeywords: ["event", "HTTP", "request", "route", "middleware", "query", "response", "state"],
    followUpProbe:
      "At which point in that flow would you add authentication validation, and what would happen if the token is expired?",
    starFocus: "ACTION",
  },
  {
    id: "GEN-BS-001",
    company: "ANY",
    phase: "BEHAVIORAL_STAR",
    difficulty: "MEDIUM",
    questionText:
      "Tell me about a time you had to learn a technology you'd never used before — under time pressure. Walk me through how you approached it, what you actually built with it, and how you'd do it differently now.",
    expectedKeywords: ["learned", "documentation", "built", "deadline", "shipped", "improved"],
    followUpProbe:
      "You mentioned learning [technology]. If I asked you to teach its core concept to a classmate in 2 minutes right now, what would you say?",
    starFocus: "ALL",
  },
  {
    id: "GEN-RT-001",
    company: "ANY",
    phase: "RESUME_TRAP",
    difficulty: "HARD",
    questionText:
      "Your resume lists your project as a full-stack application. Describe your specific contribution — not your team's, yours — to the most technically complex part of the system.",
    expectedKeywords: ["i built", "i implemented", "i designed", "i fixed", "i optimized", "my responsibility"],
    followUpProbe:
      "If your teammate had built that part instead of you, would the outcome have been different? What specifically would have changed?",
    starFocus: "ACTION",
  },
];

// ============================================================================
// QUESTION SELECTOR — Context-Aware Deterministic Selection
// ============================================================================

interface SelectionContext {
  company: string;
  /** What phases have already been used in this session */
  usedPhases: FallbackPhase[];
  /** IDs of questions already asked */
  usedQuestionIds: string[];
  /** Preferred difficulty for this turn */
  difficulty?: FallbackDifficulty;
  /** Force a specific phase */
  forcePhase?: FallbackPhase;
  /** Current turn number (1-indexed) */
  turnNumber: number;
  /** Is this a follow-up trigger? */
  isFollowUpNeeded: boolean;
}

/** Deterministic interview pipeline per turn number */
const TURN_PHASE_MAP: Record<number, FallbackPhase> = {
  1: "TECH_CORE",
  2: "DATA_STRUCTURES",
  3: "BEHAVIORAL_STAR",
  4: "DBMS",
  5: "CULTURAL_FIT",
};

export function selectFallbackQuestion(
  ctx: SelectionContext
): FallbackQuestion {
  const {
    company,
    usedPhases,
    usedQuestionIds,
    difficulty,
    forcePhase,
    turnNumber,
    isFollowUpNeeded,
  } = ctx;

  // Follow-up takes priority
  if (isFollowUpNeeded) {
    const followUp = FALLBACK_QUESTION_BANK.find(
      (q) =>
        q.phase === "FOLLOW_UP_PROBE" &&
        (q.company === company || q.company === "ANY") &&
        !usedQuestionIds.includes(q.id)
    );
    if (followUp) return followUp;
  }

  // Determine target phase
  const targetPhase = forcePhase ?? TURN_PHASE_MAP[turnNumber] ?? "TECH_CORE";

  // Filter: company match, phase match, not used
  const candidates = FALLBACK_QUESTION_BANK.filter((q) => {
    const companyMatch = q.company === company || q.company === "ANY";
    const phaseMatch = q.phase === targetPhase;
    const notUsed = !usedQuestionIds.includes(q.id);
    const diffMatch = difficulty ? q.difficulty === difficulty : true;
    return companyMatch && phaseMatch && notUsed && diffMatch;
  });

  if (candidates.length > 0) {
    // Deterministic: pick first match (sorted by id for reproducibility)
    return candidates.sort((a, b) => a.id.localeCompare(b.id))[0];
  }

  // Fallback 1: relax to ANY company
  const anyCandidates = FALLBACK_QUESTION_BANK.filter(
    (q) =>
      q.company === "ANY" &&
      q.phase === targetPhase &&
      !usedQuestionIds.includes(q.id)
  );
  if (anyCandidates.length > 0) return anyCandidates[0];

  // Fallback 2: relax phase, keep company/ANY, avoid used
  const relaxedCandidates = FALLBACK_QUESTION_BANK.filter(
    (q) =>
      (q.company === company || q.company === "ANY") &&
      !usedQuestionIds.includes(q.id)
  );
  if (relaxedCandidates.length > 0) return relaxedCandidates[0];

  // Fallback 3: allow repeated questions (last resort)
  return FALLBACK_QUESTION_BANK[0];
}

// ============================================================================
// LOCAL STAR SCORER — No LLM Required
// ============================================================================

interface LocalSTARScore {
  hasSituation: boolean;
  hasTask: boolean;
  hasAction: boolean;
  hasResult: boolean;
  hasLearning: boolean;
  hasQuantifiedResult: boolean;
  score: number; // 0–100
  missingComponents: string[];
}

function scoreLocalSTAR(answer: string, question: FallbackQuestion): LocalSTARScore {
  const lower = answer.toLowerCase();

  const hasSituation =
    /when|during|in (my|our|the)|last (year|month|semester)|project|team|we were/.test(lower);
  const hasTask =
    /my role|i was (responsible|tasked|asked)|i had to|assigned|needed to/.test(lower);
  const hasAction =
    / i (built|implemented|created|designed|fixed|wrote|refactored|added|deployed|optimized|tested|set up|configured)/.test(
      lower
    );
  const hasQuantifiedResult =
    /\d+\s*(%|ms|seconds|minutes|hours|users|requests|errors|lines|kb|mb|gb|faster|slower|more|less|reduced|improved|increased|dropped|saved)/.test(
      lower
    );
  const hasResult = hasQuantifiedResult || /result|outcome|this (helped|allowed|enabled|fixed)|in the end|as a result/.test(lower);
  const hasLearning = /learned|realized|realised|takeaway|next time|going forward|in retrospect|would do|mistake|improved my/.test(lower);

  // Keyword match
  const keywordsFound = question.expectedKeywords.filter((kw) =>
    lower.includes(kw.toLowerCase())
  );
  const keywordScore = Math.min((keywordsFound.length / question.expectedKeywords.length) * 40, 40);

  const componentScore =
    (hasSituation ? 10 : 0) +
    (hasTask ? 10 : 0) +
    (hasAction ? 20 : 0) +
    (hasResult ? 15 : 0) +
    (hasLearning ? 5 : 0);

  const score = Math.min(Math.round(componentScore + keywordScore), 100);

  const missingComponents = [
    !hasSituation && "Situation context",
    !hasTask && "Your specific task/role",
    !hasAction && "What YOU personally did",
    !hasResult && "Measurable outcome",
    !hasLearning && "What you learned",
  ].filter(Boolean) as string[];

  return {
    hasSituation,
    hasTask,
    hasAction,
    hasResult,
    hasLearning,
    hasQuantifiedResult,
    score,
    missingComponents,
  };
}

// ============================================================================
// LOCAL INTERVIEWER TURN HANDLER — Produces AI response without LLM
// ============================================================================

/**
 * Evaluates the candidate's answer locally and returns:
 *   - The next question (or follow-up)
 *   - Live telemetry
 *   - Whether the session is complete
 *
 * This function is the LLM FALLBACK — called when LLM is unavailable.
 */
export function getLocalInterviewerResponse(
  candidateAnswer: string,
  currentQuestion: FallbackQuestion,
  ctx: SelectionContext,
  fillerWordCount: number = 0
): LocalInterviewerTurn {
  const starScore = scoreLocalSTAR(candidateAnswer, currentQuestion);
  const wordCount = candidateAnswer.trim().split(/\s+/).filter(Boolean).length;

  // Determine if follow-up needed based on local scoring
  const needsFollowUp =
    !starScore.hasQuantifiedResult ||
    !starScore.hasAction ||
    (wordCount < 40 && ctx.turnNumber > 1);

  let nextQuestion: string;
  let isFollowUp = false;
  let followUpReason: string | null = null;

  if (needsFollowUp && !ctx.isFollowUpNeeded && ctx.turnNumber <= 4) {
    // Generate contextual follow-up
    nextQuestion = currentQuestion.followUpProbe.includes("[")
      ? currentQuestion.followUpProbe
      : currentQuestion.followUpProbe;
    isFollowUp = true;
    followUpReason = starScore.missingComponents.length > 0
      ? `Missing: ${starScore.missingComponents.slice(0, 2).join(", ")}`
      : "Answer lacked quantified result";
  } else {
    // Advance to next question
    const nextQ = selectFallbackQuestion({
      ...ctx,
      usedPhases: [...ctx.usedPhases, currentQuestion.phase],
      usedQuestionIds: [...ctx.usedQuestionIds, currentQuestion.id],
      turnNumber: ctx.turnNumber + 1,
      isFollowUpNeeded: false,
    });
    nextQuestion = nextQ.questionText;
  }

  const sessionComplete = ctx.turnNumber >= 5 && !needsFollowUp;

  // Urgency nudge for live telemetry
  let urgencyNudge: string | null = null;
  if (fillerWordCount >= 4) {
    urgencyNudge = "High filler word count — try to pause instead of saying 'um' or 'basically'";
  } else if (!starScore.hasQuantifiedResult && ctx.turnNumber >= 3) {
    urgencyNudge = "Add a specific number to your result — percentages, time saved, users impacted";
  }

  return {
    nextQuestion: sessionComplete ? "" : nextQuestion,
    isFollowUp,
    followUpReason,
    sessionComplete,
    liveTelemetry: {
      starStatus: starScore.missingComponents.length === 0
        ? "COMPLETE"
        : `MISSING_${starScore.missingComponents[0]?.toUpperCase().replace(/\s/g, "_")}`,
      fillerCountSoFar: fillerWordCount,
      hasResult: starScore.hasResult,
      urgencyNudge,
      fallbackMode: true,
    },
  };
}

// ============================================================================
// FALLBACK SESSION MANAGER — Stateful wrapper for interview flow
// ============================================================================

export class FallbackSessionManager {
  private company: string;
  private usedPhases: FallbackPhase[] = [];
  private usedQuestionIds: string[] = [];
  private turnNumber: number = 1;
  private currentQuestion: FallbackQuestion;
  private totalFillerCount: number = 0;
  public readonly sessionId: string;

  constructor(company: string, sessionId: string) {
    this.company = company;
    this.sessionId = sessionId;
    // Prime first question
    this.currentQuestion = selectFallbackQuestion({
      company,
      usedPhases: [],
      usedQuestionIds: [],
      turnNumber: 1,
      isFollowUpNeeded: false,
    });
  }

  /** Returns the first question to ask */
  getOpeningQuestion(): string {
    return this.currentQuestion.questionText;
  }

  /** Processes a candidate answer and returns the next turn */
  processAnswer(
    candidateAnswer: string,
    fillerWords: string[] = []
  ): LocalInterviewerTurn {
    this.totalFillerCount += fillerWords.length;

    const ctx: SelectionContext = {
      company: this.company,
      usedPhases: this.usedPhases,
      usedQuestionIds: this.usedQuestionIds,
      turnNumber: this.turnNumber,
      isFollowUpNeeded: false,
    };

    const result = getLocalInterviewerResponse(
      candidateAnswer,
      this.currentQuestion,
      ctx,
      this.totalFillerCount
    );

    // Update state
    this.usedPhases.push(this.currentQuestion.phase);
    this.usedQuestionIds.push(this.currentQuestion.id);

    if (!result.isFollowUp) {
      this.turnNumber++;
      if (!result.sessionComplete) {
        this.currentQuestion = selectFallbackQuestion({
          company: this.company,
          usedPhases: this.usedPhases,
          usedQuestionIds: this.usedQuestionIds,
          turnNumber: this.turnNumber,
          isFollowUpNeeded: false,
        });
      }
    }

    return result;
  }

  get currentTurn(): number {
    return this.turnNumber;
  }

  get isComplete(): boolean {
    return this.turnNumber > 5;
  }
}
