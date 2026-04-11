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
      status: "PENDING",
      removedAt: null
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

export async function getOrganizerApplicationStatus(input: {
  applicationId: string;
  contactEmail: string;
}) {
  const applicationId = input.applicationId.trim();
  const contactEmail = input.contactEmail.trim().toLowerCase();

  const application = await prisma.organizerApplication.findUnique({
    where: { id: applicationId },
    include: {
      approvedUser: {
        select: {
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

  if (!application || application.contactEmail !== contactEmail) {
    throw new Error("申请编号或联系邮箱不匹配。");
  }

  if (application.removedAt) {
    throw new Error("该申请记录已经被平台管理员移除，请重新提交申请。");
  }

  const setupToken = application.approvedUser?.passwordSetupTokens[0] ?? null;

  return {
    id: application.id,
    organizationName: application.organizationName,
    contactEmail: application.contactEmail,
    status: application.status,
    createdAt: application.createdAt,
    reviewedAt: application.reviewedAt,
    reviewNote: application.reviewNote,
    setupPath: setupToken ? `/setup-account?token=${setupToken.token}` : null,
    setupTokenExpiresAt: setupToken?.expiresAt ?? null,
    accountReady: Boolean(application.approvedUser?.passwordHash),
    accountStatus: application.approvedUser?.status ?? null
  };
}

export async function listOrganizerApplications() {
  return prisma.organizerApplication.findMany({
    where: {
      removedAt: null
    },
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

function buildRemovedEmail(email: string, userId: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const atIndex = normalizedEmail.lastIndexOf("@");

  if (atIndex > 0) {
    return `${normalizedEmail.slice(0, atIndex)}+removed-${userId}${normalizedEmail.slice(atIndex)}`;
  }

  return `removed-${userId}-${normalizedEmail}`;
}

export async function removeOrganizerApplicationAccess(applicationId: string, actor: User, reviewNote?: string) {
  const application = await prisma.organizerApplication.findUnique({
    where: { id: applicationId },
    include: {
      approvedUser: {
        select: {
          id: true,
          email: true,
          role: true
        }
      },
      organization: {
        select: {
          id: true
        }
      }
    }
  });

  if (!application) {
    throw new Error("申请不存在。");
  }

  if (application.removedAt) {
    throw new Error("该申请已经移除。");
  }

  if (application.approvedUser?.role === "SUPER_ADMIN") {
    throw new Error("不能移除平台管理员账号。");
  }

  const removedAt = new Date();
  const removalNote = normalizeOptional(reviewNote) ?? "权限已删除，账号已停用并从审批页移除。";

  await prisma.$transaction(async (tx) => {
    if (application.approvedUser) {
      await tx.session.deleteMany({
        where: {
          userId: application.approvedUser.id
        }
      });

      await tx.passwordSetupToken.deleteMany({
        where: {
          userId: application.approvedUser.id
        }
      });

      await tx.user.update({
        where: {
          id: application.approvedUser.id
        },
        data: {
          email: buildRemovedEmail(application.approvedUser.email, application.approvedUser.id),
          passwordHash: null,
          status: "SUSPENDED"
        }
      });
    }

    if (application.organizationId) {
      await tx.organization.update({
        where: {
          id: application.organizationId
        },
        data: {
          status: "REMOVED"
        }
      });
    }

    await tx.organizerApplication.update({
      where: {
        id: application.id
      },
      data: {
        removedAt,
        removedById: actor.id,
        removalNote,
        reviewedAt: removedAt,
        reviewedById: actor.id,
        reviewNote: removalNote
      }
    });
  });
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
