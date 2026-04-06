import { normalizeName } from "@/lib/eligibility";
import type { AthleteSearchRecord, AthleteSearchResponse } from "@/lib/types";

const BADMINTON_ITEM_CODE = "36.1";
const UPSTREAM_SEARCH_URL = "https://www.univsport.com/index.php?m=api&c=rank&a=search";
const UPSTREAM_DETAIL_URL = "https://www.univsport.com/index.php?m=api&c=rank&a=rank_detail";
const UPSTREAM_REFERER = "https://www.univsport.com/html/ydy_search.html?show_tb=Y";
const CACHE_TTL_MS = 5 * 60 * 1000;

type SearchListItem = {
  athletes_info_id?: string;
  athlete_number?: string;
  athlete_realname?: string;
  audit_danwei?: string;
  sex?: string;
  rank?: string;
  item?: string;
};

type DetailPayload = {
  audit_danwei_time?: string;
};

const responseCache = new Map<string, { expiresAt: number; payload: AthleteSearchResponse }>();

function getCacheKey(name: string) {
  return normalizeName(name);
}

function buildHeaders() {
  return {
    "User-Agent": "Mozilla/5.0",
    Accept: "application/json,text/plain,*/*",
    Referer: UPSTREAM_REFERER
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: buildHeaders(),
    cache: "no-store",
    signal: AbortSignal.timeout(12_000)
  });

  if (!response.ok) {
    throw new Error(`上游查询返回 HTTP ${response.status}`);
  }

  return (await response.json()) as T;
}

async function fetchSearchList(name: string, itemCode = BADMINTON_ITEM_CODE) {
  const searchParams = new URLSearchParams({
    page: "1",
    page_size: "20",
    number: "",
    name,
    rank: "",
    dict_value: "",
    danwei: "",
    nation_danwei: "",
    item: itemCode,
    starttime: "",
    endtime: "",
    type: ""
  });

  const payload = await fetchJson<{
    error?: number;
    message?: string;
    data?: {
      total?: string;
      list_data?: SearchListItem[];
    };
  }>(`${UPSTREAM_SEARCH_URL}&${searchParams.toString()}`);

  if (payload.error !== 0) {
    throw new Error(payload.message || "上游公开查询服务返回异常。");
  }

  return {
    total: payload.data?.total ?? "0",
    list: payload.data?.list_data ?? []
  };
}

async function fetchDetail(detailId: string) {
  const searchParams = new URLSearchParams({
    athletes_info_id: detailId
  });

  const payload = await fetchJson<{
    data?: {
      data?: DetailPayload;
    };
  }>(`${UPSTREAM_DETAIL_URL}&${searchParams.toString()}`);

  return payload.data?.data ?? {};
}

async function buildHintMessage(name: string) {
  try {
    const fallback = await fetchSearchList(name, "");
    const otherItems = Array.from(
      new Set(fallback.list.map((item) => item.item).filter((item): item is string => Boolean(item)))
    );

    if (otherItems.length > 0) {
      const preview = otherItems.slice(0, 3).join("、");
      const suffix = otherItems.length > 3 ? "等" : "";

      return `公开接口当前没有返回“${name}”的羽毛球记录，但查到了同名其他项目记录，涉及 ${preview}${suffix}。`;
    }
  } catch {
    return `公开接口当前没有返回“${name}”的羽毛球记录。`;
  }

  return `公开接口当前没有返回“${name}”的羽毛球记录。`;
}

export class PublicRealtimeAthleteProvider {
  async searchByName(name: string): Promise<AthleteSearchResponse> {
    const keyword = name.trim();
    const cacheKey = getCacheKey(keyword);
    const now = Date.now();
    const cached = responseCache.get(cacheKey);

    if (cached && cached.expiresAt > now) {
      return cached.payload;
    }

    const searchResult = await fetchSearchList(keyword);
    const detailIds = searchResult.list
      .map((item) => item.athletes_info_id)
      .filter((item): item is string => Boolean(item));

    const detailEntries = await Promise.all(
      detailIds.map(async (detailId) => {
        try {
          const detail = await fetchDetail(detailId);
          return [detailId, detail] as const;
        } catch {
          return [detailId, {}] as const;
        }
      })
    );

    const detailMap = new Map<string, DetailPayload>(detailEntries);
    const results: AthleteSearchRecord[] = searchResult.list
      .filter((item) => normalizeName(item.athlete_realname ?? "") === normalizeName(keyword))
      .map((item, index) => {
        const detail = item.athletes_info_id ? detailMap.get(item.athletes_info_id) : undefined;

        return {
          id: item.athletes_info_id || `${normalizeName(keyword)}-${index}`,
          name: item.athlete_realname ?? keyword,
          gender: item.sex ?? null,
          region: null,
          organization: item.audit_danwei ?? null,
          level: item.rank ?? "未返回",
          certificateNo: item.athlete_number ?? null,
          awardDate: detail?.audit_danwei_time ?? null,
          sport: item.item ?? "羽毛球",
          sourceName: "体教联盟运动员技术等级查询",
          sourceUrl: UPSTREAM_REFERER,
          sourceMode: "public_realtime",
          sourceLabel: "实时公开接口",
          sourceNote: "当前结果来自公开接口实时查询，并自动限定为羽毛球项目。",
          recordStatus: "实时查询"
        };
      })
      .sort((a, b) => {
        const aStamp = a.awardDate ? new Date(a.awardDate).getTime() : 0;
        const bStamp = b.awardDate ? new Date(b.awardDate).getTime() : 0;

        if (aStamp !== bStamp) {
          return bStamp - aStamp;
        }

        return (b.certificateNo ?? "").localeCompare(a.certificateNo ?? "");
      });

    const payload: AthleteSearchResponse = {
      provider: "public_realtime",
      sourceSummary: "实时公开查询优先",
      fallbackUsed: false,
      warningMessage: "",
      hintMessage: results.length === 0 ? await buildHintMessage(keyword) : "",
      results
    };

    responseCache.set(cacheKey, {
      expiresAt: now + CACHE_TTL_MS,
      payload
    });

    return payload;
  }
}
