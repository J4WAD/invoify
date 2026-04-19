"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Trash2, LogOut } from "lucide-react";

type UserRow = {
    id: string;
    username: string;
    role: "admin" | "user";
    createdAt: string;
};

const UsersTab = () => {
    const { data: session } = useSession();
    const isAdmin = (session?.user as any)?.role === "admin";
    const currentUsername = String(
        (session?.user as any)?.username ?? session?.user?.name ?? ""
    );

    // Change password
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [pwMsg, setPwMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

    const handleChangePassword = async () => {
        setPwMsg(null);
        const res = await fetch("/api/auth/change-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ currentPassword, newPassword }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
            setPwMsg({ type: "ok", text: "Mot de passe mis à jour" });
            setCurrentPassword("");
            setNewPassword("");
        } else {
            setPwMsg({ type: "err", text: data?.error ?? "Erreur" });
        }
    };

    // Users list (admin)
    const [users, setUsers] = useState<UserRow[]>([]);
    const [newUsername, setNewUsername] = useState("");
    const [newUserPassword, setNewUserPassword] = useState("");
    const [newUserRole, setNewUserRole] = useState<"user" | "admin">("user");
    const [addMsg, setAddMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

    const loadUsers = useCallback(async () => {
        if (!isAdmin) return;
        const res = await fetch("/api/auth/users");
        if (res.ok) {
            const data = await res.json();
            setUsers(data.users);
        }
    }, [isAdmin]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const handleCreateUser = async () => {
        setAddMsg(null);
        const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: newUsername,
                password: newUserPassword,
                role: newUserRole,
            }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
            setAddMsg({ type: "ok", text: `Utilisateur ${data.username} créé` });
            setNewUsername("");
            setNewUserPassword("");
            setNewUserRole("user");
            loadUsers();
        } else {
            setAddMsg({ type: "err", text: data?.error ?? "Erreur" });
        }
    };

    const handleDeleteUser = async (username: string) => {
        if (!confirm(`Supprimer l'utilisateur ${username} ?`)) return;
        const res = await fetch(`/api/auth/users/${encodeURIComponent(username)}`, {
            method: "DELETE",
        });
        if (res.ok) loadUsers();
    };

    return (
        <div className="space-y-6 py-2">
            {/* Session info */}
            <div className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
                <div>
                    <p className="text-sm">
                        Connecté en tant que{" "}
                        <span className="font-semibold">{currentUsername || "…"}</span>
                    </p>
                    {isAdmin && (
                        <p className="text-xs text-muted-foreground">Administrateur</p>
                    )}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => signOut({ callbackUrl: "/fr/auth/login" })}
                >
                    <LogOut className="h-4 w-4 mr-1" /> Déconnexion
                </Button>
            </div>

            {/* Change password */}
            <div className="space-y-3">
                <h3 className="text-sm font-semibold">Changer mon mot de passe</h3>
                <div className="space-y-2">
                    <div>
                        <Label className="text-xs">Mot de passe actuel</Label>
                        <Input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label className="text-xs">Nouveau mot de passe (min. 6)</Label>
                        <Input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                    </div>
                    <Button
                        size="sm"
                        onClick={handleChangePassword}
                        disabled={!currentPassword || newPassword.length < 6}
                    >
                        Mettre à jour
                    </Button>
                    {pwMsg && (
                        <p
                            className={`text-xs ${
                                pwMsg.type === "ok" ? "text-green-600" : "text-destructive"
                            }`}
                        >
                            {pwMsg.text}
                        </p>
                    )}
                </div>
            </div>

            {/* Admin: user list + add user */}
            {isAdmin && (
                <>
                    <div className="space-y-2 border-t pt-4">
                        <h3 className="text-sm font-semibold">Utilisateurs</h3>
                        <div className="border rounded-md divide-y">
                            {users.map((u) => (
                                <div
                                    key={u.id}
                                    className="flex items-center justify-between px-3 py-2"
                                >
                                    <div>
                                        <p className="text-sm font-medium">{u.username}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {u.role === "admin" ? "Admin" : "Utilisateur"}
                                        </p>
                                    </div>
                                    {u.username.toLowerCase() !== currentUsername.toLowerCase() && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => handleDeleteUser(u.username)}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                            {users.length === 0 && (
                                <p className="px-3 py-2 text-xs text-muted-foreground">
                                    Aucun utilisateur
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2 border-t pt-4">
                        <h3 className="text-sm font-semibold">Ajouter un utilisateur</h3>
                        <div className="space-y-2">
                            <Input
                                placeholder="Nom d'utilisateur"
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                            />
                            <Input
                                type="password"
                                placeholder="Mot de passe (min. 6)"
                                value={newUserPassword}
                                onChange={(e) => setNewUserPassword(e.target.value)}
                            />
                            <select
                                value={newUserRole}
                                onChange={(e) =>
                                    setNewUserRole(e.target.value as "user" | "admin")
                                }
                                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                            >
                                <option value="user">Utilisateur</option>
                                <option value="admin">Administrateur</option>
                            </select>
                            <Button
                                size="sm"
                                onClick={handleCreateUser}
                                disabled={!newUsername || newUserPassword.length < 6}
                            >
                                Créer
                            </Button>
                            {addMsg && (
                                <p
                                    className={`text-xs ${
                                        addMsg.type === "ok"
                                            ? "text-green-600"
                                            : "text-destructive"
                                    }`}
                                >
                                    {addMsg.text}
                                </p>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default UsersTab;
