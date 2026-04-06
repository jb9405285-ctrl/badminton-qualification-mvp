import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "default",
  children
}: {
  className?: string;
  tone?: "default" | "risk" | "safe" | "warning" | "muted";
  children: ReactNode;
}) {
  const toneClasses = {
    default: "bg-primary/10 text-primary",
    risk: "bg-risk/10 text-risk",
    safe: "bg-safe/10 text-safe",
    warning: "bg-warning/10 text-warning",
    muted: "bg-slate-100 text-slate-600"
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
