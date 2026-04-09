import { HistoryManagementClient } from "@/components/dashboard/history-management-client";
import { buildBatchWhereForUser } from "@/lib/auth/access";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const user = await requireUser();
  const batches = await prisma.uploadBatch.findMany({
    where: buildBatchWhereForUser(user),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    include: {
      event: {
        include: {
          createdBy: {
            select: {
              name: true
            }
          }
        }
      },
      uploadedBy: {
        select: {
          name: true
        }
      },
      verificationRecords: {
        select: {
          athleteNameInput: true,
          status: true,
          isRisk: true
        }
      }
    }
  });

  return (
    <HistoryManagementClient
      batches={batches.map((batch) => ({
        id: batch.id,
        originalFileName: batch.originalFileName,
        status: batch.status,
        createdAt: batch.createdAt.toISOString(),
        updatedAt: batch.updatedAt.toISOString(),
        totalRows: batch.totalRows,
        processedRows: batch.processedRows,
        matchedRows: batch.matchedRows,
        riskRows: batch.riskRows,
        unresolvedRows: batch.unresolvedRows,
        eventId: batch.eventId,
        eventName: batch.event.name,
        eventDate: batch.event.eventDate.toISOString(),
        organizerName: batch.event.organizerName,
        operatorName: batch.uploadedBy?.name ?? batch.event.createdBy.name,
        athleteNames: Array.from(
          new Set(
            batch.verificationRecords.map((record) => record.athleteNameInput).filter(Boolean)
          )
        ),
        isArchived: Boolean(batch.archivedAt),
        isDeleted: batch.isDeleted,
        archivedAt: batch.archivedAt ? batch.archivedAt.toISOString() : null,
        deletedAt: batch.deletedAt ? batch.deletedAt.toISOString() : null
      }))}
    />
  );
}
