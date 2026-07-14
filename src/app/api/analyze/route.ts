import { NextRequest, NextResponse } from "next/server";
import { callGroqJSON } from "@/lib/groq";
import {
  ANALYZER_SYSTEM_PROMPT,
  buildAnalyzerUserPrompt,
} from "@/lib/prompts/analyzer";
import type { AnalyzeRequestBody, AnalyzerResult } from "@/types";

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

    const result = await callGroqJSON<AnalyzerResult>({
      systemPrompt: ANALYZER_SYSTEM_PROMPT,
      userPrompt: buildAnalyzerUserPrompt(body.systemDescription),
    });

    if (!Array.isArray(result.decisionPoints)) {
      throw new Error("Malformed analyzer output: decisionPoints missing.");
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/analyze] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Analyzer failed: ${message}` },
      { status: 500 }
    );
  }
}