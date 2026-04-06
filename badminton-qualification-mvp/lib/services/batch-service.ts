import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { exactMatchAthleteByName } from "@/lib/services/athlete-provider";
import { buildVerificationRecordInput, summarizeVerificationRecords } from "@/lib/services/verification";

type ProcessBatchArgs = {
  batchId: string;
  eventId: string;
  nameColumn: string;
};

export async function processBatchVerification({ batchId, eventId, nameColumn }: ProcessBatchArgs) {
  const batch = await prisma.uploadBatch.findUnique({
    where: { id: batchId }
  });

  if (!batch) {
    throw new Error("上传批次不存在。");
  }

  if (!batch.rawRowsJson) {
    throw new Error("当前批次缺少原始名单数据，无法继续核验。");
  }

  const rows = JSON.parse(batch.rawRowsJson) as Array<Record<string, string>>;

  await prisma.verificationRecord.deleteMany({
    where: { batchId }
  });

  const records: Prisma.VerificationRecordUncheckedCreateInput[] = [];

  for (const [index, row] of rows.entries()) {
    const athleteNameInput = String(row[nameColumn] ?? "").trim();

    if (!athleteNameInput) {
      records.push({
        athleteNameInput: "未填写姓名",
        eventId,
        batchId,
        rowIndex: index + 2,
        rowDataJson: JSON.stringify(row),
        status: "REVIEW",
        riskCategory: "REVIEW",
        isRisk: false,
        remark: "该行缺少姓名，需人工复核。"
      });
      continue;
    }

    const matches = await exactMatchAthleteByName(athleteNameInput);

    records.push(
      buildVerificationRecordInput({
        athleteNameInput,
        eventId,
        batchId,
        rowIndex: index + 2,
        rowDataJson: JSON.stringify(row),
        matches
      })
    );
  }

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
