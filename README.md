# Celer — Unified Inbox

Single-repo Next.js 16 inbox, polished from the original `https://github.com/krish-maurya/Celer.git` template.

Matches the original folder structure (`app/api/*`, `lib/*`, `prisma/*`) but with all backend hygiene fixes and a fully working frontend (not a zoomed screenshot clone).

## Quick Start

```bash
npm install
cp .env.example .env   # defaults work locally
npm run setup          # creates SQLite DB + seeds demo data
npm run dev            # http://localhost:3000
```

**Demo login:**
```
email: demo@celer.app
password: password123
```
Click "Use demo account" on login page.

## Features Fixed / Added

**Backend logic & hygiene (original issues fixed):**
- `new Resend()` was at module load and crashed when key missing → now lazy `getResend()` + demo mode
- `requireAuth()` used `redirect("/login")` inside API routes → threw `NEXT_REDIRECT` and returned 500 → now returns `null` and API returns 401 JSON
- `app/layout.tsx` had `LayoutProps` TS error → fixed with proper `children: React.ReactNode`
- Sent emails not persisted → now saved to DB with folder `SENT`
- Star/read only set `true` → now toggles both ways via PATCH
- DELETE permanently deleted → now trash-first, second delete = permanent; restore via PATCH
- No unarchive → added archive toggle
- No search/filter/pagination → added `?folder=&q=&starred=&unread=` + counts endpoint
- Attachments not stored → now JSON field `attachments`
- No rate limiting → 10 reg/min, 20 login/min per IP
- `cookies.txt` with session token committed → removed + gitignored
- Hardcoded ngrok in `next.config.ts` → removed, allows `*.e2b.app`
- `.env.example` missing → added
- SQLite by default for zero setup (easy local), Postgres instructions below

**Frontend (working website):**
- Login / signup with demo autofill
- Inbox / Sent items / Drafts tabs
- Left rail: Inbox, Starred, Unread, Archive, Trash with live count badges
- Search (server-side), click to read / auto mark-as-read
- Star/unstar, archive, trash, restore, delete forever, mark unread
- Compose modal: send (persisted to Sent) or Save draft, Reply
- Logo: long thick horizontal red-orange gradient bar + Poppins wordmark `celer` (faithful to your supplied HTML/CSS)

## API Routes

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/register` | create account + sets session cookie |
| POST | `/api/auth/login` | login |
| POST | `/api/auth/logout` | logout |
| GET | `/api/auth/me` | current user (401 when logged out) |
| GET | `/api/emails?folder=INBOX&q=&starred=&unread=&all=` | list + counts |
| GET | `/api/emails/:id` | single email |
| PATCH | `/api/emails/:id` | `{ isRead, isStarred, folder }` |
| DELETE | `/api/emails/:id` | trash (1st) / permanent (from Trash) |
| POST | `/api/emails/:id/archive` | toggle archive |
| POST | `/api/emails/:id/read` | toggle read |
| POST | `/api/emails/:id/star` | toggle star |
| POST | `/api/emails/drafts` | create draft |
| PUT | `/api/emails/:id/draft` | update draft; `{ send: true }` to send |
| POST | `/api/send-email` | send + persist to Sent |
| POST | `/api/webhooks/resend` | inbound email (Svix verified) |

Auth: HttpOnly SameSite=Lax cookie `session_token`.

## Env

```
DATABASE_URL="file:./dev.db"
SESSION_DAYS=7
RESEND_API_KEY=""              # empty = demo mode
RESEND_WEBHOOK_SECRET=""
RESEND_FROM="Celer <onboarding@resend.dev>"
```

- Demo mode: send succeeds instantly and appears in Sent.
- Set real `RESEND_API_KEY` + `RESEND_WEBHOOK_SECRET` + verified `RESEND_FROM` for real delivery.

## Postgres (optional)

Original repo used Postgres. To switch:

1. In `prisma/schema.prisma` change `provider = "sqlite"` → `"postgresql"`
2. Change model fields `to/cc/bcc/attachments` from `String` to `String[]` / `Json` as needed, or keep JSON strings
3. Set `DATABASE_URL` to Postgres URL
4. `npm run db:push`

For simplicity this unified version uses SQLite + JSON strings (works everywhere).

## Project Structure

```
app/
  layout.tsx        # Inter font + AuthProvider
  page.tsx          # auth gate → MailApp
  mail.tsx          # main inbox state
  login/page.tsx
  api/auth/*, api/emails/*, api/send-email, api/webhooks/resend
components/
  AuthProvider, Sidebar, EmailList, ReadingPane, ComposeModal, CelerLogo, Avatar, icons
lib/
  prisma.ts, auth/*, validations/email.ts, resend.ts, rateLimit.ts, serialize.ts, avatars.ts, types.ts, api.ts
prisma/
  schema.prisma, seed.ts
public/
  upgrade-banner.jpg, rico-avatar.jpg
```

## Build

```bash
npm run build
npm start
```
