---
name: FacturApp phase progress
description: Which production-readiness phases are complete and key architectural decisions made
type: project
---

Phases 0, 1, and 2 of the production readiness plan have been implemented.

**Why:** The user is building FacturApp (Next.js 15, invoicing SaaS for Algeria) and working through a 6-phase production roadmap.

**Phase 0 (done):** Security fixes — .gitignore, .env.example, removed admin123 seed, /setup first-boot page, Dockerfile standalone, security headers.

**Phase 1 (done):** Prisma 7 + PostgreSQL (NOTE: Prisma 7 requires @prisma/adapter-pg — no `url` in schema, URL goes in prisma.config.ts and PrismaPg adapter constructor). Auth migrated from JSON file to Prisma. Account lockout (5 attempts → 15 min). Rate limiting via @upstash/ratelimit (graceful no-op when env vars absent). Password reset flow (forgot/reset pages + API). Min password 12 chars enforced everywhere.

**Phase 2 (done):** lib/invoice/amountToWords.ts (French, covers 1/21/71/80/100/1000/12345.67). lib/invoice/numbering.ts (sequential DB-backed with $transaction). taxRegime field (ASSUJETTI_TVA/DISPENSE_IFU/EXONERE) in schema + form + templates. TVA regime legal mention in both PDF templates. DZD formatting via fr-DZ locale (already existed, wired to amountToWords). Compliance warning banner in BillFromSection. i18n keys added to all 16 locales.

**Key architectural decision:** Prisma 7 changed datasource URL handling. The `url` field is no longer in prisma/schema.prisma. Instead: prisma.config.ts has `datasource.url: process.env.DATABASE_URL` (for migrations), and lib/db.ts uses `new PrismaPg({ connectionString })` adapter passed to PrismaClient constructor.

**Next phases:** Phase 3 (PDF pipeline, email, storage), Phase 4 (client address book, invoice list, dashboard), Phase 5 (observability, tests, CI), Phase 6 (polish, a11y, launch checklist).

**How to apply:** When user asks about next phases, use this context. When touching Prisma, always use the adapter pattern.
