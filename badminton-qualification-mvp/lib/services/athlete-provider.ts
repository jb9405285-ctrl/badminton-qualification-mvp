import type { Athlete } from "@prisma/client";

import { ensureDemoData } from "@/lib/data/bootstrap";
import { normalizeName, sortAthletesByPriority } from "@/lib/eligibility";
import { prisma } from "@/lib/prisma";
import { PublicRealtimeAthleteProvider } from "@/lib/services/public-realtime-provider";
import type { AthleteSearchRecord, AthleteSearchResponse } from "@/lib/types";

export interface SearchAthleteProvider {
  searchByName(name: string): Promise<AthleteSearchResponse>;
}

export interface VerificationAthleteProvider {
  exactMatchByName(name: string): Promise<Athlete[]>;
}

class MockAthleteProvider implements SearchAthleteProvider, VerificationAthleteProvider {
  async searchByName(name: string) {
    await ensureDemoData();

    const keyword = name.trim();
    const candidates = await prisma.athlete.findMany({
      where: {
        name: { contains: keyword }
      }
    });

    const normalized = normalizeName(keyword);
    const exact = candidates.filter((item) => normalizeName(item.name) === normalized);

    if (exact.length > 0) {
      return buildMockResponse(sortAthletesByPriority(exact));
    }

    return buildMockResponse(sortAthletesByPriority(candidates).slice(0, 10));
  }

  async exactMatchByName(name: string) {
    await ensureDemoData();

    const normalized = normalizeName(name);
    const athletes = await prisma.athlete.findMany({
      where: {
        name: {
          contains: name.trim()
        }
      }
    });

    return sortAthletesByPriority(
      athletes.filter((item) => normalizeName(item.name) === normalized)
    );
  }
}

function toSearchRecord(athlete: Athlete): AthleteSearchRecord {
  return {
    id: athlete.id,
    name: athlete.name,
    gender: athlete.gender,
    region: athlete.region,
    organization: athlete.organization,
    level: athlete.level,
    certificateNo: athlete.certificateNo,
    awardDate: athlete.certifiedAt ? athlete.certifiedAt.toISOString() : null,
    sport: athlete.sport,
    sourceName: athlete.sourceName,
    sourceUrl: athlete.sourceUrl,
    sourceMode: "mock_demo",
    sourceLabel: "演示样例库",
    sourceNote: "当前结果来自本地演示数据，可用于展示查询、筛查与导出流程。",
    recordStatus: athlete.dataStatus
  };
}

function buildMockResponse(athletes: Athlete[]): AthleteSearchResponse {
  return {
    provider: "mock_demo",
    sourceSummary: "演示数据",
    fallbackUsed: false,
    warningMessage: "",
    hintMessage: athletes.length === 0 ? "当前演示库中没有找到对应姓名的记录。" : "",
    results: athletes.map(toSearchRecord)
  };
}

const mockProvider = new MockAthleteProvider();
const publicRealtimeProvider = new PublicRealtimeAthleteProvider();

export async function searchAthleteByName(name: string) {
  const keyword = name.trim();

  try {
    const realtime = await publicRealtimeProvider.searchByName(keyword);

    if (realtime.results.length > 0) {
      return realtime;
    }

    return realtime;
  } catch (error) {
    const mock = await mockProvider.searchByName(keyword);

    return {
      ...mock,
      fallbackUsed: true,
      warningMessage:
        error instanceof Error
          ? `实时公开接口暂时不可用，当前回退到演示数据。原因：${error.message}`
          : "实时公开接口暂时不可用，当前回退到演示数据。"
    };
  }
}

export async function exactMatchAthleteByName(name: string) {
  return mockProvider.exactMatchByName(name);
}
