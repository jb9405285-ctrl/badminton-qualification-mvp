import Link from "next/link";

import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { getDashboardSummary } from "@/lib/services/dashboard-service";

export default async function DashboardPage() {
  const summary = await getDashboardSummary();

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard hint="已创建赛事总数" label="赛事数量" value={summary.eventCount} />
        <StatCard hint="已处理上传批次数" label="上传批次" value={summary.batchCount} />
        <StatCard hint="二级及以上风险记录" label="风险人数" value={summary.riskCount} />
        <StatCard hint="需人工进一步确认" label="人工复核" value={summary.reviewCount} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Card className="bg-white/90">
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle>最近核验批次</CardTitle>
              <CardDescription>最新上传的报名名单批次和处理结果。</CardDescription>
            </div>
            <Link
              className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
              href="/dashboard/batch-check"
            >
              发起新核验
            </Link>
          </CardHeader>
          <CardContent>
            {summary.latestBatches.length === 0 ? (
              <EmptyState
                title="还没有核验批次"
                description="先创建赛事并上传 Excel 名单，后台就会在这里显示最近处理记录。"
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>文件</TableHead>
                    <TableHead>赛事</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>上传时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.latestBatches.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell>{batch.originalFileName}</TableCell>
                      <TableCell>{batch.event.name}</TableCell>
                      <TableCell>
                        <StatusBadge status={batch.status} />
                      </TableCell>
                      <TableCell>{formatDateTime(batch.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/90">
          <CardHeader>
            <CardTitle>当前演示重点</CardTitle>
            <CardDescription>这版 MVP 已经围绕“业余赛事资格核验”做了完整主流程。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
            <p>1. 支持公众页单人等级查询。</p>
            <p>2. 支持赛事创建、名单上传、自动识别姓名列。</p>
            <p>3. 二级运动员及以上统一高亮为风险名单。</p>
            <p>4. 支持历史留痕、人工备注、CSV/PDF 导出。</p>
            {summary.latestEvent ? (
              <Link
                className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-white px-4 text-sm font-medium transition hover:bg-slate-50"
                href={`/dashboard/events/${summary.latestEvent.id}`}
              >
                查看最近赛事
              </Link>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
