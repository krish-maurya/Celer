import { requireAuth } from "@/lib/auth/require-auth";
import { prisma } from "@/lib/prisma";
import { serializeEmail } from "@/lib/serialize";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ emailId: string }> }) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { emailId } = await params;
    const body = await req.json().catch(() => ({}));

    const existing = await prisma.email.findFirst({ where: { id: emailId, userId: user.id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isRead = typeof body.isRead === "boolean" ? body.isRead : !existing.isRead;
    const updated = await prisma.email.update({ where: { id: emailId }, data: { isRead } });

    return NextResponse.json({ success: true, email: serializeEmail(updated) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ emailId: string }> }) {
  return POST(req, { params } as any);
}
