import Link from "next/link";

import {
  ArrowRight,
  BadgeCheck,
  FileSpreadsheet,
  Radar,
  ShieldAlert,
  ShieldCheck,
  Upload,
  Users
} from "lucide-react";

import { PublicShell } from "@/components/layout/public-shell";
import { DisclaimerCard } from "@/components/search/disclaimer";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const [athleteCount, eventCount, recordCount] = await Promise.all([
    prisma.athlete.count(),
    prisma.event.count(),
    prisma.verificationRecord.count()
  ]);

  return (
    <PublicShell>
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-10 lg:py-12">
        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="overflow-hidden border-slate-900/10 bg-[linear-gradient(180deg,#08111d,#0c1725)] text-white shadow-panel">
            <CardContent className="relative p-8 sm:p-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(148,163,184,0.12),transparent_34%)]" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-100">
                  <Radar className="h-3.5 w-3.5" />
                  赛事资格核验工具
                </div>
                <h1 className="mt-6 max-w-4xl font-serif text-4xl leading-tight text-balance sm:text-6xl">
                  让主办方用一份名单，完成一整轮羽毛球资格筛查
                </h1>
                <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300">
                  这个系统不是普通的“姓名查询页”，而是围绕业余赛事资格审核设计的工作台。它支持实时公开查询优先、演示库回退、批量名单筛查、风险标记、人工备注与正式导出报告。
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">核验规则</p>
                    <p className="mt-3 text-sm leading-6 text-slate-200">二级运动员及以上统一标记为风险名单。</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">查询策略</p>
                    <p className="mt-3 text-sm leading-6 text-slate-200">单人查询优先走实时公开接口，异常时回退演示数据。</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">输出结果</p>
                    <p className="mt-3 text-sm leading-6 text-slate-200">可导出 CSV 与 PDF 核验报告，便于赛事留痕。</p>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    className="inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-base font-medium text-slate-950 transition hover:bg-white/90"
                    href="/search"
                  >
                    进入公众查询
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                  <Link
                    className="inline-flex h-11 items-center justify-center rounded-full border border-white/20 bg-white/5 px-6 text-base font-medium text-white transition hover:bg-white/10"
                    href="/login"
                  >
                    进入主办方后台
                  </Link>
                </div>

                <form
                  action="/search"
                  className="mt-8 flex flex-col gap-3 rounded-[28px] border border-white/10 bg-white/5 p-4 sm:flex-row"
                >
                  <input
                    className="h-12 flex-1 rounded-2xl border border-white/10 bg-white/95 px-4 text-slate-900 outline-none"
                    name="name"
                    placeholder="输入运动员姓名，快速验证实时查询效果"
                  />
                  <button
                    className="h-12 rounded-2xl bg-white px-6 text-base font-medium text-slate-950 transition hover:bg-white/90"
                    type="submit"
                  >
                    发起查询
                  </button>
                </form>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <StatCard hint="当前内置的演示与测试运动员数据量" label="演示运动员库" value={athleteCount} />
            <StatCard hint="用于展示历史、报告和回溯链路" label="演示赛事" value={eventCount} />
            <StatCard hint="覆盖查询、核验、备注与导出流程" label="已生成核验记录" value={recordCount} />
            <Card className="metric-ink border-white/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <ShieldAlert className="h-5 w-5 text-risk" />
                  核验逻辑基准
                </CardTitle>
                <CardDescription>这套规则专门服务于业余赛事资格把关。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-7 text-slate-700">
                <p>1. 二级运动员、一级运动员、运动健将、国际级运动健将全部视为风险。</p>
                <p>2. 未查到记录不代表绝对安全，仍可进入人工复核。</p>
                <p>3. 所有结果都会沉淀为赛事级历史记录与导出报告。</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          <Card className="halo-panel bg-white/92">
            <CardHeader>
              <Users className="h-8 w-8 text-primary" />
              <CardTitle className="mt-3">公众免费查询</CardTitle>
              <CardDescription>支持姓名直查，优先拉取实时公开羽毛球等级记录。</CardDescription>
            </CardHeader>
          </Card>
          <Card className="halo-panel bg-white/92">
            <CardHeader>
              <Upload className="h-8 w-8 text-primary" />
              <CardTitle className="mt-3">主办方名单上传</CardTitle>
              <CardDescription>支持 Excel / CSV 上传，自动识别姓名列并批量筛查风险人群。</CardDescription>
            </CardHeader>
          </Card>
          <Card className="halo-panel bg-white/92">
            <CardHeader>
              <ShieldCheck className="h-8 w-8 text-primary" />
              <CardTitle className="mt-3">赛事资格核验</CardTitle>
              <CardDescription>二级及以上统一高亮标记，可留备注并导出核验结果。</CardDescription>
            </CardHeader>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
          <Card className="bg-white/92">
            <CardHeader>
              <CardTitle>像真的 B 端工具一样演示它</CardTitle>
              <CardDescription>现在这套产品最适合拿去给老师、赛事主办方或俱乐部负责人做现场展示。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
              <div className="flex items-start gap-3">
                <FileSpreadsheet className="mt-1 h-4 w-4 text-primary" />
                <p>上传一份报名名单，后台立即给出通过、风险、未查到、需复核四类结果。</p>
              </div>
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-1 h-4 w-4 text-risk" />
                <p>重点用风险名单高亮“二级及以上”运动员，让老师一眼看到资格筛查逻辑。</p>
              </div>
              <div className="flex items-start gap-3">
                <BadgeCheck className="mt-1 h-4 w-4 text-safe" />
                <p>最后导出 PDF 报告，效果会比单纯展示网页更像真实产品。</p>
              </div>
            </CardContent>
          </Card>
          <DisclaimerCard />
        </section>
      </main>
    </PublicShell>
  );
}
