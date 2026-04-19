import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import type { DocumentType, InvoiceStatus, Prisma } from "@prisma/client";

const DOC_TYPE_MAP: Record<string, DocumentType> = {
    facture: "FACTURE",
    devis: "DEVIS",
    bon_de_livraison: "BON_DE_LIVRAISON",
    avoir: "AVOIR",
    bon_de_commande: "BON_DE_COMMANDE",
    pro_forma: "PRO_FORMA",
    bon_de_reception: "BON_DE_RECEPTION",
};

const STATUS_MAP: Record<string, InvoiceStatus> = {
    draft: "DRAFT",
    issued: "ISSUED",
    sent: "SENT",
    paid: "PAID",
    overdue: "OVERDUE",
    cancelled: "CANCELLED",
};

function parseNumber(num: string): { year: number; seq: number } | null {
    // Matches FACT/2026/0001 or DEV/2025/003 etc.
    const m = num?.match(/\/(\d{4})\/(\d+)$/);
    if (!m) return null;
    return { year: parseInt(m[1]), seq: parseInt(m[2]) };
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id as string;

    const body = await req.json();
    const invoices: Record<string, unknown>[] = body?.invoices ?? [];

    if (!Array.isArray(invoices)) {
        return NextResponse.json({ error: "invoices must be an array" }, { status: 400 });
    }

    let migrated = 0;
    let skipped = 0;

    for (const inv of invoices) {
        const details = (inv.details ?? {}) as Record<string, unknown>;
        const invoiceNumber = (details.invoiceNumber as string) ?? "";
        const rawDocType = (details.documentType as string) ?? "facture";
        const rawStatus = (details.status as string) ?? "draft";
        const totalTtc = Number(details.totalAmount ?? 0);
        const currency = (details.currency as string) ?? "DZD";
        const totalAmountInWords = (details.totalAmountInWords as string) ?? "";

        const documentType: DocumentType = DOC_TYPE_MAP[rawDocType] ?? "FACTURE";
        const status: InvoiceStatus = STATUS_MAP[rawStatus] ?? "DRAFT";

        // Skip if this number already exists for this user
        if (invoiceNumber) {
            const existing = await prisma.invoice.findFirst({
                where: { userId, number: invoiceNumber },
                select: { id: true },
            });
            if (existing) {
                skipped++;
                continue;
            }
        }

        // Try to parse year/seq from number; fall back to current year + 0
        const parsed = parseNumber(invoiceNumber);
        const sequenceYear = parsed?.year ?? new Date().getFullYear();
        const sequenceNumber = parsed?.seq ?? 0;

        try {
            await prisma.invoice.create({
                data: {
                    userId,
                    documentType,
                    sequenceYear,
                    sequenceNumber,
                    number: invoiceNumber || `MIGRATED/${sequenceYear}/${migrated + 1}`,
                    status,
                    payload: inv as Prisma.InputJsonValue,
                    totalTtc,
                    currency,
                    totalAmountInWords,
                    issuedAt: status !== "DRAFT" ? new Date() : undefined,
                },
            });
            migrated++;
        } catch {
            // Unique constraint violation = duplicate; skip silently
            skipped++;
        }
    }

    return NextResponse.json({ migrated, skipped });
}
