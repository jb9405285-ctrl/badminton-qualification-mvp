import type { ReactNode } from "react";

import { DashboardMobileNav } from "@/components/layout/dashboard-mobile-nav";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { LogoutButton } from "@/components/layout/logout-button";
import { requireUser } from "@/lib/auth/session";

export default async function DashboardLayout({
  children
}: {
  children: ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen bg-[linear-gradient(180deg,#ecf2f7,#f5f8fb)]">
      <DashboardSidebar />
      <main className="flex-1">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-6 md:px-8">
          <header className="halo-panel flex flex-col gap-4 rounded-[28px] border border-white/80 bg-white/88 p-5 shadow-soft">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Organizer Workspace</p>
                <h1 className="mt-2 text-xl font-semibold text-slate-950">{user.name}</h1>
                <p className="text-sm text-muted-foreground">{user.email}</p>
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
