import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

const SESSION_COOKIE = "session_token";

export async function requireAuth() {
    const cookieStore = await cookies();

    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (!token) {
        return null;
    }

    const session = await prisma.session.findUnique({
        where: {
            token,
        },
        include: {
            user: true,
        },
    });

    if (!session) {
        return null;
    }

    if (session.expiresAt < new Date()) {
        await prisma.session.delete({
            where: {
                id: session.id,
            },
        });

        return null;
    }

    return session.user;
}