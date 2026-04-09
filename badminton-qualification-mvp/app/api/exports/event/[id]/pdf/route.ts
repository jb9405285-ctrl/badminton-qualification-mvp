import type { User } from "@prisma/client";

import { NextResponse } from "next/server";

import { buildBatchWhereForUser, buildEventWhereForUser } from "@/lib/auth/access";
import { getCurrentUser } from "@/lib/auth/session";
import { createEventPdfReport } from "@/lib/export/report";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

async function streamToBuffer(stream: NodeJS.ReadableStream) {
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

async function findSelectedBatch(
  user: Pick<User, "role" | "organizationId">,
  eventId: string,
  batchId: string | null
) {
  if (batchId) {
    return prisma.uploadBatch.findFirst({
      where: buildBatchWhereForUser(user, {
        id: batchId,
        eventId
      }),
      include: {
        verificationRecords: {
          orderBy: [{ rowIndex: "asc" }, { createdAt: "asc" }]
        }
      }
    });
  }

  return (
    (await prisma.uploadBatch.findFirst({
      where: buildBatchWhereForUser(user, {
        eventId,
        status: "PROCESSED"
      }),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: {
        verificationRecords: {
          orderBy: [{ rowIndex: "asc" }, { createdAt: "asc" }]
        }
      }
    })) ??
    (await prisma.uploadBatch.findFirst({
      where: buildBatchWhereForUser(user, {
        eventId,
        isDeleted: false
      }),
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

  const event = await prisma.event.findFirst({
    where: buildEventWhereForUser(user, { id: params.id }),
    select: {
      id: true,
      name: true,
      organizerName: true,
      eventDate: true,
      notes: true
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
  const selectedBatch = await findSelectedBatch(user, params.id, batchId);
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

  try {
    const summary = {
      total: records.length,
      passed: records.filter((item) => item.status === "PASSED").length,
      risk: records.filter((item) => item.status === "RISK").length,
      notFound: records.filter((item) => item.status === "NOT_FOUND").length,
      review: records.filter((item) => item.status === "REVIEW").length
    };

    const stream = await createEventPdfReport({
      eventName: event.name,
      organizerName: event.organizerName,
      eventDate: event.eventDate,
      eventNotes: event.notes,
      batch: {
        id: selectedBatch.id,
        fileName: selectedBatch.originalFileName,
        uploadedAt: selectedBatch.createdAt,
        totalRows: selectedBatch.totalRows,
        processedRows: selectedBatch.processedRows,
        riskRows: selectedBatch.riskRows,
        unresolvedRows: selectedBatch.unresolvedRows
      },
      exportedAt: new Date(),
      summary,
      records: records.map((record) => ({
        rowIndex: record.rowIndex,
        athleteNameInput: record.athleteNameInput,
        matchedAthleteName: record.matchedAthleteName,
        matchedLevel: record.matchedLevel,
        matchedGender: record.matchedGender,
        matchedRegion: record.matchedRegion,
        status: record.status,
        remark: record.remark,
        matchedOrganization: record.matchedOrganization,
        matchedSourceName: record.matchedSourceName,
        isRisk: record.isRisk,
        queryTime: record.queryTime
      }))
    });

    const buffer = await streamToBuffer(stream);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="event-${event.id}-batch-${selectedBatch.id}-verification-report.pdf"`
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "PDF 导出失败。"
      },
      { status: 500 }
    );
  }
}
