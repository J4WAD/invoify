"use client";
import { useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";

const MIN_PASSWORD_LENGTH = 12;

export default function ResetPasswordPage() {
    const params = useParams<{ locale: string }>();
    const locale = params.locale ?? "fr";
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token") ?? "";

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background px-4">
                <p className="text-destructive">Lien invalide ou expiré.</p>
            </div>
        );
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        if (password.length < MIN_PASSWORD_LENGTH) {
            setError(`Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`);
            return;
        }
        if (password !== confirm) {
            setError("Les mots de passe ne correspondent pas.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/auth/reset", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });
            const d = await res.json() as { ok?: boolean; error?: string };
            if (!res.ok) {
                setError(d.error ?? "Erreur lors de la réinitialisation.");
                return;
            }
            router.push(`/${locale}/auth/login?notice=password_reset`);
        } catch {
            setError("Erreur réseau. Réessayez.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="w-full max-w-sm bg-card border rounded-lg shadow-sm p-8">
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-bold" style={{ color: "#2563eb" }}>FacturApp</h1>
                    <p className="text-sm text-muted-foreground mt-1">Nouveau mot de passe</p>
                </div>

                {error && <p className="mb-4 text-sm text-destructive text-center">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Nouveau mot de passe{" "}
                            <span className="text-muted-foreground font-normal">(min {MIN_PASSWORD_LENGTH} car.)</span>
                        </label>
                        <input
                            type="password"
                            required
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Confirmer</label>
                        <input
                            type="password"
                            required
                            autoComplete="new-password"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 rounded-md text-white font-medium text-sm disabled:opacity-60"
                        style={{ backgroundColor: "#2563eb" }}
                    >
                        {loading ? "Enregistrement…" : "Enregistrer le mot de passe"}
                    </button>
                </form>
            </div>
        </div>
    );
}
