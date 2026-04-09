import type { Prisma } from "@prisma/client";

import { normalizeName } from "@/lib/eligibility";
import { prisma } from "@/lib/prisma";
import { searchAthleteByName } from "@/lib/services/athlete-provider";
import {
  buildVerificationRecordInputFromSearchResults,
  summarizeVerificationRecords
} from "@/lib/services/verification";

type ProcessBatchArgs = {
  batchId: string;
  eventId: string;
  nameColumn: string;
};

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T, index: number) => Promise<R>
) {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  const workerCount = Math.min(limit, items.length);

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (nextIndex < items.length) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        results[currentIndex] = await mapper(items[currentIndex], currentIndex);
      }
    })
  );

  return results;
}

export async function processBatchVerification({ batchId, eventId, nameColumn }: ProcessBatchArgs) {
  const batch = await prisma.uploadBatch.findUnique({
    where: { id: batchId }
  });

  if (!batch) {
    throw new Error("上传批次不存在。");
  }

  if (batch.eventId !== eventId) {
    throw new Error("批次与赛事不匹配。");
  }

  if (!batch.rawRowsJson) {
    throw new Error("当前批次缺少原始名单数据，无法继续核验。");
  }

  const rows = JSON.parse(batch.rawRowsJson) as Array<Record<string, string>>;

  await prisma.verificationRecord.deleteMany({
    where: { batchId }
  });

  const searchCache = new Map<string, ReturnType<typeof searchAthleteByName>>();
  const rowEntries = rows.map((row, index) => ({ row, index }));

  function searchOnce(athleteNameInput: string) {
    const key = normalizeName(athleteNameInput);
    const cached = searchCache.get(key);

    if (cached) {
      return cached;
    }

    const promise = searchAthleteByName(athleteNameInput, { includeHint: false });
    searchCache.set(key, promise);

    return promise;
  }

  const records: Prisma.VerificationRecordUncheckedCreateInput[] = await mapWithConcurrency(
    rowEntries,
    6,
    async ({ row, index }) => {
      const athleteNameInput = String(row[nameColumn] ?? "").trim();

      if (!athleteNameInput) {
        return {
          athleteNameInput: "未填写姓名",
          eventId,
          batchId,
          rowIndex: index + 2,
          rowDataJson: JSON.stringify(row),
          status: "REVIEW",
          riskCategory: "REVIEW",
          isRisk: false,
          remark: "该行缺少姓名，需人工复核。"
        };
      }

      try {
        const payload = await searchOnce(athleteNameInput);

        return buildVerificationRecordInputFromSearchResults({
          athleteNameInput,
          eventId,
          batchId,
          rowIndex: index + 2,
          rowDataJson: JSON.stringify(row),
          matches: payload.results,
          notFoundRemark: payload.hintMessage || "未在当前实时数据源中查到记录。"
        });
      } catch (error) {
        return {
          athleteNameInput,
          eventId,
          batchId,
          rowIndex: index + 2,
          rowDataJson: JSON.stringify(row),
          status: "REVIEW",
          riskCategory: "REVIEW",
          isRisk: false,
          remark:
            error instanceof Error
              ? `查询接口异常，需人工复核。原因：${error.message}`
              : "查询接口异常，需人工复核。"
        };
      }
    }
  );

  if (records.length > 0) {
    await prisma.verificationRecord.createMany({
      data: records
    });
  }

  const savedRecords = await prisma.verificationRecord.findMany({
    where: { batchId }
  });

  const summary = summarizeVerificationRecords(savedRecords);

  await prisma.uploadBatch.update({
    where: { id: batchId },
    data: {
      status: "PROCESSED",
      detectedNameColumn: nameColumn,
      totalRows: rows.length,
      processedRows: summary.total,
      matchedRows: summary.matched,
      riskRows: summary.risk,
      unresolvedRows: summary.notFound + summary.review,
      summaryJson: JSON.stringify(summary),
      errorMessage: null
    }
  });

  return {
    batchId,
    nameColumn,
    summary
  };
}
