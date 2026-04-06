import type { Athlete } from "@prisma/client";

import { RISK_LEVELS } from "@/lib/constants";

export function normalizeName(value: string) {
  return value.replace(/\s+/g, "").trim().toLowerCase();
}

export function isRiskLevel(level?: string | null) {
  if (!level) {
    return false;
  }

  return RISK_LEVELS.some((item) => level.includes(item));
}

export function mapRiskCategory(level?: string | null) {
  return isRiskLevel(level) ? "HIGH" : "CLEAR";
}

export function sortAthletesByPriority<T extends Pick<Athlete, "level" | "certifiedAt">>(records: T[]) {
  return [...records].sort((a, b) => {
    const riskDiff = Number(isRiskLevel(b.level)) - Number(isRiskLevel(a.level));

    if (riskDiff !== 0) {
      return riskDiff;
    }

    const aTime = a.certifiedAt ? new Date(a.certifiedAt).getTime() : 0;
    const bTime = b.certifiedAt ? new Date(b.certifiedAt).getTime() : 0;

    return bTime - aTime;
  });
}
