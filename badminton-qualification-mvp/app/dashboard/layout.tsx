import type { ReactNode } from "react";

import { DashboardMobileNav } from "@/components/layout/dashboard-mobile-nav";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { LogoutButton } from "@/components/layout/logout-button";
import { requireUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children
}: {
  children: ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="dashboard-stage flex min-h-screen">
      <DashboardSidebar />
      <main className="flex-1">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-6 md:px-8">
          <header className="dashboard-panel flex flex-col gap-5 rounded-[30px] border border-white/80 p-5 md:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Organizer Workspace</p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{user.name}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
              </div>
              <LogoutButton />
            </div>
            <DashboardMobileNav />
          </header>
          {children}
        </div>
      </main>
    </div>
  );
}
