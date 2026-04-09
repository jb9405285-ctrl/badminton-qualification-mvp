import type { Prisma, User } from "@prisma/client";

import { buildBatchWhereForUser, buildEventWhereForUser, buildVerificationWhereForUser } from "@/lib/auth/access";
import { prisma } from "@/lib/prisma";
import type { HistoryRiskFilter } from "@/lib/types";

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

async function countActiveBatchesForEvent(user: Pick<User, "role" | "organizationId">, eventId: string) {
  const batchWhere = buildBatchWhereForUser(user, {
    eventId,
    isDeleted: false
  });
  const verificationWhere = buildVerificationWhereForUser(user, {
    eventId,
    batch: {
      is: {
        isDeleted: false
      }
    }
  });

  const [batchCount, verificationRecordCount] = await Promise.all([
    prisma.uploadBatch.count({
      where: batchWhere
    }),
    prisma.verificationRecord.count({
      where: verificationWhere
    })
  ]);

  return {
    batches: batchCount,
    verificationRecords: verificationRecordCount
  };
}

export async function getDashboardSummary(user: Pick<User, "role" | "organizationId">) {
  const eventWhere = buildEventWhereForUser(user);
  const batchWhere = buildBatchWhereForUser(user, activeUploadBatchWhere);

  const [eventCount, batchCount, latestEvent, latestBatches, eventsWithLatestBatch] = await Promise.all([
    prisma.event.count({ where: eventWhere }),
    prisma.uploadBatch.count({
      where: batchWhere
    }),
    prisma.event.findFirst({
      where: eventWhere,
      orderBy: { createdAt: "desc" }
    }),
    prisma.uploadBatch.findMany({
      where: batchWhere,
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        event: true
      }
    }),
    prisma.event.findMany({
      where: eventWhere,
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
            where: buildVerificationWhereForUser(user, {
              batchId: { in: latestBatchIds },
              status: "RISK"
            })
          }),
          prisma.verificationRecord.count({
            where: buildVerificationWhereForUser(user, {
              batchId: { in: latestBatchIds },
              status: "REVIEW"
            })
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

export async function getEventList(user: Pick<User, "role" | "organizationId">) {
  const events = await prisma.event.findMany({
    where: buildEventWhereForUser(user),
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
      const counts = await countActiveBatchesForEvent(user, event.id);

      return {
        ...event,
        _count: counts
      };
    })
  );
}

export async function getHistoryList(
  user: Pick<User, "role" | "organizationId">,
  filters: HistoryListFilters = {}
) {
  return prisma.uploadBatch.findMany({
    where: buildBatchWhereForUser(user, buildHistoryBatchWhere(filters)),
    orderBy: { createdAt: "desc" },
    include: {
      event: true,
      uploadedBy: true,
      deletedBy: true,
      archivedBy: true
    }
  });
}

export async function getEventDetail(user: Pick<User, "role" | "organizationId">, id: string) {
  return prisma.event.findFirst({
    where: buildEventWhereForUser(user, { id }),
    include: {
      createdBy: true,
      batches: {
        where: activeUploadBatchWhere,
        orderBy: { createdAt: "desc" }
      },
      verificationRecords: {
        where: buildVerificationWhereForUser(user, {
          batch: {
            is: activeUploadBatchWhere
          }
        }),
        orderBy: [{ rowIndex: "asc" }, { createdAt: "asc" }]
      }
    }
  });
}
