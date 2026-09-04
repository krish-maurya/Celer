import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
    params: Promise<{ emailId: string }>
}


export async function PATCH(req: NextRequest, { params }: RouteContext) {
    try {

        const userId = req.nextUrl.searchParams.get("USERID");
        const { emailId } = await params;

        if (!userId) {
            return NextResponse.json(
                { message: "user not found" },
                { status: 400 }
            )
        }
        if (!emailId) {
            return NextResponse.json(
                { message: "email not found" },
                { status: 400 }
            )
        }

        const result = await prisma.email.updateMany({
            where: {
                id: emailId,
                userId
            },
            data: {
                isRead:true
            }
        })

        if (result.count === 0) {
            return NextResponse.json(
                { message: "email not found" },
                { status: 404 }
            )
        }

        return NextResponse.json(
            {
                success: true,
                updated: true
            })

    } catch (error) {
        console.error("Failed to update email:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Failed to update email",
            },
            { status: 500 }
        );
    }
}