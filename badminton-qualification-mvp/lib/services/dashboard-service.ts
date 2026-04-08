import type { Prisma } from "@prisma/client";

import type { HistoryRiskFilter } from "@/lib/types";
import { prisma } from "@/lib/prisma";

export type HistoryListFilters = {
  query?: string;
  riskStatus?: HistoryRiskFilter;
  uploadedById?: string;
  from?: string | Date;
  to?: string | Date;
  includeDeleted?: boolean;
  includeArchived?: boolean;
};

const activeUploadBatchWhere: Prisma.UploadBatchWhereInput = {
  isDeleted: false
};

function normalizeSearchTerm(value?: string) {
  return value?.trim() ?? "";
}

function toDateOrNull(value?: string | Date) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function buildHistoryBatchWhere(filters: HistoryListFilters = {}): Prisma.UploadBatchWhereInput {
  const query = normalizeSearchTerm(filters.query);
  const from = toDateOrNull(filters.from);
  const to = toDateOrNull(filters.to);
  const riskStatus = filters.riskStatus ?? "all";

  const where: Prisma.UploadBatchWhereInput = {
    ...(filters.includeDeleted ? {} : activeUploadBatchWhere)
  };

  if (filters.includeArchived === false) {
    where.archivedAt = null;
  }

  if (filters.uploadedById) {
    where.uploadedById = filters.uploadedById;
  }

  if (query) {
    where.OR = [
      {
        originalFileName: {
          contains: query
        }
      },
      {
        event: {
          is: {
            name: {
              contains: query
            }
          }
        }
      },
      {
        uploadedBy: {
          is: {
            name: {
              contains: query
            }
          }
        }
      },
      {
        uploadedBy: {
          is: {
            email: {
              contains: query
            }
          }
        }
      }
    ];
  }

  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {})
    };
  }

  if (riskStatus === "risk") {
    where.riskRows = { gt: 0 };
  } else if (riskStatus === "review") {
    where.unresolvedRows = { gt: 0 };
    where.riskRows = 0;
  } else if (riskStatus === "clear") {
    where.riskRows = 0;
    where.unresolvedRows = 0;
  }

  return where;
}

async function countActiveBatchesForEvent(eventId: string) {
  const [batchCount, verificationRecordCount] = await Promise.all([
    prisma.uploadBatch.count({
      where: {
        eventId,
        isDeleted: false
      }
    }),
    prisma.verificationRecord.count({
      where: {
        eventId,
        batch: {
          is: {
            isDeleted: false
          }
        }
      }
    })
  ]);

  return {
    batches: batchCount,
    verificationRecords: verificationRecordCount
  };
}

export async function getDashboardSummary() {
  const [eventCount, batchCount, latestEvent, latestBatches, eventsWithLatestBatch] = await Promise.all([
    prisma.event.count(),
    prisma.uploadBatch.count({
      where: activeUploadBatchWhere
    }),
    prisma.event.findFirst({
      orderBy: { createdAt: "desc" }
    }),
    prisma.uploadBatch.findMany({
      where: activeUploadBatchWhere,
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        event: true
      }
    }),
    prisma.event.findMany({
      select: {
        batches: {
          where: activeUploadBatchWhere,
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
  const events = await prisma.event.findMany({
    orderBy: [{ eventDate: "desc" }, { createdAt: "desc" }],
    include: {
      batches: {
        where: activeUploadBatchWhere,
        take: 1,
        orderBy: { createdAt: "desc" }
      }
    }
  });

  return Promise.all(
    events.map(async (event) => {
      const counts = await countActiveBatchesForEvent(event.id);

      return {
        ...event,
        _count: counts
      };
    })
  );
}

export async function getHistoryList(filters: HistoryListFilters = {}) {
  return prisma.uploadBatch.findMany({
    where: buildHistoryBatchWhere(filters),
    orderBy: { createdAt: "desc" },
    include: {
      event: true,
      uploadedBy: true,
      deletedBy: true,
      archivedBy: true
    }
  });
}

export async function getEventDetail(id: string) {
  return prisma.event.findUnique({
    where: { id },
    include: {
      createdBy: true,
      batches: {
        where: activeUploadBatchWhere,
        orderBy: { createdAt: "desc" }
      },
      verificationRecords: {
        where: {
          batch: {
            is: activeUploadBatchWhere
          }
        },
        orderBy: [{ rowIndex: "asc" }, { createdAt: "asc" }]
      }
    }
  });
}
