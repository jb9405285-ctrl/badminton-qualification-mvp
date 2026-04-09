import { NextResponse } from "next/server";

import { z } from "zod";

import { isSuperAdmin } from "@/lib/auth/access";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const eventSchema = z.object({
  name: z.string().trim().min(2, "请填写赛事名称。"),
  organizerName: z.string().trim().min(2, "请填写主办方名称。"),
  eventDate: z.string().min(1, "请选择比赛日期。"),
  notes: z.string().trim().optional()
});

function parseEventDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      {
        ok: false,
        message: "请先登录后再创建赛事。"
      },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = eventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "创建赛事参数不完整。"
      },
      { status: 400 }
    );
  }

  const eventDate = parseEventDate(parsed.data.eventDate);

  if (!eventDate) {
    return NextResponse.json(
      {
        ok: false,
        message: "比赛日期格式无效。"
      },
      { status: 400 }
    );
  }

  if (!user.organizationId && !isSuperAdmin(user)) {
    return NextResponse.json(
      {
        ok: false,
        message: "当前账号尚未绑定主办方机构，不能创建赛事。"
      },
      { status: 403 }
    );
  }

  if (!user.organizationId) {
    return NextResponse.json(
      {
        ok: false,
        message: "平台管理员账号不直接归属某个主办方，请先审批主办方申请后再使用正式工作流。"
      },
      { status: 400 }
    );
  }

  const event = await prisma.event.create({
    data: {
      organizationId: user.organizationId,
      name: parsed.data.name,
      organizerName: parsed.data.organizerName,
      eventDate,
      notes: parsed.data.notes || null,
      status: "ACTIVE",
      createdById: user.id
    }
  });

  return NextResponse.json({
    ok: true,
    eventId: event.id,
    message: "赛事已创建，可以开始上传名单。"
  });
}
