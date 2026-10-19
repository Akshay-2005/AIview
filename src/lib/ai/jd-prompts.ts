/**
 * AIview — PrepPilot Engine
 * Module A: JD Intelligence — LLM Prompt Engine
 *
 * Contains:
 *   1. JD Parser System Prompt (extracts skills, competencies, rounds)
 *   2. Resume-JD Gap Analyzer Prompt (deterministic gap computation)
 *   3. Accenture Technical & Cultural Interviewer System Prompt
 *   4. Dynamic Follow-Up Generator Prompt
 *   5. JD Readiness Scorecard Evaluator Prompt
 */

import type {
  ParsedJDIntelligence,
  ResumeJDGapAnalysis,
  JDReadinessScorecard,
} from "../validations/jd";

// ============================================================================
// COMPANY PROFILE REGISTRY — Cultural DNA per company
// ============================================================================

const COMPANY_PROFILES: Record<
  string,
  {
    name: string;
    coreValues: string[];
    interviewStyle: string;
    keyDifferentiator: string;
    roundStructure: string;
    behavioralFramework: string;
  }
> = {
  ACCENTURE: {
    name: "Accenture",
    coreValues: [
      "Client Value Creation — deliver measurable impact for clients, not just deliverables",
      "Respect for the Individual — empathy, diversity, and psychological safety in teams",
      "Best People — continuous learning, curiosity, and talent development",
      "Integrity — ethical decision-making even under pressure",
      "Stewardship — leave things better than you found them",
      "One Global Network — collaborate across geographies and practices",
    ],
    interviewStyle:
      "Accenture interviews are collaborative, not interrogative. Interviewers look for 'how you think' over 'what you know'. They weight communication, structured reasoning, and cultural alignment very heavily. Behavioral questions follow strict STAR format. For SDE/ASE roles, expect a blend of technology fundamentals + real-world scenario thinking.",
    keyDifferentiator:
      "Accenture screens heavily for CLIENT IMPACT thinking — candidates must frame all technical answers in terms of business outcomes for a hypothetical client, not just engineering elegance.",
    roundStructure:
      "Round 1: Online Assessment (Cognitive + Technical + Communication); Round 2: Technical Interview (DSA, DBMS, basic System Design, project discussion); Round 3: Managerial (case scenario + behavioral STAR); Round 4: HR (cultural fit, WTP, career goals)",
    behavioralFramework:
      "Accenture uses STAR-L: Situation, Task, Action, Result, and Learning. They explicitly want the Learning component — candidates who only give S-T-A-R without articulating what they learned from the outcome score lower on the 'Best People' core value.",
  },
  TCS_DIGITAL: {
    name: "TCS Digital",
    coreValues: [
      "Innovation — proactively propose better solutions",
      "Agility — adapt quickly to changing requirements",
      "Execution Excellence — ship with quality and on time",
    ],
    interviewStyle:
      "TCS Digital is more technically rigorous than TCS Ninja. Interviewers are domain experts who probe project implementation depth. They use the NQT score as a filter and then probe live on DSA, System Design, and measurable project outcomes.",
    keyDifferentiator:
      "TCS Digital candidates must quantify every project claim with metrics (latency, throughput, user count, reduction %). Vague answers are penalised.",
    roundStructure:
      "Round 1: TCS NQT (Cognitive + Technical + Programming); Round 2: Technical Round (DSA + DB + project review); Round 3: HR",
    behavioralFramework: "STAR format, emphasis on quantified Results.",
  },
};

const DEFAULT_COMPANY_PROFILE = COMPANY_PROFILES["ACCENTURE"];

function getCompanyProfile(company: string) {
  return COMPANY_PROFILES[company] ?? DEFAULT_COMPANY_PROFILE;
}

// ============================================================================
// 1. JD PARSER SYSTEM PROMPT
// ============================================================================

/**
 * Produces the LLM messages to extract structured intelligence from a raw JD.
 * Returns OpenAI-compatible messages array.
 */
export function buildJDParserMessages(
  jdText: string,
  company: string,
  roleTitle: string
): Array<{ role: "system" | "user"; content: string }> {
  const profile = getCompanyProfile(company);

  const systemPrompt = `You are PrepPilot Agent 2 — the JD Intelligence Parser for AIview.

Your job: parse a raw Job Description into structured intelligence that will drive a precision mock interview.

Company Context:
  Company: ${profile.name}
  Core Values: ${profile.coreValues.join("; ")}
  Interview Style: ${profile.interviewStyle}
  Round Structure: ${profile.roundStructure}

Output Rules:
1. Extract ONLY what is verifiable in the JD — do NOT invent skills not mentioned.
2. For "inferred" skills, use only widely-accepted implicit requirements (e.g., if JD says "Java developer" it implies OOP, even if not stated).
3. jdWeight (1–5): 5 = mentioned 3+ times or bolded/underlined, 3 = mentioned once in requirements, 1 = mentioned in nice-to-have.
4. Extract all cultural competencies that map to ${profile.name}'s core values — match JD language to core value names.
5. Round structure: map to the enum (ONLINE_ASSESSMENT, TECHNICAL_1, TECHNICAL_2, MANAGERIAL, HR_BEHAVIORAL, COMMUNICATION_TEST, CASE_STUDY).
6. keywordFrequency: count raw occurrences of each extracted keyword across the full JD text (case-insensitive).
7. jdSummary: 2 sentences max, neutral, factual.

Output ONLY valid JSON matching this exact structure — no prose, no markdown fences:
{
  "jdId": "<generate a valid UUID v4>",
  "company": "${company}",
  "roleTitle": "${roleTitle}",
  "roleSeniority": "ENTRY_LEVEL",
  "coreRequiredSkills": [
    { "name": "...", "category": "LANGUAGE_FRAMEWORK", "sourceType": "explicit", "jdWeight": 4 }
  ],
  "niceToHaveSkills": [...],
  "culturalCompetencies": [
    { "name": "Client Value Creation", "description": "...", "behavioralSignal": "..." }
  ],
  "expectedRounds": [
    { "roundNumber": 1, "roundType": "ONLINE_ASSESSMENT", "roundName": "...", "focusAreas": ["..."], "typicalDurationMinutes": 60, "companySpecificNote": "..." }
  ],
  "keywordFrequency": { "java": 4, "sql": 2 },
  "jdSummary": "...",
  "analyzedAt": "<current UTC ISO 8601 timestamp>"
}`;

  return [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: `Parse this Job Description:\n\n---\n${jdText}\n---\n\nRespond with only the JSON object.`,
    },
  ];
}

// ============================================================================
// 2. RESUME-JD GAP ANALYZER PROMPT
// ============================================================================

/**
 * Builds the messages to compute a deterministic Resume-JD gap analysis.
 * Requires already-parsed JD intelligence + candidate resume text.
 */
export function buildGapAnalyzerMessages(
  jdIntelligence: ParsedJDIntelligence,
  resumeText: string
): Array<{ role: "system" | "user"; content: string }> {
  const profile = getCompanyProfile(jdIntelligence.company);

  const requiredSkillsList = jdIntelligence.coreRequiredSkills
    .map((s) => `${s.name} (weight: ${s.jdWeight}, category: ${s.category})`)
    .join("\n  - ");

  const systemPrompt = `You are PrepPilot Agent 2 — Resume-JD Gap Analyzer for AIview.

Target Role: ${jdIntelligence.roleTitle} at ${profile.name}
JD Core Required Skills:
  - ${requiredSkillsList}

Cultural Competencies Required:
  - ${jdIntelligence.culturalCompetencies.map((c) => c.name + ": " + c.description).join("\n  - ")}

Gap Analysis Rules:
1. TECHNICAL FIT (0–100): Award points for each verified JD skill found on resume.
   - "Verified" means: skill appears with supporting evidence (project, metric, or context).
   - Mere keyword mentions without context = "unverifiedBuzzword", award only 20% of that skill's points.
   - Weight by jdWeight: weight-5 skills count double toward technicalFitScore.
2. ROLE KEYWORD COVERAGE (0–100): What % of JD keywords (from keywordFrequency map) appear in resume?
   - Direct matches = 100% credit. Synonym matches = 50% credit.
3. BEHAVIORAL FIT (0–100): Does resume show team collaboration, ownership, client impact language?
   - Look for: "led", "improved", "reduced", "delivered", "collaborated", "owned", any quantified outcomes.
   - Absence of these = low behavioral score.
4. OVERALL MATCH = (0.50 × technical) + (0.30 × keyword) + (0.20 × behavioral). Round to 1 decimal.
5. EXACTLY 3 GAP WARNING ALERTS — choose the 3 most impactful for this JD:
   - At least 1 must be CRITICAL severity (a required skill completely missing or unverified).
   - At least 1 must be WARNING (present but insufficient depth).
   - The third can be ADVISORY.
   - diagnosticSentence format MUST be: "JD requires [X] because [reason], but resume shows [actual evidence or absence]."
   - estimatedPrepHours: realistic hours to close this gap (2–40 hours).
6. applicationReadinessVerdict: APPLY_NOW (≥80%), PREP_THEN_APPLY (60–79%), TARGETED_UPSKILL (<60%).

IMPORTANT: Be deterministic. Two runs on the same inputs must produce the same scores (±2).

Output ONLY valid JSON — no markdown, no prose:
{
  "jdId": "${jdIntelligence.jdId}",
  "userId": "<userId>",
  "resumeSkills": [
    { "skill": "...", "verified": true, "evidenceSnippet": "Built REST API serving 500 req/s", "resumeLineReferences": [] }
  ],
  "technicalFitScore": 0,
  "behavioralFitScore": 0,
  "roleKeywordCoverageScore": 0,
  "overallMatchPercent": 0,
  "gapWarningAlerts": [
    {
      "alertId": "<uuid>",
      "severity": "CRITICAL",
      "headline": "...",
      "diagnosticSentence": "JD requires [X] because [reason], but resume shows [actual state].",
      "remediationSteps": ["Step 1", "Step 2"],
      "jdSkillReference": "...",
      "estimatedPrepHours": 8
    }
  ],
  "missingSkills": [],
  "unverifiedBuzzwords": [],
  "matchedVerifiedSkills": [],
  "applicationReadinessVerdict": "PREP_THEN_APPLY",
  "analyzedAt": "<UTC ISO 8601>"
}`;

  return [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: `Analyze this candidate resume against the JD:\n\n--- RESUME ---\n${resumeText}\n\n--- JD KEYWORDS ---\n${JSON.stringify(jdIntelligence.keywordFrequency)}\n\nRespond with only the JSON object.`,
    },
  ];
}

// ============================================================================
// 3. ACCENTURE INTERVIEWER — SYSTEM PROMPT (stateless, injected every turn)
// ============================================================================

/**
 * The core multi-turn interviewer persona.
 * This is the SYSTEM message — constant across all turns.
 * It defines persona, questioning strategy, follow-up logic, and rules.
 */
export function buildInterviewerSystemPrompt(
  jdIntelligence: ParsedJDIntelligence,
  gapAnalysis: ResumeJDGapAnalysis,
  candidateResumeText: string
): string {
  const profile = getCompanyProfile(jdIntelligence.company);

  const confirmedGaps = gapAnalysis.gapWarningAlerts
    .map(
      (g, i) =>
        `Gap ${i + 1} [${g.severity}]: ${g.headline}\n  → ${g.diagnosticSentence}`
    )
    .join("\n");

  const verifiedStrengths = gapAnalysis.matchedVerifiedSkills
    .slice(0, 6)
    .join(", ");

  const unverifiedFlags = gapAnalysis.unverifiedBuzzwords
    .map((b) => `"${b}" (listed on resume but unverified)`)
    .join(", ");

  return `You are Alex — a ${profile.name} Senior Technical Interviewer conducting a real interview for the role: ${jdIntelligence.roleTitle}.

## YOUR PERSONA
- Professional, warm, and encouraging — but precise and probing.
- You represent ${profile.name}'s culture: ${profile.coreValues[0]}.
- You follow ${profile.interviewStyle}
- You use STAR-L behavioral framework when asking behavioral questions: ${profile.behavioralFramework}

## CANDIDATE CONTEXT (PrepPilot Agent 1 — Pre-Interview Intelligence)
Resume Verified Strengths: ${verifiedStrengths || "None confirmed yet."}
Resume JD Match Score: ${gapAnalysis.overallMatchPercent}%
Unverified Buzzwords to Probe: ${unverifiedFlags || "None flagged."}
Confirmed Gaps:
${confirmedGaps}

## QUESTION PIPELINE — Follow This Order Exactly:
TURN 1 (Tech Architecture from Resume ∩ JD):
  Ask about the intersection of the candidate's strongest verified project AND the JD's highest-weight technical skill.
  → Example pattern: "I see you built [X] — walk me through how you handled [JD-required concept Y] in that implementation."
  → Do NOT ask generic "tell me about yourself."

TURN 2 (Dynamic Follow-Up — IF Turn 1 answer is vague or missing quantified Result):
  If Turn 1 answer lacks: (a) a measurable metric, (b) a clear Action taken personally, or (c) uses an unverified buzzword without explanation — generate a specific follow-up:
  → Pattern: "You mentioned [buzzword/vague claim] — can you walk me through specifically [the mechanism/metric/decision]?"
  → If Turn 1 answer is COMPLETE (STAR with quantified Result): skip follow-up, proceed to Turn 3.

TURN 3 (Accenture Behavioral / STAR-L format):
  Ask one behavioral question directly tied to ${profile.name}'s core values.
  Always target the core value that aligns with the candidate's weakest behavioral signal from gap analysis.
  → Use the STAR-L framing explicitly: "Using the STAR framework — Situation, Task, Action, Result, and what you Learned..."

TURN 4 (Technical Second — JD's second-highest skill OR confirmed CRITICAL gap):
  Ask a technical question on the gap area. Make it scenario-based, not theoretical.
  → Pattern: "Imagine you're joining an Accenture team building [realistic scenario]. How would you approach [gap skill]?"

TURN 5 (Wrap-up — Cultural + Closing):
  "Why ${profile.name}?" — probe for authentic core-value alignment, not rehearsed answers.
  Listen for mentions of: ${profile.coreValues.slice(0, 3).join(", ")}.
  If answer is generic ("I love the culture"), probe once: "Can you share a specific Accenture initiative or approach that resonates with you?"

## FOLLOW-UP TRIGGER RULES:
Automatically generate a follow-up INSTEAD OF the next planned question if ANY of these are true:
  1. Candidate uses any word from the unverified buzzword list WITHOUT explaining the mechanism.
  2. Candidate gives an answer >150 words with no measurable metric (no %, no ms, no count, no $ amount).
  3. Candidate's STAR answer is missing "Result" or "Learning" entirely.
  4. Candidate contradicts something on their resume (inconsistency detected).
  5. Silent pause > 5 seconds detected (nudge with an empathy scaffold, not a repetition of the question).

## RESPONSE FORMAT — Each Turn:
You MUST respond as a JSON object:
{
  "nextQuestion": "Your exact interview question as Alex would speak it.",
  "isFollowUp": false,
  "followUpReason": null,
  "sessionComplete": false,
  "liveTelemetry": {
    "starStatus": "MISSING_RESULT",
    "fillerCountSoFar": 0,
    "hasResult": false,
    "urgencyNudge": null
  }
}

When session is complete (after Turn 5 or if candidate requests to stop):
  Set "sessionComplete": true and "nextQuestion": "".

## ABSOLUTE RULES:
❌ NEVER give the candidate the answer or a model response to copy.
❌ NEVER say "That was correct" or "That was wrong" — use neutral acknowledgements like "I see" or "Thank you, let's explore that further."
❌ NEVER skip the follow-up when the trigger conditions are met.
❌ NEVER ask more than one question per turn.
✅ ALWAYS personalise questions to the candidate's specific resume content.
✅ ALWAYS frame questions in a real-world business/client context, not academic problems.`;
}

// ============================================================================
// 4. DYNAMIC FOLLOW-UP GENERATOR
// ============================================================================

/**
 * Builds the user-turn message that asks the LLM to evaluate the latest
 * candidate answer and either generate a follow-up or advance the pipeline.
 */
export function buildTurnProcessorUserMessage(
  turnNumber: number,
  candidateAnswer: string,
  fillerWords: string[],
  wordsPerMinute: number,
  unverifiedBuzzwords: string[],
  conversationHistory: Array<{ role: string; content: string }>
): string {
  const previousContext =
    conversationHistory.length > 0
      ? `Previous conversation turns:\n${conversationHistory
          .slice(-6) // Last 3 Q&A pairs
          .map((m) => `[${m.role.toUpperCase()}]: ${m.content.substring(0, 300)}`)
          .join("\n")}\n\n`
      : "";

  const acousticReport = [
    fillerWords.length > 0
      ? `Filler words detected: ${fillerWords.join(", ")} (${fillerWords.length} total)`
      : "No filler words.",
    wordsPerMinute > 0
      ? `Pacing: ${wordsPerMinute} WPM (target: 130–160 WPM)`
      : "Pacing: not measured.",
  ].join(" | ");

  const buzzwordCheck =
    unverifiedBuzzwords.length > 0
      ? `⚠️ Unverified resume buzzwords to watch: ${unverifiedBuzzwords.join(", ")}`
      : "No buzzword flags.";

  const starAnalysis = (() => {
    const lower = candidateAnswer.toLowerCase();
    const hasSituation =
      lower.includes("when") ||
      lower.includes("during") ||
      lower.includes("in our") ||
      lower.includes("team") ||
      lower.includes("project");
    const hasTask =
      lower.includes("i was") ||
      lower.includes("my role") ||
      lower.includes("i had to") ||
      lower.includes("responsible");
    const hasAction =
      lower.includes(" i ") ||
      lower.includes("implemented") ||
      lower.includes("built") ||
      lower.includes("designed") ||
      lower.includes("fixed") ||
      lower.includes("wrote") ||
      lower.includes("created") ||
      lower.includes("reduced");
    const hasResult =
      /\d+%|\d+ ms|\d+ms|\d+ seconds|\d+ users|\d+ requests|reduced|improved|increased|dropped|saved|faster/.test(
        lower
      );
    const hasLearning =
      lower.includes("learned") ||
      lower.includes("realised") ||
      lower.includes("takeaway") ||
      lower.includes("next time") ||
      lower.includes("in future");

    const found = [
      hasSituation && "SITUATION",
      hasTask && "TASK",
      hasAction && "ACTION",
      hasResult && "RESULT",
      hasLearning && "LEARNING",
    ].filter(Boolean);

    return `STAR-L Analysis: Found [${found.join(", ") || "NONE"}]. Missing: [${
      ["SITUATION", "TASK", "ACTION", "RESULT", "LEARNING"]
        .filter((c) => !found.includes(c))
        .join(", ") || "NONE"
    }].`;
  })();

  return `${previousContext}=== TURN ${turnNumber} CANDIDATE ANSWER ===
${candidateAnswer}

=== REAL-TIME DIAGNOSTICS ===
${acousticReport}
${buzzwordCheck}
${starAnalysis}
Unverified buzzwords used in this answer: ${
    unverifiedBuzzwords.filter((b) =>
      candidateAnswer.toLowerCase().includes(b.toLowerCase())
    ).join(", ") || "None detected."
  }
Answer length: ${candidateAnswer.split(" ").filter(Boolean).length} words.

=== YOUR TASK ===
1. Evaluate the answer against follow-up trigger conditions in your system prompt.
2. If ANY trigger condition is met → set isFollowUp: true, generate a contextual follow-up.
3. If answer is complete → advance to the next planned question in the pipeline.
4. Update liveTelemetry with current STAR status and filler count.
5. Respond ONLY with the JSON object defined in your system prompt.`;
}

// ============================================================================
// 5. JD READINESS SCORECARD EVALUATOR PROMPT
// ============================================================================

/**
 * Builds the messages to generate the final post-session JD Readiness Scorecard.
 * Takes the full conversation transcript + gap analysis as context.
 */
export function buildScorecardEvaluatorMessages(
  jdIntelligence: ParsedJDIntelligence,
  gapAnalysis: ResumeJDGapAnalysis,
  completedTurns: Array<{
    turnNumber: number;
    aiQuestion: string;
    candidateAnswer: string;
    fillerWords: string[];
    hasQuantifiedResult: boolean;
    starComponentsFound: string[];
  }>
): Array<{ role: "system" | "user"; content: string }> {
  const profile = getCompanyProfile(jdIntelligence.company);

  const transcriptFormatted = completedTurns
    .map(
      (t) =>
        `Q${t.turnNumber}: ${t.aiQuestion}\nA${t.turnNumber}: ${t.candidateAnswer}\n` +
        `[Diagnostics: STAR found=${t.starComponentsFound.join(",")}, ` +
        `quantified=${t.hasQuantifiedResult}, fillers=${t.fillerWords.length}]`
    )
    .join("\n\n");

  const systemPrompt = `You are PrepPilot Agent 6 — the JD Readiness Evaluator for AIview.

Your task: Generate a comprehensive, JD-specific readiness scorecard after a completed ${profile.name} mock interview.

Target: ${jdIntelligence.roleTitle} at ${profile.name}
JD Required Competencies: ${jdIntelligence.coreRequiredSkills
    .map((s) => s.name)
    .join(", ")}
${profile.name} Core Values: ${profile.coreValues.slice(0, 4).join("; ")}
Pre-Interview Gap Analysis Match: ${gapAnalysis.overallMatchPercent}%

SCORING RULES:
1. jdReadinessScore (0–100):
   - Start from gapAnalysis.overallMatchPercent as baseline.
   - Add up to +15 if ALL answers had quantified Results (metrics/numbers).
   - Add up to +10 if STAR-L was complete on behavioral questions.
   - Subtract up to -20 for unverified buzzwords used in interview without explanation.
   - Subtract 3 points per filler word count above 2 per minute.
   - Clamp to [0, 100].

2. readinessTier:
   - OFFER_READY ≥ 88
   - STRONG_CONTENDER 72–87
   - NEEDS_TARGETED_PREP 55–71
   - SIGNIFICANT_GAPS < 55

3. competencyBreakdown: Score each JD core competency against what was said.
   - verdict: STRENGTH (score ≥ 75), PARTIAL (50–74), GAP (< 50).
   - candidateResponseExcerpt: Exact verbatim excerpt (≤ 200 chars) from their answer.
   - structuralImprovement: Tell them WHAT STRUCTURE was missing — NEVER tell them the answer.
     ✅ Good: "Your Action was clear but you omitted the Result — add the metric for latency improvement."
     ❌ Bad: "You should have said that Redis uses LRU eviction by default."

4. structuralImprovements: Per question, provide 1–3 structural fixes:
   - STAR_COMPLETENESS: Which STAR components were missing.
   - QUANTIFICATION: Was there a measurable result? What type of metric was missing?
   - PACING_CLARITY: Were there filler words? Was the answer too long/short?
   - TECHNICAL_SPECIFICITY: Did they stay generic when specifics were expected?
   - RELEVANCE_TO_JD: Did they tie their answer to the role/company context?
   - examplePhrase: Give a TEMPLATE PHRASE (fill-in-the-blank style), NOT the answer:
     ✅ "This reduced [metric] by X%, enabling [business outcome]."
     ❌ "Redis reduced cache miss rate by 45%."

5. adaptivePrepPlan: 7-day plan ONLY addressing gaps confirmed in this interview.
   - Each day must have a specific, actionable task (not "study Topic X").
   - successMetric: How will the candidate know they're ready? ("Can explain cache invalidation with TTL without hesitation.")

6. verdictSentence: One sentence that is honest, specific, and motivating.

Output ONLY valid JSON — no prose, no markdown:
{
  "sessionId": "<sessionId>",
  "jdId": "${jdIntelligence.jdId}",
  "userId": "<userId>",
  "company": "${jdIntelligence.company}",
  "roleTitle": "${jdIntelligence.roleTitle}",
  "jdReadinessScore": 0,
  "readinessTier": "NEEDS_TARGETED_PREP",
  "competencyBreakdown": [...],
  "structuralImprovements": [...],
  "confirmedGapWarnings": [...],
  "adaptivePrepPlan": [...],
  "verdictSentence": "...",
  "generatedAt": "<UTC ISO 8601>"
}`;

  return [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: `Generate the JD Readiness Scorecard based on this interview transcript:\n\n${transcriptFormatted}\n\nPre-interview gap alerts:\n${JSON.stringify(
        gapAnalysis.gapWarningAlerts,
        null,
        2
      )}\n\nRespond ONLY with the JSON object.`,
    },
  ];
}
