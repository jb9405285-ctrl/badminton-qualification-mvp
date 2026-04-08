import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";

import {
  archiveHistoryBatches,
  deleteHistoryBatches,
  getHistoryBatchById,
  historyActionSchema,
  historyDeleteSchema,
  HistoryApiError,
} from "../_actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
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
        message: "请先登录后再删除历史记录。"
      },
      { status: 401 }
    );
  }

  try {
    await getHistoryBatchById(params.id);
    const body = await request.json().catch(() => null);
    const parsed = historyDeleteSchema.safeParse(body ?? {});

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          message: parsed.error.issues[0]?.message ?? "删除参数不合法。"
        },
        { status: 400 }
      );
    }

    const result = await deleteHistoryBatches(user, [params.id], {
      confirmRiskDelete: parsed.data.confirmRiskDelete,
      permanent: parsed.data.permanent,
      reason: parsed.data.reason
    });

    return NextResponse.json({
      ok: true,
      action: "delete",
      mode: result.mode,
      id: params.id
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
        message: error instanceof Error ? error.message : "删除历史记录失败。"
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
        message: "请先登录后再归档历史记录。"
      },
      { status: 401 }
    );
  }

  try {
    await getHistoryBatchById(params.id);
    const body = await request.json().catch(() => null);
    const parsed = historyActionSchema.safeParse(body ?? {});

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          message: parsed.error.issues[0]?.message ?? "归档参数不合法。"
        },
        { status: 400 }
      );
    }

    await archiveHistoryBatches(user, [params.id], {
      reason: parsed.data.reason
    });

    return NextResponse.json({
      ok: true,
      action: "archive",
      id: params.id
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
        message: error instanceof Error ? error.message : "归档历史记录失败。"
      },
      { status: 500 }
    );
  }
}
