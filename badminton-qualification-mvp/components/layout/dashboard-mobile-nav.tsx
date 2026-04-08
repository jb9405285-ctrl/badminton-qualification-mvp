"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "概览" },
  { href: "/dashboard/events", label: "赛事" },
  { href: "/dashboard/batch-check", label: "名单" },
  { href: "/dashboard/history", label: "批次" },
  { href: "/dashboard/settings", label: "教程" }
];

export function DashboardMobileNav() {
  const pathname = usePathname();

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            className={cn(
              "whitespace-nowrap rounded-full border px-3 py-2 text-sm font-medium transition",
              active
                ? "border-primary/20 bg-primary text-primary-foreground shadow-soft"
                : "border-slate-200/90 bg-white/88 text-slate-700"
            )}
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
