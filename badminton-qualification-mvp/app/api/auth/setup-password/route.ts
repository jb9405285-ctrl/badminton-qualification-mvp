import { NextResponse } from "next/server";

import { z } from "zod";

import { hashPassword } from "@/lib/auth/password";
import { getPasswordSetupToken } from "@/lib/auth/setup-token";
import { prisma } from "@/lib/prisma";

const setupPasswordSchema = z.object({
  token: z.string().trim().min(1, "设密令牌缺失。"),
  password: z.string().min(8, "密码至少需要 8 位。"),
  name: z.string().trim().min(2, "请填写姓名。").optional()
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = setupPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "设密参数不完整。"
      },
      { status: 400 }
    );
  }

  const setupToken = await getPasswordSetupToken(parsed.data.token);

  if (!setupToken) {
    return NextResponse.json(
      {
        ok: false,
        message: "设密链接无效或已过期，请联系平台管理员重新生成。"
      },
      { status: 400 }
    );
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: setupToken.userId },
      data: {
        name: parsed.data.name?.trim() || setupToken.user.name,
        passwordHash: hashPassword(parsed.data.password)
      }
    }),
    prisma.passwordSetupToken.update({
      where: { id: setupToken.id },
      data: {
        usedAt: new Date()
      }
    })
  ]);

  return NextResponse.json({
    ok: true,
    message: "密码设置完成，现在可以登录。"
  });
}
