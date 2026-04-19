"use client";

import React, { useEffect } from "react";

// RHF
import { FormProvider, useForm } from "react-hook-form";

// Zod
import { zodResolver } from "@hookform/resolvers/zod";

// Auth
import { SessionProvider } from "next-auth/react";

// Schema
import { InvoiceSchema } from "@/lib/schemas";

// Context
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { TranslationProvider } from "@/contexts/TranslationContext";
import { ProfileContextProvider } from "@/contexts/ProfileContext";
import { InvoiceContextProvider } from "@/contexts/InvoiceContext";
import { ChargesContextProvider } from "@/contexts/ChargesContext";

// Types
import { InvoiceType } from "@/types";

// Variables
import {
  FORM_DEFAULT_VALUES,
  LOCAL_STORAGE_INVOICE_DRAFT_KEY,
  LOCAL_STORAGE_PROFILE_KEY,
} from "@/lib/variables";

// Profile schema for parsing stored profile
import { ProfileSchema } from "@/lib/schemas/profile";

import type { ProfileType } from "@/types";

const readDraftFromLocalStorage = (): InvoiceType | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_INVOICE_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.details) {
      if (parsed.details.invoiceDate)
        parsed.details.invoiceDate = new Date(parsed.details.invoiceDate);
      if (parsed.details.dueDate)
        parsed.details.dueDate = new Date(parsed.details.dueDate);
    }
    return parsed;
  } catch {
    return null;
  }
};

const readProfileFromLocalStorage = (): ProfileType | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
    if (!raw) return null;
    return ProfileSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
};

const buildDefaultsFromProfile = (profile: ProfileType) => {
  const { businessInfo, branding, invoiceDefaults, paymentInfo } = profile;
  const hasBusinessInfo = businessInfo.name.length > 0;
  const hasPaymentInfo = paymentInfo.bankName.length > 0;
  const invoiceNumber = `${invoiceDefaults.invoiceNumberPrefix}${invoiceDefaults.nextInvoiceNumber.toString().padStart(4, "0")}`;

  return {
    ...FORM_DEFAULT_VALUES,
    sender: hasBusinessInfo
      ? {
          name: businessInfo.name,
          address: businessInfo.address,
          zipCode: businessInfo.zipCode,
          city: businessInfo.city,
          country: businessInfo.country,
          email: businessInfo.email,
          phone: businessInfo.phone,
          customInputs: businessInfo.customInputs,
        }
      : FORM_DEFAULT_VALUES.sender,
    details: {
      ...FORM_DEFAULT_VALUES.details,
      invoiceLogo: branding.logo || "",
      brandColor: branding.brandColor || "#2563eb",
      watermarkImage: branding.watermarkLogo || "",
      pdfTemplate: branding.defaultTemplate || 1,
      invoiceNumber,
      currency: invoiceDefaults.currency || "DZD",
      language: invoiceDefaults.language || "French",
      paymentTerms: invoiceDefaults.defaultPaymentTerms || "",
      additionalNotes: invoiceDefaults.defaultAdditionalNotes || "",
      taxDetails: {
        amount: invoiceDefaults.defaultTaxRate,
        amountType: invoiceDefaults.defaultTaxType,
        taxID: invoiceDefaults.defaultTaxID,
      },
      discountDetails: {
        amount: invoiceDefaults.defaultDiscountRate,
        amountType: invoiceDefaults.defaultDiscountType,
      },
      shippingDetails: {
        cost: invoiceDefaults.defaultShippingCost,
        costType: invoiceDefaults.defaultShippingType,
      },
      paymentInformation: hasPaymentInfo
        ? {
            bankName: paymentInfo.bankName,
            accountName: paymentInfo.accountName,
            accountNumber: paymentInfo.accountNumber,
          }
        : FORM_DEFAULT_VALUES.details.paymentInformation,
    },
  };
};

type ProvidersProps = {
  children: React.ReactNode;
};

const Providers = ({ children }: ProvidersProps) => {
  const form = useForm<InvoiceType>({
    resolver: zodResolver(InvoiceSchema),
    defaultValues: FORM_DEFAULT_VALUES,
  });

  // Hydrate once on mount: use saved draft, or fall back to profile defaults
  useEffect(() => {
    const draft = readDraftFromLocalStorage();
    if (draft) {
      form.reset(draft, { keepDefaultValues: false });
    } else {
      const profile = readProfileFromLocalStorage();
      if (profile) {
        form.reset(buildDefaultsFromProfile(profile), { keepDefaultValues: false });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SessionProvider>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TranslationProvider>
        <ProfileContextProvider>
          <FormProvider {...form}>
            <InvoiceContextProvider>
              <ChargesContextProvider>{children}</ChargesContextProvider>
            </InvoiceContextProvider>
          </FormProvider>
        </ProfileContextProvider>
      </TranslationProvider>
    </ThemeProvider>
    </SessionProvider>
  );
};

export default Providers;
