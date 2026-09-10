import { requireAuth } from "@/lib/auth/require-auth";
import { prisma } from "@/lib/prisma";
import { serializeEmail } from "@/lib/serialize";
import { NextRequest, NextResponse } from "next/server";

const VALID_FOLDERS = ["INBOX", "SENT", "DRAFT", "TRASH", "SPAM", "ARCHIVED"];

export async function GET(req: NextRequest, { params }: { params: Promise<{ emailId: string }> }) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { emailId } = await params;
    const email = await prisma.email.findFirst({ where: { id: emailId, userId: user.id } });
    if (!email) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ success: true, email: serializeEmail(email) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ emailId: string }> }) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { emailId } = await params;
    const body = await req.json();

    const existing = await prisma.email.findFirst({ where: { id: emailId, userId: user.id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const data: any = {};
    if (typeof body.isRead === "boolean") data.isRead = body.isRead;
    if (typeof body.isStarred === "boolean") data.isStarred = body.isStarred;
    if (typeof body.folder === "string" && VALID_FOLDERS.includes(body.folder)) data.folder = body.folder;

    const updated = await prisma.email.update({ where: { id: emailId }, data });

    return NextResponse.json({ success: true, email: serializeEmail(updated) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ emailId: string }> }) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { emailId } = await params;
    const existing = await prisma.email.findFirst({ where: { id: emailId, userId: user.id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // First delete = move to trash, second delete from trash = permanent
    if (existing.folder === "TRASH") {
      await prisma.email.delete({ where: { id: emailId } });
      return NextResponse.json({ success: true, deleted: true });
    } else {
      const updated = await prisma.email.update({ where: { id: emailId }, data: { folder: "TRASH" } });
      return NextResponse.json({ success: true, trashed: true, email: serializeEmail(updated) });
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
