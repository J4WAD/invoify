# FacturApp — Claude Code Instructions

> This is the working prompt for Claude Code CLI (`claude` command).  
> Drop this file in the project root and Claude Code will read it automatically on every session.

---

## Project Identity

This project is **FacturApp** — a professional, fully-brandable invoice generator built on Next.js 15.  
It was forked from the open-source "invoify" project and customized for French-language, multi-currency use.

**Stack:** Next.js 15 · TypeScript · Tailwind CSS · React Hook Form · Zod · Puppeteer · next-intl  
**Default language:** French (`fr`)  
**Default currency:** DZD (Algerian Dinar)

---

## What Has Already Been Done

These changes are **already implemented** — do not redo them:

- ✅ Removed Buy Me Coffee widget from `app/[locale]/layout.tsx`
- ✅ Renamed app to FacturApp (metadata, SEO, package.json, localStorage key)
- ✅ Author changed to Djaouad Azzouz / siferone.com
- ✅ Default locale set to `fr` (French first in LOCALES array)
- ✅ Default currency set to `DZD`
- ✅ Added `brandColor` field to `InvoiceDetailsSchema` (Zod) + `FORM_DEFAULT_VALUES`
- ✅ Created `ColorInput` component (`app/components/reusables/form-fields/ColorInput.tsx`)
  - 8 preset swatches + native color picker + hex display
  - Exported from `app/components/index.ts`
- ✅ Added `ColorInput` to `InvoiceDetails` form section (uses `details.brandColor`)
- ✅ Added i18n keys `brandColor` to both `en.json` and `fr.json`
- ✅ Updated `InvoiceLayout.tsx` — logo watermark bottom-right, 7% opacity, grayscale
- ✅ Updated `InvoiceTemplate1.tsx` — French labels + brand color driven by `details.brandColor`
- ✅ Updated `InvoiceTemplate2.tsx` — French labels + colored header band + brand color

---

## Architecture Quick Reference

```
app/
  [locale]/
    layout.tsx          ← Root layout (metadata, fonts, no BMC)
    page.tsx            ← Renders <InvoiceMain>
  api/invoice/
    generate/route.ts   ← Puppeteer PDF generation
    send/route.ts       ← Nodemailer email
    export/route.ts     ← JSON/CSV/XML/XLSX/DOCX export
  components/
    templates/invoice-pdf/
      InvoiceLayout.tsx   ← Shared wrapper + watermark logic
      InvoiceTemplate1.tsx ← Template 1 (classic, brand-colored)
      InvoiceTemplate2.tsx ← Template 2 (header band style)
    invoice/form/sections/
      InvoiceDetails.tsx  ← Logo, number, dates, currency, brandColor picker
      BillFromSection.tsx ← Sender info + custom inputs
      BillToSection.tsx   ← Receiver info
    reusables/form-fields/
      ColorInput.tsx      ← Brand color picker (NEW)
lib/
  variables.ts    ← FORM_DEFAULT_VALUES, LOCALES, DEFAULT_LOCALE
  schemas.ts      ← Zod schemas (brandColor added to InvoiceDetailsSchema)
  seo.ts          ← SEO metadata (FacturApp branding)
i18n/locales/
  fr.json         ← French (default)
  en.json         ← English
```

---

## Coding Standards & Rules

1. **TypeScript strictly** — no `any`, use types from `@/types`
2. **Form state via React Hook Form** — always use `useFormContext()` / `useWatch()`, never local state for form values
3. **Translations via `_t()`** — all UI strings must use `useTranslationContext()._t("key")`, no hardcoded English strings in UI components
4. **PDF templates are server-rendered** — Tailwind is loaded via CDN (`TAILWIND_CDN`). Use inline `style={{}}` for dynamic values like `brandColor`. Do NOT use `className` with dynamic values (Tailwind purges them)
5. **Zod schema** — any new invoice field must be added to `InvoiceDetailsSchema` in `lib/schemas.ts` AND to `FORM_DEFAULT_VALUES` in `lib/variables.ts`
6. **i18n** — new UI label keys must be added to ALL locale files in `i18n/locales/`
7. **Component exports** — new components must be added to `app/components/index.ts`

---

## Key Patterns

### Adding a new field to the invoice

```typescript
// 1. lib/schemas.ts — add to InvoiceDetailsSchema
myField: fieldValidators.stringOptional,

// 2. lib/variables.ts — add to FORM_DEFAULT_VALUES.details
myField: "",

// 3. i18n/locales/fr.json + en.json — add translation key
"myField": "Mon champ"

// 4. Form section — use FormInput
<FormInput name="details.myField" label={_t("form.steps.invoiceDetails.myField")} />

// 5. PDF template — use inline style, not className
<p style={{ color: details.brandColor }}>{details.myField}</p>
```

### Using brand color in templates (CORRECT)

```tsx
// ✅ Correct — inline style (survives Puppeteer rendering)
const brand = details.brandColor || "#2563eb";
<h1 style={{ color: brand }}>Title</h1>
<div style={{ backgroundColor: brand }}>Header</div>

// ❌ Wrong — dynamic Tailwind class (gets purged)
<h1 className={`text-[${brand}]`}>Title</h1>
```

### Watermark pattern (already in InvoiceLayout.tsx)

The watermark uses the uploaded invoice logo at 7% opacity, bottom-right, grayscale.  
Position: `absolute`, bottom: 24px, right: 24px — inside a `relative overflow-hidden` container.  
Content sits in a `z-index: 1` wrapper above it.

---

## Pending / Future Tasks

These are NOT yet done — implement when asked:

- [ ] **NIF field** for Algerian compliance — add optional `nif` field to `InvoiceSenderSchema`, display in templates below sender name
- [ ] **Logo replacement** — replace `invoify-logo.svg` / `invoify-logo.png` in `public/assets/img/` with FacturApp logo
- [ ] **Favicon update** — update `public/assets/favicon/`
- [ ] **DZD number formatting** — use `Intl.NumberFormat('fr-DZ')` for space-separated thousands when currency is DZD (e.g., `12 800 DZD` not `12,800 DZD`)
- [ ] **Other locale files** — add `brandColor` key to `ar.json`, `de.json`, `es.json`, `it.json`, and all other locales
- [ ] **Template 3** — dark-themed template (optional, for future sprint)
- [ ] **Save/load brandColor** — verify brandColor is correctly persisted in localStorage invoice drafts (it should be, via existing save logic)

---

## Common Commands

```bash
# Development
npm run dev

# Build
npm run build

# Lint
npm run lint

# Type check
npx tsc --noEmit
```

---

## File Naming Conventions

| Type | Pattern | Example |
|---|---|---|
| Component | PascalCase | `ColorInput.tsx` |
| Hook | camelCase with `use` prefix | `useCurrencies.tsx` |
| Service | camelCase | `generatePdfService.ts` |
| Locale | ISO code | `fr.json`, `ar.json` |
| Variable constants | SCREAMING_SNAKE_CASE | `FORM_DEFAULT_VALUES` |

---

*FacturApp — built by Djaouad Azzouz / SiferOne · siferone.com*
