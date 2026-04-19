// Zod
import z from "zod";

// RHF
import { FieldPath, UseFormReturn } from "react-hook-form";

// Zod schemas
import { InvoiceSchema, ItemSchema } from "@/lib/schemas";
import {
    ProfileSchema,
    BusinessInfoSchema,
    BrandingSchema,
    InvoiceDefaultsSchema,
    PaymentInfoSchema,
    ClientSchema,
} from "@/lib/schemas/profile";

// Form types
export type InvoiceType = z.infer<typeof InvoiceSchema>;
export type ItemType = z.infer<typeof ItemSchema>;
export type FormType = UseFormReturn<InvoiceType>;
export type NameType = FieldPath<InvoiceType>;
// Profile types
export type ProfileType = z.infer<typeof ProfileSchema>;
export type BusinessInfoType = z.infer<typeof BusinessInfoSchema>;
export type BrandingType = z.infer<typeof BrandingSchema>;
export type InvoiceDefaultsType = z.infer<typeof InvoiceDefaultsSchema>;
export type PaymentInfoType = z.infer<typeof PaymentInfoSchema>;
export type ClientType = z.infer<typeof ClientSchema>;

export type CurrencyType = {
    [currencyCode: string]: string;
};

export type CurrencyDetails = {
    currency: string;
    decimals: number;
    beforeDecimal: string | null;
    afterDecimal: string | null;
};

// Signature types
export type SignatureColor = {
    name: string;
    label: string;
    color: string;
};

export type SignatureFont = {
    name: string;
    variable: string;
};

export enum SignatureTabs {
    DRAW = "draw",
    TYPE = "type",
    UPLOAD = "upload",
}

// Wizard types
export type WizardStepType = {
    id: number;
    label: string;
    isValid?: boolean;
};

// Document types (facture, devis, etc.)
export type DocumentType =
    | "facture"
    | "devis"
    | "bon_de_livraison"
    | "avoir"
    | "bon_de_commande"
    | "pro_forma"
    | "bon_de_reception";

// Export types
export enum ExportTypes {
    JSON = "JSON",
    CSV = "CSV",
    XML = "XML",
    XLSX = "XLSX",
    DOCX = "DOCX",
}
