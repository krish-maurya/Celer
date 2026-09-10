"use client";

import { Avatar, VerifiedBadge } from "./Avatar";
import { FilterIcon, StarIcon, PaperclipIcon, SearchIcon } from "./icons";
import { formatDate, type Email } from "@/lib/types";

export function EmailList({
  emails,
  selectedId,
  loading,
  emptyLabel,
  onSelect,
  onToggleStar,
  query,
  onQuery,
  title,
}: {
  emails: Email[];
  selectedId: string | null;
  loading: boolean;
  emptyLabel: string;
  onSelect: (e: Email) => void;
  onToggleStar: (e: Email) => void;
  query: string;
  onQuery: (q: string) => void;
  title: string;
}) {
  return (
    <section className="flex min-h-0 flex-1 flex-col">
      {/* Search */}
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-line px-3">
        <div className="flex h-8 flex-1 items-center gap-2 rounded-lg bg-zinc-50 px-2.5 ring-1 ring-zinc-900/[0.04] focus-within:bg-white focus-within:ring-zinc-900/10">
          <SearchIcon size={16} className="shrink-0 text-zinc-400" />
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder={`Search ${title.toLowerCase()}`}
            className="w-full bg-transparent text-[13.5px] text-zinc-900 outline-none placeholder:text-zinc-400"
          />
        </div>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700"
          aria-label="Filter"
        >
          <FilterIcon size={16} />
        </button>
      </div>

      <div className="celer-scroll flex-1 overflow-y-auto">
        {loading && (
          <div className="space-y-3 p-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex gap-3">
                  <div className="h-9 w-9 rounded-full bg-zinc-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 rounded bg-zinc-100" />
                    <div className="h-3 w-full rounded bg-zinc-50" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && emails.length === 0 && (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-50 ring-1 ring-zinc-900/5">
              <span className="text-lg">✦</span>
            </div>
            <p className="max-w-[220px] text-[13.5px] font-medium leading-snug text-zinc-900">{emptyLabel}</p>
            <p className="mt-1 max-w-[240px] text-[12.5px] leading-snug text-zinc-500">
              {query ? "Try a different search term." : "Compose your first email to get started."}
            </p>
          </div>
        )}

        <div className="pb-2">
          {emails.map((email) => {
            const active = email.id === selectedId;
            const unread = !email.isRead && email.folder === "INBOX";
            const preview = (email.text?.replace(/\s+/g, " ").trim() || email.subject || "").slice(0, 120);
            return (
              <div
                key={email.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(email)}
                onKeyDown={(e) => e.key === "Enter" && onSelect(email)}
                className={`group relative flex cursor-pointer gap-2.5 border-b border-zinc-50 px-3 py-3 text-left transition-colors last:border-0 ${
                  active ? "bg-zinc-900/[0.04]" : "hover:bg-zinc-50"
                }`}
              >
                {active && <div className="absolute bottom-0 left-0 top-0 w-0.5 bg-zinc-900" />}
                {unread && !active && (
                  <div className="absolute left-1 top-5 h-1.5 w-1.5 rounded-full bg-[#ff4d1c]" />
                )}

                <Avatar
                  name={email.fromName}
                  email={email.folder === "SENT" ? email.to[0] ?? email.fromEmail : email.fromEmail}
                  url={email.avatarUrl}
                  tone={email.avatarTone}
                  size={32}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1">
                      <span
                        className={`truncate text-[13px] leading-tight ${
                          unread ? "font-semibold text-zinc-900" : "font-medium text-zinc-700"
                        }`}
                      >
                        {email.folder === "SENT"
                          ? `To: ${email.to[0] || "—"}`
                          : email.fromName ?? email.fromEmail.split("@")[0]}
                      </span>
                      {email.folder === "INBOX" && <VerifiedBadge size={12} />}
                    </span>
                    <span
                      className={`shrink-0 text-[11px] tabular-nums ${
                        unread ? "font-medium text-zinc-700" : "text-zinc-400"
                      }`}
                    >
                      {formatDate(email.receivedAt)}
                    </span>
                  </div>

                  <div className="mt-0.5 flex items-center gap-1.5">
                    <p className="truncate text-[12px] leading-tight text-zinc-500">
                      {email.folder !== "SENT" ? email.fromEmail : email.subject}
                    </p>
                    {email.attachments.length > 0 && (
                      <PaperclipIcon size={11} className="shrink-0 text-zinc-400" />
                    )}
                  </div>

                  <p
                    className={`mt-1 line-clamp-2 text-[12.5px] leading-[1.5] ${
                      unread ? "text-zinc-700" : "text-zinc-500"
                    }`}
                  >
                    {email.folder === "DRAFT" && (
                      <span className="font-medium text-amber-600">Draft · </span>
                    )}
                    {preview}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStar(email);
                  }}
                  aria-label="Star"
                  className={`mt-0.5 shrink-0 self-start rounded p-1 transition-colors ${
                    email.isStarred
                      ? "text-amber-400"
                      : "text-zinc-200 opacity-0 group-hover:opacity-100 hover:text-zinc-400"
                  }`}
                >
                  <StarIcon size={14} fill={email.isStarred ? "currentColor" : "none"} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
