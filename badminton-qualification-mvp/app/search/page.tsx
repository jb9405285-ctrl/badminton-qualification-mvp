import { Radar, ShieldAlert, Waves, Wifi } from "lucide-react";

import { PublicShell } from "@/components/layout/public-shell";
import { PublicSearchClient } from "@/components/search/public-search-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SearchPage({
  searchParams
}: {
  searchParams?: {
    name?: string;
  };
}) {
  return (
    <PublicShell>
      <main className="mx-auto w-full max-w-7xl px-6 py-8 lg:py-10">
        <section className="mb-8 grid gap-6 lg:grid-cols-[1.16fr_0.84fr]">
          <Card className="ink-stage overflow-hidden border-slate-950/10 text-white shadow-panel">
            <CardContent className="relative p-8 sm:p-10">
              <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.05),transparent_40%)]" />
              <div className="relative">
                <p className="text-sm uppercase tracking-[0.28em] text-cyan-200">Public Search</p>
                <h1 className="mt-4 max-w-4xl font-serif text-4xl leading-tight sm:text-5xl">
                  羽毛球运动员等级查询
                </h1>
                <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300">
                  输入姓名即可查询。实时接口优先，异常时切换本地数据源。
                </p>
                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">实时策略</p>
                    <p className="mt-3 text-sm leading-6 text-slate-100">优先查询公开接口。</p>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">异常回退</p>
                    <p className="mt-3 text-sm leading-6 text-slate-100">异常时切换本地数据源。</p>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">风险定义</p>
                    <p className="mt-3 text-sm leading-6 text-slate-100">二级及以上统一风险。</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <Card className="metric-ink border-slate-200/80 shadow-soft">
              <CardHeader>
                <CardTitle>查询策略</CardTitle>
                <CardDescription>双层数据源，兼顾真实感和稳定性。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-7 text-slate-700">
                <div className="flex items-start gap-3">
                  <Wifi className="mt-1 h-4 w-4 text-primary" />
                  <p>优先查询实时公开接口。</p>
                </div>
                <div className="flex items-start gap-3">
                  <Radar className="mt-1 h-4 w-4 text-primary" />
                  <p>接口失败时切换本地数据源。</p>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldAlert className="mt-1 h-4 w-4 text-risk" />
                  <p>二级及以上统一标记风险。</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 bg-white shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Waves className="h-5 w-5 text-primary" />
                  使用建议
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-7 text-slate-600">
                <p>可先搜索常见姓名，快速确认查询结果。</p>
                <p>需要批量核验时，再进入后台上传名单。</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <PublicSearchClient initialQuery={searchParams?.name ?? ""} />
      </main>
    </PublicShell>
  );
}
