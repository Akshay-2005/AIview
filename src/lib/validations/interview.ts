import { z } from "zod";

// ======================================================================
// ENUMS & CONSTANTS
// ======================================================================

export const EducationTierEnum = z.enum([
  "TIER_1",
  "TIER_2",
  "TIER_3",
  "OFF_CAMPUS_AUTONOMOUS",
]);

export const RoleTrackEnum = z.enum([
  "SOFTWARE_IT",
  "CORE_ENGINEERING",
  "BUSINESS_MANAGEMENT",
  "FINANCE_CONSULTING",
  "MARKETING_SALES",
  "OTHER_PROFESSIONAL",
]);

export const InterviewPhaseEnum = z.enum([
  "WARMUP",
  "CORE_TECHNICAL",
  "ADVERSARIAL_RESUME_TRAP",
  "STAR_BEHAVIORAL",
  "WRAPUP",
]);

// ======================================================================
// USER & PROFILE VALIDATION
// ======================================================================

export const CreateUserProfileSchema = z.object({
  collegeName: z.string().min(2, "College name must have at least 2 characters").max(120),
  educationTier: EducationTierEnum.default("TIER_3"),
  degree: z.string().min(2, "Degree must have at least 2 characters").max(80),
  graduationYear: z.number().int().min(2023).max(2030),
  targetIndustry: RoleTrackEnum.default("SOFTWARE_IT"),
  targetCompanies: z.array(z.string().min(1)).min(1, "Please select at least one target company"),
  spokenComfortRating: z.number().int().min(1).max(5),
  vernacularLanguage: z.string().optional(),
});

export type CreateUserProfileInput = z.infer<typeof CreateUserProfileSchema>;

// ======================================================================
// SESSION INITIALIZATION
// ======================================================================

export const InitializeSessionSchema = z.object({
  userId: z.string().uuid("Invalid user UUID"),
  resumeId: z.string().uuid("Invalid resume UUID").optional(),
  jobDescriptionId: z.string().uuid("Invalid JD UUID").optional(),
  customJDText: z.string().max(8000).optional(),
  targetRoleTitle: z.string().min(2).max(100).default("Associate Software Engineer"),
});

export type InitializeSessionInput = z.infer<typeof InitializeSessionSchema>;

// ======================================================================
// SPOKEN ANSWER SUBMISSION (PER CONVERSATIONAL TURN)
// ======================================================================

export const SubmitAnswerSchema = z.object({
  sessionId: z.string().uuid(),
  questionId: z.string().uuid(),
  transcriptText: z.string().min(1, "Transcript cannot be empty").max(4000),
  durationSeconds: z.number().nonnegative(),
  wordsPerMinute: z.number().nonnegative(),
  fillerWordsFound: z.array(z.string()).default([]),
  silentPausesCount: z.number().int().nonnegative().default(0),
  longestPauseSeconds: z.number().nonnegative().default(0.0),
  audioBlobBase64: z.string().optional(), // For edge speech analysis
});

export type SubmitAnswerInput = z.infer<typeof SubmitAnswerSchema>;

// ======================================================================
// EVALUATION & DIAGNOSTIC RESULT SCHEMA
// ======================================================================

export const EvaluationResultSchema = z.object({
  sessionId: z.string().uuid(),
  compositeScore: z.number().min(0).max(100),
  readinessTier: z.enum([
    "TIER_1_INTERVIEW_READY",
    "TIER_2_PLACEMENT_CONTENDER",
    "TIER_3_DEVELOPING_CANDIDATE",
    "TIER_4_FOUNDATIONAL_REMEDIATION",
  ]),
  technicalScore: z.number().min(0).max(100),
  starStructureScore: z.number().min(0).max(100),
  spokenClarityScore: z.number().min(0).max(100),
  roleRelevanceScore: z.number().min(0).max(100),
  behavioralScore: z.number().min(0).max(100),
  identifiedGaps: z.array(
    z.object({
      rootCause: z.string(),
      severity: z.enum(["High", "Medium", "Low"]),
      quote: z.string(),
      critique: z.string(),
      modelFix: z.string(),
    })
  ),
  sevenDaySchedule: z.array(
    z.object({
      day: z.number().int().min(1).max(7),
      focusSkill: z.string(),
      durationMinutes: z.number().int(),
      drillInstructions: z.string(),
    })
  ),
  evaluatorFeedback: z.string(),
});

export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;
