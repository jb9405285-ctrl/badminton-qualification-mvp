import Link from "next/link";

export function HomeAudienceSplit() {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <Link
        className="group rounded-[28px] border border-slate-200/80 bg-white p-6 transition hover:border-slate-300 hover:shadow-soft"
        href="/search"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">公众查询</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">查询运动员资格结果</h2>
        <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
          输入姓名即可查看公开查询结果，适合散户和普通观众直接使用。
        </p>
        <span className="mt-6 inline-flex items-center text-sm font-medium text-primary">
          进入查询
          <span className="ml-2 transition group-hover:translate-x-0.5">→</span>
        </span>
      </Link>

      <Link
        className="group rounded-[28px] border border-slate-200/80 bg-slate-950 p-6 text-white transition hover:border-slate-700 hover:shadow-soft"
        href="/login"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-300">主办方登录</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">进入主办方工作台</h2>
        <p className="mt-3 max-w-md text-sm leading-6 text-slate-300">
          登录后按教程完成建赛、上传名单、查看结果和导出 PDF。
        </p>
        <span className="mt-6 inline-flex items-center text-sm font-medium text-cyan-300">
          去登录
          <span className="ml-2 transition group-hover:translate-x-0.5">→</span>
        </span>
      </Link>
    </section>
  );
}
