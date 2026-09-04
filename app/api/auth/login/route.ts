import { verifyPassword } from "@/lib/auth/password";
import { createSession, SESSION_COOKIE } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const email = typeof body.email === "string"
			? body.email.trim().toLowerCase()
			: "";
		const password = typeof body.password === "string"
			? body.password
			: "";

		if (!email || !password) {
			return NextResponse.json(
				{ error: "Email and password are required" },
				{ status: 400 }
			);
		}

		const user = await prisma.user.findUnique({
			where: { email }
		});

		if (!user || !(await verifyPassword(password, user.passwordHash))) {
			return NextResponse.json(
				{ error: "Invalid email or password" },
				{ status: 401 }
			);
		}

		const session = await createSession(user.id);

		const response = NextResponse.json({
			success: true,
			user: {
				id: user.id,
				email: user.email,
				name: user.name
			}
		});

		response.cookies.set({
			name: SESSION_COOKIE,
			value: session.token,
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			path: "/",
			expires: session.expiresAt
		});

		return response;
	} catch (error) {
		console.error("Login error:", error);

		return NextResponse.json(
			{ error: "Something went wrong" },
			{ status: 500 }
		);
	}
}
