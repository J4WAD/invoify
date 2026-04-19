"use client";

// RHF
import { useWatch, useFormContext, Controller } from "react-hook-form";

// Compute relative luminance → WCAG contrast ratio against white.
// Warn the user when the chosen brand color would fail AA (< 4.5:1).
function hexLuminance(hex: string): number | null {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex);
    if (!m) return null;
    const n = parseInt(m[1], 16);
    const r = ((n >> 16) & 0xff) / 255;
    const g = ((n >> 8) & 0xff) / 255;
    const b = (n & 0xff) / 255;
    const lin = (c: number) =>
        c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
function contrastVsWhite(hex: string): number | null {
    const l = hexLuminance(hex);
    if (l === null) return null;
    return 1.05 / (l + 0.05);
}

// Components
import {
    ColorInput,
    CurrencySelector,
    DatePickerFormField,
    FormInput,
    FormFile,
    Subheading,
    TemplateSelector,
} from "@/app/components";

// Contexts
import { useTranslationContext } from "@/contexts/TranslationContext";

const TAX_REGIME_OPTIONS = [
    { value: "ASSUJETTI_TVA", labelKey: "form.steps.invoiceDetails.taxRegime.ASSUJETTI_TVA" },
    { value: "DISPENSE_IFU", labelKey: "form.steps.invoiceDetails.taxRegime.DISPENSE_IFU" },
    { value: "EXONERE",       labelKey: "form.steps.invoiceDetails.taxRegime.EXONERE" },
];

const InvoiceDetails = () => {
    const { _t } = useTranslationContext();
    const { control } = useFormContext();
    const watchedDocType = useWatch({ name: "details.documentType" });
    const watchedBrandColor = useWatch({ name: "details.brandColor" }) as
        | string
        | undefined;
    const brandContrast = watchedBrandColor
        ? contrastVsWhite(watchedBrandColor)
        : null;
    const showContrastWarning =
        brandContrast !== null && brandContrast < 4.5;

    return (
        <section className="flex flex-col flex-wrap gap-5">
            <Subheading>{_t("form.steps.invoiceDetails.heading")}:</Subheading>

            <div className="flex flex-row flex-wrap gap-5">
                <div className="flex flex-col gap-2">
                    <FormFile
                        name="details.invoiceLogo"
                        label={_t(
                            "form.steps.invoiceDetails.invoiceLogo.label"
                        )}
                        placeholder={_t(
                            "form.steps.invoiceDetails.invoiceLogo.placeholder"
                        )}
                    />

                    <FormInput
                        name="details.invoiceNumber"
                        label={_t("form.steps.invoiceDetails.invoiceNumber")}
                        placeholder="Invoice number"
                    />

                    <DatePickerFormField
                        name="details.invoiceDate"
                        label={_t("form.steps.invoiceDetails.issuedDate")}
                    />

                    <DatePickerFormField
                        name="details.dueDate"
                        label={_t("form.steps.invoiceDetails.dueDate")}
                    />

                    {watchedDocType === "devis" && (
                        <FormInput
                            name="details.devisValidity"
                            label={_t("form.steps.invoiceDetails.devisValidity")}
                            placeholder="ex: 30 jours"
                        />
                    )}

                    <CurrencySelector
                        name="details.currency"
                        label={_t("form.steps.invoiceDetails.currency")}
                        placeholder="Select Currency"
                    />

                    <ColorInput
                        name="details.brandColor"
                        label={_t("form.steps.invoiceDetails.brandColor")}
                    />
                    {showContrastWarning && (
                        <p className="text-xs text-yellow-600">
                            ⚠ Cette couleur a un contraste faible sur fond blanc
                            (ratio {brandContrast?.toFixed(1)}:1, WCAG AA
                            recommande 4.5:1). Le texte pourrait être peu
                            lisible.
                        </p>
                    )}

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium">
                            {_t("form.steps.invoiceDetails.taxRegime.label")}
                        </label>
                        <Controller
                            control={control}
                            name="details.taxRegime"
                            render={({ field }) => (
                                <select
                                    {...field}
                                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                >
                                    {TAX_REGIME_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {_t(opt.labelKey)}
                                        </option>
                                    ))}
                                </select>
                            )}
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <TemplateSelector />
                </div>
            </div>
        </section>
    );
};

export default InvoiceDetails;
