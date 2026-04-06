import { Badge } from "@/components/ui/badge";
import { formatStatusLabel } from "@/lib/format";

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "RISK" || status === "FAILED"
      ? "risk"
      : status === "PASSED" || status === "PROCESSED"
        ? "safe"
        : status === "REVIEW" || status === "NEEDS_MAPPING"
          ? "warning"
          : "muted";

  return <Badge tone={tone}>{formatStatusLabel(status)}</Badge>;
}
