"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useInvoiceContext } from "@/contexts/InvoiceContext";
import { Plus } from "lucide-react";

import InvoiceStatsBar from "./InvoiceStatsBar";
import InvoiceFilters, {
    type SortKey,
    type SortDir,
    type StatusFilter,
    type DocTypeFilter,
} from "./InvoiceFilters";
import InvoiceTable from "./InvoiceTable";

import type { InvoiceType } from "@/types";

const InvoiceDashboard = () => {
    const { savedInvoices } = useInvoiceContext();

    // Filter & sort state
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [docTypeFilter, setDocTypeFilter] = useState<DocTypeFilter>("all");
    const [sortKey, setSortKey] = useState<SortKey>("date");
    const [sortDir, setSortDir] = useState<SortDir>("desc");

    // Pagination
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    const filtered = useMemo(() => {
        let result = [...savedInvoices];

        // Search
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(
                (inv) =>
                    inv.details.invoiceNumber?.toLowerCase().includes(q) ||
                    inv.sender.name?.toLowerCase().includes(q) ||
                    inv.receiver.name?.toLowerCase().includes(q)
            );
        }

        // Status
        if (statusFilter !== "all") {
            result = result.filter(
                (inv) => (inv.details.status ?? "draft") === statusFilter
            );
        }

        // Document type
        if (docTypeFilter !== "all") {
            result = result.filter(
                (inv) => (inv.details.documentType ?? "facture") === docTypeFilter
            );
        }

        // Sort
        result.sort((a, b) => {
            let cmp = 0;
            switch (sortKey) {
                case "date":
                    cmp =
                        new Date(a.details.updatedAt || 0).getTime() -
                        new Date(b.details.updatedAt || 0).getTime();
                    break;
                case "amount":
                    cmp =
                        (Number(a.details.totalAmount) || 0) -
                        (Number(b.details.totalAmount) || 0);
                    break;
                case "client":
                    cmp = (a.receiver.name || "").localeCompare(b.receiver.name || "");
                    break;
            }
            return sortDir === "asc" ? cmp : -cmp;
        });

        return result;
    }, [savedInvoices, search, statusFilter, docTypeFilter, sortKey, sortDir]);

    // Reset page when filters change
    const handleSearchChange = (val: string) => {
        setSearch(val);
        setPage(1);
    };
    const handleStatusChange = (val: StatusFilter) => {
        setStatusFilter(val);
        setPage(1);
    };
    const handleDocTypeChange = (val: DocTypeFilter) => {
        setDocTypeFilter(val);
        setPage(1);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Factures</h1>
                    <p className="text-sm text-muted-foreground">
                        Gerez et retrouvez toutes vos factures
                    </p>
                </div>
                <Link href="/">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Nouvelle facture
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <InvoiceStatsBar invoices={savedInvoices} />

            {/* Filters */}
            <InvoiceFilters
                search={search}
                onSearchChange={handleSearchChange}
                statusFilter={statusFilter}
                onStatusChange={handleStatusChange}
                docTypeFilter={docTypeFilter}
                onDocTypeChange={handleDocTypeChange}
                sortKey={sortKey}
                onSortKeyChange={setSortKey}
                sortDir={sortDir}
                onSortDirToggle={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            />

            {/* Table */}
            <InvoiceTable
                invoices={filtered}
                page={page}
                perPage={perPage}
                onPageChange={setPage}
                onPerPageChange={setPerPage}
            />
        </div>
    );
};

export default InvoiceDashboard;
