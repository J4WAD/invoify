import { redirect } from "next/navigation";
import { signIn, auth } from "@/auth";
import { AuthError } from "next-auth";
import { hasAnyUser } from "@/lib/auth/userStore";

type PageProps = {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ error?: string; callbackUrl?: string; lockedUntil?: string }>;
};

export default async function LoginPage({ params, searchParams }: PageProps) {
    const { locale } = await params;
    const { error, callbackUrl, lockedUntil } = await searchParams;

    if (!(await hasAnyUser())) redirect(`/${locale}/auth/setup`);
    const session = await auth();
    if (session) redirect(callbackUrl || `/${locale}`);

    async function loginAction(formData: FormData) {
        "use server";
        const username = String(formData.get("username") ?? "");
        const password = String(formData.get("password") ?? "");
        const redirectTo = String(formData.get("callbackUrl") ?? `/${locale}`);
        try {
            await signIn("credentials", { username, password, redirectTo });
        } catch (e) {
            if (e instanceof AuthError) {
                const type = (e as AuthError & { type?: string }).type ?? "CredentialsSignin";
                redirect(
                    `/${locale}/auth/login?error=${type}&callbackUrl=${encodeURIComponent(redirectTo)}`
                );
            }
            throw e;
        }
    }

    let errorMessage = "";
    if (error === "AccountLocked") {
        errorMessage = "Compte verrouillé après trop de tentatives. Réessayez dans 15 minutes.";
    } else if (error) {
        errorMessage = "Identifiants invalides";
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="w-full max-w-sm bg-card border rounded-lg shadow-sm p-8">
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-bold" style={{ color: "#2563eb" }}>FacturApp</h1>
                    <p className="text-sm text-muted-foreground mt-1">Connexion</p>
                </div>

                {errorMessage && (
                    <p className="mb-4 text-sm text-destructive text-center">{errorMessage}</p>
                )}

                <form action={loginAction} className="space-y-4">
                    <input type="hidden" name="callbackUrl" value={callbackUrl || `/${locale}`} />
                    <div>
                        <label className="block text-sm font-medium mb-1">Utilisateur</label>
                        <input
                            name="username"
                            type="text"
                            required
                            autoComplete="username"
                            className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Mot de passe</label>
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
                        className="w-full py-2 rounded-md text-white font-medium text-sm"
                        style={{ backgroundColor: "#2563eb" }}
                    >
                        Se connecter
                    </button>
                </form>

                <p className="mt-4 text-center text-xs text-muted-foreground">
                    <a href={`/${locale}/auth/forgot`} className="underline hover:text-foreground">
                        Mot de passe oublié ?
                    </a>
                </p>
            </div>
        </div>
    );
}
