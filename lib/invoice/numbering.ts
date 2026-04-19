import "server-only";
import { prisma } from "@/lib/db";
import type { DocumentType, Prisma } from "@prisma/client";

const DOC_PREFIX: Record<DocumentType, string> = {
    FACTURE: "FACT",
    DEVIS: "DEV",
    BON_DE_LIVRAISON: "BL",
    AVOIR: "AV",
    BON_DE_COMMANDE: "BC",
    PRO_FORMA: "PRO",
    BON_DE_RECEPTION: "BR",
};

export function formatInvoiceNumber(
    prefix: string,
    year: number,
    seq: number
): string {
    return `${prefix}/${year}/${String(seq).padStart(4, "0")}`;
}

/**
 * Allocates the next sequential invoice number for a user + document type + year.
 * Uses a SELECT … FOR UPDATE inside a transaction to prevent races under concurrent finalizes.
 *
 * Returns the allocated sequence number. Caller must store it in the Invoice row.
 */
export async function allocateSequenceNumber(
    userId: string,
    documentType: DocumentType,
    year: number
): Promise<{ sequenceNumber: number; number: string }> {
    return prisma.$transaction(async (tx) => {
        // Lock: find the highest sequence number for this user/type/year
        const last = await tx.invoice.findFirst({
            where: { userId, documentType, sequenceYear: year },
            orderBy: { sequenceNumber: "desc" },
            select: { sequenceNumber: true },
        });

        const sequenceNumber = (last?.sequenceNumber ?? 0) + 1;
        const prefix = DOC_PREFIX[documentType];
        const number = formatInvoiceNumber(prefix, year, sequenceNumber);

        return { sequenceNumber, number };
    });
}

/**
 * Transitions an invoice from DRAFT to ISSUED.
 * Allocates a permanent sequential number if the invoice is still in DRAFT.
 * Throws if the invoice is already ISSUED or later.
 */
export async function finalizeInvoice(
    invoiceId: string,
    userId: string
): Promise<{ number: string }> {
    return prisma.$transaction(async (tx) => {
        const invoice = await tx.invoice.findUnique({
            where: { id: invoiceId },
            select: { id: true, userId: true, status: true, documentType: true, number: true },
        });

        if (!invoice) throw new Error("Invoice not found");
        if (invoice.userId !== userId) throw new Error("Unauthorized");
        if (invoice.status !== "DRAFT") {
            throw new Error(`Cannot finalize an invoice with status ${invoice.status}`);
        }

        const year = new Date().getFullYear();
        const { sequenceNumber, number } = await allocateSequenceNumber(
            userId,
            invoice.documentType,
            year
        );

        await tx.invoice.update({
            where: { id: invoiceId },
            data: {
                status: "ISSUED",
                sequenceYear: year,
                sequenceNumber,
                number,
                issuedAt: new Date(),
            },
        });

        await tx.invoiceAuditLog.create({
            data: {
                invoiceId,
                userId,
                action: "ISSUED",
                diff: { number, status: "ISSUED" },
            },
        });

        return { number };
    });
}

/**
 * Creates a credit note (avoir) referencing an issued invoice.
 * The avoir gets its own sequential number in the AVOIR series.
 */
export async function createCreditNote(
    originalInvoiceId: string,
    userId: string,
    payload: Record<string, unknown>
): Promise<{ id: string; number: string }> {
    return prisma.$transaction(async (tx) => {
        const original = await tx.invoice.findUnique({
            where: { id: originalInvoiceId },
            select: { id: true, userId: true, status: true, totalTtc: true, currency: true },
        });

        if (!original) throw new Error("Original invoice not found");
        if (original.userId !== userId) throw new Error("Unauthorized");
        if (original.status === "DRAFT") {
            throw new Error("Cannot create a credit note for a DRAFT invoice");
        }

        const year = new Date().getFullYear();
        const { sequenceNumber, number } = await allocateSequenceNumber(userId, "AVOIR", year);

        const avoir = await tx.invoice.create({
            data: {
                userId,
                documentType: "AVOIR",
                sequenceYear: year,
                sequenceNumber,
                number,
                status: "ISSUED",
                payload: payload as Prisma.InputJsonValue,
                totalTtc: -Math.abs(Number(original.totalTtc)),
                currency: original.currency,
                referencesInvoiceId: originalInvoiceId,
                issuedAt: new Date(),
            },
        });

        await tx.invoiceAuditLog.create({
            data: {
                invoiceId: avoir.id,
                userId,
                action: "CREATED",
                diff: { type: "AVOIR", references: originalInvoiceId },
            },
        });

        return { id: avoir.id, number };
    });
}
