import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id as string;

    const yearStart = new Date(new Date().getFullYear(), 0, 1);
    const monthsBack = new Date();
    monthsBack.setMonth(monthsBack.getMonth() - 11);
    monthsBack.setDate(1);
    monthsBack.setHours(0, 0, 0, 0);

    const [ytdAgg, unpaidAgg, overdueCount, monthlyRows] = await Promise.all([
        prisma.invoice.aggregate({
            where: {
                userId,
                status: "PAID",
                paidAt: { gte: yearStart },
            },
            _sum: { totalTtc: true },
        }),
        prisma.invoice.aggregate({
            where: {
                userId,
                status: { in: ["ISSUED", "SENT"] },
            },
            _sum: { totalTtc: true },
        }),
        prisma.invoice.count({
            where: { userId, status: "OVERDUE" },
        }),
        // Per-month revenue (PAID) for the last 12 months. Postgres-only
        // raw query — the aggregate API can't bucket by month natively.
        prisma.$queryRaw<{ month: Date; total: number }[]>`
            SELECT
                DATE_TRUNC('month', "paidAt") AS month,
                SUM("totalTtc")::float        AS total
            FROM "Invoice"
            WHERE "userId" = ${userId}
              AND status = 'PAID'
              AND "paidAt" >= ${monthsBack}
            GROUP BY 1
            ORDER BY 1 ASC
        `,
    ]);

    const monthlyRevenue = monthlyRows.map((r) => ({
        month: new Date(r.month).toISOString().slice(0, 7), // YYYY-MM
        total: Number(r.total) || 0,
    }));

    return NextResponse.json({
        ytdRevenue: Number(ytdAgg._sum.totalTtc ?? 0),
        unpaid: Number(unpaidAgg._sum.totalTtc ?? 0),
        overdueCount,
        monthlyRevenue,
    });
}
