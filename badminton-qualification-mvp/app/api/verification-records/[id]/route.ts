import { NextResponse } from "next/server";

import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const remarkSchema = z.object({
  remark: z.string().max(500, "备注长度不能超过 500 字。")
});

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
        message: "请先登录后再修改备注。"
      },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = remarkSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "备注内容不合法。"
      },
      { status: 400 }
    );
  }

  await prisma.verificationRecord.update({
    where: { id: params.id },
    data: {
      remark: parsed.data.remark
    }
  });

  return NextResponse.json({
    ok: true
  });
}
