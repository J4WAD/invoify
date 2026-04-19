# FacturApp — Run & Deploy Guide

This document covers running FacturApp locally and deploying it to production.

---

## Prerequisites

- **Node.js 20+** (LTS)
- **PostgreSQL 15+** (Neon, Supabase, Railway, or self-hosted all work)
- **npm 10+**
- A Resend account (https://resend.com) for transactional email — optional but recommended

---

## 1. Local development

```bash
# Clone and install
git clone <your-fork-url> facturapp
cd facturapp
npm install --legacy-peer-deps

# Environment
cp .env.example .env
# Edit .env and fill in:
#   NEXTAUTH_SECRET   (openssl rand -hex 32)
#   AUTH_SECRET       (same value as NEXTAUTH_SECRET)
#   DATABASE_URL      (postgresql://user:pass@host:5432/facturapp)
#   RESEND_API_KEY    (optional — falls back to Nodemailer/Gmail)
#   EMAIL_FROM        (e.g., "FacturApp <no-reply@yourdomain.com>")

# Database
npx prisma migrate dev --name init
npx prisma generate

# Create the first admin
npm run create-admin
# Prompts for username + password (min 12 chars)

# Run
npm run dev
# → http://localhost:3000
```

### First-time setup flow

1. Visit `/` — redirects to `/fr/auth/login`
2. If no admin exists yet, login redirects to `/setup` — create one there (interactive alternative to `npm run create-admin`)
3. After login, you land on the dashboard at `/dashboard`

### Useful commands

```bash
npm run dev              # dev server with HMR
npm run build            # production build (standalone output)
npm start                # run the built app
npm run lint             # Next.js lint
npx tsc --noEmit         # type check
npm test                 # unit tests (Vitest)
npm run check-i18n       # fail if any locale is missing keys
npm run create-admin     # interactive admin user creation
npx prisma studio        # database GUI
npx prisma migrate dev   # apply schema changes
```

---

## 2. Docker — single container

```bash
docker build -t facturapp .
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:pass@db-host:5432/facturapp \
  -e NEXTAUTH_SECRET=$(openssl rand -hex 32) \
  -e AUTH_SECRET=$NEXTAUTH_SECRET \
  -e NEXTAUTH_URL=https://facturapp.siferone.com \
  -e NEXT_PUBLIC_SITE_URL=https://facturapp.siferone.com \
  -e RESEND_API_KEY=re_xxx \
  -e EMAIL_FROM="FacturApp <no-reply@yourdomain.com>" \
  facturapp
```

The Dockerfile uses Next.js's `output: "standalone"` mode — final image is ~200 MB.

---

## 3. Docker Compose — app + PostgreSQL

Create `docker-compose.yml` in the project root:

```yaml
version: "3.9"

services:
  db:
    image: postgres:16
    restart: always
    environment:
      POSTGRES_DB: facturapp
      POSTGRES_USER: facturapp
      POSTGRES_PASSWORD: ${DB_PASSWORD:?set DB_PASSWORD in .env}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "facturapp"]
      interval: 5s
      timeout: 3s
      retries: 10

  app:
    build: .
    restart: always
    depends_on:
      db:
        condition: service_healthy
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://facturapp:${DB_PASSWORD}@db:5432/facturapp
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET:?}
      AUTH_SECRET: ${NEXTAUTH_SECRET}
      NEXTAUTH_URL: ${NEXTAUTH_URL:-http://localhost:3000}
      NEXT_PUBLIC_SITE_URL: ${NEXT_PUBLIC_SITE_URL:-http://localhost:3000}
      RESEND_API_KEY: ${RESEND_API_KEY:-}
      EMAIL_FROM: ${EMAIL_FROM:-FacturApp <no-reply@localhost>}
    command: >
      sh -c "npx prisma migrate deploy && node server.js"

volumes:
  pgdata:
```

Then:

```bash
# .env (at least)
DB_PASSWORD=change-me-please
NEXTAUTH_SECRET=$(openssl rand -hex 32)
NEXTAUTH_URL=https://facturapp.siferone.com
NEXT_PUBLIC_SITE_URL=https://facturapp.siferone.com

docker compose up -d --build
docker compose exec app npm run create-admin
```

---

## 4. Vercel deployment

Vercel serverless works but has two caveats:
- Puppeteer PDF generation needs `@sparticuz/chromium` (already configured)
- Cold starts add ~2s to first PDF per region

Steps:

1. Push to GitHub
2. Import project at https://vercel.com/new
3. Set environment variables (copy from `.env.example`):
   - `DATABASE_URL` — use Neon (https://neon.tech) free tier
   - `NEXTAUTH_SECRET`, `AUTH_SECRET` (same value)
   - `NEXTAUTH_URL`, `NEXT_PUBLIC_SITE_URL` (Vercel URL or your domain)
   - `RESEND_API_KEY`, `EMAIL_FROM`
   - `NEXT_PUBLIC_SENTRY_DSN` (optional)
4. Deploy. Then, from your local machine:

   ```bash
   DATABASE_URL=<prod-url> npx prisma migrate deploy
   DATABASE_URL=<prod-url> npm run create-admin
   ```

---

## 5. VPS / bare metal (Ubuntu + Nginx + PM2)

```bash
# On the server
apt install nodejs npm postgresql nginx
createdb facturapp
createuser facturapp --pwprompt

cd /opt
git clone <your-fork-url> facturapp
cd facturapp
npm ci --legacy-peer-deps

# Environment
cp .env.example .env
$EDITOR .env   # fill in values

# Build + migrate
npm run build
npx prisma migrate deploy
npm run create-admin

# Start with PM2
npm install -g pm2
pm2 start ".next/standalone/server.js" --name facturapp
pm2 save
pm2 startup
```

**Nginx** (`/etc/nginx/sites-available/facturapp`):

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    client_max_body_size 10m;   # logo uploads

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}

server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}
```

```bash
ln -s /etc/nginx/sites-available/facturapp /etc/nginx/sites-enabled/
certbot --nginx -d yourdomain.com
nginx -t && systemctl reload nginx
```

---

## 6. Environment variables — full reference

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | yes | Session encryption (min 32 chars) |
| `AUTH_SECRET` | yes | Same value as `NEXTAUTH_SECRET` (Next-Auth v5 reads both) |
| `NEXTAUTH_URL` | yes | Public URL of the app (no trailing slash) |
| `NEXT_PUBLIC_SITE_URL` | yes | Public URL for canonical/OG links |
| `RESEND_API_KEY` | no | Resend — preferred for password-reset email |
| `EMAIL_FROM` | no | From address — must be verified in Resend |
| `NODEMAILER_EMAIL`, `NODEMAILER_PW` | no | Gmail fallback for email |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | no | Rate limiting (graceful no-op without) |
| `NEXT_PUBLIC_SENTRY_DSN` | no | Error monitoring |
| `NEXT_PUBLIC_AUTHOR_WEBSITE` | no | Shown in footer (default: siferone.com) |
| `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_ENDPOINT` | no | PDF archival (not yet wired) |
| `LOG_LEVEL` | no | Pino log level (default: `info`) |

---

## 7. Post-deploy checklist

Run through this before announcing launch:

- [ ] `npx prisma migrate deploy` ran successfully in production
- [ ] `npm run create-admin` created the first admin user
- [ ] Visiting `/setup` as a guest returns 403 (setup locked after first admin)
- [ ] `curl https://facturapp.siferone.com/api/health` returns `{ "status": "ok", "db": "ok" }`
- [ ] HTTPS enforced — `curl -I https://facturapp.siferone.com` shows `strict-transport-security`
- [ ] Password reset email delivers end-to-end (try with a real email)
- [ ] PDF generation works — create, finalize, and download one invoice
- [ ] DZD amount-in-words reads naturally in French (e.g., *douze mille trois cent…*)
- [ ] UI tested in French, English, and one RTL locale (Arabic)
- [ ] Brand color picker warns on low contrast (< 4.5:1)
- [ ] Dashboard shows correct YTD revenue and unpaid totals
- [ ] Daily `pg_dump` or equivalent backup configured (`pg_dump facturapp | gzip > /backups/$(date +%F).sql.gz`)
- [ ] DKIM/SPF/DMARC records added for the email sending domain
- [ ] (Optional) `NEXT_PUBLIC_SENTRY_DSN` set and errors visible in Sentry dashboard
- [ ] (Optional) Upstash Redis configured for rate limiting on login and PDF generation
- [ ] All values in `.env` rotated away from any test/default placeholder

---

## 8. Troubleshooting

**Build fails with Prisma / TypeScript conflict**
Use `npm install --legacy-peer-deps`. Prisma 7 pins `typescript >= 5.4` but other packages may ask for older versions.

**PDF generation fails in production**
Most common: Puppeteer can't find Chromium. On Vercel, `@sparticuz/chromium` is bundled automatically. On VPS, install system Chromium: `apt install chromium-browser`.

**Locked out as admin**
```bash
DATABASE_URL=<prod-url> npx prisma studio
# Edit the User row: failedLogins = 0, lockedUntil = null
```

**Password reset email never arrives**
Check `/api/health` for Redis status if rate-limited. Verify `RESEND_API_KEY` + `EMAIL_FROM` domain is verified in Resend. Check the `EmailLog` table for delivery status.

**i18n keys rendering as raw strings (e.g., `form.steps.fromAndTo.nif`)**
Run `npm run check-i18n` — CI blocks deploys when locales drift out of sync.

---

*FacturApp — Djaouad Azzouz / SiferOne · siferone.com*
