"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";

import { formatNumberWithCommas } from "@/lib/helpers";
import { apiFetch, UnauthorizedError } from "@/lib/apiFetch";
import LoadingScreen from "@/app/components/reusables/LoadingScreen";
import { useTranslationContext } from "@/contexts/TranslationContext";

type Row = {
    id: string;
    number: string;
    documentType: string;
    status:
        | "DRAFT"
        | "ISSUED"
        | "SENT"
        | "PAID"
        | "OVERDUE"
        | "CANCELLED";
    totalTtc: number;
    currency: string;
    issuedAt: string | null;
    createdAt: string;
    receiverName: string;
};

type ListResponse = {
    items: Row[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
};

const STATUS_COLORS: Record<Row["status"], string> = {
    DRAFT: "bg-gray-200 text-gray-800",
    ISSUED: "bg-blue-100 text-blue-800",
    SENT: "bg-indigo-100 text-indigo-800",
    PAID: "bg-green-100 text-green-800",
    OVERDUE: "bg-red-100 text-red-800",
    CANCELLED: "bg-gray-100 text-gray-500",
};

export default function DashboardPage() {
    const { _t } = useTranslationContext();
    const [rows, setRows] = useState<Row[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await apiFetch("/api/invoices?perPage=100");
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data: ListResponse = await res.json();
                if (!cancelled) setRows(data.items);
            } catch (e) {
                if (e instanceof UnauthorizedError) return;
                if (!cancelled)
                    setError(e instanceof Error ? e.message : "unknown");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const stats = useMemo(() => {
        const currentYear = new Date().getFullYear();
        let ytdRevenue = 0;
        let unpaid = 0;
        let overdue = 0;
        for (const r of rows) {
            const year = new Date(r.issuedAt ?? r.createdAt).getFullYear();
            if (r.status === "PAID" && year === currentYear) {
                ytdRevenue += r.totalTtc;
            }
            if (r.status === "ISSUED" || r.status === "SENT") {
                unpaid += r.totalTtc;
            }
            if (r.status === "OVERDUE") {
                overdue += 1;
            }
        }
        return { ytdRevenue, unpaid, overdue };
    }, [rows]);

    const recent = rows.slice(0, 10);

    return (
        <main className="lg:container mx-auto py-6 px-4 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">
                        {_t("dashboard.title")}
                    </h1>
                </div>
                <div className="flex gap-2">
                    <a href="/api/export/bulk?format=csv" target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            CSV
                        </Button>
                    </a>
                    <Link href="/">
                        <Button size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Nouvelle facture
                        </Button>
                    </Link>
                </div>
            </div>

            {loading && <LoadingScreen message="Chargement du tableau de bord…" fullScreen={false} />}
            {error && (
                <p className="text-sm text-red-600">
                    Erreur: {error}
                </p>
            )}

            {!loading && !error && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Card className="p-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                {_t("dashboard.ytdRevenue")}
                            </p>
                            <p className="text-2xl font-bold mt-1">
                                {formatNumberWithCommas(stats.ytdRevenue, "DZD")}{" "}
                                DZD
                            </p>
                        </Card>
                        <Card className="p-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                {_t("dashboard.unpaid")}
                            </p>
                            <p className="text-2xl font-bold mt-1">
                                {formatNumberWithCommas(stats.unpaid, "DZD")} DZD
                            </p>
                        </Card>
                        <Card className="p-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                {_t("dashboard.overdue")}
                            </p>
                            <p className="text-2xl font-bold mt-1">
                                {stats.overdue}
                            </p>
                        </Card>
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold mb-3">
                            {_t("dashboard.recentInvoices")}
                        </h2>
                        <Card className="overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr className="text-left">
                                        <th className="px-4 py-2 font-medium">
                                            #
                                        </th>
                                        <th className="px-4 py-2 font-medium">
                                            Client
                                        </th>
                                        <th className="px-4 py-2 font-medium">
                                            Date
                                        </th>
                                        <th className="px-4 py-2 font-medium">
                                            Montant
                                        </th>
                                        <th className="px-4 py-2 font-medium">
                                            Statut
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recent.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="px-4 py-6 text-center text-muted-foreground"
                                            >
                                                Aucune facture.
                                            </td>
                                        </tr>
                                    )}
                                    {recent.map((r) => (
                                        <tr
                                            key={r.id}
                                            className="border-t"
                                        >
                                            <td className="px-4 py-2 font-mono text-xs">
                                                {r.number}
                                            </td>
                                            <td className="px-4 py-2">
                                                {r.receiverName || "—"}
                                            </td>
                                            <td className="px-4 py-2">
                                                {new Date(
                                                    r.issuedAt ?? r.createdAt
                                                ).toLocaleDateString("fr-DZ")}
                                            </td>
                                            <td className="px-4 py-2 tabular-nums">
                                                {formatNumberWithCommas(
                                                    r.totalTtc,
                                                    r.currency
                                                )}{" "}
                                                {r.currency}
                                            </td>
                                            <td className="px-4 py-2">
                                                <span
                                                    className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[r.status]}`}
                                                >
                                                    {r.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Card>
                    </div>
                </>
            )}
        </main>
    );
}
