import type { Counts, Email, Folder, Mailbox, User } from "./types";

// All requests go to /api/* which Next.js proxies to the Express backend.
// Cookies (session) are sent automatically (same-origin).
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }

  if (!res.ok) {
    const msg =
      (data as { error?: string } | null)?.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data as T;
}

export const api = {
  me: () => request<{ success: boolean; user: User }>("/api/auth/me"),

  login: (email: string, password: string) =>
    request<{ success: boolean; user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (name: string, email: string, password: string) =>
    request<{ success: boolean; user: User }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),

  logout: () => request<{ success: boolean }>("/api/auth/logout", { method: "POST" }),

  listMailboxes: () => request<{ success: boolean; mailboxes: Mailbox[] }>("/api/mailboxes"),

  addMailbox: (address: string, name?: string) =>
    request<{ success: boolean; mailbox: Mailbox }>("/api/mailboxes", {
      method: "POST",
      body: JSON.stringify({ address, name }),
    }),

  listEmails: (params: {
    folder?: Folder | "ALL";
    q?: string;
    starred?: boolean;
    unread?: boolean;
    mailboxId?: string | null;
  }) => {
    const qs = new URLSearchParams();
    if (params.mailboxId) qs.set("mailbox", params.mailboxId);
    if (params.folder && params.folder !== "ALL") qs.set("folder", params.folder);
    if (params.folder === "ALL") qs.set("all", "true");
    if (params.q) qs.set("q", params.q);
    if (params.starred) qs.set("starred", "true");
    if (params.unread) qs.set("unread", "true");
    return request<{
      success: boolean;
      mailbox: Mailbox;
      emails: Email[];
      counts: Counts;
      unread?: number;
      starred?: number;
    }>(`/api/emails?${qs.toString()}`);
  },

  patchEmail: (id: string, patch: Partial<Pick<Email, "isRead" | "isStarred" | "folder">>) =>
    request<{ success: boolean }>(`/api/emails/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),

  deleteEmail: (id: string) =>
    request<{ success: boolean; trashed?: boolean; deleted?: boolean }>(
      `/api/emails/${id}`,
      { method: "DELETE" },
    ),

  sendEmail: (payload: { to: string[]; subject: string; text: string; mailboxId?: string | null }) =>
    request<{ success: boolean; email: Email; demo?: boolean; message?: string }>(
      "/api/send-email",
      { method: "POST", body: JSON.stringify(payload) },
    ),

  createDraft: (payload: { to?: string[]; subject?: string; text?: string; mailboxId?: string | null }) =>
    request<{ success: boolean; email: Email }>("/api/emails/drafts", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
