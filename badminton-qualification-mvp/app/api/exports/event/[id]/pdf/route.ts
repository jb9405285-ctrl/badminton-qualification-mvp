import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { createEventPdfReport } from "@/lib/export/report";
import { getEventDetail } from "@/lib/services/dashboard-service";

export const runtime = "nodejs";

async function streamToBuffer(stream: NodeJS.ReadableStream) {
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
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

  const event = await getEventDetail(params.id);

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
  const selectedBatch = batchId ? event.batches.find((batch) => batch.id === batchId) : event.batches[0] ?? null;
  const records = selectedBatch
    ? event.verificationRecords.filter((record) => record.batchId === selectedBatch.id)
    : [];

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
}
