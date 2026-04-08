import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
      <Card className="dashboard-panel border-white/80">
        <CardHeader className="pb-4">
          <CardTitle>教程</CardTitle>
          <CardDescription>主办方先按这 5 步走，能快速完成一次完整核验。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
            <p className="text-sm font-semibold text-slate-950">1. 查看教程</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">先看默认规则和对象层级，减少后续误操作。</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
            <p className="text-sm font-semibold text-slate-950">2. 创建赛事</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">把赛事名称、日期、主办方名称和备注补齐。</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
            <p className="text-sm font-semibold text-slate-950">3. 上传名单</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">选择赛事后上传 Excel 或 CSV 文件。</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
            <p className="text-sm font-semibold text-slate-950">4. 查看结果</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">在赛事详情里看核验结果、风险条目和复核结果。</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
            <p className="text-sm font-semibold text-slate-950">5. 导出 PDF</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">把最终核验报告导出为交付物。</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        <Card className="dashboard-panel border-white/80">
          <CardHeader className="pb-4">
            <CardTitle>规则</CardTitle>
            <CardDescription>这里只保留默认规则，不放假配置。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
            <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4">
              <p>1. 二级及以上统一视为风险。</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4">
              <p>2. 未查到不等于通过，仍需人工复核。</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4">
              <p>3. 删除后的记录会继续保留在批次留痕里，便于回看审计痕迹。</p>
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-panel border-white/80">
          <CardHeader className="pb-4">
            <CardTitle>快捷操作</CardTitle>
            <CardDescription>直接进入最常用的主办方动作。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Link
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
              href="/dashboard/events"
            >
              创建或编辑赛事
            </Link>
            <Link
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200/90 bg-white/88 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              href="/dashboard/batch-check"
            >
              上传名单并查看结果
            </Link>
            <Link
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200/90 bg-white/88 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              href="/dashboard/history"
            >
              查看批次留痕
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
