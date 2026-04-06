import type { Athlete, Prisma } from "@prisma/client";

import { isRiskLevel } from "@/lib/eligibility";
import type { RiskCategory, VerificationStatus } from "@/lib/types";

type BuildVerificationRecordArgs = {
  athleteNameInput: string;
  eventId: string;
  batchId?: string;
  rowIndex?: number;
  rowDataJson?: string;
  matches: Athlete[];
};

export function buildVerificationRecordInput({
  athleteNameInput,
  eventId,
  batchId,
  rowIndex,
  rowDataJson,
  matches
}: BuildVerificationRecordArgs): Prisma.VerificationRecordUncheckedCreateInput {
  const base = {
    eventId,
    batchId,
    athleteNameInput,
    rowIndex,
    rowDataJson
  };

  if (matches.length === 0) {
    return {
      ...base,
      status: "NOT_FOUND",
      riskCategory: "UNKNOWN",
      isRisk: false,
      remark: "未在演示运动员库中查到记录。"
    };
  }

  const [first] = matches;

  if (matches.length > 1) {
    return {
      ...base,
      athleteId: first.id,
      matchedAthleteName: first.name,
      matchedLevel: first.level,
      matchedGender: first.gender ?? undefined,
      matchedRegion: first.region ?? undefined,
      matchedOrganization: first.organization ?? undefined,
      matchedSourceName: first.sourceName,
      status: "REVIEW",
      riskCategory: "REVIEW",
      isRisk: false,
      remark: `存在 ${matches.length} 条同名记录，需人工复核后判定。`
    };
  }

  const status: VerificationStatus = isRiskLevel(first.level) ? "RISK" : "PASSED";
  const riskCategory: RiskCategory = status === "RISK" ? "HIGH" : "CLEAR";

  return {
    ...base,
    athleteId: first.id,
    matchedAthleteName: first.name,
    matchedLevel: first.level,
    matchedGender: first.gender ?? undefined,
    matchedRegion: first.region ?? undefined,
    matchedOrganization: first.organization ?? undefined,
    matchedSourceName: first.sourceName,
    status,
    riskCategory,
    isRisk: status === "RISK",
    remark:
      status === "RISK"
        ? "检测到二级运动员及以上等级记录，建议限制参加业余赛事。"
        : "当前未检测到风险等级记录。"
  };
}

export function summarizeVerificationRecords(
  records: Array<{ status: VerificationStatus; isRisk: boolean }>
) {
  return {
    total: records.length,
    passed: records.filter((item) => item.status === "PASSED").length,
    risk: records.filter((item) => item.status === "RISK").length,
    notFound: records.filter((item) => item.status === "NOT_FOUND").length,
    review: records.filter((item) => item.status === "REVIEW").length,
    matched: records.filter((item) => item.status !== "NOT_FOUND").length
  };
}
