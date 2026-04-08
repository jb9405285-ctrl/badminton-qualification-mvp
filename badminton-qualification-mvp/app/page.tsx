import Link from "next/link";

import { ArrowRight, CircleAlert, FileText, ShieldCheck, UploadCloud } from "lucide-react";

import { PublicShell } from "@/components/layout/public-shell";
import { APP_NAME } from "@/lib/constants";

export default function HomePage() {
  return (
    <PublicShell>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 lg:gap-12 lg:py-14">
        <section className="rounded-[36px] border border-slate-200/80 bg-white/92 px-6 py-8 shadow-panel sm:px-10 sm:py-10">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
            <div className="max-w-2xl">
              <p className="text-sm font-medium tracking-[0.18em] text-slate-500">{APP_NAME}</p>
              <h1 className="mt-5 font-serif text-4xl leading-tight text-balance text-slate-950 sm:text-[3.4rem] sm:leading-[1.06]">
                一份名单，
                <br />
                完成赛事资格核验
              </h1>
              <p className="mt-5 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
                面向羽毛球赛事主办方的批量筛查、风险留痕与标准化导出工具。
              </p>
            </div>

            <div className="rounded-[30px] border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.92),rgba(241,245,249,0.92))] p-4 sm:p-5">
              <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-soft">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                  </div>
                  <span className="text-xs font-medium text-slate-500">主办方工作台预览</span>
                </div>

                <div className="mt-5 rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">赛事概览</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">春季公开赛资格核验</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[18px] border border-slate-200 bg-white p-4">
                      <p className="text-xs text-slate-500">最近批次</p>
                      <p className="mt-2 text-sm font-semibold text-slate-950">第 3 批名单</p>
                      <p className="mt-1 text-sm text-slate-600">164 人已完成处理</p>
                    </div>
                    <div className="rounded-[18px] border border-slate-200 bg-white p-4">
                      <p className="text-xs text-slate-500">风险状态</p>
                      <p className="mt-2 inline-flex items-center text-sm font-semibold text-slate-950">
                        <CircleAlert className="mr-2 h-4 w-4 text-amber-500" />
                        2 条风险待复核
                      </p>
                      <p className="mt-1 text-sm text-slate-600">可直接导出正式报告</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
                    <UploadCloud className="mr-1.5 h-3.5 w-3.5" />
                    批量上传
                  </span>
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
                    <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                    风险留痕
                  </span>
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
                    <FileText className="mr-1.5 h-3.5 w-3.5" />
                    标准化导出
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[30px] border border-slate-900 bg-slate-950 p-7 text-white shadow-panel sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-300">主办方入口</p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-[2rem]">进入主办方工作台</h2>
            <p className="mt-4 max-w-lg text-sm leading-7 text-slate-300">
              适合赛事主办方。创建赛事、上传名单、查看风险结果并导出标准化报告。
            </p>
            <Link
              className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-white px-6 text-base font-medium text-slate-950 transition hover:bg-slate-100"
              href="/login"
            >
              主办方登录
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-[30px] border border-slate-200/80 bg-white/92 p-7 shadow-soft sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">公共查询入口</p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">进入公共查询</h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-slate-600">
              适合参赛者、家长和公众用户。输入姓名后查看公开可见的资格结果。
            </p>
            <Link
              className="mt-8 inline-flex h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-6 text-base font-medium text-slate-700 transition hover:bg-slate-50"
              href="/search"
            >
              前往公众查询
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
