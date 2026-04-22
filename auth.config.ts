import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
    session: { strategy: "jwt" },
    pages: { signIn: "/auth/login" },
    providers: [],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                (token as any).role = (user as any).role;
                (token as any).username = user.name;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).role = (token as any).role;
                (session.user as any).username = (token as any).username;
            }
            return session;
        },
    },
};
