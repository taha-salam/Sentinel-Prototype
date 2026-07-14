import { NextRequest, NextResponse } from "next/server";
import { callGroqJSON } from "@/lib/groq";
import {
  REQUIREMENT_GENERATOR_SYSTEM_PROMPT,
  buildRequirementGeneratorUserPrompt,
} from "@/lib/prompts/requirementGenerator";
import type {
  GenerateRequirementsRequestBody,
  RequirementGeneratorResult,
} from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body: GenerateRequirementsRequestBody = await req.json();

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

    const result = await callGroqJSON<RequirementGeneratorResult>({
      systemPrompt: REQUIREMENT_GENERATOR_SYSTEM_PROMPT,
      userPrompt: buildRequirementGeneratorUserPrompt(body.decisionPoints),
    });

    if (!Array.isArray(result.requirements)) {
      throw new Error(
        "Malformed requirement generator output: requirements missing."
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/generate-requirements] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Requirement generation failed: ${message}` },
      { status: 500 }
    );
  }
}