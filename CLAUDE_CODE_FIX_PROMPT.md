# FacturApp — Claude Code Fix Prompt
> Paste this entire prompt into Claude Code CLI. It is self-contained and fully specifies all required fixes.

---

## Context

This is **FacturApp**, a Next.js 15 / TypeScript invoice generator forked from "invoify" and customized for French-language, Algerian commercial use. The stack is: Next.js 15, TypeScript, Tailwind CSS, React Hook Form, Zod, Puppeteer, next-intl.

**Key architectural rules (already in place — do not redo):**
- All form state via `useFormContext()` / `useWatch()` from React Hook Form — never local state
- All UI strings via `useTranslationContext()._t("key")` — no hardcoded strings
- PDF templates are server-rendered with Tailwind loaded via CDN — use `style={{}}` for all dynamic values, never dynamic `className`
- Any new invoice field must be added to: `lib/schemas.ts` → `lib/variables.ts` FORM_DEFAULT_VALUES → `i18n/locales/fr.json` + `en.json` → the form section component → PDF templates
- New components must be exported from `app/components/index.ts`

---

## FIX 1 — Layout Issues in "De & À" Section (BillFromSection + BillToSection)

### Problem A — BillFromSection.tsx: Algerian tax field grid overflow

**File:** `app/components/invoice/form/sections/BillFromSection.tsx`

The current `grid grid-cols-2 gap-3` layout places 4 fields in pairs:
- Row 1: `NIF` | `RC`
- Row 2: `Article d'imposition` (label too long, wraps/overflows) | `NIS`

**Fix:** Restructure the Algerian tax fields grid to a clean 4-column layout where each short label (NIF, NIS, RC, AI) gets equal space, with "Article d'imposition" clearly labeled. Use this exact layout:

```tsx
{/* Algerian compliance fields — 2 columns, 3 rows */}
<div className="grid grid-cols-2 gap-3">
    <FormInput
        name="sender.nif"
        label={_t("form.steps.fromAndTo.nif")}
        placeholder="NIF"
    />
    <FormInput
        name="sender.nis"
        label={_t("form.steps.fromAndTo.nis")}
        placeholder="NIS"
    />
    <FormInput
        name="sender.rc"
        label={_t("form.steps.fromAndTo.rc")}
        placeholder="RC"
    />
    <FormInput
        name="sender.ai"
        label={_t("form.steps.fromAndTo.ai")}
        placeholder="AI"
    />
</div>
```

Order: NIF | NIS (row 1), RC | AI (row 2). This pairs short labels, eliminates overflow. The `placeholder` for `ai` changes from "Article d'imposition" to "AI" (the label in the form already shows the full name via `_t()`).

### Problem B — BillToSection.tsx: Missing Algerian tax fields for receiver

**Per Algerian commercial law (Article 21 du Code du Commerce), professional invoices require the client's NIF, NIS, RC, and AI.** The receiver currently has no such fields.

#### Step B1 — Update `lib/schemas.ts`

Add tax ID fields to `InvoiceReceiverSchema` (same pattern as `InvoiceSenderSchema`):

```typescript
const InvoiceReceiverSchema = z.object({
    name: fieldValidators.name,
    address: fieldValidators.address,
    zipCode: fieldValidators.zipCode,
    city: fieldValidators.city,
    country: fieldValidators.country,
    email: fieldValidators.email,
    phone: fieldValidators.phone,
    customInputs: z.array(CustomInputSchema).optional(),
    /** Algerian compliance fields for professional clients */
    nif: taxIdField,
    nis: taxIdField,
    rc: taxIdField,
    ai: taxIdField,
});
```

#### Step B2 — Update `lib/variables.ts` FORM_DEFAULT_VALUES

In `FORM_DEFAULT_VALUES.receiver`, add:
```typescript
nif: "",
nis: "",
rc: "",
ai: "",
```

#### Step B3 — Update `app/components/invoice/form/sections/BillToSection.tsx`

After the `receiver.phone` `<FormInput>`, add the same 2×2 grid as the sender fix, but using `receiver.*` names:

```tsx
{/* Algerian compliance fields for professional clients */}
<div className="grid grid-cols-2 gap-3">
    <FormInput name="receiver.nif" label={_t("form.steps.fromAndTo.nif")} placeholder="NIF" />
    <FormInput name="receiver.nis" label={_t("form.steps.fromAndTo.nis")} placeholder="NIS" />
    <FormInput name="receiver.rc"  label={_t("form.steps.fromAndTo.rc")}  placeholder="RC" />
    <FormInput name="receiver.ai"  label={_t("form.steps.fromAndTo.ai")}  placeholder="AI" />
</div>
```

Place this block **between** the phone field and the `{fields?.map(...)}` custom inputs block.

#### Step B4 — Update `@/types` (InvoiceType / receiver type)

Check `types/index.ts` (or wherever `InvoiceReceiverType` is defined). Add `nif?: string; nis?: string; rc?: string; ai?: string;` to the receiver type, matching the sender type.

#### Step B5 — Display receiver tax IDs in PDF templates

In **both** `InvoiceTemplate1.tsx` and `InvoiceTemplate2.tsx`, find the "Bill-to" / "Facturé à" section that displays `receiver.name`, `receiver.address`, etc. After the `receiver.customInputs` block, add:

```tsx
{/* Receiver Algerian tax IDs — show only if present */}
{(receiver.nif || receiver.nis || receiver.rc || receiver.ai) && (
    <div style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>
        {receiver.nif && <span><b>NIF:</b> {receiver.nif}&nbsp;&nbsp;</span>}
        {receiver.nis && <span><b>NIS:</b> {receiver.nis}&nbsp;&nbsp;</span>}
        {receiver.rc  && <span><b>RC:</b>  {receiver.rc}&nbsp;&nbsp;</span>}
        {receiver.ai  && <span><b>AI:</b>  {receiver.ai}</span>}
    </div>
)}
```

Use **inline `style`** only — no dynamic `className`.

---

## FIX 2 — PDF Generation Returns Blank Page

**File:** `services/invoice/server/generatePdfService.ts`

### Root Causes

1. **Missing full HTML document wrapper.** `ReactDOMServer.renderToStaticMarkup()` returns a bare component fragment (no `<html>`, `<head>`, `<body>`). When Puppeteer calls `page.setContent()` with this fragment, the browser wraps it implicitly, but the Tailwind CDN `<link>` added via `page.addStyleTag()` is injected into an already-parsed DOM, which is unreliable and can result in styles never applying — leaving a styled-but-invisible or unsized page.

2. **`displayHeaderFooter: true` with `margin.top: '10px'`** — Puppeteer's header/footer requires a minimum top margin of ~40px or content is clipped off the top of the first page, causing an apparent "blank" result.

3. **`waitUntil: ["load", "domcontentloaded"]`** fires before the externally-loaded Tailwind CSS is available, so layout isn't computed correctly when the PDF snapshot is taken.

### Fix

Replace the entire content-loading and PDF-generation block with the following approach:

```typescript
// Build a complete, self-contained HTML document.
// Tailwind CDN is placed in <head> so it loads before the body renders.
const fullHtml = `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="${TAILWIND_CDN}" />
    <style>
      @page { size: A4; margin: 0; }
      body { margin: 0; padding: 0; font-family: sans-serif; }
    </style>
  </head>
  <body>
    ${htmlTemplate}
  </body>
</html>`;

await page.setContent(fullHtml, {
    waitUntil: "networkidle0",   // wait for Tailwind CDN to fully load
    timeout: 30000,
});

// Extra guard: wait until Tailwind stylesheet is actually parsed
await page
    .waitForFunction(
        () =>
            document.styleSheets.length > 0 &&
            Array.from(document.styleSheets).some((s) =>
                (s.href || "").includes("tailwind")
            ),
        { timeout: 10000 }
    )
    .catch(() => {});

// Wait for images (logo, watermark) to decode
await page
    .evaluate(async () => {
        const imgs = Array.from(document.images);
        await Promise.all(
            imgs.map((img) =>
                img.complete
                    ? Promise.resolve()
                    : new Promise((res) => {
                          img.addEventListener("load", res);
                          img.addEventListener("error", res);
                      })
            )
        );
    })
    .catch(() => {});

const pdf: Uint8Array = await page.pdf({
    format: "a4",
    printBackground: true,
    preferCSSPageSize: false,           // Let Puppeteer control the A4 size
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: `
        <div style="font-size:9px;width:100%;text-align:center;color:#999;padding:0 40px;font-family:sans-serif;">
            <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>
    `,
    margin: { top: '20px', right: '0px', bottom: '40px', left: '0px' },
});
```

**Key changes:**
- Wrap in a full `<!DOCTYPE html>…</html>` so the `<link>` tag is in `<head>` and loads synchronously before body renders
- Remove the separate `page.addStyleTag()` call — it's now in the `<head>` of the full document
- Change `waitUntil` from `["load", "domcontentloaded"]` to `"networkidle0"` — ensures CDN stylesheet is fetched
- Set `preferCSSPageSize: false` — let Puppeteer control A4 sizing reliably
- Increase `margin.top` from `'10px'` to `'20px'` — prevents header from clipping first-page content
- Remove the now-redundant `page.addStyleTag()` + `waitForFunction` for Tailwind (it's already embedded)

Remove the old `page.addStyleTag(...)` try/catch block entirely since it is replaced by the `<link>` in `<head>`.

---

## FIX 3 — Algerian Commercial Document Compliance

### 3A — Add `devisValidity` field (Devis expiry — mandatory in Algerian devis)

A "Devis" (quote) in Algeria must include the validity duration of the offer.

**Step 1 — `lib/schemas.ts`:** In `InvoiceDetailsSchema`, add:
```typescript
devisValidity: fieldValidators.stringOptional,   // e.g. "30 jours"
```

**Step 2 — `lib/variables.ts`:** In `FORM_DEFAULT_VALUES.details`, add:
```typescript
devisValidity: "",
```

**Step 3 — `i18n/locales/fr.json` + `en.json`:** Add key:
```json
"devisValidity": "Validité de l'offre"   // fr.json
"devisValidity": "Quote validity"         // en.json
```

**Step 4 — Display in `InvoiceDetails.tsx` form section:** Conditionally render when `documentType === "devis"`:

```tsx
// At the top of the component, add:
const watchedDocType = useWatch({ name: "details.documentType" });

// In JSX, after the dueDate field:
{watchedDocType === "devis" && (
    <FormInput
        name="details.devisValidity"
        label={_t("form.steps.invoiceDetails.devisValidity")}
        placeholder="ex: 30 jours"
    />
)}
```

**Step 5 — PDF Templates (Template1 + Template2):** In the dates section, after the dueDate row, add conditionally:

```tsx
{docType === "devis" && details.devisValidity && (
    <dl className="grid sm:grid-cols-6 gap-x-3">
        <dt className="col-span-3 font-semibold text-gray-800">Validité :</dt>
        <dd className="col-span-3 text-gray-500">{details.devisValidity}</dd>
    </dl>
)}
```

### 3B — Add NIF/NIS/RC/AI to sender header in PDF templates (Template1 + Template2)

Per Algerian law, the seller's NIF, NIS, RC, and AI must appear in the document header, not just as a footnote. In both templates, in the header/sender block (where `sender.name` and `sender.address` are displayed), add the tax IDs directly below the address:

```tsx
{/* Sender legal identifiers */}
{(sender.nif || sender.nis || sender.rc || sender.ai) && (
    <div style={{ fontSize: "10px", color: "#888", marginTop: "4px", lineHeight: "1.6" }}>
        {sender.nif && <span><b>NIF:</b> {sender.nif}&nbsp; </span>}
        {sender.nis && <span><b>NIS:</b> {sender.nis}&nbsp; </span>}
        {sender.rc  && <span><b>RC:</b>  {sender.rc}&nbsp; </span>}
        {sender.ai  && <span><b>AI:</b>  {sender.ai}</span>}
    </div>
)}
```

In **Template1** this belongs in the `<address>` block on the right side of the header (below `sender.country`).
In **Template2** this belongs in the colored header band, below the `<address>` block (white text, lower opacity).

For Template2 specifically, use white text to match the band:
```tsx
<div style={{ fontSize: "10px", color: "rgba(255,255,255,0.75)", marginTop: "4px" }}>
```

### 3C — Add `totalAmountInWords` rendering in Template 2

Template 1 already shows "Arrêtée à :" (the amount in words, required by Algerian law). Verify Template 2 also renders `details.totalAmountInWords` in the totals section. If missing, add:

```tsx
{details.totalAmountInWords && (
    <dl className="grid sm:grid-cols-5 gap-x-3">
        <dt className="col-span-3 font-semibold text-gray-700">Arrêtée la présente à :</dt>
        <dd className="col-span-2 text-gray-500 italic">{details.totalAmountInWords}</dd>
    </dl>
)}
```

### 3D — Add "Bon de Réception" document type

**`lib/documentTypes.ts`** (or wherever `DOCUMENT_TYPE_CONFIG` is defined): Add a `"bon_de_reception"` entry with `showPrices: false`, `showPaymentInfo: false`, `showDueDate: false`, `showSignature: true`. The PDF title should be `"BON DE RÉCEPTION"`.

Also update the `InvoiceDetailsSchema` enum in `lib/schemas.ts` to include `"bon_de_reception"`.

Update the `DocumentTypeSelector` component and any dropdown that lists document types to include the new option with French label "Bon de Réception".

### 3E — Fix BL (Bon de Livraison) — must NOT show prices

Verify that in `DOCUMENT_TYPE_CONFIG`, the `"bon_de_livraison"` entry has `showPrices: false`. A delivery note (BL) never contains prices in Algerian commercial practice — it's purely a transport/receipt document. If `showPrices` is `true` or missing for this type, set it to `false`.

---

## Verification Checklist

After implementing all fixes, verify:

1. **Form layout:** Open the app, navigate to "De & À". Confirm NIF/NIS/RC/AI appear in clean 2×2 grids in both "De" and "À" sections with no label overflow.
2. **PDF generation:** Fill out a test invoice and click "Télécharger PDF". Confirm the file opens with visible content on page 1 (not blank). Confirm page numbers appear in the footer.
3. **Algerian tax IDs in PDF:** Fill in NIF/NIS/RC/AI for both sender and receiver. Download PDF. Confirm both sets appear in the correct locations in the document.
4. **Devis validity:** Select "Devis" document type. Confirm a "Validité de l'offre" field appears in the form. Fill it in. Confirm it appears in the PDF.
5. **TypeScript:** Run `npx tsc --noEmit`. Zero errors.
6. **Lint:** Run `npm run lint`. Zero errors.

---

*FacturApp — built by Djaouad Azzouz / SiferOne · siferone.com*
