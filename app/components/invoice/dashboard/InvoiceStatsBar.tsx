"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { InvoiceType } from "@/types";
import { formatNumberWithCommas } from "@/lib/helpers";

type InvoiceStatsBarProps = {
    invoices: InvoiceType[];
};

const InvoiceStatsBar = ({ invoices }: InvoiceStatsBarProps) => {
    const stats = useMemo(() => {
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();

        let totalRevenue = 0;
        let monthCount = 0;
        let monthRevenue = 0;
        let paidCount = 0;

        invoices.forEach((inv) => {
            const amount = Number(inv.details.totalAmount) || 0;
            totalRevenue += amount;

            if (inv.details.status === "paid") paidCount++;

            if (inv.details.updatedAt) {
                const d = new Date(inv.details.updatedAt);
                if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) {
                    monthCount++;
                    monthRevenue += amount;
                }
            }
        });

        return {
            total: invoices.length,
            totalRevenue,
            monthCount,
            monthRevenue,
            paidCount,
        };
    }, [invoices]);

    const items = [
        { label: "Total factures", value: stats.total.toString() },
        { label: "Chiffre d'affaires", value: `${formatNumberWithCommas(stats.totalRevenue, "DZD")} DZD` },
        { label: "Ce mois", value: stats.monthCount.toString() },
        { label: "Payees", value: stats.paidCount.toString() },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {items.map((item) => (
                <Card key={item.label} className="p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        {item.label}
                    </p>
                    <p className="text-xl font-bold mt-1">{item.value}</p>
                </Card>
            ))}
        </div>
    );
};

export default InvoiceStatsBar;
