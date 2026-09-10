"use client";

import { Avatar } from "./Avatar";
import {
  ArchiveIcon,
  TrashIcon,
  MailReplyIcon,
  StarIcon,
  PaperclipIcon,
  MailOpenIcon,
  CloseIcon,
} from "./icons";
import { formatDate, type Email } from "@/lib/types";

function ActionButton({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border px-2.5 text-[12.5px] font-medium transition-colors ${
        danger
          ? "border-zinc-200 bg-white text-zinc-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
      }`}
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function IconButton({
  label,
  onClick,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
        active
          ? "border-amber-200 bg-amber-50 text-amber-500"
          : "border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
      }`}
    >
      {children}
    </button>
  );
}

function bytes(n?: number | null) {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function ReadingPane({
  email,
  onClose,
  onArchive,
  onTrash,
  onRestore,
  onReply,
  onToggleStar,
  onMarkUnread,
}: {
  email: Email | null;
  onClose: () => void;
  onArchive: (e: Email) => void;
  onTrash: (e: Email) => void;
  onRestore: (e: Email) => void;
  onReply: (e: Email) => void;
  onToggleStar: (e: Email) => void;
  onMarkUnread: (e: Email) => void;
}) {
  if (!email) {
    return (
      <section className="hidden min-w-0 flex-1 flex-col items-center justify-center bg-[#fcfcfa] px-8 md:flex">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white ring-1 ring-zinc-900/5">
          <MailOpenIcon size={20} className="text-zinc-400" />
        </div>
        <p className="mt-4 text-[14px] font-medium text-zinc-900">Select an email</p>
        <p className="mt-1 max-w-[260px] text-center text-[13px] leading-snug text-zinc-500">
          Choose an email from the list to read it here.
        </p>
      </section>
    );
  }

  const isTrash = email.folder === "TRASH";
  const isDraft = email.folder === "DRAFT";
  const isSent = email.folder === "SENT";
  const counterpart = isSent || isDraft ? email.to.join(", ") : email.fromEmail;
  const counterpartName = isSent || isDraft ? email.to.join(", ") : email.fromName ?? email.fromEmail;

  return (
    <section className="celer-scroll flex min-h-0 flex-1 flex-col overflow-y-auto bg-white">
      {/* Top bar with close */}
      <div className="sticky top-0 z-10 flex h-12 shrink-0 items-center justify-between border-b border-zinc-200 bg-white/80 px-3 backdrop-blur">
        <div className="flex items-center gap-1.5">
          <button
            onClick={onClose}
            className="inline-flex h-7 items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 text-[12.5px] font-medium text-zinc-700 hover:bg-zinc-50"
          >
            <CloseIcon size={14} />
            Close
          </button>
          <div className="ml-2 h-4 w-px bg-zinc-200" />
          <div className="flex items-center gap-1">
            {isTrash ? (
              <>
                <ActionButton label="Restore" onClick={() => onRestore(email)}>
                  <MailOpenIcon size={14} />
                </ActionButton>
                <ActionButton label="Delete forever" onClick={() => onTrash(email)} danger>
                  <TrashIcon size={14} />
                </ActionButton>
              </>
            ) : (
              <>
                <ActionButton label="Archive" onClick={() => onArchive(email)}>
                  <ArchiveIcon size={14} />
                </ActionButton>
                <ActionButton label="Trash" onClick={() => onTrash(email)} danger>
                  <TrashIcon size={14} />
                </ActionButton>
                <ActionButton label="Unread" onClick={() => onMarkUnread(email)}>
                  <MailOpenIcon size={14} />
                </ActionButton>
                <ActionButton label={isDraft ? "Edit" : "Reply"} onClick={() => onReply(email)}>
                  <MailReplyIcon size={14} />
                </ActionButton>
              </>
            )}
          </div>
        </div>

        <IconButton label="Star" onClick={() => onToggleStar(email)} active={email.isStarred}>
          <StarIcon size={16} fill={email.isStarred ? "currentColor" : "none"} />
        </IconButton>
      </div>

      <div className="mx-auto w-full max-w-[720px] px-6 py-5 sm:px-8">
        {/* Sender */}
        <div className="flex items-start gap-3.5">
          <Avatar
            name={isSent || isDraft ? null : email.fromName}
            email={counterpart || email.fromEmail}
            url={email.avatarUrl}
            tone={email.avatarTone}
            size={40}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="truncate text-[15px] font-semibold tracking-tight text-zinc-900">
                {counterpartName}
              </span>
              <span className="hidden text-[12px] text-zinc-500 sm:block">
                {formatDate(email.receivedAt)}
              </span>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[12.5px] text-zinc-500">
              <span className="rounded bg-zinc-50 px-1.5 py-0.5 ring-1 ring-zinc-900/5">
                {isSent || isDraft ? "To" : "From"}: {counterpart}
              </span>
              {email.cc.length > 0 && (
                <span className="rounded bg-zinc-50 px-1.5 py-0.5 ring-1 ring-zinc-900/5">
                  Cc: {email.cc.join(", ")}
                </span>
              )}
            </div>
          </div>
        </div>

        <h1 className="mt-6 text-[22px] font-semibold leading-[1.25] tracking-tight text-zinc-900">
          {email.subject || "(no subject)"}
        </h1>

        {isDraft && (
          <div className="mt-4 rounded-lg border border-dashed border-amber-200 bg-amber-50/50 px-3 py-2 text-[12.5px] text-amber-800">
            Draft — click Reply to edit and send.
          </div>
        )}

        <div className="prose prose-zinc mt-6 max-w-none">
          <div className="space-y-4 text-[14px] leading-[1.7] text-zinc-700">
            {(email.text ?? "")
              .split("\n")
              .filter((l) => l.trim().length > 0)
              .map((para, i) => (
                <p key={i} className="whitespace-pre-wrap">
                  {para}
                </p>
              ))}
            {!(email.text ?? "").trim() && email.html && (
              <div className="prose-sm" dangerouslySetInnerHTML={{ __html: email.html }} />
            )}
          </div>
        </div>

        {email.attachments.length > 0 && (
          <div className="mt-8 border-t border-zinc-100 pt-6">
            <div className="flex items-center gap-2">
              <PaperclipIcon size={14} className="text-zinc-400" />
              <span className="text-[12.5px] font-medium text-zinc-700">
                {email.attachments.length} attachment{email.attachments.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {email.attachments.map((a, i) => (
                <div
                  key={i}
                  className="group flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white">
                    <span className="text-[11px] font-medium">
                      {a.name.split(".").pop()?.slice(0, 3).toUpperCase() || "FILE"}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-medium text-zinc-900">{a.name}</p>
                    {a.size ? <p className="text-[11px] text-zinc-500">{bytes(a.size)}</p> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10 flex items-center gap-2 border-t border-zinc-100 pt-6">
          <button
            onClick={() => onReply(email)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-zinc-900 px-3 text-[12.5px] font-medium text-white hover:bg-black"
          >
            <MailReplyIcon size={14} />
            Reply
          </button>
          <button
            onClick={onClose}
            className="inline-flex h-8 items-center rounded-lg border border-zinc-200 bg-white px-3 text-[12.5px] font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Close
          </button>
        </div>
      </div>
    </section>
  );
}
