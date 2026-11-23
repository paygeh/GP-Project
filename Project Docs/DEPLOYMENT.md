# Deployment Instructions — Imagine That Hair Experience

How to install and launch the appointment-request website on a live server.

- **Application:** Next.js 16 (App Router) + TypeScript web app
- **Database:** Prisma ORM — SQLite for local development, PostgreSQL in production
- **Email:** Gmail SMTP (nodemailer)
- **Audience:** a developer/operator deploying the app

Two deployment paths are documented:
- **Option A — Vercel + Neon (recommended):** managed hosting, no server to maintain.
- **Option B — Self-hosted Linux server (VPS):** full control on your own machine.

---

## 1. Prerequisites

| Requirement | Notes |
| --- | --- |
| **Node.js 20+** (project built on 24 LTS) | `node --version` |
| **npm 10+** | ships with Node |
| **Git** | to clone the repository |
| **A PostgreSQL database** | e.g. a free [Neon](https://neon.tech) project |
| **A Gmail account + App Password** | for sending request emails |
| Source code | `https://github.com/paygeh/GP-Project` |

---

## 2. Environment variables

The app is configured entirely through environment variables. Create these on the
host (Vercel dashboard) or in a `.env` file on the server.

| Variable | Purpose | Example |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db?sslmode=require` |
| `AUTH_SECRET` | Signs the admin session cookie (32+ random chars) | generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `ADMIN_EMAIL` | Initial stylist login email | `lizzy@example.com` |
| `ADMIN_PASSWORD_HASH` | bcrypt hash of the initial password | generate: `npm run hash -- "YourPassword"` |
| `GMAIL_USER` | Gmail address used to send email | `imaginethatwithlizzy@gmail.com` |
| `GMAIL_APP_PASSWORD` | 16-char Google App Password | `abcd efgh ijkl mnop` |
| `NOTIFY_EMAIL` | Where new-request notifications are sent | `lizzy@example.com` |
| `FROM_EMAIL` | Sender shown on outgoing mail (must be `GMAIL_USER`) | `Imagine That <imaginethatwithlizzy@gmail.com>` |

> **Admin credentials note:** `ADMIN_EMAIL` / `ADMIN_PASSWORD_HASH` only **seed** the
> admin account into the database on first launch. After that, the login is changed
> from **Admin → Account**, and editing these variables no longer affects it.

> **Escaping `$` in a `.env` file (Option B only):** a bcrypt hash contains `$`, which
> Next.js treats as a variable reference in `.env` files. Escape each `$` as `\$`
> (the `npm run hash` command prints it already escaped). This is **not** needed in the
> Vercel dashboard, where values are stored literally.

A template of all variables lives in [`.env.example`](../.env.example).

---

## 3. Prepare the database (both options)

Production uses PostgreSQL. In [`prisma/schema.prisma`](../prisma/schema.prisma), set the
datasource provider to `postgresql`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Then, from a machine with the repo and `DATABASE_URL` set to the production database:

```bash
npm install
npx prisma db push      # create the tables
npm run db:seed         # load the services + weekly hours (first deploy only)
```

---

## Option A — Deploy to Vercel + Neon (recommended)

1. **Create the database.** Sign in to [neon.tech](https://neon.tech), create a project,
   and copy the connection string (the "pooled" URL).
2. **Push the schema to Neon** (run locally, one time):
   ```bash
   # schema provider already set to postgresql (section 3)
   DATABASE_URL="<neon-url>" npx prisma db push
   DATABASE_URL="<neon-url>" npm run db:seed
   ```
3. **Import the project into Vercel.** At [vercel.com](https://vercel.com) → *Add New
   Project* → import the GitHub repo. Framework preset auto-detects **Next.js**.
4. **Add the environment variables** (Project → Settings → Environment Variables) from
   section 2, for the **Production** environment. Paste `ADMIN_PASSWORD_HASH` raw (no `\$`
   escaping needed here). Set `TZ` to the salon's timezone, e.g. `America/New_York`.
5. **Deploy.** Vercel runs `npm install`, `prisma generate`, and `next build`
   automatically, then launches the app.
6. **Done.** Vercel gives you a URL (e.g. `imagine-that.vercel.app`). To use a custom
   domain, add it under Project → Settings → Domains.

**Redeploys:** push to the `main` branch and Vercel rebuilds and relaunches automatically.

---

## Option B — Self-hosted on a Linux server (VPS)

For deploying to your own Ubuntu/Debian server.

### B.1 Install runtime dependencies
```bash
# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git
sudo npm install -g pm2          # process manager to keep the app running
```

### B.2 Get the code and configure
```bash
git clone https://github.com/paygeh/GP-Project.git
cd GP-Project
npm install
cp .env.example .env
nano .env                        # fill in the section-2 values (escape $ in the hash as \$)
```

### B.3 Build the database and the app
```bash
# schema provider set to postgresql (section 3)
npx prisma db push
npm run db:seed                  # first launch only
npm run build                    # compile the production build
```

### B.4 Launch and keep it running
```bash
pm2 start "npm run start" --name imagine-that
pm2 save
pm2 startup                      # follow the printed command so it restarts on reboot
```
The app now listens on **port 3000**.

### B.5 Serve it publicly over HTTPS (Nginx reverse proxy)
```bash
sudo apt-get install -y nginx
```
Create `/etc/nginx/sites-available/imagine-that`:
```nginx
server {
    server_name yourdomain.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
Enable it and add a free HTTPS certificate:
```bash
sudo ln -s /etc/nginx/sites-available/imagine-that /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## 4. Verify the deployment

Visit the live URL and confirm:

- [ ] Home page loads with the logo and service menu.
- [ ] `/book` — submitting a request shows the "Request received" page.
- [ ] A notification email arrives at `NOTIFY_EMAIL`, and the client gets a summary email.
- [ ] `/admin` — logging in with the credentials works; the request appears in the
      dashboard; **Approve** / **Decline** work.
- [ ] Times display in the salon's local timezone (set `TZ` if not).

---

## 5. Updating the live site

**Vercel:** `git push origin main` → automatic rebuild.

**Self-hosted:**
```bash
cd GP-Project
git pull
npm install
npx prisma db push      # only if the database schema changed
npm run build
pm2 restart imagine-that
```

---

## 6. Troubleshooting

| Symptom | Fix |
| --- | --- |
| Admin login fails after deploy | Ensure `ADMIN_PASSWORD_HASH` is correct; in a `.env` file the `$` must be escaped as `\$`. |
| Emails not sending | Check `GMAIL_USER` / `GMAIL_APP_PASSWORD` (App Password, not the account password; 2-step verification must be on). Delivery to any inbox requires the Gmail account be valid; unset values make emails log to the console instead. |
| "Can't reach database server" | Verify `DATABASE_URL` and that the DB allows connections (Neon requires `?sslmode=require`). |
| Build fails on Prisma | Confirm the schema `provider` is `postgresql` and `npx prisma generate` ran. |
| Wrong appointment times | Set the `TZ` environment variable to the salon's timezone and redeploy. |

---

_Last updated: 2026-11-22_
