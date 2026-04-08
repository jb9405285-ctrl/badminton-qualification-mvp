import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "default"
}: {
  label: string;
  value: string | number;
  hint: string;
  icon?: LucideIcon;
  accent?: "default" | "risk" | "warning" | "safe";
}) {
  const iconTone =
    accent === "risk"
      ? "border-rose-200 bg-rose-50 text-risk"
      : accent === "warning"
        ? "border-amber-200 bg-amber-50 text-warning"
        : accent === "safe"
          ? "border-emerald-200 bg-emerald-50 text-safe"
          : "border-slate-200 bg-slate-100 text-slate-700";

  return (
    <Card className="metric-ink border-slate-200/80 shadow-soft">
      <CardHeader className="relative pb-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">{label}</p>
      </CardHeader>
      <CardContent className="relative pt-0">
        <div className="flex items-end justify-between gap-4">
          <div className="text-5xl font-serif font-semibold tracking-tight text-slate-950">{value}</div>
          {Icon ? (
            <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl border", iconTone)}>
              <Icon className="h-5 w-5" />
            </div>
          ) : null}
        </div>
        <div className="fine-divider mt-4 h-px w-full" />
        <p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
