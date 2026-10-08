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
  PencilIcon,
  RestoreIcon,
} from "./icons";
import type { IconType } from "./icons";
import { formatDate, type Email } from "@/lib/types";

/** Icon-only action on the right-hand rail. The label shows as a tooltip on hover. */
function RailButton({
  label,
  onClick,
  active,
  danger,
  primary,
  Icon,
  iconProps,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  primary?: boolean;
  Icon: IconType;
  iconProps?: { fill?: string; strokeWidth?: number };
}) {
  const tone = primary
    ? "bg-zinc-900 text-white shadow-sm hover:bg-black"
    : active
      ? "bg-amber-50 text-amber-500 ring-1 ring-amber-200 hover:bg-amber-100"
      : danger
        ? "text-zinc-500 hover:bg-red-50 hover:text-red-600"
        : "text-zinc-500 hover:bg-zinc-900/[0.06] hover:text-zinc-900";

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-200 ${tone}`}
      >
        <Icon size={17} strokeWidth={primary ? 2 : 1.7} {...iconProps} />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute right-full top-1/2 z-20 mr-2 -translate-y-1/2 translate-x-1 whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-[11.5px] font-medium text-white opacity-0 shadow-md transition-[opacity,transform] duration-200 ease-out group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:translate-x-0 group-focus-within:opacity-100"
      >
        {label}
      </span>
    </div>
  );
}

function RailDivider() {
  return <div className="my-1 h-px w-6 bg-zinc-200" />;
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
  email: Email;
  onClose: () => void;
  onArchive: (e: Email) => void;
  onTrash: (e: Email) => void;
  onRestore: (e: Email) => void;
  onReply: (e: Email) => void;
  onToggleStar: (e: Email) => void;
  onMarkUnread: (e: Email) => void;
}) {
  const isTrash = email.folder === "TRASH";
  const isDraft = email.folder === "DRAFT";
  const isSent = email.folder === "SENT";
  const counterpart = isSent || isDraft ? email.to.join(", ") : email.fromEmail;
  const counterpartName = isSent || isDraft ? email.to.join(", ") : email.fromName ?? email.fromEmail;

  return (
    <section className="flex h-full min-w-0 flex-1 bg-white">
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar: close only */}
        <div className="flex h-12 shrink-0 items-center border-b border-zinc-200 bg-white/80 px-3 backdrop-blur">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 text-[12.5px] font-medium text-zinc-700 transition-colors duration-200 hover:bg-zinc-50"
          >
            <CloseIcon size={14} />
            Close
          </button>
        </div>

        {/* Body. Keyed by id so switching emails fades the new one in. */}
        <div key={email.id} className="celer-scroll celer-enter min-h-0 flex-1 overflow-y-auto">
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
                Draft — use the edit button on the right to finish and send it.
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
                      className="group flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 transition-colors duration-200 hover:border-zinc-300 hover:bg-zinc-50"
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
          </div>
        </div>
      </div>

      {/* Vertical action rail on the right. Icons only; labels appear on hover. */}
      <aside
        aria-label="Email actions"
        className="flex w-14 shrink-0 flex-col items-center gap-1.5 border-l border-zinc-200 bg-[#fcfcfa] py-3"
      >
        {isTrash ? (
          <RailButton label="Restore" Icon={RestoreIcon} onClick={() => onRestore(email)} />
        ) : (
          <RailButton
            label={isDraft ? "Edit draft" : "Reply"}
            Icon={isDraft ? PencilIcon : MailReplyIcon}
            primary
            onClick={() => onReply(email)}
          />
        )}

        <RailButton
          label={email.isStarred ? "Unstar" : "Star"}
          Icon={StarIcon}
          active={email.isStarred}
          iconProps={{ fill: email.isStarred ? "currentColor" : "none" }}
          onClick={() => onToggleStar(email)}
        />

        {!isTrash && (
          <>
            <RailButton label="Mark as unread" Icon={MailOpenIcon} onClick={() => onMarkUnread(email)} />
            <RailDivider />
            <RailButton label="Archive" Icon={ArchiveIcon} onClick={() => onArchive(email)} />
          </>
        )}

        <RailDivider />

        {isTrash ? (
          <RailButton label="Delete forever" Icon={TrashIcon} danger onClick={() => onTrash(email)} />
        ) : (
          <RailButton label="Move to trash" Icon={TrashIcon} danger onClick={() => onTrash(email)} />
        )}
      </aside>
    </section>
  );
}
