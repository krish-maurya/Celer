import { requireAuth } from "@/lib/auth/require-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
    params: Promise<{ emailId: string }>
}

export async function GET(req: NextRequest, { params }: RouteContext) {
    try {

        const user = await requireAuth();
        const { emailId } = await params;

        if (!user) {
            return NextResponse.json(
                { message: "Not authenticated" },
                { status: 401 }
            )
        }
        if (!emailId){
            return NextResponse.json(
                { message: "email not found" },
                { status: 400 }
            )
        }

        const email = await prisma.email.findFirst({
            where: {
                id: emailId,
                userId: user.id
            }
        })

        if (!email) {
            return NextResponse.json(
                { message: "email not found" },
                { status: 404 }
            )
        }

        return NextResponse.json(
            {
                success: true,
                email
            })

    } catch (error) {
        console.error("Failed to fetch email:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch email",
            },
            { status: 500 }
        );
    }
}



export async function DELETE(req: NextRequest, { params }: RouteContext) {
    try {

        const user = await requireAuth();
        const { emailId } = await params;

        if (!user) {
            return NextResponse.json(
                { message: "Not authenticated" },
                { status: 401 }
            )
        }
        if (!emailId){
            return NextResponse.json(
                { message: "email not found" },
                { status: 400 }
            )
        }

        const result = await prisma.email.deleteMany({
            where: {
                id: emailId,
                userId: user.id
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
                deleted: true
            })

    } catch (error) {
        console.error("Failed to delete email:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Failed to delete email",
            },
            { status: 500 }
        );
    }
}

