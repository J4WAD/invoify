import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { allocateSequenceNumber } from "@/lib/invoice/numbering";
import type { DocumentType, InvoiceStatus, Prisma } from "@prisma/client";

// Map lowercase form values → Prisma enum
const DOC_TYPE_MAP: Record<string, DocumentType> = {
    facture: "FACTURE",
    devis: "DEVIS",
    bon_de_livraison: "BON_DE_LIVRAISON",
    avoir: "AVOIR",
    bon_de_commande: "BON_DE_COMMANDE",
    pro_forma: "PRO_FORMA",
    bon_de_reception: "BON_DE_RECEPTION",
};

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id as string;

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const perPage = Math.min(100, Math.max(1, Number(searchParams.get("perPage") ?? 20)));
    const search = searchParams.get("search")?.trim() ?? "";
    const status = searchParams.get("status");
    const docType = searchParams.get("docType");

    const where: Prisma.InvoiceWhereInput = { userId };

    if (status && status !== "all") {
        where.status = status.toUpperCase() as InvoiceStatus;
    }
    if (docType && docType !== "all") {
        where.documentType = DOC_TYPE_MAP[docType];
    }
    if (search) {
        where.OR = [
            { number: { contains: search, mode: "insensitive" } },
        ];
    }

    const [total, items] = await Promise.all([
        prisma.invoice.count({ where }),
        prisma.invoice.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * perPage,
            take: perPage,
            select: {
                id: true,
                number: true,
                documentType: true,
                status: true,
                totalTtc: true,
                currency: true,
                issuedAt: true,
                createdAt: true,
                updatedAt: true,
                client: { select: { name: true } },
                // Pull receiver name from payload
                payload: true,
            },
        }),
    ]);

    // Flatten client/receiver name for the table
    const rows = items.map((inv) => {
        const payload = inv.payload as Record<string, unknown>;
        const receiver = payload?.receiver as Record<string, unknown> | undefined;
        return {
            ...inv,
            receiverName: inv.client?.name ?? (receiver?.name as string | undefined) ?? "",
            totalTtc: Number(inv.totalTtc),
        };
    });

    return NextResponse.json({
        items: rows,
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
    });
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id as string;

    const body = await req.json();
    const {
        payload,
        documentType: rawDocType = "facture",
        totalTtc = 0,
        currency = "DZD",
        totalAmountInWords,
        clientId,
    } = body;

    const documentType: DocumentType = DOC_TYPE_MAP[rawDocType] ?? "FACTURE";
    const year = new Date().getFullYear();
    const { sequenceNumber, number } = await allocateSequenceNumber(userId, documentType, year);

    const invoice = await prisma.invoice.create({
        data: {
            userId,
            clientId: clientId ?? null,
            documentType,
            sequenceYear: year,
            sequenceNumber,
            number,
            status: "DRAFT",
            payload: payload as Prisma.InputJsonValue,
            totalTtc: totalTtc,
            currency,
            totalAmountInWords,
        },
    });

    await prisma.invoiceAuditLog.create({
        data: {
            invoiceId: invoice.id,
            userId,
            action: "CREATED",
            diff: { documentType, number },
        },
    });

    return NextResponse.json(invoice, { status: 201 });
}
