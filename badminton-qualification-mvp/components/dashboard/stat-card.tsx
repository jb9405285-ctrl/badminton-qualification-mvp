import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  hint
}: {
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <Card className="metric-ink border-slate-200/80 shadow-soft">
      <CardHeader className="relative pb-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">{label}</p>
      </CardHeader>
      <CardContent className="relative pt-0">
        <div className="flex items-end justify-between gap-4">
          <div className="text-5xl font-serif font-semibold tracking-tight text-slate-950">{value}</div>
          <div className="h-12 w-12 rounded-2xl border border-slate-200 bg-slate-950/95" />
        </div>
        <div className="fine-divider mt-4 h-px w-full" />
        <p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
