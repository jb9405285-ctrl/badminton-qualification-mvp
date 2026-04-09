import { NextResponse } from "next/server";

import { z } from "zod";

import { buildEventWhereForUser } from "@/lib/auth/access";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const updateEventSchema = z.object({
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

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      {
        ok: false,
        message: "请先登录后再编辑赛事。"
      },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = updateEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "赛事信息不完整。"
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

  const existingEvent = await prisma.event.findFirst({
    where: buildEventWhereForUser(user, {
      id: params.id
    }),
    select: {
      id: true
    }
  });

  if (!existingEvent) {
    return NextResponse.json(
      {
        ok: false,
        message: "赛事不存在或已被删除。"
      },
      { status: 404 }
    );
  }

  const event = await prisma.event.update({
    where: {
      id: params.id
    },
    data: {
      name: parsed.data.name,
      organizerName: parsed.data.organizerName,
      eventDate,
      notes: parsed.data.notes || null
    },
    select: {
      id: true,
      name: true,
      organizerName: true,
      eventDate: true,
      notes: true,
      updatedAt: true
    }
  });

  return NextResponse.json({
    ok: true,
    message: "赛事信息已更新。",
    event: {
      ...event,
      eventDate: event.eventDate.toISOString(),
      notes: event.notes ?? ""
    }
  });
}
