import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusBadge } from "@/components/dashboard/status-badge";
import { VerificationResultsTable } from "@/components/dashboard/verification-results-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatDateTime } from "@/lib/format";
import { getEventDetail } from "@/lib/services/dashboard-service";

export default async function EventDetailPage({
  params
}: {
  params: {
    id: string;
  };
}) {
  const event = await getEventDetail(params.id);

  if (!event) {
    notFound();
  }

  const riskCount = event.verificationRecords.filter((item) => item.status === "RISK").length;
  const reviewCount = event.verificationRecords.filter((item) => item.status === "REVIEW").length;

  return (
    <div className="grid gap-6">
      <Card className="bg-white/90">
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
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
              href={`/dashboard/batch-check?eventId=${event.id}`}
            >
              上传新名单
            </Link>
            <a
              className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-white px-4 text-sm font-medium transition hover:bg-slate-50"
              href={`/api/exports/event/${event.id}/csv`}
            >
              导出 CSV
            </a>
            <a
              className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-white px-4 text-sm font-medium transition hover:bg-slate-50"
              href={`/api/exports/event/${event.id}/pdf`}
            >
              导出 PDF
            </a>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <Card className="bg-slate-50 shadow-none">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">上传批次</p>
              <p className="mt-2 text-3xl font-semibold">{event.batches.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-50 shadow-none">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">核验总人数</p>
              <p className="mt-2 text-3xl font-semibold">{event.verificationRecords.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-risk/5 shadow-none">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">风险人数</p>
              <p className="mt-2 text-3xl font-semibold text-risk">{riskCount}</p>
            </CardContent>
          </Card>
          <Card className="bg-warning/5 shadow-none">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">需复核</p>
              <p className="mt-2 text-3xl font-semibold text-warning">{reviewCount}</p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {event.batches.length > 0 ? (
        <Card className="bg-white/90">
          <CardHeader>
            <CardTitle>上传批次</CardTitle>
            <CardDescription>查看当前赛事历史上传记录和批次处理状态。</CardDescription>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {event.batches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell>{batch.originalFileName}</TableCell>
                    <TableCell>
                      <StatusBadge status={batch.status} />
                    </TableCell>
                    <TableCell>{batch.totalRows}</TableCell>
                    <TableCell>{batch.riskRows}</TableCell>
                    <TableCell>{formatDateTime(batch.createdAt)}</TableCell>
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

      {event.verificationRecords.length > 0 ? (
        <VerificationResultsTable
          records={event.verificationRecords.map((record) => ({
            id: record.id,
            athleteNameInput: record.athleteNameInput,
            matchedAthleteName: record.matchedAthleteName,
            matchedLevel: record.matchedLevel,
            matchedOrganization: record.matchedOrganization,
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
