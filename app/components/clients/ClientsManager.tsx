"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";

interface Client {
    id: string;
    name: string;
    address: string;
    zipCode: string;
    city: string;
    country: string;
    email: string;
    phone: string;
}

const EMPTY: Omit<Client, "id"> = {
    name: "",
    address: "",
    zipCode: "",
    city: "",
    country: "",
    email: "",
    phone: "",
};

export default function ClientsManager() {
    const { toast } = useToast();
    const [clients, setClients] = useState<Client[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [deletingClient, setDeletingClient] = useState<Client | null>(null);
    const [form, setForm] = useState<Omit<Client, "id">>(EMPTY);
    const [saving, setSaving] = useState(false);

    const fetchClients = useCallback(async (q?: string) => {
        setLoading(true);
        try {
            const url = `/api/clients${q ? `?search=${encodeURIComponent(q)}` : ""}`;
            const res = await fetch(url);
            const data = await res.json();
            setClients(data.clients ?? []);
        } catch {
            toast({ title: "Erreur", description: "Impossible de charger les clients", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    const openCreate = () => {
        setEditingClient(null);
        setForm(EMPTY);
        setDialogOpen(true);
    };

    const openEdit = (c: Client) => {
        setEditingClient(c);
        setForm({ name: c.name, address: c.address, zipCode: c.zipCode, city: c.city, country: c.country, email: c.email, phone: c.phone });
        setDialogOpen(true);
    };

    const openDelete = (c: Client) => {
        setDeletingClient(c);
        setDeleteDialogOpen(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) {
            toast({ title: "Validation", description: "Le nom est requis", variant: "destructive" });
            return;
        }
        setSaving(true);
        try {
            const url = editingClient ? `/api/clients/${editingClient.id}` : "/api/clients";
            const method = editingClient ? "PATCH" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            if (!res.ok) throw new Error(await res.text());
            toast({ title: editingClient ? "Client mis à jour" : "Client créé" });
            setDialogOpen(false);
            fetchClients(search);
        } catch {
            toast({ title: "Erreur", description: "Impossible de sauvegarder", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingClient) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/clients/${deletingClient.id}`, { method: "DELETE" });
            if (!res.ok && res.status !== 204) throw new Error();
            toast({ title: "Client supprimé" });
            setDeleteDialogOpen(false);
            fetchClients(search);
        } catch {
            toast({ title: "Erreur", description: "Impossible de supprimer", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleSearch = (val: string) => {
        setSearch(val);
        fetchClients(val);
    };

    const field = (key: keyof Omit<Client, "id">, label: string, required?: boolean) => (
        <div className="space-y-1">
            <Label htmlFor={key}>{label}{required && " *"}</Label>
            <Input
                id={key}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={label}
            />
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Clients</h1>
                    <p className="text-sm text-muted-foreground">Carnet d'adresses clients</p>
                </div>
                <Button onClick={openCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau client
                </Button>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    className="pl-9"
                    placeholder="Rechercher un client…"
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nom</TableHead>
                            <TableHead>Ville</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Téléphone</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                    Chargement…
                                </TableCell>
                            </TableRow>
                        ) : clients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12">
                                    <User className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                    <p className="text-muted-foreground">Aucun client trouvé</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            clients.map((c) => (
                                <TableRow key={c.id}>
                                    <TableCell className="font-medium">{c.name}</TableCell>
                                    <TableCell>{[c.zipCode, c.city, c.country].filter(Boolean).join(", ")}</TableCell>
                                    <TableCell>{c.email}</TableCell>
                                    <TableCell>{c.phone}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDelete(c)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingClient ? "Modifier le client" : "Nouveau client"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        {field("name", "Nom", true)}
                        {field("address", "Adresse")}
                        <div className="grid grid-cols-2 gap-3">
                            {field("zipCode", "Code postal")}
                            {field("city", "Ville")}
                        </div>
                        {field("country", "Pays")}
                        {field("email", "Email")}
                        {field("phone", "Téléphone")}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? "Enregistrement…" : "Enregistrer"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Supprimer le client</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Confirmer la suppression de <strong>{deletingClient?.name}</strong> ? Cette action est irréversible.
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Annuler</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={saving}>
                            {saving ? "Suppression…" : "Supprimer"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
