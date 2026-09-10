import { SESSION_COOKIE, deleteSession } from "@/lib/auth/session";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (token) {
      await deleteSession(token);
    }

    const res = NextResponse.json({ success: true });
    res.cookies.set({
      name: SESSION_COOKIE,
      value: "",
      httpOnly: true,
      path: "/",
      expires: new Date(0),
    });
    return res;
  } catch (e) {
    console.error("Logout error", e);
    return NextResponse.json({ success: true });
  }
}
