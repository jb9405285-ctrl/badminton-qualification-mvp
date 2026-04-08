"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { AlertTriangle, Archive, Search, Trash2 } from "lucide-react";

import { HistorySummaryStrip } from "@/components/dashboard/history-summary-strip";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { formatDate, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type HistoryBatch = {
  id: string;
  originalFileName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  totalRows: number;
  processedRows: number;
  matchedRows: number;
  riskRows: number;
  unresolvedRows: number;
  eventId: string;
  eventName: string;
  eventDate: string;
  organizerName: string;
  operatorName: string;
  athleteNames: string[];
  isArchived: boolean;
  isDeleted: boolean;
  archivedAt: string | null;
  deletedAt: string | null;
};

type LifecycleState = "active" | "archived" | "deleted";
type LifecycleFilter = LifecycleState | "all";

type LocalBatch = HistoryBatch & {
  lifecycle: LifecycleState;
  archivedAt: string | null;
  archivedBy: string | null;
  deletedAt: string | null;
  deletedBy: string | null;
};

const pageSize = 10;

const timeRanges = [
  { label: "全部时间", value: "all" },
  { label: "近 7 天", value: "7" },
  { label: "近 30 天", value: "30" },
  { label: "近 90 天", value: "90" },
  { label: "近 1 年", value: "365" }
];

const riskFilters = [
  { label: "全部风险", value: "all" },
  { label: "高风险批次", value: "risk" },
  { label: "需复核批次", value: "review" },
  { label: "无风险批次", value: "clear" }
];

const lifecycleViews = [
  {
    value: "active",
    label: "正常记录",
    note: "当前仍显示在主列表中的批次"
  },
  {
    value: "archived",
    label: "已归档",
    note: "保留结果，但不作为当前处理批次"
  },
  {
    value: "deleted",
    label: "已删除",
    note: "第一次删除后会移入这里，可继续永久删除"
  },
  {
    value: "all",
    label: "全部记录",
    note: "同时查看正常、归档和已删除批次"
  }
] as const;

const dangerButtonClassName = "border-rose-200 bg-white text-risk hover:bg-rose-50";

function normalize(value: string) {
  return value.replace(/\s+/g, "").toLowerCase().trim();
}

function isWithinRange(value: string, days: number) {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return false;
  }

  return Date.now() - timestamp <= days * 24 * 60 * 60 * 1000;
}

function getRiskState(batch: Pick<LocalBatch, "riskRows" | "unresolvedRows">) {
  if (batch.riskRows > 0) {
    return "risk";
  }

  if (batch.unresolvedRows > 0) {
    return "review";
  }

  return "clear";
}

function getLifecycleLabel(batch: LocalBatch) {
  if (batch.lifecycle === "deleted") {
    return "已删除";
  }

  if (batch.lifecycle === "archived") {
    return "已归档";
  }

  return "正常";
}

function getLifecycleTone(batch: LocalBatch) {
  if (batch.lifecycle === "deleted") {
    return "risk" as const;
  }

  if (batch.lifecycle === "archived") {
    return "warning" as const;
  }

  return "safe" as const;
}

function buildSearchIndex(batch: LocalBatch) {
  return normalize(
    [
      batch.originalFileName,
      batch.eventName,
      batch.organizerName,
      batch.operatorName,
      batch.athleteNames.join(" "),
      batch.status
    ].join(" ")
  );
}

function getLifecycleNote(batch: LocalBatch) {
  if (batch.lifecycle === "deleted") {
    return batch.deletedAt ? `删除于 ${formatDateTime(batch.deletedAt)}` : "已移入已删除列表";
  }

  if (batch.lifecycle === "archived") {
    return batch.archivedAt ? `归档于 ${formatDateTime(batch.archivedAt)}` : "已归档";
  }

  return "正常显示";
}

function toLocalRows(batches: HistoryBatch[]): LocalBatch[] {
  return batches.map((batch) => ({
    ...batch,
    lifecycle: batch.isDeleted ? "deleted" : batch.isArchived ? "archived" : "active",
    archivedAt: batch.archivedAt,
    archivedBy: null,
    deletedAt: batch.deletedAt,
    deletedBy: null
  }));
}

export function HistoryManagementClient({ batches }: { batches: HistoryBatch[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [rows, setRows] = useState<LocalBatch[]>(toLocalRows(batches));
  const [query, setQuery] = useState("");
  const [timeRange, setTimeRange] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [operatorFilter, setOperatorFilter] = useState("all");
  const [lifecycleFilter, setLifecycleFilter] = useState<LifecycleFilter>("active");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const selectAllRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setRows(toLocalRows(batches));
  }, [batches]);

  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [query, timeRange, riskFilter, operatorFilter, lifecycleFilter]);

  const operatorOptions = useMemo(
    () =>
      Array.from(new Set(rows.map((row) => row.operatorName).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [rows]
  );

  const filteredRows = useMemo(() => {
    const keyword = normalize(query);

    return rows.filter((row) => {
      if (lifecycleFilter !== "all" && row.lifecycle !== lifecycleFilter) {
        return false;
      }

      if (timeRange !== "all" && !isWithinRange(row.createdAt, Number(timeRange))) {
        return false;
      }

      const riskState = getRiskState(row);

      if (riskFilter !== "all" && riskState !== riskFilter) {
        return false;
      }

      if (operatorFilter !== "all" && row.operatorName !== operatorFilter) {
        return false;
      }

      if (keyword) {
        return buildSearchIndex(row).includes(keyword);
      }

      return true;
    });
  }, [lifecycleFilter, operatorFilter, query, riskFilter, rows, timeRange]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selectedRows = useMemo(
    () => rows.filter((row) => selectedIds.includes(row.id)),
    [rows, selectedIds]
  );

  const selectedCount = selectedIds.length;
  const currentPageIds = pagedRows.map((row) => row.id);
  const selectedOnPage = pagedRows.filter((row) => selectedIds.includes(row.id)).length;
  const allVisibleSelected = pagedRows.length > 0 && selectedOnPage === pagedRows.length;
  const someVisibleSelected = selectedOnPage > 0 && !allVisibleSelected;
  const riskBatchCount = filteredRows.filter((row) => row.riskRows > 0).length;
  const reviewBatchCount = filteredRows.filter((row) => row.unresolvedRows > 0).length;
  const activeCount = rows.filter((row) => row.lifecycle === "active").length;
  const archivedCount = rows.filter((row) => row.lifecycle === "archived").length;
  const deletedCount = rows.filter((row) => row.lifecycle === "deleted").length;
  const selectedRiskBatchCount = selectedRows.filter((row) => row.riskRows > 0).length;
  const selectedReviewBatchCount = selectedRows.filter((row) => row.unresolvedRows > 0).length;
  const archivableSelectedCount = selectedRows.filter((row) => row.lifecycle === "active").length;
  const deletableSelectedCount = selectedRows.filter((row) => row.lifecycle !== "deleted").length;
  const permanentlyDeletableSelectedCount = selectedRows.filter((row) => row.lifecycle === "deleted").length;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someVisibleSelected;
    }
  }, [someVisibleSelected]);

  useEffect(() => {
    if (currentPage !== page) {
      setPage(currentPage);
    }
  }, [currentPage, page]);

  function applyLifecycleUpdate(ids: string[], nextLifecycle: LifecycleState) {
    setRows((current) => {
      return current.map((row) =>
        ids.includes(row.id)
          ? {
              ...row,
              lifecycle: nextLifecycle,
              archivedAt: nextLifecycle === "archived" ? new Date().toISOString() : row.archivedAt,
              archivedBy: "当前登录用户",
              deletedAt: nextLifecycle === "deleted" ? new Date().toISOString() : row.deletedAt,
              deletedBy: nextLifecycle === "deleted" ? "当前登录用户" : row.deletedBy
            }
          : row
      );
    });
  }

  async function syncSelection(ids: string[], nextLifecycle: LifecycleState) {
    const selectedBatchRows = rows.filter((row) => ids.includes(row.id)).filter((row) => {
      if (nextLifecycle === "archived") {
        return row.lifecycle === "active";
      }

      if (nextLifecycle === "deleted") {
        return row.lifecycle !== "deleted";
      }

      return true;
    });
    const action = nextLifecycle === "deleted" ? "delete" : "archive";
    const actionLabel = nextLifecycle === "deleted" ? "删除" : "归档";

    if (selectedBatchRows.length === 0) {
      return;
    }

    const hasRiskRows = selectedBatchRows.some((row) => row.riskRows > 0);
    const firstConfirm = window.confirm(`确定要${actionLabel}选中的 ${selectedBatchRows.length} 个上传批次吗？`);

    if (!firstConfirm) {
      return;
    }

    if (nextLifecycle === "deleted" && hasRiskRows) {
      const secondConfirm = window.confirm(
        "已选项中包含高风险批次。删除后这些批次会从前台主列表隐藏，请再次确认。"
      );

      if (!secondConfirm) {
        return;
      }
    }

    setIsBusy(true);

    const payload = {
      ids,
      action,
      confirmRiskDelete: nextLifecycle === "deleted" ? false : undefined,
      reason: nextLifecycle === "deleted" ? "前端批量删除上传批次" : "前端批量归档上传批次"
    };

    try {
      const response = await fetch("/api/history/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const contentType = response.headers.get("content-type") ?? "";
      const responseBody = contentType.includes("application/json")
        ? await response.json().catch(() => null)
        : null;

      if (
        !response.ok ||
        responseBody?.ok === false ||
        responseBody?.code === "HISTORY_DELETE_CONFIRMATION_REQUIRED"
      ) {
        if (nextLifecycle === "deleted" && responseBody?.code === "HISTORY_DELETE_CONFIRMATION_REQUIRED") {
          const secondConfirm = window.confirm(
            "后端要求再次确认：已选项包含高风险批次。是否继续删除并执行软删除？"
          );

          if (secondConfirm) {
            const retryResponse = await fetch("/api/history/bulk", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                ...payload,
                confirmRiskDelete: true
              })
            });
            const retryContentType = retryResponse.headers.get("content-type") ?? "";
            const retryBody = retryContentType.includes("application/json")
              ? await retryResponse.json().catch(() => null)
              : null;

            if (retryResponse.ok && retryBody?.ok !== false) {
              applyLifecycleUpdate(ids, nextLifecycle);
              setSelectedIds([]);
              toast({
                title: "删除成功",
                description: `已删除 ${selectedBatchRows.length} 个上传批次。`,
                tone: "success"
              });
              router.refresh();
              return;
            }
          }
        }

        throw new Error(responseBody?.message || "批量操作暂时失败，请稍后再试。");
      }

      applyLifecycleUpdate(ids, nextLifecycle);
      setSelectedIds([]);
      toast({
        title: `${actionLabel}成功`,
        description: `已${actionLabel} ${selectedBatchRows.length} 个上传批次。`,
        tone: "success"
      });
      router.refresh();
    } catch (error) {
      setSelectedIds([]);
      toast({
        title: `${actionLabel}失败`,
        description: error instanceof Error ? error.message : `${actionLabel}失败，请稍后再试。`,
        tone: "error"
      });
    } finally {
      setIsBusy(false);
    }
  }

  async function permanentlyDeleteRow(row: LocalBatch) {
    const confirmed = window.confirm(
      `确定要永久删除“${row.originalFileName}”吗？此操作不可撤销。`
    );

    if (!confirmed) {
      return;
    }

    setIsBusy(true);

    try {
      const response = await fetch(`/api/history/${row.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          permanent: true,
          reason: "前端永久删除已删除上传批次"
        })
      });

      const contentType = response.headers.get("content-type") ?? "";
      const responseBody = contentType.includes("application/json")
        ? await response.json().catch(() => null)
        : null;

      if (!response.ok || responseBody?.ok === false) {
        throw new Error(responseBody?.message || "永久删除失败，请稍后再试。");
      }

      setRows((current) => current.filter((item) => item.id !== row.id));
      setSelectedIds((current) => current.filter((item) => item !== row.id));
      toast({
        title: "永久删除成功",
        description: "该上传批次已被彻底移除。",
        tone: "success"
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "永久删除失败",
        description: error instanceof Error ? error.message : "永久删除失败，请稍后再试。",
        tone: "error"
      });
    } finally {
      setIsBusy(false);
    }
  }

  function toggleRow(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  function toggleCurrentPageSelection() {
    if (allVisibleSelected) {
      setSelectedIds((current) => current.filter((id) => !currentPageIds.includes(id)));
      return;
    }

    setSelectedIds((current) => Array.from(new Set([...current, ...currentPageIds])));
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        title="暂无上传批次"
        description="上传后的批次会显示在这里。"
      />
    );
  }

  return (
    <div className="grid gap-6">
      <HistorySummaryStrip
        description="按上传批次查看正常记录、已归档和已删除记录。"
        eyebrow="批次留痕"
        items={[
          {
            label: "正常记录",
            value: activeCount,
            note: "当前仍显示在主列表中的批次",
            tone: "default"
          },
          {
            label: "已归档",
            value: archivedCount,
            note: "保留结果但不作为当前处理批次",
            tone: archivedCount > 0 ? "warning" : "default"
          },
          {
            label: "已删除",
            value: deletedCount,
            note: "第一次删除后会移入这里",
            tone: deletedCount > 0 ? "risk" : "default"
          },
          {
            label: "当前筛选",
            value: filteredRows.length,
            note: "符合当前筛选条件的批次",
            tone: selectedCount > 0 ? "safe" : "default"
          }
        ]}
        scopeNote="上传批次留痕"
        title="批次留痕"
      />

      {deletedCount > 0 && lifecycleFilter !== "deleted" ? (
        <Card className="border-rose-200 bg-rose-50/80 shadow-none">
          <CardContent className="flex flex-col gap-4 pt-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-1 h-4 w-4 text-risk" />
              <div>
                <p className="text-sm font-semibold text-slate-950">已删除记录在单独视图里展示</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  当前有 <span className="font-semibold text-risk">{deletedCount}</span> 个已删除批次，不会出现在“正常记录”视图中。
                </p>
              </div>
            </div>
            <Button
              className={dangerButtonClassName}
              onClick={() => setLifecycleFilter("deleted")}
              variant="outline"
            >
              查看已删除记录
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-3">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-500">记录视图</p>
          <p className="text-sm text-slate-600">这里切换的是记录视图，不是筛选条件。</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {lifecycleViews.map((item) => {
            const count =
              item.value === "active"
                ? activeCount
                : item.value === "archived"
                  ? archivedCount
                  : item.value === "deleted"
                    ? deletedCount
                    : rows.length;
          const isActive = lifecycleFilter === item.value;

          return (
            <button
              className={cn(
                "rounded-[24px] border px-5 py-4 text-left transition",
                isActive
                  ? item.value === "deleted"
                    ? "border-rose-700 bg-rose-700 text-white shadow-soft"
                    : item.value === "archived"
                      ? "border-amber-500 bg-amber-500 text-white shadow-soft"
                      : "border-slate-900 bg-slate-900 text-white shadow-soft"
                  : item.value === "deleted"
                    ? "border-rose-200 bg-rose-50 text-rose-950 hover:border-rose-300 hover:shadow-soft"
                    : item.value === "archived"
                      ? "border-amber-200 bg-amber-50 text-amber-950 hover:border-amber-300 hover:shadow-soft"
                      : "border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:shadow-soft"
              )}
              key={item.value}
              onClick={() => setLifecycleFilter(item.value)}
              type="button"
            >
              <p
                className={cn(
                  "text-sm font-medium",
                  isActive
                    ? "text-white/90"
                    : item.value === "deleted"
                      ? "text-rose-700"
                      : item.value === "archived"
                        ? "text-amber-700"
                        : "text-slate-600"
                )}
              >
                {item.label}
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">{count}</p>
              <p className={cn("mt-2 text-sm leading-6", isActive ? "text-white/80" : "text-slate-500")}>{item.note}</p>
            </button>
          );
        })}
      </div>
      </div>

      <Card className="dashboard-panel border-white/80">
        <CardHeader className="pb-3">
          <CardTitle>筛选</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
          <div className="dashboard-inset space-y-2 p-3 xl:col-span-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="history-search">
              搜索
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-10"
                id="history-search"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索姓名、赛事、文件、操作人"
                value={query}
              />
            </div>
          </div>
          <div className="dashboard-inset space-y-2 p-3">
            <label className="text-sm font-medium text-slate-700" htmlFor="history-time">
              时间范围
            </label>
            <Select id="history-time" onChange={(event) => setTimeRange(event.target.value)} value={timeRange}>
              {timeRanges.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="dashboard-inset space-y-2 p-3">
            <label className="text-sm font-medium text-slate-700" htmlFor="history-risk">
              风险状态
            </label>
            <Select id="history-risk" onChange={(event) => setRiskFilter(event.target.value)} value={riskFilter}>
              {riskFilters.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="dashboard-inset space-y-2 p-3">
            <label className="text-sm font-medium text-slate-700" htmlFor="history-operator">
              操作人
            </label>
            <Select
              id="history-operator"
              onChange={(event) => setOperatorFilter(event.target.value)}
              value={operatorFilter}
            >
              <option value="all">全部操作人</option>
              {operatorOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {riskBatchCount > 0 ? (
        <Card className="border-warning/30 bg-warning/5 shadow-none">
          <CardContent className="flex items-start gap-3 pt-4 text-sm leading-6 text-slate-700">
            <AlertTriangle className="mt-1 h-4 w-4 text-warning" />
            <p>
              当前筛选结果包含 <span className="font-semibold text-risk">{riskBatchCount}</span> 个高风险批次。
            </p>
          </CardContent>
        </Card>
      ) : null}

      {selectedCount > 0 ? (
        <Card className={cn("border-slate-200 bg-slate-50/80 shadow-none", selectedRiskBatchCount > 0 && "border-rose-200 bg-rose-50/80")}>
          <CardContent className="flex items-start gap-3 pt-4 text-sm leading-6 text-slate-700">
            <AlertTriangle className={cn("mt-1 h-4 w-4 text-slate-500", selectedRiskBatchCount > 0 && "text-risk")} />
            <p>
              已选 <span className="font-semibold text-slate-950">{selectedCount}</span> 个批次，
              其中高风险 <span className="font-semibold text-risk">{selectedRiskBatchCount}</span> 个，待复核
              <span className="font-semibold text-warning"> {selectedReviewBatchCount} </span> 个。
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card className="dashboard-panel border-white/80">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>批量操作</CardTitle>
              <CardDescription>
                {lifecycleFilter === "deleted" ? "已删除记录请逐条永久删除。" : "仅作用于当前已选批次。"}
              </CardDescription>
            </div>
            {lifecycleFilter !== "deleted" ? (
              <div className="flex flex-wrap gap-3">
                <Button
                  disabled={archivableSelectedCount === 0 || isBusy}
                  onClick={() => void syncSelection(selectedIds, "archived")}
                  variant="outline"
                >
                  <Archive className="mr-2 h-4 w-4" />
                  归档
                </Button>
                <Button
                  className={dangerButtonClassName}
                  disabled={deletableSelectedCount === 0 || isBusy}
                  onClick={() => void syncSelection(selectedIds, "deleted")}
                  variant="outline"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  删除
                </Button>
              </div>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 text-sm text-slate-600">
            <span className="font-medium text-slate-900">已选 {selectedCount} 个</span>
            {selectedCount > 0 ? (
              <>
                <span>高风险 {selectedRiskBatchCount}</span>
                <span>待复核 {selectedReviewBatchCount}</span>
                {lifecycleFilter === "deleted" ? (
                  <span>可永久删除 {permanentlyDeletableSelectedCount}</span>
                ) : (
                  <>
                    <span>可归档 {archivableSelectedCount}</span>
                    <span>可删除 {deletableSelectedCount}</span>
                  </>
                )}
              </>
            ) : null}
            {selectedCount > 0 ? (
              <Button disabled={isBusy} onClick={() => setSelectedIds([])} size="sm" variant="ghost">
                清空选择
              </Button>
            ) : null}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    aria-label="选择当前页"
                    checked={allVisibleSelected}
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                    onChange={toggleCurrentPageSelection}
                    ref={selectAllRef}
                    type="checkbox"
                  />
                </TableHead>
                <TableHead>上传批次 / 赛事</TableHead>
                <TableHead>操作人</TableHead>
                <TableHead>结果摘要</TableHead>
                <TableHead>上传时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedRows.map((row) => {
                const isSelected = selectedIds.includes(row.id);
                const riskState = getRiskState(row);

                return (
                  <TableRow
                    className={cn(
                      isSelected && "bg-primary/5",
                      row.lifecycle === "deleted" && "bg-rose-50/50",
                      row.lifecycle === "archived" && "bg-amber-50/40"
                    )}
                    key={row.id}
                  >
                    <TableCell>
                      <input
                        aria-label={`选择 ${row.originalFileName}`}
                        checked={isSelected}
                        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                        onChange={() => toggleRow(row.id)}
                        type="checkbox"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div>
                          <p className="font-medium text-slate-950">{row.originalFileName}</p>
                          <p className="text-xs text-muted-foreground">
                            {row.eventName} · {row.organizerName}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {row.riskRows > 0 ? <Badge tone="risk">高风险批次</Badge> : null}
                          {row.unresolvedRows > 0 ? <Badge tone="warning">待复核</Badge> : null}
                          {row.lifecycle !== "active" ? (
                            <Badge tone={getLifecycleTone(row)}>{getLifecycleLabel(row)}</Badge>
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {getLifecycleNote(row)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-950">{row.operatorName}</p>
                        <p className="text-xs text-muted-foreground">赛事日期：{formatDate(row.eventDate)}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <p className={cn("font-medium", riskState === "risk" ? "text-risk" : "text-slate-700")}>
                          高风险：{row.riskRows}
                        </p>
                        <p className="text-slate-700">待复核：{row.unresolvedRows}</p>
                        <p className="text-xs text-muted-foreground">
                          已核验：{row.processedRows}/{row.totalRows}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <StatusBadge status={row.status} />
                        <p className="text-xs text-muted-foreground">上传于 {formatDateTime(row.createdAt)}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Link
                          className="inline-flex h-9 items-center justify-center rounded-2xl border border-slate-200/90 bg-white/88 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                          href={`/dashboard/events/${row.eventId}?batchId=${row.id}`}
                        >
                          查看核验结果
                        </Link>
                        <Button
                          disabled={isBusy || row.lifecycle !== "active"}
                          onClick={() => void syncSelection([row.id], "archived")}
                          size="sm"
                          variant="outline"
                        >
                          归档
                        </Button>
                        {row.lifecycle === "deleted" ? (
                          <Button
                            className={cn(dangerButtonClassName, "opacity-90")}
                            disabled={isBusy}
                            onClick={() => void permanentlyDeleteRow(row)}
                            size="sm"
                            variant="outline"
                          >
                            永久删除
                          </Button>
                        ) : (
                          <Button
                            className={cn(dangerButtonClassName, "opacity-80")}
                            disabled={isBusy}
                            onClick={() => void syncSelection([row.id], "deleted")}
                            size="sm"
                            variant="outline"
                          >
                            删除
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredRows.length === 0 ? (
            <EmptyState
              title="没有匹配记录"
              description="切换记录状态或调整筛选条件。"
            />
          ) : (
            <PaginationControls currentPage={currentPage} onPageChange={setPage} totalPages={totalPages} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
