"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { formatDate } from "@/lib/format";

type EventOption = {
  id: string;
  name: string;
  organizerName: string;
};

type RecentBatch = {
  id: string;
  originalFileName: string;
  status: string;
  createdAt: string;
  riskRows: number;
  eventId: string;
  eventName: string;
};

type PreviewRow = Record<string, string>;

export function BatchCheckClient({
  events,
  recentBatches,
  preselectedEventId
}: {
  events: EventOption[];
  recentBatches: RecentBatch[];
  preselectedEventId?: string;
}) {
  const router = useRouter();
  const [eventId, setEventId] = useState(preselectedEventId ?? events[0]?.id ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingMapping, setPendingMapping] = useState<{
    batchId: string;
    columns: string[];
    previewRows: PreviewRow[];
    eventId: string;
    nameColumn: string;
  } | null>(null);

  const selectedEvent = useMemo(
    () => events.find((item) => item.id === eventId) ?? null,
    [eventId, events]
  );

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!eventId) {
      setError("请先选择要核验的赛事。");
      return;
    }

    if (!file) {
      setError("请先选择名单文件。");
      return;
    }

    setLoading(true);
    setError("");
    setStatusText("正在上传文件并解析名单字段...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("eventId", eventId);

      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData
      });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "上传失败。");
      }

      if (payload.needsMapping) {
        setPendingMapping({
          batchId: payload.batchId,
          columns: payload.columns,
          previewRows: payload.previewRows,
          eventId: payload.eventId,
          nameColumn: payload.columns[0]
        });
        setStatusText("未识别到标准“姓名”列，请手动指定姓名列。");
        return;
      }

      setPendingMapping(null);
      setStatusText("名单已完成批量核验，正在跳转到赛事详情页...");
      router.push(`/dashboard/events/${payload.eventId}?batchId=${payload.batchId}`);
      router.refresh();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "上传失败。");
      setStatusText("");
    } finally {
      setLoading(false);
    }
  }

  async function confirmNameColumn() {
    if (!pendingMapping) {
      return;
    }

    setLoading(true);
    setError("");
    setStatusText("正在根据选择的姓名列执行批量核验...");

    try {
      const response = await fetch("/api/uploads/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          batchId: pendingMapping.batchId,
          eventId: pendingMapping.eventId,
          nameColumn: pendingMapping.nameColumn
        })
      });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "姓名列确认失败。");
      }

      router.push(`/dashboard/events/${pendingMapping.eventId}?batchId=${pendingMapping.batchId}`);
      router.refresh();
    } catch (confirmError) {
      setError(confirmError instanceof Error ? confirmError.message : "姓名列确认失败。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <Card className="dashboard-panel border-white/80">
        <CardHeader className="pb-4">
          <CardTitle>批量核验工作台</CardTitle>
          <CardDescription>
            选择赛事后上传 `.xlsx / .xls / .csv` 名单文件，系统会自动识别姓名列并逐个筛查。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleUpload}>
            <div className="dashboard-inset space-y-2 p-4">
              <Label htmlFor="event">赛事</Label>
              <Select id="event" onChange={(event) => setEventId(event.target.value)} value={eventId}>
                <option value="">请选择赛事</option>
                {events.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} / {item.organizerName}
                  </option>
                ))}
              </Select>
            </div>
            <div className="dashboard-inset space-y-2 p-4">
              <Label htmlFor="file">名单文件</Label>
              <Input
                accept=".xlsx,.xls,.csv"
                id="file"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                type="file"
              />
            </div>
            {selectedEvent ? (
              <div className="dashboard-inset p-4 md:col-span-2">
                <p className="text-sm text-muted-foreground">当前将名单核验到赛事：{selectedEvent.name}</p>
              </div>
            ) : null}
            {(statusText || error) ? (
              <div className="dashboard-inset p-4 md:col-span-2">
                {statusText ? <p className="text-sm text-primary">{statusText}</p> : null}
                {error ? <p className="text-sm text-risk">{error}</p> : null}
              </div>
            ) : null}
            <div className="md:col-span-2">
              <Button disabled={loading || events.length === 0} type="submit">
                {loading ? "处理中..." : "上传并开始核验"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {pendingMapping ? (
        <Card className="dashboard-panel border-warning/30 bg-warning/5">
          <CardHeader className="pb-4">
            <CardTitle>请选择姓名列</CardTitle>
            <CardDescription>
              系统未自动识别标准姓名列，请从下方列名中选择哪一列代表参赛选手姓名。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="dashboard-inset max-w-sm space-y-2 p-4">
              <Label htmlFor="name-column">姓名列</Label>
              <Select
                id="name-column"
                onChange={(event) =>
                  setPendingMapping((current) =>
                    current ? { ...current, nameColumn: event.target.value } : current
                  )
                }
                value={pendingMapping.nameColumn}
              >
                {pendingMapping.columns.map((column) => (
                  <option key={column} value={column}>
                    {column}
                  </option>
                ))}
              </Select>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  {pendingMapping.columns.map((column) => (
                    <TableHead key={column}>{column}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingMapping.previewRows.map((row, index) => (
                  <TableRow key={`${index}-${row[pendingMapping.columns[0]] ?? "row"}`}>
                    {pendingMapping.columns.map((column) => (
                      <TableCell key={column}>{row[column] || "--"}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Button disabled={loading} onClick={() => void confirmNameColumn()}>
              {loading ? "核验中..." : "确认姓名列并继续"}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {recentBatches.length > 0 ? (
        <Card className="dashboard-panel border-white/80">
          <CardHeader className="pb-4">
            <CardTitle>最近批次</CardTitle>
            <CardDescription>可以快速回到最近处理过的名单批次与赛事详情页。</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>文件</TableHead>
                  <TableHead>所属赛事</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>风险人数</TableHead>
                  <TableHead>上传时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentBatches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell>{batch.originalFileName}</TableCell>
                    <TableCell>{batch.eventName}</TableCell>
                    <TableCell>
                      <StatusBadge status={batch.status} />
                    </TableCell>
                    <TableCell>{batch.riskRows}</TableCell>
                    <TableCell>{formatDate(batch.createdAt, "yyyy-MM-dd HH:mm")}</TableCell>
                    <TableCell>
                      <Link
                        className="text-primary hover:underline"
                        href={`/dashboard/events/${batch.eventId}?batchId=${batch.id}`}
                      >
                        查看赛事详情
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          title="还没有批量核验记录"
          description="先创建一场赛事并上传一份名单文件，系统会自动生成核验历史。"
        />
      )}
    </div>
  );
}
