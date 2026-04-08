import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import type { HistoryBatchListItem } from "@/lib/types";

import { HistoryApiError, historyListQuerySchema, listHistoryBatches } from "./_actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      {
        ok: false,
        message: "请先登录后再查看历史记录。"
      },
      { status: 401 }
    );
  }

  try {
    const url = new URL(request.url);
    const parsed = historyListQuerySchema.safeParse({
      q: url.searchParams.get("q") ?? undefined,
      view: url.searchParams.get("view") ?? undefined,
      riskStatus: url.searchParams.get("riskStatus") ?? undefined,
      uploadedById: url.searchParams.get("uploadedById") ?? undefined,
      from: url.searchParams.get("from") ?? undefined,
      to: url.searchParams.get("to") ?? undefined,
      page: url.searchParams.get("page") ?? undefined,
      pageSize: url.searchParams.get("pageSize") ?? undefined
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          message: parsed.error.issues[0]?.message ?? "历史记录筛选参数不合法。"
        },
        { status: 400 }
      );
    }

    const result = await listHistoryBatches(parsed.data);

    const items: HistoryBatchListItem[] = result.items.map((batch) => ({
      id: batch.id,
      eventId: batch.eventId,
      originalFileName: batch.originalFileName,
      fileType: batch.fileType,
      status: batch.status,
      totalRows: batch.totalRows,
      processedRows: batch.processedRows,
      matchedRows: batch.matchedRows,
      riskRows: batch.riskRows,
      unresolvedRows: batch.unresolvedRows,
      createdAt: batch.createdAt.toISOString(),
      updatedAt: batch.updatedAt.toISOString(),
      isDeleted: batch.isDeleted,
      deletedAt: batch.deletedAt ? batch.deletedAt.toISOString() : null,
      archivedAt: batch.archivedAt ? batch.archivedAt.toISOString() : null,
      uploadedBy: {
        id: batch.uploadedBy.id,
        name: batch.uploadedBy.name,
        email: batch.uploadedBy.email
      },
      event: {
        id: batch.event.id,
        name: batch.event.name,
        organizerName: batch.event.organizerName
      }
    }));

    return NextResponse.json({
      ok: true,
      view: result.view,
      page: result.page,
      pageSize: result.pageSize,
      pageCount: result.pageCount,
      total: result.total,
      items
    });
  } catch (error) {
    if (error instanceof HistoryApiError) {
      return NextResponse.json(
        {
          ok: false,
          message: error.message,
          code: error.code,
          details: error.details
        },
        { status: error.status }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "历史记录查询失败。"
      },
      { status: 500 }
    );
  }
}
