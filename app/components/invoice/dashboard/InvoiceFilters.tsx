"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { DOCUMENT_TYPES, DOCUMENT_TYPE_CONFIG } from "@/lib/documentTypes";
import type { DocumentType } from "@/types";

export type SortKey = "date" | "amount" | "client";
export type SortDir = "asc" | "desc";
export type StatusFilter = "all" | "draft" | "sent" | "paid" | "overdue" | "cancelled";
export type DocTypeFilter = "all" | DocumentType;

type InvoiceFiltersProps = {
    search: string;
    onSearchChange: (val: string) => void;
    statusFilter: StatusFilter;
    onStatusChange: (val: StatusFilter) => void;
    docTypeFilter: DocTypeFilter;
    onDocTypeChange: (val: DocTypeFilter) => void;
    sortKey: SortKey;
    onSortKeyChange: (val: SortKey) => void;
    sortDir: SortDir;
    onSortDirToggle: () => void;
};

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "Tous" },
    { value: "draft", label: "Brouillon" },
    { value: "sent", label: "Envoyee" },
    { value: "paid", label: "Payee" },
    { value: "overdue", label: "En retard" },
    { value: "cancelled", label: "Annulee" },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
    { value: "date", label: "Date" },
    { value: "amount", label: "Montant" },
    { value: "client", label: "Client" },
];

const InvoiceFilters = ({
    search,
    onSearchChange,
    statusFilter,
    onStatusChange,
    docTypeFilter,
    onDocTypeChange,
    sortKey,
    onSortKeyChange,
    sortDir,
    onSortDirToggle,
}: InvoiceFiltersProps) => {
    return (
        <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Rechercher par N°, client, expediteur..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9 pr-8"
                />
                {search && (
                    <button
                        onClick={() => onSearchChange("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Status filter */}
            <Select value={statusFilter} onValueChange={(v) => onStatusChange(v as StatusFilter)}>
                <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Document type filter */}
            <Select value={docTypeFilter} onValueChange={(v) => onDocTypeChange(v as DocTypeFilter)}>
                <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Tous types</SelectItem>
                    {DOCUMENT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                            {DOCUMENT_TYPE_CONFIG[t].labelFr}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortKey} onValueChange={(v) => onSortKeyChange(v as SortKey)}>
                <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                    {SORT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Button variant="outline" size="icon" onClick={onSortDirToggle} title="Inverser l'ordre">
                {sortDir === "asc" ? "\u2191" : "\u2193"}
            </Button>
        </div>
    );
};

export default InvoiceFilters;
