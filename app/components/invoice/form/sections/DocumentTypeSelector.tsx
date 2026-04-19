"use client";

import { useFormContext, useWatch } from "react-hook-form";

import { useProfileContext } from "@/contexts/ProfileContext";
import { useTranslationContext } from "@/contexts/TranslationContext";

import {
    DOCUMENT_TYPE_CONFIG,
    DOCUMENT_TYPES,
} from "@/lib/documentTypes";
import type { DocumentType, InvoiceType } from "@/types";

const DocumentTypeSelector = () => {
    const { setValue, control } = useFormContext<InvoiceType>();
    const { getNextDocumentNumber } = useProfileContext();
    const { _t } = useTranslationContext();

    const currentType = (useWatch({
        control,
        name: "details.documentType",
    }) || "facture") as DocumentType;

    const handleSelect = (type: DocumentType) => {
        if (type === currentType) return;
        setValue("details.documentType", type, { shouldDirty: true });
        // Swap the number prefix based on the selected type.
        setValue("details.invoiceNumber", getNextDocumentNumber(type), {
            shouldDirty: true,
            shouldValidate: true,
        });
    };

    return (
        <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                {_t("documentType.selectType")}
            </p>
            <div className="flex flex-wrap gap-2">
                {DOCUMENT_TYPES.map((type) => {
                    const cfg = DOCUMENT_TYPE_CONFIG[type];
                    const selected = currentType === type;
                    return (
                        <button
                            key={type}
                            type="button"
                            onClick={() => handleSelect(type)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                                selected
                                    ? "text-white border-transparent"
                                    : "bg-background text-foreground border-border hover:bg-muted"
                            }`}
                            style={
                                selected
                                    ? {
                                          backgroundColor: cfg.badgeColor,
                                      }
                                    : undefined
                            }
                        >
                            {_t(`documentType.${type}`) || cfg.labelFr}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default DocumentTypeSelector;
