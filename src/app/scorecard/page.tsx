"use client";

import { JDReadinessScorecardUI } from "@/components/interview/JDReadinessScorecardUI";
import type { JDReadinessScorecard } from "@/lib/validations/jd";
import { Brain } from "lucide-react";
import Link from "next/link";

const DEMO_SCORECARD: JDReadinessScorecard = {
  sessionId: "a4f891b2-3c81-4df2-8fa0-d1297e684001",
  jdId: "b5c12345-6789-4abc-def0-1234567890ab",
  userId: "c6d23456-789a-4bcd-ef01-234567890abc",
  company: "ACCENTURE",
  roleTitle: "Associate Software Engineer",
  jdReadinessScore: 73,
  readinessTier: "STRONG_CONTENDER",
  verdictSentence:
    "Rahul shows strong communication and system design awareness. Targeted STAR quantification practice will push readiness to Offer-Ready tier.",
  competencyBreakdown: [
    {
      competencyName: "Redis & Caching Architectures",
      jdRequirementReference: "Backend caching layer knowledge",
      score: 62,
      candidateResponseExcerpt:
        "We used Redis because it is very fast and in-memory. Whenever user requests product it checks Redis first...",
      structuralImprovement:
        "Name the eviction policy (LRU/LFU) and explain TTL decisions. Add quantified impact: 'reduced DB load by 60%'.",
      verdict: "PARTIAL",
    },
    {
      competencyName: "System Design Communication",
      jdRequirementReference: "Architecture description & trade-off awareness",
      score: 84,
      candidateResponseExcerpt:
        "We separated the payment service from the catalogue so each could scale independently under load...",
      structuralImprovement:
        "Include capacity estimation: 'designed for 10k RPS'. Mention failure handling between services.",
      verdict: "STRENGTH",
    },
    {
      competencyName: "Behavioral STAR Framework",
      jdRequirementReference: "Communication & teamwork examples",
      score: 54,
      candidateResponseExcerpt:
        "Basically I worked with my team and we solved the issue. Actually we reduced the bugs...",
      structuralImprovement:
        "Always close with a quantified Result: 'This reduced critical bug count by 40% over two sprints.' Remove fillers.",
      verdict: "GAP",
    },
  ],
  structuralImprovements: [
    {
      questionNumber: 1,
      questionAsked:
        "Walk me through your cache invalidation strategy when a product goes out of stock.",
      candidateResponseSummary:
        "Mentioned Redis speed and in-memory nature; could not explain invalidation strategy or eviction policy.",
      structuralFixes: [
        {
          dimension: "TECHNICAL_SPECIFICITY",
          whatWasMissing: "No mention of eviction policy or TTL configuration",
          howToFix:
            "State the exact policy: 'We used LRU eviction with a 60-second TTL on product stock keys.'",
          examplePhrase: "'With LRU eviction and 60s TTL, we reduced stale reads by X%...'",
        },
        {
          dimension: "QUANTIFICATION",
          whatWasMissing: "No impact metric mentioned",
          howToFix:
            "Always end technical answers with a measurable outcome: latency reduction, cache hit rate, DB calls saved.",
          examplePhrase: "'Cache hit rate reached 94%, reducing DB load by 60%.'",
        },
        {
          dimension: "STAR_COMPLETENESS",
          whatWasMissing: "Missing Result component — answer ended at Action",
          howToFix:
            "After describing the implementation (Action), always state what improved and by how much.",
          examplePhrase: "'As a result, checkout latency dropped from 800ms to 120ms.'",
        },
      ],
    },
    {
      questionNumber: 3,
      questionAsked: "Tell me about a time you handled a critical production bug.",
      candidateResponseSummary:
        "Described the bug but used many fillers ('basically', 'actually') and gave no quantified result.",
      structuralFixes: [
        {
          dimension: "STAR_COMPLETENESS",
          whatWasMissing: "Result was vague: 'we fixed it'",
          howToFix: "Specify timeline and impact: 'Fixed in 3 hours, restoring service to 2,000 users.'",
          examplePhrase: "'Within 3 hours of detection, we restored checkout for 2,000 active users.'",
        },
        {
          dimension: "PACING_CLARITY",
          whatWasMissing: "High filler density (6 fillers in 90-second answer)",
          howToFix:
            "Replace fillers with deliberate pauses. Practice the answer 5 times targeting zero fillers.",
          examplePhrase: "Pause for 1 second instead of saying 'basically'.",
        },
      ],
    },
  ],
  confirmedGapWarnings: [
    {
      gapId: "gap-001",
      severity: "CRITICAL",
      skillDomain: "Redis Eviction & TTL Configuration",
      gapDescription:
        "Named Redis but could not explain eviction policies or TTL tuning when directly probed.",
      remediationSteps: [
        "Read Redis docs on LRU vs LFU eviction policies (30 min)",
        "Implement a mock caching layer with configurable TTL in a toy project",
        "Record a 2-minute spoken explanation and review for clarity",
      ],
      jdSkillReference: "Backend caching layer knowledge",
      estimatedPrepHours: 4,
    },
    {
      gapId: "gap-002",
      severity: "WARNING",
      skillDomain: "STAR Quantification",
      gapDescription:
        "4 out of 5 answers lacked measurable outcomes. Accenture evaluators expect data-backed STAR.",
      remediationSteps: [
        "Rewrite 3 project descriptions using Metric + Impact format",
        "Practice the formula: Action → Metric → Outcome for every experience bullet",
      ],
      jdSkillReference: "Communication & structured thinking",
      estimatedPrepHours: 3,
    },
    {
      gapId: "gap-003",
      severity: "ADVISORY",
      skillDomain: "Filler Word Density",
      gapDescription:
        "4.2 fillers/min detected — exceeds the 2/min credibility threshold.",
      remediationSteps: [
        "5 timed 2-min recordings with target of zero fillers",
        "Use silence instead of filler — practice deliberate pausing",
      ],
      jdSkillReference: "Spoken communication clarity",
      estimatedPrepHours: 2,
    },
  ],
  adaptivePrepPlan: [
    {
      day: 1,
      focusArea: "STAR Quantification Drill",
      specificTask:
        "Rewrite 3 project descriptions with Metric + Impact format. Time each to 90 seconds and record.",
      successMetric: "All 3 descriptions include a measurable outcome (%, count, or ms)",
      estimatedMinutes: 45,
    },
    {
      day: 2,
      focusArea: "Redis & Caching Deep-Dive",
      specificTask:
        "Read Redis docs on LRU/LFU eviction and TTL. Record a 2-minute explanation of cache invalidation.",
      successMetric: "Can explain eviction policy and TTL trade-off without notes",
      estimatedMinutes: 60,
    },
    {
      day: 3,
      focusArea: "Filler Word Elimination",
      specificTask:
        "5 timed 2-min recordings. Use silence instead of 'basically'. Target: 0 fillers per recording.",
      successMetric: "3 consecutive recordings with 0 fillers detected",
      estimatedMinutes: 30,
    },
    {
      day: 4,
      focusArea: "System Design Practice",
      specificTask:
        "Design a URL shortener with caching layer. Explain aloud with capacity estimates (RPS, storage).",
      successMetric: "Includes capacity estimates and explains failure handling",
      estimatedMinutes: 60,
    },
    {
      day: 5,
      focusArea: "Behavioral STAR Marathon",
      specificTask:
        "Answer 10 behavioral questions with full STAR + quantified result. Record and self-review.",
      successMetric: "All 10 answers include a measurable Result component",
      estimatedMinutes: 90,
    },
    {
      day: 6,
      focusArea: "Accenture Pattern Simulation",
      specificTask:
        "Full 5-question Accenture-format AIview mock. Target: 130–160 WPM, <2 fillers/min, all STAR complete.",
      successMetric: "Score ≥82 on composite readiness scorecard",
      estimatedMinutes: 60,
    },
    {
      day: 7,
      focusArea: "Review & Confidence Building",
      specificTask:
        "Re-watch Day 1–6 recordings. Identify top 3 improvements made. Write a 1-page confidence statement.",
      successMetric: "Candidate can articulate 3 concrete improvements with examples",
      estimatedMinutes: 30,
    },
  ],
  generatedAt: new Date().toISOString(),
};

export default function ScorecardPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Brain className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-white font-bold tracking-tight">AIview</span>
        </Link>
        <span className="text-xs text-slate-500">Sample Scorecard · Demo Mode</span>
      </nav>

      {/* Scorecard */}
      <div className="max-w-5xl mx-auto py-8 px-4">
        <JDReadinessScorecardUI
          scorecard={DEMO_SCORECARD}
          onRetry={() => {
            window.location.href = "/interview";
          }}
        />
      </div>
    </div>
  );
}
