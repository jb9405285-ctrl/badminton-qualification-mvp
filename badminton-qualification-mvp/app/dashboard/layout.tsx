import type { ReactNode } from "react";

import { DashboardMobileNav } from "@/components/layout/dashboard-mobile-nav";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { LogoutButton } from "@/components/layout/logout-button";
import { isSuperAdmin } from "@/lib/auth/access";
import { requireUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children
}: {
  children: ReactNode;
}) {
  const user = await requireUser();
  const canReviewApplications = isSuperAdmin(user);

  return (
    <div className="dashboard-stage flex min-h-screen">
      <DashboardSidebar canReviewApplications={canReviewApplications} />
      <main className="flex-1">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-6 md:px-8">
          <header className="dashboard-panel flex flex-col gap-4 rounded-[30px] border border-white/80 p-5 md:p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
                  {canReviewApplications ? "平台管理台" : "主办方工作台"}
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">先看教程，再开始操作</h1>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {canReviewApplications
                    ? "你可以审批主办方申请，也可以进入演示或正式工作流做完整验证。"
                    : "按“查看教程、创建赛事、上传名单、查看结果、导出 PDF”的顺序完成一次完整流程。"}
                </p>
              </div>
              <LogoutButton />
            </div>
            <DashboardMobileNav canReviewApplications={canReviewApplications} />
          </header>
          {children}
        </div>
      </main>
    </div>
  );
}
