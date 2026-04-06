import { PublicShell } from "@/components/layout/public-shell";
import { PublicSearchClient } from "@/components/search/public-search-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Radar, ShieldAlert, Wifi } from "lucide-react";

export default function SearchPage({
  searchParams
}: {
  searchParams?: {
    name?: string;
  };
}) {
  return (
    <PublicShell>
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <section className="mb-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.28em] text-primary">Public Search</p>
            <h1 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl">羽毛球运动员等级查询</h1>
            <p className="mt-4 text-base leading-8 text-muted-foreground">
              当前查询页已经升级为“实时公开接口优先”的模式。若上游公开接口可用，将优先返回实时羽毛球记录；若接口异常，则会明确提示并回退到本地演示数据。
            </p>
          </div>
          <Card className="metric-ink">
            <CardHeader>
              <CardTitle>查询策略</CardTitle>
              <CardDescription>为了兼顾演示稳定性和真实感，当前采用双层数据源。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-slate-700">
              <div className="flex items-start gap-3">
                <Wifi className="mt-1 h-4 w-4 text-primary" />
                <p>单人查询优先请求公开实时接口，并限定为羽毛球项目。</p>
              </div>
              <div className="flex items-start gap-3">
                <Radar className="mt-1 h-4 w-4 text-primary" />
                <p>如果实时接口失败，系统会回退到演示库并明确标记来源。</p>
              </div>
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-1 h-4 w-4 text-risk" />
                <p>二级运动员及以上统一视为风险，便于业余赛事资格把关。</p>
              </div>
            </CardContent>
          </Card>
        </section>
        <PublicSearchClient initialQuery={searchParams?.name ?? ""} />
      </main>
    </PublicShell>
  );
}
