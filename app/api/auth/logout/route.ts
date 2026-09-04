import { deleteSession, SESSION_COOKIE } from "@/lib/auth/session";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
	try {
		const token = req.cookies.get(SESSION_COOKIE)?.value;

		if (token) {
			await deleteSession(token);
		}

		const response = NextResponse.json({
			success: true,
			message: "Logged out successfully"
		});

		response.cookies.set({
			name: SESSION_COOKIE,
			value: "",
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			path: "/",
			maxAge: 0
		});

		return response;
	} catch (error) {
		console.error("Logout error:", error);

		return NextResponse.json(
			{ error: "Something went wrong" },
			{ status: 500 }
		);
	}
}
