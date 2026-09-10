"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Sidebar, type RailView } from "@/components/Sidebar";
import { EmailList } from "@/components/EmailList";
import { ReadingPane } from "@/components/ReadingPane";
import { ComposeModal } from "@/components/ComposeModal";
import { ComposeIcon, InboxIcon, SendIcon, DraftsIcon } from "@/components/icons";
import { CelerMark } from "@/components/CelerLogo";
import { api } from "@/lib/api";
import { toneFor } from "@/lib/avatars";
import { formatCount, type Counts, type Email, type Folder } from "@/lib/types";

type Tab = "inbox" | "sent" | "drafts";

function decorate(e: Email): Email {
  return { ...e, avatarTone: toneFor(e.fromEmail || (e.to[0] ?? "x@x.com")) };
}

const EMPTY_COUNTS: Counts = {
  INBOX: 0,
  SENT: 0,
  DRAFT: 0,
  TRASH: 0,
  SPAM: 0,
  ARCHIVED: 0,
};

export function MailApp() {
  const { user, logout } = useAuth();
  const [emails, setEmails] = useState<Email[]>([]);
  const [counts, setCounts] = useState<Counts>(EMPTY_COUNTS);
  const [meta, setMeta] = useState({ unread: 0, starred: 0 });
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState<Tab>("inbox");
  const [view, setView] = useState<RailView>("inbox");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [composing, setComposing] = useState(false);
  const [replyTo, setReplyTo] = useState<Email | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let folder: Folder | "ALL" = "INBOX";
      let starred = false;
      let unread = false;
      if (view === "archive") folder = "ARCHIVED";
      else if (view === "trash") folder = "TRASH";
      else if (view === "starred") {
        folder = "ALL";
        starred = true;
      } else if (view === "unread") {
        folder = "INBOX";
        unread = true;
      } else if (tab === "sent") folder = "SENT";
      else if (tab === "drafts") folder = "DRAFT";
      else folder = "INBOX";

      const res = await api.listEmails({
        folder,
        q: debouncedQuery || undefined,
        starred,
        unread,
      });
      const list = res.emails.map(decorate);
      setEmails(list);
      setCounts(res.counts ?? EMPTY_COUNTS);
      setMeta({ unread: res.unread ?? 0, starred: res.starred ?? 0 });
      // Keep selected if still exists, else clear
      setSelectedId((cur) => (cur && list.some((e) => e.id === cur) ? cur : null));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [view, tab, debouncedQuery]);

  useEffect(() => {
    load();
  }, [load]);

  const selected = useMemo(() => emails.find((e) => e.id === selectedId) ?? null, [emails, selectedId]);

  const optimistic = useCallback((id: string, patch: Partial<Email>) => {
    setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }, []);

  const selectEmail = useCallback(
    async (email: Email) => {
      setSelectedId(email.id);
      if (!email.isRead && email.folder === "INBOX") {
        optimistic(email.id, { isRead: true });
        try {
          await api.patchEmail(email.id, { isRead: true });
        } catch {}
      }
    },
    [optimistic],
  );

  const closeReading = useCallback(() => {
    setSelectedId(null);
  }, []);

  const toggleStar = useCallback(
    async (email: Email) => {
      const next = !email.isStarred;
      optimistic(email.id, { isStarred: next });
      try {
        await api.patchEmail(email.id, { isStarred: next });
      } catch {
        optimistic(email.id, { isStarred: !next });
      }
    },
    [optimistic],
  );

  const archive = useCallback(
    async (email: Email) => {
      setEmails((prev) => prev.filter((e) => e.id !== email.id));
      setSelectedId(null);
      try {
        await api.patchEmail(email.id, { folder: "ARCHIVED" });
      } catch {
        load();
      }
    },
    [load],
  );

  const trash = useCallback(
    async (email: Email) => {
      setEmails((prev) => prev.filter((e) => e.id !== email.id));
      setSelectedId(null);
      try {
        await api.deleteEmail(email.id);
      } catch {
        load();
      }
    },
    [load],
  );

  const restore = useCallback(
    async (email: Email) => {
      setEmails((prev) => prev.filter((e) => e.id !== email.id));
      setSelectedId(null);
      try {
        await api.patchEmail(email.id, { folder: "INBOX", isRead: true });
      } catch {
        load();
      }
    },
    [load],
  );

  const markUnread = useCallback(
    async (email: Email) => {
      optimistic(email.id, { isRead: false });
      try {
        await api.patchEmail(email.id, { isRead: false });
      } catch {}
    },
    [optimistic],
  );

  const openReply = useCallback((email: Email) => {
    setReplyTo(email);
    setComposing(true);
  }, []);

  const openCompose = useCallback(() => {
    setReplyTo(null);
    setComposing(true);
  }, []);

  const tabs: { key: Tab; label: string; Icon: typeof InboxIcon; count?: number }[] = [
    { key: "inbox", label: "Inbox", Icon: InboxIcon, count: counts.INBOX },
    { key: "sent", label: "Sent", Icon: SendIcon, count: counts.SENT },
    { key: "drafts", label: "Drafts", Icon: DraftsIcon, count: counts.DRAFT },
  ];

  const currentLabel =
    view === "starred"
      ? "Starred"
      : view === "unread"
        ? "Unread"
        : view === "archive"
          ? "Archive"
          : view === "trash"
            ? "Trash"
            : tab === "sent"
              ? "Sent"
              : tab === "drafts"
                ? "Drafts"
                : "Inbox";

  const currentCount =
    view === "starred" || view === "unread"
      ? emails.length
      : counts[
          view === "archive"
            ? "ARCHIVED"
            : view === "trash"
              ? "TRASH"
              : tab === "sent"
                ? "SENT"
                : tab === "drafts"
                  ? "DRAFT"
                  : "INBOX"
        ] ?? emails.length;

  const emptyLabel = debouncedQuery
    ? `No results for “${debouncedQuery}”.`
    : view === "trash"
      ? "Trash is empty."
      : view === "archive"
        ? "No archived emails."
        : tab === "sent"
          ? "No sent emails yet."
          : tab === "drafts"
            ? "No drafts."
            : "Inbox zero.";

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white">
      <Sidebar
        view={view}
        onView={(v) => {
          setView(v);
          if (v === "inbox") setTab("inbox");
          setQuery("");
        }}
        counts={counts}
        unreadCount={meta.unread}
        starredCount={meta.starred}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header - with consistent logo */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-white px-4">
          <div className="flex items-center gap-4">
            <CelerMark size={20} />
            <div className="h-4 w-px bg-zinc-200" />
            <div className="flex items-center gap-2">
              <h1 className="text-[14px] font-semibold tracking-tight text-zinc-900">{currentLabel}</h1>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium tabular-nums text-zinc-600">
                {formatCount(currentCount)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* User account with hover menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu((v) => !v)}
                onMouseEnter={() => setShowUserMenu(true)}
                className="flex items-center gap-2.5 rounded-full border border-zinc-200 bg-white px-1.5 py-1 pr-3 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-medium text-white">
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="hidden text-left sm:block">
                  <p className="max-w-[100px] truncate text-[12.5px] font-medium leading-none text-zinc-900">
                    {user?.name}
                  </p>
                  <p className="max-w-[100px] truncate text-[10px] leading-none text-zinc-500">
                    {user?.email}
                  </p>
                </div>
              </button>

              {/* Hover / click menu */}
              {showUserMenu && (
                <div
                  onMouseLeave={() => setShowUserMenu(false)}
                  className="absolute right-0 top-full z-40 mt-2 w-64 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg"
                >
                  <div className="flex items-center gap-3 rounded-lg bg-zinc-50 p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-[13px] font-medium text-white">
                      {user?.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-zinc-900">{user?.name}</p>
                      <p className="truncate text-[11.5px] text-zinc-500">{user?.email}</p>
                    </div>
                  </div>

                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between rounded-lg px-3 py-2 text-[12.5px] text-zinc-700">
                      <span>All mail</span>
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium">
                        {counts.INBOX + counts.SENT + counts.DRAFT}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg px-3 py-2 text-[12.5px] text-zinc-700">
                      <span>Unread</span>
                      <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[11px] font-medium text-white">
                        {meta.unread}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg px-3 py-2 text-[12.5px] text-zinc-700">
                      <span>Starred</span>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                        {meta.starred}
                      </span>
                    </div>
                  </div>

                  <div className="my-2 h-px bg-zinc-100" />

                  <button
                    onClick={logout}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 py-2 text-[12.5px] font-medium text-white hover:bg-black"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex h-11 shrink-0 items-center gap-2 border-b border-line bg-[#fcfcfa] px-3">
          <button
            onClick={openCompose}
            className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-zinc-900 px-3 text-[12.5px] font-medium text-white shadow-sm hover:bg-black"
          >
            <ComposeIcon size={14} strokeWidth={2} />
            Compose
          </button>

          <div className="mx-1 h-4 w-px bg-zinc-200" />

          <div className="flex items-center gap-0.5 rounded-lg bg-zinc-100 p-0.5">
            {tabs.map(({ key, label, Icon, count }) => {
              const active = tab === key && (view === "inbox" || view === "starred" || view === "unread");
              return (
                <button
                  key={key}
                  onClick={() => {
                    setTab(key);
                    setView("inbox");
                    setQuery("");
                  }}
                  className={`inline-flex h-6 items-center gap-1.5 rounded-md px-2.5 text-[12.5px] font-medium transition-colors ${
                    active
                      ? "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-900/5"
                      : "text-zinc-500 hover:text-zinc-700"
                  }`}
                >
                  <Icon size={13} strokeWidth={active ? 2 : 1.6} />
                  {label}
                  {count !== undefined && count > 0 && (
                    <span className={`ml-0.5 text-[11px] ${active ? "text-zinc-500" : "text-zinc-400"}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main - email list full width when no selection, slide-in reading pane */}
        <div className="relative flex min-h-0 flex-1 overflow-hidden">
          {/* Email list - full width when no selected, 380px when selected */}
          <div
            className={`flex shrink-0 flex-col border-r border-line bg-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
              selected ? "w-[380px] min-w-[340px] max-w-[420px]" : "w-full"
            }`}
          >
            <EmailList
              emails={emails}
              selectedId={selectedId}
              loading={loading}
              emptyLabel={emptyLabel}
              onSelect={selectEmail}
              onToggleStar={toggleStar}
              query={query}
              onQuery={setQuery}
              title={currentLabel}
            />
          </div>

          {/* Reading pane - slide in sandbox */}
          <div
            className={`absolute inset-y-0 right-0 flex w-full flex-col bg-white shadow-[-8px_0_24px_rgba(0,0,0,0.06)] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] md:relative md:w-auto md:flex-1 md:shadow-none ${
              selected ? "translate-x-0" : "translate-x-full md:translate-x-full md:hidden"
            }`}
          >
            {selected && (
              <ReadingPane
                email={selected}
                onClose={closeReading}
                onArchive={archive}
                onTrash={trash}
                onRestore={restore}
                onReply={openReply}
                onToggleStar={toggleStar}
                onMarkUnread={markUnread}
              />
            )}
          </div>

          {/* Mobile overlay when reading open */}
          {selected && (
            <button
              onClick={closeReading}
              className="absolute inset-0 z-0 bg-zinc-900/5 backdrop-blur-[1px] md:hidden"
              aria-label="Close email"
            />
          )}
        </div>
      </div>

      {composing && (
        <ComposeModal
          replyTo={replyTo}
          onClose={() => {
            setComposing(false);
            setReplyTo(null);
          }}
          onDone={load}
        />
      )}
    </div>
  );
}
