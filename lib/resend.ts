import { Resend } from "resend";

let _resend: Resend | null = null;

export function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!_resend) _resend = new Resend(key);
  return _resend;
}

export function isResendConfigured() {
  return !!process.env.RESEND_API_KEY;
}

export function getResendFrom() {
  return process.env.RESEND_FROM || "Celer <onboarding@resend.dev>";
}
