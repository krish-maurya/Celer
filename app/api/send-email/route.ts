import { sendEmailSchema } from "@/lib/validations/email";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

if (!process.env.RESEND_API_KEY){
    console.error("RESEND_API_KEY is not defined in the environment variables.");
}

const resend = new Resend(process.env.RESEND_API_KEY);

const user = {
  email: "hello@krishmaurya.dev",
  name: "Krish",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const result = sendEmailSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: z.treeifyError(result.error) },
        { status: 400 }
      );
    }

    const { to, subject, text } = result.data;

    const { data, error } = await resend.emails.send({
      from: `${user.name} <${user.email}>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      html: `<p>${text}</p>`,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Email sent successfully",
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Send email error:", error);

    return NextResponse.json(
      { error: "Something went wrong while sending the email" },
      { status: 500 }
    );
  }
}