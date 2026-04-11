import { NextResponse } from "next/server";

import { z } from "zod";

import { isSuperAdmin } from "@/lib/auth/access";
import { getCurrentUser } from "@/lib/auth/session";
import {
  approveOrganizerApplication,
  getOrganizerApplicationSetupEmailData,
  removeOrganizerApplicationAccess,
  rejectOrganizerApplication,
  restoreOrganizerAccess,
  revokeOrganizerAccess
} from "@/lib/services/organizer-application-service";
import { isEmailDeliveryConfigured, sendOrganizerApprovalEmail } from "@/lib/notifications/email";
import { getPublicOrigin } from "@/lib/url";

const applicationDecisionSchema = z.object({
  action: z.enum(["approve", "reject", "revoke", "restore", "remove", "resendEmail"]),
  note: z.string().trim().max(500, "处理备注不能超过 500 字。").optional()
});

function getApprovalEmailWaitMs() {
  const configuredWaitMs = Number(process.env.SMTP_APPROVAL_WAIT_MS?.trim() || "5000");

  return Number.isFinite(configuredWaitMs) && configuredWaitMs > 0 ? configuredWaitMs : 5000;
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
      let emailSent = false;
      let emailMessage = "";

      if (isEmailDeliveryConfigured()) {
        const sendPromise = sendOrganizerApprovalEmail({
          to: approved.user.email,
          contactName: approved.user.name,
          organizationName: approved.organization.name,
          setupUrl,
          expiresAt: approved.expiresAt
        });
        const emailResult = await Promise.race([
          sendPromise.then(() => ({ status: "sent" as const })).catch((error) => ({
            status: "failed" as const,
            error
          })),
          new Promise<{ status: "timeout" }>((resolve) => {
            setTimeout(() => resolve({ status: "timeout" }), getApprovalEmailWaitMs());
          })
        ]);

        if (emailResult.status === "sent") {
          emailSent = true;
          emailMessage = "设密邮件已自动发送到申请邮箱。";
        } else if (emailResult.status === "timeout") {
          sendPromise.catch((error) => {
            console.error("Failed to send organizer approval email after approval response", error);
          });
          emailMessage = "主办方账号已创建，设密邮件仍在后台发送；如申请人未收到，请手动复制设密链接发送。";
        } else {
          console.error("Failed to send organizer approval email", emailResult.error);
          emailMessage =
            emailResult.error instanceof Error
              ? `主办方账号已创建，但自动邮件发送失败：${emailResult.error.message}`
              : "主办方账号已创建，但自动邮件发送失败。";
        }
      } else {
        emailMessage = "主办方账号已创建，但当前未配置自动发信；请手动复制设密链接发送给申请人。";
      }

      return NextResponse.json({
        ok: true,
        message: "申请已批准，主办方账号已创建。",
        setupUrl,
        setupPath,
        expiresAt: approved.expiresAt.toISOString(),
        emailSent,
        emailMessage
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

    if (parsed.data.action === "resendEmail") {
      if (!isEmailDeliveryConfigured()) {
        return NextResponse.json(
          {
            ok: false,
            message: "当前未配置自动发信，无法重发邮件。请手动复制设密链接发送给申请人。"
          },
          { status: 400 }
        );
      }

      const emailData = await getOrganizerApplicationSetupEmailData(params.id);
      const setupPath = `/setup-account?token=${emailData.token}`;
      const setupUrl = `${getPublicOrigin(request)}${setupPath}`;

      await sendOrganizerApprovalEmail({
        to: emailData.to,
        contactName: emailData.contactName,
        organizationName: emailData.organizationName,
        setupUrl,
        expiresAt: emailData.expiresAt
      });

      return NextResponse.json({
        ok: true,
        message: "设密邮件已重新发送到申请邮箱。",
        setupUrl,
        setupPath,
        expiresAt: emailData.expiresAt.toISOString(),
        emailSent: true
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
