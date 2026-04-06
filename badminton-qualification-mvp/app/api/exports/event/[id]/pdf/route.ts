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
  _request: Request,
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

  const summary = {
    total: event.verificationRecords.length,
    passed: event.verificationRecords.filter((item) => item.status === "PASSED").length,
    risk: event.verificationRecords.filter((item) => item.status === "RISK").length,
    notFound: event.verificationRecords.filter((item) => item.status === "NOT_FOUND").length,
    review: event.verificationRecords.filter((item) => item.status === "REVIEW").length
  };

  const stream = await createEventPdfReport({
    eventName: event.name,
    organizerName: event.organizerName,
    exportedAt: new Date(),
    summary,
    records: event.verificationRecords.map((record) => ({
      athleteNameInput: record.athleteNameInput,
      matchedLevel: record.matchedLevel,
      status: record.status,
      remark: record.remark,
      matchedOrganization: record.matchedOrganization
    }))
  });

  const buffer = await streamToBuffer(stream);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="event-${event.id}-verification-report.pdf"`
    }
  });
}
