"use client";

import { useEffect, useState } from "react";
import { CloseIcon } from "./icons";
import { api } from "@/lib/api";
import type { Email } from "@/lib/types";

export function ComposeModal({
  onClose,
  onDone,
  replyTo,
}: {
  onClose: () => void;
  onDone: () => void;
  replyTo?: Email | null;
}) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  useEffect(() => {
    if (replyTo) {
      setTo(replyTo.folder === "SENT" ? replyTo.to.join(", ") : replyTo.fromEmail);
      setSubject(
        replyTo.subject.startsWith("Re:") ? replyTo.subject : `Re: ${replyTo.subject}`,
      );
      setBody(`\n\n— On ${new Date(replyTo.receivedAt).toLocaleString()}, ${
        replyTo.fromName ?? replyTo.fromEmail
      } wrote:\n> ${(replyTo.text ?? "").replace(/\n/g, "\n> ")}`);
    }
  }, [replyTo]);

  function parseEmails(value: string): string[] {
    return value
      .split(/[,;\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async function saveDraft() {
    setBusy(true);
    setStatus(null);
    try {
      await api.createDraft({
        to: parseEmails(to),
        subject,
        text: body,
      });
      setStatus({ kind: "ok", msg: "Draft saved." });
      onDone();
      setTimeout(onClose, 600);
    } catch (e) {
      setStatus({ kind: "err", msg: e instanceof Error ? e.message : "Could not save draft" });
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    const recipients = parseEmails(to);
    if (recipients.length === 0 || !subject.trim() || !body.trim()) {
      setStatus({ kind: "err", msg: "Add recipient, subject and message." });
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const res = await api.sendEmail({ to: recipients, subject: subject.trim(), text: body.trim() });
      setStatus({
        kind: "ok",
        msg: res.demo ? "Sent — demo mode (saved to Sent)." : "Email sent.",
      });
      onDone();
      setTimeout(onClose, 700);
    } catch (e) {
      setStatus({ kind: "err", msg: e instanceof Error ? e.message : "Could not send" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end bg-zinc-900/20 backdrop-blur-[2px] sm:items-center sm:justify-center sm:p-4" onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full flex-col overflow-hidden border border-zinc-200 bg-white shadow-xl sm:max-w-[560px] sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Compose email"
      >
        {/* Header */}
        <div className="flex h-11 shrink-0 items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3">
          <h2 className="text-[13px] font-semibold text-zinc-900">
            {replyTo ? "Reply" : "New message"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-900/5 hover:text-zinc-900"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        {/* Fields */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2">
            <span className="w-10 shrink-0 text-[12px] font-medium text-zinc-500">To</span>
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipients@example.com"
              className="flex-1 bg-transparent text-[13px] text-zinc-900 outline-none placeholder:text-zinc-400"
            />
          </div>
          <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2">
            <span className="w-10 shrink-0 text-[12px] font-medium text-zinc-500">Subject</span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              className="flex-1 bg-transparent text-[13px] text-zinc-900 outline-none placeholder:text-zinc-400"
            />
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message…"
            rows={12}
            className="celer-scroll min-h-[260px] resize-none bg-white px-3 py-3 text-[13.5px] leading-relaxed text-zinc-900 outline-none placeholder:text-zinc-400"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-zinc-200 bg-zinc-50 px-3 py-2.5">
          <div className="min-w-0 text-[11.5px]">
            {status && (
              <span className={status.kind === "ok" ? "text-emerald-600" : "text-red-600"}>
                {status.msg}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={saveDraft}
              disabled={busy}
              className="h-7 rounded-lg border border-zinc-200 bg-white px-3 text-[12.5px] font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              Save draft
            </button>
            <button
              onClick={send}
              disabled={busy}
              className="h-7 rounded-lg bg-zinc-900 px-4 text-[12.5px] font-medium text-white hover:bg-black disabled:opacity-50"
            >
              {busy ? "Sending…" : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
