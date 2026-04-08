import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { getDashboardSummary } from "@/lib/services/dashboard-service";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const summary = await getDashboardSummary();

  return (
    <div className="grid gap-6">
      <Card className="dashboard-panel border-white/80">
        <CardHeader>
          <CardTitle>操作教程</CardTitle>
          <CardDescription>按这个顺序完成一次完整操作，页面会尽量保持克制，不堆多余提示。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <ol className="space-y-3">
            <li className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
              <p className="text-sm font-semibold text-slate-950">1. 查看教程</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">先确认默认规则、对象层级和主办方的操作顺序。</p>
            </li>
            <li className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
              <p className="text-sm font-semibold text-slate-950">2. 创建赛事</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">补齐赛事名称、日期、主办方名称和备注。</p>
            </li>
            <li className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
              <p className="text-sm font-semibold text-slate-950">3. 上传名单</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">选择赛事后上传 Excel 或 CSV 名单文件。</p>
            </li>
            <li className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
              <p className="text-sm font-semibold text-slate-950">4. 查看结果</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">在赛事详情中查看核验结果和风险条目。</p>
            </li>
            <li className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
              <p className="text-sm font-semibold text-slate-950">5. 导出 PDF</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">把核验报告导出为正式交付物。</p>
            </li>
          </ol>

          <div className="flex flex-col justify-between gap-4">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5">
              <p className="text-sm font-semibold text-slate-950">下一步动作</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">先看教程，再进入最常用的主办方操作。</p>
              <div className="mt-4 grid gap-3">
                <Link
                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200/90 bg-white/88 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  href="/dashboard/settings"
                >
                  查看教程
                </Link>
                <Link
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                  href="/dashboard/events"
                >
                  创建赛事
                </Link>
                <Link
                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200/90 bg-white/88 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  href="/dashboard/batch-check"
                >
                  上传名单
                </Link>
                <Link
                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200/90 bg-white/88 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  href="/dashboard/history"
                >
                  查看批次留痕
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="dashboard-panel border-white/80">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle>最近批次</CardTitle>
            <CardDescription>只保留最近处理过的名单批次，方便继续接着做。</CardDescription>
          </div>
          <Link
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200/90 bg-white px-4 text-sm font-medium transition hover:bg-slate-50"
            href="/dashboard/history"
          >
            查看留痕
          </Link>
        </CardHeader>
        <CardContent>
          {summary.latestBatches.length === 0 ? (
            <EmptyState title="还没有上传批次" description="先创建赛事，再上传名单，最近批次会出现在这里。" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>上传批次</TableHead>
                  <TableHead>赛事</TableHead>
                  <TableHead>结果摘要</TableHead>
                  <TableHead>上传时间</TableHead>
                  <TableHead>查看</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.latestBatches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-slate-950">{batch.originalFileName}</p>
                        <p className="text-xs text-muted-foreground">共 {batch.totalRows} 行</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-slate-950">{batch.event.name}</p>
                        <p className="text-xs text-muted-foreground">{batch.event.organizerName}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-slate-700">
                        已处理 {batch.processedRows}/{batch.totalRows}，风险 {batch.riskRows}，待复核 {batch.unresolvedRows}
                      </p>
                    </TableCell>
                    <TableCell>{formatDateTime(batch.createdAt)}</TableCell>
                    <TableCell>
                      <Link className="text-primary hover:underline" href={`/dashboard/events/${batch.eventId}?batchId=${batch.id}`}>
                        查看详情
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
