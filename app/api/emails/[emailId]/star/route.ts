import { requireAuth } from "@/lib/auth/require-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
    params: Promise<{ emailId: string }>
}


export async function PATCH(req: NextRequest, { params }: RouteContext) {
    try {

        const user = await requireAuth();
        const { emailId } = await params;

        if (!user) {
            return NextResponse.json(
            { message: "Not authenticated" },
            { status: 401 }
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
                userId: user.id
            },
            data: {
                isStarred:true
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