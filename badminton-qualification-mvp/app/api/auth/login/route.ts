import { NextResponse } from "next/server";

import { z } from "zod";

import { createSession } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { ensureAppData } from "@/lib/data/bootstrap";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  email: z.string().email("请输入正确的邮箱地址。"),
  password: z.string().min(1, "请输入密码。")
});

export async function POST(request: Request) {
  await ensureAppData();

  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "登录参数不完整。"
      },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      email: parsed.data.email
    }
  });

  if (!user) {
    return NextResponse.json(
      {
        ok: false,
        message: "账号或密码错误。"
      },
      { status: 401 }
    );
  }

  if (user.status !== "ACTIVE") {
    return NextResponse.json(
      {
        ok: false,
        message: "该账号已被平台管理员停用。"
      },
      { status: 403 }
    );
  }

  if (!user.passwordHash) {
    return NextResponse.json(
      {
        ok: false,
        message: "账号已开通，但尚未完成首次设密。请联系平台管理员获取设密链接。"
      },
      { status: 403 }
    );
  }

  if (!verifyPassword(parsed.data.password, user.passwordHash)) {
    return NextResponse.json(
      {
        ok: false,
        message: "账号或密码错误。"
      },
      { status: 401 }
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastLoginAt: new Date()
    }
  });

  await createSession(user.id);

  return NextResponse.json({
    ok: true
  });
}
