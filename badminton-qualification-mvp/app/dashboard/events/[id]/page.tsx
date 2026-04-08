import Link from "next/link";
import { notFound } from "next/navigation";

import { EditEventForm } from "@/components/dashboard/edit-event-form";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { VerificationResultsTable } from "@/components/dashboard/verification-results-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatDateTime } from "@/lib/format";
import { getEventDetail } from "@/lib/services/dashboard-service";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({
  params,
  searchParams
}: {
  params: {
    id: string;
  };
  searchParams?: {
    batchId?: string;
  };
}) {
  const event = await getEventDetail(params.id);

  if (!event) {
    notFound();
  }

  const selectedBatch =
    event.batches.find((batch) => batch.id === searchParams?.batchId) ?? event.batches[0] ?? null;
  const selectedRecords = selectedBatch
    ? event.verificationRecords.filter((item) => item.batchId === selectedBatch.id)
    : [];
  const riskRecords = selectedRecords.filter((item) => item.status === "RISK");
  const riskCount = selectedRecords.filter((item) => item.status === "RISK").length;
  const reviewCount = selectedRecords.filter((item) => item.status === "REVIEW").length;
  const unresolvedCount = selectedRecords.filter((item) => item.status === "NOT_FOUND").length + reviewCount;
  const exportQuery = selectedBatch ? `?batchId=${selectedBatch.id}` : "";

  return (
    <div className="grid gap-6">
      <Card className="dashboard-panel border-white/80">
        <CardHeader className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <CardTitle className="text-2xl">{event.name}</CardTitle>
              <Badge tone="default">{formatDate(event.eventDate)}</Badge>
            </div>
            <CardDescription className="mt-3">
              主办方：{event.organizerName} · 创建人：{event.createdBy.name}
            </CardDescription>
            {event.notes ? <p className="mt-4 text-sm leading-7 text-muted-foreground">{event.notes}</p> : null}
            {selectedBatch ? (
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                本次结果：{selectedBatch.originalFileName} · {formatDateTime(selectedBatch.createdAt)}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-white px-4 text-sm font-medium transition hover:bg-slate-50"
              href="/dashboard/events"
            >
              返回赛事管理
            </Link>
            <Link
              className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
              href={`/dashboard/batch-check?eventId=${event.id}`}
            >
              上传新名单
            </Link>
            <a
              className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-white px-4 text-sm font-medium transition hover:bg-slate-50"
              href={`/api/exports/event/${event.id}/csv${exportQuery}`}
            >
              导出 CSV
            </a>
            <a
              className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-white px-4 text-sm font-medium transition hover:bg-slate-50"
              href={`/api/exports/event/${event.id}/pdf${exportQuery}`}
            >
              导出 PDF
            </a>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <Card className="dashboard-kpi shadow-none">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">历史上传次数</p>
              <p className="mt-2 text-3xl font-semibold">{event.batches.length}</p>
            </CardContent>
          </Card>
          <Card className="dashboard-kpi shadow-none">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">核验总人数</p>
              <p className="mt-2 text-3xl font-semibold">{selectedRecords.length}</p>
            </CardContent>
          </Card>
          <Card className="dashboard-kpi bg-risk/[0.05] shadow-none">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">风险人数</p>
              <p className="mt-2 text-3xl font-semibold text-risk">{riskCount}</p>
            </CardContent>
          </Card>
          <Card className="dashboard-kpi bg-warning/[0.06] shadow-none">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">未查到/需复核</p>
              <p className="mt-2 text-3xl font-semibold text-warning">{unresolvedCount}</p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <Card className="dashboard-panel border-white/80">
        <CardHeader className="pb-4">
          <CardTitle>赛事信息管理</CardTitle>
          <CardDescription>
            这里修改的是赛事主数据。更新后，批次留痕、核验结果页头和 CSV / PDF 导出标题会统一使用最新赛事信息。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditEventForm
            event={{
              id: event.id,
              name: event.name,
              organizerName: event.organizerName,
              eventDate: event.eventDate.toISOString(),
              notes: event.notes ?? "",
              updatedAt: event.updatedAt.toISOString()
            }}
            initiallyOpen
            triggerLabel="编辑赛事"
          />
        </CardContent>
      </Card>

      {selectedBatch ? (
        <Card className={riskCount > 0 ? "dashboard-panel border-risk/25 bg-risk/[0.04]" : "dashboard-panel border-emerald-200/80 bg-emerald-50/70"}>
          <CardHeader className="pb-4">
            <CardTitle>{riskCount > 0 ? "本次发现的二级及以上风险名单" : "本次未发现二级及以上风险名单"}</CardTitle>
            <CardDescription>
              当前只统计批次“{selectedBatch.originalFileName}”，不会混入该赛事之前上传过的名单结果。
            </CardDescription>
          </CardHeader>
          <CardContent>
            {riskRecords.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>原始行</TableHead>
                    <TableHead>名单姓名</TableHead>
                    <TableHead>匹配姓名</TableHead>
                    <TableHead>等级</TableHead>
                    <TableHead>单位</TableHead>
                    <TableHead>数据来源</TableHead>
                    <TableHead>说明</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {riskRecords.map((record) => (
                    <TableRow className="bg-risk/[0.06] hover:bg-risk/[0.08]" key={record.id}>
                      <TableCell>{record.rowIndex ?? "--"}</TableCell>
                      <TableCell className="font-medium">{record.athleteNameInput}</TableCell>
                      <TableCell>{record.matchedAthleteName ?? "--"}</TableCell>
                      <TableCell className="font-semibold text-risk">{record.matchedLevel ?? "--"}</TableCell>
                      <TableCell>{record.matchedOrganization ?? "--"}</TableCell>
                      <TableCell>{record.matchedSourceName ?? "--"}</TableCell>
                      <TableCell>{record.remark ?? "--"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="dashboard-inset p-5 text-sm leading-7 text-muted-foreground">
                本次名单共核验 {selectedRecords.length} 人，未检测到二级运动员、一级运动员、运动健将或国际级运动健将记录。
                未查到记录仍建议按赛事规则保留人工复核口径。
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {event.batches.length > 0 ? (
        <Card className="dashboard-panel border-white/80">
          <CardHeader className="pb-4">
            <CardTitle>历史批次</CardTitle>
            <CardDescription>每个批次的结果互相独立；默认打开最新一次上传结果，也可以回看指定批次。</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>文件名</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>总人数</TableHead>
                  <TableHead>风险人数</TableHead>
                  <TableHead>上传时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {event.batches.map((batch) => (
                  <TableRow
                    className={batch.id === selectedBatch?.id ? "bg-primary/[0.06] hover:bg-primary/[0.08]" : undefined}
                    key={batch.id}
                  >
                    <TableCell>{batch.originalFileName}</TableCell>
                    <TableCell>
                      <StatusBadge status={batch.status} />
                    </TableCell>
                    <TableCell>{batch.totalRows}</TableCell>
                    <TableCell>{batch.riskRows}</TableCell>
                    <TableCell>{formatDateTime(batch.createdAt)}</TableCell>
                    <TableCell>
                      <Link className="text-primary hover:underline" href={`/dashboard/events/${event.id}?batchId=${batch.id}`}>
                        查看本批次
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
          title="当前赛事还没有上传名单"
          description="点击上方“上传新名单”即可进入批量核验工作台。"
        />
      )}

      {selectedRecords.length > 0 ? (
        <VerificationResultsTable
          records={selectedRecords.map((record) => ({
            id: record.id,
            rowIndex: record.rowIndex,
            athleteNameInput: record.athleteNameInput,
            matchedAthleteName: record.matchedAthleteName,
            matchedLevel: record.matchedLevel,
            matchedOrganization: record.matchedOrganization,
            matchedSourceName: record.matchedSourceName,
            status: record.status,
            remark: record.remark,
            queryTime: record.queryTime.toISOString(),
            isRisk: record.isRisk
          }))}
        />
      ) : null}
    </div>
  );
}
