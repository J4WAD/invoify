# FacturApp — Master Implementation Prompt
## For Claude Code CLI

> Drop this as `CLAUDE.md` or paste as a single session instruction.  
> This supersedes the previous CLAUDE.md and includes all historical context.

---

## Project Identity

**FacturApp** — Professional, brandable document generator (invoices, quotes, delivery notes, credit notes) built on Next.js 15. Forked from "invoify", customized for French-language, multi-currency (default: DZD).

**Stack:** Next.js 15 · TypeScript · Tailwind CSS · React Hook Form · Zod · Puppeteer · next-intl  
**Default locale:** `fr` · **Default currency:** `DZD`  
**Author:** Djaouad Azzouz / siferone.com

---

## What Is Already Implemented (DO NOT REDO)

- ✅ Renamed to FacturApp (metadata, SEO, package.json, localStorage keys with `facturapp:` prefix)
- ✅ Removed Buy Me Coffee widget
- ✅ Default locale `fr`, default currency `DZD`
- ✅ `brandColor` field in Zod schema + `FORM_DEFAULT_VALUES` + `ColorInput` component
- ✅ `ColorInput` exported from `app/components/index.ts`
- ✅ `InvoiceLayout.tsx` — logo watermark (position fixed, bottom-right, 7% opacity, grayscale)
- ✅ `InvoiceTemplate1.tsx` + `InvoiceTemplate2.tsx` — French labels + brand color driven
- ✅ Settings modal with Branding, Business Info, Clients, Invoice Defaults, Payment Info tabs
- ✅ Full profile system (`ProfileContext`, `ProfileSchema`) with auto-fill on new invoice
- ✅ Invoice dashboard at `/[locale]/invoices` with search, filter, sort, pagination
- ✅ Draft auto-save to localStorage on every form change
- ✅ Import/export JSON, CSV, XML, XLSX, DOCX
- ✅ Signature modal (draw, type, upload)

---

## CRITICAL BUG FIXES — Do These First

### Bug 1: Watermark Logo Not Appearing in Generated PDFs

**Root cause (3 layers):**

1. **Stale closure** — `generatePdf` in `contexts/InvoiceContext.tsx` is wrapped in `useCallback([])` (empty deps). This means `profile` inside the callback is frozen at its initial empty state. When the user sets a watermark in Settings after mount, the callback never sees it.

2. **Missing fallback injection** — `details.watermarkImage` is only populated when `newInvoice()` is called. If the user opens an old invoice from storage or doesn't click "New Invoice", the field stays empty even if `profile.branding.watermarkLogo` is set.

3. **Puppeteer image rendering** — `page.setContent()` runs with `waitUntil: ["networkidle0"]` but `page.addStyleTag({url: TAILWIND_CDN})` is called AFTER `setContent` without awaiting the stylesheet load. Also, no `page.setViewport()` is called, leaving Puppeteer at 800×600 — `position: fixed` elements may be clipped or positioned relative to this tiny viewport rather than the A4 page.

**Fix in `contexts/InvoiceContext.tsx`:**
```typescript
// Fix 1: add profile to useCallback deps
const generatePdf = useCallback(async (data: InvoiceType) => {
    // Fix 2: inject profile branding as fallback
    const enrichedData: InvoiceType = {
        ...data,
        details: {
            ...data.details,
            watermarkImage: data.details.watermarkImage || profile.branding.watermarkLogo || "",
            invoiceLogo: data.details.invoiceLogo || profile.branding.logo || "",
            brandColor: data.details.brandColor || profile.branding.brandColor || "#2563eb",
        },
    };

    setInvoicePdfLoading(true);
    try {
        const response = await fetch(GENERATE_PDF_API, {
            method: "POST",
            body: JSON.stringify(enrichedData),
        });
        const result = await response.blob();
        setInvoicePdf(result);
        if (result.size > 0) pdfGenerationSuccess();
    } catch (err) {
        console.error(err);
    } finally {
        setInvoicePdfLoading(false);
    }
}, [profile]); // ← ADD profile as dep
```

**Fix in `services/invoice/server/generatePdfService.ts`:**
```typescript
// After browser.newPage(), before setContent:
await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 }); // A4 at 96dpi

await page.setContent(htmlTemplate, {
    waitUntil: ["load", "domcontentloaded"],
    timeout: 30000,
});

// Inline Tailwind CDN instead of addStyleTag to avoid timing race:
await page.addStyleTag({ url: TAILWIND_CDN });
// Wait for stylesheet to be applied before rendering PDF:
await page.waitForFunction(
    () => document.styleSheets.length > 0 &&
          Array.from(document.styleSheets).some(s => s.href?.includes('tailwind')),
    { timeout: 10000 }
).catch(() => {}); // Non-fatal: fall back if CDN unreachable
```

**Fix in `InvoiceLayout.tsx`** — Change watermark from `position: fixed` to `position: absolute` on the page wrapper so it only appears once at the bottom of the last page, avoiding Puppeteer fixed-element quirks. If per-page watermark is desired, use CSS `@page` with a background-image instead:
```tsx
// Replace position: fixed with position: absolute on the outer container
// and make the container position: relative min-height: 100%
```

---

### Bug 2: Invoice History Page Shows Empty / No Saved Invoices

**Root cause:**

The saved invoices localStorage key is `"savedInvoices"` (no namespace) but the app uses `"facturapp:invoiceDraft"` and `"facturapp:profile"` for other keys. There is no consistency issue per se, but there are two real bugs:

1. **Key mismatch** — `saveInvoice()` writes to `localStorage.setItem("savedInvoices", ...)` and `loadInvoices` reads `localStorage.getItem("savedInvoices")`. These match, so saving/loading is fine. BUT: the `useEffect` for loading saved invoices has a bug: `if (typeof window !== undefined)` — this compares a **string** to the **primitive** `undefined`, which is ALWAYS TRUE. This is harmless in a `useEffect` (always client-side) but should be fixed to `typeof window !== "undefined"`.

2. **Save requires PDF generation first** — Looking at the `saveInvoice()` function: the check `if (invoicePdf)` passes even for an empty Blob (truthy), so saving works without a PDF. However, the UX makes this unclear to users. Users may not realize they need to click "Save" explicitly. Add a visible "Sauvegarder" button that is always enabled and shows a confirmation toast.

3. **History not updating on navigation** — When navigating from `/fr` → `/fr/invoices`, the layout's `Providers` wrapper persists (Next.js App Router layout stability). BUT if the user hard-refreshes on `/fr/invoices`, the `useEffect` in `InvoiceContext` correctly reads from localStorage. The actual issue may be that the user saved invoices in a previous version that used a different key. **Migrate legacy data:**

```typescript
// In InvoiceContext useEffect, add migration:
useEffect(() => {
    // Migrate legacy key "savedInvoices" → "facturapp:savedInvoices"
    const legacyKey = "savedInvoices";
    const newKey = "facturapp:savedInvoices";
    const legacyData = window.localStorage.getItem(legacyKey);
    if (legacyData && !window.localStorage.getItem(newKey)) {
        window.localStorage.setItem(newKey, legacyData);
        window.localStorage.removeItem(legacyKey);
    }
    const savedInvoicesJSON = window.localStorage.getItem(newKey);
    setSavedInvoices(savedInvoicesJSON ? JSON.parse(savedInvoicesJSON) : []);
}, []);
```

Update ALL references to the `"savedInvoices"` key to use a constant:
```typescript
// lib/variables.ts
export const LOCAL_STORAGE_SAVED_INVOICES_KEY = "facturapp:savedInvoices";
```

---

## Feature 1: Multi-Document Type System

Users need to create: **Facture**, **Devis**, **Bon de livraison**, **Avoir**, **Bon de commande**, **Pro Forma**. The document type changes labels, numbering prefix, which sections are shown, and PDF header.

### Document Types
```typescript
// types.ts — add:
export type DocumentType =
    | "facture"          // Invoice
    | "devis"            // Quote / Estimate
    | "bon_de_livraison" // Delivery Note
    | "avoir"            // Credit Note / Return
    | "bon_de_commande"  // Purchase Order
    | "pro_forma";       // Pro Forma Invoice
```

### Schema Changes (`lib/schemas.ts`)
Add `documentType` to `InvoiceDetailsSchema`:
```typescript
documentType: z.enum([
    "facture", "devis", "bon_de_livraison", "avoir", "bon_de_commande", "pro_forma"
]).default("facture"),
```

Add `documentType: "facture"` to `FORM_DEFAULT_VALUES.details` in `lib/variables.ts`.

### Document Type Config (`lib/documentTypes.ts` — new file)
```typescript
export type DocTypeConfig = {
    type: DocumentType;
    labelFr: string;
    labelEn: string;
    prefix: string;          // Auto-numbering prefix: FAC-, DEV-, BDL-, AVO-, BDC-, PRO-
    showPaymentInfo: boolean; // Show bank details section in PDF
    showDueDate: boolean;     // Show due date field
    showDeliveryDate: boolean;// Show delivery date instead of due date
    showSignature: boolean;   // Show signature section
    pdfTitle: string;         // Title printed at top of PDF
};

export const DOCUMENT_TYPE_CONFIG: Record<DocumentType, DocTypeConfig> = {
    facture:           { type: "facture",           labelFr: "Facture",           labelEn: "Invoice",        prefix: "FAC-", showPaymentInfo: true,  showDueDate: true,  showDeliveryDate: false, showSignature: true,  pdfTitle: "FACTURE"            },
    devis:             { type: "devis",             labelFr: "Devis",             labelEn: "Quote",          prefix: "DEV-", showPaymentInfo: false, showDueDate: true,  showDeliveryDate: false, showSignature: true,  pdfTitle: "DEVIS"              },
    bon_de_livraison:  { type: "bon_de_livraison",  labelFr: "Bon de livraison",  labelEn: "Delivery Note",  prefix: "BDL-", showPaymentInfo: false, showDueDate: false, showDeliveryDate: true,  showSignature: true,  pdfTitle: "BON DE LIVRAISON"   },
    avoir:             { type: "avoir",             labelFr: "Avoir",             labelEn: "Credit Note",    prefix: "AVO-", showPaymentInfo: false, showDueDate: false, showDeliveryDate: false, showSignature: true,  pdfTitle: "AVOIR / NOTE DE CRÉDIT" },
    bon_de_commande:   { type: "bon_de_commande",   labelFr: "Bon de commande",   labelEn: "Purchase Order", prefix: "BDC-", showPaymentInfo: false, showDueDate: true,  showDeliveryDate: false, showSignature: true,  pdfTitle: "BON DE COMMANDE"    },
    pro_forma:         { type: "pro_forma",         labelFr: "Pro Forma",         labelEn: "Pro Forma",      prefix: "PRO-", showPaymentInfo: true,  showDueDate: true,  showDeliveryDate: false, showSignature: false, pdfTitle: "FACTURE PRO FORMA"  },
};
```

### DocumentTypeSelector Component (`app/components/invoice/form/sections/DocumentTypeSelector.tsx`)
Create a tab-style selector at the very top of the form (above InvoiceDetails), showing all 6 document types as clickable chips/buttons. When the type changes:
- Update `details.documentType` via `setValue("details.documentType", type)`
- Auto-update the invoice number prefix: `setValue("details.invoiceNumber", prefix + paddedSeq)`
- Show/hide sections (payment info, signature) based on `DocTypeConfig`

The selector should be rendered as the first step in the wizard, before all other form fields.

### Separate Number Sequences per Document Type
In `lib/variables.ts` → `FORM_DEFAULT_VALUES`, add:
```typescript
details: {
    ...
    documentType: "facture",
    // Remove plain invoiceNumber auto-generation — delegate to DocumentTypeSelector
}
```

In `ProfileSchema` (`lib/schemas/profile.ts`), add per-type counters:
```typescript
documentCounters: z.object({
    facture: z.number().default(1),
    devis: z.number().default(1),
    bon_de_livraison: z.number().default(1),
    avoir: z.number().default(1),
    bon_de_commande: z.number().default(1),
    pro_forma: z.number().default(1),
}).default({
    facture: 1, devis: 1, bon_de_livraison: 1,
    avoir: 1, bon_de_commande: 1, pro_forma: 1,
})
```

Add `getNextDocumentNumber(type: DocumentType): string` and `incrementDocumentNumber(type: DocumentType)` methods to `ProfileContext`.

### PDF Templates — Document Type Aware
In `InvoiceTemplate1.tsx` and `InvoiceTemplate2.tsx`:
- Import `DOCUMENT_TYPE_CONFIG`
- Replace hardcoded `"FACTURE"` / `"Facture"` labels with `config.pdfTitle` and `config.labelFr`
- Conditionally render `PaymentInformation` section only when `config.showPaymentInfo === true`
- Conditionally render signature only when `config.showSignature === true`
- For `bon_de_livraison`: hide item unit prices and totals — show only quantities
- For `avoir`: show amounts as negative, add "Avoir sur Facture N°" field

### i18n Keys
Add to `fr.json` and `en.json`:
```json
{
    "documentType": {
        "facture": "Facture",
        "devis": "Devis",
        "bon_de_livraison": "Bon de livraison",
        "avoir": "Avoir",
        "bon_de_commande": "Bon de commande",
        "pro_forma": "Pro Forma",
        "selectType": "Type de document"
    }
}
```

### Dashboard — Document Type Column
Add a `Type` column to `InvoiceTable.tsx` displaying a colored badge per document type:
- Facture → blue
- Devis → amber
- Bon de livraison → green
- Avoir → red
- Bon de commande → purple
- Pro Forma → gray

Add document type filter to `InvoiceFilters.tsx`.

---

## Feature 2: Authentication

### Approach: Local-First Credentials (NextAuth.js v5)
Since FacturApp is sold to individuals and must work offline, use **NextAuth.js v5** with a **Credentials provider** backed by a local encrypted JSON store (no external database required). Password is hashed with `bcryptjs`. Auth state is stored in a signed JWT cookie (works offline after first login).

### Installation
```bash
npm install next-auth@beta bcryptjs
npm install -D @types/bcryptjs
```

### Files to Create

**`auth.ts`** (project root):
```typescript
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { readUserStore, UserStore } from "@/lib/auth/userStore";

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Credentials({
            credentials: {
                username: { label: "Utilisateur", type: "text" },
                password: { label: "Mot de passe", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) return null;
                const store: UserStore = await readUserStore();
                const user = store.users.find(u => u.username === credentials.username);
                if (!user) return null;
                const valid = await bcrypt.compare(credentials.password as string, user.passwordHash);
                if (!valid) return null;
                return { id: user.id, name: user.username, email: user.email };
            },
        }),
    ],
    pages: {
        signIn: "/auth/login",
    },
    session: { strategy: "jwt" },
    secret: process.env.NEXTAUTH_SECRET || "facturapp-local-secret-change-me",
});
```

**`lib/auth/userStore.ts`** (new file):
```typescript
// Manages a local JSON file at `data/users.json` for offline auth.
// On first run, if no users exist, auto-creates default admin credentials.
import fs from "fs/promises";
import path from "path";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

export type User = {
    id: string;
    username: string;
    email: string;
    passwordHash: string;
    role: "admin" | "user";
    createdAt: string;
};

export type UserStore = { users: User[] };

const STORE_PATH = path.join(process.cwd(), "data", "users.json");

export async function readUserStore(): Promise<UserStore> {
    try {
        const raw = await fs.readFile(STORE_PATH, "utf-8");
        return JSON.parse(raw);
    } catch {
        // First run: create default admin
        const hash = await bcrypt.hash("admin123", 10);
        const defaultStore: UserStore = {
            users: [{
                id: randomUUID(),
                username: "admin",
                email: "admin@facturapp.local",
                passwordHash: hash,
                role: "admin",
                createdAt: new Date().toISOString(),
            }],
        };
        await writeUserStore(defaultStore);
        return defaultStore;
    }
}

export async function writeUserStore(store: UserStore): Promise<void> {
    await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
    await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf-8");
}

export async function createUser(username: string, password: string, email: string): Promise<User> {
    const store = await readUserStore();
    if (store.users.find(u => u.username === username)) {
        throw new Error("Username already exists");
    }
    const newUser: User = {
        id: randomUUID(),
        username,
        email,
        passwordHash: await bcrypt.hash(password, 10),
        role: "user",
        createdAt: new Date().toISOString(),
    };
    store.users.push(newUser);
    await writeUserStore(store);
    return newUser;
}
```

**`app/[locale]/auth/login/page.tsx`** (new file):
```typescript
// Beautiful centered login form with FacturApp branding
// Fields: username, password, "Se souvenir de moi" checkbox
// Uses server action to call signIn("credentials", ...)
// Shows error message on invalid credentials
// Redirect to "/" after successful login
// i18n: use locale from params
```

**`middleware.ts`** (project root):
```typescript
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const isLoginPage = req.nextUrl.pathname.includes("/auth/");

    if (!isLoggedIn && !isLoginPage) {
        const loginUrl = new URL("/fr/auth/login", req.url);
        loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
});

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon|assets).*)"],
};
```

**`app/api/auth/[...nextauth]/route.ts`**:
```typescript
import { handlers } from "@/auth";
export const { GET, POST } = handlers;
```

**`app/api/auth/register/route.ts`** — Protected registration endpoint (admin only):
```typescript
// POST { username, password, email }
// Requires valid session with role = "admin"
// Calls createUser() and returns 201
```

**Settings Modal — Users Tab** (new tab in `SettingsModal.tsx`):
- Change password form (current password → new password → confirm)
- Only visible to "admin" role
- Add user form (username, email, password) — for multi-user setups
- List of existing users with delete option

**Environment Variables** — Add to `.env.local` (create if not exists):
```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=change-me-to-a-random-64-char-string
```

---

## Feature 3: PWA — Offline + Online Support

FacturApp must be installable as a desktop/mobile app and work fully offline. All PDF generation is server-side (Puppeteer), so offline PDF generation requires a local server. The PWA approach here targets **locally hosted** instances (npm run start) and **browser cache** for the UI.

### Installation
```bash
npm install next-pwa
```

### `next.config.ts` — Wrap with next-pwa:
```typescript
import withPWA from "next-pwa";

const pwaConfig = withPWA({
    dest: "public",
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === "development",
    runtimeCaching: [
        {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: { cacheName: "google-fonts-cache", expiration: { maxEntries: 10, maxAgeSeconds: 365 * 24 * 60 * 60 } },
        },
        {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: { cacheName: "gstatic-fonts-cache", expiration: { maxEntries: 10, maxAgeSeconds: 365 * 24 * 60 * 60 } },
        },
        {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
            handler: "CacheFirst",
            options: { cacheName: "cdn-cache", expiration: { maxEntries: 5, maxAgeSeconds: 30 * 24 * 60 * 60 } },
        },
        {
            urlPattern: /\/api\/invoice\/generate/,
            handler: "NetworkOnly", // PDF generation always requires server
        },
        {
            urlPattern: /.*/,
            handler: "NetworkFirst",
            options: { cacheName: "app-cache", expiration: { maxEntries: 200, maxAgeSeconds: 24 * 60 * 60 } },
        },
    ],
});

export default pwaConfig({ /* existing next config here */ });
```

### `public/manifest.json` (new file):
```json
{
    "name": "FacturApp",
    "short_name": "FacturApp",
    "description": "Générateur de factures professionnel",
    "start_url": "/fr",
    "display": "standalone",
    "background_color": "#f8fafc",
    "theme_color": "#2563eb",
    "orientation": "portrait-primary",
    "icons": [
        { "src": "/assets/favicon/icon-192.png", "sizes": "192x192", "type": "image/png" },
        { "src": "/assets/favicon/icon-512.png", "sizes": "512x512", "type": "image/png" },
        { "src": "/assets/favicon/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
    ],
    "categories": ["business", "productivity"],
    "lang": "fr"
}
```

Add `<link rel="manifest" href="/manifest.json" />` to `app/[locale]/layout.tsx` `<head>`.

### Offline Indicator Component (`app/components/layout/OfflineIndicator.tsx`):
```typescript
// Client component that listens to window "online"/"offline" events
// Shows a dismissible banner at the top: "⚠️ Mode hors ligne — La génération PDF nécessite une connexion"
// Automatically hides when connection is restored
```

Add `<OfflineIndicator />` to `app/[locale]/layout.tsx` inside `<Providers>`.

### PWA Icons
Generate icons at `public/assets/favicon/icon-192.png` and `icon-512.png` from the FacturApp logo SVG. Use `sharp` or ImageMagick in a build script.

---

## Feature 4: DZD Number Formatting

**File:** `lib/helpers.ts` — update `formatNumberWithCommas`:
```typescript
export function formatNumberWithCommas(
    value: string | number,
    currency?: string
): string {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return "0";

    if (currency === "DZD") {
        // French/Algerian format: space thousands separator, comma decimal
        return new Intl.NumberFormat("fr-DZ", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(num);
    }

    // Default: comma thousands separator
    return new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);
}
```

Find every call to `formatNumberWithCommas` in `InvoiceTemplate1.tsx`, `InvoiceTemplate2.tsx`, `InvoiceSummary.tsx`, and pass `details.currency` as the second argument.

---

## Feature 5: NIF / RC / AI / NIS Fields (Algerian Compliance)

Add optional Algerian tax compliance fields to the **sender** section (and optionally receiver).

**`lib/schemas.ts`** — add to `InvoiceSenderSchema`:
```typescript
nif: z.string().max(20).optional(),  // Numéro d'Identification Fiscale
rc:  z.string().max(20).optional(),  // Registre de Commerce
ai:  z.string().max(20).optional(),  // Article d'Imposition
nis: z.string().max(20).optional(),  // Numéro d'Identification Statistique
```

**`lib/variables.ts`** — add to `FORM_DEFAULT_VALUES.sender`:
```typescript
nif: "", rc: "", ai: "", nis: "",
```

**`i18n/locales/fr.json`** + `en.json` — add keys:
```json
"nif": "NIF", "rc": "RC", "ai": "Article d'Imposition", "nis": "NIS"
```

**`BillFromSection.tsx`** — add 4 optional `<FormInput>` fields after the existing sender fields, in a 2×2 grid layout.

**PDF Templates** — in the sender block, conditionally render NIF/RC/AI/NIS below the company name if they have values:
```tsx
{details.sender?.nif && <p style={{fontSize: "11px", color: "#666"}}>NIF: {sender.nif}</p>}
{details.sender?.rc  && <p style={{fontSize: "11px", color: "#666"}}>RC: {sender.rc}</p>}
```

---

## Feature 6: Locale Files — Add Missing Keys

Add `brandColor`, `documentType`, `nif`, `rc`, `ai`, `nis` keys to ALL locale files:
`ar.json`, `de.json`, `es.json`, `it.json`, `zh.json`, `ja.json`

Check `i18n/locales/` for all available locale files and update each one.

---

## Architecture Quick Reference

```
app/
  [locale]/
    auth/login/page.tsx     ← Login page (NEW)
    invoices/page.tsx       ← Dashboard (existing)
    layout.tsx              ← Root layout + PWA manifest link
    page.tsx                ← Invoice editor
  api/
    auth/[...nextauth]/     ← NextAuth handlers (NEW)
    invoice/generate/       ← Puppeteer PDF
    invoice/send/           ← Email
    invoice/export/         ← JSON/CSV/XML/XLSX/DOCX
  components/
    invoice/form/sections/
      DocumentTypeSelector.tsx  ← NEW: Document type chips
    layout/
      OfflineIndicator.tsx      ← NEW: PWA offline banner
auth.ts                     ← NextAuth config (NEW, project root)
middleware.ts               ← Auth redirect middleware (NEW)
lib/
  auth/userStore.ts         ← Local user JSON store (NEW)
  documentTypes.ts          ← DocTypeConfig map (NEW)
  variables.ts              ← Add LOCAL_STORAGE_SAVED_INVOICES_KEY
  schemas.ts                ← Add documentType + NIF/RC/AI/NIS fields
data/
  users.json                ← Auto-created on first run (NEW, gitignore this)
public/
  manifest.json             ← PWA manifest (NEW)
  assets/favicon/
    icon-192.png            ← PWA icon (NEW)
    icon-512.png            ← PWA icon (NEW)
```

---

## Coding Standards (All Existing Rules Still Apply)

1. **TypeScript strictly** — no `any`, use types from `@/types`
2. **Form state via RHF** — `useFormContext()` / `useWatch()`, never local state for form values
3. **Translations** — all UI strings via `useTranslationContext()._t("key")`
4. **PDF templates** — Tailwind CDN, ONLY `style={{}}` for dynamic values (no dynamic className)
5. **Zod + FORM_DEFAULT_VALUES** — every new field in both
6. **i18n** — new keys in ALL locale files in `i18n/locales/`
7. **Component exports** — new components added to `app/components/index.ts`
8. **Data persistence** — use `"facturapp:"` prefix for all new localStorage keys

---

## Implementation Order (Recommended)

1. **Bug Fix #1** — Watermark in PDF (`InvoiceContext.tsx` + `generatePdfService.ts` + `InvoiceLayout.tsx`)
2. **Bug Fix #2** — Invoice history (`InvoiceContext.tsx` key migration + localStorage constant)
3. **Feature: DZD Formatting** — `lib/helpers.ts` + templates (quick win)
4. **Feature: NIF/RC/AI/NIS** — schema + form + PDF templates (quick, isolated)
5. **Feature: Document Types** — schema → config → selector component → templates → dashboard
6. **Feature: Auth** — install NextAuth → userStore → login page → middleware
7. **Feature: PWA** — install next-pwa → manifest → OfflineIndicator → icons
8. **Locale files** — add all new i18n keys to all locale files (last, bulk operation)

---

## Testing Checklist After Implementation

- [ ] Watermark logo appears in PDF after being set in Settings > Branding
- [ ] Invoice history shows saved documents on `/fr/invoices`
- [ ] DZD amounts format as `12 800,00` (space thousands, comma decimal)
- [ ] NIF/RC fields appear in PDF only when filled
- [ ] Switching document type updates number prefix and PDF title
- [ ] Bon de livraison hides prices, shows only quantities
- [ ] Login page blocks unauthenticated access to all routes
- [ ] Default admin credentials work: `admin` / `admin123`
- [ ] App can be installed as PWA (Chrome → "Install" button)
- [ ] Offline banner appears when network is disconnected
- [ ] All 6 document types appear in dashboard filter dropdown
- [ ] `npx tsc --noEmit` passes with 0 errors
- [ ] `npm run build` completes without errors

---

## Environment Setup

```bash
# Install new dependencies
npm install next-auth@beta bcryptjs next-pwa
npm install -D @types/bcryptjs

# Create .env.local
echo "NEXTAUTH_URL=http://localhost:3000" >> .env.local
echo "NEXTAUTH_SECRET=$(openssl rand -hex 32)" >> .env.local

# Add data/ to .gitignore (contains user credentials)
echo "data/" >> .gitignore

# Dev
npm run dev

# Type check
npx tsc --noEmit

# Build
npm run build
```

---

*FacturApp — built by Djaouad Azzouz / SiferOne · siferone.com*
