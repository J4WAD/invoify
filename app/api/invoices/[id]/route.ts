import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { finalizeInvoice } from "@/lib/invoice/numbering";
import type { InvoiceStatus, Prisma } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

// Valid status transitions
const TRANSITIONS: Partial<Record<InvoiceStatus, InvoiceStatus[]>> = {
    DRAFT: ["ISSUED", "CANCELLED"],
    ISSUED: ["SENT", "CANCELLED"],
    SENT: ["PAID", "OVERDUE", "CANCELLED"],
    OVERDUE: ["PAID", "CANCELLED"],
};

export async function GET(_req: NextRequest, { params }: Params) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: { client: true, auditLogs: { orderBy: { createdAt: "asc" } } },
    });

    if (!invoice || invoice.userId !== (session.user.id as string)) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ...invoice, totalTtc: Number(invoice.totalTtc) });
}

export async function PATCH(req: NextRequest, { params }: Params) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id as string;
    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice || invoice.userId !== userId) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const { status: newStatus, payload, totalTtc, currency, totalAmountInWords, clientId } = body;

    // Status transition
    if (newStatus) {
        const allowed = TRANSITIONS[invoice.status] ?? [];
        if (!allowed.includes(newStatus as InvoiceStatus)) {
            return NextResponse.json(
                { error: `Cannot transition from ${invoice.status} to ${newStatus}` },
                { status: 422 }
            );
        }

        // DRAFT → ISSUED uses the dedicated finalize flow (allocates sequence number)
        if (invoice.status === "DRAFT" && newStatus === "ISSUED") {
            try {
                const { number } = await finalizeInvoice(id, userId);
                return NextResponse.json({ id, number, status: "ISSUED" });
            } catch (err: unknown) {
                return NextResponse.json(
                    { error: err instanceof Error ? err.message : "Finalize failed" },
                    { status: 422 }
                );
            }
        }

        const updated = await prisma.invoice.update({
            where: { id },
            data: {
                status: newStatus as InvoiceStatus,
                paidAt: newStatus === "PAID" ? new Date() : undefined,
            },
        });

        await prisma.invoiceAuditLog.create({
            data: { invoiceId: id, userId, action: newStatus, diff: { from: invoice.status, to: newStatus } },
        });

        return NextResponse.json({ ...updated, totalTtc: Number(updated.totalTtc) });
    }

    // Payload / metadata update (DRAFT only)
    if (invoice.status !== "DRAFT") {
        return NextResponse.json({ error: "Only DRAFT invoices can be edited" }, { status: 422 });
    }

    const updateData: Prisma.InvoiceUpdateInput = {};
    if (payload !== undefined) updateData.payload = payload as Prisma.InputJsonValue;
    if (totalTtc !== undefined) updateData.totalTtc = totalTtc;
    if (currency !== undefined) updateData.currency = currency;
    if (totalAmountInWords !== undefined) updateData.totalAmountInWords = totalAmountInWords;
    if (clientId !== undefined) updateData.client = clientId ? { connect: { id: clientId } } : { disconnect: true };

    const updated = await prisma.invoice.update({ where: { id }, data: updateData });

    await prisma.invoiceAuditLog.create({
        data: { invoiceId: id, userId, action: "UPDATED", diff: Object.keys(updateData) },
    });

    return NextResponse.json({ ...updated, totalTtc: Number(updated.totalTtc) });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id as string;
    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice || invoice.userId !== userId) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (invoice.status !== "DRAFT") {
        return NextResponse.json({ error: "Only DRAFT invoices can be deleted" }, { status: 422 });
    }

    await prisma.invoice.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
}
