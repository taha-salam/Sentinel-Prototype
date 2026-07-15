"use client";

import { useState } from "react";
import type { GovernanceReport, RequirementCategory } from "@/types";

const RISK_COLORS: Record<string, string> = {
  LOW: "#2F855A",
  MEDIUM: "#B7791F",
  HIGH: "#C05621",
  CRITICAL: "#C53030",
};

const TIER_COLORS: Record<string, string> = {
  unacceptable: "#C53030",
  high: "#C05621",
  limited: "#B7791F",
  minimal: "#2F855A",
};

const TIER_LABELS: Record<string, string> = {
  unacceptable: "Unacceptable Risk",
  high: "High Risk",
  limited: "Limited Risk",
  minimal: "Minimal Risk",
};

const CATEGORY_COLORS: Record<RequirementCategory, string> = {
  "human-oversight": "#5B4B8A",
  functional: "#1B6E7A",
  "non-functional": "#2C5282",
  safety: "#B03052",
  accountability: "#946C1D",
};

const CATEGORY_LABELS: Record<RequirementCategory, string> = {
  "human-oversight": "Human Oversight",
  functional: "Functional",
  "non-functional": "Non-Functional",
  safety: "Safety",
  accountability: "Accountability",
};

const AUTONOMY_LABELS: Record<string, string> = {
  "human-in-loop": "Human in loop",
  "human-on-loop": "Human on loop",
  "fully-autonomous": "Fully autonomous",
};

function overallRiskLevel(score: number): string {
  if (score >= 85) return "CRITICAL";
  if (score >= 60) return "HIGH";
  if (score >= 30) return "MEDIUM";
  return "LOW";
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

const SAMPLE_TEXT =
  "The system uses an LLM to automatically approve or reject loan applications above $50,000 without human review. It also has a chatbot that answers customer FAQs, and a fraud detection model that flags suspicious transactions for a human analyst to review before any account is frozen.";

type Section = "overview" | "decisions" | "requirements" | "compliance";

const SERIF = "'Source Serif 4', Georgia, serif";
const SANS = "'IBM Plex Sans', system-ui, sans-serif";
const MONO = "'IBM Plex Mono', monospace";

export default function Home() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<GovernanceReport | null>(null);
  const [section, setSection] = useState<Section>("overview");
  const [expandedDp, setExpandedDp] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<RequirementCategory | "all">("all");

  async function runAnalysis() {
    if (input.trim().length < 20) {
      setError("Describe the system in at least 20 characters.");
      return;
    }
    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const res = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemDescription: input }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Report generation failed.");
      setReport(data as GovernanceReport);
      setSection("overview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function exportJSON() {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sentinel-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const level = report ? overallRiskLevel(report.risk.overallRiskScore) : null;
  const levelColor = level ? RISK_COLORS[level] : "#18181B";

  const filteredReqs =
    report && categoryFilter !== "all"
      ? report.requirements.requirements.filter((r) => r.category === categoryFilter)
      : report?.requirements.requirements ?? [];

  const refCode = report ? `SENTINEL-${new Date(report.generatedAt).getTime().toString().slice(-6)}` : "";

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#18181B]" style={{ fontFamily: SANS }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&display=swap" />
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/ibm-plex/6.0.0/css/ibm-plex-sans.min.css" />
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/ibm-plex/6.0.0/css/ibm-plex-mono.min.css" />

      {/* Letterhead */}
      <header className="border-b border-[#D4D4D8] px-10 py-5">
        <div className="max-w-4xl mx-auto flex items-end justify-between">
          <div>
            <div className="text-[11px] tracking-[0.15em] text-[#71717A]" style={{ fontFamily: MONO }}>
              PROJECT
            </div>
            <h1 className="text-2xl font-semibold -mt-0.5" style={{ fontFamily: SERIF }}>
              Sentinel
            </h1>
          </div>
          <div className="text-right text-[11px] text-[#71717A]" style={{ fontFamily: MONO }}>
            <div>AI GOVERNANCE &amp; REQUIREMENTS ENGINEERING</div>
            <div className="mt-0.5">CORE PIPELINE PROTOTYPE, v0.1</div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-10 py-10">
        {/* Input */}
        <section className="pb-8 border-b border-[#D4D4D8]">
          <label className="block text-[11px] tracking-[0.1em] text-[#71717A] mb-2" style={{ fontFamily: MONO }}>
            SYSTEM DESCRIPTION, SRS EXCERPT, OR USER STORIES
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={5}
            placeholder="Describe where AI is used in the system being analyzed..."
            className="w-full bg-white border border-[#D4D4D8] px-4 py-3 text-sm text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#18181B] transition-colors resize-none"
          />
          <div className="flex items-center gap-5 mt-3">
            <button
              onClick={runAnalysis}
              disabled={loading}
              className="bg-[#18181B] text-white text-sm px-5 py-2 hover:bg-[#2A2A30] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Analyzing" : "Run Analysis"}
            </button>
            <button
              onClick={() => setInput(SAMPLE_TEXT)}
              disabled={loading}
              className="text-sm text-[#71717A] hover:text-[#18181B] underline decoration-[#D4D4D8] underline-offset-4 transition-colors"
            >
              Use sample description
            </button>
            {report && (
              <button
                onClick={exportJSON}
                className="text-sm text-[#71717A] hover:text-[#18181B] underline decoration-[#D4D4D8] underline-offset-4 transition-colors ml-auto"
              >
                Export JSON
              </button>
            )}
          </div>
          {error && <p className="text-sm text-[#C53030] mt-3">{error}</p>}
        </section>

        {loading && (
          <div className="pt-8 space-y-2">
            {["Scanning for AI decision points", "Deriving governance requirements", "Scoring risk factors"].map(
              (msg, i) => (
                <div
                  key={msg}
                  className="text-sm text-[#71717A]"
                  style={{ fontFamily: MONO, animation: `fadeIn 0.3s ease-in ${i * 0.15}s both` }}
                >
                  {"> "}
                  {msg}...
                </div>
              )
            )}
          </div>
        )}

        {report && (
          <div key={report.generatedAt} style={{ animation: "fadeIn 0.3s ease-out" }}>
            {/* Report stat block */}
            <div className="py-8 border-b border-[#D4D4D8] flex items-start gap-10">
              <div>
                <div
                  className="text-6xl font-semibold leading-none"
                  style={{ fontFamily: SERIF, color: levelColor }}
                >
                  {report.risk.overallRiskScore.toFixed(0)}
                </div>
                <div className="text-[11px] tracking-[0.15em] mt-2" style={{ fontFamily: MONO, color: levelColor }}>
                  {level} RISK
                </div>
              </div>
              <div className="flex-1 pt-1.5">
                <p className="text-sm text-[#3F3F46] leading-relaxed">{report.analyzer.summary}</p>
                <div className="flex gap-6 mt-4 text-[11px] text-[#71717A]" style={{ fontFamily: MONO }}>
                  <span>REF {refCode}</span>
                  <span>{report.analyzer.decisionPoints.length} DECISION POINTS</span>
                  <span>{report.requirements.requirements.length} REQUIREMENTS</span>
                </div>
              </div>
            </div>

            <div className="flex gap-10 pt-8">
              {/* Vertical nav */}
              <nav className="w-40 shrink-0 space-y-1">
                {(["overview", "decisions", "requirements", "compliance"] as Section[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSection(s)}
                    className={`block w-full text-left text-sm py-1.5 pl-3 border-l-2 transition-colors ${
                      section === s
                        ? "border-[#18181B] text-[#18181B] font-medium"
                        : "border-[#E4E4E7] text-[#71717A] hover:text-[#18181B] hover:border-[#A1A1AA]"
                    }`}
                  >
                    {s === "decisions"
                      ? "Decision Points"
                      : s === "requirements"
                      ? "Requirements"
                      : s === "compliance"
                      ? "Compliance"
                      : "Overview"}
                  </button>
                ))}
              </nav>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {section === "overview" && (
                  <div className="space-y-0">
                    {report.risk.assessments
                      .slice()
                      .sort((a, b) => b.riskScore - a.riskScore)
                      .map((a, i) => {
                        const c = RISK_COLORS[a.riskLevel];
                        return (
                          <div
                            key={a.decisionPointId}
                            className="flex items-center gap-4 py-3 border-b border-[#E4E4E7]"
                          >
                            <span className="text-[11px] text-[#A1A1AA] w-10 shrink-0" style={{ fontFamily: MONO }}>
                              DP-{pad(i + 1)}
                            </span>
                            <span className="text-sm flex-1">{a.decisionPointName}</span>
                            <div className="w-32 h-1 bg-[#E4E4E7] shrink-0">
                              <div className="h-full" style={{ width: `${a.riskScore}%`, backgroundColor: c }} />
                            </div>
                            <span
                              className="text-sm w-8 text-right shrink-0"
                              style={{ fontFamily: MONO, color: c }}
                            >
                              {a.riskScore.toFixed(0)}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                )}

                {section === "decisions" && (
                  <div>
                    {report.risk.assessments.map((assessment, i) => {
                      const dp = report.analyzer.decisionPoints.find(
                        (d) => d.id === assessment.decisionPointId
                      );
                      const c = RISK_COLORS[assessment.riskLevel];
                      const isOpen = expandedDp === assessment.decisionPointId;
                      return (
                        <div key={assessment.decisionPointId} className="border-b border-[#E4E4E7] py-4">
                          <div
                            className="flex items-start justify-between gap-4 cursor-pointer"
                            onClick={() => setExpandedDp(isOpen ? null : assessment.decisionPointId)}
                          >
                            <div className="flex gap-3">
                              <span className="text-[11px] text-[#A1A1AA] pt-0.5" style={{ fontFamily: MONO }}>
                                DP-{pad(i + 1)}
                              </span>
                              <div>
                                <h3 className="text-sm font-medium">{assessment.decisionPointName}</h3>
                                <p className="text-sm text-[#71717A] mt-1">{dp?.description}</p>
                                <div className="flex gap-4 mt-2 text-[11px] text-[#71717A]" style={{ fontFamily: MONO }}>
                                  <span>{AUTONOMY_LABELS[dp?.autonomyLevel ?? ""]}</span>
                                  {dp?.sensitiveOperation && <span>SENSITIVE DATA</span>}
                                  {dp?.criticalWorkflow && <span>CRITICAL WORKFLOW</span>}
                                </div>
                              </div>
                            </div>
                            <span
                              className="text-lg shrink-0 pt-0.5"
                              style={{ fontFamily: MONO, color: c }}
                            >
                              {assessment.riskScore.toFixed(0)}
                            </span>
                          </div>

                          {isOpen && (
                            <div
                              className="mt-4 pl-8 border-l border-[#E4E4E7]"
                              style={{ animation: "fadeIn 0.2s ease-out" }}
                            >
                              <p className="text-sm text-[#3F3F46] leading-relaxed mb-4">
                                {assessment.explanation}
                              </p>
                              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                                {Object.entries(assessment.factors).map(([k, v]) => (
                                  <div key={k} className="flex items-center gap-3">
                                    <span
                                      className="text-[11px] text-[#71717A] w-40 shrink-0"
                                      style={{ fontFamily: MONO }}
                                    >
                                      {k.replace(/([A-Z])/g, " $1").toUpperCase()}
                                    </span>
                                    <div className="flex-1 h-1 bg-[#E4E4E7]">
                                      <div className="h-full bg-[#18181B]" style={{ width: `${v}%` }} />
                                    </div>
                                    <span className="text-[11px] w-6 text-right" style={{ fontFamily: MONO }}>
                                      {v}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {section === "requirements" && (
                  <div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mb-5 text-sm">
                      <button
                        onClick={() => setCategoryFilter("all")}
                        className={`${
                          categoryFilter === "all" ? "text-[#18181B] font-medium" : "text-[#A1A1AA] hover:text-[#18181B]"
                        } transition-colors`}
                      >
                        All ({report.requirements.requirements.length})
                      </button>
                      {(Object.keys(CATEGORY_LABELS) as RequirementCategory[]).map((cat) => {
                        const count = report.requirements.requirements.filter((r) => r.category === cat).length;
                        if (count === 0) return null;
                        return (
                          <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`transition-colors ${
                              categoryFilter === cat ? "font-medium" : "text-[#A1A1AA] hover:text-[#18181B]"
                            }`}
                            style={categoryFilter === cat ? { color: CATEGORY_COLORS[cat] } : undefined}
                          >
                            {CATEGORY_LABELS[cat]} ({count})
                          </button>
                        );
                      })}
                    </div>

                    <div>
                      {filteredReqs.map((req, i) => {
                        const dp = report.analyzer.decisionPoints.find((d) => d.id === req.relatedDecisionPointId);
                        const c = CATEGORY_COLORS[req.category];
                        return (
                          <div key={req.id} className="flex gap-3 py-3 border-b border-[#E4E4E7]">
                            <span className="text-[11px] text-[#A1A1AA] pt-0.5 shrink-0" style={{ fontFamily: MONO }}>
                              REQ-{pad(i + 1)}
                            </span>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className="w-1.5 h-1.5 inline-block"
                                  style={{ backgroundColor: c }}
                                />
                                <span className="text-[11px]" style={{ fontFamily: MONO, color: c }}>
                                  {CATEGORY_LABELS[req.category].toUpperCase()}
                                </span>
                                <span className="text-[11px] text-[#A1A1AA]">{dp?.name}</span>
                              </div>
                              <p className="text-sm">{req.text}</p>
                              <p className="text-sm text-[#71717A] mt-1 italic">{req.rationale}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {section === "compliance" && (
                  <div>
                    <p className="text-sm text-[#71717A] mb-5">
                      Tier classification against the EU AI Act's risk-based framework. This is a lightweight
                      first-pass assessment, not a substitute for formal legal review.
                    </p>
                    {report.compliance.flags.map((flag, i) => {
                      const c = TIER_COLORS[flag.tier];
                      return (
                        <div key={flag.decisionPointId} className="flex gap-3 py-4 border-b border-[#E4E4E7]">
                          <span className="text-[11px] text-[#A1A1AA] pt-0.5 shrink-0" style={{ fontFamily: MONO }}>
                            DP-{pad(i + 1)}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-4">
                              <h3 className="text-sm font-medium">{flag.decisionPointName}</h3>
                              <span
                                className="text-[11px] shrink-0"
                                style={{ fontFamily: MONO, color: c }}
                              >
                                {TIER_LABELS[flag.tier].toUpperCase()}
                              </span>
                            </div>
                            <p className="text-sm text-[#3F3F46] mt-1.5">{flag.justification}</p>
                            <ul className="mt-2 space-y-1">
                              {flag.keyObligations.map((ob, j) => (
                                <li key={j} className="text-sm text-[#71717A] flex gap-2">
                                  <span className="text-[#A1A1AA]">-</span>
                                  <span>{ob}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
