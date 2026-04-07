import { prisma } from "@/lib/prisma";

export async function getDashboardSummary() {
  const [eventCount, batchCount, latestEvent, latestBatches, eventsWithLatestBatch] = await Promise.all([
    prisma.event.count(),
    prisma.uploadBatch.count(),
    prisma.event.findFirst({
      orderBy: { createdAt: "desc" }
    }),
    prisma.uploadBatch.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        event: true
      }
    }),
    prisma.event.findMany({
      select: {
        batches: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: {
            id: true
          }
        }
      }
    })
  ]);
  const latestBatchIds = eventsWithLatestBatch.flatMap((event) => event.batches.map((batch) => batch.id));
  const [riskCount, reviewCount] =
    latestBatchIds.length > 0
      ? await Promise.all([
          prisma.verificationRecord.count({
            where: {
              batchId: { in: latestBatchIds },
              status: "RISK"
            }
          }),
          prisma.verificationRecord.count({
            where: {
              batchId: { in: latestBatchIds },
              status: "REVIEW"
            }
          })
        ])
      : [0, 0];

  return {
    eventCount,
    batchCount,
    riskCount,
    reviewCount,
    latestEvent,
    latestBatches
  };
}

export async function getEventList() {
  return prisma.event.findMany({
    orderBy: [{ eventDate: "desc" }, { createdAt: "desc" }],
    include: {
      batches: {
        take: 1,
        orderBy: { createdAt: "desc" }
      },
      _count: {
        select: {
          batches: true,
          verificationRecords: true
        }
      }
    }
  });
}

export async function getHistoryList() {
  return prisma.uploadBatch.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      event: true
    }
  });
}

export async function getEventDetail(id: string) {
  return prisma.event.findUnique({
    where: { id },
    include: {
      createdBy: true,
      batches: {
        orderBy: { createdAt: "desc" }
      },
      verificationRecords: {
        orderBy: [{ rowIndex: "asc" }, { createdAt: "asc" }]
      }
    }
  });
}
