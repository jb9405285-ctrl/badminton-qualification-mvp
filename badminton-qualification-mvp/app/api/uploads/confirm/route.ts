import { NextResponse } from "next/server";

import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/session";
import { processBatchVerification } from "@/lib/services/batch-service";

const confirmSchema = z.object({
  batchId: z.string().min(1, "批次 ID 缺失。"),
  eventId: z.string().min(1, "赛事 ID 缺失。"),
  nameColumn: z.string().min(1, "请选择姓名列。")
});

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      {
        ok: false,
        message: "请先登录后再执行核验。"
      },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = confirmSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "姓名列确认失败。"
      },
      { status: 400 }
    );
  }

  try {
    const result = await processBatchVerification({
      batchId: parsed.data.batchId,
      eventId: parsed.data.eventId,
      nameColumn: parsed.data.nameColumn
    });

    return NextResponse.json({
      ok: true,
      eventId: parsed.data.eventId,
      batchId: parsed.data.batchId,
      summary: result.summary
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "姓名列确认失败，请稍后再试。"
      },
      { status: 500 }
    );
  }
}
