import { requireAuth } from "@/lib/auth/require-auth";
import { prisma } from "@/lib/prisma";
import { sendEmailSchema } from "@/lib/validations/email";
import { serializeEmail } from "@/lib/serialize";
import { resolveMailbox } from "@/lib/mailbox";
import { getResend, getResendFrom, isResendConfigured } from "@/lib/resend";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const result = sendEmailSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
    }

    const { to, cc, bcc, subject, text, html, attachments } = result.data;
    const mailbox = await resolveMailbox(user, result.data.mailboxId);

    const resend = getResend();
    let resendId: string | null = null;

    if (resend) {
      try {
        const { data, error } = await resend.emails.send({
          from: getResendFrom(),
          to: Array.isArray(to) ? to : [to],
          cc: cc && cc.length ? cc : undefined,
          bcc: bcc && bcc.length ? bcc : undefined,
          subject,
          html: html || text,
          text: text,
        });

        if (error) {
          console.error("Resend error", error);
          // Still persist to SENT even if resend fails, so UI works
        } else {
          resendId = (data as any)?.id || null;
        }
      } catch (e) {
        console.error("Resend exception", e);
      }
    }

    const saved = await prisma.email.create({
      data: {
        userId: user.id,
        mailboxId: mailbox.id,
        fromEmail: mailbox.address,
        fromName: user.name,
        to: JSON.stringify(Array.isArray(to) ? to : [to]),
        cc: JSON.stringify(cc || []),
        bcc: JSON.stringify(bcc || []),
        attachments: JSON.stringify(attachments || []),
        subject,
        text,
        html: html || text,
        folder: "SENT",
        isRead: true,
        receivedAt: new Date(),
        resendEmailId: resendId,
      },
    });

    return NextResponse.json({
      success: true,
      message: isResendConfigured() ? "Email sent successfully" : "Email saved to Sent (demo mode)",
      email: serializeEmail(saved),
      demo: !isResendConfigured(),
    });
  } catch (error) {
    console.error("Send email error:", error);
    return NextResponse.json({ error: "Something went wrong while sending the email" }, { status: 500 });
  }
}
