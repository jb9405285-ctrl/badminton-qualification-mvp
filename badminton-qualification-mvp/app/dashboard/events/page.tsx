import Link from "next/link";

import { CreateEventForm } from "@/components/dashboard/create-event-form";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, formatDateTime } from "@/lib/format";
import { getEventList } from "@/lib/services/dashboard-service";

export default async function EventsPage() {
  const events = await getEventList();

  return (
    <div className="grid gap-6">
      <CreateEventForm />

      {events.length === 0 ? (
        <EmptyState
          title="还没有赛事"
          description="创建第一场赛事后，就可以开始上传报名名单、执行批量核验并导出核验报告。"
        />
      ) : (
        <div className="grid gap-4">
          {events.map((event) => {
            const latestBatch = event.batches[0] ?? null;
            const detailHref = latestBatch
              ? `/dashboard/events/${event.id}?batchId=${latestBatch.id}`
              : `/dashboard/batch-check?eventId=${event.id}`;

            return (
              <Card key={event.id} className="dashboard-panel border-white/80">
                <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <CardTitle>{event.name}</CardTitle>
                      <Badge tone="default">{formatDate(event.eventDate)}</Badge>
                      {latestBatch ? <StatusBadge status={latestBatch.status} /> : null}
                    </div>
                    <CardDescription className="mt-3">
                      主办方：{event.organizerName}
                      {event.notes ? ` · ${event.notes}` : ""}
                    </CardDescription>
                    {latestBatch ? (
                      <p className="mt-3 text-sm text-muted-foreground">
                        当前结果来自：{latestBatch.originalFileName} · {formatDateTime(latestBatch.createdAt)}
                      </p>
                    ) : null}
                  </div>
                  <Link
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-white px-4 text-sm font-medium transition hover:bg-slate-50"
                    href={detailHref}
                  >
                    {latestBatch ? "查看本次结果" : "上传名单"}
                  </Link>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-4">
                  <div className="dashboard-inset p-4 text-sm text-muted-foreground">
                    当前名单人数：{latestBatch?.processedRows ?? 0}
                  </div>
                  <div className="dashboard-inset p-4 text-sm text-muted-foreground">
                    二级及以上风险：<span className="font-semibold text-risk">{latestBatch?.riskRows ?? 0}</span>
                  </div>
                  <div className="dashboard-inset p-4 text-sm text-muted-foreground">
                    未查到/需复核：{latestBatch?.unresolvedRows ?? 0}
                  </div>
                  <div className="dashboard-inset p-4 text-sm text-muted-foreground">
                    历史上传：{event._count.batches} 次
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
