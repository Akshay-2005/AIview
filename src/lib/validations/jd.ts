/**
 * AIview — PrepPilot Engine
 * Module A: Targeted JD Simulation Engine — Zod Schema Layer
 *
 * Covers: JD Analysis, Resume-JD Gap, Multi-Turn Prompt, Readiness Scorecard
 */

import { z } from "zod";

// ============================================================================
// ENUMS
// ============================================================================

export const CompanyEnum = z.enum([
  "ACCENTURE",
  "TCS_DIGITAL",
  "COGNIZANT_GENC",
  "INFOSYS_SP",
  "WIPRO_ELITE",
  "CUSTOM",
]);
export type Company = z.infer<typeof CompanyEnum>;

export const InterviewRoundEnum = z.enum([
  "ONLINE_ASSESSMENT",
  "TECHNICAL_1",
  "TECHNICAL_2",
  "MANAGERIAL",
  "HR_BEHAVIORAL",
  "COMMUNICATION_TEST",
  "CASE_STUDY",
]);

export const GapSeverityEnum = z.enum(["CRITICAL", "WARNING", "ADVISORY"]);

export const QuestionTypeEnum = z.enum([
  "TECH_ARCHITECTURE",
  "DATA_STRUCTURES",
  "DBMS",
  "SYSTEM_DESIGN",
  "BEHAVIORAL_STAR",
  "CULTURAL_FIT",
  "RESUME_TRAP",
  "FOLLOW_UP",
]);

export const STARComponentEnum = z.enum([
  "SITUATION",
  "TASK",
  "ACTION",
  "RESULT",
  "MISSING_RESULT",
  "MISSING_ALL",
  "COMPLETE",
]);

// ============================================================================
// 1. /api/v1/jd/analyze — REQUEST SCHEMA
// ============================================================================

/** Raw input from client — multipart/form-data or JSON body */
export const JDAnalyzeRequestSchema = z.object({
  /** Plain-text JD (if user pastes directly) */
  jdRawText: z
    .string()
    .min(100, "JD text must be at least 100 characters")
    .max(12_000, "JD text must be under 12,000 characters")
    .optional(),

  /** Base-64 encoded PDF bytes (alternative to raw text) */
  jdPdfBase64: z
    .string()
    .regex(/^[A-Za-z0-9+/]+=*$/, "Invalid Base-64 string")
    .optional(),

  /** Candidate's resume as plain text — extracted by client-side PDF parser */
  resumeText: z
    .string()
    .min(80, "Resume text too short — ensure full content is sent")
    .max(10_000),

  /** Hint for which company to use (impacts cultural competency extraction) */
  companyHint: CompanyEnum.default("ACCENTURE"),

  /** Target role title for calibration */
  targetRoleTitle: z
    .string()
    .min(3)
    .max(100)
    .default("Associate Software Engineer"),

  /** User ID for session linkage */
  userId: z.string().uuid("Invalid user UUID"),
})
  .refine(
    (data) => data.jdRawText || data.jdPdfBase64,
    { message: "Either jdRawText or jdPdfBase64 must be provided", path: ["jdRawText"] }
  );

export type JDAnalyzeRequest = z.infer<typeof JDAnalyzeRequestSchema>;

// ============================================================================
// 2. /api/v1/jd/analyze — PARSED JD RESPONSE SCHEMA
// ============================================================================

/** One required skill extracted from the JD */
const ExtractedSkillSchema = z.object({
  name: z.string(),
  category: z.enum([
    "DATA_STRUCTURES_ALGO",
    "DATABASE",
    "CLOUD_DEVOPS",
    "LANGUAGE_FRAMEWORK",
    "SOFT_SKILL",
    "DOMAIN_KNOWLEDGE",
    "TOOL_PLATFORM",
  ]),
  /** explicit = stated in JD; inferred = contextually required but not stated */
  sourceType: z.enum(["explicit", "inferred"]),
  /** JD weight: how frequently / prominently it appears (1–5) */
  jdWeight: z.number().int().min(1).max(5),
});

/** One company cultural competency extracted from JD */
const CulturalCompetencySchema = z.object({
  name: z.string(),
  description: z.string(),
  /** Specific interview behavioral signal that maps to this competency */
  behavioralSignal: z.string(),
});

/** One expected interview round with question focus areas */
const ExpectedRoundSchema = z.object({
  roundNumber: z.number().int().min(1),
  roundType: InterviewRoundEnum,
  roundName: z.string(),
  focusAreas: z.array(z.string()).min(1),
  typicalDurationMinutes: z.number().int(),
  companySpecificNote: z.string().optional(),
});

/** Full parsed JD intelligence object */
export const ParsedJDIntelligenceSchema = z.object({
  /** Unique ID for this JD analysis (use for session linkage) */
  jdId: z.string().uuid(),

  /** Company and role metadata */
  company: CompanyEnum,
  roleTitle: z.string(),
  roleSeniority: z.enum(["INTERN", "ENTRY_LEVEL", "MID_LEVEL", "SENIOR"]),

  /** Core technical requirements */
  coreRequiredSkills: z.array(ExtractedSkillSchema).min(1),
  niceToHaveSkills: z.array(ExtractedSkillSchema),

  /** Cultural / behavioral competencies specific to company */
  culturalCompetencies: z.array(CulturalCompetencySchema).min(1),

  /** Expected interview rounds in sequence */
  expectedRounds: z.array(ExpectedRoundSchema).min(1),

  /** Raw keyword frequency map: keyword → count in JD */
  keywordFrequency: z.record(z.string(), z.number().int().nonnegative()),

  /** Verbatim JD summary (2–3 sentences) */
  jdSummary: z.string().max(600),

  /** UTC timestamp of analysis */
  analyzedAt: z.string().datetime(),
});

export type ParsedJDIntelligence = z.infer<typeof ParsedJDIntelligenceSchema>;

// ============================================================================
// 3. RESUME-JD GAP ANALYZER SCHEMA
// ============================================================================

/** One resume skill with verification status */
const ResumeSkillSchema = z.object({
  skill: z.string(),
  /** Verified = demonstrable in project description with metrics */
  verified: z.boolean(),
  /** Evidence found in resume text — null if buzzword/unverified */
  evidenceSnippet: z.string().nullable(),
  /** Lines in resume where this skill appears */
  resumeLineReferences: z.array(z.number().int()).default([]),
});

/** One specific gap warning alert */
const GapWarningAlertSchema = z.object({
  alertId: z.string().uuid(),
  severity: GapSeverityEnum,
  /** Short headline (≤80 chars) */
  headline: z.string().max(80),
  /**
   * Full diagnostic sentence — must follow the pattern:
   * "JD requires [X] because [reason], but resume shows [actual state]."
   */
  diagnosticSentence: z.string().max(300),
  /** Concrete 1–3 step remediation */
  remediationSteps: z.array(z.string().max(200)).min(1).max(3),
  /** JD skill this maps to */
  jdSkillReference: z.string(),
  /** Estimated preparation effort in hours */
  estimatedPrepHours: z.number().nonnegative(),
});

/** Full resume-JD gap analysis output */
export const ResumeJDGapAnalysisSchema = z.object({
  jdId: z.string().uuid(),
  userId: z.string().uuid(),

  /** Parsed resume skills with verification status */
  resumeSkills: z.array(ResumeSkillSchema),

  /** Score dimensions — all 0–100 */
  technicalFitScore: z.number().min(0).max(100),
  behavioralFitScore: z.number().min(0).max(100),
  roleKeywordCoverageScore: z.number().min(0).max(100),

  /** Weighted overall match percentage:
   * 0.50 * technical + 0.30 * keyword + 0.20 * behavioral
   */
  overallMatchPercent: z.number().min(0).max(100),

  /** Mandatory: exactly 3 gap warning alerts */
  gapWarningAlerts: z
    .array(GapWarningAlertSchema)
    .min(3, "Must produce exactly 3 gap warnings")
    .max(3),

  /** Skills in JD that are completely absent from resume */
  missingSkills: z.array(z.string()),

  /** Skills on resume flagged as buzzwords without supporting evidence */
  unverifiedBuzzwords: z.array(z.string()),

  /** Skills verified and matched to JD — resume strengths */
  matchedVerifiedSkills: z.array(z.string()),

  /** Recommendation: should candidate apply now, prep first, or both */
  applicationReadinessVerdict: z.enum([
    "APPLY_NOW",        // ≥80% match, no CRITICAL gaps
    "PREP_THEN_APPLY",  // 60–79%, gaps are fixable in <2 weeks
    "TARGETED_UPSKILL", // <60%, significant gaps
  ]),

  analyzedAt: z.string().datetime(),
});

export type ResumeJDGapAnalysis = z.infer<typeof ResumeJDGapAnalysisSchema>;

// ============================================================================
// 4. MULTI-TURN INTERVIEW SESSION SCHEMAS
// ============================================================================

/** One turn in the multi-turn interview conversation */
const InterviewTurnSchema = z.object({
  turnId: z.string().uuid(),
  turnNumber: z.number().int().min(1),
  questionType: QuestionTypeEnum,

  /** The question asked by the AI interviewer */
  aiQuestion: z.string().max(1000),
  /** If this is a follow-up, what triggered it */
  followUpTrigger: z.string().nullable(),

  /** Candidate's spoken answer */
  candidateAnswer: z.string().max(6000),

  /** Real-time acoustic metrics */
  wordsPerMinute: z.number().nonnegative(),
  fillerWords: z.array(z.string()),
  silentPauseCount: z.number().int().nonnegative(),
  longestPauseSeconds: z.number().nonnegative(),

  /** STAR structure detection for this single answer */
  starComponentsFound: z.array(STARComponentEnum),
  hasQuantifiedResult: z.boolean(),

  /** Whether AI will generate a contextual follow-up for this answer */
  requiresFollowUp: z.boolean(),

  turnTimestampUtc: z.string().datetime(),
});

/** Request to process one interview turn (candidate speaks, AI responds) */
export const ProcessInterviewTurnRequestSchema = z.object({
  sessionId: z.string().uuid(),
  jdId: z.string().uuid(),
  userId: z.string().uuid(),
  turnNumber: z.number().int().min(1),
  candidateAnswer: z.string().min(1, "Answer cannot be empty").max(6000),
  wordsPerMinute: z.number().nonnegative().default(0),
  fillerWords: z.array(z.string()).default([]),
  silentPauseCount: z.number().int().nonnegative().default(0),
  longestPauseSeconds: z.number().nonnegative().default(0),
  /** Full conversation history so far (for contextual follow-up generation) */
  conversationHistory: z.array(
    z.object({
      role: z.enum(["system", "assistant", "user"]),
      content: z.string().max(6000),
    })
  ).default([]),
});

export type ProcessInterviewTurnRequest = z.infer<
  typeof ProcessInterviewTurnRequestSchema
>;

/** Response from the AI interviewer for one turn */
export const InterviewTurnResponseSchema = z.object({
  sessionId: z.string().uuid(),
  turnId: z.string().uuid(),
  /** AI's next question or follow-up */
  nextQuestion: z.string(),
  /** Whether this is a dynamic follow-up or a planned next question */
  isFollowUp: z.boolean(),
  followUpReason: z.string().nullable(),
  /** Live partial evaluation of this answer (for real-time UI telemetry) */
  liveTelemetry: z.object({
    starStatus: STARComponentEnum,
    fillerCountSoFar: z.number().int(),
    hasResult: z.boolean(),
    urgencyNudge: z.string().nullable(),
  }),
  /** Is the session complete? */
  sessionComplete: z.boolean(),
  updatedConversationHistory: z.array(
    z.object({
      role: z.enum(["system", "assistant", "user"]),
      content: z.string(),
    })
  ),
});

export type InterviewTurnResponse = z.infer<typeof InterviewTurnResponseSchema>;

// ============================================================================
// 5. POST-INTERVIEW JD READINESS SCORECARD SCHEMA
// ============================================================================

/** One JD-competency-specific score with diagnosis */
const JDCompetencyScoreSchema = z.object({
  competencyName: z.string(),
  /** Which JD requirement this maps to */
  jdRequirementReference: z.string(),
  score: z.number().min(0).max(100),
  /** What the candidate actually said (verbatim excerpt, ≤200 chars) */
  candidateResponseExcerpt: z.string().max(200),
  /**
   * Structural improvement — what needed to change in the answer STRUCTURE,
   * NOT a rote answer. Never includes the answer itself.
   */
  structuralImprovement: z.string().max(500),
  /** Was this a verified strength or a gap? */
  verdict: z.enum(["STRENGTH", "PARTIAL", "GAP"]),
});

/** One model answer improvement (structural, not content) */
const StructuralImprovementSchema = z.object({
  questionNumber: z.number().int().min(1),
  questionAsked: z.string().max(300),
  candidateResponseSummary: z.string().max(200),
  /**
   * Three things to improve in STRUCTURE only:
   * 1. STAR completeness, 2. Quantification, 3. Pacing/clarity
   * Never tells the candidate what the correct technical answer is.
   */
  structuralFixes: z
    .array(
      z.object({
        dimension: z.enum([
          "STAR_COMPLETENESS",
          "QUANTIFICATION",
          "PACING_CLARITY",
          "TECHNICAL_SPECIFICITY",
          "RELEVANCE_TO_JD",
        ]),
        whatWasMissing: z.string().max(200),
        howToFix: z.string().max(300),
        examplePhrase: z
          .string()
          .max(150)
          .describe(
            "A structural template phrase, NOT the full answer: e.g., 'This reduced latency by X%, allowing Y users to...'"
          ),
      })
    )
    .min(1)
    .max(3),
});

/** Full post-interview JD readiness scorecard */
export const JDReadinessScorecardSchema = z.object({
  sessionId: z.string().uuid(),
  jdId: z.string().uuid(),
  userId: z.string().uuid(),
  company: CompanyEnum,
  roleTitle: z.string(),

  /** The headline score: "Accenture SDE Readiness: X/100" */
  jdReadinessScore: z.number().min(0).max(100),

  /** Tier classification */
  readinessTier: z.enum([
    "OFFER_READY",          // ≥88
    "STRONG_CONTENDER",     // 72–87
    "NEEDS_TARGETED_PREP",  // 55–71
    "SIGNIFICANT_GAPS",     // <55
  ]),

  /** Per-competency breakdown */
  competencyBreakdown: z.array(JDCompetencyScoreSchema).min(3),

  /** Structural improvements per question — NO model answers */
  structuralImprovements: z.array(StructuralImprovementSchema),

  /** Top 3 specific gap warnings from gap analysis that materialised in interview */
  confirmedGapWarnings: z.array(GapWarningAlertSchema).max(3),

  /** Adaptive 7-day prep plan targeting confirmed gaps */
  adaptivePrepPlan: z
    .array(
      z.object({
        day: z.number().int().min(1).max(7),
        focusArea: z.string(),
        specificTask: z.string().max(300),
        successMetric: z.string().max(150),
        estimatedMinutes: z.number().int().min(15).max(240),
      })
    )
    .length(7),

  /** Overall verdict sentence for display */
  verdictSentence: z.string().max(300),

  generatedAt: z.string().datetime(),
});

export type JDReadinessScorecard = z.infer<typeof JDReadinessScorecardSchema>;

// ============================================================================
// 6. API RESPONSE ENVELOPE
// ============================================================================

export function successResponse<T>(data: T, meta?: Record<string, unknown>) {
  return {
    success: true as const,
    data,
    meta: meta ?? {},
    timestamp: new Date().toISOString(),
  };
}

export function errorResponse(
  code: string,
  message: string,
  details?: unknown
) {
  return {
    success: false as const,
    error: { code, message, details: details ?? null },
    timestamp: new Date().toISOString(),
  };
}
