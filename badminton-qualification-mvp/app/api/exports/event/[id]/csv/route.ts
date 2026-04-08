import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { createVerificationCsv } from "@/lib/export/report";
import { formatDateTime, formatStatusLabel } from "@/lib/format";
import { prisma } from "@/lib/prisma";

async function findSelectedBatch(eventId: string, batchId: string | null) {
  if (batchId) {
    return prisma.uploadBatch.findFirst({
      where: {
        id: batchId,
        eventId
      },
      include: {
        verificationRecords: {
          orderBy: [{ rowIndex: "asc" }, { createdAt: "asc" }]
        }
      }
    });
  }

  return (
    (await prisma.uploadBatch.findFirst({
      where: {
        eventId,
        status: "PROCESSED"
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: {
        verificationRecords: {
          orderBy: [{ rowIndex: "asc" }, { createdAt: "asc" }]
        }
      }
    })) ??
    (await prisma.uploadBatch.findFirst({
      where: {
        eventId,
        isDeleted: false
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: {
        verificationRecords: {
          orderBy: [{ rowIndex: "asc" }, { createdAt: "asc" }]
        }
      }
    }))
  );
}

export async function GET(
  request: Request,
  {
    params
  }: {
    params: {
      id: string;
    };
  }
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      {
        ok: false,
        message: "请先登录后再导出。"
      },
      { status: 401 }
    );
  }

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true
    }
  });

  if (!event) {
    return NextResponse.json(
      {
        ok: false,
        message: "赛事不存在。"
      },
      { status: 404 }
    );
  }

  const url = new URL(request.url);
  const batchId = url.searchParams.get("batchId");
  const selectedBatch = await findSelectedBatch(params.id, batchId);
  const records = selectedBatch?.verificationRecords ?? [];

  if (batchId && !selectedBatch) {
    return NextResponse.json(
      {
        ok: false,
        message: "核验批次不存在。"
      },
      { status: 404 }
    );
  }

  if (!selectedBatch) {
    return NextResponse.json(
      {
        ok: false,
        message: "当前赛事还没有可导出的核验批次。"
      },
      { status: 404 }
    );
  }

  const csv = createVerificationCsv(
    records.map((record, index) => ({
      序号: String(index + 1),
      原始行号: record.rowIndex ? String(record.rowIndex) : "",
      赛事名称: event.name,
      核验批次: selectedBatch.originalFileName,
      名单姓名: record.athleteNameInput,
      匹配结果: record.matchedAthleteName ?? "未查到",
      等级: record.matchedLevel ?? "--",
      性别: record.matchedGender ?? "--",
      地区: record.matchedRegion ?? "--",
      单位: record.matchedOrganization ?? "--",
      数据来源: record.matchedSourceName ?? "--",
      状态: formatStatusLabel(record.status),
      人工备注: record.remark ?? "",
      查询时间: formatDateTime(record.queryTime)
    }))
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="event-${event.id}-batch-${selectedBatch.id}-verification.csv"`
    }
  });
}
