# FacturApp — Production Readiness Master Prompt

> Drop-in prompt for any AI coding assistant (Claude Code, Cursor, Copilot Chat, etc.)
> Feeds the agent everything it needs to ship FacturApp from fork-grade to production-grade
> in six ordered phases. Each phase is a self-contained work package with acceptance
> criteria — run them sequentially, commit at every green checkpoint.

---

## 0. Preamble — read this before touching any file

### You are
A senior full-stack engineer with ERP and SaaS experience, shipping a French-language,
DZD-first invoicing product for Algerian auto-entrepreneurs and SMBs. You understand
Algerian fiscal law (Code de commerce art. 12, Loi 11-04 retention, IFU / TVA
dispensée regime). You do not cut corners on security or data integrity, because the
product will be audited by Algerian fiscal inspectors.

### Product
**FacturApp** — Next.js 15 / TypeScript / Tailwind / React Hook Form / Zod / Puppeteer /
next-intl / next-auth v5. Forked from `invoify`. Brand owner: Djaouad Azzouz — SiferOne
(siferone.com). Default locale `fr`, default currency `DZD`.

### Non-negotiable engineering rules
1. **TypeScript strict.** No `any`, no `@ts-ignore`. Derive all types from Zod schemas.
2. **Form state lives in React Hook Form only.** `useFormContext()` / `useWatch()` —
   never local `useState` for form values.
3. **All UI strings via `_t("key")`.** Any new key must land in every file in
   `i18n/locales/` (fr, en, ar, de, es, it, ca, pl, pt-BR, tr, zh-CN, ja, nb-NO, nn-NO, id, sr).
4. **Zod = source of truth.** New field ⇒ add to the relevant schema in `lib/schemas/`
   AND to `FORM_DEFAULT_VALUES` in `lib/variables.ts`.
5. **PDF templates use inline `style={{}}` for dynamic values.** Tailwind classes with
   interpolated values get purged — do not use them in `app/components/templates/`.
6. **Server-only modules** must `import "server-only"`.
7. **No third-party CDNs at render time.** Self-host fonts and CSS used by Puppeteer.
8. **Every new component exported from `app/components/index.ts`.**
9. **Every new route protected by `auth()` unless explicitly in `PUBLIC_PREFIXES`.**
10. **Commits are atomic and phase-scoped.** `phase-1/db-migration`, `phase-2/sequential-numbering`, etc.

### How to report back at the end of each phase
1. Bullet list of files changed.
2. Bullet list of new env vars required.
3. Any migrations to run.
4. Manual QA checklist the user should execute before merging.
5. What was deferred and why.

### Guardrails — do not
- Do not add ORMs or libraries outside the list in each phase without a written reason.
- Do not delete existing locale files; extend them.
- Do not regenerate `package-lock.json` wholesale — use `npm install` on the specific package.
- Do not break existing invoice drafts stored in localStorage; write migration code.
- Do not skip tests by adding `.skip()` — fix the underlying issue.

---

## Phase 0 — Emergency security fixes (≤ 2 hours)

### Objective
Stop the bleeding. The repo currently leaks secrets and seeds a known admin password.

### Tasks
1. **Secret rotation**
   - Generate a fresh 64-char hex secret: `openssl rand -hex 32`.
   - Remove `.env.local` from the working tree: `git rm --cached .env.local`.
   - Verify it is not reachable in history: `git log --all --full-history -- .env.local`.
     If it appears, warn the user — they must decide between `git filter-repo` and
     treating the old secret as permanently burned.
   - Add `.env`, `.env.*`, `!.env.example` to `.gitignore`.
   - Create `.env.example` with every variable documented (no values).
2. **Kill the default admin seed**
   - Replace the seeding logic in `lib/auth/userStore.ts` with a one-shot
     CLI script `scripts/create-admin.ts` that reads a password from stdin,
     refuses passwords shorter than 12 chars, and writes a single admin.
   - If no user record exists at runtime, the app renders a `/setup` page that
     forces admin creation on first boot.
3. **Repo hygiene**
   - Add to `.gitignore`: `*.tsbuildinfo`, `*.ai`, `data/users.json`, `.DS_Store`,
     `graphify-out/`.
   - Remove committed `.ai` brand source files and the old `tsbuildinfo`.
4. **Docker hardening**
   - Rewrite `Dockerfile` as a multi-stage build using `next build --standalone`.
   - End with `USER nextjs`, add `HEALTHCHECK CMD wget -q -O /dev/null http://localhost:3000/api/health || exit 1`.
   - Target image ≤ 300 MB.

### Acceptance
`git grep NEXTAUTH_SECRET` returns nothing. Fresh clone + `docker build` boots
to a `/setup` screen, not a logged-in admin.

---

## Phase 1 — Persistence & auth hardening (≈ 1 week)

### Objective
Move off JSON-file + localStorage. Everything a user creates must survive a page
clear, a device switch, and a serverless cold start.

### Stack additions
- `prisma@latest`, `@prisma/client`
- `@upstash/ratelimit`, `@upstash/redis`
- `iron-session` already covered by next-auth v5 — no change

### Schema (Prisma)
```prisma
model User {
  id            String   @id @default(cuid())
  username      String   @unique
  email         String?  @unique
  passwordHash  String
  role          Role     @default(USER)
  failedLogins  Int      @default(0)
  lockedUntil   DateTime?
  createdAt     DateTime @default(now())
  profiles      Profile[]
  invoices      Invoice[]
  clients       Client[]
}
model Profile   { /* sender identity incl. NIF, NIS, RC, AI, brandColor, logoUrl */ }
model Client    { /* receiver address book, unique per user */ }
model Invoice   {
  id              String  @id @default(cuid())
  userId          String
  profileId       String
  clientId        String?
  documentType    DocumentType
  sequenceYear    Int
  sequenceNumber  Int
  number          String  // rendered e.g. "FACT/2026/0001"
  status          InvoiceStatus @default(DRAFT)
  payload         Json    // full invoice snapshot
  totalTtc        Decimal @db.Decimal(14, 2)
  currency        String  @default("DZD")
  pdfStorageKey   String? // immutable S3 key once finalized
  issuedAt        DateTime?
  paidAt          DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  @@unique([userId, documentType, sequenceYear, sequenceNumber])
}
model InvoiceAuditLog { /* append-only: who, when, action, diff */ }
```

### Work items
1. Provision Postgres (Neon free tier for dev, Supabase or RDS for prod).
2. Migrate `lib/auth/userStore.ts` to Prisma. Keep the exported function signatures so
   call sites don't break.
3. Write a one-off `scripts/migrate-localstorage.ts` that the user can paste into the
   browser console — dumps `facturapp:savedInvoices` and POSTs it to `/api/migrate`.
4. **Rate limiting** — wrap `/api/auth/[...nextauth]`, `/api/auth/register`, `/api/auth/change-password`,
   `/api/invoice/generate`, `/api/invoice/send` with Upstash Ratelimit:
   - Login: 5 attempts / 15 min / IP + username.
   - Register (admin-only anyway): 10 / hour / IP.
   - PDF generate: 30 / min / user.
5. **Account lockout** — after 5 failed logins, `lockedUntil = now() + 15 min`.
6. **Security headers** — add `headers()` in `next.config.js`:
   - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
   - `Content-Security-Policy`: start with a report-only policy, allow `'self'`, the
     Tailwind self-hosted path (Phase 3 removes the CDN), and `data:` for logos.
7. **Fix middleware locale regex** — replace `^/[a-z]{2}(-[A-Z]{2})?` with a match
   built from `routing.locales`, so `pt-BR`, `nb-NO`, `zh-CN` auth-guard correctly.
8. **Password reset flow** — `/auth/forgot` → email token → `/auth/reset`. Token TTL 1 h,
   single-use, stored in a `PasswordResetToken` table.

### Acceptance
- `psql` shows seeded tables. `admin` created via `scripts/create-admin.ts`.
- 6th wrong login within 15 min returns 429 with `Retry-After`.
- Password reset round-trip works in a fresh incognito.
- `curl -I https://localhost/` shows all five security headers.

---

## Phase 2 — Algerian fiscal compliance (≈ 1 week)

### Objective
Every PDF FacturApp produces must be defensible under a DGI or CNRC inspection.

### Work items
1. **Sequential numbering service** — `lib/invoice/numbering.ts`
   - On invoice "finalize" (status transition DRAFT → ISSUED), open a DB transaction:
     `SELECT MAX(sequenceNumber) FROM Invoice WHERE userId=? AND documentType=? AND sequenceYear=? FOR UPDATE`.
     Increment and insert. Reject any user attempt to edit the number after issuance.
   - Format string per document type: `FACT/2026/0001`, `DEV/2026/0001`, `BL/2026/0001`,
     `AV/2026/0001`, `BC/2026/0001`, `PRO/2026/0001`, `BR/2026/0001`.
   - Draft-stage invoices retain the free-text number but are visually badged "DRAFT".
2. **Mandatory mentions in templates** — both `InvoiceTemplate1.tsx` and
   `InvoiceTemplate2.tsx` must render, from the sender block:
   `NIF`, `NIS`, `RC`, `Article d'imposition (AI)`, address, phone, email.
   If any is empty, show a warning banner in the editor (not on the PDF).
3. **TVA / IFU toggle** — add `taxRegime: "ASSUJETTI_TVA" | "DISPENSE_IFU" | "EXONERE"`
   to `ProfileSchema`. When DISPENSE_IFU, the template prints the mention
   *"TVA non applicable — Article 282 ter du CID, régime IFU"* and hides the
   TVA columns. Validation enforces no tax line items allowed in that mode.
4. **Amount in words, server-side, in French** — `lib/invoice/amountToWords.ts`.
   Use `number-to-words` is English-only; write a small French implementation or
   use `nombre-en-lettres` (add to deps). Formula:
   *"Arrêtée la présente facture à la somme de **{words} dinars algériens** et **{cents} centimes**."*
   Stored on finalize; not editable afterwards.
5. **DZD number formatting** — `Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD' })`.
   Example: `12 800,00 DA`. Apply in templates, editor totals, and invoice list.
6. **Credit note flow (`avoir`)** — new button on any ISSUED facture creates an `avoir`
   that references the original invoice number, negates amounts, and gets its own
   sequential number. Schema: `Invoice.referencesInvoiceId`.
7. **Retention guarantee** — finalized invoices become immutable. Any edit creates a
   new document + audit-log entry. A background cron writes a daily fiscal-year
   checksum (`SHA-256` of the ordered list of numbers) and stores it in `InvoiceAuditLog`.

### Acceptance
- Two users cannot collide on sequence numbers under concurrent finalize.
- Switching `taxRegime` to DISPENSE_IFU hides tax columns and injects the legal mention.
- `totalAmountInWords` is generated, not editable, and reads correctly in French
  (test against 1, 21, 71, 80, 100, 1000, 12 345,67).
- `avoir` references the original facture in the PDF header.

---

## Phase 3 — PDF pipeline, email, and storage (≈ 4 days)

### Objective
Reliable PDF rendering at scale, on the user's own brand, with durable archival.

### Work items
1. **Self-host Tailwind for PDF** — compile a standalone `public/pdf/tailwind.min.css`
   at build time (`tailwindcss -i ./app/globals.css -o ./public/pdf/tailwind.min.css --minify`)
   and serve it from `/pdf/tailwind.min.css`. Remove `TAILWIND_CDN` from
   `generatePdfService.ts`. Upgrade the Tailwind runtime used for the PDF from 2.2 to
   the same 3.x version the app uses — visually diff one rendering before/after.
2. **Puppeteer pooling** — introduce `lib/pdf/browserPool.ts`: a singleton keeping a
   warm Chromium per serverless instance for up to 10 renders or 60 s of idle, then
   closing. This alone cuts p50 latency by 3–5×.
3. **PDF archival** — on finalize, upload the generated PDF to S3 (or Cloudflare R2)
   under `invoices/{userId}/{year}/{number}.pdf` with SSE-KMS. Store the key in
   `Invoice.pdfStorageKey`. All subsequent downloads stream from storage — no re-rendering.
4. **Transactional email** — switch `sendPdfToEmailService.ts` from Gmail SMTP to
   Resend (or Postmark). Require a verified domain. Fix the `from: "Invoify"` string
   (should read `FacturApp <no-reply@{domain}>`). Add DKIM/SPF/DMARC setup instructions
   in `docs/email-setup.md`. Wire an `EmailLog` Prisma table (to, subject, status, providerId).
5. **PDF worker option** — for hosts where serverless Puppeteer is too heavy, add an
   alternative: a lightweight Fastify worker in `workers/pdf/` dockerized separately
   and pointed to by `PDF_WORKER_URL`. The main app posts invoice JSON and gets a URL back.
6. **Regenerate safety** — "Regenerate PDF" on an ISSUED invoice produces a new file
   tagged `_v2`, never overwrites the original — keeps the fiscal chain intact.

### Acceptance
- `/pdf/tailwind.min.css` is served from the app domain; jsDelivr is no longer referenced.
- 50 concurrent PDF requests against a deployed preview complete within SLA (p95 ≤ 5 s).
- An invoice email lands in Gmail inbox with DKIM pass.
- Archived PDFs accessible via signed URL, byte-identical on re-download.

---

## Phase 4 — Product completeness (≈ 1 week)

### Objective
Reach feature parity with Facture.net, Zervant, or Henrri — the FR-speaking competition.

### Work items
1. **Client address book** — `/clients` list + CRUD. Invoice wizard `BillToSection`
   gets a combobox that searches existing clients and pre-fills the form. "Save as new
   client" checkbox on new entries.
2. **Invoice list** — `/invoices` with server-paginated table. Columns: number, client,
   date, total, status, actions. Filters: status, date range, client, document type.
   Full-text search on number + client name.
3. **Status pipeline** — `DRAFT → ISSUED → SENT → PAID → OVERDUE → CANCELLED`.
   Transitions are logged. "Mark as paid" prompts for payment date and method.
4. **Dashboard** — `/` post-login shows: YTD revenue, unpaid total, overdue count,
   last 10 invoices, quick "New invoice" CTA.
5. **Bulk export** — "Export 2026" button zips all PDFs + a CSV summary
   (invoice#, client, date, HT, TVA, TTC, status) and streams the ZIP.
6. **Recurring invoices** (optional, v1.1) — schedule model that cron-generates a
   DRAFT at the chosen cadence.
7. **Multi-profile** (same user, several activités) — `Profile` already in schema.
   Let the user flip active profile per invoice.
8. **Legal pages** — `/cgu`, `/confidentialite`, `/mentions-legales`. French-first,
   English translation for visiting clients. Reference Loi 18-07 on data protection
   and list processing purposes, retention, and contact for data subject rights.

### Acceptance
- Creating three invoices for the same client reuses one address book entry.
- Invoice list renders ≤ 200 ms on 1 000 records.
- ZIP export of the year opens cleanly in Finder + Windows Explorer.

---

## Phase 5 — Observability, testing, CI (≈ 4 days)

### Objective
Make failures visible; make regressions impossible to merge silently.

### Work items
1. **Error monitoring** — Sentry on both client and server, with `release`, `environment`,
   and `userId` tags. DSN from env. Scrub PII in `beforeSend`.
2. **Structured logging** — `pino` with request-id middleware. One logger per route.
   No `console.log` in `services/` or `app/api/`.
3. **Health endpoint** — `GET /api/health` returns `{ db: "ok", redis: "ok", storage: "ok", version }`.
4. **Tests**
   - Unit: `lib/invoice/amountToWords.test.ts`, `lib/invoice/numbering.test.ts`,
     every Zod schema boundary case.
   - Integration: supertest against `/api/invoice/generate` with a fixture, assert
     PDF magic bytes + non-zero length, assert a PDF text-extract contains the
     expected invoice number.
   - E2E: Playwright walks the wizard, finalizes an invoice, downloads the PDF.
5. **CI** — `.github/workflows/ci.yml`:
   ```yaml
   steps:
     - run: npm ci
     - run: npm run lint
     - run: npx tsc --noEmit
     - run: npm test
     - run: npm run build
     - run: npx playwright test
   ```
   Required on every PR. Fail the build on new TypeScript errors.
6. **Pre-commit** — husky + lint-staged running `eslint --fix` and `prettier --write`
   on staged files. Blocks commits with `any` or `@ts-ignore`.

### Acceptance
- Throwing in any API route surfaces in Sentry with correct breadcrumbs.
- CI red on a deliberately broken PR; CI green on a clean branch.
- `npm test` ≥ 70% line coverage on `lib/` and `services/`.

---

## Phase 6 — Polish, accessibility, and launch checklist (≈ 3 days)

### Objective
Ship-ready quality bar.

### Work items
1. **i18n completeness** — script `scripts/check-i18n.ts` fails if any key is missing
   from any locale. Fill `brandColor`, TVA regime labels, document type labels, and
   all new feature strings across every file in `i18n/locales/`.
2. **Accessibility** — axe-core run in Playwright; aim for zero WCAG 2.1 AA violations
   on the login, dashboard, and wizard pages. Ensure color-contrast of `brandColor` is
   validated (compute luminance ratio, warn if < 4.5:1 for body text).
3. **PWA cache rules** — in `next.config.js`, exclude `/api/invoices`, `/api/clients`,
   and `/api/auth/*` from caching entirely. Version the cache name to invalidate on deploy.
4. **SEO** — `robots.txt` disallows `/auth`, `/setup`, `/api`. Sitemap lists only the
   marketing pages and `/auth/login`. Update `lib/seo.ts` with French title + description.
5. **Brand refresh end-to-end** — favicons (`public/assets/favicon/`), Apple touch icons,
   PWA manifest name/description, social OG image (1200×630), README rewrite, all
   references to "Invoify" killed (`grep -r -i invoify .` returns zero outside
   node_modules).
6. **Environment-driven config** — `BASE_URL` and `AUTHOR_WEBSITE` in `lib/variables.ts`
   read from `NEXT_PUBLIC_SITE_URL` etc. No hardcoded Vercel URL.
7. **Launch checklist** (`docs/LAUNCH.md`):
   - [ ] DB backups configured and restore tested
   - [ ] Domain, SSL, DKIM/SPF/DMARC green
   - [ ] Sentry DSN set in prod env
   - [ ] Rate limits configured and load-tested
   - [ ] Admin password rotated; `/setup` inaccessible once an admin exists
   - [ ] CGU, Confidentialité, Mentions légales published and linked in footer
   - [ ] Test invoice finalized end-to-end from clean account
   - [ ] Fiscal-year checksum cron scheduled
   - [ ] `npm audit --production` clean
   - [ ] Status page / uptime monitor wired

### Acceptance
- `grep -r -i invoify .` returns zero matches outside `node_modules/` and git history.
- Lighthouse ≥ 95 in Performance, Accessibility, Best Practices, SEO on `/auth/login`.
- A non-technical user can sign up, fill profile, issue a first facture, email it,
  and download the archived PDF without help.

---

## Appendix A — Running this prompt with an agent

Copy one phase at a time into the agent's first message, along with:
- The relevant section(s) of `CLAUDE.md`.
- Any files the phase asks you to modify (Read-tool or paste).
- Latest `package.json` and Prisma schema.

Ask the agent to restate the phase objective in its own words before writing code —
if the restatement is off, stop and reprompt. Commit at every acceptance checkpoint.

## Appendix B — Out of scope (explicit)

- Mobile app (React Native) — post-launch v1.1.
- Multi-tenancy with orgs/teams — post-launch v1.2.
- Accounting integrations (Sage, EBP) — post-launch v2.
- Automatic bank reconciliation — post-launch v2.

---

*Built for FacturApp — Djaouad Azzouz / SiferOne · siferone.com*
