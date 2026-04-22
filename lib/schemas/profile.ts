import { z } from "zod";

const CustomInputSchema = z.object({
    key: z.string(),
    value: z.string(),
});

export const BusinessInfoSchema = z.object({
    name: z.string().max(50).default(""),
    address: z.string().max(70).default(""),
    zipCode: z.string().max(20).default(""),
    city: z.string().max(50).default(""),
    country: z.string().max(70).default(""),
    email: z
        .string()
        .max(30)
        .refine((val) => val === "" || z.string().email().safeParse(val).success, {
            message: "Must be a valid email",
        })
        .default(""),
    phone: z.string().max(50).default(""),
    customInputs: z.array(CustomInputSchema).default([]),
    nif: z.string().max(20).default(""),
    rc: z.string().max(20).default(""),
    ai: z.string().max(20).default(""),
    nis: z.string().max(20).default(""),
});

export const BrandingSchema = z.object({
    logo: z.string().default(""),
    watermarkLogo: z.string().default(""),
    brandColor: z.string().default("#1e3a8a"),
    defaultTemplate: z.number().min(1).max(3).default(1),
});

export const InvoiceDefaultsSchema = z.object({
    currency: z.string().default("DZD"),
    language: z.string().default("French"),
    invoiceNumberPrefix: z.string().max(10).default("FACT"),
    nextInvoiceNumber: z.number().int().min(1).default(1),
    defaultTaxRate: z.number().min(0).default(0),
    defaultTaxType: z.enum(["amount", "percentage"]).default("percentage"),
    defaultTaxID: z.string().default(""),
    defaultDiscountRate: z.number().min(0).default(0),
    defaultDiscountType: z.enum(["amount", "percentage"]).default("amount"),
    defaultShippingCost: z.number().min(0).default(0),
    defaultShippingType: z.enum(["amount", "percentage"]).default("amount"),
    defaultPaymentTerms: z.string().default(""),
    defaultAdditionalNotes: z.string().default(""),
    documentCounters: z
        .object({
            facture: z.number().int().min(1).default(1),
            devis: z.number().int().min(1).default(1),
            bon_de_livraison: z.number().int().min(1).default(1),
            avoir: z.number().int().min(1).default(1),
            bon_de_commande: z.number().int().min(1).default(1),
            pro_forma: z.number().int().min(1).default(1),
            bon_de_reception: z.number().int().min(1).default(1),
        })
        .default({
            facture: 1,
            devis: 1,
            bon_de_livraison: 1,
            avoir: 1,
            bon_de_commande: 1,
            pro_forma: 1,
            bon_de_reception: 1,
        }),
});

export const PaymentInfoSchema = z.object({
    bankName: z.string().default(""),
    accountName: z.string().default(""),
    accountNumber: z.string().default(""),
});

export const ClientSchema = z.object({
    id: z.string().default(""),
    name: z.string().max(50).default(""),
    address: z.string().max(70).default(""),
    zipCode: z.string().max(20).default(""),
    city: z.string().max(50).default(""),
    country: z.string().max(70).default(""),
    email: z
        .string()
        .max(30)
        .refine((val) => val === "" || z.string().email().safeParse(val).success, {
            message: "Must be a valid email",
        })
        .default(""),
    phone: z.string().max(50).default(""),
});

export const ProfileSchema = z.object({
    businessInfo: BusinessInfoSchema,
    branding: BrandingSchema,
    invoiceDefaults: InvoiceDefaultsSchema,
    paymentInfo: PaymentInfoSchema,
    clients: z.array(ClientSchema).default([]),
});
