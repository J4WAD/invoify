import type { DocumentType } from "@/types";

export type DocTypeConfig = {
    type: DocumentType;
    labelFr: string;
    labelEn: string;
    prefix: string;
    showPaymentInfo: boolean;
    showDueDate: boolean;
    showDeliveryDate: boolean;
    showSignature: boolean;
    showPrices: boolean;
    pdfTitle: string;
    badgeColor: string;
};

export const DOCUMENT_TYPE_CONFIG: Record<DocumentType, DocTypeConfig> = {
    facture: {
        type: "facture",
        labelFr: "Facture",
        labelEn: "Invoice",
        prefix: "FAC-",
        showPaymentInfo: true,
        showDueDate: true,
        showDeliveryDate: false,
        showSignature: true,
        showPrices: true,
        pdfTitle: "FACTURE",
        badgeColor: "#2563eb",
    },
    devis: {
        type: "devis",
        labelFr: "Devis",
        labelEn: "Quote",
        prefix: "DEV-",
        showPaymentInfo: false,
        showDueDate: true,
        showDeliveryDate: false,
        showSignature: true,
        showPrices: true,
        pdfTitle: "DEVIS",
        badgeColor: "#f59e0b",
    },
    bon_de_livraison: {
        type: "bon_de_livraison",
        labelFr: "Bon de livraison",
        labelEn: "Delivery Note",
        prefix: "BDL-",
        showPaymentInfo: false,
        showDueDate: false,
        showDeliveryDate: true,
        showSignature: true,
        showPrices: false,
        pdfTitle: "BON DE LIVRAISON",
        badgeColor: "#10b981",
    },
    avoir: {
        type: "avoir",
        labelFr: "Avoir",
        labelEn: "Credit Note",
        prefix: "AVO-",
        showPaymentInfo: false,
        showDueDate: false,
        showDeliveryDate: false,
        showSignature: true,
        showPrices: true,
        pdfTitle: "AVOIR / NOTE DE CRÉDIT",
        badgeColor: "#ef4444",
    },
    bon_de_commande: {
        type: "bon_de_commande",
        labelFr: "Bon de commande",
        labelEn: "Purchase Order",
        prefix: "BDC-",
        showPaymentInfo: false,
        showDueDate: true,
        showDeliveryDate: false,
        showSignature: true,
        showPrices: true,
        pdfTitle: "BON DE COMMANDE",
        badgeColor: "#8b5cf6",
    },
    pro_forma: {
        type: "pro_forma",
        labelFr: "Pro Forma",
        labelEn: "Pro Forma",
        prefix: "PRO-",
        showPaymentInfo: true,
        showDueDate: true,
        showDeliveryDate: false,
        showSignature: false,
        showPrices: true,
        pdfTitle: "FACTURE PRO FORMA",
        badgeColor: "#6b7280",
    },
    bon_de_reception: {
        type: "bon_de_reception",
        labelFr: "Bon de réception",
        labelEn: "Reception Receipt",
        prefix: "BRC-",
        showPaymentInfo: false,
        showDueDate: false,
        showDeliveryDate: true,
        showSignature: true,
        showPrices: false,
        pdfTitle: "BON DE RÉCEPTION",
        badgeColor: "#0891b2",
    },
};

export const DOCUMENT_TYPES: DocumentType[] = [
    "facture",
    "devis",
    "bon_de_livraison",
    "avoir",
    "bon_de_commande",
    "pro_forma",
    "bon_de_reception",
];

export const padDocumentNumber = (seq: number, width = 4): string =>
    String(seq).padStart(width, "0");

export const formatDocumentNumber = (
    type: DocumentType,
    seq: number
): string => {
    const cfg = DOCUMENT_TYPE_CONFIG[type];
    return `${cfg.prefix}${padDocumentNumber(seq)}`;
};
