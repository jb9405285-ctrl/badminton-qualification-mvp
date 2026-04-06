import { NextResponse } from "next/server";

import { searchAthleteByName } from "@/lib/services/athlete-provider";
import { isRiskLevel } from "@/lib/eligibility";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const name = url.searchParams.get("name")?.trim() ?? "";

  if (!name) {
    return NextResponse.json(
      {
        ok: false,
        message: "请输入运动员姓名。"
      },
      { status: 400 }
    );
  }

  const payload = await searchAthleteByName(name);
  const queryTime = new Date().toISOString();

  return NextResponse.json({
    ok: true,
    provider: payload.provider,
    sourceSummary: payload.sourceSummary,
    fallbackUsed: payload.fallbackUsed,
    warningMessage: payload.warningMessage,
    hintMessage: payload.hintMessage,
    queryTime,
    results: payload.results.map((athlete) => ({
      ...athlete,
      queryTime,
      isRisk: isRiskLevel(athlete.level)
    }))
  });
}
