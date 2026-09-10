import { prisma } from "@/lib/prisma";
import { randomUUID } from "node:crypto";

export const SESSION_COOKIE = "session_token";

function getSessionDurationMs() {
  const days = Number(process.env.SESSION_DAYS || "7");
  return (Number.isFinite(days) ? days : 7) * 24 * 60 * 60 * 1000;
}

export async function createSession(userId: string) {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + getSessionDurationMs());

  const session = await prisma.session.create({
    data: { token, userId, expiresAt },
  });

  return session;
}

export async function deleteSession(token: string) {
  await prisma.session.deleteMany({ where: { token } });
}

export async function getUserFromToken(token: string) {
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }
  return session.user;
}
