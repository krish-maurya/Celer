"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Sidebar, type RailView } from "@/components/Sidebar";
import { EmailList } from "@/components/EmailList";
import { ReadingPane } from "@/components/ReadingPane";
import { ComposeModal } from "@/components/ComposeModal";
import { ProfileMenu } from "@/components/ProfileMenu";
import { Segmented, type SegmentItem } from "@/components/Segmented";
import {
  ArchiveIcon,
  ComposeIcon,
  DraftsIcon,
  FilterIcon,
  InboxIcon,
  CloseIcon,
  MailIcon,
  MailOpenIcon,
  SearchIcon,
  SendIcon,
  StarIcon,
  TrashIcon,
} from "@/components/icons";
import { api } from "@/lib/api";
import { toneFor } from "@/lib/avatars";
import { formatCount, type Counts, type Email, type Folder, type Mailbox } from "@/lib/types";

type Tab = "inbox" | "sent" | "drafts";

const MAILBOX_STORAGE_KEY = "celer.mailbox";

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

const VIEW_META: Record<
  Exclude<RailView, "inbox" | "disabled-folder" | "disabled-contacts" | "disabled-notes">,
  { label: string; Icon: typeof InboxIcon; hint: string }
> = {
  starred: { label: "Starred", Icon: StarIcon, hint: "Starred emails from every folder" },
  unread: { label: "Unread", Icon: MailOpenIcon, hint: "Unread emails in your inbox" },
  archive: { label: "Archive", Icon: ArchiveIcon, hint: "Archived emails are hidden from your inbox" },
  trash: { label: "Trash", Icon: TrashIcon, hint: "Delete again to remove an email forever" },
};

export function MailApp() {
  const { user, logout } = useAuth();
  const [emails, setEmails] = useState<Email[]>([]);
  const [counts, setCounts] = useState<Counts>(EMPTY_COUNTS);
  const [meta, setMeta] = useState({ unread: 0, starred: 0 });
  const [loading, setLoading] = useState(true);

  const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const [tab, setTab] = useState<Tab>("inbox");
  const [view, setView] = useState<RailView>("inbox");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [composing, setComposing] = useState(false);
  const [composeMailboxId, setComposeMailboxId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<Email | null>(null);

  // Keeps the last opened email mounted while the reader slides out.
  const [lastOpened, setLastOpened] = useState<Email | null>(null);

  const requestSeq = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const refreshMailboxes = useCallback(async () => {
    try {
      const res = await api.listMailboxes();
      setMailboxes(res.mailboxes);
      return res.mailboxes;
    } catch {
      return null;
    }
  }, []);

  // Pick the starting mailbox: last used, otherwise the primary address.
  useEffect(() => {
    (async () => {
      const list = await refreshMailboxes();
      if (!list || list.length === 0) return;
      const stored = window.localStorage.getItem(MAILBOX_STORAGE_KEY);
      const pick = list.find((m) => m.id === stored) ?? list.find((m) => m.isPrimary) ?? list[0];
      setActiveId(pick.id);
    })();
  }, [refreshMailboxes]);

  useEffect(() => {
    if (activeId) window.localStorage.setItem(MAILBOX_STORAGE_KEY, activeId);
  }, [activeId]);

  const load = useCallback(async () => {
    if (!activeId) return;
    const seq = ++requestSeq.current;
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
        mailboxId: activeId,
      });
      if (seq !== requestSeq.current) return; // a newer request superseded this one

      const list = res.emails.map(decorate);
      setEmails(list);
      setCounts(res.counts ?? EMPTY_COUNTS);
      setMeta({ unread: res.unread ?? 0, starred: res.starred ?? 0 });
      setSelectedId((cur) => (cur && list.some((e) => e.id === cur) ? cur : null));
    } catch (err) {
      console.error(err);
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, [view, tab, debouncedQuery, activeId]);

  useEffect(() => {
    load();
  }, [load]);

  const selected = useMemo(() => emails.find((e) => e.id === selectedId) ?? null, [emails, selectedId]);

  useEffect(() => {
    if (selected) setLastOpened(selected);
  }, [selected]);

  const readerOpen = !!selected;
  const readerEmail = selected ?? lastOpened;

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

  const openReply = useCallback(
    (email: Email) => {
      setReplyTo(email);
      setComposeMailboxId(email.mailboxId ?? activeId);
      setComposing(true);
    },
    [activeId],
  );

  const openCompose = useCallback(() => {
    setReplyTo(null);
    setComposeMailboxId(activeId);
    setComposing(true);
  }, [activeId]);

  const switchMailbox = useCallback(
    (mb: Mailbox) => {
      if (mb.id === activeId) return;
      setActiveId(mb.id);
      setView("inbox");
      setTab("inbox");
      setSelectedId(null);
      setQuery("");
    },
    [activeId],
  );

  const activeMailbox = mailboxes.find((m) => m.id === activeId) ?? null;
  const composeMailbox = mailboxes.find((m) => m.id === composeMailboxId) ?? activeMailbox;

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

  // Section bar: inbox shows its own folder tabs; every other section shows only itself.
  const inInbox = view === "inbox";
  const segmentItems: SegmentItem<string>[] = inInbox
    ? [
        { key: "inbox", label: "Inbox", Icon: InboxIcon, count: counts.INBOX },
        { key: "sent", label: "Sent", Icon: SendIcon, count: counts.SENT },
        { key: "drafts", label: "Drafts", Icon: DraftsIcon, count: counts.DRAFT },
      ]
    : [
        {
          key: view,
          label: VIEW_META[view as keyof typeof VIEW_META]?.label ?? currentLabel,
          Icon: VIEW_META[view as keyof typeof VIEW_META]?.Icon ?? InboxIcon,
          count: currentCount,
        },
      ];
  const segmentValue = inInbox ? tab : view;

  const onSegment = (key: string) => {
    if (inInbox) {
      setTab(key as Tab);
      setSelectedId(null);
    }
  };

  const hint = !inInbox ? VIEW_META[view as keyof typeof VIEW_META]?.hint : null;

  const emptyLabel = debouncedQuery
    ? `No results for “${debouncedQuery}”.`
    : view === "trash"
      ? "Trash is empty."
      : view === "archive"
        ? "No archived emails."
        : view === "starred"
          ? "No starred emails."
          : view === "unread"
            ? "No unread emails."
            : tab === "sent"
              ? "No sent emails yet."
              : tab === "drafts"
                ? "No drafts."
                : "Inbox zero.";

  const listKey = `${activeId}|${view}|${inInbox ? tab : ""}`;

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
        {/* Top bar: section name + search, profile on the right */}
        <header className="flex h-14 shrink-0 items-center gap-4 border-b border-line bg-white pl-5 pr-3">
          <div className="flex shrink-0 items-center gap-2.5">
            <h1
              key={currentLabel}
              className="celer-enter text-[15px] font-semibold tracking-tight text-zinc-900"
            >
              {currentLabel}
            </h1>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium tabular-nums text-zinc-600">
              {formatCount(currentCount)}
            </span>
          </div>

          <div className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg bg-zinc-50 px-3 ring-1 ring-zinc-900/[0.05] transition-[background-color,box-shadow] duration-200 focus-within:bg-white focus-within:ring-zinc-900/15">
            <SearchIcon size={16} className="shrink-0 text-zinc-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${currentLabel.toLowerCase()}`}
              aria-label="Search"
              className="min-w-0 flex-1 bg-transparent text-[13.5px] text-zinc-900 outline-none placeholder:text-zinc-400"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors duration-200 hover:bg-zinc-100 hover:text-zinc-700"
              >
                <CloseIcon size={13} />
              </button>
            )}
            <button
              type="button"
              aria-label="Filter"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors duration-200 hover:bg-zinc-100 hover:text-zinc-700"
            >
              <FilterIcon size={16} />
            </button>
          </div>

          <ProfileMenu
            user={user}
            mailboxes={mailboxes}
            activeId={activeId}
            onSelect={switchMailbox}
            onAdded={(mb) => {
              setMailboxes((prev) => (prev.some((m) => m.id === mb.id) ? prev : [...prev, mb]));
              refreshMailboxes();
              switchMailbox(mb);
            }}
            onOpen={refreshMailboxes}
            onLogout={logout}
          />
        </header>

        {/* Section bar: compose + the tabs that belong to the current section */}
        <div className="flex h-11 shrink-0 items-center gap-2 border-b border-line bg-[#fcfcfa] px-3">
          <button
            type="button"
            onClick={openCompose}
            className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-zinc-900 px-3 text-[12.5px] font-medium text-white shadow-sm transition-colors duration-200 hover:bg-black"
          >
            <ComposeIcon size={14} strokeWidth={2} />
            Compose
          </button>

          <div className="mx-1 h-4 w-px bg-zinc-200" />

          <Segmented items={segmentItems} value={segmentValue} onChange={onSegment} />

          <div className="ml-auto flex min-w-0 items-center gap-3">
            {hint && (
              <span key={view} className="celer-enter hidden truncate text-[12px] text-zinc-400 lg:block">
                {hint}
              </span>
            )}
            {mailboxes.length > 1 && activeMailbox && (
              <span
                key={activeMailbox.id}
                className="celer-enter inline-flex max-w-[260px] shrink-0 items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11.5px] text-zinc-600 ring-1 ring-zinc-900/[0.08]"
                title="Viewing this address"
              >
                <MailIcon size={12} className="shrink-0 text-zinc-400" />
                <span className="truncate">{activeMailbox.address}</span>
              </span>
            )}
          </div>
        </div>

        {/* Main: list + reading pane. The list shrinks while the reader glides in. */}
        <div className="relative flex min-h-0 flex-1 overflow-hidden">
          <div
            className={`celer-list flex min-h-0 min-w-0 flex-col bg-white ${
              readerOpen ? "is-open border-r border-line" : ""
            }`}
          >
            <div key={listKey} className="celer-enter flex min-h-0 flex-1 flex-col">
              <EmailList
                emails={emails}
                selectedId={selectedId}
                loading={loading}
                emptyLabel={emptyLabel}
                onSelect={selectEmail}
                onToggleStar={toggleStar}
                query={query}
              />
            </div>
          </div>

          <div
            className={`celer-reader bg-white ${readerOpen ? "is-open shadow-[-8px_0_24px_rgba(0,0,0,0.06)]" : ""}`}
            inert={!readerOpen}
          >
            {readerEmail && (
              <ReadingPane
                email={readerEmail}
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
        </div>
      </div>

      {composing && (
        <ComposeModal
          replyTo={replyTo}
          mailboxId={composeMailboxId}
          fromAddress={composeMailbox?.address ?? null}
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
