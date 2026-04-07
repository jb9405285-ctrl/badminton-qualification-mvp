import Link from "next/link";

import {
  ArrowRight,
  BadgeCheck,
  FileSpreadsheet,
  FileText,
  Radar,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  Upload
} from "lucide-react";

import { StatCard } from "@/components/dashboard/stat-card";
import { PublicShell } from "@/components/layout/public-shell";
import { DisclaimerCard } from "@/components/search/disclaimer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

const workflowSteps = [
  {
    title: "创建赛事",
    description: "填写赛事信息，生成核验任务。"
  },
  {
    title: "上传报名名单",
    description: "支持 Excel / CSV，自动识别姓名列。"
  },
  {
    title: "系统批量核验",
    description: "按姓名匹配并标记风险、未查到、待复核。"
  },
  {
    title: "导出核验报告",
    description: "一键导出 CSV 和 PDF。"
  }
];

const capabilityCards = [
  {
    icon: ScanSearch,
    title: "公众实名查询",
    description: "姓名直查，优先走实时接口。"
  },
  {
    icon: Upload,
    title: "主办方批量筛查",
    description: "上传名单后自动生成核验结果。"
  },
  {
    icon: ShieldCheck,
    title: "统一资格规则",
    description: "二级及以上统一标记风险。"
  },
  {
    icon: FileText,
    title: "标准核验报告",
    description: "输出完整结果和风险名单。"
  }
];

export default async function HomePage() {
  const [athleteCount, eventCount, recordCount] = await Promise.all([
    prisma.athlete.count(),
    prisma.event.count(),
    prisma.verificationRecord.count()
  ]);

  return (
    <PublicShell>
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-8 lg:gap-12 lg:py-10">
        <section className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
          <Card className="ink-stage overflow-hidden border-slate-950/10 text-white shadow-panel">
            <CardContent className="relative p-8 sm:p-10">
              <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.03),transparent_36%),linear-gradient(0deg,rgba(255,255,255,0.02),rgba(255,255,255,0.02))]" />
              <div className="absolute inset-y-0 right-0 hidden w-[38%] border-l border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.06))] xl:block" />
              <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-100">
                      <Radar className="h-3.5 w-3.5" />
                      羽毛球赛事资格核验工具
                    </span>
                    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                      业余赛事审查场景
                    </span>
                  </div>
                  <h1 className="mt-7 max-w-4xl font-serif text-4xl leading-tight text-balance sm:text-[4rem] sm:leading-[1.05]">
                    让主办方用一份报名名单，
                    <br className="hidden sm:block" />
                    完成一整轮资格筛查与结果留痕
                  </h1>
                  <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300">
                    面向业余赛事的资格核验平台。支持单人查询、名单筛查、风险标记和报告导出。
                  </p>

                  <div className="mt-8 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[24px] border border-white/10 bg-white/6 p-4 backdrop-blur-sm">
                      <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">核验规则</p>
                      <p className="mt-3 text-sm leading-6 text-slate-100">二级及以上统一标记风险。</p>
                    </div>
                    <div className="rounded-[24px] border border-white/10 bg-white/6 p-4 backdrop-blur-sm">
                      <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">查询策略</p>
                      <p className="mt-3 text-sm leading-6 text-slate-100">实时接口优先，异常时切换本地数据源。</p>
                    </div>
                    <div className="rounded-[24px] border border-white/10 bg-white/6 p-4 backdrop-blur-sm">
                      <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">报告输出</p>
                      <p className="mt-3 text-sm leading-6 text-slate-100">支持 CSV / PDF 导出。</p>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-wrap gap-3">
                    <Link
                      className="inline-flex h-12 items-center justify-center rounded-full bg-white px-6 text-base font-medium text-slate-950 transition hover:bg-white/92"
                      href="/search"
                    >
                      进入公众查询
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                    <Link
                      className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 text-base font-medium text-white transition hover:bg-white/10"
                      href="/login"
                    >
                      进入主办方后台
                    </Link>
                  </div>

                  <form
                    action="/search"
                    className="mt-8 flex flex-col gap-3 rounded-[30px] border border-white/10 bg-white/5 p-4 sm:flex-row"
                  >
                    <input
                      className="h-12 flex-1 rounded-2xl border border-white/10 bg-white px-4 text-slate-900 outline-none placeholder:text-slate-400"
                      name="name"
                      placeholder="输入姓名，开始查询"
                    />
                    <button
                      className="h-12 rounded-2xl bg-[#12305a] px-6 text-base font-medium text-white transition hover:bg-[#10284b]"
                      type="submit"
                    >
                      发起查询
                    </button>
                  </form>
                </div>

                <div className="space-y-4 xl:pl-5">
                  <div className="rounded-[28px] border border-white/10 bg-white/6 p-5 backdrop-blur-sm">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">当前模式</p>
                    <div className="mt-5 space-y-4">
                      <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                        <p className="text-xs text-slate-400">实时接口状态</p>
                        <p className="mt-2 text-lg font-medium text-white">实时查询优先</p>
                        <p className="mt-2 text-sm leading-6 text-slate-300">可用时查公开接口，不可用时切换本地数据源。</p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                        <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                          <p className="text-xs text-slate-400">风险阈值</p>
                          <p className="mt-2 text-lg font-medium text-white">二级及以上</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                          <p className="text-xs text-slate-400">留痕方式</p>
                          <p className="mt-2 text-lg font-medium text-white">赛事历史 + 报告</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                    <div className="rounded-[24px] border border-white/10 bg-white/6 p-4 text-white">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">当前收录</p>
                      <p className="mt-3 text-3xl font-serif">{athleteCount}</p>
                    </div>
                    <div className="rounded-[24px] border border-white/10 bg-white/6 p-4 text-white">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">赛事数量</p>
                      <p className="mt-3 text-3xl font-serif">{eventCount}</p>
                    </div>
                    <div className="rounded-[24px] border border-white/10 bg-white/6 p-4 text-white">
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">核验记录</p>
                      <p className="mt-3 text-3xl font-serif">{recordCount}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 content-start">
            <Card className="border-slate-200/80 bg-white shadow-panel">
              <CardHeader>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Ruleset</p>
                <CardTitle className="flex items-center gap-2 text-[1.35rem]">
                  <ShieldAlert className="h-5 w-5 text-risk" />
                  核验逻辑基准
                </CardTitle>
                <CardDescription>规则固定，面向业余赛事。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-7 text-slate-700">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4">
                  <p className="font-medium text-slate-950">
                    二级运动员、一级运动员、运动健将、国际级运动健将全部视为风险。
                  </p>
                </div>
                <p>未查到不等于安全，可进入人工复核。</p>
                <p>所有结果都可按赛事留痕并导出。</p>
              </CardContent>
            </Card>
            <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
              <StatCard hint="当前已收录的运动员记录数量" label="收录记录" value={athleteCount} />
              <StatCard hint="用于沉淀历史、报告和回溯链路" label="赛事数量" value={eventCount} />
              <StatCard hint="覆盖查询、核验、备注与导出流程" label="已生成核验记录" value={recordCount} />
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-4">
          {capabilityCards.map(({ icon: Icon, title, description }) => (
            <Card className="halo-panel border-slate-200/80 bg-white shadow-soft" key={title}>
              <CardHeader>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-soft">
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle className="mt-4 text-xl">{title}</CardTitle>
                <CardDescription className="text-sm leading-7">{description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="border-slate-200/80 bg-white shadow-panel">
            <CardHeader>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Workflow</p>
              <CardTitle>操作流程</CardTitle>
              <CardDescription>四步就能讲清楚产品价值。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {workflowSteps.map((step, index) => (
                <div className="flex gap-4 rounded-[24px] border border-slate-200/80 bg-slate-50/70 p-4" key={step.title}>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-base font-semibold text-slate-950">{step.title}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <Card className="ink-stage overflow-hidden border-slate-950/10 text-white shadow-panel">
              <CardHeader>
                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Deliverables</p>
                <CardTitle className="text-[1.55rem] text-white">结果不止能看，还能导出</CardTitle>
                <CardDescription className="text-slate-300">筛查结果、风险名单、完整表格都能直接输出。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-7 text-slate-300">
                <div className="flex items-start gap-3">
                  <FileSpreadsheet className="mt-1 h-4 w-4 text-cyan-300" />
                  <p>CSV 适合复核和内部流转。</p>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldAlert className="mt-1 h-4 w-4 text-rose-300" />
                  <p>风险名单会单独汇总，一眼就能看清重点。</p>
                </div>
                <div className="flex items-start gap-3">
                  <BadgeCheck className="mt-1 h-4 w-4 text-emerald-300" />
                  <p>PDF 可直接用于留档和对外沟通。</p>
                </div>
              </CardContent>
            </Card>
            <DisclaimerCard />
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
