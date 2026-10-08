# Celer project guide

This document explains what the Celer project does, what each important file is responsible for, how requests move through the system, and how to deploy it with a custom `.dev` domain and Resend.

## 1. What Celer is

Celer is a unified inbox application:

- Users register and sign in with an email address and password.
- A user can have one primary mailbox and additional mailbox addresses.
- The app displays inbox, sent, draft, archive, trash, starred, and unread views.
- Users can search, read, star, archive, trash, restore, permanently delete, compose, reply, and save drafts.
- Outbound mail is sent through Resend when `RESEND_API_KEY` is configured.
- Inbound mail is received by Resend, verified through a signed webhook, and saved into the matching Celer mailbox.
- Prisma stores users, sessions, mailboxes, and email messages in PostgreSQL.

The application is a single Next.js repository. The browser UI and API routes run from the same Next.js server.

## 2. Technology stack

| Technology | Role |
| --- | --- |
| Next.js 16 | Full-stack React framework, pages, server components, API route handlers, and production server |
| React 19 | Interactive UI components |
| TypeScript | Static typing |
| Tailwind CSS 4 | Styling |
| Prisma 6 | Database client, schema, migrations, and seed script |
| PostgreSQL | Current database provider in `prisma/schema.prisma` |
| Resend | Sending email and receiving email webhooks |
| Zod | Request and email payload validation |
| bcryptjs | Password hashing |

## 3. Important current-state note

The current source of truth is `prisma/schema.prisma`, which uses `provider = "postgresql"`. Some older files still say SQLite:

- `.env.example` contains `DATABASE_URL="file:./dev.db"`.
- The older README describes SQLite as the default.
- The checked-in migrations include PostgreSQL SQL.

For a dependable setup, use PostgreSQL and set `DATABASE_URL` to a PostgreSQL connection string. Do not switch the provider casually after migrations exist. If SQLite is required for a separate local-only experiment, the Prisma provider, migrations, environment value, and seed behavior must be changed together.

## 4. Repository map

### Root files

| File | Responsibility |
| --- | --- |
| `package.json` | Dependencies and commands such as `dev`, `build`, `db:push`, `db:seed`, and `setup` |
| `tsconfig.json` | Strict TypeScript configuration and `@/*` import alias |
| `next.config.ts` | Next.js configuration; currently allows local development and `*.e2b.app` preview origins |
| `postcss.config.mjs` | PostCSS/Tailwind integration |
| `eslint.config.mjs` | ESLint configuration |
| `next-env.d.ts` | Next.js generated TypeScript declarations |
| `.env.example` | Template for local environment variables; update it if the production contract changes |
| `.env`, `.env.local` | Local secrets and connection strings; never commit them |
| `run.bat`, `run.sh` | Convenience commands for starting development |
| `setup.bat`, `setup.sh` | Convenience setup scripts that install dependencies and run database setup |
| `README.md` | Short historical quick start and feature summary |
| `PROJECT_GUIDE.md` | This detailed architecture and deployment guide |

### `app/`: routes and pages

| File or folder | Responsibility |
| --- | --- |
| `app/layout.tsx` | Root HTML layout, fonts, global providers, and metadata |
| `app/page.tsx` | Auth gate; redirects signed-out users to `/login` and renders `MailApp` for signed-in users |
| `app/login/page.tsx` | Login and registration screen |
| `app/mail.tsx` | Main client-side inbox application state and interactions |
| `app/globals.css` | Global styles, Tailwind theme values, scrollbars, and shared visual rules |
| `app/api/auth/register/route.ts` | Validates registration, hashes the password, creates the user/session, and sets the session cookie |
| `app/api/auth/login/route.ts` | Validates credentials and creates a session |
| `app/api/auth/logout/route.ts` | Invalidates the current session and clears the cookie |
| `app/api/auth/me/route.ts` | Returns the currently authenticated user |
| `app/api/emails/route.ts` | Lists messages with folder/search/star/unread filters and counts |
| `app/api/emails/[emailId]/route.ts` | Reads, patches, or deletes one message |
| `app/api/emails/[emailId]/archive/route.ts` | Toggles archive state |
| `app/api/emails/[emailId]/read/route.ts` | Toggles read/unread state |
| `app/api/emails/[emailId]/star/route.ts` | Toggles starred state |
| `app/api/emails/[emailId]/draft/route.ts` | Updates a draft or sends it |
| `app/api/emails/drafts/route.ts` | Creates a new draft |
| `app/api/mailboxes/route.ts` | Lists mailboxes and adds an additional mailbox address |
| `app/api/send-email/route.ts` | Validates, sends through Resend when configured, and persists the message in `SENT` |
| `app/api/webhooks/resend/route.ts` | Verifies Resend/Svix signatures, retrieves received mail, finds the recipient mailbox, and saves it as `INBOX` |

### `components/`: UI components

| File | Responsibility |
| --- | --- |
| `AuthProvider.tsx` | Loads `/api/auth/me` and exposes user/loading/logout state |
| `Sidebar.tsx` | Mailbox switcher, folders, counts, and navigation |
| `EmailList.tsx` | Scrollable message list, loading state, empty state, sender/avatar, date, attachment, and star controls |
| `ReadingPane.tsx` | Selected message content and message actions |
| `ComposeModal.tsx` | Compose, reply, send, and save-draft UI |
| `ProfileMenu.tsx` | User profile and logout controls |
| `Segmented.tsx` | Reusable segmented control |
| `CelerLogo.tsx` | Celer logo components |
| `Avatar.tsx` | User/sender avatar and verified badge |
| `icons.tsx` | Reusable SVG icon components |

### `lib/`: shared server and domain code

| File or folder | Responsibility |
| --- | --- |
| `lib/prisma.ts` | Creates/reuses the Prisma client, avoiding too many clients during development |
| `lib/auth/session.ts` | Session token creation, lookup, expiration, and cookie constants |
| `lib/auth/password.ts` | Password hashing and password comparison |
| `lib/auth/require-auth.ts` | Reads the session cookie and returns a user or `null`; API routes return JSON `401` responses |
| `lib/mailbox.ts` | Ensures primary mailboxes exist, resolves selected mailboxes, and serializes mailbox data |
| `lib/resend.ts` | Lazily creates the Resend client and reads Resend environment settings |
| `lib/validations/email.ts` | Zod schemas for sent and received email payloads |
| `lib/serialize.ts` | Converts Prisma records into safe API response shapes |
| `lib/types.ts` | Shared frontend email/user/mailbox types and formatting helpers |
| `lib/api.ts` | Shared client API helpers |
| `lib/rateLimit.ts` | In-memory rate limiting for registration and login |
| `lib/avatars.ts` | Avatar display helpers |

### `prisma/`: database

| File or folder | Responsibility |
| --- | --- |
| `prisma/schema.prisma` | PostgreSQL datasource and `User`, `Session`, `Mailbox`, and `Email` models |
| `prisma/seed.ts` | Creates the demo account, two demo mailboxes, and sample messages; it is intended to be repeatable |
| `prisma/migrations/` | Versioned database changes; apply these in deployment rather than editing the database manually |

### `public/`: static assets

| File or folder | Responsibility |
| --- | --- |
| `public/upgrade-banner.jpg` | Static upgrade/promotion artwork used by the UI |
| `public/rico-avatar.jpg` | Static demo avatar |
| `app/favicon.ico` | Browser tab icon |

The important relationships are:

- `User` owns many `Session`, `Mailbox`, and `Email` records.
- `Mailbox` belongs to a `User` and can own many `Email` records.
- `Email` optionally belongs to a `Mailbox`; deleting a mailbox sets `mailboxId` to `null`.
- Deleting a user cascades to sessions, mailboxes, and emails.

## 5. Request and data flow

```mermaid
flowchart LR
    Browser[Browser / React UI] --> Pages[Next.js app pages]
    Pages --> AuthAPI[Auth API routes]
    Pages --> MailAPI[Email and mailbox API routes]
    AuthAPI --> Auth[Session + password helpers]
    MailAPI --> Auth
    Auth --> DB[(PostgreSQL via Prisma)]
    MailAPI --> DB
    MailAPI --> Resend[Resend API]
    Resend --> Webhook[POST /api/webhooks/resend]
    Webhook --> Verify[Verify Svix signature]
    Verify --> DB
```

### Sending an email

1. `ComposeModal.tsx` sends the form data to `POST /api/send-email`.
2. The route checks the session with `requireAuth()`.
3. Zod validates recipients, subject, body, and optional attachments.
4. The route resolves the selected mailbox.
5. If `RESEND_API_KEY` exists, Resend sends the message using `RESEND_FROM`.
6. The message is saved in PostgreSQL with folder `SENT`, even in demo mode.

### Receiving an email

1. Resend receives mail for the configured receiving domain.
2. Resend calls `POST /api/webhooks/resend`.
3. The route verifies `svix-id`, `svix-timestamp`, and `svix-signature`.
4. It retrieves the full message from Resend.
5. It finds the Celer mailbox matching the recipient address.
6. It saves the message as `INBOX`.

### Read, star, archive, trash, and draft actions

The UI calls the dedicated route under `app/api/emails/[emailId]/`. Each route authenticates the request and scopes the query by the signed-in user so one user cannot operate on another user's message.

## 6. Sequence diagram: sending and receiving mail

```mermaid
sequenceDiagram
    actor User
    participant UI as ComposeModal / MailApp
    participant Next as Next.js API
    participant Auth as Session helper
    participant DB as PostgreSQL
    participant R as Resend

    User->>UI: Write message and click Send
    UI->>Next: POST /api/send-email
    Next->>Auth: Read session cookie
    Auth->>DB: Load session and user
    DB-->>Auth: Authenticated user
    Auth-->>Next: User
    Next->>R: Send using RESEND_FROM
    R-->>Next: Resend message ID or error
    Next->>DB: Save message with folder SENT
    DB-->>Next: Saved email
    Next-->>UI: Success + serialized email
    UI-->>User: Show message in Sent

    R->>Next: POST /api/webhooks/resend
    Next->>R: Verify signed webhook and retrieve message
    R-->>Next: Verified email payload
    Next->>DB: Find mailbox by recipient
    DB-->>Next: User and mailbox
    Next->>DB: Save message with folder INBOX
    DB-->>Next: Saved received email
    Next-->>R: 200 success
```

## 7. Local development setup

### Prerequisites

- Node.js compatible with the Next.js 16 project.
- npm.
- A reachable PostgreSQL database.
- Git.

### Setup

1. Install dependencies:

   ```powershell
   npm install
   ```

2. Copy `.env.example` to `.env` or `.env.local`.

3. Set a PostgreSQL URL. A typical local value is:

   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/celer?schema=public"
   SESSION_DAYS=7
   RESEND_API_KEY=""
   RESEND_WEBHOOK_SECRET=""
   RESEND_FROM="Celer <onboarding@resend.dev>"
   ```

4. Generate the Prisma client:

   ```powershell
   npm run db:generate
   ```

5. Apply the current schema:

   ```powershell
   npm run db:push
   ```

   For a database where migrations are the source of truth, use Prisma migrations according to your deployment process instead of mixing `db:push` and migration history.

6. Seed demo data:

   ```powershell
   npm run db:seed
   ```

   Or run the existing combined command:

   ```powershell
   npm run setup
   ```

7. Start development:

   ```powershell
   npm run dev
   ```

8. Open `http://localhost:3000`.

Demo account:

```text
email: demo@celer.app
password: password123
```

### Useful commands

```powershell
npm run lint
npm run build
npm start
npm run db:studio
```

`db:studio` opens Prisma Studio against the database from `DATABASE_URL`. Never point destructive development commands at production.

## 8. Production deployment

The examples below use Vercel for the Next.js app, but the same environment variables work on another Node-compatible host.

1. Create a managed PostgreSQL database.
2. Deploy the repository to the hosting provider.
3. Add the production environment variables:

   ```env
   DATABASE_URL="postgresql://..."
   SESSION_DAYS="7"
   RESEND_API_KEY="re_..."
   RESEND_WEBHOOK_SECRET="whsec_..."
   RESEND_FROM="Celer <hello@mail.example.dev>"
   ```

4. Run Prisma generation during the build:

   ```powershell
   npx prisma generate
   ```

5. Apply migrations as a release step. For a migration-based production database, use:

   ```powershell
   npx prisma migrate deploy
   ```

6. Run the production build:

   ```powershell
   npm run build
   ```

7. Start the server with:

   ```powershell
   npm start
   ```

Do not run `prisma db push`, `prisma migrate reset`, or the demo seed against production unless you deliberately understand the consequences.

## 9. Custom `.dev` application domain

There are two different domains to configure:

- **Application domain**: where users open Celer, such as `app.example.dev`.
- **Email domain**: the domain Resend uses for sending/receiving, such as `mail.example.dev`.

They can be the same parent domain but do not need to be the same hostname. The `.dev` top-level domain is HSTS-preloaded, so production browsers require HTTPS.

### Point the app domain to the hosting provider

1. Deploy the app and find the provider-generated URL.
2. In the hosting provider, add `app.example.dev` as a custom domain.
3. At the DNS provider for `example.dev`, add the exact records the hosting provider displays. Commonly:
   - `CNAME` for `app` pointing to the provider hostname.
   - An apex/root record only if you also want `example.dev`.
4. Wait for DNS propagation.
5. Confirm the provider has issued an HTTPS certificate.
6. Test:
   - `https://app.example.dev/login`
   - login
   - inbox loading
   - send and receive flows

Do not add a DNS record for the app domain to Resend. Resend DNS records are for email authentication and receiving.

## 10. Configure a custom sending domain in Resend

Use a subdomain such as `mail.example.dev` for email. This keeps email DNS separate from the website and is easier to delegate or troubleshoot.

1. Sign in to Resend.
2. Open **Domains** and choose **Add Domain**.
3. Enter `mail.example.dev` (or your chosen `.dev` email subdomain).
4. Resend will show DNS records for that exact domain. Add every record exactly as shown at your DNS provider:
   - SPF `TXT` record.
   - DKIM `TXT` record(s), usually under Resend-provided selector hostnames.
   - Any additional verification records Resend displays.
5. Add a DMARC record at `_dmarc.example.dev`, for example:

   ```text
   Type: TXT
   Name: _dmarc
   Value: v=DMARC1; p=none; rua=mailto:dmarc@example.dev
   ```

   Start with `p=none`, observe reports, and only later move to a stricter policy after verifying all legitimate senders.
6. If you want to receive mail through Resend, configure the receiving/MX records that Resend shows for the receiving domain. Do not guess these values; use the current values from the Resend dashboard.
7. Remove conflicting old SPF records. A domain should publish one combined SPF policy, not multiple separate SPF TXT records.
8. Click **Verify** in Resend and wait until the domain is verified.
9. Update the production app variable:

   ```env
   RESEND_FROM="Celer <hello@mail.example.dev>"
   ```

10. Redeploy the app and send a real test message.

The `onboarding@resend.dev` sender is suitable for demo/testing only. It is not the final custom-domain sender.

## 11. Configure inbound email webhooks in Resend

The implemented endpoint is:

```text
https://app.example.dev/api/webhooks/resend
```

Configure it in Resend as follows:

1. Create a Resend webhook.
2. Set the URL to the HTTPS endpoint above.
3. Subscribe to the `email.received` event.
4. Copy the webhook signing secret into:

   ```env
   RESEND_WEBHOOK_SECRET="whsec_..."
   ```

5. Ensure the Resend receiving domain has the MX records shown by Resend.
6. Ensure the recipient address already exists in Celer as a `Mailbox` row. The webhook matches the incoming recipient address to `Mailbox.address` (or the user's login email).
7. Redeploy and send a test message to that mailbox.
8. Check the webhook delivery logs and the Celer server logs if the message does not appear.

The webhook rejects missing or invalid Svix signature headers. Keep the endpoint public, but never disable signature verification.

## 12. Environment variable reference

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection URL |
| `SESSION_DAYS` | No | Session lifetime; defaults to 7 days |
| `RESEND_API_KEY` | For real email | Enables real outbound Resend delivery; empty means demo mode |
| `RESEND_WEBHOOK_SECRET` | For inbound email | Verifies the Resend/Svix webhook signature |
| `RESEND_FROM` | For real email | Verified sender, for example `Celer <hello@mail.example.dev>` |

Never put `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, `DATABASE_URL`, or session secrets in client-side variables such as `NEXT_PUBLIC_*`, source control, screenshots, or issue reports.

## 13. Troubleshooting checklist

### Database connection errors

- Confirm the PostgreSQL server is running.
- Confirm the database exists.
- Confirm `DATABASE_URL` is loaded by the process running Next.js.
- Run `npm run db:generate`.
- Run `npm run db:push` locally or `npx prisma migrate deploy` in production.
- Check that the provider in `prisma/schema.prisma` matches the database URL.

### Email sends but does not arrive

- Confirm `RESEND_API_KEY` is set in the deployed environment.
- Confirm `RESEND_FROM` uses a verified Resend domain.
- Check Resend logs for rejected recipients or DNS/authentication errors.
- Confirm SPF and DKIM are verified.
- Check that there is only one SPF policy.

### Incoming mail does not appear

- Confirm the Resend webhook URL is HTTPS and points to the deployed app.
- Confirm the `email.received` event is enabled.
- Confirm `RESEND_WEBHOOK_SECRET` matches the webhook.
- Confirm MX records point to the values Resend provides.
- Confirm the recipient address is present in Celer as a mailbox.
- Inspect Resend webhook delivery logs and the Next.js server logs.

### `.dev` domain does not open

- Confirm the DNS record is at the authoritative DNS provider.
- Wait for propagation and verify the record with a DNS lookup tool.
- Confirm the hosting provider shows the domain as verified.
- Use `https://`, not plain HTTP, because `.dev` requires HTTPS in browsers.

## 14. Safe change workflow

1. Read the relevant route, component, helper, and Prisma model before editing.
2. Keep authentication and user scoping in every private API route.
3. Validate request bodies with the existing Zod schemas.
4. Make the database change in `prisma/schema.prisma`.
5. Generate/apply a migration when the change is intended for shared or production databases.
6. Run:

   ```powershell
   npm run lint
   npm run build
   ```

7. Test login, inbox loading, read/star/archive/trash, draft saving, sending, and inbound webhook behavior when those areas are affected.
8. Update this guide or the short README when setup behavior changes.
