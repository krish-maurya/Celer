import { prisma } from "@/lib/prisma";

export type AuthUser = { id: string; email: string; name: string };

/**
 * Make sure the user always has a primary mailbox for their login address.
 * Covers accounts created before mailboxes existed.
 */
export async function ensurePrimaryMailbox(user: AuthUser) {
  const existing = await prisma.mailbox.findFirst({
    where: { userId: user.id, isPrimary: true },
  });
  if (existing) return existing;

  // The address may already exist (e.g. a stale row); reuse it if it belongs to this user.
  const byAddress = await prisma.mailbox.findUnique({ where: { address: user.email } });
  if (byAddress && byAddress.userId === user.id) {
    return prisma.mailbox.update({ where: { id: byAddress.id }, data: { isPrimary: true } });
  }

  return prisma.mailbox.create({
    data: { userId: user.id, address: user.email, name: user.name, isPrimary: true },
  });
}

/**
 * Resolve the mailbox to act on: the requested one if it belongs to the user,
 * otherwise the user's primary mailbox.
 */
export async function resolveMailbox(user: AuthUser, mailboxId?: string | null) {
  if (mailboxId) {
    const mb = await prisma.mailbox.findFirst({ where: { id: mailboxId, userId: user.id } });
    if (mb) return mb;
  }
  return ensurePrimaryMailbox(user);
}

export function serializeMailbox(mb: {
  id: string;
  address: string;
  name: string | null;
  isPrimary: boolean;
}) {
  return {
    id: mb.id,
    address: mb.address,
    name: mb.name,
    isPrimary: mb.isPrimary,
  };
}
