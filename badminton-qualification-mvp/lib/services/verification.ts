import type { Athlete, Prisma } from "@prisma/client";

import { isRiskLevel } from "@/lib/eligibility";
import type { AthleteSearchRecord, RiskCategory, VerificationStatus } from "@/lib/types";

type BuildVerificationRecordArgs = {
  athleteNameInput: string;
  eventId: string;
  batchId?: string;
  rowIndex?: number;
  rowDataJson?: string;
  matches: Athlete[];
};

type BuildVerificationRecordFromSearchArgs = Omit<BuildVerificationRecordArgs, "matches"> & {
  matches: AthleteSearchRecord[];
  notFoundRemark?: string;
};

function buildMatchedFields(match: Athlete | AthleteSearchRecord) {
  return {
    matchedAthleteName: match.name,
    matchedLevel: match.level,
    matchedGender: match.gender ?? undefined,
    matchedRegion: match.region ?? undefined,
    matchedOrganization: match.organization ?? undefined,
    matchedSourceName: match.sourceName
  };
}

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
      remark: "未在当前数据源中查到记录。"
    };
  }

  const [first] = matches;
  const riskMatches = matches.filter((item) => isRiskLevel(item.level));
  const primaryMatch = riskMatches[0] ?? first;

  if (matches.length > 1) {
    if (riskMatches.length > 0) {
      return {
        ...base,
        athleteId: primaryMatch.id,
        ...buildMatchedFields(primaryMatch),
        status: "RISK",
        riskCategory: "HIGH",
        isRisk: true,
        remark: `存在 ${matches.length} 条同名记录，其中 ${riskMatches.length} 条为二级及以上风险等级，需人工确认身份。`
      };
    }

    return {
      ...base,
      athleteId: first.id,
      ...buildMatchedFields(first),
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
    ...buildMatchedFields(first),
    status,
    riskCategory,
    isRisk: status === "RISK",
    remark:
      status === "RISK"
        ? "检测到二级运动员及以上等级记录，建议限制参加业余赛事。"
        : "当前未检测到风险等级记录。"
  };
}

export function buildVerificationRecordInputFromSearchResults({
  athleteNameInput,
  eventId,
  batchId,
  rowIndex,
  rowDataJson,
  matches,
  notFoundRemark
}: BuildVerificationRecordFromSearchArgs): Prisma.VerificationRecordUncheckedCreateInput {
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
      remark: notFoundRemark || "未在当前实时数据源中查到记录。"
    };
  }

  const riskMatches = matches.filter((item) => isRiskLevel(item.level));
  const primaryMatch = riskMatches[0] ?? matches[0];

  if (riskMatches.length > 0) {
    return {
      ...base,
      ...buildMatchedFields(primaryMatch),
      status: "RISK",
      riskCategory: "HIGH",
      isRisk: true,
      remark:
        matches.length > 1
          ? `存在 ${matches.length} 条同名记录，其中 ${riskMatches.length} 条为二级及以上风险等级，需人工确认身份。`
          : "检测到二级运动员及以上等级记录，建议限制参加业余赛事。"
    };
  }

  if (matches.length > 1) {
    return {
      ...base,
      ...buildMatchedFields(primaryMatch),
      status: "REVIEW",
      riskCategory: "REVIEW",
      isRisk: false,
      remark: `存在 ${matches.length} 条同名记录，需人工复核后判定。`
    };
  }

  return {
    ...base,
    ...buildMatchedFields(primaryMatch),
    status: "PASSED",
    riskCategory: "CLEAR",
    isRisk: false,
    remark: "当前未检测到风险等级记录。"
  };
}

export function summarizeVerificationRecords(
  records: Array<{ status: VerificationStatus | string; isRisk: boolean }>
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
