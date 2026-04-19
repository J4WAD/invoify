# FacturApp — Deep Codebase Analysis & Transformation Guide

> **Project:** invoify → FacturApp  
> **Author:** Djaouad Azzouz (Abdeldjouad Aymen Azzouz) — SiferOne  
> **Date:** 2026-04-12  
> **Stack:** Next.js 15 · TypeScript · Tailwind CSS · React Hook Form · Zod · Puppeteer · next-intl

---

## 1. Architecture Overview

```
invoify/
├── app/
│   ├── [locale]/                  # i18n route wrapper (next-intl)
│   │   ├── layout.tsx             # Root layout — metadata, fonts, navbar, footer, BMC widget ← KEY FILE
│   │   ├── page.tsx               # Home page → renders <InvoiceMain>
│   │   └── template/[id]/page.tsx # Template preview page
│   ├── api/
│   │   ├── invoice/generate/      # Puppeteer PDF generation endpoint
│   │   ├── invoice/send/          # Nodemailer email endpoint
│   │   └── invoice/export/        # JSON/CSV/XML/XLSX/DOCX export endpoint
│   └── components/
│       ├── invoice/
│       │   ├── InvoiceMain.tsx    # Root form + action layout
│       │   ├── InvoiceForm.tsx    # Multi-step wizard container
│       │   ├── InvoiceActions.tsx # PDF preview + action buttons
│       │   └── form/sections/     # BillFrom, BillTo, InvoiceDetails, Items, Payment, Summary
│       ├── templates/invoice-pdf/
│       │   ├── InvoiceLayout.tsx  # Shared wrapper (fonts, white bg)
│       │   ├── InvoiceTemplate1.tsx # Template 1 — basic white
│       │   └── InvoiceTemplate2.tsx # Template 2 — basic white
│       └── layout/
│           ├── BaseNavbar.tsx     # Logo + Language selector + Theme switcher
│           └── BaseFooter.tsx     # "Developed by Ali Abbasov" ← TO CHANGE
├── contexts/
│   ├── InvoiceContext.tsx         # Core state: PDF, save/load, form reset
│   ├── SignatureContext.tsx
│   ├── ChargesContext.tsx
│   └── TranslationContext.tsx     # Wraps next-intl _t() helper
├── i18n/
│   ├── routing.ts                 # Locale routing config
│   └── locales/
│       ├── en.json                # English (current default)
│       ├── fr.json                # French ✅ ALREADY EXISTS — just needs to be default
│       └── ar.json                # Arabic ✅ ALREADY EXISTS
├── lib/
│   ├── variables.ts               # FORM_DEFAULT_VALUES, constants, LOCALES ← KEY FILE
│   ├── schemas.ts                 # Zod validation schemas
│   ├── seo.ts                     # SEO metadata, JSON-LD ← TO CHANGE
│   └── helpers.ts                 # Formatting utilities
├── hooks/
│   └── useCurrencies.tsx          # Fetches from openexchangerates.org (external API)
├── services/invoice/
│   ├── client/exportInvoice.ts
│   └── server/
│       ├── generatePdfService.ts  # Puppeteer HTML→PDF
│       ├── exportInvoiceService.ts
│       └── sendPdfToEmailService.ts
└── public/assets/
    ├── img/                       # invoify-logo.svg, invoify-logo.png, template previews
    └── favicon/
```

---

## 2. What Needs to Change — Full Audit

### 2.1 Branding / Identity Changes

| Location | Current Value | Target Value |
|---|---|---|
| `app/[locale]/layout.tsx` | `title: "Invoify \| Free Invoice Generator"` | `"FacturApp \| Générateur de Factures"` |
| `app/[locale]/layout.tsx` | `description: "Create invoices effortlessly with Invoify..."` | `"Créez vos factures en quelques secondes avec FacturApp"` |
| `app/[locale]/layout.tsx` | `authors: { name: "Ali Abbasov", url: "https://aliabb.vercel.app" }` | `{ name: "Djaouad Azzouz", url: "https://siferone.com" }` |
| `app/[locale]/layout.tsx` | BMC Widget `<script>` tag | **REMOVE** entirely |
| `app/components/layout/BaseNavbar.tsx` | `invoify-logo.svg` | SiferOne logo (or FacturApp logo) |
| `app/components/layout/BaseFooter.tsx` | `"Ali Abbasov"` + AUTHOR_GITHUB link | `"Djaouad Azzouz"` + siferone.com |
| `lib/variables.ts` | `BASE_URL = "https://invoify.vercel.app"` | Your deployment URL |
| `lib/variables.ts` | `AUTHOR_WEBSITE = "https://aliabb.vercel.app"` | `"https://siferone.com"` |
| `lib/variables.ts` | `AUTHOR_GITHUB = "https://github.com/al1abb"` | `"https://siferone.com"` |
| `lib/seo.ts` | `name: "Invoify"`, `author: "Ali Abbasov"` | `"FacturApp"`, `"Djaouad Azzouz"` |
| `package.json` | `"name": "invoify"` | `"name": "facturapp"` |

### 2.2 Localization / Language Changes

| What | Where | Change |
|---|---|---|
| Default locale | `lib/variables.ts` → `DEFAULT_LOCALE` | `"en"` → `"fr"` |
| Locale list order | `lib/variables.ts` → `LOCALES` | Move `fr` to first position |
| Add Algerian locale alias | `lib/variables.ts` | Keep `fr` — Algeria uses French officially |
| Invoice template labels | `InvoiceTemplate1.tsx`, `InvoiceTemplate2.tsx` | Hardcoded English strings ("Bill to:", "Invoice #", "Due date:", "Subtotal:", etc.) need to use `_t()` translation OR be French by default |

**French locale file (`i18n/locales/fr.json`) already exists and is complete ✅**

### 2.3 Currency — Add DZD as Default

| What | Where | Change |
|---|---|---|
| Default currency | `lib/variables.ts` → `FORM_DEFAULT_VALUES.details.currency` | `"USD"` → `"DZD"` |
| Currency source | `hooks/useCurrencies.tsx` | DZD already exists in openexchangerates API — no change needed |
| Currency display | `InvoiceTemplate1.tsx`, `InvoiceTemplate2.tsx` | Already uses `{details.currency}` dynamically ✅ |

> **Note:** The `CURRENCIES_API` pulls from `openexchangerates.org`. DZD (Algerian Dinar) is included in this API. No custom code needed — just set the default.

### 2.4 Pre-filled Sender Profile (SiferOne)

In `lib/variables.ts`, update `FORM_DEFAULT_VALUES.sender` to pre-populate your business info:

```typescript
sender: {
  name: "Abdeldjouad Aymen Azzouz",
  address: "Rue 08 mai 45",
  zipCode: "19000",
  city: "Sétif",
  country: "Algérie",
  email: "dj@siferone.com",
  phone: "+213 541 190 274",
  customInputs: [
    { key: "NIF", value: "19819017873012901980" },
    { key: "Site", value: "www.siferone.com" }
  ],
},
```

Also update `FORM_DEFAULT_VALUES.details`:
```typescript
details: {
  ...
  currency: "DZD",          // Changed from USD
  language: "French",        // Changed from English
  paymentTerms: "À réception de facture",
  additionalNotes: "Merci pour votre confiance.",
  pdfTemplate: 3,            // Will be new SiferOne-branded template
}
```

### 2.5 New Invoice Template — SiferOne Dark Brand (Template 3)

Based on your PDF invoice design, a new `InvoiceTemplate3.tsx` should be created that mirrors:

- **Background:** Dark navy (`#0D1B2A` or similar) full page
- **Accent:** Red/coral geometric shapes (diamonds/polygons) — using CSS clip-path or SVG
- **Logo:** Top-left, white version of SiferOne logo
- **Contact info:** Top-right, white text
- **Invoice title:** Large bold white text center-left
- **Client name:** Bold red/white "Pour: [Name]"
- **Date:** Bottom-left, white
- **Tagline:** Bottom-left, italic white — "Your idea, from Zero to One."
- **QR code:** Bottom-right (optional — can be a placeholder)
- **Second page (detail table):** White background with French labels, DZD currency

### 2.6 Logo Background Watermark

To add a logo watermark to existing templates (Template 1 & 2):

In `InvoiceLayout.tsx`, add a watermark layer inside the wrapper div:

```tsx
<div className="flex flex-col p-4 sm:p-10 bg-white rounded-xl min-h-[60rem] relative">
  {/* Watermark */}
  {details.invoiceLogo && (
    <div 
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        opacity: 0.05,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <img src={details.invoiceLogo} width={400} alt="watermark" />
    </div>
  )}
  <div style={{ position: 'relative', zIndex: 1 }}>
    {children}
  </div>
</div>
```

---

## 3. File-by-File Change Map

### Priority 1 — Quick Wins (Identity)

```
app/[locale]/layout.tsx
  ✂ Remove entire BMC <script> tag
  ✏ title: "FacturApp | Générateur de Factures"  
  ✏ description: French description
  ✏ authors.name: "Djaouad Azzouz"
  ✏ authors.url: "https://siferone.com"

lib/variables.ts
  ✏ AUTHOR_WEBSITE → "https://siferone.com"
  ✏ AUTHOR_GITHUB → "https://siferone.com"
  ✏ DEFAULT_LOCALE → "fr"
  ✏ LOCALES → move fr to index 0
  ✏ FORM_DEFAULT_VALUES.sender → SiferOne profile
  ✏ FORM_DEFAULT_VALUES.details.currency → "DZD"
  ✏ FORM_DEFAULT_VALUES.details.language → "French"
  ✏ FORM_FILL_VALUES → update with real data for dev testing

lib/seo.ts
  ✏ name: "FacturApp"
  ✏ description: French
  ✏ author.name: "Djaouad Azzouz"
  ✏ author.url: "https://siferone.com"
  ✏ ROOTKEYWORDS: add French invoice keywords

app/components/layout/BaseFooter.tsx
  ✏ "Ali Abbasov" → "Djaouad Azzouz"
  ✏ Link href → "https://siferone.com"

app/components/layout/BaseNavbar.tsx
  ✏ Replace invoify-logo.svg with SiferOne/FacturApp logo
  ✏ Alt text → "FacturApp Logo"

package.json
  ✏ "name": "facturapp"
```

### Priority 2 — Language & Currency

```
lib/variables.ts
  ✏ DEFAULT_LOCALE = "fr"
  ✏ Move fr locale to first in LOCALES array
  ✏ FORM_DEFAULT_VALUES.details.currency = "DZD"
```

### Priority 3 — Templates

```
app/components/templates/invoice-pdf/InvoiceLayout.tsx
  ✏ Add watermark layer using invoiceLogo with 5% opacity

app/components/templates/invoice-pdf/InvoiceTemplate3.tsx  [NEW FILE]
  ✨ Dark navy SiferOne-style branded template
  ✨ Red geometric accents using CSS clip-path
  ✨ French labels throughout
  ✨ DZD currency formatting

app/components/invoice/form/TemplateSelector.tsx
  ✏ Add Template 3 preview image
```

### Priority 4 — NIF Field

```
lib/schemas.ts
  ✏ Add optional `nif` field to InvoiceSenderSchema

types.ts
  (auto-generated from schema)

app/components/invoice/form/sections/BillFromSection.tsx
  ✏ Add NIF input field (for Algerian auto-entrepreneur compliance)

i18n/locales/fr.json
  ✏ Add "nif": "N° d'Identification Fiscale (NIF)"
```

---

## 4. The Perfect Transformation Prompt

> Use this prompt with any AI coding assistant (Cursor, GitHub Copilot, Claude) to transform invoify into FacturApp in one session.

---

```
You are a senior full-stack engineer specializing in Next.js 15, TypeScript, and Tailwind CSS.

I have a Next.js invoice generator app called "invoify" that I need to transform into "FacturApp" — a professional French-language invoice generator for Algerian auto-entrepreneurs (freelancers).

## My Profile (Auto-fill the sender section)
- Name: Abdeldjouad Aymen Azzouz
- Business: SiferOne
- NIF (Tax ID): 19819017873012901980
- Address: Rue 08 mai 45, Sétif, Algérie (19000)
- Phone: +213 541 190 274
- Email: dj@siferone.com
- Website: www.siferone.com
- Tagline: "Your idea, from Zero to One."

## Task 1 — Rebrand to FacturApp
File: `app/[locale]/layout.tsx`
- Change title to: "FacturApp | Générateur de Factures Professionnel"
- Change description to: "Créez vos factures professionnelles en quelques secondes avec FacturApp. Gratuit, rapide et conforme."
- Change `authors` to: `{ name: "Djaouad Azzouz", url: "https://siferone.com" }`
- REMOVE the entire <script> BMC Widget tag (the one with data-name="BMC-Widget" and src from buymeacoffee.com)

File: `lib/variables.ts`
- Change AUTHOR_WEBSITE to "https://siferone.com"
- Change AUTHOR_GITHUB to "https://siferone.com"
- Change DEFAULT_LOCALE to "fr"
- In LOCALES array, move { code: "fr", name: "Français" } to index 0

File: `lib/seo.ts`
- Change name to "FacturApp"
- Change description to "Générateur de factures professionnel pour auto-entrepreneurs algériens"
- Change author.name to "Djaouad Azzouz"
- Change author.url to "https://siferone.com"
- Replace ROOTKEYWORDS with: ["facture", "générateur de facture", "facture algérie", "facture DZD", "auto-entrepreneur algérie", "invoice generator", "facturapp"]

File: `package.json`
- Change "name" to "facturapp"

File: `app/components/layout/BaseFooter.tsx`
- Change "Ali Abbasov" to "Djaouad Azzouz"
- Change the href to "https://siferone.com"

File: `app/components/layout/BaseNavbar.tsx`
- Change the Image alt from "Invoify Logo" to "FacturApp Logo"

## Task 2 — Pre-fill Sender Profile
File: `lib/variables.ts` → `FORM_DEFAULT_VALUES`

Replace the empty sender object with:
```typescript
sender: {
  name: "Abdeldjouad Aymen Azzouz",
  address: "Rue 08 mai 45",
  zipCode: "19000",
  city: "Sétif",
  country: "Algérie",
  email: "dj@siferone.com",
  phone: "+213 541 190 274",
  customInputs: [
    { key: "NIF", value: "19819017873012901980" },
    { key: "Site web", value: "www.siferone.com" }
  ],
},
```

Replace the empty details object currency and language:
```typescript
details: {
  ...existing fields...,
  currency: "DZD",
  language: "French",
  paymentTerms: "À réception de facture",
  additionalNotes: "Merci pour votre confiance. — SiferOne",
  pdfTemplate: 1,
}
```

Also update FORM_FILL_VALUES (dev test data) with the same sender info.

## Task 3 — Logo Watermark in Templates
File: `app/components/templates/invoice-pdf/InvoiceLayout.tsx`

Wrap the existing content div to add a watermark:
```tsx
<div className="flex flex-col p-4 sm:p-10 bg-white rounded-xl min-h-[60rem] relative overflow-hidden">
  {/* Background logo watermark */}
  {details.invoiceLogo && (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        opacity: 0.04,
        pointerEvents: 'none',
        zIndex: 0,
        userSelect: 'none',
      }}
    >
      <img src={details.invoiceLogo} width={500} height={500} alt="" aria-hidden="true" />
    </div>
  )}
  <div style={{ position: 'relative', zIndex: 1 }}>
    {children}
  </div>
</div>
```

## Task 4 — New Dark Branded Template (Template 3 — SiferOne Style)
Create file: `app/components/templates/invoice-pdf/InvoiceTemplate3.tsx`

This should be a professional dark-themed invoice template inspired by the SiferOne brand:
- Dark navy background (#0D1B2A)
- Red/coral accent color (#E8401C)
- Logo top-left
- Contact info top-right (white text)
- Large bold invoice title center
- Client name in accent color
- Invoice number and date
- Items table on white/light section
- Total in DZD prominently displayed
- Tagline at bottom: "Your idea, from Zero to One."
- French labels throughout: "Facturé à:", "N° Facture:", "Date:", "Désignation", "Qté", "Prix Unit.", "Total", "Sous-total", "Total TTC"

Then register Template 3 in `app/components/invoice/form/TemplateSelector.tsx`.

## Task 5 — French as Default Language on Generated PDF
In both `InvoiceTemplate1.tsx` and `InvoiceTemplate2.tsx`, replace all hardcoded English labels:
- "Bill to:" → "Facturé à :"
- "Invoice #" → "Facture N°"
- "Invoice date:" → "Date d'émission :"
- "Due date:" → "Date d'échéance :"
- "Item" → "Désignation"
- "Qty" → "Qté"
- "Rate" → "Prix Unit."
- "Amount" → "Montant"
- "Subtotal:" → "Sous-total :"
- "Discount:" → "Remise :"
- "Tax:" → "TVA :"
- "Shipping:" → "Livraison :"
- "Total:" → "Total TTC :"
- "Total in words:" → "Arrêté à :"
- "Additional notes:" → "Notes :"
- "Payment terms:" → "Conditions de paiement :"
- "Please send the payment to this address" → "Informations de paiement :"
- "Bank:" → "Banque :"
- "Account name:" → "Titulaire :"
- "Account no:" → "N° de compte :"
- "If you have any questions concerning this invoice..." → "Pour toute question concernant cette facture, contactez-nous :"
- "Signature:" → "Signature :"

## Task 6 — DZD Currency Formatting
File: `lib/helpers.ts` (if it exists)
Ensure number formatting uses space as thousands separator for DZD:
Example: 12 800 DZD (not 12,800 DZD)

In `InvoiceTemplate1.tsx` and `InvoiceTemplate2.tsx`, when `details.currency === "DZD"`, format numbers using French locale:
```typescript
const formatDZD = (amount: number) => 
  new Intl.NumberFormat('fr-DZ', { 
    minimumFractionDigits: 0,
    maximumFractionDigits: 2 
  }).format(amount);
```

## Constraints
- Do NOT change any Zod schemas unless adding the NIF field
- Do NOT break the existing wizard flow
- Do NOT remove the multi-language support — just change the default
- Keep all existing export functionality (JSON, CSV, XML, XLSX, DOCX)
- Keep the signature functionality
- Preserve the dark/light theme toggle
```

---

## 5. Implementation Priority Order

```
Phase 1 — Identity (30 min)
  ✅ app/[locale]/layout.tsx    Remove BMC, update metadata
  ✅ lib/variables.ts           AUTHOR_*, DEFAULT_LOCALE="fr", prefill sender
  ✅ lib/seo.ts                 FacturApp branding
  ✅ package.json               name="facturapp"
  ✅ BaseFooter.tsx             Djaouad Azzouz
  ✅ BaseNavbar.tsx             Logo alt text

Phase 2 — Language & Currency (15 min)
  ✅ lib/variables.ts           DEFAULT_LOCALE, LOCALES order, currency="DZD"

Phase 3 — Template Enhancements (2–3 hrs)
  ✅ InvoiceLayout.tsx          Logo watermark
  ✅ InvoiceTemplate1.tsx       French labels
  ✅ InvoiceTemplate2.tsx       French labels
  ✨ InvoiceTemplate3.tsx       New dark SiferOne template [NEW]
  ✨ TemplateSelector.tsx       Register Template 3

Phase 4 — NIF Field (1 hr)
  ✨ lib/schemas.ts             Add nif to sender schema
  ✨ BillFromSection.tsx        NIF input
  ✨ fr.json                    NIF translation key
  ✨ InvoiceTemplate1/2/3       Display NIF on PDF

Phase 5 — Polish (1 hr)
  ✨ Logo file                  Replace invoify-logo with FacturApp/SiferOne logo
  ✨ Favicon                    Update favicon
  ✨ DZD number formatting      French locale number format
```

---

## 6. Key Technical Notes

### PDF Generation Flow
```
User fills form → clicks "Générer PDF"
→ POST /api/invoice/generate
→ generatePdfService.ts
→ Puppeteer launches headless Chrome
→ Renders React component as HTML string
→ Returns PDF blob
→ Displayed in PdfViewer component
```

The PDF is generated server-side using Puppeteer. The Tailwind CSS is loaded via CDN (`TAILWIND_CDN` constant) inside the rendered HTML. Custom fonts come from Google Fonts.

### Currency API Dependency
The app fetches currencies from `https://openexchangerates.org/api/currencies.json`. DZD is included in this API. If the API is down, currencies won't load — consider caching or bundling a static currencies JSON as fallback.

### Local Storage Keys
- `invoify:invoiceDraft` — auto-saved form draft
- `savedInvoices` — array of saved invoices

After renaming the app, consider updating the local storage key to `facturapp:invoiceDraft` to avoid conflicts with old data.

### i18n Architecture
- URL-based locale: `/{locale}/` — e.g., `/fr/`, `/en/`
- Default locale (`fr`) will not show in URL prefix (depending on next-intl config)
- The translation context (`TranslationContext.tsx`) exposes `_t(key)` helper used throughout components

---

## 7. Files That Reference "Ali Abbasov" or "Invoify" — Complete List

| File | References |
|---|---|
| `app/[locale]/layout.tsx` | "Invoify", "Ali Abbasov", BMC widget `aliabb` |
| `lib/variables.ts` | `AUTHOR_WEBSITE` (aliabb.vercel.app), `AUTHOR_GITHUB` (al1abb) |
| `lib/seo.ts` | "Invoify", "Ali Abbasov", author URL |
| `app/components/layout/BaseFooter.tsx` | "Ali Abbasov", AUTHOR_GITHUB |
| `public/assets/img/invoify-logo.svg` | File rename needed |
| `public/assets/img/invoify-logo.png` | File rename needed |

---

*Generated by Claude for FacturApp transformation — SiferOne 2026*
