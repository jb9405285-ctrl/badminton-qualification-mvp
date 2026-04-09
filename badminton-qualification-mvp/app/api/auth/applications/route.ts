import { NextResponse } from "next/server";

import { z } from "zod";

import { createOrganizerApplication } from "@/lib/services/organizer-application-service";

const organizerApplicationSchema = z.object({
  organizationName: z.string().trim().min(2, "请填写主办方名称。"),
  contactName: z.string().trim().min(2, "请填写联系人姓名。"),
  contactEmail: z.string().trim().email("请填写正确的联系邮箱。"),
  contactPhone: z.string().trim().optional(),
  note: z.string().trim().max(500, "备注不能超过 500 字。").optional()
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = organizerApplicationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "申请信息不完整。"
      },
      { status: 400 }
    );
  }

  try {
    const application = await createOrganizerApplication(parsed.data);

    return NextResponse.json({
      ok: true,
      applicationId: application.id,
      message: "申请已提交，等待平台管理员审批。"
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "申请提交失败，请稍后再试。"
      },
      { status: 400 }
    );
  }
}
