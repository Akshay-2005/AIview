/**
 * AIview — PrepPilot Engine
 * Module B: Interactive JD Upload Screen
 *
 * Features:
 *   - 3-step progressive onboarding wizard (Company → JD → Resume)
 *   - Drag-and-drop PDF dropzone with live validation feedback
 *   - Text paste area with real-time JD guard analysis
 *   - Company selector with logo pills and role auto-suggest
 *   - Resume text input with skill chip preview
 *   - Submit → /api/v1/jd/analyze with loading, error, and success states
 *   - Inline JD guard warnings (truncated/garbled/boilerplate)
 */

"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type DragEvent,
  type ChangeEvent,
} from "react";
import { validateJD } from "@/lib/ai/answer-guards";

// ============================================================================
// TYPES
// ============================================================================

type Step = 1 | 2 | 3;
type InputMode = "paste" | "upload";

interface Company {
  key: string;
  name: string;
  track: string;
  icon: string;
  color: string;
  roles: string[];
}

interface UploadState {
  status: "idle" | "dragging" | "reading" | "error" | "ready";
  fileName: string;
  fileSize: string;
  errorMessage: string;
  base64: string;
}

interface FormState {
  company: string;
  roleTitle: string;
  jdText: string;
  resumeText: string;
}

interface AnalysisResult {
  jdIntelligence: Record<string, unknown>;
  gapAnalysis: Record<string, unknown>;
  sessionPayload: { sessionId: string; jdId: string };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const COMPANIES: Company[] = [
  {
    key: "ACCENTURE",
    name: "Accenture",
    track: "ASE / Technology",
    icon: "◆",
    color: "#a855f7",
    roles: [
      "Associate Software Engineer",
      "Technology Analyst",
      "Application Development Associate",
      "DevOps Engineer",
    ],
  },
  {
    key: "TCS_DIGITAL",
    name: "TCS Digital",
    track: "Digital / Ninja",
    icon: "◉",
    color: "#6366f1",
    roles: [
      "Associate Software Engineer",
      "Digital Specialist Engineer",
      "Systems Engineer",
    ],
  },
  {
    key: "COGNIZANT_GENC",
    name: "Cognizant",
    track: "GenC Elevate",
    icon: "◈",
    color: "#06b6d4",
    roles: [
      "Programmer Analyst Trainee",
      "Associate — Projects",
      "GenC Elevate Engineer",
    ],
  },
  {
    key: "INFOSYS_SP",
    name: "Infosys",
    track: "SP Track / InfyTQ",
    icon: "◇",
    color: "#10b981",
    roles: ["Systems Engineer", "Technology Analyst", "Digital Specialist"],
  },
  {
    key: "WIPRO_ELITE",
    name: "Wipro",
    track: "Elite NLTH",
    icon: "◆",
    color: "#f59e0b",
    roles: [
      "Project Engineer",
      "Software Engineer",
      "Graduate Engineer Trainee",
    ],
  },
];

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// ============================================================================
// UTILITIES
// ============================================================================

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URL prefix ("data:application/pdf;base64,")
      const base64 = result.split(",")[1] ?? "";
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function StepIndicator({
  current,
  total,
}: {
  current: Step;
  total: number;
}) {
  const labels = ["Company & Role", "Job Description", "Your Resume"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 36 }}>
      {labels.map((label, i) => {
        const stepNum = (i + 1) as Step;
        const isDone = stepNum < current;
        const isActive = stepNum === current;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", flex: 1 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 800,
                  transition: "all 0.3s ease",
                  background: isDone
                    ? "#10b981"
                    : isActive
                    ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
                    : "rgba(255,255,255,0.06)",
                  color: isDone || isActive ? "#fff" : "#475569",
                  border: isActive
                    ? "2px solid rgba(99,102,241,0.5)"
                    : "2px solid transparent",
                  boxShadow: isActive
                    ? "0 0 16px rgba(99,102,241,0.4)"
                    : "none",
                }}
              >
                {isDone ? "✓" : stepNum}
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "#a5b4fc" : isDone ? "#10b981" : "#475569",
                  whiteSpace: "nowrap",
                  textAlign: "center",
                }}
              >
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  background: isDone
                    ? "#10b981"
                    : "rgba(255,255,255,0.07)",
                  marginBottom: 22,
                  transition: "background 0.3s",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function CompanyPill({
  company,
  selected,
  onClick,
}: {
  company: Company;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "12px 18px",
        borderRadius: 14,
        border: selected
          ? `2px solid ${company.color}`
          : "2px solid rgba(255,255,255,0.08)",
        background: selected
          ? `linear-gradient(135deg,${company.color}22,${company.color}11)`
          : "rgba(255,255,255,0.03)",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.2s ease",
        boxShadow: selected ? `0 0 20px ${company.color}30` : "none",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <span style={{ fontSize: 18, color: company.color }}>{company.icon}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>
          {company.name}
        </span>
      </div>
      <div style={{ fontSize: 11, color: "#64748b", marginLeft: 28 }}>
        {company.track}
      </div>
    </button>
  );
}

function JDValidationBanner({
  result,
}: {
  result: ReturnType<typeof validateJD> | null;
}) {
  if (!result || result.severity === "ok") return null;

  const isBlock = result.severity === "block";
  const color = isBlock ? "#f43f5e" : "#f59e0b";
  const bg = isBlock ? "rgba(244,63,94,0.08)" : "rgba(245,158,11,0.08)";
  const border = isBlock ? "rgba(244,63,94,0.3)" : "rgba(245,158,11,0.3)";
  const icon = isBlock ? "🚫" : "⚠️";

  return (
    <div
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 12,
        padding: "12px 16px",
        marginTop: 10,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color,
          marginBottom: 4,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {icon} {isBlock ? "JD Cannot Be Parsed" : "JD Warning"}
      </div>
      <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>
        {result.userFacingMessage}
      </div>
      {result.issues.length > 0 && (
        <ul style={{ margin: "8px 0 0 0", paddingLeft: 16, fontSize: 11, color: "#64748b" }}>
          {result.issues.map((issue, i) => (
            <li key={i}>{issue}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DropZone({
  uploadState,
  onFileDrop,
  onFileSelect,
}: {
  uploadState: UploadState;
  onFileDrop: (e: DragEvent<HTMLDivElement>) => void;
  onFileSelect: (e: ChangeEvent<HTMLInputElement>) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    setIsDragging(false);
    onFileDrop(e);
  };

  const isReady = uploadState.status === "ready";
  const isError = uploadState.status === "error";
  const isReading = uploadState.status === "reading";

  const borderColor = isError
    ? "#f43f5e"
    : isReady
    ? "#10b981"
    : isDragging
    ? "#6366f1"
    : "rgba(255,255,255,0.12)";

  const bgColor = isError
    ? "rgba(244,63,94,0.05)"
    : isReady
    ? "rgba(16,185,129,0.05)"
    : isDragging
    ? "rgba(99,102,241,0.08)"
    : "rgba(255,255,255,0.02)";

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !isReady && fileInputRef.current?.click()}
      style={{
        border: `2px dashed ${borderColor}`,
        borderRadius: 16,
        padding: "32px 24px",
        textAlign: "center",
        cursor: isReady ? "default" : "pointer",
        background: bgColor,
        transition: "all 0.25s ease",
        userSelect: "none",
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={onFileSelect}
        style={{ display: "none" }}
      />

      {isReading && (
        <div>
          <div
            style={{
              width: 40,
              height: 40,
              border: "3px solid rgba(99,102,241,0.3)",
              borderTop: "3px solid #6366f1",
              borderRadius: "50%",
              margin: "0 auto 12px",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <div style={{ fontSize: 13, color: "#94a3b8" }}>Reading PDF...</div>
        </div>
      )}

      {isReady && (
        <div>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#10b981", marginBottom: 4 }}>
            {uploadState.fileName}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>
            {uploadState.fileSize}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            style={{
              fontSize: 11,
              color: "#6366f1",
              background: "rgba(99,102,241,0.1)",
              border: "1px solid rgba(99,102,241,0.3)",
              padding: "4px 12px",
              borderRadius: 8,
              cursor: "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Replace file
          </button>
        </div>
      )}

      {isError && (
        <div>
          <div style={{ fontSize: 32, marginBottom: 8 }}>❌</div>
          <div style={{ fontSize: 13, color: "#f43f5e", marginBottom: 4 }}>
            {uploadState.errorMessage}
          </div>
          <div style={{ fontSize: 11, color: "#64748b" }}>
            Try a different file or paste the JD text directly
          </div>
        </div>
      )}

      {(uploadState.status === "idle" || uploadState.status === "dragging") && (
        <div>
          <div
            style={{
              fontSize: 36,
              marginBottom: 12,
              filter: isDragging ? "none" : "grayscale(0.5)",
              transition: "filter 0.2s",
            }}
          >
            📄
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#94a3b8", marginBottom: 6 }}>
            {isDragging ? "Drop your PDF here" : "Drag & drop your JD PDF"}
          </div>
          <div style={{ fontSize: 12, color: "#475569" }}>
            or <span style={{ color: "#6366f1", fontWeight: 600 }}>click to browse</span>
            {" "}· PDF only · max {MAX_FILE_SIZE_MB} MB
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface JDUploadScreenProps {
  userId: string;
  onAnalysisComplete: (result: AnalysisResult) => void;
}

export function JDUploadScreen({ userId, onAnalysisComplete }: JDUploadScreenProps) {
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>({
    company: "",
    roleTitle: "",
    jdText: "",
    resumeText: "",
  });
  const [inputMode, setInputMode] = useState<InputMode>("paste");
  const [uploadState, setUploadState] = useState<UploadState>({
    status: "idle",
    fileName: "",
    fileSize: "",
    errorMessage: "",
    base64: "",
  });
  const [jdValidation, setJdValidation] = useState<ReturnType<
    typeof validateJD
  > | null>(null);
  const [submitState, setSubmitState] = useState<
    "idle" | "analyzing" | "success" | "error"
  >("idle");
  const [submitError, setSubmitError] = useState<string>("");
  const [roleSuggestions, setRoleSuggestions] = useState<string[]>([]);
  const [showRoleSuggestions, setShowRoleSuggestions] = useState(false);

  const selectedCompany = COMPANIES.find((c) => c.key === form.company);

  // Update role suggestions when company changes
  useEffect(() => {
    if (selectedCompany) {
      setRoleSuggestions(selectedCompany.roles);
    } else {
      setRoleSuggestions([]);
    }
  }, [form.company]);

  // Validate JD on paste (debounced 600ms)
  useEffect(() => {
    if (inputMode !== "paste" || !form.jdText) {
      setJdValidation(null);
      return;
    }
    const timer = setTimeout(() => {
      setJdValidation(validateJD(form.jdText));
    }, 600);
    return () => clearTimeout(timer);
  }, [form.jdText, inputMode]);

  // ── File Handlers ──────────────────────────────────────────────────────────

  const handleFileDrop = useCallback(async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    await processFile(file);
  }, []);

  const handleFileSelect = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      await processFile(file);
      // Reset input so same file can be re-selected
      e.target.value = "";
    },
    []
  );

  async function processFile(file: File) {
    // Validate type
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      setUploadState((s) => ({
        ...s,
        status: "error",
        errorMessage: "Only PDF files are supported.",
      }));
      return;
    }

    // Validate size
    if (file.size > MAX_FILE_BYTES) {
      setUploadState((s) => ({
        ...s,
        status: "error",
        errorMessage: `File is ${formatBytes(file.size)} — maximum allowed is ${MAX_FILE_SIZE_MB} MB.`,
      }));
      return;
    }

    setUploadState((s) => ({ ...s, status: "reading" }));

    try {
      const base64 = await readFileAsBase64(file);
      setUploadState({
        status: "ready",
        fileName: file.name,
        fileSize: formatBytes(file.size),
        errorMessage: "",
        base64,
      });
      // Clear any JD validation from paste mode
      setJdValidation(null);
    } catch {
      setUploadState((s) => ({
        ...s,
        status: "error",
        errorMessage: "Failed to read the PDF. Please try again or paste the text.",
      }));
    }
  }

  // ── Step Navigation ────────────────────────────────────────────────────────

  function canAdvanceStep1(): boolean {
    return !!form.company && form.roleTitle.trim().length >= 3;
  }

  function canAdvanceStep2(): boolean {
    if (inputMode === "paste") {
      return (
        form.jdText.trim().length >= 100 &&
        (!jdValidation || jdValidation.severity !== "block")
      );
    }
    return uploadState.status === "ready";
  }

  function canSubmit(): boolean {
    return form.resumeText.trim().length >= 80;
  }

  // ── Form Submit ────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!canSubmit()) return;
    setSubmitState("analyzing");
    setSubmitError("");

    try {
      const body: Record<string, string> = {
        resumeText: form.resumeText,
        companyHint: form.company,
        targetRoleTitle: form.roleTitle,
        userId,
      };

      if (inputMode === "paste") {
        body.jdRawText = form.jdText;
      } else {
        body.jdPdfBase64 = uploadState.base64;
      }

      const response = await fetch("/api/v1/jd/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const errorCode = data.error?.code ?? "UNKNOWN_ERROR";
        const errorMsg = data.error?.message ?? "Analysis failed. Please try again.";

        // Handle specific error codes with user-friendly messages
        const friendlyErrors: Record<string, string> = {
          RATE_LIMIT_EXCEEDED:
            "You've made too many requests. Please wait a minute before trying again.",
          LLM_TIMEOUT:
            "The AI took too long to respond. We're switching to offline analysis — please resubmit.",
          JD_EXTRACTION_FAILED:
            "We couldn't extract text from your PDF. Try pasting the JD text directly.",
          VALIDATION_ERROR:
            "Some fields are missing or invalid. Please check your inputs.",
        };

        throw new Error(
          friendlyErrors[errorCode] ?? errorMsg
        );
      }

      setSubmitState("success");
      onAnalysisComplete(data.data as AnalysisResult);
    } catch (err) {
      setSubmitState("error");
      setSubmitError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred. Please try again."
      );
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg,#0a0f1e 0%,#0d1230 50%,#0a0f1e 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* Ambient glows */}
      <div style={{ position: "fixed", top: "-10%", left: "-5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,0.08) 0%,transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "-10%", right: "-5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(139,92,246,0.07) 0%,transparent 70%)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 640, position: "relative" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 12, color: "#6366f1", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8 }}>
            PrepPilot Engine · Module A
          </div>
          <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 28, fontWeight: 900, color: "#fff", margin: 0, marginBottom: 8 }}>
            JD Intelligence Setup
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
            Upload your target JD and resume — PrepPilot will calibrate your simulation in under 30 seconds.
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: "rgba(15,23,42,0.8)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(99,102,241,0.2)",
            borderRadius: 24,
            padding: "32px 36px",
            boxShadow: "0 25px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          <StepIndicator current={step} total={3} />

          {/* ── STEP 1: Company & Role ───────────────────────────────────────── */}
          {step === 1 && (
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9", marginBottom: 6 }}>
                Which company are you targeting?
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 20 }}>
                This calibrates the interviewer persona, question bank, and cultural competency scoring.
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(172px, 1fr))",
                  gap: 10,
                  marginBottom: 24,
                }}
              >
                {COMPANIES.map((c) => (
                  <CompanyPill
                    key={c.key}
                    company={c}
                    selected={form.company === c.key}
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        company: c.key,
                        roleTitle: c.roles[0],
                      }))
                    }
                  />
                ))}
              </div>

              {/* Role Input */}
              <div style={{ marginBottom: 24 }}>
                <label
                  style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}
                >
                  Target Role Title
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    value={form.roleTitle}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, roleTitle: e.target.value }))
                    }
                    onFocus={() => setShowRoleSuggestions(true)}
                    onBlur={() =>
                      setTimeout(() => setShowRoleSuggestions(false), 150)
                    }
                    placeholder="e.g. Associate Software Engineer"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                      color: "#f1f5f9",
                      fontSize: 14,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  {showRoleSuggestions && roleSuggestions.length > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 4px)",
                        left: 0,
                        right: 0,
                        background: "#1e293b",
                        border: "1px solid rgba(99,102,241,0.3)",
                        borderRadius: 12,
                        zIndex: 100,
                        overflow: "hidden",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                      }}
                    >
                      {roleSuggestions.map((role, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setForm((f) => ({ ...f, roleTitle: role }));
                            setShowRoleSuggestions(false);
                          }}
                          style={{
                            width: "100%",
                            padding: "10px 16px",
                            background: "transparent",
                            border: "none",
                            borderBottom:
                              i < roleSuggestions.length - 1
                                ? "1px solid rgba(255,255,255,0.05)"
                                : "none",
                            color: "#cbd5e1",
                            fontSize: 13,
                            textAlign: "left",
                            cursor: "pointer",
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={(e) =>
                            ((e.target as HTMLElement).style.background =
                              "rgba(99,102,241,0.12)")
                          }
                          onMouseLeave={(e) =>
                            ((e.target as HTMLElement).style.background =
                              "transparent")
                          }
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {!form.company && (
                  <div style={{ fontSize: 11, color: "#475569", marginTop: 6 }}>
                    Select a company above to see role suggestions
                  </div>
                )}
              </div>

              <button
                disabled={!canAdvanceStep1()}
                onClick={() => setStep(2)}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: canAdvanceStep1()
                    ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
                    : "rgba(255,255,255,0.05)",
                  border: "none",
                  borderRadius: 12,
                  color: canAdvanceStep1() ? "#fff" : "#475569",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: canAdvanceStep1() ? "pointer" : "not-allowed",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  transition: "all 0.2s",
                  boxShadow: canAdvanceStep1()
                    ? "0 8px 24px rgba(99,102,241,0.35)"
                    : "none",
                }}
              >
                Continue → Add Job Description
              </button>
            </div>
          )}

          {/* ── STEP 2: Job Description ──────────────────────────────────────── */}
          {step === 2 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <button
                  onClick={() => setStep(1)}
                  style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 18, padding: 0 }}
                >
                  ←
                </button>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>
                  Add the Job Description
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 20, paddingLeft: 28 }}>
                For{" "}
                <strong style={{ color: selectedCompany?.color ?? "#6366f1" }}>
                  {selectedCompany?.name}
                </strong>{" "}
                · {form.roleTitle}
              </div>

              {/* Mode Toggle */}
              <div
                style={{
                  display: "flex",
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 10,
                  padding: 4,
                  marginBottom: 20,
                  width: "fit-content",
                }}
              >
                {(["paste", "upload"] as InputMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setInputMode(mode)}
                    style={{
                      padding: "7px 20px",
                      borderRadius: 8,
                      border: "none",
                      background:
                        inputMode === mode
                          ? "rgba(99,102,241,0.25)"
                          : "transparent",
                      color: inputMode === mode ? "#a5b4fc" : "#64748b",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      transition: "all 0.2s",
                    }}
                  >
                    {mode === "paste" ? "📋 Paste Text" : "📄 Upload PDF"}
                  </button>
                ))}
              </div>

              {/* Paste Mode */}
              {inputMode === "paste" && (
                <div>
                  <textarea
                    value={form.jdText}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, jdText: e.target.value }))
                    }
                    placeholder="Paste the complete job description here — include requirements, responsibilities, and qualifications..."
                    rows={10}
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      background: "rgba(255,255,255,0.03)",
                      border:
                        jdValidation?.severity === "block"
                          ? "1px solid #f43f5e"
                          : jdValidation?.severity === "warn"
                          ? "1px solid #f59e0b"
                          : "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                      color: "#e2e8f0",
                      fontSize: 13,
                      lineHeight: 1.6,
                      fontFamily: "'JetBrains Mono', monospace",
                      resize: "vertical",
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "border-color 0.2s",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: 6,
                    }}
                  >
                    <span style={{ fontSize: 11, color: "#475569" }}>
                      Minimum 100 characters
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color:
                          form.jdText.length >= 100 ? "#10b981" : "#475569",
                      }}
                    >
                      {form.jdText.length} chars
                    </span>
                  </div>
                  <JDValidationBanner result={jdValidation} />
                </div>
              )}

              {/* Upload Mode */}
              {inputMode === "upload" && (
                <DropZone
                  uploadState={uploadState}
                  onFileDrop={handleFileDrop}
                  onFileSelect={handleFileSelect}
                />
              )}

              <button
                disabled={!canAdvanceStep2()}
                onClick={() => setStep(3)}
                style={{
                  width: "100%",
                  marginTop: 20,
                  padding: "14px",
                  background: canAdvanceStep2()
                    ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
                    : "rgba(255,255,255,0.05)",
                  border: "none",
                  borderRadius: 12,
                  color: canAdvanceStep2() ? "#fff" : "#475569",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: canAdvanceStep2() ? "pointer" : "not-allowed",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  transition: "all 0.2s",
                  boxShadow: canAdvanceStep2()
                    ? "0 8px 24px rgba(99,102,241,0.35)"
                    : "none",
                }}
              >
                Continue → Add Your Resume
              </button>
            </div>
          )}

          {/* ── STEP 3: Resume ────────────────────────────────────────────────── */}
          {step === 3 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <button
                  onClick={() => setStep(2)}
                  style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 18, padding: 0 }}
                >
                  ←
                </button>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>
                  Paste Your Resume Text
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 20, paddingLeft: 28 }}>
                PrepPilot's Agent 1 will extract your skills and flag any unverified buzzwords.
              </div>

              <textarea
                value={form.resumeText}
                onChange={(e) =>
                  setForm((f) => ({ ...f, resumeText: e.target.value }))
                }
                placeholder="Paste your full resume text here — include your projects, skills, and work experience..."
                rows={10}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  color: "#e2e8f0",
                  fontSize: 13,
                  lineHeight: 1.6,
                  fontFamily: "'JetBrains Mono', monospace",
                  resize: "vertical",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 6,
                  marginBottom: 20,
                }}
              >
                <span style={{ fontSize: 11, color: "#475569" }}>
                  Minimum 80 characters
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: form.resumeText.length >= 80 ? "#10b981" : "#475569",
                  }}
                >
                  {form.resumeText.length} chars
                </span>
              </div>

              {/* Privacy note */}
              <div
                style={{
                  background: "rgba(16,185,129,0.06)",
                  border: "1px solid rgba(16,185,129,0.2)",
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontSize: 11,
                  color: "#64748b",
                  marginBottom: 20,
                }}
              >
                🔒 Your resume text is processed in-memory only during this session and is not stored persistently.
              </div>

              {/* Error State */}
              {submitState === "error" && (
                <div
                  style={{
                    background: "rgba(244,63,94,0.08)",
                    border: "1px solid rgba(244,63,94,0.3)",
                    borderRadius: 12,
                    padding: "12px 16px",
                    marginBottom: 16,
                    fontSize: 13,
                    color: "#f43f5e",
                  }}
                >
                  ❌ {submitError}
                </div>
              )}

              {/* Submit Button */}
              <button
                disabled={!canSubmit() || submitState === "analyzing"}
                onClick={handleSubmit}
                style={{
                  width: "100%",
                  padding: "16px",
                  background:
                    !canSubmit() || submitState === "analyzing"
                      ? "rgba(255,255,255,0.05)"
                      : "linear-gradient(135deg,#6366f1,#8b5cf6)",
                  border: "none",
                  borderRadius: 12,
                  color: canSubmit() && submitState !== "analyzing" ? "#fff" : "#475569",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: canSubmit() && submitState !== "analyzing" ? "pointer" : "not-allowed",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  boxShadow:
                    canSubmit() && submitState !== "analyzing"
                      ? "0 8px 28px rgba(99,102,241,0.4)"
                      : "none",
                }}
              >
                {submitState === "analyzing" ? (
                  <>
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTop: "2px solid #fff",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                      }}
                    />
                    PrepPilot is analyzing your JD & Resume...
                  </>
                ) : (
                  "⚡ Run JD Intelligence Analysis"
                )}
              </button>

              {submitState === "analyzing" && (
                <div
                  style={{
                    marginTop: 14,
                    fontSize: 12,
                    color: "#64748b",
                    textAlign: "center",
                    lineHeight: 1.7,
                  }}
                >
                  Agent 2 is parsing the JD · Computing match score · Detecting buzzwords · Generating gap alerts
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            marginTop: 20,
            fontSize: 11,
            color: "#334155",
          }}
        >
          AIview PrepPilot Engine · Azisly Impact Sprint · n=30 pilot validated
        </div>
      </div>

      {/* Spinner keyframes */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
