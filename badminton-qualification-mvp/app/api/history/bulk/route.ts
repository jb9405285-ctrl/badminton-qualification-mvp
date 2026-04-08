import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";

import {
  archiveHistoryBatches,
  deleteHistoryBatches,
  HistoryApiError,
  historyBulkActionSchema
} from "../_actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      {
        ok: false,
        message: "请先登录后再执行批量操作。"
      },
      { status: 401 }
    );
  }

  try {
    const body = await request.json().catch(() => null);
    const parsed = historyBulkActionSchema.safeParse(body ?? {});

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          message: parsed.error.issues[0]?.message ?? "批量操作参数不合法。"
        },
        { status: 400 }
      );
    }

    const result =
      parsed.data.action === "delete"
        ? await deleteHistoryBatches(user, parsed.data.ids, {
            confirmRiskDelete: parsed.data.confirmRiskDelete,
            permanent: parsed.data.permanent,
            reason: parsed.data.reason
          })
        : {
            mode: "archive" as const,
            batches: await archiveHistoryBatches(user, parsed.data.ids, {
              reason: parsed.data.reason
            })
          };

    return NextResponse.json({
      ok: true,
      action: parsed.data.action,
      mode: result.mode,
      ids: result.batches.map((batch) => batch.id)
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
        message: error instanceof Error ? error.message : "批量操作失败。"
      },
      { status: 500 }
    );
  }
}
