import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { AuthError } from "next-auth";
import { authConfig } from "@/auth.config";
import { verifyCredentials, AccountLockedError } from "@/lib/auth/userStore";
import { checkLoginRateLimit } from "@/lib/auth/ratelimit";

class AccountLockedAuthError extends AuthError {
    static type = "AccountLocked";
    retryAfter: Date;
    constructor(retryAfter: Date) {
        super("Account temporarily locked due to too many failed attempts");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this as any).type = "AccountLocked";
        this.retryAfter = retryAfter;
    }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (creds) => {
                const username = String(creds?.username ?? "").trim();
                const password = String(creds?.password ?? "");
                if (!username || !password) return null;

                // Rate limit: 5 attempts per 15 min per username
                const rl = await checkLoginRateLimit(username);
                if (!rl.success) {
                    const retryAfter = new Date(rl.reset);
                    throw new AccountLockedAuthError(retryAfter);
                }

                try {
                    const user = await verifyCredentials(username, password);
                    if (!user) return null;
                    return {
                        id: user.id,
                        name: user.username,
                        email: `${user.username}@facturapp.local`,
                        role: user.role,
                    } as { id: string; name: string; email: string; role: string };
                } catch (err) {
                    if (err instanceof AccountLockedError) {
                        throw new AccountLockedAuthError(err.retryAfter);
                    }
                    throw err;
                }
            },
        }),
    ],
});
