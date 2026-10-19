/**
 * AIview — PrepPilot Engine
 * Module A: Post-Interview JD Readiness Scorecard — React Component
 *
 * Props: Receives a fully-computed JDReadinessScorecard object.
 * Displays: Accenture SDE Readiness X/100, competency breakdown,
 *           structural improvements (NO model answers), 7-day prep plan.
 */

"use client";

import { useState } from "react";
import type { JDReadinessScorecard } from "@/lib/validations/jd";

// ============================================================================
// HELPERS & CONSTANTS
// ============================================================================

const TIER_META: Record<
  JDReadinessScorecard["readinessTier"],
  { label: string; color: string; bg: string; border: string; icon: string }
> = {
  OFFER_READY: {
    label: "Offer Ready",
    color: "#10b981",
    bg: "rgba(16,185,129,0.1)",
    border: "rgba(16,185,129,0.3)",
    icon: "🟢",
  },
  STRONG_CONTENDER: {
    label: "Strong Contender",
    color: "#6366f1",
    bg: "rgba(99,102,241,0.1)",
    border: "rgba(99,102,241,0.3)",
    icon: "🔵",
  },
  NEEDS_TARGETED_PREP: {
    label: "Needs Targeted Prep",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.3)",
    icon: "🟡",
  },
  SIGNIFICANT_GAPS: {
    label: "Significant Gaps",
    color: "#f43f5e",
    bg: "rgba(244,63,94,0.08)",
    border: "rgba(244,63,94,0.3)",
    icon: "🔴",
  },
};

const VERDICT_COLORS: Record<
  "STRENGTH" | "PARTIAL" | "GAP",
  { text: string; bar: string; badge: string }
> = {
  STRENGTH: {
    text: "#10b981",
    bar: "#10b981",
    badge: "rgba(16,185,129,0.15)",
  },
  PARTIAL: { text: "#f59e0b", bar: "#f59e0b", badge: "rgba(245,158,11,0.12)" },
  GAP: { text: "#f43f5e", bar: "#f43f5e", badge: "rgba(244,63,94,0.1)" },
};

const DIMENSION_LABELS: Record<string, string> = {
  STAR_COMPLETENESS: "STAR Completeness",
  QUANTIFICATION: "Quantification",
  PACING_CLARITY: "Pacing & Clarity",
  TECHNICAL_SPECIFICITY: "Technical Specificity",
  RELEVANCE_TO_JD: "Relevance to JD",
};

const SEVERITY_META = {
  CRITICAL: { color: "#f43f5e", bg: "rgba(244,63,94,0.08)", icon: "🔴" },
  WARNING: { color: "#f59e0b", bg: "rgba(245,158,11,0.08)", icon: "⚠️" },
  ADVISORY: { color: "#6366f1", bg: "rgba(99,102,241,0.08)", icon: "💡" },
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function ScoreDial({ score }: { score: number }) {
  // SVG conic-gradient dial
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;
  const color =
    score >= 88
      ? "#10b981"
      : score >= 72
      ? "#6366f1"
      : score >= 55
      ? "#f59e0b"
      : "#f43f5e";

  return (
    <div
      style={{
        position: "relative",
        width: 140,
        height: 140,
        flexShrink: 0,
      }}
    >
      <svg
        width={140}
        height={140}
        viewBox="0 0 140 140"
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          cx={70}
          cy={70}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={12}
        />
        <circle
          cx={70}
          cy={70}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={12}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s ease" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 30,
            fontWeight: 900,
            color: color,
            lineHeight: 1,
          }}
        >
          {score}
        </span>
        <span style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
          / 100
        </span>
      </div>
    </div>
  );
}

function CompetencyBar({
  name,
  score,
  verdict,
  excerpt,
  improvement,
}: {
  name: string;
  score: number;
  verdict: "STRENGTH" | "PARTIAL" | "GAP";
  excerpt: string;
  improvement: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const colors = VERDICT_COLORS[verdict];

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 12,
        padding: "14px 16px",
        transition: "all 0.2s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          cursor: "pointer",
        }}
        onClick={() => setExpanded((e) => !e)}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <span
              style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}
            >
              {name}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 10,
                  background: colors.badge,
                  color: colors.text,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {verdict}
              </span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 13,
                  fontWeight: 700,
                  color: colors.text,
                }}
              >
                {score}%
              </span>
              <span
                style={{
                  color: "#475569",
                  fontSize: 10,
                  marginLeft: 4,
                  transition: "transform 0.2s",
                  transform: expanded ? "rotate(180deg)" : "none",
                  display: "inline-block",
                }}
              >
                ▼
              </span>
            </div>
          </div>
          <div
            style={{
              height: 5,
              background: "rgba(255,255,255,0.07)",
              borderRadius: 4,
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${score}%`,
                background: colors.bar,
                borderRadius: 4,
                transition: "width 1s ease",
              }}
            />
          </div>
        </div>
      </div>

      {expanded && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: "1px solid rgba(255,255,255,0.05)",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div
            style={{
              background: "rgba(0,0,0,0.2)",
              borderRadius: 8,
              padding: "8px 12px",
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: 4,
              }}
            >
              What you said
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#94a3b8",
                fontStyle: "italic",
                lineHeight: 1.5,
              }}
            >
              "{excerpt}"
            </div>
          </div>
          <div
            style={{
              background:
                verdict === "GAP"
                  ? "rgba(244,63,94,0.06)"
                  : verdict === "PARTIAL"
                  ? "rgba(245,158,11,0.06)"
                  : "rgba(16,185,129,0.06)",
              borderLeft: `3px solid ${colors.bar}`,
              borderRadius: "0 8px 8px 0",
              padding: "8px 12px",
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: colors.text,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: 4,
                fontWeight: 700,
              }}
            >
              {verdict === "STRENGTH" ? "✅ What worked" : "→ Structural improvement"}
            </div>
            <div style={{ fontSize: 12, color: "#e2e8f0", lineHeight: 1.6 }}>
              {improvement}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StructuralImprovementCard({
  item,
}: {
  item: JDReadinessScorecard["structuralImprovements"][number];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          padding: "14px 18px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          textAlign: "left",
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              color: "#6366f1",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: 4,
              fontWeight: 700,
            }}
          >
            Q{item.questionNumber}
          </div>
          <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 500 }}>
            {item.questionAsked.length > 90
              ? item.questionAsked.slice(0, 90) + "…"
              : item.questionAsked}
          </div>
        </div>
        <span
          style={{
            color: "#475569",
            fontSize: 11,
            flexShrink: 0,
            transition: "transform 0.2s",
            transform: open ? "rotate(180deg)" : "none",
            display: "inline-block",
          }}
        >
          ▼
        </span>
      </button>

      {open && (
        <div
          style={{
            padding: "0 18px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: "#94a3b8",
              background: "rgba(0,0,0,0.2)",
              padding: "6px 10px",
              borderRadius: 6,
              fontStyle: "italic",
            }}
          >
            Your answer summary: "{item.candidateResponseSummary}"
          </div>
          {item.structuralFixes.map((fix, fi) => (
            <div
              key={fi}
              style={{
                background: "rgba(99,102,241,0.06)",
                border: "1px solid rgba(99,102,241,0.2)",
                borderRadius: 10,
                padding: "12px 14px",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#a5b4fc",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: 6,
                }}
              >
                {DIMENSION_LABELS[fix.dimension] ?? fix.dimension}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#fcd34d",
                  marginBottom: 4,
                  fontWeight: 600,
                }}
              >
                What was missing:
              </div>
              <div
                style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}
              >
                {fix.whatWasMissing}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#a7f3d0",
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                How to fix:
              </div>
              <div
                style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}
              >
                {fix.howToFix}
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: "#67e8f9",
                  background: "rgba(6,182,212,0.08)",
                  border: "1px solid rgba(6,182,212,0.2)",
                  borderRadius: 6,
                  padding: "6px 10px",
                }}
              >
                Template: {fix.examplePhrase}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PrepPlanRow({
  item,
}: {
  item: JDReadinessScorecard["adaptivePrepPlan"][number];
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        padding: "12px 0",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: "linear-gradient(135deg,rgba(99,102,241,0.3),rgba(139,92,246,0.2))",
          border: "1px solid rgba(99,102,241,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          fontWeight: 700,
          color: "#a5b4fc",
          flexShrink: 0,
        }}
      >
        D{item.day}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#e2e8f0",
            marginBottom: 3,
          }}
        >
          {item.focusArea}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "#94a3b8",
            lineHeight: 1.5,
            marginBottom: 4,
          }}
        >
          {item.specificTask}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "#10b981",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span>✓</span>
          <span>{item.successMetric}</span>
          <span style={{ color: "#475569", marginLeft: "auto" }}>
            {item.estimatedMinutes}min
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface JDReadinessScorecardProps {
  scorecard: JDReadinessScorecard;
  onRetry?: () => void;
}

export function JDReadinessScorecardUI({
  scorecard,
  onRetry,
}: JDReadinessScorecardProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "competencies" | "improvements" | "plan"
  >("overview");

  const tierMeta = TIER_META[scorecard.readinessTier];
  const companyLabel =
    scorecard.company === "ACCENTURE"
      ? "Accenture"
      : scorecard.company.replace("_", " ");

  return (
    <div
      style={{
        background: "#111827",
        border: "1px solid rgba(99,102,241,0.25)",
        borderRadius: 20,
        overflow: "hidden",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        maxWidth: 800,
        margin: "0 auto",
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: "24px 28px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background:
            "linear-gradient(135deg,rgba(30,41,75,0.6),rgba(15,23,42,0.8))",
        }}
      >
        <div style={{ fontSize: 11, color: "#6366f1", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 8 }}>
          Session Complete · PrepPilot Evaluation Agent
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <ScoreDial score={scorecard.jdReadinessScore} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <h2
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 20,
                fontWeight: 800,
                color: "#fff",
                margin: 0,
                marginBottom: 6,
              }}
            >
              {companyLabel} {scorecard.roleTitle} Readiness
            </h2>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 14px",
                borderRadius: 20,
                background: tierMeta.bg,
                border: `1px solid ${tierMeta.border}`,
                color: tierMeta.color,
                fontSize: 12,
                fontWeight: 700,
                marginBottom: 10,
              }}
            >
              {tierMeta.icon} {tierMeta.label}
            </div>
            <p
              style={{
                fontSize: 13,
                color: "#94a3b8",
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              {scorecard.verdictSentence}
            </p>
          </div>
        </div>

        {/* Confirmed Gap Warnings */}
        {scorecard.confirmedGapWarnings.length > 0 && (
          <div
            style={{
              marginTop: 16,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            {scorecard.confirmedGapWarnings.map((g) => {
              const sm = SEVERITY_META[g.severity];
              return (
                <div
                  key={g.alertId}
                  style={{
                    background: sm.bg,
                    border: `1px solid ${sm.color}40`,
                    borderRadius: 8,
                    padding: "8px 12px",
                    fontSize: 12,
                    color: "#e2e8f0",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                  }}
                >
                  <span style={{ flexShrink: 0 }}>{sm.icon}</span>
                  <span>
                    <strong style={{ color: sm.color }}>{g.headline}:</strong>{" "}
                    {g.diagnosticSentence}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Tab Navigation ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          overflowX: "auto",
        }}
      >
        {(
          [
            { key: "overview", label: "📊 Overview" },
            { key: "competencies", label: "🎯 Competencies" },
            { key: "improvements", label: "🔧 Structural Fixes" },
            { key: "plan", label: "📅 7-Day Plan" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "12px 20px",
              background: "transparent",
              border: "none",
              borderBottom:
                activeTab === tab.key
                  ? "2px solid #6366f1"
                  : "2px solid transparent",
              color: activeTab === tab.key ? "#a5b4fc" : "#64748b",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.2s",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ────────────────────────────────────────────────────── */}
      <div style={{ padding: "24px 28px" }}>

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))",
                gap: 12,
              }}
            >
              {[
                {
                  label: "JD Match",
                  value: `${scorecard.jdReadinessScore}%`,
                  color: tierMeta.color,
                },
                {
                  label: "Strengths",
                  value: scorecard.competencyBreakdown.filter(
                    (c) => c.verdict === "STRENGTH"
                  ).length,
                  color: "#10b981",
                },
                {
                  label: "Gaps",
                  value: scorecard.competencyBreakdown.filter(
                    (c) => c.verdict === "GAP"
                  ).length,
                  color: "#f43f5e",
                },
                {
                  label: "Prep Days",
                  value: 7,
                  color: "#06b6d4",
                },
              ].map((stat, i) => (
                <div
                  key={i}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 12,
                    padding: "14px 16px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: "#64748b",
                      marginBottom: 4,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {stat.label}
                  </div>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 26,
                      fontWeight: 900,
                      color: stat.color,
                    }}
                  >
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#475569",
                borderTop: "1px solid rgba(255,255,255,0.05)",
                paddingTop: 12,
              }}
            >
              ⚠️ <strong style={{ color: "#94a3b8" }}>Structural Fixes</strong> below describe what to change in HOW you answer — not what the correct technical answer is. AIview never encourages rote memorisation.
            </div>
          </div>
        )}

        {/* COMPETENCIES TAB */}
        {activeTab === "competencies" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {scorecard.competencyBreakdown.map((comp, i) => (
              <CompetencyBar
                key={i}
                name={comp.competencyName}
                score={comp.score}
                verdict={comp.verdict}
                excerpt={comp.candidateResponseExcerpt}
                improvement={comp.structuralImprovement}
              />
            ))}
          </div>
        )}

        {/* STRUCTURAL IMPROVEMENTS TAB */}
        {activeTab === "improvements" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div
              style={{
                background: "rgba(99,102,241,0.06)",
                border: "1px solid rgba(99,102,241,0.2)",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 12,
                color: "#a5b4fc",
                marginBottom: 6,
              }}
            >
              🔒 These are <strong>structural</strong> suggestions only. Each "Template" phrase is a fill-in-the-blank guide — the content must come from your real experience.
            </div>
            {scorecard.structuralImprovements.map((item, i) => (
              <StructuralImprovementCard key={i} item={item} />
            ))}
          </div>
        )}

        {/* 7-DAY PREP PLAN TAB */}
        {activeTab === "plan" && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 12,
                color: "#94a3b8",
                marginBottom: 14,
                lineHeight: 1.5,
              }}
            >
              Adaptive plan targeting <strong style={{ color: "#f59e0b" }}>confirmed gaps</strong> from this session, not generic advice.
            </div>
            {scorecard.adaptivePrepPlan.map((item, i) => (
              <PrepPlanRow key={i} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* ── Footer Actions ──────────────────────────────────────────────────── */}
      <div
        style={{
          padding: "16px 28px 20px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              padding: "10px 20px",
              background: "rgba(99,102,241,0.15)",
              border: "1px solid rgba(99,102,241,0.4)",
              color: "#a5b4fc",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            🔄 Retry This Simulation
          </button>
        )}
        <button
          onClick={() => window.print()}
          style={{
            padding: "10px 20px",
            background: "linear-gradient(135deg,#6366f1,#4f46e5)",
            border: "none",
            color: "#fff",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          📄 Save Scorecard as PDF
        </button>
      </div>
    </div>
  );
}
