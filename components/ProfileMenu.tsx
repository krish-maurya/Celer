"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar } from "./Avatar";
import { CheckIcon, ChevronDownIcon, MailIcon, PlusIcon } from "./icons";
import { api } from "@/lib/api";
import { toneFor } from "@/lib/avatars";
import type { Mailbox, User } from "@/lib/types";
import { formatCount } from "@/lib/types";

/**
 * Account button in the top bar. Hover (or click) opens a panel listing every
 * email address assigned to the account; picking one switches the inbox.
 */
export function ProfileMenu({
  user,
  mailboxes,
  activeId,
  onSelect,
  onAdded,
  onOpen,
  onLogout,
}: {
  user: User | null;
  mailboxes: Mailbox[];
  activeId: string | null;
  onSelect: (mb: Mailbox) => void;
  onAdded: (mb: Mailbox) => void;
  onOpen: () => void;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [address, setAddress] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initial = user?.name?.[0]?.toUpperCase() || "U";
  const totalUnread = mailboxes.reduce((n, m) => n + (m.unread ?? 0), 0);

  function show() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (!open) {
      setOpen(true);
      onOpen();
    }
  }

  function scheduleHide() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    // Small grace period so the pointer can cross the gap without flicker.
    closeTimer.current = setTimeout(() => setOpen(false), 140);
  }

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  async function addAddress(e: React.FormEvent) {
    e.preventDefault();
    const value = address.trim();
    if (!value) return;
    setAdding(true);
    setError(null);
    try {
      const res = await api.addMailbox(value);
      setAddress("");
      onAdded({ ...res.mailbox, unread: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add this address");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div
      ref={wrapRef}
      className="relative"
      onMouseEnter={show}
      onMouseLeave={scheduleHide}
    >
      <button
        type="button"
        onClick={show}
        aria-haspopup="menu"
        aria-expanded={open}
        className="group flex items-center gap-2.5 rounded-full border border-zinc-200 bg-white py-1 pl-1.5 pr-2.5 transition-[border-color,background-color] duration-300 hover:border-zinc-300 hover:bg-zinc-50"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-medium text-white">
          {initial}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block max-w-[140px] truncate text-[12.5px] font-medium leading-tight text-zinc-900">
            {user?.name}
          </span>
          <span className="block max-w-[140px] truncate text-[10.5px] leading-tight text-zinc-500">
            {mailboxes.find((m) => m.id === activeId)?.address ?? user?.email}
          </span>
        </span>
        <ChevronDownIcon
          size={14}
          className={`hidden text-zinc-400 transition-transform duration-300 ease-[var(--ease-glide)] sm:block ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        role="menu"
        className={`celer-menu absolute right-0 top-full z-40 mt-2 w-[300px] rounded-2xl border border-zinc-200/80 bg-white p-2 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.18)] ${
          open ? "is-open" : ""
        }`}
      >
        {/* Account header */}
        <div className="flex items-center gap-3 rounded-xl bg-zinc-50 p-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-[13px] font-medium text-white">
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-zinc-900">{user?.name}</p>
            <p className="truncate text-[11.5px] text-zinc-500">{user?.email}</p>
          </div>
        </div>

        {/* Assigned addresses */}
        <div className="mt-2 flex items-center justify-between px-2 pb-1 pt-1.5">
          <span className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-400">
            Email addresses
          </span>
          <span className="text-[10.5px] tabular-nums text-zinc-400">
            {mailboxes.length} · {formatCount(totalUnread)} unread
          </span>
        </div>

        <div className="celer-scroll max-h-[260px] space-y-0.5 overflow-y-auto">
          {mailboxes.map((mb) => {
            const active = mb.id === activeId;
            return (
              <button
                key={mb.id}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  onSelect(mb);
                  setOpen(false);
                }}
                className={`group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors duration-200 ${
                  active ? "bg-zinc-900 text-white" : "text-zinc-800 hover:bg-zinc-100"
                }`}
              >
                <Avatar
                  name={mb.name}
                  email={mb.address}
                  tone={toneFor(mb.address)}
                  size={30}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-[12.5px] font-medium">
                      {mb.name || mb.address.split("@")[0]}
                    </span>
                    {mb.isPrimary && (
                      <span
                        className={`shrink-0 rounded px-1 py-px text-[9.5px] font-semibold uppercase tracking-wide ${
                          active ? "bg-white/15 text-white/80" : "bg-zinc-100 text-zinc-500"
                        }`}
                      >
                        Primary
                      </span>
                    )}
                  </span>
                  <span
                    className={`block truncate text-[11.5px] ${
                      active ? "text-white/70" : "text-zinc-500"
                    }`}
                  >
                    {mb.address}
                  </span>
                </span>
                {(mb.unread ?? 0) > 0 && !active && (
                  <span className="shrink-0 rounded-full bg-zinc-900 px-1.5 py-0.5 text-[10.5px] font-medium tabular-nums text-white">
                    {formatCount(mb.unread ?? 0)}
                  </span>
                )}
                {active && <CheckIcon size={14} className="shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Add an address */}
        <form onSubmit={addAddress} className="mt-2 border-t border-zinc-100 pt-2">
          <label className="flex h-9 items-center gap-2 rounded-xl bg-zinc-50 px-2.5 ring-1 ring-zinc-900/[0.04] transition-[box-shadow,background-color] duration-200 focus-within:bg-white focus-within:ring-zinc-900/15">
            <MailIcon size={14} className="shrink-0 text-zinc-400" />
            <input
              type="email"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Add another email address"
              className="min-w-0 flex-1 bg-transparent text-[12.5px] text-zinc-900 outline-none placeholder:text-zinc-400"
            />
            <button
              type="submit"
              disabled={adding || !address.trim()}
              aria-label="Add email address"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-zinc-900 text-white transition-all duration-200 hover:bg-black disabled:opacity-30"
            >
              <PlusIcon size={13} strokeWidth={2.2} />
            </button>
          </label>
          {error && <p className="mt-1.5 px-1 text-[11.5px] text-red-600">{error}</p>}
        </form>

        <div className="my-2 h-px bg-zinc-100" />

        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center justify-center rounded-xl bg-zinc-900 py-2 text-[12.5px] font-medium text-white transition-colors duration-200 hover:bg-black"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
