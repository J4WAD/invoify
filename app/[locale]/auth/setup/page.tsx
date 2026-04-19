"use client";
import { redirect } from "next/navigation";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

const MIN_PASSWORD_LENGTH = 12;

export default function SetupPage() {
    const router = useRouter();
    const params = useParams<{ locale: string }>();
    const locale = params.locale ?? "fr";

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        // If setup already done, go to login
        fetch("/api/auth/setup", { method: "GET" })
            .then((r) => {
                // 405 = endpoint exists and setup not done → stay on page
                // Any redirect or 403 would indicate already set up
                if (r.status === 403) router.replace(`/${locale}/auth/login`);
                else setChecking(false);
            })
            .catch(() => setChecking(false));
    }, [locale, router]);

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
            const res = await fetch("/api/auth/setup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });
            const data = (await res.json()) as { ok?: boolean; error?: string };
            if (!res.ok) {
                setError(data.error ?? "Erreur lors de la création.");
                return;
            }
            router.push(`/${locale}/auth/login`);
        } catch {
            setError("Erreur réseau. Réessayez.");
        } finally {
            setLoading(false);
        }
    }

    if (checking) return null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="w-full max-w-sm bg-card border rounded-lg shadow-sm p-8">
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-bold" style={{ color: "#2563eb" }}>
                        FacturApp
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Première configuration — créer le compte administrateur
                    </p>
                </div>

                {error && (
                    <p className="mb-4 text-sm text-destructive text-center">{error}</p>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Nom d&apos;utilisateur
                        </label>
                        <input
                            type="text"
                            required
                            autoComplete="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Mot de passe{" "}
                            <span className="text-muted-foreground font-normal">
                                (min {MIN_PASSWORD_LENGTH} caractères)
                            </span>
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
                        <label className="block text-sm font-medium mb-1">
                            Confirmer le mot de passe
                        </label>
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
                        {loading ? "Création…" : "Créer le compte administrateur"}
                    </button>
                </form>
            </div>
        </div>
    );
}
