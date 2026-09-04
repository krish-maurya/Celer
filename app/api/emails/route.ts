import { requireAuth } from "@/lib/auth/require-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const user = await requireAuth();

        if (!user) {
            return NextResponse.json(
                { message: "Not authenticated" },
                { status: 401 }
            )
        }

        const emails = await prisma.email.findMany({
            where: {
                userId: user.id,
                folder: {
                    not: 'TRASH'
                }
            },
            orderBy: {
                receivedAt: 'desc'
            }
        })

        return NextResponse.json(
            {
                success: true,
                emails
            })

    } catch (error) {
        console.error("Failed to fetch emails:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch emails",
            },
            { status: 500 }
        );
    }
}

