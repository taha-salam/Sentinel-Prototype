import { NextRequest, NextResponse } from "next/server";
import { callGroqJSON } from "@/lib/groq";
import {
  RISK_ASSESSMENT_SYSTEM_PROMPT,
  buildRiskAssessmentUserPrompt,
} from "@/lib/prompts/riskAssessment";
import type { AssessRiskRequestBody, RiskAssessmentResult } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body: AssessRiskRequestBody = await req.json();

    if (
      !body.decisionPoints ||
      !Array.isArray(body.decisionPoints) ||
      body.decisionPoints.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "decisionPoints is required and must be a non-empty array (output of /api/analyze).",
        },
        { status: 400 }
      );
    }

    const result = await callGroqJSON<RiskAssessmentResult>({
      systemPrompt: RISK_ASSESSMENT_SYSTEM_PROMPT,
      userPrompt: buildRiskAssessmentUserPrompt(body.decisionPoints),
    });

    if (!Array.isArray(result.assessments)) {
      throw new Error(
        "Malformed risk assessment output: assessments missing."
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/assess-risk] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Risk assessment failed: ${message}` },
      { status: 500 }
    );
  }
}