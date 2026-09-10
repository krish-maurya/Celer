import { requireAuth } from "@/lib/auth/require-auth";
import { prisma } from "@/lib/prisma";
import { serializeEmail } from "@/lib/serialize";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ emailId: string }> }) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { emailId } = await params;
    const existing = await prisma.email.findFirst({ where: { id: emailId, userId: user.id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Toggle archive: if already archived, move to inbox, else archive
    const newFolder = existing.folder === "ARCHIVED" ? "INBOX" : "ARCHIVED";
    const updated = await prisma.email.update({ where: { id: emailId }, data: { folder: newFolder } });

    return NextResponse.json({ success: true, email: serializeEmail(updated) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// Also support PATCH for unarchive
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ emailId: string }> }) {
  return POST(req, { params } as any);
}
