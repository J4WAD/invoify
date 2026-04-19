# FacturApp — Build Progress & Roadmap

**Project:** FacturApp — French-language invoicing SaaS for Algerian auto-entrepreneurs and SMBs  
**Stack:** Next.js 15 · TypeScript · Tailwind · React Hook Form · Zod · Puppeteer · next-intl · Prisma 7 · NextAuth v5  
**Brand:** Djaouad Azzouz / SiferOne · siferone.com  
**Default locale:** `fr` · **Default currency:** `DZD`

---

## What Was Already Done (pre-session)

- Forked from open-source "invoify" and renamed to FacturApp
- French as default locale, DZD as default currency
- `brandColor` field (color picker with 8 swatches) wired into both PDF templates
- Algerian fiscal ID fields (NIF, NIS, RC, AI) on sender/receiver forms and in PDF templates
- FacturApp branding (metadata, SEO, package.json, localStorage keys)
- Logo watermark in PDF (7% opacity, grayscale, bottom-right)
- 7 document types: Facture, Devis, Bon de livraison, Avoir, Bon de commande, Pro forma, Bon de réception
- Multi-language support (16 locales)
- localStorage-based invoice drafts and saved invoices
- Basic Next-Auth v5 credentials login (JSON file user store)

---

## Phase 0 — Emergency Security Fixes ✅

**Goal:** Stop the bleeding before anything else.

### What was done
| # | Change | File(s) |
|---|--------|---------|
| 1 | `.gitignore` updated — `.env`/`.env.*` excluded, `.env.example` whitelisted; `*.ai`, `graphify-out/` added | `.gitignore` |
| 2 | `.env.example` created with every variable documented, no values | `.env.example` |
| 3 | `admin123` auto-seed **removed** from `readUserStore()` | `lib/auth/userStore.ts` |
| 4 | `scripts/create-admin.ts` — stdin CLI, enforces ≥ 12-char password | `scripts/create-admin.ts` |
| 5 | `/setup` first-boot page — creates admin; redirects to login once an admin exists | `app/[locale]/auth/setup/page.tsx` · `app/api/auth/setup/route.ts` |
| 6 | Login page redirects to `/setup` when no users exist; removed hardcoded credential hint | `app/[locale]/auth/login/page.tsx` |
| 7 | Middleware: `/setup`, `/api/health` added to public prefixes; locale regex built from `routing.locales` (fixes `pt-BR`, `nb-NO`, `zh-CN`) | `middleware.ts` |
| 8 | Security headers added: `HSTS`, `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, CSP report-only | `next.config.js` |
| 9 | `output: "standalone"` added to Next config | `next.config.js` |
| 10 | Dockerfile rewritten — 3-stage standalone build, `USER nextjs`, `HEALTHCHECK` | `Dockerfile` |
| 11 | `GET /api/health` endpoint | `app/api/health/route.ts` |

### Run once
```bash
# Remove old admin123 user if it exists
rm data/users.json

# Create the real admin
npm run create-admin
```

---

## Phase 1 — Persistence & Auth Hardening ✅

**Goal:** Move off JSON-file user store. Harden auth with lockout, rate limiting, and password reset.

### Architecture decision — Prisma 7
> Prisma 7 **removed** `url = env(...)` from `schema.prisma`. The connection URL now lives in two places:
> - **Migrations:** `prisma.config.ts` → `datasource.url: process.env.DATABASE_URL`
> - **Runtime:** `lib/db.ts` → `new PrismaPg({ connectionString })` passed as adapter to `PrismaClient`

### Database schema (`prisma/schema.prisma`)
```
User             — id, username, passwordHash, role, failedLogins, lockedUntil
Profile          — 1:1 with User; business info, branding, invoice defaults, tax regime
Client           — address book entries, linked to Profile
Invoice          — full snapshot (payload JSON) + sequential number + status + audit trail
InvoiceAuditLog  — append-only; action + diff per invoice change
PasswordResetToken — single-use, 1h TTL
```

### What was done
| # | Change | File(s) |
|---|--------|---------|
| 1 | Prisma schema with all 6 models + enums (Role, TaxRegime, DocumentType, InvoiceStatus) | `prisma/schema.prisma` |
| 2 | `lib/db.ts` — PrismaClient singleton via `@prisma/adapter-pg` | `lib/db.ts` |
| 3 | `lib/auth/userStore.ts` fully rewritten to use Prisma; same exported API surface preserved | `lib/auth/userStore.ts` |
| 4 | Account lockout — 5 failed logins → `lockedUntil = now() + 15 min`; resets on success | `lib/auth/userStore.ts` |
| 5 | `lib/auth/ratelimit.ts` — Upstash sliding-window limiters (login 5/15min, PDF 30/min, register 10/h); **no-ops gracefully** when Upstash env vars absent | `lib/auth/ratelimit.ts` |
| 6 | `auth.ts` — rate limit checked before `verifyCredentials`; `AccountLockedAuthError` propagated to login URL | `auth.ts` |
| 7 | Login page shows "Compte verrouillé… réessayez dans 15 min" on lockout | `app/[locale]/auth/login/page.tsx` |
| 8 | Password reset flow — forgot page + API (email token, 1h TTL); reset page + API (atomic token invalidation) | `app/[locale]/auth/forgot/` · `app/[locale]/auth/reset/` · `app/api/auth/forgot/` · `app/api/auth/reset/` |
| 9 | Min password raised to **12 chars** everywhere (register, change-password, setup, create-admin) | multiple routes |
| 10 | `scripts/create-admin.ts` rewritten to use Prisma via PrismaPg | `scripts/create-admin.ts` |
| 11 | `scripts/migrate-localstorage.ts` — browser console script that dumps `facturapp:savedInvoices` and POSTs to `/api/migrate` (Phase 4 endpoint) | `scripts/migrate-localstorage.ts` |

### New env vars
```bash
DATABASE_URL=postgresql://user:pass@host:5432/facturapp   # required — Neon free tier works
UPSTASH_REDIS_REST_URL=                                    # optional — rate limiting
UPSTASH_REDIS_REST_TOKEN=                                  # optional
NEXT_PUBLIC_SITE_URL=https://yourdomain.com                # for password reset links
NODEMAILER_EMAIL=                                          # for password reset emails
NODEMAILER_PW=                                             # Gmail app password
```

### Run once
```bash
npx prisma migrate dev --name init
npm run create-admin
```

---

## Phase 2 — Algerian Fiscal Compliance ✅

**Goal:** Every PDF FacturApp produces must be defensible under a DGI or CNRC inspection.

### What was done
| # | Change | File(s) |
|---|--------|---------|
| 1 | `lib/invoice/numbering.ts` — `allocateSequenceNumber()` inside `$transaction` (race-safe); `finalizeInvoice()` DRAFT→ISSUED; `createCreditNote()` for avoirs with own sequence | `lib/invoice/numbering.ts` |
| 2 | `lib/invoice/amountToWords.ts` — French implementation from scratch (covers 0–billions); `amountToWordsDZD()` generates the full fiscal mention | `lib/invoice/amountToWords.ts` |
| 3 | `lib/helpers.ts` — `formatPriceToString` routes DZD to French words | `lib/helpers.ts` |
| 4 | `taxRegime` field (`ASSUJETTI_TVA` / `DISPENSE_IFU` / `EXONERE`) added to Zod schema, form defaults, InvoiceDetails selector | `lib/schemas.ts` · `lib/variables.ts` · `InvoiceDetails.tsx` |
| 5 | TVA line **hidden** in both PDF templates when regime is IFU or EXONERE | `InvoiceTemplate1.tsx` · `InvoiceTemplate2.tsx` |
| 6 | Legal mention printed on PDF — *"TVA non applicable — Article 282 ter du CID, régime IFU"* or *"Exonéré de TVA"* | `InvoiceTemplate1.tsx` · `InvoiceTemplate2.tsx` |
| 7 | Compliance warning banner in editor when NIF/NIS/RC/AI are blank (not visible on PDF) | `BillFromSection.tsx` |
| 8 | `referencesInvoiceNumber` field in schema (for avoir linking) | `lib/schemas.ts` |
| 9 | `status` enum extended with `"issued"` | `lib/schemas.ts` |
| 10 | All 16 locale files updated — `complianceWarning`, `taxRegime.*`, `brandColor` keys | `i18n/locales/*.json` |
| 11 | `BASE_URL` and `AUTHOR_WEBSITE` read from env vars (not hardcoded) | `lib/variables.ts` |

### Amount in words — tested values
| Input | Output |
|-------|--------|
| 1 | *un dinar algérien* |
| 21 | *vingt-et-un dinars algériens* |
| 71 | *soixante-onze dinars algériens* |
| 80 | *quatre-vingts dinars algériens* |
| 100 | *cent dinars algériens* |
| 1 000 | *mille dinars algériens* |
| 12 345,67 | *douze mille trois cent quarante-cinq dinars algériens et soixante-sept centimes* |

### Sequential number format
| Doc type | Format | Example |
|----------|--------|---------|
| Facture | `FACT/{year}/{seq}` | `FACT/2026/0001` |
| Devis | `DEV/{year}/{seq}` | `DEV/2026/0003` |
| Avoir | `AV/{year}/{seq}` | `AV/2026/0001` |
| Bon de livraison | `BL/{year}/{seq}` | `BL/2026/0002` |
| Bon de commande | `BC/{year}/{seq}` | `BC/2026/0001` |
| Pro forma | `PRO/{year}/{seq}` | `PRO/2026/0001` |
| Bon de réception | `BR/{year}/{seq}` | `BR/2026/0001` |

---

## Remaining Phases — Roadmap

### Phase 3 — PDF Pipeline, Email & Storage ✅ (partial)
- [x] **Self-host Tailwind CSS for PDF** — `public/tailwind-pdf.min.css` inlined via `fs.readFileSync`; no CDN dependency; `waitUntil: "load"` (faster)
- [x] **Puppeteer browser pool** — `lib/puppeteer/browserPool.ts`; lazy singleton browser; auto-restart on disconnect; pages closed per-request
- [ ] PDF archival to S3 / Cloudflare R2 on finalize; stream from storage on download
- [x] **Switch email to Resend** — `lib/email/emailService.ts`; Resend primary, Nodemailer/Gmail fallback; `RESEND_API_KEY` + `EMAIL_FROM` env vars
- [x] **`EmailLog` table** — added to `prisma/schema.prisma`; fire-and-forget logging in `sendEmail()`
- [ ] Optional: separate Fastify PDF worker for heavy-traffic deployments
- [ ] "Regenerate PDF" creates `_v2` file — never overwrites the original

### New run-once steps after Phase 3
```bash
npx prisma migrate dev --name add-email-log
```

### Phase 4 — Product Completeness ✅
- [x] **Client address book** — `app/api/clients/` (GET/POST/PATCH/DELETE) + `app/[locale]/clients/page.tsx` full CRUD UI + navbar link
- [x] **Invoice API** — `app/api/invoices/` (GET paginated, POST) + `app/api/invoices/[id]/` (GET, PATCH status, DELETE) backed by Prisma
- [x] **Invoice status pipeline** — `DRAFT → ISSUED → SENT → PAID → OVERDUE → CANCELLED`; transitions validated; `finalizeInvoice()` called for `DRAFT → ISSUED`
- [x] **Dashboard** — `app/[locale]/dashboard/page.tsx`; YTD revenue, unpaid total, overdue count, recent 10 invoices with status badges; navbar link added
- [x] **Bulk export** — `app/api/export/bulk/route.ts`; `?year=YYYY&format=csv|json`; auth-required; CSV streamed as attachment
- [x] **`/api/migrate`** — `app/api/migrate/route.ts`; bulk-inserts localStorage invoices; skips duplicates; returns `{ migrated, skipped }`
- [x] **Hybrid save** — `InvoiceContext` fires `POST /api/invoices` after successful PDF generation (fire-and-forget, localStorage kept as fallback)
- [ ] **Multi-profile UI** — same user, multiple business identities (schema already supports it; UI deferred)
- [x] **Legal pages** — `/cgu`, `/confidentialite`, `/mentions-legales` (Loi 18-07 compliant); footer links added; public (no auth required)

### Middleware improvement (Phase 4)
- API routes (`/api/*`) now return `401 JSON` instead of redirecting to login — fixes browser `fetch()` calls
- Matcher updated to cover all routes (API + pages) for consistent auth enforcement

### Phase 5 — Observability, Testing & CI ✅
- [x] **Sentry** — `sentry.{client,server,edge}.config.ts` + `instrumentation.ts`; opt-in via `NEXT_PUBLIC_SENTRY_DSN`; PII scrubbed (cookies, authorization, email) in `beforeSend`
- [x] **`pino` structured logging** — `lib/logger.ts`; redacts `password`, `passwordHash`, `token`, `authorization`, `cookie`; replaced `console.error` in `generatePdfService`, `exportInvoiceService`, `emailService`
- [x] **`GET /api/health` extended** — DB ping via `$queryRaw SELECT 1`; Redis ping via Upstash `/ping` (skipped when env absent); returns `{ status, db, redis, version, ts }` with 503 on failure
- [x] **Unit tests** — Vitest; `lib/invoice/__tests__/amountToWords.test.ts` (9 passing cases: 1, 21, 71, 80, 100, 1000, fractional, integer, FR with currency)
- [ ] Integration tests — `/api/invoice/generate` fixture → assert PDF magic bytes + invoice number (deferred)
- [ ] E2E — Playwright: wizard → finalize → download PDF (deferred)
- [x] **CI** — `.github/workflows/ci.yml`: postgres:16 service + check-i18n → lint → tsc → test → prisma generate → build
- [x] **Pre-commit** — husky + lint-staged; `.husky/pre-commit` runs `npx lint-staged` (`next lint --fix --file` on `*.{ts,tsx}`)

### Phase 6 — Polish, Accessibility & Launch ✅
- [x] **`scripts/check-i18n.ts`** — fr.json canonical; recursively flattens keys; fails CI with exit 1 if any locale missing keys; added as first step in CI
- [x] **i18n completeness** — added `nif`/`nis`/`rc`/`ai` keys to 14 locales (ar, de, es, it, ca, pl, pt-BR, tr, ja, zh-CN, nb-NO, nn-NO, sr, id); patched missing `settings.*` and `dashboard.*` blocks
- [ ] axe-core in Playwright — zero WCAG 2.1 AA violations on login, dashboard, wizard (deferred with Playwright)
- [x] **Brand color contrast warning** — `InvoiceDetails.tsx`; computes relative luminance + contrast ratio vs white; shows yellow warning when < 4.5:1 (WCAG AA)
- [ ] PWA cache exclusions for `/api/invoices`, `/api/clients`, `/api/auth/*` (deferred — `next-pwa` runtime caching defaults are conservative)
- [x] **Favicon + logo + manifest** — FacturApp favicon set, `public/assets/img/facturapp-logo.png`, email template updated to new logo/branding
- [x] **Invoify cleanup** — remaining user-facing strings (email templates, toast messages, package.json name) switched to FacturApp
- [x] **`docs/LAUNCH.md`** — local dev, Docker single-container, docker-compose, Vercel, VPS+Nginx+PM2+certbot; full env var reference; 15-item post-deploy checklist; troubleshooting section

---

## Quick Reference

### Development
```bash
npm run dev          # start dev server
npm run build        # production build
npx tsc --noEmit     # type check
npm run lint         # ESLint
npm test             # unit tests (Vitest)
npm run check-i18n   # fail if any locale is missing keys
```

### Database
```bash
npx prisma migrate dev --name <name>   # apply schema changes
npx prisma studio                       # GUI browser
npm run create-admin                    # create first admin user
```

### Run & deploy
See **[`docs/LAUNCH.md`](docs/LAUNCH.md)** for the full run + deploy guide:
local dev, Docker, docker-compose, Vercel, VPS+Nginx+PM2, env var reference, and post-deploy checklist.

### First deploy checklist (abridged — full list in `docs/LAUNCH.md`)
1. Set all required env vars (see `.env.example`) — including `RESEND_API_KEY` + `EMAIL_FROM`
2. `npx prisma migrate deploy` — applies all migrations including Phase 1 + Phase 3 EmailLog
3. `npm run create-admin`
4. Verify `/setup` is inaccessible once admin exists
5. Test password reset end-to-end
6. (Optional) Run localStorage migration script from browser console → `/api/migrate`

---

*FacturApp — Djaouad Azzouz / SiferOne · siferone.com*
