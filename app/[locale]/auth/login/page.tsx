import { redirect } from "next/navigation";
import { signIn, auth } from "@/auth";
import { AuthError } from "next-auth";
import { hasAnyUser } from "@/lib/auth/userStore";
import LoginForm from "./LoginSubmitButton";

type PageProps = {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ error?: string; callbackUrl?: string; lockedUntil?: string }>;
};

export default async function LoginPage({ params, searchParams }: PageProps) {
    const { locale } = await params;
    const { error, callbackUrl } = await searchParams;

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
                    <h1 className="text-2xl font-bold" style={{ color: "#1e3a8a" }}>FacturApp</h1>
                    <p className="text-sm text-muted-foreground mt-1">Connexion</p>
                </div>

                <LoginForm
                    action={loginAction}
                    errorMessage={errorMessage}
                    callbackUrl={callbackUrl || `/${locale}`}
                    locale={locale}
                />

                <p className="mt-4 text-center text-xs text-muted-foreground">
                    <a href={`/${locale}/auth/forgot`} className="underline hover:text-foreground">
                        Mot de passe oublié ?
                    </a>
                </p>
            </div>
        </div>
    );
}
