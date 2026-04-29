"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { apiFetch, UnauthorizedError } from "@/lib/apiFetch";
import { subscribeInvoicesChanged } from "@/lib/invoiceEvents";
import { LOCAL_STORAGE_SAVED_INVOICES_KEY } from "@/lib/variables";

import type { InvoiceType } from "@/types";

export type DbInvoiceRow = {
    id: string;
    number: string;
    documentType:
        | "FACTURE"
        | "DEVIS"
        | "BON_DE_LIVRAISON"
        | "AVOIR"
        | "BON_DE_COMMANDE"
        | "PRO_FORMA"
        | "BON_DE_RECEPTION";
    status:
        | "DRAFT"
        | "ISSUED"
        | "SENT"
        | "PAID"
        | "OVERDUE"
        | "CANCELLED";
    totalTtc: number;
    currency: string;
    issuedAt: string | null;
    createdAt: string;
    receiverName: string;
    payload?: InvoiceType;
};

type UseInvoicesResult = {
    rows: DbInvoiceRow[];
    invoices: InvoiceType[];
    loading: boolean;
    error: string | null;
    /** True when the user is signed out and we're showing localStorage data */
    offline: boolean;
    refetch: () => Promise<void>;
};

const DOC_TYPE_DB_TO_FORM: Record<DbInvoiceRow["documentType"], string> = {
    FACTURE: "facture",
    DEVIS: "devis",
    BON_DE_LIVRAISON: "bon_de_livraison",
    AVOIR: "avoir",
    BON_DE_COMMANDE: "bon_de_commande",
    PRO_FORMA: "pro_forma",
    BON_DE_RECEPTION: "bon_de_reception",
};

const STATUS_DB_TO_FORM: Record<DbInvoiceRow["status"], string> = {
    DRAFT: "draft",
    ISSUED: "issued",
    SENT: "sent",
    PAID: "paid",
    OVERDUE: "overdue",
    CANCELLED: "cancelled",
};

/**
 * Adapter: turn a DB row into a synthetic InvoiceType for legacy components
 * that expect InvoiceType. Prefers the row's `payload` JSON when present, with
 * row-level fields (id, status, number) overlaid on top so freshly-changed
 * status surfaces immediately.
 */
const dbRowToInvoiceType = (row: DbInvoiceRow): InvoiceType => {
    const fallback = {
        sender: { name: "" },
        receiver: { name: row.receiverName ?? "" },
        details: {
            invoiceNumber: row.number,
            totalAmount: row.totalTtc,
            currency: row.currency,
            updatedAt: row.issuedAt ?? row.createdAt,
            status: STATUS_DB_TO_FORM[row.status],
            documentType: DOC_TYPE_DB_TO_FORM[row.documentType],
            persistedId: row.id,
        },
    } as unknown as InvoiceType;

    const base = (row.payload as InvoiceType | undefined) ?? fallback;
    return {
        ...base,
        details: {
            ...base.details,
            persistedId: row.id,
            status: STATUS_DB_TO_FORM[row.status] as InvoiceType["details"]["status"],
            invoiceNumber: row.number || base.details?.invoiceNumber,
            totalAmount: row.totalTtc,
            currency: row.currency || base.details?.currency,
            documentType:
                (DOC_TYPE_DB_TO_FORM[row.documentType] as InvoiceType["details"]["documentType"]) ||
                base.details?.documentType,
        },
    };
};

const readLocalCache = (): InvoiceType[] => {
    if (typeof window === "undefined") return [];
    try {
        const raw = window.localStorage.getItem(LOCAL_STORAGE_SAVED_INVOICES_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

export const useInvoices = (): UseInvoicesResult => {
    const [rows, setRows] = useState<DbInvoiceRow[]>([]);
    const [invoices, setInvoices] = useState<InvoiceType[]>([]);
    const [loading, setLoading] = useState(true);
    const [offline, setOffline] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cancelledRef = useRef(false);

    const fetchInvoices = useCallback(async () => {
        setError(null);
        try {
            const res = await apiFetch("/api/invoices?perPage=100");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data: { items: DbInvoiceRow[] } = await res.json();
            if (cancelledRef.current) return;
            setRows(data.items);
            setInvoices(data.items.map(dbRowToInvoiceType));
            setOffline(false);
        } catch (e) {
            if (e instanceof UnauthorizedError) {
                // Fall back to localStorage for unauthenticated users.
                const cached = readLocalCache();
                if (!cancelledRef.current) {
                    setRows([]);
                    setInvoices(cached);
                    setOffline(true);
                }
                return;
            }
            if (!cancelledRef.current) {
                setError(e instanceof Error ? e.message : "unknown");
                // Best-effort: show whatever is in localStorage so the user
                // doesn't see a blank list when the network blips.
                const cached = readLocalCache();
                setInvoices(cached);
            }
        } finally {
            if (!cancelledRef.current) setLoading(false);
        }
    }, []);

    useEffect(() => {
        cancelledRef.current = false;
        void fetchInvoices();
        const unsubscribe = subscribeInvoicesChanged(() => {
            void fetchInvoices();
        });
        return () => {
            cancelledRef.current = true;
            unsubscribe();
        };
    }, [fetchInvoices]);

    return {
        rows,
        invoices,
        loading,
        error,
        offline,
        refetch: fetchInvoices,
    };
};
