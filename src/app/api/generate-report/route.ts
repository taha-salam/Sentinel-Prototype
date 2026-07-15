import { NextRequest, NextResponse } from "next/server";
import { callGroqJSON } from "@/lib/groq";
import {
  ANALYZER_SYSTEM_PROMPT,
  buildAnalyzerUserPrompt,
} from "@/lib/prompts/analyzer";
import {
  REQUIREMENT_GENERATOR_SYSTEM_PROMPT,
  buildRequirementGeneratorUserPrompt,
} from "@/lib/prompts/requirementGenerator";
import {
  RISK_ASSESSMENT_SYSTEM_PROMPT,
  buildRiskAssessmentUserPrompt,
} from "@/lib/prompts/riskAssessment";
import {
  COMPLIANCE_SYSTEM_PROMPT,
  buildComplianceUserPrompt,
} from "@/lib/prompts/compliance";
import type {
  AnalyzeRequestBody,
  AnalyzerResult,
  RequirementGeneratorResult,
  RiskAssessmentResult,
  ComplianceResult,
  GovernanceReport,
} from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body: AnalyzeRequestBody = await req.json();

    if (!body.systemDescription || body.systemDescription.trim().length < 20) {
      return NextResponse.json(
        {
          error:
            "systemDescription is required and must be at least 20 characters.",
        },
        { status: 400 }
      );
    }

    // Step 1: Analyzer — must run first, everything else depends on its output
    const analyzer = await callGroqJSON<AnalyzerResult>({
      systemPrompt: ANALYZER_SYSTEM_PROMPT,
      userPrompt: buildAnalyzerUserPrompt(body.systemDescription),
    });

    if (!Array.isArray(analyzer.decisionPoints)) {
      throw new Error("Malformed analyzer output: decisionPoints missing.");
    }

    if (analyzer.decisionPoints.length === 0) {
      // No AI decision points found — return early with an empty report
      // rather than calling the next two modules with nothing to work on.
      const emptyReport: GovernanceReport = {
        systemDescription: body.systemDescription,
        analyzer,
        requirements: { requirements: [] },
        risk: { assessments: [], overallRiskScore: 0 },
        compliance: { flags: [] },
        generatedAt: new Date().toISOString(),
      };
      return NextResponse.json(emptyReport);
    }

    // Step 2, 3 & 4: Requirement Generator, Risk Assessment, and Compliance
    // Engine all only depend on the analyzer's output, not on each other —
    // run them in parallel.
    const [requirements, risk, compliance] = await Promise.all([
      callGroqJSON<RequirementGeneratorResult>({
        systemPrompt: REQUIREMENT_GENERATOR_SYSTEM_PROMPT,
        userPrompt: buildRequirementGeneratorUserPrompt(
          analyzer.decisionPoints
        ),
      }),
      callGroqJSON<RiskAssessmentResult>({
        systemPrompt: RISK_ASSESSMENT_SYSTEM_PROMPT,
        userPrompt: buildRiskAssessmentUserPrompt(analyzer.decisionPoints),
      }),
      callGroqJSON<ComplianceResult>({
        systemPrompt: COMPLIANCE_SYSTEM_PROMPT,
        userPrompt: buildComplianceUserPrompt(analyzer.decisionPoints),
      }),
    ]);

    if (!Array.isArray(requirements.requirements)) {
      throw new Error(
        "Malformed requirement generator output: requirements missing."
      );
    }
    if (!Array.isArray(risk.assessments)) {
      throw new Error(
        "Malformed risk assessment output: assessments missing."
      );
    }
    if (!Array.isArray(compliance.flags)) {
      throw new Error("Malformed compliance output: flags missing.");
    }

    const report: GovernanceReport = {
      systemDescription: body.systemDescription,
      analyzer,
      requirements,
      risk,
      compliance,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(report);
  } catch (err) {
    console.error("[/api/generate-report] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Report generation failed: ${message}` },
      { status: 500 }
    );
  }
}