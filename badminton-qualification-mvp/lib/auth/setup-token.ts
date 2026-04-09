import { randomUUID } from "crypto";

import { prisma } from "@/lib/prisma";

const PASSWORD_SETUP_TTL_HOURS = 72;

export async function issuePasswordSetupToken(userId: string) {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + PASSWORD_SETUP_TTL_HOURS * 60 * 60 * 1000);

  await prisma.passwordSetupToken.create({
    data: {
      token,
      userId,
      expiresAt
    }
  });

  return {
    token,
    expiresAt
  };
}

export async function getPasswordSetupToken(token: string) {
  const record = await prisma.passwordSetupToken.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          organization: true
        }
      }
    }
  });

  if (!record) {
    return null;
  }

  if (record.user.status !== "ACTIVE") {
    return null;
  }

  if (record.usedAt || record.expiresAt.getTime() < Date.now()) {
    return null;
  }

  return record;
}
