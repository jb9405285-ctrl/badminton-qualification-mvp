import { randomUUID } from "crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { ensureAppData } from "@/lib/data/bootstrap";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/auth/access";

const SESSION_TTL_DAYS = 7;

export async function createSession(userId: string) {
  await ensureAppData();

  const token = randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_TTL_DAYS);

  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt
    }
  });

  cookies().set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/"
  });
}

export async function getCurrentUser() {
  await ensureAppData();

  const token = cookies().get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          organization: true
        }
      }
    }
  });

  if (!session) {
    return null;
  }

  if (session.user.status !== "ACTIVE") {
    await prisma.session.deleteMany({
      where: {
        token
      }
    });

    return null;
  }

  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { token } }).catch(() => undefined);
    return null;
  }

  return session.user;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireSuperAdmin() {
  const user = await requireUser();

  if (!isSuperAdmin(user)) {
    redirect("/dashboard");
  }

  return user;
}

export async function destroySession() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }

  cookies().delete(SESSION_COOKIE_NAME);
}
