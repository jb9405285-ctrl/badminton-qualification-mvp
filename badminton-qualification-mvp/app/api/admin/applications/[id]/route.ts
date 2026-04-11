import { NextResponse } from "next/server";

import { z } from "zod";

import { isSuperAdmin } from "@/lib/auth/access";
import { getCurrentUser } from "@/lib/auth/session";
import {
  approveOrganizerApplication,
  removeOrganizerApplicationAccess,
  rejectOrganizerApplication,
  restoreOrganizerAccess,
  revokeOrganizerAccess
} from "@/lib/services/organizer-application-service";
import { getPublicOrigin } from "@/lib/url";

const applicationDecisionSchema = z.object({
  action: z.enum(["approve", "reject", "revoke", "restore", "remove"]),
  note: z.string().trim().max(500, "处理备注不能超过 500 字。").optional()
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      {
        ok: false,
        message: "请先登录。"
      },
      { status: 401 }
    );
  }

  if (!isSuperAdmin(user)) {
    return NextResponse.json(
      {
        ok: false,
        message: "只有平台管理员可以审批主办方申请。"
      },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = applicationDecisionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "审批参数不完整。"
      },
      { status: 400 }
    );
  }

  try {
    if (parsed.data.action === "approve") {
      const approved = await approveOrganizerApplication(params.id, user);
      const origin = getPublicOrigin(request);
      const setupPath = `/setup-account?token=${approved.token}`;
      const setupUrl = `${origin}${setupPath}`;

      return NextResponse.json({
        ok: true,
        message: "申请已批准，主办方账号已创建。",
        setupUrl,
        setupPath,
        expiresAt: approved.expiresAt.toISOString()
      });
    }

    if (parsed.data.action === "revoke") {
      await revokeOrganizerAccess(params.id, user, parsed.data.note);

      return NextResponse.json({
        ok: true,
        message: "主办方账号权限已停用。"
      });
    }

    if (parsed.data.action === "restore") {
      await restoreOrganizerAccess(params.id, user, parsed.data.note);

      return NextResponse.json({
        ok: true,
        message: "主办方账号权限已恢复。"
      });
    }

    if (parsed.data.action === "remove") {
      await removeOrganizerApplicationAccess(params.id, user, parsed.data.note);

      return NextResponse.json({
        ok: true,
        message: "权限已删除，该记录已从审批页移除；原邮箱可以重新提交申请。"
      });
    }

    await rejectOrganizerApplication(params.id, user, parsed.data.note);

    return NextResponse.json({
      ok: true,
      message: "申请已拒绝。"
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "审批失败，请稍后再试。"
      },
      { status: 400 }
    );
  }
}
