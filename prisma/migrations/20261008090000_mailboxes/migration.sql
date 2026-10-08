-- CreateTable
CREATE TABLE "Mailbox" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "name" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Mailbox_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Email" ADD COLUMN "mailboxId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Mailbox_address_key" ON "Mailbox"("address");

-- CreateIndex
CREATE INDEX "Mailbox_userId_idx" ON "Mailbox"("userId");

-- CreateIndex
CREATE INDEX "Email_mailboxId_idx" ON "Email"("mailboxId");

-- AddForeignKey
ALTER TABLE "Mailbox" ADD CONSTRAINT "Mailbox_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Email" ADD CONSTRAINT "Email_mailboxId_fkey" FOREIGN KEY ("mailboxId") REFERENCES "Mailbox"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: every existing user gets a primary mailbox for their login address,
-- and all of their existing emails are attached to it.
INSERT INTO "Mailbox" ("id", "address", "name", "isPrimary", "userId")
SELECT gen_random_uuid()::text, u."email", u."name", true, u."id"
FROM "User" u;

UPDATE "Email" e
SET "mailboxId" = m."id"
FROM "Mailbox" m
WHERE m."userId" = e."userId" AND m."isPrimary" = true AND e."mailboxId" IS NULL;
