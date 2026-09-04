import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {

        const userId = req.nextUrl.searchParams.get("USERID")

        if (!userId) {
            return NextResponse.json(
                { message: "user not found" },
                { status: 400 }
            )
        }

        const emails = await prisma.email.findMany({
            where: {
                userId: userId,
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

