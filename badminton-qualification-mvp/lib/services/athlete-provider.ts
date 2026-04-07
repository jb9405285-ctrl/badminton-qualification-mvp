import type { Athlete } from "@prisma/client";

import { ensureDemoData } from "@/lib/data/bootstrap";
import { normalizeName, sortAthletesByPriority } from "@/lib/eligibility";
import { prisma } from "@/lib/prisma";
import { PublicRealtimeAthleteProvider } from "@/lib/services/public-realtime-provider";
import type { AthleteSearchRecord, AthleteSearchResponse } from "@/lib/types";

type SearchOptions = {
  includeHint?: boolean;
};

export interface SearchAthleteProvider {
  searchByName(name: string, options?: SearchOptions): Promise<AthleteSearchResponse>;
}

export interface VerificationAthleteProvider {
  exactMatchByName(name: string): Promise<Athlete[]>;
}

class MockAthleteProvider implements SearchAthleteProvider, VerificationAthleteProvider {
  async searchByName(name: string, options?: SearchOptions) {
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
      return buildMockResponse(sortAthletesByPriority(exact), options);
    }

    return buildMockResponse(sortAthletesByPriority(candidates).slice(0, 10), options);
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
    sourceLabel: "本地数据源",
    sourceNote: "来自本地补充数据源，请结合赛事规则人工复核。",
    recordStatus: athlete.dataStatus
  };
}

function buildMockResponse(athletes: Athlete[], options?: SearchOptions): AthleteSearchResponse {
  const includeHint = options?.includeHint ?? true;

  return {
    provider: "mock_demo",
    sourceSummary: "本地数据源",
    fallbackUsed: false,
    warningMessage: "",
    hintMessage: includeHint && athletes.length === 0 ? "当前本地数据源中没有找到对应姓名的记录。" : "",
    results: athletes.map(toSearchRecord)
  };
}

const mockProvider = new MockAthleteProvider();
const publicRealtimeProvider = new PublicRealtimeAthleteProvider();

export async function searchAthleteByName(name: string, options?: SearchOptions) {
  const keyword = name.trim();

  try {
    const realtime = await publicRealtimeProvider.searchByName(keyword, options);

    if (realtime.results.length > 0) {
      return realtime;
    }

    return realtime;
  } catch (error) {
    const mock = await mockProvider.searchByName(keyword, options);

    return {
      ...mock,
      fallbackUsed: true,
      warningMessage:
        error instanceof Error
          ? `实时接口暂时不可用，已切换到本地数据源。原因：${error.message}`
          : "实时接口暂时不可用，已切换到本地数据源。"
    };
  }
}

export async function exactMatchAthleteByName(name: string) {
  return mockProvider.exactMatchByName(name);
}
