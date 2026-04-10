import { NextResponse } from "next/server";

import { z } from "zod";

import { getOrganizerApplicationStatus } from "@/lib/services/organizer-application-service";

const organizerApplicationStatusSchema = z.object({
  applicationId: z.string().trim().min(1, "请填写申请编号。"),
  contactEmail: z.string().trim().email("请填写正确的联系邮箱。")
});

function buildStatusMessage(application: Awaited<ReturnType<typeof getOrganizerApplicationStatus>>) {
  if (application.status === "PENDING") {
    return "申请已提交，正在等待平台管理员审批。";
  }

  if (application.status === "REJECTED") {
    return application.reviewNote || "申请已被拒绝，请联系平台管理员了解详情。";
  }

  if (application.accountReady) {
    if (application.accountStatus === "SUSPENDED") {
      return "账号已经开通，但当前权限已被停用，请联系平台管理员。";
    }

    return "账号已经开通并完成设密，现在可以直接登录。";
  }

  if (application.setupPath) {
    return "申请已批准，请先完成首次设密。";
  }

  return "申请已批准，但当前没有可用的设密链接，请联系平台管理员重新生成。";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = organizerApplicationStatusSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "查询参数不完整。"
      },
      { status: 400 }
    );
  }

  try {
    const application = await getOrganizerApplicationStatus(parsed.data);

    return NextResponse.json({
      ok: true,
      message: buildStatusMessage(application),
      application: {
        ...application,
        createdAt: application.createdAt.toISOString(),
        reviewedAt: application.reviewedAt?.toISOString() ?? null,
        setupTokenExpiresAt: application.setupTokenExpiresAt?.toISOString() ?? null
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "查询失败，请稍后再试。"
      },
      { status: 400 }
    );
  }
}
