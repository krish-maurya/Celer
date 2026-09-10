import { requireAuth } from "@/lib/auth/require-auth";
import { prisma } from "@/lib/prisma";
import { serializeEmail } from "@/lib/serialize";
import { draftSchema } from "@/lib/validations/email";
import { getResend, getResendFrom } from "@/lib/resend";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ emailId: string }> }) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { emailId } = await params;
    const body = await req.json();

    const existing = await prisma.email.findFirst({ where: { id: emailId, userId: user.id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (existing.folder !== "DRAFT") {
      return NextResponse.json({ error: "Not a draft" }, { status: 400 });
    }

    const shouldSend = body.send === true;

    // If sending, validate as send
    if (shouldSend) {
      const to = body.to || JSON.parse(existing.to || "[]");
      const subject = body.subject ?? existing.subject;
      const text = body.text ?? existing.text;

      if (!to || (Array.isArray(to) && to.length === 0)) {
        return NextResponse.json({ error: "Recipient required" }, { status: 400 });
      }

      const resend = getResend();
      if (resend) {
        try {
          await resend.emails.send({
            from: getResendFrom(),
            to: Array.isArray(to) ? to : [to],
            subject: subject || "(no subject)",
            html: text || "",
          });
        } catch (e) {
          console.error("Resend send failed, still saving to SENT", e);
        }
      }

      const updated = await prisma.email.update({
        where: { id: emailId },
        data: {
          to: JSON.stringify(to),
          subject: subject || "(no subject)",
          text: text || "",
          folder: "SENT",
          receivedAt: new Date(),
        },
      });

      return NextResponse.json({ success: true, email: serializeEmail(updated), sent: true });
    } else {
      // Update draft
      const parsed = draftSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
      }
      const { to, cc, bcc, subject, text, attachments } = parsed.data;

      const updated = await prisma.email.update({
        where: { id: emailId },
        data: {
          to: JSON.stringify(to),
          cc: JSON.stringify(cc),
          bcc: JSON.stringify(bcc),
          attachments: JSON.stringify(attachments),
          subject: subject || "(no subject)",
          text: text || "",
        },
      });

      return NextResponse.json({ success: true, email: serializeEmail(updated) });
    }
  } catch (e) {
    console.error("Draft update error", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
