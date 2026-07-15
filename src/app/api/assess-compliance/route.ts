import { NextRequest, NextResponse } from "next/server";
import { callGroqJSON } from "@/lib/groq";
import {
  COMPLIANCE_SYSTEM_PROMPT,
  buildComplianceUserPrompt,
} from "@/lib/prompts/compliance";
import type { AssessComplianceRequestBody, ComplianceResult } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body: AssessComplianceRequestBody = await req.json();

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

    const result = await callGroqJSON<ComplianceResult>({
      systemPrompt: COMPLIANCE_SYSTEM_PROMPT,
      userPrompt: buildComplianceUserPrompt(body.decisionPoints),
    });

    if (!Array.isArray(result.flags)) {
      throw new Error("Malformed compliance output: flags missing.");
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/assess-compliance] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Compliance assessment failed: ${message}` },
      { status: 500 }
    );
  }
}