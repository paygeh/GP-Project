# Hair Studio — Appointment Booking

A simple, elegant booking site for a solo hairstylist. Customers browse the
service menu and book an open time in under a minute; the stylist manages
services, hours, time off, and appointments from a private admin dashboard.

Built with **Next.js 16**, **TypeScript**, **Tailwind CSS v4**, **Prisma**, and a
lightweight **jose** cookie session for admin auth.

---

## Quick start (local)

```bash
npm install
npm run db:push     # create the local SQLite database from the schema
npm run db:seed     # add example services + a weekly schedule
npm run dev         # http://localhost:3000
```

- **Customer site:** http://localhost:3000
- **Booking flow:** http://localhost:3000/book
- **Admin dashboard:** http://localhost:3000/admin
  - Default login: `admin@example.com` / `salon2026` (change these — see below)

### Environment

Copy `.env.example` to `.env` (a working `.env` is already included for local dev):

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | SQLite file in dev; Postgres URL in production |
| `AUTH_SECRET` | Signs the admin session cookie (use a long random string) |
| `ADMIN_EMAIL` | The stylist's login email |
| `ADMIN_PASSWORD_HASH` | bcrypt hash of the login password |

Change the admin password:

```bash
npm run hash -- "your-new-password"
# paste the printed ADMIN_PASSWORD_HASH into .env, and set ADMIN_EMAIL
```

---

## The brand

All colors and fonts are tokens in one place — `src/app/globals.css` (palette) and
`src/app/layout.tsx` (fonts). The palette is **#800080 purple · #C9A0DC lilac ·
#DAA520 gold**; swap those values to rebrand.

**Type:** titles use the **Andrea Bellarosa** script (`src/app/fonts/`), the salon
name doubles as the signature wordmark (no separate logo), prices/counts use a serif
for legibility, and UI text uses Inter.

> ⚠️ **Font license:** Andrea Bellarosa (blankids Studio) is licensed for **personal
> use only**. Using it on a commercial salon site requires a paid license
> (fontbundles.net/blankids). Buy the commercial license before launch, or replace the
> file at `src/app/fonts/AndreaBellarosa.ttf` and the `localFont` src in `layout.tsx`
> with a licensed look-alike.

---

## How it works

- **Services, hours, time off, and settings** live in the database and are edited
  from `/admin`. Seed data is in `prisma/seed.ts`.
- **Open time slots** are computed in `src/lib/availability.ts` from the weekly
  hours minus existing bookings and time off, then re-checked server-side when a
  booking is submitted to avoid double-booking.
- **Admin routes** are protected by `src/proxy.ts`; mutations re-check the session.

---

## Deploying (Vercel + Neon Postgres)

The app runs on SQLite locally but is written to move to Postgres with no code
changes:

1. Create a free Postgres database at [neon.tech](https://neon.tech) and copy its
   connection string.
2. In `prisma/schema.prisma`, change the datasource provider:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Push the schema and seed:
   ```bash
   DATABASE_URL="<neon-url>" npx prisma db push
   DATABASE_URL="<neon-url>" npm run db:seed
   ```
4. Deploy to [Vercel](https://vercel.com): import the repo and set the env vars
   (`DATABASE_URL`, `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`). The build
   runs `prisma generate` automatically via `@prisma/client`.

> **Timezone:** appointment times use the server's timezone. Run the server in the
> salon's local timezone (set the `TZ` env var on Vercel, e.g. `TZ=America/New_York`)
> so times display correctly.

---

## Scripts

| Script | Does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run db:push` | Sync the schema to the database |
| `npm run db:seed` | Seed example data |
| `npm run db:reset` | Wipe + recreate + reseed (dev only) |
| `npm run db:studio` | Open Prisma Studio to inspect data |
| `npm run hash -- "pw"` | Generate an admin password hash |

## Not in v1 (easy to add later)

Email/SMS reminders and online deposits/payments were intentionally left out of
the first version; the data model and booking flow are structured to add them.
