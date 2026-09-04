import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";


export async function POST(req: NextRequest) {
    try {

        const { email: rawEmail, password, name: rawName } = await req.json();
        const email = typeof rawEmail === "string"
            ? rawEmail.trim().toLowerCase()
            : "";
        const name = typeof rawName === "string" ? rawName.trim() : "";

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        const existingUser = await prisma.user.findUnique({
            where: { 
                email
             }
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "User already exists" },
                { status: 409 }
            );
        }

        const passwordHash = await hashPassword(password);

        const user = await prisma.user.create({
            data: {
                email,
                name: name || email.split("@")[0],
                passwordHash,
            },
        })

        return NextResponse.json(
            {
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                },
            },
            { status: 201 }
        );

    } catch (error) {
        console.error("Register error:", error);

        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}