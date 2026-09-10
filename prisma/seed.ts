import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@celer.app";
  const password = "password123";

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: "Demo User", passwordHash: await bcrypt.hash(password, 12) },
  });

  console.log(`Seed user: ${email} / ${password}`);

  // Clean prior seed mail for this user (keep it idempotent).
  await prisma.email.deleteMany({ where: { userId: user.id } });

  const now = new Date();
  const june29 = new Date("2026-06-29T09:30:00Z");
  const june28 = new Date("2026-06-28T15:10:00Z");

  const rows = [
    {
      fromEmail: "rico.oktananda1@gmail.com",
      fromName: "Rico Oktananda",
      subject: "We Need Your Feedback on Our New UX Design",
      text:
        "Hi Team,\n\nWe're refining our product and need your insights on our user experience (UX) design. Your feedback is crucial in shaping the next release — what feels clear, where you got stuck, and what you would change.\n\nPlease review the attached deck and drop your comments by end of next week.\n\nBest regards,\nRico",
      folder: "INBOX",
      isRead: false,
      isStarred: false,
      receivedAt: june28,
      attachments: [{ name: "designpr.pptx", size: 2_400_000, contentType: "application/vnd.ms-powerpoint" }],
    },
    {
      fromEmail: "alicia@deel.support",
      fromName: "Alicia from Deel",
      subject: "Your money is on the way!",
      text:
        "Your Deel withdrawal is all set, and your money is on its way. Funds typically arrive within 1–3 business days depending on your bank. You can track the status anytime from your Deel dashboard.",
      folder: "INBOX",
      isRead: true,
      isStarred: false,
      receivedAt: june29,
      attachments: [],
    },
    {
      fromEmail: "read@substack.com",
      fromName: "Substack Read",
      subject: "Research as a leisure activity, revisited",
      text:
        "This week on Substack: essays on doing research for fun, the return of the personal blog, and a long read on how curiosity compounds over a career.",
      folder: "INBOX",
      isRead: true,
      isStarred: false,
      receivedAt: june28,
      attachments: [],
    },
    {
      fromEmail: "news@vercel.com",
      fromName: "Vercel",
      subject: "What's new in Next.js",
      text: "A roundup of framework updates, performance wins, and community projects shipped this month.",
      folder: "INBOX",
      isRead: true,
      isStarred: true,
      receivedAt: new Date(june29.getTime() - 3600_000),
      attachments: [],
    },
  ];

  for (const r of rows) {
    await prisma.email.create({
      data: {
        userId: user.id,
        fromEmail: r.fromEmail,
        fromName: r.fromName,
        to: JSON.stringify([email]),
        cc: "[]",
        bcc: "[]",
        subject: r.subject,
        text: r.text,
        attachments: JSON.stringify(r.attachments),
        folder: r.folder,
        isRead: r.isRead,
        isStarred: r.isStarred,
        receivedAt: r.receivedAt,
      },
    });
  }

  // One sent email so the Sent tab isn't empty.
  await prisma.email.create({
    data: {
      userId: user.id,
      fromEmail: email,
      fromName: "Demo User",
      to: JSON.stringify(["rico.oktananda1@gmail.com"]),
      cc: "[]",
      bcc: "[]",
      subject: "Re: UX Design feedback",
      text: "Thanks Rico — going through the deck now and will share notes by Friday.",
      attachments: "[]",
      folder: "SENT",
      isRead: true,
      receivedAt: now,
    },
  });

  console.log(`Seeded ${rows.length + 1} emails.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
