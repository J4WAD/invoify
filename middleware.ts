import createIntlMiddleware from "next-intl/middleware";
import NextAuth from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);
const intlMiddleware = createIntlMiddleware(routing);

const PUBLIC_PREFIXES = ["/auth", "/api/auth", "/api/health", "/setup", "/cgu", "/confidentialite", "/mentions-legales"];

const LOCALE_PREFIX_RE = new RegExp(
    `^\\/(${routing.locales.map((l) => l.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?=\\/|$)`
);

function isPublicPath(pathname: string) {
    const stripped = pathname.replace(LOCALE_PREFIX_RE, "");
    return PUBLIC_PREFIXES.some((p) => stripped.startsWith(p) || pathname.startsWith(p));
}

export default auth((req) => {
    const { pathname } = req.nextUrl;

    // API routes: use 401 instead of redirect
    if (pathname.startsWith("/api/")) {
        if (isPublicPath(pathname)) return NextResponse.next();
        if (!req.auth) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.next();
    }

    if (isPublicPath(pathname)) {
        return intlMiddleware(req as unknown as NextRequest);
    }

    if (!req.auth) {
        const url = req.nextUrl.clone();
        url.pathname = "/fr/auth/login";
        url.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(url);
    }

    return intlMiddleware(req as unknown as NextRequest);
});

export const config = {
    matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
};
