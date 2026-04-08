import type { ReactNode } from "react";

import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { APP_NAME } from "@/lib/constants";

export function PublicShell({
  children,
  navMode = "default"
}: {
  children: ReactNode;
  navMode?: "default" | "focus";
}) {
  return (
    <div className="min-h-screen public-mesh">
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
          {navMode === "focus" ? (
            <div className="flex flex-col gap-3 lg:items-end">
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200/90 bg-white/92 px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  href="/search"
                >
                  公众查询
                </Link>
                <Link
                  className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200/90 bg-white/92 px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  href="/"
                >
                  返回首页
                </Link>
                <span className="inline-flex h-11 items-center rounded-full bg-[#10284b] px-5 text-sm font-medium text-white">
                  主办方登录
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 lg:items-end">
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
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </nav>
            </div>
          )}
        </div>
      </header>
      <div className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/45 to-transparent" />
        {children}
      </div>
    </div>
  );
}
