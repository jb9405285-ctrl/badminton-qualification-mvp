import type { User } from "@prisma/client";
import { z } from "zod";

import { buildBatchWhereForUser } from "@/lib/auth/access";
import { prisma } from "@/lib/prisma";
import type { HistoryAction } from "@/lib/types";

export const historyListQuerySchema = z.object({
  q: z.string().trim().optional(),
  view: z.enum(["active", "archived", "deleted", "all"]).optional(),
  riskStatus: z.enum(["all", "risk", "review", "clear"]).optional(),
  uploadedById: z.string().trim().optional(),
  from: z.string().trim().optional(),
  to: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional()
});

export const historyActionSchema = z.object({
  reason: z.string().trim().max(500).optional()
});

export const historyDeleteSchema = z.object({
  confirmRiskDelete: z.boolean().optional().default(false),
  permanent: z.boolean().optional().default(false),
  reason: z.string().trim().max(500).optional()
});

export const historyBulkActionSchema = z.object({
  action: z.enum(["delete", "archive"]),
  ids: z.array(z.string().trim().min(1)).min(1),
  confirmRiskDelete: z.boolean().optional().default(false),
  permanent: z.boolean().optional().default(false),
  reason: z.string().trim().max(500).optional()
});

export class HistoryApiError extends Error {
  status: number;
  code: string;
  details?: Record<string, unknown>;

  constructor(message: string, status: number, code: string, details?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function uniqueIds(ids: string[]) {
  return Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean)));
}

function normalizeReason(reason?: string) {
  const trimmed = reason?.trim() ?? "";

  return trimmed.length > 0 ? trimmed : null;
}

async function fetchBatches(actor: User, ids: string[]) {
  const normalizedIds = uniqueIds(ids);
  const batches = await prisma.uploadBatch.findMany({
    where: buildBatchWhereForUser(actor, {
      id: { in: normalizedIds }
    }),
    include: {
      event: {
        select: {
          id: true,
          name: true,
          organizerName: true
        }
      },
      uploadedBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      deletedBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      archivedBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  if (batches.length !== normalizedIds.length) {
    const foundIds = new Set(batches.map((batch) => batch.id));
    const missingIds = normalizedIds.filter((id) => !foundIds.has(id));

    throw new HistoryApiError("部分历史记录不存在。", 404, "HISTORY_NOT_FOUND", {
      missingIds
    });
  }

  return batches;
}

async function writeAuditLogs(
  actor: User,
  batches: Awaited<ReturnType<typeof fetchBatches>>,
  action: HistoryAction | "delete_blocked" | "destroy",
  detail: Record<string, unknown>
) {
  await prisma.batchAuditLog.createMany({
    data: batches.map((batch) => ({
      batchId: batch.id,
      actorId: actor.id,
      action:
        action === "delete_blocked"
          ? "DELETE_BLOCKED"
          : action === "delete"
            ? "DELETE"
            : action === "archive"
              ? "ARCHIVE"
              : "DESTROY",
      detailJson: JSON.stringify({
        ...detail,
        batchId: batch.id,
        eventId: batch.eventId,
        originalFileName: batch.originalFileName
      })
    }))
  });
}

export async function listHistoryBatches(actor: User, filters: z.infer<typeof historyListQuerySchema>) {
  const normalized = historyListQuerySchema.parse(filters);
  const view = normalized.view ?? "active";
  const where = {
    ...(view === "active"
      ? { isDeleted: false, archivedAt: null }
      : view === "archived"
        ? { isDeleted: false, archivedAt: { not: null } }
        : view === "deleted"
          ? { isDeleted: true }
          : {}),
    ...(normalized.uploadedById ? { uploadedById: normalized.uploadedById } : {}),
    ...(normalized.from || normalized.to
      ? {
          createdAt: {
            ...(normalized.from ? { gte: new Date(normalized.from) } : {}),
            ...(normalized.to ? { lte: new Date(normalized.to) } : {})
          }
        }
      : {}),
    ...(normalized.q
      ? {
          OR: [
            {
              originalFileName: {
                contains: normalized.q
              }
            },
            {
              event: {
                is: {
                  name: {
                    contains: normalized.q
                  }
                }
              }
            },
            {
              uploadedBy: {
                is: {
                  name: {
                    contains: normalized.q
                  }
                }
              }
            },
            {
              uploadedBy: {
                is: {
                  email: {
                    contains: normalized.q
                  }
                }
              }
            }
          ]
        }
      : {}),
    ...(normalized.riskStatus === "risk"
      ? { riskRows: { gt: 0 } }
      : normalized.riskStatus === "review"
        ? { riskRows: 0, unresolvedRows: { gt: 0 } }
        : normalized.riskStatus === "clear"
          ? { riskRows: 0, unresolvedRows: 0 }
          : {})
  };

  const page = normalized.page ?? 1;
  const pageSize = normalized.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const [total, items] = await Promise.all([
    prisma.uploadBatch.count({ where: buildBatchWhereForUser(actor, where) }),
    prisma.uploadBatch.findMany({
      where: buildBatchWhereForUser(actor, where),
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        event: true,
        uploadedBy: true,
        deletedBy: true,
        archivedBy: true
      }
    })
  ]);

  return {
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    view,
    items
  };
}

async function softDeleteFetchedHistoryBatches(
  actor: User,
  batches: Awaited<ReturnType<typeof fetchBatches>>,
  options: {
    confirmRiskDelete?: boolean;
    reason?: string;
  } = {}
) {
  if (batches.some((batch) => batch.isDeleted)) {
    throw new HistoryApiError("已删除记录不能再次执行软删除。", 409, "HISTORY_ALREADY_DELETED", {
      deletedIds: batches.filter((batch) => batch.isDeleted).map((batch) => batch.id)
    });
  }

  const riskBatches = batches.filter((batch) => batch.riskRows > 0);

  if (riskBatches.length > 0 && !options.confirmRiskDelete) {
    await writeAuditLogs(actor, riskBatches, "delete_blocked", {
      reason: normalizeReason(options.reason),
      requiresConfirmation: true,
      riskBatchCount: riskBatches.length,
      riskBatchIds: riskBatches.map((batch) => batch.id)
    });

    throw new HistoryApiError("检测到风险记录，删除前需要二次确认。", 409, "HISTORY_DELETE_CONFIRMATION_REQUIRED", {
      riskBatchIds: riskBatches.map((batch) => batch.id),
      riskBatchCount: riskBatches.length
    });
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    for (const batch of batches) {
      await tx.uploadBatch.update({
        where: { id: batch.id },
        data: {
          isDeleted: true,
          deletedAt: now,
          deletedById: actor.id
        }
      });
    }

    await tx.batchAuditLog.createMany({
      data: batches.map((batch) => ({
        batchId: batch.id,
        actorId: actor.id,
        action: "DELETE",
        detailJson: JSON.stringify({
          reason: normalizeReason(options.reason),
          riskRows: batch.riskRows,
          totalRows: batch.totalRows,
          batchId: batch.id,
          eventId: batch.eventId,
          originalFileName: batch.originalFileName,
          deleteMode: "soft",
          deletedAt: now.toISOString()
        })
      }))
    });
  });

  return batches;
}

async function permanentlyDeleteFetchedHistoryBatches(
  actor: User,
  batches: Awaited<ReturnType<typeof fetchBatches>>,
  options: {
    reason?: string;
  } = {}
) {
  if (batches.some((batch) => !batch.isDeleted)) {
    throw new HistoryApiError("只能永久删除已删除记录。", 409, "HISTORY_PERMANENT_DELETE_CONFLICT", {
      activeIds: batches.filter((batch) => !batch.isDeleted).map((batch) => batch.id)
    });
  }

  // The existing audit table cascades with UploadBatch deletion, so this log
  // only exists during the transaction and is not durable after hard delete.
  await prisma.$transaction(async (tx) => {
    await tx.batchAuditLog.createMany({
      data: batches.map((batch) => ({
        batchId: batch.id,
        actorId: actor.id,
        action: "DESTROY",
        detailJson: JSON.stringify({
          reason: normalizeReason(options.reason),
          batchId: batch.id,
          eventId: batch.eventId,
          originalFileName: batch.originalFileName,
          deleteMode: "permanent",
          previousDeletedAt: batch.deletedAt?.toISOString() ?? null
        })
      }))
    });

    await tx.uploadBatch.deleteMany({
      where: {
        id: {
          in: batches.map((batch) => batch.id)
        }
      }
    });
  });

  return batches;
}

export async function deleteHistoryBatches(
  actor: User,
  ids: string[],
  options: {
    confirmRiskDelete?: boolean;
    permanent?: boolean;
    reason?: string;
  } = {}
) {
  const batches = await fetchBatches(actor, ids);
  const deletedBatches = batches.filter((batch) => batch.isDeleted);
  const activeBatches = batches.filter((batch) => !batch.isDeleted);

  if (deletedBatches.length > 0 && activeBatches.length > 0) {
    throw new HistoryApiError("请分别处理正常记录和已删除记录。", 409, "HISTORY_DELETE_MIXED_STATE", {
      deletedIds: deletedBatches.map((batch) => batch.id),
      activeIds: activeBatches.map((batch) => batch.id)
    });
  }

  if (options.permanent || deletedBatches.length === batches.length) {
    const deleted = await permanentlyDeleteFetchedHistoryBatches(actor, batches, {
      reason: options.reason
    });

    return {
      mode: "permanent" as const,
      batches: deleted
    };
  }

  const deleted = await softDeleteFetchedHistoryBatches(actor, batches, {
    confirmRiskDelete: options.confirmRiskDelete,
    reason: options.reason
  });

  return {
    mode: "soft" as const,
    batches: deleted
  };
}

export async function softDeleteHistoryBatches(
  actor: User,
  ids: string[],
  options: {
    confirmRiskDelete?: boolean;
    reason?: string;
  } = {}
) {
  const batches = await fetchBatches(actor, ids);
  return softDeleteFetchedHistoryBatches(actor, batches, options);
}

export async function permanentlyDeleteHistoryBatches(
  actor: User,
  ids: string[],
  options: {
    reason?: string;
  } = {}
) {
  const batches = await fetchBatches(actor, ids);
  return permanentlyDeleteFetchedHistoryBatches(actor, batches, options);
}

export async function archiveHistoryBatches(
  actor: User,
  ids: string[],
  options: {
    reason?: string;
  } = {}
) {
  const batches = await fetchBatches(actor, ids);

  if (batches.some((batch) => batch.isDeleted)) {
    throw new HistoryApiError("已删除的历史记录不能归档。", 409, "HISTORY_ARCHIVE_CONFLICT", {
      deletedIds: batches.filter((batch) => batch.isDeleted).map((batch) => batch.id)
    });
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    for (const batch of batches) {
      await tx.uploadBatch.update({
        where: { id: batch.id },
        data: {
          archivedAt: now,
          archivedById: actor.id
        }
      });
    }

    await tx.batchAuditLog.createMany({
      data: batches.map((batch) => ({
        batchId: batch.id,
        actorId: actor.id,
        action: "ARCHIVE",
        detailJson: JSON.stringify({
          reason: normalizeReason(options.reason),
          batchId: batch.id,
          eventId: batch.eventId,
          originalFileName: batch.originalFileName,
          archivedAt: now.toISOString()
        })
      }))
    });
  });

  return batches;
}

export async function getHistoryBatchById(actor: User, id: string) {
  const batch = await prisma.uploadBatch.findFirst({
    where: buildBatchWhereForUser(actor, { id }),
    include: {
      event: {
        select: {
          id: true,
          name: true,
          organizerName: true
        }
      },
      uploadedBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      deletedBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      archivedBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  if (!batch) {
    throw new HistoryApiError("历史记录不存在。", 404, "HISTORY_NOT_FOUND", {
      missingIds: [id]
    });
  }

  return batch;
}
