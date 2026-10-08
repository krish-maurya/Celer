import { requireAuth } from "@/lib/auth/require-auth";
import { prisma } from "@/lib/prisma";
import { serializeEmail } from "@/lib/serialize";
import { resolveMailbox } from "@/lib/mailbox";
import { draftSchema } from "@/lib/validations/email";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json();
    const parsed = draftSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { to, cc, bcc, subject, text, attachments } = parsed.data;
    const mailbox = await resolveMailbox(user, parsed.data.mailboxId);

    const email = await prisma.email.create({
      data: {
        userId: user.id,
        mailboxId: mailbox.id,
        fromEmail: mailbox.address,
        fromName: user.name,
        to: JSON.stringify(to),
        cc: JSON.stringify(cc),
        bcc: JSON.stringify(bcc),
        attachments: JSON.stringify(attachments),
        subject: subject || "(no subject)",
        text: text || "",
        folder: "DRAFT",
        isRead: true,
        receivedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, email: serializeEmail(email) }, { status: 201 });
  } catch (e) {
    console.error("Create draft error", e);
    return NextResponse.json({ error: "Failed to create draft" }, { status: 500 });
  }
}
