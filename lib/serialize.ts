export function parseJsonArray<T>(raw: string | null | undefined, fallback: T[] = []): T[] {
  if (!raw) return fallback;
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

export function stringifyJson(v: unknown): string {
  return JSON.stringify(v ?? []);
}

export type Attachment = {
  name: string;
  size?: number;
  contentType?: string;
  url?: string;
};

export function serializeEmail(row: any) {
  return {
    id: row.id,
    resendEmailId: row.resendEmailId,
    messageId: row.messageId,
    fromEmail: row.fromEmail,
    fromName: row.fromName,
    to: parseJsonArray<string>(row.to),
    cc: parseJsonArray<string>(row.cc),
    bcc: parseJsonArray<string>(row.bcc),
    attachments: parseJsonArray<Attachment>(row.attachments),
    subject: row.subject,
    text: row.text,
    html: row.html,
    folder: row.folder,
    isRead: row.isRead,
    isStarred: row.isStarred,
    receivedAt: row.receivedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    userId: row.userId,
  };
}
