"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

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
import { apiFetch, UnauthorizedError } from "@/lib/apiFetch";
import useToasts from "@/hooks/useToasts";

import type {
    ProfileType,
    BusinessInfoType,
    BrandingType,
    InvoiceDefaultsType,
    PaymentInfoType,
    ClientType,
    DocumentType,
} from "@/types";

export type ProfileSection =
    | "businessInfo"
    | "branding"
    | "invoiceDefaults"
    | "paymentInfo";

export type SaveState = "idle" | "saving" | "saved" | "error";

type SaveStateMap = Record<ProfileSection, SaveState>;

const INITIAL_SAVE_STATE: SaveStateMap = {
    businessInfo: "idle",
    branding: "idle",
    invoiceDefaults: "idle",
    paymentInfo: "idle",
};

const DEFAULT_PROFILE: ProfileType = ProfileSchema.parse({
    businessInfo: {},
    branding: {},
    invoiceDefaults: {},
    paymentInfo: {},
});

type ProfileContextType = {
    profile: ProfileType;
    profileLoaded: boolean;
    saveState: SaveStateMap;
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
    profileLoaded: false,
    saveState: INITIAL_SAVE_STATE,
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
    const [profileLoaded, setProfileLoaded] = useState(false);
    const [saveState, setSaveState] = useState<SaveStateMap>(INITIAL_SAVE_STATE);
    const { profileSaveError } = useToasts();
    const savedTimerRef = useRef<Record<ProfileSection, ReturnType<typeof setTimeout> | null>>({
        businessInfo: null,
        branding: null,
        invoiceDefaults: null,
        paymentInfo: null,
    });

    const setSectionState = useCallback(
        (section: ProfileSection, state: SaveState) => {
            setSaveState((prev) => ({ ...prev, [section]: state }));
            // "saved" auto-clears after 2.5s so the pill returns to idle
            if (state === "saved") {
                if (savedTimerRef.current[section]) {
                    clearTimeout(savedTimerRef.current[section]!);
                }
                savedTimerRef.current[section] = setTimeout(() => {
                    setSaveState((prev) =>
                        prev[section] === "saved"
                            ? { ...prev, [section]: "idle" }
                            : prev
                    );
                }, 2500);
            }
        },
        []
    );

    useEffect(() => {
        if (typeof window === "undefined") return;
        let cancelled = false;

        // Synchronous localStorage read for instant UX
        try {
            const raw = window.localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
            if (raw) {
                const parsed = ProfileSchema.parse(JSON.parse(raw));
                setProfile(parsed);
            }
        } catch {
            // Invalid data — use defaults
        }

        // Async DB fetch (source of truth for signed-in users)
        (async () => {
            try {
                const res = await apiFetch("/api/profile");
                if (!res.ok) return;
                const dbProfile = await res.json();
                const parsed = ProfileSchema.safeParse({
                    ...dbProfile,
                    clients: [],
                });
                if (!cancelled && parsed.success) {
                    setProfile((prev) => {
                        const merged: ProfileType = { ...parsed.data, clients: prev.clients };
                        try {
                            window.localStorage.setItem(
                                LOCAL_STORAGE_PROFILE_KEY,
                                JSON.stringify(merged)
                            );
                        } catch {}
                        return merged;
                    });
                }
            } catch (err) {
                if (err instanceof UnauthorizedError) return;
            } finally {
                if (!cancelled) setProfileLoaded(true);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    const persistToDb = useCallback(
        async (payload: Partial<ProfileType>, section?: ProfileSection) => {
            if (section) setSectionState(section, "saving");
            try {
                const res = await apiFetch("/api/profile", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                if (section) setSectionState(section, "saved");
            } catch (err) {
                if (err instanceof UnauthorizedError) {
                    // Unauthenticated — localStorage is the only store; not an error.
                    if (section) setSectionState(section, "idle");
                    return;
                }
                if (section) setSectionState(section, "error");
                profileSaveError(() => void persistToDb(payload, section));
            }
        },
        [setSectionState, profileSaveError]
    );

    const persist = useCallback(
        (
            updated: ProfileType,
            syncFields?: Partial<ProfileType>,
            section?: ProfileSection
        ) => {
            setProfile(updated);
            try {
                window.localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(updated));
            } catch {}
            if (syncFields) {
                void persistToDb(syncFields, section);
            }
        },
        [persistToDb]
    );

    const updateBusinessInfo = useCallback(
        (data: BusinessInfoType) => {
            const validated = BusinessInfoSchema.parse(data);
            persist(
                { ...profile, businessInfo: validated },
                { businessInfo: validated },
                "businessInfo"
            );
        },
        [profile, persist]
    );

    const updateBranding = useCallback(
        (data: BrandingType) => {
            const validated = BrandingSchema.parse(data);
            persist(
                { ...profile, branding: validated },
                { branding: validated },
                "branding"
            );
        },
        [profile, persist]
    );

    const updateInvoiceDefaults = useCallback(
        (data: InvoiceDefaultsType) => {
            const validated = InvoiceDefaultsSchema.parse(data);
            persist(
                { ...profile, invoiceDefaults: validated },
                { invoiceDefaults: validated },
                "invoiceDefaults"
            );
        },
        [profile, persist]
    );

    const updatePaymentInfo = useCallback(
        (data: PaymentInfoType) => {
            const validated = PaymentInfoSchema.parse(data);
            persist(
                { ...profile, paymentInfo: validated },
                { paymentInfo: validated },
                "paymentInfo"
            );
        },
        [profile, persist]
    );

    const getNextInvoiceNumber = useCallback(() => {
        const { invoiceNumberPrefix, nextInvoiceNumber } = profile.invoiceDefaults;
        return `${invoiceNumberPrefix}${nextInvoiceNumber.toString().padStart(4, "0")}`;
    }, [profile.invoiceDefaults]);

    const incrementInvoiceNumber = useCallback(() => {
        const nextDefaults = {
            ...profile.invoiceDefaults,
            nextInvoiceNumber: profile.invoiceDefaults.nextInvoiceNumber + 1,
        };
        persist(
            { ...profile, invoiceDefaults: nextDefaults },
            { invoiceDefaults: nextDefaults }
        );
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
            const nextDefaults = {
                ...profile.invoiceDefaults,
                documentCounters: nextCounters,
            };
            persist(
                { ...profile, invoiceDefaults: nextDefaults },
                { invoiceDefaults: nextDefaults }
            );
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
        persist(DEFAULT_PROFILE, {
            businessInfo: DEFAULT_PROFILE.businessInfo,
            branding: DEFAULT_PROFILE.branding,
            invoiceDefaults: DEFAULT_PROFILE.invoiceDefaults,
            paymentInfo: DEFAULT_PROFILE.paymentInfo,
        });
    }, [persist]);

    return (
        <ProfileContext.Provider
            value={{
                profile,
                profileLoaded,
                saveState,
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
