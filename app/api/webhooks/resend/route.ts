import { prisma } from "@/lib/prisma";
import { receivedEmail } from "@/lib/validations/email";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function parseSender(value: string) {
  const match = value.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);

  return match
    ? { name: match[1].trim() || null, email: match[2].trim() }
    : { name: null, email: value.trim() };
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const svixId = req.headers.get("svix-id");
    const svixTimestamp = req.headers.get("svix-timestamp");
    const svixSignature = req.headers.get("svix-signature");
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json(
        { error: "Missing webhook signature headers" },
        { status: 400 },
      );
    }

    if (!webhookSecret) {
      console.error("RESEND_WEBHOOK_SECRET is missing");
      return NextResponse.json(
        { error: "Webhook secret is not configured" },
        { status: 500 },
      );
    }

    const event = resend.webhooks.verify({
      payload,
      headers: {
        id: svixId,
        timestamp: svixTimestamp,
        signature: svixSignature,
      },
      webhookSecret,
    });

    if (event.type !== "email.received") {
      return NextResponse.json({ success: true, ignored: true });
    }

    const existingEmail = await prisma.email.findUnique({
      where: { resendEmailId: event.data.email_id },
    });

    if (existingEmail) {
      return NextResponse.json({ success: true, duplicate: true });
    }

    const { data, error } = await resend.emails.receiving.get(
      event.data.email_id,
    );

    if (error) {
      console.error("Failed to retrieve email:", error);
      return NextResponse.json(
        { error: "Failed to retrieve email" },
        { status: 502 },
      );
    }

    const result = receivedEmail.safeParse(data);
    if (!result.success) {
      console.error("Email validation failed:", result.error.issues);
      return NextResponse.json(
        { error: "Invalid email data" },
        { status: 400 },
      );
    }

    const email = result.data;
    const sender = parseSender(email.from);
    const recipient = event.data.received_for?.[0];

    if (!recipient) {
      return NextResponse.json(
        { error: "Received email has no recipient" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: recipient.trim().toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "No registered user found for this recipient" },
        { status: 404 },
      );
    }

    const savedEmail = await prisma.email.create({
      data: {
        resendEmailId: event.data.email_id,
        messageId: event.data.message_id,
        fromEmail: sender.email,
        fromName: sender.name,
        to: email.to,
        cc: event.data.cc ?? [],
        bcc: event.data.bcc ?? [],
        subject: email.subject,
        text: email.text,
        html: email.html,
        receivedAt: new Date(event.created_at),
        userId: user.id,
      },
    });

    console.log("Saved received email:", savedEmail.id);
    return NextResponse.json({ success: true, id: savedEmail.id });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { success: false, message: "Invalid webhook payload" },
      { status: 500 },
    );
  }
}
