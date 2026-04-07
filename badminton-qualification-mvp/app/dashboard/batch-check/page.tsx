import { BatchCheckClient } from "@/components/dashboard/batch-check-client";
import { getEventList, getHistoryList } from "@/lib/services/dashboard-service";

export const dynamic = "force-dynamic";

export default async function BatchCheckPage({
  searchParams
}: {
  searchParams?: {
    eventId?: string;
  };
}) {
  const [events, batches] = await Promise.all([getEventList(), getHistoryList()]);

  return (
    <BatchCheckClient
      events={events.map((item) => ({
        id: item.id,
        name: item.name,
        organizerName: item.organizerName
      }))}
      preselectedEventId={searchParams?.eventId}
      recentBatches={batches.slice(0, 8).map((batch) => ({
        id: batch.id,
        originalFileName: batch.originalFileName,
        status: batch.status,
        createdAt: batch.createdAt.toISOString(),
        riskRows: batch.riskRows,
        eventId: batch.eventId,
        eventName: batch.event.name
      }))}
    />
  );
}
