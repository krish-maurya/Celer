"use client";

import { CelerBar } from "./CelerLogo";
import {
  InboxPlusIcon,
  StarIcon,
  MailOpenIcon,
  ArchiveIcon,
  TrashIcon,
  FolderIcon,
  UsersIcon,
  NotesIcon,
} from "./icons";
import type { IconType } from "./icons";

export type RailView =
  | "inbox"
  | "starred"
  | "unread"
  | "archive"
  | "trash"
  | "disabled-folder"
  | "disabled-contacts"
  | "disabled-notes";

type Item = {
  key: RailView;
  label: string;
  Icon: IconType;
  badge?: number;
};

export function Sidebar({
  view,
  onView,
  counts,
  unreadCount,
  starredCount,
}: {
  view: RailView;
  onView: (v: RailView) => void;
  counts: Record<string, number>;
  unreadCount: number;
  starredCount: number;
}) {
  const items: Item[] = [
    { key: "inbox", label: "Inbox", Icon: InboxPlusIcon, badge: counts.INBOX ?? 0 },
    { key: "starred", label: "Starred", Icon: StarIcon, badge: starredCount },
    { key: "unread", label: "Unread", Icon: MailOpenIcon, badge: unreadCount },
    { key: "archive", label: "Archive", Icon: ArchiveIcon, badge: counts.ARCHIVED ?? 0 },
    { key: "trash", label: "Trash", Icon: TrashIcon, badge: counts.TRASH ?? 0 },
  ];

  const disabledItems: Item[] = [
    { key: "disabled-folder", label: "Folders", Icon: FolderIcon },
    { key: "disabled-contacts", label: "Contacts", Icon: UsersIcon },
    { key: "disabled-notes", label: "Notes", Icon: NotesIcon },
  ];

  return (
    <nav className="flex w-[64px] shrink-0 flex-col items-center border-r border-line bg-[#fbfbfa] py-4">
      {/* Logo: the gradient bar only */}
      <div className="mb-6 flex h-9 items-center justify-center">
        <CelerBar size={26} />
      </div>

      {/* Main nav */}
      <div className="flex flex-col gap-1">
        {items.map(({ key, label, Icon, badge }) => {
          const active = view === key;
          return (
            <button
              key={key}
              type="button"
              title={label}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              onClick={() => onView(key)}
              className={`group relative flex h-9 w-9 items-center justify-center rounded-lg transition-[background-color,color,box-shadow] duration-300 ${
                active
                  ? "bg-[#18181b] text-white shadow-sm"
                  : "text-zinc-500 hover:bg-zinc-900/[0.06] hover:text-zinc-900"
              }`}
            >
              <Icon size={18} strokeWidth={active ? 2 : 1.6} />
              {badge !== undefined && badge > 0 && (
                <span
                  className={`absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium leading-none ${
                    active ? "bg-white text-zinc-900" : "bg-zinc-900 text-white"
                  }`}
                >
                  {badge > 99 ? "99" : badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="my-4 h-px w-8 bg-line" />

      {/* Disabled */}
      <div className="flex flex-col gap-1">
        {disabledItems.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            title={`${label} — soon`}
            aria-label={label}
            disabled
            className="flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-lg text-zinc-300"
          >
            <Icon size={18} strokeWidth={1.5} />
          </button>
        ))}
      </div>

      <div className="flex-1" />
    </nav>
  );
}
