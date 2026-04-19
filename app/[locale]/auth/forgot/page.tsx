"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function ForgotPasswordPage() {
    const params = useParams<{ locale: string }>();
    const locale = params.locale ?? "fr";

    const [username, setUsername] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await fetch("/api/auth/forgot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username }),
            });
            if (!res.ok) {
                const d = await res.json() as { error?: string };
                setError(d.error ?? "Erreur réseau.");
            } else {
                setSubmitted(true);
            }
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
                    <p className="text-sm text-muted-foreground mt-1">Réinitialisation du mot de passe</p>
                </div>

                {submitted ? (
                    <div className="text-center space-y-3">
                        <p className="text-sm">
                            Si un compte avec ce nom d&apos;utilisateur et une adresse email existe,
                            un lien de réinitialisation a été envoyé.
                        </p>
                        <Link
                            href={`/${locale}/auth/login`}
                            className="text-sm underline text-muted-foreground hover:text-foreground"
                        >
                            Retour à la connexion
                        </Link>
                    </div>
                ) : (
                    <>
                        {error && <p className="mb-4 text-sm text-destructive text-center">{error}</p>}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nom d&apos;utilisateur</label>
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-2 rounded-md text-white font-medium text-sm disabled:opacity-60"
                                style={{ backgroundColor: "#2563eb" }}
                            >
                                {loading ? "Envoi…" : "Envoyer le lien"}
                            </button>
                        </form>
                        <p className="mt-4 text-center text-xs text-muted-foreground">
                            <Link href={`/${locale}/auth/login`} className="underline hover:text-foreground">
                                Retour à la connexion
                            </Link>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
