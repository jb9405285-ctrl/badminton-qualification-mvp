import { redirect } from "next/navigation";

import { LoginForm } from "@/components/dashboard/login-form";
import { PublicShell } from "@/components/layout/public-shell";
import { DEMO_ACCOUNT_EMAIL, DEMO_ACCOUNT_PASSWORD } from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <PublicShell navMode="focus">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-12 lg:flex-row lg:items-stretch lg:gap-10 lg:py-14">
        <section className="relative flex min-h-[620px] flex-1 overflow-hidden rounded-[36px] border border-slate-950/10 bg-slate-950 text-white shadow-panel">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_30%),linear-gradient(135deg,rgba(15,23,42,1)_0%,rgba(2,6,23,0.96)_55%,rgba(8,15,32,1)_100%)]" />
          <div className="absolute inset-y-0 right-0 w-[38%] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_70%)]" />
          <div className="relative flex w-full flex-col justify-center gap-8 p-8 sm:p-10">
            <div className="max-w-3xl space-y-5">
              <p className="text-sm font-medium tracking-[0.22em] text-cyan-100/80">主办方登录</p>
              <h1 className="font-serif text-4xl leading-tight text-balance sm:text-5xl">主办方登录后直接开始操作</h1>
              <p className="max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                登录后先查看教程，再按顺序创建赛事、上传名单、查看结果和导出 PDF。
              </p>
            </div>

            <div className="grid max-w-2xl gap-3 text-sm leading-7 text-slate-300">
              <p>1. 查看规则与教程。</p>
              <p>2. 创建赛事并上传名单。</p>
              <p>3. 查看核验结果并导出报告。</p>
            </div>
          </div>
        </section>

        <section className="flex w-full max-w-xl flex-col justify-center lg:min-w-[460px]">
          <LoginForm sampleEmail={DEMO_ACCOUNT_EMAIL} samplePassword={DEMO_ACCOUNT_PASSWORD} />

          <div className="mt-5 grid gap-2 px-2 text-sm text-muted-foreground">
            <p>© 2026 羽毛球赛事资格核验工具</p>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
