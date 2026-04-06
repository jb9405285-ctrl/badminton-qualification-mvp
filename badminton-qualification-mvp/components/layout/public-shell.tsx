import type { ReactNode } from "react";

import Link from "next/link";
import { ShieldCheck, Sparkles } from "lucide-react";

import { APP_NAME } from "@/lib/constants";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen public-mesh">
      <header className="sticky top-0 z-40 border-b border-white/70 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="hidden rounded-2xl bg-slate-950 p-3 text-white shadow-soft sm:block">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <Link href="/" className="font-serif text-2xl font-semibold text-slate-900">
                {APP_NAME}
              </Link>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-950 px-2.5 py-1 font-medium text-white">
                  <Sparkles className="h-3.5 w-3.5" />
                  MVP
                </span>
                <span>面向羽毛球业余赛事的资格筛查与结果留痕平台</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="hidden rounded-full border border-slate-200 bg-white/90 px-3 py-2 text-xs text-slate-600 md:block">
              单人查询优先走实时公开接口，接口异常时回退演示数据
            </div>
            <Link
              className="inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-medium transition hover:bg-slate-100"
              href="/search"
            >
              公众查询
            </Link>
            <Link
              className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
              href="/login"
            >
              主办方登录
            </Link>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
