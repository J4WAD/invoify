"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

import { useProfileContext } from "@/contexts/ProfileContext";
import { toast } from "@/components/ui/use-toast";

import { Plus, Trash2, User } from "lucide-react";

import type { ClientType } from "@/types";

const EMPTY_CLIENT: Omit<ClientType, "id"> = {
    name: "",
    address: "",
    zipCode: "",
    city: "",
    country: "",
    email: "",
    phone: "",
};

const ClientsTab = () => {
    const { profile, addClient, updateClient, deleteClient } = useProfileContext();
    const [editing, setEditing] = useState<Omit<ClientType, "id"> & { id?: string } | null>(null);

    const clients = profile.clients || [];

    const handleSave = () => {
        if (!editing || !editing.name.trim()) {
            toast({ variant: "destructive", title: "Le nom est requis" });
            return;
        }
        try {
            if (editing.id) {
                updateClient(editing.id, editing);
            } else {
                addClient(editing);
            }
            setEditing(null);
            toast({ title: "Client enregistre" });
        } catch {
            toast({ variant: "destructive", title: "Erreur", description: "Donnees invalides" });
        }
    };

    if (editing) {
        return (
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">
                        {editing.id ? "Modifier le client" : "Nouveau client"}
                    </p>
                    <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
                        Annuler
                    </Button>
                </div>
                {(
                    [
                        ["name", "Nom"],
                        ["address", "Adresse"],
                        ["zipCode", "Code postal"],
                        ["city", "Ville"],
                        ["country", "Pays"],
                        ["email", "Email"],
                        ["phone", "Telephone"],
                    ] as const
                ).map(([key, label]) => (
                    <div key={key}>
                        <Label className="text-xs">{label}</Label>
                        <Input
                            value={(editing as Record<string, string>)[key] || ""}
                            onChange={(e) =>
                                setEditing((prev) => prev ? { ...prev, [key]: e.target.value } : prev)
                            }
                            className="mt-1"
                        />
                    </div>
                ))}
                <Button onClick={handleSave} className="w-full">
                    Enregistrer
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
                Enregistrez vos clients frequents pour les reutiliser rapidement.
            </p>

            {clients.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                    <User className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Aucun client enregistre</p>
                </div>
            )}

            {clients.map((client) => (
                <Card key={client.id} className="p-3 flex items-center justify-between">
                    <div>
                        <p className="font-medium text-sm">{client.name}</p>
                        <p className="text-xs text-muted-foreground">
                            {[client.city, client.country].filter(Boolean).join(", ")}
                        </p>
                    </div>
                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditing({ ...client })}
                        >
                            Modifier
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => deleteClient(client.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </Card>
            ))}

            <Button
                variant="outline"
                className="w-full"
                onClick={() => setEditing({ ...EMPTY_CLIENT })}
            >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un client
            </Button>
        </div>
    );
};

export default ClientsTab;
