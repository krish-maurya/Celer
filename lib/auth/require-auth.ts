import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SESSION_COOKIE = "session_token";

export async function requireAuth() {
    const cookieStore = await cookies();

    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (!token) {
        redirect("/login");
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
        redirect("/login");
    }

    if (session.expiresAt < new Date()) {
        await prisma.session.delete({
            where: {
                id: session.id,
            },
        });

        cookieStore.delete(SESSION_COOKIE)

        redirect("/login");
    }

    return session.user;
}