import { requireAuth } from "@/lib/auth/require-auth";
import { ensurePrimaryMailbox, serializeMailbox } from "@/lib/mailbox";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createSchema = z.object({
  address: z.email("Enter a valid email address").max(254),
  name: z.string().trim().max(60).optional(),
});

/** All email addresses assigned to the signed-in account, with unread counts. */
export async function GET() {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    await ensurePrimaryMailbox(user);

    const [mailboxes, unreadGroups] = await Promise.all([
      prisma.mailbox.findMany({
        where: { userId: user.id },
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
      }),
      prisma.email.groupBy({
        by: ["mailboxId"],
        where: { userId: user.id, folder: "INBOX", isRead: false },
        _count: { _all: true },
      }),
    ]);

    const unreadById = new Map(unreadGroups.map((g) => [g.mailboxId, g._count._all]));

    return NextResponse.json({
      success: true,
      mailboxes: mailboxes.map((mb) => ({
        ...serializeMailbox(mb),
        unread: unreadById.get(mb.id) ?? 0,
      })),
    });
  } catch (e) {
    console.error("List mailboxes error:", e);
    return NextResponse.json({ error: "Failed to load mailboxes" }, { status: 500 });
  }
}

/** Assign an extra email address to the signed-in account. */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const parsed = createSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid email address" },
        { status: 400 },
      );
    }

    const address = parsed.data.address.trim().toLowerCase();
    const taken = await prisma.mailbox.findUnique({ where: { address } });
    if (taken) {
      return NextResponse.json(
        {
          error:
            taken.userId === user.id
              ? "You already have this address."
              : "This address is already linked to another account.",
        },
        { status: 409 },
      );
    }

    await ensurePrimaryMailbox(user);
    const name = parsed.data.name || address.split("@")[0];
    const mb = await prisma.mailbox.create({
      data: { userId: user.id, address, name, isPrimary: false },
    });

    return NextResponse.json(
      { success: true, mailbox: { ...serializeMailbox(mb), unread: 0 } },
      { status: 201 },
    );
  } catch (e) {
    console.error("Create mailbox error:", e);
    return NextResponse.json({ error: "Failed to add email" }, { status: 500 });
  }
}
