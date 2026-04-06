import { prisma } from "@/lib/prisma";

export async function getDashboardSummary() {
  const [eventCount, batchCount, riskCount, reviewCount, latestEvent, latestBatches] =
    await Promise.all([
      prisma.event.count(),
      prisma.uploadBatch.count(),
      prisma.verificationRecord.count({ where: { status: "RISK" } }),
      prisma.verificationRecord.count({ where: { status: "REVIEW" } }),
      prisma.event.findFirst({
        orderBy: { createdAt: "desc" }
      }),
      prisma.uploadBatch.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          event: true
        }
      })
    ]);

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
        orderBy: [{ createdAt: "desc" }, { rowIndex: "asc" }]
      }
    }
  });
}
