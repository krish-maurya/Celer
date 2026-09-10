export type Folder = "INBOX" | "SENT" | "DRAFT" | "TRASH" | "SPAM" | "ARCHIVED";

export type Attachment = {
  name: string;
  size?: number | null;
  contentType?: string | null;
  downloadUrl?: string | null;
};

export interface Email {
  id: string;
  resendEmailId?: string | null;
  messageId?: string | null;
  fromEmail: string;
  fromName: string | null;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  text: string | null;
  html: string | null;
  attachments: Attachment[];
  folder: Folder;
  isRead: boolean;
  isStarred: boolean;
  receivedAt: string;
  createdAt?: string;
  // UI-only
  avatarUrl?: string;
  avatarTone?: { bg: string; fg: string; label?: string };
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export type Counts = Record<Folder, number>;

export function formatCount(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameYear = d.getFullYear() === now.getFullYear();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfThat = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayDiff = Math.round((startOfToday - startOfThat) / 86400000);

  if (dayDiff === 0) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (dayDiff === 1) return "Yesterday";
  if (dayDiff > 1 && dayDiff < 7) {
    return d.toLocaleDateString([], { weekday: "short" });
  }
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

export function initials(
  name: string | null | undefined,
  email: string,
): string {
  const source = (name || email.split("@")[0]).trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return email[0]?.toUpperCase() ?? "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
