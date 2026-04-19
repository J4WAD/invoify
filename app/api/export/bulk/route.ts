import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

type ExportFormat = "csv" | "json";

function toCsvField(v: unknown): string {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
}

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id as string;

    const { searchParams } = req.nextUrl;
    const yearParam = searchParams.get("year");
    const format: ExportFormat =
        searchParams.get("format") === "json" ? "json" : "csv";
    const year = yearParam ? Number(yearParam) : new Date().getFullYear();

    const invoices = await prisma.invoice.findMany({
        where: {
            userId,
            sequenceYear: year,
        },
        orderBy: { sequenceNumber: "asc" },
        select: {
            number: true,
            documentType: true,
            status: true,
            totalTtc: true,
            currency: true,
            issuedAt: true,
            createdAt: true,
            client: { select: { name: true } },
            payload: true,
        },
    });

    const rows = invoices.map((inv) => {
        const payload = inv.payload as Record<string, unknown>;
        const receiver = payload?.receiver as
            | Record<string, unknown>
            | undefined;
        return {
            number: inv.number,
            documentType: inv.documentType,
            status: inv.status,
            client:
                inv.client?.name ??
                (receiver?.name as string | undefined) ??
                "",
            amount: Number(inv.totalTtc),
            currency: inv.currency,
            issuedAt: inv.issuedAt
                ? inv.issuedAt.toISOString()
                : inv.createdAt.toISOString(),
        };
    });

    if (format === "json") {
        return NextResponse.json(
            { year, count: rows.length, rows },
            {
                headers: {
                    "Content-Disposition": `attachment; filename="facturapp-${year}.json"`,
                },
            }
        );
    }

    const header = [
        "number",
        "documentType",
        "status",
        "client",
        "amount",
        "currency",
        "issuedAt",
    ];
    const csv = [
        header.join(","),
        ...rows.map((r) =>
            [
                r.number,
                r.documentType,
                r.status,
                r.client,
                r.amount,
                r.currency,
                r.issuedAt,
            ]
                .map(toCsvField)
                .join(",")
        ),
    ].join("\n");

    return new NextResponse(csv, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="facturapp-${year}.csv"`,
        },
    });
}
