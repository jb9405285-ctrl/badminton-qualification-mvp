"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import { AlertTriangle, ArrowUpRight, BadgeInfo, Clock3, IdCard, Search } from "lucide-react";

import { DisclaimerCard } from "@/components/search/disclaimer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { formatDateTime } from "@/lib/format";

type SearchRecord = {
  id: string;
  name: string;
  gender: string | null;
  region: string | null;
  organization: string | null;
  level: string;
  certificateNo: string | null;
  awardDate: string | null;
  sport: string | null;
  sourceName: string;
  sourceUrl: string | null;
  sourceMode: "public_realtime" | "mock_demo";
  sourceLabel: string;
  sourceNote: string;
  recordStatus: string;
  queryTime: string;
  isRisk: boolean;
};

export function PublicSearchClient({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchRecord[]>([]);
  const [error, setError] = useState("");
  const [warningMessage, setWarningMessage] = useState("");
  const [hintMessage, setHintMessage] = useState("");
  const [sourceSummary, setSourceSummary] = useState("");
  const [searched, setSearched] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function runSearch(nextQuery: string) {
    const name = nextQuery.trim();

    if (!name) {
      setError("请输入运动员姓名。");
      setResults([]);
      setWarningMessage("");
      setHintMessage("");
      setSourceSummary("");
      setSearched(false);
      return;
    }

    setError("");
    setWarningMessage("");
    setHintMessage("");
    setSearched(true);

    try {
      const response = await fetch(`/api/search?name=${encodeURIComponent(name)}`, {
        method: "GET"
      });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "查询失败，请稍后再试。");
      }

      setSourceSummary(payload.sourceSummary ?? "");
      setWarningMessage(payload.warningMessage ?? "");
      setHintMessage(payload.hintMessage ?? "");
      setResults(payload.results);
    } catch (searchError) {
      setResults([]);
      setWarningMessage("");
      setHintMessage("");
      setSourceSummary("");
      setError(searchError instanceof Error ? searchError.message : "查询失败，请稍后再试。");
    }
  }

  useEffect(() => {
    if (initialQuery) {
      startTransition(() => {
        void runSearch(initialQuery);
      });
    }
  }, [initialQuery]);

  const resultContent = useMemo(() => {
    if (!searched && !isPending) {
      return (
        <EmptyState
          title="等待查询"
          description="输入姓名后，可查看等级、来源和查询时间。"
        />
      );
    }

    if (isPending) {
      return (
        <EmptyState
          title="正在查询"
          description={`正在检索“${query || initialQuery}”，优先请求实时接口。`}
        />
      );
    }

    if (error) {
      return <EmptyState title="查询失败" description={error} />;
    }

    if (results.length === 0) {
      return (
        <EmptyState
          title="未查询到相关记录"
          description={hintMessage || "当前没有查到对应的羽毛球等级记录。"}
        />
      );
    }

    return (
      <div className="grid gap-4">
        {results.map((record) => (
          <Card
            key={record.id}
            className={record.isRisk ? "border-risk/30 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(254,242,242,0.94))]" : "bg-white/92"}
          >
            <CardHeader className="gap-4 border-b border-slate-100/90 pb-5">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-2xl">{record.name}</CardTitle>
                  <Badge tone={record.isRisk ? "risk" : "safe"}>{record.level}</Badge>
                </div>
                <CardDescription className="text-sm">
                  {record.gender ?? "性别未标注"} · {record.region ?? "地区未标注"} ·{" "}
                  {record.organization ?? "单位未标注"}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 pt-6 text-sm leading-6 text-slate-700 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">数据来源</p>
                  <p className="mt-2">{record.sourceName}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">查询时间</p>
                  <p className="mt-2 flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-slate-400" />
                    {formatDateTime(record.queryTime)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">证书编号</p>
                  <p className="mt-2 flex items-center gap-2">
                    <IdCard className="h-4 w-4 text-slate-400" />
                    {record.certificateNo || "未公开"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">授予时间</p>
                  <p className="mt-2">{record.awardDate ? formatDateTime(record.awardDate) : "未返回"}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">结论</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge tone="muted">{record.sport || "羽毛球"}</Badge>
                    <Badge tone={record.isRisk ? "risk" : "safe"}>
                      {record.isRisk ? "存在风险" : "当前未识别风险"}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {record.isRisk ? "该记录属于二级及以上等级。" : "当前未显示二级及以上等级。"}
                  </p>
                </div>
                {record.sourceUrl ? (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">来源链接</p>
                    <a
                      className="mt-3 inline-flex items-center gap-2 text-primary hover:underline"
                      href={record.sourceUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      查看来源说明
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }, [error, hintMessage, initialQuery, isPending, query, results, searched]);

  return (
    <div className="grid gap-6">
      <Card className="metric-ink border-slate-200/80 shadow-panel">
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="default">实时公开接口优先</Badge>
            <Badge tone="muted">{sourceSummary || "等待查询"}</Badge>
          </div>
          <CardTitle>公众免费查询</CardTitle>
          <CardDescription>输入姓名即可查询。实时接口优先，异常时切换本地数据源。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              onChange={(event) => setQuery(event.target.value)}
              placeholder="请输入运动员姓名"
              value={query}
            />
            <Button
              className="min-w-[140px]"
              disabled={isPending}
              onClick={() => startTransition(() => void runSearch(query))}
            >
              <Search className="mr-2 h-4 w-4" />
              {isPending ? "查询中..." : "立即查询"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            未命中不代表没有等级记录。
          </p>
        </CardContent>
      </Card>
      {warningMessage ? (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="flex items-start gap-3 pt-6 text-sm leading-6 text-slate-700">
            <AlertTriangle className="mt-1 h-4 w-4 text-warning" />
            <p>{warningMessage}</p>
          </CardContent>
        </Card>
      ) : null}
      {hintMessage && results.length > 0 ? (
        <Card className="border-slate-200 bg-white/90">
          <CardContent className="flex items-start gap-3 pt-6 text-sm leading-6 text-slate-700">
            <BadgeInfo className="mt-1 h-4 w-4 text-primary" />
            <p>{hintMessage}</p>
          </CardContent>
        </Card>
      ) : null}
      {resultContent}
      <DisclaimerCard />
    </div>
  );
}
