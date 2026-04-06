import Link from "next/link";

import { CreateEventForm } from "@/components/dashboard/create-event-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/format";
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
          {events.map((event) => (
            <Card key={event.id} className="bg-white/90">
              <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <CardTitle>{event.name}</CardTitle>
                    <Badge tone="default">{formatDate(event.eventDate)}</Badge>
                  </div>
                  <CardDescription className="mt-3">
                    主办方：{event.organizerName}
                    {event.notes ? ` · ${event.notes}` : ""}
                  </CardDescription>
                </div>
                <Link
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-white px-4 text-sm font-medium transition hover:bg-slate-50"
                  href={`/dashboard/events/${event.id}`}
                >
                  查看详情
                </Link>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
                <p>上传批次：{event._count.batches}</p>
                <p>核验记录：{event._count.verificationRecords}</p>
                <p>状态：{event.status}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
