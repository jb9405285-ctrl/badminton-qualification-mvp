"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileSearch2,
  FolderKanban,
  LayoutDashboard,
  Settings2,
  ShieldAlert,
  History
} from "lucide-react";

import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "概览", icon: LayoutDashboard },
  { href: "/dashboard/events", label: "赛事管理", icon: FolderKanban },
  { href: "/dashboard/batch-check", label: "上传名单", icon: FileSearch2 },
  { href: "/dashboard/history", label: "批次留痕", icon: History },
  { href: "/dashboard/settings", label: "教程", icon: Settings2 }
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="dashboard-grid hidden w-80 shrink-0 border-r border-white/10 bg-[#06111c] px-5 py-6 text-white lg:block">
      <div className="rounded-[28px] border border-cyan-400/15 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(3,7,18,0.92))] p-5 shadow-panel">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-cyan-400/10 p-3 text-cyan-200">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/80">主办方工作台</p>
            <h2 className="mt-2 font-serif text-2xl leading-tight text-white">{APP_NAME}</h2>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-300">先看教程，再进行创建赛事、上传名单、查看结果和导出 PDF。</p>
      </div>

      <nav className="mt-6 space-y-2">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                isActive
                  ? "bg-white text-slate-950 shadow-soft"
                  : "text-slate-200/92 hover:bg-white/8 hover:text-white"
              )}
              href={item.href}
              key={item.href}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
