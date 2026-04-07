import type { ReactNode } from "react";

import Link from "next/link";
import { Activity, ShieldCheck } from "lucide-react";

import { APP_NAME } from "@/lib/constants";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen public-mesh">
      <div className="border-b border-slate-800/80 bg-[#07111d]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-6 py-3 text-xs text-slate-300 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-cyan-300" />
            <span className="tracking-[0.18em] text-slate-200">EVENT ELIGIBILITY DESK</span>
          </div>
          <p className="text-slate-400">实时查询优先 · 风险自动标记 · 结果可留痕</p>
        </div>
      </div>
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-[rgba(247,248,250,0.86)] backdrop-blur-2xl">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <Link className="flex items-center gap-4" href="/">
            <div className="rounded-[24px] bg-[#07111d] p-4 text-white shadow-panel">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="font-serif text-3xl font-semibold tracking-tight text-slate-950">{APP_NAME}</p>
              <p className="mt-1 text-sm text-slate-500">羽毛球赛事资格核验平台</p>
            </div>
          </Link>
          <div className="flex flex-col gap-3 lg:items-end">
            <div className="hidden rounded-full border border-slate-200/80 bg-white/88 px-4 py-2 text-xs text-slate-600 xl:block">
              实时查询优先，异常时切换本地数据源
            </div>
            <nav className="flex flex-wrap items-center gap-1 rounded-full border border-slate-200/80 bg-white/92 p-1.5 shadow-soft">
              <Link
                className="inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                href="/"
              >
                首页
              </Link>
              <Link
                className="inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                href="/search"
              >
                公众查询
              </Link>
              <Link
                className="inline-flex h-11 items-center justify-center rounded-full bg-[#10284b] px-5 text-sm font-medium text-white transition hover:bg-[#0d2342]"
                href="/login"
              >
                主办方登录
              </Link>
            </nav>
            <p className="text-xs text-slate-500 xl:hidden">实时查询优先，异常时切换本地数据源</p>
          </div>
        </div>
      </header>
      <div className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/45 to-transparent" />
        {children}
      </div>
    </div>
  );
}
