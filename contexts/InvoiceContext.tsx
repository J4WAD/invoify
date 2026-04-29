"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

// RHF
import { useFormContext } from "react-hook-form";

// Hooks
import useToasts from "@/hooks/useToasts";

// Profile
import { useProfileContext } from "@/contexts/ProfileContext";

// Services
import { exportInvoice } from "@/services/invoice/client/exportInvoice";

// API
import { apiFetch, UnauthorizedError } from "@/lib/apiFetch";
import { emitInvoicesChanged } from "@/lib/invoiceEvents";

// Variables
import {
  FORM_DEFAULT_VALUES,
  GENERATE_PDF_API,
  SEND_PDF_API,
  SHORT_DATE_OPTIONS,
  LOCAL_STORAGE_INVOICE_DRAFT_KEY,
  LOCAL_STORAGE_SAVED_INVOICES_KEY,
  LEGACY_LOCAL_STORAGE_SAVED_INVOICES_KEY,
} from "@/lib/variables";

// Types
import { ExportTypes, InvoiceType } from "@/types";

const buildInvoicePayload = (data: InvoiceType) => ({
  payload: data,
  documentType: data.details.documentType ?? "facture",
  totalTtc: Number(data.details.totalAmount) || 0,
  currency: data.details.currency || "DZD",
  totalAmountInWords: data.details.totalAmountInWords ?? null,
});

const defaultInvoiceContext = {
  invoicePdf: new Blob(),
  invoicePdfLoading: false,
  savedInvoices: [] as InvoiceType[],
  pdfUrl: null as string | null,
  onFormSubmit: (values: InvoiceType) => {},
  newInvoice: () => {},
  generatePdf: async (data: InvoiceType) => {},
  removeFinalPdf: () => {},
  downloadPdf: () => {},
  printPdf: () => {},
  previewPdfInTab: () => {},
  saveInvoice: () => {},
  deleteInvoice: (invoice: InvoiceType) => {},
  updateInvoiceStatus: (invoiceNumber: string, status: InvoiceType["details"]["status"]) => {},
  duplicateInvoice: (invoice: InvoiceType) => {},
  sendPdfToMail: (email: string): Promise<void> => Promise.resolve(),
  exportInvoiceAs: (exportAs: ExportTypes) => {},
  importInvoice: (file: File) => {},
};

export const InvoiceContext = createContext(defaultInvoiceContext);

export const useInvoiceContext = () => {
  return useContext(InvoiceContext);
};

type InvoiceContextProviderProps = {
  children: React.ReactNode;
};

export const InvoiceContextProvider = ({
  children,
}: InvoiceContextProviderProps) => {
  const router = useRouter();

  // Toasts
  const {
    newInvoiceSuccess,
    pdfGenerationSuccess,
    saveInvoiceSuccess,
    modifiedInvoiceSuccess,
    sendPdfSuccess,
    sendPdfError,
    importInvoiceError,
    saveInvoiceError,
    statusTransitionError,
  } = useToasts();

  // Get form values and methods from form context
  const { getValues, reset, watch, setValue } = useFormContext<InvoiceType>();

  // Profile context for auto-fill and auto-increment
  const { profile, getNextInvoiceNumber, incrementInvoiceNumber } = useProfileContext();

  // Variables
  const [invoicePdf, setInvoicePdf] = useState<Blob>(new Blob());
  const [invoicePdfLoading, setInvoicePdfLoading] = useState<boolean>(false);

  // Saved invoices
  const [savedInvoices, setSavedInvoices] = useState<InvoiceType[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // One-time migration of the legacy key to the namespaced key
    const legacyData = window.localStorage.getItem(
      LEGACY_LOCAL_STORAGE_SAVED_INVOICES_KEY
    );
    const currentData = window.localStorage.getItem(
      LOCAL_STORAGE_SAVED_INVOICES_KEY
    );
    if (legacyData && !currentData) {
      window.localStorage.setItem(LOCAL_STORAGE_SAVED_INVOICES_KEY, legacyData);
      window.localStorage.removeItem(LEGACY_LOCAL_STORAGE_SAVED_INVOICES_KEY);
    }

    const savedInvoicesJSON = window.localStorage.getItem(
      LOCAL_STORAGE_SAVED_INVOICES_KEY
    );
    setSavedInvoices(savedInvoicesJSON ? JSON.parse(savedInvoicesJSON) : []);
  }, []);

  // Persist full form state with debounce
  useEffect(() => {
    if (typeof window === "undefined") return;
    const subscription = watch((value) => {
      try {
        window.localStorage.setItem(
          LOCAL_STORAGE_INVOICE_DRAFT_KEY,
          JSON.stringify(value)
        );
      } catch {}
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  // Get pdf url from blob
  const pdfUrl = useMemo(() => {
    if (invoicePdf.size > 0) {
      return window.URL.createObjectURL(invoicePdf);
    }
    return null;
  }, [invoicePdf]);

  /**
   * Handles form submission.
   *
   * @param {InvoiceType} data - The form values used to generate the PDF.
   */
  const onFormSubmit = (data: InvoiceType) => {
    console.log("VALUE");
    console.log(data);

    // Call generate pdf method
    generatePdf(data);
  };

  /**
   * Generates a new invoice, auto-filling from the saved profile.
   */
  const newInvoice = () => {
    const { businessInfo, branding, invoiceDefaults, paymentInfo } = profile;

    const hasBusinessInfo = businessInfo.name.length > 0;
    const hasPaymentInfo = paymentInfo.bankName.length > 0;

    const profileDefaults = {
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
            nif: businessInfo.nif || "",
            rc: businessInfo.rc || "",
            ai: businessInfo.ai || "",
            nis: businessInfo.nis || "",
          }
        : FORM_DEFAULT_VALUES.sender,
      details: {
        ...FORM_DEFAULT_VALUES.details,
        invoiceLogo: branding.logo || "",
        brandColor: branding.brandColor || "#1e3a8a",
        watermarkImage: branding.watermarkLogo || "",
        pdfTemplate: branding.defaultTemplate || 1,
        invoiceNumber: getNextInvoiceNumber(),
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

    reset(profileDefaults);
    setInvoicePdf(new Blob());

    // Clear the draft
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(LOCAL_STORAGE_INVOICE_DRAFT_KEY);
      } catch {}
    }

    router.refresh();

    // Toast
    newInvoiceSuccess();
  };

  /**
   * Generate a PDF document based on the provided data.
   *
   * @param {InvoiceType} data - The data used to generate the PDF.
   * @returns {Promise<void>} - A promise that resolves when the PDF is successfully generated.
   * @throws {Error} - If an error occurs during the PDF generation process.
   */
  const generatePdf = useCallback(
    async (data: InvoiceType) => {
      setInvoicePdfLoading(true);

      // Ensure the PDF receives profile branding even when the user opened an
      // old draft or never clicked "New Invoice" since configuring branding.
      const enrichedData: InvoiceType = {
        ...data,
        details: {
          ...data.details,
          invoiceLogo:
            data.details.invoiceLogo || profile.branding.logo || "",
          watermarkImage:
            data.details.watermarkImage ||
            profile.branding.watermarkLogo ||
            "",
          brandColor:
            data.details.brandColor ||
            profile.branding.brandColor ||
            "#1e3a8a",
        },
      };

      try {
        const response = await fetch(GENERATE_PDF_API, {
          method: "POST",
          body: JSON.stringify(enrichedData),
        });

        const result = await response.blob();
        setInvoicePdf(result);

        if (result.size > 0) {
          // Toast
          pdfGenerationSuccess();

          // Persist to DB so the invoice shows on the dashboard. Captures the
          // returned id so subsequent saves PATCH the same row instead of
          // creating duplicates. 401 (unauthenticated) is intentionally silent.
          const persistedId = enrichedData.details.persistedId;
          try {
            const res = await apiFetch(
              persistedId ? `/api/invoices/${persistedId}` : "/api/invoices",
              {
                method: persistedId ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(buildInvoicePayload(enrichedData)),
              }
            );
            if (res.ok) {
              const saved = await res.json();
              if (saved?.id) {
                setValue("details.persistedId", saved.id, {
                  shouldDirty: false,
                });
              }
              emitInvoicesChanged();
            } else {
              saveInvoiceError();
            }
          } catch (err) {
            if (!(err instanceof UnauthorizedError)) {
              saveInvoiceError();
            }
          }
        }
      } catch (err) {
        console.log(err);
      } finally {
        setInvoicePdfLoading(false);
      }
    },
    [profile, pdfGenerationSuccess, setValue, saveInvoiceError]
  );

  /**
   * Removes the final PDF file and switches to Live Preview
   */
  const removeFinalPdf = () => {
    setInvoicePdf(new Blob());
  };

  /**
   * Generates a preview of a PDF file and opens it in a new browser tab.
   */
  const previewPdfInTab = () => {
    if (invoicePdf) {
      const url = window.URL.createObjectURL(invoicePdf);
      window.open(url, "_blank");
    }
  };

  /**
   * Downloads a PDF file.
   */
  const downloadPdf = () => {
    // Only download if there is an invoice
    if (invoicePdf instanceof Blob && invoicePdf.size > 0) {
      // Create a blob URL to trigger the download
      const url = window.URL.createObjectURL(invoicePdf);

      // Create an anchor element to initiate the download
      const a = document.createElement("a");
      a.href = url;
      a.download = "invoice.pdf";
      document.body.appendChild(a);

      // Trigger the download
      a.click();

      // Clean up the URL object
      window.URL.revokeObjectURL(url);
    }
  };

  /**
   * Prints a PDF file.
   */
  const printPdf = () => {
    if (invoicePdf) {
      const pdfUrl = URL.createObjectURL(invoicePdf);
      const printWindow = window.open(pdfUrl, "_blank");
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    }
  };

  /**
   * Persists the current form values. API-first: PATCH if the form holds a
   * persistedId, POST otherwise. Always writes the localStorage cache so the
   * /invoices view stays in sync without a refetch (and so unauthenticated
   * users still have their invoice list).
   */
  const saveInvoice = () => {
    if (!invoicePdf || !getValues) return;

    const updatedDate = new Date().toLocaleDateString(
      "en-US",
      SHORT_DATE_OPTIONS
    );

    const formValues = getValues();
    formValues.details.updatedAt = updatedDate;

    // localStorage write-through cache (keyed by invoice number, like before)
    const savedInvoicesJSON = localStorage.getItem(
      LOCAL_STORAGE_SAVED_INVOICES_KEY
    );
    const cached: InvoiceType[] = savedInvoicesJSON
      ? JSON.parse(savedInvoicesJSON)
      : [];
    const existingInvoiceIndex = cached.findIndex(
      (invoice) =>
        invoice.details.invoiceNumber === formValues.details.invoiceNumber
    );
    const isNew = existingInvoiceIndex === -1;
    if (isNew) {
      cached.push(formValues);
    } else {
      cached[existingInvoiceIndex] = formValues;
    }
    localStorage.setItem(
      LOCAL_STORAGE_SAVED_INVOICES_KEY,
      JSON.stringify(cached)
    );
    setSavedInvoices(cached);

    // API persistence (await so we can capture the id for new rows)
    const persistedId = formValues.details.persistedId;
    void (async () => {
      try {
        const res = await apiFetch(
          persistedId ? `/api/invoices/${persistedId}` : "/api/invoices",
          {
            method: persistedId ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(buildInvoicePayload(formValues)),
          }
        );
        if (res.ok) {
          const saved = await res.json();
          if (saved?.id && !persistedId) {
            setValue("details.persistedId", saved.id, { shouldDirty: false });
            // refresh cache entry with the persistedId
            const next = cached.map((inv) =>
              inv.details.invoiceNumber === formValues.details.invoiceNumber
                ? {
                    ...inv,
                    details: { ...inv.details, persistedId: saved.id },
                  }
                : inv
            );
            localStorage.setItem(
              LOCAL_STORAGE_SAVED_INVOICES_KEY,
              JSON.stringify(next)
            );
            setSavedInvoices(next);
          }
          emitInvoicesChanged();
        } else if (res.status !== 401) {
          saveInvoiceError(saveInvoice);
        }
      } catch (err) {
        if (!(err instanceof UnauthorizedError)) {
          saveInvoiceError(saveInvoice);
        }
      }
    })();

    if (isNew) {
      incrementInvoiceNumber();
      saveInvoiceSuccess();
    } else {
      modifiedInvoiceSuccess();
    }
  };

  /**
   * Delete an invoice from the DB (if it has a persistedId) and from the
   * localStorage cache. Falls back to cache-only for legacy invoices.
   */
  const deleteInvoice = (invoice: InvoiceType) => {
    const persistedId = invoice.details.persistedId;
    const invoiceNumber = invoice.details.invoiceNumber;

    const updated = savedInvoices.filter(
      (inv) => inv.details.invoiceNumber !== invoiceNumber
    );
    setSavedInvoices(updated);
    localStorage.setItem(
      LOCAL_STORAGE_SAVED_INVOICES_KEY,
      JSON.stringify(updated)
    );

    if (!persistedId) return;

    void (async () => {
      try {
        const res = await apiFetch(`/api/invoices/${persistedId}`, {
          method: "DELETE",
        });
        if (res.ok || res.status === 204) {
          emitInvoicesChanged();
        } else if (res.status === 422) {
          // Server refused (only DRAFT invoices can be deleted) — surface why.
          const body = await res.json().catch(() => null);
          statusTransitionError(
            body?.error ?? "Cette facture ne peut pas être supprimée."
          );
        } else if (res.status !== 401) {
          saveInvoiceError();
        }
      } catch (err) {
        if (!(err instanceof UnauthorizedError)) {
          saveInvoiceError();
        }
      }
    })();
  };

  /**
   * Update the status of a saved invoice — DB + cache.
   */
  const updateInvoiceStatus = (
    invoiceNumber: string,
    status: InvoiceType["details"]["status"]
  ) => {
    const target = savedInvoices.find(
      (inv) => inv.details.invoiceNumber === invoiceNumber
    );
    const updatedInvoices = savedInvoices.map((inv) =>
      inv.details.invoiceNumber === invoiceNumber
        ? { ...inv, details: { ...inv.details, status } }
        : inv
    );
    setSavedInvoices(updatedInvoices);
    localStorage.setItem(
      LOCAL_STORAGE_SAVED_INVOICES_KEY,
      JSON.stringify(updatedInvoices)
    );

    const persistedId = target?.details.persistedId;
    if (!persistedId || !status) return;

    void (async () => {
      try {
        const res = await apiFetch(`/api/invoices/${persistedId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: status.toUpperCase() }),
        });
        if (res.ok) {
          emitInvoicesChanged();
        } else if (res.status === 422) {
          const body = await res.json().catch(() => null);
          statusTransitionError(
            body?.error ?? "Transition de statut non autorisée."
          );
        } else if (res.status !== 401) {
          saveInvoiceError();
        }
      } catch (err) {
        if (!(err instanceof UnauthorizedError)) {
          saveInvoiceError();
        }
      }
    })();
  };

  /**
   * Duplicate an invoice — loads it into the form with a new invoice number and today's date.
   *
   * @param {InvoiceType} invoice - The invoice to duplicate.
   */
  const duplicateInvoice = (invoice: InvoiceType) => {
    const duplicated = structuredClone(invoice);
    duplicated.details.invoiceNumber = getNextInvoiceNumber();
    duplicated.details.invoiceDate = new Date() as unknown as string;
    duplicated.details.dueDate = new Date() as unknown as string;
    duplicated.details.status = "draft";
    duplicated.details.updatedAt = undefined;
    duplicated.details.invoiceLogo = "";
    duplicated.details.signature = { data: "" };
    // Duplicates are new rows — the original DB id must not carry over.
    duplicated.details.persistedId = "";

    reset(duplicated);
    setInvoicePdf(new Blob());
  };

  /**
   * Send the invoice PDF to the specified email address.
   *
   * @param {string} email - The email address to which the Invoice PDF will be sent.
   * @returns {Promise<void>} A promise that resolves once the email is successfully sent.
   */
  const sendPdfToMail = (email: string) => {
    const fd = new FormData();
    fd.append("email", email);
    fd.append("invoicePdf", invoicePdf, "invoice.pdf");
    fd.append("invoiceNumber", getValues().details.invoiceNumber);

    return fetch(SEND_PDF_API, {
      method: "POST",
      body: fd,
    })
      .then((res) => {
        if (res.ok) {
          // Mark as sent if saved
          const invoiceNumber = getValues().details.invoiceNumber;
          updateInvoiceStatus(invoiceNumber, "sent");

          // Successful toast msg
          sendPdfSuccess();
        } else {
          // Error toast msg
          sendPdfError({ email, sendPdfToMail });
        }
      })
      .catch((error) => {
        console.log(error);

        // Error toast msg
        sendPdfError({ email, sendPdfToMail });
      });
  };

  /**
   * Export an invoice in the specified format using the provided form values.
   *
   * This function initiates the export process with the chosen export format and the form data.
   *
   * @param {ExportTypes} exportAs - The format in which to export the invoice.
   */
  const exportInvoiceAs = (exportAs: ExportTypes) => {
    const formValues = getValues();

    // Service to export invoice with given parameters
    exportInvoice(exportAs, formValues);
  };

  /**
   * Import an invoice from a JSON file.
   *
   * @param {File} file - The JSON file to import.
   */
  const importInvoice = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);

        // Parse the dates
        if (importedData.details) {
          if (importedData.details.invoiceDate) {
            importedData.details.invoiceDate = new Date(
              importedData.details.invoiceDate
            );
          }
          if (importedData.details.dueDate) {
            importedData.details.dueDate = new Date(
              importedData.details.dueDate
            );
          }
        }

        // Reset form with imported data
        reset(importedData);
      } catch (error) {
        console.error("Error parsing JSON file:", error);
        importInvoiceError();
      }
    };
    reader.readAsText(file);
  };

  return (
    <InvoiceContext.Provider
      value={{
        invoicePdf,
        invoicePdfLoading,
        savedInvoices,
        pdfUrl,
        onFormSubmit,
        newInvoice,
        generatePdf,
        removeFinalPdf,
        downloadPdf,
        printPdf,
        previewPdfInTab,
        saveInvoice,
        deleteInvoice,
        updateInvoiceStatus,
        duplicateInvoice,
        sendPdfToMail,
        exportInvoiceAs,
        importInvoice,
      }}
    >
      {children}
    </InvoiceContext.Provider>
  );
};
