import type { Prisma, User } from "@prisma/client";

export function isSuperAdmin(user: Pick<User, "role"> | null | undefined) {
  return user?.role === "SUPER_ADMIN";
}

function scopedOrganizationId(user: Pick<User, "role" | "organizationId">) {
  return user.organizationId ?? "__missing_organization__";
}

export function buildEventWhereForUser(
  user: Pick<User, "role" | "organizationId">,
  where: Prisma.EventWhereInput = {}
): Prisma.EventWhereInput {
  if (isSuperAdmin(user)) {
    return where;
  }

  return {
    AND: [where, { organizationId: scopedOrganizationId(user) }]
  };
}

export function buildBatchWhereForUser(
  user: Pick<User, "role" | "organizationId">,
  where: Prisma.UploadBatchWhereInput = {}
): Prisma.UploadBatchWhereInput {
  if (isSuperAdmin(user)) {
    return where;
  }

  return {
    AND: [
      where,
      {
        event: {
          is: {
            organizationId: scopedOrganizationId(user)
          }
        }
      }
    ]
  };
}

export function buildVerificationWhereForUser(
  user: Pick<User, "role" | "organizationId">,
  where: Prisma.VerificationRecordWhereInput = {}
): Prisma.VerificationRecordWhereInput {
  if (isSuperAdmin(user)) {
    return where;
  }

  return {
    AND: [
      where,
      {
        event: {
          is: {
            organizationId: scopedOrganizationId(user)
          }
        }
      }
    ]
  };
}

export function canAccessOrganizationRecord(
  user: Pick<User, "role" | "organizationId">,
  organizationId: string | null | undefined
) {
  return isSuperAdmin(user) || Boolean(user.organizationId && user.organizationId === organizationId);
}
