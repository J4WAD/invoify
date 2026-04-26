"use client";

export class UnauthorizedError extends Error {
    constructor() {
        super("Unauthorized");
        this.name = "UnauthorizedError";
    }
}

function getLocaleFromPath(): string {
    if (typeof window === "undefined") return "fr";
    const match = window.location.pathname.match(/^\/([a-z]{2})(?=\/|$)/);
    return match?.[1] ?? "fr";
}

function isOnAuthPage(): boolean {
    if (typeof window === "undefined") return false;
    // Strip leading locale segment (fr, en, pt-BR, …) then check for /auth/*.
    const stripped = window.location.pathname.replace(
        /^\/[a-z]{2}(?:-[A-Za-z]{2})?(?=\/|$)/,
        ""
    );
    return stripped.startsWith("/auth");
}

function redirectToLogin() {
    if (typeof window === "undefined") return;
    if (isOnAuthPage()) return; // already on an auth page — redirecting would loop
    const locale = getLocaleFromPath();
    const callbackUrl = encodeURIComponent(
        window.location.pathname + window.location.search
    );
    window.location.href = `/${locale}/auth/login?callbackUrl=${callbackUrl}`;
}

export async function apiFetch(
    input: RequestInfo | URL,
    init: RequestInit = {}
): Promise<Response> {
    const res = await fetch(input, {
        ...init,
        credentials: "include",
        cache: init.cache ?? "no-store",
    });

    if (res.status === 401) {
        redirectToLogin();
        throw new UnauthorizedError();
    }

    return res;
}
