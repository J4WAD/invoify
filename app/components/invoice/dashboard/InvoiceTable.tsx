"use client";

import { useRouter } from "next/navigation";
import { useFormContext } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useInvoiceContext } from "@/contexts/InvoiceContext";
import { formatNumberWithCommas } from "@/lib/helpers";
import { DATE_OPTIONS } from "@/lib/variables";
import { DOCUMENT_TYPE_CONFIG } from "@/lib/documentTypes";
import type { DocumentType } from "@/types";

import {
    MoreHorizontal,
    Pencil,
    Copy,
    Trash2,
    Download,
    CheckCircle,
    Send,
} from "lucide-react";

import type { InvoiceType } from "@/types";

type InvoiceTableProps = {
    invoices: InvoiceType[];
    page: number;
    perPage: number;
    onPageChange: (page: number) => void;
    onPerPageChange: (perPage: number) => void;
};

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    draft: { label: "Brouillon", variant: "secondary" },
    sent: { label: "Envoyee", variant: "default" },
    paid: { label: "Payee", variant: "outline" },
    overdue: { label: "En retard", variant: "destructive" },
    cancelled: { label: "Annulee", variant: "secondary" },
};

const InvoiceTable = ({
    invoices,
    page,
    perPage,
    onPageChange,
    onPerPageChange,
}: InvoiceTableProps) => {
    const router = useRouter();
    const { reset } = useFormContext<InvoiceType>();
    const {
        deleteInvoice,
        updateInvoiceStatus,
        duplicateInvoice,
        generatePdf,
    } = useInvoiceContext();

    const totalPages = Math.max(1, Math.ceil(invoices.length / perPage));
    const paginated = invoices.slice((page - 1) * perPage, page * perPage);

    const handleEdit = (invoice: InvoiceType) => {
        const copy = structuredClone(invoice);
        copy.details.dueDate = new Date(copy.details.dueDate) as unknown as string;
        copy.details.invoiceDate = new Date(copy.details.invoiceDate) as unknown as string;
        copy.details.invoiceLogo = "";
        copy.details.signature = { data: "" };
        reset(copy);
        router.push("/");
    };

    const handleDelete = (invoice: InvoiceType) => {
        deleteInvoice(invoice);
    };

    const handleDownloadPdf = async (invoice: InvoiceType) => {
        await generatePdf(invoice);
    };

    return (
        <div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[140px]">N° Facture</TableHead>
                            <TableHead className="w-[110px]">Type</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead className="hidden md:table-cell">Date</TableHead>
                            <TableHead className="text-right">Montant</TableHead>
                            <TableHead className="w-[100px]">Statut</TableHead>
                            <TableHead className="w-[60px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginated.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    Aucune facture trouvee
                                </TableCell>
                            </TableRow>
                        )}
                        {paginated.map((invoice) => {
                            const status = invoice.details.status ?? "draft";
                            const badge = STATUS_BADGE[status] ?? STATUS_BADGE.draft;
                            const docType = (invoice.details.documentType || "facture") as DocumentType;
                            const docCfg = DOCUMENT_TYPE_CONFIG[docType];
                            return (
                                <TableRow key={invoice.details.invoiceNumber}>
                                    <TableCell className="font-medium">
                                        {invoice.details.invoiceNumber}
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            className="inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white"
                                            style={{ backgroundColor: docCfg.badgeColor }}
                                        >
                                            {docCfg.labelFr}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium text-sm">{invoice.receiver.name}</p>
                                            <p className="text-xs text-muted-foreground">{invoice.sender.name}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                                        {invoice.details.updatedAt || "—"}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">
                                        {formatNumberWithCommas(Number(invoice.details.totalAmount), invoice.details.currency)}{" "}
                                        <span className="text-xs text-muted-foreground">{invoice.details.currency}</span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={badge.variant}>{badge.label}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleEdit(invoice)}>
                                                    <Pencil className="h-4 w-4 mr-2" />
                                                    Modifier
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => duplicateInvoice(invoice)}>
                                                    <Copy className="h-4 w-4 mr-2" />
                                                    Dupliquer
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDownloadPdf(invoice)}>
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Telecharger PDF
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => updateInvoiceStatus(invoice.details.invoiceNumber, "sent")}
                                                >
                                                    <Send className="h-4 w-4 mr-2" />
                                                    Marquer envoyee
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => updateInvoiceStatus(invoice.details.invoiceNumber, "paid")}
                                                >
                                                    <CheckCircle className="h-4 w-4 mr-2" />
                                                    Marquer payee
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(invoice)}
                                                    className="text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Supprimer
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Afficher</span>
                    <select
                        value={perPage}
                        onChange={(e) => {
                            onPerPageChange(Number(e.target.value));
                            onPageChange(1);
                        }}
                        className="border rounded px-2 py-1 text-sm bg-background"
                    >
                        {[10, 25, 50].map((n) => (
                            <option key={n} value={n}>{n}</option>
                        ))}
                    </select>
                    <span>sur {invoices.length}</span>
                </div>
                <div className="flex gap-1">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => onPageChange(page - 1)}
                    >
                        Prec.
                    </Button>
                    <span className="flex items-center px-3 text-sm">
                        {page} / {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() => onPageChange(page + 1)}
                    >
                        Suiv.
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default InvoiceTable;
