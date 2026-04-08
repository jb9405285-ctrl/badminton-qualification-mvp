import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type SummaryTone = "default" | "safe" | "warning" | "risk";

type SummaryItem = {
  label: string;
  value: string | number;
  note: string;
  tone?: SummaryTone;
};

const toneClasses: Record<SummaryTone, string> = {
  default: "border-slate-200 bg-white text-slate-950",
  safe: "border-emerald-200 bg-emerald-50 text-emerald-950",
  warning: "border-amber-200 bg-amber-50 text-amber-950",
  risk: "border-rose-200 bg-rose-50 text-rose-950"
};

export function HistorySummaryStrip({
  eyebrow,
  title,
  description,
  scopeNote,
  items
}: {
  eyebrow: string;
  title: string;
  description: string;
  scopeNote: string;
  items: SummaryItem[];
}) {
  return (
    <Card className="dashboard-panel border-white/80 shadow-sm">
      <CardHeader className="pb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-500">{eyebrow}</p>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription className="mt-1 max-w-2xl text-sm">{description}</CardDescription>
          </div>
          <div className="rounded-full border border-slate-200/80 bg-slate-50/90 px-3 py-1.5 text-xs font-medium text-slate-600">
            {scopeNote}
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div
            className={cn("dashboard-inset flex flex-col gap-1.5 p-4 shadow-none", toneClasses[item.tone ?? "default"])}
            key={item.label}
          >
            <p className="text-sm font-medium text-slate-600">{item.label}</p>
            <span className="text-2xl font-semibold tracking-tight">{item.value}</span>
            <p className="text-xs leading-5 text-slate-500">{item.note}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
