import { prisma } from "@/lib/prisma";
import { randomUUID } from "node:crypto";

export const SESSION_COOKIE = "session_token";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export async function createSession(userId: string) {
    const token = randomUUID();

    const expiresAt = new Date(
        Date.now() + SESSION_DURATION_MS
    );

    const session = await prisma.session.create({
        data: {
            token,
            userId,
            expiresAt,
        },
    });

    return session;
}

export async function deleteSession(token: string) {
    await prisma.session.deleteMany({
        where: {
            token,
        },
    });
}