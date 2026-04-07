import { redirect } from "next/navigation";

import { LoginForm } from "@/components/dashboard/login-form";
import { PublicShell } from "@/components/layout/public-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DEMO_ACCOUNT_EMAIL, DEMO_ACCOUNT_PASSWORD } from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <PublicShell>
      <main className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-12 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-6">
          <p className="text-sm uppercase tracking-[0.28em] text-primary">Organizer Console</p>
          <h1 className="font-serif text-4xl leading-tight">赛事主办方核验后台</h1>
          <p className="max-w-xl text-base leading-8 text-muted-foreground">
            登录后即可创建赛事、上传报名名单、筛查高等级运动员、补充人工备注，并导出 CSV 与 PDF 核验报告。
          </p>

          <Card className="bg-slate-950 text-white shadow-panel">
            <CardHeader>
              <CardTitle>后台账号</CardTitle>
              <CardDescription className="text-slate-300">
                当前版本使用固定后台账号，可直接进入赛事核验后台。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-7 text-slate-200">
              <p>账号：{DEMO_ACCOUNT_EMAIL}</p>
              <p>密码：{DEMO_ACCOUNT_PASSWORD}</p>
              <p>风险规则：二级运动员及以上统一视为风险，不可参加业余赛事。</p>
            </CardContent>
          </Card>
        </div>
        <div className="max-w-lg justify-self-end">
          <LoginForm defaultEmail={DEMO_ACCOUNT_EMAIL} defaultPassword={DEMO_ACCOUNT_PASSWORD} />
        </div>
      </main>
    </PublicShell>
  );
}
