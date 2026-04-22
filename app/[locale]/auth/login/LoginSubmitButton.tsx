"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

type LoginFormProps = {
    action: (formData: FormData) => Promise<void>;
    errorMessage?: string;
    callbackUrl: string;
    locale: string;
};

export default function LoginForm({
    action,
    errorMessage,
    callbackUrl,
}: LoginFormProps) {
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        try {
            const formData = new FormData(e.currentTarget);
            await action(formData);
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="callbackUrl" value={callbackUrl} />

            {errorMessage && (
                <p className="mb-4 text-sm text-destructive text-center">
                    {errorMessage}
                </p>
            )}

            <div>
                <label className="block text-sm font-medium mb-1">
                    Utilisateur
                </label>
                <input
                    name="username"
                    type="text"
                    required
                    autoComplete="username"
                    className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">
                    Mot de passe
                </label>
                <input
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                />
            </div>
            <button
                type="submit"
                disabled={loading}
                className="w-full py-2 rounded-md text-white font-medium text-sm disabled:opacity-70 flex items-center justify-center gap-2"
                style={{ backgroundColor: "#1e3a8a" }}
            >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Connexion en cours…" : "Se connecter"}
            </button>
        </form>
    );
}
