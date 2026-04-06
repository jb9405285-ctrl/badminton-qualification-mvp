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
    <Card className="metric-ink halo-panel border-white/70">
      <CardHeader className="relative pb-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">{label}</p>
      </CardHeader>
      <CardContent className="relative">
        <div className="text-4xl font-semibold tracking-tight text-slate-950">{value}</div>
        <p className="mt-3 max-w-xs text-sm leading-6 text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
