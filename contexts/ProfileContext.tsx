"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import {
    ProfileSchema,
    BusinessInfoSchema,
    BrandingSchema,
    InvoiceDefaultsSchema,
    PaymentInfoSchema,
    ClientSchema,
} from "@/lib/schemas/profile";

import { LOCAL_STORAGE_PROFILE_KEY } from "@/lib/variables";
import { formatDocumentNumber } from "@/lib/documentTypes";

import type {
    ProfileType,
    BusinessInfoType,
    BrandingType,
    InvoiceDefaultsType,
    PaymentInfoType,
    ClientType,
    DocumentType,
} from "@/types";

const DEFAULT_PROFILE: ProfileType = ProfileSchema.parse({
    businessInfo: {},
    branding: {},
    invoiceDefaults: {},
    paymentInfo: {},
});

type ProfileContextType = {
    profile: ProfileType;
    updateBusinessInfo: (data: BusinessInfoType) => void;
    updateBranding: (data: BrandingType) => void;
    updateInvoiceDefaults: (data: InvoiceDefaultsType) => void;
    updatePaymentInfo: (data: PaymentInfoType) => void;
    getNextInvoiceNumber: () => string;
    incrementInvoiceNumber: () => void;
    getNextDocumentNumber: (type: DocumentType) => string;
    incrementDocumentNumber: (type: DocumentType) => void;
    resetProfile: () => void;
    addClient: (data: Omit<ClientType, "id">) => void;
    updateClient: (id: string, data: Omit<ClientType, "id">) => void;
    deleteClient: (id: string) => void;
};

const defaultContext: ProfileContextType = {
    profile: DEFAULT_PROFILE,
    updateBusinessInfo: () => {},
    updateBranding: () => {},
    updateInvoiceDefaults: () => {},
    updatePaymentInfo: () => {},
    getNextInvoiceNumber: () => "FACT0001",
    incrementInvoiceNumber: () => {},
    getNextDocumentNumber: (type: DocumentType) =>
        formatDocumentNumber(type, 1),
    incrementDocumentNumber: () => {},
    resetProfile: () => {},
    addClient: () => {},
    updateClient: () => {},
    deleteClient: () => {},
};

export const ProfileContext = createContext<ProfileContextType>(defaultContext);

export const useProfileContext = () => useContext(ProfileContext);

type ProfileContextProviderProps = {
    children: React.ReactNode;
};

export const ProfileContextProvider = ({ children }: ProfileContextProviderProps) => {
    const [profile, setProfile] = useState<ProfileType>(DEFAULT_PROFILE);

    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const raw = window.localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
            if (raw) {
                const parsed = ProfileSchema.parse(JSON.parse(raw));
                setProfile(parsed);
            }
        } catch {
            // Invalid data — use defaults
        }
    }, []);

    const persist = useCallback((updated: ProfileType) => {
        setProfile(updated);
        try {
            window.localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(updated));
        } catch {}
    }, []);

    const updateBusinessInfo = useCallback(
        (data: BusinessInfoType) => {
            const validated = BusinessInfoSchema.parse(data);
            persist({ ...profile, businessInfo: validated });
        },
        [profile, persist]
    );

    const updateBranding = useCallback(
        (data: BrandingType) => {
            const validated = BrandingSchema.parse(data);
            persist({ ...profile, branding: validated });
        },
        [profile, persist]
    );

    const updateInvoiceDefaults = useCallback(
        (data: InvoiceDefaultsType) => {
            const validated = InvoiceDefaultsSchema.parse(data);
            persist({ ...profile, invoiceDefaults: validated });
        },
        [profile, persist]
    );

    const updatePaymentInfo = useCallback(
        (data: PaymentInfoType) => {
            const validated = PaymentInfoSchema.parse(data);
            persist({ ...profile, paymentInfo: validated });
        },
        [profile, persist]
    );

    const getNextInvoiceNumber = useCallback(() => {
        const { invoiceNumberPrefix, nextInvoiceNumber } = profile.invoiceDefaults;
        return `${invoiceNumberPrefix}${nextInvoiceNumber.toString().padStart(4, "0")}`;
    }, [profile.invoiceDefaults]);

    const incrementInvoiceNumber = useCallback(() => {
        const updated = {
            ...profile,
            invoiceDefaults: {
                ...profile.invoiceDefaults,
                nextInvoiceNumber: profile.invoiceDefaults.nextInvoiceNumber + 1,
            },
        };
        persist(updated);
    }, [profile, persist]);

    const getNextDocumentNumber = useCallback(
        (type: DocumentType) => {
            const counters = profile.invoiceDefaults.documentCounters;
            const seq = counters?.[type] ?? 1;
            return formatDocumentNumber(type, seq);
        },
        [profile.invoiceDefaults]
    );

    const incrementDocumentNumber = useCallback(
        (type: DocumentType) => {
            const counters = profile.invoiceDefaults.documentCounters;
            const nextCounters = {
                ...counters,
                [type]: (counters?.[type] ?? 1) + 1,
            };
            persist({
                ...profile,
                invoiceDefaults: {
                    ...profile.invoiceDefaults,
                    documentCounters: nextCounters,
                },
            });
        },
        [profile, persist]
    );

    const addClient = useCallback(
        (data: Omit<ClientType, "id">) => {
            const validated = ClientSchema.parse({ ...data, id: crypto.randomUUID() });
            persist({ ...profile, clients: [...(profile.clients || []), validated] });
        },
        [profile, persist]
    );

    const updateClient = useCallback(
        (id: string, data: Omit<ClientType, "id">) => {
            const validated = ClientSchema.parse({ ...data, id });
            const clients = (profile.clients || []).map((c) => (c.id === id ? validated : c));
            persist({ ...profile, clients });
        },
        [profile, persist]
    );

    const deleteClient = useCallback(
        (id: string) => {
            const clients = (profile.clients || []).filter((c) => c.id !== id);
            persist({ ...profile, clients });
        },
        [profile, persist]
    );

    const resetProfile = useCallback(() => {
        persist(DEFAULT_PROFILE);
    }, [persist]);

    return (
        <ProfileContext.Provider
            value={{
                profile,
                updateBusinessInfo,
                updateBranding,
                updateInvoiceDefaults,
                updatePaymentInfo,
                getNextInvoiceNumber,
                incrementInvoiceNumber,
                getNextDocumentNumber,
                incrementDocumentNumber,
                resetProfile,
                addClient,
                updateClient,
                deleteClient,
            }}
        >
            {children}
        </ProfileContext.Provider>
    );
};
