import { requireAuth } from "@/lib/auth/require-auth";
import { resolveMailbox } from "@/lib/mailbox";
import { prisma } from "@/lib/prisma";
import { serializeEmail } from "@/lib/serialize";
import { NextRequest, NextResponse } from "next/server";

const VALID_FOLDERS = ["INBOX", "SENT", "DRAFT", "TRASH", "SPAM", "ARCHIVED"] as const;

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const folderParam = searchParams.get("folder");
    const q = searchParams.get("q")?.trim().toLowerCase() || "";
    const starred = searchParams.get("starred") === "true";
    const unread = searchParams.get("unread") === "true";
    const all = searchParams.get("all") === "true";

    // Every list is scoped to one mailbox (address). Defaults to the primary one.
    const mailbox = await resolveMailbox(user, searchParams.get("mailbox"));

    let folder: string | null = null;
    if (folderParam && VALID_FOLDERS.includes(folderParam as any)) {
      folder = folderParam;
    } else if (!all && !starred && !unread) {
      folder = "INBOX";
    }

    // Fetch all emails for this mailbox (counts are computed over the whole mailbox)
    const allEmailsRaw = await prisma.email.findMany({
      where: { userId: user.id, mailboxId: mailbox.id },
      orderBy: { receivedAt: "desc" },
    });

    const counts: Record<string, number> = {
      INBOX: 0,
      SENT: 0,
      DRAFT: 0,
      TRASH: 0,
      SPAM: 0,
      ARCHIVED: 0,
    };
    let unreadCount = 0;
    let starredCount = 0;

    for (const e of allEmailsRaw) {
      if (counts[e.folder] !== undefined) counts[e.folder]++;
      if (!e.isRead && e.folder === "INBOX") unreadCount++;
      if (e.isStarred) starredCount++;
    }

    let filtered = allEmailsRaw;

    if (folder && folder !== "ALL") {
      filtered = filtered.filter((e) => e.folder === folder);
    }

    if (starred) {
      filtered = filtered.filter((e) => e.isStarred);
    }

    if (unread) {
      filtered = filtered.filter((e) => !e.isRead);
    }

    if (q) {
      filtered = filtered.filter((e) => {
        const hay = `${e.subject} ${e.fromEmail} ${e.fromName || ""} ${e.text || ""}`.toLowerCase();
        return hay.includes(q);
      });
    }

    const emails = filtered.map(serializeEmail);

    return NextResponse.json({
      success: true,
      mailbox: { id: mailbox.id, address: mailbox.address, name: mailbox.name, isPrimary: mailbox.isPrimary },
      emails,
      counts,
      unread: unreadCount,
      starred: starredCount,
    });
  } catch (error) {
    console.error("Failed to fetch emails:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch emails" }, { status: 500 });
  }
}
