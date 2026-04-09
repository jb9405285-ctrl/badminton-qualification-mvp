import { randomUUID } from "crypto";

import type { OrganizerApplication, User } from "@prisma/client";

import { buildOrganizationSlug } from "@/lib/data/bootstrap";
import { prisma } from "@/lib/prisma";

type CreateApplicationInput = {
  organizationName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  note?: string;
};

function normalizeOptional(value?: string) {
  const trimmed = value?.trim() ?? "";

  return trimmed.length > 0 ? trimmed : null;
}

async function ensureUniqueOrganizationSlug(name: string) {
  const baseSlug = buildOrganizationSlug(name);
  let slug = baseSlug;
  let attempt = 1;

  while (true) {
    const existing = await prisma.organization.findUnique({
      where: { slug }
    });

    if (!existing) {
      return slug;
    }

    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
  }
}

export async function createOrganizerApplication(input: CreateApplicationInput) {
  const email = input.contactEmail.trim().toLowerCase();
  const pendingApplication = await prisma.organizerApplication.findFirst({
    where: {
      contactEmail: email,
      status: "PENDING"
    },
    select: { id: true }
  });

  if (pendingApplication) {
    throw new Error("该邮箱已经有待审批申请，请勿重复提交。");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true }
  });

  if (existingUser) {
    throw new Error("该邮箱已存在账号，请直接登录或联系平台管理员。");
  }

  return prisma.organizerApplication.create({
    data: {
      organizationName: input.organizationName.trim(),
      contactName: input.contactName.trim(),
      contactEmail: email,
      contactPhone: normalizeOptional(input.contactPhone),
      note: normalizeOptional(input.note)
    }
  });
}

export async function listOrganizerApplications() {
  return prisma.organizerApplication.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      reviewedBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      organization: {
        select: {
          id: true,
          name: true
        }
      },
      approvedUser: {
        select: {
          id: true,
          passwordHash: true,
          status: true,
          passwordSetupTokens: {
            where: {
              usedAt: null,
              expiresAt: {
                gt: new Date()
              }
            },
            orderBy: {
              createdAt: "desc"
            },
            take: 1,
            select: {
              token: true,
              expiresAt: true
            }
          }
        }
      }
    }
  });
}

export async function approveOrganizerApplication(applicationId: string, actor: User) {
  const application = await prisma.organizerApplication.findUnique({
    where: { id: applicationId }
  });

  if (!application) {
    throw new Error("申请不存在。");
  }

  if (application.status !== "PENDING") {
    throw new Error("该申请已经处理过，不能重复批准。");
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email: application.contactEmail
    },
    select: {
      id: true
    }
  });

  if (existingUser) {
    throw new Error("该邮箱已经存在账号，不能重复开通。");
  }

  const slug = await ensureUniqueOrganizationSlug(application.organizationName);
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

  const result = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        name: application.organizationName,
        slug,
        contactName: application.contactName,
        contactEmail: application.contactEmail,
        contactPhone: application.contactPhone
      }
    });

    const user = await tx.user.create({
      data: {
        name: application.contactName,
        email: application.contactEmail,
        role: "ORGANIZER",
        organizationId: organization.id
      }
    });

    await tx.passwordSetupToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt
      }
    });

    const approvedApplication = await tx.organizerApplication.update({
      where: { id: application.id },
      data: {
        status: "APPROVED",
        reviewedAt: new Date(),
        reviewedById: actor.id,
        reviewNote: "已批准并创建主办方账号。",
        organizationId: organization.id,
        approvedUserId: user.id
      }
    });

    return {
      organization,
      user,
      application: approvedApplication,
      token,
      expiresAt
    };
  });

  return result;
}

export async function revokeOrganizerAccess(applicationId: string, actor: User, reviewNote?: string) {
  const application = await prisma.organizerApplication.findUnique({
    where: { id: applicationId },
    include: {
      approvedUser: {
        select: {
          id: true,
          status: true
        }
      }
    }
  });

  if (!application || !application.approvedUserId || !application.approvedUser) {
    throw new Error("该申请还没有可停用的主办方账号。");
  }

  if (application.approvedUser.status === "SUSPENDED") {
    throw new Error("该主办方账号已经是停用状态。");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: application.approvedUserId },
      data: {
        status: "SUSPENDED"
      }
    }),
    prisma.session.deleteMany({
      where: {
        userId: application.approvedUserId
      }
    }),
    prisma.organizerApplication.update({
      where: { id: application.id },
      data: {
        reviewedAt: new Date(),
        reviewedById: actor.id,
        reviewNote: normalizeOptional(reviewNote) ?? "主办方账号权限已停用。"
      }
    })
  ]);
}

export async function restoreOrganizerAccess(applicationId: string, actor: User, reviewNote?: string) {
  const application = await prisma.organizerApplication.findUnique({
    where: { id: applicationId },
    include: {
      approvedUser: {
        select: {
          id: true,
          status: true
        }
      }
    }
  });

  if (!application || !application.approvedUserId || !application.approvedUser) {
    throw new Error("该申请还没有可恢复的主办方账号。");
  }

  if (application.approvedUser.status === "ACTIVE") {
    throw new Error("该主办方账号当前已经是可用状态。");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: application.approvedUserId },
      data: {
        status: "ACTIVE"
      }
    }),
    prisma.organizerApplication.update({
      where: { id: application.id },
      data: {
        reviewedAt: new Date(),
        reviewedById: actor.id,
        reviewNote: normalizeOptional(reviewNote) ?? "主办方账号权限已恢复。"
      }
    })
  ]);
}

export async function rejectOrganizerApplication(applicationId: string, actor: User, reviewNote?: string) {
  const application = await prisma.organizerApplication.findUnique({
    where: { id: applicationId }
  });

  if (!application) {
    throw new Error("申请不存在。");
  }

  if (application.status !== "PENDING") {
    throw new Error("该申请已经处理过，不能重复拒绝。");
  }

  return prisma.organizerApplication.update({
    where: { id: applicationId },
    data: {
      status: "REJECTED",
      reviewedAt: new Date(),
      reviewedById: actor.id,
      reviewNote: normalizeOptional(reviewNote) ?? "已拒绝该申请。"
    }
  });
}

export async function getApplicationByToken(token: string) {
  return prisma.passwordSetupToken.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          organization: true
        }
      }
    }
  });
}
